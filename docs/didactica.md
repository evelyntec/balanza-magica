# Fundamentación didáctica

Balanza Mágica trabaja el eje transversal de álgebra de la educación básica chilena: **Patrones y álgebra**
(1° a 6°) y **Álgebra y funciones** (7° y 8°). Se inspira en la colección **ReFIP** (*Recursos para la Formación
Inicial de Profesores*, CMM Universidad de Chile), que analiza cada contenido junto con los errores frecuentes
de los estudiantes, el análisis de actividades y la secuencia curricular.

## 1. La igualdad como equilibrio

La balanza es el modelo que proponen los propios OA (MA01 OA 12 y MA06 OA 11 la nombran explícitamente).
El juego la usa para construir la **visión relacional del signo igual**: "=" significa *vale lo mismo que*,
no *escribe el resultado*.

| Decisión de diseño | Por qué |
|---|---|
| El estudiante manipula la balanza en vez de marcar alternativas | La acción (poner o sacar cubos) es la representación concreta. |
| Igualdades como `8 = 5 + 3`, `6 = 6` y `4 + 4 = 6 + 2` en el cuaderno de Gatito | Desafían la lectura "operación = resultado" (Falkner, Levi y Carpenter, 1999). |
| La caja misteriosa aparece a la izquierda o a la derecha | Evita que el "resultado" esté siempre a la derecha. |
| `8 + 5 = □ + 7` con diagnóstico si responde 13 o 20 | Son las respuestas típicas documentadas por Castro y Molina (2007). |
| Verdadero o falso con `8 + 4 = 12 + 5` | Detecta el uso encadenado del "=" como "y ahora sigo calculando". |

## 2. Concreto → pictórico → simbólico

Cada etapa sube de nivel cambiando la **representación**, no solo el tamaño de los números:

1. **Cubos** agrupados en torres de 5 con tonos alternados (apoya el conteo de a 5 y el ámbito hasta 20).
2. **Pesas** con su número escrito.
3. **Solo símbolos**; la balanza aparece al final para comprobar.

La pista de nivel 2 de cada desafío devuelve a la representación anterior (por ejemplo, convierte las pesas en cubos).

## 3. La balanza tiene física coherente

Una balanza mal dibujada enseña mal. Por eso:

- siempre baja el lado más pesado;
- la inclinación crece con la diferencia, con un mínimo visible (una diferencia de 1 se nota) y un máximo (el brazo topa);
- el ángulo depende solo de la diferencia: agregar lo mismo a ambos lados no cambia nada;
- los platillos cuelgan siempre verticales y un fiel central marca el equilibrio.

Estas reglas están verificadas con pruebas de propiedades (`packages/nucleo/test/base.test.ts`).

**Límite reconocido del modelo:** la balanza no representa bien la sustracción ni los negativos (Vlassis, 2002).
Por eso las expresiones con resta de 2° básico se trabajan en forma simbólica, y en 7° básico se introducirán los
"globos" que tiran hacia arriba, inspirados en la balanza con poleas de Rojano (2010).

## 4. Patrones

- **Repetitivos (1°):** continuar, completar un faltante, **identificar el núcleo** y predecir **posiciones lejanas**.
  El error principal es no identificar la unidad que se repite (Bojorque y Gonzales, 2021); las opciones incluyen
  a propósito un núcleo incompleto y uno con elementos de más.
- **Numéricos (1° hasta 20; 2° hasta 100):** crecientes y decrecientes, huecos en cualquier lugar (incluso el primero,
  para pensar hacia atrás) y reconocimiento de la regla. Siempre hay dos números seguidos visibles para descubrir el salto.
- ReFIP advierte que una secuencia finita no tiene un único patrón posible; por eso se muestran suficientes términos
  para que la regla quede determinada.

## 5. Pensamiento relacional

Algunos desafíos se resuelven mejor sin calcular: `9 + 6 ○ 9 + 7`, `7 + 11 = 11 + 7`, `8 + 5 = 9 + □`.
Se marcan como *relacionales*, tienen su propia insignia y su pista de nivel 1 invita a comparar antes de sumar.

## 6. Errores típicos diagnosticados

