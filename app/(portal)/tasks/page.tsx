import { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getProjects } from '@/lib/actions/task-actions';
import { ProjectList } from '@/components/tasks/project-list';

export const metadata: Metadata = {
  title: 'Task Boards | Taksu Owner Portal',
};

export default async function TasksPage() {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root', 'accountant'].includes(role)) {
    redirect('/dashboard');
  }

  const projects = await getProjects();

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title">Task Boards</h1>
        <p className="portal-page-subtitle">Manage projects and tasks with Kanban boards.</p>
      </div>

      <div className="mt-8">
        <ProjectList initialProjects={projects} />
      </div>
    </div>
  );
}
