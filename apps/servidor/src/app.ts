/**
 * API HTTP de Balanza Mágica (Express 5).
 *
 * Capa delgada sobre ServicioJuego: autentica, valida el origen y
 * traduce errores. Toda la lógica del juego vive en @balanza/nucleo.
 */

import path from 'node:path';
import { existsSync } from 'node:fs';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { ErrorJuego, Limitador, sugerirApodos, type ServicioJuego, type Sesion } from '@balanza/nucleo';

export const COOKIE = 'bm_sesion';

export interface OpcionesApp {
  produccion: boolean;
  /** Orígenes permitidos para peticiones que cambian datos (p. ej. https://balanza.profesoraevelyn.com). */
  origenes: string[];
  /** Carpeta con el juego compilado (opcional). */
  estaticos?: string;
  /** Detrás del proxy de LiteSpeed/Passenger en cPanel. */
  confiarProxy?: boolean | number | string;
  duracionCookieMs?: number;
  reloj?: () => number;
}

declare module 'express-serve-static-core' {
  interface Request {
    sesion?: Sesion;
    token?: string;
  }
}

type Manejador = (req: Request, res: Response) => Promise<unknown>;

export function crearApp(servicio: ServicioJuego, opciones: OpcionesApp) {
  const app = express();
  const reloj = opciones.reloj ?? Date.now;
  app.disable('x-powered-by');
  app.set('trust proxy', opciones.confiarProxy ?? (opciones.produccion ? 1 : false));

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:'],
          'connect-src': ["'self'"],
          'media-src': ["'self'", 'data:', 'blob:'],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'upgrade-insecure-requests': opciones.produccion ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: opciones.produccion ? { maxAge: 15_552_000, includeSubDomains: false } : false,
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // Límite general por IP (generoso: un curso entero comparte la IP del colegio).
  const limiteIp = new Limitador({ capacidad: 600, recargaPorSegundo: 20 });
  // Límite de intentos de ingreso por IP + apodo (el bloqueo por cuenta está en el servicio).
  const limiteIngreso = new Limitador({ capacidad: 8, recargaPorSegundo: 0.1 });

  app.use('/api', (req, res, next) => {
    if (!limiteIp.permitir(req.ip ?? 'sin-ip', reloj())) {
      res.status(429).json({ error: { codigo: 'LIMITE', mensaje: 'Demasiadas peticiones. Espera un momento.' } });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use('/api', express.json({ limit: '8kb', strict: true }));
  app.use('/api', cookieParser());

  // Protección CSRF: cabecera propia obligatoria + origen permitido.
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    const origen = req.get('origin');
    const origenPropio = `${req.protocol}://${req.get('host')}`;
    const permitido = !origen || origen === origenPropio || opciones.origenes.includes(origen);
    if (req.get('x-balanza') !== '1' || !permitido) {
      res.status(403).json({ error: { codigo: 'PROHIBIDO', mensaje: 'Petición no permitida.' } });
      return;
    }
    next();
  });

  // Sesión desde la cookie HttpOnly.
  app.use('/api', async (req, _res, next) => {
    try {
      const token = req.cookies?.[COOKIE];
      if (typeof token === 'string') {
        const sesion = await servicio.sesion(token);
        if (sesion) {
          req.sesion = sesion;
          req.token = token;
        }
      }
      next();
    } catch (e) {
      next(e);
    }
  });

  const duracionCookie = opciones.duracionCookieMs ?? 12 * 3_600_000;
  const ponerCookie = (res: Response, token: string, duracion = duracionCookie) =>
    res.cookie(COOKIE, token, { httpOnly: true, secure: opciones.produccion, sameSite: 'strict', path: '/', maxAge: duracion });

  const ruta =
    (fn: Manejador) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const r = await fn(req, res);
        if (!res.headersSent) res.json(r ?? { ok: true });
      } catch (e) {
        next(e);
      }
    };

  const alumno = (req: Request) => {
    if (!req.sesion?.jugadorId) throw new ErrorJuego('NO_AUTENTICADO');
    return req.sesion.jugadorId;
  };
  const contexto = (req: Request) => {
    const jugadorId = alumno(req);
    const pestana = req.get('x-pestana');
    if (!pestana || pestana.length > 64) throw new ErrorJuego('OTRA_PESTANA');
    return { jugadorId, pestana };
  };
  const docente = (req: Request) => {
    if (!req.sesion?.docente) throw new ErrorJuego('NO_AUTENTICADO');
  };
  const cuerpo = (req: Request): Record<string, unknown> => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

  const api = express.Router();

  api.get('/salud', ruta(async () => ({ ok: true, hora: reloj() })));
  api.get('/apodos-sugeridos', ruta(async () => ({ apodos: sugerirApodos(6) })));

  // --- Cuentas ----------------------------------------------------------------
  api.get(
    '/cursos/:codigo',
    ruta(async (req) => servicio.apodosDeCurso(req.params.codigo)),
  );

  api.post(
    '/alumnos/registro',
    ruta(async (req, res) => {
      const b = cuerpo(req);
      const { token, perfil } = await servicio.registrarAlumno({ codigoCurso: b.codigoCurso, apodo: b.apodo, avatar: b.avatar, clave: b.clave });
      ponerCookie(res, token);
      return { perfil };
    }),
  );

  api.post(
    '/alumnos/ingreso',
    ruta(async (req, res) => {
      const b = cuerpo(req);
      const clave = `${req.ip}|${String(b.codigoCurso).slice(0, 12)}|${String(b.apodo).slice(0, 40).toLowerCase()}`;
      if (!limiteIngreso.permitir(clave, reloj())) throw new ErrorJuego('BLOQUEADO');
      const { token, perfil } = await servicio.ingresarAlumno({ codigoCurso: b.codigoCurso, apodo: b.apodo, clave: b.clave });
      ponerCookie(res, token);
      return { perfil };
    }),
  );

  api.post(
    '/salir',
    ruta(async (req, res) => {
      await servicio.salir(req.token);
      res.clearCookie(COOKIE, { path: '/' });
      return { ok: true };
    }),
  );

  // --- Juego --------------------------------------------------------------------
  api.get('/yo', ruta(async (req) => servicio.perfil(alumno(req))));
  api.post('/pestana', ruta(async (req) => servicio.tomarPestana(alumno(req))));
  api.post('/etapas/:etapaId/iniciar', ruta(async (req) => servicio.iniciarEtapa(contexto(req), req.params.etapaId)));
  api.post('/partidas/:id/actual', ruta(async (req) => servicio.itemActual(contexto(req), req.params.id)));
  api.post('/partidas/:id/abandonar', ruta(async (req) => servicio.abandonar(contexto(req), req.params.id)));
  api.post('/items/:id/pista', ruta(async (req) => servicio.pista(contexto(req), req.params.id)));
  api.post('/items/:id/pesar', ruta(async (req) => servicio.pesar(contexto(req), req.params.id, cuerpo(req).propuesta)));
  api.post('/items/:id/responder', ruta(async (req) => servicio.responder(contexto(req), req.params.id, cuerpo(req).respuesta)));
  api.post('/tienda/comprar', ruta(async (req) => servicio.comprar(contexto(req), cuerpo(req).articuloId)));
  api.post(
    '/tienda/equipar',
    ruta(async (req) => {
      const b = cuerpo(req);
      return servicio.equipar(contexto(req), b.ranura, b.articuloId ?? null);
    }),
  );
  api.get('/ranking', ruta(async (req) => servicio.ranking(alumno(req))));

  // --- Docente -----------------------------------------------------------------
  api.post(
    '/docente/ingreso',
    ruta(async (req, res) => {
      if (!limiteIngreso.permitir(`docente|${req.ip}`, reloj())) throw new ErrorJuego('BLOQUEADO');
      const { token } = await servicio.ingresarDocente(cuerpo(req).clave);
      ponerCookie(res, token, 8 * 3_600_000);
      return { ok: true };
    }),
  );
  api.get(
    '/docente/cursos',
    ruta(async (req) => {
      docente(req);
      return { cursos: await servicio.listarCursos() };
    }),
  );
  api.post(
    '/docente/cursos',
    ruta(async (req) => {
      docente(req);
      const b = cuerpo(req);
      return { curso: await servicio.crearCurso({ nombre: b.nombre, nivel: b.nivel }) };
    }),
  );
  api.get(
    '/docente/cursos/:id',
    ruta(async (req) => {
      docente(req);
      return servicio.resumenCurso(req.params.id);
    }),
  );
  api.get(
    '/docente/cursos/:id/eventos.csv',
    ruta(async (req, res) => {
      docente(req);
      const csv = await servicio.eventosCSV(req.params.id);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="balanza-magica-eventos.csv"');
      res.send('﻿' + csv);
      return undefined;
    }),
  );
  api.post(
    '/docente/jugadores/:id/clave',
    ruta(async (req) => {
      docente(req);
      await servicio.restablecerClave(req.params.id, cuerpo(req).clave);
      return { ok: true };
    }),
  );
  api.delete(
    '/docente/jugadores/:id',
    ruta(async (req) => {
      docente(req);
      await servicio.eliminarJugador(req.params.id);
      return { ok: true };
    }),
  );

  app.use('/api', api);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada.' } });
  });

  // --- Juego compilado (opcional) -------------------------------------------------
  if (opciones.estaticos && existsSync(opciones.estaticos)) {
    const raiz = path.resolve(opciones.estaticos);
    app.use(
      express.static(raiz, {
        index: 'index.html',
        setHeaders(res, archivo) {
          if (/[\\/]assets[\\/]/.test(archivo)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          else res.setHeader('Cache-Control', 'no-cache');
        },
      }),
    );
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(raiz, 'index.html')));
  }

  // --- Errores -----------------------------------------------------------------------
  app.use((e: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (e instanceof ErrorJuego) {
      res.status(e.estado).json({ error: { codigo: e.codigo, mensaje: e.message } });
      return;
    }
    const tipo = (e as { type?: string }).type;
    if (tipo === 'entity.parse.failed' || tipo === 'entity.too.large') {
      res.status(400).json({ error: { codigo: 'INVALIDO', mensaje: 'Petición inválida.' } });
      return;
    }
    console.error('[balanza] error inesperado', e);
    res.status(500).json({ error: { codigo: 'INTERNO', mensaje: 'Ups, algo falló. Intenta de nuevo.' } });
  });

  return app;
}
