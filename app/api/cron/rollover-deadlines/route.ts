import { rolloverOverdueDeadlines } from "@/lib/deadlines";
import { apiUser, ok, unauthorized } from "@/lib/api";

// Rolls overdue writer content to next month + notifies. Runs on a schedule
// (Vercel Cron, authorized by CRON_SECRET) and can also be triggered by a Manager.
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const isCron = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!isCron) {
    const user = await apiUser("ADMIN");
    if (!user) return unauthorized();
  }
  const rolled = await rolloverOverdueDeadlines();
  return ok({ rolled });
}

export const GET = handle;
export const POST = handle;
