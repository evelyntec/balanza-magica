import { ISLAS, buscarEtapa, buscarIsla, etapasDeIsla } from '@balanza/nucleo';
import { useEstado } from '../estado';
import { Hud } from '../componentes/Comunes';
import { Gatito } from '../componentes/Gatito';
import { Estrellas, IconoIsla, RetratoJefe } from '../componentes/Ilustraciones';
import { sonidos } from '../sonido';

export function Mapa() {
  const { perfil, ir, backend } = useEstado();
  if (!perfil) return null;
  // Isla "actual": la primera accesible que aún no está completa.
  const actual = perfil.islas.find((i) => i.accesible && !i.completada)?.numero ?? perfil.islas.filter((i) => i.accesible).pop()?.numero ?? 1;
  const continuar = perfil.partidaActiva;

  return (
    <>
      <Hud />
      <div className="contenido">
        <nav className="fila" style={{ justifyContent: 'center', margin: '4px 0 10px' }} aria-label="Menú">
          <button className="boton boton--chico boton--crema" onClick={() => ir({ id: 'tienda' })}>
            🛍️ Tienda
          </button>
          <button className="boton boton--chico boton--crema" onClick={() => ir({ id: 'logros' })}>
            🏅 Logros
          </button>
          {backend.modo === 'clase' ? (
            <button className="boton boton--chico boton--crema" onClick={() => ir({ id: 'ranking' })}>
              🏆 Ranking
            </button>
          ) : null}
          <button className="boton boton--chico boton--crema" onClick={() => ir({ id: 'ajustes' })}>
            ⚙️ Ajustes
          </button>
        </nav>

        {continuar ? (
          <div className="tarjeta fila aparecer" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>Tienes un desafío a medias en «{buscarEtapa(continuar.etapaId)?.nombre}».</strong>
            <button className="boton boton--fucsia" onClick={() => ir({ id: 'juego', etapaId: continuar.etapaId })}>
              Continuar →
            </button>
          </div>
        ) : null}

        <h1 className="titulo-magico" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          El Reino del Equilibrio
        </h1>
        <p className="subtitulo">Recorre las islas y restaura cada balanza.</p>

        <div className="mapa">
          {ISLAS.map((isla) => {
            const estado = perfil.islas.find((i) => i.numero === isla.numero);
            const accesible = estado?.accesible === true;
            const clases = ['isla'];
            if (!accesible) clases.push('isla--bloqueada');
            if (isla.numero === actual && accesible) clases.push('isla--actual');
            return (
              <button
                key={isla.numero}
                className={clases.join(' ')}
                style={{ ['--color-isla' as string]: isla.color }}
                disabled={!accesible}
                onClick={() => {
                  sonidos.toque();
                  ir({ id: 'isla', isla: isla.numero });
                }}
                aria-label={`${isla.nombre}, ${isla.nivel}${accesible ? '' : ', bloqueada'}`}
              >
                {!isla.disponible ? <span className="isla__cinta">Próximamente</span> : null}
                <IconoIsla numero={isla.numero} />
                <span className="isla__nombre">{isla.nombre}</span>
                <span className="isla__nivel">{isla.nivel}</span>
                {accesible && estado ? <Estrellas n={Math.round((estado.estrellas / Math.max(1, estado.estrellasMax)) * 3)} tamano={18} /> : <span aria-hidden="true">🔒</span>}
                {isla.numero === actual && accesible ? (
                  <Gatito avatar={perfil.avatar} equipado={perfil.equipado} animo="feliz" className="hud__avatar" circulo={false} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function Isla({ numero }: { numero: number }) {
  const { perfil, ir } = useEstado();
  const isla = buscarIsla(numero);
  if (!perfil || !isla) return null;
  const estado = perfil.islas.find((i) => i.numero === numero);
  const etapas = etapasDeIsla(numero);

  return (
    <>
      <Hud alVolver={() => ir({ id: 'mapa' })} />
      <div className="contenido" style={{ maxWidth: 760, ['--color-isla' as string]: isla.color }}>
        <div className="fila" style={{ justifyContent: 'center', color: '#fff', textAlign: 'center' }}>
          <IconoIsla numero={numero} />
          <div>
            <h1 className="titulo-magico" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)' }}>
              {isla.nombre}
            </h1>
            <p className="subtitulo">
              {isla.nivel} · {isla.lema}
            </p>
          </div>
        </div>

        <details className="tarjeta tarjeta--papel oa" style={{ margin: '14px 0' }}>
          <summary>📚 Lo que aprenderás (Objetivos de Aprendizaje)</summary>
          {isla.oa.map((oa) => (
            <p key={oa.codigo} className="oa__item">
              <span className="oa__codigo">{oa.codigo}:</span> {oa.texto}
            </p>
          ))}
        </details>

        {!isla.disponible ? (
          <div className="tarjeta pila centro" style={{ textAlign: 'center' }}>
            <Gatito animo="guino" className="avatar-opcion" />
            <h2>¡Esta isla se está construyendo!</h2>
            <p>Muy pronto podrás explorarla. Mientras tanto, consigue 3 estrellas en las islas abiertas.</p>
          </div>
        ) : (
          <div className="camino-etapas">
            {etapas.map((e) => {
              const ee = estado?.etapas.find((x) => x.id === e.id);
              const accesible = ee?.accesible === true;
              return (
                <button
                  key={e.id}
                  className={`etapa-nodo ${e.esJefe ? 'etapa-nodo--jefe' : ''} aparecer`}
                  disabled={!accesible}
                  onClick={() => {
                    sonidos.toque();
                    ir({ id: 'juego', etapaId: e.id });
                  }}
                  aria-label={`${e.nombre}${accesible ? '' : ', bloqueada'}, ${ee?.estrellas ?? 0} estrellas`}
                >
                  <span className="etapa-nodo__numero">{e.esJefe ? <RetratoJefe isla={numero} /> : accesible ? e.orden : '🔒'}</span>
                  <span>
                    <span className="etapa-nodo__titulo" style={{ display: 'block' }}>
                      {e.nombre}
                    </span>
                    <span className="etapa-nodo__desc">{e.esJefe ? isla.jefe.descripcion : e.descripcion}</span>
                  </span>
                  <Estrellas n={ee?.estrellas ?? 0} tamano={24} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
