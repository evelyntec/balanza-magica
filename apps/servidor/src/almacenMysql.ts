/**
 * Implementación MySQL / MariaDB del almacén.
 *
 * - Consultas siempre parametrizadas (sin inyección SQL).
 * - Transacciones InnoDB: el jugador se bloquea con SELECT … FOR UPDATE,
 *   así dos pestañas o dos clics simultáneos no pueden cobrar dos veces,
 *   aunque el hosting ejecute varios procesos de Node.
 * - Actualizaciones con control de versión (optimistic locking).
 */

import { readFile } from 'node:fs/promises';
import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { ErrorJuego, type Almacen, type Curso, type Evento, type ItemGuardado, type Jugador, type Partida, type Repositorio, type Sesion } from '@balanza/nucleo';

type Ejecutor = Pool | PoolConnection;

interface Fila extends RowDataPacket {
  [columna: string]: unknown;
}

const json = (x: unknown): string => JSON.stringify(x);
const leer = <T>(texto: unknown): T => JSON.parse(String(texto)) as T;
const numero = (x: unknown): number => Number(x);

function jugadorDesde(f: Fila): Jugador {
  const datos = leer<Omit<Jugador, 'id' | 'cursoId' | 'apodo' | 'apodoClave' | 'puntos' | 'version' | 'creadoEn'>>(f.datos);
  return {
    ...datos,
    id: String(f.id),
    cursoId: String(f.curso_id),
    apodo: String(f.apodo),
    apodoClave: String(f.apodo_clave),
    puntos: numero(f.puntos),
    version: numero(f.version),
    creadoEn: numero(f.creado_en),
  };
}

function datosJugador(j: Jugador): string {
  const { id: _i, cursoId: _c, apodo: _a, apodoClave: _k, puntos: _p, version: _v, creadoEn: _e, ...resto } = j;
  return json(resto);
}

function partidaDesde(f: Fila): Partida {
  const datos = leer<Pick<Partida, 'estado' | 'itemActual' | 'indice'>>(f.datos);
  return {
    ...datos,
    id: String(f.id),
    jugadorId: String(f.jugador_id),
    etapaId: String(f.etapa_id),
    cerrada: numero(f.cerrada) === 1,
    version: numero(f.version),
    creadaEn: numero(f.creada_en),
    actualizadaEn: numero(f.actualizada_en),
  };
}

const datosPartida = (p: Partida): string => json({ estado: p.estado, itemActual: p.itemActual, indice: p.indice });

function itemDesde(f: Fila): ItemGuardado {
  return { ...leer<ItemGuardado>(f.datos), version: numero(f.version) };
}

function datosItem(i: ItemGuardado): string {
  const { version: _v, ...resto } = i;
  return json(resto);
}

function eventoDesde(f: Fila): Evento {
  return {
    jugadorId: String(f.jugador_id),
    cursoId: String(f.curso_id),
    etapaId: String(f.etapa_id),
    tipoItem: String(f.tipo_item) as Evento['tipoItem'],
    nivel: numero(f.nivel),
    resultado: String(f.resultado) as Evento['resultado'],
    intentos: numero(f.intentos),
    pistas: numero(f.pistas),
    diagnostico: f.diagnostico === null ? null : (String(f.diagnostico) as Evento['diagnostico']),
    relacional: numero(f.relacional) === 1,
    andamiaje: numero(f.andamiaje) === 1,
    ms: numero(f.ms),
    puntos: numero(f.puntos),
    fecha: numero(f.fecha),
  };
}

function esDuplicado(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'ER_DUP_ENTRY';
}

class RepoMySQL implements Repositorio {
  constructor(private readonly db: Ejecutor) {}

  private async filas(sql: string, parametros: unknown[] = []): Promise<Fila[]> {
    const [filas] = await this.db.query<Fila[]>(sql, parametros);
    return filas;
  }

