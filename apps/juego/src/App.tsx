import { useEffect } from 'react';
import { useEstado } from './estado';
import { AvisoOtraPestana, Avisos, Cargando } from './componentes/Comunes';
import { Bienvenida, Ingreso, Practica } from './pantallas/Inicio';
import { Isla, Mapa } from './pantallas/Mapa';
import { Juego } from './pantallas/Juego';
import { Logros, PantallaAjustes, Ranking, Tienda } from './pantallas/Extras';
import { Docente } from './pantallas/Docente';

export function App() {
  const { backend, pantalla, visita, ir, setPerfil, manejarError } = useEstado();

  // Al abrir: ¿hay sesión? Entonces esta pestaña toma el control del juego.
  useEffect(() => {
    if (window.location.hash === '#/docente') {
      ir({ id: 'docente' });
      return;
    }
    backend
      .yo()
      .then(async (perfil) => {
        if (!perfil) return ir({ id: 'bienvenida' });
        await backend.tomarPestana();
        setPerfil(perfil);
        ir({ id: 'mapa' });
      })
      .catch((e) => {
        manejarError(e);
        ir({ id: 'bienvenida' });
      });
  }, [backend, ir, setPerfil, manejarError]);

  let vista;
  switch (pantalla.id) {
    case 'cargando':
      vista = <Cargando texto="Abriendo el Reino del Equilibrio…" />;
      break;
    case 'bienvenida':
      vista = <Bienvenida />;
      break;
    case 'ingreso':
      vista = <Ingreso />;
      break;
    case 'practica':
      vista = <Practica />;
      break;
    case 'mapa':
      vista = <Mapa />;
      break;
    case 'isla':
      vista = <Isla numero={pantalla.isla} />;
      break;
    case 'juego':
      vista = <Juego key={visita} etapaId={pantalla.etapaId} />;
      break;
    case 'tienda':
      vista = <Tienda />;
      break;
    case 'logros':
      vista = <Logros />;
      break;
    case 'ranking':
      vista = <Ranking />;
      break;
    case 'ajustes':
      vista = <PantallaAjustes />;
      break;
    case 'docente':
      vista = <Docente />;
      break;
  }

  return (
    <div className="app">
      <main>{vista}</main>
      <Avisos />
      <AvisoOtraPestana />
    </div>
  );
}
