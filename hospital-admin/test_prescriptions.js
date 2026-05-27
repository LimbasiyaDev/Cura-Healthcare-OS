require('dotenv').config({ path: 'hospital-admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('prescriptions').select('*');
  if (error) console.error(error);
  console.log("Found prescriptions:", data.length);
  for (const p of data) {
    if (p.patient_name === 'Sujal' || (p.patient_phone && p.patient_phone.includes('ytshorts'))) {
       console.log(p.id, p.patient_name, p.patient_phone);
    }
  }
}
run();
