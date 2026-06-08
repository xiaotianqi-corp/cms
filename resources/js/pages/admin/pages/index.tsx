import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Plus, Eye, EyeOff } from 'lucide-react';
import Edit from './edit';
import { PageItem, PagesProps } from '@/types/page';
import PagesList from '../pages';
import { getTranslation, LANG_LABELS } from '@/types/helpers';

export default function Index({
    pages,
    locales,
    defaultLocale,
    availableGroups = [],
}: PagesProps) {
    const [editing, setEditing] = useState<PageItem | null | 'new'>(null);
    const { delete: destroy } = useForm({});

    const handleDelete = (id: number) => {
        if (!confirm('Move this page to trash?')) return;
        destroy(`/admin/pages/${id}`);
    };

    const columns = [
        {
            header: 'Title',
            accessor: (p: PageItem) => (
                <div>
                    <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                    >
                        {p[`title_${defaultLocale}`] ||
                            getTranslation(p.title, defaultLocale) ||
                            'Untitled'}
                    </button>
                    <div className="text-xs text-neutral-400 mt-0.5">/{p.slug}</div>
                </div>
            ),
        },
        {
            header: 'Author',
            accessor: () => <span className="text-sm text-neutral-500">Admin</span>,
        },
        {
            header: 'Status',
            accessor: (p: PageItem) => (
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                >
                    {p.status === 'published'
                        ? <Eye className="w-3 h-3" />
                        : <EyeOff className="w-3 h-3" />}
                    {p.status === 'published' ? 'Published' : 'Draft'}
                </span>
            ),
        },
        {
            header: 'Date',
            accessor: (p: PageItem) => (
                <span className="text-sm text-neutral-500">
                    {new Date(p.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: '',
            accessor: (p: PageItem) => (
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                        Trash
                    </button>
                </div>
            ),
        },
    ];

    if (editing !== null) {
        return (
            <Edit
                page={editing === 'new' ? null : editing}
                locales={locales}
                defaultLocale={defaultLocale}
                availableGroups={availableGroups}
                onClose={() => setEditing(null)}
            />
        );
    }

    return (
        <>
            <Head title="Pages" />
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {pages.length} page{pages.length !== 1 ? 's' : ''}
                            {locales.length > 1 && (
                                <span className="ml-2 text-neutral-400">
                                    · {locales.map(l => LANG_LABELS[l] ?? l).join(', ')}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => setEditing('new')}
                        className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add New Page
                    </button>
                </div>

                <DataTable
                    data={pages}
                    columns={columns}
                    searchKey={p =>
                        (p[`title_${defaultLocale}`] || getTranslation(p.title, defaultLocale)) +
                        ' ' +
                        p.slug
                    }
                    searchPlaceholder="Search pages…"
                />
            </div>
        </>
    );
}

PagesList.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Pages', href: '/admin/pages' }]}>{page}</AppLayout>
);