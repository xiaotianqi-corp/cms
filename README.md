# 🚀 Enterprise Hybrid DXP, Headless Commerce & AI Platform

![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Inertia.js](https://img.shields.io/badge/Inertia.js-v3.0-9553E9?style=for-the-badge&logo=inertia)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)
![JSON:API](https://img.shields.io/badge/JSON:API-v1.0_Spec-FF6C37?style=for-the-badge&logo=json)
![GraphQL](https://img.shields.io/badge/GraphQL-Lighthouse-E10098?style=for-the-badge&logo=graphql)

Plataforma **DXP híbrida, Headless Commerce y CMS de grado empresarial** construida con Laravel 13, React 19, Inertia.js v3 y Tailwind CSS v4.

## 📑 Documentación

| Documento | Contenido |
|---|---|
| **README.md** (este archivo) | Características, instalación, configuración, comandos y despliegue |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura, stack, modelos de dominio, motores de negocio, seguridad e IA |
| [API.md](API.md) | JSON:API v1 (REST), GraphQL y Webhooks |

---

## 🌟 Características principales

* **📰 CMS & DXP:** Entradas, páginas, categorías, etiquetas, comentarios y contenido multi-idioma (`spatie/laravel-translatable`).
* **🧱 CPT & ACF dinámico:** Custom Post Types y campos personalizados (`DynamicFieldsService`) configurables desde la UI, sin código.
* **🛒 E-commerce empresarial:** Catálogo complejo, matriz de variantes, colecciones dinámicas por reglas, marcas y proveedores.
* **🚚 Logística multi-carrier:** FedEx, UPS, USPS y tarifas manuales (`ShippingManager`).
* **📦 Reserva bloqueante de stock:** `LockingStockReserver` y asignación multialmacén (`PriorityStockAllocator`).
* **💳 Pagos multi-pasarela y suscripciones:** Stripe, PayPal y Nuvei (`PaymentGatewayManager`), cobros recurrentes y facturas PDF.
* **👥 Multi-tenancy y RBAC visual:** Espacios por equipo (`Team`), 2FA, Passkeys/WebAuthn y matriz de permisos interactiva.
* **🤖 AI Insights:** Evaluación de calidad de contenido con LLM y recomendación semántica por embeddings.
* **🌐 Capa API omnicanal:** JSON:API v1 (35+ recursos), GraphQL (Lighthouse) y webhooks salientes firmados.
* **📊 Analítica y emails:** Plantillas de correo en React (`react-email` + Resend) y soporte para GA4, Mixpanel y Hotjar.
* **🧩 Extensibilidad:** Sistema de temas (`ThemeService`) y plugins (`PluginController`).

---

## 💻 Requisitos del sistema

* **PHP** `>= 8.5` (extensiones: `pdo`, `mbstring`, `gd`, `intl`, `bcmath`, `curl`)
* **Node.js** `>= 22.x`
* **Gestor de paquetes:** `pnpm` o `npm`
* **Composer** `>= 2.8`
* **Base de datos:** MySQL `>= 8.0` / PostgreSQL `>= 15`
* **Opcionales:** Redis (caché/colas) y Meilisearch (búsqueda full-text)

---

## 🚀 Instalación rápida

### 1. Clonar e instalar dependencias
```bash
git clone https://github.com/xiaotianqi-corp/cms.git
cd cms

composer install
pnpm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
php artisan key:generate
```

### 3. Migraciones y seeders
```bash
# Crea las 65+ tablas e inserta roles, permisos y usuario administrador inicial
php artisan migrate --seed

# Enlace simbólico de almacenamiento
php artisan storage:link
```

### 4. Servidores de desarrollo
```bash
# Terminal 1
pnpm run dev

# Terminal 2
php artisan serve
```

Accede en `http://127.0.0.1:8000` (o `http://cms.test` con Laravel Herd).

---

## ⚙️ Variables de entorno

```env
# Base de datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cms
DB_USERNAME=root
DB_PASSWORD=secret

APP_URL=http://127.0.0.1:8000

# Pagos (opcional en desarrollo)
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...

# Correo (Resend)
RESEND_API_KEY=re_...
MAIL_FROM_ADDRESS=no-reply@tu-dominio.com
MAIL_FROM_NAME="${APP_NAME}"

# Búsqueda (Meilisearch)
MEILISEARCH_HOST=http://127.0.0.1:7700

# Inteligencia Artificial
LLM_API_KEY=
LLM_MODEL=
LLM_EMBEDDING_MODEL=text-embedding-3-small

# Analítica y marketing (opcional)
GA_MEASUREMENT_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=
```

---

## 🛠️ Comandos útiles

```bash
# Formatear código PHP (Pint)
vendor/bin/pint --format agent

# Indexar modelos en Meilisearch
php artisan scout:import "App\Models\Post"
php artisan scout:import "App\Models\Product"

# Imprimir el esquema GraphQL
php artisan lighthouse:print-schema

# Generar sitemap XML
php artisan sitemap:generate

# Build de producción
pnpm run build
php artisan optimize
```

---

## 📈 SEO, analítica y marketing

* **SEO:** metadatos, Open Graph y JSON-LD en el layout `resources/views/cms/layouts/app.blade.php`; sitemap con `spatie/laravel-sitemap` (`php artisan sitemap:generate`).
* **Google Analytics 4 / Search Console:** script `gtag.js` y meta de verificación en el layout; el ID se toma de `GA_MEASUREMENT_ID`.
* **Tracking de eventos:** Mixpanel y Hotjar (opcionales); tracking server-side con `spatie/laravel-analytics`.
* **Dashboard de analítica:** sección *Analytics* en el admin con visitas, usuarios activos, conversiones y eventos personalizados (p. ej. `order.completed`).

## 📧 Emails con React + Resend

* Plantillas en `resources/js/emails/` (p. ej. `WelcomeEmail.tsx`), construidas con `react-email`.
* Envío desde Laravel con el SDK `resend/resend-php`, usando `RESEND_API_KEY`.

---

## 🐳 Despliegue con Docker

```bash
docker-compose up -d --build
```

La aplicación queda disponible en el puerto `8000` y MySQL en el `3306`.

Comandos de mantenimiento tras un cambio de configuración o despliegue:

```bash
docker compose exec app php artisan optimize
docker compose restart app
```

---

## 🧪 Pruebas

* **Backend:** Pest (feature tests de CRUD, órdenes y checkout; permisos por rol; mocks de pasarelas y webhooks; localización).
* **GraphQL:** pruebas de queries y mutaciones con las utilidades de testing de Lighthouse.
* **Frontend:** Jest + React Testing Library (componentes y plantillas de email).
* **E2E:** Cypress (flujo de compra: carrito → pago → confirmación).