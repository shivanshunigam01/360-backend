require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.API_BASE || process.env.VITE_API_URL || 'http://localhost:5000';

function requestJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const body = opts.body ? JSON.stringify(opts.body) : null;
      const headers = Object.assign({}, opts.headers || {});
      if (body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

      const req = lib.request(
        url,
        {
          method: opts.method || 'GET',
          headers,
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, body: json });
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function run() {
  try {
    console.log('Requesting test token...');
    const tokenRes = await requestJson(`${BASE}/api/auth/test-token`);
    if (tokenRes.status >= 400) throw new Error(tokenRes.body.message || 'Failed to get token');
    const token = tokenRes.body.token;
    console.log('Got token for user:', tokenRes.body.user?.email);

    // Create new job card with minimal data (customer = Avani)
    const createPayload = {
      title: 'AC Repair - Avani',
      customer: 'Avani',
      vehicle: 'Swift',
      regNo: 'MH01AV1234',
      concerns: 'AC not cooling',
    };

    console.log('Creating job card for customer Avani...');
    const createRes = await requestJson(`${BASE}/api/jobcards`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: createPayload,
    });
    if (createRes.status >= 400) throw new Error(createRes.body.message || 'Create failed');
    const created = createRes.body;
    console.log('Created job card id:', created._id || created.id);

    const id = created._id || created.id;

    // Now update the job to add full details
    const updatePayload = {
      title: 'AC Repair - Avani (updated)',
      customer: 'Avani',
      vehicleMake: 'Maruti',
      vehicle: 'Swift',
      regNo: 'MH01AV1234',
      vin: 'VIN1234567890',
      odometer: 45000,
      mobile: '9999999999',
      email: 'avani@example.com',
      concerns: 'AC not cooling; compressor noise',
      advisor: 'Amit Shah',
      advance: 5000,
      insurance: 'ABC Insurance - Policy 1234',
      status: 'in_progress',
    };

    console.log('Updating job card with full details...');
    const updateRes = await requestJson(`${BASE}/api/jobcards/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: updatePayload,
    });
    if (updateRes.status >= 400) throw new Error(updateRes.body.message || 'Update failed');
    console.log('Updated job card id:', updateRes.body._id || updateRes.body.id);

    // Fetch to confirm
    console.log('Fetching job card to confirm...');
    const getRes = await requestJson(`${BASE}/api/jobcards/${id}`);
    if (getRes.status >= 400) throw new Error(getRes.body.message || 'Get failed');

    console.log('Final job card record:');
    console.log(JSON.stringify(getRes.body, null, 2));

    console.log('Done.');
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
}

run();
