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
  about?: string;
  headquarters?: string;
  awardHighlight?: string;
  keyProjects?: string[];
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
  },
  {
    id: 'sanvi_homes',
    companyName: 'Sanvi Homes',
    tagline: 'Building Spaces People Are Proud to Own • Premium Gated Communities',
    tier: 'Platinum Partner',
    tierBadgeColor: '#A855F7',
    logo: '/sanvi_homes_logo.png',
    website: 'https://sanvihomes.com/',
    pocName: 'Himavardhan Reddy',
    pocRole: 'VP of Marketing & Strategic Partnerships',
    pocContact: '+91 76709 47089',
    pocEmail: 'info@sanvihomes.com',
    sacLeadName: 'Md. Asif (Dean SAC)',
    sacLeadContact: '+91 98480 99112',
    stallLocation: 'Central Block Promenade • Premium Real Estate Pavilion',
    stallNumber: 'Pavilion #P-01',
    mouStatus: 'Signed & Executed',
    invoiceStatus: 'Paid & Cleared',
    about: 'Sanvi Homes (Sanvi Properties India Pvt. Ltd.) was founded by NRIs in 2014, specializing in thoughtfully designed residential and gated communities across Hyderabad. Awarded the CREDAI Telangana Certificate of Excellence for "Best Standalone Apartment" (Cosmos), Sanvi Homes delivers modern architecture, lifestyle amenities, and long-term value.',
    headquarters: 'The District, 9th Floor, Financial District, Puppalguda, Hyderabad',
    awardHighlight: 'CREDAI Telangana "Best Standalone Apartment" Category Award Winner',
    keyProjects: [
      'One East (Hayathnagar) – 4.2 Acre Premium Gated Community, 7 Towers (G+9), 450 Luxury 2 & 3 BHK Flats',
      'Tellapur – Upcoming Luxury Gated Community Development',
      'Cosmos, Urbn, Meadows, Iris, Mayflower & Orchids (Kondapur & Gachibowli)',
      'Crescent (Hayathnagar)'
    ],
    metrics: {
      stageKeynoteTime: 'Day 1 • 2:30 PM (Sustainable Urban Architecture Keynote)',
      brandedBannersAllocated: 16,
      vipLoungePasses: 25,
      estimatedReach: '40,000+ Footfall',
      impressionsCount: '1.5M Digital Impressions'
    },
    deliverables: [
      {
        id: 'sh-1',
        title: 'Official Platinum Partner Branding & Digital Presence',
        category: 'digital',
        status: 'completed',
        description: 'Permanent official brand feature across Festronix 2026 portal, sponsors page, and digital credentials.',
        dueDate: 'Immediate'
      },
      {
        id: 'sh-2',
        title: 'Central Promenade VIP Experiential Pavilion',
        category: 'on_ground',
        status: 'in_progress',
        description: 'Dedicated double-bay interactive experience pavilion with 3D architectural walk-throughs and student/faculty offers.',
        dueDate: 'Nov 28, 2026',
        location: 'Pavilion #P-01, Central Promenade'
      },
      {
        id: 'sh-3',
        title: 'Main Auditorium LED Stage Backdrop Slot',
        category: 'stage',
        status: 'completed',
        description: 'High-definition 4K brand video showcase during inaugurals, hackathon finals, and celebrity events.',
        dueDate: 'Dec 1, 2026'
      },
      {
        id: 'sh-4',
        title: 'Sustainable Architecture & Urban Design Seminar',
        category: 'stage',
        status: 'scheduled',
        description: 'Interactive session exploring smart sustainable cities, green building tech, and future urban living in Hyderabad.',
        dueDate: 'Dec 2, 2026'
      },
      {
        id: 'sh-5',
        title: 'Official Lanyard & Delegate Kit Co-Branding',
        category: 'branding',
        status: 'in_progress',
        description: 'Official Platinum Partner emblem printed across delegate passes, route directories, and VIP kits.',
        dueDate: 'Nov 29, 2026'
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
