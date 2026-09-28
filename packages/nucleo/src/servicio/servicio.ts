/**
 * Servicio autoritativo del juego.
 *
 * Principios antitrampas:
 *  1. El navegador nunca decide puntos: envía acciones y el servicio las
 *     valida y calcula todo.
 *  2. Cada ejercicio se genera aquí con una semilla secreta; el navegador
 *     recibe solo la vista pública (sin la respuesta).
 *  3. Recargar no cambia el ejercicio: uno pendiente se reanuda igual.
 *     Abandonar un ejercicio ya visto cuenta como fallido.
 *  4. Una respuesta por ejercicio (dos en los de escribir), pesadas y
 *     pistas limitadas, tiempos mínimos y límite de ritmo.
 *  5. Una sola pestaña activa por estudiante.
 *  6. Todo cambio de puntos ocurre en una transacción que bloquea al
 *     jugador: dos clics simultáneos no pueden cobrar dos veces.
 */

import { crearAzar, textoAleatorio } from '../azar';
import { buscarEtapa, buscarIsla, type Etapa } from '../curriculo';
import { mecanica } from '../mecanicas';
import {
  BONO_ESTRELLA,
  BONO_JEFE_PRIMERA,
  BONO_JEFE_REPETIDO,
  actualizarEstadisticas,
  aplicarResultado,
  buscarArticulo,
  clasificarResultado,
  estadisticasIniciales,
  estrellasDe,
  etapaAccesible,
  factorRepeticion,
  insigniasGanadas,
  mapaDesbloqueo,
  multiplicadorRacha,
  nivelInicialPara,
  nuevaPartida,
  rangoDe,
  INSIGNIAS,
  type EstadoIsla,
  type EstadoPartida,
  type Insignia,
  type Progreso,
  type Rango,
  type Ranura,
} from '../reglas';
import type { CodigoDiagnostico, Pista, Resultado, ResultadoPesada, Solucion, TipoItem } from '../tipos';
import type { Almacen, Repositorio } from './almacen';
import { ErrorJuego } from './errores';
import { Limitador } from './limitador';
import type { Curso, ItemGuardado, Jugador, Partida, Sesion } from './modelos';
import {
  AVATARES,
  claveValida,
  hashClave,
  nuevoCodigoCurso,
  nuevoId,
  nuevoToken,
  sha256,
  textoClave,
  validarApodo,
  verificarClave,
} from './seguridad';

// ---------------------------------------------------------------------------
// Vistas (lo que se envía al navegador)
// ---------------------------------------------------------------------------

export interface VistaItem {
  id: string;
  partidaId: string;
  indice: number;
  tipo: TipoItem;
  modo: 'eleccion' | 'escrita' | 'pesada';
  nivel: number;
  consigna: string;
  voz: string;
  publico: unknown;
  maxIntentos: number;
  intentosUsados: number;
  pistas: Pista[];
  pesadas: { propuesta: number; resultado: ResultadoPesada }[];
  andamiaje: boolean;
  relacional: boolean;
  terminado: boolean;
}

export interface VistaPartida {
  id: string;
  etapaId: string;
  estado: EstadoPartida;
  metaLogros: number;
  maxItems: number;
  esJefe: boolean;
}

export interface Perfil {
  id: string;
  apodo: string;
  avatar: string;
  curso: { nombre: string; nivel: number; codigo: string };
  nivelCurso: number;
  puntos: number;
  monedas: number;
  racha: number;
  rango: { actual: Rango; siguiente: Rango | null; progreso: number };
  progreso: Progreso;
  islas: EstadoIsla[];
  insignias: string[];
  inventario: string[];
  equipado: Partial<Record<Ranura, string>>;
  estadisticas: { itemsExitosos: number; perfectos: number; mejorRacha: number; dias: number };
  partidaActiva: { id: string; etapaId: string } | null;
}

export interface FinEtapa {
  superada: boolean;
  estrellas: number;
  estrellasPrevias: number;
  bonoEstrellas: number;
  bonoJefe: number;
  puntosPartida: number;
  monedasPartida: number;
  precision: number;
  rangoAntes: Rango;
  rangoDespues: Rango;
}

export interface CierreItem {
  resultado: Resultado;
  puntos: number;
  monedas: number;
  racha: number;
  multiplicador: number;
  solucion: Solucion;
  subioNivel: boolean;
  bajoNivel: boolean;
  danoJefe: number;
  partida: VistaPartida;
  insigniasNuevas: Insignia[];
  totalPuntos: number;
  totalMonedas: number;
  fin: FinEtapa | null;
}

export interface RespuestaPesar {
  pesada: ResultadoPesada;
  pesadasUsadas: number;
  cierre: CierreItem | null;
}

export interface RespuestaResponder {
  correcto: boolean;
  mensaje: string;
  diagnostico: CodigoDiagnostico | null;
  intentosUsados: number;
  puedeReintentar: boolean;
  cierre: CierreItem | null;
}

export interface Contexto {
  jugadorId: string;
  pestana: string;
}

