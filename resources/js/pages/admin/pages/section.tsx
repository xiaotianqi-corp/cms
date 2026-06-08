import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, LayoutTemplate } from 'lucide-react';
import { ContentSection, FieldDefinition, FieldGroupDef, SectionData } from '@/types/page';
import Repeater from './repeater';
import FieldInput from './field-input';

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

interface SectionProps {
    section: ContentSection;
    groupDef: FieldGroupDef | undefined;
    index: number;
    onUpdate: (data: SectionData) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}

export default function Section({
    section,
    groupDef,
    index,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: SectionProps) {
    const [collapsed, setCollapsed] = useState(false);

    const updateField = (name: string, value: any) =>
        onUpdate({ ...section.data, [name]: value });

    const updateRepeaterRow = (fieldName: string, rowIndex: number, subKey: string, value: any) => {
        const rows = Array.isArray(section.data[fieldName]) ? [...section.data[fieldName]] : [];
        rows[rowIndex] = { ...rows[rowIndex], [subKey]: value };
        onUpdate({ ...section.data, [fieldName]: rows });
    };

    const addRepeaterRow = (fieldName: string, subFields: FieldDefinition[]) => {
        const rows = Array.isArray(section.data[fieldName]) ? [...section.data[fieldName]] : [];
        const emptyRow: SectionData = {};
        subFields.forEach(sf => { emptyRow[sf.name] = sf.default_value ?? ''; });
        onUpdate({ ...section.data, [fieldName]: [...rows, emptyRow] });
    };

    const removeRepeaterRow = (fieldName: string, rowIndex: number) =>
        onUpdate({
            ...section.data,
            [fieldName]: (section.data[fieldName] ?? []).filter((_: any, i: number) => i !== rowIndex),
        });

    if (!groupDef) {
        return (
            <div className="rounded-xl border border-dashed border-red-300 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600">
                Field group not found (id: {section.field_group_id})
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-b border-sidebar-border/50">
                <GripVertical className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <LayoutTemplate className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <span className="font-medium text-sm flex-1">{groupDef.title}</span>

                <div className="flex items-center gap-1">
                    {!isFirst && (
                        <button
                            type="button"
                            onClick={onMoveUp}
                            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors"
                        >
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    )}
                    {!isLast && (
                        <button
                            type="button"
                            onClick={onMoveDown}
                            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setCollapsed(c => !c)}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors ml-1"
                    >
                        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors ml-1"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!collapsed && (
                <div className="p-4 space-y-4">
                    {groupDef.fields.map(field => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.instructions && (
                                <p className="text-xs text-neutral-500 mb-1.5">{field.instructions}</p>
                            )}

                            {field.type === 'repeater' ? (
                                <div className="space-y-2">
                                    {(section.data[field.name] ?? []).map((row: SectionData, rIdx: number) => (
                                        <Repeater
                                            key={rIdx}
                                            subFields={field.sub_fields ?? []}
                                            row={row}
                                            rowIndex={rIdx}
                                            onChange={(sk, v) => updateRepeaterRow(field.name, rIdx, sk, v)}
                                            onRemove={() => removeRepeaterRow(field.name, rIdx)}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addRepeaterRow(field.name, field.sub_fields ?? [])}
                                        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 border border-dashed border-sidebar-border/70 rounded-lg px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 w-full justify-center transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Row
                                    </button>
                                </div>
                            ) : (
                                <FieldInput
                                    field={field}
                                    value={section.data[field.name]}
                                    onChange={v => updateField(field.name, v)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}