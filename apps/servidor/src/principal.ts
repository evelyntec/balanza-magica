/**
 * Punto de entrada del servidor.
 *
 * En cPanel ("Setup Node.js App") el archivo de inicio es dist/app.cjs y
 * la configuración se define como variables de entorno (ver .env.ejemplo).
 */

import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { AlmacenMemoria, ServicioJuego, hashClave, type Almacen } from '@balanza/nucleo';
import { AlmacenMySQL } from './almacenMysql';
import { crearApp } from './app';

/** Commit con que se empaquetó el servidor (lo inyecta construir.mjs). */
declare const __BALANZA_VERSION__: string;

/** Lee un archivo .env simple si existe (cPanel también permite definirlas en el panel). */
function cargarEnv(ruta: string): void {
  if (!existsSync(ruta)) return;
  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(linea);
    if (m && process.env[m[1] as string] === undefined) process.env[m[1] as string] = (m[2] as string).replace(/^["']|["']$/g, '');
  }
}

async function iniciar(): Promise<void> {
  const base = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  cargarEnv(path.join(base, '..', '.env'));
  cargarEnv(path.join(process.cwd(), '.env'));

  const env = process.env;
  const produccion = env.NODE_ENV === 'production';
  const puerto = Number(env.PORT ?? env.PUERTO ?? 3000);

  let almacen: Almacen;
  if (env.BD_NOMBRE) {
    const mysql = new AlmacenMySQL({
      host: env.BD_HOST ?? 'localhost',
      puerto: Number(env.BD_PUERTO ?? 3306),
      usuario: env.BD_USUARIO ?? '',
      clave: env.BD_CLAVE ?? '',
      baseDeDatos: env.BD_NOMBRE,
      conexiones: Number(env.BD_CONEXIONES ?? 5),
    });
    const esquema = [path.join(base, 'esquema.sql'), path.join(base, '..', 'sql', 'esquema.sql')].find((r) => existsSync(r));
    if (esquema) await mysql.migrar(esquema);
    await mysql.mantenimiento(Date.now());
    setInterval(() => void mysql.mantenimiento(Date.now()).catch((e) => console.error('[balanza] mantenimiento', e)), 3_600_000).unref();
    almacen = mysql;
    console.log(`[balanza] MySQL listo (${env.BD_NOMBRE})`);
  } else {
    if (produccion) throw new Error('Falta configurar la base de datos (BD_NOMBRE, BD_USUARIO, BD_CLAVE).');
    almacen = new AlmacenMemoria();
    console.log('[balanza] usando almacenamiento en memoria (solo desarrollo)');
  }

  const claveDocente = env.CLAVE_DOCENTE;
  if (produccion && (!claveDocente || claveDocente.length < 10)) {
    throw new Error('CLAVE_DOCENTE debe tener al menos 10 caracteres.');
  }

  const servicio = new ServicioJuego(almacen, {
    claveDocente: claveDocente ? await hashClave(claveDocente) : null,
  });

  const estaticos = env.CARPETA_JUEGO ?? [path.join(base, 'public'), path.join(base, '..', '..', 'juego', 'dist')].find((r) => existsSync(r));
  const app = crearApp(servicio, {
    produccion,
    origenes: (env.ORIGENES ?? '').split(',').map((o) => o.trim()).filter(Boolean),
    ...(estaticos ? { estaticos } : {}),
    version: typeof __BALANZA_VERSION__ === 'string' ? __BALANZA_VERSION__ : 'desarrollo',
  });

  app.listen(puerto, () => console.log(`[balanza] servidor escuchando en el puerto ${puerto} (versión ${typeof __BALANZA_VERSION__ === 'string' ? __BALANZA_VERSION__ : 'desarrollo'})`));
}

iniciar().catch((e) => {
  console.error('[balanza] no se pudo iniciar:', e);
  process.exit(1);
});
