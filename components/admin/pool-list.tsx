'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, BarChart2 } from 'lucide-react';
import { upsertPool, deletePool } from '@/lib/actions/pool-actions';
import { PoolFormDialog } from './pool-form-dialog';
import Link from 'next/link';

export function PoolList({ pools }: { pools: any[] }) {
  const [editingPool, setEditingPool] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (data: any) => {
    await upsertPool(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pool?')) {
      await deletePool(id);
    }
  };

  const openCreateDialog = () => {
    setEditingPool(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (pool: any) => {
    setEditingPool(pool);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-taksu-forest">Villa Pools</h2>
          <p className="text-sm text-gray-500">Manage rental pools and yield formulas.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-taksu-jungle hover:bg-taksu-forest text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Pool
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Villa Type</th>
              <th className="px-4 py-3">Yield Formula</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pools.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No pools found. Create one to get started.
                </td>
              </tr>
            ) : (
              pools.map((pool) => (
                <tr key={pool.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{pool.name}</td>
                  <td className="px-4 py-3 text-gray-600">{pool.villa_type}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {pool.yield_formula?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      pool.active 
                        ? 'bg-green-50 text-green-700 ring-green-600/20' 
                        : 'bg-red-50 text-red-700 ring-red-600/10'
                    }`}>
                      {pool.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Link href={`/admin/pools/${pool.id}/reports`}>
                      <Button variant="outline" size="sm" className="h-8 px-2 border-taksu-bamboo text-taksu-forest">
                        <BarChart2 className="h-3.5 w-3.5 mr-1" />
                        Reports
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(pool)} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(pool.id)} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isDialogOpen && (
        <PoolFormDialog
          pool={editingPool}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
