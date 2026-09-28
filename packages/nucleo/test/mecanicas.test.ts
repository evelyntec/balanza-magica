/**
 * Pruebas masivas: miles de ejercicios generados por etapa y nivel.
 * Verifican que cada ejercicio es correcto didácticamente y técnicamente.
 */

import { describe, expect, it } from 'vitest';
import { crearAzar } from '../src/azar';
import { pesoPlatillo, valorExpresion } from '../src/balanza';
import { ETAPAS } from '../src/curriculo';
import {
  MECANICAS,
  type PublicoEquilibrar,
  type PublicoInclinacion,
  type PublicoPatronFiguras,
  type PublicoPatronNumerico,
  type PublicoRegistrar,
  type PublicoSigno,
  type PublicoVerdaderoFalso,
  type SecretoEquilibrar,
  type SecretoPatronNumerico,
  type SecretoVerdaderoFalso,
} from '../src/mecanicas';
import type { Objeto, TipoItem } from '../src/tipos';
import { aplicar, cumple, esMayor, describirSoluciones, termino, textoReglaFuncional, FIGURAS_LINEALES, relacionEfectiva, sucesion, graficoSolucion, expresion, ecuacionDosPasos, valorFormula, textoDosPasos, reducir, proporcion, ecuacionMult, ecuacionAmbosLados, funcion, afin, inecuacionLineal, textoAmbosLados, textoInecLineal, coeficienteFinal, type PublicoAmbosLados, type SecretoAmbosLados, type PublicoFuncion, type SecretoFuncion, type PublicoAfin, type SecretoAfin, type PublicoInecLineal, textoMult, valorProporcion, type PublicoReducir, type SecretoReducir, type PublicoProporcion, type SecretoProporcion, type PublicoMult, type PublicoExpresion, type SecretoExpresion, type PublicoDosPasos, type SecretoDosPasos, type PublicoSucesion, type SecretoSucesion, type PublicoGrafico, type SecretoGrafico, resolver, textoEcuacion, type Operacion, type PublicoInecuacion, type PublicoTablaRegla, type SecretoInecuacion, type SecretoTablaRegla, type PublicoEcuacion, type PublicoProblema, type PublicoTabla100, type SecretoProblema, type SecretoTabla100 } from '../src/mecanicas';
import { respuestaCorrecta, respuestaIncorrecta } from './ayudas';

const POR_NIVEL = 1500;

/** Todos los números que se muestran (recursivo). `paso` y `signo` son metadatos con signo. */
function numeros(x: unknown): number[] {
  if (typeof x === 'number') return [x];
  if (Array.isArray(x)) return x.flatMap(numeros);
  if (x && typeof x === 'object') {
    return Object.entries(x)
      .filter(([k]) => k !== 'paso' && k !== 'signo')
      .flatMap(([, v]) => numeros(v));
  }
  return [];
}

function verificarObjetos(objetos: Objeto[]): void {
  for (const o of objetos) {
    if (o.tipo === 'cubos') expect(o.cantidad).toBeGreaterThanOrEqual(1);
    if (o.tipo === 'pesa') expect(o.valor).toBeGreaterThanOrEqual(1);
  }
}

describe.each(ETAPAS.map((e) => [e.id, e] as const))('etapa %s', (_id, etapa) => {
  for (let nivel = 1; nivel <= etapa.nivelMaximo; nivel++) {
    it(`nivel ${nivel}: ${POR_NIVEL} ejercicios válidos`, () => {
      const vistos = new Set<string>();
      let anterior: TipoItem | undefined;
      for (let k = 0; k < POR_NIVEL; k++) {
        const azar = crearAzar(`${etapa.id}-${nivel}-${k}`);
        const item = etapa.generar(nivel, azar, { isla: etapa.isla, andamiaje: k % 7 === 0, ...(anterior ? { anterior } : {}) });
        anterior = item.tipo;
        const m = MECANICAS[item.tipo];
        expect(etapa.mecanicas).toContain(item.tipo);
        expect(item.nivel).toBe(nivel);
        expect(item.consigna.length).toBeGreaterThan(10);
        expect(item.voz.length).toBeGreaterThan(10);
        vistos.add(JSON.stringify(item.publico));

        // Sin números inválidos: enteros, sin negativos (antes de 7° no hay negativos).
        for (const n of [...numeros(item.publico), ...numeros(item.secreto)]) {
          expect(Number.isInteger(n)).toBe(true);
          if (etapa.isla < 7) expect(n).toBeGreaterThanOrEqual(0);
        }

        // La vista pública no filtra la respuesta.
        const texto = JSON.stringify(item.publico);
        for (const clave of ['valorCaja', 'correcta', 'correcto', 'valores', 'completa', 'regla', 'nucleo', 'paso', 'totalIzquierda']) {
          expect(texto).not.toContain(`"${clave}":`);
        }

        // La respuesta correcta se acepta y una incorrecta se rechaza.
        const buena = respuestaCorrecta(item.tipo, item.publico, item.secreto);
        const mala = respuestaIncorrecta(item.tipo, item.publico, item.secreto);
        if (m.modo === 'pesada') {
          const p = item.publico as PublicoEquilibrar;
          expect(m.validarPropuesta!(buena, p)).toBe(buena);
          expect(m.pesar!(p, item.secreto, buena as number).equilibrio).toBe(true);
          // Solución única: ningún otro valor equilibra.
          for (let v = 0; v <= p.maxCaja; v++) {
            if (v !== buena) expect(m.pesar!(p, item.secreto, v).equilibrio).toBe(false);
          }
          expect(m.validarPropuesta!(p.maxCaja + 1, p)).toBeNull();
          expect(m.validarPropuesta!(-1, p)).toBeNull();
          expect(m.validarPropuesta!(2.5, p)).toBeNull();
        } else {
          const r = m.validarRespuesta(buena, item.publico);
          expect(r).not.toBeNull();
          expect(m.evaluar(item.publico, item.secreto, r).correcto).toBe(true);
          const rm = m.validarRespuesta(mala, item.publico);
          expect(rm).not.toBeNull();
          const ev = m.evaluar(item.publico, item.secreto, rm);
          expect(ev.correcto).toBe(false);
          expect(ev.mensaje.length).toBeGreaterThan(10);
          // Respuestas malformadas se rechazan.
          for (const basura of [null, undefined, 'x', 42.5, { a: 1 }, [], [1, 2, 3, 4, 5, 6, 7]]) {
            if (JSON.stringify(basura) !== JSON.stringify(buena)) {
              const v = m.validarRespuesta(basura, item.publico);
              if (v !== null) expect(m.evaluar(item.publico, item.secreto, v).correcto).toBe(false);
            }
          }
        }

        const sol = m.solucion(item.publico, item.secreto);
        expect(sol.simbolico.length).toBeGreaterThan(0);
        const pistas = m.pistas(item.publico, item.secreto);
        expect(pistas.map((p) => p.nivel)).toEqual([1, 2, 3]);

        verificarEspecifico(item.tipo, item.publico, item.secreto, etapa.isla, nivel);
      }
      // Variedad: los ejercicios no se repiten demasiado.
      expect(vistos.size).toBeGreaterThanOrEqual(nivel === 1 ? 8 : 40);
    });
  }
});

