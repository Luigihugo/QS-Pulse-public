export type OrgRole = "owner" | "admin" | "hr" | "manager" | "employee";

export interface Org {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  headline: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfilePrivateData {
  id: string;
  org_id: string;
  user_id: string;
  birth_date: string | null;
  hire_date: string | null;
  shoe_size: string | null;
  address_line: string | null;
  address_number: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface OrgWithMember extends Org {
  role: OrgRole;
}

// Supabase retorna orgs aninhado em org_members
export type OrgMemberRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  orgs?: Org | null;
};

// Feed
export interface Post {
  id: string;
  org_id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface PostWithAuthor extends Post {
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
}

// Holerites
export interface Payslip {
  id: string;
  org_id: string;
  user_id: string;
  year: number;
  month: number;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface PayslipWithProfile extends Payslip {
  profiles?: Pick<Profile, "id" | "full_name"> | null;
}

// Org chart
export interface Team {
  id: string;
  org_id: string;
  name: string;
  parent_team_id: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & { full_name: string | null })[];
  children: TeamWithMembers[];
}

// Feedback
export type FeedbackRequestStatus = "pending" | "completed";

export interface FeedbackRequest {
  id: string;
  org_id: string;
  requester_id: string;
  recipient_id: string;
  status: FeedbackRequestStatus;
  message: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  org_id: string;
  from_user_id: string;
  about_user_id: string;
  request_id: string | null;
  is_anonymous: boolean;
  template_id: string | null;
  content: string | null;
  in_person: boolean;
  internal_notes: string | null;
  created_at: string;
}

export interface FeedbackScore {
  feedback_id: string;
  dimension_key: string;
  score: number;
}

export interface FeedbackTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  prompt: string | null;
  created_by: string | null;
  created_at: string;
}

export const FEEDBACK_DIMENSIONS: { key: string; label: string }[] = [
  { key: "cultural_alignment", label: "Alinhamento cultural" },
  { key: "excellence", label: "Excelência" },
  { key: "innovation", label: "Inovação" },
  { key: "transparency", label: "Transparência" },
  { key: "commitment", label: "Comprometimento" },
  { key: "reliability", label: "Confiabilidade" },
];
