import { addMonths } from "date-fns";
import { prisma } from "./prisma";
import { WRITER_EDITABLE } from "./workflow";
import { notifyUser, notifyAdmins, notifyReviewers } from "./tasks";
import { formatDate } from "./utils";

// The next due date: keep the SAME day-of-month and advance one or more months
// until it lands in the future (handles a piece that's been overdue a while).
function nextDeadline(old: Date, now: Date): Date {
  let d = addMonths(old, 1);
  while (d.getTime() <= now.getTime()) d = addMonths(d, 1);
  return d;
}

/**
 * Roll every writer-owed piece whose due date has passed to next month (same
 * day-of-month), tag it "late", and notify the Manager, the project's assigned
 * reviewer(s) and the writer. Returns how many were rolled.
 *
 * Idempotent + concurrency-safe: the update is guarded on the exact old deadline,
 * so only the run that actually moves it sends notifications.
 */
export async function rolloverOverdueDeadlines(): Promise<number> {
  const now = new Date();
  const overdue = await prisma.task.findMany({
    where: { deadline: { lt: now }, status: { in: WRITER_EDITABLE } },
    select: { id: true, title: true, deadline: true, writerId: true, projectId: true },
  });

  let count = 0;
  for (const t of overdue) {
    if (!t.deadline) continue;
    const nd = nextDeadline(t.deadline, now);

    // Only proceed if this piece still has the deadline we read (guards against a
    // concurrent run rolling it twice).
    const res = await prisma.task.updateMany({
      where: { id: t.id, deadline: t.deadline },
      data: { deadline: nd, deadlineRollovers: { increment: 1 } },
    });
    if (res.count === 0) continue;

    const when = formatDate(nd, "MMM d, yyyy");
    const msg = `Late: "${t.title}" missed its due date — reassigned to ${when}.`;
    await notifyAdmins("DEADLINE", msg, t.id);
    await notifyReviewers("DEADLINE", msg, t.id, t.projectId);
    if (t.writerId) {
      await notifyUser(t.writerId, "DEADLINE", `Your content "${t.title}" is late — new due date ${when}.`, t.id);
    }
    count++;
  }
  return count;
}

const ROLLOVER_MARKER = "lastDeadlineRollover";

/**
 * Opportunistic, throttled run (e.g. on Manager dashboard load) so overdue pieces
 * roll even if the scheduled cron isn't available. Runs at most once every ~12h,
 * claimed via an AppMeta marker. Never throws.
 */
export async function maybeRolloverDeadlines(): Promise<void> {
  try {
    const marker = await prisma.appMeta.findUnique({ where: { key: ROLLOVER_MARKER } });
    const last = marker ? Date.parse(marker.value) : 0;
    if (Number.isFinite(last) && Date.now() - last < 12 * 60 * 60 * 1000) return;
    // Claim the slot before doing the work so concurrent renders don't pile up.
    await prisma.appMeta.upsert({
      where: { key: ROLLOVER_MARKER },
      create: { key: ROLLOVER_MARKER, value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });
    await rolloverOverdueDeadlines();
  } catch {
    /* never break the page that triggered this */
  }
}
