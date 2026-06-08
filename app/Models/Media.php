<?php

namespace App\Models;

use Spatie\MediaLibrary\MediaCollections\Models\Media as BaseMedia;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends BaseMedia
{
    protected $casts = [
        'custom_properties' => 'array',
    ];

    public function getAltAttribute(): ?string
    {
        return $this->getCustomProperty('alt');
    }

    public function getCaptionAttribute(): ?string
    {
        return $this->getCustomProperty('caption');
    }

    public function getTitleAttribute(): ?string
    {
        return $this->getCustomProperty('title');
    }

    public function registerMediaConversions(?Media $media = null): void
    {

        $crop = $media?->getCustomProperty('crop');

        if ($crop) {

            $this
                ->addMediaConversion('thumb')
                ->manualCrop(
                    (int) $crop['width'],
                    (int) $crop['height'],
                    (int) $crop['x'],
                    (int) $crop['y']
                )
                ->queued();
        }

        $this
            ->addMediaConversion('large')
            ->width(1600)
            ->queued();

        $this
            ->addMediaConversion('webp')
            ->format('webp')
            ->queued();
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(
            MediaFolder::class,
            'folder_id'
        );
    }
}