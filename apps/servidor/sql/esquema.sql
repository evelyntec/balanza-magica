-- ============================================================================
-- Balanza Mágica — esquema MySQL / MariaDB
-- El servidor lo aplica solo al iniciar (CREATE TABLE IF NOT EXISTS).
-- Privacidad: de cada estudiante solo se guarda apodo, avatar y el hash de
-- su clave de figuras. Nunca nombres completos, RUT ni correos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS cursos (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  codigo      VARCHAR(12)  NOT NULL,
  nombre      VARCHAR(60)  NOT NULL,
  nivel       TINYINT      NOT NULL,
  creado_en   BIGINT       NOT NULL,
  UNIQUE KEY uq_cursos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jugadores (
  id           VARCHAR(32)  NOT NULL PRIMARY KEY,
  curso_id     VARCHAR(32)  NOT NULL,
  apodo        VARCHAR(40)  NOT NULL,
  apodo_clave  VARCHAR(40)  NOT NULL,
  puntos       INT          NOT NULL DEFAULT 0,
  datos        LONGTEXT     NOT NULL COMMENT 'JSON: progreso, insignias, inventario, estadísticas…',
  version      INT          NOT NULL DEFAULT 0,
  creado_en    BIGINT       NOT NULL,
  UNIQUE KEY uq_jugadores_apodo (curso_id, apodo_clave),
  KEY idx_jugadores_ranking (curso_id, puntos),
  CONSTRAINT fk_jugadores_curso FOREIGN KEY (curso_id) REFERENCES cursos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesiones (
  token_hash  VARCHAR(64)  NOT NULL PRIMARY KEY COMMENT 'SHA-256 del token: el token real nunca se guarda',
  jugador_id  VARCHAR(32)  NULL,
  docente     TINYINT(1)   NOT NULL DEFAULT 0,
  creada_en   BIGINT       NOT NULL,
  expira_en   BIGINT       NOT NULL,
  KEY idx_sesiones_jugador (jugador_id),
  KEY idx_sesiones_expira (expira_en),
  CONSTRAINT fk_sesiones_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partidas (
  id              VARCHAR(32)  NOT NULL PRIMARY KEY,
  jugador_id      VARCHAR(32)  NOT NULL,
  etapa_id        VARCHAR(8)   NOT NULL,
  cerrada         TINYINT(1)   NOT NULL DEFAULT 0,
  datos           LONGTEXT     NOT NULL,
  version         INT          NOT NULL DEFAULT 0,
  creada_en       BIGINT       NOT NULL,
  actualizada_en  BIGINT       NOT NULL,
  KEY idx_partidas_jugador (jugador_id),
  CONSTRAINT fk_partidas_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  partida_id  VARCHAR(32)  NOT NULL,
  jugador_id  VARCHAR(32)  NOT NULL,
  terminado   TINYINT(1)   NOT NULL DEFAULT 0,
  datos       LONGTEXT     NOT NULL COMMENT 'JSON con vista pública y SECRETO (respuesta): nunca sale del servidor',
  version     INT          NOT NULL DEFAULT 0,
  emitido_en  BIGINT       NOT NULL,
  KEY idx_items_partida (partida_id),
  KEY idx_items_limpieza (terminado, emitido_en),
  CONSTRAINT fk_items_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registro para el análisis pedagógico (panel docente, CSV y script de Python).
CREATE TABLE IF NOT EXISTS eventos (
  id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  curso_id     VARCHAR(32)  NOT NULL,
  jugador_id   VARCHAR(32)  NOT NULL,
  etapa_id     VARCHAR(8)   NOT NULL,
  tipo_item    VARCHAR(20)  NOT NULL,
  nivel        TINYINT      NOT NULL,
  resultado    VARCHAR(12)  NOT NULL,
  intentos     TINYINT      NOT NULL,
  pistas       TINYINT      NOT NULL,
  diagnostico  VARCHAR(40)  NULL,
  relacional   TINYINT(1)   NOT NULL DEFAULT 0,
  andamiaje    TINYINT(1)   NOT NULL DEFAULT 0,
  ms           INT          NOT NULL,
  puntos       INT          NOT NULL,
  fecha        BIGINT       NOT NULL,
  KEY idx_eventos_curso (curso_id, fecha),
  KEY idx_eventos_jugador (jugador_id),
  CONSTRAINT fk_eventos_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