export interface OpcionesServicio {
  reloj?: () => number;
  /** Hash y sal de la clave docente (null = sin acceso docente). */
  claveDocente?: { hash: string; sal: string } | null;
  /** Tiempo mínimo entre que aparece un ejercicio y su primera respuesta. */
  msMinimoRespuesta?: number;
  /** Tiempo mínimo entre acciones sobre el mismo ejercicio. */
  msEntreAcciones?: number;
  duracionSesionAlumnoMs?: number;
  duracionSesionDocenteMs?: number;
  limitador?: Limitador;
  /** Iteraciones PBKDF2 (menos en pruebas para que corran rápido). */
  iteracionesClave?: number;
}

const HORA = 3_600_000;
const MAX_INTENTOS_INGRESO = 5;
const BLOQUEO_INGRESO_MS = 10 * 60_000;

const DIA_SANTIAGO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' });

export class ServicioJuego {
  private readonly reloj: () => number;
  private readonly claveDocente: { hash: string; sal: string } | null;
  private readonly msMinimo: number;
  private readonly msEntre: number;
  private readonly sesionAlumno: number;
  private readonly sesionDocente: number;
  private readonly limitador: Limitador;
  private readonly iteraciones: number | undefined;

  constructor(
    private readonly almacen: Almacen,
    opciones: OpcionesServicio = {},
  ) {
    this.reloj = opciones.reloj ?? Date.now;
    this.claveDocente = opciones.claveDocente ?? null;
    this.msMinimo = opciones.msMinimoRespuesta ?? 700;
    this.msEntre = opciones.msEntreAcciones ?? 300;
    this.sesionAlumno = opciones.duracionSesionAlumnoMs ?? 12 * HORA;
    this.sesionDocente = opciones.duracionSesionDocenteMs ?? 8 * HORA;
    this.limitador = opciones.limitador ?? new Limitador({ capacidad: 12, recargaPorSegundo: 4 });
    this.iteraciones = opciones.iteracionesClave;
  }

  // =========================================================================
  // Cuentas y sesiones
  // =========================================================================

  async crearCurso(datos: { nombre: unknown; nivel: unknown }): Promise<Curso> {
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.replace(/\s+/g, ' ').trim() : '';
    const nivel = datos.nivel;
    if (nombre.length < 2 || nombre.length > 40) throw new ErrorJuego('INVALIDO', 'El nombre del curso debe tener entre 2 y 40 caracteres.');
    if (typeof nivel !== 'number' || !Number.isInteger(nivel) || nivel < 1 || nivel > 8) throw new ErrorJuego('INVALIDO', 'El nivel debe ser de 1 a 8.');
    for (let intento = 0; intento < 20; intento++) {
      const curso: Curso = { id: nuevoId(), codigo: nuevoCodigoCurso(), nombre, nivel, creadoEn: this.reloj() };
      if (await this.almacen.obtenerCursoPorCodigo(curso.codigo)) continue;
      await this.almacen.insertarCurso(curso);
      return curso;
    }
    throw new ErrorJuego('CONFLICTO');
  }

  async listarCursos(): Promise<Curso[]> {
    return this.almacen.listarCursos();
  }

  async apodosDeCurso(codigo: unknown): Promise<{ curso: { nombre: string; nivel: number }; alumnos: { apodo: string; avatar: string }[] }> {
    const curso = await this.cursoPorCodigo(codigo);
    const jugadores = await this.almacen.listarJugadores(curso.id);
    return {
      curso: { nombre: curso.nombre, nivel: curso.nivel },
      alumnos: jugadores.map((j) => ({ apodo: j.apodo, avatar: j.avatar })).sort((a, b) => a.apodo.localeCompare(b.apodo, 'es')),
    };
  }

  async registrarAlumno(datos: { codigoCurso: unknown; apodo: unknown; avatar: unknown; clave: unknown }): Promise<{ token: string; perfil: Perfil }> {
    const curso = await this.cursoPorCodigo(datos.codigoCurso);
    const apodo = validarApodo(datos.apodo);
    if (!apodo.ok) throw new ErrorJuego('INVALIDO', apodo.motivo);
    if (typeof datos.avatar !== 'string' || !(AVATARES as readonly string[]).includes(datos.avatar)) throw new ErrorJuego('INVALIDO', 'Elige un avatar.');
    if (!claveValida(datos.clave)) throw new ErrorJuego('INVALIDO', 'La clave son 3 figuras.');
    if (await this.almacen.obtenerJugadorPorApodo(curso.id, apodo.clave)) throw new ErrorJuego('DUPLICADO');

    const { hash, sal } = await hashClave(textoClave(datos.clave), undefined, this.iteraciones);
    const ahora = this.reloj();
    const jugador: Jugador = {
      id: nuevoId(),
      cursoId: curso.id,
      apodo: apodo.apodo,
      apodoClave: apodo.clave,
      avatar: datos.avatar,
      claveHash: hash,
      claveSal: sal,
      nivelCurso: curso.nivel,
      puntos: 0,
      monedas: 0,
      racha: 0,
      progreso: {},
      estadisticas: estadisticasIniciales(),
      insignias: [],
      inventario: [],
      equipado: {},
      pestanaActiva: null,
      partidaActiva: null,
      intentosFallidos: 0,
      bloqueadoHasta: 0,
      creadoEn: ahora,
      actualizadoEn: ahora,
      version: 0,
    };
    await this.almacen.insertarJugador(jugador);
    const token = await this.crearSesion(jugador.id, false);
    return { token, perfil: await this.perfil(jugador.id) };
  }

