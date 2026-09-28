# Seguridad, antitrampas y privacidad

## Principio: el servidor es la única autoridad

El navegador envía **acciones** ("elegí =", "pesé con 7 cubos", "pedí una pista"). El servidor valida cada acción,
calcula resultado, puntos, monedas, racha, nivel e insignias, y responde. No existe ninguna ruta que acepte puntos.

## Ciclo de un ejercicio

1. El servidor genera el ejercicio con una **semilla aleatoria criptográfica** y guarda la parte pública y la secreta.
2. El navegador recibe solo la parte pública. En "completar la caja", el valor de la caja nunca sale del servidor:
   cada pesada responde solo *hacia dónde* y *cuánto aproximadamente* (poco, medio, mucho) se inclina.
3. Cada acción se procesa en una **transacción** que bloquea la fila del jugador (`SELECT … FOR UPDATE` en InnoDB)
   y compara versiones: dos peticiones simultáneas no pueden cobrar dos veces, aunque el hosting ejecute varios procesos.
4. El ejercicio pendiente se **reanuda idéntico** al recargar. Abandonar cuenta como no logrado.

## Controles

| Control | Dónde |
|---|---|
| Respuesta con formato estricto (tipos, largo, rangos) | `validarRespuesta` de cada mecánica |
| Una respuesta por ejercicio (dos en los de escribir), 4 pesadas, 3 pistas | `ServicioJuego` |
| Tiempo mínimo de lectura (700 ms) y entre acciones (300 ms) | `ServicioJuego.verificarTiempo` |
| Límite de ritmo por estudiante y por IP | `Limitador` (cubeta de fichas) |
| Una pestaña activa | `tomarPestana` + cabecera `x-pestana` |
| Repetir etapas dominadas da pocos puntos | `factorRepeticion` |
| Sesiones: token aleatorio de 256 bits; en la base solo se guarda su SHA-256 | `seguridad.ts` |
| Cookie `HttpOnly`, `Secure`, `SameSite=Strict`, 12 horas | `app.ts` |
| CSRF: cabecera `x-balanza: 1` obligatoria y origen permitido | `app.ts` |
| Clave de figuras con PBKDF2-SHA256 (120 000 iteraciones) y comparación en tiempo constante | `seguridad.ts` |
| Bloqueo de 10 minutos tras 5 intentos fallidos de ingreso | `ingresarAlumno` |
| Cabeceras: CSP estricta, `frame-ancestors 'none'`, HSTS, `nosniff`, sin `x-powered-by` | Helmet |
| Consultas SQL siempre parametrizadas | `almacenMysql.ts` |
| CSV sin inyección de fórmulas (celdas que empiezan con `=`, `+`, `-`, `@`) | `eventosCSV` |
| Cuerpos JSON de máximo 8 KB | Express |

Todas estas reglas tienen pruebas en `packages/nucleo/test/servicio.test.ts`, `apps/servidor/test/` y `e2e/`.

## Límite honesto

El **modo práctica** (demo sin servidor) ejecuta el servicio dentro del navegador: alguien con conocimientos
técnicos podría leer las respuestas en la memoria del navegador. Por eso sus puntos no se comparan con nadie.
El **modo clase** es el que ofrece puntajes y ranking confiables.

## Privacidad de estudiantes (menores de edad)

- Se guarda solo **apodo, gatito elegido y hash de la clave de figuras**. El juego sugiere apodos que no revelan identidad.
- Filtro básico de apodos ofensivos.
- Nada de nombres, RUT, correos, fotos ni ubicación. Sin analítica de terceros ni publicidad.
- La docente puede **eliminar a un estudiante y todos sus datos** (borrado en cascada).
- Los ejercicios detallados se eliminan a los 90 días; queda solo el registro resumido para el análisis pedagógico.
