import { Fragment, useEffect, useMemo } from 'react';
import type { Objeto, PublicoRegistrar, SecretoRegistrar } from '@balanza/nucleo';
import { Balanza, COLORES_GRUPO } from '../componentes/Balanza';
import { Teclado } from '../componentes/Comunes';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

const colorDe = (o: Objeto, i: number) => (o.tipo === 'cubos' ? (COLORES_GRUPO[(o.color ?? i) % COLORES_GRUPO.length] as string) : '#7b3fbf');

export function UIRegistrar({ item, bloqueado, cierre, pistas, reintentos, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoRegistrar;
  const nIzq = p.izquierda.length;
  const total = nIzq + p.derecha.length;
  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    alResponder({ izquierda: casillas.numeros.slice(0, nIzq), derecha: casillas.numeros.slice(nIzq) });
  };
  const casillas = useCasillas(total, 2, item.id, enviar, !bloqueado && !cierre);

  const solucion = cierre ? (cierre.solucion.respuesta as SecretoRegistrar) : null;
  const mostrados = useMemo(
    () => (solucion ? [...solucion.izquierda, ...solucion.derecha].map(String) : casillas.valores),
    [solucion, casillas.valores],
  );

  useEffect(() => {
    // Tras un reintento se deja todo escrito para que la o el estudiante corrija.
  }, [reintentos]);

  const casilla = (indice: number, color: string) => (
    <button
      key={indice}
      type="button"
      className={`casilla ${casillas.activa === indice && !cierre ? 'casilla--activa' : ''} ${mostrados[indice] ? 'casilla--llena' : ''}`}
      style={{ borderColor: color, color: '#22103d', background: `${color}22` }}
      onClick={() => casillas.setActiva(indice)}
      disabled={bloqueado || !!cierre}
      aria-label={`Casilla ${indice + 1}${mostrados[indice] ? `: ${mostrados[indice]}` : ', vacía'}`}
    >
      {mostrados[indice] || ' '}
    </button>
  );

  return (
    <>
      <div className="juego__escenario">
        <Balanza
          izquierda={p.izquierda}
          derecha={p.derecha}
          angulo={0}
          agrupar5={Boolean(tieneAyuda(pistas, 'agrupar5'))}
          estilo={estiloBalanza}
          destello={cierre !== null && cierre.resultado !== 'fallido'}
          titulo="Balanza en equilibrio con grupos de cubos de colores"
        />
      </div>
      <div className="juego__panel">
        <div className={`ecuacion ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} aria-label="Cuaderno de Gatito">
          {p.izquierda.map((o, i) => (
            <Fragment key={`i${i}`}>
              {i > 0 ? <span className="ecuacion__signo">+</span> : null}
              {casilla(i, colorDe(o, i))}
            </Fragment>
          ))}
          <span className="ecuacion__signo">=</span>
          {p.derecha.map((o, i) => (
            <Fragment key={`d${i}`}>
              {i > 0 ? <span className="ecuacion__signo">+</span> : null}
              {casilla(nIzq + i, colorDe(o, nIzq + i))}
            </Fragment>
          ))}
        </div>
        {!cierre ? (
          <Teclado
            alPulsar={casillas.pulsar}
            alBorrar={casillas.borrar}
            alListo={enviar}
            textoListo="Revisar"
            deshabilitado={bloqueado}
          />
        ) : null}
        {pie}
      </div>
    </>
  );
}
