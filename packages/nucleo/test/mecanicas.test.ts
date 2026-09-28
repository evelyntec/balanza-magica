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
import { resolver, textoEcuacion, type PublicoEcuacion, type PublicoProblema, type PublicoTabla100, type SecretoProblema, type SecretoTabla100 } from '../src/mecanicas';
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
          expect(n).toBeGreaterThanOrEqual(0);
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
      if (nivel <= 2) expect(p.forma.includes('-')).toBe(false);
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
      expect(s.x).toBeLessThanOrEqual(100);
      // Solo una opción es verdadera con x: las trampas no son ecuaciones equivalentes.
      const verdaderas = p.opciones.filter((o) => {
        const [izq, der] = o.replace(/□/g, String(s.x)).replace(/−/g, '-').split('=') as [string, string];
        return eval(izq) === eval(der); // eslint-disable-line no-eval
      });
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
