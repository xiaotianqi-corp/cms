<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ThemeController;
use App\Http\Controllers\Admin\PluginController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\AIInsightsController;
use App\Http\Controllers\EmailController;

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
