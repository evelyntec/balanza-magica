import { useEffect, useState } from 'react';
import { textoExpresion, valorExpresion, type PublicoVerdaderoFalso } from '@balanza/nucleo';
import { MiniBalanza } from '../componentes/Ilustraciones';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';

export function UIVerdaderoFalso({ item, bloqueado, cierre, pistas, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoVerdaderoFalso;
  const [marcas, setMarcas] = useState<(boolean | null)[]>([]);
  useEffect(() => setMarcas(p.afirmaciones.map(() => null)), [item.id, p.afirmaciones]);

  const correctas = cierre ? (cierre.solucion.respuesta as boolean[]) : null;
  const verBalanzas = correctas !== null || Boolean(tieneAyuda(pistas, 'convertirACubos'));
  const completo = marcas.length === p.afirmaciones.length && marcas.every((m) => m !== null);

  const marcar = (i: number, v: boolean) => {
    sonidos.toque();
    setMarcas((m) => m.map((x, k) => (k === i ? v : x)));
  };

  return (
    <>
      <div className="juego__escenario" style={{ justifyContent: 'flex-start' }}>
        <div className="pila" style={{ width: '100%', maxWidth: 640 }}>
          {p.afirmaciones.map((a, i) => {
            const l = valorExpresion(a.izquierda);
            const r = valorExpresion(a.derecha);
            const estado = correctas ? (marcas[i] === correctas[i] ? 'afirmacion--bien' : 'afirmacion--mal') : '';
            return (
              <div key={i} className={`afirmacion ${estado}`}>
                <div className="fila" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                  {verBalanzas ? <MiniBalanza lado={l === r ? 'equilibrio' : l > r ? 'izquierda' : 'derecha'} /> : null}
                  <span className="afirmacion__texto">
                    {textoExpresion(a.izquierda)} = {textoExpresion(a.derecha)}
                  </span>
                </div>
                <div className="afirmacion__botones" role="group" aria-label={`Igualdad ${i + 1}`}>
                  <button
                    type="button"
                    className={`vf vf--si ${marcas[i] === true ? 'vf--elegido' : ''}`}
                    aria-pressed={marcas[i] === true}
                    disabled={bloqueado || !!cierre}
                    onClick={() => marcar(i, true)}
                  >
                    ✔ V
                  </button>
                  <button
                    type="button"
                    className={`vf vf--no ${marcas[i] === false ? 'vf--elegido' : ''}`}
                    aria-pressed={marcas[i] === false}
                    disabled={bloqueado || !!cierre}
                    onClick={() => marcar(i, false)}
                  >
                    ✘ F
                  </button>
                </div>
                {correctas ? (
                  <span style={{ gridColumn: '1 / -1', fontWeight: 800 }}>
                    {correctas[i] ? 'Verdadera' : 'Falsa'}: izquierda {l}, derecha {r}.
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="juego__panel">
        <p style={{ margin: 0, fontWeight: 800 }}>V = verdadera · F = falsa</p>
        <button
          type="button"
          className="boton boton--fucsia boton--grande boton--ancho"
          disabled={bloqueado || !!cierre || !completo}
          onClick={() => alResponder(marcas)}
        >
          Revisar
        </button>
        {pie}
      </div>
    </>
  );
}
