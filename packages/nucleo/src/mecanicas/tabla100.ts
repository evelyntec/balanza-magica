/**
 * "La tabla del 100" — patrones numéricos en la tabla del 100.
 * OA MA03-12: generar, describir y registrar patrones numéricos, usando una
 * variedad de estrategias en tablas del 100.
 *
 * Dos modos:
 *  - continuar: el patrón está pintado; hay que tocar las 3 casillas que siguen
 *    (saltos de 10 = columna, de 11 y 9 = diagonales, de 2, 3, 4 y 5).
 *  - trozo: un pedacito de la tabla con casillas vacías. Se resuelve con la
 *    estructura (derecha +1, abajo +10), sin mirar la tabla completa.
 */

import type { Azar } from '../azar';
import { arregloDeEnteros, type ItemGenerado, type Mecanica } from './mecanica';

export interface PublicoTabla100 {
  modo: 'continuar' | 'trozo';
  /** Casillas pintadas (modo continuar). */
  pintadas?: number[];
  /** Cuántas casillas hay que marcar (modo continuar). */
  cantidad?: number;
  /** Trozo 3×3: número visible, null = casilla por completar, 'fuera' = no es parte del trozo. */
  trozo?: (number | null | 'fuera')[][];
}

export interface SecretoTabla100 {
  respuesta: number[];
  paso?: number;
}

const fila = (n: number) => Math.floor((n - 1) / 10);
const columna = (n: number) => (n - 1) % 10;

/** Un salto que no "da la vuelta" a la tabla para 9 y 11 (diagonales reales). */
function diagonalValida(inicio: number, paso: number, cantidad: number): boolean {
  if (paso !== 9 && paso !== 11) return true;
  let n = inicio;
  for (let i = 1; i < cantidad; i++) {
    const siguiente = n + paso;
    if (fila(siguiente) !== fila(n) + 1) return false;
    if (paso === 11 && columna(siguiente) !== columna(n) + 1) return false;
    if (paso === 9 && columna(siguiente) !== columna(n) - 1) return false;
    n = siguiente;
  }
  return true;
}

const PASOS: Record<number, number[]> = { 1: [10, 2], 2: [5, 3, 10], 4: [11, 9, 4], 5: [11, 9] };

