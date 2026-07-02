'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createProject, deleteProject } from '@/lib/actions/task-actions';
import { Plus, Trash2, Kanban, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming these exist, if not I will just use standard html
import { format } from 'date-fns';

export function ProjectList({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      await createProject(formData);
      window.location.reload(); 
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this board? All columns and tasks will be deleted.')) {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-900">Task Boards</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-taksu-jungle text-white px-4 py-2 rounded-md hover:bg-taksu-jungle/90 transition"
        >
          <Plus className="h-4 w-4" />
          New Board
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-medium text-gray-900">Create New Board</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input required name="name" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g., Marketing, Villa Renovations" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} placeholder="Optional description..." />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-taksu-jungle text-white rounded-md">Create</button>
          </div>
        </form>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link href={`/tasks/${project.id}`} key={project.id} className="block group">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-taksu-jungle transition-all h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-taksu-bamboo/10 p-2 rounded-lg text-taksu-jungle">
                    <Kanban className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-lg group-hover:text-taksu-jungle transition-colors">
                    {project.name}
                  </h3>
                </div>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-gray-500 text-sm flex-grow mb-4">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 text-xs text-gray-400">
                <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                {project.created_by?.full_name && <span>By {project.created_by.full_name}</span>}
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <ClipboardList className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <p>No boards found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
