import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 18:30 UTC = 00:00 IST — refresh event statuses daily
crons.daily(
  "Update catering statuses daily",
  { hourUTC: 18, minuteUTC: 30 },
  internal.caterings.refreshStatuses
);

// Hourly — clean up expired sessions and old rate-limit records
crons.hourly(
  "Clean expired sessions",
  { minuteUTC: 15 },
  internal.maintenance.cleanExpiredSessions
);

crons.hourly(
  "Clean old login attempts",
  { minuteUTC: 20 },
  internal.maintenance.cleanLoginAttempts
);

export default crons;