  async ingresarAlumno(datos: { codigoCurso: unknown; apodo: unknown; clave: unknown }): Promise<{ token: string; perfil: Perfil }> {
    const curso = await this.cursoPorCodigo(datos.codigoCurso);
    const apodo = validarApodo(datos.apodo);
    if (!apodo.ok) throw new ErrorJuego('CREDENCIALES');
    const encontrado = await this.almacen.obtenerJugadorPorApodo(curso.id, apodo.clave);
    if (!encontrado) throw new ErrorJuego('CREDENCIALES');
    const ahora = this.reloj();
    if (encontrado.bloqueadoHasta > ahora) throw new ErrorJuego('BLOQUEADO');

    const ok = claveValida(datos.clave) && (await verificarClave(textoClave(datos.clave), encontrado.claveHash, encontrado.claveSal, this.iteraciones));

    await this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorBloqueado(tx, encontrado.id);
      if (ok) {
        j.intentosFallidos = 0;
      } else {
        j.intentosFallidos += 1;
        if (j.intentosFallidos >= MAX_INTENTOS_INGRESO) {
          j.intentosFallidos = 0;
          j.bloqueadoHasta = ahora + BLOQUEO_INGRESO_MS;
        }
      }
      await tx.actualizarJugador(j);
    });
    if (!ok) throw new ErrorJuego('CREDENCIALES');
    const token = await this.crearSesion(encontrado.id, false);
    return { token, perfil: await this.perfil(encontrado.id) };
  }

  async ingresarDocente(clave: unknown): Promise<{ token: string }> {
    if (!this.claveDocente || typeof clave !== 'string' || clave.length > 200) throw new ErrorJuego('CREDENCIALES');
    const ok = await verificarClave(clave, this.claveDocente.hash, this.claveDocente.sal, this.iteraciones);
    if (!ok) throw new ErrorJuego('CREDENCIALES');
    return { token: await this.crearSesion(null, true) };
  }

  async sesion(token: unknown): Promise<Sesion | null> {
    if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
    const s = await this.almacen.obtenerSesion(await sha256(token));
    if (!s) return null;
    if (s.expiraEn <= this.reloj()) {
      await this.almacen.eliminarSesion(s.tokenHash);
      return null;
    }
    return s;
  }

  async salir(token: unknown): Promise<void> {
    if (typeof token === 'string') await this.almacen.eliminarSesion(await sha256(token));
  }

  private async crearSesion(jugadorId: string | null, docente: boolean): Promise<string> {
    const token = nuevoToken();
    const ahora = this.reloj();
    await this.almacen.insertarSesion({
      tokenHash: await sha256(token),
      jugadorId,
      docente,
      creadaEn: ahora,
      expiraEn: ahora + (docente ? this.sesionDocente : this.sesionAlumno),
    });
    return token;
  }

  // =========================================================================
  // Perfil y pestaña activa
  // =========================================================================

  async perfil(jugadorId: string): Promise<Perfil> {
    const j = await this.almacen.obtenerJugador(jugadorId);
    if (!j) throw new ErrorJuego('NO_AUTENTICADO');
    const curso = await this.almacen.obtenerCurso(j.cursoId);
    let partidaActiva: Perfil['partidaActiva'] = null;
    if (j.partidaActiva) {
      const p = await this.almacen.obtenerPartida(j.partidaActiva);
      if (p && !p.cerrada) partidaActiva = { id: p.id, etapaId: p.etapaId };
    }
    return {
      id: j.id,
      apodo: j.apodo,
      avatar: j.avatar,
      curso: { nombre: curso?.nombre ?? '', nivel: curso?.nivel ?? j.nivelCurso, codigo: curso?.codigo ?? '' },
      nivelCurso: j.nivelCurso,
      puntos: j.puntos,
      monedas: j.monedas,
      racha: j.racha,
      rango: rangoDe(j.puntos),
      progreso: j.progreso,
      islas: mapaDesbloqueo(j.nivelCurso, j.progreso),
      insignias: j.insignias,
      inventario: j.inventario,
      equipado: j.equipado,
      estadisticas: {
        itemsExitosos: j.estadisticas.itemsExitosos,
        perfectos: j.estadisticas.perfectos,
        mejorRacha: j.estadisticas.mejorRacha,
        dias: j.estadisticas.dias.length,
      },
      partidaActiva,
    };
  }

  /** Una pestaña nueva toma el control; las demás quedan inactivas. */
  async tomarPestana(jugadorId: string): Promise<{ pestana: string }> {
    const pestana = textoAleatorio(12);
    await this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorBloqueado(tx, jugadorId);
      j.pestanaActiva = pestana;
      await tx.actualizarJugador(j);
    });
    return { pestana };
  }

  // =========================================================================
  // Etapas y ejercicios
  // =========================================================================

  async iniciarEtapa(ctx: Contexto, etapaId: unknown): Promise<{ partida: VistaPartida; item: VistaItem }> {
    this.limitar(ctx);
    const etapa = typeof etapaId === 'string' ? buscarEtapa(etapaId) : undefined;
    if (!etapa) throw new ErrorJuego('NO_ENCONTRADO');
    const isla = buscarIsla(etapa.isla);
    if (!isla?.disponible) throw new ErrorJuego('ETAPA_BLOQUEADA');

    return this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      if (!etapaAccesible(j.nivelCurso, j.progreso, etapa.id)) throw new ErrorJuego('ETAPA_BLOQUEADA');

      // ¿Hay una partida abierta?
      if (j.partidaActiva) {
        const abierta = await tx.obtenerPartida(j.partidaActiva);
        if (abierta && !abierta.cerrada) {
          if (abierta.etapaId === etapa.id) {
            const item = await this.itemPendienteOGenerar(tx, j, abierta, etapa);
            await tx.actualizarJugador(j);
            return { partida: this.vistaPartida(abierta, etapa), item };
          }
          await this.cerrarPorAbandono(tx, j, abierta);
        }
      }

      const previo = j.progreso[etapa.id];
      const estado = nuevaPartida(etapa, {
        nivelInicial: nivelInicialPara(etapa, j.nivelCurso, previo),
        factor: factorRepeticion(previo?.estrellas ?? 0),
      });
      const ahora = this.reloj();
      const partida: Partida = {
        id: nuevoId(),
        jugadorId: j.id,
        etapaId: etapa.id,
        estado,
        itemActual: null,
        indice: 0,
        cerrada: false,
        creadaEn: ahora,
        actualizadaEn: ahora,
        version: 0,
      };
      await tx.insertarPartida(partida);
      j.partidaActiva = partida.id;
      const item = await this.itemPendienteOGenerar(tx, j, partida, etapa);
      await tx.actualizarJugador(j);
      return { partida: this.vistaPartida(partida, etapa), item };
    });
  }

  /** Ejercicio actual de la partida: el pendiente (si existe) o uno nuevo. */
  async itemActual(ctx: Contexto, partidaId: unknown): Promise<{ partida: VistaPartida; item: VistaItem | null }> {
    this.limitar(ctx);
    return this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      const partida = await this.partidaDe(tx, j, partidaId);
      const etapa = buscarEtapa(partida.etapaId) as Etapa;
      if (partida.cerrada) return { partida: this.vistaPartida(partida, etapa), item: null };
      const item = await this.itemPendienteOGenerar(tx, j, partida, etapa);
      await tx.actualizarJugador(j);
      return { partida: this.vistaPartida(partida, etapa), item };
    });
  }

  async pista(ctx: Contexto, itemId: unknown): Promise<{ pista: Pista; pistasUsadas: number }> {
    this.limitar(ctx);
    return this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      const item = await this.itemPendiente(tx, j, itemId);
      if (item.pistas.length >= 3) throw new ErrorJuego('INVALIDO', 'Ya usaste todas las pistas.');
      const m = mecanica(item.tipo);
      const todas = m.pistas(item.publico, item.secreto);
      const pista = todas[item.pistas.length] as Pista;
      item.pistas.push(pista);
      item.ultimaAccionEn = this.reloj();
      await tx.actualizarItem(item);
      await tx.actualizarJugador(j);
      return { pista, pistasUsadas: item.pistas.length };
    });
  }

  async pesar(ctx: Contexto, itemId: unknown, propuesta: unknown): Promise<RespuestaPesar> {
    this.limitar(ctx);
    return this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      const item = await this.itemPendiente(tx, j, itemId);
      const m = mecanica(item.tipo);
      if (m.modo !== 'pesada' || !m.pesar || !m.validarPropuesta) throw new ErrorJuego('INVALIDO');
      const valor = m.validarPropuesta(propuesta, item.publico);
      if (valor === null) throw new ErrorJuego('INVALIDO');
      this.verificarTiempo(item);

      const resultado = m.pesar(item.publico, item.secreto, valor);
      const ahora = this.reloj();
      item.pesadas.push({ propuesta: valor, resultado, en: ahora });
      item.intentos += 1;
      item.ultimaAccionEn = ahora;
      if (resultado.diagnostico) item.diagnosticos.push(resultado.diagnostico);

      let cierre: CierreItem | null = null;
      if (resultado.equilibrio || item.intentos >= m.maxIntentos) {
        cierre = await this.cerrarItem(tx, j, item, resultado.equilibrio);
      } else {
        await tx.actualizarItem(item);
      }
      await tx.actualizarJugador(j);
      return { pesada: resultado, pesadasUsadas: item.intentos, cierre };
    });
  }

  async responder(ctx: Contexto, itemId: unknown, respuesta: unknown): Promise<RespuestaResponder> {
    this.limitar(ctx);
    return this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      const item = await this.itemPendiente(tx, j, itemId);
      const m = mecanica(item.tipo);
      if (m.modo === 'pesada') throw new ErrorJuego('INVALIDO');
      const r = m.validarRespuesta(respuesta, item.publico);
      if (r === null) throw new ErrorJuego('INVALIDO');
      this.verificarTiempo(item);

      const evaluacion = m.evaluar(item.publico, item.secreto, r);
      item.intentos += 1;
      item.ultimaAccionEn = this.reloj();
      if (evaluacion.diagnostico) item.diagnosticos.push(evaluacion.diagnostico);

      const puedeReintentar = !evaluacion.correcto && item.intentos < m.maxIntentos;
      let cierre: CierreItem | null = null;
      if (puedeReintentar) await tx.actualizarItem(item);
      else cierre = await this.cerrarItem(tx, j, item, evaluacion.correcto);
      await tx.actualizarJugador(j);

      return {
        correcto: evaluacion.correcto,
        // Si puede reintentar, no se revela la solución, solo la retroalimentación.
        mensaje: evaluacion.mensaje,
        diagnostico: evaluacion.diagnostico ?? null,
        intentosUsados: item.intentos,
        puedeReintentar,
        cierre,
      };
    });
  }

  async abandonar(ctx: Contexto, partidaId: unknown): Promise<Perfil> {
    this.limitar(ctx);
    await this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      const partida = await this.partidaDe(tx, j, partidaId);
      if (!partida.cerrada) await this.cerrarPorAbandono(tx, j, partida);
      await tx.actualizarJugador(j);
    });
    return this.perfil(ctx.jugadorId);
  }

  // =========================================================================
  // Tienda
  // =========================================================================

  async comprar(ctx: Contexto, articuloId: unknown): Promise<Perfil> {
    this.limitar(ctx);
    const articulo = typeof articuloId === 'string' ? buscarArticulo(articuloId) : undefined;
    if (!articulo) throw new ErrorJuego('NO_ENCONTRADO');
    await this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      if (j.inventario.includes(articulo.id)) throw new ErrorJuego('INVALIDO', 'Ya tienes ese artículo.');
      if (j.monedas < articulo.precio) throw new ErrorJuego('SIN_MONEDAS');
      j.monedas -= articulo.precio;
      j.inventario = [...j.inventario, articulo.id];
      j.equipado = { ...j.equipado, [articulo.ranura]: articulo.id };
      j.estadisticas = { ...j.estadisticas, compras: j.estadisticas.compras + 1 };
      this.otorgarInsignias(j);
      await tx.actualizarJugador(j);
    });
    return this.perfil(ctx.jugadorId);
  }

  async equipar(ctx: Contexto, ranura: unknown, articuloId: unknown): Promise<Perfil> {
    this.limitar(ctx);
    const ranuras: Ranura[] = ['cabeza', 'cara', 'cuello', 'espalda', 'balanza'];
    if (typeof ranura !== 'string' || !(ranuras as string[]).includes(ranura)) throw new ErrorJuego('INVALIDO');
    await this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorActivo(tx, ctx);
      const equipado = { ...j.equipado };
      if (articuloId === null) {
        delete equipado[ranura as Ranura];
      } else {
        const articulo = typeof articuloId === 'string' ? buscarArticulo(articuloId) : undefined;
        if (!articulo || articulo.ranura !== ranura || !j.inventario.includes(articulo.id)) throw new ErrorJuego('INVALIDO');
        equipado[articulo.ranura] = articulo.id;
      }
      j.equipado = equipado;
      await tx.actualizarJugador(j);
    });
    return this.perfil(ctx.jugadorId);
  }

  // =========================================================================
  // Ranking y panel docente
  // =========================================================================

  async ranking(jugadorId: string): Promise<{ curso: string; posiciones: { apodo: string; avatar: string; puntos: number; rango: Rango; esYo: boolean }[] }> {
    const j = await this.almacen.obtenerJugador(jugadorId);
    if (!j) throw new ErrorJuego('NO_AUTENTICADO');
    const curso = await this.almacen.obtenerCurso(j.cursoId);
    const jugadores = await this.almacen.listarJugadores(j.cursoId);
    return {
      curso: curso?.nombre ?? '',
      posiciones: jugadores
        .sort((a, b) => b.puntos - a.puntos || a.creadoEn - b.creadoEn)
        .map((x) => ({ apodo: x.apodo, avatar: x.avatar, puntos: x.puntos, rango: rangoDe(x.puntos).actual, esYo: x.id === j.id })),
    };
  }

  async resumenCurso(cursoId: unknown) {
    const curso = typeof cursoId === 'string' ? await this.almacen.obtenerCurso(cursoId) : null;
    if (!curso) throw new ErrorJuego('NO_ENCONTRADO');
    const jugadores = await this.almacen.listarJugadores(curso.id);
    const eventos = await this.almacen.listarEventos(curso.id);
    const diagnosticos: Record<string, number> = {};
    for (const e of eventos) if (e.diagnostico && e.diagnostico !== 'generico') diagnosticos[e.diagnostico] = (diagnosticos[e.diagnostico] ?? 0) + 1;
    return {
      curso,
      alumnos: jugadores.map((j) => ({
        id: j.id,
        apodo: j.apodo,
        avatar: j.avatar,
        puntos: j.puntos,
        rango: rangoDe(j.puntos).actual.nombre,
        itemsExitosos: j.estadisticas.itemsExitosos,
        itemsTotales: j.estadisticas.itemsTotales,
        pistas: j.estadisticas.pistasUsadas,
        dias: j.estadisticas.dias.length,
        progreso: j.progreso,
        bloqueado: j.bloqueadoHasta > this.reloj(),
      })),
      erroresFrecuentes: Object.entries(diagnosticos)
        .sort((a, b) => b[1] - a[1])
        .map(([codigo, veces]) => ({ codigo, veces })),
      totalEventos: eventos.length,
    };
  }

  async eventosCSV(cursoId: unknown): Promise<string> {
    const curso = typeof cursoId === 'string' ? await this.almacen.obtenerCurso(cursoId) : null;
    if (!curso) throw new ErrorJuego('NO_ENCONTRADO');
    const jugadores = new Map((await this.almacen.listarJugadores(curso.id)).map((j) => [j.id, j.apodo]));
    const eventos = await this.almacen.listarEventos(curso.id);
    const escapar = (v: unknown) => {
      const s = String(v ?? '');
      // Evita inyección de fórmulas al abrir el CSV en Excel.
      const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return /[",\n;]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
    };
    const cabecera = ['fecha', 'apodo', 'etapa', 'tipo', 'nivel', 'resultado', 'intentos', 'pistas', 'diagnostico', 'relacional', 'andamiaje', 'segundos', 'puntos'];
    const filas = eventos.map((e) =>
      [
        new Date(e.fecha).toISOString(),
        jugadores.get(e.jugadorId) ?? '(eliminado)',
        e.etapaId,
        e.tipoItem,
        e.nivel,
        e.resultado,
        e.intentos,
        e.pistas,
        e.diagnostico ?? '',
        e.relacional ? 1 : 0,
        e.andamiaje ? 1 : 0,
        (e.ms / 1000).toFixed(1),
        e.puntos,
      ]
        .map(escapar)
        .join(','),
    );
    return [cabecera.join(','), ...filas].join('\n') + '\n';
  }

  async restablecerClave(jugadorId: unknown, clave: unknown): Promise<void> {
    if (typeof jugadorId !== 'string') throw new ErrorJuego('NO_ENCONTRADO');
    if (!claveValida(clave)) throw new ErrorJuego('INVALIDO', 'La clave son 3 figuras.');
    const { hash, sal } = await hashClave(textoClave(clave), undefined, this.iteraciones);
    await this.almacen.transaccion(async (tx) => {
      const j = await this.jugadorBloqueado(tx, jugadorId);
      j.claveHash = hash;
      j.claveSal = sal;
      j.intentosFallidos = 0;
      j.bloqueadoHasta = 0;
      await tx.actualizarJugador(j);
      await tx.eliminarSesionesDeJugador(j.id);
    });
  }

  async eliminarJugador(jugadorId: unknown): Promise<void> {
    if (typeof jugadorId !== 'string') throw new ErrorJuego('NO_ENCONTRADO');
    await this.almacen.transaccion(async (tx) => {
      await this.jugadorBloqueado(tx, jugadorId);
      await tx.eliminarSesionesDeJugador(jugadorId);
      await tx.eliminarJugador(jugadorId);
    });
  }

  // =========================================================================
  // Internos
  // =========================================================================

  private limitar(ctx: Contexto): void {
    if (!this.limitador.permitir(ctx.jugadorId, this.reloj())) throw new ErrorJuego('LIMITE');
  }

  private async cursoPorCodigo(codigo: unknown): Promise<Curso> {
    if (typeof codigo !== 'string') throw new ErrorJuego('NO_ENCONTRADO', 'No existe un curso con ese código.');
    const limpio = codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpio.length < 4 || limpio.length > 12) throw new ErrorJuego('NO_ENCONTRADO', 'No existe un curso con ese código.');
    const curso = await this.almacen.obtenerCursoPorCodigo(limpio);
    if (!curso) throw new ErrorJuego('NO_ENCONTRADO', 'No existe un curso con ese código.');
    return curso;
  }

  private async jugadorBloqueado(tx: Repositorio, id: string): Promise<Jugador> {
    const j = await tx.obtenerJugador(id, { bloquear: true });
    if (!j) throw new ErrorJuego('NO_AUTENTICADO');
    return j;
  }

  private async jugadorActivo(tx: Repositorio, ctx: Contexto): Promise<Jugador> {
    const j = await this.jugadorBloqueado(tx, ctx.jugadorId);
    if (!j.pestanaActiva || j.pestanaActiva !== ctx.pestana) throw new ErrorJuego('OTRA_PESTANA');
    j.actualizadoEn = this.reloj();
    return j;
  }

  private async partidaDe(tx: Repositorio, j: Jugador, partidaId: unknown): Promise<Partida> {
    const p = typeof partidaId === 'string' ? await tx.obtenerPartida(partidaId) : null;
    if (!p || p.jugadorId !== j.id) throw new ErrorJuego('NO_ENCONTRADO');
    return p;
  }

  private async itemPendiente(tx: Repositorio, j: Jugador, itemId: unknown): Promise<ItemGuardado> {
    const item = typeof itemId === 'string' ? await tx.obtenerItem(itemId) : null;
    if (!item || item.jugadorId !== j.id) throw new ErrorJuego('NO_ENCONTRADO');
    if (item.terminado) throw new ErrorJuego('ITEM_TERMINADO');
    const partida = await tx.obtenerPartida(item.partidaId);
    if (!partida || partida.cerrada || partida.itemActual !== item.id || j.partidaActiva !== partida.id) throw new ErrorJuego('ITEM_TERMINADO');
    return item;
  }

  private verificarTiempo(item: ItemGuardado): void {
    const ahora = this.reloj();
    const primera = item.intentos === 0;
    if (primera && ahora - item.emitidoEn < this.msMinimo) throw new ErrorJuego('DEMASIADO_RAPIDO');
    if (!primera && ahora - item.ultimaAccionEn < this.msEntre) throw new ErrorJuego('DEMASIADO_RAPIDO');
  }

  private async itemPendienteOGenerar(tx: Repositorio, j: Jugador, partida: Partida, etapa: Etapa): Promise<VistaItem> {
    if (partida.itemActual) {
      const actual = await tx.obtenerItem(partida.itemActual);
      if (actual && !actual.terminado) return this.vistaItem(actual);
    }
    if (partida.estado.terminada) throw new ErrorJuego('ITEM_TERMINADO');

    const semilla = textoAleatorio(16);
    const azar = crearAzar(semilla);
    const generado = etapa.generar(partida.estado.nivel, azar, {
      isla: etapa.isla,
      andamiaje: partida.estado.andamiaje,
      ...(partida.estado.anterior ? { anterior: partida.estado.anterior } : {}),
    });
    const ahora = this.reloj();
    const item: ItemGuardado = {
      id: nuevoId(),
      partidaId: partida.id,
      jugadorId: j.id,
      indice: partida.indice + 1,
      tipo: generado.tipo,
      nivel: generado.nivel,
      consigna: generado.consigna,
      voz: generado.voz,
      publico: generado.publico,
      secreto: generado.secreto,
      relacional: generado.relacional === true,
      andamiaje: partida.estado.andamiaje,
      semilla,
      emitidoEn: ahora,
      ultimaAccionEn: ahora,
      intentos: 0,
      pesadas: [],
      pistas: [],
      diagnosticos: [],
      terminado: false,
      resultado: null,
      puntos: 0,
      terminadoEn: null,
      version: 0,
    };
    await tx.insertarItem(item);
    partida.itemActual = item.id;
    partida.indice = item.indice;
    partida.actualizadaEn = ahora;
    await tx.actualizarPartida(partida);
    return this.vistaItem(item);
  }

  /** Termina un ejercicio: puntos, racha, adaptatividad, insignias y fin de etapa. */
  private async cerrarItem(tx: Repositorio, j: Jugador, item: ItemGuardado, correcto: boolean): Promise<CierreItem> {
    const partida = (await tx.obtenerPartida(item.partidaId)) as Partida;
    const etapa = buscarEtapa(partida.etapaId) as Etapa;
    const m = mecanica(item.tipo);
    const ahora = this.reloj();

    const resultado = clasificarResultado({
      modo: m.modo,
      correcto,
      intentos: item.intentos,
      pistas: item.pistas.length,
      andamiaje: item.andamiaje,
    });
    const efecto = aplicarResultado(partida.estado, etapa, { resultado, nivel: item.nivel, pistas: item.pistas.length, tipo: item.tipo }, j.racha);

    item.terminado = true;
    item.resultado = resultado;
    item.puntos = efecto.puntos;
    item.terminadoEn = ahora;
    await tx.actualizarItem(item);

    const rangoAntes = rangoDe(j.puntos).actual;
    j.racha = efecto.racha;
    j.puntos += efecto.puntos;
    j.monedas += efecto.monedas;
    j.estadisticas = actualizarEstadisticas(
      j.estadisticas,
      { tipo: item.tipo, resultado, relacional: item.relacional, pistas: item.pistas.length },
      efecto.racha,
      DIA_SANTIAGO.format(new Date(ahora)),
    );

    partida.estado = efecto.estado;
    partida.actualizadaEn = ahora;

    let fin: FinEtapa | null = null;
    if (efecto.estado.terminada) fin = this.finalizarEtapa(j, partida, etapa, rangoAntes);
    await tx.actualizarPartida(partida);

    const insigniasNuevas = this.otorgarInsignias(j);

    await tx.registrarEvento({
      jugadorId: j.id,
      cursoId: j.cursoId,
      etapaId: etapa.id,
      tipoItem: item.tipo,
      nivel: item.nivel,
      resultado,
      intentos: item.intentos,
      pistas: item.pistas.length,
      diagnostico: item.diagnosticos[0] ?? null,
      relacional: item.relacional,
      andamiaje: item.andamiaje,
      ms: ahora - item.emitidoEn,
      puntos: efecto.puntos,
      fecha: ahora,
    });

    if (fin) fin.rangoDespues = rangoDe(j.puntos).actual;

    return {
      resultado,
      puntos: efecto.puntos,
      monedas: efecto.monedas,
      racha: efecto.racha,
      multiplicador: efecto.estado.factor >= 1 ? multiplicadorRacha(efecto.racha) : 1,
      solucion: m.solucion(item.publico, item.secreto),
      subioNivel: efecto.subioNivel,
      bajoNivel: efecto.bajoNivel,
      danoJefe: efecto.danoJefe,
      partida: this.vistaPartida(partida, etapa),
      insigniasNuevas,
      totalPuntos: j.puntos,
      totalMonedas: j.monedas,
      fin,
    };
  }

  private finalizarEtapa(j: Jugador, partida: Partida, etapa: Etapa, rangoAntes: Rango): FinEtapa {
    const e = partida.estado;
    partida.cerrada = true;
    partida.itemActual = null;
    if (j.partidaActiva === partida.id) j.partidaActiva = null;

    const previo = j.progreso[etapa.id];
    const estrellasPrevias = previo?.estrellas ?? 0;
    const estrellas = estrellasDe(e, etapa);
    let bonoEstrellas = 0;
    let bonoJefe = 0;
    if (e.superada) {
      bonoEstrellas = BONO_ESTRELLA * Math.max(0, estrellas - estrellasPrevias);
      if (etapa.esJefe) bonoJefe = previo?.superada ? BONO_JEFE_REPETIDO : BONO_JEFE_PRIMERA;
      if (e.pistas === 0) j.estadisticas = { ...j.estadisticas, etapasSinPistas: j.estadisticas.etapasSinPistas + 1 };
    }
    const bono = bonoEstrellas + bonoJefe;
    j.puntos += bono;
    j.monedas += Math.floor(bono / 10);

    j.progreso = {
      ...j.progreso,
      [etapa.id]: {
        estrellas: Math.max(estrellasPrevias, estrellas),
        mejorPuntaje: Math.max(previo?.mejorPuntaje ?? 0, e.puntos + bono),
        superada: (previo?.superada ?? false) || e.superada,
        veces: (previo?.veces ?? 0) + 1,
        nivelMax: Math.max(previo?.nivelMax ?? 0, e.nivelMaxAlcanzado),
      },
    };

    return {
      superada: e.superada,
      estrellas,
      estrellasPrevias,
      bonoEstrellas,
      bonoJefe,
      puntosPartida: e.puntos + bono,
      monedasPartida: e.monedas + Math.floor(bono / 10),
      precision: e.intentos > 0 ? e.logros / e.intentos : 0,
      rangoAntes,
      rangoDespues: rangoAntes,
    };
  }

  /** Salir de una partida con un ejercicio visto cuenta como fallido (no se puede "rerolear"). */
  private async cerrarPorAbandono(tx: Repositorio, j: Jugador, partida: Partida): Promise<void> {
    if (partida.itemActual) {
      const item = await tx.obtenerItem(partida.itemActual);
      if (item && !item.terminado) {
        await this.cerrarItem(tx, j, item, false);
        const actualizada = await tx.obtenerPartida(partida.id);
        if (actualizada) Object.assign(partida, actualizada);
      }
    }
    if (!partida.cerrada) {
      partida.cerrada = true;
      partida.itemActual = null;
      partida.actualizadaEn = this.reloj();
      await tx.actualizarPartida(partida);
      const etapa = buscarEtapa(partida.etapaId);
      if (etapa) {
        const previo = j.progreso[etapa.id];
        j.progreso = {
          ...j.progreso,
          [etapa.id]: {
            estrellas: previo?.estrellas ?? 0,
            mejorPuntaje: previo?.mejorPuntaje ?? 0,
            superada: previo?.superada ?? false,
            veces: (previo?.veces ?? 0) + 1,
            nivelMax: Math.max(previo?.nivelMax ?? 0, partida.estado.nivelMaxAlcanzado),
          },
        };
      }
    }
    if (j.partidaActiva === partida.id) j.partidaActiva = null;
  }

  private otorgarInsignias(j: Jugador): Insignia[] {
    const nuevas = insigniasGanadas(j.estadisticas, j.progreso, j.insignias);
    if (nuevas.length > 0) {
      j.insignias = [...j.insignias, ...nuevas.map((i) => i.id)];
      j.monedas += nuevas.reduce((s, i) => s + i.monedas, 0);
    }
    return nuevas;
  }

  private vistaItem(i: ItemGuardado): VistaItem {
    const m = mecanica(i.tipo);
    return {
      id: i.id,
      partidaId: i.partidaId,
      indice: i.indice,
      tipo: i.tipo,
      modo: m.modo,
      nivel: i.nivel,
      consigna: i.consigna,
      voz: i.voz,
      publico: i.publico,
      maxIntentos: m.maxIntentos,
      intentosUsados: i.intentos,
      pistas: i.pistas,
      pesadas: i.pesadas.map((p) => ({ propuesta: p.propuesta, resultado: p.resultado })),
      andamiaje: i.andamiaje,
      relacional: i.relacional,
      terminado: i.terminado,
    };
  }

  private vistaPartida(p: Partida, etapa: Etapa): VistaPartida {
    return { id: p.id, etapaId: p.etapaId, estado: p.estado, metaLogros: etapa.metaLogros, maxItems: etapa.maxItems, esJefe: etapa.esJefe };
  }
}

export { INSIGNIAS };
