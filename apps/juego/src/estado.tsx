import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Perfil } from '@balanza/nucleo';
import { esErrorApi, type Backend } from './api/backend';
import { activarSonido } from './sonido';
import { ajustarVelocidad, callar } from './voz';

export type Pantalla =
  | { id: 'cargando' }
  | { id: 'bienvenida' }
  | { id: 'ingreso' }
  | { id: 'practica' }
  | { id: 'mapa' }
  | { id: 'isla'; isla: number }
  | { id: 'juego'; etapaId: string }
  | { id: 'tienda' }
  | { id: 'logros' }
  | { id: 'ranking' }
  | { id: 'ajustes' }
  | { id: 'docente' };

export interface Ajustes {
  sonido: boolean;
  voz: boolean;
  lecturaAutomatica: boolean;
  pizarra: boolean;
  movimientoReducido: boolean;
  velocidadVoz: number;
}

export interface Aviso {
  id: number;
  icono: string;
  texto: string;
}

interface Estado {
  backend: Backend;
  perfil: Perfil | null;
  setPerfil: (p: Perfil | null) => void;
  refrescarPerfil: () => Promise<void>;
  pantalla: Pantalla;
  /** Cambia en cada navegación (para reiniciar pantallas con los mismos datos). */
  visita: number;
  ir: (p: Pantalla) => void;
  ajustes: Ajustes;
  cambiarAjustes: (cambios: Partial<Ajustes>) => void;
  avisos: Aviso[];
  avisar: (icono: string, texto: string) => void;
  otraPestana: boolean;
  manejarError: (e: unknown) => string;
  recuperarPestana: () => Promise<void>;
}

const Contexto = createContext<Estado | null>(null);

const CLAVE_AJUSTES = 'balanza-magica:ajustes';

function leerAjustes(): Ajustes | null {
  try {
    const t = localStorage.getItem(CLAVE_AJUSTES);
    return t ? (JSON.parse(t) as Ajustes) : null;
  } catch {
    return null;
  }
}

const AJUSTES_BASE: Ajustes = {
  sonido: true,
  voz: true,
  lecturaAutomatica: true,
  pizarra: false,
  movimientoReducido: false,
  velocidadVoz: 0.95,
};

export function ProveedorEstado({ backend, children }: { backend: Backend; children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [pantalla, setPantalla] = useState<Pantalla>({ id: 'cargando' });
  const [visita, setVisita] = useState(0);
  const [ajustes, setAjustes] = useState<Ajustes>(() => ({ ...AJUSTES_BASE, ...(leerAjustes() ?? {}) }));
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [otraPestana, setOtraPestana] = useState(false);
  const contador = useRef(0);

  useEffect(() => {
    activarSonido(ajustes.sonido);
    ajustarVelocidad(ajustes.velocidadVoz);
    document.documentElement.dataset.pizarra = ajustes.pizarra ? 'si' : 'no';
    document.documentElement.dataset.movimiento = ajustes.movimientoReducido ? 'reducido' : 'normal';
    if (!ajustes.voz) callar();
    try {
      localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
    } catch {
      // Sin almacenamiento: los ajustes duran esta sesión.
    }
  }, [ajustes]);

  const cambiarAjustes = useCallback((cambios: Partial<Ajustes>) => setAjustes((a) => ({ ...a, ...cambios })), []);

  const avisar = useCallback((icono: string, texto: string) => {
    const id = ++contador.current;
    setAvisos((lista) => [...lista.slice(-1), { id, icono, texto }]);
    window.setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 3800);
  }, []);

  const ir = useCallback((p: Pantalla) => {
    callar();
    setPantalla(p);
    setVisita((v) => v + 1);
    window.scrollTo({ top: 0 });
  }, []);

  const refrescarPerfil = useCallback(async () => {
    const p = await backend.yo();
    setPerfil(p);
  }, [backend]);

  const manejarError = useCallback(
    (e: unknown): string => {
      if (esErrorApi(e)) {
        if (e.codigo === 'OTRA_PESTANA') setOtraPestana(true);
        if (e.codigo === 'NO_AUTENTICADO') {
          setPerfil(null);
          setPantalla({ id: 'bienvenida' });
        }
        return e.message;
      }
      console.error(e);
      return 'Ups, algo falló. Intenta de nuevo.';
    },
    [],
  );

  const recuperarPestana = useCallback(async () => {
    await backend.tomarPestana();
    setOtraPestana(false);
  }, [backend]);

  const valor = useMemo<Estado>(
    () => ({
      backend,
      perfil,
      setPerfil,
      refrescarPerfil,
      pantalla,
      visita,
      ir,
      ajustes,
      cambiarAjustes,
      avisos,
      avisar,
      otraPestana,
      manejarError,
      recuperarPestana,
    }),
    [backend, perfil, refrescarPerfil, pantalla, visita, ir, ajustes, cambiarAjustes, avisos, avisar, otraPestana, manejarError, recuperarPestana],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEstado(): Estado {
  const e = useContext(Contexto);
  if (!e) throw new Error('useEstado fuera del proveedor');
  return e;
}