  private async ejecutar(sql: string, parametros: unknown[]): Promise<ResultSetHeader> {
    const [r] = await this.db.execute<ResultSetHeader>(sql, parametros as (string | number | null)[]);
    return r;
  }

  // Cursos -------------------------------------------------------------------
  async obtenerCurso(id: string) {
    const [f] = await this.filas('SELECT * FROM cursos WHERE id = ?', [id]);
    return f ? cursoDesde(f) : null;
  }
  async obtenerCursoPorCodigo(codigo: string) {
    const [f] = await this.filas('SELECT * FROM cursos WHERE codigo = ?', [codigo]);
    return f ? cursoDesde(f) : null;
  }
  async listarCursos() {
    return (await this.filas('SELECT * FROM cursos ORDER BY creado_en')).map(cursoDesde);
  }
  async insertarCurso(c: Curso) {
    try {
      await this.ejecutar('INSERT INTO cursos (id, codigo, nombre, nivel, creado_en) VALUES (?, ?, ?, ?, ?)', [c.id, c.codigo, c.nombre, c.nivel, c.creadoEn]);
    } catch (e) {
      if (esDuplicado(e)) throw new ErrorJuego('DUPLICADO');
      throw e;
    }
  }

  // Jugadores ------------------------------------------------------------------
  async obtenerJugador(id: string, opciones?: { bloquear?: boolean }) {
    const [f] = await this.filas(`SELECT * FROM jugadores WHERE id = ?${opciones?.bloquear ? ' FOR UPDATE' : ''}`, [id]);
    return f ? jugadorDesde(f) : null;
  }
  async obtenerJugadorPorApodo(cursoId: string, apodoClave: string) {
    const [f] = await this.filas('SELECT * FROM jugadores WHERE curso_id = ? AND apodo_clave = ?', [cursoId, apodoClave]);
    return f ? jugadorDesde(f) : null;
  }
  async listarJugadores(cursoId: string) {
    return (await this.filas('SELECT * FROM jugadores WHERE curso_id = ? ORDER BY creado_en', [cursoId])).map(jugadorDesde);
  }
  async insertarJugador(j: Jugador) {
    try {
      await this.ejecutar(
        'INSERT INTO jugadores (id, curso_id, apodo, apodo_clave, puntos, datos, version, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [j.id, j.cursoId, j.apodo, j.apodoClave, j.puntos, datosJugador(j), j.version, j.creadoEn],
      );
    } catch (e) {
      if (esDuplicado(e)) throw new ErrorJuego('DUPLICADO');
      throw e;
    }
  }
  async actualizarJugador(j: Jugador) {
    const r = await this.ejecutar('UPDATE jugadores SET apodo = ?, apodo_clave = ?, puntos = ?, datos = ?, version = version + 1 WHERE id = ? AND version = ?', [
      j.apodo,
      j.apodoClave,
      j.puntos,
      datosJugador(j),
      j.id,
      j.version,
    ]);
    if (r.affectedRows !== 1) throw new ErrorJuego('CONFLICTO');
    j.version += 1;
  }
  async eliminarJugador(id: string) {
    // ON DELETE CASCADE elimina sesiones, partidas, ítems y eventos.
    await this.ejecutar('DELETE FROM jugadores WHERE id = ?', [id]);
  }

  // Sesiones -------------------------------------------------------------------
  async insertarSesion(s: Sesion) {
    await this.ejecutar('INSERT INTO sesiones (token_hash, jugador_id, docente, creada_en, expira_en) VALUES (?, ?, ?, ?, ?)', [
      s.tokenHash,
      s.jugadorId,
      s.docente ? 1 : 0,
      s.creadaEn,
      s.expiraEn,
    ]);
  }
  async obtenerSesion(tokenHash: string) {
    const [f] = await this.filas('SELECT * FROM sesiones WHERE token_hash = ?', [tokenHash]);
    if (!f) return null;
    return {
      tokenHash: String(f.token_hash),
      jugadorId: f.jugador_id === null ? null : String(f.jugador_id),
      docente: numero(f.docente) === 1,
      creadaEn: numero(f.creada_en),
      expiraEn: numero(f.expira_en),
    };
  }
  async eliminarSesion(tokenHash: string) {
    await this.ejecutar('DELETE FROM sesiones WHERE token_hash = ?', [tokenHash]);
  }
  async eliminarSesionesDeJugador(jugadorId: string) {
    await this.ejecutar('DELETE FROM sesiones WHERE jugador_id = ?', [jugadorId]);
  }

