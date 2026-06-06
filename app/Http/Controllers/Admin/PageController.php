<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function index()
    {
        $pages = Page::orderBy('created_at', 'desc')->get();
        return Inertia::render('admin/pages', [
            'pages' => $pages
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

        $page = new Page();
        $page->title = [
            'en' => $request->title_en,
            'es' => $request->title_es ?? $request->title_en
        ];
        $page->content = [
            'en' => $request->content_en,
            'es' => $request->content_es ?? $request->content_en
        ];
        $page->status = $request->status;
        $page->user_id = auth()->id();
        $page->save();

        return redirect()->back()->with('success', 'Page created successfully.');
    }

    public function update(Request $request, Page $page)
    {
        $request->validate([
            'title_en' => 'required|string',
            'title_es' => 'nullable|string',
            'content_en' => 'required|string',
            'content_es' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $page->title = [
            'en' => $request->title_en,
            'es' => $request->title_es ?? $request->title_en
        ];
        $page->content = [
            'en' => $request->content_en,
            'es' => $request->content_es ?? $request->content_en
        ];
        $page->status = $request->status;
        $page->save();

        return redirect()->back()->with('success', 'Page updated successfully.');
    }

    public function destroy(Page $page)
    {
        $page->delete();
        return redirect()->back()->with('success', 'Page deleted successfully.');
    }
}
