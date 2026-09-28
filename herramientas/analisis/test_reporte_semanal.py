"""Pruebas del reporte semanal: python -m pytest herramientas/analisis"""

from __future__ import annotations

import datetime as dt
import email
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pandas as pd
import pytest

import reporte_semanal as rs

DATOS = Path(__file__).with_name("datos_ejemplo.csv")
TEXTO = DATOS.read_text(encoding="utf-8-sig")
AHORA = pd.Timestamp("2026-10-31 23:59", tz=rs.ZONA).to_pydatetime()


def test_resumen_de_la_semana():
    r = rs.resumir("7°A", rs.cargar_csv(TEXTO), AHORA)
    assert r.desafios > 0
    assert 0 <= r.logro <= 100
    assert len(r.activos) + len(r.inactivos) == 24
    assert r.errores and all(codigo in rs.DIAGNOSTICOS for codigo, _, _ in r.errores)
    # La semana solo incluye los últimos 7 días.
    df = rs.cargar_csv(TEXTO)
    esperados = ((df["fecha"] >= AHORA - dt.timedelta(days=7)) & (df["fecha"] <= AHORA)).sum()
    assert r.desafios == esperados


def test_curso_sin_actividad():
    vacio = rs.resumir("8°B", rs.cargar_csv(TEXTO.splitlines()[0] + "\n"), AHORA)
    assert vacio.desafios == 0
    antiguo = rs.resumir("8°B", rs.cargar_csv(TEXTO), AHORA + dt.timedelta(days=60))
    assert antiguo.desafios == 0 and len(antiguo.inactivos) == 24
    assert "Sin actividad esta semana" in rs.cuerpo_html([antiguo], AHORA.date(), AHORA.date())


def test_correo_con_resumen_y_adjunto():
    r = rs.resumir("7°A <b>", rs.cargar_csv(TEXTO), AHORA)
    m = rs.construir_correo([r], AHORA, "reportes@profesoraevelyn.com", ["docente@ejemplo.cl"])
    assert "desafíos" in m["Subject"]
    partes = list(m.walk())
    tipos = [p.get_content_type() for p in partes]
    assert "text/plain" in tipos and "text/html" in tipos
    adjuntos = [p for p in partes if p.get_filename()]
    assert len(adjuntos) == 1 and adjuntos[0].get_filename().endswith(".html")
    html = next(p for p in partes if p.get_content_type() == "text/html" and not p.get_filename()).get_content()
    assert "&lt;b&gt;" in html  # el nombre del curso se escapa
    assert "Errores más frecuentes" in html


def test_modo_sin_servidor(tmp_path):
    assert rs.main(["--csv", str(DATOS), "--salida", str(tmp_path), "--ahora", "2026-10-31"]) == 0
    from email import policy

    correo = email.message_from_bytes((tmp_path / "reporte.eml").read_bytes(), policy=policy.default)
    assert correo["Subject"].startswith("Balanza Mágica")
    assert (tmp_path / "reporte.html").read_text(encoding="utf-8").count("class='curso'") == 1


def test_exige_https():
    with pytest.raises(rs.ErrorReporte):
        rs.ClienteBalanza("http://balanza.ejemplo.cl")


class ServidorFalso(BaseHTTPRequestHandler):
    """Imita el panel docente: exige la cabecera x-balanza y la cookie de sesión."""

    def log_message(self, *args):  # silencio
        pass

    def _responder(self, codigo: int, cuerpo: bytes, tipo="application/json", cabeceras=None):
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        for k, v in (cabeceras or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_POST(self):
        largo = int(self.headers.get("Content-Length", 0))
        datos = json.loads(self.rfile.read(largo))
        if self.path != "/api/docente/ingreso" or self.headers.get("x-balanza") != "1":
            return self._responder(403, b"{}")
        if datos.get("clave") != "clave-docente-larga":
            return self._responder(401, b'{"error":{"codigo":"CLAVE"}}')
        self._responder(200, b'{"ok":true}', cabeceras={"Set-Cookie": "balanza=abc; Path=/; HttpOnly; SameSite=Strict"})

    def do_GET(self):
        if "balanza=abc" not in self.headers.get("Cookie", ""):
            return self._responder(401, b"{}")
        if self.path == "/api/docente/cursos":
            return self._responder(200, json.dumps({"cursos": [{"id": "c1", "nombre": "7°A", "codigo": "ABC123"}]}).encode())
        if self.path == "/api/docente/cursos/c1/eventos.csv":
            return self._responder(200, ("﻿" + TEXTO).encode("utf-8"), tipo="text/csv; charset=utf-8")
        self._responder(404, b"{}")


def test_descarga_del_juego_y_envio(monkeypatch):
    servidor = ThreadingHTTPServer(("127.0.0.1", 0), ServidorFalso)
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    enviados = []
    try:
        monkeypatch.setenv("BALANZA_URL", f"http://127.0.0.1:{servidor.server_port}")
        monkeypatch.setenv("CLAVE_DOCENTE", "clave-docente-larga")
        for k, v in {"SMTP_HOST": "mail.ejemplo.cl", "SMTP_PUERTO": "465", "SMTP_USUARIO": "reportes@ejemplo.cl", "SMTP_CLAVE": "x", "CORREO_DESTINO": "a@ejemplo.cl, b@ejemplo.cl"}.items():
            monkeypatch.setenv(k, v)
        monkeypatch.setattr(rs, "enviar", lambda m, *a: enviados.append((m, a)))
        assert rs.main(["--ahora", "2026-10-31"]) == 0
        m, args = enviados[0]
        assert m["To"] == "a@ejemplo.cl, b@ejemplo.cl"
        assert "7°A (ABC123)" in m.get_body(("html",)).get_content()
        assert args[0] == "mail.ejemplo.cl" and args[1] == 465

        # Clave equivocada: termina con error, sin enviar nada.
        monkeypatch.setenv("CLAVE_DOCENTE", "otra-clave-cualquiera")
        enviados.clear()
        assert rs.main(["--ahora", "2026-10-31"]) == 2
        assert enviados == []
    finally:
        servidor.shutdown()


def test_falta_configuracion(monkeypatch):
    for k in ["BALANZA_URL", "CLAVE_DOCENTE"]:
        monkeypatch.delenv(k, raising=False)
    assert rs.main([]) == 2
