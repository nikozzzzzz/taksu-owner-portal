'use client';

import { useState } from 'react';
import { ShieldAlert, ShieldCheck, MoreVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { updateUserRole, updateUserStatus } from '@/lib/actions/admin-actions';
import { UserEditDialog } from './user-edit-dialog';

interface UserListProps {
  initialUsers: any[];
  currentRole: string;
}

export function UserList({ initialUsers, currentRole }: UserListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const isAdmin = currentRole === 'admin';

  const handleSave = async (userId: string, role: string, status: string) => {
    try {
      await updateUserRole(userId, role);
      await updateUserStatus(userId, status);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role, status } : u))
      );
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-taksu-sage">
          <thead className="bg-taksu-cream text-xs uppercase text-taksu-forest">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taksu-bamboo/20 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-taksu-cream/50">
                <td className="px-6 py-4 font-medium text-taksu-forest">
                  {user.full_name}
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <Badge variant={user.role === 'root' ? 'destructive' : user.role === 'guest' ? 'outline' : 'default'} className="uppercase">
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-taksu-jungle' : ''}>
                    {user.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isAdmin && user.role === 'root'}
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-taksu-sage">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <UserEditDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
          currentUserRole={currentRole}
        />
      )}
    </Card>
  );
}
