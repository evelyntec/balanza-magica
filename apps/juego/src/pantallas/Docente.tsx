import { useCallback, useEffect, useState } from 'react';
import { ETAPAS, ISLAS, type Curso } from '@balanza/nucleo';
import { useEstado } from '../estado';
import type { ResumenCurso } from '../api/backend';
import { Modal } from '../componentes/Comunes';
import { Gatito } from '../componentes/Gatito';
import { Estrellas } from '../componentes/Ilustraciones';
import { DIAGNOSTICOS_DOCENTE } from '../diagnosticos';
import { SelectorClave } from './Inicio';

const ETAPAS_DISPONIBLES = ETAPAS.filter((e) => ISLAS.find((i) => i.numero === e.isla)?.disponible);

export function Docente() {
  const { backend, ir, manejarError } = useEstado();
  const [autenticado, setAutenticado] = useState(false);
  const [clave, setClave] = useState('');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenCurso | null>(null);
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [restableciendo, setRestableciendo] = useState<{ id: string; apodo: string } | null>(null);
  const [nuevaClave, setNuevaClave] = useState<string[]>([]);

  const cargarCursos = useCallback(async () => {
    setCursos(await backend.docenteCursos());
  }, [backend]);

  const cargarResumen = useCallback(
    async (id: string) => {
      setResumen(await backend.docenteResumen(id));
    },
    [backend],
  );

  useEffect(() => {
    // ¿Ya hay sesión docente?
    backend
      .docenteCursos()
      .then((c) => {
        setCursos(c);
        setAutenticado(true);
      })
      .catch(() => setAutenticado(false));
  }, [backend]);

  useEffect(() => {
    if (seleccionado) void cargarResumen(seleccionado).catch((e) => setError(manejarError(e)));
  }, [seleccionado, cargarResumen, manejarError]);

  if (backend.modo === 'practica') {
    return (
      <div className="contenido">
        <div className="tarjeta pila centro" style={{ textAlign: 'center' }}>
          <Gatito animo="guino" className="avatar-opcion" />
          <h2>El panel docente funciona con el servidor del colegio</h2>
          <p>En el modo práctica no hay cursos ni seguimiento. Instala el servidor para usar el modo clase.</p>
          <button className="boton" onClick={() => ir({ id: 'bienvenida' })}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="contenido" style={{ maxWidth: 520 }}>
        <button className="boton-texto" onClick={() => ir({ id: 'bienvenida' })}>
          ← Volver
        </button>
        <form
          className="tarjeta pila"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            void backend
              .docenteIngresar(clave)
              .then(async () => {
                setAutenticado(true);
                setClave('');
                await cargarCursos();
              })
              .catch((err) => setError(manejarError(err)));
          }}
        >
          <h2>Panel docente</h2>
          <input className="campo" type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave docente" aria-label="Clave docente" autoComplete="current-password" />
          <button className="boton boton--fucsia">Entrar</button>
          {error ? <p className="error-texto">{error}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="contenido pila">
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <h1 className="titulo-magico" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}>
          Panel docente
        </h1>
        <button className="boton boton--crema boton--chico" onClick={() => void backend.salir().finally(() => ir({ id: 'bienvenida' }))}>
          Salir
        </button>
      </div>
      {error ? <p className="error-texto">{error}</p> : null}

      <div className="tarjeta pila">
        <h2>Mis cursos</h2>
        <div className="fila">
          {cursos.map((c) => (
            <button key={c.id} className={`boton boton--chico ${seleccionado === c.id ? 'boton--fucsia' : 'boton--crema'}`} onClick={() => setSeleccionado(c.id)}>
              {c.nombre} · {c.nivel}°
            </button>
          ))}
        </div>
        <form
          className="fila"
          onSubmit={(e) => {
            e.preventDefault();
            void backend
              .docenteCrearCurso(nombre, nivel)
              .then(async (c) => {
                setNombre('');
                await cargarCursos();
                setSeleccionado(c.id);
              })
              .catch((err) => setError(manejarError(err)));
          }}
        >
          <input className="campo" style={{ flex: 1, minWidth: 160 }} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del curso (ej. 2° A)" aria-label="Nombre del curso" />
          <select className="campo" style={{ width: 'auto' }} value={nivel} onChange={(e) => setNivel(Number(e.target.value))} aria-label="Nivel">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}° básico
              </option>
            ))}
          </select>
          <button className="boton" disabled={nombre.trim().length < 2}>
            + Crear curso
          </button>
        </form>
      </div>

      {resumen ? (
        <>
          <div className="tarjeta pila centro" style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 800 }}>Código para que tus estudiantes entren (proyéctalo):</p>
            <div className="codigo-curso">{resumen.curso.codigo}</div>
            <div className="fila centro">
              <span className="chip">{resumen.alumnos.length} estudiantes</span>
              <span className="chip">{resumen.totalEventos} desafíos registrados</span>
              <a className="boton boton--chico boton--violeta" href={backend.docenteUrlCsv(resumen.curso.id)} download>
                ⬇ Descargar CSV
              </a>
            </div>
          </div>

          <div className="tarjeta pila">
            <h2>Errores más frecuentes</h2>
            {resumen.erroresFrecuentes.length === 0 ? <p>Aún no hay datos suficientes.</p> : null}
            {resumen.erroresFrecuentes.slice(0, 6).map((e) => {
              const d = DIAGNOSTICOS_DOCENTE[e.codigo];
              return (
                <div key={e.codigo} className="oa__item">
                  <strong>
                    {d?.titulo ?? e.codigo} · {e.veces} {e.veces === 1 ? 'vez' : 'veces'}
                  </strong>
                  {d ? <div>💡 {d.sugerencia}</div> : null}
                </div>
              );
            })}
          </div>

          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Puntos</th>
                  <th>Logro</th>
                  <th>Pistas</th>
                  <th>Días</th>
                  {ETAPAS_DISPONIBLES.map((e) => (
                    <th key={e.id} title={e.nombre}>
                      {e.id}
                    </th>
                  ))}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resumen.alumnos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.apodo}</strong>
                      <br />
                      <small>
                        {a.rango}
                        {a.bloqueado ? ' · 🔒 bloqueado' : ''}
                      </small>
                    </td>
                    <td>{a.puntos.toLocaleString('es-CL')}</td>
                    <td>{a.itemsTotales ? `${Math.round((a.itemsExitosos / a.itemsTotales) * 100)}%` : '—'}</td>
                    <td>{a.pistas}</td>
                    <td>{a.dias}</td>
                    {ETAPAS_DISPONIBLES.map((e) => (
                      <td key={e.id}>{a.progreso[e.id] ? <Estrellas n={a.progreso[e.id]!.estrellas} tamano={12} /> : '·'}</td>
                    ))}
                    <td>
                      <div className="fila" style={{ flexWrap: 'nowrap' }}>
                        <button
                          className="boton boton--chico boton--crema"
                          onClick={() => {
                            setNuevaClave([]);
                            setRestableciendo({ id: a.id, apodo: a.apodo });
                          }}
                        >
                          Nueva clave
                        </button>
                        <button
                          className="boton boton--chico boton--crema"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar a ${a.apodo} y todos sus datos? No se puede deshacer.`)) {
                              void backend
                                .docenteEliminar(a.id)
                                .then(() => cargarResumen(resumen.curso.id))
                                .catch((err) => setError(manejarError(err)));
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="subtitulo">Elige o crea un curso para ver su avance.</p>
      )}

      {restableciendo ? (
        <Modal etiqueta="Nueva clave" alCerrar={() => setRestableciendo(null)}>
          <div className="pila">
            <h2>Nueva clave para {restableciendo.apodo}</h2>
            <SelectorClave valor={nuevaClave} alCambiar={setNuevaClave} />
            <button
              className="boton boton--fucsia"
              disabled={nuevaClave.length < 3}
              onClick={() =>
                void backend
                  .docenteRestablecerClave(restableciendo.id, nuevaClave)
                  .then(() => {
                    setRestableciendo(null);
                    if (resumen) void cargarResumen(resumen.curso.id);
                  })
                  .catch((err) => setError(manejarError(err)))
              }
            >
              Guardar clave
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
