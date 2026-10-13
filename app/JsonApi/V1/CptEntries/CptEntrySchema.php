<?php

namespace App\JsonApi\V1\CptEntries;

use App\Models\CptEntry;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class CptEntrySchema extends Schema
{
    public static string $model = CptEntry::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('title'),
            Str::make('slug'),
            Str::make('status'),
            BelongsTo::make('cpts')->type('cpts'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [
            WhereIdIn::make($this),
        ];
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }
}
