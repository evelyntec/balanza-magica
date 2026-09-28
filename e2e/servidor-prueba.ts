/**
 * Servidor real (Express + servicio) levantado dentro de la prueba, con el
 * juego compilado. La prueba puede leer el almacén para saber la respuesta
 * correcta (como lo haría una profesora mirando la base de datos), nunca
 * mediante la API pública.
 */

import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { AlmacenMemoria, Limitador, ServicioJuego, hashClave } from '@balanza/nucleo';
import { crearApp } from '../apps/servidor/src/app';

export const CLAVE_DOCENTE = 'clave-docente-de-prueba';

export async function levantarServidor() {
  const almacen = new AlmacenMemoria();
  const servicio = new ServicioJuego(almacen, {
    iteracionesClave: 1000,
    claveDocente: await hashClave(CLAVE_DOCENTE, undefined, 1000),
    limitador: new Limitador({ capacidad: 20, recargaPorSegundo: 10 }),
  });
  const app = crearApp(servicio, { produccion: false, origenes: [], estaticos: path.resolve(process.cwd(), 'apps', 'juego', 'dist') });
  const servidor: Server = await new Promise((ok) => {
    const s = app.listen(0, () => ok(s));
  });
  const puerto = (servidor.address() as AddressInfo).port;
  return {
    almacen,
    servicio,
    url: `http://localhost:${puerto}`,
    cerrar: () => new Promise<void>((ok) => servidor.close(() => ok())),
  };
}
