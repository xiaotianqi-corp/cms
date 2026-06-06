import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';

interface Product {
  name: { [key: string]: string } | string;
  price: number;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

interface User {
  name: string;
  email: string;
}

interface Order {
  id: number;
  user_id: number | null;
  status: string;
  total: number;
  currency: string;
  billing_name: string;
  billing_email: string;
  billing_address: string;
  created_at: string;
  user?: User;
  items?: OrderItem[];
}

interface OrdersProps {
  orders: Order[];
}

export default function OrdersList({ orders }: OrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, setData, put, processing } = useForm({
    status: '',
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

  const openDetails = (o: Order) => {
    setSelectedOrder(o);
    setData('status', o.status);
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    put(`/admin/orders/${selectedOrder.id}`, {
      onSuccess: () => {
        setSelectedOrder(null);
      }
    });
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: (o: Order) => `#${o.id}`,
    },
    {
      header: 'Customer',
      accessor: (o: Order) => o.billing_name,
    },
    {
      header: 'Total',
      accessor: (o: Order) => `$${Number(o.total).toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: (o: Order) => (
        <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${
          o.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          o.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {o.status}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (o: Order) => new Date(o.created_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (o: Order) => (
        <button onClick={() => openDetails(o)} className="text-sm text-blue-600 hover:underline">View Details</button>
      ),
    },
  ];

  return (
    <>
      <Head title="Manage Orders" />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-neutral-500">Track and manage customer eCommerce orders and billing info.</p>
        </div>

        <DataTable
          data={orders}
          columns={columns}
          searchKey={(o) => o.billing_name + ' ' + o.billing_email + ' ' + o.status}
          searchPlaceholder="Search orders..."
        />

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-xl dark:bg-neutral-900">
              <h2 className="text-lg font-bold mb-4">Order Details #{selectedOrder.id}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-neutral-500">Billing Information</h3>
                    <p className="mt-1">{selectedOrder.billing_name}</p>
                    <p className="text-neutral-500">{selectedOrder.billing_email}</p>
                    <p className="text-neutral-500 mt-2">{selectedOrder.billing_address}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-500">Order Summary</h3>
                    <p className="mt-1">Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    <p className="text-neutral-500">Total Price: ${Number(selectedOrder.total).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-500 text-sm mb-2">Order Items</h3>
                  <div className="border border-sidebar-border/70 rounded-lg overflow-hidden divide-y divide-sidebar-border/70 text-sm">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between p-3 bg-white/20 dark:bg-black/20">
                        <span>{item.product ? getTranslation(item.product.name, 'en') : 'Product Deleted'} (x{item.quantity})</span>
                        <span className="font-medium">${Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-4 pt-4 border-t border-sidebar-border/70">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Update Status</label>
                    <select
                      value={data.status}
                      onChange={(e) => setData('status', e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border/70 p-2 text-sm focus:outline-none dark:bg-neutral-800"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      Save Status
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

OrdersList.layout = (page: React.ReactNode) => (
  <AppLayout breadcrumbs={[{ title: 'Orders', href: '/admin/orders' }]}>{page}</AppLayout>
);
