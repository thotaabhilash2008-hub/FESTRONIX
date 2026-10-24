export interface SponsorDeliverable {
  id: string;
  title: string;
  category: 'branding' | 'on_ground' | 'digital' | 'stage';
  status: 'completed' | 'in_progress' | 'scheduled';
  description: string;
  dueDate: string;
  location?: string;
}

export interface SponsorProfile {
  id: string;
  companyName: string;
  tagline: string;
  tier: 'Title Sponsor' | 'Platinum Partner' | 'Gold Sponsor' | 'Official Event Partner' | 'Official Tech Partner';
  tierBadgeColor: string;
  logo: string;
  website: string;
  pocName: string;
  pocRole: string;
  pocContact: string;
  pocEmail: string;
  sacLeadName: string;
  sacLeadContact: string;
  stallLocation: string;
  stallNumber: string;
  mouStatus: 'Signed & Executed' | 'Under Review' | 'Draft Sent';
  invoiceStatus: 'Paid & Cleared' | 'Processing';
  deliverables: SponsorDeliverable[];
  metrics: {
    stageKeynoteTime: string;
    brandedBannersAllocated: number;
    vipLoungePasses: number;
    estimatedReach: string;
    impressionsCount: string;
  };
}

export interface MilestoneReward {
  id: string;
  targetReferrals: number;
  rewardTitle: string;
  perksDescription: string;
  status: 'unlocked' | 'current' | 'locked';
  badge: string;
}

export interface AmbassadorReferral {
  id: string;
  studentName: string;
  college: string;
  eventsRegistered: string[];
  date: string;
  amount: number;
}

