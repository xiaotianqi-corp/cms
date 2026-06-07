<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FieldGroup;
use App\Models\Page;
use App\Models\Setting;
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

    private function getLocales(): array
    {
        return json_decode(Setting::get('locales', '["en","es"]'), true) ?? ['en'];
    }

    private function getDefaultLocale(): string
    {
        return Setting::get('default_locale', 'en');
    }

    public function index(): Response
    {
        return Inertia::render('admin/pages', [
            'pages' => Page::orderBy('created_at', 'desc')->get(),
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = ['status' => 'required|string', 'sections' => 'nullable|array'];
        foreach ($locales as $locale) {
            $rules["title_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
            $rules["content_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
        }
        $request->validate($rules);

        $title = [];
        $content = [];
        foreach ($locales as $locale) {
            $title[$locale] = $request->input("title_{$locale}", $request->input("title_{$defaultLocale}", ''));
            $content[$locale] = $request->input("content_{$locale}", $request->input("content_{$defaultLocale}", ''));
        }

        $page = new Page();
        $page->title = $title;
        $page->content = $content;
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
        $locales = $this->getLocales();
        $page->load(['contentSections.fieldGroup.allFieldDefinitions', 'contentSections.values']);

        $pageData = [
            'id' => $page->id,
            'status' => $page->status,
            'sections' => $page->dynamic_fields,
        ];
        foreach ($locales as $locale) {
            $pageData["title_{$locale}"] = $page->getTranslation('title', $locale);
            $pageData["content_{$locale}"] = $page->getTranslation('content', $locale);
        }

        return Inertia::render('admin/pages-edit', [
            'page' => $pageData,
            'locales' => $locales,
            'defaultLocale' => $this->getDefaultLocale(),
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
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = ['status' => 'required|string', 'sections' => 'nullable|array'];
        foreach ($locales as $locale) {
            $rules["title_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
            $rules["content_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
        }
        $request->validate($rules);

        $title = [];
        $content = [];
        foreach ($locales as $locale) {
            $title[$locale] = $request->input("title_{$locale}", $page->getTranslation('title', $locale));
            $content[$locale] = $request->input("content_{$locale}", $page->getTranslation('content', $locale));
        }

        $page->title = $title;
        $page->content = $content;
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