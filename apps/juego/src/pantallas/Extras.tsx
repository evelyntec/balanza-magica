import { useEffect, useState } from 'react';
import { INSIGNIAS, RANGOS, TIENDA, rangoDe, type Articulo, type Ranura } from '@balanza/nucleo';
import { useEstado } from '../estado';
import type { Ranking as DatosRanking } from '../api/backend';
import { Cargando, Hud } from '../componentes/Comunes';
import { Balanza } from '../componentes/Balanza';
import { Gatito } from '../componentes/Gatito';
import { Moneda } from '../componentes/Ilustraciones';
import { sonidos } from '../sonido';
import { vozDisponible } from '../voz';

function VistaArticulo({ a, avatar }: { a: Articulo; avatar: string }) {
  if (a.ranura === 'balanza') {
    return (
      <div className="articulo__vista">
        <Balanza izquierda={[{ tipo: 'pesa', valor: 3 }]} derecha={[{ tipo: 'pesa', valor: 3 }]} angulo={0} estilo={a.id} titulo={a.nombre} />
      </div>
    );
  }
  return <Gatito avatar={avatar} equipado={{ [a.ranura]: a.id }} animo="feliz" className="articulo__vista" titulo={a.nombre} />;
}

export function Tienda() {
  const { perfil, setPerfil, backend, ir, avisar, manejarError } = useEstado();
  const [ocupado, setOcupado] = useState(false);
  if (!perfil) return null;

  const accion = (fn: () => Promise<Awaited<ReturnType<typeof backend.comprar>>>, mensaje: string) => {
    setOcupado(true);
    fn()
      .then((p) => {
        setPerfil(p);
        sonidos.moneda();
        avisar('🎉', mensaje);
      })
      .catch((e) => avisar('⚠️', manejarError(e)))
      .finally(() => setOcupado(false));
  };

  return (
    <>
      <Hud alVolver={() => ir({ id: 'mapa' })} />
      <div className="contenido pila">
        <h1 className="titulo-magico" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          Tienda de Gatito
        </h1>
        <div className="tarjeta fila centro">
          <Gatito avatar={perfil.avatar} equipado={perfil.equipado} animo="feliz" className="avatar-opcion" titulo="Tu gatito" />
          <div>
            <p style={{ margin: 0, fontWeight: 800 }}>Tienes</p>
            <p className="numero-grande" style={{ margin: 0, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              {perfil.monedas} <Moneda tamano={32} />
            </p>
            <p style={{ margin: 0 }}>Gana monedas resolviendo desafíos a la primera y con insignias.</p>
          </div>
        </div>
        <div className="grilla-tienda">
          {TIENDA.map((a) => {
            const tiene = perfil.inventario.includes(a.id);
            const puesto = perfil.equipado[a.ranura] === a.id;
            return (
              <div key={a.id} className="tarjeta articulo">
                <VistaArticulo a={a} avatar={perfil.avatar} />
                <strong>{a.nombre}</strong>
                <span style={{ fontSize: '0.9rem' }}>{a.descripcion}</span>
                {tiene ? (
                  <button
                    className={`boton boton--chico ${puesto ? 'boton--crema' : 'boton--violeta'}`}
                    disabled={ocupado}
                    onClick={() => accion(() => backend.equipar(a.ranura as Ranura, puesto ? null : a.id), puesto ? 'Artículo guardado' : '¡Te queda genial!')}
                  >
                    {puesto ? 'Quitar' : 'Usar'}
                  </button>
                ) : (
                  <button className="boton boton--chico" disabled={ocupado || perfil.monedas < a.precio} onClick={() => accion(() => backend.comprar(a.id), `¡Compraste ${a.nombre}!`)}>
                    {a.precio} <Moneda />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function Logros() {
  const { perfil, ir } = useEstado();
  if (!perfil) return null;
  const rango = rangoDe(perfil.puntos);
  return (
    <>
      <Hud alVolver={() => ir({ id: 'mapa' })} />
      <div className="contenido pila">
        <h1 className="titulo-magico" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          Mis logros
        </h1>
        <div className="tarjeta pila">
          <h2>
            {rango.actual.icono} {rango.actual.nombre}
          </h2>
          <p style={{ margin: 0 }}>
            {perfil.puntos.toLocaleString('es-CL')} puntos
            {rango.siguiente ? ` · faltan ${(rango.siguiente.desde - perfil.puntos).toLocaleString('es-CL')} para ${rango.siguiente.nombre}` : ' · ¡rango máximo!'}
          </p>
          <div className="fila">
            {RANGOS.map((r) => (
              <span key={r.id} className="chip" style={{ opacity: perfil.puntos >= r.desde ? 1 : 0.45 }}>
                {r.icono} {r.nombre}
              </span>
            ))}
          </div>
          <div className="resumen-numeros">
            <div>
              <div className="numero-grande">{perfil.estadisticas.itemsExitosos}</div>
              desafíos logrados
            </div>
            <div>
              <div className="numero-grande">{perfil.estadisticas.perfectos}</div>
              perfectos
            </div>
            <div>
              <div className="numero-grande">{perfil.estadisticas.mejorRacha}</div>
              mejor racha
            </div>
            <div>
              <div className="numero-grande">{perfil.estadisticas.dias}</div>
              días jugados
            </div>
          </div>
        </div>
        <div className="grilla-tienda">
          {INSIGNIAS.map((i) => {
            const tiene = perfil.insignias.includes(i.id);
            return (
              <div key={i.id} className={`tarjeta insignia ${tiene ? '' : 'insignia--bloqueada'}`}>
                <span className="insignia__icono" aria-hidden="true">
                  {i.icono}
                </span>
                <strong>{i.nombre}</strong>
                <span style={{ fontSize: '0.85rem' }}>{i.descripcion}</span>
                <span className="chip">{tiene ? '¡Obtenida!' : `+${i.monedas} monedas`}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function Ranking() {
  const { backend, ir, manejarError } = useEstado();
  const [datos, setDatos] = useState<DatosRanking | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    backend
      .ranking()
      .then(setDatos)
      .catch((e) => setError(manejarError(e)));
  }, [backend, manejarError]);
  const medalla = ['🥇', '🥈', '🥉'];
  return (
    <>
      <Hud alVolver={() => ir({ id: 'mapa' })} />
      <div className="contenido pila" style={{ maxWidth: 680 }}>
        <h1 className="titulo-magico" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          Ranking del curso
        </h1>
        {error ? <p className="error-texto">{error}</p> : null}
        {!datos && !error ? <Cargando /> : null}
        {datos ? (
          <div className="tarjeta pila">
            <h2>{datos.curso}</h2>
            {datos.posiciones.map((p, i) => (
              <div key={p.apodo} className="fila" style={{ padding: 8, borderRadius: 16, background: p.esYo ? 'var(--oro-100)' : 'transparent', border: p.esYo ? '3px solid var(--tinta)' : '3px solid transparent' }}>
                <strong style={{ width: 36, fontSize: '1.3rem' }}>{medalla[i] ?? `${i + 1}.`}</strong>
                <Gatito avatar={p.avatar} className="hud__avatar" circulo={false} />
                <span style={{ flex: 1, fontWeight: 800 }}>
                  {p.apodo} {p.esYo ? '(tú)' : ''}
                  <br />
                  <small>
                    {p.rango.icono} {p.rango.nombre}
                  </small>
                </span>
                <strong>⭐ {p.puntos.toLocaleString('es-CL')}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

export function PantallaAjustes() {
  const { ajustes, cambiarAjustes, ir, backend, setPerfil } = useEstado();
  const [confirmar, setConfirmar] = useState(false);
  const interruptor = (clave: keyof typeof ajustes, texto: string, descripcion?: string) => (
    <label className="fila" style={{ justifyContent: 'space-between', fontWeight: 800 }}>
      <span>
        {texto}
        {descripcion ? (
          <>
            <br />
            <small style={{ fontWeight: 600 }}>{descripcion}</small>
          </>
        ) : null}
      </span>
      <input type="checkbox" checked={Boolean(ajustes[clave])} onChange={(e) => cambiarAjustes({ [clave]: e.target.checked })} style={{ width: 28, height: 28 }} />
    </label>
  );
  return (
    <>
      <Hud alVolver={() => ir({ id: 'mapa' })} />
      <div className="contenido pila" style={{ maxWidth: 620 }}>
        <h1 className="titulo-magico" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          Ajustes
        </h1>
        <div className="tarjeta pila">
          {interruptor('sonido', '🔔 Sonidos')}
          {vozDisponible() ? interruptor('voz', '🔊 Voz de Gatito', 'Botón para escuchar las instrucciones') : <p>La voz no está disponible en este navegador.</p>}
          {vozDisponible() ? interruptor('lecturaAutomatica', '📖 Leer en voz alta automáticamente', 'Ideal para 1° y 2° básico') : null}
          {interruptor('pizarra', '🖥️ Modo pizarra', 'Todo más grande para proyectar y jugar en grupo')}
          {interruptor('movimientoReducido', '🧘 Menos animaciones')}
          {vozDisponible() ? (
            <label className="pila" style={{ fontWeight: 800 }}>
              Velocidad de la voz
              <input type="range" min={0.6} max={1.3} step={0.05} value={ajustes.velocidadVoz} onChange={(e) => cambiarAjustes({ velocidadVoz: Number(e.target.value) })} />
            </label>
          ) : null}
          <button
            className="boton boton--crema"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void document.documentElement.requestFullscreen?.().catch(() => undefined);
            }}
          >
            ⛶ Pantalla completa
          </button>
        </div>
        <div className="tarjeta pila">
          {!confirmar ? (
            <button className="boton boton--crema" onClick={() => setConfirmar(true)}>
              🚪 {backend.modo === 'practica' ? 'Empezar de nuevo (borra el progreso de práctica)' : 'Cerrar sesión'}
            </button>
          ) : (
            <div className="pila">
              <p style={{ margin: 0, fontWeight: 800 }}>
                {backend.modo === 'practica' ? '¿Seguro? Se borrará tu progreso de práctica en este dispositivo.' : '¿Cerrar sesión? Para volver necesitarás tu clave de figuras.'}
              </p>
              <div className="fila">
                <button
                  className="boton boton--fucsia"
                  onClick={() =>
                    void backend.salir().finally(() => {
                      setPerfil(null);
                      ir({ id: 'bienvenida' });
                    })
                  }
                >
                  Sí
                </button>
                <button className="boton boton--crema" onClick={() => setConfirmar(false)}>
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