function verificarEspecifico(tipo: TipoItem, publico: unknown, secreto: unknown, isla: number, nivel: number): void {
  // OA MA01-12 y MA02-13: del 0 al 20. OA MA03-13: del 0 al 100.
  const limiteBalanza = isla <= 2 ? 20 : 100;
  if (tipo === 'tabla_regla') {
    const p = publico as PublicoTablaRegla;
    const s = secreto as SecretoTablaRegla;
    for (const f of s.completas) {
      expect(aplicar(s.op, s.k, f.entrada)).toBe(f.salida);
      expect(f.salida).toBeGreaterThanOrEqual(0);
      expect(f.salida).toBeLessThanOrEqual(100);
    }
    // Las filas completas visibles distinguen la regla correcta de todas las alternativas.
    if (p.modo === 'regla') {
      expect(new Set(p.opcionesRegla).size).toBe(4);
      expect(p.opcionesRegla).toContain(s.regla);
      const visibles = p.filas.filter((f) => f.entrada !== null && f.salida !== null) as { entrada: number; salida: number }[];
      for (const o of p.opcionesRegla ?? []) {
        if (o === s.regla) continue;
        const [op, k] = o.split(' ') as [Operacion, string];
        expect(visibles.every((f) => aplicar(op, Number(k), f.entrada) === f.salida)).toBe(false);
      }
    }
    if (nivel >= 3) expect(p.filas.map((f, i) => s.completas[i]!.entrada).every((e, i, arr) => i === 0 || e > arr[i - 1]!)).toBe(false);
    return;
  }
  if (tipo === 'sucesion') {
    const p = publico as PublicoSucesion;
    const s = secreto as SecretoSucesion;
    for (const t of p.terminos) expect(termino(s, t.posicion)).toBe(t.valor);
    for (const t of p.terminos) expect(t.valor).toBeLessThanOrEqual(1000);
    for (const v of s.respuesta) expect(v).toBeLessThanOrEqual(1000);
    const pr = p.pregunta;
    if (pr.tipo === 'termino') expect(s.respuesta).toEqual([termino(s, pr.posicion)]);
    if (pr.tipo === 'posicion') {
      expect(termino(s, s.respuesta[0]!)).toBe(pr.valor);
      expect(s.respuesta[0]).toBeGreaterThan(p.terminos.length); // no se lee en pantalla
    }
    if (pr.tipo === 'siguientes') expect(s.respuesta).toEqual([termino(s, p.terminos.length + 1), termino(s, p.terminos.length + 2)]);
    // Desde el nivel 3 las preguntas lineales son lejanas: contar de a uno no alcanza.
    if (s.tipoRegla === 'lineal' && pr.tipo === 'termino' && nivel >= 3) expect(pr.posicion).toBeGreaterThanOrEqual(20);
    if (p.modo === 'figuras') {
      expect(p.figura).toBeDefined();
      if (s.tipoRegla === 'lineal') {
        const f = FIGURAS_LINEALES[p.figura as keyof typeof FIGURAS_LINEALES];
        expect([s.a, s.d]).toEqual([f.a, f.d]);
        expect(p.unidad).toBe('palitos');
      } else expect(p.unidad).toBe('baldosas');
    } else expect(p.figura).toBeUndefined();
    if (p.opcionesRegla) {
      expect(new Set(p.opcionesRegla).size).toBe(3);
      const sujeto = p.modo === 'figuras' ? 'el número de la figura' : 'la posición';
      expect(p.opcionesRegla[s.reglaCorrecta!]).toBe(textoReglaFuncional(s.d, s.a - s.d, sujeto));
      // Cada regla falsa falla en algún término visible.
      for (const [i, o] of p.opcionesRegla.entries()) {
        if (i === s.reglaCorrecta) continue;
        const m = /por (\d+)(?: y (suma|resta) (\d+))?$/.exec(o)!;
        const f = (n: number) => Number(m[1]) * n + (m[2] ? (m[2] === 'suma' ? 1 : -1) * Number(m[3]) : 0);
        expect(p.terminos.every((t) => f(t.posicion) === t.valor)).toBe(false);
      }
    }
    return;
  }
  if (tipo === 'expresion') {
    const p = publico as PublicoExpresion;
    const s = secreto as SecretoExpresion;
    expect(p.filas.length).toBeGreaterThanOrEqual(3);
    for (const f of p.filas) {
      expect(valorFormula(s.a, s.b, s.signo, f.n)).toBe(f.valor);
      expect(f.valor).toBeGreaterThanOrEqual(1);
    }
    expect(new Set(p.filas.map((f) => f.n)).size).toBe(p.filas.length);
    if (p.evaluarEn !== undefined) {
      expect(s.resultado).toBe(valorFormula(s.a, s.b, s.signo, p.evaluarEn));
      expect(s.resultado).toBeLessThanOrEqual(9999);
      expect(p.filas.map((f) => f.n)).not.toContain(p.evaluarEn);
    }
    // Desde el nivel 3 de las tablas, las filas pueden venir desordenadas o sin el 1.
    if (p.modo === 'figura') expect(p.figura).toBeDefined();
    if (p.modo === 'situacion') expect(p.situacion!.texto.length).toBeGreaterThan(20);
    if (nivel <= 2) expect(p.letra).toBe('n');
    return;
  }
  if (tipo === 'ecuacion_dos_pasos') {
    const p = publico as PublicoDosPasos;
    const s = secreto as SecretoDosPasos;
    expect(s.ax).toBe(p.a * s.x);
    const [izq, der] = textoDosPasos(p, s.x).replace(/−/g, '-').replace(/·/g, '*').split('=') as [string, string];
    expect(eval(izq)).toBe(eval(der)); // eslint-disable-line no-eval
    expect(p.c).toBeGreaterThanOrEqual(1);
    expect(p.c).toBeLessThanOrEqual(300);
    expect(p.representacion).toBe(nivel <= 3 ? 'balanza' : 'formal');
    if (p.representacion === 'balanza') expect(p.a).toBeLessThanOrEqual(6);
    return;
  }
  const verdad = (texto: string) => {
    const e = texto.replace(/−/g, '-').replace(/·/g, '*').replace(/(\d)\(/g, '$1*(');
    const [izq, rel, der] = e.split(/(=|<|>)/) as [string, string, string];
    const [l, r] = [eval(izq), eval(der)]; // eslint-disable-line no-eval
    return rel === '=' ? Math.abs(l - r) < 1e-9 : rel === '<' ? l < r : l > r;
  };
  if (tipo === 'ecuacion_ambos_lados') {
    const p = publico as PublicoAmbosLados;
    const s = secreto as SecretoAmbosLados;
    expect(verdad(textoAmbosLados(p, s.x))).toBe(true);
    expect(verdad(textoAmbosLados(p, s.x + 1))).toBe(false);
    expect(s.k * s.x).toBe(s.m);
    expect(s.x).not.toBe(0);
    expect(p.representacion).toBe(nivel <= 3 ? 'balanza' : 'formal');
    if (p.representacion === 'balanza') {
      // En la balanza todo es natural y hay cajas en los dos platillos.
      for (const v of [p.a, p.b, p.c, p.d, s.x]) expect(v).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.c).toBeGreaterThanOrEqual(1);
      expect(Math.max(p.a, p.c)).toBeLessThanOrEqual(6);
    }
    if (nivel === 4) expect(s.x).toBeGreaterThan(0);
    return;
  }
  if (tipo === 'funcion') {
    const p = publico as PublicoFuncion;
    const s = secreto as SecretoFuncion;
    const salidas = (x: number) => p.flechas.filter(([a]) => a === x).length;
    const esFuncion = p.dominio.every((x) => salidas(x) === 1);
    expect(esFuncion).toBe(s.esFuncion);
    if (!s.esFuncion) {
      expect(p.dominio.filter((x) => salidas(x) !== 1)).toEqual([s.culpable]);
    } else {
      for (const [x, y] of p.flechas) expect(y).toBe(s.m * x + s.n);
    }
    // Siempre hay un elemento de llegada sin flecha (está permitido).
    expect(p.codominio.some((y) => !p.flechas.some(([, b]) => b === y))).toBe(true);
    for (const [x, y] of p.flechas) {
      expect(p.dominio).toContain(x);
      expect(p.codominio).toContain(y);
    }
    return;
  }
  if (tipo === 'afin') {
    const p = publico as PublicoAfin;
    const s = secreto as SecretoAfin;
    for (const [x, y] of p.puntos ?? []) {
      expect(y).toBe(s.m * x + s.n);
      expect(y).toBeGreaterThanOrEqual(p.ventana!.ymin);
      expect(y).toBeLessThanOrEqual(p.ventana!.ymax);
    }
    for (const f of p.tabla ?? []) expect(f.y).toBe(s.m * f.x + s.n);
    if (p.modo === 'tabla') expect(p.tabla!.some((f) => f.x === 0)).toBe(false); // hay que retroceder hasta x = 0
    if (p.modo === 'tabla') expect(p.tabla![1]!.x - p.tabla![0]!.x).not.toBe(1);
    if (p.evaluarEn !== undefined) expect(s.resultado).toBe(s.m * p.evaluarEn + s.n);
    expect(s.m).not.toBe(0);
    return;
  }
  if (tipo === 'inecuacion_lineal') {
    const p = publico as PublicoInecLineal;
    const s = secreto as SecretoGrafico;
    expect(p.texto).toBe(textoInecLineal(p));
    expect(s.borde).toBeGreaterThan(p.desde);
    expect(s.borde).toBeLessThan(p.hasta);
    const cumpleL = (x: number) => verdad(textoInecLineal(p, x).replace(/\//g, '/'));
    expect(cumpleL(s.borde)).toBe(false);
    expect(cumpleL(s.borde - 1)).toBe(s.tipo === 'izquierda');
    expect(cumpleL(s.borde + 1)).toBe(s.tipo === 'derecha');
    if (nivel <= 2) expect(coeficienteFinal(p)).toBeGreaterThan(0);
    return;
  }
  if (tipo === 'reducir') {
    const p = publico as PublicoReducir;
    const s = secreto as SecretoReducir;
    p.variables.forEach((v, i) => {
      const ts = p.terminos.filter((t) => t.variable === v);
      expect(ts.length).toBeGreaterThanOrEqual(2); // siempre hay algo que reunir
      expect(s.coefs[i]).toBe(ts.reduce((acc, t) => acc + t.coef, 0));
    });
    expect(s.constante).toBe(p.terminos.filter((t) => t.variable === '').reduce((acc, t) => acc + t.coef, 0));
    if (!p.conConstante) expect(p.terminos.some((t) => t.variable === '')).toBe(false);
    for (const t of p.terminos) expect(t.coef).not.toBe(0);
    if (nivel === 1) expect(p.terminos.every((t) => t.coef > 0)).toBe(true);
    else expect(p.terminos.some((t) => t.coef < 0)).toBe(true);
    // Términos semejantes nunca quedan juntos: hay que buscarlos.
    p.terminos.forEach((t, i) => i > 0 && expect(t.variable).not.toBe(p.terminos[i - 1]!.variable));
    return;
  }
  if (tipo === 'proporcion') {
    const p = publico as PublicoProporcion;
    const s = secreto as SecretoProporcion;
    p.filas.forEach((f, i) => {
      expect(valorProporcion(s, f.x)).toBe(s.completas[i]);
      if (f.y !== null) expect(f.y).toBe(s.completas[i]);
    });
    expect(p.filas[0]!.y).not.toBeNull();
    expect(p.filas.filter((f) => f.y === null).length).toBe(nivel <= 2 ? 1 : 2);
    expect(new Set(p.filas.map((f) => f.x)).size).toBe(p.filas.length);
    // La clasificación es la correcta según cocientes y productos de TODA la tabla.
    const cocientes = new Set(p.filas.map((f, i) => s.completas[i]! / f.x));
    const productos = new Set(p.filas.map((f, i) => s.completas[i]! * f.x));
    expect(cocientes.size === 1).toBe(s.tipo === 'directa');
    expect(productos.size === 1).toBe(s.tipo === 'inversa');
    // Con los datos visibles se puede decidir el tipo: al menos dos filas completas.
    expect(p.filas.filter((f) => f.y !== null).length).toBeGreaterThanOrEqual(2);
    return;
  }
  if (tipo === 'ecuacion_mult') {
    const p = publico as PublicoMult;
    const s = secreto as SecretoGrafico;
    expect(p.texto).toBe(textoMult(p.forma, p.a, p.b, p.letra));
    expect(s.borde).toBeGreaterThan(p.desde);
    expect(s.borde).toBeLessThan(p.hasta);
    expect(s.borde).toBeLessThanOrEqual(1000);
    const cumpleM = (x: number) => {
      const e = textoMult(p.forma, p.a, p.b, p.letra, x).replace(/·/g, '*');
      const [izq, rel, der] = e.split(/(=|<|>)/) as [string, string, string];
      const [l, r] = [eval(izq), eval(der)]; // eslint-disable-line no-eval
      return rel === '=' ? l === r : rel === '<' ? l < r : l > r;
    };
    expect(cumpleM(s.borde)).toBe(s.tipo === 'punto');
    expect(cumpleM(s.borde - 1)).toBe(s.tipo === 'izquierda');
    expect(cumpleM(s.borde + 1)).toBe(s.tipo === 'derecha');
    return;
  }
  if (tipo === 'grafico_solucion') {
    const p = publico as PublicoGrafico;
    const s = secreto as SecretoGrafico;
    expect(p.hasta - p.desde).toBe(10 * p.marca);
    expect(p.desde % p.marca).toBe(0);
    expect(s.borde).toBeGreaterThan(p.desde);
    expect(s.borde).toBeLessThan(p.hasta);
    expect(Math.max(p.a, p.b, s.borde)).toBeLessThanOrEqual(1000);
    if (nivel === 1) expect(Math.max(p.b, s.borde)).toBeLessThanOrEqual(100);
    // Con resta nunca "menor que": dejaría números sin sentido en 5° (x < a).
    if (p.op === '-') expect(relacionEfectiva(p)).not.toBe('<');
    // El tipo de solución es correcto: se comprueba reemplazando números.
    const cumpleG = (x: number) => {
      const e = p.op === '+' ? x + p.a : x - p.a;
      const [izq, der] = p.incognitaPrimero ? [e, p.b] : [p.b, e];
      return p.relacion === '=' ? izq === der : p.relacion === '<' ? izq < der : izq > der;
    };
    expect(cumpleG(s.borde)).toBe(s.tipo === 'punto');
    expect(cumpleG(s.borde - 1)).toBe(s.tipo === 'izquierda');
    expect(cumpleG(s.borde + 1)).toBe(s.tipo === 'derecha');
    if (p.contexto) expect(p.simbolo).toBe('□');
    return;
  }
  if (tipo === 'inecuacion') {
    const p = publico as PublicoInecuacion;
    const s = secreto as SecretoInecuacion;
    expect(p.hasta - p.desde).toBe(12);
    expect(p.desde).toBeGreaterThanOrEqual(0);
    expect(p.hasta).toBeLessThanOrEqual(100);
    expect(s.soluciones.length).toBeGreaterThanOrEqual(3);
    expect(s.soluciones.length).toBeLessThanOrEqual(10);
    for (let x = p.desde; x <= p.hasta; x++) expect(cumple(p.forma, p.a, p.b, x)).toBe(s.soluciones.includes(x));
    expect(s.soluciones).not.toContain(s.borde);
    if (p.forma.startsWith('x-')) expect(p.desde).toBeGreaterThanOrEqual(p.a);
    if (p.contexto) expect(p.simbolo).toBe('□');
    // Si todas las soluciones de un "<" caben en la recta, se ven todas.
    const minimo = p.forma.startsWith('x-') ? p.a : 0;
    if (!esMayor(p.forma) && s.borde - minimo <= 10) expect(p.desde).toBe(minimo);
    // El mensaje nunca dice que la solución es solo lo que se ve en la recta.
    const d = describirSoluciones(p, s.borde);
    expect(d).toContain(esMayor(p.forma) ? `mayor que ${s.borde}` : `hasta ${s.borde - 1}`);
    if (!esMayor(p.forma) && p.desde > minimo) expect(d).toContain('solo se ven algunos');
    return;
  }
  switch (tipo) {
    case 'inclinacion': {
      const p = publico as PublicoInclinacion;
      verificarObjetos(p.izquierda);
      verificarObjetos(p.derecha);
      expect(pesoPlatillo(p.izquierda)).toBeLessThanOrEqual(limiteBalanza);
      expect(pesoPlatillo(p.derecha)).toBeLessThanOrEqual(limiteBalanza);
      expect(p.usaSignos).toBe(isla >= 2);
      break;
    }
    case 'equilibrar': {
      const p = publico as PublicoEquilibrar;
      const s = secreto as SecretoEquilibrar;
      verificarObjetos(p.izquierda);
      verificarObjetos(p.derecha);
      const cajas = [...p.izquierda, ...p.derecha].filter((o) => o.tipo === 'caja');
      expect(cajas).toHaveLength(1);
      const lado = p.ladoCaja === 'izquierda' ? p.izquierda : p.derecha;
      expect(lado.some((o) => o.tipo === 'caja')).toBe(true);
      expect(s.valorCaja).toBeGreaterThanOrEqual(1);
      expect(s.valorCaja).toBeLessThanOrEqual(p.maxCaja);
      expect(pesoPlatillo(p.izquierda, s.valorCaja)).toBeLessThanOrEqual(limiteBalanza);
      expect(pesoPlatillo(p.izquierda, s.valorCaja)).toBe(pesoPlatillo(p.derecha, s.valorCaja));
      break;
    }
    case 'registrar': {
      const p = publico as PublicoRegistrar;
      verificarObjetos(p.izquierda);
      verificarObjetos(p.derecha);
      expect(pesoPlatillo(p.izquierda)).toBe(pesoPlatillo(p.derecha));
      expect(pesoPlatillo(p.izquierda)).toBeLessThanOrEqual(limiteBalanza);
      break;
    }
    case 'patron_figuras': {
      const p = publico as PublicoPatronFiguras;
      const claves = p.opciones.map((o) => o.join());
      expect(new Set(claves).size).toBe(claves.length);
      expect(p.opciones.length).toBeGreaterThanOrEqual(3);
      if (p.modo === 'posicion') {
        expect(p.posicion).toBe(p.secuencia.length);
        expect(p.secuencia[p.secuencia.length - 1]).toBeNull();
      }
      if (p.modo === 'faltante') expect(p.secuencia.filter((x) => x === null)).toHaveLength(1);
      break;
    }
    case 'patron_numerico': {
      const p = publico as PublicoPatronNumerico;
      const s = secreto as SecretoPatronNumerico;
      const maximo = isla <= 1 ? 20 : 100;
      expect(p.maximo).toBeLessThanOrEqual(maximo);
      for (const v of s.completa) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(p.maximo);
      }
      for (let i = 1; i < s.completa.length; i++) expect((s.completa[i] as number) - (s.completa[i - 1] as number)).toBe(s.paso);
      // Siempre hay dos números seguidos visibles: el paso se puede descubrir.
      const hayPar = p.secuencia.some((v, i) => v !== null && p.secuencia[i + 1] !== null && p.secuencia[i + 1] !== undefined);
      expect(hayPar).toBe(true);
      expect(p.secuencia.filter((v) => v !== null).length).toBeGreaterThanOrEqual(3);
      if (p.modo === 'regla') {
        expect(p.opcionesRegla).toHaveLength(4);
        expect(new Set(p.opcionesRegla).size).toBe(4);
        expect(p.opcionesRegla).toContain(s.regla);
      }
      break;
    }
    case 'signo': {
      const p = publico as PublicoSigno;
      for (const lado of [p.izquierda, p.derecha]) {
        expect(valorExpresion(lado)).toBeGreaterThanOrEqual(0);
        expect(valorExpresion(lado)).toBeLessThanOrEqual(limiteBalanza);
        for (const t of lado) expect(t.valor).toBeLessThanOrEqual(limiteBalanza);
      }
      if (nivel < 5) for (const t of [...p.izquierda, ...p.derecha]) expect(t.signo).toBe(1);
      if (p.representacion !== 'simbolica') expect(p.objetosIzquierda).toBeDefined();
      break;
    }
    case 'ecuacion': {
      const p = publico as PublicoEcuacion;
      const x = resolver(p.forma, p.a, p.b);
      expect(x).toBeGreaterThanOrEqual(1);
      for (const n of [p.a, p.b, x]) expect(n).toBeLessThanOrEqual(100);
      expect(textoEcuacion(p)).toContain(p.simbolo);
      if (isla === 3 && nivel <= 2) expect(p.forma.includes('-')).toBe(false);
      break;
    }
    case 'tabla100': {
      const p = publico as PublicoTabla100;
      const s = secreto as SecretoTabla100;
      for (const v of s.respuesta) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(100);
      }
      if (p.modo === 'continuar') {
        const serie = [...(p.pintadas ?? []), ...s.respuesta];
        for (let i = 1; i < serie.length; i++) expect(serie[i]! - serie[i - 1]!).toBe(s.paso);
        if (s.paso === 11 || s.paso === 9) {
          // Diagonal real: cada paso baja exactamente una fila.
          for (let i = 1; i < serie.length; i++) expect(Math.floor((serie[i]! - 1) / 10)).toBe(Math.floor((serie[i - 1]! - 1) / 10) + 1);
        }
      } else {
        const visibles = (p.trozo ?? []).flat().filter((v) => typeof v === 'number');
        expect(visibles.length).toBeGreaterThanOrEqual(1);
        expect(s.respuesta.length).toBeGreaterThanOrEqual(2);
      }
      break;
    }
    case 'problema': {
      const p = publico as PublicoProblema;
      const s = secreto as SecretoProblema;
      expect(new Set(p.opciones).size).toBe(3);
      expect(s.x).toBeGreaterThanOrEqual(1);
      expect(s.x).toBeLessThanOrEqual(isla >= 5 ? 500 : 100);
      // Solo una opción es verdadera con x: las trampas no son ecuaciones equivalentes.
      const verdaderas = p.opciones.filter((o) => {
        const e = o.replace(/□/g, String(s.x)).replace(/−/g, '-').replace(/·/g, '*');
        const [izq, rel, der] = e.split(/(=|<|>)/) as [string, string, string];
        const [l, r] = [eval(izq), eval(der)]; // eslint-disable-line no-eval
        return rel === '=' ? l === r : rel === '<' ? l < r : l > r;
      });
      // En inecuaciones, la respuesta es el mayor (o menor) natural que cumple.
      const correcta = p.opciones[s.correcta]!;
      if (/[<>]/.test(correcta)) {
        const cumpleCon = (x: number) => {
          const e = correcta.replace(/□/g, String(x)).replace(/·/g, '*');
          const [izq, rel, der] = e.split(/(<|>)/) as [string, string, string];
          return rel === '<' ? eval(izq) < eval(der) : eval(izq) > eval(der); // eslint-disable-line no-eval
        };
        expect(cumpleCon(s.x)).toBe(true);
        expect(cumpleCon(correcta.includes('<') ? s.x + 1 : s.x - 1)).toBe(false);
      }
      expect(verdaderas).toEqual([p.opciones[s.correcta]]);
      expect(p.texto).not.toMatch(/algunas (lápices|stickers)/);
      break;
    }
    case 'verdadero_falso': {
      const p = publico as PublicoVerdaderoFalso;
      const s = secreto as SecretoVerdaderoFalso;
      expect(s.valores).toContain(true);
      expect(s.valores).toContain(false);
      p.afirmaciones.forEach((a, i) => {
        expect(valorExpresion(a.izquierda) === valorExpresion(a.derecha)).toBe(s.valores[i]);
        for (const lado of [a.izquierda, a.derecha]) {
          expect(valorExpresion(lado)).toBeGreaterThanOrEqual(0);
          expect(valorExpresion(lado)).toBeLessThanOrEqual(limiteBalanza);
        }
      });
      break;
    }
  }
}

