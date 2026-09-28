/**
 * Pruebas del servicio autoritativo: flujo completo y cada trampa conocida.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../src/servicio/almacen';
import { ErrorJuego } from '../src/servicio/errores';
import { Limitador } from '../src/servicio/limitador';
import type { ItemGuardado } from '../src/servicio/modelos';
import { hashClave } from '../src/servicio/seguridad';
import { ServicioJuego, type Contexto, type VistaItem } from '../src/servicio/servicio';
import { respuestaCorrecta, respuestaIncorrecta } from './ayudas';

const CLAVE = ['gato', 'oso', 'pez'];
const ITER = 1000; // pocas iteraciones para que las pruebas sean rápidas

class Reloj {
  t = Date.UTC(2026, 8, 28, 13, 0, 0);
  ahora = () => this.t;
  avanzar(ms = 2000) {
    this.t += ms;
  }
}

async function preparar(opciones: { limitador?: Limitador; nivel?: number } = {}) {
  const almacen = new AlmacenMemoria();
  const reloj = new Reloj();
  const servicio = new ServicioJuego(almacen, {
    reloj: reloj.ahora,
    iteracionesClave: ITER,
    claveDocente: await hashClave('clave-docente-segura', undefined, ITER),
    limitador: opciones.limitador ?? new Limitador({ capacidad: 1e9, recargaPorSegundo: 1e9 }),
  });
  const curso = await servicio.crearCurso({ nombre: '1° A', nivel: opciones.nivel ?? 1 });
  const { perfil } = await servicio.registrarAlumno({ codigoCurso: curso.codigo, apodo: 'Tigre Veloz 23', avatar: 'gatito', clave: CLAVE });
  const { pestana } = await servicio.tomarPestana(perfil.id);
  const ctx: Contexto = { jugadorId: perfil.id, pestana };
  return { almacen, reloj, servicio, curso, ctx };
}

async function espera<T>(p: Promise<T>): Promise<ErrorJuego> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErrorJuego) return e;
    throw e;
  }
  throw new Error('se esperaba un error');
}

/** Resuelve un ítem correctamente usando el secreto guardado (solo en pruebas). */
async function resolverBien(s: ServicioJuego, almacen: AlmacenMemoria, reloj: Reloj, ctx: Contexto, vista: VistaItem) {
  const item = (await almacen.obtenerItem(vista.id)) as ItemGuardado;
  reloj.avanzar();
  const r = respuestaCorrecta(item.tipo, item.publico, item.secreto);
  if (vista.modo === 'pesada') return (await s.pesar(ctx, vista.id, r)).cierre!;
  return (await s.responder(ctx, vista.id, r)).cierre!;
}

async function resolverMal(s: ServicioJuego, almacen: AlmacenMemoria, reloj: Reloj, ctx: Contexto, vista: VistaItem) {
  const item = (await almacen.obtenerItem(vista.id)) as ItemGuardado;
  const r = respuestaIncorrecta(item.tipo, item.publico, item.secreto);
  for (let i = 0; i < vista.maxIntentos; i++) {
    reloj.avanzar();
    const res = vista.modo === 'pesada' ? await s.pesar(ctx, vista.id, r) : await s.responder(ctx, vista.id, r);
    if (res.cierre) return res.cierre;
  }
  throw new Error('no cerró');
}

