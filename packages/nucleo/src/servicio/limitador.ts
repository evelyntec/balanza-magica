/**
 * Limitador de ritmo por "cubeta de fichas": permite ráfagas cortas
 * (tocar varios botones seguidos) pero frena clics masivos o bots.
 */

export interface OpcionesLimitador {
  capacidad: number;
  recargaPorSegundo: number;
  /** Máximo de claves recordadas (evita crecer sin límite). */
  maxClaves?: number;
}

interface Cubeta {
  fichas: number;
  actualizada: number;
}

export class Limitador {
  private readonly cubetas = new Map<string, Cubeta>();
  private readonly capacidad: number;
  private readonly recarga: number;
  private readonly maxClaves: number;

  constructor(opciones: OpcionesLimitador) {
    this.capacidad = opciones.capacidad;
    this.recarga = opciones.recargaPorSegundo;
    this.maxClaves = opciones.maxClaves ?? 10_000;
  }

  /** true si se permite la acción (y consume una ficha). */
  permitir(clave: string, ahora: number, costo = 1): boolean {
    let c = this.cubetas.get(clave);
    if (!c) {
      if (this.cubetas.size >= this.maxClaves) {
        const primera = this.cubetas.keys().next().value;
        if (primera !== undefined) this.cubetas.delete(primera);
      }
      c = { fichas: this.capacidad, actualizada: ahora };
      this.cubetas.set(clave, c);
    }
    const transcurrido = Math.max(0, ahora - c.actualizada) / 1000;
    c.fichas = Math.min(this.capacidad, c.fichas + transcurrido * this.recarga);
    c.actualizada = ahora;
    if (c.fichas < costo) return false;
    c.fichas -= costo;
    return true;
  }
}
