import { useEffect, useRef, type ReactNode } from 'react';
import { rangoDe } from '@balanza/nucleo';
import { useEstado } from '../estado';
import { sonidos } from '../sonido';
import { hablar, vozDisponible } from '../voz';
import { Gatito } from './Gatito';
import { Moneda } from './Ilustraciones';

/** Botón para escuchar un texto en voz alta. */
export function BotonVoz({ texto, className = '' }: { texto: string; className?: string }) {
  const { ajustes } = useEstado();
  if (!ajustes.voz || !vozDisponible()) return null;
  return (
    <button
      type="button"
      className={`boton boton--violeta boton--icono ${className}`}
      onClick={() => {
        sonidos.toque();
        hablar(texto);
      }}
      aria-label="Escuchar en voz alta"
      title="Escuchar"
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}

export function Teclado({ alPulsar, alBorrar, alListo, textoListo = 'Listo', deshabilitado = false }: {
  alPulsar: (d: number) => void;
  alBorrar: () => void;
  alListo?: () => void;
  textoListo?: string;
  deshabilitado?: boolean;
}) {
  const pulsar = (d: number) => {
    sonidos.toque();
    alPulsar(d);
  };
  return (
    <div className="teclado" role="group" aria-label="Teclado numérico">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
        <button key={d} type="button" className="tecla" onClick={() => pulsar(d)} disabled={deshabilitado}>
          {d}
        </button>
      ))}
      <button type="button" className="tecla tecla--accion" onClick={alBorrar} disabled={deshabilitado} aria-label="Borrar" style={{ gridColumn: 'span 2' }}>
        ⌫ Borrar
      </button>
      {alListo ? (
        <button type="button" className="boton boton--fucsia" onClick={alListo} disabled={deshabilitado} style={{ gridColumn: 'span 3', minHeight: 52 }}>
          {textoListo}
        </button>
      ) : null}
    </div>
  );
}

export function Modal({ children, alCerrar, etiqueta }: { children: ReactNode; alCerrar?: () => void; etiqueta: string }) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caja.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar?.();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [alCerrar]);
  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={etiqueta} onClick={(e) => e.target === e.currentTarget && alCerrar?.()}>
      <div className="modal tarjeta aparecer" ref={caja} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

export function Avisos() {
  const { avisos } = useEstado();
  return (
    <div className="avisos" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className="aviso aparecer">
          <span className="aviso__icono" aria-hidden="true">
            {a.icono}
          </span>
          <span>{a.texto}</span>
        </div>
      ))}
    </div>
  );
}

/** Aviso cuando el juego se abrió en otra ventana (una sola pestaña activa). */
export function AvisoOtraPestana() {
  const { otraPestana, recuperarPestana, manejarError, ir } = useEstado();
  if (!otraPestana) return null;
  return (
    <Modal etiqueta="Juego abierto en otra ventana">
      <div className="pila centro" style={{ textAlign: 'center' }}>
        <Gatito animo="sorprendido" className="avatar-opcion" />
        <h2>¡El juego se abrió en otra ventana!</h2>
        <p>Solo puedes jugar en una ventana a la vez. ¿Quieres seguir jugando aquí?</p>
        <button
          className="boton boton--fucsia boton--grande"
          onClick={() =>
            void recuperarPestana()
              .then(() => ir({ id: 'mapa' }))
              .catch(manejarError)
          }
        >
          Jugar aquí
        </button>
      </div>
    </Modal>
  );
}

export function Hud({ alVolver, titulo }: { alVolver?: () => void; titulo?: string }) {
  const { perfil, ir, backend } = useEstado();
  if (!perfil) return null;
  const rango = rangoDe(perfil.puntos);
  return (
    <header className="hud">
      {alVolver ? (
        <button className="boton boton--crema boton--icono boton--chico" onClick={alVolver} aria-label="Volver">
          ←
        </button>
      ) : null}
      <button className="hud__jugador" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, textAlign: 'left' }} onClick={() => ir({ id: 'logros' })} aria-label="Ver mis logros">
        <Gatito avatar={perfil.avatar} equipado={perfil.equipado} animo="feliz" className="hud__avatar" titulo={perfil.apodo} />
        <span style={{ minWidth: 0 }}>
          <span className="hud__nombre" style={{ display: 'block' }}>
            {titulo ?? perfil.apodo}
          </span>
          <span className="hud__rango">
            {rango.actual.icono} {rango.actual.nombre}
            {backend.modo === 'practica' ? ' · práctica' : ''}
          </span>
          <span className="hud__barra-rango" style={{ display: 'block' }} title={rango.siguiente ? `Próximo rango: ${rango.siguiente.nombre}` : 'Rango máximo'}>
            <span style={{ width: `${Math.round(rango.progreso * 100)}%` }} />
          </span>
        </span>
      </button>
      <div className="hud__contadores">
        <span className="contador" title="Puntos">
          <span aria-hidden="true">⭐</span>
          <span className="oculto-lector">Puntos:</span>
          {perfil.puntos.toLocaleString('es-CL')}
        </span>
        <span className="contador" title="Monedas">
          <Moneda />
          <span className="oculto-lector">Monedas:</span>
          {perfil.monedas}
        </span>
        {perfil.racha >= 3 ? (
          <span className="contador contador--racha-activa" title="Racha">
            <span aria-hidden="true">🔥</span>
            <span className="oculto-lector">Racha:</span>
            {perfil.racha}
          </span>
        ) : null}
      </div>
    </header>
  );
}

/** Lluvia de confeti en canvas (se omite con movimiento reducido). */
export function Confeti({ activo }: { activo: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!activo || !lienzo.current) return;
    if (document.documentElement.dataset.movimiento === 'reducido' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const c = lienzo.current;
    const g = c.getContext('2d');
    if (!g) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const colores = ['#f5b82e', '#e0457b', '#7b3fbf', '#2fb37a', '#2f8fce', '#ffd873'];
    const piezas = Array.from({ length: 140 }, () => ({
      x: c.width / 2 + (Math.random() - 0.5) * 120,
      y: c.height * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 16 - 6,
      giro: Math.random() * Math.PI,
      vg: (Math.random() - 0.5) * 0.3,
      color: colores[Math.floor(Math.random() * colores.length)] as string,
      t: 6 + Math.random() * 8,
    }));
    let cuadro = 0;
    let vida = 0;
    const paso = () => {
      vida++;
      g.clearRect(0, 0, c.width, c.height);
      for (const p of piezas) {
        p.vy += 0.45;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.giro += p.vg;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.giro);
        g.fillStyle = p.color;
        g.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2);
        g.restore();
      }
      if (vida < 150) cuadro = requestAnimationFrame(paso);
      else g.clearRect(0, 0, c.width, c.height);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [activo]);
  return <canvas ref={lienzo} className="confeti" aria-hidden="true" />;
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="centro pila" style={{ minHeight: '60vh', color: '#fff' }}>
      <Gatito animo="pensando" className="avatar-opcion" />
      <p style={{ fontWeight: 800 }}>{texto}</p>
    </div>
  );
}
