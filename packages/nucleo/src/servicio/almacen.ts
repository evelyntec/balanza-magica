/**
 * Almacenamiento. El servicio del juego trabaja contra esta interfaz;
 * hay dos implementaciones:
 *  - AlmacenMemoria (aquí): pruebas y modo práctica sin conexión.
 *  - AlmacenMySQL (apps/servidor): producción en el hosting.
 *
 * Toda operación que cambia puntos se hace dentro de `transaccion`, que
 * bloquea al jugador (SELECT … FOR UPDATE en MySQL) y aplica todos los
 * cambios o ninguno.
 */

import { ErrorJuego } from './errores';
import type { Curso, Evento, ItemGuardado, Jugador, Partida, Sesion } from './modelos';

export interface Repositorio {
  obtenerCurso(id: string): Promise<Curso | null>;
  obtenerCursoPorCodigo(codigo: string): Promise<Curso | null>;
  listarCursos(): Promise<Curso[]>;
  insertarCurso(c: Curso): Promise<void>;

  /** Con `bloquear`, la fila queda reservada hasta el fin de la transacción. */
  obtenerJugador(id: string, opciones?: { bloquear?: boolean }): Promise<Jugador | null>;
  obtenerJugadorPorApodo(cursoId: string, apodoClave: string): Promise<Jugador | null>;
  listarJugadores(cursoId: string): Promise<Jugador[]>;
  insertarJugador(j: Jugador): Promise<void>;
  /** Compara y actualiza por versión; incrementa `j.version`. */
  actualizarJugador(j: Jugador): Promise<void>;
  eliminarJugador(id: string): Promise<void>;

  insertarSesion(s: Sesion): Promise<void>;
  obtenerSesion(tokenHash: string): Promise<Sesion | null>;
  eliminarSesion(tokenHash: string): Promise<void>;
  eliminarSesionesDeJugador(jugadorId: string): Promise<void>;

  insertarPartida(p: Partida): Promise<void>;
  obtenerPartida(id: string): Promise<Partida | null>;
  actualizarPartida(p: Partida): Promise<void>;

  insertarItem(i: ItemGuardado): Promise<void>;
  obtenerItem(id: string): Promise<ItemGuardado | null>;
  actualizarItem(i: ItemGuardado): Promise<void>;

  registrarEvento(e: Evento): Promise<void>;
  listarEventos(cursoId: string, limite?: number): Promise<Evento[]>;
}

export interface Almacen extends Repositorio {
  transaccion<T>(fn: (tx: Repositorio) => Promise<T>): Promise<T>;
}

// ---------------------------------------------------------------------------
// Implementación en memoria (con transacciones de verdad: todo o nada)
// ---------------------------------------------------------------------------

type Coleccion = 'cursos' | 'jugadores' | 'sesiones' | 'partidas' | 'items';

interface Datos {
  cursos: Map<string, Curso>;
  jugadores: Map<string, Jugador>;
  sesiones: Map<string, Sesion>;
  partidas: Map<string, Partida>;
  items: Map<string, ItemGuardado>;
  eventos: Evento[];
}

export interface Instantanea {
  cursos: Curso[];
  jugadores: Jugador[];
  sesiones: Sesion[];
  partidas: Partida[];
  items: ItemGuardado[];
  eventos: Evento[];
}

const copiar = <T>(x: T): T => structuredClone(x);

class RepoMemoria implements Repositorio {
  private readonly cambios = new Map<Coleccion, Map<string, unknown | null>>();
  private readonly eventosNuevos: Evento[] = [];
  private readonly eventosEliminados = new Set<string>();

  constructor(
    private readonly datos: Datos,
    private readonly directo: boolean,
  ) {}

  private leer<T>(col: Coleccion, id: string): T | null {
    const capa = this.cambios.get(col);
    if (capa?.has(id)) {
      const v = capa.get(id);
      return v === null ? null : copiar(v as T);
    }
    const base = (this.datos[col] as Map<string, T>).get(id);
    return base === undefined ? null : copiar(base);
  }

  private todos<T>(col: Coleccion): T[] {
    const resultado = new Map<string, T>();
    for (const [id, v] of this.datos[col] as Map<string, T>) resultado.set(id, v);
    for (const [id, v] of this.cambios.get(col) ?? []) {
      if (v === null) resultado.delete(id);
      else resultado.set(id, v as T);
    }
    return [...resultado.values()].map(copiar);
  }

  private escribir(col: Coleccion, id: string, valor: unknown | null): void {
    if (this.directo) {
      const mapa = this.datos[col] as Map<string, unknown>;
      if (valor === null) mapa.delete(id);
      else mapa.set(id, copiar(valor));
      return;
    }
    if (!this.cambios.has(col)) this.cambios.set(col, new Map());
    (this.cambios.get(col) as Map<string, unknown | null>).set(id, valor === null ? null : copiar(valor));
  }

