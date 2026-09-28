import { useEffect, useState } from 'react';
import { AVATARES, FIGURAS_CLAVE, validarApodo } from '@balanza/nucleo';
import { useEstado } from '../estado';
import { Balanza } from '../componentes/Balanza';
import { Gatito, NOMBRES_AVATAR } from '../componentes/Gatito';
import { sonidos } from '../sonido';
import { hablar } from '../voz';

export const EMOJI_CLAVE: Record<string, string> = {
  gato: '🐱',
  perro: '🐶',
  conejo: '🐰',
  pato: '🦆',
  oso: '🐻',
  zorro: '🦊',
  buho: '🦉',
  pez: '🐟',
  tortuga: '🐢',
};

export const NOMBRE_CLAVE: Record<string, string> = {
  gato: 'gato',
  perro: 'perro',
  conejo: 'conejo',
  pato: 'pato',
  oso: 'oso',
  zorro: 'zorro',
  buho: 'búho',
  pez: 'pez',
  tortuga: 'tortuga',
};

/** Portada animada. */
export function Bienvenida() {
  const { backend, ir } = useEstado();
  const [angulo, setAngulo] = useState(-12);
  useEffect(() => {
    const valores = [-12, 8, -4, 0];
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % valores.length;
      setAngulo(valores[i] as number);
    }, 1400);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="contenido pila" style={{ alignItems: 'center', paddingTop: 28 }}>
      <h1 className="titulo-magico">Balanza Mágica</h1>
      <p className="subtitulo">Equilibra, descubre patrones y conviértete en Leyenda del Equilibrio.</p>
      <div style={{ width: 'min(560px, 100%)', position: 'relative' }}>
        <Balanza
          izquierda={[{ tipo: 'pesa', valor: 8 }, { tipo: 'pesa', valor: 5 }]}
          derecha={[{ tipo: 'caja' }, { tipo: 'pesa', valor: 7 }]}
          angulo={angulo}
          destello={angulo === 0}
          titulo="Balanza mágica de portada"
        />
        <Gatito animo={angulo === 0 ? 'feliz' : 'guino'} className="gatito-flotante" titulo="Gatito, tu guía" />
      </div>
      <div className="pila" style={{ width: 'min(420px, 100%)' }}>
        {backend.modo === 'clase' ? (
          <>
            <button className="boton boton--grande boton--ancho" onClick={() => ir({ id: 'ingreso' })}>
              🎒 Entrar con mi curso
            </button>
            <button className="boton-texto" onClick={() => ir({ id: 'docente' })}>
              Soy profesora o profesor
            </button>
          </>
        ) : (
          <>
            <button className="boton boton--grande boton--ancho" onClick={() => ir({ id: 'practica' })}>
              ▶ ¡Jugar!
            </button>
            <p className="subtitulo" style={{ fontSize: '0.95rem' }}>
              Modo práctica: tu progreso se guarda solo en este dispositivo.
            </p>
          </>
        )}
      </div>
      <p className="subtitulo" style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 24 }}>
        Creado por la Profesora Evelyn Álvarez · Profesora de Educación Básica · Magíster en Didáctica de la Matemática
      </p>
    </div>
  );
}

/** Elegir 3 figuras en orden (clave amigable para niñas y niños). */
export function SelectorClave({ valor, alCambiar }: { valor: string[]; alCambiar: (v: string[]) => void }) {
  return (
    <div className="pila">
      <div className="clave-ranuras" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <div key={i} className="clave-ranura" aria-label={valor[i] ? NOMBRE_CLAVE[valor[i] as string] : 'vacío'}>
            {valor[i] ? EMOJI_CLAVE[valor[i] as string] : ''}
          </div>
        ))}
      </div>
      <div className="clave-grilla">
        {FIGURAS_CLAVE.map((f) => (
          <button
            key={f}
            type="button"
            className="clave-figura"
            aria-label={NOMBRE_CLAVE[f]}
            onClick={() => {
              if (valor.length >= 3) return;
              sonidos.toque();
              alCambiar([...valor, f]);
            }}
          >
            {EMOJI_CLAVE[f]}
          </button>
        ))}
      </div>
      <button type="button" className="boton boton--crema boton--chico" onClick={() => alCambiar(valor.slice(0, -1))} disabled={valor.length === 0}>
        ⌫ Borrar la última
      </button>
    </div>
  );
}

function SelectorAvatar({ valor, alCambiar }: { valor: string; alCambiar: (v: string) => void }) {
  return (
    <div className="fila centro" role="radiogroup" aria-label="Elige tu gatito">
      {AVATARES.map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={valor === a}
          className={`avatar-opcion ${valor === a ? 'avatar-opcion--elegido' : ''}`}
          onClick={() => {
            sonidos.toque();
            alCambiar(a);
          }}
          aria-label={NOMBRES_AVATAR[a]}
        >
          <Gatito avatar={a} animo={valor === a ? 'feliz' : 'normal'} circulo={false} />
        </button>
      ))}
    </div>
  );
}

