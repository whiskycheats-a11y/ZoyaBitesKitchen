import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing address insertion...');
  const { data, error } = await supabase.from('addresses').insert({
    user_id: 'test-firebase-uid-123',
    address_line: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    label: 'Home',
    is_default: true
  }).select();

  console.log('Data:', data);
  console.log('Error:', error);
}

testInsert();
