<?php

use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Http\Controllers\FrontController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ThemeController;
use App\Http\Controllers\Admin\PluginController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\AIInsightsController;
use App\Http\Controllers\Admin\FieldGroupController;
use App\Http\Controllers\Admin\LanguageController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\MediaFolderController;
use App\Http\Controllers\EmailController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['web', 'auth'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Content
        Route::resource('posts', PostController::class);
        Route::resource('pages', PageController::class);
        Route::resource('products', ProductController::class);
        // Media
        Route::prefix('media')->name('media.')->group(function () {
            Route::get('/', [MediaController::class, 'index'])->name('index');
            Route::post('/', [MediaController::class, 'store'])->name('store');
            Route::put('/{media}', [MediaController::class, 'update'])->name('update');
            Route::post('/{media}/replace', [MediaController::class, 'replace'])->name('replace');
            Route::patch('/{media}/metadata', [MediaController::class, 'metadata'])->name('metadata');
            Route::patch('/{media}/crop', [MediaController::class, 'crop'])->name('crop');
            Route::delete('/{media}', [MediaController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('media-folders')->name('media-folders.')->group(function () {
            Route::get('/', [MediaFolderController::class, 'index'])->name('index');
            Route::post('/', [MediaFolderController::class, 'store'])->name('store');
            Route::put('/{folder}', [MediaFolderController::class, 'update'])->name('update');
            Route::delete('/{folder}', [MediaFolderController::class, 'destroy'])->name('destroy');
        });
        // Commerce
        Route::resource('orders', OrderController::class)->only(['index', 'show', 'update']);

        // Appearance
        Route::get('themes', [ThemeController::class, 'index'])->name('themes.index');
        Route::post('themes/{slug}/activate', [ThemeController::class, 'activate'])->name('themes.activate');

        // Extensions
        Route::get('plugins', [PluginController::class, 'index'])->name('plugins.index');
        Route::post('plugins/{slug}/toggle', [PluginController::class, 'toggle'])->name('plugins.toggle');

        // Dynamic fields
        Route::resource('field-groups', FieldGroupController::class)->names('field-groups');

        // Settings
        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [SettingController::class, 'update'])->name('settings.update');

        // Languages
        Route::get('languages', [LanguageController::class, 'index'])->name('languages.index');
        Route::post('languages', [LanguageController::class, 'update'])->name('languages.update');

        // AI
        Route::get('ai-insights', [AIInsightsController::class, 'index'])->name('ai-insights.index');
        Route::post('ai-insights/detect', [AIInsightsController::class, 'detect'])->name('ai-insights.detect');

        // Analytics
        Route::get('analytics', fn() => inertia('admin/analytics'))->name('analytics');

        // Email
        Route::post('email/send-test', [EmailController::class, 'sendTestEmail'])->name('email.send-test');
    });

Route::get('posts/{slug}', [FrontController::class, 'showPost'])->name('post.show');
Route::get('products/{slug}', [FrontController::class, 'showProduct'])->name('product.show');
Route::get('checkout', [FrontController::class, 'checkout'])->name('checkout');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
});

require __DIR__ . '/settings.php';