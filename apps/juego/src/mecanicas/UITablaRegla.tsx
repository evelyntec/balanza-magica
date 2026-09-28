import { useEffect, useState } from 'react';
import type { PublicoTablaRegla } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

export function UITablaRegla({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoTablaRegla;
  const huecos = p.filas.flatMap((f, i) => [...(f.entrada === null ? [[i, 'entrada'] as const] : []), ...(f.salida === null ? [[i, 'salida'] as const] : [])]);
  const [regla, setRegla] = useState<string | null>(null);
  useEffect(() => setRegla(null), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    if (p.modo === 'regla' && !regla) return;
    alResponder(p.modo === 'regla' ? { valores: casillas.numeros, regla } : { valores: casillas.numeros });
  };
  const casillas = useCasillas(huecos.length, 3, item.id, enviar, !bloqueado && !cierre);
  const completas = cierre ? (cierre.solucion.respuesta as { entrada: number; salida: number }[]) : null;
  const reglaFinal = cierre ? cierre.solucion.explicacion.replace(/^La máquina aplica (.*) a cada número que entra\.$/, '$1') : null;
  const flechas = Boolean(tieneAyuda(pistas, 'mostrarSaltos'));

  const celda = (i: number, columna: 'entrada' | 'salida') => {
    const v = p.filas[i]![columna];
    if (v !== null) return <span className="tabla-regla__numero">{v}</span>;
    const k = huecos.findIndex(([f, c]) => f === i && c === columna);
    const valor = completas ? String(completas[i]![columna]) : casillas.valores[k];
    return (
      <button
        type="button"
        className={`casilla ${casillas.activa === k && !cierre ? 'casilla--activa' : ''} ${valor ? 'casilla--llena' : ''}`}
        onClick={() => casillas.setActiva(k)}
        disabled={bloqueado || !!cierre}
        aria-label={`${columna === 'entrada' ? 'Entrada' : 'Salida'} de la fila ${i + 1}${valor ? `: ${valor}` : ', vacía'}`}
      >
        {valor || '?'}
      </button>
    );
  };

  return (
    <>
      <div className="juego__escenario">
        <div className="maquina" aria-hidden="true">
          <span className="maquina__engranaje">⚙️</span>
          <span className="maquina__regla">{reglaFinal ?? (regla ? regla : 'REGLA ?')}</span>
          <span className="maquina__engranaje">⚙️</span>
        </div>
        <table className={`tabla-regla ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
          <thead>
            <tr>
              <th scope="col">Entra</th>
              <th aria-hidden="true" />
              <th scope="col">Sale</th>
            </tr>
          </thead>
          <tbody>
            {p.filas.map((_, i) => (
              <tr key={i}>
                <td>{celda(i, 'entrada')}</td>
                <td className="tabla-regla__flecha" aria-hidden="true">
                  {flechas ? (p.modo === 'inversa' ? '⇄' : '→') : ''}
                </td>
                <td>{celda(i, 'salida')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="juego__panel">
        {p.modo === 'regla' && p.opcionesRegla ? (
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 800 }}>La regla de la máquina es:</p>
            <div className="opciones" role="radiogroup" aria-label="Reglas posibles">
              {p.opcionesRegla.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={regla === r}
                  className={`opcion ${regla === r ? 'opcion--elegida' : ''}`}
                  style={{ minHeight: 60 }}
                  disabled={bloqueado || !!cierre}
                  onClick={() => {
                    sonidos.toque();
                    setRegla(r);
                  }}
                >
                  <span className="opcion__signo" style={{ fontSize: '1.9rem' }}>
                    {r}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
