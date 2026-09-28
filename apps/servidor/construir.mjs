/**
 * Empaqueta el servidor en un solo archivo (dist/app.cjs) con todas sus
 * dependencias: en cPanel basta subir la carpeta dist, sin "npm install".
 */
import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Versión = commit (en GitHub Actions viene en GITHUB_SHA). Sirve para comprobar que el despliegue quedó en línea.
let version = process.env.BALANZA_VERSION ?? process.env.GITHUB_SHA ?? '';
if (!version) {
  try {
    version = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    version = 'local';
  }
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

await build({
  entryPoints: ['src/principal.ts'],
  outfile: 'dist/app.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  minify: false,
  sourcemap: false,
  legalComments: 'external',
  define: { __BALANZA_VERSION__: JSON.stringify(version.slice(0, 12)) },
  logLevel: 'warning',
});

// Archivo de inicio para cPanel (Passenger): app.js carga el paquete.
await writeFile('dist/app.js', "require('./app.cjs');\n");
await cp('sql/esquema.sql', 'dist/esquema.sql');
await cp('.env.ejemplo', 'dist/.env.ejemplo');

// Si el juego ya está compilado, se incluye en dist/public.
if (existsSync('../juego/dist/index.html')) await cp('../juego/dist', 'dist/public', { recursive: true });

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(
  'dist/package.json',
  JSON.stringify({ name: 'balanza-magica-servidor', version: pkg.version, private: true, main: 'app.cjs', scripts: { start: 'node app.cjs' }, engines: { node: '>=18' } }, null, 2),
);
console.log(`Servidor empaquetado en apps/servidor/dist (versión ${version.slice(0, 12)})`);
