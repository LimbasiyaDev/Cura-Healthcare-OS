const nodemailer = require('nodemailer');

// Load env from hospital-admin/.env.local
require('dotenv').config({ path: './hospital-admin/.env.local' });

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

console.log('Testing SMTP with user:', SMTP_USER);
console.log('Pass length:', SMTP_PASS ? SMTP_PASS.length : 'MISSING');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: { rejectUnauthorized: false }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('VERIFY FAILED:', err.message, '| Code:', err.code);
    process.exit(1);
  }
  console.log('VERIFY OK — sending test OTP email...');

  transporter.sendMail({
    from: `"Cura Admin" <${SMTP_USER}>`,
    to: SMTP_USER,
    subject: 'TEST: Your Admin Login OTP - Cura',
    text: 'Your test OTP is: 123456. This is a delivery test.',
    html: `<div style="font-family:Arial;text-align:center;padding:20px;">
      <h2 style="color:#0D3327;">Test OTP: <b>123456</b></h2>
      <p>This is a delivery test from Cura Admin.</p>
    </div>`
  }, (sendErr, info) => {
    if (sendErr) {
      console.error('SEND FAILED:', sendErr.message);
      console.error('Code:', sendErr.code);
      console.error('Response:', sendErr.response);
    } else {
      console.log('SEND OK!');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
      console.log('Accepted:', JSON.stringify(info.accepted));
      console.log('Rejected:', JSON.stringify(info.rejected));
      console.log('');
      console.log('CHECK YOUR GMAIL INBOX AND SPAM FOLDER for email from:', SMTP_USER);
    }
    process.exit(0);
  });
});
