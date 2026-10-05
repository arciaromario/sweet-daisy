# Sweet Daisy — Cakes and Treats

Tienda online premium para una pastelería boutique. Construida con **React 19 + Vite + TypeScript**, con **Supabase** como base de datos, autenticación y almacenamiento.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # añade tus credenciales de Supabase
npm run dev                  # http://localhost:5173
```

Sin credenciales de Supabase el sitio funciona en **modo demo**: el catálogo sale de `src/data/` y los formularios se resuelven localmente (no se guarda nada). Así se puede diseñar y revisar sin backend.

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos + build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run db:seed` | Regenera `supabase/seed.sql` a partir de `src/data/products.ts` |

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Aplica el esquema y los datos iniciales:
   - con la CLI: `supabase link --project-ref <ref>` y `supabase db push`, luego ejecuta `supabase/seed.sql` en el SQL editor, **o**
   - pega `supabase/migrations/20261005000000_init.sql` y después `supabase/seed.sql` en el SQL editor.
3. Copia la URL y la *anon key* (Project Settings → API) en `.env.local`.
4. En Authentication → URL Configuration añade tu dominio (y `http://localhost:5173`) como *redirect URL* para los enlaces mágicos de inicio de sesión.

### Esquema

| Tabla | Uso | Acceso público |
| --- | --- | --- |
| `categories`, `products` | Catálogo (tamaños, sabores, decoraciones en `jsonb`) | Lectura |
| `availability_overrides` | Días completos / limitados / cerrados | Lectura |
| `orders`, `order_items` | Pedidos | Solo a través de `place_order()`; cada cliente ve los suyos |
| `custom_cake_requests` | Solicitudes del constructor de pasteles | Solo inserción |
| `newsletter_subscribers`, `contact_messages` | Newsletter y contacto | Solo inserción |
| Bucket `cake-inspiration` (privado) | Imágenes de referencia de clientes | Solo subida |

`place_order(payload)` es una función `security definer` que **recalcula todos los precios desde la tabla `products`**, valida el tamaño, la antelación mínima, los lunes cerrados y los días bloqueados, y calcula el envío. Un carrito manipulado en el navegador no puede cambiar el importe.

Los pedidos, solicitudes y mensajes se gestionan desde el panel de Supabase (Table Editor). Para marcar un día como completo: inserta una fila en `availability_overrides` con `status = 'booked'`.

## Estructura

```
src/
  data/        catálogo local, configuración del negocio (horario, envío, disponibilidad) y fotos
  lib/         cliente Supabase, API de datos, utilidades de disponibilidad
  context/     catálogo y carrito (persistido en localStorage)
  components/  header, carrito lateral, tarjetas de producto, quick view, calendario, constructor…
  pages/       Home, Shop (/shop, /cakes, /treats), producto, Custom Cakes, carrito, checkout,
               About, Contact, Account, FAQ, envíos, términos, privacidad
  styles/      tokens.css (sistema de diseño), base, layout, secciones, comercio
supabase/
  migrations/  esquema, RLS, place_order, bucket de almacenamiento
  seed.sql     catálogo inicial (generado)
```

## Antes del lanzamiento

- **Fotografía**: las imágenes actuales son provisionales (Unsplash) y están centralizadas en `src/data/images.ts`. Sustitúyelas por fotos propias (en `public/images/` o tu CDN). Si una imagen falla, se muestra un fondo con el logo en lugar de una imagen rota.
- **Pagos**: el checkout registra el pedido con `payment_status = 'pending'` y ofrece "pagar con tarjeta" (enlace de pago enviado por email) o "pagar al recoger". Para cobrar en línea, conecta Stripe Checkout mediante una Edge Function de Supabase que cree la sesión de pago a partir del pedido.
- **Emails de confirmación**: añade un webhook de base de datos o una Edge Function sobre `orders` / `custom_cake_requests` (por ejemplo con Resend).
- **Datos del negocio**: dirección, teléfono, horario, redes y tarifas de envío están en `src/data/site.ts`. Textos legales en `src/pages/Info.tsx` son plantillas a revisar.
- **SEO**: cada página define título, descripción, canonical y datos estructurados (Bakery, Product, FAQPage). Al ser una SPA, si el posicionamiento orgánico es prioritario conviene añadir prerender de las rutas públicas.
- **Despliegue**: Vercel (`vercel.json`) o Netlify (`public/_redirects`) ya incluyen el *fallback* de rutas de la SPA.

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` compila y publica el sitio en `https://<usuario>.github.io/<repo>/` en cada push a `main` (o manualmente desde la pestaña Actions).

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Opcional: en **Settings → Secrets and variables → Actions** añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Sin ellos se publica en modo demo.
3. En Supabase, añade `https://<usuario>.github.io/<repo>/account` como *redirect URL* de Auth.

Detalles: la subruta se fija con `BASE_PATH` al compilar, y el workflow copia `index.html` a `404.html` para que los enlaces directos (p. ej. `/products/...`) funcionen. GitHub Pages devuelve esas páginas con estado 404, lo que no afecta a los visitantes pero sí a buscadores; para SEO serio conviene un dominio propio con hosting que admita *rewrites* (Vercel, Netlify, Cloudflare Pages).
