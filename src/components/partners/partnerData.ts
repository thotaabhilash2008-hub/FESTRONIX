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
    sacLeadName: 'Md. Asif (Dean SAC)',
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
  }
];

// ---------------- Pre-loaded Campus Ambassador Profiles ----------------
export const AMBASSADOR_PROFILES: AmbassadorProfile[] = [];

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
export const AMBASSADOR_LEADERBOARD: LeaderboardEntry[] = [];

// ---------------- Marketing Templates for Ambassadors ----------------
export const MARKETING_TEMPLATES = [
  {
    id: 'wa-1',
    channel: 'WhatsApp Groups & Broadcasts',
    title: 'Flagship Announcement & Registration Link',
    text: `⚡ *FESTRONIX 2026 IS HERE!* ⚡\nNational Level Technical Fest @ Vardhaman College of Engineering, Hyderabad.\n\n🏆 *₹1,00,000+ Prize Pool* across 30+ Flagship Arenas:\n• Autonomous Robotics & RoboWars\n• 36-Hr National AI Hackathon\n• Drone Racing & Circuitrix\n• VIP Concert & Tech Night\n\n🎟️ Register now through my official ambassador link for instant cryptographic pass & priority seating:\n👉 https://festronix-fawn.vercel.app/?ref={CODE}\n\nUse Referral Code: *{CODE}*`
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
