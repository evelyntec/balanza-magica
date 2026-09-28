"""
Análisis pedagógico de Balanza Mágica.

Lee el CSV que se descarga desde el panel docente y genera un informe HTML
(con gráficos) para decidir qué reforzar en clases.

Uso:
    pip install pandas matplotlib
    python analizar.py datos_ejemplo.csv --salida informe.html

Solo usa apodos: el informe no contiene datos personales.
"""

from __future__ import annotations

import argparse
import base64
import io
import sys
from pathlib import Path

import pandas as pd

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    HAY_GRAFICOS = True
except ImportError:  # El informe funciona igual, solo sin gráficos.
    HAY_GRAFICOS = False

EXITO = {"perfecto", "logrado"}

COLORES = {"violeta": "#7b3fbf", "fucsia": "#e0457b", "oro": "#f5b82e", "tinta": "#22103d", "verde": "#2fb37a"}

NOMBRES_TIPO = {
    "inclinacion": "¿Hacia dónde baja?",
    "equilibrar": "Completar la caja",
    "registrar": "Registrar la igualdad",
    "patron_figuras": "Patrones de figuras",
    "patron_numerico": "Patrones numéricos",
    "signo": "Signos <, =, >",
    "verdadero_falso": "Verdadero o falso",
    "ecuacion": "Ecuaciones de un paso",
    "tabla100": "Tabla del 100",
    "problema": "Problemas con ecuaciones",
    "tabla_regla": "Tablas con regla",
    "inecuacion": "Inecuaciones",
    "sucesion": "Sucesiones y predicciones",
    "grafico_solucion": "Graficar soluciones",
    "expresion": "Fórmulas con letras",
    "ecuacion_dos_pasos": "Ecuaciones de dos pasos",
}

DIAGNOSTICOS = {
    "direccion_opuesta": "Cree que el lado más pesado sube",
    "equilibrio_falso": "Ve equilibrio donde no lo hay",
    "desequilibrio_falso": "No reconoce el equilibrio con expresiones distintas",
    "resultado_del_otro_lado": "Visión operacional del «=» (8 + 5 = □ + 7 → 13)",
    "suma_todo": "Suma todos los números que ve",
    "muy_liviana": "Propone un valor menor al necesario",
    "muy_pesada": "Propone un valor mayor al necesario",
    "signo_invertido": "Confunde < y >",
    "conteo": "Errores de conteo (±1)",
    "lados_invertidos": "Registra los lados al revés",
    "patron_repite_ultimo": "Repite el último elemento del patrón",
    "patron_nucleo_corto": "Núcleo del patrón incompleto",
    "patron_nucleo_largo": "Núcleo del patrón con elementos de más",
    "patron_posicion": "Error por un lugar en posiciones lejanas",
    "patron_paso_errado": "Calcula mal el salto del patrón",
    "patron_direccion": "Confunde patrón creciente y decreciente",
    "patron_parcial": "Completa solo parte del patrón",
    "patron_regla": "No identifica la regla",
    "vf_invertida": "Rechaza 8 = 5 + 3 (resultado a la izquierda)",
    "vf_identidad": "Rechaza igualdades como 7 = 7",
    "vf_conmutativa": "No reconoce la conmutatividad",
    "vf_compensacion": "No reconoce la compensación",
    "vf_encadenada": "Acepta cálculos encadenados (8 + 4 = 12 + 5)",
    "vf_casi": "No verifica ambos lados con precisión",
    "vf_resta": "Errores en igualdades con resta",
    "operacion_inversa": "Usa la operación directa en vez de la inversa",
    "error_decena": "Error de una decena (canje)",
    "tabla_fila_columna": "Confunde filas y columnas en la tabla del 100",
    "modelo_palabra_clave": "Resuelve por palabras clave («más» → sumar)",
    "modelo_errado": "Elige una ecuación que no representa la historia",
    "regla_recursiva": "Busca la regla solo en la columna de salida",
    "regla_operacion": "Confunde la operación de la regla (+ con ×)",
    "inecuacion_igualdad": "Resuelve la inecuación como ecuación",
    "inecuacion_un_valor": "Encuentra solo algunas soluciones",
    "inecuacion_borde": "Incluye el borde (< como ≤)",
    "inecuacion_direccion": "Marca el lado contrario de la recta",
    "sucesion_proporcional": "Supone proporcionalidad en la sucesión",
    "sucesion_sin_inicio": "Olvida el término inicial",
    "sucesion_desfase": "Cuenta un salto de más o de menos",
    "sucesion_aditiva": "Supone que siempre se suma lo mismo",
    "sucesion_regla": "Elige una regla que no sirve para todos",
    "ecuacion_rayo": "Dibuja muchas soluciones para una ecuación",
    "formula_recursiva": "Escribe la regla recursiva como fórmula (n + 3)",
    "formula_proporcional": "Escribe una fórmula proporcional (4 · n)",
    "formula_sin_constante": "Olvida la constante de la fórmula",
    "formula_constante": "Constante equivocada en la fórmula",
    "formula_evaluacion": "Error al evaluar la fórmula",
    "ecuacion_sin_dividir": "No reparte: deja 3x = 21",
    "ecuacion_orden": "Divide antes de quitar la constante",
}


