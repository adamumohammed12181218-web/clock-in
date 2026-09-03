require('dotenv').config();
const supabase = require('./db/supabase');
supabase.from('students').select('full_name,email,student_number,clock_in_id').then(({data,error}) => {
  if (error) { console.log('Error:', error.message); }
  else { console.log('\nStudents in database:\n'); data.forEach(s => console.log(`  ${s.full_name} | ${s.email} | ${s.student_number} | Clock-In ID: ${s.clock_in_id}`)); console.log(`\nTotal: ${data.length} student(s)\n`); }
  process.exit(0);
});