describe('equilibrio de resultados y diagnósticos', () => {
  it('inclinación: los tres resultados aparecen con frecuencia similar', () => {
    const conteo: Record<string, number> = { izquierda: 0, equilibrio: 0, derecha: 0 };
    for (let k = 0; k < 6000; k++) {
      const item = MECANICAS.inclinacion.generar((k % 5) + 1, crearAzar(`dist-${k}`), { isla: 1, andamiaje: false });
      conteo[(item.secreto as { correcta: string }).correcta]! += 1;
    }
    for (const c of Object.values(conteo)) expect(c).toBeGreaterThan(1600);
  });

  it('signo: <, = y > aparecen con frecuencia similar', () => {
    const conteo: Record<string, number> = { '<': 0, '=': 0, '>': 0 };
    for (let k = 0; k < 6000; k++) {
      const item = MECANICAS.signo.generar((k % 5) + 1, crearAzar(`s-${k}`), { isla: 2, andamiaje: false });
      conteo[(item.secreto as { correcto: string }).correcto]! += 1;
    }
    for (const c of Object.values(conteo)) expect(c).toBeGreaterThan(1500);
  });

  it('equilibrar detecta el error "el igual es el resultado" (8 + 5 = □ + 7 → 13)', () => {
    let detectados = 0;
    for (let k = 0; k < 500; k++) {
      const item = MECANICAS.equilibrar.generar(1, crearAzar(`eq-${k}`), { isla: 2, andamiaje: false });
      const p = item.publico as PublicoEquilibrar;
      const otro = p.ladoCaja === 'izquierda' ? p.derecha : p.izquierda;
      const r = MECANICAS.equilibrar.pesar!(p, item.secreto, pesoPlatillo(otro));
      if (r.diagnostico === 'resultado_del_otro_lado') detectados++;
    }
    expect(detectados).toBe(500);
  });

  it('verdadero/falso: explica por qué 8 = 5 + 3 es verdadera', () => {
    for (let k = 0; k < 300; k++) {
      const item = MECANICAS.verdadero_falso.generar(1, crearAzar(`vf-${k}`), { isla: 2, andamiaje: false });
      const s = item.secreto as SecretoVerdaderoFalso & { formas: string[] };
      const i = s.formas.indexOf('invertida');
      if (i < 0) continue;
      const respuesta = s.valores.map((v, j) => (j === i ? false : v));
      const ev = MECANICAS.verdadero_falso.evaluar(item.publico, item.secreto, respuesta);
      expect(ev.diagnostico).toBe('vf_invertida');
      expect(ev.mensaje).toContain('verdadera');
      return;
    }
    throw new Error('no apareció ninguna igualdad invertida');
  });

  it('patrones de figuras: elegir el grupo corto o largo se diagnostica', () => {
    for (let k = 0; k < 200; k++) {
      const item = MECANICAS.patron_figuras.generar(4, crearAzar(`pf-${k}`), { isla: 1, andamiaje: false });
      const s = item.secreto as { tipoOpcion: string[] };
      const corto = s.tipoOpcion.indexOf('corto');
      const largo = s.tipoOpcion.indexOf('largo');
      expect(MECANICAS.patron_figuras.evaluar(item.publico, item.secreto, corto).diagnostico).toBe('patron_nucleo_corto');
      expect(MECANICAS.patron_figuras.evaluar(item.publico, item.secreto, largo).diagnostico).toBe('patron_nucleo_largo');
    }
  });
});


