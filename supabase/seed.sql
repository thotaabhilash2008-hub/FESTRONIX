-- ============================================================
-- FESTRONIX SEED DATA
-- Run AFTER schema.sql and rls_policies.sql
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO public.departments (id, code, name, description, chief_coordinator, contact, icon_name) VALUES
  (uuid_generate_v4(), 'CSE', 'Computer Science & Engineering', 'Flagship AI, algorithmic coding, cybersecurity, and full-stack software innovation.', 'Dr. K. S. Reddy', 'cse.festronix@vardhaman.org', 'Cpu'),
  (uuid_generate_v4(), 'IT', 'Information Technology', 'Cloud systems, web3 networks, distributed computing, and generative tech.', 'Prof. Anitha Sharma', 'it.festronix@vardhaman.org', 'Globe'),
  (uuid_generate_v4(), 'ECE', 'Electronics & Communication', 'Robotics, IoT circuits, signal processing, embedded architectures, and antenna design.', 'Dr. M. V. Ramana', 'ece.festronix@vardhaman.org', 'Radio'),
  (uuid_generate_v4(), 'EEE', 'Electrical & Electronics', 'Electric mobility, green energy grids, power systems, and automation logic.', 'Dr. B. Srinivas', 'eee.festronix@vardhaman.org', 'Zap'),
  (uuid_generate_v4(), 'MECH', 'Mechanical Engineering', 'CAD/CAM design, drone dynamics, RC racing, and 3D additive manufacturing.', 'Dr. C. H. Rao', 'mech.festronix@vardhaman.org', 'Wrench'),
  (uuid_generate_v4(), 'CIVIL', 'Civil Engineering', 'Smart city modeling, seismic structural design, and bridge load-testing.', 'Prof. P. Sunitha', 'civil.festronix@vardhaman.org', 'Building'),
  (uuid_generate_v4(), 'AI&ML', 'Artificial Intelligence & Machine Learning', 'Deep neural networks, computer vision, robotics RL, and LLM autonomous agents.', 'Dr. V. Prasad', 'aiml.festronix@vardhaman.org', 'Brain'),
  (uuid_generate_v4(), 'MBA', 'Management & Humanities', 'Venture pitch deck, corporate crisis simulations, and fintech trading floors.', 'Prof. R. L. Narayana', 'mba.festronix@vardhaman.org', 'Briefcase')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- EVENTS
