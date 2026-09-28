/**
 * La balanza mágica (SVG).
 *
 * Correcta didácticamente:
 *  - siempre baja el lado más pesado; la inclinación crece con la diferencia
 *    (con un mínimo visible) hasta topar;
 *  - los platillos cuelgan siempre verticales, como en una balanza real;
 *  - el fiel (aguja central) marca el equilibrio;
 *  - los cubos se ordenan en torres de 5 con tonos alternados (conteo de a 5);
 *  - objetos iguales se dibujan iguales.
 */

import { useEffect, useId, useState, type ReactNode } from 'react';
import type { Objeto } from '@balanza/nucleo';
import { useResorte } from './useResorte';

export const COLORES_GRUPO = ['#e0457b', '#7b3fbf', '#f5b82e', '#2f8fce', '#2fb37a', '#e63946'];
const COLORES_GRUPO_OSCURO = ['#a3124d', '#4b1d8f', '#c98a00', '#1f6a9c', '#1e8a5a', '#a8222d'];

const PIVOTE = { x: 320, y: 120 };

/** Geometría normal y compacta (pantallas angostas: brazo más corto = objetos más grandes). */
const GEOMETRIA = {
  normal: { brazo: 250, plato: 116, cuerda: 110, caben: 208, vista: '-60 -30 760 490' },
  compacta: { brazo: 178, plato: 104, cuerda: 98, caben: 188, vista: '30 -30 580 490' },
};

function useCompacta(): boolean {
  const consulta = '(max-width: 640px)';
  const [compacta, setCompacta] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.(consulta).matches ?? false));
  useEffect(() => {
    const m = window.matchMedia?.(consulta);
    if (!m) return;
    const cambio = () => setCompacta(m.matches);
    m.addEventListener('change', cambio);
    return () => m.removeEventListener('change', cambio);
  }, []);
  return compacta;
}
const CUELGA = 96;
const CUBO = 23;

interface Props {
  izquierda: Objeto[];
  derecha: Objeto[];
  angulo: number;
  contenidoCaja?: number | undefined;
  trabada?: boolean;
  destello?: boolean;
  agrupar5?: boolean;
  pesasComoCubos?: boolean;
  totales?: { izquierda?: string; derecha?: string };
  etiquetas?: { izquierda?: string; derecha?: string };
  estilo?: string | undefined;
  titulo: string;
  resaltarCaja?: boolean;
}

interface Pieza {
  ancho: number;
  alto: number;
  dibujar: (x: number) => ReactNode;
}

function torres(cantidad: number, colorIndice: number, agrupar: boolean, clave: string, tamano = CUBO): Pieza {
  const columnas = Math.max(1, Math.ceil(cantidad / 5));
  const ancho = columnas * tamano + (columnas - 1) * 3;
  const alto = Math.min(cantidad, 5) * tamano;
  const color = COLORES_GRUPO[colorIndice % COLORES_GRUPO.length] as string;
  const oscuro = COLORES_GRUPO_OSCURO[colorIndice % COLORES_GRUPO_OSCURO.length] as string;
  return {
    ancho,
    alto: alto + (agrupar ? 16 : 0),
    dibujar: (x0) => (
      <g key={clave}>
        {Array.from({ length: cantidad }, (_, i) => {
          const col = Math.floor(i / 5);
          const fila = i % 5;
          const x = x0 + col * (tamano + 3);
          const y = -(fila + 1) * tamano;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={tamano - 1}
              height={tamano - 1}
              rx={3.5}
              fill={col % 2 === 0 ? color : oscuro}
              stroke="#22103d"
              strokeWidth={1.8}
            />
          );
        })}
        {agrupar
          ? Array.from({ length: columnas }, (_, col) => {
              const enTorre = Math.min(5, cantidad - col * 5);
              return (
                <text
                  key={`t${col}`}
                  x={x0 + col * (tamano + 3) + tamano / 2}
                  y={-Math.min(cantidad, 5) * tamano - 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={900}
                  fill="#22103d"
                >
                  {enTorre}
                </text>
              );
            })
          : null}
      </g>
    ),
  };
}