describe('diagnósticos de la isla 5', () => {
  const pub: PublicoSucesion = {
    modo: 'figuras',
    figura: 'cuadrados',
    terminos: [
      { posicion: 1, valor: 4 },
      { posicion: 2, valor: 7 },
      { posicion: 3, valor: 10 },
    ],
    pregunta: { tipo: 'termino', posicion: 20 },
    unidad: 'palitos',
  };
  const sec: SecretoSucesion = { tipoRegla: 'lineal', a: 4, d: 3, e: 0, respuesta: [61] };
  const diag = (valores: number[]) => sucesion.evaluar(pub, sec, { valores }).diagnostico;

  it('cuadrados de palitos: figura 20', () => {
    expect(sucesion.evaluar(pub, sec, { valores: [61] }).correcto).toBe(true);
    expect(diag([80])).toBe('sucesion_proporcional'); // 4 × 20
    expect(diag([60])).toBe('sucesion_sin_inicio'); // 3 × 20
    expect(diag([64])).toBe('sucesion_desfase'); // figura 21
    expect(diag([58])).toBe('sucesion_desfase'); // figura 19
  });

  it('sucesiones no lineales: sumar siempre lo mismo', () => {
    const p: PublicoSucesion = {
      modo: 'numerica',
      terminos: [1, 2, 4, 8, 16].map((valor, i) => ({ posicion: i + 1, valor })),
      pregunta: { tipo: 'siguientes', cantidad: 2 },
      unidad: '',
    };
    const s: SecretoSucesion = { tipoRegla: 'doble', a: 1, d: 0, e: 0, respuesta: [32, 64] };
    expect(sucesion.evaluar(p, s, { valores: [32, 64] }).correcto).toBe(true);
    expect(sucesion.evaluar(p, s, { valores: [24, 32] }).diagnostico).toBe('sucesion_aditiva');
  });

  it('graficar: punto, rayo y dirección', () => {
    const p: PublicoGrafico = { incognitaPrimero: true, op: '+', relacion: '<', a: 300, b: 700, simbolo: '□', desde: 0, hasta: 1000, marca: 100 };
    const s: SecretoGrafico = { borde: 400, tipo: 'izquierda' };
    const d = (valor: number, tipo: 'punto' | 'izquierda' | 'derecha') => graficoSolucion.evaluar(p, s, { valor, tipo });
    expect(d(400, 'izquierda').correcto).toBe(true);
    expect(d(400, 'punto').diagnostico).toBe('inecuacion_igualdad');
    expect(d(400, 'derecha').diagnostico).toBe('inecuacion_direccion');
    expect(d(1000, 'izquierda').diagnostico).toBe('operacion_inversa');
    const pe: PublicoGrafico = { ...p, relacion: '=' };
    expect(graficoSolucion.evaluar(pe, { borde: 400, tipo: 'punto' }, { valor: 400, tipo: 'derecha' }).diagnostico).toBe('ecuacion_rayo');
  });
});


