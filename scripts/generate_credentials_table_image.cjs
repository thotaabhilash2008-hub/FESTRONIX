const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const data = [
  { dept: 'ECE', name: 'R Phani Vidyadhar', email: 'rphaniv@vardhaman.org', user: 'phaniv_ece', pass: 'ece@12345678  |  ece2026  |  phaniv2026  |  8801333811', badge: '#38BDF8' },
  { dept: 'MECHANICAL', name: 'B Dhanraj', email: 'dhanraj2205@vardhaman.org', user: 'dhanraj_mech', pass: 'mech@12345678  |  mech2026  |  dhanraj2026  |  9441381799', badge: '#FB923C' },
  { dept: 'EEE', name: 'S Vinod Reddy', email: 's.vinodreddy@vardhaman.org', user: 'vinodreddy_eee', pass: 'eee@12345678  |  eee2026  |  vinodreddy2026  |  8125421181', badge: '#FACC15' },
  { dept: 'CSD (Data Science)', name: 'V Vinod Kumar', email: 'vinodkumar1807@vardhaman.org', user: 'vinodkumar_csd', pass: 'csd@12345678  |  csd2026  |  vinodkumar2026  |  8897715060', badge: '#A855F7' },
  { dept: 'CSE (Cluster 1)', name: 'BJV Varma', email: 'varma@vardhaman.org', user: 'varma_cse', pass: 'cse@12345678  |  cse2026  |  varma2026  |  8143275536', badge: '#60A5FA' },
  { dept: 'CSE (Cluster 2)', name: 'Ch Bala Subramanyam', email: 'balu1681@vardhaman.org', user: 'balu_cse', pass: 'cse@12345678  |  cse2026  |  balu2026  |  8184864242', badge: '#60A5FA' },
  { dept: 'CSE (Cluster 3)', name: 'M Raghavendra', email: 'raghavendra1797@vardhaman.org', user: 'raghavendra_cse', pass: 'cse@12345678  |  cse2026  |  raghavendra2026  |  6303169820', badge: '#60A5FA' },
  { dept: 'IT', name: 'P Dastagiri Reddy', email: 'dastagiri1918@vardhaman.org', user: 'dastagiri_it', pass: 'it@12345678  |  it2026  |  dastagiri2026  |  9966676005', badge: '#34D399' },
  { dept: 'CIVIL', name: 'K Chaitanya', email: 'chaitanya_vce1658@vardhaman.org', user: 'chaitanya_civil', pass: 'civil@12345678  |  civil2026  |  chaitanya2026  |  7416413410', badge: '#F472B6' },
  { dept: 'CSM (AI &amp; ML)', name: 'P Rajashekar', email: 'rajashekhar1833@vardhaman.org', user: 'rajashekhar_csm', pass: 'csm@12345678  |  csm2026  |  rajashekhar2026  |  7386407609', badge: '#818CF8' },
  { dept: 'MBA', name: 'Prof. R. L. Narayana', email: 'mba.festronix@vardhaman.org', user: 'hod_mba', pass: 'mba@12345678  |  mba2026  |  festcoord2026  |  9848022008', badge: '#E879F9' },
  { dept: 'Super Admin / SAC', name: 'Md. Asif (Dean SAC)', email: 'dean.sac@vardhaman.org', user: 'dean_sac', pass: 'dean@12345678  |  asif@12345678  |  deansac2026  |  asif2026', badge: '#F59E0B' },
  { dept: 'CONNECT Club', name: 'Core Leadership', email: 'connect.club@vardhaman.org', user: 'connect_club', pass: 'connect@12345678  |  cc@12345678  |  connect2026  |  cc2026', badge: '#EC4899' },
  { dept: 'Vencorpia', name: 'Executive Board', email: 'vencorpia@vardhaman.org', user: 'vencorpia', pass: 'vencorpia2026  |  vencorpia@12345678  |  admin2026', badge: '#10B981' },
  { dept: 'Central Admin', name: 'System Admin', email: 'admin@gmail.com', user: 'admin', pass: 'admin@12345678  |  admin2026  |  admin123', badge: '#6366F1' }
];

const width = 1660;
const rowHeight = 52;
const headerY = 175;
const startY = headerY + 45;
const height = startY + data.length * rowHeight + 60;

