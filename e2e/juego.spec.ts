/**
 * Juego completo en un navegador real (celular y computador):
 *  1. La profesora crea un curso desde el panel docente.
 *  2. Una estudiante se registra con apodo, gatito y clave de figuras.
 *  3. Juega la etapa 1-1 completa respondiendo por la interfaz y obtiene 3 estrellas.
 *  4. Se prueban trampas desde el navegador.
 */

import { expect, test, type Page, type Response } from '@playwright/test';
import type { AlmacenMemoria, ItemGuardado } from '@balanza/nucleo';
import { respuestaCorrecta } from '../packages/nucleo/test/ayudas';
import { CLAVE_DOCENTE, levantarServidor } from './servidor-prueba';

type Servidor = Awaited<ReturnType<typeof levantarServidor>>;
let srv: Servidor;

test.beforeAll(async () => {
  srv = await levantarServidor();
});

test.afterAll(async () => {
  await srv?.cerrar();
});

const capturas = (nombre: string, proyecto: string) => `test-results/capturas/${proyecto}-${nombre}.png`;

/** Registra el id del ejercicio actual leyendo las respuestas del servidor. */
function seguirItems(page: Page) {
  const estado = { itemId: '' };
  page.on('response', async (r: Response) => {
    if (!/\/api\/(etapas\/[^/]+\/iniciar|partidas\/[^/]+\/actual)$/.test(new URL(r.url()).pathname)) return;
    const cuerpo = (await r.json().catch(() => null)) as { item?: { id: string } } | null;
    if (cuerpo?.item?.id) estado.itemId = cuerpo.item.id;
  });
  return estado;
}

async function sinDesbordeHorizontal(page: Page) {
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(desborde, 'la página no debe desbordarse hacia el lado').toBeLessThanOrEqual(1);
}

