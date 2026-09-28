import { useEffect, useState } from 'react';
import { textoAmbosLados, type Objeto, type PublicoAmbosLados } from '@balanza/nucleo';
import { Balanza } from '../componentes/Balanza';
import { BotonSigno, conSigno, texto } from '../componentes/BotonSigno';
import { Teclado } from '../componentes/Comunes';
import { sonidos } from '../sonido';
import { tieneAyuda, type PropsMecanica } from './tipos';
import { useCasillas } from './useCasillas';

interface Paso {
  cajasQuitadas: number;
  pesaQuitada: boolean;
  repartido: boolean;
}

const INICIAL: Paso = { cajasQuitadas: 0, pesaQuitada: false, repartido: false };

/** Platillos de a·x + b = c·x + d (todo natural) según los pasos dados. */
function platillos(p: PublicoAmbosLados, paso: Paso): { izquierda: Objeto[]; derecha: Objeto[] } {
  const caja: Objeto = { tipo: 'caja', simbolo: p.letra };
  // El lado "con más cajas" es el que conserva cajas; el otro conserva la pesa mayor.
  const masIzquierda = p.a > p.c;
  const [cajasMas, pesaMas, cajasMenos, pesaMenos] = masIzquierda ? [p.a, p.b, p.c, p.d] : [p.c, p.d, p.a, p.b];
  const k = cajasMas - cajasMenos;
  const resto = pesaMenos - pesaMas;
  let ladoMas: Objeto[];
  let ladoMenos: Objeto[];
  if (paso.repartido) {
    ladoMas = [caja];
    ladoMenos = [{ tipo: 'pesa', valor: resto / k, etiqueta: pesaMas > 0 ? `(${pesaMenos} − ${pesaMas}) ÷ ${k}` : `${pesaMenos} ÷ ${k}` }];
  } else {
    const q = paso.cajasQuitadas;
    ladoMas = Array.from({ length: cajasMas - q }, () => caja);
    ladoMenos = Array.from({ length: cajasMenos - q }, () => caja);
    if (paso.pesaQuitada) {
      ladoMenos.push({ tipo: 'pesa', valor: resto, etiqueta: `${pesaMenos} − ${pesaMas}` });
    } else {
      if (pesaMas > 0) ladoMas.push({ tipo: 'pesa', valor: pesaMas });
      ladoMenos.push({ tipo: 'pesa', valor: pesaMenos });
    }
  }
  return masIzquierda ? { izquierda: ladoMas, derecha: ladoMenos } : { izquierda: ladoMenos, derecha: ladoMas };
}

