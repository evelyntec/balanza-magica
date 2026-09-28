/**
 * Modelo de barras (parte-parte-todo), como en los textos Sumo Primero:
 * arriba el total, abajo sus dos partes. La incógnita se pinta con su símbolo.
 */

import { esSuma, resolver, type FormaEcuacion } from '@balanza/nucleo';

interface Props {
  forma: FormaEcuacion;
  a: number;
  b: number;
  simbolo: string;
  /** Muestra el valor de la incógnita (al terminar el ejercicio). */
  revelar?: boolean;
}

export function ModeloBarra({ forma, a, b, simbolo, revelar = false }: Props) {
  const x = resolver(forma, a, b);
  const etiquetaX = revelar ? `${simbolo} = ${x}` : simbolo;
  // total y partes según la forma de la ecuación
  let total: { valor: number; texto: string; incognita: boolean };
  let partes: { valor: number; texto: string; incognita: boolean }[];
  if (esSuma(forma)) {
    total = { valor: b, texto: String(b), incognita: false };
    partes = [
      { valor: x, texto: etiquetaX, incognita: true },
      { valor: a, texto: String(a), incognita: false },
    ];
  } else if (forma === 'x-a=b') {
    total = { valor: x, texto: etiquetaX, incognita: true };
    partes = [
      { valor: a, texto: String(a), incognita: false },
      { valor: b, texto: String(b), incognita: false },
    ];
  } else {
    total = { valor: a, texto: String(a), incognita: false };
    partes = [
      { valor: x, texto: etiquetaX, incognita: true },
      { valor: b, texto: String(b), incognita: false },
    ];
  }
  const ancho = 380;
  const x0 = 10;
  const w1 = Math.max(60, Math.min(ancho - 60, (partes[0]!.valor / total.valor) * ancho));
  const colorIncognita = '#f5b82e';
  const colorConocido = '#b48ce6';
  return (
    <svg viewBox="0 0 400 150" className="modelo-barra" role="img" aria-label={`Modelo de barras: el total es ${total.texto} y las partes son ${partes[0]!.texto} y ${partes[1]!.texto}`}>
      <text x={200} y={16} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fff">
        total
      </text>
      <rect x={x0} y={24} width={ancho} height={44} rx={10} fill={total.incognita ? colorIncognita : colorConocido} stroke="#22103d" strokeWidth={3} />
      <text x={200} y={55} textAnchor="middle" fontSize={24} fontWeight={900} fill="#22103d" fontFamily="'Baloo 2', Nunito, sans-serif">
        {total.texto}
      </text>
      <rect x={x0} y={82} width={w1} height={44} rx={10} fill={partes[0]!.incognita ? colorIncognita : colorConocido} stroke="#22103d" strokeWidth={3} />
      <rect x={x0 + w1} y={82} width={ancho - w1} height={44} rx={10} fill={partes[1]!.incognita ? colorIncognita : colorConocido} stroke="#22103d" strokeWidth={3} />
      <text x={x0 + w1 / 2} y={113} textAnchor="middle" fontSize={24} fontWeight={900} fill="#22103d" fontFamily="'Baloo 2', Nunito, sans-serif">
        {partes[0]!.texto}
      </text>
      <text x={x0 + w1 + (ancho - w1) / 2} y={113} textAnchor="middle" fontSize={24} fontWeight={900} fill="#22103d" fontFamily="'Baloo 2', Nunito, sans-serif">
        {partes[1]!.texto}
      </text>
      <text x={200} y={145} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">
        partes
      </text>
    </svg>
  );
}
