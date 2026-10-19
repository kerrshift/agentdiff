"""Shareable spend card: a self-contained HTML page that draws a PNG.

The page renders the card on a <canvas> in the browser (brand fonts from
Google Fonts, system fonts as fallback) and offers Download / Copy buttons,
sized for LinkedIn and X. No Python image dependencies.

Privacy: the card only carries aggregate numbers and finding categories —
never session titles, project names, file paths or commands.
"""

import json
from pathlib import Path
from typing import Any

from agentdiff import __version__
from agentdiff.sessions.analyzer import Analysis
from agentdiff.sessions.report import KIND_LABEL

DEFAULT_NAME = "agentdiff-card.html"
RUN_COMMAND = "npx @kerrshift/agentdiff"


def _period_label(period: str) -> str:
    """'last 7d' -> 'last 7 days'; 'all time' stays."""
    units = {"m": "minute", "h": "hour", "d": "day", "w": "week"}
    if period.startswith("last "):
        amount = period[5:]
        if amount[:-1].isdigit() and amount[-1] in units:
            n = int(amount[:-1])
            unit = units[amount[-1]] + ("s" if n != 1 else "")
            return f"last {n} {unit}"
    return period


def card_data(
    analysis: Analysis, *, period: str, agent: str = "Claude Code"
) -> dict[str, Any]:
    spend = analysis.spend
    by_kind: dict[str, float] = {}
    for finding in analysis.findings:
        if finding.is_waste:
            by_kind[finding.kind] = by_kind.get(finding.kind, 0.0) + finding.usd
    leaks = [
        {"label": KIND_LABEL.get(kind, kind), "usd": round(usd, 2)}
        for kind, usd in sorted(by_kind.items(), key=lambda kv: -kv[1])
        if usd >= 0.01
    ]
    return {
        "agent": agent,
        "period": _period_label(period),
        "sessions": len(analysis.sessions),
        "projects": len({s.session.project for s in analysis.sessions}),
        "total": round(analysis.total, 2),
        "avoidable": round(analysis.waste, 2),
        "breakdown": [
            {"label": "Re-reading context", "usd": round(spend.cache_read, 2)},
            {"label": "Writing context to cache", "usd": round(spend.cache_write, 2)},
            {"label": "Model output", "usd": round(spend.output, 2)},
            {"label": "Background calls", "usd": round(spend.background, 2)},
        ],
        "leaks": leaks[:3],
        "command": RUN_COMMAND,
        "version": __version__,
    }


def build_card_html(data: dict[str, Any]) -> str:
    payload = json.dumps(data).replace("</", "<\\/")
    return _TEMPLATE.replace("__AGENTDIFF_DATA__", payload)


def write_card(analysis: Analysis, *, period: str, out: Path) -> Path:
    out = Path(out)
    if out.is_dir():
        out = out / DEFAULT_NAME
    out.write_text(
        build_card_html(card_data(analysis, period=period)), encoding="utf-8"
    )
    return out


_TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgentDiff card</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; background: #050506; color: #e8eaed;
         font: 14px/1.5 Manrope, system-ui, sans-serif; display: flex; flex-direction: column;
         align-items: center; gap: 18px; padding: 28px 16px; box-sizing: border-box; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  button { font: 600 13px Manrope, system-ui, sans-serif; color: #e8eaed; background: #14161a;
           border: 1px solid #2a2d33; border-radius: 999px; padding: 8px 16px; cursor: pointer; }
  button[aria-pressed="true"] { background: #e8eaed; color: #0b0c0e; border-color: #e8eaed; }
  button.primary { background: #0fa47f; border-color: #0fa47f; color: #fff; }
  canvas { width: min(100%, 900px); height: auto; border-radius: 14px;
           box-shadow: 0 20px 60px -20px rgba(0,0,0,.7); }
  canvas.portrait { width: min(100%, 520px); }
  p.note { color: #6b7480; font-size: 12px; margin: 0; text-align: center; max-width: 640px; }
  #status { color: #0fa47f; min-height: 1em; font-size: 12px; }
</style>
</head>
<body>
<div class="bar" role="group" aria-label="Card options">
  <button data-size="landscape" aria-pressed="true">Landscape · X / LinkedIn</button>
  <button data-size="portrait" aria-pressed="false">Portrait · LinkedIn</button>
  <button id="dollars" aria-pressed="false">Hide $</button>
  <button id="theme" aria-pressed="false">Light</button>
</div>
<canvas id="card" aria-label="AgentDiff spend card"></canvas>
<div class="bar">
  <button class="primary" id="download">Download PNG</button>
  <button id="copy">Copy image</button>
</div>
<div id="status" role="status"></div>
<p class="note">Only totals and categories are on the card: no project names, files or commands.
Made with AgentDiff, from your local Claude Code logs.</p>
<script>
const D = __AGENTDIFF_DATA__;
const SIZES = { landscape: [1200, 675], portrait: [1080, 1350] };
const THEMES = {
  dark:  { bg: "#0b0c0e", panel: "#14161a", fg: "#e8eaed", muted: "#a9b0ba", faint: "#6b7480",
           border: "#23262b", accent: "#10b981", danger: "#f87171", track: "#1d2025" },
  light: { bg: "#fbfbfc", panel: "#ffffff", fg: "#18181b", muted: "#52525b", faint: "#a1a1aa",
           border: "#e4e4e7", accent: "#0fa47f", danger: "#e5484d", track: "#f0f0f2" },
};
const state = { size: "landscape", hide: false, theme: "dark" };
const SANS = "Manrope, system-ui, -apple-system, Segoe UI, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const canvas = document.getElementById("card");
const ctx = canvas.getContext("2d");

const usd = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (part, whole) => whole > 0 ? Math.round(part / whole * 100) : 0;

function font(weight, size, family) { ctx.font = `${weight} ${size}px ${family}`; }
function text(s, x, y, color, align = "left") { ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); }
function rrect(x, y, w, h, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function fitFont(weight, size, family, s, maxW) {
  font(weight, size, family);
  while (ctx.measureText(s).width > maxW && size > 12) { size -= 2; font(weight, size, family); }
  return size;
}

function headline() {
  const share = pct(D.avoidable, D.total);
  const first = state.hide ? `My ${D.agent} spend,` : `${usd(D.total)} on ${D.agent}.`;
  const second = D.avoidable >= 0.01 ? `${share}% was avoidable.` : "Nothing avoidable found.";
  return [first, second];
}

function drawBars(x, y, w, rowH, t, k) {
  const total = D.total || 1;
  font(700, 14 * k, MONO);
  text("WHERE IT WENT", x, y, t.faint);
  y += 38 * k;
  for (const row of D.breakdown) {
    if (row.usd < 0.005) continue;
    const p = pct(row.usd, total);
    font(600, 21 * k, SANS);
    text(row.label, x, y, t.muted);
    font(700, 21 * k, MONO);
    text(state.hide ? `${p}%` : `${usd(row.usd)}  ${p}%`, x + w, y, t.fg, "right");
    const barH = 10 * k;
    rrect(x, y + 14 * k, w, barH, barH / 2, t.track);
    rrect(x, y + 14 * k, Math.max(barH, w * row.usd / total), barH, barH / 2, t.accent);
    y += rowH;
  }
  return y;
}

function draw() {
  const [W, H] = SIZES[state.size];
  const t = THEMES[state.theme];
  const S = 2;
  canvas.width = W * S; canvas.height = H * S;
  canvas.className = state.size;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.textBaseline = "alphabetic";
  rrect(0, 0, W, H, 0, t.bg);

  const landscape = state.size === "landscape";
  const k = landscape ? 1 : 1.35;
  const pad = landscape ? 64 : 84;
  // Header: wordmark + pill
  font(700, 26 * k, MONO);
  text("agent", pad, pad + 20 * k, t.fg);
  const wa = ctx.measureText("agent").width;
  text("diff", pad + wa, pad + 20 * k, t.accent);
  const pill = `${D.agent} · ${D.period}`;
  font(600, 17 * k, MONO);
  const pw = ctx.measureText(pill).width + 36 * k;
  const ph = 40 * k;
  ctx.strokeStyle = t.border; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(W - pad - pw, pad - 6 * k, pw, ph, ph / 2); ctx.stroke();
  text(pill, W - pad - pw / 2, pad + 20 * k, t.muted, "center");

  const [l1, l2] = headline();
  const leak = D.leaks[0];
  const leakText = leak ? (state.hide ? leak.label : `${leak.label} · ${usd(leak.usd)}`) : null;
  const meta = `${D.sessions} sessions · ${D.projects} projects`;

  if (landscape) {
    const leftW = 560;
    font(700, 16, MONO);
    text(meta.toUpperCase(), pad, 196, t.faint);
    let size = fitFont(800, 64, SANS, l1, leftW);
    text(l1, pad, 272, t.fg);
    fitFont(800, size, SANS, l2, leftW);
    text(l2, pad, 272 + size * 1.15, t.danger);
    if (leakText) {
      font(700, 15, MONO); text("BIGGEST LEAK", pad, 448, t.faint);
      fitFont(700, 26, SANS, leakText, leftW); text(leakText, pad, 486, t.fg);
    }
    drawBars(W - pad - 450, 196, 450, 72, t, 1);
  } else {
    const fullW = W - pad * 2;
    font(700, 21, MONO);
    text(meta.toUpperCase(), pad, 270, t.faint);
    let size = fitFont(800, 96, SANS, l1, fullW);
    text(l1, pad, 380, t.fg);
    fitFont(800, size, SANS, l2, fullW);
    text(l2, pad, 380 + size * 1.15, t.danger);
    let y = drawBars(pad, 590, fullW, 90, t, k);
    if (leakText) {
      y += 24;
      rrect(pad, y, fullW, 140, 22, t.panel);
      font(700, 19, MONO); text("BIGGEST LEAK", pad + 36, y + 52, t.faint);
      fitFont(700, 34, SANS, leakText, fullW - 72); text(leakText, pad + 36, y + 102, t.fg);
    }
  }

  // Footer
  const fs = landscape ? 20 : 26;
  ctx.fillStyle = t.border; ctx.fillRect(pad, H - pad - fs * 2, W - pad * 2, 1.5);
  font(700, fs, MONO);
  text(D.command, pad, H - pad, t.accent);
  font(600, fs * 0.9, MONO);
  text("agentdiff.app", W - pad, H - pad, t.faint, "right");
}

function setStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg; setTimeout(() => { el.textContent = ""; }, 2500);
}

document.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => {
  state.size = b.dataset.size;
  document.querySelectorAll("[data-size]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
  draw();
}));
document.getElementById("dollars").addEventListener("click", (e) => {
  state.hide = !state.hide; e.currentTarget.setAttribute("aria-pressed", String(state.hide)); draw();
});
document.getElementById("theme").addEventListener("click", (e) => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  e.currentTarget.setAttribute("aria-pressed", String(state.theme === "light")); draw();
});
document.getElementById("download").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agentdiff-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
});
document.getElementById("copy").addEventListener("click", async () => {
  try {
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Copied. Paste it into your post.");
  } catch (err) {
    setStatus("Copy isn't available here. Use Download PNG.");
  }
});

draw();
document.fonts.load(`800 40px Manrope`).then(() => document.fonts.load(`700 20px 'JetBrains Mono'`))
  .then(() => document.fonts.ready).then(draw).catch(draw);
</script>
</body>
</html>
"""
