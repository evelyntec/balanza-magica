/**
 * Reglas del juego: resultados, puntos, rachas, adaptatividad, estrellas,
 * rangos, insignias, tienda y desbloqueo de islas.
 *
 * Todo es puro y determinista: el servidor es quien lo aplica, así que el
 * navegador nunca decide cuántos puntos se ganan.
 */

import { ETAPAS, ISLAS, buscarEtapa, etapasDeIsla, type Etapa } from './curriculo';
import type { ModoRespuesta } from './mecanicas';
import type { Resultado, TipoItem } from './tipos';

// ---------------------------------------------------------------------------
// Resultado de un ejercicio
// ---------------------------------------------------------------------------

const ORDEN: Resultado[] = ['perfecto', 'logrado', 'con_ayuda', 'fallido'];

const peor = (a: Resultado, b: Resultado): Resultado => (ORDEN.indexOf(a) >= ORDEN.indexOf(b) ? a : b);

export const esExito = (r: Resultado): boolean => r === 'perfecto' || r === 'logrado';

export interface DatosResultado {
  modo: ModoRespuesta;
  correcto: boolean;
  /** Intentos usados (en modo pesada: pesadas usadas, incluida la exitosa). */
  intentos: number;
  pistas: number;
  andamiaje: boolean;
}

export function clasificarResultado(d: DatosResultado): Resultado {
  if (!d.correcto) return 'fallido';
  let r: Resultado;
  if (d.modo === 'pesada') r = d.intentos <= 1 ? 'perfecto' : d.intentos === 2 ? 'logrado' : 'con_ayuda';
  else r = d.intentos <= 1 ? 'perfecto' : 'con_ayuda';
  if (d.pistas === 1) r = peor(r, 'logrado');
  if (d.pistas >= 2) r = peor(r, 'con_ayuda');
  if (d.andamiaje) r = peor(r, 'logrado');
  return r;
}

// ---------------------------------------------------------------------------
// Puntos, monedas y rachas
// ---------------------------------------------------------------------------

export const CALIDAD: Record<Resultado, number> = { perfecto: 1, logrado: 0.6, con_ayuda: 0.25, fallido: 0 };
const MONEDAS_ITEM: Record<Resultado, number> = { perfecto: 2, logrado: 1, con_ayuda: 0, fallido: 0 };

export function multiplicadorRacha(racha: number): number {
  if (racha >= 10) return 3;
  if (racha >= 5) return 2;
  if (racha >= 3) return 1.5;
  return 1;
}

/** Repetir una etapa ya superada da menos puntos (evita "farmear"). */
export function factorRepeticion(estrellasPrevias: number): number {
  if (estrellasPrevias >= 3) return 0.2;
  if (estrellasPrevias >= 1) return 0.5;
  return 1;
}

export function nuevaRacha(rachaAnterior: number, resultado: Resultado): number {
  return esExito(resultado) ? rachaAnterior + 1 : 0;
}

export function puntosItem(nivel: number, resultado: Resultado, racha: number, factor: number): { puntos: number; monedas: number } {
  const base = 10 * nivel;
  // En repeticiones la racha no multiplica: así no conviene "farmear" etapas dominadas.
  const multiplicador = factor >= 1 ? multiplicadorRacha(racha) : 1;
  const puntos = Math.round(base * CALIDAD[resultado] * multiplicador * factor);
  const monedas = Math.floor(MONEDAS_ITEM[resultado] * (factor >= 1 ? 1 : factor >= 0.5 ? 0.5 : 0));
  return { puntos, monedas };
}

export const BONO_ESTRELLA = 50;
export const BONO_JEFE_PRIMERA = 300;
export const BONO_JEFE_REPETIDO = 60;

// ---------------------------------------------------------------------------
// Partida (una pasada por una etapa)
// ---------------------------------------------------------------------------

export interface EstadoPartida {
  etapaId: string;
  nivel: number;
  exitosSeguidos: number;
  fallosSeguidos: number;
  logros: number;
  intentos: number;
  perfectos: number;
  pistas: number;
  nivelMaxAlcanzado: number;
  puntos: number;
  monedas: number;
  andamiaje: boolean;
  vidaJefe: number | null;
  vidaJefeMax: number | null;
  terminada: boolean;
  superada: boolean;
  anterior: TipoItem | null;
  factor: number;
}

export const NIVEL_MIN_JEFE = 2;

