/**
 * Modo práctica: el mismo servicio del servidor, ejecutándose en el navegador.
 * Sirve para probar el juego sin cuenta y para la demo publicada en GitHub.
 * El progreso se guarda solo en este dispositivo (si el navegador lo permite).
 */

import { AlmacenMemoria, ErrorJuego, ServicioJuego, sugerirApodos, type Instantanea, type Perfil, type Ranura } from '@balanza/nucleo';
import { ErrorApi, type Backend } from './backend';

const CLAVE_ALMACEN = 'balanza-magica:practica:v1';
const CLAVE_JUGADOR = 'balanza-magica:practica:jugador';
const CLAVE_FIJA = ['gato', 'gato', 'gato'];

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento disponible: el progreso vive solo en memoria.
  }
}

/** Mantiene el guardado pequeño: solo lo necesario para continuar. */
function podar(x: Instantanea): Instantanea {
  const abiertas = new Set(x.partidas.filter((p) => !p.cerrada).map((p) => p.id));
  return {
    ...x,
    partidas: x.partidas.filter((p) => abiertas.has(p.id)),
    items: x.items.filter((i) => abiertas.has(i.partidaId) && !i.terminado),
    eventos: x.eventos.slice(-300),
  };
}

async function traducir<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ErrorJuego) throw new ErrorApi(e.codigo, e.message, e.estado);
    throw e;
  }
}

export class BackendLocal implements Backend {
  readonly modo = 'practica' as const;
  private readonly almacen: AlmacenMemoria;
  private readonly servicio: ServicioJuego;
  private jugadorId: string | null = leer(CLAVE_JUGADOR);
  private pestana = '';

  constructor() {
    let inicial: Instantanea | undefined;
    const guardado = leer(CLAVE_ALMACEN);
    if (guardado) {
      try {
        inicial = JSON.parse(guardado) as Instantanea;
      } catch {
        inicial = undefined;
      }
    }
    this.almacen = new AlmacenMemoria(inicial);
    this.almacen.alCambiar = () => escribir(CLAVE_ALMACEN, JSON.stringify(podar(this.almacen.exportar())));
    this.servicio = new ServicioJuego(this.almacen, { iteracionesClave: 1000, msMinimoRespuesta: 600 });
  }

  private ctx() {
    if (!this.jugadorId) throw new ErrorApi('NO_AUTENTICADO', 'Necesitas entrar al juego primero.', 401);
    return { jugadorId: this.jugadorId, pestana: this.pestana };
  }

  async yo(): Promise<Perfil | null> {
    if (!this.jugadorId) return null;
    try {
      return await this.servicio.perfil(this.jugadorId);
    } catch {
      this.jugadorId = null;
      escribir(CLAVE_JUGADOR, null);
      return null;
    }
  }

  async tomarPestana() {
    const { pestana } = await traducir(this.servicio.tomarPestana(this.ctx().jugadorId));
    this.pestana = pestana;
  }

  async sugerirApodos() {
    return sugerirApodos(6);
  }

  async curso() {
    return { curso: { nombre: 'Modo práctica', nivel: 1 }, alumnos: [] };
  }

  /** En modo práctica el "código de curso" es el nivel elegido (1 a 8). */
  async registrar(datos: { codigoCurso: string; apodo: string; avatar: string }) {
    const nivel = Math.min(8, Math.max(1, Number(datos.codigoCurso) || 1));
    const curso = await traducir(this.servicio.crearCurso({ nombre: `Práctica ${nivel}° básico`, nivel }));
    const { perfil } = await traducir(
      this.servicio.registrarAlumno({ codigoCurso: curso.codigo, apodo: datos.apodo, avatar: datos.avatar, clave: CLAVE_FIJA }),
    );
    this.jugadorId = perfil.id;
    escribir(CLAVE_JUGADOR, perfil.id);
    return perfil;
  }

  async ingresar(): Promise<Perfil> {
    throw new ErrorApi('PROHIBIDO', 'En modo práctica no hay cuentas.');
  }

  async salir() {
    this.jugadorId = null;
    escribir(CLAVE_JUGADOR, null);
    escribir(CLAVE_ALMACEN, null);
  }

  iniciarEtapa(etapaId: string) {
    return traducir(this.servicio.iniciarEtapa(this.ctx(), etapaId));
  }
  itemActual(partidaId: string) {
    return traducir(this.servicio.itemActual(this.ctx(), partidaId));
  }
  pista(itemId: string) {
    return traducir(this.servicio.pista(this.ctx(), itemId));
  }
  pesar(itemId: string, propuesta: number) {
    return traducir(this.servicio.pesar(this.ctx(), itemId, propuesta));
  }
  responder(itemId: string, respuesta: unknown) {
    return traducir(this.servicio.responder(this.ctx(), itemId, respuesta));
  }
  abandonar(partidaId: string) {
    return traducir(this.servicio.abandonar(this.ctx(), partidaId));
  }
  comprar(articuloId: string) {
    return traducir(this.servicio.comprar(this.ctx(), articuloId));
  }
  equipar(ranura: Ranura, articuloId: string | null) {
    return traducir(this.servicio.equipar(this.ctx(), ranura, articuloId));
  }
  ranking() {
    return traducir(this.servicio.ranking(this.ctx().jugadorId));
  }

  private soloClase(): never {
    throw new ErrorApi('PROHIBIDO', 'El panel docente funciona con el servidor del colegio.');
  }
  docenteIngresar = async () => this.soloClase();
  docenteCursos = async () => this.soloClase();
  docenteCrearCurso = async () => this.soloClase();
  docenteResumen = async () => this.soloClase();
  docenteUrlCsv = () => '';
  docenteRestablecerClave = async () => this.soloClase();
  docenteEliminar = async () => this.soloClase();
}
