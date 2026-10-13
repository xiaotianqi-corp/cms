<?php

namespace App\Http\Requests\Settings;

use App\Models\ApiKey;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ApiKeyStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'environment' => ['required', Rule::in(ApiKey::ENVIRONMENTS)],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => ['string'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }

    /** Test keys share the production database, so they can't be given write access by default. */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($this->input('environment') !== 'test' || config('settings.test_keys_can_write', false)) {
                return;
            }

            $hasWrite = collect($this->input('abilities', []))->contains(
                fn ($a) => $a === '*' || $a === 'write' || str_ends_with((string) $a, ':write')
            );

            if ($hasWrite) {
                $validator->errors()->add(
                    'abilities',
                    'Test keys are read-only. Remove write permissions or create a production key.'
                );
            }
        }];
    }
}
