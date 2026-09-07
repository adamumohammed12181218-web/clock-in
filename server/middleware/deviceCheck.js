const supabase = require('../db/supabase');

/**
 * Extracts the real client IP address, accounting for proxies.
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

// Physical MAC addresses require a trusted app, extension, or gateway.
function getClientMAC(req) {
  const value = req.headers['x-device-mac'] || req.headers['x-client-mac'];
  return value ? String(value).trim().toUpperCase() : null;
}

/**
 * Middleware: validates the request comes from the student's registered device.
 *
 * Rules:
 *  - If BOTH registered_ip and device_fingerprint are null/empty → allow (first-time or seeded test accounts)
 *  - In development mode (NODE_ENV !== 'production') → always allow, just log
 *  - Otherwise: a registered MAC must match; legacy records fall back to IP or fingerprint
 */
async function validateDevice(req, res, next) {
  const clientIP    = getClientIP(req);
  const clientMAC   = getClientMAC(req);
  const fingerprint = req.body?.fingerprint || req.headers['x-device-fingerprint'] || null;

  req.clientIP    = clientIP;
  req.clientMAC   = clientMAC;
  req.fingerprint = fingerprint;

  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

  // ── In development, skip strict device binding ──────────────────
  // This lets seeded test accounts and Live-Server dev sessions work freely.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DeviceCheck] DEV MODE — skipping strict check for student ${studentId} from ${clientIP}`);
    return next();
  }

  // ── Production: fetch student device info ───────────────────────
  const { data: student, error } = await supabase
    .from('students')
    .select('id, registered_ip, registered_mac, device_fingerprint, is_active')
    .eq('id', studentId)
    .single();

  if (error || !student) return res.status(404).json({ error: 'Student not found' });

  if (!student.is_active) {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact admin.' });
  }

  // If no device was registered yet → allow through and register this device
  if (!student.registered_ip && !student.registered_mac && !student.device_fingerprint) {
    // Update the student record with their current device
    await supabase
      .from('students')
      .update({ registered_ip: clientIP, registered_mac: clientMAC, device_fingerprint: fingerprint })
      .eq('id', studentId);
    return next();
  }

  const ipMatch = student.registered_ip === clientIP;
  const macMatch = student.registered_mac && clientMAC
    ? student.registered_mac === clientMAC
    : false;
  const fpMatch = student.device_fingerprint && fingerprint
    ? student.device_fingerprint === fingerprint
    : false;
  const deviceMatch = student.registered_mac
    ? macMatch
    : ipMatch || fpMatch;

  if (!deviceMatch) {
    console.warn(`[DeviceCheck] BLOCKED student ${studentId}: expected IP=${student.registered_ip} MAC=${student.registered_mac || 'none'} got IP=${clientIP} MAC=${clientMAC || 'none'}`);
    return res.status(403).json({
      error: 'Device not recognized. You must clock in from your registered device.',
      code:  'DEVICE_MISMATCH'
    });
  }

  next();
}

module.exports = { validateDevice, getClientIP, getClientMAC };