| Código | Error | Mecánica |
|---|---|---|
| `resultado_del_otro_lado` | 8 + 5 = □ + 7 → 13 | Completar la caja |
| `suma_todo` | 8 + 5 = □ + 7 → 20 | Completar la caja |
| `direccion_opuesta` | Cree que el lado más pesado sube | ¿Hacia dónde baja? |
| `equilibrio_falso` / `desequilibrio_falso` | Ve equilibrio donde no lo hay, o no lo reconoce con expresiones distintas | Predicción, signos |
| `signo_invertido` | Confunde < y > | Signos |
| `vf_invertida`, `vf_identidad` | Rechaza 8 = 5 + 3 o 7 = 7 | Verdadero o falso |
| `vf_encadenada` | Acepta 8 + 4 = 12 + 5 | Verdadero o falso |
| `vf_conmutativa`, `vf_compensacion` | No reconoce igualdades sin calcular | Verdadero o falso |
| `patron_nucleo_corto` / `largo` | Núcleo mal identificado | Collares |
| `patron_repite_ultimo`, `patron_posicion` | Copia el último o se equivoca por un lugar | Collares |
| `patron_paso_errado`, `patron_direccion`, `patron_regla` | Salto, dirección o regla incorrectos | Caminos y senderos |
| `conteo`, `lados_invertidos` | Errores de conteo o de registro | Cuaderno de Gatito |

| `operacion_inversa` | □ + 23 = 57 → 80 (usa la operación directa) | Ecuaciones, cuentos |
| `error_decena` | Se equivoca en una decena (canje) | Ecuaciones |
| `tabla_fila_columna` | Confunde filas y columnas de la tabla del 100 | Tabla del 100 |
| `modelo_palabra_clave` | "Tiene 12 más que…" → suma (palabras clave) | Cuentos con cajas |
| `modelo_errado` | Elige una ecuación que no representa la historia | Cuentos con cajas |
| `regla_recursiva` | Describe la regla mirando solo la columna de salida ("va de 4 en 4") | Máquina de reglas |
| `regla_operacion` | Elige +9 cuando la regla es ×4 (sirve solo en la primera fila) | Máquina de reglas |
| `inecuacion_igualdad` | Marca solo el borde: resuelve la inecuación como ecuación | Balanza inclinada |
| `inecuacion_un_valor` | Marca algunas soluciones, no todas | Balanza inclinada |
| `inecuacion_borde` | Incluye el borde (lee < como ≤) | Balanza inclinada |
| `inecuacion_direccion` | Marca el lado contrario de la recta | Balanza inclinada, Espejismos |
| `sucesion_proporcional` | Figura 20 = 4 × 20 (o el doble de la figura 10): supone proporcionalidad | Huellas, Torres de palitos |
| `sucesion_sin_inicio` | 3 × 20 en vez de 3 × 20 + 1: olvida el término inicial | Huellas, Torres de palitos |
| `sucesion_desfase` | Cuenta un salto de más o de menos | Huellas, Torres de palitos |
| `sucesion_aditiva` | Suma siempre lo mismo en sucesiones que se multiplican o cuyas diferencias crecen | Huellas |
| `sucesion_regla` | Predice bien pero elige una regla que no sirve para todos los términos | Huellas, Torres de palitos |
| `ecuacion_rayo` | Dibuja muchas soluciones para una ecuación | Espejismos |
| `formula_recursiva` | Escribe "n + 3" cuando la tabla aumenta de 3 en 3 | Fábrica de fórmulas, Letras |
| `formula_proporcional` | Escribe 4 · n para 3 · n + 1 | Fábrica de fórmulas, Letras |
| `formula_sin_constante`, `formula_constante` | Olvida o equivoca la constante | Fábrica de fórmulas, Letras |
| `formula_evaluacion` | Fórmula correcta, error al reemplazar | Fábrica de fórmulas, Letras |
| `ecuacion_sin_dividir` | Deja 3x = 21 y responde 21 | Balanza de las fórmulas |
| `ecuacion_orden` | Divide antes de quitar la constante (26 ÷ 3 − 5) | Balanza de las fórmulas |
| `reducir_mezcla` | Junta términos no semejantes (3x + 2y = 5x) | Globos y sacos |
| `reducir_signo`, `reducir_signo_resultado` | Ignora el menos o equivoca el signo del resultado | Globos y sacos |
| `proporcion_aditiva` | 4 → 6 entonces 6 → 8: suma en vez de multiplicar | Ríos proporcionales |
| `proporcion_inversa_directa` | Resuelve una inversa como directa | Ríos proporcionales |
| `proporcion_afin` | Cree que toda relación creciente es directa (el taxi) | Ríos proporcionales |
| `proporcion_tipo` | Confunde directa con inversa | Ríos proporcionales |
| `ambos_lados_suma` | 5x + 3 = 2x + 15 → 7x = 12 (suma en vez de restar) | Balanzas de doble carga |
| `parentesis_distributiva` | 3(x + 4) = 3x + 4 | Balanzas de doble carga |
| `signo_despeje` | x = 4 en vez de −4 | Balanzas de doble carga, Desigualdades |
| `funcion_no_es` | Acepta un elemento con dos imágenes o sin imagen | Máquina de funciones |
| `funcion_si_es` | Cree que todo el conjunto de llegada debe tener flecha | Máquina de funciones |
| `afin_pendiente_paso` | Usa Δy como pendiente sin dividir por Δx | Rectas del castillo |
| `afin_signo`, `afin_intercepto` | Signo de la pendiente; confunde n con el primer valor de la tabla | Rectas del castillo, Máquina de funciones |
| `inecuacion_no_invierte` | −2x < 6 → x < −3 (no invierte al dividir por un negativo) | Desigualdades del rey |

