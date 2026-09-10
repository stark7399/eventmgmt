// Latest change: Project now has eventStartDate/eventEndDate (replacing single eventDate) and phase can be set manually at any time; ShotListItem gets assignedTo (crew name); EditingTask.assignedTo now expected to match a CrewAssignment.crewName on the project; CrewAssignment shift is now a date range instead of specific start/end times.

export type UserRole = "admin" | "crew" | "client";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  photoURL?: string;
  createdAt: number; // ms timestamp
}

export type ProjectPhase = "pre-event" | "event-day" | "post-event" | "delivered";

export interface Project {
  id: string;
  clientName: string;
  clientUserId?: string; // linked client account, if they have one
  eventType: string; // "wedding", "engagement", etc.
  eventStartDate: number; // ms timestamp
  eventEndDate: number; // ms timestamp - same as start for a single-day event
  location: string;
  geoLat?: number;
  geoLng?: number;
  phase: ProjectPhase;
  moodBoardLinks: string[];
  keyContacts: { name: string; relation: string; phone: string }[];
  creativeBrief: string;
  budget: number;
  createdAt: number;
  createdBy: string; // admin uid
  galleryUrl?: string; // external gallery link (Pixieset, Cloudinary, etc.)
  galleryExpiresAt?: number; // ms timestamp - when the download link expires
}

export type TaskPhase = "pre-event" | "event-day" | "post-event";

// scheduled = not started yet, live = actively being worked on right now,
// finished = done. Replaces the old done-only boolean so the dashboard can show
// what's currently live vs. what's next vs. what's wrapped up.
export type TaskStatus = "scheduled" | "live" | "finished";

export interface TodoTask {
  id: string;
  projectId?: string; // optional - unset means a general/studio-wide task
  phase: TaskPhase;
  title: string;
  status: TaskStatus;
  done: boolean; // kept in sync with status === "finished", for any older reads
  assignedTo?: string; // uid
  dueDate?: number;
  createdAt: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: "camera" | "lens" | "lighting" | "battery" | "memory-card" | "other";
  serialNumber?: string;
  bookedDates: { projectId: string; date: number }[]; // for conflict checking
}

export type CrewRole = "lead-photographer" | "second-shooter" | "cinematographer" | "drone-pilot" | "editor";

export interface CrewAssignment {
  id: string;
  projectId: string;
  crewName: string; // typed name, not a linked account - matches editingTasks.assignedTo pattern
  role: CrewRole;
  phone?: string;
  shiftStartDate: number; // ms timestamp, date only (no time-of-day)
  shiftEndDate: number; // ms timestamp, date only - same as start for a single-day shift
  dailyRate: number;
}

export interface ShotListItem {
  id: string;
  projectId: string;
  category: string; // "Ceremony", "Portraits", "Candid", "Decor"
  label: string;
  done: boolean;
  isTemplate: boolean;
  skipped?: boolean; // couldn't be captured as planned during the shoot
  skipNote?: string; // why it was skipped (e.g. "bad light, revisit golden hour")
  assignedTo?: string; // crew member's name (matches CrewAssignment.crewName on this project)
}

export type EditingStage = "importing" | "selection" | "color-grading" | "video-edit" | "final-qc" | "delivered";

export interface EditingTask {
  id: string;
  projectId: string;
  title: string; // e.g. "Ceremony highlight reel", "Full gallery color pass"
  stage: EditingStage;
  assignedTo?: string; // freelance/internal editor's name (not a linked account)
  deadline: number;
  notes?: string;
}

export interface FinanceRecord {
  id: string;
  projectId: string;
  type: "invoice" | "expense" | "payout";
  amount: number;
  status: "pending" | "paid" | "overdue";
  description: string;
  dueDate?: number;
  paidAt?: number;
}

export interface CalendarEvent {
  id: string;
  projectId?: string; // optional - unset means a general/studio-wide event
  title: string;
  date: number;
  type: "prep-deadline" | "shoot-date" | "post-deadline";
}

export interface RevisionRequest {
  id: string;
  projectId: string;
  message: string;
  requestedBy: string; // client uid
  status: "open" | "resolved";
  createdAt: number;
}
