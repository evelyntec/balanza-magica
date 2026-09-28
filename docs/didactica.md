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

El panel docente agrupa estos diagnósticos y sugiere una intervención para cada uno.

## 7. Desafío, adaptatividad y motivación

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
- Vlassis, J. (2002). The balance model: hindrance or support for the solving of linear equations with one unknown. *Educational Studies in Mathematics*, 49.
- Rojano, T. (2010). Modelación concreta en álgebra: balanza virtual, ecuaciones y sistemas matemáticos de signos. *Números*, 75.
- Bojorque, G. y Gonzales, N. (2021). Patrones repetitivos en educación infantil y primaria. *INNOVA Research Journal*.
- Cetina-Vázquez, M. y Cabañas-Sánchez, G. (2022). Estrategias de generalización de patrones. *Enseñanza de las Ciencias*, 40(1).
- Pacheco, A., Ayala-Altamirano, C. y Molina, M. (2024). Inecuaciones en libros de texto de educación primaria. *Uniciencia*, 38(1).
- Ministerio de Educación de Chile. Bases Curriculares de Matemática 1° a 6° básico (2012) y 7° básico a 2° medio (2015). <https://www.curriculumnacional.cl>
