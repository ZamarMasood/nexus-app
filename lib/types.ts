// ─── Supabase-generated Database type ────────────────────────────────────────
// Auto-generated via: supabase gen types typescript
// Do not edit the Database type directly — re-run generation after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          monthly_rate: number | null
          name: string
          portal_password: string | null
          project_type: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_rate?: number | null
          name: string
          portal_password?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_rate?: number | null
          name?: string
          portal_password?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          file_url: string | null
          filename: string | null
          id: string
          task_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          filename?: string | null
          id?: string
          task_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          filename?: string | null
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'files_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          client_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          pdf_url: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          pdf_url?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          pdf_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string | null
          deadline: string | null
          id: string
          name: string
          status: string | null
          total_value: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          name: string
          status?: string | null
          total_value?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          name?: string
          status?: string | null
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'team_members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          email: string
          id: string
          name: string
          role: string | null
          user_role: string | null
        }
        Insert: {
          avatar_url?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
          user_role?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          member_id: string
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          member_id: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          member_id?: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'team_members'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Convenience row/insert/update aliases ────────────────────────────────────

type Tables = Database['public']['Tables']

export type Client = Tables['clients']['Row']
export type ClientInsert = Tables['clients']['Insert']
export type ClientUpdate = Tables['clients']['Update']

export type Project = Tables['projects']['Row']
export type ProjectInsert = Tables['projects']['Insert']
export type ProjectUpdate = Tables['projects']['Update']

export type Task = Tables['tasks']['Row']
export type TaskInsert = Tables['tasks']['Insert']
export type TaskUpdate = Tables['tasks']['Update']

export type TeamMember = Tables['team_members']['Row']

export type Invoice = Tables['invoices']['Row']
export type InvoiceInsert = Tables['invoices']['Insert']
export type InvoiceUpdate = Tables['invoices']['Update']

export type Comment = Tables['comments']['Row']
export type ProjectFile = Tables['files']['Row']

// ─── project_members junction (not yet in generated DB type) ──────────────────
export interface ProjectMember {
  id: string
  project_id: string
  member_id: string
  assigned_at: string
  assigned_by: string | null
}

// ─── Team member enriched with their project assignments ──────────────────────
export interface TeamMemberWithProjects extends TeamMember {
  project_members: Array<{
    project_id: string
    projects: { id: string; name: string } | null
  }>
}

// ─── Application-level enum literals ─────────────────────────────────────────
// DB stores these as plain TEXT — use these when you need narrower types.

export type ClientStatus = 'active' | 'inactive' | 'paused'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
