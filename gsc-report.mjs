  import { readFileSync } from 'fs';
  import { createSign } from 'crypto';

  const SITE_URL = 'sc-domain:simplefileupload.com';
  const CREDENTIALS_PATH = new URL('./gsc-credentials.json', import.meta.url).pathname;

  function createJWT(credentials) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    })).toString('base64url');
    const sign = createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(credentials.private_key, 'base64url');
    return `${header}.${payload}.${signature}`;
  }

  async function getAccessToken(credentials) {
    const jwt = createJWT(credentials);
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    const data = await res.json();
    if (!data.access_token) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
    return data.access_token;
  }

  async function fetchSearchAnalytics(accessToken, days = 28) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    const fmt = d => d.toISOString().split('T')[0];

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 50
        })
      }
    );

    return res.json();
  }

  async function main() {
    const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const accessToken = await getAccessToken(credentials);

    const data = await fetchSearchAnalytics(accessToken, 28);
    const rows = data.rows || [];

    // Output raw data
    console.log('GSC DATA (last 28 days) - simplefileupload.com\n');
    rows.forEach(r => {
      console.log(`${r.keys[0].padEnd(45)} | Clicks: ${r.clicks} | Impressions: ${r.impressions} | CTR: ${(r.ctr *
  100).toFixed(1)}% | Position: ${r.position.toFixed(1)}`);
    });

    // Output the prompt for Claude
    console.log('\n---\n');
    console.log(`Analyze this Google Search Console data for simplefileupload.com:

  Identify:
  1. WINNERS: Keywords where position improved 3+ spots vs last period
  2. LOSERS: Keywords where position dropped 3+ spots
  3. QUICK WINS: Keywords ranking 8-15 that could hit page 1 with optimization
  4. CTR OPPORTUNITIES: High impressions, low CTR (title tag candidates)

  For each, give specific action items. Be concise.`);
  }

  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
