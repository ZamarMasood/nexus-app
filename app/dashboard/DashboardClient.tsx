"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Layers, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Briefcase,
  Clock,
  ArrowRight,
  MessageSquare,
  Copy
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTaskForm } from "./task-form-context";
import { useWorkspaceSlug } from "@/app/dashboard/workspace-context";
import type { TaskWithAssignee } from "@/lib/db/tasks";
import type { Project } from "@/lib/types";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  todo:        { bg: 'rgba(136,136,136,0.12)', text: '#888', dot: '#888' },
  in_progress: { bg: 'rgba(94,106,210,0.12)', text: '#5e6ad2', dot: '#5e6ad2' },
  done:        { bg: 'rgba(38,201,127,0.12)', text: '#26c97f', dot: '#26c97f' },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: '#e5484d',
  high:   '#e79d13',
  normal: '#5e6ad2',
  low:    '#8a8a8a',
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.todo;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: colors.bg, color: colors.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
      {status.replace('_', ' ')}
    </span>
  );
}

interface TaskStats {
  total: number;
  done: number;
  overdue: number;
  dueSoon: number;
}

interface DashboardClientProps {
  recentTasks: TaskWithAssignee[];
  taskStats: TaskStats;
  projects: Project[];
  userName: string | null;
  dateLabel: string;
}

