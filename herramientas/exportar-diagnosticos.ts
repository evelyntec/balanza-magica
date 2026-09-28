/**
 * Copia los textos de diagnóstico del panel docente a un JSON que usa el
 * reporte semanal en Python. Uso: npx tsx herramientas/exportar-diagnosticos.ts
 * (una prueba avisa si el JSON quedó desactualizado).
 */
import { writeFileSync } from 'node:fs';
import { ETAPAS } from '@balanza/nucleo';
import { DIAGNOSTICOS_DOCENTE } from '../apps/juego/src/diagnosticos';

writeFileSync(new URL('./analisis/diagnosticos.json', import.meta.url), JSON.stringify(DIAGNOSTICOS_DOCENTE, null, 2) + '\n', 'utf8');
console.log(`${Object.keys(DIAGNOSTICOS_DOCENTE).length} diagnósticos exportados a herramientas/analisis/diagnosticos.json`);

const etapas = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nombre]));
writeFileSync(new URL('./analisis/etapas.json', import.meta.url), JSON.stringify(etapas, null, 2) + '\n', 'utf8');
console.log(`${ETAPAS.length} etapas exportadas a herramientas/analisis/etapas.json`);
