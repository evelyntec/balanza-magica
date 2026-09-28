/**
 * Ayudas de prueba: respuestas correctas a partir del secreto (solo las
 * pruebas pueden leer el secreto; el navegador nunca lo recibe).
 */

import type { ItemGuardado } from '../src/servicio/modelos';
import type {
  PublicoTabla100,
  SecretoEcuacion,
  SecretoProblema,
  SecretoTabla100,
  PublicoPatronNumerico,
  SecretoEquilibrar,
  SecretoInclinacion,
  SecretoPatronFiguras,
  SecretoPatronNumerico,
  SecretoRegistrar,
  SecretoSigno,
  SecretoVerdaderoFalso,
} from '../src/mecanicas';
import type { TipoItem } from '../src/tipos';

export function respuestaCorrecta(tipo: TipoItem, publico: unknown, secreto: unknown): unknown {
  switch (tipo) {
    case 'inclinacion':
      return (secreto as SecretoInclinacion).correcta;
    case 'equilibrar':
      return (secreto as SecretoEquilibrar).valorCaja;
    case 'registrar': {
      const s = secreto as SecretoRegistrar;
      return { izquierda: s.izquierda, derecha: s.derecha };
    }
    case 'patron_figuras':
      return (secreto as SecretoPatronFiguras).correcta;
    case 'patron_numerico': {
      const p = publico as PublicoPatronNumerico;
      const s = secreto as SecretoPatronNumerico;
      const faltantes = p.secuencia.flatMap((v, i) => (v === null ? [s.completa[i] as number] : []));
      return p.modo === 'regla' ? { faltantes, regla: s.regla } : { faltantes };
    }
    case 'signo':
      return (secreto as SecretoSigno).correcto;
    case 'verdadero_falso':
      return (secreto as SecretoVerdaderoFalso).valores;
    case 'ecuacion':
      return (secreto as SecretoEcuacion).x;
    case 'tabla100':
      return (secreto as SecretoTabla100).respuesta;
    case 'problema': {
      const s = secreto as SecretoProblema;
      return { ecuacion: s.correcta, valor: s.x };
    }
  }
}

/** Una respuesta incorrecta pero bien formada. */
export function respuestaIncorrecta(tipo: TipoItem, publico: unknown, secreto: unknown): unknown {
  const buena = respuestaCorrecta(tipo, publico, secreto);
  switch (tipo) {
    case 'inclinacion':
      return buena === 'izquierda' ? 'derecha' : 'izquierda';
    case 'equilibrar':
      return (buena as number) === 0 ? 1 : (buena as number) - 1;
    case 'registrar': {
      const r = buena as { izquierda: number[]; derecha: number[] };
      return { izquierda: r.izquierda.map((v) => (v >= 10 ? v - 3 : v + 3)), derecha: r.derecha };
    }
    case 'patron_figuras':
      return (buena as number) === 0 ? 1 : 0;
    case 'patron_numerico': {
      const r = buena as { faltantes: number[]; regla?: string };
      return { ...r, faltantes: r.faltantes.map((v) => v + 7) };
    }
    case 'signo':
      return buena === '<' ? '>' : '<';
    case 'verdadero_falso':
      return (buena as boolean[]).map((v) => !v);
    case 'ecuacion':
      return (buena as number) + 7;
    case 'tabla100': {
      const p = publico as PublicoTabla100;
      const r = buena as number[];
      // En "continuar": casillas distintas y dentro de la tabla; en "trozo": valores corridos.
      if (p.modo === 'continuar') return r.map((v) => (v <= 97 ? v + 3 : v - 3)).map((v, i, arr) => (arr.indexOf(v) !== i ? v - 1 : v));
      return r.map((v) => v + 2);
    }
    case 'problema': {
      const r = buena as { ecuacion: number; valor: number };
      return { ecuacion: r.ecuacion, valor: r.valor + 5 };
    }
  }
}

export const respuestaParaItem = (i: ItemGuardado) => respuestaCorrecta(i.tipo, i.publico, i.secreto);
