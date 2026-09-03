const supabase = require('../db/supabase');
const { generateQRToken } = require('../utils/tokenHelper');
const { generateQRCode } = require('../utils/qrGenerator');

// ─────────────────────────────────────────────────────────────────
// LOCATIONS
// ─────────────────────────────────────────────────────────────────

async function createLocation(req, res) {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (!name) return res.status(400).json({ error: 'Location name is required' });

    const { data, error } = await supabase
      .from('locations')
      .insert({ name, address, latitude, longitude, created_by: req.user.id })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to create location' });

    return res.status(201).json({ message: 'Location created', location: data });
  } catch (err) {
    console.error('createLocation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateLocation(req, res) {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to update location' });

    return res.json({ message: 'Location updated', location: data });
  } catch (err) {
    console.error('updateLocation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLocations(req, res) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch locations' });

    return res.json({ locations: data || [] });
  } catch (err) {
    console.error('getLocations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────
// QR CODES
// ─────────────────────────────────────────────────────────────────

async function generateDailyQR(req, res) {
  try {
    const { location_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!location_id) return res.status(400).json({ error: 'location_id is required' });

    // Verify location exists
    const { data: location } = await supabase
      .from('locations')
      .select('id, name')
      .eq('id', location_id)
      .eq('is_active', true)
      .single();

    if (!location) return res.status(404).json({ error: 'Location not found or inactive' });

    // Deactivate any existing QR for today
    await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('valid_date', today);

    // Create new QR token
    const token = generateQRToken();

    // QR expires at end of day (23:59:59)
    const expiresAt = new Date(`${today}T23:59:59`).toISOString();

    const { data: qrRecord, error } = await supabase
      .from('qr_codes')
      .insert({
        location_id,
        token,
        valid_date: today,
        expires_at: expiresAt,
        created_by: req.user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to generate QR code' });

    // Build the payload that the QR code will encode
    const qrPayload = JSON.stringify({
      token,
      location_id,
      date: today
    });

    const qrImage = await generateQRCode(qrPayload);

    return res.status(201).json({
      message: 'QR code generated successfully',
      qr: {
        id: qrRecord.id,
        token,
        valid_date: today,
        expires_at: expiresAt,
        location: location.name,
        image: qrImage  // base64 PNG data URL
      }
    });
  } catch (err) {
    console.error('generateDailyQR error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTodayQR(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, token, valid_date, expires_at, is_active, locations(name, address)')
      .eq('valid_date', today)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'No QR code generated for today yet.' });
    }

    const qrPayload = JSON.stringify({
      token: data.token,
      location_id: data.locations?.id,
      date: today
    });

    const qrImage = await generateQRCode(qrPayload);

    return res.json({ qr: { ...data, image: qrImage } });
  } catch (err) {
    console.error('getTodayQR error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────
// STUDENTS (admin management)
// ─────────────────────────────────────────────────────────────────

async function getAllStudents(req, res) {
  try {
    const { search, is_active, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('students')
      .select('id, full_name, student_number, email, phone, clock_in_id, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,student_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error, count } = await query;

    if (error) return res.status(500).json({ error: 'Failed to fetch students' });

    return res.json({ total: count, page: Number(page), limit: Number(limit), students: data || [] });
  } catch (err) {
    console.error('getAllStudents error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function toggleStudentStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from('students')
      .update({ is_active })
      .eq('id', id)
      .select('id, full_name, is_active')
      .single();

    if (error) return res.status(500).json({ error: 'Failed to update student' });

    return res.json({
      message: `Student ${is_active ? 'activated' : 'deactivated'} successfully`,
      student: data
    });
  } catch (err) {
    console.error('toggleStudentStatus error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [studentsRes, todayRes, totalAttRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today),
      supabase.from('attendance').select('id', { count: 'exact' })
    ]);

    return res.json({
      stats: {
        total_active_students: studentsRes.count || 0,
        present_today: todayRes.count || 0,
        total_attendance_records: totalAttRes.count || 0
      }
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Working days configuration
async function getWorkingDays(req, res) {
  try {
    const { data, error } = await supabase
      .from('working_days')
      .select('*')
      .order('day_of_week');

    if (error) return res.status(500).json({ error: 'Failed to fetch working days' });

    return res.json({ working_days: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateWorkingDays(req, res) {
  try {
    const { working_days } = req.body; // array of { day_of_week, is_working }

    if (!Array.isArray(working_days)) {
      return res.status(400).json({ error: 'working_days must be an array' });
    }

    for (const day of working_days) {
      await supabase
        .from('working_days')
        .update({ is_working: day.is_working })
        .eq('day_of_week', day.day_of_week);
    }

    return res.json({ message: 'Working days updated successfully' });
  } catch (err) {
    console.error('updateWorkingDays error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createLocation,
  updateLocation,
  getLocations,
  generateDailyQR,
  getTodayQR,
  getAllStudents,
  toggleStudentStatus,
  getDashboardStats,
  getWorkingDays,
  updateWorkingDays
};
