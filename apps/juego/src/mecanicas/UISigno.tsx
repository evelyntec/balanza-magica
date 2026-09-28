import { useEffect, useState } from 'react';
import { anguloBrazo, textoExpresion, valorExpresion, type Objeto, type PublicoSigno, type Signo } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { Gatito } from '../componentes/Gatito';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';

const OPCIONES: { signo: Signo; lectura: string }[] = [
  { signo: '<', lectura: 'es menor que' },
  { signo: '=', lectura: 'es igual a' },
  { signo: '>', lectura: 'es mayor que' },
];

export function UISigno({ item, bloqueado, cierre, pistas, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoSigno;
  const [elegido, setElegido] = useState<Signo | null>(null);
  useEffect(() => setElegido(null), [item.id]);

  const correcto = cierre ? (cierre.solucion.respuesta as Signo) : null;
  const l = valorExpresion(p.izquierda);
  const r = valorExpresion(p.derecha);
  const concreta = p.representacion !== 'simbolica';
  const verBalanza = concreta || cierre !== null || Boolean(tieneAyuda(pistas, 'convertirACubos'));
  const objetos = (lado: 'izquierda' | 'derecha'): Objeto[] => {
    const directos = lado === 'izquierda' ? p.objetosIzquierda : p.objetosDerecha;
    if (directos) return directos;
    // En lo simbólico se muestra el valor de cada lado como una pesa.
    return [{ tipo: 'pesa', valor: lado === 'izquierda' ? l : r }];
  };
  const mostrado = correcto ?? elegido;

  return (
    <>
      <div className="juego__escenario">
        {verBalanza ? (
          <Balanza
            izquierda={objetos('izquierda')}
            derecha={objetos('derecha')}
            angulo={anguloBrazo(l, r)}
            trabada={cierre === null}
            destello={cierre !== null && l === r}
            agrupar5={Boolean(tieneAyuda(pistas, 'agrupar5'))}
            pesasComoCubos={Boolean(tieneAyuda(pistas, 'convertirACubos')) && !concreta}
            estilo={estiloBalanza}
            titulo="Balanza para comparar los dos lados"
          />
        ) : (
          <div className="fila centro" style={{ flexWrap: 'nowrap' }}>
            <Gatito animo="pensando" className="avatar-opcion" />
            <div className="burbuja">{p.izquierda.length === 2 && p.derecha.length === 2 ? '¿Puedes decidir sin calcular todo?' : '¿Qué lado vale más?'}</div>
          </div>
        )}
        <div className="ecuacion" style={{ color: '#fff', fontSize: 'clamp(2rem, 7vw, 3.2rem)', margin: '8px 0' }} aria-label="Comparación">
          <span>{textoExpresion(p.izquierda)}</span>
          <span
            className="centro"
            style={{
              width: '1.5em',
              height: '1.5em',
              borderRadius: '50%',
              border: '4px dashed #ffd873',
              background: mostrado ? '#ffd873' : 'transparent',
              color: '#22103d',
            }}
            aria-label={mostrado ? `signo ${mostrado}` : 'signo por elegir'}
          >
            {mostrado ?? ''}
          </span>
          <span>{textoExpresion(p.derecha)}</span>
        </div>
      </div>
      <div className="juego__panel">
        <div className="opciones" role="group" aria-label="Elige el signo">
          {OPCIONES.map((o) => {
            const clases = ['opcion'];
            if (correcto !== null && o.signo === correcto) clases.push('opcion--correcta');
            else if (correcto !== null && o.signo === elegido) clases.push('opcion--incorrecta');
            else if (o.signo === elegido) clases.push('opcion--elegida');
            return (
              <button
                key={o.signo}
                type="button"
                className={clases.join(' ')}
                disabled={bloqueado || correcto !== null}
                onClick={() => {
                  sonidos.toque();
                  setElegido(o.signo);
                  alResponder(o.signo);
                }}
                aria-label={o.lectura}
              >
                <span className="opcion__signo">{o.signo}</span>
                <span className="opcion__lectura">{o.lectura}</span>
              </button>
            );
          })}
        </div>
        {pie}
      </div>
    </>
  );
}
