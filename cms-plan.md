# CMS‑like WordPress con Laravel (React + Inertia)

## 🎯 Objetivo
Crear un **Sistema de Gestión de Contenidos (CMS)** que reproduzca las funcionalidades clave de WordPress (posts, páginas, usuarios, roles, temas y plugins) pero usando la **estructura típica de Laravel 13** y **React 19.2.0 con Inertia** para el frontend.

---

## 📁 Estructura de archivos (Laravel default)
```
app/
│   ├── Http/
│   │   ├── Controllers/            # PostController, PageController, …
│   │   └── Middleware/             # auth, locale, …
│   ├── Models/                     # Post, Page, Product, …
│   └── Services/                   # ThemeService, PluginService, PaymentService

config/
│   ├── cms.php                     # Configuración del CMS (features, defaults)
│   └── permission.php              # Spatie permissions

database/
│   ├── migrations/                 # tablas: posts, pages, products, orders, …
│   └── seeders/                    # roles, admin user, demo data

resources/
│   ├── views/                      # Blade (layout, seo, email templates)
│   │   ├── cms/layouts/            # base admin & public layouts
│   │   ├── cms/themes/              # cada tema con sus assets
│   │   └── cms/plugins/             # UI de plugins (si los hay)
│   └── css/ & js/                  # Vite assets (Tailwind, React, etc.)

routes/
│   ├── web.php                     # Rutas públicas (home, post/{slug})
│   ├── admin.php                   # Prefijo /admin, middleware auth+role
│   └── api.php                     # API REST & GraphQL endpoints

public/
│   └── storage/                    # imágenes, uploads

storage/
│   └── app/public/                  # uploads persistentes
```
---

## 🛠️ Requisitos y paquetes principales
| Necesario | Paquete | Comentario |
|-----------|----------|------------|
| **Laravel** (>=13) | `laravel/laravel` | Framework base |
| **Base de datos** | MySQL / PostgreSQL | Configura en `.env` |
| **Autenticación** | `laravel/breeze` (Inertia + React) | Registro, login, email verification |
| **Roles & permisos** | `spatie/laravel-permission` | Similar a WP “roles” |
| **Editor WYSIWYG** | `ckeditor/ckeditor5` o `tiptap` (React) | Edición de posts/pages |
| **Slug** | `spatie/laravel-sluggable` | Genera slugs automáticos |
| **Media library** | `spatie/laravel-medialibrary` | Gestión de imágenes y archivos |
| **Cache** | Redis (Laravel cache) | Mejora rendimiento |
| **Search** | `laravel/scout` + Meilisearch | Búsqueda full‑text |
| **API** | `laravel/sanctum` (token) & `nuwave/lighthouse` (GraphQL) |
| **Testing** | `pestphp/pest` (unit/feature) & Cypress (e2e) |
| **Frontend build** | Vite (incluido) + React 19.2.0 + Inertia |
| **Multi‑idioma** | `spatie/laravel-translatable` + Laravel localisation |
| **Payments** | `laravel/cashier` (Stripe), `srmklive/paypal`, SDKs de Paddle, Nuvei, Klarna, Apple/Google Pay |

> **Instalación de paquetes (Composer)**
```bash
composer require spatie/laravel-permission spatie/laravel-sluggable spatie/laravel-medialibrary laravel/scout nuwave/lighthouse spatie/laravel-translatable
composer require --dev pestphp/pest
```
> **Publicar configuraciones y migraciones**
```bash
php artisan vendor:publish --provider="Spatie\\Permission\\PermissionServiceProvider" --tag="config"
php artisan vendor:publish --provider="Spatie\\MediaLibrary\\MediaLibraryServiceProvider" --tag="config"
php artisan vendor:publish --provider="Spatie\\Translatable\\TranslatableServiceProvider" --tag="config"
php artisan lighthouse:publish
php artisan migrate
```
---

## 🗂️ Modelo de datos (Eloquent)
```php
// app/Models/Post.php
class Post extends Model {
    use HasFactory, Sluggable, InteractsWithMedia, Translatable;
    protected $fillable = ['title','content','slug','status','user_id','published_at','locale'];
    public $translatable = ['title','content'];
    public function sluggable(): array { return ['slug' => ['source' => 'title']]; }
    public function user() { return $this->belongsTo(User::class); }
    public function tags() { return $this->belongsToMany(Tag::class); }
    public function comments() { return $this->hasMany(Comment::class); }
}
```
*(Modelos similares para `Page`, `Product`, `Category`, `Order`, `OrderItem`, `Coupon`, `Setting`, `Theme`, `Plugin`.)*
---

