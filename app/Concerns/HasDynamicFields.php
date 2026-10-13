<?php

namespace App\Concerns;

use App\Models\ContentSection;
use App\Models\Cpt;
use App\Models\Page;
use App\Models\Post;
use App\Models\Product;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasDynamicFields
{
    public function contentSections(): MorphMany
    {
        return $this->morphMany(ContentSection::class, 'sectionable')->orderBy('order');
    }

    public function getDynamicFieldsAttribute(): array
    {
        return $this->contentSections()
            ->with(['cpt.allCptDefinitions', 'values'])
            ->get()
            ->map(fn (ContentSection $section) => [
                'section_id' => $section->id,
                'cpt_id' => $section->cpt_id,
                'group_slug' => $section->cpt->slug,
                'group_title' => $section->cpt->title,
                'order' => $section->order,
                'data' => $section->toStructuredData(),
            ])
            ->toArray();
    }

    public function availableCpts()
    {
        $type = match (static::class) {
            Post::class => 'post',
            Page::class => 'page',
            Product::class => 'product',
            default => 'any',
        };

        return Cpt::active()->forContentType($type)->with('cptDefinitions')->get();
    }
}
