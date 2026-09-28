/**
 * Modelos persistidos. Privacidad: de cada estudiante solo se guarda un
 * apodo, un avatar y una clave de figuras (con hash). Nunca nombres
 * completos, RUT, correos ni fotos.
 */

import type { EstadoPartida, Estadisticas, Progreso, Ranura } from '../reglas';
import type { CodigoDiagnostico, Pista, Resultado, ResultadoPesada, TipoItem } from '../tipos';

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  /** Nivel escolar (1 a 8). */
  nivel: number;
  creadoEn: number;
}

export interface Jugador {
  id: string;
  cursoId: string;
  apodo: string;
  /** Apodo normalizado (minúsculas, sin tildes ni espacios dobles) para unicidad. */
  apodoClave: string;
  avatar: string;
  claveHash: string;
  claveSal: string;
  nivelCurso: number;
  puntos: number;
  monedas: number;
  racha: number;
  progreso: Progreso;
  estadisticas: Estadisticas;
  insignias: string[];
  inventario: string[];
  equipado: Partial<Record<Ranura, string>>;
  pestanaActiva: string | null;
  partidaActiva: string | null;
  intentosFallidos: number;
  bloqueadoHasta: number;
  creadoEn: number;
  actualizadoEn: number;
  version: number;
}

export interface Sesion {
  tokenHash: string;
  jugadorId: string | null;
  docente: boolean;
  creadaEn: number;
  expiraEn: number;
}

export interface Partida {
  id: string;
  jugadorId: string;
  etapaId: string;
  estado: EstadoPartida;
  itemActual: string | null;
  indice: number;
  cerrada: boolean;
  creadaEn: number;
  actualizadaEn: number;
  version: number;
}

export interface Pesada {
  propuesta: number;
  resultado: ResultadoPesada;
  en: number;
}

export interface ItemGuardado {
  id: string;
  partidaId: string;
  jugadorId: string;
  indice: number;
  tipo: TipoItem;
  nivel: number;
  consigna: string;
  voz: string;
  publico: unknown;
  secreto: unknown;
  relacional: boolean;
  andamiaje: boolean;
  semilla: string;
  emitidoEn: number;
  ultimaAccionEn: number;
  intentos: number;
  pesadas: Pesada[];
  pistas: Pista[];
  diagnosticos: CodigoDiagnostico[];
  terminado: boolean;
  resultado: Resultado | null;
  puntos: number;
  terminadoEn: number | null;
  version: number;
}

export interface Evento {
  jugadorId: string;
  cursoId: string;
  etapaId: string;
  tipoItem: TipoItem;
  nivel: number;
  resultado: Resultado;
  intentos: number;
  pistas: number;
  diagnostico: CodigoDiagnostico | null;
  relacional: boolean;
  andamiaje: boolean;
  ms: number;
  puntos: number;
  fecha: number;
}
