import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import RichTextEditor from '@/components/RichTextEditor';
import LocaleSwitcher from '@/components/locale-switcher';

interface Category {
  id: number;
  name: Record<string, string> | string;
  slug: string;
}

interface Product {
  id: number;
  name: Record<string, string> | string;
  description: Record<string, string> | string;
  price: number;
  stock: number;
  slug: string;
  status: string;
  category_id: number | null;
  category?: Category;
  created_at: string;
}

interface ProductsProps {
  products: Product[];
  categories: Category[];
  locales: string[];
  defaultLocale: string;
}

type FormData = Record<string, string>;

export default function ProductsList({ products, categories, locales, defaultLocale }: ProductsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editorLocale, setEditorLocale] = useState(defaultLocale);

  const buildInitialData = (): FormData => {
    const d: FormData = { price: '', stock: '', status: 'draft', category_id: '' };
    locales.forEach(loc => { d[`name_${loc}`] = ''; d[`description_${loc}`] = ''; });
    return d;
  };

  const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm<FormData>(buildInitialData());

  const getTranslation = (field: any, lang: string): string => {
    if (!field) return '';
    if (typeof field === 'string') { try { return JSON.parse(field)[lang] ?? ''; } catch { return field; } }
    return field[lang] ?? field[defaultLocale] ?? '';
  };

  const openCreate = () => {
    setEditingProduct(null); reset(); setEditorLocale(defaultLocale); setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const updates: FormData = { price: String(p.price), stock: String(p.stock), status: p.status, category_id: p.category_id ? String(p.category_id) : '' };
    locales.forEach(loc => { updates[`name_${loc}`] = getTranslation(p.name, loc); updates[`description_${loc}`] = getTranslation(p.description, loc); });
    setData(updates); setEditorLocale(defaultLocale); setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingProduct
      ? put(`/admin/products/${editingProduct.id}`, { onSuccess: () => { setIsModalOpen(false); reset(); } })
      : post('/admin/products', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  const columns = [
    { header: 'Name', accessor: (p: Product) => getTranslation(p.name, defaultLocale) },
    { header: 'Category', accessor: (p: Product) => p.category ? getTranslation(p.category.name, defaultLocale) : 'None' },
    { header: 'Price', accessor: (p: Product) => `$${Number(p.price).toFixed(2)}` },
    { header: 'Stock', accessor: (p: Product) => p.stock },
    {
      header: 'Status', accessor: (p: Product) => (
        <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>{p.status}</span>
      )
    },
    {
      header: 'Actions', accessor: (p: Product) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(p)} className="text-sm text-blue-600 hover:underline">Edit</button>
          <button onClick={() => { if (confirm('Delete?')) destroy(`/admin/products/${p.id}`); }} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      )
    },
  ];

  return (
    <>
      <Head title="Products" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-neutral-500">Manage eCommerce products and inventories.</p>
          </div>
          <button onClick={openCreate} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
            Add Product
          </button>
        </div>

        <DataTable data={products} columns={columns} searchKey={(p) => getTranslation(p.name, defaultLocale) + ' ' + p.slug} searchPlaceholder="Search products..." />

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
                <LocaleSwitcher locales={locales} active={editorLocale} onChange={setEditorLocale} />
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Name ({editorLocale.toUpperCase()})</label>
                  <input type="text" value={data[`name_${editorLocale}`] ?? ''} onChange={e => setData(`name_${editorLocale}`, e.target.value)} className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800" required={editorLocale === defaultLocale} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Price ($)</label>
                    <input type="number" step="0.01" value={data.price} onChange={e => setData('price', e.target.value)} className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Stock</label>
                    <input type="number" value={data.stock} onChange={e => setData('stock', e.target.value)} className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Category</label>
                    <select value={data.category_id} onChange={e => setData('category_id', e.target.value)} className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800">
                      <option value="">None</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{getTranslation(c.name, defaultLocale)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Description ({editorLocale.toUpperCase()})</label>
                  <RichTextEditor value={data[`description_${editorLocale}`] ?? ''} onChange={val => setData(`description_${editorLocale}`, val)} placeholder="Product description..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Status</label>
                  <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800">Cancel</button>
                  <button type="submit" disabled={processing} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">{editingProduct ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

ProductsList.layout = (page: React.ReactNode) => (
  <AppLayout breadcrumbs={[{ title: 'Products', href: '/admin/products' }]}>{page}</AppLayout>
);