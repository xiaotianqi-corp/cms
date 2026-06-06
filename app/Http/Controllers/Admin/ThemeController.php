<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ThemeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ThemeController extends Controller
{
    protected $themeService;

    public function __construct(ThemeService $themeService)
    {
        $this->themeService = $themeService;
    }

    public function index()
    {
        $themes = $this->themeService->getAvailableThemes();
        $activeTheme = $this->themeService->getActiveTheme();

        return Inertia::render('admin/themes', [
            'themes' => $themes,
            'activeTheme' => $activeTheme
        ]);
    }

    public function activate(Request $request, $slug)
    {
        $this->themeService->activateTheme($slug);
        return redirect()->back()->with('success', "Theme '{$slug}' activated successfully.");
    }
}