function SelectorApodo({ valor, alCambiar }: { valor: string; alCambiar: (v: string) => void }) {
  const { backend } = useEstado();
  const [sugeridos, setSugeridos] = useState<string[]>([]);
  useEffect(() => {
    void backend.sugerirApodos().then(setSugeridos).catch(() => setSugeridos([]));
  }, [backend]);
  return (
    <div className="pila">
      <input
        className="campo"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        maxLength={20}
        placeholder="Tu apodo secreto"
        aria-label="Apodo"
        autoComplete="off"
      />
      <p style={{ margin: 0, fontWeight: 700 }}>🔒 Usa un apodo divertido, no tu nombre real. Ideas:</p>
      <div className="fila">
        {sugeridos.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => alCambiar(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ingreso al modo clase: código del curso → apodo → clave de figuras. */
export function Ingreso() {
  const { backend, ir, setPerfil, manejarError } = useEstado();
  const [paso, setPaso] = useState<'codigo' | 'lista' | 'clave' | 'nuevo-apodo' | 'nuevo-avatar' | 'nueva-clave' | 'confirmar-clave'>('codigo');
  const [codigo, setCodigo] = useState('');
  const [curso, setCurso] = useState<{ nombre: string; nivel: number } | null>(null);
  const [alumnos, setAlumnos] = useState<{ apodo: string; avatar: string }[]>([]);
  const [apodo, setApodo] = useState('');
  const [avatar, setAvatar] = useState('gatito');
  const [clave, setClave] = useState<string[]>([]);
  const [claveNueva, setClaveNueva] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const intentar = async (fn: () => Promise<void>) => {
    setOcupado(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(manejarError(e));
    } finally {
      setOcupado(false);
    }
  };

  const entrar = async (perfilPromesa: Promise<Awaited<ReturnType<typeof backend.ingresar>>>) => {
    const perfil = await perfilPromesa;
    await backend.tomarPestana();
    setPerfil(perfil);
    sonidos.fanfarria();
    ir({ id: 'mapa' });
  };

  useEffect(() => {
    if (paso === 'clave' && clave.length === 3) void intentar(() => entrar(backend.ingresar({ codigoCurso: codigo, apodo, clave }))).then(() => setClave([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, paso]);

  return (
    <div className="contenido" style={{ maxWidth: 640 }}>
      <button className="boton-texto" onClick={() => (paso === 'codigo' ? ir({ id: 'bienvenida' }) : setPaso(paso === 'clave' || paso === 'nuevo-apodo' ? 'lista' : 'codigo'))}>
        ← Volver
      </button>
      <div className="tarjeta pila aparecer">
        {paso === 'codigo' ? (
          <form
            className="pila"
            onSubmit={(e) => {
              e.preventDefault();
              void intentar(async () => {
                const r = await backend.curso(codigo);
                setCurso(r.curso);
                setAlumnos(r.alumnos);
                setPaso('lista');
              });
            }}
          >
            <h2>Código de tu curso</h2>
            <p style={{ margin: 0 }}>Tu profesora o profesor te lo muestra en la pizarra.</p>
            <input
              className="campo campo--codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="ABC234"
              aria-label="Código del curso"
              autoFocus
              autoComplete="off"
            />
            <button className="boton boton--fucsia boton--grande" disabled={codigo.length < 4 || ocupado}>
              Continuar
            </button>
          </form>
        ) : null}

        {paso === 'lista' && curso ? (
          <div className="pila">
            <h2>{curso.nombre}</h2>
            <p style={{ margin: 0, fontWeight: 700 }}>¿Quién eres? Toca tu apodo.</p>
            <div className="lista-apodos">
              {alumnos.map((a) => (
                <button
                  key={a.apodo}
                  className="apodo-boton"
                  onClick={() => {
                    setApodo(a.apodo);
                    setAvatar(a.avatar);
                    setClave([]);
                    setPaso('clave');
                    hablar('Elige las tres figuras de tu clave, en orden.');
                  }}
                >
                  <Gatito avatar={a.avatar} className="avatar-opcion" circulo={false} />
                  {a.apodo}
                </button>
              ))}
            </div>
            <button
              className="boton boton--violeta"
              onClick={() => {
                setApodo('');
                setPaso('nuevo-apodo');
              }}
            >
              ✨ Soy nueva o nuevo: crear mi gatito
            </button>
          </div>
        ) : null}

        {paso === 'clave' ? (
          <div className="pila">
            <div className="fila">
              <Gatito avatar={avatar} className="avatar-opcion" />
              <h2>Hola, {apodo}</h2>
            </div>
            <p style={{ margin: 0, fontWeight: 700 }}>Toca las 3 figuras de tu clave, en orden.</p>
            <SelectorClave valor={clave} alCambiar={setClave} />
          </div>
        ) : null}

        {paso === 'nuevo-apodo' ? (
          <form
            className="pila"
            onSubmit={(e) => {
              e.preventDefault();
              const v = validarApodo(apodo);
              if (!v.ok) return setError(v.motivo);
              setError(null);
              setPaso('nuevo-avatar');
            }}
          >
            <h2>Elige tu apodo</h2>
            <SelectorApodo valor={apodo} alCambiar={setApodo} />
            <button className="boton boton--fucsia" disabled={apodo.trim().length < 3}>
              Continuar
            </button>
          </form>
        ) : null}

        {paso === 'nuevo-avatar' ? (
          <div className="pila">
            <h2>Elige tu gatito</h2>
            <SelectorAvatar valor={avatar} alCambiar={setAvatar} />
            <button
              className="boton boton--fucsia"
              onClick={() => {
                setClaveNueva([]);
                setPaso('nueva-clave');
              }}
            >
              Continuar
            </button>
          </div>
        ) : null}

        {paso === 'nueva-clave' ? (
          <div className="pila">
            <h2>Crea tu clave secreta</h2>
            <p style={{ margin: 0, fontWeight: 700 }}>Elige 3 figuras en orden. ¡Memorízalas o anótalas en tu cuaderno!</p>
            <SelectorClave valor={claveNueva} alCambiar={setClaveNueva} />
            <button
              className="boton boton--fucsia"
              disabled={claveNueva.length < 3}
              onClick={() => {
                setClave([]);
                setPaso('confirmar-clave');
              }}
            >
              Continuar
            </button>
          </div>
        ) : null}

        {paso === 'confirmar-clave' ? (
          <div className="pila">
            <h2>Repite tu clave</h2>
            <p style={{ margin: 0, fontWeight: 700 }}>Para asegurarnos de que la recuerdas.</p>
            <SelectorClave valor={clave} alCambiar={setClave} />
            <button
              className="boton boton--fucsia boton--grande"
              disabled={clave.length < 3 || ocupado}
              onClick={() => {
                if (clave.join() !== claveNueva.join()) {
                  setError('Las claves no coinciden. Vuelve a crearla.');
                  setClaveNueva([]);
                  setClave([]);
                  setPaso('nueva-clave');
                  return;
                }
                void intentar(() => entrar(backend.registrar({ codigoCurso: codigo, apodo, avatar, clave })));
              }}
            >
              ¡Crear mi gatito!
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="error-texto" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Modo práctica (sin servidor): elegir curso, apodo y gatito. */
export function Practica() {
  const { backend, ir, setPerfil, manejarError } = useEstado();
  const [nivel, setNivel] = useState(1);
  const [apodo, setApodo] = useState('');
  const [avatar, setAvatar] = useState('gatito');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  return (
    <div className="contenido" style={{ maxWidth: 680 }}>
      <button className="boton-texto" onClick={() => ir({ id: 'bienvenida' })}>
        ← Volver
      </button>
      <form
        className="tarjeta pila aparecer"
        onSubmit={(e) => {
          e.preventDefault();
          const v = validarApodo(apodo);
          if (!v.ok) return setError(v.motivo);
          setOcupado(true);
          void backend
            .registrar({ codigoCurso: String(nivel), apodo, avatar, clave: [] })
            .then(async (perfil) => {
              await backend.tomarPestana();
              setPerfil(perfil);
              sonidos.fanfarria();
              ir({ id: 'mapa' });
            })
            .catch((err) => setError(manejarError(err)))
            .finally(() => setOcupado(false));
        }}
      >
        <h2>¿En qué curso estás?</h2>
        <div className="fila" role="radiogroup" aria-label="Curso">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nivel === n}
              className={`boton boton--chico ${nivel === n ? 'boton--fucsia' : 'boton--crema'}`}
              onClick={() => setNivel(n)}
            >
              {n}° básico
            </button>
          ))}
        </div>
        <h2>Tu apodo</h2>
        <SelectorApodo valor={apodo} alCambiar={setApodo} />
        <h2>Tu gatito</h2>
        <SelectorAvatar valor={avatar} alCambiar={setAvatar} />
        {error ? (
          <p className="error-texto" role="alert">
            {error}
          </p>
        ) : null}
        <button className="boton boton--fucsia boton--grande" disabled={ocupado || apodo.trim().length < 3}>
          ¡A jugar!
        </button>
      </form>
    </div>
  );
}

