/**
 * "Cuentos con cajas" — modelar un problema con una ecuación y resolverla.
 * OA MA03-13 (ecuaciones de un paso) en contexto; prepara MA05-15.
 *
 * Los problemas de "inicio desconocido" son los más difíciles de 1° a 3°
 * (Briars y Larkin, 1984): quien busca palabras clave suma cuando lee "más"
 * y resta cuando lee "regaló". Cada problema ofrece esa ecuación trampa.
 * Hay que elegir la ecuación Y escribir el valor: no se puede adivinar.
 */

import type { Azar } from '../azar';
import { esEnteroEn, type ContextoGeneracion, type ItemGenerado, type Mecanica } from './mecanica';
import { resolver, textoEcuacion, type FormaEcuacion } from './ecuacion';

type Tipo = 'inicio_suma' | 'cambio_suma' | 'inicio_resta' | 'cambio_resta' | 'comparacion';

export interface PublicoProblema {
  texto: string;
  pregunta: string;
  opciones: string[];
  simbolo: string;
}

export interface SecretoProblema {
  correcta: number;
  x: number;
  tipos: ('correcta' | 'palabra_clave' | 'otra')[];
  /** Mensaje propio para la trampa (si no, el de palabras clave). */
  avisoTrampa?: string;
}

export interface RespuestaProblema {
  ecuacion: number;
  valor: number;
}

const PERSONAS = ['Sofía', 'Tomás', 'Amanda', 'Benjamín', 'Josefa', 'Matías', 'Isidora', 'Vicente', 'Gatito', 'la profesora Evelyn'];
/** Todas en femenino plural, para que la historia concuerde ("algunas láminas"). */
const OBJETOS = ['láminas', 'bolitas', 'manzanas', 'figuritas', 'galletas', 'cartas', 'frutillas', 'estampillas'];

interface Datos {
  forma: FormaEcuacion;
  a: number;
  b: number;
  texto: string;
  pregunta: string;
  trampa: string;
  otra: string;
}

function construir(tipo: Tipo, tope: number, azar: Azar): Datos {
  const p = azar.elegir(PERSONAS);
  let q = azar.elegir(PERSONAS);
  while (q === p) q = azar.elegir(PERSONAS);
  const o = azar.elegir(OBJETOS);
  const P = p.charAt(0).toUpperCase() + p.slice(1);
  const s = '□';
  switch (tipo) {
    case 'inicio_suma': {
      const b = azar.entero(20, tope);
      const a = azar.entero(5, b - 5);
      return {
        forma: 'x+a=b',
        a,
        b,
        texto: `${P} tenía algunas ${o}. Le regalaron ${a} más y ahora tiene ${b}.`,
        pregunta: `¿Cuántas ${o} tenía al principio?`,
        trampa: `${a} + ${b} = ${s}`,
        otra: `${s} − ${a} = ${b}`,
      };
    }
    case 'cambio_suma': {
      const b = azar.entero(20, tope);
      const a = azar.entero(5, b - 5);
      return {
        forma: 'a+x=b',
        a,
        b,
        texto:
          b <= 60
            ? `En el bus del colegio iban ${a} estudiantes. En el paradero subieron algunos más y ahora van ${b}.`
            : `En el estadio había ${a} personas. Llegaron algunas más y ahora hay ${b}.`,
        pregunta: b <= 60 ? '¿Cuántos estudiantes subieron?' : '¿Cuántas personas llegaron?',
        trampa: `${a} + ${b} = ${s}`,
        otra: `${s} − ${a} = ${b}`,
      };
    }
    case 'inicio_resta': {
      const x = azar.entero(25, tope);
      const a = azar.entero(5, x - 8);
      const b = x - a;
      return {
        forma: 'x-a=b',
        a,
        b,
        texto: `${P} tenía algunas ${o}. Le regaló ${a} a ${q} y le quedaron ${b}.`,
        pregunta: `¿Cuántas ${o} tenía ${p} antes de regalar?`,
        trampa: b > a ? `${b} − ${a} = ${s}` : `${a} − ${b} = ${s}`,
        otra: `${s} + ${a} = ${b}`,
      };
    }
    case 'cambio_resta': {
      const a = azar.entero(25, tope);
      const x = azar.entero(5, a - 8);
      const b = a - x;
      return {
        forma: 'a-x=b',
        a,
        b,
        texto:
          a <= 60
            ? `En la fiesta del curso había ${a} globos. Se reventaron algunos y quedaron ${b}.`
            : `Para el aniversario del colegio compraron ${a} globos. Se reventaron algunos y quedaron ${b}.`,
        pregunta: '¿Cuántos globos se reventaron?',
        trampa: `${a} + ${b} = ${s}`,
        otra: `${s} − ${a} = ${b}`,
      };
    }
    case 'comparacion': {
      const b = azar.entero(25, tope);
      const a = azar.entero(4, Math.min(30, b - 5));
      return {
        forma: 'x+a=b',
        a,
        b,
        texto: `${P} tiene ${b} ${o}. Tiene ${a} más que ${q}.`,
        pregunta: `¿Cuántas ${o} tiene ${q}?`,
        trampa: `${b} + ${a} = ${s}`,
        otra: `${s} − ${a} = ${b}`,
      };
    }
  }
}