def cargar(ruta: Path) -> pd.DataFrame:
    df = pd.read_csv(ruta, encoding="utf-8-sig")
    requeridas = {"fecha", "apodo", "etapa", "tipo", "nivel", "resultado", "pistas", "diagnostico", "segundos", "puntos"}
    faltan = requeridas - set(df.columns)
    if faltan:
        raise ValueError(f"Al CSV le faltan columnas: {', '.join(sorted(faltan))}")
    df["fecha"] = pd.to_datetime(df["fecha"], utc=True).dt.tz_convert("America/Santiago")
    df["exito"] = df["resultado"].isin(EXITO)
    df["dia"] = df["fecha"].dt.date
    df["apodo"] = df["apodo"].astype(str).str.lstrip("'")
    return df


def por_estudiante(df: pd.DataFrame) -> pd.DataFrame:
    g = df.groupby("apodo")
    tabla = pd.DataFrame(
        {
            "desafios": g.size(),
            "logro_%": (g["exito"].mean() * 100).round(0),
            "perfectos": g.apply(lambda x: (x["resultado"] == "perfecto").sum(), include_groups=False),
            "pistas_por_desafio": g["pistas"].mean().round(2),
            "nivel_max": g["nivel"].max(),
            "segundos_mediana": g["segundos"].median().round(1),
            "ultima_etapa": g["etapa"].max(),
            "dias": g["dia"].nunique(),
            "puntos": g["puntos"].sum(),
        }
    ).sort_values("logro_%")
    tabla["alerta"] = ""
    tabla.loc[tabla["logro_%"] < 60, "alerta"] = "Necesita apoyo"
    tabla.loc[(tabla["logro_%"] >= 90) & (tabla["nivel_max"] >= 5), "alerta"] = "Listo/a para desafíos mayores"
    return tabla


def logro_por_nivel(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby(["tipo", "nivel"])["exito"].mean() * 100).round(0).unstack("nivel")


def errores(df: pd.DataFrame) -> pd.DataFrame:
    e = df[df["diagnostico"].notna() & (df["diagnostico"] != "generico")]
    if e.empty:
        return pd.DataFrame(columns=["veces", "estudiantes", "descripcion"])
    t = e.groupby("diagnostico").agg(veces=("apodo", "size"), estudiantes=("apodo", "nunique")).sort_values("veces", ascending=False)
    t["descripcion"] = [DIAGNOSTICOS.get(c, c) for c in t.index]
    return t


def grafico(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    return f'<img alt="gráfico" src="data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}">'


def graficos(df: pd.DataFrame, est: pd.DataFrame, niv: pd.DataFrame, err: pd.DataFrame) -> list[str]:
    if not HAY_GRAFICOS:
        return []
    salida = []
    fig, ax = plt.subplots(figsize=(9, max(3, len(est) * 0.28)))
    colores = [COLORES["fucsia"] if v < 60 else COLORES["violeta"] if v < 90 else COLORES["verde"] for v in est["logro_%"]]
    ax.barh(est.index, est["logro_%"], color=colores)
    ax.axvline(60, color=COLORES["tinta"], linestyle="--", linewidth=1)
    ax.set_xlabel("% de desafíos logrados")
    ax.set_title("Logro por estudiante (línea: 60 %)")
    ax.set_xlim(0, 100)
    salida.append(grafico(fig))

    fig, ax = plt.subplots(figsize=(9, 4))
    for tipo, fila in niv.iterrows():
        ax.plot(fila.index, fila.values, marker="o", label=NOMBRES_TIPO.get(str(tipo), str(tipo)))
    ax.set_xlabel("Nivel de dificultad")
    ax.set_ylabel("% logrado")
    ax.set_ylim(0, 100)
    ax.set_xticks(range(1, 6))
    ax.set_title("¿Dónde se vuelve difícil? Logro por nivel")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.3)
    salida.append(grafico(fig))

    if not err.empty:
        top = err.head(8).iloc[::-1]
        fig, ax = plt.subplots(figsize=(9, 3.5))
        ax.barh(top["descripcion"], top["veces"], color=COLORES["oro"], edgecolor=COLORES["tinta"])
        ax.set_xlabel("Veces")
        ax.set_title("Errores típicos más frecuentes")
        salida.append(grafico(fig))

    diario = df.groupby("dia")["exito"].agg(["mean", "size"])
    if len(diario) > 1:
        fig, ax = plt.subplots(figsize=(9, 3))
        ax.bar([str(d) for d in diario.index], diario["size"], color=COLORES["violeta"], alpha=0.6, label="desafíos")
        ax2 = ax.twinx()
        ax2.plot([str(d) for d in diario.index], diario["mean"] * 100, color=COLORES["fucsia"], marker="o", label="% logro")
        ax2.set_ylim(0, 100)
        ax.set_title("Actividad y logro por día")
        ax.tick_params(axis="x", rotation=45)
        salida.append(grafico(fig))
    return salida


