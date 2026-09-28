import { useEffect, useState } from 'react';
import { textoInecuacion, type Objeto, type PublicoInecuacion } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';

/** Platillos de una inecuación de suma: el lado con la caja pesa menos (<) o más (>). */
function platillos(p: PublicoInecuacion): { izquierda: Objeto[]; derecha: Objeto[]; angulo: number } {
  const conCaja: Objeto[] = [{ tipo: 'caja', simbolo: p.simbolo }, { tipo: 'pesa', valor: p.a }];
  const otro: Objeto[] = [{ tipo: 'pesa', valor: p.b }];
  const cajaMasLiviana = p.forma === 'x+a<b' || p.forma === 'b>x+a';
  const cajaIzquierda = p.forma.startsWith('x');
  // Ángulo positivo = baja la derecha.
  const bajaDerecha = cajaIzquierda ? cajaMasLiviana : !cajaMasLiviana;
  return {
    izquierda: cajaIzquierda ? conCaja : otro,
    derecha: cajaIzquierda ? otro : conCaja,
    angulo: bajaDerecha ? 12 : -12,
  };
}

export function UIInecuacion({ item, bloqueado, cierre, pistas, reintentos, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoInecuacion;
  const [marcados, setMarcados] = useState<number[]>([]);
  useEffect(() => setMarcados([]), [item.id]);
  const soluciones = cierre ? (cierre.solucion.respuesta as number[]) : null;
  const borde = tieneAyuda(pistas, 'mostrarTotales')?.valor;
  const numeros = Array.from({ length: p.hasta - p.desde + 1 }, (_, i) => p.desde + i);
  const conBalanza = p.representacion === 'balanza' && !p.forma.includes('-');

  const tocar = (n: number) => {
    if (bloqueado || cierre) return;
    sonidos.toque();
    setMarcados((m) => (m.includes(n) ? m.filter((x) => x !== n) : [...m, n]));
  };

  return (
    <>
      <div className="juego__escenario">
        {p.contexto ? (
          <div className="tarjeta tarjeta--papel" style={{ maxWidth: 640, fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.4 }}>
            {p.contexto}
          </div>
        ) : null}
        {conBalanza ? (
          <Balanza {...platillos(p)} estilo={estiloBalanza} titulo={`Balanza inclinada: ${textoInecuacion(p)}`} />
        ) : null}
        <div className="ecuacion" style={{ color: '#fff', fontSize: 'clamp(2rem, 7vw, 2.8rem)' }}>
          {textoInecuacion(p)}
        </div>
        <div className={`recta ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} role="group" aria-label="Recta numérica: toca los números que cumplen">
          {numeros.map((n) => {
            const clases = ['recta__punto'];
            if (marcados.includes(n)) clases.push('recta__punto--marcado');
            if (soluciones?.includes(n)) clases.push('recta__punto--solucion');
            else if (soluciones && marcados.includes(n)) clases.push('recta__punto--error');
            if (borde === n || (soluciones && n === Number(cierre?.solucion.explicacion.match(/Con (\d+)/)?.[1]))) clases.push('recta__punto--borde');
            return (
              <button key={n} type="button" className={clases.join(' ')} onClick={() => tocar(n)} aria-pressed={marcados.includes(n)} disabled={bloqueado || !!cierre} aria-label={`${n}`}>
                <span className="recta__marca" aria-hidden="true" />
                <span className="recta__numero">{n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="juego__panel">
        <p style={{ margin: 0, fontWeight: 800 }}>
          Marcaste {marcados.length} {marcados.length === 1 ? 'número' : 'números'}. Puede haber muchos que cumplen.
        </p>
        <div className="fila">
          <button type="button" className="boton boton--chico boton--crema" disabled={bloqueado || !!cierre || marcados.length === 0} onClick={() => setMarcados([])}>
            Borrar marcas
          </button>
        </div>
        <button type="button" className="boton boton--fucsia boton--grande boton--ancho" disabled={bloqueado || !!cierre || marcados.length === 0} onClick={() => alResponder(marcados)}>
          Revisar
        </button>
        {pie}
      </div>
    </>
  );
}
