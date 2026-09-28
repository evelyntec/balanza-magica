import { useEffect, useState } from 'react';
import { textoGrafico, type PublicoGrafico, type TipoGrafico } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

const ANCHO = 640;
const MARGEN = 34;
const Y = 62;

/** Recta numérica con la solución dibujada: punto lleno, o círculo vacío y flecha. */
function Recta({ p, dibujos, borde }: { p: PublicoGrafico; dibujos: { valor: number; tipo: TipoGrafico; clase: string }[]; borde: number | undefined }) {
  const x = (v: number) => MARGEN + ((Math.min(Math.max(v, p.desde), p.hasta) - p.desde) / (p.hasta - p.desde)) * (ANCHO - 2 * MARGEN);
  const marcas = Array.from({ length: 11 }, (_, k) => p.desde + k * p.marca);
  return (
    <svg className="recta-grafico" viewBox={`0 0 ${ANCHO} 112`} role="img" aria-label={`Recta numérica de ${p.desde} a ${p.hasta}`}>
      <line x1={8} y1={Y} x2={ANCHO - 8} y2={Y} className="recta-grafico__eje" />
      <path d={`M${ANCHO - 4} ${Y} l-12 -7 v14 Z`} className="recta-grafico__punta" />
      <path d={`M4 ${Y} l12 -7 v14 Z`} className="recta-grafico__punta" />
      {marcas.map((m) => (
        <g key={m}>
          <line x1={x(m)} y1={Y - 8} x2={x(m)} y2={Y + 8} className="recta-grafico__eje" />
          <text x={x(m)} y={Y + 34} textAnchor="middle" className="recta-grafico__numero">
            {m}
          </text>
        </g>
      ))}
      {borde !== undefined ? <line x1={x(borde)} y1={Y - 26} x2={x(borde)} y2={Y + 12} className="recta-grafico__borde" /> : null}
      {dibujos.map((d, i) => {
        const cx = x(d.valor);
        const dy = i * -14;
        return (
          <g key={i} className={d.clase} transform={`translate(0 ${dy})`}>
            {d.tipo === 'izquierda' ? <line x1={cx} y1={Y - 16} x2={14} y2={Y - 16} className="rayo" /> : null}
            {d.tipo === 'derecha' ? <line x1={cx} y1={Y - 16} x2={ANCHO - 14} y2={Y - 16} className="rayo" /> : null}
            {d.tipo === 'izquierda' ? <path d={`M6 ${Y - 16} l14 -8 v16 Z`} className="rayo__punta" /> : null}
            {d.tipo === 'derecha' ? <path d={`M${ANCHO - 6} ${Y - 16} l-14 -8 v16 Z`} className="rayo__punta" /> : null}
            <circle cx={cx} cy={Y - 16} r={8} className={d.tipo === 'punto' ? 'punto--lleno' : 'punto--vacio'} />
            <text x={cx} y={Y - 32} textAnchor="middle" className="recta-grafico__valor">
              {d.valor}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const OPCIONES: { tipo: TipoGrafico; icono: string; texto: string }[] = [
  { tipo: 'izquierda', icono: '⟵○', texto: 'Todos los menores' },
  { tipo: 'punto', icono: '●', texto: 'Solo ese número' },
  { tipo: 'derecha', icono: '○⟶', texto: 'Todos los mayores' },
];

export function UIGraficoSolucion({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  // También sirve para "Ecuaciones de lava" (7°), cuyo público trae el texto listo.
  const p = item.publico as PublicoGrafico & { texto?: string };
  const texto = p.texto ?? textoGrafico(p);
  const [tipo, setTipo] = useState<TipoGrafico | null>(null);
  useEffect(() => setTipo(null), [item.id]);

  const enviar = () => {
    if (!casillas.completo || !tipo || bloqueado || cierre) return;
    alResponder({ valor: casillas.numeros[0], tipo });
  };
  const casillas = useCasillas(1, 4, item.id, enviar, !bloqueado && !cierre);
  const correcta = cierre ? (cierre.solucion.respuesta as { valor: number; tipo: TipoGrafico }) : null;
  const propia = casillas.valores[0] ? Number(casillas.valores[0]) : null;
  const borde = tieneAyuda(pistas, 'mostrarTotales')?.valor;

  const dibujos: { valor: number; tipo: TipoGrafico; clase: string }[] = [];
  if (correcta) dibujos.push({ ...correcta, clase: 'dibujo dibujo--correcto' });
  else if (propia !== null && tipo) dibujos.push({ valor: propia, tipo, clase: 'dibujo' });

  return (
    <>
      <div className="juego__escenario">
        {p.contexto ? (
          <div className="tarjeta tarjeta--papel" style={{ maxWidth: 640, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4 }}>
            {p.contexto}
          </div>
        ) : null}
        <div className="ecuacion" style={{ color: '#fff', fontSize: 'clamp(1.9rem, 7vw, 2.8rem)' }} aria-label={`Resuelve ${texto}`}>
          {texto}
        </div>
        <div className={`recta-grafico__marco ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
          <Recta p={p} dibujos={dibujos} borde={borde} />
        </div>
      </div>
      <div className="juego__panel">
        <div className="fila centro" style={{ gap: 10, fontWeight: 800, fontSize: '1.15rem' }}>
          <span>Borde:</span>
          <button type="button" className={`casilla ${!cierre ? 'casilla--activa' : ''} ${casillas.valores[0] ? 'casilla--llena' : ''}`} aria-label="Número del borde" disabled={bloqueado || !!cierre}>
            {correcta ? correcta.valor : casillas.valores[0] || ' '}
          </button>
        </div>
        <div className="opciones opciones--grafico" role="radiogroup" aria-label="Cómo se dibuja la solución">
          {OPCIONES.map((o) => {
            const marcada = correcta ? correcta.tipo === o.tipo : tipo === o.tipo;
            return (
              <button
                key={o.tipo}
                type="button"
                role="radio"
                aria-checked={marcada}
                aria-label={o.texto}
                className={`opcion ${marcada ? 'opcion--elegida' : ''}`}
                disabled={bloqueado || !!cierre}
                onClick={() => {
                  sonidos.toque();
                  setTipo(o.tipo);
                }}
              >
                <span className="opcion__signo" style={{ fontSize: '1.5rem' }} aria-hidden="true">
                  {o.icono}
                </span>
                <span style={{ fontSize: '0.9rem' }}>{o.texto}</span>
              </button>
            );
          })}
        </div>
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
