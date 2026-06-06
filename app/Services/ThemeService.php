<?php

namespace App\Services;

use App\Models\Theme;
use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

class ThemeService
{
    /**
     * Get the currently active theme.
     */
    public function getActiveTheme(): ?Theme
    {
        $activeSlug = Setting::get('active_theme', 'default');
        
        return Theme::firstOrCreate(
            ['slug' => $activeSlug],
            ['name' => ucfirst($activeSlug), 'is_active' => true]
        );
    }

    /**
     * Get all available themes in the filesystem and database.
     */
    public function getAvailableThemes(): Collection
    {
        $themesDir = resource_path('views/cms/themes');
        if (!File::isDirectory($themesDir)) {
            File::makeDirectory($themesDir, 0755, true, true);
        }

        // Always ensure 'default' theme directory exists
        $defaultDir = $themesDir . '/default';
        if (!File::isDirectory($defaultDir)) {
            File::makeDirectory($defaultDir, 0755, true, true);
        }

        $directories = File::directories($themesDir);
        $availableSlugs = collect($directories)->map(function ($dir) {
            return basename($dir);
        });

        // Add to database if not exists
        foreach ($availableSlugs as $slug) {
            Theme::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucfirst($slug), 'is_active' => ($slug === 'default')]
            );
        }

        return Theme::all();
    }

    /**
     * Activate a theme by slug.
     */
    public function activateTheme(string $slug): void
    {
        Theme::query()->update(['is_active' => false]);
        
        $theme = Theme::updateOrCreate(
            ['slug' => $slug],
            ['name' => ucfirst($slug), 'is_active' => true]
        );

        Setting::set('active_theme', $slug);
    }
}
