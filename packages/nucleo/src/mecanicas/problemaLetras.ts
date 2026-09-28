/**
 * "Problemas con letras" — modelar situaciones con ecuaciones a · x ± b = c.
 * OA MA06-10 (representar con ecuaciones) y MA06-11 (resolverlas).
 *
 * Usa la misma mecánica "problema" (elegir la ecuación que cuenta la historia
 * y escribir el valor). Cada problema ofrece dos trampas: la que suma o
 * multiplica "todo lo que aparece" y la que pone el paréntesis donde no va.
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
}

const PERSONAS = ['Sofía', 'Tomás', 'Amanda', 'Benjamín', 'Josefa', 'Matías', 'Isidora', 'Vicente'];
const MULTIPLO = ['', '', 'el doble', 'el triple', 'el cuádruple', 'el quíntuple'];

function redondo(azar: Azar, min: number, max: number, paso: number) {
  return azar.entero(Math.ceil(min / paso), Math.floor(max / paso)) * paso;
}

const PLANTILLAS = {
  ruedas(azar: Azar, grande: boolean): Datos {
    const x = azar.entero(3, grande ? 60 : 20);
    const c = 4 * x + 2;
    return {
      texto: `En el estacionamiento de la Ciudad de las Fórmulas hay autos y una sola moto. En total se cuentan ${c} ruedas.`,
      pregunta: '¿Cuántos autos hay?',
      correcta: `4 · □ + 2 = ${c}`,
      trampa: `4 + □ + 2 = ${c}`,
      otra: `4 · (□ + 2) = ${c}`,
      x,
    };
  },
  numero(azar: Azar, grande: boolean, resta: boolean): Datos {
    const a = azar.entero(3, 5);
    const x = azar.entero(3, grande ? 40 : 15);
    const b = azar.entero(2, Math.min(grande ? 30 : 12, a * x - 1));
    const c = resta ? a * x - b : a * x + b;
    const m = MULTIPLO[a]!;
    return resta
      ? {
          texto: `Robot Fórmulus pensó un número. Si a ${m} de ese número le restas ${b}, obtienes ${c}.`,
          pregunta: '¿Qué número pensó?',
          correcta: `${a} · □ − ${b} = ${c}`,
          trampa: `${a} · □ = ${c} − ${b}`,
          otra: `${a} · (□ − ${b}) = ${c}`,
          x,
        }
      : {
          texto: `Robot Fórmulus pensó un número. Si a ${m} de ese número le sumas ${b}, obtienes ${c}.`,
          pregunta: '¿Qué número pensó?',
          correcta: `${a} · □ + ${b} = ${c}`,
          trampa: `${a} + □ + ${b} = ${c}`,
          otra: `${a} · (□ + ${b}) = ${c}`,
          x,
        };
  },
  cuadernos(azar: Azar, grande: boolean): Datos {
    const a = azar.entero(2, grande ? 6 : 4);
    const x = redondo(azar, 150, 500, 10);
    const b = redondo(azar, 200, 900, 50);
    const c = a * x + b;
    const p = azar.elegir(PERSONAS);
    return {
      texto: `${p} compró ${a} cuadernos iguales y una goma de $${b}. Pagó $${c} en total.`,
      pregunta: '¿Cuánto costó cada cuaderno?',
      correcta: `${a} · □ + ${b} = ${c}`,
      trampa: `${a} + ${b} + ${c} = □`,
      otra: `${a} · (□ + ${b}) = ${c}`,
      x,
    };
  },
  entradas(azar: Azar, grande: boolean): Datos {
    const a = azar.entero(2, grande ? 6 : 4);
    const x = redondo(azar, 200, 500, 50);
    const b = redondo(azar, 100, 900, 50);
    const c = a * x + b;
    const p = azar.elegir(PERSONAS);
    return {
      texto: `${p} tenía $${c}. Compró ${a} entradas iguales para el planetario y le sobraron $${b}.`,
      pregunta: '¿Cuánto costó cada entrada?',
      correcta: `${a} · □ + ${b} = ${c}`,
      trampa: `${a} · □ = ${c} + ${b}`,
      otra: `□ + ${b} = ${c}`,
      x,
    };
  },
  edad(azar: Azar, grande: boolean): Datos {
    const a = azar.entero(2, 3);
    const x = azar.entero(4, grande ? 20 : 12);
    let b = azar.entero(1, 9);
    if (b === x) b += 1;
    const c = a * x + b;
    const p = azar.elegir(PERSONAS);
    return {
      texto: `La edad de ${p} es ${b} años más que ${MULTIPLO[a]} de la edad de su primo. ${p} tiene ${c} años.`,
      pregunta: '¿Cuántos años tiene el primo?',
      correcta: `${a} · □ + ${b} = ${c}`,
      trampa: `${a} · ${c} + ${b} = □`,
      otra: `${a} · (□ + ${b}) = ${c}`,
      x,
    };
  },
};

export function generarProblemaLetras(nivel: number, azar: Azar): ItemGenerado<PublicoProblema, SecretoProblema> {
  const grande = nivel >= 4;
  let d: Datos;
  const opcionesNivel: (() => Datos)[] = [() => PLANTILLAS.ruedas(azar, grande), () => PLANTILLAS.numero(azar, grande, false)];
  if (nivel >= 2) opcionesNivel.push(() => PLANTILLAS.cuadernos(azar, grande), () => PLANTILLAS.entradas(azar, grande));
  if (nivel >= 3) opcionesNivel.push(() => PLANTILLAS.edad(azar, grande));
  if (nivel >= 4) opcionesNivel.push(() => PLANTILLAS.numero(azar, grande, true), () => PLANTILLAS.numero(azar, grande, true));
  d = azar.elegir(opcionesNivel)();
  const opciones = azar.barajar([
    [d.correcta, 'correcta'],
    [d.trampa, 'palabra_clave'],
    [d.otra, 'otra'],
  ] as [string, Clase][]);
  return {
    tipo: 'problema',
    nivel,
    consigna: 'Elige la ecuación que cuenta la historia y descubre el número de la caja.',
    voz: `${d.texto} ${d.pregunta} Primero elige la ecuación que cuenta la historia. Después escribe cuánto vale la caja.`,
    publico: { texto: d.texto, pregunta: d.pregunta, opciones: opciones.map(([t]) => t), simbolo: '□' },
    secreto: { correcta: opciones.findIndex(([, t]) => t === 'correcta'), x: d.x, tipos: opciones.map(([, t]) => t) },
    relacional: false,
  };
}
