/**
 * Ilustraciones SVG: frutas (formas distintas, no solo colores, para ser
 * accesibles), íconos de islas, jefes, estrellas y monedas.
 */

import type { ReactNode } from 'react';
import type { Figura } from '@balanza/nucleo';
import { NOMBRE_FIGURA } from '@balanza/nucleo';

const L = '#22103d';

export function Fruta({ figura, tamano = 48 }: { figura: Figura; tamano?: number }) {
  const t = { stroke: L, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  let dibujo;
  switch (figura) {
    case 'manzana':
      dibujo = (
        <>
          <path d="M32 18 C20 10 6 18 8 34 C10 50 22 58 32 54 C42 58 54 50 56 34 C58 18 44 10 32 18 Z" fill="#e63946" {...t} />
          <path d="M32 18 q0 -8 4 -12" fill="none" {...t} />
          <path d="M36 12 q10 -6 14 2 q-8 6 -14 -2 Z" fill="#2fb37a" {...t} />
          <ellipse cx={22} cy={30} rx={4} ry={7} fill="#fff" opacity={0.5} />
        </>
      );
      break;
    case 'pera':
      dibujo = (
        <>
          <path d="M32 10 C24 10 24 22 22 28 C14 36 12 46 18 53 C24 60 40 60 46 53 C52 46 50 36 42 28 C40 22 40 10 32 10 Z" fill="#9ccc3f" {...t} />
          <path d="M32 10 q2 -5 6 -6" fill="none" {...t} />
          <ellipse cx={26} cy={42} rx={3} ry={6} fill="#fff" opacity={0.5} />
        </>
      );
      break;
    case 'uva':
      dibujo = (
        <>
          <path d="M32 12 q0 -6 6 -8" fill="none" {...t} />
          {[
            [24, 20],
            [40, 20],
            [32, 30],
            [18, 32],
            [46, 32],
            [25, 42],
            [39, 42],
            [32, 53],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={8} fill="#7b3fbf" {...t} strokeWidth={2.5} />
          ))}
        </>
      );
      break;
    case 'platano':
      dibujo = (
        <>
          <path d="M10 18 C10 42 26 56 52 50 C54 46 52 44 48 44 C30 46 20 36 18 16 Z" fill="#f5d33b" {...t} />
          <path d="M10 18 l-2 -6 l8 1 z" fill="#6b4f1d" {...t} strokeWidth={2} />
        </>
      );
      break;
    case 'naranja':
      dibujo = (
        <>
          <circle cx={32} cy={35} r={21} fill="#ff9933" {...t} />
          <path d="M32 14 q6 -8 14 -4 q-6 8 -14 4 Z" fill="#2fb37a" {...t} />
          {[
            [24, 30],
            [38, 28],
            [30, 42],
            [42, 40],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={L} opacity={0.5} />
          ))}
        </>
      );
      break;
    case 'frutilla':
      dibujo = (
        <>
          <path d="M14 22 C14 40 26 56 32 58 C38 56 50 40 50 22 C42 18 22 18 14 22 Z" fill="#e0457b" {...t} />
          <path d="M16 22 l6 -10 l6 6 l4 -10 l4 10 l6 -6 l6 10 Z" fill="#2fb37a" {...t} />
          {[
            [24, 30],
            [34, 28],
            [42, 32],
            [28, 40],
            [38, 42],
            [32, 50],
          ].map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={1.5} ry={2.2} fill="#ffd873" />
          ))}
        </>
      );
      break;
    case 'flor':
      dibujo = (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={32} cy={18} rx={9} ry={13} fill="#f48fb1" {...t} transform={`rotate(${a} 32 33)`} />
          ))}
          <circle cx={32} cy={33} r={8} fill="#f5b82e" {...t} />
        </>
      );
      break;
    case 'hoja':
      dibujo = (
        <>
          <path d="M10 54 C10 26 30 10 56 8 C56 36 38 54 10 54 Z" fill="#2fb37a" {...t} />
          <path d="M10 54 L46 18" fill="none" {...t} strokeWidth={2.5} />
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 64 64" width={tamano} height={tamano} role="img" aria-label={NOMBRE_FIGURA[figura]}>
      {dibujo}
    </svg>
  );
}

