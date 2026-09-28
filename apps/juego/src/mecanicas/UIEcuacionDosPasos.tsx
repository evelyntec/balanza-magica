import { useEffect, useState } from 'react';
import { textoDosPasos, type Objeto, type PublicoDosPasos } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

type Etapa = 0 | 1 | 2; // 0: inicial, 1: quitado b, 2: repartido

/** Platillos de a · x + b = c según el paso alcanzado. Las pesas muestran la operación, no el resultado. */
function platillos(p: PublicoDosPasos, etapa: Etapa): { conCajas: Objeto[]; otro: Objeto[] } {
  const caja: Objeto = { tipo: 'caja', simbolo: p.letra };
  const quitado = etapa >= 1 || p.b === 0;
  const resto = p.c - p.b;
  if (etapa === 2) {
    const etiqueta = p.b === 0 ? `${p.c} ÷ ${p.a}` : `(${p.c} − ${p.b}) ÷ ${p.a}`;
    return { conCajas: [caja], otro: [{ tipo: 'pesa', valor: resto / p.a, etiqueta }] };
  }
  const cajas: Objeto[] = Array.from({ length: p.a }, () => caja);
  if (quitado) return { conCajas: cajas, otro: [{ tipo: 'pesa', valor: resto, ...(p.b > 0 ? { etiqueta: `${p.c} − ${p.b}` } : {}) }] };
  const pesaB: Objeto = { tipo: 'pesa', valor: p.b };
  return { conCajas: p.forma === 'b+ax=c' ? [pesaB, ...cajas] : [...cajas, pesaB], otro: [{ tipo: 'pesa', valor: p.c }] };
}

export function UIEcuacionDosPasos({ item, bloqueado, cierre, pistas, reintentos, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoDosPasos;
  const formal = p.representacion === 'formal';
  const [etapa, setEtapa] = useState<Etapa>(0);
  useEffect(() => setEtapa(0), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    alResponder(formal ? { intermedio: casillas.numeros[0], x: casillas.numeros[1] } : { x: casillas.numeros[0] });
  };
  const casillas = useCasillas(formal ? 2 : 1, 4, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as { intermedio?: number; x: number }) : null;
  const ayuda = tieneAyuda(pistas, 'mostrarTotales');
  const L = p.letra;
  const ax = p.a === 1 ? L : `${p.a}${L}`;

  const casilla = (k: number, etiqueta: string) => {
    const valor = sol ? String(formal ? [sol.intermedio, sol.x][k] : sol.x) : casillas.valores[k];
    return (
      <button
        type="button"
        className={`casilla ${casillas.activa === k && !cierre ? 'casilla--activa' : ''} ${valor ? 'casilla--llena' : ''}`}
        onClick={() => casillas.setActiva(k)}
        disabled={bloqueado || !!cierre}
        aria-label={`${etiqueta}${valor ? `: ${valor}` : ', vacía'}`}
      >
        {valor || '?'}
      </button>
    );
  };

  const { conCajas, otro } = platillos(p, sol ? 2 : etapa);
  const cajasIzquierda = p.forma !== 'c=ax+b';

  return (
    <>
      <div className="juego__escenario">
        {formal ? (
          <div className={`pasos-formales ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            <div className="pasos-formales__linea">{textoDosPasos(p)}</div>
            <div className="pasos-formales__linea">
              <span>{ax} =</span>
              {casilla(0, `Valor de ${ax}`)}
              {ayuda ? <span className="pasos-formales__ayuda">{`(${ayuda.valor})`}</span> : null}
            </div>
            <div className="pasos-formales__linea">
              <span>{L} =</span>
              {casilla(1, `Valor de ${L}`)}
            </div>
          </div>
        ) : (
          <>
            <Balanza
              izquierda={cajasIzquierda ? conCajas : otro}
              derecha={cajasIzquierda ? otro : conCajas}
              angulo={0}
              contenidoCaja={sol?.x}
              estilo={estiloBalanza}
              destello={sol !== null && cierre?.resultado !== 'fallido'}
              titulo={`Balanza en equilibrio: ${textoDosPasos(p)}`}
            />
            {!cierre ? (
              <div className="fila centro">
                {p.b > 0 ? (
                  <button
                    type="button"
                    className="boton boton--chico boton--violeta"
                    disabled={bloqueado || etapa >= 1}
                    onClick={() => {
                      sonidos.quitar();
                      setEtapa(1);
                    }}
                  >
                    ✋ Quitar {p.b} de cada lado
                  </button>
                ) : null}
                <button
                  type="button"
                  className="boton boton--chico boton--violeta"
                  disabled={bloqueado || etapa === 2 || (p.b > 0 && etapa === 0)}
                  onClick={() => {
                    sonidos.quitar();
                    setEtapa(2);
                  }}
                >
                  ➗ Repartir en {p.a} grupos iguales
                </button>
                {etapa > 0 ? (
                  <button type="button" className="boton boton--chico boton--crema" disabled={bloqueado} onClick={() => setEtapa(0)}>
                    ↩ Volver
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="juego__panel">
        <div className="ecuacion" style={{ fontSize: 'clamp(1.8rem, 6.5vw, 2.6rem)' }} aria-label={`Ecuación: ${textoDosPasos(p)}`}>
          {textoDosPasos(p)}
        </div>
        {!formal ? (
          <div className="ecuacion">
            <span>{L} =</span>
            {casilla(0, `Valor de ${L}`)}
          </div>
        ) : null}
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
