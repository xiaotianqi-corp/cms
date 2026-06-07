<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()
            ->mapWithKeys(function ($setting) {
                $decoded = json_decode($setting->value, true);

                return [
                    $setting->key => json_last_error() === JSON_ERROR_NONE
                        ? $decoded
                        : $setting->value,
                ];
            });

        return Inertia::render('admin/settings', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($request->settings as $key => $value) {
            Setting::set($key, $value);
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
