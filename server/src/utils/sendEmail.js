const nodemailer = require('nodemailer');

/**
 * Sends an email via SMTP when configured; otherwise logs the message to the
 * console (mock mode for development/demo, per the 2FA mockup requirement).
 */
async function sendEmail({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[mock email] To: ${to} | Subject: ${subject} | ${text}`);
    return { mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Business Nexus <no-reply@nexus.local>',
    to,
    subject,
    text
  });
  return { mocked: false };
}

module.exports = sendEmail;
