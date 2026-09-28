import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { crearAzar } from '../src/azar';
import { ANGULO_MAXIMO, ANGULO_MINIMO, anguloBrazo, inclinacionDe, magnitudDe, pesoPlatillo, textoExpresion, suma, mas, menos, valorExpresion } from '../src/balanza';
import * as F from '../src/fraccion';

describe('azar reproducible', () => {
  it('la misma semilla produce la misma secuencia', () => {
    const a = crearAzar('semilla-1');
    const b = crearAzar('semilla-1');
    for (let i = 0; i < 1000; i++) expect(a.siguiente()).toBe(b.siguiente());
  });

  it('semillas distintas producen secuencias distintas', () => {
    const a = crearAzar('x');
    const b = crearAzar('y');
    const iguales = Array.from({ length: 50 }, () => a.siguiente() === b.siguiente()).filter(Boolean).length;
    expect(iguales).toBeLessThan(3);
  });

  it('entero respeta el rango y cubre todos los valores', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: -50, max: 50 }), fc.integer({ min: 0, max: 20 }), (semilla, min, ancho) => {
        const azar = crearAzar(semilla);
        for (let i = 0; i < 50; i++) {
          const v = azar.entero(min, min + ancho);
          if (!Number.isInteger(v) || v < min || v > min + ancho) return false;
        }
        return true;
      }),
    );
    const azar = crearAzar('cobertura');
    const vistos = new Set<number>();
    for (let i = 0; i < 2000; i++) vistos.add(azar.entero(1, 6));
    expect([...vistos].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('distribución aproximadamente uniforme', () => {
    const azar = crearAzar('uniforme');
    const conteo = [0, 0, 0];
    for (let i = 0; i < 30_000; i++) conteo[azar.entero(0, 2)]! += 1;
    for (const c of conteo) expect(Math.abs(c - 10_000)).toBeLessThan(500);
  });

  it('barajar conserva los elementos', () => {
    fc.assert(
      fc.property(fc.string(), fc.array(fc.integer()), (semilla, lista) => {
        const b = crearAzar(semilla).barajar(lista);
        return JSON.stringify([...b].sort()) === JSON.stringify([...lista].sort());
      }),
    );
  });

  it('rechaza rangos inválidos y listas vacías', () => {
    const azar = crearAzar('e');
    expect(() => azar.entero(5, 1)).toThrow();
    expect(() => azar.elegir([])).toThrow();
  });
});

describe('fracciones exactas', () => {
  const frac = fc.tuple(fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: 1, max: 1000 })).map(([n, d]) => F.fraccion(n, d));

  it('siempre están simplificadas y con denominador positivo', () => {
    fc.assert(
      fc.property(fc.integer({ min: -10_000, max: 10_000 }), fc.integer({ min: -10_000, max: 10_000 }).filter((d) => d !== 0), (n, d) => {
        const f = F.fraccion(n, d);
        const mcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mcd(b, a % b));
        return f.den > 0 && mcd(f.num, f.den) === 1;
      }),
    );
  });

  it('propiedades algebraicas', () => {
    fc.assert(
      fc.property(frac, frac, frac, (a, b, c) => {
        const conmutativa = F.iguales(F.sumar(a, b), F.sumar(b, a));
        const asociativa = F.iguales(F.sumar(F.sumar(a, b), c), F.sumar(a, F.sumar(b, c)));
        const inversa = F.iguales(F.restar(F.sumar(a, b), b), a);
        const distributiva = F.iguales(F.multiplicar(a, F.sumar(b, c)), F.sumar(F.multiplicar(a, b), F.multiplicar(a, c)));
        return conmutativa && asociativa && inversa && distributiva;
      }),
    );
  });

  it('0,1 + 0,2 = 0,3 exactamente', () => {
    const r = F.sumar(F.desdeTexto('0,1')!, F.desdeTexto('0.2')!);
    expect(F.iguales(r, F.fraccion(3, 10))).toBe(true);
  });

  it('interpreta y escribe textos', () => {
    expect(F.aTexto(F.desdeTexto('−6/8')!)).toBe('−3/4');
    expect(F.desdeTexto('3/0')).toBeNull();
    expect(F.desdeTexto('hola')).toBeNull();
    expect(F.comparar(F.fraccion(1, 3), F.fraccion(1, 4))).toBe(1);
    expect(() => F.dividir(F.UNO, F.CERO)).toThrow();
  });
});

describe('física de la balanza', () => {
  it('siempre baja el lado más pesado', () => {
    fc.assert(
      fc.property(fc.nat(40), fc.nat(40), (l, r) => {
        const angulo = anguloBrazo(l, r);
        const i = inclinacionDe(l, r);
        if (l === r) return angulo === 0 && i === 'equilibrio';
        if (l > r) return angulo < 0 && i === 'izquierda';
        return angulo > 0 && i === 'derecha';
      }),
    );
  });

  it('una diferencia de 1 se nota y el ángulo crece con la diferencia hasta topar', () => {
    expect(Math.abs(anguloBrazo(5, 6))).toBeGreaterThanOrEqual(ANGULO_MINIMO);
    let anterior = 0;
    for (let d = 1; d <= 30; d++) {
      const a = Math.abs(anguloBrazo(0, d));
      expect(a).toBeGreaterThanOrEqual(anterior);
      expect(a).toBeLessThanOrEqual(ANGULO_MAXIMO);
      anterior = a;
    }
    expect(Math.abs(anguloBrazo(0, 50))).toBe(ANGULO_MAXIMO);
  });

  it('el ángulo depende solo de la diferencia (objetos iguales pesan igual)', () => {
    fc.assert(fc.property(fc.nat(20), fc.nat(20), fc.nat(20), (l, r, k) => anguloBrazo(l, r) === anguloBrazo(l + k, r + k)));
  });

  it('peso de platillos y magnitudes', () => {
    expect(pesoPlatillo([{ tipo: 'cubos', cantidad: 3 }, { tipo: 'pesa', valor: 4 }, { tipo: 'caja' }], 5)).toBe(12);
    expect(magnitudDe(0)).toBe('nada');
    expect(magnitudDe(-2)).toBe('poco');
    expect(magnitudDe(4)).toBe('medio');
    expect(magnitudDe(9)).toBe('mucho');
  });

  it('expresiones con signos tipográficos', () => {
    expect(textoExpresion([mas(8), menos(3), mas(2)])).toBe('8 − 3 + 2');
    expect(valorExpresion([mas(8), menos(3), mas(2)])).toBe(7);
    expect(textoExpresion(suma(4, 5))).toBe('4 + 5');
  });
});
