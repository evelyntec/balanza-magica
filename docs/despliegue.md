# Despliegue automático y reporte semanal

Una vez configurado, ya no se sube nada a mano:

```
git push a main ──► GitHub corre las pruebas ──► si pasan, compila y sube al hosting ──► reinicia la app ──► comprueba que la versión nueva está en línea
                                    │
cada viernes en la tarde ───────────┴──► descarga el registro del panel docente ──► te envía el reporte semanal por correo
```

- **`.github/workflows/desplegar.yml`**: se activa cuando el flujo *Pruebas* termina bien en `main` (o a mano).
  Nunca despliega una versión con pruebas fallidas.
- **`.github/workflows/reporte-semanal.yml`**: todos los viernes a las 18:47 (17:47 en horario de invierno), o a mano.

Mientras no configures los secretos, ambos flujos terminan sin hacer nada y sin marcar error.

> **Requisito previo:** la aplicación ya debe existir en el hosting (subdominio, base de datos, *Setup Node.js App*
> y certificado SSL). Sigue los pasos 2, 3, 5 y 6 de [instalacion-cpanel.md](instalacion-cpanel.md). El paso 4 (subir el
> `.zip`) ya no es necesario: lo hace el despliegue automático.

---

## 1. Elegir cómo se conecta GitHub con el hosting

### Opción A (recomendada): SSH

1. cPanel → **Acceso SSH** (*SSH Access*) → **Administrar claves SSH** → **Generar una nueva clave**.
   - Nombre: `github-balanza`
   - Tipo: **RSA**, tamaño **4096**
   - Contraseña: puedes dejarla en blanco. Si cPanel exige una, escríbela y guárdala también en GitHub como
     secreto `SSH_FRASE` (el despliegue la usa sin mostrarla).
2. En la lista de claves públicas, junto a `github-balanza`, presiona **Administrar** → **Autorizar**.
3. En la lista de claves privadas, presiona **Ver/Descargar** y copia todo el texto
   (desde `-----BEGIN` hasta `-----END ... KEY-----`). Ese texto es el secreto `SSH_CLAVE_PRIVADA`.
4. Anota:
   - **Servidor** (`SSH_HOST`): el nombre que aparece en cPanel → *Información del servidor* (o `profesoraevelyn.com`).
   - **Usuario** (`SSH_USUARIO`): tu usuario de cPanel.
   - **Puerto** (`SSH_PUERTO`): normalmente 22. Algunos hostings usan otro; el soporte de V2Networks lo confirma.
   - **Carpeta de la app** (`RUTA_APP`): `/home/TU_USUARIO/balanza-app` (la *Application root* de Setup Node.js App).

Si **Acceso SSH** no aparece en tu cPanel, pídele al soporte de V2Networks que lo active (el plan Corporativo suele
incluirlo) o usa la opción B.

### Opción B: FTP seguro (si no hay SSH)

1. cPanel → **Cuentas FTP** → crear:
   - Usuario: `despliegue` (queda `despliegue@profesoraevelyn.com`)
   - Directorio: **`balanza-app`** (solo esa carpeta; si la clave se filtrara, no alcanza el resto del sitio)
2. Anota:
   - `FTP_HOST`: el nombre del servidor de *Información del servidor* (así el certificado es válido).
   - `FTP_USUARIO`: `despliegue@profesoraevelyn.com`
   - `FTP_CLAVE`: la clave de esa cuenta
   - `FTP_RUTA`: `/` (la raíz de esa cuenta ya es `balanza-app`)

## 2. Guardar los secretos en GitHub

GitHub → repositorio **balanza-magica** → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**. Crea uno por fila (los nombres deben ser exactos):

| Secreto | Ejemplo | Para qué |
|---|---|---|
| `BALANZA_URL` | `https://balanza.profesoraevelyn.com` | Comprobar el despliegue y generar el reporte |
| `SSH_HOST` | `profesoraevelyn.com` | Opción A |
| `SSH_USUARIO` | `tuusuario` | Opción A |
| `SSH_PUERTO` | `22` | Opción A (opcional si es 22) |
| `SSH_CLAVE_PRIVADA` | `-----BEGIN RSA PRIVATE KEY----- …` | Opción A |
| `SSH_FRASE` | la contraseña de la clave | Opción A, solo si cPanel exigió una |
| `RUTA_APP` | `/home/tuusuario/balanza-app` | Opción A |
| `FTP_HOST`, `FTP_USUARIO`, `FTP_CLAVE`, `FTP_RUTA` | ver arriba | Solo si usas la opción B |

