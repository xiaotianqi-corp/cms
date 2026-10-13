<?php

use App\Http\Controllers\Api\OpenApiController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Webhooks\NuveiWebhookController;
use App\Http\Controllers\Api\TokenController;
use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AttributeController;
use App\Http\Controllers\Api\V1\AttributeValueController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CarrierController;
use App\Http\Controllers\Api\V1\CarrierOptionController;
use App\Http\Controllers\Api\V1\CartAddressController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CartShippingController;
use App\Http\Controllers\Api\V1\CartLineAdjustmentController;
use App\Http\Controllers\Api\V1\CartLineController;
use App\Http\Controllers\Api\V1\CartLineTaxLineController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CollectionController;
use App\Http\Controllers\Api\V1\CollectionRuleController;
use App\Http\Controllers\Api\V1\CountryController;
use App\Http\Controllers\Api\V1\CptController;
use App\Http\Controllers\Api\V1\CptDefinitionController;
use App\Http\Controllers\Api\V1\CptEntryController;
use App\Http\Controllers\Api\V1\CurrencyController;
use App\Http\Controllers\Api\V1\DiscountController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\LegalController;
use App\Http\Controllers\Api\V1\MediaFolderController;
use App\Http\Controllers\Api\V1\MediaLibraryController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\OrderItemController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\PaymentTransactionController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductVariantController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\TaxRateController;
use App\Http\Controllers\Api\V1\TaxZoneController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ZoneController;
use App\Http\Middleware\ApiKeyScope;
use App\Http\Middleware\SetApiLocale;
use App\Http\Middleware\SetApiTeam;
use Illuminate\Support\Facades\Route;
use LaravelJsonApi\Laravel\Facades\JsonApiRoute;
use LaravelJsonApi\Laravel\Routing\ActionRegistrar;
use LaravelJsonApi\Laravel\Routing\ResourceRegistrar;

Route::get('openapi.json', [OpenApiController::class, 'show']);

// -----------------------------------------------------------------------
// Callback servidor-a-servidor de Stripe. Tiene que quedar FUERA del grupo
// autenticado: Stripe no puede enviar un token Sanctum, se autentica con
// la firma (Stripe-Signature) que valida el controlador.
// -----------------------------------------------------------------------
Route::post('payments/webhook', [PaymentWebhookController::class, 'handle']);
Route::post('/webhooks/nuvei', [NuveiWebhookController::class]);

// -----------------------------------------------------------------------
// JSON:API v1 — TODO va aquí: un solo grupo, un solo servidor, token
// obligatorio. https://laraveljsonapi.io/5.x/routing/controllers.html
// Idioma: header X-Locale o Accept-Language (SetApiLocale).
// -----------------------------------------------------------------------

Route::prefix('tokens')->middleware(['auth:sanctum'])->group(function () {
    Route::post('/', [TokenController::class, 'store']);
    Route::delete('{tokenId}', [TokenController::class, 'destroy']);
});

Route::prefix('v1')
    ->middleware(['api'])
    ->group(function () {

        Route::get('/health', function () {
            return response()->json([
                'status' => 'ok',
            ]);
        });

        Route::middleware('auth:sanctum')->group(function () {

            Route::get('/user', function (\Illuminate\Http\Request $request) {
                return $request->user();
            });

        });

    });

Route::middleware([
    'auth:sanctum',
    ApiKeyScope::class,
    SetApiTeam::class,
    SetApiLocale::class,
])->group(function () {
    Route::get('v1/carts/{cart}/shipping-options', [CartShippingController::class, 'index']);
    Route::put('v1/carts/{cart}/shipping-option', [CartShippingController::class, 'update']);
    JsonApiRoute::server('v1')
        ->prefix('v1')
        ->resources(function (ResourceRegistrar $server) {
            $server->resource('categories', CategoryController::class);
            $server->resource('products', ProductController::class);
            $server->resource('posts', PostController::class);
            $server->resource('pages', PageController::class);
            $server->resource('brands', BrandController::class);
            $server->resource('suppliers', SupplierController::class);
            $server->resource('collections', CollectionController::class);
            $server->resource('collection-rules', CollectionRuleController::class);
            $server->resource('attributes', AttributeController::class);
            $server->resource('attribute-values', AttributeValueController::class);
            $server->resource('reviews', ReviewController::class);
            $server->resource('zones', ZoneController::class);
            $server->resource('tax-zones', TaxZoneController::class);
            $server->resource('tax-rates', TaxRateController::class);
            $server->resource('carriers', CarrierController::class);
            $server->resource('carrier-options', CarrierOptionController::class);
            $server->resource('payment-methods', PaymentMethodController::class);
            $server->resource('discounts', DiscountController::class);
            $server->resource('countries', CountryController::class);
            $server->resource('currencies', CurrencyController::class);
            $server->resource('legals', LegalController::class);
            $server->resource('settings', SettingController::class)->readOnly();
            $server->resource('users', UserController::class);
            $server->resource('addresses', AddressController::class);
            $server->resource('product-variants', ProductVariantController::class);
            $server->resource('inventories', InventoryController::class);
            $server->resource('orders', OrderController::class);
            $server->resource('order-items', OrderItemController::class);

            // Checkout = acción JSON:API: POST /api/teams/{team}/v1/carts/{cart}/-actions/checkout
            $server->resource('carts', CartController::class)->actions('-actions', function (ActionRegistrar $actions) {
                $actions->withId()->post('checkout');
            });

            $server->resource('cart-lines', CartLineController::class);
            $server->resource('cart-addresses', CartAddressController::class);
            $server->resource('cart-line-adjustments', CartLineAdjustmentController::class);
            $server->resource('cart-line-tax-lines', CartLineTaxLineController::class);
            $server->resource('payment-transactions', PaymentTransactionController::class);
            $server->resource('media-folders', MediaFolderController::class);
            $server->resource('media-libraries', MediaLibraryController::class);
            $server->resource('cpts', CptController::class);
            $server->resource('cpt-definitions', CptDefinitionController::class);
            $server->resource('cpt-entries', CptEntryController::class);
        });
});