  private actualizarConVersion<T extends { id: string; version: number }>(col: Coleccion, obj: T): void {
    const actual = this.leer<T>(col, obj.id);
    if (!actual) throw new ErrorJuego('NO_ENCONTRADO');
    if (actual.version !== obj.version) throw new ErrorJuego('CONFLICTO');
    obj.version += 1;
    this.escribir(col, obj.id, obj);
  }

  confirmar(): void {
    for (const [col, capa] of this.cambios) {
      const mapa = this.datos[col] as Map<string, unknown>;
      for (const [id, v] of capa) {
        if (v === null) mapa.delete(id);
        else mapa.set(id, v);
      }
    }
    this.datos.eventos.push(...this.eventosNuevos);
    if (this.eventosEliminados.size > 0) {
      this.datos.eventos = this.datos.eventos.filter((e) => !this.eventosEliminados.has(e.jugadorId));
    }
    this.cambios.clear();
    this.eventosNuevos.length = 0;
    this.eventosEliminados.clear();
  }

  async obtenerCurso(id: string) {
    return this.leer<Curso>('cursos', id);
  }
  async obtenerCursoPorCodigo(codigo: string) {
    return this.todos<Curso>('cursos').find((c) => c.codigo === codigo) ?? null;
  }
  async listarCursos() {
    return this.todos<Curso>('cursos').sort((a, b) => a.creadoEn - b.creadoEn);
  }
  async insertarCurso(c: Curso) {
    if (this.todos<Curso>('cursos').some((x) => x.codigo === c.codigo || x.id === c.id)) throw new ErrorJuego('DUPLICADO');
    this.escribir('cursos', c.id, c);
  }

  async obtenerJugador(id: string) {
    return this.leer<Jugador>('jugadores', id);
  }
  async obtenerJugadorPorApodo(cursoId: string, apodoClave: string) {
    return this.todos<Jugador>('jugadores').find((j) => j.cursoId === cursoId && j.apodoClave === apodoClave) ?? null;
  }
  async listarJugadores(cursoId: string) {
    return this.todos<Jugador>('jugadores')
      .filter((j) => j.cursoId === cursoId)
      .sort((a, b) => a.creadoEn - b.creadoEn);
  }
  async insertarJugador(j: Jugador) {
    if (await this.obtenerJugadorPorApodo(j.cursoId, j.apodoClave)) throw new ErrorJuego('DUPLICADO');
    this.escribir('jugadores', j.id, j);
  }
  async actualizarJugador(j: Jugador) {
    this.actualizarConVersion('jugadores', j);
  }
  /** Elimina al jugador y TODO lo suyo (sesiones, partidas, ejercicios y eventos). */
  async eliminarJugador(id: string) {
    this.escribir('jugadores', id, null);
    for (const s of this.todos<Sesion>('sesiones')) if (s.jugadorId === id) this.escribir('sesiones', s.tokenHash, null);
    for (const p of this.todos<Partida>('partidas')) if (p.jugadorId === id) this.escribir('partidas', p.id, null);
    for (const i of this.todos<ItemGuardado>('items')) if (i.jugadorId === id) this.escribir('items', i.id, null);
    if (this.directo) this.datos.eventos = this.datos.eventos.filter((e) => e.jugadorId !== id);
    else this.eventosEliminados.add(id);
  }

  async insertarSesion(s: Sesion) {
    this.escribir('sesiones', s.tokenHash, s);
  }
  async obtenerSesion(tokenHash: string) {
    return this.leer<Sesion>('sesiones', tokenHash);
  }
  async eliminarSesion(tokenHash: string) {
    this.escribir('sesiones', tokenHash, null);
  }
  async eliminarSesionesDeJugador(jugadorId: string) {
    for (const s of this.todos<Sesion>('sesiones')) if (s.jugadorId === jugadorId) this.escribir('sesiones', s.tokenHash, null);
  }

  async insertarPartida(p: Partida) {
    this.escribir('partidas', p.id, p);
  }
  async obtenerPartida(id: string) {
    return this.leer<Partida>('partidas', id);
  }
  async actualizarPartida(p: Partida) {
    this.actualizarConVersion('partidas', p);
  }

  async insertarItem(i: ItemGuardado) {
    this.escribir('items', i.id, i);
  }
  async obtenerItem(id: string) {
    return this.leer<ItemGuardado>('items', id);
  }
  async actualizarItem(i: ItemGuardado) {
    this.actualizarConVersion('items', i);
  }

