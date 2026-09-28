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
import { tablaRegla } from './tablaRegla';
import { inecuacion } from './inecuacion';
import { sucesion } from './sucesion';
import { graficoSolucion } from './graficoSolucion';
import { expresion } from './expresion';
import { ecuacionDosPasos } from './ecuacionDosPasos';
import { reducir } from './reducir';
import { proporcion } from './proporcion';
import { ecuacionMult } from './ecuacionMult';
import { ecuacionAmbosLados } from './ecuacionAmbosLados';
import { funcion } from './funcion';
import { afin } from './afin';
import { inecuacionLineal } from './inecuacionLineal';

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
  tabla_regla: tablaRegla,
  inecuacion,
  sucesion,
  grafico_solucion: graficoSolucion,
  expresion,
  ecuacion_dos_pasos: ecuacionDosPasos,
  reducir,
  proporcion,
  ecuacion_mult: ecuacionMult,
  ecuacion_ambos_lados: ecuacionAmbosLados,
  funcion,
  afin,
  inecuacion_lineal: inecuacionLineal,
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
export { tablaRegla, inecuacion };
export type { PublicoTablaRegla, SecretoTablaRegla, RespuestaTablaRegla, FilaTabla, Operacion } from './tablaRegla';
export { aplicar, textoReglaTabla } from './tablaRegla';
export type { PublicoInecuacion, SecretoInecuacion, FormaInecuacion } from './inecuacion';
export { textoInecuacion, cumple, esMayor, describirSoluciones } from './inecuacion';
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
export { sucesion, graficoSolucion };
export type { PublicoSucesion, SecretoSucesion, RespuestaSucesion, FiguraSucesion, ModoSucesion, PreguntaSucesion, ReglaSucesion } from './sucesion';
export { generarSucesion, termino, textoReglaFuncional, FIGURAS_LINEALES } from './sucesion';
export type { PublicoGrafico, SecretoGrafico, RespuestaGrafico, TipoGrafico, Relacion } from './graficoSolucion';
export { textoGrafico, resolverGrafico, relacionEfectiva, generarGrafico } from './graficoSolucion';
export { expresion, ecuacionDosPasos };
export type { PublicoExpresion, SecretoExpresion, RespuestaExpresion, ModoExpresion, SituacionExpresion, SignoFormula } from './expresion';
export { generarExpresion, textoFormula, valorFormula, LETRAS } from './expresion';
export type { PublicoDosPasos, SecretoDosPasos, RespuestaDosPasos, FormaDosPasos } from './ecuacionDosPasos';
export { textoDosPasos, restaConstante } from './ecuacionDosPasos';
export { generarProblemaLetras } from './problemaLetras';
export type { FiguraLineal, FiguraBaldosas } from './sucesion';
export { reducir, proporcion, ecuacionMult };
export type { PublicoReducir, SecretoReducir, RespuestaReducir, TerminoAlgebraico } from './reducir';
export { textoAlgebraico, textoTermino, textoReducida } from './reducir';
export type { PublicoProporcion, SecretoProporcion, RespuestaProporcion, TipoProporcion } from './proporcion';
export { valorProporcion } from './proporcion';
export type { PublicoMult, FormaMult } from './ecuacionMult';
export { textoMult, resolverMult } from './ecuacionMult';
export { generarProblemaVolcan } from './problemaVolcan';
export { ecuacionAmbosLados, funcion, afin, inecuacionLineal };
export type { PublicoAmbosLados, SecretoAmbosLados, RespuestaAmbosLados } from './ecuacionAmbosLados';
export { textoAmbosLados } from './ecuacionAmbosLados';
export type { PublicoFuncion, SecretoFuncion, RespuestaFuncion } from './funcion';
export { textoRegla as textoReglaFuncion } from './funcion';
export type { PublicoAfin, SecretoAfin, RespuestaAfin, ModoAfin } from './afin';
export type { PublicoInecLineal, FormaLineal } from './inecuacionLineal';
export { textoInecLineal, coeficienteFinal } from './inecuacionLineal';
export { generarProblemaCastillo } from './problemaCastillo';
export { lineal, terminoX, constante as constanteLineal, num, numP } from './lineal';
