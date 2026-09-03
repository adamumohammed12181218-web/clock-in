/**
 * seed-students.js — Creates 3 test student accounts
 * Run with:  node seed-students.js
 */
require('dotenv').config();
const bcrypt   = require('bcryptjs');
const supabase = require('./db/supabase');
const { generateClockInId } = require('./utils/tokenHelper');

const students = [
  {
    full_name:      'John Doe',
    student_number: 'STU-001',
    email:          'john@oasis.com',
    phone:          '+27 11 000 0001',
    password:       'Student@1234',
  },
  {
    full_name:      'Jane Smith',
    student_number: 'STU-002',
    email:          'jane@oasis.com',
    phone:          '+27 11 000 0002',
    password:       'Student@1234',
  },
  {
    full_name:      'Bob Intern',
    student_number: 'STU-003',
    email:          'bob@oasis.com',
    phone:          '+27 11 000 0003',
    password:       'Student@1234',
  },
];

async function seed() {
  console.log('\n🌱  Seeding test students...\n');

  for (const s of students) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .or(`email.eq.${s.email},student_number.eq.${s.student_number}`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipped   ${s.full_name} — already exists`);
      continue;
    }

    const password_hash = await bcrypt.hash(s.password || 'unused', 12);
    const clock_in_id   = generateClockInId();

    const { data, error } = await supabase
      .from('students')
      .insert({
        full_name:          s.full_name,
        student_number:     s.student_number,
        email:              s.email.toLowerCase(),
        phone:              s.phone,
        password_hash,       // kept for schema compatibility but not used for login
        clock_in_id,
        registered_ip:      null,   // will be set on first login
        device_fingerprint: null,   // will be set on first login
        is_active:          true,
      })
      .select('id, full_name, email, student_number, clock_in_id')
      .single();

    if (error) {
      console.error(`❌  Failed    ${s.full_name}:`, error.message);
    } else {
      console.log(`✅  Created   ${data.full_name}`);
      console.log(`    Email:       ${data.email}`);
      console.log(`    Password:    ${s.password}`);
      console.log(`    Student #:   ${data.student_number}`);
      console.log(`    Clock-In ID: ${data.clock_in_id}\n`);
    }
  }

  console.log('🎉  Done! You can now log in with any of these accounts.\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
