require('dotenv').config({ path: './hospital-admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  // Check all prescriptions for this patient (NOT access requests)
  const { data, error } = await supabaseAdmin
    .from('prescriptions')
    .select('id, diagnosis, patient_phone, status, doctor_id, date')
    .neq('diagnosis', 'MEDICAL_ACCESS_REQUEST');
  
  console.log('All real prescriptions:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}
run();
