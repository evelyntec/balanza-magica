import { Fragment, useEffect, useState } from 'react';
import type { PublicoPatronNumerico } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

export function UIPatronNumerico({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoPatronNumerico;
  const huecos = p.secuencia.flatMap((v, i) => (v === null ? [i] : []));
  const [regla, setRegla] = useState<string | null>(null);
  useEffect(() => setRegla(null), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    if (p.modo === 'regla' && !regla) return;
    alResponder(p.modo === 'regla' ? { faltantes: casillas.numeros, regla } : { faltantes: casillas.numeros });
  };
  const casillas = useCasillas(huecos.length, String(p.maximo).length, item.id, enviar, !bloqueado && !cierre);

  const completa = cierre ? (cierre.solucion.respuesta as number[]) : null;
  const saltos = Boolean(tieneAyuda(pistas, 'mostrarSaltos'));

  const valorEn = (i: number): string => {
    const v = p.secuencia[i];
    if (v !== null && v !== undefined) return String(v);
    if (completa) return String(completa[i]);
    return casillas.valores[huecos.indexOf(i)] ?? '';
  };

  const salto = (i: number) => {
    const a = p.secuencia[i];
    const b = p.secuencia[i + 1];
    if (a === null || a === undefined || b === null || b === undefined) return '?';
    const d = b - a;
    return d >= 0 ? `+${d}` : `−${Math.abs(d)}`;
  };

  return (
    <>
      <div className="juego__escenario">
        <div className={`sendero ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos} role="list" aria-label="Camino de números">
          {p.secuencia.map((v, i) => {
            const k = huecos.indexOf(i);
            const esHueco = v === null;
            return (
              <Fragment key={i}>
                {i > 0 && saltos ? (
                  <span className="salto" aria-label={`salto ${salto(i - 1)}`}>
                    {salto(i - 1)}
                  </span>
                ) : null}
                {esHueco ? (
                  <button
                    type="button"
                    role="listitem"
                    className={`piedra piedra--hueco ${casillas.activa === k && !cierre ? 'piedra--activa' : ''}`}
                    onClick={() => casillas.setActiva(k)}
                    disabled={bloqueado || !!cierre}
                    aria-label={`Número que falta ${k + 1}${valorEn(i) ? `: ${valorEn(i)}` : ''}`}
                  >
                    {valorEn(i) || '?'}
                  </button>
                ) : (
                  <span className="piedra" role="listitem">
                    {v}
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
      <div className="juego__panel">
        {p.modo === 'regla' && p.opcionesRegla ? (
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 800 }}>La regla es:</p>
            <div className="opciones" role="group" aria-label="Reglas posibles">
              {p.opcionesRegla.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`opcion ${regla === r ? 'opcion--elegida' : ''}`}
                  style={{ minHeight: 64 }}
                  disabled={bloqueado || !!cierre}
                  onClick={() => {
                    sonidos.toque();
                    setRegla(r);
                  }}
                >
                  <span className="opcion__signo" style={{ fontSize: '2rem' }}>
                    {r}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {!cierre ? (
          <Teclado
            alPulsar={casillas.pulsar}
            alBorrar={casillas.borrar}
            alListo={enviar}
            textoListo="Revisar"
            deshabilitado={bloqueado}
          />
        ) : null}
        {pie}
      </div>
    </>
  );
}