El panel docente agrupa estos diagnósticos y sugiere una intervención para cada uno.

## 7. Ecuaciones de un paso (3° básico)

- **Tres representaciones** que progresan: la balanza con la acción "quitar lo mismo de ambos lados" (que muestra
  `57 − 23` sin calcularlo por la o el estudiante), el **modelo de barras** parte-parte-todo de los textos Sumo Primero y,
  al final, solo símbolos.
- **Operación inversa y comprobación:** el diagnóstico detecta a quien suma cuando debía restar, y toda respuesta se
  comprueba reemplazando el símbolo en la ecuación.
- **Problemas de inicio desconocido y de comparación inconsistente** ("tiene 12 más que…"), los más difíciles para
  esta edad (Briars y Larkin, 1984). Cada historia ofrece a propósito la ecuación que produce la lectura por palabras clave.
- **Tabla del 100:** su estructura (+1 a la derecha, +10 hacia abajo) se usa para completar trozos sin mirar la tabla,
  y las diagonales de 9 y 11 obligan a coordinar fila y columna.

## 8. Tablas con regla e inecuaciones (4° básico)

- **Regla funcional, no recursiva:** desde el nivel 3 las entradas de la tabla están desordenadas, de modo que mirar
  solo la columna de salida ("va de 4 en 4") no sirve; hay que relacionar cada entrada con su salida. Entre las reglas
  ofrecidas siempre están la recursiva y una aditiva que funciona solo en la primera fila, porque son los errores más
  frecuentes al pasar de patrones a funciones.
- **Máquina inversa:** en el último nivel se conoce la salida y se busca la entrada, aplicando la relación inversa
  entre adición y sustracción (y entre multiplicación y división) que pide el OA.
- **La balanza inclinada:** la misma balanza de 1° a 3°, ahora desequilibrada, da sentido a < y >. Primero se busca
  el **borde** (el número que la equilibraría) y luego hacia qué lado están las soluciones.
- **Conjunto solución:** se marcan en la recta **todos** los números que cumplen, porque el error más persistente es
  creer que una inecuación tiene una sola respuesta. La retroalimentación describe siempre el conjunto completo,
  aunque la recta muestre solo una parte.
- **Formas invertidas** (50 > □ + 12) al final, para que el signo se lea desde cualquier lado, igual que el "=" relacional.

## 9. Sucesiones y conjuntos solución (5° básico)

- **De la regla recursiva a la funcional:** "suma 3" sirve para el término siguiente, pero no para predecir la figura
  40. Por eso las preguntas son lejanas y, en el nivel 3, se elige la regla funcional entre dos distractores: la que
  olvida el inicio (3 × n) y la proporcional (4 × n, "4 palitos por cuadrado"), el error más estudiado en
  generalización de patrones (Stacey, 1989; Radford, 2008).
- **Pregunta inversa:** ¿qué figura usa 91 palitos? Obliga a deshacer la regla.
- **No todas las sucesiones son aritméticas:** dobles, triples, diferencias crecientes y figuras de baldosas
  (n × n, escaleras, rectángulos) evitan que "sumar la diferencia" se vuelva un procedimiento ciego.