const TIPO_POR_NIVEL: Record<number, { tipos: Tipo[]; tope: number }> = {
  1: { tipos: ['inicio_suma'], tope: 50 },
  2: { tipos: ['cambio_suma', 'inicio_suma'], tope: 80 },
  3: { tipos: ['inicio_resta'], tope: 100 },
  4: { tipos: ['cambio_resta', 'inicio_resta'], tope: 100 },
  5: { tipos: ['comparacion', 'cambio_resta', 'inicio_resta'], tope: 100 },
};

export const problema: Mecanica<PublicoProblema, SecretoProblema, RespuestaProblema> = {
  tipo: 'problema',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar, ctx?: ContextoGeneracion): ItemGenerado<PublicoProblema, SecretoProblema> {
    const dificultad = (ctx?.isla ?? 3) >= 4 ? Math.min(5, nivel + 2) : nivel;
    const base = TIPO_POR_NIVEL[Math.min(Math.max(dificultad, 1), 5)] as { tipos: Tipo[]; tope: number };
    // En 5° básico los números llegan hasta 500 (el ámbito numérico ya supera el millón).
    const cfg = (ctx?.isla ?? 3) >= 5 ? { ...base, tope: 500 } : base;
    const tipo = azar.elegir(cfg.tipos);
    const d = construir(tipo, cfg.tope, azar);
    const correctaTexto = textoEcuacion({ forma: d.forma, a: d.a, b: d.b, simbolo: '□' });
    const opciones = azar.barajar([
      [correctaTexto, 'correcta'],
      [d.trampa, 'palabra_clave'],
      [d.otra, 'otra'],
    ] as [string, 'correcta' | 'palabra_clave' | 'otra'][]);
    return {
      tipo: 'problema',
      nivel,
      consigna: 'Elige la ecuación que cuenta la historia y descubre el número de la caja.',
      voz: `${d.texto} ${d.pregunta} Primero elige la ecuación que cuenta la historia. Después escribe cuánto vale la caja.`,
      publico: { texto: d.texto, pregunta: d.pregunta, opciones: opciones.map(([t]) => t), simbolo: '□' },
      secreto: { correcta: opciones.findIndex(([, t]) => t === 'correcta'), x: resolver(d.forma, d.a, d.b), tipos: opciones.map(([, t]) => t) },
      relacional: tipo === 'comparacion',
    };
  },

  validarRespuesta(r: unknown, publico): RespuestaProblema | null {
    if (typeof r !== 'object' || r === null) return null;
    const { ecuacion, valor } = r as Record<string, unknown>;
    if (!esEnteroEn(ecuacion, 0, publico.opciones.length - 1) || !esEnteroEn(valor, 0, 999)) return null;
    return { ecuacion, valor };
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const ecuacionBien = respuesta.ecuacion === secreto.correcta;
    const valorBien = respuesta.valor === secreto.x;
    if (ecuacionBien && valorBien) {
      return { correcto: true, mensaje: `¡Excelente! La caja vale ${secreto.x}.`, solucion };
    }
    if (!ecuacionBien && secreto.tipos[respuesta.ecuacion] === 'palabra_clave') {
      return {
        correcto: false,
        diagnostico: 'modelo_palabra_clave',
        mensaje:
          secreto.avisoTrampa ??
          'Cuidado con las palabras clave: "más" no siempre significa sumar. Lee la historia: ¿qué número no conoces? Ese es la caja.',
        solucion,
      };
    }
    if (!ecuacionBien) {
      return { correcto: false, diagnostico: 'modelo_errado', mensaje: 'Esa ecuación no cuenta la misma historia. Imagina la caja en el lugar de lo que no sabes.', solucion };
    }
    return { correcto: false, diagnostico: 'operacion_inversa', mensaje: `La ecuación está bien, pero revisa el valor: pon tu número en la caja y comprueba si se cumple (y si es el que pide la pregunta).`, solucion };
  },

  solucion(publico, secreto) {
    return {
      simbolico: `${publico.opciones[secreto.correcta]}  →  □ = ${secreto.x}`,
      explicacion: `La ecuación que cuenta la historia es ${publico.opciones[secreto.correcta]}, y la caja vale ${secreto.x}.`,
      respuesta: { ecuacion: secreto.correcta, valor: secreto.x },
    };
  },

  pistas() {
    return [
      { nivel: 1, texto: '¿Qué número NO conoces en la historia? Ese número es la caja □. Busca la ecuación que cuenta lo que pasó, en orden.' },
      { nivel: 2, texto: 'Dibuja la historia con un modelo de barras: ¿cuál es el total y cuáles son las partes?', ayudaVisual: 'modeloBarra' },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'Ana tenía algunas bolitas. Ganó 10 y ahora tiene 35.',
          pasos: ['No sabemos cuántas tenía: □.', 'Tenía □, ganó 10, tiene 35: □ + 10 = 35.', '35 − 10 = 25. Tenía 25.'],
        },
      },
    ];
  },
};
