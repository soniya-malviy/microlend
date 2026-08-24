// Mock SMS. Replace the body of this function with Twilio (or another provider)
// without changing callers: sendReminder(user, loan).
async function sendReminder(user, loan) {
  const due = loan.due_date instanceof Date ? loan.due_date.toISOString() : loan.due_date;
  console.log(`Reminder sent to ${user.phone} for loan ${loan.id}, due ${due}`);
}

module.exports = { sendReminder };