- **¿Un número o muchos?** En Espejismos se mezclan ecuaciones e inecuaciones y se debe decidir cómo es el conjunto
  solución: punto lleno o círculo vacío con flecha. El borde se escribe (no se arrastra), para que no se pueda
  adivinar ubicándolo al ojo.

## 10. Letras y ecuaciones de dos pasos (6° básico)

- **La letra como número generalizado:** la fórmula se construye escribiendo el coeficiente, el signo y la
  constante. Los diagnósticos distinguen la lectura recursiva escrita con letras ("n + 3"), la proporcional
  (4 · n) y la constante olvidada, errores descritos por MacGregor y Stacey (1993) y Stacey (1989).
- **Tablas desordenadas y otras letras (x, p, t, m):** evitan leer solo la columna de salida y que la letra se
  asocie siempre a la n.
- **La pista de nivel 2 agrega una columna "3 · n"** junto a los valores: la constante aparece como la diferencia
  entre ambas columnas.
- **De la balanza al procedimiento formal:** la acción "quitar lo mismo de ambos lados" y "repartir en grupos
  iguales" (correspondencia 1 a 1) da sentido a los pasos formales, que luego se escriben uno por uno (Vlassis,
  2002). El orden importa: dividir antes de quitar la constante se diagnostica.
- **Problemas con letras:** cada problema ofrece a propósito la ecuación que suma todo lo que aparece y la que pone
  el paréntesis donde no va.

## 11. Términos semejantes y proporcionalidad (7° básico)

- **Sacos y globos:** el modelo de la balanza se extiende a los negativos: un saco pesa y un globo tira hacia arriba,
  de modo que un saco y un globo de la misma letra se anulan (par cero). Los términos semejantes nunca aparecen
  juntos, para que haya que buscarlos, y el error "3x + 2y = 5x" se diagnostica (Booth, 1984).
- **Directa, inversa… o ninguna:** junto a las directas e inversas aparecen relaciones afines (el taxi que cobra al
  subir), que crecen pero no son proporcionales, contra la "ilusión de linealidad" (Modestou y Gagatsis, 2007). La
  estrategia aditiva, el error más documentado en razonamiento proporcional (Hart, 1984), tiene su diagnóstico.
- **El gráfico como argumento:** al terminar se dibuja la recta por el origen, la curva de la inversa o la recta que
  no pasa por el origen, para "explicar las características de la gráfica" como pide el OA.
- **Interpretar la solución:** en "¿cuántas entradas como máximo?" la respuesta no es el borde de la inecuación,
  sino el mayor número natural que cumple.

## 12. De la balanza a la función (8° básico)

- **Incógnita a ambos lados:** la balanza con cajas en los dos platillos da sentido a "restar 2x en ambos lados"
  (quitar una caja de cada lado). Filloy y Rojano (1989) muestran que este es el punto donde la aritmética ya no
  alcanza y hace falta operar con la incógnita; por eso la balanza aparece justo antes del procedimiento formal.
- **Negativos y paréntesis:** en el nivel formal hay soluciones negativas y paréntesis; se diagnostican la
  distributiva incompleta y el signo al despejar.
- **¿Es función?** No se puede responder con un sí o un no al azar: si no es función hay que tocar el elemento que
  falla. Siempre hay un elemento de llegada sin flecha, porque creer que "hay que usarlos todos" es una concepción
  errónea frecuente (Vinner, 1983).
- **Función afín:** tablas con saltos de 2 o 3 obligan a calcular Δy ÷ Δx; el coeficiente de posición nunca aparece
  en la tabla, hay que retroceder hasta x = 0. La traslación muestra y = mx punteada, y el interés simple conecta con
  la vida diaria, como pide el OA 10.
- **Inecuaciones lineales:** el error característico de 8° (no invertir la desigualdad al dividir por un negativo)
  tiene su diagnóstico y su insignia, "Mundo al revés" (Tsamir y Bazzini, 2004).

## 13. Desafío, adaptatividad y motivación

- **Dos aciertos seguidos** suben un nivel; **dos errores seguidos** bajan un nivel y el siguiente ejercicio llega
  **con apoyo** (vale la mitad y no puede ser perfecto).
