<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    public function index(): JsonResponse
    {
        $locale = app()->getLocale();

        $posts = Post::where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->paginate(10)
            ->through(fn($post) => $this->formatPost($post, $locale));

        return response()->json($posts);
    }

    public function show(string $slug): JsonResponse
    {
        $locale = app()->getLocale();

        $post = Post::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json($this->formatPost($post, $locale));
    }

    public function page(string $slug): JsonResponse
    {
        $locale = app()->getLocale();

        $page = Page::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json([
            'id' => $page->id,
            'title' => $page->getTranslation('title', $locale),
            'content' => $page->getTranslation('content', $locale),
            'slug' => $page->slug,
            'status' => $page->status,
            'locale' => $locale,
            'created_at' => $page->created_at,
            'updated_at' => $page->updated_at,
        ]);
    }

    private function formatPost(Post $post, string $locale): array
    {
        return [
            'id' => $post->id,
            'title' => $post->getTranslation('title', $locale),
            'content' => $post->getTranslation('content', $locale),
            'slug' => $post->slug,
            'status' => $post->status,
            'locale' => $locale,
            'published_at' => $post->published_at,
            'created_at' => $post->created_at,
            'updated_at' => $post->updated_at,
        ];
    }
}