## 📦 Core de funcionalidades
| Área | Qué implementar | Comentario |
|------|----------------|------------|
| **Publicación** | CRUD de posts y páginas, estados *draft/published*, programación, auto‑slug, imágenes destacadas | Usa `FormRequest` para validación |
| **Gestión de usuarios** | Registro, login, recuperación, roles (admin, editor, author, subscriber) | `Spatie/Permission` asigna permisos a rutas |
| **Temas** | Carpeta `resources/views/cms/themes/{name}`; `ThemeService` para cambiar tema activo (`config('cms.theme')`) | Cada tema tiene `assets/` y layouts Blade |
| **Plugins** | Sistema de *service providers* registrados vía tabla `plugins`. Cada plugin puede aportar rutas, migraciones, vistas y comandos Artisan | Similar a paquetes Composer pero gestionado desde UI |
| **Media library** | Upload, resize, versiones (`thumbnail`, `medium`) | `spatie/laravel-medialibrary` |
| **SEO** | Metadatos (`title`, `meta_description`, `canonical`), sitemap XML, Open Graph, JSON‑LD | Guardar en tabla `settings` o modelo `SeoMeta` |
| **API REST** | Endpoints `api/v1/posts`, `api/v1/pages`, `api/v1/products`, `api/v1/auth` (Sanctum) |
| **GraphQL** | Esquema en `graphql/schema.graphql` (ver sección ↓). Resolveres usan modelos existentes |
| **Search** | Indexar posts/páginas con Scout + Meilisearch |
| **Internationalization** | `resources/lang/{locale}` + middleware `SetLocale` (header `Accept-Language` o `?lang=`) |
| **E‑commerce** | Modelos `Product`, `Category`, `ProductVariation`, `Cart`, `Order`, `Coupon`; controladores y rutas API; gestión de stock y precios |
| **Payments** | `PaymentServiceProvider` que delega a Stripe (Cashier), PayPal, Paddle, Nuvei, Klarna, Apple/Google Pay. Webhooks en `api/payments/webhook` |
| **Dashboard** | UI admin con Inertia + React 19.2.0. Menú dinámico (Posts, Pages, Products, Orders, Themes, Plugins, Settings) |
| **Versionado de contenido** | `spatie/laravel-activitylog` para historial de cambios |
---

## 🛣️ Rutas principales (ejemplo)
```php
// routes/web.php
Route::get('/', [FrontController::class, 'home'])->name('home');
Route::get('/post/{slug}', [PostController::class, 'show'])->name('post.show');

// routes/admin.php (prefijo /admin, middleware auth+role)
Route::middleware(['auth', 'role:admin|editor'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function(){
        Route::resource('posts', Admin\PostController::class);
        Route::resource('pages', Admin\PageController::class);
        Route::resource('products', Admin\ProductController::class);
        Route::resource('orders', Admin\OrderController::class);
        Route::resource('themes', Admin\ThemeController::class);
        Route::resource('plugins', Admin\PluginController::class);
        Route::get('settings', [Admin\SettingController::class, 'index'])->name('settings.index');
    });

// routes/api.php (REST & GraphQL)
Route::middleware('auth:sanctum')->group(function(){
    Route::apiResource('posts', Api\PostController::class);
    Route::apiResource('pages', Api\PageController::class);
    Route::apiResource('products', Api\ProductController::class);
    Route::post('checkout', [Api\PaymentController::class, 'checkout']);
    Route::post('payments/webhook', [Api\PaymentWebhookController::class, 'handle']);
});

// GraphQL endpoint (Lighthouse) – already registered in lighthouse.php
```
---

## 📚 Guía de instalación rápida (pasos ejecutables)
```bash
# 1️⃣ Crear proyecto Laravel 13
composer create-project laravel/laravel cms
cd cms

# 2️⃣ Instalar dependencias del CMS (Composer)
composer require spatie/laravel-permission spatie/laravel-sluggable spatie/laravel-medialibrary laravel/scout nuwave/lighthouse spatie/laravel-translatable
composer require --dev pestphp/pest

# 3️⃣ Publicar configuraciones y migraciones de los paquetes
php artisan vendor:publish --provider="Spatie\\Permission\\PermissionServiceProvider" --tag="config"
php artisan vendor:publish --provider="Spatie\\MediaLibrary\\MediaLibraryServiceProvider" --tag="config"
php artisan vendor:publish --provider="Spatie\\Translatable\\TranslatableServiceProvider" --tag="config"
php artisan lighthouse:publish

# 4️⃣ Ejecutar migraciones (configura tu .env primero)
php artisan migrate

# 5️⃣ Seeders básicos (roles, admin user)
php artisan make:seeder RoleSeeder
php artisan db:seed --class=RoleSeeder

# 6️⃣ Frontend – Vite + React 19.2.0 + Inertia
npm install
npm i @inertiajs/inertia @inertiajs/inertia-react react@19.2.0 react-dom@19.2.0
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p   # crea tailwind.config.js y postcss.config.js
# Añade @tailwind directives en resources/css/app.css

# 7️⃣ Compilar assets
npm run dev   # para desarrollo
npm run build # para producción

# 8️⃣ Configurar GraphQL (schema)
# Edita graphql/schema.graphql – ejemplo básico:
# type Post { id: ID! title: String! content: String! slug: String! }
# type Query { posts: [Post!]! }
# type Mutation { createPost(title: String!, content: String!): Post }
# php artisan lighthouse:print-schema   # verifica

# 9️⃣ Instalar Meilisearch (opcional) y crear índices
brew install meilisearch   # macOS
meilisearch &
php artisan scout:import "App\\Models\\Post"

# 🔟 Configurar pasarelas de pago (Stripe como ejemplo)
composer require laravel/cashier
php artisan migrate
# Configura STRIPE_KEY, STRIPE_SECRET en .env

# 🚀 Lanzar servidor de desarrollo
php artisan serve
```
---

