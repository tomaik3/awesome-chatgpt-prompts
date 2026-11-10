#!/usr/bin/env node
// Erzeugt ein Cover-Bild (1600x800 JPG) eines Gerichts mit derselben Zeichnung wie der Rezeptfinder.
// Die Zeichenfunktionen werden direkt aus rezeptfinder.html gelesen, damit es nur eine Quelle gibt.
//
// Aufruf:
//   node "AIWorkspace/01 Rezeptfinder/tools/cover-bild.js" "<Rezeptname>" "#farbe1,#farbe2,#farbe3"
// farbe1 = Hauptfarbe (Sauce/Suppe/Teig), farbe2 = Stücke (Gnocchi, Fleisch, Croutons), farbe3 = Kräuter/Garnitur.
// Ergebnis: AIWorkspace/01 Rezeptfinder/bilder/<slug>.jpg ; die Datei wird auf stdout ausgegeben.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const [name, farbenArg] = process.argv.slice(2);
if (!name || !farbenArg) {
  console.error('Aufruf: cover-bild.js "<Rezeptname>" "#rrggbb,#rrggbb,#rrggbb"');
  process.exit(2);
}
const farben = farbenArg.split(",").map((f) => f.trim());
if (farben.length !== 3 || !farben.every((f) => /^#[0-9a-f]{6}$/i.test(f))) {
  console.error("Bitte genau drei Hex-Farben angeben, z. B. #e07b25,#f3dfb8,#3d6a35");
  process.exit(2);
}

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "rezeptfinder.html"), "utf8");
function grab(fn) {
  const i = html.indexOf("  function " + fn + "(");
  if (i < 0) throw new Error("Funktion " + fn + " nicht gefunden");
  let d = 0;
  for (let k = html.indexOf("{", i); k < html.length; k++) {
    if (html[k] === "{") d++;
    else if (html[k] === "}" && --d === 0) return html.slice(i, k + 1);
  }
  throw new Error("Funktion " + fn + " unvollständig");
}
const code = ["hex", "hash", "rng", "shade", "drawPlate"].map(grab).join("\n");

function slug(n) {
  const t = String(n).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  return t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "rezept";
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setContent('<canvas id="c" style="width:1600px;height:800px"></canvas>');
  const data = await page.evaluate(([code, name, farben]) => {
    // eslint-disable-next-line no-eval
    eval(code + "; window.__draw = drawPlate;");
    const c = document.getElementById("c");
    window.__draw(c, farben, name, false);
    return c.toDataURL("image/jpeg", 0.86);
  }, [code, name, farben]);
  await browser.close();
  const outDir = path.join(root, "bilder");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, slug(name) + ".jpg");
  fs.writeFileSync(out, Buffer.from(data.split(",")[1], "base64"));
  console.log(path.relative(path.resolve(root, "..", ".."), out));
})().catch((e) => { console.error(e); process.exit(1); });
