import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ETAPAS } from '@balanza/nucleo';
import { DIAGNOSTICOS_DOCENTE } from './diagnosticos';

describe('textos de diagnóstico para la docente', () => {
  it('el JSON del reporte semanal está sincronizado (npx tsx herramientas/exportar-diagnosticos.ts)', () => {
    const json = JSON.parse(readFileSync(new URL('../../../herramientas/analisis/diagnosticos.json', import.meta.url), 'utf8'));
    expect(json).toEqual(DIAGNOSTICOS_DOCENTE);
  });

  it('los nombres de etapas del reporte semanal están sincronizados', () => {
    const json = JSON.parse(readFileSync(new URL('../../../herramientas/analisis/etapas.json', import.meta.url), 'utf8'));
    expect(json).toEqual(Object.fromEntries(ETAPAS.map((e) => [e.id, e.nombre])));
  });

  it('cada diagnóstico tiene título y sugerencia', () => {
    for (const d of Object.values(DIAGNOSTICOS_DOCENTE)) {
      expect(d.titulo.length).toBeGreaterThan(5);
      expect(d.sugerencia.length).toBeGreaterThan(10);
    }
  });
});
