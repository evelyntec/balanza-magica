/**
 * Explicación de cada error típico para el panel docente, con una
 * sugerencia de intervención en el aula.
 */

export const DIAGNOSTICOS_DOCENTE: Record<string, { titulo: string; sugerencia: string }> = {
  direccion_opuesta: {
    titulo: 'Cree que el lado más pesado sube',
    sugerencia: 'Usar una balanza real o de perchas: poner objetos y pedir que predigan antes de soltar.',
  },
  equilibrio_falso: {
    titulo: 'Ve equilibrio donde no lo hay',
    sugerencia: 'Pedir que calculen el total de cada platillo y lo escriban antes de decidir.',
  },
  desequilibrio_falso: {
    titulo: 'No reconoce el equilibrio con expresiones distintas',
    sugerencia: 'Trabajar igualdades como 5 + 3 = 4 + 4 con material concreto: distinto aspecto, mismo peso.',
  },
  resultado_del_otro_lado: {
    titulo: 'Visión operacional del "=" (8 + 5 = □ + 7 → 13)',
    sugerencia: 'Discutir el "=" como "vale lo mismo que". Proponer igualdades con operaciones a ambos lados (ReFIP Álgebra, cap. 2).',
  },
  suma_todo: {
    titulo: 'Suma todos los números que ve',
    sugerencia: 'Preguntar "¿qué le falta a este lado para pesar igual que el otro?" y modelar con cubos.',
  },
  muy_liviana: { titulo: 'Propuesta menor a la necesaria', sugerencia: 'Estimar antes de pesar: ¿más o menos que…?' },
  muy_pesada: { titulo: 'Propuesta mayor a la necesaria', sugerencia: 'Estimar antes de pesar: ¿más o menos que…?' },
  signo_invertido: {
    titulo: 'Confunde < y >',
    sugerencia: 'Leer siempre de izquierda a derecha en voz alta ("8 es mayor que 5") y marcar la "boca" hacia el mayor.',
  },
  conteo: { titulo: 'Errores de conteo (±1)', sugerencia: 'Contar tocando cada objeto una vez; agrupar de a 5.' },
  lados_invertidos: { titulo: 'Registra los lados al revés', sugerencia: 'Relacionar explícitamente izquierda de la balanza con izquierda de la igualdad.' },
  patron_repite_ultimo: {
    titulo: 'Repite el último elemento en vez de seguir el núcleo',
    sugerencia: 'Pedir que marquen con un color el grupo que se repite y lo lean en voz alta.',
  },
  patron_nucleo_corto: { titulo: 'Identifica un núcleo incompleto', sugerencia: 'Probar el núcleo: repetirlo y comparar con el patrón.' },
  patron_nucleo_largo: { titulo: 'Identifica un núcleo con elementos de más', sugerencia: 'Buscar el grupo más pequeño que, repetido, forma el patrón.' },
  patron_posicion: { titulo: 'Se equivoca por un lugar en posiciones lejanas', sugerencia: 'Numerar las posiciones y relacionarlas con el tamaño del núcleo (múltiplos).' },
  patron_paso_errado: { titulo: 'Calcula mal el salto del patrón', sugerencia: 'Registrar las diferencias entre términos consecutivos antes de continuar.' },
  patron_direccion: { titulo: 'Confunde patrón creciente y decreciente', sugerencia: 'Preguntar: ¿los números suben o bajan?' },
  patron_parcial: { titulo: 'Completa solo parte del patrón', sugerencia: 'Comprobar cada salto, incluso hacia atrás.' },
  patron_regla: { titulo: 'No identifica la regla del patrón', sugerencia: 'Calcular la diferencia entre varios pares de términos.' },
  vf_invertida: {
    titulo: 'Rechaza igualdades con el resultado a la izquierda (8 = 5 + 3)',
    sugerencia: 'Presentar igualdades en distintas posiciones; la visión relacional del "=" es clave para álgebra.',
  },
  vf_identidad: { titulo: 'Rechaza igualdades como 7 = 7', sugerencia: 'Mostrar con la balanza que un número siempre se equilibra consigo mismo.' },
  vf_conmutativa: { titulo: 'No reconoce la conmutatividad sin calcular', sugerencia: 'Promover el pensamiento relacional: ¿necesito calcular para saberlo?' },
  vf_compensacion: { titulo: 'No reconoce la compensación (8 + 5 = 9 + 4)', sugerencia: 'Trabajar "lo que sube uno lo baja el otro" con cubos.' },
  vf_encadenada: {
    titulo: 'Acepta cálculos encadenados (8 + 4 = 12 + 5)',
    sugerencia: 'Error típico del uso del "=" como "y ahora sigo". Evitar escribir cadenas así en la pizarra.',
  },
  vf_casi: { titulo: 'No verifica con precisión ambos lados', sugerencia: 'Calcular y escribir el valor de cada lado.' },
  vf_resta: { titulo: 'Errores en igualdades con resta', sugerencia: 'Revisar la relación inversa entre adición y sustracción.' },
  operacion_inversa: {
    titulo: 'Usa la operación directa en vez de la inversa (□ + 23 = 57 → 80)',
    sugerencia: 'Modelar con la balanza "quitar de ambos lados" y con el modelo de barras parte-parte-todo; exigir comprobar reemplazando.',
  },
  error_decena: { titulo: 'Error de una decena (canje)', sugerencia: 'Revisar la resta con canje usando bloques multibase.' },
  tabla_fila_columna: {
    titulo: 'Confunde filas y columnas de la tabla del 100',
    sugerencia: 'Explicitar la estructura: a la derecha +1, hacia abajo +10; recorrer la tabla con el dedo.',
  },
  modelo_palabra_clave: {
    titulo: 'Resuelve por palabras clave ("más" → sumar)',
    sugerencia: 'Leer la historia completa, identificar lo desconocido y representarlo con barras antes de elegir la operación.',
  },
  modelo_errado: { titulo: 'Elige una ecuación que no representa la historia', sugerencia: 'Dramatizar la historia en orden y poner la caja donde está lo que no se sabe.' },
  regla_recursiva: {
    titulo: 'Busca la regla solo hacia abajo en la columna de salida (recursiva)',
    sugerencia: 'Desordenar las entradas y preguntar: ¿qué le hace la máquina a CADA número que entra? (MA04 OA 13).',
  },
  regla_operacion: {
    titulo: 'Confunde la operación de la regla (+ con ×)',
    sugerencia: 'Comprobar la regla en al menos dos filas: 3 + 9 = 12 sirve en una fila, pero 3 × 4 = 12 sirve en todas.',
  },
  inecuacion_igualdad: {
    titulo: 'Resuelve la inecuación como una ecuación (marca solo el borde)',
    sugerencia: 'Mostrar con la balanza inclinada que hay muchos valores posibles; probar números a ambos lados del borde.',
  },
  inecuacion_un_valor: { titulo: 'Encuentra solo algunas soluciones de la inecuación', sugerencia: 'Pedir que prueben TODOS los números de la recta, uno por uno.' },
  inecuacion_borde: {
    titulo: 'Incluye el borde (confunde < con ≤)',
    sugerencia: 'Reemplazar el borde y comparar: si los lados quedan iguales, no es "menor que".',
  },
  inecuacion_direccion: {
    titulo: 'Marca el lado contrario de la recta',
    sugerencia: 'Leer el signo en voz alta ("es menor que") y relacionarlo con el platillo que sube en la balanza.',
  },
  sucesion_proporcional: {
    titulo: 'Supone proporcionalidad (figura 20 = 4 × 20, o el doble de la figura 10)',
    sugerencia: 'Construir las figuras con palitos y separar lo que se repite de lo que está desde el inicio: 3 × n + 1, no 4 × n.',
  },
  sucesion_sin_inicio: {
    titulo: 'Olvida el término inicial (3 × 20 en vez de 3 × 20 + 1)',
    sugerencia: 'Comprobar siempre la regla con la figura 1 y la figura 2 antes de predecir.',
  },
  sucesion_desfase: {
    titulo: 'Cuenta un salto de más o de menos',
    sugerencia: 'Contar los saltos entre la posición 1 y la 5 con los dedos: son 4, no 5.',
  },
  sucesion_aditiva: {
    titulo: 'Supone que todas las sucesiones suman lo mismo',
    sugerencia: 'Calcular todas las diferencias y buscar si se multiplica o si las diferencias crecen.',
  },
  sucesion_regla: {
    titulo: 'Predice bien pero elige una regla que no sirve para todos los términos',
    sugerencia: 'Verificar cada regla candidata con al menos dos posiciones.',
  },
  ecuacion_rayo: {
    titulo: 'Dibuja muchas soluciones para una ecuación',
    sugerencia: 'Contrastar "=" con "<" y ">": la ecuación tiene una sola solución (punto lleno).',
  },
  formula_recursiva: {
    titulo: 'Escribe la regla recursiva como fórmula ("n + 3" en vez de "3 · n + 1")',
    sugerencia: 'Distinguir "aumenta 3 cada vez" (3 · n) de "súmale 3 a n"; comprobar la fórmula con dos filas.',
  },
  formula_proporcional: {
    titulo: 'Escribe una fórmula proporcional (4 · n para 3 · n + 1)',
    sugerencia: 'Separar en la figura lo que se repite (3 por cada una) de lo que está desde el inicio (1).',
  },
  formula_sin_constante: { titulo: 'Olvida la constante de la fórmula', sugerencia: 'Comparar la columna "3 · n" con la columna de valores: ¿cuánto falta?' },
  formula_constante: { titulo: 'Coeficiente correcto, constante equivocada', sugerencia: 'Calcular la constante con la fila n = 1 y comprobar con otra fila.' },
  formula_evaluacion: { titulo: 'Fórmula correcta pero error al evaluarla', sugerencia: 'Reemplazar la letra y respetar la prioridad: primero multiplicar.' },
  ecuacion_sin_dividir: {
    titulo: 'Deja la ecuación en 3x = 21 (no reparte)',
    sugerencia: 'En la balanza, repartir las cajas en grupos iguales; 3x significa 3 veces x.',
  },
  ecuacion_orden: {
    titulo: 'Divide antes de quitar la constante (26 ÷ 3 − 5)',
    sugerencia: 'Con la balanza: el 5 no está multiplicado por 3; primero se quita de ambos lados.',
  },
  reducir_mezcla: {
    titulo: 'Junta términos no semejantes (3x + 2y = 5x)',
    sugerencia: 'Con sacos de colores: solo se juntan los de la misma letra. Pedir que ordenen por letra antes de sumar.',
  },
  reducir_signo: { titulo: 'Ignora el signo menos al reducir', sugerencia: 'Modelar los términos negativos como globos que anulan sacos (pares cero).' },
  reducir_signo_resultado: { titulo: 'Equivoca el signo del resultado (−2x como 2x)', sugerencia: 'Preguntar: ¿hay más sacos o más globos? Eso define el signo.' },
  proporcion_tipo: { titulo: 'Confunde proporción directa con inversa', sugerencia: 'Calcular en cada fila el cociente y el producto: el que se mantiene define el tipo.' },
  proporcion_afin: {
    titulo: 'Cree que toda relación creciente es proporcional directa',
    sugerencia: 'Comparar el taxi (cobra al subir) con el precio por kilo: graficar y ver si la recta pasa por el origen.',
  },
  proporcion_aditiva: {
    titulo: 'Usa la estrategia aditiva (4 → 6 entonces 6 → 8)',
    sugerencia: 'Trabajar razones con tablas y dobles/mitades; la proporcionalidad es multiplicativa.',
  },
  proporcion_inversa_directa: {
    titulo: 'Resuelve una proporción inversa como directa',
    sugerencia: 'Situaciones como "más personas, menos horas": verificar que el producto se mantiene.',
  },
};
