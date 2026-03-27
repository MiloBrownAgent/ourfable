import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// OurFable: Daily delivery milestone check — 10 AM CT (15:00 UTC)
crons.cron(
  "ourfable-delivery-check",
  "0 15 * * *",
  internal.ourfableDelivery.checkDeliveryMilestones
);

// OurFable: Monthly circle re-engagement check — 5th of each month at 10 AM CT (15:00 UTC)
crons.cron(
  "ourfable-circle-reengagement",
  "0 15 5 * *",
  internal.ourfableDelivery.checkCircleReEngagement
);

// OurFable: Annual recap — daily check at 9 AM CT (14:00 UTC) for birthday matches
crons.cron(
  "ourfable-annual-recap",
  "0 14 * * *",
  internal.ourfableDelivery.sendAnnualRecap
);

// OurFable: Birthday letter reminder — 7 days before birthday, 9:30 AM CT (14:30 UTC)
crons.cron(
  "ourfable-birthday-letter-reminder",
  "30 14 * * *",
  internal.ourfableDelivery.sendBirthdayLetterReminder
);

// OurFable: Monthly prompts — 1st of each month at 10 AM CT (15:00 UTC)
crons.cron(
  "ourfable-monthly-prompts",
  "0 15 1 * *",
  internal.ourfableMonthly.sendMonthlyPrompts
);

// OurFable: Daily cleanup of soft-deleted families older than 30 days — 3 AM CT (08:00 UTC)
crons.cron(
  "ourfable-cleanup-deleted-families",
  "0 8 * * *",
  internal.ourfable.cleanupDeletedFamilies
);

// OurFable: Milestone prompt check — daily at 8 PM CT (01:00 UTC)
crons.cron(
  "ourfable-milestone-check",
  "0 1 * * *",
  internal.ourfableMilestones.checkMilestonePrompts
);

// OurFable: Guardian inactivity check — weekly, Sundays at 10 AM CT (15:00 UTC)
crons.cron(
  "ourfable-guardian-checkin",
  "0 15 * * 0",
  internal.ourfableMilestones.checkGuardianInactivity
);

// OurFable: World Snapshot AI generation — 2nd of each month at 9 AM CT (14:00 UTC)
// Runs after monthly prompts (1st) so snapshot is ready when parents check the dashboard
crons.cron(
  "ourfable-snapshot-generation",
  "0 14 2 * *",
  internal.ourfableSnapshots.generateMissingSnapshots
);

export default crons;
