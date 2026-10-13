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

    protected $fillable = [
        'cpt_id',
        'cpt_entry_id',
        'sectionable_id',
        'sectionable_type',
        'order',
    ];

    protected $casts = ['order' => 'integer'];

    public function cpt(): BelongsTo
    {
        return $this->belongsTo(Cpt::class);
    }

    public function sectionable(): MorphTo
    {
        return $this->morphTo();
    }

    public function values(): HasMany
    {
        return $this->hasMany(ContentSectionValue::class);
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(CptEntry::class, 'cpt_entry_id');
    }

    public function toStructuredData(): array
    {
        return $this->toStructuredDataWithoutReference();
    }

    private function toStructuredDataWithoutReference(): array
    {
        $this->loadMissing([
            'cpt.allCptDefinitions',
            'values',
        ]);

        $fields = $this->cpt->allCptDefinitions;
        $values = $this->values->groupBy('cpt_definition_id');

        $result = [
            'cpt_entry_id' => $this->cpt_entry_id,
        ];

        foreach ($fields->whereNull('parent_id') as $field) {

            if ($field->isRepeater()) {

                $rows = [];
                $subs = $fields->where('parent_id', $field->id);

                $first = $subs->first();

                $count = $first
                    ? ($values->get($first->id)?->max('row_index') ?? -1) + 1
                    : 0;

                for ($i = 0; $i < $count; $i++) {

                    $row = [];

                    foreach ($subs as $sub) {

                        $val = $values
                            ->get($sub->id)
                            ?->firstWhere('row_index', $i);

                        $row[$sub->name] = $val
                            ? $this->castValue($val->value, $sub)
                            : null;
                    }

                    $rows[] = $row;
                }

                $result[$field->name] = $rows;

            } else {

                $val = $values->get($field->id)?->first();

                $result[$field->name] = $val
                    ? $this->castValue($val->value, $field)
                    : null;
            }
        }

        return $result;
    }

    private function castValue(mixed $raw, CptDefinition $field): mixed
    {
        return match ($field->type) {
            'number' => is_numeric($raw) ? (float) $raw : null,
            'checkbox' => json_decode($raw, true) ?? [],
            'image', 'file', 'select', 'relation' => json_decode($raw, true) ?? $raw,
            default => $raw,
        };
    }
}
