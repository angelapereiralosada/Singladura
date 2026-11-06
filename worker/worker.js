// Singladura · API de edición (Cloudflare Worker, plan gratuito)
// Guarda los cambios del diario en el repositorio de GitHub de la web,
// las fotos en la carpeta photos/ y las notas privadas de «Cuéntamelo»
// en un repositorio privado aparte.
//
// Variables que necesita (Settings → Variables and Secrets):
//   PASSWORD    (secreto) tu contraseña para entrar en modo edición
//   GH_TOKEN    (secreto) token de GitHub con permiso "Contents: Read and write"
//   SITE_REPO   (texto)   angelapereiralosada/singladura
//   NOTES_REPO  (texto)   angelapereiralosada/singladura-notas

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Key",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const json = (d, status = 200) =>
      new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (!env.PASSWORD || req.headers.get("X-Key") !== env.PASSWORD) return json({ error: "Contraseña incorrecta" }, 401);

    const gh = (repo, path, method = "GET", body) =>
      fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${env.GH_TOKEN}`,
          "User-Agent": "singladura",
          Accept: "application/vnd.github+json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    const readJSON = async (repo, path, fallback) => {
      const r = await gh(repo, path);
      if (r.status === 404) return { data: fallback, sha: null };
      if (!r.ok) throw new Error("GitHub " + r.status);
      const j = await r.json();
      return { data: JSON.parse(b64dec(j.content)), sha: j.sha };
    };
    const writeJSON = async (repo, path, data, sha, message) => {
      const r = await gh(repo, path, "PUT", { message, content: b64enc(JSON.stringify(data, null, 1)), ...(sha ? { sha } : {}) });
      return r.ok ? true : r.status;
    };

    const url = new URL(req.url);
    try {
      if (url.pathname === "/check") return json({ ok: true });

      if (url.pathname === "/save" && req.method === "POST") {
        const { set = {}, del = [] } = await req.json();
        for (let i = 0; i < 3; i++) {
          const { data, sha } = await readJSON(env.SITE_REPO, "data/items.json", []);
          const map = new Map(data.map((x) => [x.id, x]));
          for (const [id, doc] of Object.entries(set)) map.set(id, { ...doc, id });
          for (const id of del) map.delete(id);
          const r = await writeJSON(env.SITE_REPO, "data/items.json", [...map.values()], sha, "Actualiza el diario desde la app");
          if (r === true) return json({ ok: true });
          if (r !== 409 && r !== 422) return json({ error: "GitHub " + r }, 502);
        }
        return json({ error: "conflicto" }, 409);
      }

      if (url.pathname === "/photo" && req.method === "POST") {
        const { data, ext = "jpg" } = await req.json();
        const safeExt = ext === "png" ? "png" : "jpg";
        const path = `photos/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${safeExt}`;
        const r = await gh(env.SITE_REPO, path, "PUT", { message: "Añade una foto", content: data });
        return r.ok ? json({ path }) : json({ error: "GitHub " + r.status }, 502);
      }

      if (url.pathname === "/notes" && req.method === "GET") {
        const { data } = await readJSON(env.NOTES_REPO, "notas.json", []);
        return json(data);
      }

      if (url.pathname === "/note" && req.method === "POST") {
        const note = await req.json();
        for (let i = 0; i < 3; i++) {
          const { data, sha } = await readJSON(env.NOTES_REPO, "notas.json", []);
          if (!data.some((n) => n.id === note.id)) data.push(note);
          const r = await writeJSON(env.NOTES_REPO, "notas.json", data, sha, "Nueva nota");
          if (r === true) return json({ ok: true });
          if (r !== 409 && r !== 422) return json({ error: "GitHub " + r }, 502);
        }
        return json({ error: "conflicto" }, 409);
      }

      return json({ error: "No existe" }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};

function b64enc(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64dec(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
