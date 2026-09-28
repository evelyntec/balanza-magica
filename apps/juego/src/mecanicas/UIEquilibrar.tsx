import { useEffect, useState } from 'react';
import { anguloDeMagnitud, pesoPlatillo, type PublicoEquilibrar } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';

function describir(inclinacion: string, ladoCaja: string): string {
  if (inclinacion === 'equilibrio') return '¡equilibrio!';
  return inclinacion === ladoCaja ? 'la caja bajó' : 'la caja subió';
}

export function UIEquilibrar({ item, bloqueado, cierre, pistas, ultimaPesada, estiloBalanza, alPesar, pie }: PropsMecanica) {
  const p = item.publico as PublicoEquilibrar;
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const ultima = item.pesadas[item.pesadas.length - 1];
    setValor(ultima ? ultima.propuesta : 0);
  }, [item.id, item.pesadas]);

  const solucion = cierre ? (cierre.solucion.respuesta as number) : null;
  const contenido = solucion ?? valor;
  const mostrandoPesada = !cierre && ultimaPesada !== null && ultimaPesada.propuesta === valor;
  const angulo = cierre ? 0 : mostrandoPesada ? anguloDeMagnitud(ultimaPesada.resultado.inclinacion, ultimaPesada.resultado.magnitud) : 0;
  const trabada = !cierre && !mostrandoPesada;

  const usadas = item.pesadas.length;
  const restantes = p.maxPesadas - usadas;

  const conCaja = p.ladoCaja === 'izquierda' ? p.izquierda : p.derecha;
  const totales = tieneAyuda(pistas, 'mostrarTotales')
    ? {
        [p.ladoCaja === 'izquierda' ? 'derecha' : 'izquierda']: `pesa ${pesoPlatillo(p.ladoCaja === 'izquierda' ? p.derecha : p.izquierda)}`,
        [p.ladoCaja]: `sin la caja: ${pesoPlatillo(conCaja, 0)}`,
      }
    : undefined;

  const cambiar = (d: number) => {
    const nuevo = Math.min(p.maxCaja, Math.max(0, valor + d));
    if (nuevo === valor) return;
    if (d > 0) sonidos.cubo();
    else sonidos.quitar();
    setValor(nuevo);
  };

  return (
    <>
      <div className="juego__escenario">
        <Balanza
          izquierda={p.izquierda}
          derecha={p.derecha}
          contenidoCaja={contenido}
          angulo={angulo}
          trabada={trabada}
          destello={cierre !== null && cierre.resultado !== 'fallido'}
          agrupar5={Boolean(tieneAyuda(pistas, 'agrupar5'))}
          totales={totales as { izquierda?: string; derecha?: string } | undefined}
          estilo={estiloBalanza}
          resaltarCaja={!cierre}
          titulo={`Balanza con la caja misteriosa en el platillo ${p.ladoCaja}. La caja tiene ${contenido} cubos.`}
        />
      </div>
      <div className="juego__panel">
        <div className="control-caja">
          <button type="button" className="boton boton--crema boton--icono" onClick={() => cambiar(-1)} disabled={bloqueado || !!cierre || valor === 0} aria-label="Quitar un cubo">
            −
          </button>
          <div className="control-caja__valor" aria-live="polite">
            {contenido}
            <span className="control-caja__etiqueta">cubos en la caja</span>
          </div>
          <button type="button" className="boton boton--crema boton--icono" onClick={() => cambiar(1)} disabled={bloqueado || !!cierre || valor === p.maxCaja} aria-label="Agregar un cubo">
            +
          </button>
        </div>
        <div className="fila" style={{ justifyContent: 'center' }}>
          <button type="button" className="boton boton--chico boton--crema" onClick={() => cambiar(-5)} disabled={bloqueado || !!cierre || valor === 0}>
            −5
          </button>
          <button type="button" className="boton boton--chico boton--crema" onClick={() => setValor(0)} disabled={bloqueado || !!cierre || valor === 0}>
            Vaciar
          </button>
          <button type="button" className="boton boton--chico boton--crema" onClick={() => cambiar(5)} disabled={bloqueado || !!cierre || valor === p.maxCaja}>
            +5
          </button>
        </div>
        <button
          type="button"
          className="boton boton--fucsia boton--grande boton--ancho"
          disabled={bloqueado || !!cierre || mostrandoPesada}
          onClick={() => {
            sonidos.balanza();
            alPesar(valor);
          }}
        >
          ⚖️ ¡Pesar!
        </button>
        <div className="fila" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800 }}>
            Pesadas: {usadas} de {p.maxPesadas}
          </span>
          <span className="pesadas-restantes" aria-label={`Te quedan ${restantes} pesadas`}>
            {Array.from({ length: p.maxPesadas }, (_, i) => (
              <i key={i} className={i < usadas ? 'usada' : ''} />
            ))}
          </span>
        </div>
        {item.pesadas.length > 0 ? (
          <div className="historial-pesadas" aria-label="Pesadas anteriores">
            {item.pesadas.map((ps, i) => (
              <span key={i} className="chip">
                {ps.propuesta} → {describir(ps.resultado.inclinacion, p.ladoCaja)}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontWeight: 700 }}>💡 Con una sola pesada ganas el máximo. ¡Calcula antes de pesar!</p>
        )}
        {mostrandoPesada && ultimaPesada ? (
          <div className="pista" role="status">
            {ultimaPesada.resultado.mensaje}
          </div>
        ) : null}
        {pie}
      </div>
    </>
  );
}
