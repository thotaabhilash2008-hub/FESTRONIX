export type EventCategory = 
  | 'technical' 
  | 'workshop' 
  | 'hackathon' 
  | 'non-technical' 
  | 'gaming' 
  | 'departmental';

export type FestCategory = EventCategory;

export type EventFormat = 'individual' | 'duo' | 'team';
export type ParticipationFormat = EventFormat;

export type EventState = 'upcoming' | 'open' | 'full' | 'closed' | 'completed' | 'pending_approval';

export type PaymentStatus = 
  | 'payment_required' 
  | 'verification_pending' 
  | 'verified' 
  | 'rejected' 
  | 'not_applicable';

export type RegistrationSource = 'online' | 'spot';

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  chiefCoordinator: string;
  contact: string;
  iconName: string;
}

export interface FestEvent {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  departmentId?: string;
  departmentCode: string;
  category: EventCategory;
  format: EventFormat;
  minTeamSize: number;
  maxTeamSize: number;
  fee: number; // 0 for free
  capacity: number;
  registeredCount: number;
  deadline: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  rules: string[];
  prizes: {
    first: string;
    second?: string;
    third?: string;
    special?: string;
  };
  eligibility?: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  status: EventState;
  bannerGradient?: string;
  paymentInstructions?: string; // FR-EVT-05
  faqs?: { question: string; answer: string }[]; // FR-EVT-07
  approvalStatus?: 'approved' | 'pending' | 'rejected'; // FR-EVT-08
}

export interface Teammate {
  name: string;
  email: string;
  phone: string;
  college: string;
  rollNumber: string;
}

export interface User {
  id: string;
  username: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  password?: string;
  createdAt: string;
}

export interface Team {
  id: string; // e.g. TEAM-9042
  teamCode: string; // e.g. FX-CSE-8921
  teamName: string;
  eventId: string;
  eventTitle: string;
  registrationId: string;
  leaderId?: string;
  leaderName: string;
  leaderRoll: string;
  leaderEmail: string;
  leaderPhone: string;
  leaderCollege: string;
  members: Teammate[];
  maxTeamSize: number;
  minTeamSize: number;
  createdAt: string;
}

export interface Registration {
  id: string; // e.g. FEST-2026-9042
  userId?: string; // id of the purchasing user
  buyerRoll?: string; // roll number of the buyer
  eventId: string;
  eventTitle: string;
  teamName?: string;
  teamCode?: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  leaderCollege: string;
  leaderRoll: string;
  teammates: Teammate[];
  format: EventFormat;
  fee: number;
  source: RegistrationSource;
  registrationDate: string;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  paymentScreenshotUrl?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  qrToken: string;
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  spotRegisteredBy?: string;
  departmentCode?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'general' | 'prize' | 'workshop';
  scope: 'fest-wide' | 'department';
  departmentCode?: string;
  date: string;
}

export interface FestStats {
  totalRegistrations: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  spotCount: number;
  onlineCount: number;
  totalCollected: number;
  totalCapacity: number;
  checkedInCount: number;
}

export interface OrganisationalRoleDefinition {
  role: string;
  responsibilities: string;
  accessBoundary: string;
  scopeTag: 'public' | 'participant' | 'event_coordinator' | 'dept_chief_coordinator' | 'super_admin' | 'finance' | 'volunteer';
  accounts?: string[];
}
