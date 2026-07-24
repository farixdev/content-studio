import { STATUS_ORDER } from "./constants";
import { approvedWords } from "./workflow";
import type { TaskListItem } from "./tasks";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface MonthGroup {
  key: string;
  label: string;
  year: number;
  words: number;
  statuses: { status: string; count: number }[];
  items: TaskListItem[];
}

/**
 * Group content into a continuous month-by-month timeline (newest → oldest),
 * from now back to `since`, PLUS any month that actually contains an item — so
 * no item is ever hidden, even if backdated or dated far in the future.
 */
export function buildMonthGroups(items: TaskListItem[], since: Date): MonthGroup[] {
  const now = new Date();

  const byMonth = new Map<string, TaskListItem[]>();
  for (const t of items) {
    const d = new Date(t.date);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(t);
  }

  const meta = new Map<string, { key: string; label: string; year: number; y: number; mo: number }>();
  const add = (yy: number, mm: number) => {
    const key = `${yy}-${mm}`;
    if (!meta.has(key)) meta.set(key, { key, label: MONTHS[mm], year: yy, y: yy, mo: mm });
  };
  {
    let yy = now.getUTCFullYear();
    let mm = now.getUTCMonth();
    const sy = since.getUTCFullYear();
    const sm = since.getUTCMonth();
    let guard = 0;
    while ((yy > sy || (yy === sy && mm >= sm)) && guard++ < 600) {
      add(yy, mm);
      mm -= 1;
      if (mm < 0) {
        mm = 11;
        yy -= 1;
      }
    }
  }
  for (const t of items) {
    const d = new Date(t.date);
    add(d.getUTCFullYear(), d.getUTCMonth());
  }

  const months = [...meta.values()].sort((a, b) => b.y - a.y || b.mo - a.mo);
  const order = STATUS_ORDER as unknown as string[];

  return months.map((mo) => {
    const monthItems = byMonth.get(mo.key) ?? [];
    // Only approved content counts toward the final word total (rejected/in-review
    // work isn't final). Once approved it stays counted through design/publish.
    const words = approvedWords(monthItems);
    const counts = new Map<string, number>();
    for (const t of monthItems) counts.set(t.status, (counts.get(t.status) || 0) + 1);
    const statuses = [...counts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    return { key: mo.key, label: mo.label, year: mo.year, words, statuses, items: monthItems };
  });
}
