import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    // Always send OTP to the real admin Gmail, NOT to the display email
    // used in the Supabase admin_users table (e.g. admin@cura.com).
    // OTP_RECIPIENT is set in .env.local (server-side only, not exposed to browser).
    const recipient = process.env.OTP_RECIPIENT || process.env.SMTP_USER;

    if (!recipient) {
      console.error("[OTP] No recipient configured. Set OTP_RECIPIENT in .env.local");
      return NextResponse.json({ error: "Mail not configured" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host:             "smtp.gmail.com",
      port:             587,
      secure:           false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family:            4,
      connectionTimeout: 10000,
      greetingTimeout:   10000,
      socketTimeout:     15000,
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from:    `"Cura Admin" <${process.env.SMTP_USER}>`,
      to:      recipient,
      subject: "Your Admin Login OTP – Cura",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px; background: #ffffff;">
          <div style="background: #0D3327; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🏥 Cura Admin Portal</h2>
          </div>
          <h3 style="color: #0D3327; margin-bottom: 8px;">Admin Verification Code</h3>
          <p style="font-size: 15px; color: #475569; margin-bottom: 20px;">
            An admin login was requested. Use the code below to complete your login:
          </p>
          <div style="background-color: #F8FAFC; border: 2px solid #0D3327; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1A5C44;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #94A3B8;">
            This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`[OTP] Email sent successfully to ${recipient}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[OTP] Failed to send email:", {
      message:  error?.message,
      code:     error?.code,
      command:  error?.command,
      response: error?.response,
    });
    return NextResponse.json(
      { error: "Failed to send OTP email", detail: error?.message },
      { status: 500 }
    );
  }
}
