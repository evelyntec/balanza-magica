/**
 * "Caminos de números" / "Senderos del bosque" — patrones numéricos.
 * OA MA01-11 (hasta 20, crecientes y decrecientes) y MA02-12 (crear,
 * representar y continuar patrones numéricos y completar los faltantes).
 *
 * Los números faltantes se escriben (no se eligen), así que no se pueden
 * adivinar. En los niveles altos falta incluso el primer número: hay que
 * pensar el patrón "hacia atrás".
 */

import type { Azar } from '../azar';
import { arregloDeEnteros, type ContextoGeneracion, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoPatronNumerico {
  modo: 'faltantes' | 'regla';
  secuencia: (number | null)[];
  opcionesRegla?: string[];
  maximo: number;
}

export interface SecretoPatronNumerico {
  paso: number;
  completa: number[];
  regla: string;
}

export interface RespuestaPatronNumerico {
  faltantes: number[];
  regla?: string;
}

export const textoRegla = (paso: number): string => (paso >= 0 ? `+${paso}` : `−${Math.abs(paso)}`);

interface Parametros {
  pasos: number[];
  largo: number;
  faltantes: number;
  /** Dónde pueden ir los huecos. */
  huecos: 'final' | 'medio' | 'cualquiera';
  maximo: number;
  modo: 'faltantes' | 'regla';
}

function parametros(isla: number, nivel: number): Parametros {
  if (isla <= 1) {
    const maximo = 20;
    switch (nivel) {
      case 1:
        return { pasos: [1], largo: 5, faltantes: 1, huecos: 'final', maximo: 10, modo: 'faltantes' };
      case 2:
        return { pasos: [1, 2, -1], largo: 5, faltantes: 1, huecos: 'final', maximo, modo: 'faltantes' };
      case 3:
        return { pasos: [2, 5, -1, -2], largo: 6, faltantes: 1, huecos: 'medio', maximo, modo: 'faltantes' };
      case 4:
        return { pasos: [2, 5, -2, -5, 10], largo: 6, faltantes: 2, huecos: 'medio', maximo, modo: 'faltantes' };
      default:
        return { pasos: [2, 3, -2, -3, 5, -5], largo: 6, faltantes: 2, huecos: 'cualquiera', maximo, modo: 'faltantes' };
    }
  }
  const maximo = 100;
  switch (nivel) {
    case 1:
      return { pasos: [2, 5, 10], largo: 6, faltantes: 1, huecos: 'final', maximo, modo: 'faltantes' };
    case 2:
      return { pasos: [2, 5, 10, -2, -10], largo: 6, faltantes: 1, huecos: 'medio', maximo, modo: 'faltantes' };
    case 3:
      return { pasos: [3, 4, 5, -5, -10, 10], largo: 7, faltantes: 2, huecos: 'medio', maximo, modo: 'faltantes' };
    case 4:
      return { pasos: [3, 4, 6, -3, -4], largo: 6, faltantes: 1, huecos: 'medio', maximo, modo: 'regla' };
    default:
      return { pasos: [3, 4, 6, 7, -3, -4, -6], largo: 7, faltantes: 3, huecos: 'cualquiera', maximo, modo: 'faltantes' };
  }
}

function elegirHuecos(largo: number, cantidad: number, donde: Parametros['huecos'], azar: Azar): number[] {
  if (donde === 'final') return [largo - 1];
  // Siempre quedan al menos dos números seguidos visibles para descubrir el paso.
  for (let intento = 0; intento < 200; intento++) {
    const candidatos = donde === 'medio' ? Array.from({ length: largo - 2 }, (_, i) => i + 2) : Array.from({ length: largo }, (_, i) => i);
    const huecos = azar.barajar(candidatos).slice(0, cantidad).sort((a, b) => a - b);
    const visibles = Array.from({ length: largo }, (_, i) => i).filter((i) => !huecos.includes(i));
    const hayPar = visibles.some((i) => visibles.includes(i + 1));
    if (hayPar && (donde !== 'cualquiera' || cantidad < 2 || huecos.includes(0) || azar.probabilidad(0.3))) return huecos;
  }
  return [largo - 1];
}

function opcionesDeRegla(paso: number, azar: Azar): string[] {
  const candidatos = new Set<number>([paso, paso + 1, paso - 1, -paso]);
  candidatos.delete(0);
  while (candidatos.size < 4) candidatos.add(paso + (candidatos.size + 1) * (azar.probabilidad(0.5) ? 1 : -1));
  return azar.barajar([...candidatos].slice(0, 4).map(textoRegla));
}

export const patronNumerico: Mecanica<PublicoPatronNumerico, SecretoPatronNumerico, RespuestaPatronNumerico> = {
  tipo: 'patron_numerico',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado<PublicoPatronNumerico, SecretoPatronNumerico> {
    const p = parametros(ctx.isla, nivel);
    // Solo pasos que permiten un camino con al menos 3 números visibles.
    const cabe = (s: number) => Math.floor(p.maximo / Math.abs(s)) + 1;
    const paso = azar.elegir(p.pasos.filter((s) => cabe(s) >= p.faltantes + 3));
    const largo = Math.min(p.largo, cabe(paso));
    const recorrido = Math.abs(paso) * (largo - 1);
    // Inicio que mantiene todos los números entre 0 y el máximo.
    const minInicio = paso > 0 ? 0 : recorrido;
    const maxInicio = paso > 0 ? p.maximo - recorrido : p.maximo;
    let inicio = azar.entero(minInicio, maxInicio);
    // En 2° básico evitamos que los saltos de 10 partan siempre en decenas exactas.
    if (Math.abs(paso) === 10 && ctx.isla >= 2 && inicio % 10 === 0 && azar.probabilidad(0.7)) {
      const ajustado = inicio + (paso > 0 ? -azar.entero(1, 9) : azar.entero(1, 9));
      if (ajustado >= minInicio && ajustado <= maxInicio && ajustado >= 0) inicio = ajustado;
    }
    const completa = Array.from({ length: largo }, (_, i) => inicio + paso * i);
    const huecos = elegirHuecos(largo, p.faltantes, p.huecos, azar);
    const secuencia = completa.map((v, i) => (huecos.includes(i) ? null : v));
    const regla = textoRegla(paso);

    const publico: PublicoPatronNumerico = { modo: p.modo, secuencia, maximo: p.maximo };
    if (p.modo === 'regla') publico.opcionesRegla = opcionesDeRegla(paso, azar);

    const visibles = secuencia.map((v) => (v === null ? 'un espacio vacío' : String(v))).join(', ');
    return {
      tipo: 'patron_numerico',
      nivel,
      consigna:
        p.modo === 'regla'
          ? '¿Cuál es la regla del camino? Elige la regla y completa el número que falta.'
          : huecos.length === 1
            ? 'Completa el número que falta en el camino.'
            : 'Completa los números que faltan en el camino.',
      voz: `Mira el camino de números: ${visibles}. ${p.modo === 'regla' ? 'Descubre la regla y completa el número que falta.' : 'Completa lo que falta.'}`,
      publico,
      secreto: { paso, completa, regla },
      relacional: p.huecos === 'cualquiera',
    };
  },

  validarRespuesta(r: unknown, publico): RespuestaPatronNumerico | null {
    if (typeof r !== 'object' || r === null) return null;
    const { faltantes, regla } = r as Record<string, unknown>;
    const n = publico.secuencia.filter((v) => v === null).length;
    const valores = arregloDeEnteros(faltantes, n, 0, 999);
    if (!valores) return null;
    if (publico.modo === 'regla') {
      if (typeof regla !== 'string' || !publico.opcionesRegla?.includes(regla)) return null;
      return { faltantes: valores, regla };
    }
    return { faltantes: valores };
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    const indices = publico.secuencia.flatMap((v, i) => (v === null ? [i] : []));
    const esperados = indices.map((i) => secreto.completa[i] as number);
    const buenos = respuesta.faltantes.map((v, k) => v === esperados[k]);
    const reglaOk = publico.modo !== 'regla' || respuesta.regla === secreto.regla;

    if (buenos.every(Boolean) && reglaOk) {
      return { correcto: true, mensaje: `¡Excelente! La regla es ${secreto.regla}: cada número ${secreto.paso > 0 ? 'aumenta' : 'disminuye'} ${Math.abs(secreto.paso)}.`, solucion };
    }
    if (!reglaOk) {
      return {
        correcto: false,
        diagnostico: 'patron_regla',
        mensaje: 'Revisa la regla: mira dos números seguidos y calcula cuánto cambia de uno al otro.',
        solucion,
      };
    }
    // Diagnóstico del primer hueco incorrecto.
    const k = buenos.findIndex((b) => !b);
    const i = indices[k] as number;
    const dado = respuesta.faltantes[k] as number;
    const previo = secreto.completa[i - 1];
    const siguiente = secreto.completa[i + 1];
    if (previo !== undefined && dado === previo - secreto.paso) {
      return {
        correcto: false,
        diagnostico: 'patron_direccion',
        mensaje: `¡Ojo con la dirección! El camino ${secreto.paso > 0 ? 'va subiendo' : 'va bajando'}.`,
        solucion,
      };
    }
    const vecino = previo ?? siguiente;
    if (vecino !== undefined && Math.abs(Math.abs(dado - vecino) - Math.abs(secreto.paso)) === 1) {
      return {
        correcto: false,
        diagnostico: 'patron_paso_errado',
        mensaje: 'Casi: revisa cuánto cambia exactamente de un número al siguiente. ¡Cuenta los saltos con cuidado!',
        solucion,
      };
    }
    if (buenos.some(Boolean)) {
      return {
        correcto: false,
        diagnostico: 'patron_parcial',
        mensaje: 'Algunos números están bien, pero no todos. Comprueba cada salto del camino.',
        solucion,
      };
    }
    return {
      correcto: false,
      diagnostico: 'generico',
      mensaje: 'Busca dos números seguidos que ya estén escritos y calcula cuánto cambia de uno al otro.',
      solucion,
    };
  },

  solucion(_publico, secreto) {
    return {
      simbolico: secreto.completa.join(', '),
      explicacion: `La regla es ${secreto.regla}: cada número ${secreto.paso > 0 ? 'aumenta' : 'disminuye'} ${Math.abs(secreto.paso)}.`,
      respuesta: secreto.completa,
    };
  },

  pistas(publico) {
    const creciente = (() => {
      const visibles = publico.secuencia.filter((v): v is number => v !== null);
      return (visibles[1] ?? 0) >= (visibles[0] ?? 0);
    })();
    return [
      { nivel: 1, texto: 'Busca dos números seguidos. ¿Cuánto cambia de uno al otro? ¿Sube o baja?' },
      {
        nivel: 2,
        texto: `Dibujamos los saltos entre los números. El camino ${creciente ? 'sube' : 'baja'}.`,
        ayudaVisual: 'mostrarSaltos',
      },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo: {
          texto: 'Camino: 4, 7, 10, __, 16',
          pasos: ['De 4 a 7 hay 3. De 7 a 10 hay 3.', 'La regla es +3.', '10 + 3 = 13. Comprobamos: 13 + 3 = 16 ✔'],
        },
      },
    ];
  },
};