export const tabla100: Mecanica<PublicoTabla100, SecretoTabla100, number[]> = {
  tipo: 'tabla100',
  modo: 'escrita',
  maxIntentos: 2,

  generar(nivel: number, azar: Azar): ItemGenerado<PublicoTabla100, SecretoTabla100> {
    if (nivel === 3 || nivel === 5) {
      // Trozo de la tabla: centro c con vecinos dentro de la tabla.
      const f = azar.entero(1, 8);
      const col = azar.entero(1, 8);
      const c = f * 10 + col + 1;
      const valores = [
        [c - 11, c - 10, c - 9],
        [c - 1, c, c + 1],
        [c + 9, c + 10, c + 11],
      ];
      let trozo: (number | null | 'fuera')[][];
      if (nivel === 3) {
        // Forma de cruz: se ve un número y faltan otros de la cruz.
        const cruz: [number, number][] = [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, 2],
          [2, 1],
        ];
        const visible = azar.elegir(cruz);
        trozo = valores.map((filaV, i) =>
          filaV.map((v, j) => {
            if (!cruz.some(([a, b]) => a === i && b === j)) return 'fuera';
            return i === visible[0] && j === visible[1] ? v : null;
          }),
        );
      } else {
        // 3×3 completo: se ven 2 o 3 números (no alineados en la misma fila) y faltan el resto de algunas casillas.
        const posiciones = azar.barajar(Array.from({ length: 9 }, (_, k) => [Math.floor(k / 3), k % 3] as [number, number]));
        const visibles = posiciones.slice(0, 2);
        const faltan = posiciones.slice(2, 2 + azar.entero(3, 5));
        trozo = valores.map((filaV, i) =>
          filaV.map((v, j) => {
            if (visibles.some(([a, b]) => a === i && b === j)) return v;
            if (faltan.some(([a, b]) => a === i && b === j)) return null;
            return 'fuera';
          }),
        );
      }
      const respuesta = trozo.flatMap((filaT, i) => filaT.flatMap((v, j) => (v === null ? [valores[i]![j]!] : [])));
      return {
        tipo: 'tabla100',
        nivel,
        consigna: 'Este es un trozo de la tabla del 100. ¿Qué números faltan?',
        voz: 'Este es un trocito de la tabla del 100. Recuerda: hacia la derecha se suma 1 y hacia abajo se suma 10. Completa los números que faltan.',
        publico: { modo: 'trozo', trozo },
        secreto: { respuesta },
        relacional: nivel === 5,
      };
    }

    const pasos = PASOS[nivel] ?? [10];
    for (let intento = 0; intento < 500; intento++) {
      const paso = azar.elegir(pasos);
      const mostrados = azar.entero(3, 4);
      const total = mostrados + 3;
      const inicio = azar.entero(1, 100 - paso * (total - 1));
      if (!diagonalValida(inicio, paso, total)) continue;
      const serie = Array.from({ length: total }, (_, i) => inicio + paso * i);
      return {
        tipo: 'tabla100',
        nivel,
        consigna: 'Descubre el patrón pintado y toca las 3 casillas que siguen.',
        voz: `En la tabla del 100 están pintados los números ${serie.slice(0, mostrados).join(', ')}. Descubre el patrón y toca los tres números que siguen.`,
        publico: { modo: 'continuar', pintadas: serie.slice(0, mostrados), cantidad: 3 },
        secreto: { respuesta: serie.slice(mostrados), paso },
      };
    }
    return {
      tipo: 'tabla100',
      nivel,
      consigna: 'Descubre el patrón pintado y toca las 3 casillas que siguen.',
      voz: 'Descubre el patrón y toca los tres números que siguen.',
      publico: { modo: 'continuar', pintadas: [3, 13, 23], cantidad: 3 },
      secreto: { respuesta: [33, 43, 53], paso: 10 },
    };
  },

  validarRespuesta(r: unknown, publico): number[] | null {
    const n = publico.modo === 'continuar' ? (publico.cantidad ?? 3) : (publico.trozo ?? []).flat().filter((v) => v === null).length;
    const valores = arregloDeEnteros(r, n, publico.modo === 'continuar' ? 1 : 0, publico.modo === 'continuar' ? 100 : 999);
    if (!valores) return null;
    if (publico.modo === 'continuar' && new Set(valores).size !== valores.length) return null;
    return valores;
  },

  evaluar(publico, secreto, respuesta) {
    const solucion = this.solucion(publico, secreto);
    if (publico.modo === 'continuar') {
      const dados = [...respuesta].sort((a, b) => a - b);
      const bien = dados.every((v, i) => v === secreto.respuesta[i]);
      if (bien) return { correcto: true, mensaje: `¡Sí! El patrón salta de ${secreto.paso} en ${secreto.paso}.`, solucion };
      const pintadas = publico.pintadas ?? [];
      const ultimo = pintadas[pintadas.length - 1] ?? 0;
      const paso = secreto.paso ?? 0;
      // Error típico: seguir solo la columna (+10) en una diagonal, o avanzar en la fila (+1) cuando el salto es 10.
      const saltoConfundido = paso === 10 ? 1 : paso === 9 || paso === 11 ? 10 : null;
      if (saltoConfundido !== null && dados.every((v, i) => v === ultimo + (i + 1) * saltoConfundido)) {
        return { correcto: false, diagnostico: 'tabla_fila_columna', mensaje: paso === 10 ? 'Avanzaste por la fila, pero el patrón baja por la columna: salta de 10 en 10.' : 'Seguiste solo la columna. En una diagonal se baja una fila y también se avanza (o retrocede) una columna.', solucion };
      }
      return {
        correcto: false,
        diagnostico: 'patron_paso_errado',
        mensaje: 'Mira cuánto aumenta de una casilla pintada a la siguiente y sigue sumando lo mismo.',
        solucion,
      };
    }
    const bien = respuesta.every((v, i) => v === secreto.respuesta[i]);
    if (bien) return { correcto: true, mensaje: '¡Perfecto! Usaste la estructura de la tabla: +1 a la derecha y +10 hacia abajo.', solucion };
    // ¿Confundió filas con columnas (±1 con ±10)?
    const confusion = respuesta.some((v, i) => {
      const d = v - (secreto.respuesta[i] ?? 0);
      return Math.abs(d) === 9 || Math.abs(d) === 11;
    });
    if (confusion) {
      return { correcto: false, diagnostico: 'tabla_fila_columna', mensaje: 'Confundiste la fila con la columna: hacia el lado cambia de 1 en 1, hacia arriba o abajo cambia de 10 en 10.', solucion };
    }
    return { correcto: false, diagnostico: 'generico', mensaje: 'Revisa cada casilla: derecha +1, izquierda −1, abajo +10, arriba −10.', solucion };
  },

  solucion(publico, secreto) {
    return {
      simbolico: secreto.respuesta.join(', '),
      explicacion: publico.modo === 'continuar' ? `El patrón aumenta de ${secreto.paso} en ${secreto.paso}.` : 'En la tabla del 100: derecha +1, abajo +10.',
      respuesta: secreto.respuesta,
    };
  },

  pistas(publico) {
    return [
      {
        nivel: 1,
        texto:
          publico.modo === 'continuar'
            ? 'Resta dos números pintados seguidos: ese es el salto del patrón.'
            : 'En la tabla del 100, hacia la derecha se suma 1 y hacia abajo se suma 10.',
      },
      { nivel: 2, texto: 'Mostramos los saltos entre casillas.', ayudaVisual: 'mostrarSaltos' },
      {
        nivel: 3,
        texto: 'Mira este ejemplo parecido.',
        ayudaVisual: 'ejemplo',
        ejemplo:
          publico.modo === 'continuar'
            ? { texto: 'Pintadas: 4, 15, 26', pasos: ['15 − 4 = 11 y 26 − 15 = 11.', 'El salto es 11: una fila abajo y una columna a la derecha.', 'Siguen 37, 48 y 59.'] }
            : { texto: 'Centro 45', pasos: ['Derecha: 46. Izquierda: 44.', 'Abajo: 55. Arriba: 35.', 'Diagonal abajo derecha: 56.'] },
      },
    ];
  },
};
