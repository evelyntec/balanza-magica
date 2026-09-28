import { describe, expect, it } from 'vitest';
import { ETAPAS, buscarEtapa } from '../src/curriculo';
import {
  aplicarResultado,
  clasificarResultado,
  estrellasDe,
  factorRepeticion,
  insigniasGanadas,
  estadisticasIniciales,
  mapaDesbloqueo,
  multiplicadorRacha,
  nivelInicialPara,
  nuevaPartida,
  puntosItem,
  rangoDe,
  type EstadoPartida,
  type Progreso,
} from '../src/reglas';
import type { Resultado } from '../src/tipos';

const etapa11 = buscarEtapa('1-1')!;
const jefe1 = buscarEtapa('1-J')!;

function jugar(estado: EstadoPartida, etapa = etapa11, resultados: Resultado[]) {
  let e = estado;
  let racha = 0;
  for (const r of resultados) {
    const ef = aplicarResultado(e, etapa, { resultado: r, nivel: e.nivel, pistas: 0, tipo: 'inclinacion' }, racha);
    e = ef.estado;
    racha = ef.racha;
  }
  return e;
}

describe('clasificación de resultados', () => {
  it('elección: acierto sin pistas es perfecto, error es fallido', () => {
    expect(clasificarResultado({ modo: 'eleccion', correcto: true, intentos: 1, pistas: 0, andamiaje: false })).toBe('perfecto');
    expect(clasificarResultado({ modo: 'eleccion', correcto: false, intentos: 1, pistas: 0, andamiaje: false })).toBe('fallido');
  });
  it('pesadas: 1 → perfecto, 2 → logrado, 3-4 → con ayuda', () => {
    const r = (intentos: number) => clasificarResultado({ modo: 'pesada', correcto: true, intentos, pistas: 0, andamiaje: false });
    expect([r(1), r(2), r(3), r(4)]).toEqual(['perfecto', 'logrado', 'con_ayuda', 'con_ayuda']);
  });
  it('escrita: acertar en el segundo intento es con ayuda', () => {
    expect(clasificarResultado({ modo: 'escrita', correcto: true, intentos: 2, pistas: 0, andamiaje: false })).toBe('con_ayuda');
  });
  it('las pistas y el andamiaje bajan el resultado', () => {
    const base = { modo: 'eleccion' as const, correcto: true, intentos: 1, andamiaje: false };
    expect(clasificarResultado({ ...base, pistas: 1 })).toBe('logrado');
    expect(clasificarResultado({ ...base, pistas: 2 })).toBe('con_ayuda');
    expect(clasificarResultado({ ...base, pistas: 3 })).toBe('con_ayuda');
    expect(clasificarResultado({ ...base, pistas: 0, andamiaje: true })).toBe('logrado');
  });
});

describe('puntos, rachas y monedas', () => {
  it('multiplicadores de racha', () => {
    expect([0, 2, 3, 4, 5, 9, 10, 50].map(multiplicadorRacha)).toEqual([1, 1, 1.5, 1.5, 2, 2, 3, 3]);
  });
  it('puntos base por nivel y calidad', () => {
    expect(puntosItem(1, 'perfecto', 0, 1)).toEqual({ puntos: 10, monedas: 2 });
    expect(puntosItem(5, 'perfecto', 10, 1)).toEqual({ puntos: 150, monedas: 2 });
    expect(puntosItem(3, 'logrado', 0, 1)).toEqual({ puntos: 18, monedas: 1 });
    expect(puntosItem(3, 'fallido', 10, 1).puntos).toBe(0);
  });
  it('repetir una etapa ya dominada da muchos menos puntos y ninguna moneda', () => {
    expect(factorRepeticion(0)).toBe(1);
    expect(factorRepeticion(2)).toBe(0.5);
    expect(factorRepeticion(3)).toBe(0.2);
    expect(puntosItem(5, 'perfecto', 0, factorRepeticion(3))).toEqual({ puntos: 10, monedas: 0 });
  });
});

describe('adaptatividad', () => {
  it('sube de nivel cada 2 éxitos seguidos y baja tras 2 fallos, activando andamiaje', () => {
    const inicio = nuevaPartida(etapa11, { factor: 1 });
    expect(inicio.nivel).toBe(1);
    const arriba = jugar(inicio, etapa11, ['perfecto', 'perfecto', 'perfecto', 'logrado']);
    expect(arriba.nivel).toBe(3);
    const abajo = jugar(arriba, etapa11, ['fallido', 'fallido']);
    expect(abajo.nivel).toBe(2);
    expect(abajo.andamiaje).toBe(true);
    const recupera = jugar(abajo, etapa11, ['logrado']);
    expect(recupera.andamiaje).toBe(false);
  });
  it('nunca baja de 1 ni sube de 5', () => {
    expect(jugar(nuevaPartida(etapa11, { factor: 1 }), etapa11, Array(10).fill('fallido')).nivel).toBe(1);
    expect(jugar(nuevaPartida(etapa11, { factor: 1 }), etapa11, Array(9).fill('perfecto')).nivel).toBe(5);
  });
  it('los jefes no bajan de nivel 2', () => {
    const e = jugar(nuevaPartida(jefe1, { factor: 1 }), jefe1, Array(12).fill('fallido'));
    expect(e.nivel).toBe(2);
  });
});

