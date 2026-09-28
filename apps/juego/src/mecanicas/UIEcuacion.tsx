import { useEffect, useState } from 'react';
import { esSuma, textoEcuacion, type Objeto, type PublicoEcuacion } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { Teclado } from '../componentes/Comunes';
import { Gatito } from '../componentes/Gatito';
import { ModeloBarra } from '../componentes/ModeloBarra';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

/** Platillos de la balanza para una ecuación de suma. */
function platillos(p: PublicoEcuacion, quitado: boolean): { izquierda: Objeto[]; derecha: Objeto[] } {
  const caja: Objeto = { tipo: 'caja', simbolo: p.simbolo };
  const pesaA: Objeto = { tipo: 'pesa', valor: p.a };
  const conCaja: Objeto[] = quitado ? [caja] : p.forma === 'a+x=b' ? [pesaA, caja] : [caja, pesaA];
  const otro: Objeto[] = [quitado ? { tipo: 'pesa', valor: p.b - p.a, etiqueta: `${p.b} − ${p.a}` } : { tipo: 'pesa', valor: p.b }];
  return p.forma === 'b=x+a' ? { izquierda: otro, derecha: conCaja } : { izquierda: conCaja, derecha: otro };
}

export function UIEcuacion({ item, bloqueado, cierre, pistas, reintentos, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoEcuacion;
  const [quitado, setQuitado] = useState(false);
  useEffect(() => setQuitado(false), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    alResponder(casillas.numeros[0]);
  };
  const casillas = useCasillas(1, 3, item.id, enviar, !bloqueado && !cierre);
  const x = cierre ? (cierre.solucion.respuesta as number) : null;
  const verBalanza = p.representacion === 'balanza' && esSuma(p.forma);
  const verBarra = p.representacion === 'barra' || Boolean(tieneAyuda(pistas, 'modeloBarra'));
  const { izquierda, derecha } = platillos(p, quitado);

  return (
    <>
      <div className="juego__escenario">
        {verBalanza ? (
          <>
            <Balanza
              izquierda={izquierda}
              derecha={derecha}
              angulo={0}
              contenidoCaja={x ?? undefined}
              estilo={estiloBalanza}
              destello={x !== null && cierre?.resultado !== 'fallido'}
              titulo={`Balanza en equilibrio: ${textoEcuacion(p)}`}
            />
            {!cierre ? (
              <button
                type="button"
                className="boton boton--chico boton--violeta"
                disabled={bloqueado}
                onClick={() => {
                  sonidos.quitar();
                  setQuitado((q) => !q);
                }}
              >
                {quitado ? '↩ Volver a poner' : `✋ Quitar ${p.a} de ambos lados`}
              </button>
            ) : null}
          </>
        ) : null}
        {verBarra ? <ModeloBarra forma={p.forma} a={p.a} b={p.b} simbolo={p.simbolo} revelar={x !== null} /> : null}
        {!verBalanza && !verBarra ? (
          <div className="fila centro" style={{ flexWrap: 'nowrap' }}>
            <Gatito animo="pensando" className="avatar-opcion" />
            <div className="burbuja">¿Qué operación deshace a la otra?</div>
          </div>
        ) : null}
      </div>
      <div className="juego__panel">
        <div className="ecuacion" style={{ fontSize: 'clamp(2rem, 7vw, 2.8rem)' }} aria-label={`Ecuación: ${textoEcuacion(p)}`}>
          {textoEcuacion(p)}
        </div>
        <div className={`ecuacion ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
          <span>{p.simbolo} =</span>
          <button type="button" className={`casilla ${!cierre ? 'casilla--activa' : ''} ${casillas.valores[0] ? 'casilla--llena' : ''}`} aria-label={`Valor de ${p.simbolo}`} disabled={bloqueado || !!cierre}>
            {x !== null ? x : casillas.valores[0] || ' '}
          </button>
        </div>
        {x !== null ? (
          <p className="pista" style={{ margin: 0 }}>
            ✔ Comprobación: {textoEcuacion(p, x)}
          </p>
        ) : (
          <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} />
        )}
        {pie}
      </div>
    </>
  );
}
