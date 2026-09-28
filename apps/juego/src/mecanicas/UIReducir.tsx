import { useEffect, useState } from 'react';
import { textoAlgebraico, textoTermino, type PublicoReducir, type TerminoAlgebraico } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

const COLOR: Record<string, string> = { x: '#7b3fbf', y: '#1f9e8f', z: '#e07b1f', '': '#6b6b6b' };

/** Saco (término positivo, pesa) o globo (término negativo, tira hacia arriba). */
function Icono({ variable, globo }: { variable: string; globo: boolean }) {
  const c = COLOR[variable] ?? '#7b3fbf';
  return globo ? (
    <svg viewBox="0 0 30 44" className="icono-termino" aria-hidden="true">
      <path d="M15 30 q-2 6 1 13" stroke="#22103d" strokeWidth={1.5} fill="none" />
      <ellipse cx={15} cy={15} rx={12} ry={14} fill={c} fillOpacity={0.35} stroke={c} strokeWidth={2.5} />
      <path d="M12 29 h6 l-3 3 Z" fill={c} />
      <text x={15} y={20} textAnchor="middle" fontSize={14} fontWeight={900} fill="#22103d">
        {variable}
      </text>
    </svg>
  ) : (
    <svg viewBox="0 0 30 44" className="icono-termino" aria-hidden="true">
      <path d="M8 14 q-4 14 1 26 h12 q5 -12 1 -26 Z" fill={c} stroke="#22103d" strokeWidth={1.5} />
      <path d="M9 14 l3 -6 h6 l3 6" fill={c} stroke="#22103d" strokeWidth={1.5} />
      <path d="M10 14 h10" stroke="#f5b82e" strokeWidth={2.5} />
      <text x={15} y={33} textAnchor="middle" fontSize={13} fontWeight={900} fill="#fff">
        {variable}
      </text>
    </svg>
  );
}

function Grupo({ t, i }: { t: TerminoAlgebraico; i: number }) {
  const n = Math.abs(t.coef);
  return (
    <div className={`grupo-terminos ${t.coef < 0 ? 'grupo-terminos--globos' : ''}`} aria-label={`${t.coef < 0 ? 'menos' : 'más'} ${n} ${t.variable}`}>
      <span className="grupo-terminos__texto">{textoTermino(t, i === 0)}</span>
      <div className="grupo-terminos__iconos">
        {Array.from({ length: n }, (_, k) => (
          <Icono key={k} variable={t.variable} globo={t.coef < 0} />
        ))}
      </div>
    </div>
  );
}

export function UIReducir({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoReducir;
  const nombres = [...p.variables, ...(p.conConstante ? [''] : [])];
  const [signos, setSignos] = useState<('+' | '-')[]>(() => nombres.map(() => '+'));
  useEffect(() => setSignos(nombres.map(() => '+')), [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    const valores = casillas.numeros.map((v, i) => (signos[i] === '-' ? -v : v));
    alResponder(p.conConstante ? { coefs: valores.slice(0, -1), constante: valores.at(-1) } : { coefs: valores });
  };
  const casillas = useCasillas(nombres.length, 3, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as { coefs: number[]; constante?: number }) : null;
  const solValores = sol ? [...sol.coefs, ...(p.conConstante ? [sol.constante ?? 0] : [])] : null;
  const agrupar = Boolean(tieneAyuda(pistas, 'resaltarNucleo'));
  const terminos = agrupar ? [...p.terminos].sort((a, b) => nombres.indexOf(a.variable) - nombres.indexOf(b.variable)) : p.terminos;

  return (
    <>
      <div className="juego__escenario">
        <div className="ecuacion" style={{ color: '#fff', fontSize: 'clamp(1.6rem, 6.5vw, 2.6rem)' }} aria-label={`Expresión: ${textoAlgebraico(p.terminos)}`}>
          {textoAlgebraico(p.terminos)}
        </div>
        {p.pictorico ? (
          <div className={`terminos ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            {terminos.map((t, i) => (
              <Grupo key={`${t.variable}-${i}-${t.coef}`} t={t} i={i} />
            ))}
          </div>
        ) : null}
        {p.pictorico ? <p className="leyenda-terminos">Saco = suma · Globo = resta · un globo anula un saco de la misma letra</p> : null}
      </div>
      <div className="juego__panel">
        <p style={{ margin: 0, fontWeight: 800 }}>Expresión reducida (usa 0 si una letra desaparece):</p>
        <div className="reducida">
          {nombres.map((v, i) => {
            const valor = solValores ? String(Math.abs(solValores[i]!)) : casillas.valores[i];
            const signo = solValores ? (solValores[i]! < 0 ? '-' : '+') : signos[i];
            return (
              <div className="reducida__termino" key={v || 'c'}>
                <button
                  type="button"
                  className="boton boton--chico boton--violeta formula__signo"
                  aria-label={`Signo de ${v || 'los números solos'}: ${signo === '+' ? 'más' : 'menos'}. Tocar para cambiar`}
                  disabled={bloqueado || !!cierre}
                  onClick={() => {
                    sonidos.toque();
                    setSignos((s) => s.map((x, k) => (k === i ? (x === '+' ? '-' : '+') : x)));
                  }}
                >
                  {signo === '+' ? '+' : '−'}
                </button>
                <button
                  type="button"
                  className={`casilla casilla--formula ${casillas.activa === i && !cierre ? 'casilla--activa' : ''} ${valor ? 'casilla--llena' : ''}`}
                  onClick={() => casillas.setActiva(i)}
                  disabled={bloqueado || !!cierre}
                  aria-label={`Coeficiente de ${v || 'los números solos'}${valor ? `: ${valor}` : ', vacío'}`}
                >
                  {valor || '?'}
                </button>
                <span className="reducida__letra" style={{ color: COLOR[v] }}>
                  {v}
                </span>
              </div>
            );
          })}
        </div>
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
