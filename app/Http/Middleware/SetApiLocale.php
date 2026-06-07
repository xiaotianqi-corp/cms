<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetApiLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $availableLocales = json_decode(Setting::get('locales', '["en"]'), true) ?? ['en'];
        $defaultLocale = Setting::get('default_locale', 'en');

        $locale = $request->route('locale')
            ?? $request->query('locale')
            ?? $request->header('X-Locale')
            ?? $defaultLocale;

        if (!in_array($locale, $availableLocales)) {
            $locale = $defaultLocale;
        }

        app()->setLocale($locale);
        $request->attributes->set('locale', $locale);

        return $next($request);
    }
}