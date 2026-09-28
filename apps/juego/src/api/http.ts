import type { Curso, Perfil, Ranura } from '@balanza/nucleo';
import { ErrorApi, type Backend, type Ranking, type ResumenCurso } from './backend';

/** Backend del modo clase: habla con el servidor del colegio. */
export class BackendHttp implements Backend {
  readonly modo = 'clase' as const;
  private pestana = '';

  constructor(private readonly base = '/api') {}

  private async pedir<T>(metodo: 'GET' | 'POST' | 'DELETE', ruta: string, cuerpo?: unknown): Promise<T> {
    let respuesta: Response;
    try {
      respuesta = await fetch(this.base + ruta, {
        method: metodo,
        credentials: 'same-origin',
        headers: {
          'x-balanza': '1',
          ...(this.pestana ? { 'x-pestana': this.pestana } : {}),
          ...(cuerpo !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
      });
    } catch {
      throw new ErrorApi('SIN_CONEXION', 'No hay conexión con el servidor. Revisa internet e intenta otra vez.');
    }
    const datos = (await respuesta.json().catch(() => null)) as { error?: { codigo: string; mensaje: string } } | null;
    if (!respuesta.ok) {
      throw new ErrorApi(datos?.error?.codigo ?? 'INTERNO', datos?.error?.mensaje ?? 'Algo falló. Intenta de nuevo.', respuesta.status);
    }
    return datos as T;
  }

  async yo(): Promise<Perfil | null> {
    try {
      return await this.pedir<Perfil>('GET', '/yo');
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) return null;
      throw e;
    }
  }

  async tomarPestana(): Promise<void> {
    const { pestana } = await this.pedir<{ pestana: string }>('POST', '/pestana', {});
    this.pestana = pestana;
  }

  async sugerirApodos() {
    return (await this.pedir<{ apodos: string[] }>('GET', '/apodos-sugeridos')).apodos;
  }

  curso(codigo: string) {
    return this.pedir<{ curso: { nombre: string; nivel: number }; alumnos: { apodo: string; avatar: string }[] }>(
      'GET',
      `/cursos/${encodeURIComponent(codigo.trim().toUpperCase())}`,
    );
  }

  async registrar(datos: { codigoCurso: string; apodo: string; avatar: string; clave: string[] }) {
    return (await this.pedir<{ perfil: Perfil }>('POST', '/alumnos/registro', datos)).perfil;
  }

  async ingresar(datos: { codigoCurso: string; apodo: string; clave: string[] }) {
    return (await this.pedir<{ perfil: Perfil }>('POST', '/alumnos/ingreso', datos)).perfil;
  }

  async salir() {
    await this.pedir('POST', '/salir', {});
    this.pestana = '';
  }

  iniciarEtapa(etapaId: string) {
    return this.pedir<Awaited<ReturnType<Backend['iniciarEtapa']>>>('POST', `/etapas/${encodeURIComponent(etapaId)}/iniciar`, {});
  }
  itemActual(partidaId: string) {
    return this.pedir<Awaited<ReturnType<Backend['itemActual']>>>('POST', `/partidas/${encodeURIComponent(partidaId)}/actual`, {});
  }
  pista(itemId: string) {
    return this.pedir<Awaited<ReturnType<Backend['pista']>>>('POST', `/items/${encodeURIComponent(itemId)}/pista`, {});
  }
  pesar(itemId: string, propuesta: number) {
    return this.pedir<Awaited<ReturnType<Backend['pesar']>>>('POST', `/items/${encodeURIComponent(itemId)}/pesar`, { propuesta });
  }
  responder(itemId: string, respuesta: unknown) {
    return this.pedir<Awaited<ReturnType<Backend['responder']>>>('POST', `/items/${encodeURIComponent(itemId)}/responder`, { respuesta });
  }
  abandonar(partidaId: string) {
    return this.pedir<Perfil>('POST', `/partidas/${encodeURIComponent(partidaId)}/abandonar`, {});
  }
  comprar(articuloId: string) {
    return this.pedir<Perfil>('POST', '/tienda/comprar', { articuloId });
  }
  equipar(ranura: Ranura, articuloId: string | null) {
    return this.pedir<Perfil>('POST', '/tienda/equipar', { ranura, articuloId });
  }
  ranking() {
    return this.pedir<Ranking>('GET', '/ranking');
  }

  async docenteIngresar(clave: string) {
    await this.pedir('POST', '/docente/ingreso', { clave });
  }
  async docenteCursos() {
    return (await this.pedir<{ cursos: Curso[] }>('GET', '/docente/cursos')).cursos;
  }
  async docenteCrearCurso(nombre: string, nivel: number) {
    return (await this.pedir<{ curso: Curso }>('POST', '/docente/cursos', { nombre, nivel })).curso;
  }
  docenteResumen(cursoId: string) {
    return this.pedir<ResumenCurso>('GET', `/docente/cursos/${encodeURIComponent(cursoId)}`);
  }
  docenteUrlCsv(cursoId: string) {
    return `${this.base}/docente/cursos/${encodeURIComponent(cursoId)}/eventos.csv`;
  }
  async docenteRestablecerClave(jugadorId: string, clave: string[]) {
    await this.pedir('POST', `/docente/jugadores/${encodeURIComponent(jugadorId)}/clave`, { clave });
  }
  async docenteEliminar(jugadorId: string) {
    await this.pedir('DELETE', `/docente/jugadores/${encodeURIComponent(jugadorId)}`);
  }
}
