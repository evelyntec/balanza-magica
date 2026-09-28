import { useEffect, useState } from 'react';
import type { PublicoTabla100 } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

function Continuar({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoTabla100;
  const pintadas = p.pintadas ?? [];
  const cantidad = p.cantidad ?? 3;
  const [elegidas, setElegidas] = useState<number[]>([]);
  useEffect(() => setElegidas([]), [item.id, reintentos]);
  const correctas = cierre ? (cierre.solucion.respuesta as number[]) : null;
  const salto = pintadas.length >= 2 ? pintadas[1]! - pintadas[0]! : null;

  const tocar = (n: number) => {
    if (bloqueado || cierre || pintadas.includes(n)) return;
    sonidos.toque();
    setElegidas((e) => (e.includes(n) ? e.filter((v) => v !== n) : e.length < cantidad ? [...e, n] : e));
  };

  return (
    <>
      <div className="juego__escenario">
        <div className={`tabla100 ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} role="grid" aria-label="Tabla del 100">
          {Array.from({ length: 100 }, (_, i) => {
            const n = i + 1;
            const clases = ['tabla100__celda'];
            if (pintadas.includes(n)) clases.push('tabla100__celda--pintada');
            if (elegidas.includes(n)) clases.push('tabla100__celda--elegida');
            if (correctas?.includes(n)) clases.push('tabla100__celda--correcta');
            else if (correctas && elegidas.includes(n)) clases.push('tabla100__celda--incorrecta');
            return (
              <button key={n} type="button" role="gridcell" className={clases.join(' ')} onClick={() => tocar(n)} aria-pressed={elegidas.includes(n)} disabled={pintadas.includes(n) || bloqueado || !!cierre}>
                {n}
              </button>
            );
          })}
        </div>
      </div>
      <div className="juego__panel">
        <p style={{ margin: 0, fontWeight: 800 }}>
          Elegiste {elegidas.length} de {cantidad}: {elegidas.length ? [...elegidas].sort((a, b) => a - b).join(', ') : '—'}
        </p>
        {tieneAyuda(pistas, 'mostrarSaltos') && salto !== null ? <span className="chip">Salto del patrón: +{salto}</span> : null}
        <button type="button" className="boton boton--fucsia boton--grande boton--ancho" disabled={bloqueado || !!cierre || elegidas.length !== cantidad} onClick={() => alResponder(elegidas)}>
          Revisar
        </button>
        {pie}
      </div>
    </>
  );
}

function Trozo({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoTabla100;
  const trozo = p.trozo ?? [];
  const huecos = trozo.flatMap((fila, i) => fila.flatMap((v, j) => (v === null ? [[i, j] as const] : [])));
  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    alResponder(casillas.numeros);
  };
  const casillas = useCasillas(huecos.length, 3, item.id, enviar, !bloqueado && !cierre);
  const solucion = cierre ? (cierre.solucion.respuesta as number[]) : null;
  const saltos = Boolean(tieneAyuda(pistas, 'mostrarSaltos'));

  return (
    <>
      <div className="juego__escenario">
        <div className={`trozo ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} aria-label="Trozo de la tabla del 100">
          {trozo.map((fila, i) =>
            fila.map((v, j) => {
              if (v === 'fuera') return <span key={`${i}-${j}`} className="trozo__vacio" aria-hidden="true" />;
              if (typeof v === 'number')
                return (
                  <span key={`${i}-${j}`} className="trozo__celda">
                    {v}
                  </span>
                );
              const k = huecos.findIndex(([a, b]) => a === i && b === j);
              const valor = solucion ? String(solucion[k]) : casillas.valores[k];
              return (
                <button
                  key={`${i}-${j}`}
                  type="button"
                  className={`trozo__celda trozo__celda--hueco ${casillas.activa === k && !cierre ? 'piedra--activa' : ''}`}
                  onClick={() => casillas.setActiva(k)}
                  disabled={bloqueado || !!cierre}
                  aria-label={`Casilla por completar ${k + 1}${valor ? `: ${valor}` : ''}`}
                >
                  {valor || '?'}
                </button>
              );
            }),
          )}
        </div>
        {saltos ? <p className="texto-claro" style={{ fontWeight: 900, fontSize: '1.2rem' }}>→ +1 · ← −1 · ↓ +10 · ↑ −10</p> : null}
      </div>
      <div className="juego__panel">
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}

export function UITabla100(props: PropsMecanica) {
  const p = props.item.publico as PublicoTabla100;
  return p.modo === 'continuar' ? <Continuar {...props} /> : <Trozo {...props} />;
}
