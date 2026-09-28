/**
 * Pruebas HTTP de la API (Express) con almacenamiento en memoria.
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenMemoria, Limitador, ServicioJuego, hashClave, type ItemGuardado } from '@balanza/nucleo';
import { crearApp } from '../src/app';
import { respuestaCorrecta } from '../../../packages/nucleo/test/ayudas';

const CLAVE = ['zorro', 'pez', 'gato'];

async function preparar() {
  const almacen = new AlmacenMemoria();
  let t = Date.UTC(2026, 8, 28, 14);
  const reloj = () => t;
  const avanzar = (ms = 2000) => {
    t += ms;
  };
  const servicio = new ServicioJuego(almacen, {
    reloj,
    iteracionesClave: 1000,
    claveDocente: await hashClave('docente-secreto-123', undefined, 1000),
    limitador: new Limitador({ capacidad: 1e6, recargaPorSegundo: 1e6 }),
  });
  const app = crearApp(servicio, { produccion: false, origenes: ['https://balanza.profesoraevelyn.com'], reloj });
  const curso = await servicio.crearCurso({ nombre: '1° B', nivel: 1 });
  return { almacen, servicio, app, curso, avanzar };
}

let t: Awaited<ReturnType<typeof preparar>>;
beforeEach(async () => {
  t = await preparar();
});

const H = { 'x-balanza': '1', 'content-type': 'application/json' };

async function registrar(apodo = 'Cóndor Mágico 12') {
  const agente = request.agent(t.app);
  const r = await agente.post('/api/alumnos/registro').set(H).send({ codigoCurso: t.curso.codigo, apodo, avatar: 'gatita-violeta', clave: CLAVE });
  expect(r.status).toBe(200);
  const p = await agente.post('/api/pestana').set(H).send({});
  return { agente, perfil: r.body.perfil, pestana: p.body.pestana as string, cookie: r.headers['set-cookie'] };
}

describe('seguridad HTTP', () => {
  it('cabeceras de seguridad y sin x-powered-by', async () => {
    const r = await request(t.app).get('/api/salud');
    expect(r.status).toBe(200);
    expect(r.headers['x-powered-by']).toBeUndefined();
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['cache-control']).toBe('no-store');
    // El despliegue automático compara esta versión con el commit publicado.
    expect(r.body).toMatchObject({ ok: true, version: 'desarrollo' });
  });

  it('CSRF: sin la cabecera propia o desde otro sitio se rechaza', async () => {
    const sin = await request(t.app).post('/api/alumnos/ingreso').send({});
    expect(sin.status).toBe(403);
    const otro = await request(t.app).post('/api/alumnos/ingreso').set(H).set('origin', 'https://sitio-malicioso.com').send({});
    expect(otro.status).toBe(403);
    const permitido = await request(t.app).post('/api/alumnos/ingreso').set(H).set('origin', 'https://balanza.profesoraevelyn.com').send({});
    expect(permitido.status).not.toBe(403);
  });

  it('la cookie de sesión es HttpOnly y SameSite=Strict', async () => {
    const { cookie } = await registrar();
    const texto = String(cookie);
    expect(texto).toContain('HttpOnly');
    expect(texto).toContain('SameSite=Strict');
  });

  it('JSON inválido o demasiado grande se rechaza con 400', async () => {
    const malo = await request(t.app).post('/api/alumnos/ingreso').set('x-balanza', '1').set('content-type', 'application/json').send('{no es json');
    expect(malo.status).toBe(400);
    const grande = await request(t.app).post('/api/alumnos/ingreso').set(H).send({ apodo: 'x'.repeat(20_000) });
    expect(grande.status).toBe(400);
  });

  it('rutas protegidas exigen sesión; las de docente exigen sesión docente', async () => {
    expect((await request(t.app).get('/api/yo')).status).toBe(401);
    const { agente } = await registrar();
    expect((await agente.get('/api/yo')).status).toBe(200);
    expect((await agente.get('/api/docente/cursos')).status).toBe(401);
    expect((await request(t.app).get('/api/no-existe')).status).toBe(404);
  });

  it('sin cabecera de pestaña no se puede jugar', async () => {
    const { agente } = await registrar();
    const r = await agente.post('/api/etapas/1-1/iniciar').set(H).send({});
    expect(r.status).toBe(409);
    expect(r.body.error.codigo).toBe('OTRA_PESTANA');
  });
});

describe('flujo de juego por HTTP', () => {
  it('iniciar, responder y ver el puntaje calculado por el servidor', async () => {
    const { agente, pestana } = await registrar();
    const HP = { ...H, 'x-pestana': pestana };
    const ini = await agente.post('/api/etapas/1-1/iniciar').set(HP).send({});
    expect(ini.status).toBe(200);
    const item = ini.body.item;
    expect(JSON.stringify(ini.body)).not.toMatch(/secreto|semilla|correcta/);

    const guardado = (await t.almacen.obtenerItem(item.id)) as ItemGuardado;
    t.avanzar();
    const resp = await agente
      .post(`/api/items/${item.id}/responder`)
      .set(HP)
      .send({ respuesta: respuestaCorrecta(guardado.tipo, guardado.publico, guardado.secreto), puntos: 999999 });
    expect(resp.status).toBe(200);
    expect(resp.body.cierre.resultado).toBe('perfecto');
    expect(resp.body.cierre.puntos).toBe(10);

    const yo = await agente.get('/api/yo');
    expect(yo.body.puntos).toBe(10);
  });

  it('el cliente no puede inventar rutas para sumar puntos', async () => {
    const { agente, pestana } = await registrar();
    const HP = { ...H, 'x-pestana': pestana };
    for (const ruta of ['/api/yo', '/api/puntos', '/api/jugadores/me']) {
      const r = await agente.post(ruta).set(HP).send({ puntos: 5000, monedas: 5000 });
      expect([404, 405]).toContain(r.status);
    }
    expect((await agente.get('/api/yo')).body.puntos).toBe(0);
  });

  it('ranking del curso', async () => {
    await registrar('Puma Veloz 10');
    const { agente } = await registrar('Lince Sabio 20');
    const r = await agente.get('/api/ranking');
    expect(r.body.posiciones).toHaveLength(2);
    expect(r.body.posiciones.some((p: { esYo: boolean }) => p.esYo)).toBe(true);
  });

  it('salir cierra la sesión', async () => {
    const { agente } = await registrar();
    await agente.post('/api/salir').set(H).send({});
    expect((await agente.get('/api/yo')).status).toBe(401);
  });

  it('lista de apodos del curso para el ingreso', async () => {
    await registrar('Puma Veloz 10');
    const r = await request(t.app).get(`/api/cursos/${t.curso.codigo}`);
    expect(r.body.alumnos).toEqual([{ apodo: 'Puma Veloz 10', avatar: 'gatita-violeta' }]);
    expect(JSON.stringify(r.body)).not.toMatch(/clave|hash|sal/i);
    expect((await request(t.app).get('/api/cursos/NOEXISTE')).status).toBe(404);
  });
});

describe('panel docente por HTTP', () => {
  it('ingresar, crear curso, ver resumen y descargar CSV', async () => {
    const agente = request.agent(t.app);
    expect((await agente.post('/api/docente/ingreso').set(H).send({ clave: 'mala' })).status).toBe(401);
    expect((await agente.post('/api/docente/ingreso').set(H).send({ clave: 'docente-secreto-123' })).status).toBe(200);
    const creado = await agente.post('/api/docente/cursos').set(H).send({ nombre: '2° A', nivel: 2 });
    expect(creado.body.curso.codigo).toMatch(/^[A-Z2-9]{6}$/);
    const lista = await agente.get('/api/docente/cursos');
    expect(lista.body.cursos).toHaveLength(2);
    const resumen = await agente.get(`/api/docente/cursos/${creado.body.curso.id}`);
    expect(resumen.body.alumnos).toEqual([]);
    const csv = await agente.get(`/api/docente/cursos/${creado.body.curso.id}/eventos.csv`);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text.startsWith('﻿fecha,apodo')).toBe(true);
  });
});