function pesa(valor: number, clave: string, etiqueta?: string): Pieza {
  const texto = etiqueta ?? String(valor);
  const digitos = texto.length;
  const ancho = 44 + digitos * 13;
  const alto = 62;
  return {
    ancho,
    alto,
    dibujar: (x0) => (
      <g key={clave}>
        <circle cx={x0 + ancho / 2} cy={-alto + 8} r={7} fill="none" stroke="#f5b82e" strokeWidth={4.5} />
        <path
          d={`M${x0 + 6} ${-alto + 14} h${ancho - 12} q4 0 5 4 l4 ${alto - 22} q1 4 -4 4 h${-(ancho - 2)} q-5 0 -4 -4 l4 ${-(alto - 22)} q1 -4 5 -4 z`}
          fill="#4b1d8f"
          stroke="#22103d"
          strokeWidth={2.5}
        />
        <text x={x0 + ancho / 2} y={-12} textAnchor="middle" fontSize={30} fontWeight={900} fill="#fff" fontFamily="'Baloo 2', Nunito, sans-serif">
          {texto}
        </text>
      </g>
    ),
  };
}

function caja(contenido: number | undefined, resaltar: boolean, clave: string, simbolo = '?'): Pieza {
  const ancho = 80;
  const alto = 80;
  const lleno = contenido !== undefined;
  return {
    ancho,
    alto: alto + 22,
    dibujar: (x0) => (
      <g key={clave}>
        {resaltar ? <rect x={x0 - 5} y={-alto - 5} width={ancho + 10} height={alto + 10} rx={14} fill="none" stroke="#ffd873" strokeWidth={4} strokeDasharray="6 5" /> : null}
        <rect
          x={x0}
          y={-alto}
          width={ancho}
          height={alto}
          rx={10}
          fill={lleno ? 'rgba(255,255,255,0.75)' : '#f5b82e'}
          stroke="#22103d"
          strokeWidth={3}
        />
        {lleno ? (
          <>
            {contenido > 20 ? (
              // Más de 20: barras de diez y unidades sueltas (como el material multibase).
              <>
                {Array.from({ length: Math.floor(contenido / 10) }, (_, i) => (
                  <rect key={`d${i}`} x={x0 + 5 + i * 7.6} y={-alto + 8} width={6.4} height={52} rx={2} fill={i % 2 === 0 ? '#7b3fbf' : '#4b1d8f'} stroke="#22103d" strokeWidth={1} />
                ))}
                {Array.from({ length: contenido % 10 }, (_, i) => (
                  <rect key={`u${i}`} x={x0 + 5 + i * 7.6} y={-15} width={6.4} height={6.4} rx={1.5} fill="#e0457b" stroke="#22103d" strokeWidth={1} />
                ))}
              </>
            ) : null}
            {Array.from({ length: contenido > 20 ? 0 : contenido }, (_, i) => {
              const fila = Math.floor(i / 5);
              const col = i % 5;
              return (
                <rect
                  key={i}
                  x={x0 + 6 + col * 14}
                  y={-6 - (fila + 1) * 14}
                  width={13}
                  height={13}
                  rx={2.5}
                  fill={fila % 2 === 0 ? '#e0457b' : '#a3124d'}
                  stroke="#22103d"
                  strokeWidth={1.2}
                />
              );
            })}
            <g transform={`translate(${x0 + ancho / 2} ${-alto - 14})`}>
              <rect x={-26} y={-14} width={52} height={28} rx={14} fill="#22103d" />
              <text y={7} textAnchor="middle" fontSize={21} fontWeight={900} fill="#ffd873">
                {contenido}
              </text>
            </g>
          </>
        ) : (
          <>
            <path d={`M${x0 + ancho / 2 - 6} ${-alto} v${alto}`} stroke="#e0457b" strokeWidth={8} />
            <text x={x0 + ancho / 2} y={-alto / 2 + 14} textAnchor="middle" fontSize={50} fontWeight={900} fill="#22103d" fontFamily="'Baloo 2', Nunito, sans-serif">
              {simbolo}
            </text>
          </>
        )}
      </g>
    ),
  };
}

function piezasDe(objetos: Objeto[], opciones: { contenidoCaja: number | undefined; agrupar: boolean; pesasComoCubos: boolean; resaltarCaja: boolean; lado: string }): Pieza[] {
  return objetos.map((o, i) => {
    const clave = `${opciones.lado}-${i}`;
    if (o.tipo === 'cubos') return torres(o.cantidad, o.color ?? i, opciones.agrupar, clave);
    if (o.tipo === 'pesa') return opciones.pesasComoCubos && o.valor <= 20 ? torres(o.valor, i + 2, true, clave) : pesa(o.valor, clave, o.etiqueta);
    return caja(opciones.contenidoCaja, opciones.resaltarCaja, clave, o.simbolo);
  });
}

