const cron = require('node-cron');
const Loan = require('../models/Loan');
const { sendReminder } = require('../services/sendReminder');

async function sendDueReminders() {
  const loans = await Loan.findDisbursedDueWithinDays(3);
  for (const row of loans) {
    const user = {
      id: row.user_id,
      phone: row.user_phone,
      name: row.user_name,
      email: row.user_email,
    };
    await sendReminder(user, row);
  }
  return loans.length;
}

async function checkOverdue() {
  const updated = await Loan.markOverdue();
  if (updated.length > 0) {
    console.log(`Marked ${updated.length} loan(s) as overdue`);
  }
  return updated;
}

function startJobs() {
  // Daily 9:00 AM IST — overdue first, then due-soon reminders
  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        await checkOverdue();
        await sendDueReminders();
      } catch (err) {
        console.error('daily loan jobs error:', err);
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  console.log('Scheduled jobs: overdue + due reminders daily at 09:00 Asia/Kolkata');
}

module.exports = { startJobs, sendDueReminders, checkOverdue };