export function nuevaPartida(etapa: Etapa, opciones: { nivelInicial?: number; factor: number }): EstadoPartida {
  const isla = ISLAS.find((i) => i.numero === etapa.isla);
  const nivel = Math.min(Math.max(opciones.nivelInicial ?? etapa.nivelInicial, 1), etapa.nivelMaximo);
  return {
    etapaId: etapa.id,
    nivel,
    exitosSeguidos: 0,
    fallosSeguidos: 0,
    logros: 0,
    intentos: 0,
    perfectos: 0,
    pistas: 0,
    nivelMaxAlcanzado: nivel,
    puntos: 0,
    monedas: 0,
    andamiaje: false,
    vidaJefe: etapa.esJefe ? (isla?.jefe.vida ?? 10) : null,
    vidaJefeMax: etapa.esJefe ? (isla?.jefe.vida ?? 10) : null,
    terminada: false,
    superada: false,
    anterior: null,
    factor: opciones.factor,
  };
}

export interface EfectoItem {
  estado: EstadoPartida;
  puntos: number;
  monedas: number;
  racha: number;
  subioNivel: boolean;
  bajoNivel: boolean;
  danoJefe: number;
}

/** Aplica el resultado de un ejercicio a la partida (adaptatividad incluida). */
export function aplicarResultado(
  anterior: EstadoPartida,
  etapa: Etapa,
  item: { resultado: Resultado; nivel: number; pistas: number; tipo: TipoItem },
  rachaAnterior: number,
): EfectoItem {
  const e: EstadoPartida = { ...anterior };
  const exito = esExito(item.resultado);
  const racha = nuevaRacha(rachaAnterior, item.resultado);
  const { puntos, monedas } = puntosItem(item.nivel, item.resultado, racha, e.factor);

  e.intentos += 1;
  e.pistas += item.pistas;
  e.puntos += puntos;
  e.monedas += monedas;
  e.anterior = item.tipo;
  if (item.resultado === 'perfecto') e.perfectos += 1;

  let subioNivel = false;
  let bajoNivel = false;
  const nivelMin = etapa.esJefe ? NIVEL_MIN_JEFE : 1;

  if (exito) {
    e.logros += 1;
    e.exitosSeguidos += 1;
    e.fallosSeguidos = 0;
    e.andamiaje = false;
    if (e.exitosSeguidos >= 2 && e.nivel < etapa.nivelMaximo) {
      e.nivel += 1;
      e.exitosSeguidos = 0;
      subioNivel = true;
    }
  } else if (item.resultado === 'con_ayuda') {
    e.exitosSeguidos = 0;
    e.andamiaje = false;
  } else {
    e.exitosSeguidos = 0;
    e.fallosSeguidos += 1;
    if (e.fallosSeguidos >= 2) {
      e.fallosSeguidos = 0;
      e.andamiaje = true;
      if (e.nivel > nivelMin) {
        e.nivel -= 1;
        bajoNivel = true;
      }
    }
  }
  e.nivelMaxAlcanzado = Math.max(e.nivelMaxAlcanzado, e.nivel);

  let danoJefe = 0;
  if (e.vidaJefe !== null && e.vidaJefeMax !== null) {
    if (item.resultado === 'perfecto') danoJefe = 2;
    else if (item.resultado === 'logrado') danoJefe = 1;
    else if (item.resultado === 'fallido') danoJefe = -1;
    e.vidaJefe = Math.min(e.vidaJefeMax, Math.max(0, e.vidaJefe - danoJefe));
    if (e.vidaJefe <= 0) {
      e.terminada = true;
      e.superada = true;
    }
  } else if (e.logros >= etapa.metaLogros) {
    e.terminada = true;
    e.superada = true;
  }
  if (!e.terminada && e.intentos >= etapa.maxItems) e.terminada = true;

  return { estado: e, puntos, monedas, racha, subioNivel, bajoNivel, danoJefe };
}

export function estrellasDe(e: EstadoPartida, etapa: Etapa): 0 | 1 | 2 | 3 {
  if (!e.superada || e.intentos === 0) return 0;
  const precision = e.logros / e.intentos;
  if (etapa.esJefe) {
    if (precision >= 0.85 && e.pistas === 0) return 3;
    return precision >= 0.65 ? 2 : 1;
  }
  if (precision >= 0.85 && e.pistas <= 1 && e.nivelMaxAlcanzado >= 4) return 3;
  return precision >= 0.65 ? 2 : 1;
}

// ---------------------------------------------------------------------------
// Rangos
// ---------------------------------------------------------------------------

export interface Rango {
  id: string;
  nombre: string;
  desde: number;
  icono: string;
}

