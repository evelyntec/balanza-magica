/**
 * Integración con MySQL / MariaDB real. Se ejecuta si existe BD_PRUEBA_NOMBRE:
 *   BD_PRUEBA_NOMBRE=balanza_test BD_PRUEBA_USUARIO=balanza BD_PRUEBA_CLAVE=… npx vitest run apps/servidor
 */

import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Limitador, ServicioJuego, type Contexto, type ItemGuardado, type VistaItem } from '@balanza/nucleo';
import { AlmacenMySQL } from '../src/almacenMysql';
import { respuestaCorrecta } from '../../../packages/nucleo/test/ayudas';

const env = process.env;
const hayBD = Boolean(env.BD_PRUEBA_NOMBRE);

describe.skipIf(!hayBD)('MySQL / MariaDB real', () => {
  let almacen: AlmacenMySQL;
  let servicio: ServicioJuego;
  let t = Date.UTC(2026, 8, 28, 15);
  const avanzar = () => {
    t += 2000;
  };

  beforeAll(async () => {
    almacen = new AlmacenMySQL({
      host: env.BD_PRUEBA_HOST ?? '127.0.0.1',
      puerto: Number(env.BD_PRUEBA_PUERTO ?? 3306),
      usuario: env.BD_PRUEBA_USUARIO ?? 'root',
      clave: env.BD_PRUEBA_CLAVE ?? '',
      baseDeDatos: env.BD_PRUEBA_NOMBRE as string,
      conexiones: 8,
    });
    for (const tabla of ['eventos', 'items', 'partidas', 'sesiones', 'jugadores', 'cursos']) await almacen.pool.query(`DROP TABLE IF EXISTS ${tabla}`);
    await almacen.migrar(path.join(__dirname, '..', 'sql', 'esquema.sql'));
    await almacen.migrar(path.join(__dirname, '..', 'sql', 'esquema.sql')); // idempotente
    servicio = new ServicioJuego(almacen, {
      reloj: () => t,
      iteracionesClave: 1000,
      limitador: new Limitador({ capacidad: 1e6, recargaPorSegundo: 1e6 }),
    });
  });

  afterAll(async () => {
    await almacen?.cerrar();
  });

  async function nuevoJugador(apodo: string) {
    const curso = await servicio.crearCurso({ nombre: 'Prueba', nivel: 1 });
    const { perfil, token } = await servicio.registrarAlumno({ codigoCurso: curso.codigo, apodo, avatar: 'gatito', clave: ['oso', 'oso', 'pez'] });
    const { pestana } = await servicio.tomarPestana(perfil.id);
    return { curso, ctx: { jugadorId: perfil.id, pestana } as Contexto, token };
  }

  async function resolver(ctx: Contexto, vista: VistaItem) {
    const g = (await almacen.obtenerItem(vista.id)) as ItemGuardado;
    avanzar();
    const r = respuestaCorrecta(g.tipo, g.publico, g.secreto);
    return vista.modo === 'pesada' ? (await servicio.pesar(ctx, vista.id, r)).cierre! : (await servicio.responder(ctx, vista.id, r)).cierre!;
  }

  it('recorrido completo de la isla 1 con transacciones reales', async () => {
    const { ctx, curso } = await nuevoJugador('Huemul Astuto 44');
    for (const etapa of ['1-1', '1-2', '1-3', '1-4', '1-J']) {
      let { partida, item } = await servicio.iniciarEtapa(ctx, etapa);
      for (;;) {
        const cierre = await resolver(ctx, item);
        if (cierre.fin) {
          expect(cierre.fin.estrellas).toBe(3);
          break;
        }
        const sig = await servicio.itemActual(ctx, partida.id);
        partida = sig.partida;
        item = sig.item!;
      }
    }
    const perfil = await servicio.perfil(ctx.jugadorId);
    expect(perfil.islas[1]!.accesible).toBe(true);
    const eventos = await almacen.listarEventos(curso.id);
    expect(eventos.length).toBe(45); // 4 etapas × 10 + jefe (10 de vida ÷ 2 por perfecto)
    expect(perfil.puntos).toBe(eventos.reduce((s, e) => s + e.puntos, 0) + 5 * 150 + 300);
  });

  it('veinte respuestas simultáneas al mismo ejercicio cobran una sola vez (FOR UPDATE)', async () => {
    const { ctx } = await nuevoJugador('Pudú Veloz 77');
    const { item } = await servicio.iniciarEtapa(ctx, '1-1');
    const g = (await almacen.obtenerItem(item.id)) as ItemGuardado;
    avanzar();
    const r = respuestaCorrecta(g.tipo, g.publico, g.secreto);
    const resultados = await Promise.allSettled(Array.from({ length: 20 }, () => servicio.responder(ctx, item.id, r)));
    expect(resultados.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect((await servicio.perfil(ctx.jugadorId)).puntos).toBe(10);
  });

  it('apodo duplicado respeta la clave única de la tabla', async () => {
    const { curso } = await nuevoJugador('Delfín Genial 31');
    await expect(servicio.registrarAlumno({ codigoCurso: curso.codigo, apodo: 'delfin genial 31', avatar: 'gatito', clave: ['oso', 'oso', 'pez'] })).rejects.toMatchObject({
      codigo: 'DUPLICADO',
    });
  });

  it('eliminar un jugador borra en cascada todos sus datos', async () => {
    const { ctx, curso } = await nuevoJugador('Colibrí Sabio 90');
    const { item } = await servicio.iniciarEtapa(ctx, '1-1');
    await resolver(ctx, item);
    await servicio.eliminarJugador(ctx.jugadorId);
    for (const tabla of ['jugadores', 'sesiones', 'partidas', 'items', 'eventos']) {
      const columna = tabla === 'jugadores' ? 'id' : 'jugador_id';
      const [filas] = await almacen.pool.query(`SELECT COUNT(*) AS n FROM ${tabla} WHERE ${columna} = ?`, [ctx.jugadorId]);
      expect(Number((filas as { n: number }[])[0]!.n)).toBe(0);
    }
    expect((await servicio.apodosDeCurso(curso.codigo)).alumnos).toHaveLength(0);
  });

  it('mantenimiento borra sesiones vencidas', async () => {
    const { token } = await nuevoJugador('Pingüino Alegre 55');
    expect(await servicio.sesion(token)).not.toBeNull();
    await almacen.mantenimiento(t + 13 * 3_600_000);
    expect(await servicio.sesion(token)).toBeNull();
  });

  it('los apodos con tildes y eñes se guardan en utf8mb4', async () => {
    const { ctx } = await nuevoJugador('Ñandú Mágico 12');
    expect((await servicio.perfil(ctx.jugadorId)).apodo).toBe('Ñandú Mágico 12');
  });
});
