"""Pruebas del análisis: python -m pytest herramientas/analisis"""

from pathlib import Path

import analizar

DATOS = Path(__file__).with_name("datos_ejemplo.csv")


def test_carga_y_resumen():
    df = analizar.cargar(DATOS)
    assert df["apodo"].nunique() == 24
    est = analizar.por_estudiante(df)
    assert set(est["alerta"].unique()) <= {"", "Necesita apoyo", "Listo/a para desafíos mayores"}
    assert (est["logro_%"].between(0, 100)).all()


def test_errores_tipicos_detectados():
    err = analizar.errores(analizar.cargar(DATOS))
    assert "resultado_del_otro_lado" in err.index


def test_informe(tmp_path):
    salida = tmp_path / "informe.html"
    assert analizar.main([str(DATOS), "--salida", str(salida)]) == 0
    html = salida.read_text(encoding="utf-8")
    assert "Informe de aprendizaje" in html
    assert "data:image/png;base64" in html
