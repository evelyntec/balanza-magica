import { useEffect, useState } from 'react';
import type { PublicoProporcion, TipoProporcion } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import type { PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

const TIPOS: { tipo: TipoProporcion; texto: string; icono: string }[] = [
  { tipo: 'directa', texto: 'Directa', icono: '↗' },
  { tipo: 'inversa', texto: 'Inversa', icono: '↘' },
  { tipo: 'ninguna', texto: 'Ninguna', icono: '✕' },
];

/** Gráfico de los puntos de la tabla (y, al terminar, la recta o curva completa). */
function Grafico({ puntos, tipo }: { puntos: { x: number; y: number; propio?: boolean }[]; tipo: TipoProporcion | null }) {
  const W = 320;
  const H = 210;
  const M = { izq: 44, der: 12, arr: 12, aba: 28 };
  const maxX = Math.max(...puntos.map((p) => p.x)) * 1.1;
  const maxY = Math.max(...puntos.map((p) => p.y)) * 1.1 || 1;
  const px = (x: number) => M.izq + (x / maxX) * (W - M.izq - M.der);
  const py = (y: number) => H - M.aba - (y / maxY) * (H - M.arr - M.aba);
  const ordenados = [...puntos].sort((a, b) => a.x - b.x);
  let camino = '';
  if (tipo === 'directa') camino = `M${px(0)} ${py(0)} L${px(ordenados.at(-1)!.x)} ${py(ordenados.at(-1)!.y)}`;
  if (tipo === 'ninguna' && ordenados.length >= 2) {
    const [a, b] = [ordenados[0]!, ordenados.at(-1)!];
    const m = (b.y - a.y) / (b.x - a.x);
    camino = `M${px(0)} ${py(a.y - m * a.x)} L${px(b.x)} ${py(b.y)}`;
  }
  if (tipo === 'inversa') {
    const k = ordenados[0]!.x * ordenados[0]!.y;
    const x0 = ordenados[0]!.x;
    const x1 = ordenados.at(-1)!.x;
    camino = Array.from({ length: 40 }, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / 39;
      return `${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)} ${py(k / x).toFixed(1)}`;
    }).join(' ');
  }
  return (
    <svg className="grafico-proporcion" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de la tabla">
      <line x1={M.izq} y1={H - M.aba} x2={W - M.der} y2={H - M.aba} stroke="#22103d" strokeWidth={2} />
      <line x1={M.izq} y1={M.arr} x2={M.izq} y2={H - M.aba} stroke="#22103d" strokeWidth={2} />
      <text x={M.izq - 6} y={H - M.aba + 16} fontSize={12} fontWeight={800} textAnchor="end">
        0
      </text>
      {camino ? <path d={camino} fill="none" stroke="#2fb37a" strokeWidth={3} strokeDasharray="6 4" /> : null}
      <text x={M.izq - 6} y={py(Math.max(...puntos.map((q) => q.y))) + 4} fontSize={11} fontWeight={800} textAnchor="end">
        {Math.max(...puntos.map((q) => q.y))}
      </text>
      {puntos.map((p, i) => (
        <circle key={i} cx={px(p.x)} cy={py(p.y)} r={6} fill={p.propio ? '#e0457b' : '#7b3fbf'} stroke="#22103d" strokeWidth={1.5} />
      ))}
      {/* Etiquetas del eje x sin superponerse. */}
      {ordenados
        .filter((p, i, arr) => i === 0 || px(p.x) - px(arr[i - 1]!.x) >= 22 || i === arr.length - 1)
        .map((p) => (
          <text key={`e${p.x}`} x={px(p.x)} y={H - M.aba + 16} fontSize={11} fontWeight={800} textAnchor="middle">
            {p.x}
          </text>
        ))}
    </svg>
  );
}

export function UIProporcion({ item, bloqueado, cierre, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoProporcion;
  const huecos = p.filas.map((f, i) => (f.y === null ? i : -1)).filter((i) => i >= 0);
  const [tipo, setTipo] = useState<TipoProporcion | null>(null);
  useEffect(() => setTipo(null), [item.id]);

  const enviar = () => {
    if (!casillas.completo || !tipo || bloqueado || cierre) return;
    alResponder({ tipo, valores: casillas.numeros });
  };
  const casillas = useCasillas(huecos.length, 6, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as { tipo: TipoProporcion; valores: number[] }) : null;

  const valorEn = (i: number): string => {
    const k = huecos.indexOf(i);
    if (k < 0) return String(p.filas[i]!.y);
    return sol ? String(sol.valores[k]) : casillas.valores[k] ?? '';
  };
  const puntos = p.filas.flatMap((f, i) => {
    const v = valorEn(i);
    return v === '' ? [] : [{ x: f.x, y: Number(v), propio: f.y === null && !sol }];
  });

  return (
    <>
      <div className="juego__escenario">
        {p.contexto ? (
          <div className="tarjeta tarjeta--papel" style={{ maxWidth: 640, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4 }}>
            {p.contexto}
          </div>
        ) : null}
        <div className="proporcion">
          <table className={`tabla-regla ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            <thead>
              <tr>
                <th scope="col">{p.columnaX}</th>
                <th scope="col">{p.columnaY}</th>
              </tr>
            </thead>
            <tbody>
              {p.filas.map((f, i) => {
                const k = huecos.indexOf(i);
                return (
                  <tr key={f.x}>
                    <td>
                      <span className="tabla-regla__numero">{f.x}</span>
                    </td>
                    <td>
                      {k < 0 ? (
                        <span className="tabla-regla__numero">{f.y}</span>
                      ) : (
                        <button
                          type="button"
                          className={`casilla ${casillas.activa === k && !cierre ? 'casilla--activa' : ''} ${valorEn(i) ? 'casilla--llena' : ''}`}
                          onClick={() => casillas.setActiva(k)}
                          disabled={bloqueado || !!cierre}
                          aria-label={`Valor para ${f.x}${valorEn(i) ? `: ${valorEn(i)}` : ', vacío'}`}
                        >
                          {valorEn(i) || '?'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="tarjeta tarjeta--papel grafico-proporcion__marco">
            <Grafico puntos={puntos} tipo={sol ? sol.tipo : null} />
          </div>
        </div>
      </div>
      <div className="juego__panel">
        <div className="opciones opciones--grafico" role="radiogroup" aria-label="Tipo de relación">
          {TIPOS.map((o) => {
            const marcada = sol ? sol.tipo === o.tipo : tipo === o.tipo;
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
                <span style={{ fontSize: '0.95rem' }}>{o.texto}</span>
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