describe('cuentas y sesiones', () => {
  it('registra, entra con la clave de figuras y rechaza claves incorrectas', async () => {
    const { servicio, curso } = await preparar();
    const ok = await servicio.ingresarAlumno({ codigoCurso: curso.codigo.toLowerCase(), apodo: 'tigre veloz 23', clave: CLAVE });
    expect(ok.perfil.apodo).toBe('Tigre Veloz 23');
    expect((await servicio.sesion(ok.token))?.jugadorId).toBe(ok.perfil.id);
    const e = await espera(servicio.ingresarAlumno({ codigoCurso: curso.codigo, apodo: 'Tigre Veloz 23', clave: ['gato', 'oso', 'pato'] }));
    expect(e.codigo).toBe('CREDENCIALES');
  });

  it('bloquea tras 5 intentos fallidos durante 10 minutos (contra adivinar la clave)', async () => {
    const { servicio, curso, reloj } = await preparar();
    const mala = { codigoCurso: curso.codigo, apodo: 'Tigre Veloz 23', clave: ['pez', 'pez', 'pez'] };
    for (let i = 0; i < 5; i++) expect((await espera(servicio.ingresarAlumno(mala))).codigo).toBe('CREDENCIALES');
    expect((await espera(servicio.ingresarAlumno({ ...mala, clave: CLAVE }))).codigo).toBe('BLOQUEADO');
    reloj.avanzar(11 * 60_000);
    await expect(servicio.ingresarAlumno({ ...mala, clave: CLAVE })).resolves.toBeTruthy();
  });

  it('apodos duplicados, inválidos u ofensivos se rechazan', async () => {
    const { servicio, curso } = await preparar();
    const base = { codigoCurso: curso.codigo, avatar: 'gatito', clave: CLAVE };
    expect((await espera(servicio.registrarAlumno({ ...base, apodo: 'TIGRE  VELOZ 23' }))).codigo).toBe('DUPLICADO');
    expect((await espera(servicio.registrarAlumno({ ...base, apodo: 'ab' }))).codigo).toBe('INVALIDO');
    expect((await espera(servicio.registrarAlumno({ ...base, apodo: '<script>' }))).codigo).toBe('INVALIDO');
    expect((await espera(servicio.registrarAlumno({ ...base, apodo: 'el weon' }))).codigo).toBe('INVALIDO');
    expect((await espera(servicio.registrarAlumno({ ...base, apodo: 'Puma 1', clave: ['gato'] }))).codigo).toBe('INVALIDO');
    expect((await espera(servicio.registrarAlumno({ ...base, apodo: 'Puma 1', avatar: 'hacker' }))).codigo).toBe('INVALIDO');
  });

  it('la sesión expira y el token se guarda solo como hash', async () => {
    const { servicio, curso, reloj, almacen } = await preparar();
    const { token } = await servicio.ingresarAlumno({ codigoCurso: curso.codigo, apodo: 'Tigre Veloz 23', clave: CLAVE });
    expect(JSON.stringify(almacen.exportar())).not.toContain(token);
    reloj.avanzar(13 * 3_600_000);
    expect(await servicio.sesion(token)).toBeNull();
  });

  it('docente: clave correcta da sesión docente; incorrecta no', async () => {
    const { servicio } = await preparar();
    const { token } = await servicio.ingresarDocente('clave-docente-segura');
    expect((await servicio.sesion(token))?.docente).toBe(true);
    expect((await espera(servicio.ingresarDocente('otra'))).codigo).toBe('CREDENCIALES');
  });
});