  // Partidas -------------------------------------------------------------------
  async insertarPartida(p: Partida) {
    await this.ejecutar(
      'INSERT INTO partidas (id, jugador_id, etapa_id, cerrada, datos, version, creada_en, actualizada_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.jugadorId, p.etapaId, p.cerrada ? 1 : 0, datosPartida(p), p.version, p.creadaEn, p.actualizadaEn],
    );
  }
  async obtenerPartida(id: string) {
    const [f] = await this.filas('SELECT * FROM partidas WHERE id = ?', [id]);
    return f ? partidaDesde(f) : null;
  }
  async actualizarPartida(p: Partida) {
    const r = await this.ejecutar('UPDATE partidas SET cerrada = ?, datos = ?, actualizada_en = ?, version = version + 1 WHERE id = ? AND version = ?', [
      p.cerrada ? 1 : 0,
      datosPartida(p),
      p.actualizadaEn,
      p.id,
      p.version,
    ]);
    if (r.affectedRows !== 1) throw new ErrorJuego('CONFLICTO');
    p.version += 1;
  }

  // Ítems ------------------------------------------------------------------------
  async insertarItem(i: ItemGuardado) {
    await this.ejecutar('INSERT INTO items (id, partida_id, jugador_id, terminado, datos, version, emitido_en) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      i.id,
      i.partidaId,
      i.jugadorId,
      i.terminado ? 1 : 0,
      datosItem(i),
      i.version,
      i.emitidoEn,
    ]);
  }
  async obtenerItem(id: string) {
    const [f] = await this.filas('SELECT * FROM items WHERE id = ?', [id]);
    return f ? itemDesde(f) : null;
  }
  async actualizarItem(i: ItemGuardado) {
    const r = await this.ejecutar('UPDATE items SET terminado = ?, datos = ?, version = version + 1 WHERE id = ? AND version = ?', [
      i.terminado ? 1 : 0,
      datosItem(i),
      i.id,
      i.version,
    ]);
    if (r.affectedRows !== 1) throw new ErrorJuego('CONFLICTO');
    i.version += 1;
  }

  // Eventos ----------------------------------------------------------------------
  async registrarEvento(e: Evento) {
    await this.ejecutar(
      `INSERT INTO eventos (curso_id, jugador_id, etapa_id, tipo_item, nivel, resultado, intentos, pistas, diagnostico, relacional, andamiaje, ms, puntos, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.cursoId,
        e.jugadorId,
        e.etapaId,
        e.tipoItem,
        e.nivel,
        e.resultado,
        e.intentos,
        e.pistas,
        e.diagnostico,
        e.relacional ? 1 : 0,
        e.andamiaje ? 1 : 0,
        Math.min(e.ms, 2_000_000_000),
        e.puntos,
        e.fecha,
      ],
    );
  }
  async listarEventos(cursoId: string, limite = 50_000) {
    const tope = Math.max(1, Math.min(Math.floor(limite), 200_000));
    const filas = await this.filas(`SELECT * FROM (SELECT * FROM eventos WHERE curso_id = ? ORDER BY id DESC LIMIT ${tope}) t ORDER BY id`, [cursoId]);
    return filas.map(eventoDesde);
  }
}

function cursoDesde(f: Fila): Curso {
  return { id: String(f.id), codigo: String(f.codigo), nombre: String(f.nombre), nivel: numero(f.nivel), creadoEn: numero(f.creado_en) };
}

export interface ConfigMySQL {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  baseDeDatos: string;
  conexiones?: number;
}

export class AlmacenMySQL implements Almacen {
  readonly pool: Pool;
  private readonly directo: RepoMySQL;

  constructor(config: ConfigMySQL) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.puerto,
      user: config.usuario,
      password: config.clave,
      database: config.baseDeDatos,
      connectionLimit: config.conexiones ?? 5,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: false,
      multipleStatements: false,
    });
    this.directo = new RepoMySQL(this.pool);
  }

  /** Crea las tablas si no existen (idempotente). */
  async migrar(rutaEsquema: string): Promise<void> {
    const sql = await readFile(rutaEsquema, 'utf8');
    const sentencias = sql
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const s of sentencias) await this.pool.query(s);
  }

  /** Limpieza periódica: sesiones vencidas y ejercicios antiguos ya resumidos en eventos. */
  async mantenimiento(ahora: number): Promise<void> {
    await this.pool.execute('DELETE FROM sesiones WHERE expira_en < ?', [ahora]);
    const hace90dias = ahora - 90 * 24 * 3_600_000;
    await this.pool.execute('DELETE FROM items WHERE terminado = 1 AND emitido_en < ?', [hace90dias]);
    await this.pool.execute('DELETE FROM partidas WHERE cerrada = 1 AND actualizada_en < ?', [hace90dias]);
  }

  async transaccion<T>(fn: (tx: Repositorio) => Promise<T>): Promise<T> {
    for (let intento = 1; ; intento++) {
      const conexion = await this.pool.getConnection();
      try {
        await conexion.beginTransaction();
        const resultado = await fn(new RepoMySQL(conexion));
        await conexion.commit();
        return resultado;
      } catch (e) {
        await conexion.rollback().catch(() => undefined);
        const codigo = (e as { code?: string }).code;
        if ((codigo === 'ER_LOCK_DEADLOCK' || codigo === 'ER_LOCK_WAIT_TIMEOUT') && intento < 3) continue;
        throw e;
      } finally {
        conexion.release();
      }
    }
  }

  async cerrar(): Promise<void> {
    await this.pool.end();
  }

  obtenerCurso = (id: string) => this.directo.obtenerCurso(id);
  obtenerCursoPorCodigo = (c: string) => this.directo.obtenerCursoPorCodigo(c);
  listarCursos = () => this.directo.listarCursos();
  insertarCurso = (c: Curso) => this.directo.insertarCurso(c);
  obtenerJugador = (id: string) => this.directo.obtenerJugador(id);
  obtenerJugadorPorApodo = (c: string, a: string) => this.directo.obtenerJugadorPorApodo(c, a);
  listarJugadores = (c: string) => this.directo.listarJugadores(c);
  insertarJugador = (j: Jugador) => this.directo.insertarJugador(j);
  actualizarJugador = (j: Jugador) => this.directo.actualizarJugador(j);
  eliminarJugador = (id: string) => this.directo.eliminarJugador(id);
  insertarSesion = (s: Sesion) => this.directo.insertarSesion(s);
  obtenerSesion = (h: string) => this.directo.obtenerSesion(h);
  eliminarSesion = (h: string) => this.directo.eliminarSesion(h);
  eliminarSesionesDeJugador = (id: string) => this.directo.eliminarSesionesDeJugador(id);
  insertarPartida = (p: Partida) => this.directo.insertarPartida(p);
  obtenerPartida = (id: string) => this.directo.obtenerPartida(id);
  actualizarPartida = (p: Partida) => this.directo.actualizarPartida(p);
  insertarItem = (i: ItemGuardado) => this.directo.insertarItem(i);
  obtenerItem = (id: string) => this.directo.obtenerItem(id);
  actualizarItem = (i: ItemGuardado) => this.directo.actualizarItem(i);
  registrarEvento = (e: Evento) => this.directo.registrarEvento(e);
  listarEventos = (c: string, l?: number) => this.directo.listarEventos(c, l);
}
