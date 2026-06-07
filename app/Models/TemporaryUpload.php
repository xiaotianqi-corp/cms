<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Spatie\MediaLibrary\HasMedia;

use Spatie\MediaLibrary\InteractsWithMedia;

class TemporaryUpload extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $guarded = [];

    public function registerMediaConversions(
        ?\Spatie\MediaLibrary\MediaCollections\Models\Media $media = null
    ): void {

        $this
            ->addMediaConversion('thumb')
            ->width(300)
            ->height(300)
            ->sharpen(10)
            ->nonQueued();

        $this
            ->addMediaConversion('large')
            ->width(1600)
            ->nonQueued();

        $this
            ->addMediaConversion('webp')
            ->format('webp')
            ->nonQueued();
    }
}