-- ============================================================
INSERT INTO public.events (slug, title, department_code, category, format, min_team_size, max_team_size, fee, capacity, registered_count, deadline, date_display, time_display, venue, description, rules, prizes, eligibility, coordinator_name, coordinator_phone, coordinator_email, status, banner_gradient) VALUES
(
  'hack-the-future-24h',
  'CodeSphere: 24-Hour National Hackathon',
  'CSE', 'hackathon', 'team', 2, 4, 300, 60, 0,
  '2026-10-24 23:59:00+05:30',
  'Oct 28-29, 2026', '10:00 AM - 10:00 AM (24 Hours)',
  'CSE Turing Innovation Center, VCE Campus',
  'The premier national 24-hour hackathon where top minds architect AI, Web3, or Cyber-physical prototypes under high octane mentorship.',
  '["Team size: 2 to 4 members from any AICTE-recognized institution.", "All code must be written within the hackathon window; existing projects are disqualified.", "APIs, open-source libraries, and AI co-pilots are allowed with transparent declaration.", "Evaluation criteria: Innovation (30%), Technical Execution (30%), UI/UX (20%), Pitch (20%)."]'::jsonb,
  '{"first": "₹50,000 + Tech Incubation Grant", "second": "₹25,000 + Vouchers", "third": "₹10,000"}'::jsonb,
  'Open to all B.Tech / M.Tech / MCA / Degree students with valid college ID.',
  'Rohit Kulkarni', '+91 98480 11223', 'rohit.k@vardhaman.org',
  'open', 'linear-gradient(135deg, #00f0ff 0%, #7928ca 100%)'
),
(
  'robo-wars-colosseum',
  'RoboWars: Steel Gladiators Combat',
  'ECE', 'technical', 'team', 2, 5, 400, 32, 0,
  '2026-10-25 18:00:00+05:30',
  'Oct 28, 2026', '11:30 AM - 04:30 PM',
  'Central Open Air Theatre (OAT) Arena',
  'Remote-controlled combat battlebots face off in a reinforced bulletproof steel arena with fire hazards, flippers, and spinners.',
  '["Bot weight class: 15kg and 30kg categories.", "Active weapons mandatory (spinners, lifters, pneumatic hammers). No EMP or chemical fluids.", "Match duration: 3 minutes rounds. Knockout or judge score calculation.", "All bots must have remote radio fail-safe switches."]'::jsonb,
  '{"first": "₹40,000 + Trophy", "second": "₹20,000", "third": "₹8,000"}'::jsonb,
  'Engineering undergraduates and polytechnic innovators.',
  'Sanjay Varma', '+91 98765 43210', 'sanjay.v@vardhaman.org',
  'open', 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)'
),
(
  'ai-prompt-engineering-showdown',
  'PromptMatrix: Autonomous AI Agents & Vision',
  'AI&ML', 'technical', 'duo', 1, 2, 150, 80, 0,
  '2026-10-26 12:00:00+05:30',
  'Oct 29, 2026', '01:30 PM - 03:30 PM',
  'Aryabhata Computing Lab 4, Block 2',
  'Solve real-world multi-modal visual synthesis, complex logic extraction, and jailbreak defense challenges with cutting-edge LLMs and vision transformers.',
  '["Solo or Duo participation permitted.", "Participants will be provided sandboxed API keys and compute environments.", "Scoring based on output benchmark accuracy, token efficiency, and prompt latency."]'::jsonb,
  '{"first": "₹20,000 + AI Cloud Credits", "second": "₹10,000", "third": "₹5,000"}'::jsonb,
  'Open to all registered tech students.',
  'Divya Sri', '+91 94401 23456', 'divyasri.aiml@vardhaman.org',
  'open', 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
),
(
  'valorant-championship-festronix',
  'Apex Arena: Valorant 5v5 Tactical Championship',
  'IT', 'gaming', 'team', 5, 5, 500, 24, 0,
  '2026-10-23 20:00:00+05:30',
  'Oct 28-29, 2026', '10:00 AM Onwards',
  'VCE E-Sports Arena, High Performance Lab',
  'High-stakes LAN esports tournament on 240Hz monitors with custom lobbies, live casters, and tournament streaming.',
  '["5 players per squad. Standard competitive tournament ruleset.", "Single elimination preliminary; Best-of-3 semifinals and Grand Finale.", "Anti-cheat and toxic conduct enforcement strictly active."]'::jsonb,
  '{"first": "₹30,000 + Pro Gaming Peripherals", "second": "₹15,000"}'::jsonb,
  'All students with valid college ID.',
  'Karthik Teja', '+91 90001 98877', 'karthik.t@vardhaman.org',
  'open', 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
),
(
  'ev-powertrain-masterclass',
  'EV Architecture & Battery BMS Hands-on Workshop',
  'EEE', 'workshop', 'individual', 1, 1, 200, 100, 0,
  '2026-10-27 10:00:00+05:30',
  'Oct 28, 2026', '09:30 AM - 01:00 PM',
  'Auditorium 1, Main Administrative Building',
  'Industrial masterclass on lithium-ion cell thermal management, regenerative braking systems, and micro-controller hardware programming.',
  '["Hands-on workshop kit provided to participants.", "Official industry certificate issued by IEEE and SAC."]'::jsonb,
  '{"first": "Certificate of Excellence + Hardware Dev Board"}'::jsonb,
  'All engineering disciplines.',
  'Ramesh Chander', '+91 91234 56789', 'ramesh.eee@vardhaman.org',
  'open', 'linear-gradient(135deg, #eab308 0%, #f97316 100%)'
),
(
  'bridge-craft-structural-challenge',
  'Bridge-Craft: Seismic Truss Loading Challenge',
  'CIVIL', 'technical', 'duo', 2, 3, 100, 40, 0,
  '2026-10-26 15:00:00+05:30',
  'Oct 29, 2026', '11:00 AM - 02:00 PM',
  'Strength of Materials Lab, Civil Block',
  'Design and fabricate lightweight balsa/pop-stick bridge structures tested to failure on computerized hydraulic loading rigs.',
  '["Materials provided by organizers on-spot.", "Evaluation based on Load-to-Self-Weight ratio."]'::jsonb,
  '{"first": "₹15,000 + Memento", "second": "₹8,000"}'::jsonb,
  'All students interested in structural mechanics.',
  'Pooja Reddy', '+91 99887 76655', 'pooja.civil@vardhaman.org',
  'open', 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
),
(
  'cad-gladiator-rc-chase',
  'AeroDrone: Autonomous FPV Obstacle Derby',
  'MECH', 'technical', 'team', 2, 3, 250, 25, 0,
  '2026-10-26 23:59:00+05:30',
  'Oct 28, 2026', '02:00 PM - 05:00 PM',
  'Main Sports Complex Cricket Ground',
  'Pilot custom quadcopters through illuminated neon rings, vertical slaloms, and smoke curtains against the clock.',
  '["FPV quadcopters max 5-inch prop diameter or standard 250mm frames.", "Lap timer transponders will be assigned during safety inspection."]'::jsonb,
  '{"first": "₹25,000 + Carbon Fiber Drone Frame Kit", "second": "₹12,000"}'::jsonb,
  'Open to drone hobbyists and students.',
  'Naveen Kumar', '+91 97001 22334', 'naveen.mech@vardhaman.org',
  'open', 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
),
(
  'shark-tank-vardhaman-venture',
  'VentureVortex: Shark Pitch & Angel Sim',
  'MBA', 'non-technical', 'team', 1, 3, 0, 50, 0,
  '2026-10-27 18:00:00+05:30',
  'Oct 29, 2026', '10:00 AM - 01:30 PM',
  'VCE Innovation Cell Boardroom',
  'Pitch disruptive technological startups to real angel investors and venture capitalists. Free registration with seed incubation opportunities.',
  '["5-minute pitch deck followed by 3-minute jury cross-examination.", "Financial projections and MVP prototype demo carry bonus points."]'::jsonb,
  '{"first": "₹35,000 Seed Grant + Incubation", "second": "₹15,000"}'::jsonb,
  'Open to all aspiring student founders.',
  'Aishwarya Rao', '+91 94901 99880', 'aishwarya.mba@vardhaman.org',
  'open', 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
INSERT INTO public.announcements (title, message, type, scope) VALUES
  ('⚡ CodeSphere Hackathon Problem Statements Unveiled!', 'National hackathon track themes in Healthcare AI, CleanTech, and Autonomous Logistics are now published on the portal.', 'urgent', 'fest-wide'),
  ('🏆 Cash Prize Pool Enhanced to ₹5,00,000!', 'SAC Vardhaman has officially increased prize distributions across all 8 engineering departments.', 'prize', 'fest-wide'),
  ('🚌 Free College Transit Shuttles on Fest Days', 'Special VCE AC buses will operate from Shamshabad, Mehdipatnam, LB Nagar, and Secunderabad for external participants.', 'general', 'fest-wide')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard → Storage)
-- Or use SQL:
-- ============================================================
-- Note: Storage bucket creation via SQL may need to be done manually
-- in the Supabase Dashboard → Storage → Create new bucket:
--   1. "payment-screenshots" — Private bucket
--   2. "certificates" — Private bucket
