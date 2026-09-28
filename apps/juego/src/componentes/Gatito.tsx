/**
 * Gatito: mascota guía, inspirada en el logo de la Profesora Evelyn Álvarez
 * (gato de línea dentro de un círculo). Tiene estados de ánimo y accesorios
 * que se compran en la tienda.
 */

import type { Ranura } from '@balanza/nucleo';

export type Animo = 'normal' | 'feliz' | 'sorprendido' | 'pensando' | 'triste' | 'guino';

const PELAJES: Record<string, { pelaje: string; linea: string; fondo: string; ojos: string }> = {
  gatito: { pelaje: '#fffaf2', linea: '#22103d', fondo: '#efe6fb', ojos: '#22103d' },
  'gatita-violeta': { pelaje: '#c9a7f0', linea: '#22103d', fondo: '#fff3cf', ojos: '#22103d' },
  'gatito-dorado': { pelaje: '#ffd873', linea: '#22103d', fondo: '#fde4ee', ojos: '#22103d' },
  'gatita-fucsia': { pelaje: '#f7a8c6', linea: '#22103d', fondo: '#efe6fb', ojos: '#22103d' },
  'gatito-negro': { pelaje: '#2e2342', linea: '#120822', fondo: '#fff3cf', ojos: '#f5b82e' },
  'gatita-roja': { pelaje: '#ff9f80', linea: '#22103d', fondo: '#dcf5e8', ojos: '#22103d' },
};

export const NOMBRES_AVATAR: Record<string, string> = {
  gatito: 'Gatito crema',
  'gatita-violeta': 'Gatita violeta',
  'gatito-dorado': 'Gatito dorado',
  'gatita-fucsia': 'Gatita fucsia',
  'gatito-negro': 'Gatito negro',
  'gatita-roja': 'Gatita coral',
};

interface Props {
  avatar?: string;
  animo?: Animo;
  equipado?: Partial<Record<Ranura, string>>;
  circulo?: boolean;
  titulo?: string;
  className?: string;
}

function Ojos({ animo, color }: { animo: Animo; color: string }) {
  const brillo = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={2.4} fill="#fff" />;
  switch (animo) {
    case 'feliz':
      return (
        <g stroke={color} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d="M70 108 q9 -12 18 0" />
          <path d="M112 108 q9 -12 18 0" />
        </g>
      );
    case 'sorprendido':
      return (
        <g>
          <circle cx={79} cy={104} r={10} fill={color} />
          <circle cx={121} cy={104} r={10} fill={color} />
          {brillo(83, 100)}
          {brillo(125, 100)}
        </g>
      );
    case 'pensando':
      return (
        <g>
          <ellipse cx={79} cy={105} rx={7} ry={9} fill={color} />
          {brillo(81, 101)}
          <path d="M112 106 h18" stroke={color} strokeWidth={5} strokeLinecap="round" />
          <path d="M110 90 q10 -6 20 0" stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
        </g>
      );
    case 'triste':
      return (
        <g stroke={color} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d="M70 102 q9 10 18 0" />
          <path d="M112 102 q9 10 18 0" />
          <path d="M128 112 q3 8 0 12" stroke="#6ec3ff" strokeWidth={4} />
        </g>
      );
    case 'guino':
      return (
        <g>
          <ellipse cx={79} cy={105} rx={7} ry={9} fill={color} />
          {brillo(81, 101)}
          <path d="M112 108 q9 -12 18 0" stroke={color} strokeWidth={5} strokeLinecap="round" fill="none" />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx={79} cy={105} rx={7} ry={9} fill={color} />
          <ellipse cx={121} cy={105} rx={7} ry={9} fill={color} />
          {brillo(81, 101)}
          {brillo(123, 101)}
        </g>
      );
  }
}

function Boca({ animo, linea }: { animo: Animo; linea: string }) {
  if (animo === 'feliz' || animo === 'guino')
    return <path d="M88 124 q12 16 24 0 z" fill="#e0457b" stroke={linea} strokeWidth={3.5} strokeLinejoin="round" />;
  if (animo === 'sorprendido') return <ellipse cx={100} cy={130} rx={7} ry={8} fill="#a3124d" stroke={linea} strokeWidth={3} />;
  if (animo === 'triste') return <path d="M90 132 q10 -8 20 0" stroke={linea} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  return <path d="M91 124 q4.5 7 9 0 q4.5 7 9 0" stroke={linea} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
}

