<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FieldDefinition;
use App\Models\FieldGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FieldGroupController extends Controller
{
    public function index(): Response
    {
        $groups = FieldGroup::withTrashed(false)
            ->with('fieldDefinitions')
            ->orderBy('content_type')
            ->orderBy('order')
            ->get()
            ->map(fn(FieldGroup $g) => [
                'id' => $g->id,
                'title' => $g->title,
                'slug' => $g->slug,
                'description' => $g->description,
                'content_type' => $g->content_type,
                'is_active' => $g->is_active,
                'order' => $g->order,
                'fields_count' => $g->fieldDefinitions->count(),
            ]);

        return Inertia::render('admin/field-groups/index', [
            'groups' => $groups,
            'contentTypes' => FieldGroup::CONTENT_TYPES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/field-groups/edit', [
            'group' => null,
            'fieldTypes' => FieldDefinition::TYPES,
            'contentTypes' => FieldGroup::CONTENT_TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => ['required', Rule::in(array_keys(FieldGroup::CONTENT_TYPES))],
            'is_active' => 'boolean',
            'order' => 'integer',
            'fields' => 'array',
            'fields.*.label' => 'required|string',
            'fields.*.name' => 'required|string|alpha_dash',
            'fields.*.type' => ['required', Rule::in(FieldDefinition::TYPES)],
            'fields.*.required' => 'boolean',
            'fields.*.order' => 'integer',
            'fields.*.options' => 'nullable|array',
            'fields.*.settings' => 'nullable|array',
            'fields.*.instructions' => 'nullable|string',
            'fields.*.sub_fields' => 'nullable|array',
            'fields.*.sub_fields.*.label' => 'required_with:fields.*.sub_fields|string',
            'fields.*.sub_fields.*.name' => 'required_with:fields.*.sub_fields|string|alpha_dash',
            'fields.*.sub_fields.*.type' => ['required_with:fields.*.sub_fields', Rule::in(FieldDefinition::TYPES)],
        ]);

        $group = FieldGroup::create([
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'description' => $data['description'] ?? null,
            'content_type' => $data['content_type'],
            'is_active' => $data['is_active'] ?? true,
            'order' => $data['order'] ?? 0,
        ]);

        $this->saveFieldDefinitions($group, $data['fields'] ?? []);

        return redirect()->route('admin.field-groups.index')
            ->with('success', 'Field group created.');
    }

    public function edit(FieldGroup $fieldGroup): Response
    {
        $fieldGroup->load(['fieldDefinitions.subFields']);

        return Inertia::render('admin/field-groups/edit', [
            'group' => [
                'id' => $fieldGroup->id,
                'title' => $fieldGroup->title,
                'slug' => $fieldGroup->slug,
                'description' => $fieldGroup->description,
                'content_type' => $fieldGroup->content_type,
                'is_active' => $fieldGroup->is_active,
                'order' => $fieldGroup->order,
                'fields' => $fieldGroup->fieldDefinitions->map(fn(FieldDefinition $f) => [
                    'id' => $f->id,
                    'label' => $f->label,
                    'name' => $f->name,
                    'type' => $f->type,
                    'required' => $f->required,
                    'order' => $f->order,
                    'options' => $f->options,
                    'settings' => $f->settings,
                    'instructions' => $f->instructions,
                    'default_value' => $f->default_value,
                    'sub_fields' => $f->subFields->map(fn(FieldDefinition $sf) => [
                        'id' => $sf->id,
                        'label' => $sf->label,
                        'name' => $sf->name,
                        'type' => $sf->type,
                        'required' => $sf->required,
                        'order' => $sf->order,
                        'options' => $sf->options,
                        'settings' => $sf->settings,
                    ])->values(),
                ])->values(),
            ],
            'fieldTypes' => FieldDefinition::TYPES,
            'contentTypes' => FieldGroup::CONTENT_TYPES,
        ]);
    }

    public function update(Request $request, FieldGroup $fieldGroup): RedirectResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => ['required', Rule::in(array_keys(FieldGroup::CONTENT_TYPES))],
            'is_active' => 'boolean',
            'order' => 'integer',
            'fields' => 'array',
            'fields.*.id' => 'nullable|integer',
            'fields.*.label' => 'required|string',
            'fields.*.name' => 'required|string|alpha_dash',
            'fields.*.type' => ['required', Rule::in(FieldDefinition::TYPES)],
            'fields.*.required' => 'boolean',
            'fields.*.order' => 'integer',
            'fields.*.options' => 'nullable|array',
            'fields.*.settings' => 'nullable|array',
            'fields.*.instructions' => 'nullable|string',
            'fields.*.sub_fields' => 'nullable|array',
            'fields.*.sub_fields.*.id' => 'nullable|integer',
            'fields.*.sub_fields.*.label' => 'required_with:fields.*.sub_fields|string',
            'fields.*.sub_fields.*.name' => 'required_with:fields.*.sub_fields|string|alpha_dash',
            'fields.*.sub_fields.*.type' => ['required_with:fields.*.sub_fields', Rule::in(FieldDefinition::TYPES)],
        ]);

        $fieldGroup->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'content_type' => $data['content_type'],
            'is_active' => $data['is_active'] ?? true,
            'order' => $data['order'] ?? 0,
        ]);

        // Eliminar campos que ya no vienen en el payload
        $incomingIds = collect($data['fields'] ?? [])
            ->pluck('id')->filter()->values()->toArray();

        $fieldGroup->allFieldDefinitions()
            ->whereNotIn('id', $incomingIds)
            ->delete();

        $this->saveFieldDefinitions($fieldGroup, $data['fields'] ?? []);

        return redirect()->route('admin.field-groups.index')
            ->with('success', 'Field group updated.');
    }

    public function destroy(FieldGroup $fieldGroup): RedirectResponse
    {
        $fieldGroup->delete();

        return redirect()->route('admin.field-groups.index')
            ->with('success', 'Field group deleted.');
    }

    private function saveFieldDefinitions(FieldGroup $group, array $fields): void
    {
        foreach ($fields as $order => $fieldData) {
            $field = FieldDefinition::updateOrCreate(
                ['id' => $fieldData['id'] ?? null],
                [
                    'field_group_id' => $group->id,
                    'label' => $fieldData['label'],
                    'name' => $fieldData['name'],
                    'type' => $fieldData['type'],
                    'required' => $fieldData['required'] ?? false,
                    'order' => $fieldData['order'] ?? $order,
                    'options' => $fieldData['options'] ?? null,
                    'settings' => $fieldData['settings'] ?? null,
                    'instructions' => $fieldData['instructions'] ?? null,
                    'default_value' => $fieldData['default_value'] ?? null,
                    'parent_id' => null,
                ]
            );

            // Sub-campos de repeaters
            if ($fieldData['type'] === 'repeater' && !empty($fieldData['sub_fields'])) {
                $incomingSubIds = collect($fieldData['sub_fields'])->pluck('id')->filter()->values()->toArray();
                $field->subFields()->whereNotIn('id', $incomingSubIds)->delete();

                foreach ($fieldData['sub_fields'] as $subOrder => $subData) {
                    FieldDefinition::updateOrCreate(
                        ['id' => $subData['id'] ?? null],
                        [
                            'field_group_id' => $group->id,
                            'parent_id' => $field->id,
                            'label' => $subData['label'],
                            'name' => $subData['name'],
                            'type' => $subData['type'],
                            'required' => $subData['required'] ?? false,
                            'order' => $subData['order'] ?? $subOrder,
                            'options' => $subData['options'] ?? null,
                            'settings' => $subData['settings'] ?? null,
                        ]
                    );
                }
            }
        }
    }
}