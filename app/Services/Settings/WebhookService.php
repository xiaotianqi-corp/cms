<?php

namespace App\Services\Settings;

use App\Models\Webhook;
use App\Models\WebhookLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebhookService
{
    public function dispatch(string $event, array $payload = [], ?string $environment = null): void
    {
        $environment ??= request()->attributes->get('api_environment');

        Webhook::query()
            ->where('is_active', true)
            ->when($environment, fn ($q) => $q->where('environment', $environment))
            ->whereJsonContains('events', $event)
            ->get()
            ->each(fn (Webhook $webhook) => $this->send($webhook, $event, $payload));
    }

    public function test(Webhook $webhook): WebhookLog
    {
        return $this->send($webhook, 'webhook.test', ['message' => 'This is a test event from your CMS.']);
    }

    protected function send(Webhook $webhook, string $event, array $payload): WebhookLog
    {
        $body = [
            'event' => $event,
            'environment' => $webhook->environment,
            'payload' => $payload,
            'sent_at' => now()->toIso8601String(),
        ];
        $signature = hash_hmac('sha256', json_encode($body), $webhook->secret ?? '');

        try {
            $response = Http::withHeaders([
                'X-CMS-Signature' => $signature,
                'X-CMS-Environment' => $webhook->environment,
            ])
                ->timeout(10)
                ->post($webhook->url, $body);

            return $webhook->logs()->create([
                'event' => $event,
                'response_code' => $response->status(),
                'payload' => json_encode($body),
                'response_body' => Str::limit($response->body(), 2000),
                'successful' => $response->successful(),
            ]);
        } catch (\Throwable $e) {
            return $webhook->logs()->create([
                'event' => $event,
                'response_code' => null,
                'payload' => json_encode($body),
                'response_body' => $e->getMessage(),
                'successful' => false,
            ]);
        }
    }
}
