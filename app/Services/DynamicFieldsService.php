<?php

namespace App\Services;

use App\Models\ContentSection;
use App\Models\ContentSectionValue;
use App\Models\FieldDefinition;
use App\Models\FieldGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class DynamicFieldsService
{
    /**
     * Guarda todas las secciones de un modelo.
     *
     * $sections = [
     *   ['field_group_id' => 1, 'order' => 0, 'data' => ['titulo' => 'Hola', 'items' => [['texto' => '...']]]],
     *   ...
     * ]
     */
    public function saveSections(Model $model, array $sections): void
    {
        DB::transaction(function () use ($model, $sections) {
            // IDs que llegan (para detectar eliminadas)
            $incomingIds = collect($sections)->pluck('section_id')->filter()->values();

            // Eliminar secciones removidas
            $model->contentSections()
                ->whereNotIn('id', $incomingIds)
                ->each(function (ContentSection $section) {
                    $section->values()->delete();
                    $section->delete();
                });

            foreach ($sections as $index => $sectionInput) {
                $group = FieldGroup::findOrFail($sectionInput['field_group_id']);

                // Crear o actualizar la sección
                $section = $model->contentSections()->updateOrCreate(
                    ['id' => $sectionInput['section_id'] ?? null],
                    [
                        'field_group_id' => $group->id,
                        'order' => $sectionInput['order'] ?? $index,
                    ]
                );

                $this->saveValues($section, $group, $sectionInput['data'] ?? []);
            }
        });
    }

    private function saveValues(ContentSection $section, FieldGroup $group, array $data): void
    {
        // Cargar todos los campos del grupo (incluyendo sub-campos de repeaters)
        $allFields = $group->allFieldDefinitions()->get()->keyBy('name');

        // Limpiar valores existentes
        $section->values()->delete();

        foreach ($group->fieldDefinitions()->get() as $field) {
            $value = $data[$field->name] ?? null;

            if ($field->isRepeater()) {
                // $value debe ser array de rows: [['sub_campo' => val], ...]
                $rows = is_array($value) ? $value : [];
                $subFields = $field->subFields()->get();

                foreach ($rows as $rowIndex => $row) {
                    foreach ($subFields as $subField) {
                        $subValue = $row[$subField->name] ?? null;
                        $this->insertValue($section, $subField, $rowIndex, $subValue);
                    }
                }
            } else {
                $this->insertValue($section, $field, 0, $value);
            }
        }
    }

    private function insertValue(ContentSection $section, FieldDefinition $field, int $rowIndex, mixed $value): void
    {
        ContentSectionValue::create([
            'content_section_id' => $section->id,
            'field_definition_id' => $field->id,
            'row_index' => $rowIndex,
            'value' => is_array($value) ? json_encode($value) : $value,
        ]);
    }
}