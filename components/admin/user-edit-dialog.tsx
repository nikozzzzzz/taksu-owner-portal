'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface UserEditDialogProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, role: string, status: string) => Promise<void>;
  currentUserRole: string;
}

const ROLES = ['root', 'admin', 'accountant', 'service', 'investor', 'guest'];
const STATUSES = ['active', 'suspended', 'pending_setup'];

export function UserEditDialog({ user, isOpen, onClose, onSave, currentUserRole }: UserEditDialogProps) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUserRole === 'admin';
  const availableRoles = isAdmin ? ROLES.filter(r => r !== 'root') : ROLES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(user.id, role, status);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User: {user.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle disabled:cursor-not-allowed disabled:opacity-50"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isAdmin && user.role === 'root'}
            >
              {availableRoles.map(r => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Account Status</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle disabled:cursor-not-allowed disabled:opacity-50"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isAdmin && user.role === 'root'}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (isAdmin && user.role === 'root')}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
