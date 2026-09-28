import { useEffect, useState } from 'react';
import type { PublicoAfin } from '@balanza/nucleo';
import { BotonSigno, conSigno, texto } from '../componentes/BotonSigno';
import { Teclado } from '../componentes/Comunes';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

/** Plano cartesiano con cuadrícula, la recta y dos puntos marcados (y la recta base si es traslación). */
function Plano({ p, correcta, pendiente }: { p: PublicoAfin; correcta: { m: number; n: number } | null; pendiente: boolean }) {
  const v = p.ventana!;
  const W = 340;
  const H = 300;
  const M = 20;
  const IZQ = 34; // espacio para los números del eje y
  const sx = (W - IZQ - M) / (v.xmax - v.xmin);
  const sy = (H - 2 * M) / (v.ymax - v.ymin);
  const px = (x: number) => IZQ + (x - v.xmin) * sx;
  const py = (y: number) => H - M - (y - v.ymin) * sy;
  const pasoY = Math.max(1, Math.ceil((v.ymax - v.ymin) / 12));
  const recta = (m: number, n: number, clase: string, clave: string) => (
    <line key={clave} x1={px(v.xmin)} y1={py(m * v.xmin + n)} x2={px(v.xmax)} y2={py(m * v.xmax + n)} className={clase} />
  );
  const [a, b] = p.puntos!;
  return (
    <svg className="plano" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Recta que pasa por (${texto(a![0])}, ${texto(a![1])}) y (${texto(b![0])}, ${texto(b![1])})`}>
      <defs>
        <clipPath id="recorte-plano">
          <rect x={IZQ} y={M} width={W - IZQ - M} height={H - 2 * M} />
        </clipPath>
      </defs>
      {Array.from({ length: v.xmax - v.xmin + 1 }, (_, i) => v.xmin + i).map((x) => (
        <line key={`vx${x}`} x1={px(x)} y1={M} x2={px(x)} y2={H - M} className="plano__cuadricula" />
      ))}
      {Array.from({ length: Math.floor((v.ymax - v.ymin) / pasoY) + 1 }, (_, i) => Math.ceil(v.ymin / pasoY) * pasoY + i * pasoY)
        .filter((y) => y <= v.ymax)
        .map((y) => (
          <g key={`hy${y}`}>
            <line x1={IZQ} y1={py(y)} x2={W - M} y2={py(y)} className="plano__cuadricula" />
            {y !== 0 ? (
              <text x={Math.max(px(0), IZQ) - 5} y={py(y) + 4} textAnchor="end" className="plano__numero plano__numero--fondo">
                {texto(y)}
              </text>
            ) : null}
          </g>
        ))}
      {v.xmin <= 0 && v.xmax >= 0 ? <line x1={px(0)} y1={M} x2={px(0)} y2={H - M} className="plano__eje" /> : null}
      {v.ymin <= 0 && v.ymax >= 0 ? <line x1={IZQ} y1={py(0)} x2={W - M} y2={py(0)} className="plano__eje" /> : null}
      {Array.from({ length: v.xmax - v.xmin + 1 }, (_, i) => v.xmin + i)
        .filter((x) => x !== 0 && (v.xmax - v.xmin <= 12 || x % 2 === 0))
        .map((x) => (
          <text key={`nx${x}`} x={px(x)} y={Math.min(Math.max(py(0) + 15, M + 12), H - 4)} textAnchor="middle" className="plano__numero">
            {texto(x)}
          </text>
        ))}
      <g clipPath="url(#recorte-plano)">
        {p.base !== undefined ? recta(p.base, 0, 'plano__base', 'base') : null}
        {recta((b![1] - a![1]) / (b![0] - a![0]), a![1] - ((b![1] - a![1]) / (b![0] - a![0])) * a![0], 'plano__recta', 'recta')}
        {correcta ? recta(correcta.m, correcta.n, 'plano__correcta', 'correcta') : null}
      </g>
      {pendiente ? (
        <path d={`M${px(a![0])} ${py(a![1])} H${px(b![0])} V${py(b![1])}`} className="plano__escalon" />
      ) : null}
      {[a!, b!].map(([x, y]) => (
        <g key={`p${x}`}>
          <circle cx={px(x)} cy={py(y)} r={5.5} className="plano__punto" />
          <text x={px(x) + 8} y={py(y) - 8} className="plano__coordenada">
            ({texto(x)}, {texto(y)})
          </text>
        </g>
      ))}
    </svg>
  );
}

export function UIAfin({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoAfin;
  const conCalculo = p.evaluarEn !== undefined;
  const [signos, setSignos] = useState<('+' | '-')[]>(['+', '+', '+']);
  useEffect(() => setSignos(['+', '+', '+']), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    const [m, n, resultado] = casillas.numeros.map((v, i) => conSigno(signos[i]!, v));
    alResponder(conCalculo ? { m, n, resultado } : { m, n });
  };
  const casillas = useCasillas(conCalculo ? 3 : 2, 7, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as { m: number; n: number; resultado?: number }) : null;
  const pendiente = Boolean(tieneAyuda(pistas, 'mostrarSaltos'));
  const variable = p.modo === 'interes' ? 't' : 'x';

  const casilla = (k: number, etiqueta: string) => {
    const vSol = sol ? [sol.m, sol.n, sol.resultado][k] : undefined;
    const valor = vSol !== undefined ? texto(vSol) : casillas.valores[k];
    return (
      <span className="casilla-con-signo">
        {!sol ? <BotonSigno signo={signos[k]!} alCambiar={() => setSignos((s) => s.map((x, i) => (i === k ? (x === '+' ? '-' : '+') : x)))} deshabilitado={bloqueado} etiqueta={`Signo de ${etiqueta}`} /> : null}
        <button
          type="button"
          className={`casilla casilla--formula ${casillas.activa === k && !cierre ? 'casilla--activa' : ''} ${valor ? 'casilla--llena' : ''}`}
          onClick={() => casillas.setActiva(k)}
          disabled={bloqueado || !!cierre}
          aria-label={`${etiqueta}${valor ? `: ${valor}` : ', vacía'}`}
        >
          {valor || '?'}
        </button>
      </span>
    );
  };

  return (
    <>
      <div className="juego__escenario">
        {p.contexto ? (
          <div className="tarjeta tarjeta--papel" style={{ maxWidth: 640, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4 }}>
            {p.contexto}
          </div>
        ) : null}
        {p.puntos ? (
          <div className={`tarjeta tarjeta--papel plano__marco ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            <Plano p={p} correcta={sol} pendiente={pendiente} />
            {p.base !== undefined ? <p className="plano__leyenda">Punteada: y = {p.base === 1 ? '' : p.base === -1 ? '−' : texto(p.base)}x</p> : null}
          </div>
        ) : null}
        {p.tabla ? (
          <table className={`tabla-regla ${reintentos > 0 ? 'sacudir' : ''}`} key={`t${reintentos}`}>
            <thead>
              <tr>
                <th scope="col">{p.columnas?.[0] ?? 'x'}</th>
                <th scope="col">{p.columnas?.[1] ?? 'f(x)'}</th>
              </tr>
            </thead>
            <tbody>
              {p.tabla.map((f) => (
                <tr key={f.x}>
                  <td>
                    <span className="tabla-regla__numero">{texto(f.x)}</span>
                  </td>
                  <td>
                    <span className="tabla-regla__numero">{texto(f.y)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
      <div className="juego__panel">
        <div className="formula" aria-label="Función">
          <span className="formula__nombre">f({variable}) =</span>
          {casilla(0, `Pendiente m`)}
          <span>{variable}</span>
          {casilla(1, 'Coeficiente de posición n')}
        </div>
        {conCalculo ? (
          <div className="formula">
            <span className="formula__nombre">
              f({texto(p.evaluarEn!)}) =
            </span>
            {casilla(2, `f de ${texto(p.evaluarEn!)}`)}
          </div>
        ) : null}
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
