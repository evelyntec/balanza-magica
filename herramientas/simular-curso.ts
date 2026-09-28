/**
 * Simula un curso ficticio de 1° básico jugando la Pradera de las Frutas y
 * exporta el CSV que descargaría la profesora. Sirve para probar el análisis
 * en Python sin usar datos de estudiantes reales.
 *
 *   npx tsx herramientas/simular-curso.ts > herramientas/analisis/datos_ejemplo.csv
 */

import {
  AlmacenMemoria,
  Limitador,
  ServicioJuego,
  crearAzar,
  mecanica,
  type Contexto,
  type ItemGuardado,
  type VistaItem,
} from '../packages/nucleo/src/index';
import { respuestaCorrecta, respuestaIncorrecta } from '../packages/nucleo/test/ayudas';

const azar = crearAzar('curso-ficticio-2026');
let t = Date.UTC(2026, 8, 1, 12);
const almacen = new AlmacenMemoria();
const servicio = new ServicioJuego(almacen, {
  reloj: () => t,
  iteracionesClave: 1000,
  limitador: new Limitador({ capacidad: 1e9, recargaPorSegundo: 1e9 }),
});

const ANIMALES = ['Tigre', 'Cóndor', 'Pudú', 'Huemul', 'Delfín', 'Zorro', 'Búho', 'Lince', 'Colibrí', 'Pingüino', 'Puma', 'Chinchilla'];
const ADJETIVOS = ['Veloz', 'Brillante', 'Curioso', 'Valiente', 'Alegre', 'Astuto', 'Mágico', 'Estelar', 'Sabio', 'Genial'];

async function jugarEtapa(ctx: Contexto, etapaId: string, habilidad: number, tendenciaIgual: number) {
  let { partida, item } = await servicio.iniciarEtapa(ctx, etapaId);
  for (let n = 0; n < 45; n++) {
    const g = (await almacen.obtenerItem(item.id)) as ItemGuardado;
    const m = mecanica(g.tipo);
    // Dificultad: más nivel, menos probabilidad de acierto.
    const pAcierto = Math.max(0.15, Math.min(0.97, habilidad - (g.nivel - 1) * 0.08));
    if (azar.probabilidad(0.12 * (1 - habilidad))) {
      t += 2000;
      await servicio.pista(ctx, item.id);
    }
    let cierre = null;
    for (let intento = 0; intento < m.maxIntentos && !cierre; intento++) {
      t += 3000 + azar.entero(0, 25_000);
      const acierta = azar.probabilidad(pAcierto) || intento >= 2;
      let r = acierta ? respuestaCorrecta(g.tipo, g.publico, g.secreto) : respuestaIncorrecta(g.tipo, g.publico, g.secreto);
      // Algunas y algunos tienen la concepción operacional del "=".
      if (!acierta && g.tipo === 'equilibrar' && azar.probabilidad(tendenciaIgual)) {
        const p = g.publico as { izquierda: { tipo: string; cantidad?: number; valor?: number }[]; derecha: typeof p.izquierda; ladoCaja: string };
        const otro = p.ladoCaja === 'izquierda' ? p.derecha : p.izquierda;
        r = otro.reduce((s, o) => s + (o.cantidad ?? o.valor ?? 0), 0);
      }
      cierre = m.modo === 'pesada' ? (await servicio.pesar(ctx, item.id, r)).cierre : (await servicio.responder(ctx, item.id, r)).cierre;
    }
    if (cierre?.fin) return cierre.fin.superada;
    const sig = await servicio.itemActual(ctx, partida.id);
    partida = sig.partida;
    if (!sig.item) return false;
    item = sig.item as VistaItem;
  }
  return false;
}

async function main() {
  const curso = await servicio.crearCurso({ nombre: '1° A (ficticio)', nivel: 1 });
  const usados = new Set<string>();
  for (let i = 0; i < 24; i++) {
    let apodo = '';
    do apodo = `${azar.elegir(ANIMALES)} ${azar.elegir(ADJETIVOS)} ${azar.entero(10, 99)}`;
    while (usados.has(apodo));
    usados.add(apodo);
    const { perfil } = await servicio.registrarAlumno({ codigoCurso: curso.codigo, apodo, avatar: 'gatito', clave: ['gato', 'oso', 'pez'] });
    const { pestana } = await servicio.tomarPestana(perfil.id);
    const ctx = { jugadorId: perfil.id, pestana };
    const habilidad = 0.45 + azar.siguiente() * 0.5;
    const tendenciaIgual = azar.probabilidad(0.4) ? 0.8 : 0.1;
    for (const etapa of ['1-1', '1-2', '1-3', '1-4', '1-J']) {
      t += azar.entero(1, 3) * 86_400_000 * (azar.probabilidad(0.3) ? 1 : 0) + 600_000;
      let superada = await jugarEtapa(ctx, etapa, habilidad, tendenciaIgual);
      if (!superada) superada = await jugarEtapa(ctx, etapa, habilidad + 0.1, tendenciaIgual);
      if (!superada) break;
    }
  }
  process.stdout.write(await servicio.eventosCSV(curso.id));
}

void main();
