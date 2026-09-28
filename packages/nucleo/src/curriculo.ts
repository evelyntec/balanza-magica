/**
 * Mapa curricular del juego: 8 islas (1° a 8° básico) del eje
 * Patrones y álgebra (1° a 6°) y Álgebra y funciones (7° y 8°).
 *
 * Texto de los OA tomado de curriculumnacional.cl (Bases Curriculares 2012
 * para 1° a 6° y 2015 para 7° y 8°, vigentes en 2026). Ver docs/curriculo.md.
 */

import type { Azar } from './azar';
import { MECANICAS, generarSucesion, generarGrafico, generarExpresion, generarProblemaLetras, generarProblemaVolcan, type ContextoGeneracion, type ItemGenerado } from './mecanicas';
import type { TipoItem } from './tipos';

export interface ObjetivoAprendizaje {
  codigo: string;
  texto: string;
  /** El OA menciona explícitamente la balanza. */
  balanza?: boolean;
}

export interface Isla {
  numero: number;
  nombre: string;
  nivel: string;
  lema: string;
  /** Color principal de la isla (paleta de marca). */
  color: string;
  disponible: boolean;
  jefe: { nombre: string; descripcion: string; vida: number };
  oa: ObjetivoAprendizaje[];
}

export interface Etapa {
  id: string;
  isla: number;
  orden: number;
  nombre: string;
  descripcion: string;
  oa: string[];
  esJefe: boolean;
  /** Logros (ejercicios bien resueltos) para completar la etapa. */
  metaLogros: number;
  /** Tope de ejercicios: si se alcanza sin completar, la etapa no se supera. */
  maxItems: number;
  nivelInicial: number;
  nivelMaximo: number;
  mecanicas: TipoItem[];
  generar(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado;
}

export const ISLAS: Isla[] = [
  {
    numero: 1,
    nombre: 'Pradera de las Frutas',
    nivel: '1° básico',
    lema: 'Equilibrio, desequilibrio y collares que se repiten',
    color: '#e0457b',
    disponible: true,
    jefe: { nombre: 'Cuervo Revoltoso', descripcion: 'Desordenó todas las balanzas de la pradera. ¡Ordénalas para que se vaya!', vida: 10 },
    oa: [
      {
        codigo: 'MA01 OA 11',
        texto:
          'Reconocer, describir, crear y continuar patrones repetitivos (sonidos, figuras, ritmos...) y patrones numéricos hasta el 20, crecientes y decrecientes, usando material concreto, pictórico y simbólico, de manera manual y/o por medio de software educativo.',
      },
      {
        codigo: 'MA01 OA 12',
        texto:
          'Describir y registrar la igualdad y la desigualdad como equilibrio y desequilibrio, usando una balanza en forma concreta, pictórica y simbólica del 0 al 20, usando el símbolo igual (=).',
        balanza: true,
      },
    ],
  },
  {
    numero: 2,
    nombre: 'Bosque de los Signos',
    nivel: '2° básico',
    lema: 'Mayor, menor, igual y senderos de números',
    color: '#7b3fbf',
    disponible: true,
    jefe: { nombre: 'Bruja Ventolera', descripcion: 'Sopla y sopla para desequilibrar el bosque. ¡Demuéstrale que conoces los signos!', vida: 10 },
    oa: [
      {
        codigo: 'MA02 OA 12',
        texto: 'Crear, representar y continuar una variedad de patrones numéricos y completar los elementos faltantes, de manera manual y/o usando software educativo.',
      },
      {
        codigo: 'MA02 OA 13',
        texto:
          'Demostrar, explicar y registrar la igualdad y la desigualdad en forma concreta y pictórica del 0 al 20, usando el símbolo igual (=) y los símbolos no igual (>, <).',
      },
    ],
  },
  {
    numero: 3,
    nombre: 'Río de las Cajas Misteriosas',
    nivel: '3° básico',
    lema: 'La primera incógnita',
    color: '#2f8fce',
    disponible: true,
    jefe: { nombre: 'Pulpo Escondecajas', descripcion: 'Con sus ocho brazos escondió números en cajas por todo el río. ¡Descúbrelos!', vida: 12 },
    oa: [
      {
        codigo: 'MA03 OA 12',
        texto: 'Generar, describir y registrar patrones numéricos, usando una variedad de estrategias en tablas del 100, de manera manual y/o con software educativo.',
      },
      {
        codigo: 'MA03 OA 13',
        texto:
          'Resolver ecuaciones de un paso que involucren adiciones y sustracciones y un símbolo geométrico que represente un número desconocido, en forma pictórica y simbólica del 0 al 100.',
      },
    ],
  },
  {
    numero: 4,
    nombre: 'Montaña de las Tablas',
    nivel: '4° básico',
    lema: 'Reglas en tablas, ecuaciones e inecuaciones',
    color: '#3aa37a',
    disponible: true,
    jefe: { nombre: 'Yeti de las Tablas', descripcion: 'Congeló las reglas de todas las máquinas de la montaña. ¡Descongélalas!', vida: 12 },
    oa: [
      {
        codigo: 'MA04 OA 13',
        texto: 'Identificar y describir patrones numéricos en tablas que involucren una operación, de manera manual y/o usando software educativo.',
      },
      {
        codigo: 'MA04 OA 14',
        texto:
          'Resolver ecuaciones e inecuaciones de un paso que involucren adiciones y sustracciones, comprobando los resultados en forma pictórica y simbólica del 0 al 100 y aplicando las relaciones inversas entre la adición y la sustracción.',
      },
    ],
  },
  {
    numero: 5,
    nombre: 'Desierto de las Desigualdades',
    nivel: '5° básico',
    lema: 'Todas las soluciones, no solo una',
    color: '#d99a1e',
    disponible: true,
    jefe: { nombre: 'Escorpión Desigual', descripcion: 'Borra las huellas del desierto y confunde un número con muchos. ¡Predice y grafica sin caer en sus trampas!', vida: 14 },
    oa: [
      { codigo: 'MA05 OA 14', texto: 'Descubrir alguna regla que explique una sucesión dada y que permita hacer predicciones.' },
      {
        codigo: 'MA05 OA 15',
        texto: 'Resolver problemas, usando ecuaciones e inecuaciones de un paso, que involucren adiciones y sustracciones, en forma pictórica y simbólica.',
      },
    ],
  },
  {
    numero: 6,
    nombre: 'Ciudad de las Fórmulas',
    nivel: '6° básico',
    lema: 'Del patrón a la expresión con letras',
    color: '#c2185b',
    disponible: true,
    jefe: { nombre: 'Robot Fórmulus', descripcion: 'Solo habla en lenguaje algebraico y esconde sus números en ecuaciones. ¡Descífralo!', vida: 14 },
    oa: [
      {
        codigo: 'MA06 OA 9',
        texto:
          'Demostrar que comprenden la relación entre los valores de una tabla y aplicarla en la resolución de problemas sencillos: identificando patrones entre los valores de la tabla; formulando una regla con lenguaje matemático.',
      },
      { codigo: 'MA06 OA 10', texto: 'Representar generalizaciones de relaciones entre números naturales, usando expresiones con letras y ecuaciones.' },
      {
        codigo: 'MA06 OA 11',
        texto:
          'Resolver ecuaciones de primer grado con una incógnita, utilizando estrategias como: usando una balanza; usar la descomposición y la correspondencia 1 a 1 entre los términos en cada lado de la ecuación y aplicando procedimientos formales de resolución.',
        balanza: true,
      },
    ],
  },
  {
    numero: 7,
    nombre: 'Volcán de los Globos',
    nivel: '7° básico',
    lema: 'Términos semejantes, proporciones y ecuaciones',
    color: '#d6452f',
    disponible: true,
    jefe: { nombre: 'Dragón de Ceniza', descripcion: 'Infla globos que tiran hacia arriba y mezcla todo lo que encuentra. ¡Ordena el volcán!', vida: 16 },
    oa: [
      {
        codigo: 'MA07 OA 6',
        texto: 'Utilizar el lenguaje algebraico para generalizar relaciones entre números, para establecer y formular reglas y propiedades y construir ecuaciones.',
      },
      {
        codigo: 'MA07 OA 7',
        texto: 'Reducir expresiones algebraicas, reuniendo términos semejantes para obtener expresiones de la forma ax + by + cz (a, b, c ϵ Z).',
      },
      {
        codigo: 'MA07 OA 8',
        texto:
          'Mostrar que comprenden las proporciones directas e inversas: realizando tablas de valores para relaciones proporcionales; graficando los valores de la tabla; explicando las características de la gráfica; resolviendo problemas de la vida diaria y de otras asignaturas.',
      },
      {
        codigo: 'MA07 OA 9',
        texto:
          'Modelar y resolver problemas diversos de la vida diaria y de otras asignaturas, que involucran ecuaciones e inecuaciones lineales de la forma: ax = b; x/a = b (a, b y c ϵ N; a ≠ 0); ax < b; ax > b; x/a < b; x/a > b (a, b y c ϵ N; a ≠ 0).',
      },
    ],
  },
  {
    numero: 8,
    nombre: 'Castillo del Desequilibrio',
    nivel: '8° básico',
    lema: 'De la balanza a la función',
    color: '#3b2a6e',
    disponible: false,
    jefe: { nombre: 'Rey Desequilibrio', descripcion: 'Gobierna con dos balanzas a la vez.', vida: 16 },
    oa: [
      {
        codigo: 'MA08 OA 7',
        texto:
          'Mostrar que comprenden la noción de función por medio de un cambio lineal: utilizando tablas; usando metáforas de máquinas; estableciendo reglas entre x e y; representando de manera gráfica (plano cartesiano, diagramas de Venn), de manera manual y/o con software educativo.',
      },
      {
        codigo: 'MA08 OA 8',
        texto:
          'Modelar situaciones de la vida diaria y de otras asignaturas, usando ecuaciones lineales de la forma: ax = b; x/a = b, a ≠ 0; ax + b = c; x/a + b = c; ax = b + cx; a(x + b) = c; ax + b = cx + d (a, b, c, d, e ϵ Q).',
      },
      {
        codigo: 'MA08 OA 9',
        texto:
          'Resolver inecuaciones lineales con coeficientes racionales en el contexto de la resolución de problemas, por medio de representaciones gráficas, simbólicas, de manera manual y/o con software educativo.',
      },
      {
        codigo: 'MA08 OA 10',
        texto:
          'Mostrar que comprenden la función afín: generalizándola como la suma de una constante con una función lineal; trasladando funciones lineales en el plano cartesiano; determinando el cambio constante de un intervalo a otro, de manera gráfica y simbólica, de manera manual y/o con software educativo; relacionándola con el interés simple; utilizándola para resolver problemas de la vida diaria y de otras asignaturas.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Etapas
// ---------------------------------------------------------------------------

const simple =
  (tipo: TipoItem) =>
  (nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado =>
    MECANICAS[tipo].generar(nivel, azar, ctx);

/** Collares y caminos (1° básico): patrones repetitivos y numéricos hasta 20. */
function patronesPradera(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado {
  const pesoNumerico = [0.3, 0.4, 0.5, 0.5, 0.5][nivel - 1] ?? 0.5;
  const tipo: TipoItem = azar.probabilidad(pesoNumerico) ? 'patron_numerico' : 'patron_figuras';
  return MECANICAS[tipo].generar(nivel, azar, ctx);
}

/** Mezcla para jefes: evita repetir la mecánica anterior. */
function mezcla(generadores: { tipo: TipoItem; generar: Etapa['generar'] }[]) {
  return (nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado => {
    const opciones = generadores.filter((g) => g.tipo !== ctx.anterior);
    const elegido = azar.elegir(opciones.length > 0 ? opciones : generadores);
    return elegido.generar(nivel, azar, ctx);
  };
}

function etapa(datos: Omit<Etapa, 'metaLogros' | 'maxItems' | 'nivelInicial' | 'nivelMaximo'> & Partial<Etapa>): Etapa {
  return {
    metaLogros: datos.esJefe ? 0 : 10,
    maxItems: datos.esJefe ? 30 : 40,
    nivelInicial: datos.esJefe ? 3 : 1,
    nivelMaximo: 5,
    ...datos,
  };
}

export const ETAPAS: Etapa[] = [
  etapa({
    id: '1-1',
    isla: 1,
    orden: 1,
    nombre: '¿Hacia dónde baja?',
    descripcion: 'Predice si la balanza queda en equilibrio o hacia qué lado baja.',
    oa: ['MA01 OA 12'],
    esJefe: false,
    mecanicas: ['inclinacion'],
    generar: simple('inclinacion'),
  }),
  etapa({
    id: '1-2',
    isla: 1,
    orden: 2,
    nombre: '¡A equilibrar!',
    descripcion: 'Pon los cubos justos en la caja misteriosa. ¡Piensa antes de pesar!',
    oa: ['MA01 OA 12'],
    esJefe: false,
    mecanicas: ['equilibrar'],
    generar: simple('equilibrar'),
  }),
  etapa({
    id: '1-3',
    isla: 1,
    orden: 3,
    nombre: 'Collares y caminos',
    descripcion: 'Descubre el grupo que se repite y continúa caminos de números hasta el 20.',
    oa: ['MA01 OA 11'],
    esJefe: false,
    mecanicas: ['patron_figuras', 'patron_numerico'],
    generar: patronesPradera,
  }),
  etapa({
    id: '1-4',
    isla: 1,
    orden: 4,
    nombre: 'El cuaderno de Gatito',
    descripcion: 'Escribe con números y el signo igual lo que muestra la balanza.',
    oa: ['MA01 OA 12'],
    esJefe: false,
    mecanicas: ['registrar'],
    generar: simple('registrar'),
  }),
  etapa({
    id: '1-J',
    isla: 1,
    orden: 5,
    nombre: 'El Cuervo Revoltoso',
    descripcion: 'El gran desafío de la pradera: todo lo que aprendiste, contra el cuervo.',
    oa: ['MA01 OA 11', 'MA01 OA 12'],
    esJefe: true,
    mecanicas: ['inclinacion', 'equilibrar', 'patron_figuras', 'patron_numerico', 'registrar'],
    generar: mezcla([
      { tipo: 'inclinacion', generar: simple('inclinacion') },
      { tipo: 'equilibrar', generar: simple('equilibrar') },
      { tipo: 'patron_figuras', generar: patronesPradera },
      { tipo: 'registrar', generar: simple('registrar') },
    ]),
  }),
  etapa({
    id: '2-1',
    isla: 2,
    orden: 1,
    nombre: 'El signo que falta',
    descripcion: 'Elige <, = o >. ¡Algunas se pueden resolver sin calcular!',
    oa: ['MA02 OA 13'],
    esJefe: false,
    mecanicas: ['signo'],
    generar: simple('signo'),
  }),
  etapa({
    id: '2-2',
    isla: 2,
    orden: 2,
    nombre: 'El número escondido',
    descripcion: 'Completa la caja para que los dos lados valgan lo mismo.',
    oa: ['MA02 OA 13'],
    esJefe: false,
    mecanicas: ['equilibrar'],
    generar: simple('equilibrar'),
  }),
  etapa({
    id: '2-3',
    isla: 2,
    orden: 3,
    nombre: 'Senderos del bosque',
    descripcion: 'Completa senderos de números hasta el 100 y descubre su regla.',
    oa: ['MA02 OA 12'],
    esJefe: false,
    mecanicas: ['patron_numerico'],
    generar: simple('patron_numerico'),
  }),
  etapa({
    id: '2-4',
    isla: 2,
    orden: 4,
    nombre: '¿Verdadero o falso?',
    descripcion: 'Decide qué igualdades son verdaderas. ¡Cuidado con las trampas!',
    oa: ['MA02 OA 13'],
    esJefe: false,
    mecanicas: ['verdadero_falso'],
    generar: simple('verdadero_falso'),
  }),
  etapa({
    id: '2-J',
    isla: 2,
    orden: 5,
    nombre: 'La Bruja Ventolera',
    descripcion: 'El gran desafío del bosque: signos, cajas, senderos e igualdades.',
    oa: ['MA02 OA 12', 'MA02 OA 13'],
    esJefe: true,
    mecanicas: ['signo', 'equilibrar', 'patron_numerico', 'verdadero_falso'],
    generar: mezcla([
      { tipo: 'signo', generar: simple('signo') },
      { tipo: 'equilibrar', generar: simple('equilibrar') },
      { tipo: 'patron_numerico', generar: simple('patron_numerico') },
      { tipo: 'verdadero_falso', generar: simple('verdadero_falso') },
    ]),
  }),
];

// Isla 3 ----------------------------------------------------------------------

ETAPAS.push(
  etapa({
    id: '3-1',
    isla: 3,
    orden: 1,
    nombre: 'La caja misteriosa',
    descripcion: 'Descubre el número escondido con la operación inversa. ¡Y compruébalo!',
    oa: ['MA03 OA 13'],
    esJefe: false,
    mecanicas: ['ecuacion'],
    generar: simple('ecuacion'),
  }),
  etapa({
    id: '3-2',
    isla: 3,
    orden: 2,
    nombre: 'Pesas del río',
    descripcion: 'Equilibra balanzas hasta 100 con decenas, canjes y compensación.',
    oa: ['MA03 OA 13'],
    esJefe: false,
    mecanicas: ['equilibrar'],
    generar: simple('equilibrar'),
  }),
  etapa({
    id: '3-3',
    isla: 3,
    orden: 3,
    nombre: 'La tabla del 100',
    descripcion: 'Descubre patrones en la tabla: columnas, diagonales y trozos escondidos.',
    oa: ['MA03 OA 12'],
    esJefe: false,
    mecanicas: ['tabla100'],
    generar: simple('tabla100'),
  }),
  etapa({
    id: '3-4',
    isla: 3,
    orden: 4,
    nombre: 'Cuentos con cajas',
    descripcion: 'Elige la ecuación que cuenta la historia y resuélvela. ¡No te dejes engañar por las palabras!',
    oa: ['MA03 OA 13'],
    esJefe: false,
    mecanicas: ['problema'],
    generar: simple('problema'),
  }),
  etapa({
    id: '3-J',
    isla: 3,
    orden: 5,
    nombre: 'El Pulpo Escondecajas',
    descripcion: 'El gran desafío del río: ecuaciones, pesas, tabla del 100 y cuentos.',
    oa: ['MA03 OA 12', 'MA03 OA 13'],
    esJefe: true,
    mecanicas: ['ecuacion', 'equilibrar', 'tabla100', 'problema'],
    generar: mezcla([
      { tipo: 'ecuacion', generar: simple('ecuacion') },
      { tipo: 'equilibrar', generar: simple('equilibrar') },
      { tipo: 'tabla100', generar: simple('tabla100') },
      { tipo: 'problema', generar: simple('problema') },
    ]),
  }),
);

// Isla 4 ----------------------------------------------------------------------

/** Cuentos de la cumbre: problemas con ecuaciones y con inecuaciones. */
function cuentosCumbre(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado {
  if (azar.probabilidad(0.5)) return MECANICAS.problema.generar(nivel, azar, ctx);
  // Las historias con inecuaciones son las del nivel 4 de la mecánica; el nivel del ejercicio es el de la etapa.
  return { ...MECANICAS.inecuacion.generar(4, azar, ctx), nivel };
}

ETAPAS.push(
  etapa({
    id: '4-1',
    isla: 4,
    orden: 1,
    nombre: 'La máquina de reglas',
    descripcion: 'Descubre qué le hace la máquina a cada número. ¡Cuidado con las tablas desordenadas!',
    oa: ['MA04 OA 13'],
    esJefe: false,
    mecanicas: ['tabla_regla'],
    generar: simple('tabla_regla'),
  }),
  etapa({
    id: '4-2',
    isla: 4,
    orden: 2,
    nombre: 'Ecuaciones de la cumbre',
    descripcion: 'Ecuaciones de un paso con suma y resta hasta 100. Resuelve y comprueba.',
    oa: ['MA04 OA 14'],
    esJefe: false,
    mecanicas: ['ecuacion'],
    generar: simple('ecuacion'),
  }),
  etapa({
    id: '4-3',
    isla: 4,
    orden: 3,
    nombre: 'La balanza inclinada',
    descripcion: 'Inecuaciones: marca en la recta TODOS los números que sirven.',
    oa: ['MA04 OA 14'],
    esJefe: false,
    mecanicas: ['inecuacion'],
    generar: simple('inecuacion'),
  }),
  etapa({
    id: '4-4',
    isla: 4,
    orden: 4,
    nombre: 'Cuentos de la cumbre',
    descripcion: 'Historias que se resuelven con ecuaciones o con inecuaciones.',
    oa: ['MA04 OA 14'],
    esJefe: false,
    mecanicas: ['problema', 'inecuacion'],
    generar: cuentosCumbre,
  }),
  etapa({
    id: '4-J',
    isla: 4,
    orden: 5,
    nombre: 'El Yeti de las Tablas',
    descripcion: 'El gran desafío de la montaña: reglas, ecuaciones, inecuaciones y cuentos.',
    oa: ['MA04 OA 13', 'MA04 OA 14'],
    esJefe: true,
    mecanicas: ['tabla_regla', 'ecuacion', 'inecuacion', 'problema'],
    generar: mezcla([
      { tipo: 'tabla_regla', generar: simple('tabla_regla') },
      { tipo: 'ecuacion', generar: simple('ecuacion') },
      { tipo: 'inecuacion', generar: simple('inecuacion') },
      { tipo: 'problema', generar: simple('problema') },
    ]),
  }),
);

// Isla 5 ----------------------------------------------------------------------

/** La caravana: problemas con ecuaciones (hasta 500) y con inecuaciones graficadas (hasta 1000). */
function caravana(nivel: number, azar: Azar, ctx: ContextoGeneracion): ItemGenerado {
  if (azar.probabilidad(0.5)) return MECANICAS.problema.generar(nivel, azar, ctx);
  // Siempre con historia; el tamaño de los números crece con el nivel.
  return generarGrafico(nivel, azar, true);
}

ETAPAS.push(
  etapa({
    id: '5-1',
    isla: 5,
    orden: 1,
    nombre: 'Huellas en la arena',
    descripcion: 'Descubre la regla de cada sucesión y predice números lejanos… ¡sin contar de a uno!',
    oa: ['MA05 OA 14'],
    esJefe: false,
    mecanicas: ['sucesion'],
    generar: (nivel, azar) => generarSucesion(nivel, azar, 'numerica'),
  }),
  etapa({
    id: '5-2',
    isla: 5,
    orden: 2,
    nombre: 'Torres de palitos',
    descripcion: 'Figuras que crecen: ¿cuántos palitos tendrá la figura 40? ¿Qué figura usa 91?',
    oa: ['MA05 OA 14'],
    esJefe: false,
    mecanicas: ['sucesion'],
    generar: (nivel, azar) => generarSucesion(nivel, azar, 'figuras'),
  }),
  etapa({
    id: '5-3',
    isla: 5,
    orden: 3,
    nombre: 'Espejismos',
    descripcion: '¿Un solo número o muchos? Resuelve y dibuja la solución en la recta.',
    oa: ['MA05 OA 15'],
    esJefe: false,
    mecanicas: ['grafico_solucion'],
    generar: simple('grafico_solucion'),
  }),
  etapa({
    id: '5-4',
    isla: 5,
    orden: 4,
    nombre: 'La caravana',
    descripcion: 'Problemas del desierto que se resuelven con ecuaciones o con inecuaciones.',
    oa: ['MA05 OA 15'],
    esJefe: false,
    mecanicas: ['problema', 'grafico_solucion'],
    generar: caravana,
  }),
  etapa({
    id: '5-J',
    isla: 5,
    orden: 5,
    nombre: 'El Escorpión Desigual',
    descripcion: 'El gran desafío del desierto: sucesiones, figuras, gráficos y problemas.',
    oa: ['MA05 OA 14', 'MA05 OA 15'],
    esJefe: true,
    mecanicas: ['sucesion', 'grafico_solucion', 'problema'],
    generar: mezcla([
      { tipo: 'sucesion', generar: (nivel, azar) => generarSucesion(nivel, azar, azar.probabilidad(0.5) ? 'figuras' : 'numerica') },
      { tipo: 'grafico_solucion', generar: simple('grafico_solucion') },
      { tipo: 'problema', generar: simple('problema') },
    ]),
  }),
);

// Isla 6 ----------------------------------------------------------------------

ETAPAS.push(
  etapa({
    id: '6-1',
    isla: 6,
    orden: 1,
    nombre: 'La fábrica de fórmulas',
    descripcion: 'Mira la tabla y escribe la fórmula con letras. ¡Algunas tablas vienen desordenadas!',
    oa: ['MA06 OA 9', 'MA06 OA 10'],
    esJefe: false,
    mecanicas: ['expresion'],
    generar: (nivel, azar) => generarExpresion(nivel, azar, false),
  }),
  etapa({
    id: '6-2',
    isla: 6,
    orden: 2,
    nombre: 'Letras que generalizan',
    descripcion: 'Taxis, trenes, mesas y figuras: escribe la fórmula y úsala para predecir.',
    oa: ['MA06 OA 9', 'MA06 OA 10'],
    esJefe: false,
    mecanicas: ['expresion'],
    generar: (nivel, azar) => generarExpresion(nivel, azar, true),
  }),
  etapa({
    id: '6-3',
    isla: 6,
    orden: 3,
    nombre: 'Balanza de las fórmulas',
    descripcion: 'Ecuaciones como 3x + 5 = 26: primero en la balanza, después paso a paso.',
    oa: ['MA06 OA 11'],
    esJefe: false,
    mecanicas: ['ecuacion_dos_pasos'],
    generar: simple('ecuacion_dos_pasos'),
  }),
  etapa({
    id: '6-4',
    isla: 6,
    orden: 4,
    nombre: 'Problemas con letras',
    descripcion: 'Elige la ecuación que cuenta la historia y resuélvela.',
    oa: ['MA06 OA 10', 'MA06 OA 11'],
    esJefe: false,
    mecanicas: ['problema'],
    generar: (nivel, azar) => generarProblemaLetras(nivel, azar),
  }),
  etapa({
    id: '6-J',
    isla: 6,
    orden: 5,
    nombre: 'El Robot Fórmulus',
    descripcion: 'El gran desafío de la ciudad: fórmulas, ecuaciones y problemas.',
    oa: ['MA06 OA 9', 'MA06 OA 10', 'MA06 OA 11'],
    esJefe: true,
    mecanicas: ['expresion', 'ecuacion_dos_pasos', 'problema'],
    generar: mezcla([
      { tipo: 'expresion', generar: (nivel, azar) => generarExpresion(nivel, azar, azar.probabilidad(0.5)) },
      { tipo: 'ecuacion_dos_pasos', generar: simple('ecuacion_dos_pasos') },
      { tipo: 'problema', generar: (nivel, azar) => generarProblemaLetras(nivel, azar) },
    ]),
  }),
);

// Isla 7 ----------------------------------------------------------------------

ETAPAS.push(
  etapa({
    id: '7-1',
    isla: 7,
    orden: 1,
    nombre: 'Globos y sacos',
    descripcion: 'Reduce expresiones: junta las mismas letras. Cada globo anula un saco.',
    oa: ['MA07 OA 7'],
    esJefe: false,
    mecanicas: ['reducir'],
    generar: simple('reducir'),
  }),
  etapa({
    id: '7-2',
    isla: 7,
    orden: 2,
    nombre: 'Ríos proporcionales',
    descripcion: '¿Directa, inversa o ninguna? Completa la tabla y mira su gráfico.',
    oa: ['MA07 OA 8'],
    esJefe: false,
    mecanicas: ['proporcion'],
    generar: simple('proporcion'),
  }),
  etapa({
    id: '7-3',
    isla: 7,
    orden: 3,
    nombre: 'Ecuaciones de lava',
    descripcion: '3x = 21, x/4 > 6… Resuelve y dibuja la solución en la recta.',
    oa: ['MA07 OA 9'],
    esJefe: false,
    mecanicas: ['ecuacion_mult'],
    generar: simple('ecuacion_mult'),
  }),
  etapa({
    id: '7-4',
    isla: 7,
    orden: 4,
    nombre: 'Problemas del volcán',
    descripcion: 'Traduce al lenguaje algebraico y modela con ecuaciones e inecuaciones.',
    oa: ['MA07 OA 6', 'MA07 OA 9'],
    esJefe: false,
    mecanicas: ['problema'],
    generar: (nivel, azar) => generarProblemaVolcan(nivel, azar),
  }),
  etapa({
    id: '7-J',
    isla: 7,
    orden: 5,
    nombre: 'El Dragón de Ceniza',
    descripcion: 'El gran desafío del volcán: términos semejantes, proporciones, ecuaciones y problemas.',
    oa: ['MA07 OA 6', 'MA07 OA 7', 'MA07 OA 8', 'MA07 OA 9'],
    esJefe: true,
    mecanicas: ['reducir', 'proporcion', 'ecuacion_mult', 'problema'],
    generar: mezcla([
      { tipo: 'reducir', generar: simple('reducir') },
      { tipo: 'proporcion', generar: simple('proporcion') },
      { tipo: 'ecuacion_mult', generar: simple('ecuacion_mult') },
      { tipo: 'problema', generar: (nivel, azar) => generarProblemaVolcan(nivel, azar) },
    ]),
  }),
);

export function buscarEtapa(id: string): Etapa | undefined {
  return ETAPAS.find((e) => e.id === id);
}

export function buscarIsla(numero: number): Isla | undefined {
  return ISLAS.find((i) => i.numero === numero);
}

export const etapasDeIsla = (numero: number): Etapa[] => ETAPAS.filter((e) => e.isla === numero).sort((a, b) => a.orden - b.orden);
