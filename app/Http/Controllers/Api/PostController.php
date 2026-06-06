<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = Post::where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->paginate(10);
            
        return response()->json($posts);
    }

    public function show(string $slug): JsonResponse
    {
        $post = Post::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();
            
        return response()->json($post);
    }
}
