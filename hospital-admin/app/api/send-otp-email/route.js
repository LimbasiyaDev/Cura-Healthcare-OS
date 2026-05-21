import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Cura Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Admin Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
          <h2 style="color: #0D3327;">Admin Verification Code</h2>
          <p style="font-size: 16px; color: #475569;">You have requested to log into the Admin portal. Please use the verification code below:</p>
          <div style="background-color: #F8FAFC; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1A5C44;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #94A3B8;">This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
  }
}