export interface AmbassadorProfile {
  id: string;
  name: string;
  college: string;
  avatar: string;
  referralCode: string;
  totalReferrals: number;
  totalRevenue: number;
  rank: number;
  points: number;
  stipendEarned: number;
  badge: 'Grand Diamond' | 'Platinum Leader' | 'Gold Pioneer' | 'Rising Star';
  recentReferrals: AmbassadorReferral[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  college: string;
  referrals: number;
  points: number;
  badge: string;
}

// ---------------- Pre-loaded Sponsor Profiles ----------------
export const SPONSOR_PROFILES: SponsorProfile[] = [
  {
    id: 'connect_club',
    companyName: 'Connect Club',
    tagline: 'Empowering Student Communities & Tech Innovations',
    tier: 'Official Event Partner',
    tierBadgeColor: '#38BDF8',
    logo: '/connect_club_transparent.png',
    website: 'https://connectclub.in',
    pocName: 'Harshith Reddy',
    pocRole: 'Community & Partnerships Lead',
    pocContact: '+91 98480 12345',
    pocEmail: 'partnerships@connectclub.in',
    sacLeadName: 'Prof. R. Srinivas (Dean SAC)',
    sacLeadContact: '+91 98480 99112',
    stallLocation: 'Central Block Atrium • Ground Level Innovation Hub',
    stallNumber: 'Stall #A-01',
    mouStatus: 'Signed & Executed',
    invoiceStatus: 'Paid & Cleared',
    metrics: {
      stageKeynoteTime: 'Day 1 • 11:30 AM (Inaugural Stage)',
      brandedBannersAllocated: 12,
      vipLoungePasses: 20,
      estimatedReach: '35,000+ Students',
      impressionsCount: '1.2M Digital Impressions'
    },
    deliverables: [
      {
        id: 'cc-1',
        title: 'Top Floating Navbar & Mobile Menu Branding',
        category: 'digital',
        status: 'completed',
        description: 'Permanent official brand crest on live site navbar and mobile navigation drawer.',
        dueDate: 'Immediate'
      },
      {
        id: 'cc-2',
        title: 'Central Desk & Queries Footer Integration',
        category: 'branding',
        status: 'completed',
        description: 'Brand logo and direct link featured in official Vardhaman College queries block.',
        dueDate: 'Immediate'
      },
      {
        id: 'cc-3',
        title: 'Main Auditorium LED Stage Backdrop Slot',
        category: 'stage',
        status: 'completed',
        description: 'Ultra HD 4K loop of Connect Club dynamic emblem during all flagship events.',
        dueDate: 'Oct 27, 2026'
      },
      {
        id: 'cc-4',
        title: 'Exclusive Innovation Arena Stall Setup',
        category: 'on_ground',
        status: 'in_progress',
        description: 'Premium double-bay stall with power supply, high-speed Wi-Fi, and rollup display stands.',
        dueDate: 'Oct 28, 2026',
        location: 'Stall #A-01, Central Atrium'
      },
      {
        id: 'cc-5',
        title: 'Official Hackathon Category Co-Branding',
        category: 'branding',
        status: 'in_progress',
        description: 'Co-branded certificates of merit, cash prizes envelope, and judge panel representation.',
        dueDate: 'Oct 29, 2026'
      }
    ]
  },
  {
    id: 'vencorpia',
    companyName: 'Vencorpia',
    tagline: 'One Stop for Effortless Events & Digital Ticketing',
    tier: 'Official Tech Partner',
    tierBadgeColor: '#00C2FF',
    logo: '/vencorpia_transparent.png',
    website: 'https://vencorpia.com',
    pocName: 'Arjun Varma',
    pocRole: 'VP of Technology & Operations',
    pocContact: '+91 97000 88219',
    pocEmail: 'hello@vencorpia.com',
    sacLeadName: 'Dr. M. Ashok (Head of Tech Council)',
    sacLeadContact: '+91 98480 99114',
    stallLocation: 'Mechanical & Robotics Quadrangle',
    stallNumber: 'Stall #T-03',
    mouStatus: 'Signed & Executed',
    invoiceStatus: 'Paid & Cleared',
    metrics: {
      stageKeynoteTime: 'Day 2 • 3:00 PM (Valedictory Tech Demo)',
      brandedBannersAllocated: 10,
      vipLoungePasses: 15,
      estimatedReach: '30,000+ Footfall',
      impressionsCount: '950K Digital Impressions'
    },
    deliverables: [
      {
        id: 'vc-1',
        title: 'Instant Crypto Pass & QR Verification Integration',
        category: 'digital',
        status: 'completed',
        description: 'Deployment of seamless cryptographic digital entry pass with live check-in telemetry.',
        dueDate: 'Immediate'
      },
      {
        id: 'vc-2',
        title: 'Top Navbar & Footer Tech Partner Emblems',
        category: 'branding',
        status: 'completed',
        description: 'Interactive brand presence with specular hover effects across all desktop & mobile views.',
        dueDate: 'Immediate'
      },
      {
        id: 'vc-3',
        title: 'Fast-Track Check-In Kiosks at Entry Gates',
        category: 'on_ground',
        status: 'in_progress',
        description: 'Co-branded scanning turnstiles at Gate 1 (Main Entrance) and Gate 3 (Auditorium).',
        dueDate: 'Oct 27, 2026',
        location: 'Campus Entry Turnstiles'
      },
      {
        id: 'vc-4',
        title: 'Tech Workshop Keynote & Stage Presentation',
        category: 'stage',
        status: 'scheduled',
        description: '20-minute keynote on scalable event infrastructure and modern collegiate platforms.',
        dueDate: 'Oct 29, 2026'
      }
    ]
  },
  {
    id: 'cybercore',
    companyName: 'CyberCore Systems',
    tagline: 'Next-Gen Autonomous AI & Robotics Solutions',
    tier: 'Gold Sponsor',
    tierBadgeColor: '#F59E0B',
    logo: '/vce_logo.png',
    website: 'https://cybercore-systems.io',
    pocName: 'Vikram Malhotra',
    pocRole: 'Director of University Relations',
    pocContact: '+91 91234 56789',
    pocEmail: 'campus@cybercore-systems.io',
    sacLeadName: 'Prof. K. Ramesh (Sponsorship Head)',
    sacLeadContact: '+91 98480 99115',
    stallLocation: 'CSE / IT Cyber Corridor Ground Floor',
    stallNumber: 'Stall #G-08',
    mouStatus: 'Signed & Executed',
    invoiceStatus: 'Paid & Cleared',
    metrics: {
      stageKeynoteTime: 'Day 1 • 2:00 PM (RoboWars Arena)',
      brandedBannersAllocated: 8,
      vipLoungePasses: 10,
      estimatedReach: '20,000+ Engineers',
      impressionsCount: '500K Digital Impressions'
    },
    deliverables: [
      {
        id: 'cc-g1',
        title: 'National RoboWars Flagship Title Sponsor',
        category: 'stage',
        status: 'completed',
        description: 'Exclusive ring banner, safety cage co-branding, and first-place trophy presentation.',
        dueDate: 'Oct 28, 2026'
      },
      {
        id: 'cc-g2',
        title: 'Recruitment & Pre-Placement Interview Kiosk',
        category: 'on_ground',
        status: 'in_progress',
        description: 'Dedicated interview room inside SAC Executive Block for top hackathon winners.',
        dueDate: 'Oct 29, 2026'
      }
    ]
  }
];

// ---------------- Pre-loaded Campus Ambassador Profiles ----------------
export const AMBASSADOR_PROFILES: AmbassadorProfile[] = [
  {
    id: 'amb_aditya',
    name: 'Aditya Verma',
    college: 'Vardhaman College of Engineering',
    avatar: 'AV',
    referralCode: 'FEST26-AMB-ADITYA',
    totalReferrals: 68,
    totalRevenue: 27200,
    rank: 1,
    points: 6800,
    stipendEarned: 5440,
    badge: 'Grand Diamond',
    recentReferrals: [
      { id: 'r1', studentName: 'Sai Tarun', college: 'VCE - CSE', eventsRegistered: ['CodeSprint 2026', 'RoboWars'], date: 'Today, 2:15 PM', amount: 500 },
      { id: 'r2', studentName: 'Priya Nambiar', college: 'VCE - ECE', eventsRegistered: ['Circuitrix Hack'], date: 'Today, 11:30 AM', amount: 300 },
      { id: 'r3', studentName: 'Farhan Ali', college: 'VCE - IT', eventsRegistered: ['All-Access VIP Fest Pass'], date: 'Yesterday', amount: 800 },
      { id: 'r4', studentName: 'Meghana Rao', college: 'VCE - AIML', eventsRegistered: ['NeuroHacks Hackathon'], date: 'Yesterday', amount: 450 }
    ]
  },
  {
    id: 'amb_sneha',
    name: 'Sneha Kulkarni',
    college: 'Chaitanya Bharathi Institute of Technology (CBIT)',
    avatar: 'SK',
    referralCode: 'FEST26-AMB-SNEHA',
    totalReferrals: 52,
    totalRevenue: 20800,
    rank: 2,
    points: 5200,
    stipendEarned: 4160,
    badge: 'Platinum Leader',
    recentReferrals: [
      { id: 'r5', studentName: 'Rohan Deshmukh', college: 'CBIT - CSE', eventsRegistered: ['Autonomous Drone Race'], date: 'Today, 1:40 PM', amount: 600 },
      { id: 'r6', studentName: 'Ananya Roy', college: 'CBIT - Mech', eventsRegistered: ['Bridge-O-Craft'], date: 'Yesterday', amount: 250 },
      { id: 'r7', studentName: 'Gaurav K.', college: 'CBIT - EEE', eventsRegistered: ['RoboWars Heavyweight'], date: '2 days ago', amount: 500 }
    ]
  },
  {
    id: 'amb_rahul',
    name: 'Rahul Reddy',
    college: 'VNR Vignana Jyothi Institute (VNR VJIET)',
    avatar: 'RR',
    referralCode: 'FEST26-AMB-RAHUL',
    totalReferrals: 41,
    totalRevenue: 16400,
    rank: 3,
    points: 4100,
    stipendEarned: 3280,
    badge: 'Gold Pioneer',
    recentReferrals: [
      { id: 'r8', studentName: 'Kavya S.', college: 'VNR - IT', eventsRegistered: ['Web3 Decentralized Arena'], date: 'Today, 3:10 PM', amount: 400 },
      { id: 'r9', studentName: 'Vivek Sharma', college: 'VNR - CSE', eventsRegistered: ['CodeSprint 2026'], date: 'Yesterday', amount: 300 }
    ]
  }
];

// ---------------- Ambassador Milestone Rewards ----------------
export const AMBASSADOR_MILESTONES: MilestoneReward[] = [
  {
    id: 'm-1',
    targetReferrals: 5,
    rewardTitle: 'Official Certificate of Leadership',
    perksDescription: 'Dean-signed Certificate of Campus Representation & Leadership for your resume and LinkedIn.',
    status: 'unlocked',
    badge: 'Level 1 Achieved'
  },
  {
    id: 'm-2',
    targetReferrals: 15,
    rewardTitle: 'Free VIP All-Access Festronix Pass',
    perksDescription: '100% Free entry to all 30+ arenas, pro-shows, celebrity guest keynotes, and food vouchers worth ₹500.',
    status: 'unlocked',
    badge: 'Level 2 Achieved'
  },
  {
    id: 'm-3',
    targetReferrals: 30,
    rewardTitle: 'Festronix Cyber Swag Kit & Hoodie',
    perksDescription: 'Limited edition metallic embroidery hoodie, cyber pass lanyard, holographic badge, and tech stickers pack.',
    status: 'unlocked',
    badge: 'Level 3 Achieved'
  },
  {
    id: 'm-4',
    targetReferrals: 50,
    rewardTitle: '₹5,000 Cash Grant + LOR from Dean SAC',
    perksDescription: 'Direct bank cash bonus + formal Letter of Recommendation for internships and higher education.',
    status: 'unlocked',
    badge: 'Level 4 Achieved'
  },
  {
    id: 'm-5',
    targetReferrals: 100,
    rewardTitle: 'Campus Ambassador of the Year Trophy',
    perksDescription: 'Felicitation on the Grand Stage by College Chairman & Dean during the Valedictory Ceremony + ₹15,000 Grand Prize.',
    status: 'current',
    badge: 'Final Milestone'
  }
];

// ---------------- Leaderboard Entries ----------------
export const AMBASSADOR_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Aditya Verma', college: 'Vardhaman College of Engineering', referrals: 68, points: 6800, badge: 'Grand Diamond' },
  { rank: 2, name: 'Sneha Kulkarni', college: 'CBIT Hyderabad', referrals: 52, points: 5200, badge: 'Platinum Leader' },
  { rank: 3, name: 'Rahul Reddy', college: 'VNR VJIET', referrals: 41, points: 4100, badge: 'Gold Pioneer' },
  { rank: 4, name: 'Pooja Sharma', college: 'JNTU Hyderabad', referrals: 34, points: 3400, badge: 'Gold Pioneer' },
  { rank: 5, name: 'Kiran Teja', college: 'Osmania University College of Engg', referrals: 29, points: 2900, badge: 'Rising Star' },
  { rank: 6, name: 'Nikhil Goud', college: 'Mahatma Gandhi Institute of Tech (MGIT)', referrals: 24, points: 2400, badge: 'Rising Star' },
  { rank: 7, name: 'Bhavani Shankar', college: 'Gokaraju Rangaraju (GRIET)', referrals: 19, points: 1900, badge: 'Rising Star' },
  { rank: 8, name: 'Deepika Rao', college: 'Vasavi College of Engineering', referrals: 15, points: 1500, badge: 'Ambassador' }
];