export function Estrella({ llena, tamano = 28, animada = false }: { llena: boolean; tamano?: number; animada?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width={tamano} height={tamano} aria-hidden="true" className={animada ? 'aparecer' : undefined}>
      <path
        d="M32 4 L40 23 L60 24 L44 37 L50 58 L32 46 L14 58 L20 37 L4 24 L24 23 Z"
        fill={llena ? '#f5b82e' : 'rgba(255,255,255,0.25)'}
        stroke={llena ? L : 'rgba(34,16,61,0.5)'}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {llena ? <path d="M22 26 L28 26" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.7} /> : null}
    </svg>
  );
}

export function Estrellas({ n, max = 3, tamano = 22 }: { n: number; max?: number; tamano?: number }) {
  return (
    <span className="estrellas" role="img" aria-label={`${n} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <Estrella key={i} llena={i < n} tamano={tamano} />
      ))}
    </span>
  );
}

export function Moneda({ tamano = 20 }: { tamano?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={tamano} height={tamano} className="icono-moneda" aria-hidden="true">
      <circle cx={16} cy={16} r={13} fill="#f5b82e" stroke={L} strokeWidth={3} />
      <circle cx={16} cy={16} r={8} fill="none" stroke="#b37a00" strokeWidth={2} />
      <path d="M16 11 v10 M13 13 h5 q2 0 2 2 q0 2 -2 2 h-3 q-2 0 -2 2 q0 2 2 2 h5" stroke="#b37a00" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Íconos de las 8 islas. */
export function IconoIsla({ numero }: { numero: number }) {
  const t = { stroke: L, strokeWidth: 3.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const contenido: Record<number, ReactNode> = {
    1: (
      <>
        <path d="M10 76 Q50 56 90 76 Z" fill="#2fb37a" {...t} />
        <rect x={44} y={40} width={10} height={30} rx={4} fill="#8a5a2b" {...t} />
        <circle cx={49} cy={32} r={22} fill="#3fbf6f" {...t} />
        <circle cx={40} cy={30} r={5} fill="#e63946" {...t} strokeWidth={2} />
        <circle cx={56} cy={24} r={5} fill="#e63946" {...t} strokeWidth={2} />
        <circle cx={55} cy={40} r={5} fill="#e63946" {...t} strokeWidth={2} />
      </>
    ),
    2: (
      <>
        <path d="M10 78 Q50 60 90 78 Z" fill="#1e8a5a" {...t} />
        <path d="M30 70 L30 50 M70 70 L70 50" {...t} />
        <path d="M18 54 L30 18 L42 54 Z" fill="#2fb37a" {...t} />
        <path d="M58 54 L70 22 L82 54 Z" fill="#2fb37a" {...t} />
        <text x={50} y={58} textAnchor="middle" fontSize={26} fontWeight={900} fill="#ffd873" stroke={L} strokeWidth={4} paintOrder="stroke">
          {'<'}
        </text>
      </>
    ),
    3: (
      <>
        <path d="M6 60 q11 -8 22 0 t22 0 t22 0 t22 0" fill="none" stroke="#6ec3ff" strokeWidth={7} strokeLinecap="round" />
        <rect x={34} y={26} width={32} height={30} rx={6} fill="#f5b82e" {...t} />
        <text x={50} y={48} textAnchor="middle" fontSize={22} fontWeight={900} fill={L}>
          ?
        </text>
      </>
    ),
    4: (
      <>
        <path d="M8 78 L38 22 L52 44 L62 30 L92 78 Z" fill="#b48ce6" {...t} />
        <path d="M38 22 L30 38 L46 38 Z M62 30 L56 42 L68 42 Z" fill="#fff" {...t} strokeWidth={2.5} />
      </>
    ),
    5: (
      <>
        <path d="M8 78 Q50 62 92 78 Z" fill="#f5d33b" {...t} />
        <path d="M46 70 V32 q0 -8 6 -8 q6 0 6 8 V70 M46 46 h-8 q-4 0 -4 -4 v-8 M58 50 h8 q4 0 4 -4 v-8" fill="#2fb37a" {...t} />
      </>
    ),
    6: (
      <>
        <rect x={16} y={36} width={20} height={40} rx={3} fill="#e0457b" {...t} />
        <rect x={40} y={22} width={22} height={54} rx={3} fill="#7b3fbf" {...t} />
        <rect x={66} y={42} width={18} height={34} rx={3} fill="#2f8fce" {...t} />
        <text x={51} y={50} textAnchor="middle" fontSize={16} fontWeight={900} fill="#ffd873">
          x
        </text>
      </>
    ),
    7: (
      <>
        <path d="M12 78 L38 30 H62 L88 78 Z" fill="#6b3d2e" {...t} />
        <path d="M38 30 q12 10 24 0 L56 22 L44 22 Z" fill="#e63946" {...t} />
        <circle cx={50} cy={12} r={8} fill="#f48fb1" {...t} strokeWidth={2.5} />
      </>
    ),
    8: (
      <>
        <rect x={20} y={36} width={60} height={40} fill="#b48ce6" {...t} />
        <path d="M20 36 v-10 h8 v6 h8 v-6 h8 v6 h12 v-6 h8 v6 h8 v-6 h8 v10" fill="#b48ce6" {...t} />
        <path d="M44 76 v-18 q6 -8 12 0 v18" fill="#4b1d8f" {...t} />
        <path d="M50 10 v16 M50 10 l12 4 l-12 4" fill="#e0457b" {...t} strokeWidth={2.5} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 100 90" className="isla__icono" aria-hidden="true">
      {contenido[numero]}
    </svg>
  );
}

/** Retratos de los jefes. */
export function RetratoJefe({ isla, animo = 'normal' }: { isla: number; animo?: 'normal' | 'golpe' | 'vencido' }) {
  const t = { stroke: L, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const ojos =
    animo === 'vencido' ? (
      <g stroke={L} strokeWidth={4} strokeLinecap="round">
        <path d="M36 40 l8 8 M44 40 l-8 8 M58 40 l8 8 M66 40 l-8 8" />
      </g>
    ) : animo === 'golpe' ? (
      <g stroke={L} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M34 44 l10 -3 M58 41 l10 3" />
      </g>
    ) : (
      <g>
        <circle cx={40} cy={44} r={6} fill="#fff" {...t} strokeWidth={3} />
        <circle cx={62} cy={44} r={6} fill="#fff" {...t} strokeWidth={3} />
        <circle cx={41} cy={45} r={2.5} fill={L} />
        <circle cx={63} cy={45} r={2.5} fill={L} />
      </g>
    );
  if (isla === 1) {
    return (
      <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Cuervo Revoltoso">
        <circle cx={50} cy={50} r={46} fill="#b48ce6" stroke={L} strokeWidth={4} />
        <path d="M22 70 q-4 -40 28 -48 q32 8 28 48 q-28 16 -56 0 Z" fill="#2e2342" {...t} />
        <path d="M34 22 l4 -14 l6 12 l4 -14 l6 14 l6 -10 l0 16" fill="#2e2342" {...t} strokeWidth={3} />
        {ojos}
        <path d="M46 52 l16 6 l-16 6 Z" fill="#f5b82e" {...t} strokeWidth={3} />
      </svg>
    );
  }
  if (isla === 3) {
    return (
      <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Pulpo Escondecajas">
        <circle cx={50} cy={50} r={46} fill="#b8e4ff" stroke={L} strokeWidth={4} />
        {[18, 30, 42, 58, 70, 82].map((x, i) => (
          <path key={x} d={`M${x} 62 q${i % 2 ? 6 : -6} 14 ${i % 2 ? -2 : 2} 26`} fill="none" stroke="#e0457b" strokeWidth={7} strokeLinecap="round" />
        ))}
        <ellipse cx={50} cy={46} rx={30} ry={26} fill="#e0457b" {...t} />
        {ojos}
        <path d="M44 60 q6 4 12 0" fill="none" {...t} strokeWidth={3} />
        <rect x={62} y={14} width={18} height={18} rx={3} fill="#f5b82e" {...t} strokeWidth={3} />
        <text x={71} y={28} textAnchor="middle" fontSize={13} fontWeight={900} fill={L}>
          ?
        </text>
      </svg>
    );
  }
  if (isla === 7) {
    return (
      <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Dragón de Ceniza">
        <circle cx={50} cy={50} r={46} fill="#ffd9c7" stroke={L} strokeWidth={4} />
        <path d="M22 24 l8 16 M78 24 l-8 16" stroke={L} strokeWidth={5} strokeLinecap="round" />
        <path d="M18 16 l10 10 l-12 -2 Z M82 16 l-10 10 l12 -2 Z" fill="#f5b82e" {...t} strokeWidth={2} />
        <path d="M20 58 q0 -30 30 -30 q30 0 30 30 q-4 22 -30 24 q-26 -2 -30 -24 Z" fill="#6b6b6b" {...t} />
        {ojos}
        <ellipse cx={50} cy={66} rx={16} ry={10} fill="#8a8a8a" {...t} strokeWidth={3} />
        <circle cx={44} cy={65} r={2.5} fill={L} />
        <circle cx={56} cy={65} r={2.5} fill={L} />
        <ellipse cx={82} cy={30} rx={7} ry={9} fill="#e0457b" fillOpacity={0.5} stroke="#e0457b" strokeWidth={2} />
        <path d="M82 39 q-2 6 1 10" stroke={L} strokeWidth={1.5} fill="none" />
        <path d="M40 84 q10 8 20 0" fill="none" stroke="#d6452f" strokeWidth={4} strokeLinecap="round" />
      </svg>
    );
  }
  if (isla === 6) {
    return (
      <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Robot Fórmulus">
        <circle cx={50} cy={50} r={46} fill="#ffd1e3" stroke={L} strokeWidth={4} />
        <path d="M50 10 v10" stroke={L} strokeWidth={4} strokeLinecap="round" />
        <circle cx={50} cy={9} r={5} fill="#f5b82e" stroke={L} strokeWidth={3} />
        <rect x={22} y={20} width={56} height={44} rx={10} fill="#9fb8d6" {...t} />
        <rect x={14} y={34} width={8} height={16} rx={3} fill="#c2185b" {...t} strokeWidth={3} />
        <rect x={78} y={34} width={8} height={16} rx={3} fill="#c2185b" {...t} strokeWidth={3} />
        {ojos}
        <rect x={36} y={54} width={28} height={6} rx={3} fill={L} />
        <rect x={28} y={66} width={44} height={26} rx={6} fill="#c2185b" {...t} />
        <text x={50} y={85} textAnchor="middle" fontSize={15} fontWeight={900} fill="#fff">
          3n+1
        </text>
      </svg>
    );
  }
  if (isla === 5) {
    return (
      <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Escorpión Desigual">
        <circle cx={50} cy={50} r={46} fill="#ffe2a8" stroke={L} strokeWidth={4} />
        <path d="M8 80 q20 -10 42 -2 q22 8 42 -4 l0 16 l-84 0 Z" fill="#f2c46b" />
        <path d="M70 58 q18 -6 16 -26 q-2 -16 -16 -14" fill="none" stroke="#c0392b" strokeWidth={8} strokeLinecap="round" />
        <path d="M66 14 l8 4 l-6 6 Z" fill={L} />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${34 + k * 10} 66 l-8 12 M${38 + k * 10} 66 l6 12`} stroke={L} strokeWidth={3} strokeLinecap="round" />
        ))}
        <ellipse cx={46} cy={54} rx={24} ry={16} fill="#c0392b" {...t} />
        <path d="M24 46 q-14 -6 -12 -18 q8 2 10 8 M24 46 q-4 -12 4 -18" fill="#c0392b" {...t} strokeWidth={3} />
        <g transform="translate(0 6)">{ojos}</g>
        <text x={50} y={96} textAnchor="middle" fontSize={16} fontWeight={900} fill={L}>
          &lt; &gt;
        </text>
      </svg>
    );
  }
  if (isla === 4) {
    return (
      <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Yeti de las Tablas">
        <circle cx={50} cy={50} r={46} fill="#cfe8ff" stroke={L} strokeWidth={4} />
        <path d="M8 74 l18 -26 l12 14 l14 -22 l18 24 l10 -10 l12 20" fill="#fff" stroke={L} strokeWidth={3} strokeLinejoin="round" />
        <path d="M22 86 q-6 -34 8 -50 q-4 -14 10 -18 q10 -8 20 0 q14 4 10 18 q14 16 8 50 Z" fill="#f4f7fb" {...t} />
        <path d="M34 34 q16 -8 32 0 q4 18 -16 24 q-20 -6 -16 -24 Z" fill="#9fb8d6" {...t} strokeWidth={3} />
        {ojos}
        <path d="M44 56 q6 4 12 0" fill="none" {...t} strokeWidth={3} />
        <path d="M46 55 v4 M54 55 v4" stroke="#fff" strokeWidth={2.5} />
        <rect x={60} y={64} width={24} height={20} rx={3} fill="#fff3cf" {...t} strokeWidth={3} />
        <path d="M60 71 h24 M60 77 h24 M72 64 v20" stroke={L} strokeWidth={2} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="jefe__retrato" role="img" aria-label="Bruja Ventolera">
      <circle cx={50} cy={50} r={46} fill="#dcf5e8" stroke={L} strokeWidth={4} />
      <circle cx={51} cy={52} r={26} fill="#9ccc3f" {...t} />
      <path d="M14 34 q36 -6 74 0 l-6 6 q-30 -4 -62 0 Z" fill="#4b1d8f" {...t} />
      <path d="M30 34 L54 2 L70 34 Z" fill="#7b3fbf" {...t} />
      {ojos}
      <path d="M40 64 q10 6 20 0" fill="none" {...t} strokeWidth={3} />
      <path d="M6 70 q10 -6 20 0 t20 0" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

/** Mini balanza para las opciones de "¿hacia dónde baja?". */
export function MiniBalanza({ lado }: { lado: 'izquierda' | 'equilibrio' | 'derecha' }) {
  const angulo = lado === 'izquierda' ? -16 : lado === 'derecha' ? 16 : 0;
  const rad = (angulo * Math.PI) / 180;
  const dx = 34 * Math.cos(rad);
  const dy = 34 * Math.sin(rad);
  return (
    <svg viewBox="0 0 100 70" width={84} height={58} aria-hidden="true">
      <path d="M38 66 h24" stroke={L} strokeWidth={5} strokeLinecap="round" />
      <path d="M50 66 V22" stroke={L} strokeWidth={5} />
      <line x1={50 - dx} y1={22 - dy} x2={50 + dx} y2={22 + dy} stroke="#7b3fbf" strokeWidth={7} strokeLinecap="round" />
      {[-1, 1].map((s) => {
        const x = 50 + s * dx;
        const y = 22 + s * dy;
        return <path key={s} d={`M${x - 14} ${y + 16} q14 10 28 0 Z`} fill="#fff3cf" stroke={L} strokeWidth={3} strokeLinejoin="round" />;
      })}
      <circle cx={50} cy={22} r={5} fill="#f5b82e" stroke={L} strokeWidth={2.5} />
    </svg>
  );
}
