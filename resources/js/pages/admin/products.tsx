import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import RichTextEditor from '@/components/RichTextEditor';

interface Category {
  id: number;
  name: { [key: string]: string } | string;
  slug: string;
}

interface Product {
  id: number;
  name: { [key: string]: string } | string;
  description: { [key: string]: string } | string;
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
}

export default function ProductsList({ products, categories }: ProductsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
    name_en: '',
    name_es: '',
    description_en: '',
    description_es: '',
    price: '',
    stock: '',
    status: 'draft',
    category_id: '',
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
    setEditingProduct(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setData({
      name_en: getTranslation(p.name, 'en'),
      name_es: getTranslation(p.name, 'es'),
      description_en: getTranslation(p.description, 'en'),
      description_es: getTranslation(p.description, 'es'),
      price: String(p.price),
      stock: String(p.stock),
      status: p.status,
      category_id: p.category_id ? String(p.category_id) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...data,
      price: parseFloat(data.price),
      stock: parseInt(data.stock, 10),
      category_id: data.category_id ? parseInt(data.category_id, 10) : null
    };

    if (editingProduct) {
      put(`/admin/products/${editingProduct.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    } else {
      post('/admin/products', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      destroy(`/admin/products/${id}`);
    }
  };

  const columns = [
    {
      header: 'Name (EN)',
      accessor: (p: Product) => getTranslation(p.name, 'en'),
    },
    {
      header: 'Category',
      accessor: (p: Product) => p.category ? getTranslation(p.category.name, 'en') : 'None',
    },
    {
      header: 'Price',
      accessor: (p: Product) => `$${Number(p.price).toFixed(2)}`,
    },
    {
      header: 'Stock',
      accessor: (p: Product) => p.stock,
    },
    {
      header: 'Status',
      accessor: (p: Product) => (
        <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {p.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (p: Product) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(p)} className="text-sm text-blue-600 hover:underline">Edit</button>
          <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Manage Products" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-neutral-500">Manage eCommerce products, inventories, and categories.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Add New Product
          </button>
        </div>

        <DataTable
          data={products}
          columns={columns}
          searchKey={(p) => getTranslation(p.name, 'en') + ' ' + p.slug}
          searchPlaceholder="Search products..."
        />

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">{editingProduct ? 'Edit Product' : 'Create New Product'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Name (EN)</label>
                    <input
                      type="text"
                      value={data.name_en}
                      onChange={(e) => setData('name_en', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Name (ES)</label>
                    <input
                      type="text"
                      value={data.name_es}
                      onChange={(e) => setData('name_es', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={data.price}
                      onChange={(e) => setData('price', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Stock</label>
                    <input
                      type="number"
                      value={data.stock}
                      onChange={(e) => setData('stock', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Category</label>
                    <select
                      value={data.category_id}
                      onChange={(e) => setData('category_id', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                    >
                      <option value="">None</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{getTranslation(c.name, 'en')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Description (EN)</label>
                  <RichTextEditor value={data.description_en} onChange={(val) => setData('description_en', val)} placeholder="Product description in English..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Description (ES)</label>
                  <RichTextEditor value={data.description_es} onChange={(val) => setData('description_es', val)} placeholder="Descripción del producto en Español..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Status</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
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
                    {editingProduct ? 'Update' : 'Create'}
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

ProductsList.layout = (page: React.ReactNode) => (
  <AppLayout breadcrumbs={[{ title: 'Products', href: '/admin/products' }]}>{page}</AppLayout>
);