export function UIEcuacionAmbosLados({ item, bloqueado, cierre, pistas, reintentos, estiloBalanza, alResponder, pie }: PropsMecanica) {
  const p = item.publico as PublicoAmbosLados;
  const formal = p.representacion === 'formal';
  const L = p.letra;
  const [paso, setPaso] = useState<Paso>(INICIAL);
  const [signos, setSignos] = useState<('+' | '-')[]>(['+', '+', '+']);
  useEffect(() => {
    setPaso(INICIAL);
    setSignos(['+', '+', '+']);
  }, [item.id]);

  const enviar = () => {
    if (!casillas.completo || bloqueado || cierre) return;
    const v = casillas.numeros.map((n, i) => conSigno(signos[i]!, n));
    alResponder(formal ? { k: v[0], m: v[1], x: v[2] } : { x: v[0] });
  };
  const casillas = useCasillas(formal ? 3 : 1, 4, item.id, enviar, !bloqueado && !cierre);
  const sol = cierre ? (cierre.solucion.respuesta as { k?: number; m?: number; x: number }) : null;
  const ayuda = tieneAyuda(pistas, 'mostrarTotales');
  const menos = Math.min(p.a, p.c);
  const pesaMas = p.a > p.c ? p.b : p.d;

  const casilla = (k: number, etiqueta: string) => {
    const valorSol = sol ? (formal ? [sol.k, sol.m, sol.x][k] : sol.x) : undefined;
    const valor = valorSol !== undefined ? texto(valorSol) : casillas.valores[k];
    return (
      <span className="casilla-con-signo">
        {!sol && formal ? <BotonSigno signo={signos[k]!} alCambiar={() => setSignos((s) => s.map((x, i) => (i === k ? (x === '+' ? '-' : '+') : x)))} deshabilitado={bloqueado} etiqueta={`Signo de ${etiqueta}`} /> : null}
        <button
          type="button"
          className={`casilla ${casillas.activa === k && !cierre ? 'casilla--activa' : ''} ${valor ? 'casilla--llena' : ''}`}
          onClick={() => casillas.setActiva(k)}
          disabled={bloqueado || !!cierre}
          aria-label={`${etiqueta}${valor ? `: ${valor}` : ', vacía'}`}
        >
          {valor || '?'}
        </button>
      </span>
    );
  };

  const { izquierda, derecha } = formal ? { izquierda: [], derecha: [] } : platillos(p, sol ? { cajasQuitadas: menos, pesaQuitada: true, repartido: true } : paso);
  const listoParaRepartir = paso.cajasQuitadas === menos && (pesaMas === 0 || paso.pesaQuitada);

  return (
    <>
      <div className="juego__escenario">
        {formal ? (
          <div className={`pasos-formales ${reintentos > 0 ? 'sacudir' : ''}`} key={reintentos}>
            <div className="pasos-formales__linea">{textoAmbosLados(p)}</div>
            <div className="pasos-formales__linea">
              {casilla(0, `Número que multiplica a ${L}`)}
              <span>{L} =</span>
              {casilla(1, 'Número del otro lado')}
              {ayuda ? <span className="pasos-formales__ayuda">(±{ayuda.valor})</span> : null}
            </div>
            <div className="pasos-formales__linea">
              <span>{L} =</span>
              {casilla(2, `Valor de ${L}`)}
            </div>
          </div>
        ) : (
          <>
            <Balanza
              izquierda={izquierda}
              derecha={derecha}
              angulo={0}
              contenidoCaja={sol?.x}
              estilo={estiloBalanza}
              destello={sol !== null && cierre?.resultado !== 'fallido'}
              titulo={`Balanza en equilibrio: ${textoAmbosLados(p)}`}
            />
            {!cierre ? (
              <div className="fila centro">
                <button
                  type="button"
                  className="boton boton--chico boton--violeta"
                  disabled={bloqueado || paso.cajasQuitadas >= menos}
                  onClick={() => {
                    sonidos.quitar();
                    setPaso((s) => ({ ...s, cajasQuitadas: s.cajasQuitadas + 1 }));
                  }}
                >
                  ✋ Quitar una {L} de cada lado
                </button>
                {pesaMas > 0 ? (
                  <button
                    type="button"
                    className="boton boton--chico boton--violeta"
                    disabled={bloqueado || paso.pesaQuitada}
                    onClick={() => {
                      sonidos.quitar();
                      setPaso((s) => ({ ...s, pesaQuitada: true }));
                    }}
                  >
                    ✋ Quitar {pesaMas} de cada lado
                  </button>
                ) : null}
                <button
                  type="button"
                  className="boton boton--chico boton--violeta"
                  disabled={bloqueado || paso.repartido || !listoParaRepartir}
                  onClick={() => {
                    sonidos.quitar();
                    setPaso((s) => ({ ...s, repartido: true }));
                  }}
                >
                  ➗ Repartir
                </button>
                {paso !== INICIAL ? (
                  <button type="button" className="boton boton--chico boton--crema" disabled={bloqueado} onClick={() => setPaso(INICIAL)}>
                    ↩ Volver
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="juego__panel">
        <div className="ecuacion" style={{ fontSize: 'clamp(1.6rem, 6vw, 2.4rem)' }} aria-label={`Ecuación: ${textoAmbosLados(p)}`}>
          {textoAmbosLados(p)}
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
