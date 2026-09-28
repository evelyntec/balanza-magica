/**
 * "Problemas del volcán" — lenguaje algebraico y modelación con ecuaciones e
 * inecuaciones (OA MA07-6 y MA07-9).
 *
 * Usa la mecánica "problema": elegir el modelo y escribir la respuesta. En
 * los problemas con inecuaciones la respuesta es el mayor (o menor) número
 * natural que cumple ("¿cuántas entradas como máximo?"): interpretar la
 * solución en el contexto es parte de modelar.
 */

import type { Azar } from '../azar';
import type { ItemGenerado } from './mecanica';
import type { PublicoProblema, SecretoProblema } from './problema';

type Clase = 'correcta' | 'palabra_clave' | 'otra';

interface Datos {
  texto: string;
  pregunta: string;
  correcta: string;
  trampa: string;
  otra: string;
  x: number;
  aviso?: string;
}

const PERSONAS = ['Sofía', 'Tomás', 'Amanda', 'Benjamín', 'Josefa', 'Matías', 'Isidora', 'Vicente'];
const VECES: Record<number, string> = { 2: 'El doble', 3: 'El triple', 4: 'El cuádruple', 5: 'El quíntuple' };

const PLANTILLAS: ((azar: Azar, grande: boolean) => Datos)[] = [
  // ax < b: el máximo natural
  (azar, grande) => {
    const a = azar.entero(3, grande ? 15 : 9);
    const b = azar.entero(4 * a, (grande ? 30 : 12) * a);
    const p = azar.elegir(PERSONAS);
    return {
      texto: `${p} quiere comprar entradas para el parque del volcán. Cada entrada cuesta ${a} fichas y debe gastar menos de ${b} fichas.`,
      pregunta: '¿Cuántas entradas puede comprar como máximo?',
      correcta: `${a} · □ < ${b}`,
      trampa: `${a} · □ > ${b}`,
      otra: `${a} · □ = ${b}`,
      x: b % a === 0 ? b / a - 1 : Math.floor(b / a),
      aviso: '"Menos de" se escribe con "<". Y la respuesta es el MAYOR número de entradas que cumple.',
    };
  },
  // ax > b: el mínimo natural
  (azar, grande) => {
    const a = azar.entero(3, grande ? 15 : 9);
    const b = azar.entero(3 * a, (grande ? 30 : 12) * a);
    const x = Math.floor(b / a) + 1;
    return {
      texto: `En el concurso del volcán cada respuesta correcta vale ${a} puntos. Para ganar se necesitan más de ${b} puntos.`,
      pregunta: '¿Cuántas respuestas correctas se necesitan como mínimo para ganar?',
      correcta: `${a} · □ > ${b}`,
      trampa: `${a} · □ < ${b}`,
      otra: `${a} · □ = ${b}`,
      x,
      aviso: '"Más de" se escribe con ">". Y la respuesta es el MENOR número de respuestas que cumple.',
    };
  },
  // x/a = b
  (azar, grande) => {
    const a = azar.entero(3, 8);
    const b = azar.entero(4, grande ? 60 : 25);
    return {
      texto: `Se repartieron todas las láminas de una caja en partes iguales entre ${a} amigos, y a cada uno le tocaron ${b}.`,
      pregunta: '¿Cuántas láminas traía la caja?',
      correcta: `□ / ${a} = ${b}`,
      trampa: `${a} / □ = ${b}`,
      otra: `${a} · □ = ${b}`,
      x: a * b,
    };
  },
  // ax = b
  (azar, grande) => {
    const a = azar.entero(3, 9);
    const x = azar.entero(4, grande ? 55 : 30);
    const p = azar.elegir(PERSONAS);
    return {
      texto: `${p} compró ${a} paquetes iguales de galletas y en total vienen ${a * x} galletas.`,
      pregunta: '¿Cuántas galletas trae cada paquete?',
      correcta: `${a} · □ = ${a * x}`,
      trampa: `□ = ${a} · ${a * x}`,
      otra: `□ / ${a} = ${a * x}`,
      x,
    };
  },
  // Lenguaje algebraico: a · x − b = c
  (azar, grande) => {
    const a = azar.entero(2, 5);
    const x = azar.entero(3, grande ? 40 : 15);
    const b = azar.entero(1, Math.min(20, a * x - 1));
    const c = a * x - b;
    return {
      texto: `${VECES[a]} de un número, disminuido en ${b}, es igual a ${c}.`,
      pregunta: '¿Cuál es el número?',
      correcta: `${a} · □ − ${b} = ${c}`,
      trampa: `${a} · (□ − ${b}) = ${c}`,
      otra: `${a} + □ − ${b} = ${c}`,
      x,
      aviso: `Ojo con el orden: primero se multiplica el número y DESPUÉS se resta ${b}. No va paréntesis.`,
    };
  },
  // Lenguaje algebraico: x/2 + b = c
  (azar, grande) => {
    const x = 2 * azar.entero(3, grande ? 50 : 20);
    const b = azar.entero(2, 20);
    const c = x / 2 + b;
    return {
      texto: `La mitad de un número, aumentada en ${b}, es igual a ${c}.`,
      pregunta: '¿Cuál es el número?',
      correcta: `□ / 2 + ${b} = ${c}`,
      trampa: `(□ + ${b}) / 2 = ${c}`,
      otra: `2 · □ + ${b} = ${c}`,
      x,
      aviso: `Ojo con el orden: primero se saca la mitad del número y DESPUÉS se suma ${b}.`,
    };
  },
];

export function generarProblemaVolcan(nivel: number, azar: Azar): ItemGenerado<PublicoProblema, SecretoProblema> {
  const disponibles = nivel <= 1 ? PLANTILLAS.slice(2, 4) : nivel === 2 ? PLANTILLAS.slice(0, 4) : PLANTILLAS;
  const d = azar.elegir(disponibles)(azar, nivel >= 4);
  const opciones = azar.barajar([
    [d.correcta, 'correcta'],
    [d.trampa, 'palabra_clave'],
    [d.otra, 'otra'],
  ] as [string, Clase][]);
  return {
    tipo: 'problema',
    nivel,
    consigna: 'Elige la ecuación o inecuación que modela el problema y responde.',
    voz: `${d.texto} ${d.pregunta} Primero elige el modelo. Después escribe la respuesta.`,
    publico: { texto: d.texto, pregunta: d.pregunta, opciones: opciones.map(([t]) => t), simbolo: '□' },
    secreto: {
      correcta: opciones.findIndex(([, t]) => t === 'correcta'),
      x: d.x,
      tipos: opciones.map(([, t]) => t),
      ...(d.aviso ? { avisoTrampa: d.aviso } : {}),
    },
    relacional: false,
  };
}
