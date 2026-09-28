import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import {
  buscarEtapa,
  buscarIsla,
  etapasDeIsla,
  type CierreItem,
  type Pista,
  type ResultadoPesada,
  type TipoItem,
  type VistaItem,
  type VistaPartida,
} from '@balanza/nucleo';
import { useEstado } from '../estado';
import { esErrorApi } from '../api/backend';
import { BotonVoz, Cargando, Confeti, Modal } from '../componentes/Comunes';
import { Gatito, type Animo } from '../componentes/Gatito';
import { Estrella, Moneda, RetratoJefe } from '../componentes/Ilustraciones';
import { sonidos } from '../sonido';
import { callar, hablar } from '../voz';
import type { PropsMecanica } from '../mecanicas/tipos';
import { UIInclinacion } from '../mecanicas/UIInclinacion';
import { UIEquilibrar } from '../mecanicas/UIEquilibrar';
import { UIRegistrar } from '../mecanicas/UIRegistrar';
import { UIPatronFiguras } from '../mecanicas/UIPatronFiguras';
import { UIPatronNumerico } from '../mecanicas/UIPatronNumerico';
import { UISigno } from '../mecanicas/UISigno';
import { UIVerdaderoFalso } from '../mecanicas/UIVerdaderoFalso';

const UI: Record<TipoItem, ComponentType<PropsMecanica>> = {
  inclinacion: UIInclinacion,
  equilibrar: UIEquilibrar,
  registrar: UIRegistrar,
  patron_figuras: UIPatronFiguras,
  patron_numerico: UIPatronNumerico,
  signo: UISigno,
  verdadero_falso: UIVerdaderoFalso,
};

const TITULOS: Record<CierreItem['resultado'], { titulo: string; animo: Animo }> = {
  perfecto: { titulo: '¡Perfecto!', animo: 'feliz' },
  logrado: { titulo: '¡Muy bien!', animo: 'guino' },
  con_ayuda: { titulo: '¡Lo lograste con ayuda!', animo: 'normal' },
  fallido: { titulo: 'Aprendamos de esto', animo: 'pensando' },
};

/** Tiempo de lectura antes de poder responder (coincide con el servidor). */
const MS_LECTURA = 900;

interface Retro {
  tipo: 'cierre' | 'reintento';
  mensaje: string;
  cierre: CierreItem | null;
}

