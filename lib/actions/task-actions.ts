'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProjects() {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase
    .from('task_projects')
    .select('*, created_by:owners(full_name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const supabase = (await createServerSupabaseClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('task_projects')
    .insert({
      name,
      description,
      created_by: user?.id,
    } as any);
  
  if (error) throw new Error(error.message);
  revalidatePath('/tasks');
}

export async function deleteProject(id: string) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { error } = await supabase.from('task_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tasks');
}

export async function getBoardData(projectId: string) {
  const supabase = (await createServerSupabaseClient()) as any;
  
  const [columnsRes, tasksRes] = await Promise.all([
    supabase.from('task_columns').select('*').eq('project_id', projectId).order('position', { ascending: true }),
    supabase.from('tasks').select('*, assignee:owners!tasks_assigned_to_fkey(id, full_name), investor:owners!tasks_investor_id_fkey(id, full_name)').eq('project_id', projectId).order('position', { ascending: true }),
  ]);

  if (columnsRes.error) throw new Error(columnsRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);

  return { columns: columnsRes.data, tasks: tasksRes.data };
}

export async function createColumn(projectId: string, title: string, position: number) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase
    .from('task_columns')
    .insert({ project_id: projectId, title, position } as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/tasks/${projectId}`);
  return data;
}

export async function createTask(taskData: any) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      created_by: user?.id,
    } as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/tasks/${taskData.project_id}`);
  return data;
}

export async function updateTask(taskId: string, projectId: string, updates: any) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { error } = await supabase
    .from('tasks')
    .update(updates as any)
    .eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/tasks/${projectId}`);
}

export async function moveTask(taskId: string, projectId: string, newColumnId: string, newPosition: number, otherTaskUpdates: { id: string, position: number }[]) {
  const supabase = (await createServerSupabaseClient()) as any;
  
  // First update the moved task
  const { error: moveError } = await supabase
    .from('tasks')
    .update({ column_id: newColumnId, position: newPosition } as any)
    .eq('id', taskId);
  if (moveError) throw new Error(moveError.message);

  // Then update positions of other tasks in the column(s)
  if (otherTaskUpdates.length > 0) {
    // Supabase JS doesn't have bulk update natively with multiple different values,
    // so we can loop since it's a small number usually.
    for (const update of otherTaskUpdates) {
      await supabase.from('tasks').update({ position: update.position } as any).eq('id', update.id);
    }
  }

  revalidatePath(`/tasks/${projectId}`);
}

export async function getTaskComments(taskId: string) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, author:owners(full_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function addComment(taskId: string, content: string) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content
    } as any)
    .select('*, author:owners(full_name)')
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

export async function getOwnersForSelect() {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase
    .from('owners')
    .select('id, full_name, role')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
}
