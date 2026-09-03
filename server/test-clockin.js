require('dotenv').config();
const http = require('http');
const fs   = require('fs');

const log = [];
const out = (msg) => { log.push(msg); };

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000, path: '/api' + path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token   ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  out('=== CLOCK-IN TEST ===');

  // 1. Login
  out('\n[1] Login john@oasis.com');
  const lr = await request('POST', '/auth/login', { email:'john@oasis.com', password:'Student@1234', role:'student' });
  out(`    Status: ${lr.status}`);
  if (lr.status !== 200) { out('    FAIL: ' + JSON.stringify(lr.body)); fs.writeFileSync('test-result.txt', log.join('\n')); process.exit(1); }
  const { token, user } = lr.body;
  out(`    Name:        ${user.full_name}`);
  out(`    clock_in_id: ${user.clock_in_id}`);
  out(`    id:          ${user.id}`);

  // 2. Clock-in
  out('\n[2] Clock-in');
  const ci = await request('POST', '/attendance/clock-in', { clock_in_id: user.clock_in_id, fingerprint: 'node-test' }, token);
  out(`    Status: ${ci.status}`);
  out(`    Body:   ${JSON.stringify(ci.body)}`);

  // 3. Clock-out
  out('\n[3] Clock-out');
  const co = await request('POST', '/attendance/clock-out', {}, token);
  out(`    Status: ${co.status}`);
  out(`    Body:   ${JSON.stringify(co.body)}`);

  // 4. Fetch records
  out('\n[4] My attendance');
  const ar = await request('GET', '/attendance/my', null, token);
  out(`    Status: ${ar.status}`);
  const recs = ar.body?.attendance || [];
  out(`    Records: ${recs.length}`);
  recs.slice(0,3).forEach(r => out(`    > ${r.date} | in:${r.clock_in_time||'null'} out:${r.clock_out_time||'null'} status:${r.status}`));

  // 5. Stats
  out('\n[5] Stats');
  const st = await request('GET', '/attendance/stats/me', null, token);
  out(`    Status: ${st.status}`);
  out(`    Body:   ${JSON.stringify(st.body)}`);

  out('\n=== DONE ===');
  fs.writeFileSync('test-result.txt', log.join('\n'));
  console.log('Written to test-result.txt');
  process.exit(0);
}

run().catch(e => { fs.writeFileSync('test-result.txt', 'FATAL: '+e.message); process.exit(1); });
