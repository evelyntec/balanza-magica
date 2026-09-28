import { useEffect, useState } from 'react';
import type { PublicoFuncion } from '@balanza/nucleo';
import { BotonSigno, conSigno, texto } from '../componentes/BotonSigno';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import type { PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

/** Diagrama sagital: dos conjuntos (óvalos) y flechas de x a f(x). Los elementos de la izquierda se pueden tocar. */
function Diagrama({ p, marcado, alTocar, habilitado, resaltar }: { p: PublicoFuncion; marcado: number | null; alTocar: (x: number) => void; habilitado: boolean; resaltar: number | null }) {
  const W = 340;
  const alto = Math.max(p.dominio.length, p.codominio.length) * 44 + 40;
  const yDe = (i: number, total: number) => 20 + ((i + 0.5) * (alto - 40)) / total;
  const posX = new Map(p.dominio.map((x, i) => [x, yDe(i, p.dominio.length)]));
  const posY = new Map(p.codominio.map((y, i) => [y, yDe(i, p.codominio.length)]));
  const [xi, xd] = [80, 260];
  return (
    <svg className="diagrama-funcion" viewBox={`0 0 ${W} ${alto}`} role="img" aria-label="Diagrama de flechas">
      <defs>
        <marker id="punta-flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#22103d" />
        </marker>
      </defs>
      <ellipse cx={xi} cy={alto / 2} rx={52} ry={alto / 2 - 6} fill="#efe6fb" stroke="#22103d" strokeWidth={2.5} />
      <ellipse cx={xd} cy={alto / 2} rx={52} ry={alto / 2 - 6} fill="#fff3cf" stroke="#22103d" strokeWidth={2.5} />
      <text x={xi} y={16} textAnchor="middle" fontWeight={900} fontSize={14}>
        x
      </text>
      <text x={xd} y={16} textAnchor="middle" fontWeight={900} fontSize={14}>
        f(x)
      </text>
      {p.flechas.map(([x, y], i) => (
        <line
          key={i}
          x1={xi + 20}
          y1={posX.get(x)}
          x2={xd - 22}
          y2={posY.get(y)}
          stroke={resaltar === x ? '#e0457b' : '#22103d'}
          strokeWidth={resaltar === x ? 3.5 : 2}
          markerEnd="url(#punta-flecha)"
        />
      ))}
      {p.dominio.map((x) => (
        <g
          key={`x${x}`}
          role="button"
          tabIndex={habilitado ? 0 : -1}
          aria-label={`Elemento ${texto(x)}`}
          aria-pressed={marcado === x}
          onClick={() => habilitado && alTocar(x)}
          onKeyDown={(e) => habilitado && (e.key === 'Enter' || e.key === ' ') && alTocar(x)}
          style={{ cursor: habilitado ? 'pointer' : 'default' }}
        >
          <circle cx={xi} cy={posX.get(x)} r={17} fill={marcado === x ? '#e0457b' : '#fff'} stroke="#22103d" strokeWidth={2} />
          <text x={xi} y={posX.get(x)! + 6} textAnchor="middle" fontWeight={900} fontSize={16} fill={marcado === x ? '#fff' : '#22103d'}>
            {texto(x)}
          </text>
        </g>
      ))}
      {p.codominio.map((y) => (
        <g key={`y${y}`}>
          <circle cx={xd} cy={posY.get(y)} r={17} fill="#fff" stroke="#22103d" strokeWidth={2} />
          <text x={xd} y={posY.get(y)! + 6} textAnchor="middle" fontWeight={900} fontSize={15}>
            {texto(y)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function UIFuncion({ item, bloqueado, cierre, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoFuncion;
  const conCalculo = p.evaluarEn !== undefined;
  const [esFuncion, setEsFuncion] = useState<boolean | null>(null);
  const [culpable, setCulpable] = useState<number | null>(null);
  const [signos, setSignos] = useState<('+' | '-')[]>(['+', '+', '+']);
  useEffect(() => {
    setEsFuncion(null);
    setCulpable(null);
    setSignos(['+', '+', '+']);
  }, [item.id]);

  const enviar = () => {
    if (bloqueado || cierre || esFuncion === null) return;
    if (!esFuncion) {
      if (culpable !== null) alResponder({ esFuncion: false, culpable });
      return;
    }
    if (!casillas.completo) return;
    const [m, n, resultado] = casillas.numeros.map((v, i) => conSigno(signos[i]!, v));
    alResponder(conCalculo ? { esFuncion: true, m, n, resultado } : { esFuncion: true, m, n });
  };
  const casillas = useCasillas(conCalculo ? 3 : 2, 4, item.id, enviar, !bloqueado && !cierre && esFuncion === true);
  const sol = cierre ? (cierre.solucion.respuesta as { esFuncion: boolean; culpable?: number; m?: number; n?: number; resultado?: number }) : null;
  const eleccion = sol ? sol.esFuncion : esFuncion;

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
        <div className={`tarjeta tarjeta--papel diagrama-funcion__marco ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
          <Diagrama
            p={p}
            marcado={sol ? (sol.culpable ?? null) : culpable}
            alTocar={(x) => {
              sonidos.toque();
              setCulpable(x);
            }}
            habilitado={!bloqueado && !cierre && esFuncion === false}
            resaltar={sol?.culpable ?? null}
          />
        </div>
        {esFuncion === false && !cierre ? <p className="leyenda-terminos">Toca el número de la izquierda que falla.</p> : null}
      </div>
      <div className="juego__panel">
        <div className="opciones opciones--grafico" role="radiogroup" aria-label="¿Es función?" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {[
            { v: true, t: 'Es función', i: '✓' },
            { v: false, t: 'No es función', i: '✕' },
          ].map((o) => (
            <button
              key={o.t}
              type="button"
              role="radio"
              aria-checked={eleccion === o.v}
              aria-label={o.t}
              className={`opcion ${eleccion === o.v ? 'opcion--elegida' : ''}`}
              disabled={bloqueado || !!cierre}
              onClick={() => {
                sonidos.toque();
                setEsFuncion(o.v);
              }}
            >
              <span className="opcion__signo" style={{ fontSize: '1.4rem' }} aria-hidden="true">
                {o.i}
              </span>
              <span style={{ fontSize: '0.95rem' }}>{o.t}</span>
            </button>
          ))}
        </div>
        {eleccion === true ? (
          <>
            <div className="formula" aria-label="Regla">
              <span className="formula__nombre">f(x) =</span>
              {casilla(0, 'Número que multiplica a x')}
              <span>x</span>
              {casilla(1, 'Número que se suma')}
            </div>
            {conCalculo ? (
              <div className="formula">
                <span className="formula__nombre">f({texto(p.evaluarEn!)}) =</span>
                {casilla(2, `f de ${texto(p.evaluarEn!)}`)}
              </div>
            ) : null}
          </>
        ) : null}
        {!cierre && eleccion === true ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {!cierre && eleccion === false ? (
          <button type="button" className="boton boton--fucsia boton--grande boton--ancho" disabled={bloqueado || culpable === null} onClick={enviar}>
            Revisar
          </button>
        ) : null}
        {pie}
      </div>
    </>
  );
}
