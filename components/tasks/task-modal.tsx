'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Briefcase, AlignLeft, MessageSquare } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { updateTask, getTaskComments, addComment } from '@/lib/actions/task-actions';

// Simple TipTap menu
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div className="border-b border-gray-200 p-2 flex gap-2 bg-gray-50 rounded-t-lg text-sm">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}>List</button>
    </div>
  );
};

export function TaskModal({ task, project, columns, owners, onClose, onUpdate }: any) {
  const [title, setTitle] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [descriptionHtml, setDescriptionHtml] = useState(task.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: descriptionHtml,
    onUpdate: ({ editor }) => {
      setDescriptionHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    getTaskComments(task.id).then(setComments);
  }, [task.id]);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (title !== task.title) {
      await updateTask(task.id, project.id, { title });
      onUpdate({ title });
    }
  };

  const saveDescription = async () => {
    setIsEditingDesc(false);
    if (descriptionHtml !== task.description) {
      await updateTask(task.id, project.id, { description: descriptionHtml });
      onUpdate({ description: descriptionHtml });
    }
  };

  const handlePropertyChange = async (prop: string, value: any) => {
    const val = value === '' ? null : value;
    await updateTask(task.id, project.id, { [prop]: val });
    onUpdate({ [prop]: val });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const c = await addComment(task.id, newComment);
    setComments([...comments, c]);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start gap-4 bg-gray-50/50">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={e => e.key === 'Enter' && handleTitleBlur()}
                className="w-full text-xl font-semibold text-gray-900 bg-white border border-taksu-jungle rounded px-2 py-1 focus:outline-none"
              />
            ) : (
              <h2 
                onClick={() => setIsEditingTitle(true)} 
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 -ml-2 rounded"
              >
                {title}
              </h2>
            )}
            <p className="text-sm text-gray-500 mt-1 px-2 -ml-2">in column <span className="underline decoration-dashed cursor-pointer">{columns.find((c:any) => c.id === task.column_id)?.title}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                <AlignLeft className="h-5 w-5" />
                <h3>Description</h3>
                {!isEditingDesc && (
                  <button onClick={() => setIsEditingDesc(true)} className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600">Edit</button>
                )}
              </div>
              
              {isEditingDesc ? (
                <div className="border border-gray-200 rounded-lg focus-within:border-taksu-jungle focus-within:ring-1 focus-within:ring-taksu-jungle transition-all">
                  <MenuBar editor={editor} />
                  <div className="p-3 min-h-[150px] prose prose-sm max-w-none">
                    <EditorContent editor={editor} />
                  </div>
                  <div className="bg-gray-50 p-2 border-t border-gray-200 flex gap-2">
                    <button onClick={saveDescription} className="bg-taksu-jungle text-white px-4 py-1.5 rounded-md text-sm font-medium">Save</button>
                    <button onClick={() => { editor?.commands.setContent(task.description || ''); setIsEditingDesc(false); }} className="text-gray-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingDesc(true)}
                  className="prose prose-sm max-w-none text-gray-700 min-h-[100px] cursor-pointer hover:bg-gray-50 p-3 -m-3 rounded-lg transition-colors"
                  dangerouslySetInnerHTML={{ __html: task.description || '<span class="text-gray-400 italic">Add a more detailed description...</span>' }}
                />
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                <MessageSquare className="h-5 w-5" />
                <h3>Activity</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-taksu-forest text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                      {c.author?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm text-gray-900">{c.author?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1 bg-gray-50 border border-gray-100 p-3 rounded-lg rounded-tl-none">
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-medium text-xs flex-shrink-0">
                  Me
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-taksu-jungle focus:ring-1 focus:ring-taksu-jungle"
                    rows={2}
                  />
                  <button type="submit" disabled={!newComment.trim()} className="mt-2 bg-taksu-jungle text-white px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50">
                    Save Comment
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Properties */}
          <div className="w-full md:w-64 bg-gray-50 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Assignment</h4>
              
              <div>
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"><User className="h-3 w-3"/> Assignee</label>
                <select 
                  value={task.assigned_to || ''} 
                  onChange={e => handlePropertyChange('assigned_to', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:border-taksu-jungle"
                >
                  <option value="">Unassigned</option>
                  {owners.filter((o:any) => ['admin','root','accountant','service'].includes(o.role)).map((o:any) => (
                    <option key={o.id} value={o.id}>{o.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"><Briefcase className="h-3 w-3"/> Linked Client / Investor</label>
                <select 
                  value={task.investor_id || ''} 
                  onChange={e => handlePropertyChange('investor_id', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:border-taksu-jungle"
                >
                  <option value="">None</option>
                  {owners.filter((o:any) => o.role === 'investor').map((o:any) => (
                    <option key={o.id} value={o.id}>{o.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Dates</h4>
              
              <div>
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3"/> Start Date</label>
                <input 
                  type="date"
                  value={task.start_date || ''}
                  onChange={e => handlePropertyChange('start_date', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:border-taksu-jungle"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3"/> End Date</label>
                <input 
                  type="date"
                  value={task.end_date || ''}
                  onChange={e => handlePropertyChange('end_date', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:border-taksu-jungle"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1 text-red-600"><Calendar className="h-3 w-3"/> Deadline</label>
                <input 
                  type="date"
                  value={task.deadline || ''}
                  onChange={e => handlePropertyChange('deadline', e.target.value)}
                  className="w-full bg-white border border-red-200 rounded-md p-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
