import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 18:30 UTC is exactly 00:00 IST (Indian Standard Time)
crons.daily(
  "Update catering statuses daily",
  { hourUTC: 18, minuteUTC: 30 },
  internal.caterings.refreshStatuses
);

export default crons;