  async registrarEvento(e: Evento) {
    if (this.directo) this.datos.eventos.push(copiar(e));
    else this.eventosNuevos.push(copiar(e));
  }
  async listarEventos(cursoId: string, limite = 50_000) {
    return [...this.datos.eventos, ...this.eventosNuevos]
      .filter((e) => e.cursoId === cursoId && !this.eventosEliminados.has(e.jugadorId))
      .slice(-limite)
      .map(copiar);
  }
}

export class AlmacenMemoria implements Almacen {
  private readonly datos: Datos = {
    cursos: new Map(),
    jugadores: new Map(),
    sesiones: new Map(),
    partidas: new Map(),
    items: new Map(),
    eventos: [],
  };
  private readonly directo: RepoMemoria;
  private cola: Promise<unknown> = Promise.resolve();
  /** Se llama después de cada cambio confirmado (p. ej. para guardar en localStorage). */
  alCambiar: (() => void) | null = null;

  constructor(inicial?: Instantanea) {
    if (inicial) this.importar(inicial);
    this.directo = new RepoMemoria(this.datos, true);
  }

  transaccion<T>(fn: (tx: Repositorio) => Promise<T>): Promise<T> {
    const ejecutar = async (): Promise<T> => {
      const tx = new RepoMemoria(this.datos, false);
      const resultado = await fn(tx);
      tx.confirmar();
      this.alCambiar?.();
      return resultado;
    };
    const promesa = this.cola.then(ejecutar, ejecutar);
    this.cola = promesa.catch(() => undefined);
    return promesa;
  }

  exportar(): Instantanea {
    return copiar({
      cursos: [...this.datos.cursos.values()],
      jugadores: [...this.datos.jugadores.values()],
      sesiones: [...this.datos.sesiones.values()],
      partidas: [...this.datos.partidas.values()],
      items: [...this.datos.items.values()],
      eventos: this.datos.eventos,
    });
  }

  importar(x: Instantanea): void {
    this.datos.cursos = new Map(x.cursos.map((c) => [c.id, c]));
    this.datos.jugadores = new Map(x.jugadores.map((j) => [j.id, j]));
    this.datos.sesiones = new Map(x.sesiones.map((s) => [s.tokenHash, s]));
    this.datos.partidas = new Map(x.partidas.map((p) => [p.id, p]));
    this.datos.items = new Map(x.items.map((i) => [i.id, i]));
    this.datos.eventos = [...x.eventos];
  }

  // Operaciones fuera de transacción (lecturas y escrituras simples).
  private async fuera<T>(fn: (r: Repositorio) => Promise<T>): Promise<T> {
    const r = await fn(this.directo);
    return r;
  }

  obtenerCurso = (id: string) => this.fuera((r) => r.obtenerCurso(id));
  obtenerCursoPorCodigo = (c: string) => this.fuera((r) => r.obtenerCursoPorCodigo(c));
  listarCursos = () => this.fuera((r) => r.listarCursos());
  insertarCurso = (c: Curso) => this.transaccion((r) => r.insertarCurso(c));
  obtenerJugador = (id: string) => this.fuera((r) => r.obtenerJugador(id));
  obtenerJugadorPorApodo = (c: string, a: string) => this.fuera((r) => r.obtenerJugadorPorApodo(c, a));
  listarJugadores = (c: string) => this.fuera((r) => r.listarJugadores(c));
  insertarJugador = (j: Jugador) => this.transaccion((r) => r.insertarJugador(j));
  actualizarJugador = (j: Jugador) => this.transaccion((r) => r.actualizarJugador(j));
  eliminarJugador = (id: string) => this.transaccion((r) => r.eliminarJugador(id));
  insertarSesion = (s: Sesion) => this.transaccion((r) => r.insertarSesion(s));
  obtenerSesion = (h: string) => this.fuera((r) => r.obtenerSesion(h));
  eliminarSesion = (h: string) => this.transaccion((r) => r.eliminarSesion(h));
  eliminarSesionesDeJugador = (id: string) => this.transaccion((r) => r.eliminarSesionesDeJugador(id));
  insertarPartida = (p: Partida) => this.transaccion((r) => r.insertarPartida(p));
  obtenerPartida = (id: string) => this.fuera((r) => r.obtenerPartida(id));
  actualizarPartida = (p: Partida) => this.transaccion((r) => r.actualizarPartida(p));
  insertarItem = (i: ItemGuardado) => this.transaccion((r) => r.insertarItem(i));
  obtenerItem = (id: string) => this.fuera((r) => r.obtenerItem(id));
  actualizarItem = (i: ItemGuardado) => this.transaccion((r) => r.actualizarItem(i));
  registrarEvento = (e: Evento) => this.transaccion((r) => r.registrarEvento(e));
  listarEventos = (c: string, l?: number) => this.fuera((r) => r.listarEventos(c, l));
}