describe('diagnósticos de la isla 6', () => {
  const pub: PublicoExpresion = { modo: 'tabla', letra: 'n', filas: [1, 2, 3, 4].map((n) => ({ n, valor: 3 * n + 1 })) };
  const sec: SecretoExpresion = { a: 3, b: 1, signo: '+' };
  const d = (a: number, b: number, signo: '+' | '-' = '+') => expresion.evaluar(pub, sec, { a, b, signo }).diagnostico;

  it('fórmulas: 3 · n + 1', () => {
    expect(expresion.evaluar(pub, sec, { a: 3, b: 1, signo: '+' }).correcto).toBe(true);
    expect(d(1, 3)).toBe('formula_recursiva'); // n + 3
    expect(d(4, 0)).toBe('formula_proporcional'); // 4 · n
    expect(d(3, 0)).toBe('formula_sin_constante');
    expect(d(3, 2)).toBe('formula_constante');
    const conCalculo = { ...pub, evaluarEn: 50 };
    const s2 = { ...sec, resultado: 151 };
    expect(expresion.evaluar(conCalculo, s2, { a: 3, b: 1, signo: '+', resultado: 151 }).correcto).toBe(true);
    expect(expresion.evaluar(conCalculo, s2, { a: 3, b: 1, signo: '+', resultado: 200 }).diagnostico).toBe('formula_evaluacion');
  });

  it('ecuaciones de dos pasos: 3x + 5 = 26', () => {
    const p: PublicoDosPasos = { forma: 'ax+b=c', a: 3, b: 5, c: 26, letra: 'x', representacion: 'formal' };
    const s: SecretoDosPasos = { x: 7, ax: 21 };
    const e = (intermedio: number, x: number) => ecuacionDosPasos.evaluar(p, s, { intermedio, x });
    expect(e(21, 7).correcto).toBe(true);
    expect(e(31, 31).diagnostico).toBe('operacion_inversa'); // sumó 5
    expect(e(21, 21).diagnostico).toBe('ecuacion_sin_dividir');
    expect(ecuacionDosPasos.evaluar({ ...p, c: 27, b: 6 }, { x: 7, ax: 21 }, { intermedio: 21, x: 3 }).diagnostico).toBe('ecuacion_orden'); // 27 ÷ 3 − 6
    expect(e(20, 7).correcto).toBe(false); // el paso intermedio también cuenta
  });
});


