-- ============================================================================
-- Consultas útiles para la docente (phpMyAdmin → pestaña SQL).
-- Reemplaza 'CODIGO' por el código de tu curso.
-- ============================================================================

-- 1. Logro por estudiante (% de desafíos perfectos o logrados)
SELECT j.apodo,
       COUNT(*)                                                     AS desafios,
       ROUND(100 * AVG(e.resultado IN ('perfecto', 'logrado')), 0)  AS logro_pct,
       ROUND(AVG(e.pistas), 2)                                      AS pistas_promedio,
       MAX(e.nivel)                                                 AS nivel_maximo
FROM eventos e
JOIN jugadores j ON j.id = e.jugador_id
JOIN cursos c    ON c.id = e.curso_id
WHERE c.codigo = 'CODIGO'
GROUP BY j.apodo
ORDER BY logro_pct;

-- 2. Errores típicos más frecuentes del curso
SELECT e.diagnostico,
       COUNT(*)                     AS veces,
       COUNT(DISTINCT e.jugador_id) AS estudiantes
FROM eventos e
JOIN cursos c ON c.id = e.curso_id
WHERE c.codigo = 'CODIGO'
  AND e.diagnostico IS NOT NULL
  AND e.diagnostico <> 'generico'
GROUP BY e.diagnostico
ORDER BY veces DESC;

-- 3. ¿En qué nivel se vuelve difícil cada tipo de desafío?
SELECT e.tipo_item,
       e.nivel,
       COUNT(*)                                                    AS desafios,
       ROUND(100 * AVG(e.resultado IN ('perfecto', 'logrado')), 0) AS logro_pct
FROM eventos e
JOIN cursos c ON c.id = e.curso_id
WHERE c.codigo = 'CODIGO'
GROUP BY e.tipo_item, e.nivel
ORDER BY e.tipo_item, e.nivel;

-- 4. Quiénes muestran la visión operacional del signo igual (8 + 5 = □ + 7 → 13)
SELECT j.apodo, COUNT(*) AS veces
FROM eventos e
JOIN jugadores j ON j.id = e.jugador_id
JOIN cursos c    ON c.id = e.curso_id
WHERE c.codigo = 'CODIGO'
  AND e.diagnostico IN ('resultado_del_otro_lado', 'vf_invertida', 'vf_encadenada')
GROUP BY j.apodo
ORDER BY veces DESC;

-- 5. Actividad por día (hora de Chile)
SELECT DATE(CONVERT_TZ(FROM_UNIXTIME(e.fecha / 1000), '+00:00', '-03:00')) AS dia,
       COUNT(*)                                                             AS desafios,
       COUNT(DISTINCT e.jugador_id)                                         AS estudiantes
FROM eventos e
JOIN cursos c ON c.id = e.curso_id
WHERE c.codigo = 'CODIGO'
GROUP BY dia
ORDER BY dia;
