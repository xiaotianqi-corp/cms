<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FieldGroup;
use App\Models\Page;
use App\Services\DynamicFieldsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(private DynamicFieldsService $dynamicFields)
    {
    }

    public function index(): Response
    {
        $pages = Page::orderBy('created_at', 'desc')->get();

        return Inertia::render('admin/pages', ['pages' => $pages]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title_en' => 'required|string',
            'title_es' => 'nullable|string',
            'content_en' => 'required|string',
            'content_es' => 'nullable|string',
            'status' => 'required|string',
            'sections' => 'nullable|array',
        ]);

        $page = new Page();
        $page->title = ['en' => $request->title_en, 'es' => $request->title_es ?? $request->title_en];
        $page->content = ['en' => $request->content_en, 'es' => $request->content_es ?? $request->content_en];
        $page->status = $request->status;
        $page->user_id = auth()->id();
        $page->save();

        if ($request->filled('sections')) {
            $this->dynamicFields->saveSections($page, $request->sections);
        }

        return redirect()->back()->with('success', 'Page created successfully.');
    }

    public function edit(Page $page): Response
    {
        $page->load(['contentSections.fieldGroup.allFieldDefinitions', 'contentSections.values']);

        return Inertia::render('admin/pages-edit', [
            'page' => [
                'id' => $page->id,
                'title_en' => $page->getTranslation('title', 'en'),
                'title_es' => $page->getTranslation('title', 'es'),
                'content_en' => $page->getTranslation('content', 'en'),
                'content_es' => $page->getTranslation('content', 'es'),
                'status' => $page->status,
                'sections' => $page->dynamic_fields,
            ],
            'availableGroups' => FieldGroup::active()
                ->forContentType('page')
                ->with('fieldDefinitions.subFields')
                ->orderBy('order')
                ->get()
                ->map(fn(FieldGroup $g) => [
                    'id' => $g->id,
                    'title' => $g->title,
                    'slug' => $g->slug,
                    'fields' => $g->fieldDefinitions->map(fn($f) => [
                        'id' => $f->id,
                        'name' => $f->name,
                        'label' => $f->label,
                        'type' => $f->type,
                        'required' => $f->required,
                        'options' => $f->options,
                        'instructions' => $f->instructions,
                        'default_value' => $f->default_value,
                        'sub_fields' => $f->subFields->map(fn($sf) => [
                            'id' => $sf->id,
                            'name' => $sf->name,
                            'label' => $sf->label,
                            'type' => $sf->type,
                            'required' => $sf->required,
                            'options' => $sf->options,
                        ])->values(),
                    ])->values(),
                ]),
        ]);
    }

    public function update(Request $request, Page $page): RedirectResponse
    {
        $request->validate([
            'title_en' => 'required|string',
            'title_es' => 'nullable|string',
            'content_en' => 'required|string',
            'content_es' => 'nullable|string',
            'status' => 'required|string',
            'sections' => 'nullable|array',
        ]);

        $page->title = ['en' => $request->title_en, 'es' => $request->title_es ?? $request->title_en];
        $page->content = ['en' => $request->content_en, 'es' => $request->content_es ?? $request->content_en];
        $page->status = $request->status;
        $page->save();

        $this->dynamicFields->saveSections($page, $request->sections ?? []);

        return redirect()->back()->with('success', 'Page updated successfully.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $page->contentSections->each(fn($s) => $s->values()->delete());
        $page->contentSections()->delete();
        $page->delete();

        return redirect()->back()->with('success', 'Page deleted successfully.');
    }
}