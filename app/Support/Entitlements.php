<?php

namespace App\Support;

use App\Models\Setting;
use App\Models\Team;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class Entitlements
{
    public static function fieldMap(): array
    {
        $map = [];
        foreach (config('entitlements.locked_fields', []) as $module => $fields) {
            foreach ($fields as $f) {
                $map[$f] = $module;
            }
        }

        return $map;
    }
    
    public static function strip(?Team $team, array $data): array
    {
        $locked = [];
        foreach (self::fieldMap() as $pattern => $module) {
            if (! ($team?->hasModule($module) ?? false)) {
                $locked[] = $pattern;
            }
        }

        return $locked ? self::stripKeys($data, $locked) : $data;
    }

    private static function stripKeys(array $data, array $patterns): array
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && Str::is($patterns, $key)) {
                unset($data[$key]);
            } elseif (is_array($value)) {
                $data[$key] = self::stripKeys($value, $patterns);
            }
        }

        return $data;
    }
    
    public static function locales(?Team $team): array
    {
        $default = self::defaultLocale();

        if (! ($team?->hasModule('multilanguage') ?? false)) {
            return [$default];
        }

        $raw = Setting::get('localization.active_locales', [$default]);
        $list = is_string($raw) ? (json_decode($raw, true) ?: []) : (array) $raw;
        $list = array_values(array_filter($list, fn ($l) => is_string($l) && $l !== ''));

        return array_values(array_unique([$default, ...$list]));
    }

    public static function defaultLocale(): string
    {
        return (string) Setting::get('localization.default_locale', 'en');
    }
    
    public static function filterDefinitions(?Team $team, array $fields): array
    {
        return array_values(array_filter(
            $fields,
            fn ($f) => empty($f['requires_module']) || ($team?->hasModule($f['requires_module']) ?? false),
        ));
    }
    
    public static function assertWithinLimit(Team $team, string $limit, int $current, ?string $label = null): void
    {
        if (auth()->user()?->is_super_admin) {
            return;
        }

        $max = $team->entitlements()['limits'][$limit] ?? null;

        if ($max !== null && $current >= $max) {
            throw ValidationException::withMessages([
                $limit => ($label ?? $limit)." limit reached for your plan ({$max}). Upgrade to add more.",
            ]);
        }
    }
}