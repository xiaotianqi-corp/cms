<?php

use App\Http\Controllers\Api\ContentSectionsController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\LocaleController;
use App\Http\Middleware\SetApiLocale;
use Illuminate\Support\Facades\Route;

// Public: available locales
Route::get('locales', [LocaleController::class, 'index']);

// Routes with optional locale prefix: /api/posts OR /api/es/posts
Route::middleware(SetApiLocale::class)->group(function () {
    Route::prefix('{locale?}')->group(function () {
        Route::get('posts', [PostController::class, 'index']);
        Route::get('posts/{slug}', [PostController::class, 'show']);

        Route::get('pages/{slug}', [PostController::class, 'page']);

        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/{slug}', [ProductController::class, 'show']);

        Route::get('posts/{slug}/sections', [ContentSectionsController::class, 'postSections']);
        Route::get('pages/{slug}/sections', [ContentSectionsController::class, 'pageSections']);
        Route::get('products/{slug}/sections', [ContentSectionsController::class, 'productSections']);
        Route::get('field-groups', [ContentSectionsController::class, 'fieldGroups']);
    });
});

Route::post('checkout', [PaymentController::class, 'checkout']);
Route::post('payments/webhook', [PaymentWebhookController::class, 'handle']);