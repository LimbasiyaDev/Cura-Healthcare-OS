import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req) {
  try {
    const { pdfBase64, patientName, patientPhone, doctorId } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF provided" }, { status: 400 });
    }

    // Expiration: 48 hours from now
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Insert draft PDF securely into shared_prescriptions table
    const { data: shareData, error: dbErr } = await supabase
      .from('shared_prescriptions')
      .insert([{
        patient_name: patientName || 'Patient',
        pdf_base64: pdfBase64,
        expires_at: expiresAt
      }])
      .select('id')
      .single();

    if (dbErr) {
      console.error("Supabase secure share error:", dbErr.message);
      throw new Error("Failed to secure prescription payload: " + dbErr.message);
    }

    const shareId = shareData.id;

    // Secure link URL
    const hostUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';
    const secureLink = `${hostUrl}/secure-rx?id=${shareId}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'limbasiyadev2304@gmail.com', 
        pass: process.env.EMAIL_APP_PASSWORD || 'comd dzfh rdnh jzmj' 
      }
    });

    const mailOptions = {
      from: `"Cura Hospital Secure Portal" <${process.env.EMAIL_USER || 'limbasiyadev2304@gmail.com'}>`,
      to: 'limbasiyadev2304@gmail.com',
      subject: `SECURE Prescription: ${patientName || 'Patient'}`,
      text: `Hello Pharmacy,\n\nA new secure prescription has been generated for patient ${patientName || 'Patient'}.\n\nPlease access the prescription securely via this link: ${secureLink}\n\nThis link will expire in 48 hours and all access is audited.\n\nRegards,\nCura Hospital System`,
      html: `
        <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;max-width:550px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;">
          <div style="background:#143D30;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">🏥 Cura Secure Portal</h2>
          </div>
          <h3 style="color:#143D30;margin-bottom:12px;font-size:18px;">Secure Prescription Access</h3>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin-bottom:20px;">
            A secure digital prescription has been created for patient <strong>${patientName || 'Patient'}</strong>. 
            Under HIPAA guidelines, this medical record is protected. Please click the button below to view or print it over a secure HTTPS connection.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${secureLink}" style="background:#143D30;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(20,61,48,0.15);font-size:14px;">
              Access Secure Prescription
            </a>
          </div>
          <div style="height:1px;background:#e5e7eb;margin:24px 0;"></div>
          <p style="font-size:11px;color:#9ca3af;line-height:1.5;margin:0;text-align:center;">
            This link is secure, HIPAA-compliant, and will expire automatically in 48 hours (after which the record is deleted). 
            Access to this prescription link is monitored and recorded in our security audits.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Create entry in audit_logs
    try {
      await supabase.from('audit_logs').insert([{
        actor_id: doctorId || 'doctor_portal',
        actor_role: 'doctor',
        action_type: 'EXPORT_PHI',
        phi_category: 'prescriptions',
        patient_identifier: patientPhone || 'unknown',
        description: `Prescription securely shared with pharmacy via expiring link for patient: ${patientName}`
      }]);
    } catch (auditErr) {
      console.error("Audit logging failed inside send-pharmacy API:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Email secure link sent successfully" });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
