'use server';

import { revalidatePath } from 'next/cache';
import { createProject } from '@/lib/db/projects';
import { getCallerOrgId } from '@/lib/db/team-members';
import type { Project, ProjectInsert } from '@/lib/types';

export async function createProjectAction(
  payload: Omit<ProjectInsert, 'org_id'>
): Promise<Project> {
  const org_id = await getCallerOrgId();
  const project = await createProject({ ...payload, org_id });
  revalidatePath('/dashboard', 'layout');
  return project;
}