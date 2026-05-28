import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req) {
  try {
    const { email, role, data } = await req.json();

    if (!email || !role || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate temp password
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    let dbError = null;

    // 3. Insert into respective table
    if (role === 'pharmacy') {
      const { error } = await supabase.from('pharmacies').insert([{
        user_id: userId,
        email: email,
        name: data.name,
        license_id: data.license_id,
        location: data.location,
        lead_pharmacist: data.lead_pharmacist,
        first_login: true
      }]);
      dbError = error;
    } else if (role === 'laboratory') {
      const { error } = await supabase.from('laboratories').insert([{
        user_id: userId,
        email: email,
        name: data.name,
        accreditation_number: data.accreditation_number,
        diagnostic_scope: data.diagnostic_scope,
        first_login: true
      }]);
      dbError = error;
    } else if (role === 'specialist') {
      const { error } = await supabase.from('doctors').insert([{
        user_id: userId,
        email: email,
        name: data.name,
        department: data.department || 'Specialist',
        phone: data.phone || '',
        is_available: true,
        first_login: true
      }]);
      dbError = error;
    }

    if (dbError) {
      console.error("DB insertion error:", dbError);
      // Clean up auth user if DB fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 500 });
    }

    // 4. Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'limbasiyadev2304@gmail.com', 
        pass: process.env.SMTP_PASS || 'yqzbegcwkkcteodo' 
      }
    });

    const portalLink = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000/login';

    const mailOptions = {
      from: `"Cura Command Center" <${process.env.SMTP_USER || 'limbasiyadev2304@gmail.com'}>`,
      to: "limbasiyadev2304@gmail.com", // Temporary intercept for testing
      subject: `Welcome to Cura Health OS - ${role.charAt(0).toUpperCase() + role.slice(1)} Portal`,
      html: `
        <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;max-width:550px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;">
          <div style="background:#143D30;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">🏥 Cura Health OS</h2>
          </div>
          <h3 style="color:#143D30;margin-bottom:12px;font-size:18px;">Account Provisioned</h3>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin-bottom:20px;">
            Your ${role} profile has been successfully integrated into the clinical command network.
          </p>
          <div style="background:#ffffff;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <p style="margin:0 0 12px 0;font-size:14px;"><strong>Portal URL:</strong> <a href="${portalLink}">${portalLink}</a></p>
            <p style="margin:0 0 12px 0;font-size:14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0;font-size:14px;"><strong>Temporary Password:</strong> <span style="font-family:monospace;background:#f1f5f9;padding:4px 8px;border-radius:4px;letter-spacing:1px;font-weight:bold;">${tempPassword}</span></p>
          </div>
          <p style="color:#ef4444;font-size:12px;font-weight:bold;margin-bottom:24px;">
            For security compliance, you will be required to set a permanent password upon your first login.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Onboarding complete" });
  } catch (err) {
    console.error("Onboard error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