export const RANGOS: Rango[] = [
  { id: 'aprendiz', nombre: 'Aprendiz', desde: 0, icono: '🌱' },
  { id: 'explorador', nombre: 'Explorador/a', desde: 500, icono: '🧭' },
  { id: 'guardian', nombre: 'Guardián/a', desde: 2000, icono: '🛡️' },
  { id: 'maestro', nombre: 'Maestro/a del Equilibrio', desde: 6000, icono: '⚖️' },
  { id: 'leyenda', nombre: 'Leyenda', desde: 15000, icono: '👑' },
];

export function rangoDe(puntos: number): { actual: Rango; siguiente: Rango | null; progreso: number } {
  let i = 0;
  while (i + 1 < RANGOS.length && puntos >= (RANGOS[i + 1] as Rango).desde) i++;
  const actual = RANGOS[i] as Rango;
  const siguiente = RANGOS[i + 1] ?? null;
  const progreso = siguiente ? (puntos - actual.desde) / (siguiente.desde - actual.desde) : 1;
  return { actual, siguiente, progreso: Math.max(0, Math.min(1, progreso)) };
}

// ---------------------------------------------------------------------------
// Progreso, estadísticas e insignias
// ---------------------------------------------------------------------------

export interface ProgresoEtapa {
  estrellas: number;
  mejorPuntaje: number;
  superada: boolean;
  veces: number;
  nivelMax: number;
}

export type Progreso = Record<string, ProgresoEtapa>;

export interface Estadisticas {
  itemsExitosos: number;
  itemsTotales: number;
  perfectos: number;
  mejorRacha: number;
  equilibriosPerfectosSeguidos: number;
  patronesPerfectos: number;
  relacionalesSeguidos: number;
  etapasSinPistas: number;
  pistasUsadas: number;
  dias: string[];
  compras: number;
  /** Problemas con historia resueltos seguidos (insignia "Nadie me engaña"). */
  cuentosSeguidos?: number;
}

export const estadisticasIniciales = (): Estadisticas => ({
  itemsExitosos: 0,
  itemsTotales: 0,
  perfectos: 0,
  mejorRacha: 0,
  equilibriosPerfectosSeguidos: 0,
  patronesPerfectos: 0,
  relacionalesSeguidos: 0,
  etapasSinPistas: 0,
  pistasUsadas: 0,
  dias: [],
  compras: 0,
});

export function actualizarEstadisticas(
  s: Estadisticas,
  item: { tipo: TipoItem; resultado: Resultado; relacional: boolean; pistas: number },
  racha: number,
  dia: string,
): Estadisticas {
  const n = { ...s, dias: [...s.dias] };
  n.itemsTotales += 1;
  n.pistasUsadas += item.pistas;
  if (esExito(item.resultado)) n.itemsExitosos += 1;
  if (item.resultado === 'perfecto') n.perfectos += 1;
  n.mejorRacha = Math.max(n.mejorRacha, racha);
  if (item.tipo === 'equilibrar') n.equilibriosPerfectosSeguidos = item.resultado === 'perfecto' ? n.equilibriosPerfectosSeguidos + 1 : 0;
  if ((item.tipo === 'patron_figuras' || item.tipo === 'patron_numerico') && item.resultado === 'perfecto') n.patronesPerfectos += 1;
  if (item.relacional) n.relacionalesSeguidos = esExito(item.resultado) ? n.relacionalesSeguidos + 1 : 0;
  if (item.tipo === 'problema') n.cuentosSeguidos = esExito(item.resultado) ? (n.cuentosSeguidos ?? 0) + 1 : 0;
  if (!n.dias.includes(dia)) n.dias = [...n.dias, dia].slice(-60);
  return n;
}

export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  monedas: number;
}

