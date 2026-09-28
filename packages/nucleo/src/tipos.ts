/**
 * Tipos compartidos por el motor, el servidor y el juego.
 */

export type Lado = 'izquierda' | 'derecha';

/** Lado que BAJA, o equilibrio. */
export type Inclinacion = 'izquierda' | 'equilibrio' | 'derecha';

export type Signo = '<' | '=' | '>';

/** Cómo se presenta el ejercicio: progresión concreto → pictórico → simbólico. */
export type Representacion = 'concreta' | 'pictorica' | 'simbolica';

/** Objetos que se pueden poner en un platillo. */
export type Objeto =
  /** Cubos unitarios (material concreto). Cada cubo pesa 1. */
  | { tipo: 'cubos'; cantidad: number; color?: number }
  /** Pesa con su número escrito (pictórico/simbólico). */
  | { tipo: 'pesa'; valor: number }
  /** Caja misteriosa que la o el estudiante debe completar. */
  | { tipo: 'caja' };

/** Término de una expresión aritmética: +valor o −valor. */
export interface Termino {
  valor: number;
  signo: 1 | -1;
}

/** Expresión aritmética simple (suma y resta de naturales). */
export type Expresion = Termino[];

export type Figura = 'manzana' | 'pera' | 'uva' | 'platano' | 'naranja' | 'frutilla' | 'flor' | 'hoja';

export type TipoItem =
  | 'inclinacion'
  | 'equilibrar'
  | 'registrar'
  | 'patron_figuras'
  | 'patron_numerico'
  | 'signo'
  | 'verdadero_falso';

/** Resultado de un ejercicio, del mejor al peor. */
export type Resultado = 'perfecto' | 'logrado' | 'con_ayuda' | 'fallido';

export type AyudaVisual =
  | 'agrupar5'
  | 'mostrarTotales'
  | 'convertirACubos'
  | 'resaltarNucleo'
  | 'mostrarSaltos'
  | 'ejemplo';

export interface Pista {
  nivel: 1 | 2 | 3;
  texto: string;
  ayudaVisual?: AyudaVisual;
  /** Dato para la ayuda visual (p. ej. largo del grupo que se repite). */
  valor?: number;
  /** Ejemplo resuelto parecido (pista de nivel 3). */
  ejemplo?: { texto: string; pasos: string[] };
}

/** Diagnóstico de error típico (ver docs/didactica.md). */
export type CodigoDiagnostico =
  | 'direccion_opuesta'
  | 'equilibrio_falso'
  | 'desequilibrio_falso'
  | 'resultado_del_otro_lado'
  | 'suma_todo'
  | 'cerca'
  | 'muy_liviana'
  | 'muy_pesada'
  | 'signo_invertido'
  | 'conteo'
  | 'lados_invertidos'
  | 'patron_repite_ultimo'
  | 'patron_nucleo_corto'
  | 'patron_nucleo_largo'
  | 'patron_posicion'
  | 'patron_paso_errado'
  | 'patron_direccion'
  | 'patron_parcial'
  | 'patron_regla'
  | 'vf_invertida'
  | 'vf_identidad'
  | 'vf_conmutativa'
  | 'vf_compensacion'
  | 'vf_encadenada'
  | 'vf_casi'
  | 'vf_resta'
  | 'generico';

export interface Evaluacion {
  correcto: boolean;
  diagnostico?: CodigoDiagnostico;
  /** Mensaje de retroalimentación para la o el estudiante. */
  mensaje: string;
  /** Solución que se revela cuando el ejercicio termina. */
  solucion?: Solucion;
}

export interface Solucion {
  /** Texto en lenguaje matemático, p. ej. "8 + 5 = 7 + 6". */
  simbolico: string;
  /** Explicación breve en palabras. */
  explicacion: string;
  /** Respuesta correcta en el formato de la mecánica (para animarla). */
  respuesta: unknown;
}

export interface ResultadoPesada {
  inclinacion: Inclinacion;
  /** Cuánto se inclina: da información aproximada, nunca el valor exacto. */
  magnitud: 'nada' | 'poco' | 'medio' | 'mucho';
  equilibrio: boolean;
  diagnostico?: CodigoDiagnostico;
  mensaje: string;
}