/** Resuelve el ejercicio actual usando la interfaz, como lo haría una estudiante que sabe la respuesta. */
async function resolverPorInterfaz(page: Page, almacen: AlmacenMemoria, itemId: string) {
  const item = (await almacen.obtenerItem(itemId)) as ItemGuardado;
  const r = respuestaCorrecta(item.tipo, item.publico, item.secreto);
  switch (item.tipo) {
    case 'inclinacion': {
      const nombre = r === 'izquierda' ? 'Baja la izquierda' : r === 'derecha' ? 'Baja la derecha' : 'Equilibrio';
      await page.getByRole('button', { name: nombre, exact: true }).click();
      break;
    }
    case 'equilibrar': {
      const objetivo = r as number;
      const salto = (item.publico as { maxCaja: number }).maxCaja > 20 ? 10 : 5;
      for (let i = 0; i < Math.floor(objetivo / salto); i++) await page.getByRole('button', { name: `+${salto}` }).click();
      for (let i = 0; i < objetivo % salto; i++) await page.getByRole('button', { name: 'Agregar un cubo' }).click();
      await page.getByRole('button', { name: /¡Pesar!/ }).click();
      break;
    }
    case 'signo': {
      const nombre = r === '<' ? 'es menor que' : r === '>' ? 'es mayor que' : 'es igual a';
      await page.getByRole('button', { name: nombre }).click();
      break;
    }
    case 'ecuacion': {
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      await page.keyboard.type(String(r));
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'tabla100': {
      const valores = r as number[];
      if ((item.publico as { modo: string }).modo === 'continuar') {
        for (const v of valores) await page.getByRole('gridcell', { name: String(v), exact: true }).click();
      } else {
        await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
        for (let k = 0; k < valores.length; k++) {
          await page.getByRole('button', { name: new RegExp(`^Casilla por completar ${k + 1}`) }).click();
          await page.keyboard.type(String(valores[k]));
        }
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'problema': {
      const { ecuacion, valor } = r as { ecuacion: number; valor: number };
      await page.getByRole('radiogroup', { name: /ecuación cuenta la historia/ }).getByRole('radio').nth(ecuacion).click();
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      await page.keyboard.type(String(valor));
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'tabla_regla': {
      const { valores, regla } = r as { valores: number[]; regla?: string };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      if (regla) await page.getByRole('radio', { name: regla, exact: true }).click();
      const casillas = page.locator('.tabla-regla .casilla');
      for (let k = 0; k < valores.length; k++) {
        await casillas.nth(k).click();
        await page.keyboard.type(String(valores[k]));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'inecuacion': {
      const recta = page.getByRole('group', { name: /Recta numérica/ });
      await expect(recta.getByRole('button').first()).toBeEnabled();
      for (const v of r as number[]) await recta.getByRole('button', { name: String(v), exact: true }).click();
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'sucesion': {
      const { valores, regla } = r as { valores: number[]; regla?: number };
      const pub = item.publico as { modo: string; terminos: { valor: number }[]; opcionesRegla?: string[] };
      // Las figuras dibujan exactamente la cantidad de palitos o baldosas del término.
      if (pub.modo === 'figuras') {
        const dibujos = page.locator('.figura-sucesion');
        await expect(dibujos).toHaveCount(pub.terminos.length);
        for (let k = 0; k < pub.terminos.length; k++) await expect(dibujos.nth(k)).toHaveAttribute('data-elementos', String(pub.terminos[k]!.valor));
      }
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      if (regla !== undefined) await page.getByRole('radio', { name: pub.opcionesRegla![regla]!, exact: true }).click();
      for (let k = 0; k < valores.length; k++) {
        await page.locator('.piedra--hueco').nth(k).click();
        await page.keyboard.type(String(valores[k]));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'ecuacion_mult':
    case 'inecuacion_lineal':
    case 'grafico_solucion': {
      const { valor, tipo } = r as { valor: number; tipo: string };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      if (valor < 0) await page.getByRole('button', { name: /^Signo del borde/ }).click();
      await page.keyboard.type(String(Math.abs(valor)));
      const nombre = tipo === 'punto' ? 'Solo ese número' : tipo === 'izquierda' ? 'Todos los menores' : 'Todos los mayores';
      await page.getByRole('radio', { name: nombre }).click();
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'expresion': {
      const { a, b, signo, resultado } = r as { a: number; b: number; signo: string; resultado?: number };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      if (signo === '-') await page.getByRole('button', { name: /^Signo:/ }).click();
      const valores = resultado === undefined ? [a, b] : [a, b, resultado];
      const casillas = page.locator('.formula .casilla');
      for (let k = 0; k < valores.length; k++) {
        await casillas.nth(k).click();
        await page.keyboard.type(String(valores[k]));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'ecuacion_dos_pasos': {
      const { intermedio, x } = r as { intermedio?: number; x: number };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      const pub = item.publico as { b: number };
      if (intermedio === undefined) {
        // Como lo haría una estudiante: quitar y repartir en la balanza antes de responder.
        if (pub.b > 0) await page.getByRole('button', { name: /Quitar .* de cada lado/ }).click();
        await page.getByRole('button', { name: /Repartir en/ }).click();
      }
      const valores = intermedio === undefined ? [x] : [intermedio, x];
      const casillas = page.locator('.casilla:not(.casilla--formula)');
      for (let k = 0; k < valores.length; k++) {
        await casillas.nth(k).click();
        await page.keyboard.type(String(valores[k]));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'reducir': {
      const { coefs, constante } = r as { coefs: number[]; constante?: number };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      const valores = constante === undefined ? coefs : [...coefs, constante];
      const signos = page.locator('.reducida .formula__signo');
      const casillas = page.locator('.reducida .casilla');
      for (let k = 0; k < valores.length; k++) {
        if (valores[k]! < 0) await signos.nth(k).click();
        await casillas.nth(k).click();
        await page.keyboard.type(String(Math.abs(valores[k]!)));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'proporcion': {
      const { tipo, valores } = r as { tipo: string; valores: number[] };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      await page.getByRole('radio', { name: tipo === 'directa' ? 'Directa' : tipo === 'inversa' ? 'Inversa' : 'Ninguna' }).click();
      const casillas = page.locator('.proporcion .casilla');
      for (let k = 0; k < valores.length; k++) {
        await casillas.nth(k).click();
        await page.keyboard.type(String(valores[k]));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'ecuacion_ambos_lados': {
      const v = r as { k?: number; m?: number; x: number };
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      const pub = item.publico as { a: number; b: number; c: number; d: number };
      const valores = v.k === undefined ? [v.x] : [v.k, v.m!, v.x];
      if (v.k === undefined) {
        // Como en la balanza: quitar cajas de ambos lados, quitar la pesa y repartir.
        for (let i = 0; i < Math.min(pub.a, pub.c); i++) await page.getByRole('button', { name: /Quitar una .* de cada lado/ }).click();
        const pesaMas = pub.a > pub.c ? pub.b : pub.d;
        if (pesaMas > 0) await page.getByRole('button', { name: new RegExp(`Quitar ${pesaMas} de cada lado`) }).click();
        await page.getByRole('button', { name: /Repartir/ }).click();
      }
      const grupos = page.locator('.casilla-con-signo');
      for (let k = 0; k < valores.length; k++) {
        const g = grupos.nth(k);
        if (valores[k]! < 0) await g.getByRole('button', { name: /^Signo/ }).click();
        await g.locator('.casilla').click();
        await page.keyboard.type(String(Math.abs(valores[k]!)));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    case 'funcion':
    case 'afin': {
      const v = r as { esFuncion?: boolean; culpable?: number; m: number; n: number; resultado?: number };
      if (item.tipo === 'funcion') {
        await page.getByRole('radio', { name: v.esFuncion ? 'Es función' : 'No es función', exact: true }).click();
        if (!v.esFuncion) {
          const t = v.culpable! < 0 ? `−${-v.culpable!}` : String(v.culpable);
          await page.getByRole('button', { name: `Elemento ${t}`, exact: true }).click();
          await page.getByRole('button', { name: 'Revisar' }).click();
          break;
        }
      }
      await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled();
      const valores = v.resultado === undefined ? [v.m, v.n] : [v.m, v.n, v.resultado];
      const grupos = page.locator('.formula .casilla-con-signo');
      for (let k = 0; k < valores.length; k++) {
        const g = grupos.nth(k);
        if (valores[k]! < 0) await g.getByRole('button', { name: /^Signo/ }).click();
        await g.locator('.casilla').click();
        await page.keyboard.type(String(Math.abs(valores[k]!)));
      }
      await page.getByRole('button', { name: 'Revisar' }).click();
      break;
    }
    default:
      throw new Error(`tipo no cubierto en e2e: ${item.tipo}`);
  }
}

test('recorrido completo: docente crea curso, estudiante se registra y supera la etapa 1-1', async ({ page, browser }, info) => {
  const proyecto = info.project.name;

  // --- Docente --------------------------------------------------------------
  await page.goto(`${srv.url}/#/docente`);
  await page.getByLabel('Clave docente').fill(CLAVE_DOCENTE);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByLabel('Nombre del curso').fill(`1° A ${proyecto}`);
  await page.getByRole('button', { name: '+ Crear curso' }).click();
  const codigo = (await page.locator('.codigo-curso').textContent())?.trim() ?? '';
  expect(codigo).toMatch(/^[A-Z2-9]{6}$/);
  await page.screenshot({ path: capturas('docente', proyecto), fullPage: true });

  // --- Estudiante (otro navegador, sin la sesión docente) -------------------
  const contexto = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
  const alumna = await contexto.newPage();
  const errores: string[] = [];
  alumna.on('pageerror', (e) => errores.push(e.message));
  const seguimiento = seguirItems(alumna);

  await alumna.goto(srv.url);
  await alumna.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await alumna.getByLabel('Código del curso').fill(codigo);
  await alumna.getByRole('button', { name: 'Continuar' }).click();
  await alumna.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await alumna.getByLabel('Apodo').fill('Colibrí Estelar 7');
  await alumna.getByRole('button', { name: 'Continuar' }).click();
  await alumna.getByRole('radio', { name: 'Gatita violeta' }).click();
  await alumna.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['zorro', 'pez', 'búho']) await alumna.getByRole('button', { name: f, exact: true }).click();
  await alumna.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['zorro', 'pez', 'búho']) await alumna.getByRole('button', { name: f, exact: true }).click();
  await alumna.getByRole('button', { name: /Crear mi gatito/ }).click();

  await expect(alumna.getByText('El Reino del Equilibrio')).toBeVisible();
  await sinDesbordeHorizontal(alumna);
  await alumna.screenshot({ path: capturas('mapa', proyecto), fullPage: true });

  // Solo la isla 1 está abierta para 1° básico.
  await expect(alumna.getByRole('button', { name: /Bosque de los Signos.*bloqueada/ })).toBeDisabled();
  await alumna.getByRole('button', { name: /Pradera de las Frutas/ }).click();
  await expect(alumna.getByRole('button', { name: /A equilibrar.*bloqueada/ })).toBeDisabled();
  await alumna.getByRole('button', { name: /Hacia dónde baja/ }).click();

  // --- Jugar la etapa entera por la interfaz ----------------------------------
  let vueltas = 0;
  while (vueltas++ < 30) {
    await expect(alumna.locator('.juego__consigna')).toBeVisible();
    await expect.poll(() => seguimiento.itemId).not.toBe('');
    const id = seguimiento.itemId;
    await resolverPorInterfaz(alumna, srv.almacen, id);
    const continuar = alumna.getByRole('button', { name: /Continuar →|Ver resultado →/ });
    await expect(continuar).toBeVisible();
    if (vueltas === 1) {
      await sinDesbordeHorizontal(alumna);
      await alumna.screenshot({ path: capturas('retroalimentacion', proyecto) });
    }
    const texto = await continuar.textContent();
    await continuar.click();
    if (texto?.includes('Ver resultado')) break;
    await expect.poll(() => seguimiento.itemId, { timeout: 10_000 }).not.toBe(id);
  }

  await expect(alumna.getByText('¡Etapa superada!')).toBeVisible();
  await expect(alumna.getByLabel('3 de 3 estrellas').first()).toBeVisible();
  await alumna.screenshot({ path: capturas('resultado', proyecto), fullPage: true });

  // La etapa 2 quedó desbloqueada y los puntos aparecen en el panel docente.
  await alumna.getByRole('button', { name: 'Volver a la isla' }).click();
  await expect(alumna.getByRole('button', { name: /A equilibrar/ })).toBeEnabled();
  await page.reload();
  await page.getByRole('button', { name: new RegExp(`1° A ${proyecto}`) }).click();
  await expect(page.getByRole('cell', { name: /Colibrí Estelar 7/ })).toBeVisible();

  expect(errores).toEqual([]);
  await contexto.close();
});

test('trampas desde el navegador', async ({ page }, info) => {
  const curso = await srv.servicio.crearCurso({ nombre: `Trampas ${info.project.name}`, nivel: 2 });
  const seguimiento = seguirItems(page);
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Pudú Astuto 99');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['oso', 'oso', 'gato']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['oso', 'oso', 'gato']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  // 1. Pedir sin la cabecera propia (como haría otro sitio o un script casero) → 403.
  const sinCabecera = await page.evaluate(async () => (await fetch('/api/pestana', { method: 'POST' })).status);
  expect(sinCabecera).toBe(403);

  // 2. Inyectar puntos en una respuesta: el servidor los ignora.
  await page.getByRole('button', { name: /Bosque de los Signos/ }).click();
  await page.getByRole('button', { name: /El signo que falta/ }).click();
  await expect.poll(() => seguimiento.itemId).not.toBe('');
  await page.route('**/api/items/*/responder', async (ruta) => {
    const cuerpo = JSON.parse(ruta.request().postData() ?? '{}');
    await ruta.continue({ postData: JSON.stringify({ ...cuerpo, puntos: 99999, monedas: 99999, resultado: 'perfecto' }) });
  });
  await resolverPorInterfaz(page, srv.almacen, seguimiento.itemId);
  await expect(page.getByText(/\+\d+ ⭐/)).toBeVisible();
  const yo = await page.evaluate(async () => (await fetch('/api/yo')).json());
  expect(yo.puntos).toBeLessThanOrEqual(50);
  expect(yo.monedas).toBeLessThanOrEqual(12); // 2 del ejercicio + 10 de la insignia «Primer equilibrio»

  // 3. Repetir la misma respuesta (reenviar la petición) → rechazada.
  const repetida = await page.evaluate(
    async (id) =>
      (
        await fetch(`/api/items/${id}/responder`, {
          method: 'POST',
          headers: { 'x-balanza': '1', 'content-type': 'application/json', 'x-pestana': 'inventada' },
          body: JSON.stringify({ respuesta: '=' }),
        })
      ).status,
    seguimiento.itemId,
  );
  expect([409]).toContain(repetida);

  // 4. Abrir el juego en otra pestaña: esta queda bloqueada hasta "Jugar aquí".
  const otra = await page.context().newPage();
  await otra.goto(srv.url);
  await expect(otra.getByText('El Reino del Equilibrio')).toBeVisible();
  await page.getByRole('button', { name: /Continuar →/ }).click();
  await expect(page.getByText('¡El juego se abrió en otra ventana!')).toBeVisible();
  await page.screenshot({ path: capturas('otra-pestana', info.project.name) });
  await page.getByRole('button', { name: 'Jugar aquí' }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();
});

test('isla 3: ecuaciones, pesas hasta 100, tabla del 100 y cuentos por la interfaz', async ({ page }, info) => {
  const proyecto = info.project.name;
  const curso = await srv.servicio.crearCurso({ nombre: `4° ${proyecto}`, nivel: 4 });
  const seguimiento = seguirItems(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Huemul Sabio 40');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  for (const etapa of ['La caja misteriosa', 'Pesas del río', 'La tabla del 100', 'Cuentos con cajas']) {
    await page.getByRole('button', { name: /Río de las Cajas Misteriosas/ }).click();
    seguimiento.itemId = '';
    await page.getByRole('button', { name: new RegExp(etapa) }).click();
    for (let n = 0; n < 3; n++) {
      await expect.poll(() => seguimiento.itemId).not.toBe('');
      const id = seguimiento.itemId;
      await resolverPorInterfaz(page, srv.almacen, id);
      const continuar = page.getByRole('button', { name: /Continuar →/ });
      await expect(continuar).toBeVisible();
      await expect(page.locator('.retro__titulo')).toHaveText(/Perfecto|Muy bien/);
      if (n === 0) {
        await sinDesbordeHorizontal(page);
        await page.screenshot({ path: capturas(`isla3-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await continuar.click();
      await expect.poll(() => seguimiento.itemId).not.toBe(id);
    }
    await page.getByRole('button', { name: 'Salir de la etapa' }).click();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
  }
  expect(errores).toEqual([]);
});

test('isla 4: tablas con regla, ecuaciones, inecuaciones y cuentos por la interfaz', async ({ page }, info) => {
  const proyecto = info.project.name;
  const curso = await srv.servicio.crearCurso({ nombre: `5° ${proyecto}`, nivel: 5 });
  const seguimiento = seguirItems(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Cóndor Andino 50');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  for (const etapa of ['La máquina de reglas', 'Ecuaciones de la cumbre', 'La balanza inclinada', 'Cuentos de la cumbre']) {
    await page.getByRole('button', { name: /Montaña de las Tablas/ }).click();
    seguimiento.itemId = '';
    await page.getByRole('button', { name: new RegExp(etapa) }).click();
    for (let n = 0; n < 3; n++) {
      await expect.poll(() => seguimiento.itemId).not.toBe('');
      const id = seguimiento.itemId;
      if (n === 0) {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: capturas(`isla4-antes-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await resolverPorInterfaz(page, srv.almacen, id);
      const continuar = page.getByRole('button', { name: /Continuar →/ });
      await expect(continuar).toBeVisible();
      await expect(page.locator('.retro__titulo')).toHaveText(/Perfecto|Muy bien/);
      if (n === 0) {
        await sinDesbordeHorizontal(page);
        await page.screenshot({ path: capturas(`isla4-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await continuar.click();
      await expect.poll(() => seguimiento.itemId).not.toBe(id);
    }
    await page.getByRole('button', { name: 'Salir de la etapa' }).click();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
  }
  expect(errores).toEqual([]);
});

test('isla 5: sucesiones, figuras de palitos, gráficos de soluciones y problemas por la interfaz', async ({ page }, info) => {
  const proyecto = info.project.name;
  const curso = await srv.servicio.crearCurso({ nombre: `6° ${proyecto}`, nivel: 6 });
  const seguimiento = seguirItems(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Zorro Culpeo 60');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  for (const etapa of ['Huellas en la arena', 'Torres de palitos', 'Espejismos', 'La caravana']) {
    await page.getByRole('button', { name: /Desierto de las Desigualdades/ }).click();
    seguimiento.itemId = '';
    await page.getByRole('button', { name: new RegExp(etapa) }).click();
    for (let n = 0; n < 3; n++) {
      await expect.poll(() => seguimiento.itemId).not.toBe('');
      const id = seguimiento.itemId;
      if (n === 0) {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: capturas(`isla5-antes-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await resolverPorInterfaz(page, srv.almacen, id);
      const continuar = page.getByRole('button', { name: /Continuar →/ });
      await expect(continuar).toBeVisible();
      await expect(page.locator('.retro__titulo')).toHaveText(/Perfecto|Muy bien/);
      if (n === 0) {
        await sinDesbordeHorizontal(page);
        await page.screenshot({ path: capturas(`isla5-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await continuar.click();
      await expect.poll(() => seguimiento.itemId).not.toBe(id);
    }
    await page.getByRole('button', { name: 'Salir de la etapa' }).click();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
  }
  expect(errores).toEqual([]);
});

test('isla 6: fórmulas con letras, balanza de ecuaciones y problemas por la interfaz', async ({ page }, info) => {
  const proyecto = info.project.name;
  const curso = await srv.servicio.crearCurso({ nombre: `7° ${proyecto}`, nivel: 7 });
  const seguimiento = seguirItems(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Pudú Veloz 70');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  for (const etapa of ['La fábrica de fórmulas', 'Letras que generalizan', 'Balanza de las fórmulas', 'Problemas con letras']) {
    await page.getByRole('button', { name: /Ciudad de las Fórmulas/ }).click();
    seguimiento.itemId = '';
    await page.getByRole('button', { name: new RegExp(etapa) }).click();
    for (let n = 0; n < 3; n++) {
      await expect.poll(() => seguimiento.itemId).not.toBe('');
      const id = seguimiento.itemId;
      if (n === 0) {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: capturas(`isla6-antes-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await resolverPorInterfaz(page, srv.almacen, id);
      const continuar = page.getByRole('button', { name: /Continuar →/ });
      await expect(continuar).toBeVisible();
      await expect(page.locator('.retro__titulo')).toHaveText(/Perfecto|Muy bien/);
      if (n === 0) {
        await sinDesbordeHorizontal(page);
        await page.screenshot({ path: capturas(`isla6-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await continuar.click();
      await expect.poll(() => seguimiento.itemId).not.toBe(id);
    }
    await page.getByRole('button', { name: 'Salir de la etapa' }).click();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
  }
  expect(errores).toEqual([]);
});

test('isla 7: términos semejantes, proporciones, ecuaciones de lava y problemas por la interfaz', async ({ page }, info) => {
  const proyecto = info.project.name;
  const curso = await srv.servicio.crearCurso({ nombre: `8° ${proyecto}`, nivel: 8 });
  const seguimiento = seguirItems(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Puma Andino 80');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  for (const etapa of ['Globos y sacos', 'Ríos proporcionales', 'Ecuaciones de lava', 'Problemas del volcán']) {
    await page.getByRole('button', { name: /Volcán de los Globos/ }).click();
    seguimiento.itemId = '';
    await page.getByRole('button', { name: new RegExp(etapa) }).click();
    for (let n = 0; n < 3; n++) {
      await expect.poll(() => seguimiento.itemId).not.toBe('');
      const id = seguimiento.itemId;
      if (n === 0) {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: capturas(`isla7-antes-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await resolverPorInterfaz(page, srv.almacen, id);
      const continuar = page.getByRole('button', { name: /Continuar →/ });
      await expect(continuar).toBeVisible();
      await expect(page.locator('.retro__titulo')).toHaveText(/Perfecto|Muy bien/);
      if (n === 0) {
        await sinDesbordeHorizontal(page);
        await page.screenshot({ path: capturas(`isla7-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await continuar.click();
      await expect.poll(() => seguimiento.itemId).not.toBe(id);
    }
    await page.getByRole('button', { name: 'Salir de la etapa' }).click();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
  }
  expect(errores).toEqual([]);
});

test('isla 8: ambos lados, funciones, rectas e inecuaciones por la interfaz', async ({ page }, info) => {
  const proyecto = info.project.name;
  const curso = await srv.servicio.crearCurso({ nombre: `8°B ${proyecto}`, nivel: 8 });
  const seguimiento = seguirItems(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(srv.url);
  await page.getByRole('button', { name: /Entrar con mi curso/ }).click();
  await page.getByLabel('Código del curso').fill(curso.codigo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: /Soy nueva o nuevo/ }).click();
  await page.getByLabel('Apodo').fill('Chinchilla Real 88');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (const f of ['pez', 'pato', 'oso']) await page.getByRole('button', { name: f, exact: true }).click();
  await page.getByRole('button', { name: /Crear mi gatito/ }).click();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();
  // La isla 8 es la del propio curso: sus etapas se abren en orden. Para probar todas, se marcan como superadas.
  const [jugador] = await srv.almacen.listarJugadores(curso.id);
  const superada = { estrellas: 1, mejorPuntaje: 1, superada: true, veces: 1, nivelMax: 1 };
  await srv.almacen.actualizarJugador({ ...jugador!, progreso: { ...jugador!.progreso, '8-1': superada, '8-2': superada, '8-3': superada } });
  await page.reload();
  await expect(page.getByText('El Reino del Equilibrio')).toBeVisible();

  for (const etapa of ['Balanzas de doble carga', 'La máquina de funciones', 'Rectas del castillo', 'Desigualdades del rey']) {
    await page.getByRole('button', { name: /Castillo del Desequilibrio/ }).click();
    seguimiento.itemId = '';
    await page.getByRole('button', { name: new RegExp(etapa) }).click();
    for (let n = 0; n < 3; n++) {
      await expect.poll(() => seguimiento.itemId).not.toBe('');
      const id = seguimiento.itemId;
      if (n === 0) {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: capturas(`isla8-antes-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await resolverPorInterfaz(page, srv.almacen, id);
      const continuar = page.getByRole('button', { name: /Continuar →/ });
      await expect(continuar).toBeVisible();
      await expect(page.locator('.retro__titulo')).toHaveText(/Perfecto|Muy bien/);
      if (n === 0) {
        await sinDesbordeHorizontal(page);
        await page.screenshot({ path: capturas(`isla8-${etapa.replace(/\s/g, '-')}`, proyecto) });
      }
      await continuar.click();
      await expect.poll(() => seguimiento.itemId).not.toBe(id);
    }
    await page.getByRole('button', { name: 'Salir de la etapa' }).click();
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
  }
  expect(errores).toEqual([]);
});
