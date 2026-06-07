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
use App\Http\Controllers\EmailController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['web', 'auth'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('posts', PostController::class);
        Route::resource('pages', PageController::class);
        Route::resource('products', ProductController::class);
        Route::resource('orders', OrderController::class)->only(['index', 'show', 'update']);
        Route::get('themes', [ThemeController::class, 'index'])->name('themes.index');
        Route::post('themes/{slug}/activate', [ThemeController::class, 'activate'])->name('themes.activate');

        Route::get('plugins', [PluginController::class, 'index'])->name('plugins.index');
        Route::post('plugins/{slug}/toggle', [PluginController::class, 'toggle'])->name('plugins.toggle');

        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [SettingController::class, 'update'])->name('settings.update');

        Route::get('ai-insights', [AIInsightsController::class, 'index'])->name('ai-insights.index');
        Route::post('ai-insights/detect', [AIInsightsController::class, 'detect'])->name('ai-insights.detect');

        Route::get('analytics', function () {
            return inertia('admin/analytics');
        })->name('analytics');
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
