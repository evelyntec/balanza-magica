import type { TipoItem } from '../tipos';
import { equilibrar } from './equilibrar';
import { inclinacion } from './inclinacion';
import type { Mecanica } from './mecanica';
import { patronFiguras } from './patronFiguras';
import { patronNumerico } from './patronNumerico';
import { registrar } from './registrar';
import { signo } from './signo';
import { verdaderoFalso } from './verdaderoFalso';
import { ecuacion } from './ecuacion';
import { tabla100 } from './tabla100';
import { problema } from './problema';

export const MECANICAS: Record<TipoItem, Mecanica> = {
  inclinacion,
  equilibrar,
  registrar,
  patron_figuras: patronFiguras,
  patron_numerico: patronNumerico,
  signo,
  verdadero_falso: verdaderoFalso,
  ecuacion,
  tabla100,
  problema,
};

export function mecanica(tipo: TipoItem): Mecanica {
  const m = MECANICAS[tipo];
  if (!m) throw new Error(`Mecánica desconocida: ${tipo}`);
  return m;
}

export * from './mecanica';
export { inclinacion, equilibrar, registrar, patronFiguras, patronNumerico, signo, verdaderoFalso, ecuacion, tabla100, problema };
export type { PublicoEcuacion, SecretoEcuacion, FormaEcuacion } from './ecuacion';
export { textoEcuacion, resolver, esSuma, SIMBOLOS, NOMBRE_SIMBOLO } from './ecuacion';
export type { PublicoTabla100, SecretoTabla100 } from './tabla100';
export type { PublicoProblema, SecretoProblema, RespuestaProblema } from './problema';
export type { PublicoInclinacion, SecretoInclinacion } from './inclinacion';
export type { PublicoEquilibrar, SecretoEquilibrar } from './equilibrar';
export type { PublicoRegistrar, SecretoRegistrar, RespuestaRegistrar } from './registrar';
export type { PublicoPatronFiguras, SecretoPatronFiguras, ModoPatronFiguras } from './patronFiguras';
export type { PublicoPatronNumerico, SecretoPatronNumerico, RespuestaPatronNumerico } from './patronNumerico';
export type { PublicoSigno, SecretoSigno } from './signo';
export type { PublicoVerdaderoFalso, SecretoVerdaderoFalso, Afirmacion, FormaVF } from './verdaderoFalso';
export { FIGURAS, NOMBRE_FIGURA } from './patronFiguras';
export { textoRegla } from './patronNumerico';
export { MAX_CAJA, MAX_PESADAS } from './equilibrar';
