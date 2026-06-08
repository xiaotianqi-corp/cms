import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, ChevronDown, ChevronUp, Globe, Eye, LayoutTemplate } from 'lucide-react';
import { ContentSection, FieldGroupDef, PageItem, SectionData } from '@/types/page';
import { LANG_LABELS } from '@/types/helpers';
import Section from './section';

// ─── PAGE EDITOR ─────────────────────────────────────────────────────────────

function buildInitial(locales: string[], page: PageItem | null) {
    const d: Record<string, any> = {
        status: page?.status ?? 'draft',
        sections: page?.sections ?? [],
    };
    locales.forEach(loc => {
        d[`title_${loc}`] = page ? (page[`title_${loc}`] ?? '') : '';
        d[`content_${loc}`] = page ? (page[`content_${loc}`] ?? '') : '';
    });
    return d;
}

interface EditProps {
    page: PageItem | null;
    locales: string[];
    defaultLocale: string;
    availableGroups: FieldGroupDef[];
    onClose: () => void;
}

export default function Edit({
    page,
    locales,
    defaultLocale,
    availableGroups,
    onClose,
}: EditProps) {
    const isEdit = !!page;

    const [activeLocale, setActiveLocale] = useState(defaultLocale);
    const [showAddSection, setShowAddSection] = useState(false);
    const [seoOpen, setSeoOpen] = useState(false);
    const [discussionOpen, setDiscussionOpen] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm(buildInitial(locales, page));

    // sections lives inside data so it's included in every submit automatically
    const sections: ContentSection[] = (data as any).sections ?? [];
    const setSections = (updater: ContentSection[] | ((prev: ContentSection[]) => ContentSection[])) => {
        setData('sections' as any, typeof updater === 'function' ? updater(sections) : updater);
    };

    // ── Submit ──────────────────────────────────────────────────────────────────
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isEdit) {
            put(`/admin/pages/${page!.id}`, { onSuccess: onClose });
        } else {
            post('/admin/pages', { onSuccess: onClose });
        }
    };

    // ── Section helpers ──────────────────────────────────────────────────────────
    const addSection = (group: FieldGroupDef) => {
        const emptyData: SectionData = {};
        group.fields.forEach(f => {
            emptyData[f.name] = f.type === 'repeater' ? [] : (f.default_value ?? '');
        });
        setSections(prev => [
            ...prev,
            {
                field_group_id: group.id,
                order: prev.length,
                group_title: group.title,
                group_slug: group.slug,
                data: emptyData,
            },
        ]);
        setShowAddSection(false);
    };

    const updateSection = (idx: number, d: SectionData) =>
        setSections(prev => prev.map((s, i) => (i === idx ? { ...s, data: d } : s)));

    const removeSection = (idx: number) =>
        setSections(prev => prev.filter((_, i) => i !== idx));

    const moveSection = (idx: number, dir: -1 | 1) =>
        setSections(prev => {
            const next = [...prev];
            const swap = idx + dir;
            if (swap < 0 || swap >= next.length) return prev;
            [next[idx], next[swap]] = [next[swap], next[idx]];
            return next.map((s, i) => ({ ...s, order: i }));
        });

    const groupById = (id: number) => availableGroups.find(g => g.id === id);

    const titleForLocale = (data as any)[`title_${activeLocale}`] ?? '';
    const contentForLocale = (data as any)[`content_${activeLocale}`] ?? '';

    return (
        <div className="fixed inset-0 z-50 flex bg-neutral-100 dark:bg-neutral-950 overflow-hidden">

            {/* ── Main area ─────────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-neutral-900 border-b border-sidebar-border/70 shadow-sm flex-shrink-0 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors flex-shrink-0"
                        >
                            ← Pages
                        </button>
                        <span className="text-neutral-300 dark:text-neutral-600 flex-shrink-0">/</span>
                        <span className="text-sm font-semibold truncate">
                            {isEdit ? (titleForLocale || 'Untitled') : 'Add New Page'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Locale switcher */}
                        {locales.length > 1 && (
                            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 gap-0.5">
                                {locales.map(loc => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => setActiveLocale(loc)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeLocale === loc
                                            ? 'bg-white dark:bg-neutral-700 shadow text-neutral-900 dark:text-white'
                                            : 'text-neutral-500 hover:text-neutral-700'
                                            }`}
                                    >
                                        <Globe className="w-3 h-3" />
                                        {LANG_LABELS[loc] ?? loc.toUpperCase()}
                                        {loc === defaultLocale && (
                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-1 rounded">
                                                default
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm rounded-lg border border-sidebar-border/70 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={processing}
                            className="px-4 py-1.5 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-60 font-medium"
                        >
                            {processing ? 'Saving…' : isEdit ? 'Update' : 'Publish'}
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

                        {/* Title field */}
                        <div>
                            <input
                                type="text"
                                value={titleForLocale}
                                onChange={e => setData(`title_${activeLocale}` as any, e.target.value)}
                                placeholder="Add title"
                                className={`w-full text-3xl font-bold bg-transparent border-0 border-b-2 pb-3 focus:outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-colors ${(errors as any)[`title_${activeLocale}`]
                                    ? 'border-red-400'
                                    : 'border-neutral-200 dark:border-neutral-700 focus:border-neutral-400'
                                    }`}
                            />
                            {(errors as any)[`title_${activeLocale}`] && (
                                <p className="text-red-500 text-xs mt-1">{(errors as any)[`title_${activeLocale}`]}</p>
                            )}
                            {isEdit && page?.slug && (
                                <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                                    Permalink:{' '}
                                    <a
                                        href={`/pages/${page.slug}`}
                                        target="_blank"
                                        className="text-blue-500 hover:underline"
                                    >
                                        /pages/{page.slug}
                                    </a>
                                </p>
                            )}
                        </div>

                        {/* Content editor */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                            {/* Fake toolbar */}
                            <div className="flex items-center gap-1 px-3 py-2 border-b border-sidebar-border/50 bg-neutral-50 dark:bg-neutral-800/60 flex-wrap">
                                {['B', 'I', 'U', '—', 'H1', 'H2', 'H3', '—', 'Link', 'Image', 'Quote', 'Code'].map(
                                    (btn, i) =>
                                        btn === '—' ? (
                                            <span key={i} className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
                                        ) : (
                                            <button
                                                key={btn}
                                                type="button"
                                                className={`px-2 py-1 text-xs rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-400 ${btn === 'B' ? 'font-bold' : btn === 'I' ? 'italic' : btn === 'U' ? 'underline' : ''
                                                    }`}
                                            >
                                                {btn}
                                            </button>
                                        ),
                                )}
                            </div>
                            <textarea
                                value={contentForLocale}
                                onChange={e => setData(`content_${activeLocale}` as any, e.target.value)}
                                rows={14}
                                placeholder="Start writing your page content here…"
                                className="w-full bg-transparent px-5 py-4 text-sm focus:outline-none resize-none leading-relaxed"
                            />
                        </div>
                        {(errors as any)[`content_${activeLocale}`] && (
                            <p className="text-red-500 text-xs -mt-4">{(errors as any)[`content_${activeLocale}`]}</p>
                        )}

                        {/* Dynamic sections */}
                        {sections.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4" /> Custom Sections
                                </h3>
                                {sections.map((sec, idx) => (
                                    <Section
                                        key={`${sec.field_group_id}-${idx}`}
                                        section={sec}
                                        groupDef={groupById(sec.field_group_id)}
                                        index={idx}
                                        onUpdate={d => updateSection(idx, d)}
                                        onRemove={() => removeSection(idx)}
                                        onMoveUp={() => moveSection(idx, -1)}
                                        onMoveDown={() => moveSection(idx, 1)}
                                        isFirst={idx === 0}
                                        isLast={idx === sections.length - 1}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Add section picker */}
                        {availableGroups.length > 0 && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSection(s => !s)}
                                    className="flex items-center gap-2 w-full justify-center py-3 rounded-xl border-2 border-dashed border-sidebar-border/60 hover:border-neutral-400 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Custom Section
                                </button>

                                {showAddSection && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-sidebar-border/70 rounded-xl shadow-xl z-20 overflow-hidden">
                                        <div className="p-3 border-b border-sidebar-border/50">
                                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                                Choose section type
                                            </p>
                                        </div>
                                        <div className="divide-y divide-sidebar-border/30 max-h-64 overflow-y-auto">
                                            {availableGroups.map(g => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => addSection(g)}
                                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                                >
                                                    <LayoutTemplate className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium">{g.title}</div>
                                                        <div className="text-xs text-neutral-400">
                                                            {g.fields.length} field{g.fields.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-2 border-t border-sidebar-border/50">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddSection(false)}
                                                className="w-full text-xs text-neutral-400 hover:text-neutral-600 py-1"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Right Sidebar ──────────────────────────────────────────────────── */}
            <div className="w-72 xl:w-80 flex-shrink-0 bg-white dark:bg-neutral-900 border-l border-sidebar-border/70 overflow-y-auto flex flex-col">

                {/* Publish box */}
                <div className="border-b border-sidebar-border/60">
                    <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Publish</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Status
                            </span>
                            <select
                                value={(data as any).status}
                                onChange={e => setData('status' as any, e.target.value)}
                                className="text-sm border border-sidebar-border/70 rounded-md px-2 py-1 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" /> Visibility
                            </span>
                            <span className="text-neutral-500 text-xs">Public</span>
                        </div>

                        {isEdit && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-600 dark:text-neutral-400">Slug</span>
                                <span className="text-neutral-400 text-xs truncate max-w-[130px]">{page?.slug ?? '—'}</span>
                            </div>
                        )}

                        <div className="pt-1 space-y-2">
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={processing}
                                className="w-full px-4 py-2 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-60 font-medium"
                            >
                                {processing ? 'Saving…' : isEdit ? 'Update Page' : 'Publish Page'}
                            </button>
                            {isEdit && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full px-4 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    ← Discard Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Page Attributes */}
                <div className="border-b border-sidebar-border/60">
                    <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Page Attributes</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Parent Page</label>
                            <select className="w-full border border-sidebar-border/70 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-sm focus:outline-none">
                                <option value="">(no parent)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Order</label>
                            <input
                                type="number"
                                defaultValue={0}
                                className="w-full border border-sidebar-border/70 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* SEO */}
                <div className="border-b border-sidebar-border/60">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setSeoOpen(s => !s)}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">SEO</h3>
                        {seoOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </button>
                    {seoOpen && (
                        <div className="p-4 space-y-3">
                            {([
                                ['Meta Title', 'text', 'SEO title…'],
                                ['Meta Description', 'textarea', 'Brief description…'],
                                ['Canonical URL', 'url', 'https://…'],
                            ] as const).map(([label, type, placeholder]) => (
                                <div key={label}>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
                                    {type === 'textarea' ? (
                                        <textarea
                                            rows={3}
                                            placeholder={placeholder}
                                            className="w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={type}
                                            placeholder={placeholder}
                                            className="w-full rounded-md border border-sidebar-border/70 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Discussion */}
                <div className="border-b border-sidebar-border/60">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setDiscussionOpen(s => !s)}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Discussion</h3>
                        {discussionOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </button>
                    {discussionOpen && (
                        <div className="p-4 space-y-2">
                            {['Allow comments', 'Allow trackbacks'].map(label => (
                                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" className="rounded border-sidebar-border/70" /> {label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sections summary */}
                {sections.length > 0 && (
                    <div className="border-b border-sidebar-border/60">
                        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                Sections ({sections.length})
                            </h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {sections.map((sec, idx) => {
                                const g = groupById(sec.field_group_id);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                        <LayoutTemplate className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                        <span className="text-neutral-700 dark:text-neutral-300 truncate">
                                            {g?.title ?? `Group #${sec.field_group_id}`}
                                        </span>
                                        <span className="ml-auto text-neutral-400">#{idx + 1}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}