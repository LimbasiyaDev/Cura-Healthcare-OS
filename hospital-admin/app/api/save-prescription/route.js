import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { patient_name, patient_phone, doctor_id, date, diagnosis, notes, medicines, tests } = body;

    if (!patient_phone || !diagnosis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        patient_name:  patient_name || null,
        patient_phone: patient_phone,
        doctor_id:     doctor_id || null,
        date:          date || new Date().toISOString().split('T')[0],
        diagnosis:     diagnosis,
        notes:         notes || null,
        medicines:     medicines || [],
        tests:         tests || [],
        status:        'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, prescription: data });
  } catch (err) {
    console.error('[save-prescription]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
