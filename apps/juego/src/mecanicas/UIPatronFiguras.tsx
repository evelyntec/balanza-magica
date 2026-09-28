import { useEffect, useState } from 'react';
import type { Figura, PublicoPatronFiguras } from '@balanza/nucleo';
import { Fruta } from '../componentes/Ilustraciones';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';

export function UIPatronFiguras({ item, bloqueado, cierre, pistas, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoPatronFiguras;
  const [elegida, setElegida] = useState<number | null>(null);
  useEffect(() => setElegida(null), [item.id]);

  const correcta = cierre ? (cierre.solucion.respuesta as number) : null;
  const nucleo = tieneAyuda(pistas, 'resaltarNucleo')?.valor ?? 0;
  const indicePregunta = p.modo === 'nucleo' ? -1 : p.secuencia.lastIndexOf(null) >= 0 && p.modo !== 'faltante' ? p.secuencia.length - 1 : p.secuencia.indexOf(null);
  const respuestaVisible: Figura[] | null = correcta !== null ? (p.opciones[correcta] ?? null) : null;

  return (
    <>
      <div className="juego__escenario">
        <div className="collar" role="list" aria-label="Collar de frutas">
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{ width: '100%', height: 14, display: 'block' }} aria-hidden="true">
            <path d="M0 2 Q50 12 100 2" stroke="#ffd873" strokeWidth={1.2} fill="none" />
          </svg>
          <div className="collar__fila">
            {p.secuencia.map((f, i) => {
              const esPregunta = i === indicePregunta;
              const enNucleo = nucleo > 0 && i < nucleo;
              const mostrar = f ?? (esPregunta && respuestaVisible?.length === 1 ? respuestaVisible[0] : null);
              return (
                <div key={i} className={`cuenta ${enNucleo ? 'cuenta--nucleo' : ''}`} role="listitem">
                  <div
                    className={`cuenta__figura ${mostrar ? '' : 'cuenta__figura--vacia'} ${esPregunta && !mostrar ? 'cuenta__figura--pregunta' : ''}`}
                    aria-label={mostrar ? undefined : esPregunta ? 'Lugar por descubrir' : 'Lugar vacío'}
                  >
                    {mostrar ? <Fruta figura={mostrar} tamano={40} /> : esPregunta ? '?' : ''}
                  </div>
                  {p.modo === 'posicion' ? <span className="cuenta__numero">{i + 1}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
        {p.modo === 'posicion' ? (
          <p className="texto-claro" style={{ fontWeight: 800, textAlign: 'center' }}>
            ¿Qué fruta va en el lugar {p.posicion}?
          </p>
        ) : null}
      </div>
      <div className="juego__panel">
        <div className="opciones" role="group" aria-label="Opciones">
          {p.opciones.map((grupo, i) => {
            const clases = ['opcion'];
            if (correcta !== null && i === correcta) clases.push('opcion--correcta');
            else if (correcta !== null && i === elegida) clases.push('opcion--incorrecta');
            else if (i === elegida) clases.push('opcion--elegida');
            return (
              <button
                key={i}
                type="button"
                className={clases.join(' ')}
                disabled={bloqueado || correcta !== null}
                onClick={() => {
                  sonidos.toque();
                  setElegida(i);
                  alResponder(i);
                }}
              >
                {grupo.length === 1 ? (
                  <Fruta figura={grupo[0] as Figura} tamano={56} />
                ) : (
                  <span className="grupo-figuras">
                    {grupo.map((f, k) => (
                      <Fruta key={k} figura={f} tamano={34} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {pie}
      </div>
    </>
  );
}