// Columns
const c0 = 55;   // Dept
const c1 = 265;  // Name
const c2 = 525;  // Email
const c3 = 865;  // Username
const c4 = 1055; // Passwords

let rowsSvg = '';
data.forEach((r, i) => {
  const y = startY + i * rowHeight;
  const isEven = i % 2 === 0;
  const bg = isEven ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.012)';
  
  rowsSvg += `
    <rect x="${c0 - 15}" y="${y}" width="${width - 80}" height="${rowHeight - 4}" rx="8" fill="${bg}" />
    <text x="${c0}" y="${y + 29}" fill="${r.badge}" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">${r.dept}</text>
    <text x="${c1}" y="${y + 29}" fill="#F1F5F9" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="600" font-size="14">${r.name}</text>
    <text x="${c2}" y="${y + 29}" fill="#93C5FD" font-family="'Consolas', 'Courier New', monospace" font-size="13.5">${r.email}</text>
    <text x="${c3}" y="${y + 29}" fill="#FCD34D" font-family="'Consolas', 'Courier New', monospace" font-weight="600" font-size="13.5">${r.user}</text>
    <text x="${c4}" y="${y + 29}" fill="#34D399" font-family="'Consolas', 'Courier New', monospace" font-weight="600" font-size="13">${r.pass}</text>
  `;
});

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C16" />
      <stop offset="50%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#040711" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#818CF8" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
  
  <!-- Outer Frame -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="16" fill="none" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.5" />

  <!-- Top Accent Bar -->
  <rect x="25" y="25" width="${width - 50}" height="4" rx="2" fill="url(#accentGrad)" />

  <!-- Header Section -->
  <g transform="translate(50, 60)">
    <rect x="0" y="0" width="48" height="48" rx="12" fill="#1E3A8A" />
    <path d="M24 10 L35 15 L35 25 C35 32 29 37 24 39 C19 37 13 32 13 25 L13 15 Z" fill="#38BDF8" />
    <path d="M20 24 L23 27 L28 21" stroke="#080C16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    
    <text x="64" y="24" fill="#FFFFFF" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="800" font-size="24" letter-spacing="1">FESTRONIX '26 • OFFICIAL STAFF &amp; COORDINATOR CREDENTIALS</text>
    <text x="64" y="44" fill="#94A3B8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="14">Vardhaman College of Engineering • Single Sign-On &amp; Portal Authentication Directory</text>
  </g>

  <!-- Table Header Bar -->
  <rect x="${c0 - 15}" y="${headerY}" width="${width - 80}" height="38" rx="8" fill="#1E293B" />
  <text x="${c0}" y="${headerY + 24}" fill="#94A3B8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5">DEPARTMENT / ROLE</text>
  <text x="${c1}" y="${headerY + 24}" fill="#94A3B8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5">STAFF COORDINATOR</text>
  <text x="${c2}" y="${headerY + 24}" fill="#94A3B8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5">EMAIL / GMAIL</text>
  <text x="${c3}" y="${headerY + 24}" fill="#94A3B8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5">USERNAME</text>
  <text x="${c4}" y="${headerY + 24}" fill="#94A3B8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5">WORKING PASSWORDS</text>

  <!-- Rows -->
  ${rowsSvg}

  <!-- Footer note -->
  <text x="${c0}" y="${height - 38}" fill="#64748B" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="12.5">
    * Department format (dept@12345678 or dept2026), phone number, and personal coordinator passcodes are all verified and active.
  </text>
</svg>
`;

async function run() {
  const buf = Buffer.from(svg);
  const outPath1 = path.join(__dirname, '..', 'public', 'festronix_coordinator_credentials.png');
  const artifactDir = 'C:\\Users\\thota\\.gemini\\antigravity\\brain\\6732601b-1361-4153-9d87-12a4dfe599e9';
  const outPath2 = path.join(artifactDir, 'festronix_coordinator_credentials.png');

  await sharp(buf).png({ quality: 95 }).toFile(outPath1);
  console.log('Saved to:', outPath1);
  await sharp(buf).png({ quality: 95 }).toFile(outPath2);
  console.log('Saved to artifact:', outPath2);
}

run();
