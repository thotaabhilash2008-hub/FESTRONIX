import { Department, FestEvent, Announcement, Registration, Team, OrganisationalRoleDefinition } from '../types/festronix';

export const DEPARTMENTS: Department[] = [
  {
    id: 'dept-cse',
    code: 'CSE',
    name: 'Computer Science & Engineering',
    description: 'Flagship AI, algorithmic coding, cybersecurity, and full-stack software innovation.',
    chiefCoordinator: 'M Raghavendra / Ch Bala Subramanyam / BJV Varma',
    contact: 'raghavendra1797@vardhaman.org',
    iconName: 'Cpu'
  },
  {
    id: 'dept-csd',
    code: 'CSD',
    name: 'CSE (Data Science)',
    description: 'Big data pipelines, statistical predictive modeling, data visualization, and intelligence systems.',
    chiefCoordinator: 'V Vinod Kumar',
    contact: 'vinodkumar1807@vardhaman.org',
    iconName: 'Database'
  },
  {
    id: 'dept-csm',
    code: 'CSM',
    name: 'CSE (AI & Machine Learning)',
    description: 'Deep neural networks, computer vision, robotics reinforcement learning, and autonomous LLM agents.',
    chiefCoordinator: 'P Rajashekar',
    contact: 'rajashekhar1833@vardhaman.org',
    iconName: 'Brain'
  },
  {
    id: 'dept-it',
    code: 'IT',
    name: 'Information Technology',
    description: 'Cloud systems, web3 networks, distributed computing, and generative tech infrastructure.',
    chiefCoordinator: 'P Dastagiri Reddy',
    contact: 'dastagiri1918@vardhaman.org',
    iconName: 'Globe'
  },
  {
    id: 'dept-mechanical',
    code: 'MECHANICAL',
    name: 'Mechanical Engineering',
    description: 'CAD/CAM design, autonomous drone dynamics, RC racing, and 3D additive manufacturing.',
    chiefCoordinator: 'B Dhanraj',
    contact: 'dhanraj2205@vardhaman.org',
    iconName: 'Wrench'
  },
  {
    id: 'dept-civil',
    code: 'CIVIL',
    name: 'Civil Engineering',
    description: 'Smart city modeling, seismic structural design, sustainable surveying, and bridge load-testing.',
    chiefCoordinator: 'K Chaitanya',
    contact: 'chaitanya_vce1658@vardhaman.org',
    iconName: 'Building'
  },
  {
    id: 'dept-eee',
    code: 'EEE',
    name: 'Electrical & Electronics',
    description: 'Electric mobility, green energy microgrids, power systems, and automation logic.',
    chiefCoordinator: 'S Vinod Reddy',
    contact: 's.vinodreddy@vardhaman.org',
    iconName: 'Zap'
  },
  {
    id: 'dept-ece',
    code: 'ECE',
    name: 'Electronics & Communication',
    description: 'Robotics, IoT circuits, signal processing, embedded architectures, and antenna design.',
    chiefCoordinator: 'R Phani Vidyadhar',
    contact: 'rphaniv@vardhaman.org',
    iconName: 'Radio'
  },
  {
    id: 'dept-mba',
    code: 'MBA',
    name: 'Master of Business Administration',
    description: 'Venture pitch decks, startup capital funding, corporate strategy simulations, and fintech trading floors.',
    chiefCoordinator: 'Prof. R. L. Narayana',
    contact: 'mba.festronix@vardhaman.org',
    iconName: 'Briefcase'
  }
];

