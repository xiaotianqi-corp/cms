# Missing Items Checklist

The project **/Users/zhengxi/Herd/cms** is currently at an early scaffold stage. Below is a comprehensive markdown list of everything that still needs to be created or completed, grouped by area.

---

## 1️⃣ Backend – Laravel

| Area | Missing Files / Tasks | Notes |
|------|----------------------|-------|
| **Models & Migrations** | `app/Models/Post.php`, `app/Models/Page.php`, `app/Models/User.php` (add `HasRoles` trait), `app/Models/Product.php`, `app/Models/Category.php`, `app/Models/Order.php`, `app/Models/Payment.php`, `database/migrations/*` for each table (posts, pages, users, products, categories, orders, payments, settings, themes, plugins, ai_insights) | Include `Sluggable`, `Translatable`, `HasMedia` traits where needed. |
| **Services** | `app/Services/ThemeService.php`, `app/Services/PluginService.php`, `app/Services/EmailService.php` (wrapper around Resend SDK) | Provide methods for activating themes, registering plugins, rendering React‑email templates. |
| **Controllers (Inertia)** | Admin CRUD controllers: `app/Http/Controllers/Admin/PostController.php`, `Admin/PageController.php`, `Admin/ProductController.php`, `Admin/ThemeController.php`, `Admin/PluginController.php`, `Admin/SettingController.php`, `Admin/AIInsightsController.php`. Public controller: `app/Http/Controllers/FrontController.php`. Email controller: `app/Http/Controllers/EmailController.php` (sendWelcome). | Use `Inertia::render` for views, apply `auth` and `role` middleware. |
| **API Controllers** | `app/Http/Controllers/Api/PostController.php`, `Api/PageController.php`, `Api/ProductController.php`, `Api/PaymentController.php`, `Api/PaymentWebhookController.php` | Return JSON responses, protect with Sanctum. |
| **Routes** | `routes/web.php` (public routes), `routes/admin.php` (prefixed `/admin` with auth & role middleware), `routes/api.php` (Sanctum), `routes/graphql.php` (Lighthouse schema registration) | Ensure proper naming conventions (`admin.posts.index`, etc.). |
| **Middleware** | `app/Http/Middleware/SetLocale.php` (locale detection), policies for Post, Page, Product (Spatie) | Register in `kernel.php`. |
| **Config Files** | `config/cms.php` (theme, feature toggles), `config/payment.php` (Stripe keys, PayPal placeholders) | Add default values and env lookups. |
| **Env Variables** | Add to `.env.example`: `RESEND_API_KEY`, `STRIPE_KEY`, `STRIPE_SECRET`, `MEILISEARCH_HOST`, `APP_URL`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Document usage in README. |
| **Database Seeders** | `database/seeders/RoleSeeder.php` (admin, editor, author, subscriber), `UserSeeder.php`, `DemoDataSeeder.php` for posts/pages/products | Call from `DatabaseSeeder`. |
| **Laravel‑Vite Integration** | Ensure `vite.config.ts` (or .js) imports `@inertiajs/vite` and Tailwind plugin. | Verify `resources/js/app.tsx` loads Inertia app. |
| **Testing** | Pest test files for each controller (`tests/Feature/...`), Jest tests for React components, Cypress e2e for checkout flow. | Add CI workflow later. |
| **SEO & Sitemap** | Blade layout `resources/views/cms/layouts/app.blade.php` needs meta tags, Open Graph, JSON‑LD. Add `spatie/laravel-sitemap` publishing command. |
| **Analytics** | Service `app/Services/AnalyticsService.php` using `spatie/laravel-analytics` or custom Resend events. Add admin dashboard page. |
| **AI Insights** | Service `app/Services/AIInsightsService.php` (uses OpenAI or similar), controller & admin UI page. |
| **Payments Integration** | Stripe setup (`laravel/cashier`), optional PayPal (`srmklive/paypal`). Webhook route, controller methods, test stubs. |
| **E‑commerce Core** | Models for `Product`, `Category`, `Cart`, `OrderItem`, `Coupon`; related migrations, factories, policies, API endpoints. |
| **Theme System** | Directory `resources/views/cms/themes/{theme}` with Blade layout files, assets folder, `ThemeService` to switch active theme (store in `settings`). |
| **Plugin System** | Table `plugins`, ServiceProvider auto‑registration, UI to upload/activate plugins, migration & seed. |
| **Media Library** | Already installed `spatie/laravel-medialibrary`; need model traits, upload endpoints, UI components (`FileUploader`). |
| **GraphQL (Lighthouse)** | `graphql/schema.graphql` skeleton with types for Post, Page, Product, User, Order, Mutation for CRUD. Run `php artisan lighthouse:publish`. |
| **Documentation** | `README.md` with installation, environment setup, build commands, feature overview. |

---

## 2️⃣ Frontend – TypeScript / React / Inertia