export function Juego({ etapaId }: { etapaId: string }) {
  const { backend, perfil, setPerfil, refrescarPerfil, ir, ajustes, avisar, manejarError } = useEstado();
  const etapa = buscarEtapa(etapaId);
  const isla = etapa ? buscarIsla(etapa.isla) : undefined;

  const [partida, setPartida] = useState<VistaPartida | null>(null);
  const [item, setItem] = useState<VistaItem | null>(null);
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [leyendo, setLeyendo] = useState(true);
  const [retro, setRetro] = useState<Retro | null>(null);
  const [reintentos, setReintentos] = useState(0);
  const [ultimaPesada, setUltimaPesada] = useState<{ propuesta: number; resultado: ResultadoPesada } | null>(null);
  const [fin, setFin] = useState<CierreItem | null>(null);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [golpe, setGolpe] = useState(0);
  const inicio = useRef(false);

  const mostrarItem = useCallback(
    (nuevo: VistaItem) => {
      setItem(nuevo);
      setPistas(nuevo.pistas);
      setRetro(null);
      setReintentos(0);
      const ultima = nuevo.pesadas[nuevo.pesadas.length - 1];
      setUltimaPesada(ultima ?? null);
      setLeyendo(true);
      window.setTimeout(() => setLeyendo(false), MS_LECTURA);
      if (ajustes.voz && ajustes.lecturaAutomatica) hablar(nuevo.voz);
    },
    [ajustes.voz, ajustes.lecturaAutomatica],
  );

  useEffect(() => {
    if (inicio.current) return;
    inicio.current = true;
    backend
      .iniciarEtapa(etapaId)
      .then(({ partida: p, item: i }) => {
        setPartida(p);
        mostrarItem(i);
      })
      .catch((e) => setError(manejarError(e)));
    return () => callar();
  }, [backend, etapaId, mostrarItem, manejarError]);

  const aplicarCierre = useCallback(
    (cierre: CierreItem, mensaje: string) => {
      setPartida(cierre.partida);
      setRetro({ tipo: 'cierre', mensaje, cierre });
      if (perfil) setPerfil({ ...perfil, puntos: cierre.totalPuntos, monedas: cierre.totalMonedas, racha: cierre.racha });
      if (cierre.resultado === 'perfecto') sonidos.perfecto();
      else if (cierre.resultado === 'fallido') sonidos.incorrecto();
      else sonidos.correcto();
      if (cierre.danoJefe > 0) {
        window.setTimeout(() => sonidos.golpeJefe(), 250);
        setGolpe((g) => g + 1);
      }
      if (cierre.subioNivel) {
        window.setTimeout(() => sonidos.nivel(), 500);
        avisar('🚀', `¡Subes al nivel ${cierre.partida.estado.nivel}! Más difícil, más puntos.`);
      }
      if (cierre.bajoNivel) avisar('🌱', 'Practiquemos un nivel más tranquilo, con apoyo.');
      for (const insignia of cierre.insigniasNuevas) {
        window.setTimeout(() => sonidos.moneda(), 700);
        avisar(insignia.icono, `¡Nueva insignia: ${insignia.nombre}! +${insignia.monedas} monedas`);
      }
      if (ajustes.voz && ajustes.lecturaAutomatica) hablar(`${TITULOS[cierre.resultado].titulo} ${mensaje}`);
    },
    [perfil, setPerfil, avisar, ajustes.voz, ajustes.lecturaAutomatica],
  );

  const conManejo = async (fn: () => Promise<void>) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await fn();
    } catch (e) {
      if (esErrorApi(e) && e.codigo === 'DEMASIADO_RAPIDO') avisar('🐢', e.message);
      else avisar('⚠️', manejarError(e));
    } finally {
      setOcupado(false);
    }
  };

  const responder = (respuesta: unknown) =>
    void conManejo(async () => {
      if (!item) return;
      const r = await backend.responder(item.id, respuesta);
      setItem({ ...item, intentosUsados: r.intentosUsados });
      if (r.cierre) aplicarCierre(r.cierre, r.mensaje);
      else if (r.puedeReintentar) {
        sonidos.incorrecto();
        setReintentos((n) => n + 1);
        setRetro({ tipo: 'reintento', mensaje: r.mensaje, cierre: null });
        if (ajustes.voz && ajustes.lecturaAutomatica) hablar(r.mensaje);
      }
    });

  const pesar = (propuesta: number) =>
    void conManejo(async () => {
      if (!item) return;
      const r = await backend.pesar(item.id, propuesta);
      const pesada = { propuesta, resultado: r.pesada };
      setUltimaPesada(pesada);
      setItem({ ...item, pesadas: [...item.pesadas, pesada], intentosUsados: r.pesadasUsadas });
      if (r.pesada.equilibrio) sonidos.equilibrio();
      if (r.cierre) aplicarCierre(r.cierre, r.pesada.mensaje);
      else if (ajustes.voz && ajustes.lecturaAutomatica) hablar(r.pesada.mensaje);
    });

  const pedirPista = () =>
    void conManejo(async () => {
      if (!item) return;
      const r = await backend.pista(item.id);
      sonidos.pista();
      setPistas((ps) => [...ps, r.pista]);
      if (ajustes.voz && ajustes.lecturaAutomatica) hablar(r.pista.texto);
    });

  const continuar = () =>
    void conManejo(async () => {
      if (retro?.tipo === 'reintento') {
        setRetro(null);
        return;
      }
      const cierre = retro?.cierre;
      if (cierre?.fin) {
        setFin(cierre);
        setRetro(null);
        callar();
        if (cierre.fin.superada) sonidos.fanfarria();
        void refrescarPerfil();
        return;
      }
      if (!partida) return;
      const r = await backend.itemActual(partida.id);
      setPartida(r.partida);
      if (r.item) mostrarItem(r.item);
    });

  const salir = () =>
    void conManejo(async () => {
      if (partida && !fin && item && !item.terminado && !retro) {
        const p = await backend.abandonar(partida.id);
        setPerfil(p);
      } else {
        await refrescarPerfil();
      }
      ir({ id: 'isla', isla: etapa?.isla ?? 1 });
    });

  if (!etapa || !isla) return <Cargando texto="Esa etapa no existe." />;
  if (error)
    return (
      <div className="contenido pila centro" style={{ minHeight: '70vh' }}>
        <div className="tarjeta pila centro" style={{ textAlign: 'center', maxWidth: 480 }}>
          <Gatito animo="triste" className="avatar-opcion" />
          <p className="error-texto">{error}</p>
          <button className="boton" onClick={() => ir({ id: 'isla', isla: etapa.isla })}>
            Volver a la isla
          </button>
        </div>
      </div>
    );
  if (fin?.fin) return <Resultado cierre={fin} etapaId={etapaId} />;
  if (!partida || !item) return <Cargando texto="Preparando la balanza…" />;

  const estado = partida.estado;
  const Mecanica = UI[item.tipo];
  const bloqueado = ocupado || leyendo || retro !== null || item.terminado;
  const cierreActual = retro?.tipo === 'cierre' ? retro.cierre : null;
  const pistaMasReciente = pistas[pistas.length - 1];

  const pie = (
    <>
      {pistaMasReciente ? (
        <div className="pista aparecer" role="status">
          <div className="pista__nivel">💡 Pista {pistaMasReciente.nivel} de 3</div>
          <div>{pistaMasReciente.texto}</div>
          {pistaMasReciente.ejemplo ? (
            <div style={{ marginTop: 6 }}>
              <strong>{pistaMasReciente.ejemplo.texto}</strong>
              <ol>
                {pistaMasReciente.ejemplo.pasos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="juego__pie">
        <span className="nivel-indicador" aria-label={`Nivel ${estado.nivel} de 5`}>
          Nivel
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} className={n <= estado.nivel ? 'lleno' : ''} />
          ))}
        </span>
        {item.andamiaje ? <span className="etiqueta-apoyo">Con apoyo</span> : null}
        <button type="button" className="boton boton--chico" onClick={pedirPista} disabled={bloqueado || pistas.length >= 3} title="Cada pista baja un poco el puntaje">
          💡 Pista {pistas.length}/3
        </button>
      </div>
    </>
  );

  return (
    <div className="juego">
      <div className="juego__barra">
        <button className="boton boton--crema boton--icono boton--chico" onClick={() => (item.terminado || retro || fin ? salir() : setConfirmarSalida(true))} aria-label="Salir de la etapa">
          ✕
        </button>
        <div className="juego__titulo">
          <h2>{etapa.nombre}</h2>
          {partida.esJefe && estado.vidaJefe !== null && estado.vidaJefeMax !== null ? (
            <div className="jefe">
              <span key={golpe} className={golpe > 0 ? 'sacudir' : ''}>
                <RetratoJefe isla={etapa.isla} animo={estado.vidaJefe <= 0 ? 'vencido' : golpe > 0 && retro ? 'golpe' : 'normal'} />
              </span>
              <div className="jefe__vida" role="meter" aria-valuemin={0} aria-valuemax={estado.vidaJefeMax} aria-valuenow={estado.vidaJefe} aria-label={`Vida de ${isla.jefe.nombre}`}>
                <span style={{ width: `${(estado.vidaJefe / estado.vidaJefeMax) * 100}%` }} />
              </div>
              <span style={{ fontWeight: 900 }}>
                {estado.vidaJefe}/{estado.vidaJefeMax}
              </span>
            </div>
          ) : (
            <div className="progreso-gemas" role="meter" aria-valuemin={0} aria-valuemax={partida.metaLogros} aria-valuenow={estado.logros} aria-label="Desafíos logrados">
              {Array.from({ length: partida.metaLogros }, (_, i) => (
                <span key={i} className={`gema ${i < estado.logros ? 'gema--llena' : ''}`} />
              ))}
            </div>
          )}
        </div>
        <div className="hud__contadores">
          <span className="contador" title="Puntos">
            ⭐ {perfil?.puntos.toLocaleString('es-CL') ?? 0}
          </span>
          {perfil && perfil.racha >= 3 ? (
            <span className="contador contador--racha-activa" title="Racha">
              🔥 {perfil.racha}
            </span>
          ) : null}
        </div>
      </div>

      <div className="juego__consigna">
        <Gatito animo={retro?.cierre ? TITULOS[retro.cierre.resultado].animo : leyendo ? 'pensando' : 'normal'} equipado={perfil?.equipado} avatar="gatito" className="hud__avatar" />
        <p>{item.consigna}</p>
        <BotonVoz texto={item.voz} />
      </div>

      <Mecanica
        key={item.id}
        item={item}
        bloqueado={bloqueado}
        cierre={cierreActual}
        pistas={pistas}
        reintentos={reintentos}
        ultimaPesada={ultimaPesada}
        estiloBalanza={perfil?.equipado.balanza}
        alResponder={responder}
        alPesar={pesar}
        pie={pie}
      />

      {retro ? <PanelRetro retro={retro} alContinuar={continuar} ocupado={ocupado} esJefe={partida.esJefe} /> : null}
      <Confeti activo={retro?.cierre?.resultado === 'perfecto'} />

      {confirmarSalida ? (
        <Modal etiqueta="¿Salir de la etapa?" alCerrar={() => setConfirmarSalida(false)}>
          <div className="pila" style={{ textAlign: 'center' }}>
            <Gatito animo="sorprendido" className="avatar-opcion" />
            <h2>¿Salir de la etapa?</h2>
            <p>Si sales ahora, este desafío cuenta como no logrado y tu racha vuelve a cero.</p>
            <div className="fila centro">
              <button className="boton boton--verde" onClick={() => setConfirmarSalida(false)} autoFocus>
                Seguir jugando
              </button>
              <button
                className="boton boton--crema"
                onClick={() => {
                  setConfirmarSalida(false);
                  salir();
                }}
              >
                Salir
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function PanelRetro({ retro, alContinuar, ocupado, esJefe }: { retro: Retro; alContinuar: () => void; ocupado: boolean; esJefe: boolean }) {
  const boton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => boton.current?.focus(), 400);
    return () => window.clearTimeout(t);
  }, [retro]);

  if (retro.tipo === 'reintento') {
    return (
      <div className="retro" role="alertdialog" aria-label="Intenta otra vez">
        <div className="retro__caja retro__caja--mal aparecer">
          <Gatito animo="pensando" className="avatar-opcion" />
          <div>
            <div className="retro__titulo">¡Casi! Revisa otra vez</div>
            <p className="retro__mensaje">{retro.mensaje}</p>
          </div>
          <div className="retro__acciones">
            <button ref={boton} className="boton boton--violeta" onClick={alContinuar} disabled={ocupado}>
              Intentar otra vez
            </button>
          </div>
        </div>
      </div>
    );
  }
  const c = retro.cierre!;
  const { titulo, animo } = TITULOS[c.resultado];
  const bien = c.resultado !== 'fallido';
  return (
    <div className="retro" role="alertdialog" aria-label={titulo}>
      <div className={`retro__caja ${bien ? 'retro__caja--bien' : 'retro__caja--mal'} aparecer`}>
        <Gatito animo={animo} className="avatar-opcion" />
        <div>
          <div className="retro__titulo">{titulo}</div>
          <p className="retro__mensaje">{retro.mensaje}</p>
        </div>
        {!bien || c.resultado === 'con_ayuda' ? <div className="retro__solucion">{c.solucion.simbolico}</div> : null}
        <div className="retro__acciones">
          {c.puntos > 0 ? (
            <span className="puntos-ganados">
              +{c.puntos} ⭐{c.multiplicador > 1 ? ` (×${c.multiplicador} racha)` : ''}
            </span>
          ) : null}
          {c.monedas > 0 ? (
            <span className="puntos-ganados" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              +{c.monedas} <Moneda tamano={24} />
            </span>
          ) : null}
          {esJefe && c.danoJefe !== 0 ? (
            <span className="chip">{c.danoJefe > 0 ? `💥 −${c.danoJefe} al jefe` : '🛡️ El jefe se recupera'}</span>
          ) : null}
          <button ref={boton} className="boton boton--fucsia" onClick={alContinuar} disabled={ocupado}>
            {c.fin ? 'Ver resultado' : 'Continuar'} →
          </button>
        </div>
      </div>
    </div>
  );
}

function Resultado({ cierre, etapaId }: { cierre: CierreItem; etapaId: string }) {
  const { ir, perfil } = useEstado();
  const f = cierre.fin!;
  const etapa = buscarEtapa(etapaId)!;
  const isla = buscarIsla(etapa.isla)!;
  const siguiente = etapasDeIsla(etapa.isla).find((e) => e.orden === etapa.orden + 1);
  const subioRango = f.rangoDespues.id !== f.rangoAntes.id;
  useEffect(() => {
    const texto = f.superada
      ? `${etapa.esJefe ? `¡Venciste a ${isla.jefe.nombre}!` : '¡Etapa superada!'} Conseguiste ${f.estrellas} ${f.estrellas === 1 ? 'estrella' : 'estrellas'}.`
      : '¡Buen esfuerzo! Vuelve a intentarlo, cada vez aprendes más.';
    hablar(texto);
  }, [f, etapa, isla]);

  return (
    <div className="contenido">
      <Confeti activo={f.superada} />
      <div className="resultado">
        <Gatito animo={f.superada ? 'feliz' : 'normal'} equipado={perfil?.equipado} className="avatar-opcion" />
        <h1 className="titulo-magico" style={{ fontSize: 'clamp(2rem, 7vw, 3.4rem)' }}>
          {f.superada ? (etapa.esJefe ? `¡Venciste a ${isla.jefe.nombre}!` : '¡Etapa superada!') : '¡Buen esfuerzo!'}
        </h1>
        {etapa.esJefe && f.superada ? <RetratoJefe isla={etapa.isla} animo="vencido" /> : null}
        <div className="resultado__estrellas" aria-label={`${f.estrellas} de 3 estrellas`}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ animationDelay: `${i * 0.25}s` }} className="aparecer">
              <Estrella llena={i < f.estrellas} tamano={100} />
            </span>
          ))}
        </div>
        {!f.superada ? <p className="subtitulo">Necesitas más desafíos bien resueltos para superar la etapa. ¡Tú puedes!</p> : null}
        <div className="resumen-numeros">
          <div className="tarjeta">
            <div className="numero-grande">{Math.round(f.precision * 100)}%</div>
            <div>de precisión</div>
          </div>
          <div className="tarjeta">
            <div className="numero-grande">+{f.puntosPartida}</div>
            <div>puntos</div>
          </div>
          <div className="tarjeta">
            <div className="numero-grande" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              +{f.monedasPartida} <Moneda tamano={30} />
            </div>
            <div>monedas</div>
          </div>
          {f.bonoEstrellas + f.bonoJefe > 0 ? (
            <div className="tarjeta">
              <div className="numero-grande">+{f.bonoEstrellas + f.bonoJefe}</div>
              <div>bono {etapa.esJefe ? 'de jefe' : 'de estrellas'}</div>
            </div>
          ) : null}
        </div>
        {subioRango ? (
          <div className="tarjeta aparecer" style={{ background: 'var(--oro-100)' }}>
            <div className="numero-grande">
              {f.rangoDespues.icono} ¡Nuevo rango: {f.rangoDespues.nombre}!
            </div>
          </div>
        ) : null}
        {f.superada && f.estrellas < 3 ? (
          <p className="subtitulo">
            💡 Para 3 estrellas: responde con precisión (85% o más), usa máximo 1 pista y llega al nivel 4.
          </p>
        ) : null}
        <div className="fila centro">
          {f.superada && siguiente ? (
            <button className="boton boton--fucsia boton--grande" onClick={() => ir({ id: 'juego', etapaId: siguiente.id })}>
              Siguiente: {siguiente.nombre} →
            </button>
          ) : null}
          <button className="boton boton--violeta" onClick={() => ir({ id: 'juego', etapaId })}>
            ↻ Jugar de nuevo
          </button>
          <button className="boton boton--crema" onClick={() => ir({ id: 'isla', isla: etapa.isla })}>
            Volver a la isla
          </button>
        </div>
      </div>
    </div>
  );
}
