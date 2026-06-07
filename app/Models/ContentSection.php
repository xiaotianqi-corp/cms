<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentSection extends Model
{
    use HasFactory;

    protected $fillable = ['field_group_id', 'sectionable_id', 'sectionable_type', 'order'];

    protected $casts = ['order' => 'integer'];

    public function fieldGroup(): BelongsTo
    {
        return $this->belongsTo(FieldGroup::class);
    }

    public function sectionable(): MorphTo
    {
        return $this->morphTo();
    }

    public function values(): HasMany
    {
        return $this->hasMany(ContentSectionValue::class);
    }

    /**
     * Devuelve los valores de la sección como array estructurado.
     * Para campos normales: ['field_name' => value]
     * Para repeaters: ['field_name' => [['sub_field' => value, ...], ...]]
     */
    public function toStructuredData(): array
    {
        $this->load(['fieldGroup.allFieldDefinitions', 'values']);

        $fields = $this->fieldGroup->allFieldDefinitions;
        $values = $this->values->groupBy('field_definition_id');
        $result = [];

        // Campos raíz (no hijos de repeater)
        $rootFields = $fields->whereNull('parent_id');

        foreach ($rootFields as $field) {
            if ($field->isRepeater()) {
                $subFields = $fields->where('parent_id', $field->id);
                $rows = [];

                // Determinar cuántas filas hay mirando cualquier subfield
                $firstSub = $subFields->first();
                $rowCount = $firstSub
                    ? ($values->get($firstSub->id)?->max('row_index') ?? -1) + 1
                    : 0;

                for ($i = 0; $i < $rowCount; $i++) {
                    $row = [];
                    foreach ($subFields as $subField) {
                        $val = $values->get($subField->id)
                                ?->firstWhere('row_index', $i);
                        $row[$subField->name] = $val ? $this->castValue($val->value, $subField) : null;
                    }
                    $rows[] = $row;
                }

                $result[$field->name] = $rows;
            } else {
                $val = $values->get($field->id)?->first();
                $result[$field->name] = $val ? $this->castValue($val->value, $field) : null;
            }
        }

        return $result;
    }

    private function castValue(mixed $raw, FieldDefinition $field): mixed
    {
        return match ($field->type) {
            'number' => is_numeric($raw) ? (float) $raw : null,
            'checkbox' => json_decode($raw, true) ?? [],
            'image', 'file', 'select', 'relation' => json_decode($raw, true) ?? $raw,
            default => $raw,
        };
    }
}