def informe_html(df: pd.DataFrame, est: pd.DataFrame, niv: pd.DataFrame, err: pd.DataFrame) -> str:
    total = len(df)
    logro = df["exito"].mean() * 100 if total else 0
    apoyo = est[est["alerta"] == "Necesita apoyo"].index.tolist()
    principal = err.index[0] if not err.empty else None
    recomendaciones = []
    if apoyo:
        recomendaciones.append(f"Formar un grupo de apoyo con: {', '.join(apoyo)}.")
    if principal:
        recomendaciones.append(f"Error más frecuente: <b>{DIAGNOSTICOS.get(principal, principal)}</b>. Planificar una clase con material concreto sobre este punto.")
    if "resultado_del_otro_lado" in err.index or "vf_invertida" in err.index:
        recomendaciones.append("Trabajar el signo igual como relación de equilibrio (8 + 5 = □ + 7), no como «escribe el resultado».")
    estilo = """
    body{font-family:Nunito,system-ui,sans-serif;margin:0;background:#fff8ef;color:#22103d}
    header{background:linear-gradient(135deg,#2a1052,#7b3fbf,#e0457b);color:#fff;padding:28px 20px}
    main{max-width:1000px;margin:0 auto;padding:16px}
    h1{margin:0;font-size:2rem} h2{color:#4b1d8f}
    .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
    .kpi{background:#fff;border:3px solid #22103d;border-radius:18px;padding:12px}
    .kpi b{font-size:1.8rem;display:block}
    table{border-collapse:collapse;width:100%;background:#fff;font-size:.9rem}
    th,td{padding:6px 8px;border-bottom:1px solid #efe6fb;text-align:left}
    th{background:#4b1d8f;color:#fff}
    img{max-width:100%;background:#fff;border-radius:12px;margin:8px 0}
    .nota{background:#fff3cf;border-left:5px solid #f5b82e;padding:10px 14px;border-radius:0 12px 12px 0}
    """
    partes = [
        f"<!doctype html><html lang='es-CL'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Informe Balanza Mágica</title><style>{estilo}</style></head><body>",
        "<header><h1>Informe de aprendizaje · Balanza Mágica</h1><p>Eje de álgebra · generado a partir del registro de desafíos (solo apodos).</p></header><main>",
        "<div class='kpis'>",
        f"<div class='kpi'><b>{df['apodo'].nunique()}</b>estudiantes</div>",
        f"<div class='kpi'><b>{total}</b>desafíos</div>",
        f"<div class='kpi'><b>{logro:.0f}%</b>logrados</div>",
        f"<div class='kpi'><b>{df['pistas'].mean():.2f}</b>pistas por desafío</div>",
        "</div>",
        "<h2>Recomendaciones</h2>",
        "<div class='nota'>" + ("<br>".join(recomendaciones) if recomendaciones else "¡Buen avance general!") + "</div>",
    ]
    for g in graficos(df, est, niv, err):
        partes.append(g)
    partes += [
        "<h2>Estudiantes</h2>",
        est.to_html(classes="tabla", border=0),
        "<h2>Logro por tipo de desafío y nivel (%)</h2>",
        niv.rename(index=NOMBRES_TIPO).to_html(border=0, na_rep="—"),
        "<h2>Errores típicos</h2>",
        err.to_html(border=0) if not err.empty else "<p>Sin errores registrados.</p>",
        "</main></body></html>",
    ]
    return "\n".join(partes)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Informe pedagógico de Balanza Mágica")
    p.add_argument("csv", type=Path, help="CSV descargado del panel docente")
    p.add_argument("--salida", type=Path, default=Path("informe.html"))
    a = p.parse_args(argv)

    df = cargar(a.csv)
    if df.empty:
        print("El CSV no tiene desafíos registrados.")
        return 1
    est = por_estudiante(df)
    niv = logro_por_nivel(df)
    err = errores(df)

    print(f"Estudiantes: {df['apodo'].nunique()} · desafíos: {len(df)} · logro: {df['exito'].mean() * 100:.0f}%")
    print("\nNecesitan apoyo:", ", ".join(est[est["alerta"] == "Necesita apoyo"].index) or "nadie")
    print("\nErrores más frecuentes:")
    for codigo, fila in err.head(5).iterrows():
        print(f"  - {fila['descripcion']}: {fila['veces']} veces ({fila['estudiantes']} estudiantes)")

    a.salida.write_text(informe_html(df, est, niv, err), encoding="utf-8")
    print(f"\nInforme guardado en {a.salida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
