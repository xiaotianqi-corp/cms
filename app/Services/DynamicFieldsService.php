<?php

namespace App\Services;

use App\Models\ContentSection;
use App\Models\ContentSectionValue;
use App\Models\Cpt;
use App\Models\CptDefinition;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class DynamicFieldsService
{
    public function saveSections(Model $model, array $sections): void
    {
        DB::transaction(function () use ($model, $sections) {

            $incomingIds = collect($sections)
                ->pluck('section_id')
                ->filter()
                ->values();

            $model->contentSections()
                ->whereNotIn('id', $incomingIds)
                ->get()
                ->each(function (ContentSection $section) {
                    $section->values()->delete();
                    $section->delete();
                });

            foreach ($sections as $index => $sectionInput) {

                $data = $sectionInput['data'] ?? [];
                $cptEntryId = $data['cpt_entry_id'] ?? null;

                $group = Cpt::findOrFail($sectionInput['cpt_id']);

                $section = $model->contentSections()->updateOrCreate(
                    [
                        'id' => $sectionInput['section_id'] ?? null,
                    ],
                    [
                        'cpt_id' => $group->id,
                        'cpt_entry_id' => $cptEntryId,
                        'order' => $sectionInput['order'] ?? $index,
                    ]
                );

                // if ($cptEntryId) {
                //     $section->values()->delete();
                //     continue;
                // }

                $this->saveValues(
                    $section,
                    $group,
                    $data
                );
            }
        });
    }

    private function saveValues(
        ContentSection $section,
        Cpt $group,
        array $data
    ): void {

        $section->values()->delete();

        foreach ($group->cptDefinitions()->with('subCpts')->get() as $field) {

            $value = $data[$field->name] ?? null;

            if ($field->isRepeater()) {

                $rows = is_array($value)
                    ? $value
                    : [];

                foreach ($rows as $rowIndex => $row) {

                    foreach ($field->subCpts as $subField) {

                        $this->insertValue(
                            $section,
                            $subField,
                            $rowIndex,
                            $row[$subField->name] ?? null
                        );
                    }
                }

                continue;
            }

            $this->insertValue(
                $section,
                $field,
                0,
                $value
            );
        }
    }

    private function insertValue(
        ContentSection $section,
        CptDefinition $field,
        int $rowIndex,
        mixed $value
    ): void {

        ContentSectionValue::create([
            'content_section_id' => $section->id,
            'cpt_definition_id' => $field->id,
            'row_index' => $rowIndex,
            'value' => is_array($value)
                ? json_encode($value)
                : $value,
        ]);
    }
}
