<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::orderBy('created_at', 'desc')->get();
        return Inertia::render('admin/posts', [
            'posts' => $posts
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title_en' => 'required|string',
            'title_es' => 'nullable|string',
            'content_en' => 'required|string',
            'content_es' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $post = new Post();
        $post->title = [
            'en' => $request->title_en,
            'es' => $request->title_es ?? $request->title_en
        ];
        $post->content = [
            'en' => $request->content_en,
            'es' => $request->content_es ?? $request->content_en
        ];
        $post->status = $request->status;
        $post->user_id = auth()->id();
        if ($request->status === 'published') {
            $post->published_at = now();
        }
        $post->save();

        return redirect()->back()->with('success', 'Post created successfully.');
    }

    public function update(Request $request, Post $post)
    {
        $request->validate([
            'title_en' => 'required|string',
            'title_es' => 'nullable|string',
            'content_en' => 'required|string',
            'content_es' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $post->title = [
            'en' => $request->title_en,
            'es' => $request->title_es ?? $request->title_en
        ];
        $post->content = [
            'en' => $request->content_en,
            'es' => $request->content_es ?? $request->content_en
        ];
        $post->status = $request->status;
        if ($request->status === 'published' && !$post->published_at) {
            $post->published_at = now();
        }
        $post->save();

        return redirect()->back()->with('success', 'Post updated successfully.');
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return redirect()->back()->with('success', 'Post deleted successfully.');
    }
}
