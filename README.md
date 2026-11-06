# Singladura

Diario de a bordo de mis viajes: países visitados, rutas por etapas, guías de cada país y planes de próximos viajes.

- **Web:** https://angelapereiralosada.github.io/singladura/
- Cualquiera con el enlace la ve en modo lectura, sin cuentas ni contraseñas.
- El lápiz de arriba activa el modo edición con contraseña.

## Cómo está hecha

| Parte | Dónde vive |
|---|---|
| La app | `index.html` (GitHub Pages) |
| Viajes, guías y planes | `data/items.json` |
| Fotos | `photos/` |
| Diccionario de lugares | `gz.json` |
| Mapa (globo y calles) | `vendor/` (MapLibre) + teselas gratuitas de OpenFreeMap, sin claves |
| Uso sin conexión | `sw.js` guarda la app, tus datos y el mapa que ya has visto |
| Guardar cambios desde el móvil | `worker/worker.js` (Cloudflare Workers, plan gratuito) |
| Notas privadas de «Cuéntamelo» | repositorio privado `singladura-notas` |

La conexión con Cloudflare se configura en `data/config.json` (`"api": "https://…workers.dev"`). Los pasos están en [CLOUDFLARE.md](CLOUDFLARE.md).
