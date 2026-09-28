import { useEffect, useState } from 'react';
import type { PublicoProblema, RespuestaProblema } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { Gatito } from '../componentes/Gatito';
import { sonidos } from '../sonido';
import type { PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

export function UIProblema({ item, bloqueado, cierre, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoProblema;
  const desigualdad = p.opciones.some((o) => /[<>]/.test(o));
  const [elegida, setElegida] = useState<number | null>(null);
  useEffect(() => setElegida(null), [item.id]);

  const enviar = () => {
    if (elegida === null || !casillas.completo || bloqueado || cierre) return;
    alResponder({ ecuacion: elegida, valor: casillas.numeros[0] });
  };
  const casillas = useCasillas(1, 3, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as RespuestaProblema) : null;

  return (
    <>
      <div className="juego__escenario" style={{ justifyContent: 'flex-start' }}>
        <div className="tarjeta tarjeta--papel fila" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', maxWidth: 640 }}>
          <Gatito animo="guino" className="hud__avatar" />
          <div>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4 }}>{p.texto}</p>
            <p style={{ margin: '8px 0 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--violeta-700)' }}>{p.pregunta}</p>
          </div>
        </div>
        <div className={`opciones opciones--lista ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} role="radiogroup" aria-label="¿Qué ecuación cuenta la historia?" style={{ width: '100%', maxWidth: 640, marginTop: 12 }}>
          {p.opciones.map((o, i) => {
            const clases = ['opcion'];
            if (sol && i === sol.ecuacion) clases.push('opcion--correcta');
            else if (sol && i === elegida) clases.push('opcion--incorrecta');
            else if (i === elegida) clases.push('opcion--elegida');
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={elegida === i}
                className={clases.join(' ')}
                style={{ minHeight: 64, fontFamily: 'var(--fuente-titulo)', fontSize: '1.5rem' }}
                disabled={bloqueado || !!cierre}
                onClick={() => {
                  sonidos.toque();
                  setElegida(i);
                }}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
      <div className="juego__panel">
        <p style={{ margin: 0, fontWeight: 800 }}>
          {elegida === null && !sol
            ? `1. Elige la ${desigualdad ? 'ecuación o inecuación' : 'ecuación'} que cuenta la historia.`
            : desigualdad
              ? '2. Responde la pregunta con un número.'
              : '2. ¿Cuánto vale la caja?'}
        </p>
        <div className="ecuacion">
          <span>{desigualdad ? 'Respuesta:' : `${p.simbolo} =`}</span>
          <span className={`casilla ${!cierre ? 'casilla--activa' : ''}`} aria-label="Valor de la caja">
            {sol ? sol.valor : casillas.valores[0] || ' '}
          </span>
        </div>
        {!cierre ? (
          <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado || elegida === null} />
        ) : null}
        {pie}
      </div>
    </>
  );
}
