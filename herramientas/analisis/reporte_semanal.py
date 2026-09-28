"""
Reporte semanal de Balanza Mágica por correo.

Cada semana (GitHub Actions, ver .github/workflows/reporte-semanal.yml):
  1. entra al panel docente del juego con la clave docente,
  2. descarga el registro de desafíos de cada curso,
  3. resume la semana: quiénes jugaron, cuánto lograron, quiénes necesitan
     apoyo, los errores típicos más frecuentes con una sugerencia para la clase,
  4. envía un correo con el resumen y, adjunto, el informe completo con gráficos.

Solo se usan apodos: el correo no contiene datos personales.

Configuración (variables de entorno):
  BALANZA_URL       https://balanza.profesoraevelyn.com
  CLAVE_DOCENTE     la clave del panel docente
  SMTP_HOST         por ejemplo mail.profesoraevelyn.com
  SMTP_PUERTO       465 (SSL) o 587 (STARTTLS)
  SMTP_USUARIO      por ejemplo reportes@profesoraevelyn.com
  SMTP_CLAVE        la clave de esa cuenta de correo
  CORREO_DESTINO    uno o más correos separados por coma
  CORREO_REMITENTE  (opcional) por defecto, SMTP_USUARIO

Uso sin servidor ni correo (para probar):
  python reporte_semanal.py --csv datos_ejemplo.csv --salida reporte/ --ahora 2026-09-26
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import io
import json
import os
import smtplib
import ssl
import sys
from dataclasses import dataclass, field
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPCookieProcessor, Request, build_opener

import pandas as pd

import analizar

AQUI = Path(__file__).resolve().parent
ZONA = "America/Santiago"
DIAGNOSTICOS: dict[str, dict[str, str]] = json.loads((AQUI / "diagnosticos.json").read_text(encoding="utf-8"))
ETAPAS: dict[str, str] = json.loads((AQUI / "etapas.json").read_text(encoding="utf-8"))
MINIMO_PARA_ALERTA = 5  # desafíos en la semana antes de marcar "necesita apoyo"


# ---------------------------------------------------------------------------
# Conexión con el juego
# ---------------------------------------------------------------------------


class ErrorReporte(Exception):
    pass


class ClienteBalanza:
    """Cliente mínimo del panel docente (cookie de sesión + cabecera antifalsificación)."""

    def __init__(self, url: str):
        if not url.startswith("https://") and not url.startswith("http://localhost") and not url.startswith("http://127.0.0.1"):
            raise ErrorReporte("BALANZA_URL debe empezar con https:// (la cookie de sesión solo viaja cifrada).")
        self.url = url.rstrip("/")
        self._abrir = build_opener(HTTPCookieProcessor(CookieJar())).open

    def _pedir(self, ruta: str, datos: dict | None = None) -> bytes:
        cuerpo = json.dumps(datos).encode("utf-8") if datos is not None else None
        req = Request(
            self.url + ruta,
            data=cuerpo,
            method="POST" if cuerpo is not None else "GET",
            headers={"x-balanza": "1", "Content-Type": "application/json", "User-Agent": "BalanzaMagica-ReporteSemanal/1.0"},
        )
        try:
            with self._abrir(req, timeout=30) as r:
                return r.read()
        except HTTPError as e:
            detalle = e.read().decode("utf-8", "replace")[:200]
            raise ErrorReporte(f"{ruta}: el servidor respondió {e.code} {detalle}") from None
        except URLError as e:
            raise ErrorReporte(f"No se pudo conectar con {self.url}: {e.reason}") from None

    def ingresar(self, clave: str) -> None:
        self._pedir("/api/docente/ingreso", {"clave": clave})

    def cursos(self) -> list[dict]:
        return json.loads(self._pedir("/api/docente/cursos"))["cursos"]

    def eventos_csv(self, curso_id: str) -> str:
        return self._pedir(f"/api/docente/cursos/{curso_id}/eventos.csv").decode("utf-8-sig")


# ---------------------------------------------------------------------------
# Resumen de la semana
# ---------------------------------------------------------------------------


@dataclass
class ResumenCurso:
    nombre: str
    activos: list[str] = field(default_factory=list)
    inactivos: list[str] = field(default_factory=list)
    desafios: int = 0
    logro: float = 0.0
    apoyo: list[str] = field(default_factory=list)
    destacados: list[str] = field(default_factory=list)
    errores: list[tuple[str, int, int]] = field(default_factory=list)  # (código, veces, estudiantes)
    etapas: list[tuple[str, int]] = field(default_factory=list)
    informe: str | None = None


def cargar_csv(texto: str) -> pd.DataFrame:
    if not texto.strip() or len(texto.strip().splitlines()) < 2:
        return pd.DataFrame()
    return analizar.cargar(io.StringIO(texto))


def resumir(nombre: str, df: pd.DataFrame, ahora: dt.datetime, dias: int = 7) -> ResumenCurso:
    r = ResumenCurso(nombre=nombre)
    if df.empty:
        return r
    desde = ahora - dt.timedelta(days=dias)
    semana = df[(df["fecha"] >= desde) & (df["fecha"] <= ahora)]
    todos = sorted(df["apodo"].unique())
    r.activos = sorted(semana["apodo"].unique())
    r.inactivos = [a for a in todos if a not in r.activos]
    if semana.empty:
        return r
    r.desafios = len(semana)
    r.logro = float(semana["exito"].mean() * 100)
    est = analizar.por_estudiante(semana)
    r.apoyo = [a for a, f in est.iterrows() if f["logro_%"] < 60 and f["desafios"] >= MINIMO_PARA_ALERTA]
    r.destacados = [a for a, f in est.iterrows() if f["alerta"] == "Listo/a para desafíos mayores"]
    err = analizar.errores(semana)
    r.errores = [(str(c), int(f["veces"]), int(f["estudiantes"])) for c, f in err.head(3).iterrows()]
    r.etapas = [(str(e), int(n)) for e, n in semana["etapa"].value_counts().head(3).items()]
    r.informe = analizar.informe_html(semana, est, analizar.logro_por_nivel(semana), err)
    return r


# ---------------------------------------------------------------------------
# Correo
# ---------------------------------------------------------------------------

ESTILO = (
    "body{font-family:Nunito,Segoe UI,Arial,sans-serif;color:#22103d;background:#fff8ef;margin:0;padding:0}"
    ".caja{max-width:640px;margin:0 auto;padding:16px}"
    ".cabecera{background:#4b1d8f;color:#fff;padding:20px;border-radius:16px}"
    ".curso{background:#fff;border:2px solid #22103d;border-radius:16px;padding:14px 16px;margin:14px 0}"
    ".kpi{display:inline-block;margin:0 16px 8px 0}.kpi b{font-size:1.5rem;display:block}"
    ".alerta{background:#fff3cf;border-left:5px solid #f5b82e;padding:8px 12px;border-radius:0 10px 10px 0;margin:8px 0}"
    "h2{margin:0 0 8px;color:#4b1d8f}h3{margin:12px 0 4px;font-size:1rem}li{margin:4px 0}.suave{color:#6b5a86;font-size:.9rem}"
)


def _lista(nombres: list[str]) -> str:
    return ", ".join(html.escape(n) for n in nombres)


def cuerpo_html(resumenes: list[ResumenCurso], desde: dt.date, hasta: dt.date) -> str:
    partes = [
        f"<!doctype html><html lang='es-CL'><head><meta charset='utf-8'><style>{ESTILO}</style></head><body><div class='caja'>",
        "<div class='cabecera'><h1 style='margin:0;font-size:1.4rem'>⚖️ Balanza Mágica · reporte semanal</h1>",
        f"<p style='margin:6px 0 0'>Semana del {desde:%d-%m-%Y} al {hasta:%d-%m-%Y}</p></div>",
    ]
    for r in resumenes:
        partes.append(f"<div class='curso'><h2>{html.escape(r.nombre)}</h2>")
        if r.desafios == 0:
            partes.append("<p>Sin actividad esta semana.</p>")
            if r.inactivos:
                partes.append(f"<p class='suave'>Estudiantes registrados: {len(r.inactivos)}.</p>")
            partes.append("</div>")
            continue
        partes.append(
            f"<div><span class='kpi'><b>{len(r.activos)}</b>jugaron</span>"
            f"<span class='kpi'><b>{r.desafios}</b>desafíos</span>"
            f"<span class='kpi'><b>{r.logro:.0f}%</b>logrados</span></div>"
        )
        if r.apoyo:
            partes.append(f"<div class='alerta'><b>Necesitan apoyo:</b> {_lista(r.apoyo)}</div>")
        if r.destacados:
            partes.append(f"<p><b>Listos para desafíos mayores:</b> {_lista(r.destacados)}</p>")
        if r.errores:
            partes.append("<h3>Errores más frecuentes y qué hacer en clase</h3><ol>")
            for codigo, veces, n in r.errores:
                d = DIAGNOSTICOS.get(codigo, {"titulo": codigo, "sugerencia": ""})
                partes.append(
                    f"<li><b>{html.escape(d['titulo'])}</b> ({veces} veces, {n} estudiantes)"
                    f"<br><span class='suave'>{html.escape(d['sugerencia'])}</span></li>"
                )
            partes.append("</ol>")
        if r.etapas:
            partes.append(
                "<p class='suave'>Etapas más jugadas: "
                + ", ".join(f"{html.escape(ETAPAS.get(e, e))} ({html.escape(e)}): {n}" for e, n in r.etapas)
                + "</p>"
            )
        if r.inactivos:
            partes.append(f"<p class='suave'>No jugaron esta semana: {_lista(r.inactivos)}</p>")
        partes.append("</div>")
    partes.append("<p class='suave'>El informe completo de cada curso, con gráficos, va adjunto. Solo se usan apodos.</p></div></body></html>")
    return "".join(partes)


def cuerpo_texto(resumenes: list[ResumenCurso], desde: dt.date, hasta: dt.date) -> str:
    lineas = [f"Balanza Mágica · reporte semanal ({desde:%d-%m-%Y} al {hasta:%d-%m-%Y})", ""]
    for r in resumenes:
        lineas.append(f"== {r.nombre} ==")
        if r.desafios == 0:
            lineas += ["Sin actividad esta semana.", ""]
            continue
        lineas.append(f"Jugaron: {len(r.activos)} · desafíos: {r.desafios} · logro: {r.logro:.0f}%")
        if r.apoyo:
            lineas.append(f"Necesitan apoyo: {', '.join(r.apoyo)}")
        for codigo, veces, n in r.errores:
            d = DIAGNOSTICOS.get(codigo, {"titulo": codigo, "sugerencia": ""})
            lineas.append(f"- {d['titulo']} ({veces} veces, {n} estudiantes). {d['sugerencia']}")
        lineas.append("")
    return "\n".join(lineas)


def construir_correo(resumenes: list[ResumenCurso], ahora: dt.datetime, remitente: str, destinos: list[str], dias: int = 7) -> EmailMessage:
    hasta = ahora.date()
    desde = (ahora - dt.timedelta(days=dias)).date()
    total = sum(r.desafios for r in resumenes)
    m = EmailMessage()
    m["Subject"] = f"Balanza Mágica · semana del {desde:%d-%m} al {hasta:%d-%m} · {total} desafíos"
    m["From"] = remitente
    m["To"] = ", ".join(destinos)
    m["Date"] = formatdate(localtime=True)
    m["Message-ID"] = make_msgid(domain=remitente.split("@")[-1] if "@" in remitente else None)
    m.set_content(cuerpo_texto(resumenes, desde, hasta))
    m.add_alternative(cuerpo_html(resumenes, desde, hasta), subtype="html")
    for r in resumenes:
        if r.informe:
            nombre = "".join(c if c.isalnum() else "-" for c in r.nombre).strip("-").lower() or "curso"
            m.add_attachment(r.informe.encode("utf-8"), maintype="text", subtype="html", filename=f"informe-{nombre}-{hasta:%Y-%m-%d}.html")
    return m


def enviar(m: EmailMessage, host: str, puerto: int, usuario: str, clave: str) -> None:
    contexto = ssl.create_default_context()
    if puerto == 465:
        with smtplib.SMTP_SSL(host, puerto, context=contexto, timeout=30) as s:
            s.login(usuario, clave)
            s.send_message(m)
    else:
        with smtplib.SMTP(host, puerto, timeout=30) as s:
            s.starttls(context=contexto)
            s.login(usuario, clave)
            s.send_message(m)


# ---------------------------------------------------------------------------
# Programa
# ---------------------------------------------------------------------------


def _env(nombre: str) -> str:
    v = os.environ.get(nombre, "").strip()
    if not v:
        raise ErrorReporte(f"Falta la variable {nombre}. Revisa los secretos del repositorio (docs/despliegue.md).")
    return v


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Reporte semanal de Balanza Mágica por correo")
    p.add_argument("--csv", type=Path, nargs="*", help="Usar estos CSV en vez de descargarlos del juego (un curso por archivo)")
    p.add_argument("--salida", type=Path, help="Guardar el correo en esta carpeta en vez de enviarlo")
    p.add_argument("--dias", type=int, default=7)
    p.add_argument("--ahora", help="Fecha de corte AAAA-MM-DD (por defecto, hoy)")
    a = p.parse_args(argv)

    ahora = pd.Timestamp(a.ahora, tz=ZONA) + pd.Timedelta(hours=23, minutes=59) if a.ahora else pd.Timestamp.now(tz=ZONA)
    ahora = ahora.to_pydatetime()

    try:
        if a.csv:
            cursos = [(ruta.stem, ruta.read_text(encoding="utf-8-sig")) for ruta in a.csv]
        else:
            cliente = ClienteBalanza(_env("BALANZA_URL"))
            cliente.ingresar(_env("CLAVE_DOCENTE"))
            cursos = [(f"{c['nombre']} ({c.get('codigo', '')})".replace(" ()", ""), cliente.eventos_csv(c["id"])) for c in cliente.cursos()]
        resumenes = [resumir(nombre, cargar_csv(texto), ahora, a.dias) for nombre, texto in cursos]

        if a.salida:
            remitente, destinos = "reportes@ejemplo.cl", ["docente@ejemplo.cl"]
        else:
            remitente = os.environ.get("CORREO_REMITENTE", "").strip() or _env("SMTP_USUARIO")
            destinos = [d.strip() for d in _env("CORREO_DESTINO").split(",") if d.strip()]
        correo = construir_correo(resumenes, ahora, remitente, destinos, a.dias)

        if a.salida:
            a.salida.mkdir(parents=True, exist_ok=True)
            (a.salida / "reporte.eml").write_bytes(bytes(correo))
            (a.salida / "reporte.html").write_text(cuerpo_html(resumenes, (ahora - dt.timedelta(days=a.dias)).date(), ahora.date()), encoding="utf-8")
            print(f"Correo guardado en {a.salida}/reporte.eml ({len(resumenes)} cursos)")
        else:
            enviar(correo, _env("SMTP_HOST"), int(os.environ.get("SMTP_PUERTO", "465") or 465), _env("SMTP_USUARIO"), _env("SMTP_CLAVE"))
            print(f"Reporte enviado a {len(destinos)} destinatario(s): {len(resumenes)} cursos, {sum(r.desafios for r in resumenes)} desafíos.")
    except ErrorReporte as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2
    except smtplib.SMTPException as e:
        print(f"Error al enviar el correo: {e}", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())
