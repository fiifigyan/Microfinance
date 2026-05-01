import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs daily at 1 AM UTC — marks ACTIVE loans with missed first payment as DEFAULTED
crons.cron(
  "mark defaulted loans",
  "0 1 * * *",
  internal.mutations.loans.markDefaultedLoans,
  {},
);

// Runs daily at 8 AM UTC — sends repayment due reminders (7-day and 1-day warnings)
crons.cron(
  "repayment due reminders",
  "0 8 * * *",
  internal.mutations.loans.sendRepaymentReminders,
  {},
);

export default crons;