// ---------------- Marketing Templates for Ambassadors ----------------
export const MARKETING_TEMPLATES = [
  {
    id: 'wa-1',
    channel: 'WhatsApp Groups & Broadcasts',
    title: 'Flagship Announcement & Registration Link',
    text: `⚡ *FESTRONIX 2026 IS HERE!* ⚡\nNational Level Technical Fest @ Vardhaman College of Engineering, Hyderabad.\n\n🏆 *₹5,00,000+ Prize Pool* across 30+ Flagship Arenas:\n• Autonomous Robotics & RoboWars\n• 36-Hr National AI Hackathon\n• Drone Racing & Circuitrix\n• VIP Concert & Tech Night\n\n🎟️ Register now through my official ambassador link for instant cryptographic pass & priority seating:\n👉 https://festronix-fawn.vercel.app/?ref={CODE}\n\nUse Referral Code: *{CODE}*`
  },
  {
    id: 'ig-1',
    channel: 'Instagram Story & Bio Blurb',
    title: 'Story Caption & Bio Link',
    text: `Ready to dominate South India's biggest technical battleground? 🚀 FESTRONIX '26 is officially live at Vardhaman College of Engineering!\n\nUse my exclusive ambassador pass code *{CODE}* to claim your verified entry pass:\n🔗 https://festronix-fawn.vercel.app/?ref={CODE}`
  },
  {
    id: 'dc-1',
    channel: 'Discord & Telegram Channels',
    title: 'Developer & Hacker Invite',
    text: `Calling all coders, bot builders, and hardware geeks! 🤖\nFestronix 2026 registration is live. 30+ arenas, ₹5L+ prizes, cash grants, and national bragging rights.\n\nInstant check-in pass link: https://festronix-fawn.vercel.app/?ref={CODE} (Code: {CODE})`
  }
];
