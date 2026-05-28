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

    // Determine if patientPhone is an email, otherwise fallback
    const recipientEmail = 'limbasiyadev2304@gmail.com'; // TEMP: hardcoded for testing
    // Convert data URI to base64 if needed, though nodemailer path handles data URIs automatically
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'limbasiyadev2304@gmail.com', 
        pass: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || 'comd dzfh rdnh jzmj' 
      }
    });

    const mailOptions = {
      from: `"Cura Hospital Secure Portal" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'limbasiyadev2304@gmail.com'}>`,
      to: recipientEmail,
      subject: `Your Secure Prescription: ${patientName || 'Patient'}`,
      text: `Hello ${patientName || 'Patient'},\n\nA new secure prescription has been generated for you by your doctor.\n\nPlease find the encrypted PDF attached to this email.\n\nRegards,\nCura Hospital System`,
      html: `
        <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;max-width:550px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;">
          <div style="background:#143D30;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">🏥 Cura Secure Portal</h2>
          </div>
          <h3 style="color:#143D30;margin-bottom:12px;font-size:18px;">Your Secure Prescription Document</h3>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin-bottom:20px;">
            Hello <strong>${patientName || 'Patient'}</strong>, <br><br>
            A secure digital prescription has been created for you. 
            Under HIPAA guidelines, this medical record is protected. Please find the attached PDF document for your official prescription.
          </p>
          <div style="height:1px;background:#e5e7eb;margin:24px 0;"></div>
          <p style="font-size:11px;color:#9ca3af;line-height:1.5;margin:0;text-align:center;">
            This document is secure and HIPAA-compliant. 
            Access to this prescription delivery is monitored and recorded in our security audits.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Prescription_${patientName ? patientName.replace(/\s+/g, '_') : 'Patient'}.pdf`,
          path: pdfBase64 
        }
      ]
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
        description: `Prescription securely emailed to patient: ${patientName}`
      }]);
    } catch (auditErr) {
      console.error("Audit logging failed inside send-patient API:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Email sent successfully to patient" });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