## ✅ Checklist de pruebas antes del despliegue
- [ ] **Unit/Feature tests** para CRUD de posts, páginas, productos y pedidos.
- [ ] **GraphQL tests** que validen consultas y mutaciones.
- [ ] **Permission tests** (acceso restringido por rol).
- [ ] **Carga de imágenes** y generación de thumbnails.
- [ ] **Cambio de tema** sin romper rutas.
- [ ] **Activación/desactivación de plugins** sin errores.
- [ ] **API REST & GraphQL** responden con tokens Sanctum y respetan rate limits.
- [ ] **SEO**: meta tags presentes, sitemap accesible (`/sitemap.xml`).
- [ ] **Performance**: caché de vistas (`php artisan view:cache`), caché de consultas (`Cache::remember`).
- [ ] **Webhook de pagos** funciona y registra transacciones.
- [ ] **Internationalization**: contenido disponible en varios locales, fallback correcto.
- [ ] **E2E checkout flow** (Cypress) cubre carrito → pago → confirmación.

---

## 📦 Despliegue (Docker)
```dockerfile
# Dockerfile
FROM php:8.2-fpm-alpine
WORKDIR /var/www/html
RUN apk add --no-cache bash git zip unzip libpng-dev libjpeg-turbo-dev freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql
COPY . .
RUN composer install --no-dev --optimize-autoloader
RUN php artisan key:generate && php artisan migrate --force
EXPOSE 9000
CMD ["php-fpm"]
```
```yaml
# docker-compose.yml
services:
  app:
    build: .
    volumes:
      - .:/var/www/html
    ports:
      - "8000:9000"
    environment:
      - DB_HOST=db
      - DB_DATABASE=cms
      - DB_USERNAME=laravel
      - DB_PASSWORD=secret
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD=secret
      MYSQL_DATABASE=cms
      MYSQL_USER=laravel
      MYSQL_PASSWORD=secret
    ports:
      - "3306:3306"
```
---

## 📈 Marketing & Tracking
- **Google Search Console**: agrega meta tag de verificación en `resources/views/cms/layouts/app.blade.php`.
- **Google Analytics 4**: incluye script `gtag.js` vía Blade layout.
- **Facebook Pixel** y **Twitter universal tag** (opcional).
- **Sitemap** con `spatie/laravel-sitemap` (`php artisan sitemap:generate`).
- **OpenGraph** y **JSON‑LD** en vistas de post/página/producto.
- **Google Analytics 4** – integra el script `gtag.js` mediante Blade en `app.blade.php` y configura el ID en `.env` (`GA_MEASUREMENT_ID`).
- **Google Search Console** – meta‑tag de verificación y envío de sitemap con `spatie/laravel-sitemap`.
- **Facebook Pixel**, **Twitter universal tag**, **LinkedIn Insight**, **TikTok Events** – inserta los snippets en el layout principal.
- **Hotjar / FullStory** – scripts de captura de sesiones para UX.
- **Mixpanel / Amplitude** – paquetes `spatie/laravel-mixpanel` o `laravel-analytics` para tracking de eventos personalizados (registro, compra, cambio de tema).
- **Server‑side tracking** – usa `spatie/laravel-analytics` para registrar visitas directamente desde Laravel (`Analytics::fetchVisitorsAndPageViews()`).

### Configuración rápida

```bash
composer require spatie/laravel-analytics
npm i @segment/analytics-browser   # opcional para eventos front‑end
```

Añade a `.env`:

```
GA_MEASUREMENT_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your_token
```

#### Dashboard de Analítica

