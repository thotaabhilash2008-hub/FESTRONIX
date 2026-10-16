import { Department, FestEvent, Announcement, Registration, Team, OrganisationalRoleDefinition } from '../types/festronix';

export const DEPARTMENTS: Department[] = [
  {
    id: 'dept-cse',
    code: 'CSE',
    name: 'Computer Science & Engineering',
    description: 'Flagship AI, algorithmic coding, cybersecurity, and full-stack software innovation.',
    chiefCoordinator: 'Dr. K. S. Reddy',
    contact: 'cse.festronix@vardhaman.org',
    iconName: 'Cpu'
  },
  {
    id: 'dept-csd',
    code: 'CSD',
    name: 'CSE (Data Science)',
    description: 'Big data pipelines, statistical predictive modeling, data visualization, and intelligence systems.',
    chiefCoordinator: 'Dr. S. Radhika',
    contact: 'csd.festronix@vardhaman.org',
    iconName: 'Database'
  },
  {
    id: 'dept-csm',
    code: 'CSM',
    name: 'CSE (AI & Machine Learning)',
    description: 'Deep neural networks, computer vision, robotics reinforcement learning, and autonomous LLM agents.',
    chiefCoordinator: 'Dr. V. Prasad',
    contact: 'csm.festronix@vardhaman.org',
    iconName: 'Brain'
  },
  {
    id: 'dept-it',
    code: 'IT',
    name: 'Information Technology',
    description: 'Cloud systems, web3 networks, distributed computing, and generative tech infrastructure.',
    chiefCoordinator: 'Prof. Anitha Sharma',
    contact: 'it.festronix@vardhaman.org',
    iconName: 'Globe'
  },
  {
    id: 'dept-mechanical',
    code: 'MECHANICAL',
    name: 'Mechanical Engineering',
    description: 'CAD/CAM design, autonomous drone dynamics, RC racing, and 3D additive manufacturing.',
    chiefCoordinator: 'Dr. C. H. Rao',
    contact: 'mechanical.festronix@vardhaman.org',
    iconName: 'Wrench'
  },
  {
    id: 'dept-civil',
    code: 'CIVIL',
    name: 'Civil Engineering',
    description: 'Smart city modeling, seismic structural design, sustainable surveying, and bridge load-testing.',
    chiefCoordinator: 'Prof. P. Sunitha',
    contact: 'civil.festronix@vardhaman.org',
    iconName: 'Building'
  },
  {
    id: 'dept-eee',
    code: 'EEE',
    name: 'Electrical & Electronics',
    description: 'Electric mobility, green energy microgrids, power systems, and automation logic.',
    chiefCoordinator: 'Dr. B. Srinivas',
    contact: 'eee.festronix@vardhaman.org',
    iconName: 'Zap'
  },
  {
    id: 'dept-ece',
    code: 'ECE',
    name: 'Electronics & Communication',
    description: 'Robotics, IoT circuits, signal processing, embedded architectures, and antenna design.',
    chiefCoordinator: 'Dr. M. V. Ramana',
    contact: 'ece.festronix@vardhaman.org',
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
    registeredCount: 42,
    deadline: '2026-10-24 23:59',
    date: 'Oct 28-29, 2026',
    time: '10:00 AM - 10:00 AM (24 Hours)',
    venue: 'CSE Turing Innovation Center, VCE Campus',
    description: 'The premier national 24-hour hackathon where top minds architect AI, Web3, or Cyber-physical prototypes under high octane mentorship.',
    rules: [
      'Team size: 2 to 4 members from any AICTE-recognized institution.',
      'All code must be written within the hackathon window; existing projects are disqualified.',
      'APIs, open-source libraries, and AI co-pilots are allowed with transparent declaration.',
      'Evaluation criteria: Innovation (30%), Technical Execution (30%), UI/UX (20%), Pitch (20%).'
    ],
    prizes: {
      first: '₹50,000 + Tech Incubation Grant',
      second: '₹25,000 + Vouchers',
      third: '₹10,000'
    },
    eligibility: 'Open to all B.Tech / M.Tech / MCA / Degree students with valid college ID.',
    coordinatorName: 'Rohit Kulkarni',
    coordinatorPhone: '+91 98480 11223',
    coordinatorEmail: 'rohit.k@vardhaman.org',
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
    registeredCount: 26,
    deadline: '2026-10-25 18:00',
    date: 'Oct 28, 2026',
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
      first: '₹40,000 + Trophy',
      second: '₹20,000',
      third: '₹8,000'
    },
    eligibility: 'Engineering undergraduates and polytechnic innovators.',
    coordinatorName: 'Sanjay Varma',
    coordinatorPhone: '+91 98765 43210',
    coordinatorEmail: 'sanjay.v@vardhaman.org',
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
    registeredCount: 65,
    deadline: '2026-10-26 12:00',
    date: 'Oct 29, 2026',
    time: '01:30 PM - 03:30 PM',
    venue: 'Aryabhata Computing Lab 4, Block 2',
    description: 'Solve real-world multi-modal visual synthesis, complex logic extraction, and jailbreak defense challenges with cutting-edge LLMs and vision transformers.',
    rules: [
      'Solo or Duo participation permitted.',
      'Participants will be provided sandboxed API keys and compute environments.',
      'Scoring based on output benchmark accuracy, token efficiency, and prompt latency.'
    ],
    prizes: {
      first: '₹20,000 + AI Cloud Credits',
      second: '₹10,000',
      third: '₹5,000'
    },
    eligibility: 'Open to all registered tech students.',
    coordinatorName: 'Divya Sri',
    coordinatorPhone: '+91 94401 23456',
    coordinatorEmail: 'divyasri.aiml@vardhaman.org',
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
    registeredCount: 24,
    deadline: '2026-10-23 20:00',
    date: 'Oct 28-29, 2026',
    time: '10:00 AM Onwards',
    venue: 'VCE E-Sports Arena, High Performance Lab',
    description: 'High-stakes LAN esports tournament on 240Hz monitors with custom lobbies, live casters, and tournament streaming.',
    rules: [
      '5 players per squad. Standard competitive tournament ruleset.',
      'Single elimination preliminary; Best-of-3 semifinals and Grand Finale.',
      'Anti-cheat and toxic conduct enforcement strictly active.'
    ],
    prizes: {
      first: '₹30,000 + Pro Gaming Peripherals',
      second: '₹15,000'
    },
    eligibility: 'All students with valid college ID.',
    coordinatorName: 'Karthik Teja',
    coordinatorPhone: '+91 90001 98877',
    coordinatorEmail: 'karthik.t@vardhaman.org',
    status: 'full',
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
    registeredCount: 54,
    deadline: '2026-10-27 10:00',
    date: 'Oct 28, 2026',
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
    coordinatorName: 'Ramesh Chander',
    coordinatorPhone: '+91 91234 56789',
    coordinatorEmail: 'ramesh.eee@vardhaman.org',
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
    registeredCount: 22,
    deadline: '2026-10-26 15:00',
    date: 'Oct 29, 2026',
    time: '11:00 AM - 02:00 PM',
    venue: 'Strength of Materials Lab, Civil Block',
    description: 'Design and fabricate lightweight balsa/pop-stick bridge structures tested to failure on computerized hydraulic loading rigs.',
    rules: [
      'Materials provided by organizers on-spot.',
      'Evaluation based on Load-to-Self-Weight ratio.'
    ],
    prizes: {
      first: '₹15,000 + Memento',
      second: '₹8,000'
    },
    eligibility: 'All students interested in structural mechanics.',
    coordinatorName: 'Pooja Reddy',
    coordinatorPhone: '+91 99887 76655',
    coordinatorEmail: 'pooja.civil@vardhaman.org',
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
    registeredCount: 19,
    deadline: '2026-10-26 23:59',
    date: 'Oct 28, 2026',
    time: '02:00 PM - 05:00 PM',
    venue: 'Main Sports Complex Cricket Ground',
    description: 'Pilot custom quadcopters through illuminated neon rings, vertical slaloms, and smoke curtains against the clock.',
    rules: [
      'FPV quadcopters max 5-inch prop diameter or standard 250mm frames.',
      'Lap timer transponders will be assigned during safety inspection.'
    ],
    prizes: {
      first: '₹25,000 + Carbon Fiber Drone Frame Kit',
      second: '₹12,000'
    },
    eligibility: 'Open to drone hobbyists and students.',
    coordinatorName: 'Naveen Kumar',
    coordinatorPhone: '+91 97001 22334',
    coordinatorEmail: 'naveen.mech@vardhaman.org',
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
    registeredCount: 38,
    deadline: '2026-10-27 18:00',
    date: 'Oct 29, 2026',
    time: '10:00 AM - 01:30 PM',
    venue: 'VCE Innovation Cell Boardroom',
    description: 'Pitch disruptive technological startups to real angel investors and venture capitalists. Free registration with seed incubation opportunities.',
    rules: [
      '5-minute pitch deck followed by 3-minute jury cross-examination.',
      'Financial projections and MVP prototype demo carry bonus points.'
    ],
    prizes: {
      first: '₹35,000 Seed Grant + Incubation',
      second: '₹15,000'
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
    registeredCount: 34,
    deadline: '2026-10-26 18:00',
    date: 'Oct 28, 2026',
    time: '11:00 AM - 03:00 PM',
    venue: 'CSD Big Data & Cloud Analytics Lab',
    description: 'High-speed data analytics sprint solving complex statistical classification, customer churn forecasting, and interactive dashboard storytelling.',
    rules: [
      'Python (Pandas/Scikit-learn/Polars) or R permitted.',
      'Jupyter notebooks and presentation decks submitted before buzzer.'
    ],
    prizes: {
      first: '₹25,000 + Data Cloud Credits',
      second: '₹12,000',
      third: '₹6,000'
    },
    eligibility: 'All students interested in machine learning and big data science.',
    coordinatorName: 'Dr. S. Radhika',
    coordinatorPhone: '+91 98480 33991',
    coordinatorEmail: 'csd.festronix@vardhaman.org',
    status: 'open',
    bannerGradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '⚡ CodeSphere Hackathon Problem Statements Unveiled!',
    message: 'National hackathon track themes in Healthcare AI, CleanTech, and Autonomous Logistics are now published on the portal.',
    type: 'urgent',
    scope: 'fest-wide',
    date: '2026-10-14 10:30'
  },
  {
    id: 'ann-2',
    title: '🏆 Cash Prize Pool Enhanced to ₹5,00,000!',
    message: 'SAC Vardhaman has officially increased prize distributions across all 9 academic departments.',
    type: 'prize',
    scope: 'fest-wide',
    date: '2026-10-13 16:45'
  },
  {
    id: 'ann-3',
    title: '🚌 Free College Transit Shuttles on Fest Days',
    message: 'Special VCE AC buses will operate from Shamshabad, Mehdipatnam, LB Nagar, and Secunderabad for external participants.',
    type: 'general',
    scope: 'fest-wide',
    date: '2026-10-12 11:00'
  }
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  // 1. CSE
  {
    id: 'FEST-2026-1082',
    eventId: 'evt-1',
    eventTitle: 'CodeSphere: 24-Hour National Hackathon',
    teamName: 'NeuralKnights',
    teamCode: 'FX-CS-1082',
    leaderName: 'Arjun Swaminathan',
    leaderEmail: 'arjun.swami@gmail.com',
    leaderPhone: '+91 98490 22334',
    leaderCollege: 'CBIT Hyderabad',
    leaderRoll: '160121733045',
    teammates: [
      { name: 'Kavya Nair', email: 'kavya.n@gmail.com', phone: '+91 98490 22335', college: 'CBIT Hyderabad', rollNumber: '160121733046' },
      { name: 'Rohan Gupta', email: 'rohan.g@gmail.com', phone: '+91 98490 22336', college: 'CBIT Hyderabad', rollNumber: '160121733047' }
    ],
    format: 'team',
    fee: 300,
    source: 'online',
    registrationDate: '2026-10-13 14:22',
    paymentStatus: 'verified',
    transactionId: 'UPI-SBI-299384729104',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Dr. K. S. Reddy',
    verifiedAt: '2026-10-13 16:00',
    qrToken: 'FEST26-TOKEN-ARJ1082',
    checkedIn: false,
    departmentCode: 'CSE'
  },
  {
    id: 'FEST-2026-1095',
    eventId: 'evt-1',
    eventTitle: 'CodeSphere: 24-Hour National Hackathon',
    teamName: 'CyberSentinels',
    teamCode: 'FX-CS-1095',
    leaderName: 'Sai Tarun Goud',
    leaderEmail: 'tarun.goud@vardhaman.org',
    leaderPhone: '+91 98765 43210',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '22VCECS104',
    teammates: [
      { name: 'Nikhil Varma', email: 'nikhil.v@vardhaman.org', phone: '+91 98765 43211', college: 'Vardhaman College of Engineering', rollNumber: '22VCECS105' }
    ],
    format: 'team',
    fee: 300,
    source: 'online',
    registrationDate: '2026-10-16 11:15',
    paymentStatus: 'verification_pending',
    transactionId: 'UPI-HDFC-994829104829',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-TAR1095',
    checkedIn: false,
    departmentCode: 'CSE'
  },
  // 2. ECE
  {
    id: 'FEST-2026-2144',
    eventId: 'evt-2',
    eventTitle: 'RoboWars: Steel Gladiators Combat',
    teamName: 'IronCrushers',
    teamCode: 'FX-ECE-2144',
    leaderName: 'Praveen Manne',
    leaderEmail: 'praveen.m@vardhaman.org',
    leaderPhone: '+91 99480 33445',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '22VCEEC089',
    teammates: [
      { name: 'Siddharth Rao', email: 'sid.rao@vardhaman.org', phone: '+91 99480 33446', college: 'Vardhaman College of Engineering', rollNumber: '22VCEEC090' }
    ],
    format: 'team',
    fee: 400,
    source: 'online',
    registrationDate: '2026-10-14 09:15',
    paymentStatus: 'verification_pending',
    transactionId: 'GPay-ICICI-884729103948',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-PRA2144',
    checkedIn: false,
    departmentCode: 'ECE'
  },
  {
    id: 'FEST-2026-2150',
    eventId: 'evt-2',
    eventTitle: 'RoboWars: Steel Gladiators Combat',
    teamName: 'BotBusters',
    teamCode: 'FX-ECE-2150',
    leaderName: 'Ananya Deshmukh',
    leaderEmail: 'ananya.d@vasavi.ac.in',
    leaderPhone: '+91 98888 11223',
    leaderCollege: 'Vasavi College of Engineering',
    leaderRoll: '160221735012',
    teammates: [
      { name: 'Ritesh Kumar', email: 'ritesh.k@vasavi.ac.in', phone: '+91 98888 11224', college: 'Vasavi College of Engineering', rollNumber: '160221735013' }
    ],
    format: 'duo',
    fee: 400,
    source: 'online',
    registrationDate: '2026-10-15 10:20',
    paymentStatus: 'verified',
    transactionId: 'UPI-CANARA-4488220011',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Dr. M. V. Ramana',
    verifiedAt: '2026-10-15 11:00',
    qrToken: 'FEST26-TOKEN-ANA2150',
    checkedIn: true,
    checkedInAt: '10:15 AM',
    checkedInBy: 'Gate 1 Lead',
    departmentCode: 'ECE'
  },
  // 3. AI&ML
  {
    id: 'FEST-2026-3401',
    eventId: 'evt-3',
    eventTitle: 'PromptMatrix: Autonomous AI Agents & Vision',
    leaderName: 'Sneha Chintala',
    leaderEmail: 'sneha.c@vnr.ac.in',
    leaderPhone: '+91 98877 66554',
    leaderCollege: 'VNR VJIET',
    leaderRoll: '23VNR7721',
    teammates: [],
    format: 'duo',
    fee: 150,
    source: 'spot',
    registrationDate: '2026-10-14 11:30',
    paymentStatus: 'verified',
    transactionId: 'CASH-SPOT-DESK-01',
    verifiedBy: 'Divya Sri',
    verifiedAt: '2026-10-14 11:31',
    qrToken: 'FEST26-TOKEN-SNE3401',
    checkedIn: true,
    checkedInAt: '11:35 AM',
    checkedInBy: 'Gate 2 Desk',
    departmentCode: 'AI&ML'
  },
  {
    id: 'FEST-2026-3410',
    eventId: 'evt-3',
    eventTitle: 'PromptMatrix: Autonomous AI Agents & Vision',
    leaderName: 'Aditya Reddy',
    leaderEmail: 'aditya.aiml@vardhaman.org',
    leaderPhone: '+91 99112 23344',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '23VCEAI044',
    teammates: [],
    format: 'individual',
    fee: 150,
    source: 'online',
    registrationDate: '2026-10-16 12:00',
    paymentStatus: 'verification_pending',
    transactionId: 'GPAY-SBI-778844112233',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-ADI3410',
    checkedIn: false,
    departmentCode: 'AI&ML'
  },
  // 4. IT
  {
    id: 'FEST-2026-4012',
    eventId: 'evt-4',
    eventTitle: 'Apex Arena: Valorant 5v5 Tactical Championship',
    teamName: 'ViperSquad',
    teamCode: 'FX-IT-4012',
    leaderName: 'Manish Sharma',
    leaderEmail: 'manish.esports@gmail.com',
    leaderPhone: '+91 97001 23456',
    leaderCollege: 'JNTUH College of Engineering',
    leaderRoll: '21031A0512',
    teammates: [
      { name: 'Kiran K', email: 'kiran@gmail.com', phone: '+91 97001 23457', college: 'JNTUH', rollNumber: '21031A0513' },
      { name: 'Harsha P', email: 'harsha@gmail.com', phone: '+91 97001 23458', college: 'JNTUH', rollNumber: '21031A0514' },
      { name: 'Vivek B', email: 'vivek@gmail.com', phone: '+91 97001 23459', college: 'JNTUH', rollNumber: '21031A0515' },
      { name: 'Sunil T', email: 'sunil@gmail.com', phone: '+91 97001 23460', college: 'JNTUH', rollNumber: '21031A0516' }
    ],
    format: 'team',
    fee: 500,
    source: 'online',
    registrationDate: '2026-10-16 13:45',
    paymentStatus: 'verification_pending',
    transactionId: 'GPAY-AXIS-882736452109',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-MAN4012',
    checkedIn: false,
    departmentCode: 'IT'
  },
  {
    id: 'FEST-2026-4020',
    eventId: 'evt-4',
    eventTitle: 'Apex Arena: Valorant 5v5 Tactical Championship',
    teamName: 'PixelPhoenix',
    teamCode: 'FX-IT-4020',
    leaderName: 'Rohit Verma',
    leaderEmail: 'rohit.v@vardhaman.org',
    leaderPhone: '+91 98480 88776',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '22VCEIT091',
    teammates: [
      { name: 'Deepak S', email: 'deepak.s@vardhaman.org', phone: '+91 98480 88777', college: 'Vardhaman College of Engineering', rollNumber: '22VCEIT092' }
    ],
    format: 'team',
    fee: 500,
    source: 'online',
    registrationDate: '2026-10-15 15:30',
    paymentStatus: 'verified',
    transactionId: 'UPI-KOTAK-9988112233',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Prof. Anitha Sharma',
    verifiedAt: '2026-10-15 16:00',
    qrToken: 'FEST26-TOKEN-ROH4020',
    checkedIn: true,
    checkedInAt: '09:40 AM',
    checkedInBy: 'E-Sports Desk',
    departmentCode: 'IT'
  },
  // 5. EEE
  {
    id: 'FEST-2026-5001',
    eventId: 'evt-5',
    eventTitle: 'EV Architecture & Battery BMS Hands-on Workshop',
    leaderName: 'Sanjay Kumar',
    leaderEmail: 'sanjay.eee@vardhaman.org',
    leaderPhone: '+91 91234 99887',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '22VCEEE032',
    teammates: [],
    format: 'individual',
    fee: 200,
    source: 'online',
    registrationDate: '2026-10-16 14:10',
    paymentStatus: 'verification_pending',
    transactionId: 'PHONEPE-SBI-443322119988',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-SAN5001',
    checkedIn: false,
    departmentCode: 'EEE'
  },
  {
    id: 'FEST-2026-5015',
    eventId: 'evt-5',
    eventTitle: 'EV Architecture & Battery BMS Hands-on Workshop',
    leaderName: 'Karthik Raja',
    leaderEmail: 'karthik.r@ou.ac.in',
    leaderPhone: '+91 93456 78901',
    leaderCollege: 'Osmania University College of Engineering',
    leaderRoll: '100521734055',
    teammates: [],
    format: 'individual',
    fee: 200,
    source: 'spot',
    registrationDate: '2026-10-16 10:00',
    paymentStatus: 'verified',
    transactionId: 'CASH-SPOT-EEE-02',
    verifiedBy: 'Dr. B. Srinivas',
    verifiedAt: '2026-10-16 10:05',
    qrToken: 'FEST26-TOKEN-KAR5015',
    checkedIn: true,
    checkedInAt: '10:10 AM',
    checkedInBy: 'Auditorium 1 Gate',
    departmentCode: 'EEE'
  },
  // 6. MECH
  {
    id: 'FEST-2026-7001',
    eventId: 'evt-7',
    eventTitle: 'AeroDrone: Autonomous FPV Obstacle Derby',
    teamName: 'AeroGliders',
    teamCode: 'FX-MECH-7001',
    leaderName: 'Varun Teja',
    leaderEmail: 'varun.aero@gmail.com',
    leaderPhone: '+91 94411 22334',
    leaderCollege: 'GRIET Hyderabad',
    leaderRoll: '21241A0309',
    teammates: [
      { name: 'Sumanth K', email: 'sumanth.k@gmail.com', phone: '+91 94411 22335', college: 'GRIET', rollNumber: '21241A0310' }
    ],
    format: 'team',
    fee: 250,
    source: 'online',
    registrationDate: '2026-10-16 15:00',
    paymentStatus: 'verification_pending',
    transactionId: 'PAYTM-KOTAK-778899001122',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-VAR7001',
    checkedIn: false,
    departmentCode: 'MECH'
  },
  {
    id: 'FEST-2026-7020',
    eventId: 'evt-7',
    eventTitle: 'AeroDrone: Autonomous FPV Obstacle Derby',
    teamName: 'TorqueTitans',
    teamCode: 'FX-MECH-7020',
    leaderName: 'Mahesh Babu P',
    leaderEmail: 'mahesh.mech@vardhaman.org',
    leaderPhone: '+91 98499 11223',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '22VCEME045',
    teammates: [
      { name: 'Rajesh G', email: 'rajesh.g@vardhaman.org', phone: '+91 98499 11224', college: 'Vardhaman College of Engineering', rollNumber: '22VCEME046' }
    ],
    format: 'team',
    fee: 250,
    source: 'online',
    registrationDate: '2026-10-15 12:15',
    paymentStatus: 'verified',
    transactionId: 'UPI-SBI-8811223344',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Dr. C. H. Rao',
    verifiedAt: '2026-10-15 13:00',
    qrToken: 'FEST26-TOKEN-MAH7020',
    checkedIn: true,
    checkedInAt: '01:50 PM',
    checkedInBy: 'Cricket Ground Gate',
    departmentCode: 'MECH'
  },
  // 7. CIVIL
  {
    id: 'FEST-2026-6001',
    eventId: 'evt-6',
    eventTitle: 'Bridge-Craft: Seismic Truss Loading Challenge',
    teamName: 'TrussMasters',
    teamCode: 'FX-CIVIL-6001',
    leaderName: 'Harini Reddy',
    leaderEmail: 'harini.civil@vardhaman.org',
    leaderPhone: '+91 97000 88990',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '22VCECE019',
    teammates: [
      { name: 'Divya P', email: 'divya.p@vardhaman.org', phone: '+91 97000 88991', college: 'Vardhaman College of Engineering', rollNumber: '22VCECE020' }
    ],
    format: 'duo',
    fee: 200,
    source: 'online',
    registrationDate: '2026-10-16 15:30',
    paymentStatus: 'verification_pending',
    transactionId: 'UPI-BOI-554433221100',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-HAR6001',
    checkedIn: false,
    departmentCode: 'CIVIL'
  },
  {
    id: 'FEST-2026-6012',
    eventId: 'evt-6',
    eventTitle: 'Bridge-Craft: Seismic Truss Loading Challenge',
    teamName: 'ConcreteKings',
    teamCode: 'FX-CIVIL-6012',
    leaderName: 'Bhanu Prakash',
    leaderEmail: 'bhanu.civil@cbit.ac.in',
    leaderPhone: '+91 98480 33221',
    leaderCollege: 'CBIT Hyderabad',
    leaderRoll: '160121732040',
    teammates: [
      { name: 'Ajay K', email: 'ajay.k@cbit.ac.in', phone: '+91 98480 33222', college: 'CBIT Hyderabad', rollNumber: '160121732041' }
    ],
    format: 'duo',
    fee: 200,
    source: 'online',
    registrationDate: '2026-10-15 16:00',
    paymentStatus: 'verified',
    transactionId: 'GPAY-HDFC-6655443322',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Prof. P. Sunitha',
    verifiedAt: '2026-10-15 17:00',
    qrToken: 'FEST26-TOKEN-BHA6012',
    checkedIn: true,
    checkedInAt: '09:15 AM',
    checkedInBy: 'Civil Structures Lab Gate',
    departmentCode: 'CIVIL'
  },
  // 8. MBA
  {
    id: 'FEST-2026-8001',
    eventId: 'evt-8',
    eventTitle: 'VentureVortex: Shark Pitch & Angel Sim',
    teamName: 'AlphaFounders',
    teamCode: 'FX-MBA-8001',
    leaderName: 'Sravani Kondapalli',
    leaderEmail: 'sravani.mba@vardhaman.org',
    leaderPhone: '+91 99887 76655',
    leaderCollege: 'Vardhaman College of Engineering',
    leaderRoll: '23VCEMB028',
    teammates: [
      { name: 'Pranay V', email: 'pranay.v@vardhaman.org', phone: '+91 99887 76656', college: 'Vardhaman College of Engineering', rollNumber: '23VCEMB029' }
    ],
    format: 'duo',
    fee: 250,
    source: 'online',
    registrationDate: '2026-10-16 16:00',
    paymentStatus: 'verification_pending',
    transactionId: 'UPI-ICICI-667788990011',
    paymentScreenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrToken: 'FEST26-TOKEN-SRA8001',
    checkedIn: false,
    departmentCode: 'MBA'
  },
  {
    id: 'FEST-2026-8025',
    eventId: 'evt-8',
    eventTitle: 'VentureVortex: Shark Pitch & Angel Sim',
    leaderName: 'Vamshi Krishna',
    leaderEmail: 'vamshi.k@ou.ac.in',
    leaderPhone: '+91 98480 66778',
    leaderCollege: 'Department of Business Management, OU',
    leaderRoll: '100522801045',
    teammates: [],
    format: 'individual',
    fee: 250,
    source: 'spot',
    registrationDate: '2026-10-16 11:00',
    paymentStatus: 'verified',
    transactionId: 'CASH-SPOT-MBA-01',
    verifiedBy: 'Prof. R. L. Narayana',
    verifiedAt: '2026-10-16 11:05',
    qrToken: 'FEST26-TOKEN-VAM8025',
    checkedIn: true,
    checkedInAt: '11:10 AM',
    checkedInBy: 'MBA Seminar Hall Desk',
    departmentCode: 'MBA'
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'TEAM-1082',
    teamCode: 'FX-CS-1082',
    teamName: 'NeuralKnights',
    eventId: 'evt-1',
    eventTitle: 'CodeSphere: 24-Hour National Hackathon',
    registrationId: 'FEST-2026-1082',
    leaderName: 'Arjun Swaminathan',
    leaderRoll: '160121733045',
    leaderEmail: 'arjun.swami@gmail.com',
    leaderPhone: '+91 98490 22334',
    leaderCollege: 'CBIT Hyderabad',
    members: [
      { name: 'Kavya Nair', email: 'kavya.n@gmail.com', phone: '+91 98490 22335', college: 'CBIT Hyderabad', rollNumber: '160121733046' },
      { name: 'Rohan Gupta', email: 'rohan.g@gmail.com', phone: '+91 98490 22336', college: 'CBIT Hyderabad', rollNumber: '160121733047' }
    ],
    maxTeamSize: 4,
    minTeamSize: 2,
    createdAt: '2026-10-13 14:22'
  },
  {
    id: 'TEAM-2144',
    teamCode: 'FX-ECE-2144',
    teamName: 'IronCrushers',
    eventId: 'evt-2',
    eventTitle: 'RoboWars: Steel Gladiators Combat',
    registrationId: 'FEST-2026-2144',
    leaderName: 'Praveen Manne',
    leaderRoll: '22VCEEC089',
    leaderEmail: 'praveen.m@vardhaman.org',
    leaderPhone: '+91 99480 33445',
    leaderCollege: 'Vardhaman College of Engineering',
    members: [
      { name: 'Siddharth Rao', email: 'sid.rao@vardhaman.org', phone: '+91 99480 33446', college: 'Vardhaman College of Engineering', rollNumber: '22VCEEC090' }
    ],
    maxTeamSize: 5,
    minTeamSize: 2,
    createdAt: '2026-10-14 09:15'
  },
  {
    id: 'TEAM-6443',
    teamCode: 'FX-CSE-6443',
    teamName: "Dhanush's Squad",
    eventId: 'evt-1',
    eventTitle: 'CodeSphere: 24-Hour National Hackathon',
    registrationId: 'FEST-2026-6443',
    leaderName: 'Dhanush',
    leaderRoll: '25881A05FC',
    leaderEmail: 'dhanushmathe@gmail.com',
    leaderPhone: '+91 63038 94505',
    leaderCollege: 'Vardhaman College of Engineering',
    members: [],
    maxTeamSize: 4,
    minTeamSize: 2,
    createdAt: '2026-10-16 14:00'
  }
];

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
    accounts: ['Student Roll No / Username & Password (Self Signup/Signin)']
  },
  {
    role: 'Event Coordinator',
    scopeTag: 'event_coordinator',
    responsibilities: 'Manage assigned event details, registrations, spot registrations, payment evidence, check-in and reports.',
    accessBoundary: 'Assigned event(s) only unless separately authorised.',
    accounts: ['event_coord (eventcoord2026)', 'Universal Coordinator Passcode (festcoord2026)']
  },
  {
    role: 'Department Chief Coordinator',
    scopeTag: 'dept_chief_coordinator',
    responsibilities: 'Monitor department events, capacity, registrations and readiness.',
    accessBoundary: "Their department's events.",
    accounts: [
      'HOD CSE (hod_cse / cse2026)',
      'HOD CSD (hod_csd / csd2026)',
      'HOD CSM (hod_csm / csm2026)',
      'HOD IT (hod_it / it2026)',
      'HOD MECHANICAL (hod_mechanical / mechanical2026)',
      'HOD CIVIL (hod_civil / civil2026)',
      'HOD EEE (hod_eee / eee2026)',
      'HOD ECE (hod_ece / ece2026)',
      'HOD MBA (hod_mba / mba2026)'
    ]
  },
  {
    role: 'SAC / super-admin',
    scopeTag: 'super_admin',
    responsibilities: 'Oversee fest, departments, assignments, accounts, roles, content and reports.',
    accessBoundary: 'Fest-wide administration.',
    accounts: [
      '1. SAC DEAN (dean_sac / deansac2026)',
      '2. CONNECT CLUB (connect_club / connect2026)',
      '3. VENCORPIA (vencorpia / vencorpia2026)'
    ]
  },
  {
    role: 'Finance / payment reviewer',
    scopeTag: 'finance',
    responsibilities: 'Review payment evidence and collection reports.',
    accessBoundary: 'Payment data needed for assigned duties.',
    accounts: ['finance_reviewer (finance2026 / finance)']
  },
  {
    role: 'Volunteer / check-in staff',
    scopeTag: 'volunteer',
    responsibilities: 'Scan tickets and support entry operations.',
    accessBoundary: 'Limited check-in access.',
    accounts: ['volunteer_staff (volunteer2026 / volunteer)']
  }
];
