export type CodigoError =
  | 'NO_AUTENTICADO'
  | 'CREDENCIALES'
  | 'PROHIBIDO'
  | 'NO_ENCONTRADO'
  | 'OTRA_PESTANA'
  | 'CONFLICTO'
  | 'BLOQUEADO'
  | 'DEMASIADO_RAPIDO'
  | 'LIMITE'
  | 'INVALIDO'
  | 'ETAPA_BLOQUEADA'
  | 'ITEM_TERMINADO'
  | 'SIN_MONEDAS'
  | 'DUPLICADO';

export const ESTADO_HTTP: Record<CodigoError, number> = {
  NO_AUTENTICADO: 401,
  CREDENCIALES: 401,
  PROHIBIDO: 403,
  NO_ENCONTRADO: 404,
  OTRA_PESTANA: 409,
  CONFLICTO: 409,
  BLOQUEADO: 423,
  DEMASIADO_RAPIDO: 429,
  LIMITE: 429,
  INVALIDO: 400,
  ETAPA_BLOQUEADA: 403,
  ITEM_TERMINADO: 409,
  SIN_MONEDAS: 400,
  DUPLICADO: 409,
};

/** Mensajes pensados para niñas y niños (el juego los muestra tal cual). */
const MENSAJES: Record<CodigoError, string> = {
  NO_AUTENTICADO: 'Necesitas entrar al juego primero.',
  CREDENCIALES: 'Las figuras de tu clave no coinciden. Intenta otra vez.',
  PROHIBIDO: 'No tienes permiso para hacer eso.',
  NO_ENCONTRADO: 'No encontramos eso.',
  OTRA_PESTANA: 'El juego se abrió en otra ventana o dispositivo.',
  CONFLICTO: 'Algo cambió mientras jugabas. Vuelve a intentarlo.',
  BLOQUEADO: 'Demasiados intentos. Espera unos minutos o pide ayuda a tu profesora.',
  DEMASIADO_RAPIDO: '¡Más despacio! Lee con calma antes de responder.',
  LIMITE: '¡Uf, demasiado rápido! Respira y sigue.',
  INVALIDO: 'Esa respuesta no tiene el formato correcto.',
  ETAPA_BLOQUEADA: 'Esa etapa aún está bloqueada.',
  ITEM_TERMINADO: 'Ese desafío ya terminó.',
  SIN_MONEDAS: 'No tienes monedas suficientes.',
  DUPLICADO: 'Ese apodo ya existe en tu curso. Elige otro.',
};

export class ErrorJuego extends Error {
  readonly codigo: CodigoError;
  readonly estado: number;
  readonly datos: Record<string, unknown> | undefined;

  constructor(codigo: CodigoError, mensaje?: string, datos?: Record<string, unknown>) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorJuego';
    this.codigo = codigo;
    this.estado = ESTADO_HTTP[codigo];
    this.datos = datos;
  }
}

export const esErrorJuego = (e: unknown): e is ErrorJuego => e instanceof ErrorJuego;
