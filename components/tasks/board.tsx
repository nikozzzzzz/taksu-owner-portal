'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Calendar, User, MessageSquare } from 'lucide-react';
import { createColumn, createTask, moveTask } from '@/lib/actions/task-actions';
import { TaskModal } from './task-modal';

export function Board({ project, initialColumns, initialTasks, owners }: any) {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  
  const [addingTaskCol, setAddingTaskCol] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Hydration fix for DragDropContext in React 18
  const [winReady, setwinReady] = useState(false);
  useEffect(() => {
    setwinReady(true);
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'card') {
      const sourceColId = source.droppableId;
      const destColId = destination.droppableId;
      
      const movedTask = tasks.find((t: any) => t.id === draggableId);
      if (!movedTask) return;

      const newTasks = Array.from(tasks);
      // Remove from old
      const sourceTasks = newTasks.filter((t: any) => t.column_id === sourceColId).sort((a: any, b: any) => a.position - b.position);
      sourceTasks.splice(source.index, 1);
      
      // Add to new
      const destTasks = sourceColId === destColId ? sourceTasks : newTasks.filter((t: any) => t.column_id === destColId).sort((a: any, b: any) => a.position - b.position);
      destTasks.splice(destination.index, 0, movedTask);

      // Re-calculate positions
      const updatesToDB: any[] = [];
      const updatedTasks = newTasks.map((t: any) => {
        if (t.id === draggableId) {
          t.column_id = destColId;
          t.position = destination.index;
          return t;
        }
        
        // Check if in dest
        const idxDest = destTasks.findIndex((dt: any) => dt.id === t.id);
        if (idxDest !== -1 && t.position !== idxDest) {
          t.position = idxDest;
          updatesToDB.push({ id: t.id, position: idxDest });
        }
        
        // Check if in source (if different)
        if (sourceColId !== destColId) {
          const idxSrc = sourceTasks.findIndex((dt: any) => dt.id === t.id);
          if (idxSrc !== -1 && t.position !== idxSrc) {
            t.position = idxSrc;
            updatesToDB.push({ id: t.id, position: idxSrc });
          }
        }
        
        return t;
      });

      setTasks(updatedTasks);
      
      // DB call
      await moveTask(draggableId, project.id, destColId, destination.index, updatesToDB);
    }
  };

  const onAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    const pos = columns.length;
    const col = await createColumn(project.id, newColumnTitle, pos);
    setColumns([...columns, col]);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const onAddTask = async (e: React.FormEvent, colId: string) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const colTasks = tasks.filter((t: any) => t.column_id === colId);
    const pos = colTasks.length;
    const t = await createTask({ project_id: project.id, column_id: colId, title: newTaskTitle, position: pos });
    setTasks([...tasks, t]);
    setNewTaskTitle('');
    setAddingTaskCol(null);
  };

  if (!winReady) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-x-auto items-start gap-6 pb-4">
          {columns.map((col: any) => {
            const colTasks = tasks.filter((t: any) => t.column_id === col.id).sort((a: any, b: any) => a.position - b.position);
            return (
              <div key={col.id} className="bg-gray-100/80 rounded-xl flex-shrink-0 w-80 max-h-full flex flex-col">
                <div className="p-3 font-medium text-gray-700 flex justify-between items-center">
                  <span>{col.title} <span className="text-gray-400 text-xs ml-1">{colTasks.length}</span></span>
                </div>
                
                <Droppable droppableId={col.id} type="card">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...(provided.droppableProps as any)}
                      className={`p-3 pt-0 flex-1 overflow-y-auto min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
                    >
                      {colTasks.map((task: any, index: number) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...(provided.draggableProps as any)}
                              {...(provided.dragHandleProps as any)}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-3 group hover:border-taksu-bamboo transition-all cursor-pointer ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-taksu-jungle/20' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                              
                              {(task.assignee || task.deadline || task.investor) && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-500">
                                  {task.deadline && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(task.deadline).toLocaleDateString()}
                                    </div>
                                  )}
                                  {task.assignee && (
                                    <div className="flex items-center gap-1 bg-taksu-bamboo/10 text-taksu-jungle px-1.5 py-0.5 rounded">
                                      <User className="h-3 w-3" />
                                      {task.assignee.full_name}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {addingTaskCol === col.id ? (
                        <form onSubmit={(e) => onAddTask(e, col.id)} className="mt-2">
                          <textarea
                            autoFocus
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onAddTask(e as any, col.id); }}}
                            className="w-full text-sm rounded-lg border border-taksu-jungle p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle/20"
                            placeholder="Task title..."
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2">
                            <button type="submit" className="bg-taksu-jungle text-white text-xs px-3 py-1.5 rounded">Add</button>
                            <button type="button" onClick={() => setAddingTaskCol(null)} className="text-gray-500 text-xs px-3 py-1.5">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAddingTaskCol(col.id)}
                          className="w-full mt-2 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 py-2 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" /> Add Task
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
          
          {/* Add Column */}
          <div className="flex-shrink-0 w-80">
            {isAddingColumn ? (
              <form onSubmit={onAddColumn} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <input
                  autoFocus
                  required
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="w-full text-sm rounded-md border border-gray-300 p-2 focus:border-taksu-jungle focus:outline-none"
                  placeholder="Column title..."
                />
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-taksu-jungle text-white text-xs px-3 py-1.5 rounded">Save</button>
                  <button type="button" onClick={() => setIsAddingColumn(false)} className="text-gray-500 text-xs px-3 py-1.5">Cancel</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full bg-white/50 border border-dashed border-gray-300 flex items-center gap-2 justify-center text-sm text-gray-500 py-3 rounded-xl hover:bg-white hover:border-gray-400 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Column
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={project}
          columns={columns}
          owners={owners}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask: any) => {
            setTasks(tasks.map((t: any) => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
            setSelectedTask({ ...selectedTask, ...updatedTask });
          }}
        />
      )}
    </div>
  );
}
