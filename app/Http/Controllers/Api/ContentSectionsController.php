<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FieldGroup;
use App\Models\Page;
use App\Models\Post;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ContentSectionsController extends Controller
{
    /**
     * GET /api/posts/{slug}/sections
     */
    public function postSections(string $slug): JsonResponse
    {
        $post = Post::where('slug', $slug)->where('status', 'published')->firstOrFail();

        return response()->json([
            'id' => $post->id,
            'slug' => $post->slug,
            'sections' => $post->dynamic_fields,
        ]);
    }

    /**
     * GET /api/pages/{slug}/sections
     */
    public function pageSections(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('status', 'published')->firstOrFail();

        return response()->json([
            'id' => $page->id,
            'slug' => $page->slug,
            'sections' => $page->dynamic_fields,
        ]);
    }

    /**
     * GET /api/products/{slug}/sections
     */
    public function productSections(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->where('status', 'active')->firstOrFail();

        return response()->json([
            'id' => $product->id,
            'slug' => $product->slug,
            'sections' => $product->dynamic_fields,
        ]);
    }

    /**
     * GET /api/field-groups  — lista grupos activos (útil para el frontend headless)
     */
    public function fieldGroups(): JsonResponse
    {
        $groups = FieldGroup::active()
            ->with('fieldDefinitions.subFields')
            ->orderBy('order')
            ->get()
            ->map(fn(FieldGroup $g) => [
                'id' => $g->id,
                'title' => $g->title,
                'slug' => $g->slug,
                'content_type' => $g->content_type,
                'fields' => $g->fieldDefinitions->map(fn($f) => [
                    'name' => $f->name,
                    'label' => $f->label,
                    'type' => $f->type,
                    'required' => $f->required,
                    'options' => $f->options,
                    'instructions' => $f->instructions,
                    'sub_fields' => $f->subFields->map(fn($sf) => [
                        'name' => $sf->name,
                        'label' => $sf->label,
                        'type' => $sf->type,
                        'options' => $sf->options,
                    ])->values(),
                ])->values(),
            ]);

        return response()->json($groups);
    }
}