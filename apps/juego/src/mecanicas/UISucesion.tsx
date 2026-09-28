import { Fragment, useEffect, useState } from 'react';
import type { PublicoSucesion } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { FiguraSucesion } from '../componentes/FiguraSucesion';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

const signo = (d: number) => (d >= 0 ? `+${d}` : `−${-d}`);

export function UISucesion({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoSucesion;
  const pr = p.pregunta;
  const cantidad = pr.tipo === 'siguientes' ? pr.cantidad : 1;
  const [regla, setRegla] = useState<number | null>(null);
  useEffect(() => setRegla(null), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    if (p.opcionesRegla && regla === null) return;
    alResponder(p.opcionesRegla ? { valores: casillas.numeros, regla } : { valores: casillas.numeros });
  };
  const casillas = useCasillas(cantidad, 4, item.id, enviar, !bloqueado && !cierre);
  const respuesta = cierre ? (cierre.solucion.respuesta as { valores: number[]; regla?: number }) : null;
  const saltos = Boolean(tieneAyuda(pistas, 'mostrarSaltos'));
  const figuras = p.modo === 'figuras' && p.figura;

  const casilla = (k: number, etiqueta: string) => {
    const valor = respuesta ? String(respuesta.valores[k]) : casillas.valores[k];
    return (
      <button
        type="button"
        className={`piedra piedra--hueco ${casillas.activa === k && !cierre ? 'piedra--activa' : ''}`}
        onClick={() => casillas.setActiva(k)}
        disabled={bloqueado || !!cierre}
        aria-label={`${etiqueta}${valor ? `: ${valor}` : ', vacía'}`}
      >
        {valor || '?'}
      </button>
    );
  };

  const t = p.terminos;
  const buscada =
    pr.tipo === 'termino'
      ? { etiqueta: figuras ? `Figura ${pr.posicion}` : `Posición ${pr.posicion}` }
      : pr.tipo === 'posicion'
        ? { etiqueta: figuras ? `Figura con ${pr.valor} ${p.unidad}` : `El número ${pr.valor}` }
        : null;

  return (
    <>
      <div className="juego__escenario">
        {figuras ? (
          <div className={`figuras ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            {t.map((x, i) => (
              <Fragment key={x.posicion}>
                {i > 0 && saltos ? <span className="salto">{signo(x.valor - t[i - 1]!.valor)}</span> : null}
                <figure className="figuras__una">
                  <FiguraSucesion figura={p.figura!} n={x.posicion} />
                  <figcaption>
                    Figura {x.posicion}
                    {saltos ? <strong> · {x.valor}</strong> : null}
                  </figcaption>
                </figure>
              </Fragment>
            ))}
          </div>
        ) : (
          <div className={`sendero ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} role="list" aria-label="Sucesión">
            {t.map((x, i) => (
              <Fragment key={x.posicion}>
                {i > 0 && saltos ? <span className="salto">{signo(x.valor - t[i - 1]!.valor)}</span> : null}
                <div className="huella" role="listitem">
                  <span className="huella__pos">{x.posicion}°</span>
                  <span className="piedra">{x.valor}</span>
                </div>
              </Fragment>
            ))}
            {pr.tipo === 'siguientes' ? (
              [0, 1].map((k) => (
                <div className="huella" key={k}>
                  <span className="huella__pos">{t.length + k + 1}°</span>
                  {casilla(k, `Término ${t.length + k + 1}`)}
                </div>
              ))
            ) : (
              <span className="sendero__puntos" aria-hidden="true">
                · · ·
              </span>
            )}
          </div>
        )}
        {buscada ? (
          <div className="pregunta-lejana">
            <span className="pregunta-lejana__icono" aria-hidden="true">
              🔮
            </span>
            {pr.tipo === 'termino' ? (
              <>
                <span>{buscada.etiqueta}:</span>
                {casilla(0, buscada.etiqueta)}
                {p.unidad ? <span>{p.unidad}</span> : null}
              </>
            ) : (
              <>
                <span>{buscada.etiqueta} está en la {figuras ? 'figura' : 'posición'}</span>
                {casilla(0, figuras ? 'Número de la figura' : 'Posición')}
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="juego__panel">
        {p.opcionesRegla ? (
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 800 }}>¿Qué regla sirve para CUALQUIER {figuras ? 'figura' : 'posición'}?</p>
            <div className="opciones opciones--lista" role="radiogroup" aria-label="Reglas posibles">
              {p.opcionesRegla.map((r, i) => {
                const marcada = respuesta ? respuesta.regla === i : regla === i;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={marcada}
                    className={`opcion ${marcada ? 'opcion--elegida' : ''}`}
                    disabled={bloqueado || !!cierre}
                    onClick={() => {
                      sonidos.toque();
                      setRegla(i);
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