export default function DashboardClient({ 
  recentTasks, 
  taskStats, 
  projects, 
  userName, 
  dateLabel 
}: DashboardClientProps) {
  const { openTaskForm } = useTaskForm();
  const slug = useWorkspaceSlug();

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "in_progress");
  const completionPct = taskStats.total ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <div>
            <h1 className="text-[15px] font-medium text-[#e8e8e8]">Dashboard</h1>
            <p className="text-[11px] text-[#555] mt-0.5">{dateLabel}</p>
          </div>
        </div>
        <button
          onClick={() => openTaskForm()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            bg-[#5e6ad2] hover:bg-[#6872e5] text-white transition-all duration-150"
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          
          {/* Welcome section */}
          <div className="mb-8">
            <h2 className="text-[20px] font-semibold text-[#e8e8e8] tracking-tight">
              Welcome back{userName ? `, ${userName}!` : ''}
            </h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Tasks */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-md bg-[rgba(94,106,210,0.12)]">
                  <Layers size={14} className="text-[#5e6ad2]" />
                </div>
                <span className="text-[11px] text-[#555]">Total</span>
              </div>
              <p className="text-[24px] font-semibold text-[#e8e8e8] mb-1">{taskStats.total}</p>
              <p className="text-[11px] text-[#555]">Tasks</p>
            </div>

            {/* Completion Rate */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-md bg-[rgba(38,201,127,0.12)]">
                  <CheckCircle size={14} className="text-[#26c97f]" />
                </div>
                <span className="text-[11px] text-[#555]">Progress</span>
              </div>
              <p className="text-[24px] font-semibold text-[#e8e8e8] mb-1">{completionPct}%</p>
              <p className="text-[11px] text-[#555]">Complete</p>
              <div className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${completionPct}%`, background: '#5e6ad2' }}
                />
              </div>
            </div>

            {/* Active Projects */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-md bg-[rgba(94,106,210,0.12)]">
                  <Briefcase size={14} className="text-[#5e6ad2]" />
                </div>
                <span className="text-[11px] text-[#555]">Active</span>
              </div>
              <p className="text-[24px] font-semibold text-[#e8e8e8] mb-1">{activeProjects.length}</p>
              <p className="text-[11px] text-[#555]">Projects</p>
            </div>

            {/* Overdue */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-md bg-[rgba(229,72,77,0.12)]">
                  <AlertCircle size={14} className="text-[#e5484d]" />
                </div>
                <span className="text-[11px] text-[#555]">Attention</span>
              </div>
              <p className="text-[24px] font-semibold text-[#e5484d] mb-1">{taskStats.overdue}</p>
              <p className="text-[11px] text-[#555]">Overdue tasks</p>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Tasks */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#5e6ad2]" />
                    <h3 className="text-[13px] font-medium text-[#e8e8e8]">Recent Tasks</h3>
                  </div>
                  <Link 
                    href={`/${slug}/tasks`}
                    className="text-[11px] text-[#5e6ad2] hover:text-[#7e8ae6] transition-colors flex items-center gap-1"
                  >
                    View all
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {recentTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[13px] text-[#888] mb-2">No tasks yet</p>
                    <button
                      onClick={() => openTaskForm()}
                      className="text-[12px] text-[#5e6ad2] hover:text-[#7e8ae6]"
                    >
                      Create your first task →
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                    {recentTasks.map((task) => {
                      const isHighPriority = task.priority === "urgent" || task.priority === "high";
                      
                      return (
                        <Link 
                          key={task.id} 
                          href={`/${slug}/tasks/${task.id}`}
                          className="group block px-5 py-3 hover:bg-[#1c1c1c] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {isHighPriority && (
                              <div 
                                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                style={{ background: PRIORITY_DOT[task.priority ?? 'normal'] }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-[#d4d4d4] group-hover:text-[#5e6ad2] transition-colors">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <StatusBadge status={task.status ?? 'todo'} />
                                {task.due_date && (
                                  <span className="flex items-center gap-1 text-[11px] text-[#555]">
                                    <Calendar size={10} />
                                    {formatDate(task.due_date)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-[11px] text-[#555]">
                                  <MessageSquare size={10} />
                                  0
                                </span>
                              </div>
                            </div>
                            {task.assignee && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-[rgba(94,106,210,0.15)]
                                  flex items-center justify-center">
                                  <span className="text-[10px] font-medium text-[#5e6ad2]">
                                    {task.assignee.name.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                <h3 className="text-[13px] font-medium text-[#e8e8e8] mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => openTaskForm()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                      text-[12px] text-[#888] hover:text-[#e8e8e8] hover:bg-white/5
                      transition-all duration-150"
                  >
                    <Plus size={12} className="text-[#5e6ad2]" />
                    Create New Task
                  </button>
                  <Link
                    href={`/${slug}/projects`}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                      text-[12px] text-[#888] hover:text-[#e8e8e8] hover:bg-white/5
                      transition-all duration-150"
                  >
                    <Briefcase size={12} className="text-[#5e6ad2]" />
                    View All Projects
                  </Link>
                </div>
              </div>

              {/* Active Projects List */}
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-medium text-[#e8e8e8]">Active Projects</h3>
                  <Link 
                    href={`/${slug}/projects`}
                    className="text-[11px] text-[#5e6ad2] hover:text-[#7e8ae6]"
                  >
                    Manage →
                  </Link>
                </div>
                
                {activeProjects.length === 0 ? (
                  <p className="text-[12px] text-[#555] text-center py-3">No active projects</p>
                ) : (
                  <div className="space-y-2">
                    {activeProjects.slice(0, 4).map((project) => (
                      <Link 
                        key={project.id}
                        href={`/${slug}/projects/${project.id}`}
                        className="flex items-center justify-between py-1.5 group"
                      >
                        <span className="text-[12px] text-[#888] group-hover:text-[#e8e8e8] transition-colors">
                          {project.name}
                        </span>
                        <ArrowRight size={10} className="text-[#333] group-hover:text-[#5e6ad2]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Tasks */}
              {taskStats.dueSoon > 0 && (
                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={12} className="text-[#e79d13]" />
                    <h3 className="text-[13px] font-medium text-[#e8e8e8]">Due This Week</h3>
                  </div>
                  <p className="text-[20px] font-semibold text-[#e79d13] mb-1">{taskStats.dueSoon}</p>
                  <p className="text-[11px] text-[#555]">Tasks need attention</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}