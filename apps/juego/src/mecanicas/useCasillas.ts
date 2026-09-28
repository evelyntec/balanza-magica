import { useCallback, useEffect, useState } from 'react';

/**
 * Estado de varias casillas numéricas que se llenan con el teclado en
 * pantalla o con el teclado físico (dígitos, Borrar, Tab/flechas, Enter).
 */
export function useCasillas(cantidad: number, maxDigitos: number, clave: string, alEnter?: () => void, habilitado = true) {
  const [valores, setValores] = useState<string[]>(() => Array(cantidad).fill(''));
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    setValores(Array(cantidad).fill(''));
    setActiva(0);
  }, [clave, cantidad]);

  const pulsar = useCallback(
    (d: number) => {
      setValores((vs) => {
        const nuevo = [...vs];
        const actual = nuevo[activa] ?? '';
        const texto = actual.length >= maxDigitos ? String(d) : actual === '0' ? String(d) : actual + String(d);
        nuevo[activa] = texto;
        if (texto.length >= maxDigitos && activa < cantidad - 1) setActiva(activa + 1);
        return nuevo;
      });
    },
    [activa, cantidad, maxDigitos],
  );

  const borrar = useCallback(() => {
    setValores((vs) => {
      const nuevo = [...vs];
      const actual = nuevo[activa] ?? '';
      if (actual === '' && activa > 0) {
        setActiva(activa - 1);
        return nuevo;
      }
      nuevo[activa] = actual.slice(0, -1);
      return nuevo;
    });
  }, [activa]);

  useEffect(() => {
    if (!habilitado) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        pulsar(Number(e.key));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        borrar();
      } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey && activa < cantidad - 1)) {
        e.preventDefault();
        setActiva((a) => Math.min(cantidad - 1, a + 1));
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey && activa > 0)) {
        e.preventDefault();
        setActiva((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        alEnter?.();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [pulsar, borrar, alEnter, activa, cantidad, habilitado]);

  const completo = valores.length === cantidad && valores.every((v) => v !== '');
  const numeros = valores.map((v) => (v === '' ? NaN : Number(v)));

  return { valores, setValores, activa, setActiva, pulsar, borrar, completo, numeros };
}