describe('fin de etapa y estrellas', () => {
  it('una etapa normal se supera con 10 logros; jugar perfecto da 3 estrellas', () => {
    const e = jugar(nuevaPartida(etapa11, { factor: 1 }), etapa11, Array(10).fill('perfecto'));
    expect(e.terminada && e.superada).toBe(true);
    expect(e.nivelMaxAlcanzado).toBe(5);
    expect(estrellasDe(e, etapa11)).toBe(3);
  });
  it('adivinar no conviene: con muchos errores se obtiene 1 estrella', () => {
    const secuencia: Resultado[] = [];
    for (let i = 0; i < 10; i++) secuencia.push('fallido', 'fallido', 'perfecto');
    const e = jugar(nuevaPartida(etapa11, { factor: 1 }), etapa11, secuencia);
    expect(e.superada).toBe(true);
    expect(estrellasDe(e, etapa11)).toBe(1);
  });
  it('sin llegar a la meta en 40 ejercicios, la etapa no se supera', () => {
    const e = jugar(nuevaPartida(etapa11, { factor: 1 }), etapa11, Array(40).fill('fallido'));
    expect(e.terminada).toBe(true);
    expect(e.superada).toBe(false);
    expect(estrellasDe(e, etapa11)).toBe(0);
  });
  it('jefe: perfecto quita 2 de vida, logrado 1 y fallar lo cura', () => {
    let e = nuevaPartida(jefe1, { factor: 1 });
    expect(e.vidaJefe).toBe(10);
    e = jugar(e, jefe1, ['perfecto']);
    expect(e.vidaJefe).toBe(8);
    e = jugar(e, jefe1, ['fallido']);
    expect(e.vidaJefe).toBe(9);
    e = jugar(e, jefe1, Array(5).fill('perfecto'));
    expect(e.vidaJefe).toBe(0);
    expect(e.superada).toBe(true);
  });
});

describe('rangos', () => {
  it('los rangos suben con los puntos', () => {
    expect(rangoDe(0).actual.id).toBe('aprendiz');
    expect(rangoDe(499).actual.id).toBe('aprendiz');
    expect(rangoDe(500).actual.id).toBe('explorador');
    expect(rangoDe(20_000).actual.id).toBe('leyenda');
    expect(rangoDe(20_000).siguiente).toBeNull();
    expect(rangoDe(1250).progreso).toBeCloseTo(0.5);
  });
});

describe('desbloqueo', () => {
  const superada = { estrellas: 1, mejorPuntaje: 100, superada: true, veces: 1, nivelMax: 3 };

  it('1° básico: solo la primera etapa de la isla 1 al comenzar', () => {
    const mapa = mapaDesbloqueo(1, {});
    expect(mapa[0]!.accesible).toBe(true);
    expect(mapa[0]!.etapas.map((e) => e.accesible)).toEqual([true, false, false, false, false]);
    expect(mapa[1]!.accesible).toBe(false);
  });

  it('las etapas se abren en orden y el jefe al superar las cuatro', () => {
    const p: Progreso = { '1-1': superada, '1-2': superada, '1-3': superada };
    expect(mapaDesbloqueo(1, p)[0]!.etapas.map((e) => e.accesible)).toEqual([true, true, true, true, false]);
    p['1-4'] = superada;
    expect(mapaDesbloqueo(1, p)[0]!.etapas.map((e) => e.accesible)).toEqual([true, true, true, true, true]);
  });

  it('vencer al jefe abre la isla siguiente', () => {
    const p: Progreso = Object.fromEntries(ETAPAS.filter((e) => e.isla === 1).map((e) => [e.id, superada]));
    expect(mapaDesbloqueo(1, p)[1]!.accesible).toBe(true);
  });

  it('en cursos superiores las islas anteriores quedan abiertas como repaso', () => {
    const mapa = mapaDesbloqueo(5, {});
    expect(mapa[0]!.etapas.every((e) => e.accesible)).toBe(true);
    expect(mapa[1]!.etapas.every((e) => e.accesible)).toBe(true);
    expect(mapa[2]!.accesible).toBe(true); // isla 3 (Río) disponible
    expect(mapa[3]!.accesible).toBe(true); // isla 4 (Montaña) disponible
    expect(mapa[4]!.accesible).toBe(true); // isla 5 (Desierto): la propia del curso
    expect(mapa[4]!.etapas.map((e) => e.accesible)).toEqual([true, false, false, false, false]);
    expect(mapa[5]!.accesible).toBe(false); // isla 6 aún no está construida
  });

  it('nivel inicial: repaso parte en 3 y repetir parte cerca del máximo logrado', () => {
    expect(nivelInicialPara(etapa11, 1, undefined)).toBe(1);
    expect(nivelInicialPara(etapa11, 4, undefined)).toBe(3);
    expect(nivelInicialPara(etapa11, 1, { ...superada, nivelMax: 5 })).toBe(4);
  });
});

describe('insignias', () => {
  it('se ganan una sola vez', () => {
    const s = { ...estadisticasIniciales(), itemsExitosos: 1, mejorRacha: 6 };
    const primeras = insigniasGanadas(s, {}, []).map((i) => i.id);
    expect(primeras).toEqual(expect.arrayContaining(['primer_paso', 'racha_5']));
    expect(insigniasGanadas(s, {}, primeras)).toHaveLength(0);
  });
});
