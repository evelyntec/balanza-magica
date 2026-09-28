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
