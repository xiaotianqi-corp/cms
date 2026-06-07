<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class FieldGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['title', 'slug', 'description', 'content_type', 'is_active', 'order'];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public const CONTENT_TYPES = [
        'post' => 'Posts',
        'page' => 'Pages',
        'product' => 'Products',
        'any' => 'All content types',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (FieldGroup $group) {
            if (empty($group->slug)) {
                $group->slug = Str::slug($group->title);
            }
        });
    }

    public function fieldDefinitions(): HasMany
    {
        return $this->hasMany(FieldDefinition::class)->whereNull('parent_id')->orderBy('order');
    }

    public function allFieldDefinitions(): HasMany
    {
        return $this->hasMany(FieldDefinition::class)->orderBy('order');
    }

    public function contentSections(): HasMany
    {
        return $this->hasMany(ContentSection::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForContentType($query, string $type)
    {
        return $query->where(function ($q) use ($type) {
            $q->where('content_type', $type)->orWhere('content_type', 'any');
        });
    }
}