<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FieldDefinition extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_group_id',
        'label',
        'name',
        'type',
        'options',
        'settings',
        'instructions',
        'required',
        'default_value',
        'order',
        'parent_id',
    ];

    protected $casts = [
        'options' => 'array',
        'settings' => 'array',
        'required' => 'boolean',
        'order' => 'integer',
    ];

    // Tipos soportados
    public const TYPES = [
        'text',
        'textarea',
        'wysiwyg',
        'number',
        'email',
        'url',
        'color',
        'date',
        'image',
        'file',
        'select',
        'checkbox',
        'radio',
        'repeater',
        'relation',
    ];

    public function fieldGroup(): BelongsTo
    {
        return $this->belongsTo(FieldGroup::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(FieldDefinition::class, 'parent_id');
    }

    // Sub-campos de un repeater
    public function subFields(): HasMany
    {
        return $this->hasMany(FieldDefinition::class, 'parent_id')->orderBy('order');
    }

    public function sectionValues(): HasMany
    {
        return $this->hasMany(ContentSectionValue::class);
    }

    public function isRepeater(): bool
    {
        return $this->type === 'repeater';
    }

    public function isMedia(): bool
    {
        return in_array($this->type, ['image', 'file']);
    }
}