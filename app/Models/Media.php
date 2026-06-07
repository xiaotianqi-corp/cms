<?php

namespace App\Models;

use Spatie\MediaLibrary\MediaCollections\Models\Media as BaseMedia;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends BaseMedia
{
    public function folder(): BelongsTo
    {
        return $this->belongsTo(
            MediaFolder::class,
            'folder_id'
        );
    }
}