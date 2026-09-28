import { useEffect, useState } from 'react';
import type { PublicoExpresion } from '@balanza/nucleo';
import { Teclado } from '../componentes/Comunes';
import { FiguraSucesion } from '../componentes/FiguraSucesion';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

export function UIExpresion({ item, bloqueado, cierre, pistas, reintentos, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoExpresion;
  const L = p.letra;
  const conCalculo = p.evaluarEn !== undefined;
  const [signo, setSigno] = useState<'+' | '-'>('+');
  useEffect(() => setSigno('+'), [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    const [a, b, resultado] = casillas.numeros;
    alResponder(conCalculo ? { a, b, signo, resultado } : { a, b, signo });
  };
  const casillas = useCasillas(conCalculo ? 3 : 2, 4, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as { a: number; b: number; signo: '+' | '-'; resultado?: number }) : null;
  const coef = tieneAyuda(pistas, 'mostrarSaltos')?.valor;
  const nombreValor = p.situacion ? p.situacion.columnaValor.replace(/ \(\$\)/, '') : p.modo === 'figura' ? 'palitos' : 'valor';
  const signoVisible = sol ? sol.signo : signo;

  const casilla = (k: number, etiqueta: string) => {
    const valor = sol ? String([sol.a, sol.b, sol.resultado][k]) : casillas.valores[k];
    return (
      <button
        type="button"
        className={`casilla casilla--formula ${casillas.activa === k && !cierre ? 'casilla--activa' : ''} ${valor ? 'casilla--llena' : ''}`}
        onClick={() => casillas.setActiva(k)}
        disabled={bloqueado || !!cierre}
        aria-label={`${etiqueta}${valor ? `: ${valor}` : ', vacía'}`}
      >
        {valor || '?'}
      </button>
    );
  };

  return (
    <>
      <div className="juego__escenario">
        {p.situacion ? (
          <div className="tarjeta tarjeta--papel" style={{ maxWidth: 640, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4 }}>
            {p.situacion.texto}
          </div>
        ) : null}
        {p.modo === 'figura' && p.figura ? (
          <div className="figuras">
            {p.filas.map((f) => (
              <figure className="figuras__una" key={f.n}>
                <FiguraSucesion figura={p.figura!} n={f.n} />
                <figcaption>
                  {L} = {f.n}
                  {coef ? <strong> · {f.valor} palitos</strong> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <table className={`tabla-regla ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            <thead>
              <tr>
                <th scope="col">{p.situacion ? `${p.situacion.columnaN} (${L})` : L}</th>
                {coef ? <th scope="col">{`${coef} · ${L}`}</th> : null}
                <th scope="col">{p.situacion ? p.situacion.columnaValor : 'Valor'}</th>
              </tr>
            </thead>
            <tbody>
              {p.filas.map((f) => (
                <tr key={f.n}>
                  <td>
                    <span className="tabla-regla__numero">{f.n}</span>
                  </td>
                  {coef ? (
                    <td>
                      <span className="tabla-regla__numero tabla-regla__numero--ayuda">{coef * f.n}</span>
                    </td>
                  ) : null}
                  <td>
                    <span className="tabla-regla__numero">{f.valor}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="juego__panel">
        <div className="formula" aria-label="Fórmula">
          <span className="formula__nombre">{nombreValor} =</span>
          {casilla(0, 'Número que multiplica')}
          <span>· {L}</span>
          <button
            type="button"
            className="boton boton--chico boton--violeta formula__signo"
            aria-label={`Signo: ${signoVisible === '+' ? 'más' : 'menos'}. Tocar para cambiar`}
            disabled={bloqueado || !!cierre}
            onClick={() => {
              sonidos.toque();
              setSigno((s) => (s === '+' ? '-' : '+'));
            }}
          >
            {signoVisible === '+' ? '+' : '−'}
          </button>
          {casilla(1, signoVisible === '+' ? 'Número que se suma' : 'Número que se resta')}
        </div>
        {conCalculo ? (
          <div className="formula">
            <span className="formula__nombre">
              Con {L} = {p.evaluarEn}:
            </span>
            {casilla(2, `Valor cuando ${L} es ${p.evaluarEn}`)}
          </div>
        ) : null}
        {!cierre ? <Teclado alPulsar={casillas.pulsar} alBorrar={casillas.borrar} alListo={enviar} textoListo="Revisar" deshabilitado={bloqueado} /> : null}
        {pie}
      </div>
    </>
  );
}