En el admin dashboard agrega una nueva sección **Analytics** que muestra:

- Métricas de visitas, usuarios activos, conversiones.
- Gráficos de eventos personalizados (p. ej., `order.completed`).
- Enlaces a los dashboards de Google Analytics, Mixpanel, Hotjar.

Utiliza componentes React en `resources/js/pages/AdminAnalytics.jsx` y rutas Inertia `admin/analytics`.

## 🤖 IA & Detección de Contenido (LLM)

- **Archivo de modelo LLM**: `app/Services/LLMDetector.php` que expone un método `detect($text)` usando la API de OpenAI o Cohere (configurable vía `.env`).
- **Mapeo y búsqueda recomendada**: crea `app/Services/ContentRecommender.php` que, a partir de embeddings (por ejemplo, `text-embedding-ada-002`), indexa contenidos en una tabla `content_vectors` y permite búsquedas semánticas.
- **Instalación de paquetes**:

```bash
composer require openai-php/client # o la SDK de tu proveedor
```

- **Variables de entorno**: `LLM_API_KEY`, `LLM_MODEL`, `LLM_EMBEDDING_MODEL`.

- **Integración en Dashboard**: nueva página **AI Insights** en el admin que muestra:

  - Detección de contenido generado por IA en posts/páginas.
  - Recomendaciones de contenido similares basadas en embeddings.
  - Botones para “Re‑generar” o “Optimizar SEO” usando LLM.

- **Rutas** en `routes/admin.php`:

```php
Route::get('ai-insights', [Admin\AIInsightsController::class, 'index'])->name('admin.ai.insights');
```

- **Controlador** `app/Http/Controllers/Admin/AIInsightsController.php` que llama a los servicios anteriores y pasa datos a la vista Inertia.

## 📧 Plantillas de email con Resend (React)
- Instala el paquete `npm install react-email -E` vía npm:
  ```bash
  npm install react-email -E
  ```
- Crea componentes de email React en `resources/js/emails/` (p. ej., `WelcomeEmail.jsx`).
- Utiliza el SDK PHP `resend/resend-php` para enviar los correos desde Laravel.
- Configura la clave API en `.env` (`RESEND_API_KEY`).
- Ejemplo de envío desde controlador:
  ```php
  use Resend\ResendClient;
  use Resend\ReactEmail\ServerRender;

  $client = new ResendClient(env('RESEND_API_KEY'));
  $html = ServerRender::renderComponent('WelcomeEmail', ['name' => $user->name]);
  $client->emails->send([
      'from' => 'no-reply@tu-dominio.com',
      'to' => $user->email,
      'subject' => '¡Bienvenido! ',
      'html' => $html,
  ]);
  ```
- Añade pruebas de los componentes de email con **React Testing Library** y **Jest**.
- Instala el paquete `npm install react-email -E` vía npm:
  ```bash
  npm install react-email -E
  ```
- Crea componentes de email React en `resources/js/emails/` (p. ej., `WelcomeEmail.jsx`).
- Utiliza el SDK PHP `resend/resend-php` para enviar los correos desde Laravel.
- Configura la clave API en `.env` (`RESEND_API_KEY`).
- Ejemplo de envío desde controlador:
  ```php
  use Resend\ResendClient;
  use Resend\ReactEmail\ServerRender;

  $client = new ResendClient(env('RESEND_API_KEY'));
  $html = ServerRender::renderComponent('WelcomeEmail', ['name' => $user->name]);
  $client->emails->send([
      'from' => 'no-reply@tu-dominio.com',
      'to' => $user->email,
      'subject' => '¡Bienvenido! ',
      'html' => $html,
  ]);
  ```
- Añade pruebas de los componentes de email con **React Testing Library** y **Jest**.

---

## 🧪 Tests (sin ejecutar)
- **Feature Tests** (Pest) para CRUD de productos, creación de órdenes y checkout.
- **GraphQL Tests** usando `Lighthouse\Testing\MockResolver`.
- **Payment Gateway Mocks** (Stripe, PayPal) para simular webhooks.
- **Localization Tests** que verifiquen respuesta en distintos `locale`.
- **Cypress E2E** que cubra flujo completo de compra.

---


> **Nota**: No modificar el archivo `welcome.tsx` existente; mantenerlo tal cual.


---

> **¡Listo!**

Este archivo `cms-plan.md` contiene una guía completa y actualizada para iniciar y llevar a producción un CMS estilo WordPress usando Laravel 13, React, Inertia, GraphQL y todas las funcionalidades solicitadas (multidioma, e‑commerce, múltiples pasarelas de pago, marketing y pruebas). Puedes adaptarlo a tu flujo de trabajo y profundizar en cada sección según lo necesites.
