<?php

namespace App\Concerns;

use App\Models\ContentSection;
use App\Models\FieldGroup;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasDynamicFields
{
    public function contentSections(): MorphMany
    {
        return $this->morphMany(ContentSection::class, 'sectionable')->orderBy('order');
    }

    /**
     * Devuelve todas las secciones con sus datos estructurados.
     * [['group_slug' => '...', 'group_title' => '...', 'data' => [...]], ...]
     */
    public function getDynamicFieldsAttribute(): array
    {
        return $this->contentSections()
            ->with(['fieldGroup.allFieldDefinitions', 'values'])
            ->get()
            ->map(fn(ContentSection $section) => [
                'section_id' => $section->id,
                'group_slug' => $section->fieldGroup->slug,
                'group_title' => $section->fieldGroup->title,
                'order' => $section->order,
                'data' => $section->toStructuredData(),
            ])
            ->toArray();
    }

    /**
     * Devuelve los FieldGroups disponibles para este tipo de contenido.
     */
    public function availableFieldGroups()
    {
        $type = match (static::class) {
            \App\Models\Post::class => 'post',
            \App\Models\Page::class => 'page',
            \App\Models\Product::class => 'product',
            default => 'any',
        };

        return FieldGroup::active()->forContentType($type)->with('fieldDefinitions')->get();
    }
}