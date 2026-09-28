import type { FiguraSucesion as TipoFigura } from '@balanza/nucleo';

/**
 * Figuras que crecen, dibujadas con palitos de fósforo o baldosas.
 * La cantidad de palitos o baldosas dibujados es exactamente el término de
 * la sucesión (lo verifica e2e contando los elementos del SVG).
 */

const S = 26; // lado de un palito o baldosa
type Segmento = [number, number, number, number];

function segmentos(figura: TipoFigura, n: number): { segs: Segmento[]; ancho: number; alto: number } {
  const segs: Segmento[] = [];
  const clave = new Set<string>();
  const agregar = (x1: number, y1: number, x2: number, y2: number) => {
    const k = [x1, y1, x2, y2].map((v) => v.toFixed(1)).join(',');
    const k2 = [x2, y2, x1, y1].map((v) => v.toFixed(1)).join(',');
    if (clave.has(k) || clave.has(k2)) return;
    clave.add(k);
    segs.push([x1, y1, x2, y2]);
  };
  const H = S * 0.866; // altura del triángulo equilátero
  switch (figura) {
    case 'cuadrados':
      for (let i = 0; i < n; i++) {
        agregar(i * S, 0, (i + 1) * S, 0);
        agregar(i * S, S, (i + 1) * S, S);
      }
      for (let i = 0; i <= n; i++) agregar(i * S, 0, i * S, S);
      return { segs, ancho: n * S, alto: S };
    case 'rejilla':
      for (let f = 0; f <= 2; f++) for (let i = 0; i < n; i++) agregar(i * S, f * S, (i + 1) * S, f * S);
      for (let f = 0; f < 2; f++) for (let i = 0; i <= n; i++) agregar(i * S, f * S, i * S, (f + 1) * S);
      return { segs, ancho: n * S, alto: 2 * S };
    case 'triangulos':
      for (let i = 0; i < n; i++) {
        const j = Math.floor(i / 2);
        if (i % 2 === 0) {
          agregar(j * S, H, (j + 1) * S, H);
          agregar(j * S, H, (j + 0.5) * S, 0);
          agregar((j + 1) * S, H, (j + 0.5) * S, 0);
        } else {
          agregar((j + 0.5) * S, 0, (j + 1.5) * S, 0);
          agregar((j + 0.5) * S, 0, (j + 1) * S, H);
          agregar((j + 1.5) * S, 0, (j + 1) * S, H);
        }
      }
      return { segs, ancho: ((n + 1) / 2) * S, alto: H };
    case 'casas':
    case 'pentagonos': {
      const techo = S * 0.6;
      for (let i = 0; i < n; i++) {
        agregar(i * S, techo + S, (i + 1) * S, techo + S);
        if (figura === 'casas') agregar(i * S, techo, (i + 1) * S, techo);
        agregar(i * S, techo, (i + 0.5) * S, 0);
        agregar((i + 1) * S, techo, (i + 0.5) * S, 0);
      }
      for (let i = 0; i <= n; i++) agregar(i * S, techo, i * S, techo + S);
      return { segs, ancho: n * S, alto: techo + S };
    }
    default:
      return { segs, ancho: 0, alto: 0 };
  }
}

function baldosas(figura: TipoFigura, n: number): { celdas: [number, number][]; ancho: number; alto: number } {
  const celdas: [number, number][] = [];
  if (figura === 'baldosas_escalera') {
    for (let c = 0; c < n; c++) for (let f = 0; f <= c; f++) celdas.push([c, n - 1 - f]);
    return { celdas, ancho: n, alto: n };
  }
  const filas = n;
  const columnas = figura === 'baldosas_cuadrado' ? n : figura === 'baldosas_rectangulo' ? n + 1 : n + 2;
  for (let f = 0; f < filas; f++) for (let c = 0; c < columnas; c++) celdas.push([c, f]);
  return { celdas, ancho: columnas, alto: filas };
}

export function FiguraSucesion({ figura, n, altoMax = 96 }: { figura: TipoFigura; n: number; altoMax?: number }) {
  const m = 6;
  if (figura.startsWith('baldosas')) {
    const { celdas, ancho, alto } = baldosas(figura, n);
    const t = S * 0.8;
    const w = ancho * t + 2 * m;
    const h = alto * t + 2 * m;
    return (
      <svg className="figura-sucesion" viewBox={`0 0 ${w} ${h}`} style={{ height: Math.min(altoMax, h * 1.1), maxWidth: '100%' }} role="img" aria-label={`Figura ${n}`} data-elementos={celdas.length}>
        {celdas.map(([c, f]) => (
          <rect key={`${c}-${f}`} className="baldosa" x={m + c * t} y={m + f * t} width={t - 1.5} height={t - 1.5} rx={3} />
        ))}
      </svg>
    );
  }
  const { segs, ancho, alto } = segmentos(figura, n);
  const w = ancho + 2 * m;
  const h = alto + 2 * m;
  return (
    <svg className="figura-sucesion" viewBox={`0 0 ${w} ${h}`} style={{ height: Math.min(altoMax, h * 1.6), maxWidth: '100%' }} role="img" aria-label={`Figura ${n}`} data-elementos={segs.length}>
      {segs.map(([x1, y1, x2, y2], i) => (
        <g key={i} className="palito">
          <line x1={m + x1} y1={m + y1} x2={m + x2} y2={m + y2} />
          <circle cx={m + x1 + (x2 - x1) * 0.08} cy={m + y1 + (y2 - y1) * 0.08} r={2.6} />
        </g>
      ))}
    </svg>
  );
}