describe('diagnósticos de la isla 7', () => {
  it('reducir: 3x + 2y − x + 4y', () => {
    const p: PublicoReducir = {
      terminos: [
        { coef: 3, variable: 'x' },
        { coef: 2, variable: 'y' },
        { coef: -1, variable: 'x' },
        { coef: 4, variable: 'y' },
      ],
      variables: ['x', 'y'],
      conConstante: false,
      pictorico: true,
    };
    const s: SecretoReducir = { coefs: [2, 6], constante: 0 };
    const d = (coefs: number[]) => reducir.evaluar(p, s, { coefs }).diagnostico;
    expect(reducir.evaluar(p, s, { coefs: [2, 6] }).correcto).toBe(true);
    expect(d([8, 0])).toBe('reducir_mezcla'); // 8x (junta todo)
    expect(d([4, 6])).toBe('reducir_signo'); // ignora el menos
    const p2: PublicoReducir = { ...p, terminos: [{ coef: 2, variable: 'x' }, { coef: 1, variable: 'y' }, { coef: -5, variable: 'x' }, { coef: 1, variable: 'y' }] };
    expect(reducir.evaluar(p2, { coefs: [-3, 2], constante: 0 }, { coefs: [3, 2] }).diagnostico).toBe('reducir_signo_resultado');
  });

  it('proporción: aditiva, inversa como directa y afín', () => {
    const directa: PublicoProporcion = { filas: [{ x: 4, y: 6 }, { x: 6, y: null }, { x: 8, y: 12 }], columnaX: 'x', columnaY: 'y' };
    const sd: SecretoProporcion = { tipo: 'directa', k: 1.5, c: 0, completas: [6, 9, 12] };
    expect(proporcion.evaluar(directa, sd, { tipo: 'directa', valores: [9] }).correcto).toBe(true);
    expect(proporcion.evaluar(directa, sd, { tipo: 'directa', valores: [8] }).diagnostico).toBe('proporcion_aditiva');
    const inversa: PublicoProporcion = { filas: [{ x: 2, y: 12 }, { x: 4, y: null }, { x: 6, y: 4 }], columnaX: 'x', columnaY: 'y' };
    const si: SecretoProporcion = { tipo: 'inversa', k: 24, c: 0, completas: [12, 6, 4] };
    expect(proporcion.evaluar(inversa, si, { tipo: 'directa', valores: [24] }).diagnostico).toBe('proporcion_inversa_directa');
    const afin: PublicoProporcion = { filas: [{ x: 1, y: 5 }, { x: 2, y: 7 }, { x: 3, y: null }], columnaX: 'x', columnaY: 'y' };
    const sa: SecretoProporcion = { tipo: 'ninguna', k: 2, c: 3, completas: [5, 7, 9] };
    expect(proporcion.evaluar(afin, sa, { tipo: 'directa', valores: [9] }).diagnostico).toBe('proporcion_afin');
  });

  it('ecuaciones de lava: operación inversa', () => {
    const p: PublicoMult = { forma: 'x/a>b', a: 4, b: 6, letra: 'x', texto: 'x/4 > 6', desde: 0, hasta: 50, marca: 5 };
    expect(ecuacionMult.evaluar(p, { borde: 24, tipo: 'derecha' }, { valor: 24, tipo: 'derecha' }).correcto).toBe(true);
    const q: PublicoMult = { forma: 'ax=b', a: 3, b: 21, letra: 'x', texto: '3x = 21', desde: 0, hasta: 50, marca: 5 };
    expect(ecuacionMult.evaluar(q, { borde: 7, tipo: 'punto' }, { valor: 63, tipo: 'punto' }).diagnostico).toBe('operacion_inversa');
  });
});