export const INSIGNIAS: Insignia[] = [
  { id: 'primer_paso', nombre: 'Primer equilibrio', descripcion: 'Resolviste tu primer desafío.', icono: '🌟', monedas: 10 },
  { id: 'racha_5', nombre: 'Racha de fuego', descripcion: '5 desafíos seguidos bien resueltos.', icono: '🔥', monedas: 15 },
  { id: 'racha_10', nombre: 'Imparable', descripcion: '10 desafíos seguidos bien resueltos.', icono: '🚀', monedas: 30 },
  { id: 'racha_20', nombre: 'Leyenda de la racha', descripcion: '20 desafíos seguidos bien resueltos.', icono: '☄️', monedas: 60 },
  { id: 'equilibrio_perfecto', nombre: 'Equilibrio perfecto', descripcion: '5 cajas seguidas equilibradas con una sola pesada.', icono: '⚖️', monedas: 40 },
  { id: 'ojo_de_patron', nombre: 'Ojo de patrón', descripcion: '15 patrones perfectos.', icono: '🔎', monedas: 30 },
  { id: 'mente_relacional', nombre: 'Mente relacional', descripcion: '5 desafíos de "piensa sin calcular" seguidos.', icono: '🧠', monedas: 40 },
  { id: 'sin_pistas', nombre: 'Cero pistas', descripcion: 'Superaste una etapa sin usar pistas.', icono: '🎯', monedas: 20 },
  { id: 'tres_estrellas', nombre: 'Tres estrellas', descripcion: 'Conseguiste 3 estrellas en una etapa.', icono: '⭐', monedas: 20 },
  { id: 'isla_1_dorada', nombre: 'Pradera dorada', descripcion: '3 estrellas en todas las etapas de la Pradera.', icono: '🍎', monedas: 100 },
  { id: 'isla_2_dorada', nombre: 'Bosque dorado', descripcion: '3 estrellas en todas las etapas del Bosque.', icono: '🌳', monedas: 100 },
  { id: 'isla_3_dorada', nombre: 'Río dorado', descripcion: '3 estrellas en todas las etapas del Río.', icono: '🌊', monedas: 100 },
  { id: 'vence_1-J', nombre: 'Adiós, Cuervo', descripcion: 'Venciste al Cuervo Revoltoso.', icono: '🐦‍⬛', monedas: 50 },
  { id: 'vence_2-J', nombre: 'Viento en calma', descripcion: 'Venciste a la Bruja Ventolera.', icono: '🧹', monedas: 50 },
  { id: 'vence_3-J', nombre: 'Cajas liberadas', descripcion: 'Venciste al Pulpo Escondecajas.', icono: '🐙', monedas: 50 },
  { id: 'no_me_engana', nombre: 'Nadie me engaña', descripcion: '5 cuentos seguidos sin caer en la trampa de las palabras clave.', icono: '🕵️', monedas: 40 },
  { id: 'constancia_3', nombre: 'Constancia', descripcion: 'Jugaste en 3 días distintos.', icono: '📅', monedas: 20 },
  { id: 'constancia_7', nombre: 'Hábito de campeón', descripcion: 'Jugaste en 7 días distintos.', icono: '🏅', monedas: 50 },
  { id: 'coleccionista', nombre: 'Coleccionista', descripcion: 'Compraste 3 artículos en la tienda.', icono: '🎁', monedas: 20 },
  { id: 'cien', nombre: 'Cien desafíos', descripcion: '100 desafíos bien resueltos.', icono: '💯', monedas: 80 },
];

export function insigniasGanadas(s: Estadisticas, progreso: Progreso, yaTiene: readonly string[]): Insignia[] {
  const cumple: Record<string, boolean> = {
    primer_paso: s.itemsExitosos >= 1,
    racha_5: s.mejorRacha >= 5,
    racha_10: s.mejorRacha >= 10,
    racha_20: s.mejorRacha >= 20,
    equilibrio_perfecto: s.equilibriosPerfectosSeguidos >= 5,
    ojo_de_patron: s.patronesPerfectos >= 15,
    mente_relacional: s.relacionalesSeguidos >= 5,
    sin_pistas: s.etapasSinPistas >= 1,
    tres_estrellas: Object.values(progreso).some((p) => p.estrellas >= 3),
    isla_1_dorada: etapasDeIsla(1).every((e) => (progreso[e.id]?.estrellas ?? 0) >= 3),
    isla_2_dorada: etapasDeIsla(2).every((e) => (progreso[e.id]?.estrellas ?? 0) >= 3),
    isla_3_dorada: etapasDeIsla(3).every((e) => (progreso[e.id]?.estrellas ?? 0) >= 3),
    'vence_3-J': progreso['3-J']?.superada === true,
    no_me_engana: (s.cuentosSeguidos ?? 0) >= 5,
    'vence_1-J': progreso['1-J']?.superada === true,
    'vence_2-J': progreso['2-J']?.superada === true,
    constancia_3: s.dias.length >= 3,
    constancia_7: s.dias.length >= 7,
    coleccionista: s.compras >= 3,
    cien: s.itemsExitosos >= 100,
  };
  return INSIGNIAS.filter((i) => cumple[i.id] && !yaTiene.includes(i.id));
}

// ---------------------------------------------------------------------------
// Tienda
// ---------------------------------------------------------------------------

export type Ranura = 'cabeza' | 'cara' | 'cuello' | 'espalda' | 'balanza';