| Area | Missing Files / Tasks | Notes |
|------|----------------------|-------|
| **Pages (Public)** | `resources/js/pages/Home.tsx` (done), create `resources/js/pages/PostShow.tsx`, `PageShow.tsx`, `ProductShow.tsx`, `Dashboard.tsx` (admin). |
| **Admin Pages** | Folder `resources/js/pages/Admin/` with sub‑pages: `Posts.tsx`, `Pages.tsx`, `Products.tsx`, `Orders.tsx`, `Themes.tsx`, `Plugins.tsx`, `Settings.tsx`, `Analytics.tsx`, `AIInsights.tsx`, `Payments.tsx`. Each page should use Inertia `useForm`, table components, modals for create/edit. |
| **Components** | Reusable UI components under `resources/js/components/`: `Layout.tsx`, `Sidebar.tsx`, `Modal.tsx`, `DataTable.tsx`, `RichTextEditor.tsx` (integrate Tiptap), `FileUploader.tsx`, `Button.tsx` (styled with Tailwind glass‑morphism). |
| **Layouts** | `resources/js/layouts/AppLayout.tsx` (wraps Inertia app, includes `<Head>` meta), `AdminLayout.tsx` (sidebar, top bar). |
| **Hooks** | Custom hooks folder `resources/js/hooks/`: `useAuth.ts`, `useTheme.ts`, `usePlugin.ts`, `useAnalytics.ts`. |
| **Types** | `resources/js/types/index.d.ts` for shared interfaces (e.g., `Post`, `Page`, `Product`, `User`, `PaginatedResponse<T>`). |
| **Email Templates** | `resources/js/emails/WelcomeEmail.tsx` (created). Add other templates: `PasswordResetEmail.tsx`, `OrderConfirmationEmail.tsx`. Ensure they export as default and use `react-email` components. |
| **Tailwind Config** | `tailwind.config.cjs` (or .js) with custom color palette, glass‑morphism utilities, dark mode `media` or `class`. |
| **Vite Config** | `vite.config.ts` (or .js) to enable TypeScript, React Refresh, Inertia plugin, alias `@` to `resources/js`. |
| **Internationalization** | Add i18n library (e.g., `react-i18next`) and translation JSON files under `resources/js/locales/{en,es,...}`. |
| **Testing** | Jest config `jest.config.cjs`, test files for each component (`__tests__/components/*.test.tsx`). Cypress e2e for admin UI interactions. |
| **Analytics Frontend** | Dashboard widgets using a chart library (e.g., `chart.js` or `recharts`). |
| **AI Insights UI** | Page showing content similarity, plagiarism detection, LLM suggestions. |
| **Payment UI** | Checkout page (`resources/js/pages/Checkout.tsx`) with Stripe Elements integration, order summary, coupon input. |
| **Theme Switching UI** | Settings page with dropdown to select active theme, persisting via API. |
| **Plugin Management UI** | Upload form, list of installed plugins, activate/deactivate toggles. |
| **Media Library UI** | Media manager modal showing thumbnails, upload button, delete action. |

---

## 3️⃣ Build & Deployment

| Task | Details |
|------|---------|
| **Development Server** | `npm run dev` (Vite) + `php artisan serve`. |
| **Production Build** | `npm run build` (generates assets), `php artisan optimize`, Dockerfile (see plan) for deployment. |
| **Docker** | `Dockerfile` and `docker-compose.yml` already outlined in the plan – need to create them in the repo root. |
| **CI/CD** | GitHub Actions workflow (`.github/workflows/ci.yml`) to run Composer install, npm install, lint, tests, and build artifacts. |
| **Static Assets** | Ensure all images, fonts, icons are placed under `resources/js/assets/` and referenced via Vite. |

---

## 4️⃣ Documentation & SEO

| Item | Action |
|------|--------|
| **README.md** | Write installation steps, env variables, build commands, feature list, contribution guide. |
| **API Docs** | Generate OpenAPI spec for REST endpoints (optional) using `swagger-php`. |
| **Sitemap** | Configure `spatie/laravel-sitemap` and schedule generation (`php artisan sitemap:generate`). |
| **Meta Tags** | Add dynamic meta tags (title, description, OG, Twitter) in `resources/views/cms/layouts/app.blade.php` using Laravel view composers. |
| **Accessibility** | Run Chrome DevTools a11y audit (via `a11y-debugging` skill) on public pages. |

---

## ✅ Quick Start Checklist (What to do next)
1. **Create backend models & migrations** (Posts, Pages, Users, Products, etc.).
2. **Generate service classes** for Theme, Plugin, Email.
3. **Build admin controllers & routes** (CRUD + UI helpers).
4. **Implement frontend admin pages** (`resources/js/pages/Admin/*`).
5. **Add missing email templates** (`PasswordResetEmail.tsx`, `OrderConfirmationEmail.tsx`).
6. **Configure Tailwind & Vite** for TSX support and glass‑morphism styling.
7. **Add env variables** to `.env.example` and document them.
8. **Write seeders** for roles, demo data.
9. **Set up Stripe & Resend integration** in services and controllers.
10. **Create Dockerfile & CI workflow** for CI/CD.
11. **Update README** with all steps and screenshots.
12. **Run a11y audit** on public pages once UI is ready.

---

*This markdown (`missing_items.md`) serves as a living checklist. As you create each file or complete a feature, mark the corresponding row as ✅ in the appropriate tracker (e.g., `FEATURES_PROGRESS.md`).*
