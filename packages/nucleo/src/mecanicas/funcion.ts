/**
 * "La máquina de funciones" — diagramas sagitales (de Venn).
 * OA MA08-7: noción de función por medio de un cambio lineal: tablas,
 * metáforas de máquinas, reglas entre x e y y representaciones gráficas
 * (plano cartesiano, diagramas de Venn).
 *
 * Primero se decide si la relación ES función: cada elemento de la izquierda
 * debe tener exactamente una flecha. Si no lo es, se toca el elemento que
 * falla (no se puede adivinar con un sí o un no). Si lo es, se escribe su
 * regla f(x) = mx + n. Errores típicos (Vinner, 1983; Sfard, 1992): creer que
 * todo el conjunto de llegada debe usarse y aceptar un elemento con dos
 * imágenes.
 */

import type { Azar } from '../azar';
import { lineal, num, numP } from './lineal';
import { esEnteroEn, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoFuncion {
  dominio: number[];
  codominio: number[];
  flechas: [number, number][];
  evaluarEn?: number;
}

export interface SecretoFuncion {
  esFuncion: boolean;
  /** Elemento que tiene dos imágenes o ninguna. */
  culpable?: number;
  m: number;
  n: number;
  resultado?: number;
}

export type RespuestaFuncion = { esFuncion: true; m: number; n: number; resultado?: number } | { esFuncion: false; culpable: number };

export const textoRegla = (m: number, n: number) => `f(x) = ${lineal(m, n, 'x')}`;

export const funcion: Mecanica<PublicoFuncion, SecretoFuncion, RespuestaFuncion> = {
  tipo: 'funcion',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoFuncion, SecretoFuncion> {
    for (let intento = 0; intento < 500; intento++) {
      const m = nivel <= 2 ? azar.entero(2, 5) : azar.elegir([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
      const n = nivel === 1 ? 0 : nivel === 2 ? azar.entero(1, 9) : azar.entero(-9, 9);
      const candidatos = nivel === 1 ? [1, 2, 3, 4, 5] : nivel === 2 ? [0, 1, 2, 3, 4, 5, 6] : [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
      const dominio = azar
        .barajar(candidatos)
        .slice(0, 4)
        .sort((a, b) => a - b);
      const f = (x: number) => m * x + n;
      const esFuncion = !azar.probabilidad(0.35);
      let flechas: [number, number][] = dominio.map((x) => [x, f(x)]);
      let culpable: number | undefined;
      const imagenes = new Set(flechas.map(([, y]) => y));
      // Un elemento de llegada sin flecha (permitido): combate la idea de que "hay que usarlos todos".
      let senuelo = f(azar.elegir(candidatos.filter((x) => !dominio.includes(x))) ?? 99);
      if (imagenes.has(senuelo)) senuelo = Math.max(...imagenes) + azar.entero(1, 4);
      if (!esFuncion) {
        culpable = azar.elegir(dominio);
        // Dos imágenes (a un número distinto del señuelo, que queda libre) o ninguna.
        if (azar.probabilidad(0.5)) flechas.push([culpable, Math.min(...imagenes, senuelo) - azar.entero(1, 4)]);
        else flechas = flechas.filter(([x]) => x !== culpable); // sin imagen
      }
      const codominio = [...new Set([...flechas.map(([, y]) => y), senuelo])].sort((a, b) => a - b);
      if (codominio.some((y) => Math.abs(y) > 60)) continue;
      const publico: PublicoFuncion = { dominio, codominio, flechas: azar.barajar(flechas) };
      const secreto: SecretoFuncion = { esFuncion, m, n };
      if (culpable !== undefined) secreto.culpable = culpable;
      if (nivel === 5 && esFuncion) {
        const k = azar.elegir([-10, -8, 7, 10, 12, 20, 25]);
        publico.evaluarEn = k;
        secreto.resultado = f(k);
      }
      if (secreto.resultado !== undefined && secreto.resultado < -9999) continue;
      return {
        tipo: 'funcion',
        nivel,
        consigna: '¿Es función? Si lo es, escribe su regla. Si no, toca el elemento que falla.',
        voz: 'Mira las flechas de la máquina. ¿Cada número de la izquierda tiene exactamente una flecha? Si es función, escribe su regla. Si no, toca el número que falla.',
        publico,
        secreto,
      };
    }
    throw new Error('No se pudo generar la función');
  },

  validarRespuesta(r: unknown, publico): RespuestaFuncion | null {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return null;
    const o = r as Record<string, unknown>;
    if (o.esFuncion === false) {
      if (!esEnteroEn(o.culpable, -999, 999) || !publico.dominio.includes(o.culpable)) return null;
      return { esFuncion: false, culpable: o.culpable };
    }
    if (o.esFuncion !== true || !esEnteroEn(o.m, -999, 999) || !esEnteroEn(o.n, -999, 999)) return null;
    if (publico.evaluarEn !== undefined) {
      if (!esEnteroEn(o.resultado, -99999, 99999)) return null;
      return { esFuncion: true, m: o.m, n: o.n, resultado: o.resultado };
    }
    if (o.resultado !== undefined) return null;
    return { esFuncion: true, m: o.m, n: o.n };
  },

  evaluar(publico, secreto, r) {
    const solucion = this.solucion(publico, secreto);
    if (!secreto.esFuncion) {
      const dos = publico.flechas.filter(([x]) => x === secreto.culpable).length === 2;
      if (!r.esFuncion && r.culpable === secreto.culpable) {
        return {
          correcto: true,
          mensaje: dos ? `¡Bien visto! El ${num(secreto.culpable!)} tiene DOS imágenes: no es función.` : `¡Bien visto! El ${num(secreto.culpable!)} no tiene imagen: no es función.`,
          solucion,
        };
      }
      return {
        correcto: false,
        diagnostico: 'funcion_no_es',
        mensaje: r.esFuncion
          ? 'Revisa cada número de la izquierda: ¿todos tienen exactamente UNA flecha?'
          : `Correcto, no es función, pero el problema no está en el ${num(r.culpable)}. Cuenta las flechas de cada número.`,
        solucion,
      };
    }
    if (!r.esFuncion) {
      return {
        correcto: false,
        diagnostico: 'funcion_si_es',
        mensaje: 'Sí es función: cada número de la izquierda tiene una sola flecha. Que a un número de la derecha no le llegue flecha está permitido.',
        solucion,
      };
    }
    const reglaBien = r.m === secreto.m && r.n === secreto.n;
    const valorBien = secreto.resultado === undefined || r.resultado === secreto.resultado;
    if (reglaBien && valorBien) {
      return { correcto: true, mensaje: `¡Exacto! ${textoRegla(secreto.m, secreto.n)}${secreto.resultado !== undefined ? ` y f(${num(publico.evaluarEn!)}) = ${num(secreto.resultado)}` : ''}.`, solucion };
    }
    if (reglaBien) {
      return { correcto: false, diagnostico: 'formula_evaluacion', mensaje: `La regla está bien. Revisa f(${num(publico.evaluarEn!)}) = ${secreto.m} · ${numP(publico.evaluarEn!)} ${secreto.n < 0 ? '−' : '+'} ${Math.abs(secreto.n)}.`, solucion };
    }
    const [x0, y0] = publico.flechas[0]!;
    const comprobar = `Prueba tu regla con x = ${num(x0)}: debería dar ${num(y0)}.`;
    if (r.m === -secreto.m) return { correcto: false, diagnostico: 'afin_signo', mensaje: `Cuando x aumenta, ¿f(x) aumenta o disminuye? Revisa el signo del número que multiplica a x. ${comprobar}`, solucion };
    if (r.m === secreto.m && r.n === 0) return { correcto: false, diagnostico: 'formula_sin_constante', mensaje: `El ${secreto.m}x está bien, pero falta algo. ${comprobar}`, solucion };
    if (r.m === secreto.m) return { correcto: false, diagnostico: 'afin_intercepto', mensaje: `El número que multiplica a x está bien. Revisa el que se suma: ¿cuánto vale f(0)? ${comprobar}`, solucion };
    return { correcto: false, diagnostico: 'generico', mensaje: `¿Cuánto cambia f(x) cuando x aumenta en 1? ${comprobar}`, solucion };
  },

  solucion(publico, secreto) {
    if (!secreto.esFuncion) {
      return {
        simbolico: `No es función: el ${num(secreto.culpable!)} ${publico.flechas.filter(([x]) => x === secreto.culpable).length === 2 ? 'tiene dos imágenes' : 'no tiene imagen'}.`,
        explicacion: 'En una función, cada elemento de la izquierda tiene exactamente una imagen.',
        respuesta: { esFuncion: false, culpable: secreto.culpable },
      };
    }
    return {
      simbolico: `${textoRegla(secreto.m, secreto.n)}${secreto.resultado !== undefined ? `;  f(${num(publico.evaluarEn!)}) = ${num(secreto.resultado)}` : ''}`,
      explicacion: `Cuando x aumenta en 1, f(x) cambia en ${num(secreto.m)}; y f(0) = ${num(secreto.n)}.`,
      respuesta: { esFuncion: true, m: secreto.m, n: secreto.n, ...(secreto.resultado !== undefined ? { resultado: secreto.resultado } : {}) },
    };
  },

  pistas(publico, secreto) {
    return [
      { nivel: 1, texto: 'Primero cuenta las flechas que salen de cada número de la izquierda: debe salir exactamente una.' },
      {
        nivel: 2,
        texto: secreto.esFuncion
          ? `Sí es función. Compara dos flechas: cuando x aumenta en 1, f(x) cambia en ${num(secreto.m)}.`
          : 'No es función. Busca un número de la izquierda con dos flechas o sin ninguna.',
        ayudaVisual: 'mostrarSaltos',
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: { texto: '1 → 5, 2 → 8, 4 → 14', pasos: ['De 1 a 2, f aumenta 3: la regla empieza con 3x.', '3 · 1 = 3, pero f(1) = 5: se suma 2.', 'f(x) = 3x + 2. Comprobamos: 3 · 4 + 2 = 14 ✔'] },
      },
    ];
  },
};