export interface Articulo {
  id: string;
  nombre: string;
  ranura: Ranura;
  precio: number;
  descripcion: string;
}

export const TIENDA: Articulo[] = [
  { id: 'mono', nombre: 'Moño fucsia', ranura: 'cabeza', precio: 30, descripcion: 'Un moño elegante para Gatito.' },
  { id: 'bufanda', nombre: 'Bufanda violeta', ranura: 'cuello', precio: 40, descripcion: 'Para los días de viento en el bosque.' },
  { id: 'lentes', nombre: 'Lentes de estrella', ranura: 'cara', precio: 50, descripcion: 'Para ver los patrones más rápido.' },
  { id: 'sombrero', nombre: 'Sombrero de mago', ranura: 'cabeza', precio: 80, descripcion: 'Magia para equilibrar balanzas.' },
  { id: 'capa', nombre: 'Capa dorada', ranura: 'espalda', precio: 120, descripcion: 'La capa de las leyendas.' },
  { id: 'corona', nombre: 'Corona', ranura: 'cabeza', precio: 200, descripcion: 'Solo para realeza matemática.' },
  { id: 'balanza_dorada', nombre: 'Balanza dorada', ranura: 'balanza', precio: 150, descripcion: 'Brilla como el sol.' },
  { id: 'balanza_cristal', nombre: 'Balanza de cristal', ranura: 'balanza', precio: 250, descripcion: 'Transparente y violeta.' },
  { id: 'balanza_arcoiris', nombre: 'Balanza arcoíris', ranura: 'balanza', precio: 400, descripcion: 'Todos los colores del equilibrio.' },
];

export const buscarArticulo = (id: string): Articulo | undefined => TIENDA.find((a) => a.id === id);

// ---------------------------------------------------------------------------
// Desbloqueo de islas y etapas
// ---------------------------------------------------------------------------

export interface EstadoIsla {
  numero: number;
  accesible: boolean;
  completada: boolean;
  estrellas: number;
  estrellasMax: number;
  etapas: { id: string; accesible: boolean; estrellas: number; superada: boolean }[];
}

/**
 * Una isla es accesible si ya está construida y corresponde al curso de la o el
 * estudiante (o anterior, como repaso), o si venció al jefe de la isla previa.
 * En islas de repaso todas las etapas quedan abiertas.
 */
export function mapaDesbloqueo(nivelCurso: number, progreso: Progreso): EstadoIsla[] {
  return ISLAS.map((isla) => {
    const jefeAnterior = ETAPAS.find((e) => e.isla === isla.numero - 1 && e.esJefe);
    const accesible = isla.disponible && (isla.numero <= nivelCurso || (jefeAnterior !== undefined && progreso[jefeAnterior.id]?.superada === true));
    const repaso = isla.numero < nivelCurso;
    const etapas = etapasDeIsla(isla.numero);
    let previaSuperada = true;
    const estados = etapas.map((e) => {
      const p = progreso[e.id];
      const todasPrevias = etapas.filter((x) => !x.esJefe).every((x) => progreso[x.id]?.superada);
      const accesibleEtapa = accesible && (repaso || (e.esJefe ? todasPrevias : previaSuperada));
      previaSuperada = p?.superada === true;
      return { id: e.id, accesible: accesibleEtapa, estrellas: p?.estrellas ?? 0, superada: p?.superada === true };
    });
    return {
      numero: isla.numero,
      accesible,
      completada: estados.length > 0 && estados.every((e) => e.superada),
      estrellas: estados.reduce((s, e) => s + e.estrellas, 0),
      estrellasMax: estados.length * 3,
      etapas: estados,
    };
  });
}

export function etapaAccesible(nivelCurso: number, progreso: Progreso, etapaId: string): boolean {
  const etapa = buscarEtapa(etapaId);
  if (!etapa) return false;
  const isla = mapaDesbloqueo(nivelCurso, progreso).find((i) => i.numero === etapa.isla);
  return isla?.etapas.find((e) => e.id === etapaId)?.accesible === true;
}

/** Nivel inicial de una etapa: en repasos o al repetir se parte más arriba. */
export function nivelInicialPara(etapa: Etapa, nivelCurso: number, previo: ProgresoEtapa | undefined): number {
  if (etapa.esJefe) return etapa.nivelInicial;
  let nivel = etapa.nivelInicial;
  if (etapa.isla < nivelCurso) nivel = Math.max(nivel, 3);
  if (previo) nivel = Math.max(nivel, previo.nivelMax - 1);
  return Math.min(nivel, etapa.nivelMaximo);
}
