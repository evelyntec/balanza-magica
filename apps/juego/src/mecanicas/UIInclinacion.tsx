import { useEffect, useState } from 'react';
import { anguloBrazo, pesoPlatillo, type Inclinacion, type PublicoInclinacion } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { MiniBalanza } from '../componentes/Ilustraciones';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';

const OPCIONES: { valor: Inclinacion; texto: string }[] = [
  { valor: 'izquierda', texto: 'Baja la izquierda' },
  { valor: 'equilibrio', texto: 'Equilibrio' },
  { valor: 'derecha', texto: 'Baja la derecha' },
];

export function UIInclinacion({ item, bloqueado, cierre, pistas, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoInclinacion;
  const [elegida, setElegida] = useState<Inclinacion | null>(null);
  useEffect(() => setElegida(null), [item.id]);

  const l = pesoPlatillo(p.izquierda);
  const r = pesoPlatillo(p.derecha);
  const revelada = cierre !== null;
  const correcta = cierre ? (cierre.solucion.respuesta as Inclinacion) : null;

  return (
    <>
      <div className="juego__escenario">
        <Balanza
          izquierda={p.izquierda}
          derecha={p.derecha}
          angulo={anguloBrazo(l, r)}
          trabada={!revelada}
          destello={revelada && l === r}
          agrupar5={Boolean(tieneAyuda(pistas, 'agrupar5'))}
          pesasComoCubos={Boolean(tieneAyuda(pistas, 'convertirACubos'))}
          estilo={estiloBalanza}
          titulo={revelada ? `La balanza ${l === r ? 'queda en equilibrio' : `baja hacia la ${l > r ? 'izquierda' : 'derecha'}`}` : 'Balanza trabada: predice qué pasará'}
        />
      </div>
      <div className="juego__panel">
        <div className="opciones" role="group" aria-label="¿Qué pasará con la balanza?">
          {OPCIONES.map((o) => {
            const clases = ['opcion'];
            if (revelada && o.valor === correcta) clases.push('opcion--correcta');
            else if (revelada && o.valor === elegida) clases.push('opcion--incorrecta');
            else if (o.valor === elegida) clases.push('opcion--elegida');
            return (
              <button
                key={o.valor}
                type="button"
                className={clases.join(' ')}
                disabled={bloqueado || revelada}
                onClick={() => {
                  sonidos.balanza();
                  setElegida(o.valor);
                  alResponder(o.valor);
                }}
              >
                <MiniBalanza lado={o.valor} />
                {o.texto}
              </button>
            );
          })}
        </div>
        {pie}
      </div>
    </>
  );
}
