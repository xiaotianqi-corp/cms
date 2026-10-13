<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyScope
{
    private const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    private const DEFAULT_ALIASES = [
        'media-folders' => 'media',
        'media-libraries' => 'media',
        'product-variants' => 'products',
        'inventories' => 'products',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token || ! str_starts_with($token, 'cms_')) {
            $request->attributes->set('api_environment', 'live');

            return $next($request);
        }

        $key = ApiKey::findByPlainText($token);

        if (! $key || ($key->expires_at && $key->expires_at->isPast())) {
            return $this->error(401, 'Unauthorized', 'Invalid or expired API key.');
        }

        $abilities = $key->abilities ?? [];
        $environment = $key->environment ?? 'live';
        $needed = in_array($request->method(), self::READ_METHODS, true) ? 'read' : 'write';

        if ($environment === 'test' && $needed === 'write' && ! config('cms.test_keys_can_write', false)) {
            return $this->error(403, 'Forbidden', 'Test keys are read-only. Use a production key to modify content.');
        }

        if (! $this->allows($abilities, $needed, $request)) {
            return $this->error(403, 'Forbidden', "This API key lacks the '{$needed}' ability for this resource.");
        }

        $key->forceFill(['last_used_at' => now()])->saveQuietly();

        $request->attributes->set('api_environment', $environment);
        
        $request->attributes->set('api_key_scoped', ! in_array('*', $abilities, true));

        $response = $next($request);
        $response->headers->set('X-CMS-Environment', $environment);

        return $response;
    }

    private function allows(array $abilities, string $needed, Request $request): bool
    {
        if (in_array('*', $abilities, true) || in_array($needed, $abilities, true)) {
            return true;
        }

        $resource = $this->resourceFor($request);

        return $resource !== null && in_array("{$resource}:{$needed}", $abilities, true);
    }

    private function resourceFor(Request $request): ?string
    {
        $segments = array_values(array_filter(explode('/', $request->path())));
        array_shift($segments);

        if (($segments[0] ?? null) === 'teams') {
            $segments = array_slice($segments, 2);
        }
        if (isset($segments[0]) && preg_match('/^v\d+$/', $segments[0])) {
            array_shift($segments);
        }

        $segment = $segments[0] ?? null;

        return $segment === null
            ? null
            : (config('settings.api_resource_aliases', self::DEFAULT_ALIASES)[$segment] ?? $segment);
    }

    private function error(int $status, string $title, string $detail): Response
    {
        return response()->json(
            [
                'jsonapi' => ['version' => '1.0'],
                'errors' => [['status' => (string) $status, 'title' => $title, 'detail' => $detail]],
            ],
            $status,
            ['Content-Type' => 'application/vnd.api+json'],
        );
    }
}
