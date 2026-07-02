import { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getBoardData, getOwnersForSelect } from '@/lib/actions/task-actions';
import { Board } from '@/components/tasks/board';
import Link from 'next/link';
import { ArrowLeft, Kanban } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kanban Board | Taksu Owner Portal',
};

export default async function KanbanPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root', 'accountant'].includes(role)) {
    redirect('/dashboard');
  }

  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('task_projects').select('*').eq('id', projectId).single();
  const project = data as any;
  if (!project) redirect('/tasks');

  const { columns, tasks } = await getBoardData(projectId);
  const owners = await getOwnersForSelect();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-6 -m-6 animate-in">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/tasks" className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-lg p-2 shadow-sm transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="bg-taksu-bamboo/10 p-2 rounded-lg text-taksu-jungle shrink-0">
          <Kanban className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-semibold text-gray-900 leading-tight">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.description || 'Manage your tasks'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Board 
          project={project} 
          initialColumns={columns} 
          initialTasks={tasks}
          owners={owners}
        />
      </div>
    </div>
  );
}
