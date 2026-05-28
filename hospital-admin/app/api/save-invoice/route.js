import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service key to bypass RLS for insertions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(req) {
  try {
    // SECURITY CHECK: Verify the request comes from an authenticated user (doctor)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const {
      invoice_num,
      doctor_id,
      patient_name,
      patient_phone,
      patient_id,
      visit_date,
      due_date,
      facility,
      items,
      subtotal,
      tax,
      insurance_adj,
      discount,
      total,
      payment_status,
      insurance_provider,
      notes,
    } = body;

    if (!invoice_num || !patient_phone || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_num,
        doctor_id:          doctor_id || null,
        patient_name:       patient_name || null,
        patient_phone:      patient_phone,
        patient_id:         patient_id || null,
        visit_date:         visit_date || null,
        due_date:           due_date || null,
        facility:           facility || null,
        items:              items || [],
        subtotal:           subtotal || 0,
        tax:                tax || 0,
        insurance_adj:      insurance_adj || 0,
        discount:           discount || 0,
        total:              total || 0,
        payment_status:     payment_status || 'Pending',
        insurance_provider: insurance_provider || null,
        notes:              notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, invoice: data });
  } catch (err) {
    console.error('[save-invoice]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
