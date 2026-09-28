/**
 * "Problemas del castillo" — modelar con ecuaciones de la forma
 * ax + b = cx + d, a(x + b) = c y x/a + b = c (OA MA08-8).
 *
 * Usa la mecánica "problema". Cada opción se evalúa en el generador para
 * asegurar que solo la correcta es verdadera con la solución.
 */

import type { Azar } from '../azar';
import type { ItemGenerado } from './mecanica';
import type { PublicoProblema, SecretoProblema } from './problema';

interface Opcion {
  texto: string;
  vale: (x: number) => boolean;
}

interface Datos {
  texto: string;
  pregunta: string;
  correcta: Opcion;
  trampa: Opcion;
  otra: Opcion;
  x: number;
  aviso: string;
}

const PLANTILLAS: ((azar: Azar) => Datos | null)[] = [
  // Dos planes de celular: ax + b = cx + d
  (azar) => {
    const m1 = azar.entero(2, 6) * 10;
    let m2 = azar.entero(2, 6) * 10;
    if (m2 === m1) m2 += 10;
    const [lento, rapido] = m1 < m2 ? [m1, m2] : [m2, m1];
    const x = azar.entero(5, 60);
    const n2 = azar.entero(10, 40) * 100;
    const n1 = n2 + (rapido - lento) * x;
    return {
      texto: `El plan Dragón cobra $${n1} al mes más $${lento} por cada GB. El plan Torre cobra $${n2} al mes más $${rapido} por cada GB.`,
      pregunta: '¿Con cuántos GB los dos planes cuestan lo mismo?',
      correcta: { texto: `${n1} + ${lento} · □ = ${n2} + ${rapido} · □`, vale: (v) => n1 + lento * v === n2 + rapido * v },
      trampa: { texto: `(${n1} + ${lento}) · □ = (${n2} + ${rapido}) · □`, vale: (v) => (n1 + lento) * v === (n2 + rapido) * v },
      otra: { texto: `${n1} + ${n2} = ${lento} · □ + ${rapido} · □`, vale: (v) => n1 + n2 === (lento + rapido) * v },
      x,
      aviso: 'El cargo fijo NO se multiplica por los GB: solo el precio por GB va con □.',
    };
  },
  // Edades: a·x + t = k·(x + t)
  (azar) => {
    const k = azar.entero(2, 3);
    const a = k + azar.entero(1, 3);
    const t = azar.entero(2, 12);
    // a·x + t = k·x + k·t  →  (a − k)·x = (k − 1)·t
    if (((k - 1) * t) % (a - k) !== 0) return null;
    const x = ((k - 1) * t) / (a - k);
    if (x < 2 || x > 20) return null;
    const veces = ['', '', 'el doble', 'el triple', 'el cuádruple', 'el quíntuple', 'seis veces'];
    return {
      texto: `Hoy la reina tiene ${veces[a]} de la edad de la princesa. Dentro de ${t} años tendrá ${veces[k]} de la edad que tenga la princesa.`,
      pregunta: '¿Cuántos años tiene hoy la princesa?',
      correcta: { texto: `${a} · □ + ${t} = ${k} · (□ + ${t})`, vale: (v) => a * v + t === k * (v + t) },
      trampa: { texto: `${a} · □ + ${t} = ${k} · □ + ${t}`, vale: (v) => a * v + t === k * v + t },
      otra: { texto: `${a} · (□ + ${t}) = ${k} · □ + ${t}`, vale: (v) => a * (v + t) === k * v + t },
      x,
      aviso: `Dentro de ${t} años, la princesa TAMBIÉN tendrá ${t} años más: □ + ${t}.`,
    };
  },
  // Rectángulo: 2(x + x + b) = P
  (azar) => {
    const x = azar.entero(3, 40);
    const b = azar.entero(2, 15);
    const P = 2 * (2 * x + b);
    return {
      texto: `El jardín rectangular del castillo tiene un largo que mide ${b} m más que su ancho. Su perímetro es ${P} m.`,
      pregunta: '¿Cuánto mide el ancho?',
      correcta: { texto: `2 · (□ + □ + ${b}) = ${P}`, vale: (v) => 2 * (2 * v + b) === P },
      trampa: { texto: `□ + □ + ${b} = ${P}`, vale: (v) => 2 * v + b === P },
      otra: { texto: `2 · □ + ${b} = ${P}`, vale: (v) => 2 * v + b === P },
      x,
      aviso: 'El perímetro suma los CUATRO lados: dos anchos y dos largos.',
    };
  },
  // x/a + b = c
  (azar) => {
    const a = azar.entero(2, 5);
    const x = a * azar.entero(3, 30);
    const b = azar.entero(4, 20);
    const c = x / a + b;
    const partes = ['', '', 'La mitad', 'Un tercio', 'Un cuarto', 'Un quinto'];
    return {
      texto: `${partes[a]} de las monedas del cofre más ${b} monedas de regalo suman ${c} monedas.`,
      pregunta: '¿Cuántas monedas hay en el cofre?',
      correcta: { texto: `□ / ${a} + ${b} = ${c}`, vale: (v) => v / a + b === c },
      trampa: { texto: `(□ + ${b}) / ${a} = ${c}`, vale: (v) => (v + b) / a === c },
      otra: { texto: `${a} · □ + ${b} = ${c}`, vale: (v) => a * v + b === c },
      x,
      aviso: `Solo las monedas del cofre se dividen por ${a}; las ${b} de regalo se suman después.`,
    };
  },
];

export function generarProblemaCastillo(nivel: number, azar: Azar): ItemGenerado<PublicoProblema, SecretoProblema> {
  const disponibles = nivel <= 2 ? [PLANTILLAS[2]!, PLANTILLAS[3]!] : PLANTILLAS;
  for (let intento = 0; intento < 500; intento++) {
    const d = azar.elegir(disponibles)(azar);
    if (!d || d.x > 500) continue;
    // Solo la opción correcta es verdadera con la solución.
    if (!d.correcta.vale(d.x) || d.trampa.vale(d.x) || d.otra.vale(d.x)) continue;
    const opciones = azar.barajar([
      [d.correcta.texto, 'correcta'],
      [d.trampa.texto, 'palabra_clave'],
      [d.otra.texto, 'otra'],
    ] as [string, 'correcta' | 'palabra_clave' | 'otra'][]);
    return {
      tipo: 'problema',
      nivel,
      consigna: 'Elige la ecuación que modela el problema y resuélvela.',
      voz: `${d.texto} ${d.pregunta} Primero elige la ecuación. Después escribe la respuesta.`,
      publico: { texto: d.texto, pregunta: d.pregunta, opciones: opciones.map(([t]) => t), simbolo: '□' },
      secreto: { correcta: opciones.findIndex(([, t]) => t === 'correcta'), x: d.x, tipos: opciones.map(([, t]) => t), avisoTrampa: d.aviso },
      relacional: false,
    };
  }
  throw new Error('No se pudo generar el problema');
}