export function Gatito({ avatar = 'gatito', animo = 'normal', equipado = {}, circulo = true, titulo, className }: Props) {
  const c = PELAJES[avatar] ?? PELAJES.gatito!;
  const linea = c.linea;
  const trazo = { stroke: linea, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={titulo ?? 'Gatito'}>
      {titulo ? <title>{titulo}</title> : null}
      <defs>
        <clipPath id={`recorte-${avatar}`}>
          <circle cx={100} cy={100} r={92} />
        </clipPath>
      </defs>
      {circulo ? <circle cx={100} cy={100} r={93} fill={c.fondo} stroke="#22103d" strokeWidth={6} /> : null}
      <g clipPath={circulo ? `url(#recorte-${avatar})` : undefined}>
        {equipado.espalda === 'capa' ? (
          <path d="M44 150 q56 -34 112 0 l14 58 h-140 z" fill="#f5b82e" stroke={linea} strokeWidth={4} strokeLinejoin="round" />
        ) : null}
        {/* Cuerpo */}
        <ellipse cx={100} cy={188} rx={56} ry={44} fill={c.pelaje} {...trazo} />
        {/* Orejas */}
        <path d="M50 88 L58 32 L96 64 Z" fill={c.pelaje} {...trazo} />
        <path d="M150 88 L142 32 L104 64 Z" fill={c.pelaje} {...trazo} />
        <path d="M60 72 L64 46 L82 62 Z" fill="#f48fb1" />
        <path d="M140 72 L136 46 L118 62 Z" fill="#f48fb1" />
        {/* Cabeza */}
        <ellipse cx={100} cy={108} rx={60} ry={50} fill={c.pelaje} {...trazo} />
        {equipado.cuello === 'bufanda' ? (
          <g stroke={linea} strokeWidth={4} strokeLinejoin="round">
            <path d="M52 146 q48 22 96 0 l4 14 q-52 24 -104 0 z" fill="#7b3fbf" />
            <path d="M126 156 l8 34 l16 -4 l-8 -32 z" fill="#7b3fbf" />
            <path d="M70 154 l4 12 M92 158 l2 13 M114 157 l-1 13" stroke="#ffd873" strokeWidth={4} />
          </g>
        ) : null}
        {animo === 'feliz' || animo === 'guino' ? (
          <g fill="#f48fb1" opacity={0.7}>
            <ellipse cx={66} cy={122} rx={10} ry={6} />
            <ellipse cx={134} cy={122} rx={10} ry={6} />
          </g>
        ) : null}
        <Ojos animo={animo} color={c.ojos} />
        {/* Nariz y bigotes */}
        <path d="M94 116 h12 l-6 7 z" fill="#e0457b" stroke={linea} strokeWidth={2.5} strokeLinejoin="round" />
        <Boca animo={animo} linea={linea} />
        <g stroke={linea} strokeWidth={3} strokeLinecap="round">
          <path d="M66 118 L36 112" />
          <path d="M66 126 L36 130" />
          <path d="M134 118 L164 112" />
          <path d="M134 126 L164 130" />
        </g>
        {equipado.cara === 'lentes' ? (
          <g fill="rgba(255,255,255,0.35)" stroke="#f5b82e" strokeWidth={5} strokeLinejoin="round">
            <path d="M79 88 l5 10 l11 1 l-8 8 l2 11 l-10 -5 l-10 5 l2 -11 l-8 -8 l11 -1 z" />
            <path d="M121 88 l5 10 l11 1 l-8 8 l2 11 l-10 -5 l-10 5 l2 -11 l-8 -8 l11 -1 z" />
            <path d="M95 104 h10" />
          </g>
        ) : null}
        {equipado.cabeza === 'sombrero' ? (
          <g stroke={linea} strokeWidth={4} strokeLinejoin="round">
            <path d="M58 70 q42 -14 84 0 l-6 8 q-36 -10 -72 0 z" fill="#4b1d8f" />
            <path d="M68 70 L104 4 L132 70 z" fill="#7b3fbf" />
            <path d="M100 30 l3 6 l6 1 l-4 4 l1 6 l-6 -3 l-6 3 l1 -6 l-4 -4 l6 -1 z" fill="#ffd873" strokeWidth={2} />
            <circle cx={116} cy={54} r={4} fill="#ffd873" strokeWidth={2} />
          </g>
        ) : null}
        {equipado.cabeza === 'corona' ? (
          <g stroke={linea} strokeWidth={4} strokeLinejoin="round">
            <path d="M66 64 L72 28 L88 48 L100 20 L112 48 L128 28 L134 64 Z" fill="#f5b82e" />
            <circle cx={100} cy={52} r={6} fill="#e0457b" strokeWidth={2.5} />
            <circle cx={80} cy={56} r={4} fill="#7b3fbf" strokeWidth={2} />
            <circle cx={120} cy={56} r={4} fill="#7b3fbf" strokeWidth={2} />
          </g>
        ) : null}
        {equipado.cabeza === 'mono' ? (
          <g stroke={linea} strokeWidth={4} strokeLinejoin="round" transform="translate(132 52) rotate(18)">
            <path d="M0 0 L-22 -14 L-22 14 Z" fill="#e0457b" />
            <path d="M0 0 L22 -14 L22 14 Z" fill="#e0457b" />
            <circle r={7} fill="#f48fb1" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
