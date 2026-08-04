'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { getQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply } from '@/lib/actions/quick-reply-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function QuickRepliesForm() {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReplies();
  }, []);

  const loadReplies = async () => {
    setLoading(true);
    const res = await getQuickReplies();
    if (res.success) {
      setReplies(res.data);
    } else {
      toast.error('Failed to load quick replies');
    }
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setText('');
    setModalOpen(true);
  };

  const handleOpenEdit = (reply: any) => {
    setEditingId(reply.id);
    setName(reply.name);
    setText(reply.text);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !text.trim()) {
      toast.error('Name and text are required');
      return;
    }
    
    setSaving(true);
    let res;
    if (editingId) {
      res = await updateQuickReply(editingId, name, text);
    } else {
      res = await createQuickReply(name, text);
    }
    
    if (res.success) {
      toast.success(editingId ? 'Quick reply updated' : 'Quick reply created');
      setModalOpen(false);
      loadReplies();
    } else {
      toast.error('Failed to save quick reply', { description: res.error });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick reply?')) return;
    
    const res = await deleteQuickReply(id);
    if (res.success) {
      toast.success('Quick reply deleted');
      loadReplies();
    } else {
      toast.error('Failed to delete quick reply', { description: res.error });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">Existing Templates</h3>
        <Button onClick={handleOpenNew} size="sm" className="bg-taksu-forest text-white">
          <Plus className="h-4 w-4 mr-1" /> New Reply
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : replies.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg text-gray-500">
          No quick replies created yet.
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map(reply => (
            <div key={reply.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{reply.name}</h4>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-2">{reply.text}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" onClick={() => handleOpenEdit(reply)}>
                  <Edit2 className="h-4 w-4 text-gray-600" />
                </Button>
                <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(reply.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Quick Reply' : 'New Quick Reply'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name (Internal reference)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome Message" />
            </div>
            
            <div className="space-y-2">
              <Label>Message Text</Label>
              <Textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                placeholder="The actual message to send to the guest..." 
                className="min-h-[150px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-taksu-terracotta text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
