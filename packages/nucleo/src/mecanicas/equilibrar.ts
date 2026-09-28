/**
 * "¡A equilibrar!" / "El número escondido" — completar la caja misteriosa.
 * OA MA01-12 y MA02-13 (0 a 20). Prepara MA03-13 (ecuaciones de un paso).
 *
 * Mecánica de pesadas limitadas: la balanza está trabada y solo se ve si
 * hay equilibrio al presionar "¡Pesar!". Con una sola pesada (predecir y
 * acertar) se logra el resultado perfecto. El servidor guarda el valor de
 * la caja y responde cada pesada solo con dirección y magnitud aproximada.
 */

import type { Azar } from '../azar';
import { magnitudDe, pesoPlatillo, inclinacionDe, textoPlatillo, vozPlatillo, objetosDesde } from '../balanza';
import type { Lado, Objeto, Representacion, ResultadoPesada } from '../tipos';
import { descomponer, esEnteroEn, type ContextoGeneracion, type ItemGenerado, type Mecanica } from './mecanica';

export const MAX_CAJA = 20;
export const MAX_PESADAS = 4;

export interface PublicoEquilibrar {
  izquierda: Objeto[];
  derecha: Objeto[];
  ladoCaja: Lado;
  maxCaja: number;
  maxPesadas: number;
  representacion: Representacion;
}

export interface SecretoEquilibrar {
  valorCaja: number;
}

/** Arma un ítem: `conCaja` son los objetos que acompañan a la caja. */
function armar(
  ladoCaja: Lado,
  conCaja: Objeto[],
  otroLado: Objeto[],
  posicionCaja: 'inicio' | 'final' | number,
): { izquierda: Objeto[]; derecha: Objeto[] } {
  const caja: Objeto = { tipo: 'caja' };
  const lista = [...conCaja];
  const i = posicionCaja === 'inicio' ? 0 : posicionCaja === 'final' ? lista.length : Math.min(posicionCaja, lista.length);
  lista.splice(i, 0, caja);
  return ladoCaja === 'izquierda' ? { izquierda: lista, derecha: otroLado } : { izquierda: otroLado, derecha: lista };
}

interface Plan {
  conCaja: number[];
  otro: number[];
  como: 'cubos' | 'pesa';
  posicion: 'inicio' | 'final' | 'azar';
  lado?: Lado;
}

function planIsla1(nivel: number, azar: Azar): Plan {
  switch (nivel) {
    case 1: {
      const a = azar.entero(2, 10);
      return { conCaja: [], otro: [a], como: 'cubos', posicion: 'final' };
    }
    case 2: {
      const a = azar.entero(4, 10);
      const b = azar.entero(1, a - 1);
      return { conCaja: [b], otro: [a], como: 'cubos', posicion: 'final' };
    }
    case 3: {
      const total = azar.entero(5, 15);
      return { conCaja: [], otro: descomponer(total, 2, azar), como: 'cubos', posicion: 'final' };
    }
    case 4: {
      const b = azar.entero(2, 9);
      const c = azar.entero(b + 2, 20);
      return { conCaja: [b], otro: [c], como: 'cubos', posicion: 'inicio', lado: 'izquierda' };
    }
    default: {
      const total = azar.entero(8, 20);
      const [a, b] = descomponer(total, 2, azar) as [number, number];
      let c = azar.entero(1, total - 1);
      while (c === a || c === b) c = azar.entero(1, total - 1);
      return { conCaja: [c], otro: [a, b], como: 'pesa', posicion: 'final' };
    }
  }
}

function planIsla2(nivel: number, azar: Azar): Plan {
  switch (nivel) {
    case 1: {
      const total = azar.entero(8, 20);
      const [a, b] = descomponer(total, 2, azar) as [number, number];
      const c = azar.entero(1, total - 1);
      return { conCaja: [c], otro: [a, b], como: 'pesa', posicion: 'inicio' };
    }
    case 2: {
      // Compensación: 8 + 5 = 9 + □  → el □ es 1 menos que 5.
      const a = azar.entero(4, 12);
      const b = azar.entero(3, 20 - a);
      const d = azar.entero(1, 2);
      const sube = azar.probabilidad(0.5) && b - d >= 1;
      const c = sube ? a + d : a - d;
      return { conCaja: [c], otro: [a, b], como: 'pesa', posicion: 'final' };
    }
    case 3: {
      const total = azar.entero(9, 20);
      const [b, c] = descomponer(total, 2, azar) as [number, number];
      const a = azar.entero(1, total - 1);
      return { conCaja: [a], otro: [b, c], como: 'pesa', posicion: 'inicio' };
    }
    case 4: {
      const total = azar.entero(10, 20);
      const partes = descomponer(total, 3, azar);
      const d = azar.entero(2, total - 1);
      return { conCaja: [d], otro: partes, como: 'pesa', posicion: 'azar' };
    }
    default: {
      const total = azar.entero(12, 20);
      const [c, d] = descomponer(total, 2, azar) as [number, number];
      const valor = azar.entero(1, total - 3);
      const [a, b] = descomponer(total - valor, 2, azar) as [number, number];
      return { conCaja: [a, b], otro: [c, d], como: 'pesa', posicion: 'azar' };
    }
  }
}