export const INITIAL_EVENTS: FestEvent[] = [
  {
    id: 'evt-1',
    slug: 'hack-the-future-24h',
    title: 'CodeSphere: 24-Hour National Hackathon',
    departmentId: 'dept-cse',
    departmentCode: 'CSE',
    category: 'hackathon',
    format: 'team',
    minTeamSize: 2,
    maxTeamSize: 4,
    fee: 300,
    capacity: 60,
    registeredCount: 0,
    deadline: '2026-11-28 23:59',
    date: 'Dec 1-2, 2026',
    time: '10:00 AM - 10:00 AM (24 Hours)',
    venue: 'CSE Turing Innovation Center, VCE Campus',
    description: 'The premier national 24-hour hackathon where top minds architect AI, Web3, or Cyber-physical prototypes under high octane mentorship.',
    rules: [
      'Team size: 2 to 4 members from any AICTE-recognized institution.',
      'All code must be written within the hackathon window; existing projects are disqualified.',
      'APIs, open-source libraries, and AI co-pilots are allowed with transparent declaration.',
      'Evaluation criteria: Technical Execution (40%), Benchmark Accuracy (30%), UI/UX (30%).'
    ],
    prizes: {
      first: '₹15,000 Cash Prize',
      second: '₹8,000',
      third: '₹3,000'
    },
    eligibility: 'Open to all B.Tech / M.Tech / MCA / Degree students with valid college ID.',
    coordinatorName: 'M Raghavendra / Ch Bala Subramanyam / BJV Varma',
    coordinatorPhone: '+91 63031 69820',
    coordinatorEmail: 'raghavendra1797@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #00f0ff 0%, #7928ca 100%)'
  },
  {
    id: 'evt-2',
    slug: 'robo-wars-colosseum',
    title: 'RoboWars: Steel Gladiators Combat',
    departmentId: 'dept-ece',
    departmentCode: 'ECE',
    category: 'technical',
    format: 'team',
    minTeamSize: 2,
    maxTeamSize: 5,
    fee: 400,
    capacity: 32,
    registeredCount: 0,
    deadline: '2026-11-29 18:00',
    date: 'Dec 1, 2026',
    time: '11:30 AM - 04:30 PM',
    venue: 'Central Open Air Theatre (OAT) Arena',
    description: 'Remote-controlled combat battlebots face off in a reinforced bulletproof steel arena with fire hazards, flippers, and spinners.',
    rules: [
      'Bot weight class: 15kg and 30kg categories.',
      'Active weapons mandatory (spinners, lifters, pneumatic hammers). No EMP or chemical fluids.',
      'Match duration: 3 minutes rounds. Knockout or judge score calculation.',
      'All bots must have remote radio fail-safe switches.'
    ],
    prizes: {
      first: '₹15,000 + Trophy',
      second: '₹7,000',
      third: '₹3,000'
    },
    eligibility: 'Engineering undergraduates and polytechnic students.',
    coordinatorName: 'R Phani Vidyadhar',
    coordinatorPhone: '+91 88013 33811',
    coordinatorEmail: 'rphaniv@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)'
  },
  {
    id: 'evt-3',
    slug: 'ai-prompt-engineering-showdown',
    title: 'PromptMatrix: Autonomous AI Agents & Vision',
    departmentId: 'dept-csm',
    departmentCode: 'CSM',
    category: 'technical',
    format: 'duo',
    minTeamSize: 1,
    maxTeamSize: 2,
    fee: 150,
    capacity: 80,
    registeredCount: 0,
    deadline: '2026-10-26 12:00',
    date: 'Dec 2, 2026',
    time: '01:30 PM - 03:30 PM',
    venue: 'Aryabhata Computing Lab 4, Block 2',
    description: 'Solve real-world multi-modal visual synthesis, complex logic extraction, and jailbreak defense challenges with cutting-edge LLMs and vision transformers.',
    rules: [
      'Solo or Duo participation permitted.',
      'Participants will be provided sandboxed API keys and compute environments.',
      'Scoring based on output benchmark accuracy, token efficiency, and prompt latency.'
    ],
    prizes: {
      first: '₹8,000 Cash Prize',
      second: '₹4,000',
      third: '₹2,000'
    },
    eligibility: 'Open to all registered tech students.',
    coordinatorName: 'P Rajashekar',
    coordinatorPhone: '+91 73864 07609',
    coordinatorEmail: 'rajashekhar1833@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
  },
  {
    id: 'evt-4',
    slug: 'valorant-championship-festronix',
    title: 'Apex Arena: Valorant 5v5 Tactical Championship',
    departmentId: 'dept-it',
    departmentCode: 'IT',
    category: 'gaming',
    format: 'team',
    minTeamSize: 5,
    maxTeamSize: 5,
    fee: 500,
    capacity: 24,
    registeredCount: 0,
    deadline: '2026-10-23 20:00',
    date: 'Dec 1-2, 2026',
    time: '10:00 AM Onwards',
    venue: 'VCE E-Sports Arena, High Performance Lab',
    description: 'High-stakes LAN esports tournament on 240Hz monitors with custom lobbies, live casters, and tournament streaming.',
    rules: [
      '5 players per squad. Standard competitive tournament ruleset.',
      'Single elimination preliminary; Best-of-3 semifinals and Grand Finale.',
      'Anti-cheat and toxic conduct enforcement strictly active.'
    ],
    prizes: {
      first: '₹10,000 Cash Prize',
      second: '₹5,000'
    },
    eligibility: 'All students with valid college ID.',
    coordinatorName: 'P Dastagiri Reddy',
    coordinatorPhone: '+91 99666 76005',
    coordinatorEmail: 'dastagiri1918@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
  },
  {
    id: 'evt-5',
    slug: 'ev-powertrain-masterclass',
    title: 'EV Architecture & Battery BMS Hands-on Workshop',
    departmentId: 'dept-eee',
    departmentCode: 'EEE',
    category: 'workshop',
    format: 'individual',
    minTeamSize: 1,
    maxTeamSize: 1,
    fee: 200,
    capacity: 100,
    registeredCount: 0,
    deadline: '2026-10-27 10:00',
    date: 'Dec 1, 2026',
    time: '09:30 AM - 01:00 PM',
    venue: 'Auditorium 1, Main Administrative Building',
    description: 'Industrial masterclass on lithium-ion cell thermal management, regenerative braking systems, and micro-controller hardware programming.',
    rules: [
      'Hands-on workshop kit provided to participants.',
      'Official industry certificate issued by IEEE and SAC.'
    ],
    prizes: {
      first: 'Certificate of Excellence + Hardware Dev Board'
    },
    eligibility: 'All engineering disciplines.',
    coordinatorName: 'S Vinod Reddy',
    coordinatorPhone: '+91 81254 21181',
    coordinatorEmail: 's.vinodreddy@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)'
  },
  {
    id: 'evt-6',
    slug: 'bridge-craft-structural-challenge',
    title: 'Bridge-Craft: Seismic Truss Loading Challenge',
    departmentId: 'dept-civil',
    departmentCode: 'CIVIL',
    category: 'technical',
    format: 'duo',
    minTeamSize: 2,
    maxTeamSize: 3,
    fee: 100,
    capacity: 40,
    registeredCount: 0,
    deadline: '2026-10-26 15:00',
    date: 'Dec 2, 2026',
    time: '11:00 AM - 02:00 PM',
    venue: 'Strength of Materials Lab, Civil Block',
    description: 'Design and fabricate lightweight balsa/pop-stick bridge structures tested to failure on computerized hydraulic loading rigs.',
    rules: [
      'Materials provided by organizers on-spot.',
      'Evaluation based on Load-to-Self-Weight ratio.'
    ],
    prizes: {
      first: '₹6,000 + Memento',
      second: '₹3,000'
    },
    eligibility: 'All students interested in structural mechanics.',
    coordinatorName: 'K Chaitanya',
    coordinatorPhone: '+91 74164 13410',
    coordinatorEmail: 'chaitanya_vce1658@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
  },
  {
    id: 'evt-7',
    slug: 'cad-gladiator-rc-chase',
    title: 'AeroDrone: Autonomous FPV Obstacle Derby',
    departmentId: 'dept-mechanical',
    departmentCode: 'MECHANICAL',
    category: 'technical',
    format: 'team',
    minTeamSize: 2,
    maxTeamSize: 3,
    fee: 250,
    capacity: 25,
    registeredCount: 0,
    deadline: '2026-10-26 23:59',
    date: 'Dec 1, 2026',
    time: '02:00 PM - 05:00 PM',
    venue: 'Main Sports Complex Cricket Ground',
    description: 'Pilot custom quadcopters through illuminated neon rings, vertical slaloms, and smoke curtains against the clock.',
    rules: [
      'FPV quadcopters max 5-inch prop diameter or standard 250mm frames.',
      'Lap timer transponders will be assigned during safety inspection.'
    ],
    prizes: {
      first: '₹8,000 + Trophy',
      second: '₹4,000'
    },
    eligibility: 'Open to drone hobbyists and students.',
    coordinatorName: 'B Dhanraj',
    coordinatorPhone: '+91 94413 81799',
    coordinatorEmail: 'dhanraj2205@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
  },
  {
    id: 'evt-8',
    slug: 'shark-tank-vardhaman-venture',
    title: 'VentureVortex: Shark Pitch & Angel Sim',
    departmentId: 'dept-mba',
    departmentCode: 'MBA',
    category: 'non-technical',
    format: 'team',
    minTeamSize: 1,
    maxTeamSize: 3,
    fee: 0,
    capacity: 50,
    registeredCount: 0,
    deadline: '2026-10-27 18:00',
    date: 'Dec 2, 2026',
    time: '10:00 AM - 01:30 PM',
    venue: 'VCE Conference Boardroom',
    description: 'Pitch disruptive technological startups to real angel investors and venture capitalists. Free registration with cash prize rewards.',
    rules: [
      '5-minute pitch deck followed by 3-minute jury cross-examination.',
      'Financial projections and MVP prototype demo carry bonus points.'
    ],
    prizes: {
      first: '₹8,000 Cash Prize',
      second: '₹4,000'
    },
    eligibility: 'Open to all aspiring student founders.',
    coordinatorName: 'Aishwarya Rao',
    coordinatorPhone: '+91 94901 99880',
    coordinatorEmail: 'aishwarya.mba@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
  },
  {
    id: 'evt-9',
    slug: 'data-forge-predictive-ai',
    title: 'DataForge: Predictive Analytics & Big Data Sprint',
    departmentId: 'dept-csd',
    departmentCode: 'CSD',
    category: 'hackathon',
    format: 'duo',
    minTeamSize: 1,
    maxTeamSize: 2,
    fee: 150,
    capacity: 50,
    registeredCount: 0,
    deadline: '2026-10-26 18:00',
    date: 'Dec 1, 2026',
    time: '11:00 AM - 03:00 PM',
    venue: 'CSD Big Data & Cloud Analytics Lab',
    description: 'High-speed data analytics sprint solving complex statistical classification, customer churn forecasting, and interactive dashboard storytelling.',
    rules: [
      'Python (Pandas/Scikit-learn/Polars) or R permitted.',
      'Jupyter notebooks and presentation decks submitted before buzzer.'
    ],
    prizes: {
      first: '₹6,000 Cash Prize',
      second: '₹3,000'
    },
    eligibility: 'All students interested in machine learning and big data science.',
    coordinatorName: 'V Vinod Kumar',
    coordinatorPhone: '+91 88977 15060',
    coordinatorEmail: 'vinodkumar1807@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_REGISTRATIONS: Registration[] = [];

export const INITIAL_TEAMS: Team[] = [];

export const ORGANISATIONAL_STRUCTURE: OrganisationalRoleDefinition[] = [
  {
    role: 'Public visitor',
    scopeTag: 'public',
    responsibilities: 'Browse fest information, events, prizes, sponsors and rules.',
    accessBoundary: 'Public content only.',
    accounts: ['Open Public Web Browsing (No Login Required)']
  },
  {
    role: 'Participant / team leader',
    scopeTag: 'participant',
    responsibilities: 'Profile, registrations, teammates, payment proof, passes and certificates.',
    accessBoundary: 'Own profile and registrations; permitted team details.',
    accounts: ['Direct registration without sign-in barrier; pass sent to email & visible on site.']
  },
  {
    role: 'Asif Sir / CC / Vencorpia (SAC Super Admin)',
    scopeTag: 'super_admin',
    responsibilities: 'Central executive authority overseeing fest, departments, assignments, accounts, roles, content and reports.',
    accessBoundary: 'Fest-wide administration.',
    accounts: ['Managed in Supabase Auth and the Admin Portal.']
  },
  {
    role: 'Department Staff Coordinator',
    scopeTag: 'dept_chief_coordinator',
    responsibilities: 'Departmental authority monitoring department events, capacity, registrations and spot passes.',
    accessBoundary: "Their department's events.",
    accounts: ['Department-scoped accounts are managed in Supabase Auth and the Admin Portal.']
  },
  {
    role: 'Event Coordinators',
    scopeTag: 'event_coordinator',
    responsibilities: 'Manage assigned event details, team check-in, scoring, and spot registrations.',
    accessBoundary: 'Assigned event(s) only unless separately authorised.',
    accounts: ['Event-scoped accounts are managed in Supabase Auth and the Admin Portal.']
  },
  {
    role: 'Finance / payment reviewer',
    scopeTag: 'finance',
    responsibilities: 'Review payment evidence and collection reports.',
    accessBoundary: 'Payment data needed for assigned duties.',
    accounts: ['Payment reviewer accounts are managed in Supabase Auth and the Admin Portal.']
  },
  {
    role: 'Volunteer / check-in staff',
    scopeTag: 'volunteer',
    responsibilities: 'Scan tickets, validate QR passes, and support gate operations.',
    accessBoundary: 'Limited check-in access.',
    accounts: ['Gate staff accounts are managed in Supabase Auth and the Admin Portal.']
  }
];