- **Tres estrellas** exigen 85 % de precisión, máximo una pista y llegar al nivel 4: no basta con terminar.
- **Sin vidas que expulsen:** el error cuesta puntos y racha, y se transforma en retroalimentación.
- **Sin cronómetro en 1° y 2°** (genera ansiedad, no aprendizaje).
- **Pesadas limitadas** en la caja misteriosa: predecir antes de comprobar vale más que probar números.
- **Repetir** una etapa ya dominada da pocos puntos: la motivación es subir estrellas, no acumular.

## Referencias

- Martínez, S., Varas, M. L. y otros. *Colección ReFIP Matemática: Números, Álgebra, Geometría, Datos y azar para futuros profesores de educación básica.* CMM, Universidad de Chile / Ediciones SM. <https://refip.cmmedu.uchile.cl/>
- Castro, E. y Molina, M. (2007). Desarrollo de pensamiento relacional mediante trabajo con igualdades numéricas en aritmética básica. *Educación Matemática*, 19(2).
- Falkner, K., Levi, L. y Carpenter, T. (1999). Children's understanding of equality: A foundation for algebra. *Teaching Children Mathematics*, 6(4).
- Kieran, C. (1981). Concepts associated with the equality symbol. *Educational Studies in Mathematics*, 12.
- Kieran, C. (1992). The learning and teaching of school algebra. En D. Grouws (Ed.), *Handbook of Research on Mathematics Teaching and Learning*. Macmillan.
- Vlassis, J. (2002). The balance model: hindrance or support for the solving of linear equations with one unknown. *Educational Studies in Mathematics*, 49.
- Rojano, T. (2010). Modelación concreta en álgebra: balanza virtual, ecuaciones y sistemas matemáticos de signos. *Números*, 75.
- Bojorque, G. y Gonzales, N. (2021). Patrones repetitivos en educación infantil y primaria. *INNOVA Research Journal*.
- Cetina-Vázquez, M. y Cabañas-Sánchez, G. (2022). Estrategias de generalización de patrones. *Enseñanza de las Ciencias*, 40(1).
- Briars, D. y Larkin, J. (1984). An integrated model of skill in solving elementary word problems. *Cognition and Instruction*, 1(3).
- Booth, L. (1984). *Algebra: Children's Strategies and Errors*. NFER-Nelson.
- Hart, K. (1984). *Ratio: Children's Strategies and Errors*. NFER-Nelson.
- Modestou, M. y Gagatsis, A. (2007). Students' improper proportional reasoning: a result of the epistemological obstacle of "linearity". *Educational Psychology*, 27(1).
- Filloy, E. y Rojano, T. (1989). Solving equations: the transition from arithmetic to algebra. *For the Learning of Mathematics*, 9(2).
- Vinner, S. (1983). Concept definition, concept image and the notion of function. *International Journal of Mathematical Education in Science and Technology*, 14(3).
- Tsamir, P. y Bazzini, L. (2004). Consistencies and inconsistencies in students' reasoning about inequalities. *Proceedings of the 28th Conference of the International Group for the Psychology of Mathematics Education (PME 28)*, vol. 4.
- Leinhardt, G., Zaslavsky, O. y Stein, M. K. (1990). Functions, graphs, and graphing: tasks, learning, and teaching. *Review of Educational Research*, 60(1).
- Garrote, M., Hidalgo, M. J. y Blanco, L. J. (2004). Dificultades en el aprendizaje de las desigualdades e inecuaciones. *Suma*, 46.
- MacGregor, M. y Stacey, K. (1993). Cognitive models underlying students' formulation of simple linear equations. *Journal for Research in Mathematics Education*, 24(3).
- Stacey, K. (1989). Finding and using patterns in linear generalising problems. *Educational Studies in Mathematics*, 20(2).
- Radford, L. (2008). Iconicity and contraction: a semiotic investigation of forms of algebraic generalizations of patterns in different contexts. *ZDM*, 40(1).
- Pacheco, A., Ayala-Altamirano, C. y Molina, M. (2024). Inecuaciones en libros de texto de educación primaria. *Uniciencia*, 38(1).
- Ministerio de Educación de Chile. Bases Curriculares de Matemática 1° a 6° básico (2012) y 7° básico a 2° medio (2015). <https://www.curriculumnacional.cl>