Los secretos quedan cifrados: nadie puede volver a leerlos, ni siquiera tú (solo reemplazarlos).

## 3. Probar el despliegue

GitHub → **Actions** → **Desplegar** → **Run workflow**. En unos 3 minutos debe terminar en verde con el mensaje
"✅ En línea: versión …". Puedes confirmarlo abriendo `https://balanza.profesoraevelyn.com/api/salud`: la
`version` corresponde al último commit.

Desde entonces, cada `git push` a `main` que pase las pruebas se publica solo.

**Si falla:**
- *Permission denied (publickey)*: falta **Autorizar** la clave en cPanel o el usuario o el puerto no coinciden.
- *No respondió con la versión…*: la app no arrancó. Revisa el registro de errores en *Setup Node.js App*
  (líneas con `[balanza]`); lo más común es una variable de entorno de la base de datos.
- FTP *certificate verification failed*: usa en `FTP_HOST` el nombre del servidor, no tu dominio.

Qué no toca nunca el despliegue: el archivo `.env` (si lo usas), la carpeta `tmp/`, los registros y `node_modules`.
Los datos de tus estudiantes están en MySQL, así que ninguna actualización los borra.

---

## 4. Reporte semanal por correo

### Crear la cuenta que envía el correo

1. cPanel → **Cuentas de correo** → crear `reportes@profesoraevelyn.com` con una clave larga.
2. Junto a la cuenta → **Conectar dispositivos**: anota el servidor de **salida (SMTP)**, normalmente
   `mail.profesoraevelyn.com`, puerto **465** (SSL).
3. cPanel → **Capacidad de entrega de correo** (*Email Deliverability*): si SPF o DKIM aparecen con problemas,
   presiona **Reparar**. Así el reporte no llega a spam.

### Secretos del reporte

| Secreto | Ejemplo |
|---|---|
| `BALANZA_URL` | (el mismo del despliegue) |
| `CLAVE_DOCENTE` | la misma clave del panel docente (variable `CLAVE_DOCENTE` de la app) |
| `SMTP_HOST` | `mail.profesoraevelyn.com` |
| `SMTP_PUERTO` | `465` |
| `SMTP_USUARIO` | `reportes@profesoraevelyn.com` |
| `SMTP_CLAVE` | la clave de esa cuenta de correo |
| `CORREO_DESTINO` | tu correo (puedes poner varios separados por coma, por ejemplo el de UTP) |
| `CORREO_REMITENTE` | opcional; por defecto, `SMTP_USUARIO` |

### Probarlo

GitHub → **Actions** → **Reporte semanal** → **Run workflow**. La primera vez revisa también la carpeta de spam y
marca el correo como "no es spam".

### Qué trae el correo

Por cada curso:
- cuántos estudiantes jugaron, cuántos desafíos resolvieron y el porcentaje de logro;
- quiénes **necesitan apoyo** (menos de 60 % de logro con al menos 5 desafíos en la semana) y quiénes están listos para desafíos mayores;
- los **3 errores típicos más frecuentes**, cada uno con una **sugerencia para la clase** (las mismas del panel docente);
- las etapas más jugadas y quiénes no jugaron esa semana.

Adjunto va el informe completo de la semana, con gráficos. Solo se usan apodos: el correo no contiene datos personales.

También se puede generar sin servidor ni correo, para mirarlo antes:

```bash
cd herramientas/analisis
python reporte_semanal.py --csv datos_ejemplo.csv --salida reporte/ --ahora 2026-10-31
```

---

## Seguridad

- La clave SSH (o la cuenta FTP limitada a `balanza-app`) sirve **solo** para desplegar. Si sospechas que se filtró,
  bórrala en cPanel y crea otra: el sitio sigue funcionando.
- Opcional, más estricto: guarda en `SSH_HOSTS_CONOCIDOS` la huella del servidor (resultado de
  `ssh-keyscan -p PUERTO SERVIDOR`). Sin ese secreto, GitHub confía en la huella que recibe en cada conexión.
- La clave docente se usa solo para leer el registro, por una conexión HTTPS, y nunca aparece en los registros de GitHub.
- Si el repositorio pasa a ser público y queda 60 días sin cambios, GitHub pausa los flujos programados; se reactivan
  con un clic en **Actions**.
