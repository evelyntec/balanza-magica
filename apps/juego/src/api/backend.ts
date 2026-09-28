/**
 * Contrato entre el juego y quien lo respalda:
 *  - BackendHttp: el servidor del colegio (modo clase, puntos confiables).
 *  - BackendLocal: el mismo servicio ejecutándose en el navegador (modo práctica).
 */

import type {
  Curso,
  Perfil,
  Pista,
  RespuestaPesar,
  RespuestaResponder,
  VistaItem,
  VistaPartida,
  Rango,
  Ranura,
} from '@balanza/nucleo';

export interface Ranking {
  curso: string;
  posiciones: { apodo: string; avatar: string; puntos: number; rango: Rango; esYo: boolean }[];
}

export interface ResumenCurso {
  curso: Curso;
  alumnos: {
    id: string;
    apodo: string;
    avatar: string;
    puntos: number;
    rango: string;
    itemsExitosos: number;
    itemsTotales: number;
    pistas: number;
    dias: number;
    progreso: Perfil['progreso'];
    bloqueado: boolean;
  }[];
  erroresFrecuentes: { codigo: string; veces: number }[];
  totalEventos: number;
}

export interface Backend {
  readonly modo: 'clase' | 'practica';
  yo(): Promise<Perfil | null>;
  tomarPestana(): Promise<void>;
  sugerirApodos(): Promise<string[]>;
  curso(codigo: string): Promise<{ curso: { nombre: string; nivel: number }; alumnos: { apodo: string; avatar: string }[] }>;
  registrar(datos: { codigoCurso: string; apodo: string; avatar: string; clave: string[] }): Promise<Perfil>;
  ingresar(datos: { codigoCurso: string; apodo: string; clave: string[] }): Promise<Perfil>;
  salir(): Promise<void>;
  iniciarEtapa(etapaId: string): Promise<{ partida: VistaPartida; item: VistaItem }>;
  itemActual(partidaId: string): Promise<{ partida: VistaPartida; item: VistaItem | null }>;
  pista(itemId: string): Promise<{ pista: Pista; pistasUsadas: number }>;
  pesar(itemId: string, propuesta: number): Promise<RespuestaPesar>;
  responder(itemId: string, respuesta: unknown): Promise<RespuestaResponder>;
  abandonar(partidaId: string): Promise<Perfil>;
  comprar(articuloId: string): Promise<Perfil>;
  equipar(ranura: Ranura, articuloId: string | null): Promise<Perfil>;
  ranking(): Promise<Ranking>;
  // Docente (solo modo clase)
  docenteIngresar(clave: string): Promise<void>;
  docenteCursos(): Promise<Curso[]>;
  docenteCrearCurso(nombre: string, nivel: number): Promise<Curso>;
  docenteResumen(cursoId: string): Promise<ResumenCurso>;
  docenteUrlCsv(cursoId: string): string;
  docenteRestablecerClave(jugadorId: string, clave: string[]): Promise<void>;
  docenteEliminar(jugadorId: string): Promise<void>;
}

export class ErrorApi extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
    readonly estado = 0,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

export const esErrorApi = (e: unknown): e is ErrorApi => e instanceof ErrorApi;
