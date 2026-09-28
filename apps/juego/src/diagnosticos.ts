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
};
