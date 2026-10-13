<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Módulos que existen en el sistema. Lo que NO está aquí (dashboard,
     * media, users, roles, permissions, settings, billing) es "core"
     * y siempre está disponible.
     */
    private const MODULE_CMS = 'cms';
    private const MODULE_ECOMMERCE = 'ecommerce';

    private const TIERS = [
        'starter' => [
            'name' => 'Starter',
            'sort' => 1,
            'price_cms' => 1900,       // centavos USD/mes
            'price_commerce' => 4900,  // placeholder
            'limits' => [
                'projects' => 1,
                'team_members' => 3,
                'entries' => 5000,
                'storage_gb' => 10,
                'api_requests' => 100000,
                'products' => 100,     // solo aplica con ecommerce
            ],
            'flags' => [
                'multilanguage' => false,
                'ai_insights' => false,
                'analytics' => false,
                'workflows' => false,
                'environments' => false,
                'audit_log' => false,
                'unlimited_webhooks' => false,
                'sso' => false,
                'priority_support' => false,
            ],
        ],
        'professional' => [
            'name' => 'Professional',
            'sort' => 2,
            'price_cms' => 7900,
            'price_commerce' => 12900, // placeholder
            'limits' => [
                'projects' => 5,
                'team_members' => 15,
                'entries' => 50000,
                'storage_gb' => 50,
                'api_requests' => 1000000,
                'products' => 2000,
            ],
            'flags' => [
                'multilanguage' => true,
                'ai_insights' => true,
                'analytics' => true,
                'workflows' => true,
                'environments' => true,
                'audit_log' => true,
                'unlimited_webhooks' => false,
                'sso' => false,
                'priority_support' => false,
            ],
        ],
        'business' => [
            'name' => 'Business',
            'sort' => 3,
            'price_cms' => 19900,
            'price_commerce' => 29900, // placeholder
            'limits' => [
                'projects' => 15,
                'team_members' => 50,
                'entries' => 250000,
                'storage_gb' => 250,
                'api_requests' => 5000000,
                'products' => 20000,
            ],
            'flags' => [
                'multilanguage' => true,
                'ai_insights' => true,
                'analytics' => true,
                'workflows' => true,
                'environments' => true,
                'audit_log' => true,
                'unlimited_webhooks' => true,
                'sso' => false,
                'priority_support' => false,
            ],
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'sort' => 4,
            'price_cms' => 0,          // 0 = "contactar ventas"
            'price_commerce' => 0,
            'limits' => [              // null = ilimitado / custom
                'projects' => null,
                'team_members' => null,
                'entries' => null,
                'storage_gb' => null,
                'api_requests' => null,
                'products' => null,
            ],
            'flags' => [
                'multilanguage' => true,
                'ai_insights' => true,
                'analytics' => true,
                'workflows' => true,
                'environments' => true,
                'audit_log' => true,
                'unlimited_webhooks' => true,
                'sso' => true,
                'priority_support' => true,
            ],
        ],
    ];

    public function run(): void
    {
        $gateway = config('billing.default_gateway', 'stripe');

        foreach (self::TIERS as $tier => $cfg) {
            foreach ([false, true] as $hasEcommerce) {
                $slug = $hasEcommerce ? "{$tier}-commerce" : $tier;

                Plan::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'tier' => $tier,
                        'has_ecommerce' => $hasEcommerce,
                        'name' => $cfg['name'].($hasEcommerce ? ' + Commerce' : ''),
                        'price_cents' => $hasEcommerce ? $cfg['price_commerce'] : $cfg['price_cms'],
                        'currency' => 'usd',
                        'interval' => 'month',
                        'gateway' => $gateway,
                        // No pisar el price id si ya lo configuraste en el gateway
                        'is_active' => true,
                        'sort_order' => ($cfg['sort'] * 10) + ($hasEcommerce ? 1 : 0),
                        'features' => $this->features($cfg, $hasEcommerce),
                        'entitlements' => [
                            'modules' => $this->modules($cfg['flags'], $hasEcommerce),
                            'limits' => $this->limits($cfg['limits'], $hasEcommerce),
                        ],
                    ],
                );
            }
        }
    }

    /** Módulos habilitados (lo que valida el middleware `module:*` y el sidebar). */
    private function modules(array $flags, bool $hasEcommerce): array
    {
        $modules = [self::MODULE_CMS];

        foreach (['multilanguage', 'ai_insights', 'analytics', 'workflows', 'environments', 'audit_log', 'sso'] as $flag) {
            if ($flags[$flag]) {
                $modules[] = $flag;
            }
        }

        if ($hasEcommerce) {
            $modules[] = self::MODULE_ECOMMERCE;
        }

        return $modules;
    }

    private function limits(array $limits, bool $hasEcommerce): array
    {
        if (! $hasEcommerce) {
            unset($limits['products']);
        }

        return $limits;
    }

    /** Lista visual para la tarjeta de precios (no manda sobre permisos). */
    private function features(array $cfg, bool $hasEcommerce): array
    {
        $l = $cfg['limits'];
        $f = $cfg['flags'];

        $fmt = fn (?int $n, string $unit, string $unlimited = 'Unlimited') => $n === null
            ? "{$unlimited} {$unit}"
            : number_format($n)." {$unit}";

        $features = [
            ['label' => $l['projects'] === null ? 'Unlimited projects' : ($l['projects'] === 1 ? '1 project' : "{$l['projects']} projects"), 'included' => true],
            ['label' => $l['team_members'] === null ? 'Custom team members' : "{$l['team_members']} team members", 'included' => true],
            ['label' => $l['entries'] === null ? 'Custom content limits' : $fmt($l['entries'], 'content entries'), 'included' => true],
            ['label' => $l['storage_gb'] === null ? 'Custom media storage' : "{$l['storage_gb']} GB media storage", 'included' => true],
            ['label' => $l['api_requests'] === null ? 'Custom API limits' : $fmt($l['api_requests'], 'API requests/month'), 'included' => true],
            ['label' => 'JSON:API v1', 'included' => true],
            ['label' => 'GraphQL API', 'included' => true],
            ['label' => 'Custom content types', 'included' => true],
            ['label' => $f['unlimited_webhooks'] ? 'Unlimited webhooks' : 'Webhooks', 'included' => true],
            ['label' => 'Multi-language content', 'included' => $f['multilanguage']],
            ['label' => 'AI content insights', 'included' => $f['ai_insights']],
            ['label' => 'Analytics', 'included' => $f['analytics']],
            ['label' => 'Advanced workflows', 'included' => $f['workflows']],
            ['label' => 'Multiple environments', 'included' => $f['environments']],
            ['label' => 'Audit log', 'included' => $f['audit_log']],
        ];

        if ($f['sso']) {
            $features[] = ['label' => 'SSO / SAML', 'included' => true];
        }
        if ($f['priority_support']) {
            $features[] = ['label' => 'Priority support', 'included' => true];
            $features[] = ['label' => 'Custom SLA', 'included' => true];
        }

        // Bloque de ecommerce
        $features[] = ['label' => 'Online store (products, orders, discounts)', 'included' => $hasEcommerce];
        $features[] = ['label' => 'Catalog, shipping & tax setup', 'included' => $hasEcommerce];
        if ($hasEcommerce) {
            $features[] = [
                'label' => $l['products'] === null ? 'Unlimited products' : number_format($l['products']).' products',
                'included' => true,
            ];
        }

        return $features;
    }
}