import { prisma } from "./prisma";

export interface FileRef {
  id: string;
  name: string;
}

export interface TaskDetail {
  id: string;
  refCode: string;
  title: string;
  contentType: string;
  status: string;
  date: string;
  deadline: string | null;
  words: number;
  guideText: string | null;
  contentLink: string | null;
  guideFile: FileRef | null;
  contentText: string | null;
  contentFile: FileRef | null;
  designInstructions: string | null;
  designAsset: FileRef | null;
  figmaLink: string | null;
  developer: { id: string; name: string } | null;
  devInstructions: string | null;
  devLink: string | null;
  websiteLink: string | null;
  remarks: string | null;
  writer: { id: string; name: string } | null;
  designer: { id: string; name: string } | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  approvals: { reviewerName: string; note: string | null; createdAt: string }[];
  issues: {
    id: string;
    message: string;
    raisedByName: string;
    file: FileRef | null;
    resolved: boolean;
    createdAt: string;
  }[];
  history: {
    fromStatus: string | null;
    toStatus: string;
    byName: string;
    note: string | null;
    createdAt: string;
  }[];
  comments: {
    id: string;
    body: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  }[];
}

function fileRef(u: { id: string; originalName: string } | null): FileRef | null {
  return u ? { id: u.id, name: u.originalName } : null;
}

export async function getTaskDetail(id: string): Promise<TaskDetail | null> {
  const t = await prisma.task.findUnique({
    where: { id },
    include: {
      writer: true,
      designer: true,
      developer: true,
      guideFile: true,
      contentFile: true,
      designAsset: true,
      createdBy: true,
      approvals: { include: { reviewer: true }, orderBy: { createdAt: "asc" } },
      issues: { include: { raisedBy: true, file: true }, orderBy: { createdAt: "desc" } },
      statusHistory: { include: { by: true }, orderBy: { createdAt: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!t) return null;

  return {
    id: t.id,
    refCode: t.refCode,
    title: t.title,
    contentType: t.contentType,
    status: t.status,
    date: t.date.toISOString(),
    deadline: t.deadline ? t.deadline.toISOString() : null,
    words: t.words,
    guideText: t.guideText,
    contentLink: t.contentLink,
    guideFile: fileRef(t.guideFile),
    contentText: t.contentText,
    contentFile: fileRef(t.contentFile),
    designInstructions: t.designInstructions,
    designAsset: fileRef(t.designAsset),
    figmaLink: t.figmaLink,
    developer: t.developer ? { id: t.developer.id, name: t.developer.name } : null,
    devInstructions: t.devInstructions,
    devLink: t.devLink,
    websiteLink: t.websiteLink,
    remarks: t.remarks,
    writer: t.writer ? { id: t.writer.id, name: t.writer.name } : null,
    designer: t.designer ? { id: t.designer.id, name: t.designer.name } : null,
    createdByName: t.createdBy.name,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    approvals: t.approvals.map((a) => ({
      reviewerName: a.reviewer.name,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
    })),
    issues: t.issues.map((i) => ({
      id: i.id,
      message: i.message,
      raisedByName: i.raisedBy.name,
      file: fileRef(i.file),
      resolved: i.resolved,
      createdAt: i.createdAt.toISOString(),
    })),
    history: t.statusHistory.map((h) => ({
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      byName: h.by.name,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
    comments: t.comments.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.author.name,
      authorRole: c.author.role,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