describe('antitrampas', () => {
  let t: Awaited<ReturnType<typeof preparar>>;
  beforeEach(async () => {
    t = await preparar();
  });

  it('responder demasiado rápido se rechaza sin castigo', async () => {
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    const guardado = (await t.almacen.obtenerItem(item.id))!;
    const r = respuestaCorrecta(guardado.tipo, guardado.publico, guardado.secreto);
    expect((await espera(t.servicio.responder(t.ctx, item.id, r))).codigo).toBe('DEMASIADO_RAPIDO');
    t.reloj.avanzar();
    const res = await t.servicio.responder(t.ctx, item.id, r);
    expect(res.cierre?.resultado).toBe('perfecto');
  });

  it('recargar o reiniciar la etapa devuelve EL MISMO ejercicio (no se puede cambiar uno difícil)', async () => {
    const a = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    const b = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    const c = await t.servicio.itemActual(t.ctx, a.partida.id);
    expect(b.item.id).toBe(a.item.id);
    expect(c.item?.id).toBe(a.item.id);
    expect(b.item.publico).toEqual(a.item.publico);
  });

  it('la vista enviada al navegador no incluye la respuesta ni la semilla', async () => {
    const repaso = await preparar({ nivel: 2 });
    const { item } = await repaso.servicio.iniciarEtapa(repaso.ctx, '1-2');
    const texto = JSON.stringify(item);
    expect(texto).not.toContain('secreto');
    expect(texto).not.toContain('valorCaja');
    expect(texto).not.toContain('semilla');
  });

  it('no se puede responder dos veces el mismo ejercicio', async () => {
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    await resolverBien(t.servicio, t.almacen, t.reloj, t.ctx, item);
    t.reloj.avanzar();
    expect((await espera(t.servicio.responder(t.ctx, item.id, 'equilibrio'))).codigo).toBe('ITEM_TERMINADO');
  });

  it('dos respuestas simultáneas solo cobran una vez', async () => {
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    const g = (await t.almacen.obtenerItem(item.id))!;
    const r = respuestaCorrecta(g.tipo, g.publico, g.secreto);
    t.reloj.avanzar();
    const resultados = await Promise.allSettled([1, 2, 3, 4, 5].map(() => t.servicio.responder(t.ctx, item.id, r)));
    expect(resultados.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    const perfil = await t.servicio.perfil(t.ctx.jugadorId);
    expect(perfil.puntos).toBe(10);
  });

  it('otra pestaña toma el control y la anterior queda bloqueada', async () => {
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    const nueva = await t.servicio.tomarPestana(t.ctx.jugadorId);
    t.reloj.avanzar();
    expect((await espera(t.servicio.responder(t.ctx, item.id, 'equilibrio'))).codigo).toBe('OTRA_PESTANA');
    const ctx2 = { ...t.ctx, pestana: nueva.pestana };
    const g = (await t.almacen.obtenerItem(item.id))!;
    await expect(t.servicio.responder(ctx2, item.id, respuestaCorrecta(g.tipo, g.publico, g.secreto))).resolves.toBeTruthy();
  });

  it('respuestas malformadas se rechazan y no gastan intentos', async () => {
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    t.reloj.avanzar();
    for (const basura of ['arriba', 42, null, { correcta: 'izquierda' }, ['izquierda'], '"; DROP TABLE jugadores; --']) {
      expect((await espera(t.servicio.responder(t.ctx, item.id, basura))).codigo).toBe('INVALIDO');
    }
    expect((await t.almacen.obtenerItem(item.id))!.intentos).toBe(0);
  });

  it('no se puede actuar sobre ejercicios de otra persona', async () => {
    const otro = await t.servicio.registrarAlumno({ codigoCurso: t.curso.codigo, apodo: 'Puma Sabio 11', avatar: 'gatito', clave: CLAVE });
    const { pestana } = await t.servicio.tomarPestana(otro.perfil.id);
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    t.reloj.avanzar();
    expect((await espera(t.servicio.responder({ jugadorId: otro.perfil.id, pestana }, item.id, 'equilibrio'))).codigo).toBe('NO_ENCONTRADO');
  });

  it('etapas bloqueadas o inexistentes no se pueden iniciar', async () => {
    expect((await espera(t.servicio.iniciarEtapa(t.ctx, '1-2'))).codigo).toBe('ETAPA_BLOQUEADA');
    expect((await espera(t.servicio.iniciarEtapa(t.ctx, '2-1'))).codigo).toBe('ETAPA_BLOQUEADA');
    expect((await espera(t.servicio.iniciarEtapa(t.ctx, '3-1'))).codigo).toBe('NO_ENCONTRADO');
    expect((await espera(t.servicio.iniciarEtapa(t.ctx, { id: '1-1' }))).codigo).toBe('NO_ENCONTRADO');
  });

  it('abandonar con un ejercicio visto cuenta como fallido y corta la racha', async () => {
    const a = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    await resolverBien(t.servicio, t.almacen, t.reloj, t.ctx, a.item);
    const siguiente = await t.servicio.itemActual(t.ctx, a.partida.id);
    expect((await t.servicio.perfil(t.ctx.jugadorId)).racha).toBe(1);
    const perfil = await t.servicio.abandonar(t.ctx, a.partida.id);
    expect(perfil.racha).toBe(0);
    expect(perfil.partidaActiva).toBeNull();
    const g = (await t.almacen.obtenerItem(siguiente.item!.id))!;
    expect(g.resultado).toBe('fallido');
  });

  it('las pistas son 3 como máximo y bajan el resultado', async () => {
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    for (let i = 1; i <= 3; i++) expect((await t.servicio.pista(t.ctx, item.id)).pistasUsadas).toBe(i);
    expect((await espera(t.servicio.pista(t.ctx, item.id))).codigo).toBe('INVALIDO');
    const cierre = await resolverBien(t.servicio, t.almacen, t.reloj, t.ctx, item);
    expect(cierre.resultado).toBe('con_ayuda');
  });

  it('el límite de ritmo frena clics masivos', async () => {
    const limitado = await preparar({ limitador: new Limitador({ capacidad: 5, recargaPorSegundo: 1 }) });
    const { item } = await limitado.servicio.iniciarEtapa(limitado.ctx, '1-1');
    let frenado = false;
    for (let i = 0; i < 10; i++) {
      const e = await espera(limitado.servicio.pista(limitado.ctx, item.id)).catch(() => null);
      if (e?.codigo === 'LIMITE') frenado = true;
    }
    expect(frenado).toBe(true);
  });

  it('pesadas: máximo 4; sin equilibrio el ejercicio falla y no da puntos', async () => {
    // Llegar a la etapa 1-2.
    await completarEtapa(t, '1-1');
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-2');
    const g = (await t.almacen.obtenerItem(item.id))!;
    const mala = respuestaIncorrecta(g.tipo, g.publico, g.secreto);
    const antes = (await t.servicio.perfil(t.ctx.jugadorId)).puntos;
    let ultima;
    for (let i = 0; i < 4; i++) {
      t.reloj.avanzar();
      ultima = await t.servicio.pesar(t.ctx, item.id, mala);
    }
    expect(ultima!.cierre?.resultado).toBe('fallido');
    expect(ultima!.pesada.equilibrio).toBe(false);
    t.reloj.avanzar();
    expect((await espera(t.servicio.pesar(t.ctx, item.id, mala))).codigo).toBe('ITEM_TERMINADO');
    expect((await t.servicio.perfil(t.ctx.jugadorId)).puntos).toBe(antes);
  });

  it('en las mecánicas escritas se puede reintentar una vez sin ver la solución', async () => {
    await completarEtapa(t, '1-1');
    await completarEtapa(t, '1-2');
    await completarEtapa(t, '1-3');
    const { item } = await t.servicio.iniciarEtapa(t.ctx, '1-4');
    const g = (await t.almacen.obtenerItem(item.id))!;
    t.reloj.avanzar();
    const r1 = await t.servicio.responder(t.ctx, item.id, respuestaIncorrecta(g.tipo, g.publico, g.secreto));
    expect(r1.puedeReintentar).toBe(true);
    expect(r1.cierre).toBeNull();
    expect(JSON.stringify(r1)).not.toContain('solucion');
    t.reloj.avanzar();
    const r2 = await t.servicio.responder(t.ctx, item.id, respuestaCorrecta(g.tipo, g.publico, g.secreto));
    expect(r2.cierre?.resultado).toBe('con_ayuda');
  });
});

async function completarEtapa(t: Awaited<ReturnType<typeof preparar>>, etapaId: string) {
  let { partida, item } = await t.servicio.iniciarEtapa(t.ctx, etapaId);
  for (let guardia = 0; guardia < 60; guardia++) {
    const cierre = await resolverBien(t.servicio, t.almacen, t.reloj, t.ctx, item);
    if (cierre.fin) return cierre.fin;
    const sig = await t.servicio.itemActual(t.ctx, partida.id);
    partida = sig.partida;
    item = sig.item!;
  }
  throw new Error('la etapa no terminó');
}

describe('recorrido completo', () => {
  it('jugar perfecto la isla 1 da 3 estrellas en todo, vence al cuervo y abre la isla 2', async () => {
    const t = await preparar();
    for (const id of ['1-1', '1-2', '1-3', '1-4', '1-J']) {
      const fin = await completarEtapa(t, id);
      expect(fin.superada).toBe(true);
      expect(fin.estrellas).toBe(3);
    }
    const perfil = await t.servicio.perfil(t.ctx.jugadorId);
    expect(perfil.islas[1]!.accesible).toBe(true);
    expect(perfil.insignias).toEqual(expect.arrayContaining(['primer_paso', 'racha_10', 'tres_estrellas', 'isla_1_dorada', 'vence_1-J', 'sin_pistas']));
    expect(perfil.rango.actual.id).not.toBe('aprendiz');

    // Los puntos del perfil cuadran exactamente con el registro de eventos + bonos.
    const eventos = await t.almacen.listarEventos(t.curso.id);
    const deItems = eventos.reduce((s, e) => s + e.puntos, 0);
    const bonos = 5 * 3 * 50 + 300; // 3 estrellas nuevas en 5 etapas + primer jefe
    expect(perfil.puntos).toBe(deItems + bonos);
  });

  it('adivinar al azar rinde mucho menos que pensar', async () => {
    const pensar = await preparar();
    const finPensar = await completarEtapa(pensar, '1-1');
    const puntosPensar = (await pensar.servicio.perfil(pensar.ctx.jugadorId)).puntos;
    expect(finPensar.estrellas).toBe(3);

    // Cinco estudiantes que adivinan: el azar puede dar suerte a alguno, pero no a la mayoría.
    let conDosOMas = 0;
    for (let n = 0; n < 5; n++) {
      const adivinar = await preparar();
      let { partida, item } = await adivinar.servicio.iniciarEtapa(adivinar.ctx, '1-1');
      let fin = null;
      let k = 0;
      for (let guardia = 0; guardia < 60 && !fin; guardia++) {
        adivinar.reloj.avanzar();
        const opcion = ['izquierda', 'equilibrio', 'derecha'][k++ % 3];
        const r = await adivinar.servicio.responder(adivinar.ctx, item.id, opcion);
        fin = r.cierre?.fin ?? null;
        if (!fin) {
          const sig = await adivinar.servicio.itemActual(adivinar.ctx, partida.id);
          partida = sig.partida;
          item = sig.item!;
        }
      }
      if ((fin?.estrellas ?? 0) >= 2) conDosOMas++;
      const puntosAdivinar = (await adivinar.servicio.perfil(adivinar.ctx.jugadorId)).puntos;
      expect(puntosAdivinar).toBeLessThan(puntosPensar);
    }
    expect(conDosOMas).toBeLessThanOrEqual(1);
  });

  it('repetir una etapa dominada da pocos puntos (no se puede farmear)', async () => {
    const t = await preparar();
    await completarEtapa(t, '1-1');
    const p1 = (await t.servicio.perfil(t.ctx.jugadorId)).puntos;
    await completarEtapa(t, '1-1');
    const p2 = (await t.servicio.perfil(t.ctx.jugadorId)).puntos;
    expect(p2 - p1).toBeLessThan(p1 * 0.2);
  });

  it('tienda: comprar exige monedas suficientes y equipa el artículo', async () => {
    const t = await preparar();
    expect((await espera(t.servicio.comprar(t.ctx, 'corona'))).codigo).toBe('SIN_MONEDAS');
    await completarEtapa(t, '1-1');
    const perfil = await t.servicio.comprar(t.ctx, 'mono');
    expect(perfil.inventario).toContain('mono');
    expect(perfil.equipado.cabeza).toBe('mono');
    expect((await espera(t.servicio.comprar(t.ctx, 'mono'))).codigo).toBe('INVALIDO');
    expect((await espera(t.servicio.equipar(t.ctx, 'cabeza', 'corona'))).codigo).toBe('INVALIDO');
    const sin = await t.servicio.equipar(t.ctx, 'cabeza', null);
    expect(sin.equipado.cabeza).toBeUndefined();
  });

  it('panel docente: resumen, ranking y CSV seguro para Excel', async () => {
    const t = await preparar();
    await completarEtapa(t, '1-1');
    const resumen = await t.servicio.resumenCurso(t.curso.id);
    expect(resumen.alumnos).toHaveLength(1);
    expect(resumen.totalEventos).toBeGreaterThanOrEqual(10);
    const csv = await t.servicio.eventosCSV(t.curso.id);
    expect(csv.split('\n')[0]).toContain('apodo');
    expect(csv).toContain('Tigre Veloz 23');
    const ranking = await t.servicio.ranking(t.ctx.jugadorId);
    expect(ranking.posiciones[0]!.esYo).toBe(true);
  });

  it('docente puede restablecer la clave (cierra sesiones) y eliminar alumnos', async () => {
    const t = await preparar();
    const { token } = await t.servicio.ingresarAlumno({ codigoCurso: t.curso.codigo, apodo: 'Tigre Veloz 23', clave: CLAVE });
    await t.servicio.restablecerClave(t.ctx.jugadorId, ['pato', 'pato', 'oso']);
    expect(await t.servicio.sesion(token)).toBeNull();
    await expect(t.servicio.ingresarAlumno({ codigoCurso: t.curso.codigo, apodo: 'Tigre Veloz 23', clave: ['pato', 'pato', 'oso'] })).resolves.toBeTruthy();
    await t.servicio.eliminarJugador(t.ctx.jugadorId);
    expect((await t.servicio.apodosDeCurso(t.curso.codigo)).alumnos).toHaveLength(0);
  });

  it('fallar la etapa entera (40 ejercicios) no la supera ni da estrellas', async () => {
    const t = await preparar();
    let { partida, item } = await t.servicio.iniciarEtapa(t.ctx, '1-1');
    let fin = null;
    for (let i = 0; i < 45 && !fin; i++) {
      const cierre = await resolverMal(t.servicio, t.almacen, t.reloj, t.ctx, item);
      fin = cierre.fin;
      if (!fin) {
        const sig = await t.servicio.itemActual(t.ctx, partida.id);
        partida = sig.partida;
        item = sig.item!;
      }
    }
    expect(fin?.superada).toBe(false);
    expect(fin?.estrellas).toBe(0);
    const perfil = await t.servicio.perfil(t.ctx.jugadorId);
    expect(perfil.islas[0]!.etapas[1]!.accesible).toBe(false);
  });
});