function Contenido({ piezas, caben }: { piezas: Pieza[]; caben: number }) {
  const separacion = 10;
  const total = piezas.reduce((s, p) => s + p.ancho, 0) + separacion * Math.max(0, piezas.length - 1);
  const escala = Math.min(1, caben / Math.max(total, 1));
  let x = -total / 2;
  const dibujos = piezas.map((p) => {
    const d = p.dibujar(x);
    x += p.ancho + separacion;
    return d;
  });
  return <g transform={`translate(0 -3) scale(${escala})`}>{dibujos}</g>;
}

const ESTILOS: Record<string, { brazo: string; columna: string; base: string; plato: string; linea: string }> = {
  normal: { brazo: '#7b3fbf', columna: '#4b1d8f', base: '#2a1052', plato: '#fff3cf', linea: '#22103d' },
  balanza_dorada: { brazo: '#f5b82e', columna: '#e0a520', base: '#b37a00', plato: '#fff3cf', linea: '#22103d' },
  balanza_cristal: { brazo: 'rgba(200,170,245,0.75)', columna: 'rgba(180,140,230,0.6)', base: 'rgba(123,63,191,0.7)', plato: 'rgba(239,230,251,0.85)', linea: '#22103d' },
  balanza_arcoiris: { brazo: 'url(#arcoiris)', columna: '#e0457b', base: '#4b1d8f', plato: '#fff3cf', linea: '#22103d' },
};

