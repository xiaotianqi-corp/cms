import React from 'react';
import { FieldDefinition } from '@/types/page';

const BASE_CLASS =
    'w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600';

interface FieldInputProps {
    field: FieldDefinition;
    value: any;
    onChange: (v: any) => void;
}

export default function FieldInput({ field, value, onChange }: FieldInputProps) {
    if (field.type === 'textarea' || field.type === 'wysiwyg') {
        return (
            <textarea
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                rows={4}
                placeholder={field.instructions ?? ''}
                className={BASE_CLASS + ' resize-y'}
            />
        );
    }

    if (field.type === 'select') {
        return (
            <select value={value ?? ''} onChange={e => onChange(e.target.value)} className={BASE_CLASS}>
                <option value="">— Select —</option>
                {(field.options ?? []).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        );
    }

    if (field.type === 'checkbox') {
        const arr: string[] = Array.isArray(value) ? value : [];
        return (
            <div className="flex flex-wrap gap-3">
                {(field.options ?? []).map(o => (
                    <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={arr.includes(o.value)}
                            onChange={e =>
                                onChange(e.target.checked ? [...arr, o.value] : arr.filter(x => x !== o.value))
                            }
                            className="rounded border-sidebar-border/70"
                        />
                        {o.label}
                    </label>
                ))}
            </div>
        );
    }

    if (field.type === 'radio') {
        return (
            <div className="flex flex-wrap gap-4">
                {(field.options ?? []).map(o => (
                    <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            name={`radio_${field.id}`}
                            value={o.value}
                            checked={value === o.value}
                            onChange={() => onChange(o.value)}
                        />
                        {o.label}
                    </label>
                ))}
            </div>
        );
    }

    if (field.type === 'color') {
        return (
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value ?? '#000000'}
                    onChange={e => onChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-sidebar-border/70"
                />
                <input
                    type="text"
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="#000000"
                    className={BASE_CLASS + ' max-w-[140px]'}
                />
            </div>
        );
    }

    if (field.type === 'number') return <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value)} className={BASE_CLASS} />;
    if (field.type === 'email') return <input type="email" value={value ?? ''} onChange={e => onChange(e.target.value)} className={BASE_CLASS} />;
    if (field.type === 'url') return <input type="url" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="https://" className={BASE_CLASS} />;
    if (field.type === 'date') return <input type="date" value={value ?? ''} onChange={e => onChange(e.target.value)} className={BASE_CLASS} />;

    // default: text
    return (
        <input
            type="text"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.instructions ?? field.default_value ?? ''}
            className={BASE_CLASS}
        />
    );
}