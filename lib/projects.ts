import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { toListItem, type TaskListItem } from "./tasks";
import type { Role } from "./constants";

export interface ProjectMemberInfo {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
}

export interface ProjectListItem {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  status: string;
  taskCount: number;
  memberCount: number;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  members: ProjectMemberInfo[];
  tasks: TaskListItem[];
  stats: { total: number; published: number; inProgress: number; words: number; writers: number };
}

const TASK_INCLUDE = {
  writer: { select: { name: true } },
  designer: { select: { name: true } },
  project: { select: { name: true } },
};

// Project ids a user is a member of. For reviewers this is the set of projects
// they're allowed to see/act on (they no longer see every project).
export async function reviewerProjectIds(userId: string): Promise<string[]> {
  const rows = await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } });
  return rows.map((r) => r.projectId);
}

/** Whether a reviewer is assigned to (a member of) the given project. */
export async function canReviewerAccessProject(userId: string, projectId: string | null): Promise<boolean> {
  if (!projectId) return false;
  const m = await prisma.projectMember.findFirst({ where: { userId, projectId }, select: { id: true } });
  return !!m;
}

/** A task `where` fragment scoping what a viewer may see: everyone but reviewers
 * sees all; a reviewer sees only content in the projects they're assigned to. */
export async function taskWhereForViewer(user: { id: string; role: string }): Promise<Prisma.TaskWhereInput> {
  if (user.role !== "REVIEWER") return {};
  return { projectId: { in: await reviewerProjectIds(user.id) } };
}

export async function getProjectsList(projectIds?: string[]): Promise<ProjectListItem[]> {
  const projects = await prisma.project.findMany({
    where: projectIds ? { id: { in: projectIds } } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true, members: true } } },
  });
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    website: p.website,
    description: p.description,
    status: p.status,
    taskCount: p._count.tasks,
    memberCount: p._count.members,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      tasks: { include: TASK_INCLUDE, orderBy: { date: "desc" } },
    },
  });
  if (!project) return null;

  const items = project.tasks.map(toListItem);
  const total = items.length;
  const published = items.filter((t) => t.status === "POSTED" || t.status === "SEO_OPTIMIZED").length;
  const cancelled = items.filter((t) => t.status === "CANCELLED").length;
  const inProgress = total - published - cancelled;
  const words = items.reduce((s, t) => s + (t.words || 0), 0);

  const members: ProjectMemberInfo[] = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    username: m.user.username,
    role: m.user.role as Role,
    active: m.user.active,
  }));

  return {
    id: project.id,
    name: project.name,
    website: project.website,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    members,
    tasks: items,
    stats: { total, published, inProgress, words, writers: members.filter((m) => m.role === "WRITER").length },
  };
}
