// External-cron entry point for the email reminder cycle.
//
// Run on a schedule from any host that can reach MongoDB and the email
// provider — e.g. a Render cron job, GitHub Actions schedule, or system
// cron:
//
//   node scripts/send-reminders.js
//
// The cycle is idempotent: re-running it (overlapping crons, restarts,
// retries) can never send the same reminder twice. See
// services/reminder.service.js for the claiming protocol.
const dotenv = require("dotenv");
dotenv.config();

const connectDatabase = require("../config/database");
const { runReminderCycle } = require("../services/reminder.service");

async function main() {
    await connectDatabase();
    const summary = await runReminderCycle({ now: new Date() });
    console.log(`[reminders] Finished: ${JSON.stringify(summary)}`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(`[reminders] Cycle failed: ${err.message}`);
        process.exit(1);
    });