export const equilibrar: Mecanica<PublicoEquilibrar, SecretoEquilibrar, never> = {
  tipo: 'equilibrar',
  modo: 'pesada',
  maxIntentos: MAX_PESADAS,

  generar(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado<PublicoEquilibrar, SecretoEquilibrar> {
    const plan = ctx.isla <= 1 ? planIsla1(nivel, azar) : planIsla2(nivel, azar);
    const ladoCaja: Lado = plan.lado ?? azar.elegir(['izquierda', 'derecha'] as const);
    const conCaja = objetosDesde(plan.conCaja, plan.como);
    const otro = objetosDesde(plan.otro, plan.como);
    const posicion = plan.posicion === 'azar' ? azar.entero(0, conCaja.length) : plan.posicion;
    const { izquierda, derecha } = armar(ladoCaja, conCaja, otro, posicion);

    const valorCaja = pesoPlatillo(otro) - pesoPlatillo(conCaja);
    const representacion: Representacion = plan.como === 'cubos' ? 'concreta' : 'pictorica';
    const ladoTexto = ladoCaja === 'izquierda' ? 'izquierdo' : 'derecho';

    return {
      tipo: 'equilibrar',
      nivel,
      consigna: '¿Cuántos cubos van en la caja para que la balanza quede en equilibrio?',
      voz:
        `En el platillo izquierdo hay ${vozPlatillo(izquierda)}. En el platillo derecho hay ${vozPlatillo(derecha)}. ` +
        `La caja misteriosa está en el platillo ${ladoTexto}. ¿Cuántos cubos debes poner en la caja para que haya equilibrio? ` +
        'Piensa bien antes de pesar: si aciertas a la primera, ganas más.',
      publico: { izquierda, derecha, ladoCaja, maxCaja: MAX_CAJA, maxPesadas: MAX_PESADAS, representacion },
      secreto: { valorCaja },
      relacional: ctx.isla >= 2 && nivel === 2,
    };
  },

  validarRespuesta(): never | null {
    // Esta mecánica se responde pesando.
    return null;
  },

  validarPropuesta(propuesta: unknown, publico): number | null {
    return esEnteroEn(propuesta, 0, publico.maxCaja) ? propuesta : null;
  },

  pesar(publico, secreto, propuesta): ResultadoPesada {
    const l = pesoPlatillo(publico.izquierda, propuesta);
    const r = pesoPlatillo(publico.derecha, propuesta);
    const inclinacion = inclinacionDe(l, r);
    const magnitud = magnitudDe(l - r);
    if (inclinacion === 'equilibrio') {
      return { inclinacion, magnitud, equilibrio: true, mensaje: '¡Equilibrio! Los dos platillos pesan lo mismo.' };
    }

    const conCaja = publico.ladoCaja === 'izquierda' ? publico.izquierda : publico.derecha;
    const otro = publico.ladoCaja === 'izquierda' ? publico.derecha : publico.izquierda;
    const companeros = pesoPlatillo(conCaja, 0);
    const totalOtro = pesoPlatillo(otro);
    const cajaLiviana = propuesta < secreto.valorCaja;

    if (companeros > 0 && propuesta === totalOtro) {
      return {
        inclinacion,
        magnitud,
        equilibrio: false,
        diagnostico: 'resultado_del_otro_lado',
        mensaje:
          '¡Ojo! La caja no está sola en su platillo. Si pones en la caja lo mismo que pesa el otro lado, ' +
          'su platillo pesa más, porque la caja tiene compañía. El signo igual no significa "escribe el resultado".',
      };
    }
    if (companeros > 0 && propuesta === companeros + totalOtro) {
      return {
        inclinacion,
        magnitud,
        equilibrio: false,
        diagnostico: 'suma_todo',
        mensaje: 'Sumaste todos los números. La caja solo debe completar lo que le falta a su platillo para pesar igual que el otro.',
      };
    }
    const cuanto = magnitud === 'poco' ? 'un poquito' : magnitud === 'medio' ? 'bastante' : 'mucho';
    return {
      inclinacion,
      magnitud,
      equilibrio: false,
      diagnostico: cajaLiviana ? 'muy_liviana' : 'muy_pesada',
      mensaje: cajaLiviana
        ? `El platillo de la caja sube: a la caja le falta ${cuanto} peso.`
        : `El platillo de la caja baja: en la caja sobra ${cuanto} peso.`,
    };
  },

  evaluar() {
    throw new Error('equilibrar se evalúa con pesar()');
  },

  solucion(publico, secreto) {
    const izq = textoPlatillo(publico.izquierda, secreto.valorCaja);
    const der = textoPlatillo(publico.derecha, secreto.valorCaja);
    const total = pesoPlatillo(publico.izquierda, secreto.valorCaja);
    return {
      simbolico: `${izq} = ${der}`,
      explicacion: `La caja pesa ${secreto.valorCaja}: así cada platillo pesa ${total}.`,
      respuesta: secreto.valorCaja,
    };
  },

  pistas(publico) {
    const conCaja = publico.ladoCaja === 'izquierda' ? publico.izquierda : publico.derecha;
    const otro = publico.ladoCaja === 'izquierda' ? publico.derecha : publico.izquierda;
    const companeros = pesoPlatillo(conCaja, 0);
    const totalOtro = pesoPlatillo(otro);
    return [
      {
        nivel: 1,
        texto:
          companeros > 0
            ? '¿Cuánto pesa el platillo que NO tiene caja? ¿Y cuánto hay ya junto a la caja? La caja debe completar lo que falta.'
            : '¿Cuánto pesa el platillo que NO tiene caja? La caja debe pesar lo mismo.',
      },
      {
        nivel: 2,
        texto:
          companeros > 0
            ? `El platillo sin caja pesa ${totalOtro}. Junto a la caja ya hay ${companeros}. ¿Cuánto le falta para llegar a ${totalOtro}?`
            : `El platillo sin caja pesa ${totalOtro}.`,
        ayudaVisual: 'mostrarTotales',
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'Un platillo pesa 9. En el otro hay 4 y la caja.',
          pasos: ['4 + □ = 9', 'Desde 4, ¿cuánto falta para llegar a 9? Cuento: 5, 6, 7, 8, 9.', 'Faltan 5: la caja pesa 5.'],
        },
      },
    ];
  },
};