export function Balanza({
  izquierda,
  derecha,
  angulo,
  contenidoCaja,
  trabada = false,
  destello = false,
  agrupar5 = false,
  pesasComoCubos = false,
  totales,
  etiquetas,
  estilo,
  titulo,
  resaltarCaja = false,
}: Props) {
  const id = useId().replace(/:/g, '');
  const g = GEOMETRIA[useCompacta() ? 'compacta' : 'normal'];
  const BRAZO = g.brazo;
  const theta = useResorte(trabada ? 0 : angulo);
  const rad = (theta * Math.PI) / 180;
  const dx = BRAZO * Math.cos(rad);
  const dy = BRAZO * Math.sin(rad);
  const extremoIzq = { x: PIVOTE.x - dx, y: PIVOTE.y - dy };
  const extremoDer = { x: PIVOTE.x + dx, y: PIVOTE.y + dy };
  const s = ESTILOS[estilo ?? 'normal'] ?? ESTILOS.normal!;
  const enEquilibrio = !trabada && Math.abs(angulo) < 0.01;
  const opciones = { contenidoCaja, agrupar: agrupar5, pesasComoCubos, resaltarCaja };

  const platillo = (extremo: { x: number; y: number }, objetos: Objeto[], lado: 'izquierda' | 'derecha') => (
    <g transform={`translate(${extremo.x} ${extremo.y})`}>
      <g stroke={s.linea} strokeWidth={2.5} strokeLinecap="round">
        <line x1={0} y1={0} x2={-g.cuerda} y2={CUELGA} />
        <line x1={0} y1={0} x2={g.cuerda} y2={CUELGA} />
        <line x1={0} y1={0} x2={0} y2={CUELGA - 4} strokeDasharray="4 4" opacity={0.6} />
      </g>
      <circle r={7} fill="#ffd873" stroke={s.linea} strokeWidth={3} />
      <g transform={`translate(0 ${CUELGA})`}>
        <Contenido piezas={piezasDe(objetos, { ...opciones, lado })} caben={g.caben} />
        <path d={`M${-g.plato} 0 Q0 42 ${g.plato} 0 Z`} fill={s.plato} stroke={s.linea} strokeWidth={3.5} strokeLinejoin="round" />
        <ellipse cx={0} cy={0} rx={g.plato} ry={8} fill={s.plato} stroke={s.linea} strokeWidth={3} />
        {totales?.[lado] ? (
          <g transform="translate(0 50)">
            <rect x={-62} y={-15} width={124} height={30} rx={15} fill="#22103d" />
            <text y={6} textAnchor="middle" fontSize={17} fontWeight={900} fill="#ffd873">
              {totales[lado]}
            </text>
          </g>
        ) : null}
        {etiquetas?.[lado] ? (
          <text y={totales?.[lado] ? 92 : 54} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" stroke="#22103d" strokeWidth={5} paintOrder="stroke" fontFamily="'Baloo 2', Nunito, sans-serif">
            {etiquetas[lado]}
          </text>
        ) : null}
      </g>
    </g>
  );

  return (
    <svg className="balanza-svg" viewBox={g.vista} role="img" aria-label={titulo}>
      <title>{titulo}</title>
      <defs>
        <radialGradient id={`brillo-${id}`}>
          <stop offset="0%" stopColor="#ffd873" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ffd873" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="arcoiris" x1="0" x2="1">
          <stop offset="0%" stopColor="#e63946" />
          <stop offset="25%" stopColor="#f5b82e" />
          <stop offset="50%" stopColor="#2fb37a" />
          <stop offset="75%" stopColor="#2f8fce" />
          <stop offset="100%" stopColor="#7b3fbf" />
        </linearGradient>
      </defs>

      {destello ? (
        <g>
          <circle cx={PIVOTE.x} cy={PIVOTE.y} r={170} fill={`url(#brillo-${id})`}>
            <animate attributeName="r" values="120;190;120" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path
              key={a}
              transform={`translate(${PIVOTE.x + 150 * Math.cos((a * Math.PI) / 180)} ${PIVOTE.y + 70 * Math.sin((a * Math.PI) / 180)})`}
              d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z"
              fill="#fff"
            >
              <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${a / 300}s`} repeatCount="indefinite" />
            </path>
          ))}
        </g>
      ) : null}

      {/* Base y columna */}
      <path d="M220 440 Q320 400 420 440 Z" fill={s.base} stroke={s.linea} strokeWidth={4} strokeLinejoin="round" />
      <rect x={306} y={PIVOTE.y + 8} width={28} height={440 - PIVOTE.y - 22} rx={12} fill={s.columna} stroke={s.linea} strokeWidth={4} />
      <rect x={286} y={420} width={68} height={16} rx={8} fill={s.columna} stroke={s.linea} strokeWidth={3.5} />

      {/* Escala del fiel */}
      <path d={`M${PIVOTE.x - 44} ${PIVOTE.y - 64} A 70 70 0 0 1 ${PIVOTE.x + 44} ${PIVOTE.y - 64}`} fill="none" stroke="#ffffff88" strokeWidth={4} strokeLinecap="round" />
      <line x1={PIVOTE.x} y1={PIVOTE.y - 80} x2={PIVOTE.x} y2={PIVOTE.y - 66} stroke={enEquilibrio ? '#ffd873' : '#ffffffaa'} strokeWidth={enEquilibrio ? 6 : 4} strokeLinecap="round" />

      {/* Brazo y fiel */}
      <g transform={`rotate(${theta} ${PIVOTE.x} ${PIVOTE.y})`}>
        <rect x={PIVOTE.x - BRAZO - 6} y={PIVOTE.y - 9} width={2 * BRAZO + 12} height={18} rx={9} fill={s.brazo} stroke={s.linea} strokeWidth={4} />
        <path d={`M${PIVOTE.x - 9} ${PIVOTE.y - 6} L${PIVOTE.x} ${PIVOTE.y - 70} L${PIVOTE.x + 9} ${PIVOTE.y - 6} Z`} fill="#ffd873" stroke={s.linea} strokeWidth={3} strokeLinejoin="round" />
      </g>

      {platillo(extremoIzq, izquierda, 'izquierda')}
      {platillo(extremoDer, derecha, 'derecha')}

      {/* Pivote con gema */}
      <circle cx={PIVOTE.x} cy={PIVOTE.y} r={20} fill="#f5b82e" stroke={s.linea} strokeWidth={4} />
      <path
        transform={`translate(${PIVOTE.x} ${PIVOTE.y})`}
        d="M0 -11 L3.5 -3.5 L11 0 L3.5 3.5 L0 11 L-3.5 3.5 L-11 0 L-3.5 -3.5 Z"
        fill={enEquilibrio ? '#fff' : '#e0457b'}
      />

      {trabada ? (
        <g transform={`translate(${PIVOTE.x} ${PIVOTE.y + 46})`} aria-hidden="true">
          <path d="M-12 -4 v-10 a12 12 0 0 1 24 0 v10" fill="none" stroke={s.linea} strokeWidth={5} />
          <rect x={-18} y={-6} width={36} height={28} rx={7} fill="#e0457b" stroke={s.linea} strokeWidth={3.5} />
          <circle cy={6} r={4} fill={s.linea} />
        </g>
      ) : null}
    </svg>
  );
}
