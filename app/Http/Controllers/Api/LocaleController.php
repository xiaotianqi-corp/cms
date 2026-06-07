<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class LocaleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'locales' => json_decode(Setting::get('locales', '["en"]'), true) ?? ['en'],
            'default' => Setting::get('default_locale', 'en'),
        ]);
    }
}