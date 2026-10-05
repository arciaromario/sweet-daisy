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
2. Abre **SQL Editor → New query**, pega el contenido de `supabase/setup.sql` y pulsa **Run**. Crea las tablas, la seguridad (RLS), los buckets de fotos, el catálogo inicial y los ajustes por defecto. Se regenera con `npm run db:setup`.
3. Copia la URL y la clave pública (*Project Settings → API*: `anon` / `publishable`) en `.env.local` y en los secrets del repositorio (ver GitHub Pages).
4. En **Authentication → URL Configuration** añade la URL del sitio como *Site URL* y `…/admin` y `…/account` como *Redirect URLs*.

### Panel de administración (`/admin`)

1. En Supabase, **Authentication → Users → Add user → Create new user**: tu email y una contraseña (marca *Auto confirm*).
2. En el SQL Editor, conviértelo en administrador:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'tu-email@ejemplo.com';
   ```
3. Entra en `https://<tu-sitio>/admin`. Recomendado: en **Authentication → Sign In / Providers** desactiva *Allow new users to sign up* si no quieres cuentas de clientes.

Desde el panel puedes gestionar: pedidos (estado, pago, notas), solicitudes de pasteles personalizados (presupuesto, fotos de referencia, respuesta por email), productos (fotos, tamaños, sabores, decoraciones, visibilidad, orden), categorías, disponibilidad (días completos, con pocas plazas, cerrados, días de cierre semanal y aperturas excepcionales), opciones del diseñador de pasteles, datos de contacto, horarios, envíos y redes, y mensajes / newsletter (exportables a CSV).

Sin Supabase, `/admin` funciona en **modo demo**: guarda los cambios en el navegador para poder probarlo.

### Esquema

| Tabla | Uso | Acceso público |
| --- | --- | --- |
| `categories`, `products` | Catálogo (tamaños, sabores, decoraciones en `jsonb`) | Lectura (solo activos) |
| `settings` | Contacto, horarios, envío, opciones de pasteles personalizados | Lectura |
| `admins` | Usuarios con acceso a `/admin` | — |
| `availability_overrides` | Días completos / limitados / cerrados | Lectura |
| `orders`, `order_items` | Pedidos | Solo a través de `place_order()`; cada cliente ve los suyos |
| `custom_cake_requests` | Solicitudes del constructor de pasteles | Solo inserción |
| `newsletter_subscribers`, `contact_messages` | Newsletter y contacto | Solo inserción |
| Bucket `cake-inspiration` (privado) | Imágenes de referencia de clientes | Solo subida |
| Bucket `product-images` (público) | Fotos de productos subidas desde el admin | Lectura |

Los administradores (`public.is_admin()`) pueden leer y gestionar todo lo anterior.

`place_order(payload)` es una función `security definer` que **recalcula todos los precios desde la tabla `products`**, valida el tamaño, la antelación mínima, los días de cierre, los días bloqueados y los horarios configurados en `settings`, y calcula el envío. Un carrito manipulado en el navegador no puede cambiar el importe.


## Estructura

```
src/
  admin/       panel de administración (/admin)
  data/        catálogo inicial, ajustes por defecto y fotos
  lib/         cliente Supabase, API de datos, utilidades de disponibilidad
  context/     catálogo y carrito (persistido en localStorage)
  components/  header, carrito lateral, tarjetas de producto, quick view, calendario, constructor…
  pages/       Home, Shop (/shop, /cakes, /treats), producto, Custom Cakes, carrito, checkout,
               About, Contact, Account, FAQ, envíos, términos, privacidad
  styles/      tokens.css (sistema de diseño), base, layout, secciones, comercio
supabase/
  migrations/  esquema, RLS, place_order, admin, buckets de almacenamiento
  seed.sql     catálogo y ajustes iniciales (generado)
  setup.sql    migraciones + seed en un solo archivo (generado)
```

## Antes del lanzamiento

- **Fotografía**: las imágenes actuales son provisionales (Unsplash). Sube tus fotos desde `/admin → Productos`. Si una imagen falla, se muestra un fondo con el logo en lugar de una imagen rota.
- **Pagos**: el checkout registra el pedido con `payment_status = 'pending'` y ofrece "pagar con tarjeta" (enlace de pago enviado por email) o "pagar al recoger". Para cobrar en línea, conecta Stripe Checkout mediante una Edge Function de Supabase que cree la sesión de pago a partir del pedido.
- **Emails de confirmación**: añade un webhook de base de datos o una Edge Function sobre `orders` / `custom_cake_requests` (por ejemplo con Resend).
- **Datos del negocio**: dirección, teléfono, horario, redes y envíos se editan en `/admin → Ajustes`. Los textos legales de `src/pages/Info.tsx` son plantillas a revisar.
- **SEO**: cada página define título, descripción, canonical y datos estructurados (Bakery, Product, FAQPage). Al ser una SPA, si el posicionamiento orgánico es prioritario conviene añadir prerender de las rutas públicas.
- **Despliegue**: Vercel (`vercel.json`) o Netlify (`public/_redirects`) ya incluyen el *fallback* de rutas de la SPA.

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` compila y publica el sitio en `https://<usuario>.github.io/<repo>/` en cada push a `main` (o manualmente desde la pestaña Actions).

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Opcional: en **Settings → Secrets and variables → Actions** añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Sin ellos se publica en modo demo.
3. En Supabase, añade `https://<usuario>.github.io/<repo>/account` como *redirect URL* de Auth.

Detalles: la subruta se fija con `BASE_PATH` al compilar, y el workflow copia `index.html` a `404.html` para que los enlaces directos (p. ej. `/products/...`) funcionen. GitHub Pages devuelve esas páginas con estado 404, lo que no afecta a los visitantes pero sí a buscadores; para SEO serio conviene un dominio propio con hosting que admita *rewrites* (Vercel, Netlify, Cloudflare Pages).
