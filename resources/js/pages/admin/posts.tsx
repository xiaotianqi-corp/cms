import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import RichTextEditor from '@/components/RichTextEditor';

interface Post {
  id: number;
  title: { [key: string]: string } | string;
  content: { [key: string]: string } | string;
  slug: string;
  status: string;
  created_at: string;
}

interface PostsProps {
  posts: Post[];
}

export default function Posts({ posts }: PostsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
    title_en: '',
    title_es: '',
    content_en: '',
    content_es: '',
    status: 'draft',
  });

  const getTranslation = (field: any, lang: string): string => {
    if (!field) return '';
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return parsed[lang] || parsed['en'] || '';
      } catch {
        return field;
      }
    }
    return field[lang] || field['en'] || '';
  };

  const openCreateModal = () => {
    setEditingPost(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (p: Post) => {
    setEditingPost(p);
    setData({
      title_en: getTranslation(p.title, 'en'),
      title_es: getTranslation(p.title, 'es'),
      content_en: getTranslation(p.content, 'en'),
      content_es: getTranslation(p.content, 'es'),
      status: p.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      put(`/admin/posts/${editingPost.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    } else {
      post('/admin/posts', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      destroy(`/admin/posts/${id}`);
    }
  };

  const columns = [
    {
      header: 'Title (EN)',
      accessor: (p: Post) => getTranslation(p.title, 'en'),
    },
    {
      header: 'Slug',
      accessor: (p: Post) => p.slug,
    },
    {
      header: 'Status',
      accessor: (p: Post) => (
        <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${p.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {p.status}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessor: (p: Post) => new Date(p.created_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (p: Post) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(p)} className="text-sm text-blue-600 hover:underline">Edit</button>
          <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Manage Posts" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
            <p className="text-sm text-neutral-500">Manage your CMS blog posts and content translations.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Add New Post
          </button>
        </div>

        <DataTable
          data={posts}
          columns={columns}
          searchKey={(p) => getTranslation(p.title, 'en') + ' ' + p.slug}
          searchPlaceholder="Search posts..."
        />

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={data.title_en}
                      onChange={(e) => setData('title_en', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                      required
                    />
                    {errors.title_en && <span className="text-xs text-red-600">{errors.title_en}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Title (ES)</label>
                    <input
                      type="text"
                      value={data.title_es}
                      onChange={(e) => setData('title_es', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Content (EN)</label>
                  <RichTextEditor value={data.content_en} onChange={(val) => setData('content_en', val)} placeholder="Write content in English..." />
                  {errors.content_en && <span className="text-xs text-red-600">{errors.content_en}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Content (ES)</label>
                  <RichTextEditor value={data.content_es} onChange={(val) => setData('content_es', val)} placeholder="Escribe contenido en Español..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Status</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {editingPost ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

Posts.layout = (page: React.ReactNode) => (
  <AppLayout breadcrumbs={[{ title: 'Posts', href: '/admin/posts' }]}>{page}</AppLayout>
);