describe('diagnósticos de la isla 8', () => {
  it('incógnita a ambos lados: 5x + 3 = 2x + 15', () => {
    const p: PublicoAmbosLados = { forma: 'ambos', a: 5, b: 3, c: 2, d: 15, letra: 'x', representacion: 'formal' };
    const s: SecretoAmbosLados = { x: 4, k: 3, m: 12 };
    const e = (k: number, m: number, x: number) => ecuacionAmbosLados.evaluar(p, s, { k, m, x });
    expect(e(3, 12, 4).correcto).toBe(true);
    expect(e(-3, -12, 4).correcto).toBe(true); // también vale dejar las x a la derecha
    expect(e(7, 12, 12).diagnostico).toBe('ambos_lados_suma');
    expect(e(3, 18, 6).diagnostico).toBe('operacion_inversa');
    expect(e(3, 12, 12).diagnostico).toBe('ecuacion_sin_dividir');
    const q: PublicoAmbosLados = { forma: 'parentesis', a: 3, b: 4, c: 27, d: 0, letra: 'x', representacion: 'formal' };
    expect(ecuacionAmbosLados.evaluar(q, { x: 5, k: 3, m: 15 }, { k: 3, m: 23, x: 23 }).diagnostico).toBe('parentesis_distributiva');
    expect(ecuacionAmbosLados.evaluar(q, { x: 5, k: 3, m: 15 }, { k: 1, m: 5, x: 5 }).correcto).toBe(true); // dividir primero: x + 4 = 9
  });

  it('inecuación con coeficiente negativo: −2x + 5 < 11', () => {
    const p: PublicoInecLineal = { forma: 'ax+b?c', a: -2, b: 5, c: 11, d: 0, relacion: '<', letra: 'x', texto: '−2x + 5 < 11', desde: -10, hasta: 10, marca: 2, negativos: true };
    const s: SecretoGrafico = { borde: -3, tipo: 'derecha' };
    expect(inecuacionLineal.evaluar(p, s, { valor: -3, tipo: 'derecha' }).correcto).toBe(true);
    expect(inecuacionLineal.evaluar(p, s, { valor: -3, tipo: 'izquierda' }).diagnostico).toBe('inecuacion_no_invierte');
    expect(inecuacionLineal.evaluar(p, s, { valor: 3, tipo: 'derecha' }).diagnostico).toBe('signo_despeje');
  });

  it('funciones: es / no es función', () => {
    const p: PublicoFuncion = { dominio: [1, 2, 3], codominio: [5, 8, 11, 20], flechas: [[1, 5], [2, 8], [3, 11]] };
    const s: SecretoFuncion = { esFuncion: true, m: 3, n: 2 };
    expect(funcion.evaluar(p, s, { esFuncion: true, m: 3, n: 2 }).correcto).toBe(true);
    expect(funcion.evaluar(p, s, { esFuncion: false, culpable: 1 }).diagnostico).toBe('funcion_si_es');
    const q: PublicoFuncion = { ...p, flechas: [...p.flechas, [2, 20]] };
    expect(funcion.evaluar(q, { esFuncion: false, culpable: 2, m: 3, n: 2 }, { esFuncion: false, culpable: 2 }).correcto).toBe(true);
    expect(funcion.evaluar(q, { esFuncion: false, culpable: 2, m: 3, n: 2 }, { esFuncion: true, m: 3, n: 2 }).diagnostico).toBe('funcion_no_es');
  });

  it('función afín desde una tabla con saltos de 2', () => {
    const p: PublicoAfin = { modo: 'tabla', tabla: [1, 3, 5, 9].map((x) => ({ x, y: 3 * x + 4 })), columnas: ['x', 'f(x)'] };
    const s: SecretoAfin = { m: 3, n: 4 };
    expect(afin.evaluar(p, s, { m: 3, n: 4 }).correcto).toBe(true);
    expect(afin.evaluar(p, s, { m: 6, n: 1 }).diagnostico).toBe('afin_pendiente_paso');
    expect(afin.evaluar(p, s, { m: 3, n: 7 }).diagnostico).toBe('afin_intercepto');
    expect(afin.evaluar(p, s, { m: -3, n: 4 }).diagnostico).toBe('afin_signo');
  });
});
