# Conectar Cloudflare (para guardar cambios desde el móvil)

Se hace una sola vez y tarda unos 10 minutos. Todo es gratis.

## 1. Crea un token de GitHub

1. Entra en https://github.com/settings/personal-access-tokens/new
2. **Token name:** `singladura`
3. **Expiration:** la fecha más lejana que te deje.
4. **Repository access:** *Only select repositories* → elige `singladura` y `singladura-notas`.
5. **Permissions → Repository permissions → Contents:** *Read and write*.
6. Pulsa **Generate token** y copia el código que empieza por `github_pat_`. Solo se ve una vez.

## 2. Crea el Worker en Cloudflare

1. Entra en https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Ponle de nombre `singladura-api` y pulsa **Deploy**.
3. Pulsa **Edit code**, borra todo lo que hay y pega el contenido de [`worker/worker.js`](worker/worker.js).
4. Pulsa **Deploy**.

## 3. Añade las variables

En el Worker, ve a **Settings → Variables and Secrets** y añade estas cuatro:

| Nombre | Tipo | Valor |
|---|---|---|
| `PASSWORD` | Secret | la contraseña que quieras para entrar en modo edición |
| `GH_TOKEN` | Secret | el token `github_pat_…` del paso 1 |
| `SITE_REPO` | Text | `angelapereiralosada/singladura` |
| `NOTES_REPO` | Text | `angelapereiralosada/singladura-notas` |

Pulsa **Deploy** para guardar.

## 4. Pásale la dirección a Claude

Copia la dirección del Worker (algo como `https://singladura-api.tu-nombre.workers.dev`) y pásasela a Claude. La pondrá en `data/config.json` y la app empezará a guardar tus cambios.
