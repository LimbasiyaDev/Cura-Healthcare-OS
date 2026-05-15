import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { pdfBase64, patientName } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF provided" }, { status: 400 });
    }


    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'limbasiyadev2304@gmail.com', 
        pass: process.env.EMAIL_APP_PASSWORD || 'comd dzfh rdnh jzmj' 
      }
    });

    const mailOptions = {
      from: '"Cura Hospital" <' + (process.env.EMAIL_USER || 'limbasiyadev2304@gmail.com') + '>',
      to: 'limbasiyadev2304@gmail.com',
      subject: `New Prescription: ${patientName || 'Patient'}`,
      text: `Hello Pharmacy,\n\nPlease find the attached prescription for ${patientName || 'the patient'}.\n\nRegards,\nCura Hospital System`,
      attachments: [
        {
          filename: `Prescription_${patientName ? patientName.replace(/\s+/g, '_') : 'Patient'}.pdf`,
          content: pdfBase64.split("base64,")[1] || pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
