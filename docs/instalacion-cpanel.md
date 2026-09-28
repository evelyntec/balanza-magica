# Instalación en el hosting (V2Networks / cPanel)

Resultado final: el juego en **https://balanza.profesoraevelyn.com**, separado de tu sitio principal.
Tu plan ya incluye todo lo necesario: *Setup Node.js App*, bases de datos MySQL y subdominios.

## 1. Preparar los archivos (en tu computador)

```bash
npm install
npm run build
```

Se crea la carpeta **`apps/servidor/dist`** con:

| Archivo | Qué es |
|---|---|
| `app.js` / `app.cjs` | El servidor completo en un archivo (no necesita `npm install`) |
| `public/` | El juego compilado |
| `esquema.sql` | Las tablas (el servidor las crea solo) |
| `package.json`, `.env.ejemplo` | Datos de la aplicación y ejemplo de configuración |

Comprime el **contenido** de `dist` en un `.zip`.

## 2. Crear el subdominio

cPanel → **Dominios** (o *Subdominios*) → crear `balanza.profesoraevelyn.com`.

## 3. Crear la base de datos

cPanel → **Database Wizard**:

1. Base de datos: `balanza` (cPanel le agrega tu prefijo, por ejemplo `tuusuario_balanza`).
2. Usuario: `balanza` con una clave larga (usa el generador).
3. Privilegios: **ALL PRIVILEGES**.

Anota el nombre completo de la base, del usuario y la clave.

## 4. Subir los archivos

cPanel → **Administrador de archivos**:

1. En tu carpeta personal (fuera de `public_html`), crea la carpeta `balanza-app`.
2. Sube el `.zip` y usa **Extraer**. Debe quedar `balanza-app/app.js`, `balanza-app/public/…`, etc.

## 5. Crear la aplicación Node.js

cPanel → **Setup Node.js App** → **Create Application**:

| Campo | Valor |
|---|---|
| Node.js version | La más alta disponible (18 o superior) |
| Application mode | Production |
| Application root | `balanza-app` |
| Application URL | `balanza.profesoraevelyn.com` |
| Application startup file | `app.js` |

En **Environment variables** agrega:

| Nombre | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `BD_HOST` | `localhost` |
| `BD_NOMBRE` | `tuusuario_balanza` |
| `BD_USUARIO` | `tuusuario_balanza` |
| `BD_CLAVE` | la clave de la base de datos |
| `CLAVE_DOCENTE` | tu clave para el panel docente (mínimo 10 caracteres) |
| `ORIGENES` | `https://balanza.profesoraevelyn.com` |

Presiona **Create** y luego **Restart**. No hace falta *Run NPM Install*: todo viene en `app.cjs`.

## 6. Activar HTTPS

cPanel → **SSL/TLS Status** → marca el subdominio → **Run AutoSSL**. La cookie de sesión exige HTTPS.

## 7. Comprobar

- `https://balanza.profesoraevelyn.com/api/salud` debe mostrar `{"ok":true,…}`.
- `https://balanza.profesoraevelyn.com/#/docente` abre el panel docente: crea tu curso y proyecta el código.
- Tus estudiantes entran a `https://balanza.profesoraevelyn.com` → *Entrar con mi curso*.

## Actualizar a una nueva versión

**Automático (recomendado):** configura una vez el despliegue desde GitHub siguiendo [despliegue.md](despliegue.md).
Desde entonces, cada cambio en `main` que pase las pruebas se publica solo, y los viernes te llega el reporte semanal.

**A mano:**

1. `npm run build` en tu computador.
2. Sube y extrae el nuevo `dist` sobre `balanza-app` (los datos están en MySQL, no se pierden).
3. *Setup Node.js App* → **Restart**.

## Si algo falla

- *Setup Node.js App* muestra la ruta del registro de errores: busca líneas con `[balanza]`.
- "Falta configurar la base de datos": revisa `BD_NOMBRE`, `BD_USUARIO` y `BD_CLAVE` (con el prefijo de cPanel).
- "CLAVE_DOCENTE debe tener al menos 10 caracteres": alarga la clave.
- El soporte de V2Networks responde por chat.

## Capacidad

El plan tiene 20 procesos de entrada simultáneos. Cada respuesta se procesa en milisegundos y las imágenes
son SVG dentro del propio juego, así que un curso de 40 estudiantes jugando a la vez funciona bien.
Para un colegio completo en simultáneo conviene un plan con más recursos.
