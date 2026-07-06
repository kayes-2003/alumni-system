export type UserRole = "admin" | "alumni" | "student";
export type MembershipPlan = "monthly" | "yearly" | "lifetime";
export type MembershipStatus = "active" | "expired" | "cancelled" | "pending";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type JobType = "full-time" | "part-time" | "internship" | "contract";
export type MentorshipStatus = "pending" | "accepted" | "rejected" | "completed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          bio: string | null;
          department_id: string | null;
          batch_id: string | null;
          graduation_year: number | null;
          current_job_title: string | null;
          current_company: string | null;
          location: string | null;
          skills: string[] | null;
          linkedin_url: string | null;
          github_url: string | null;
          website_url: string | null;
          is_profile_public: boolean;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      departments: {
        Row: { id: string; name: string; code: string; created_at: string };
        Insert: { id?: string; name: string; code: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["departments"]["Row"]>;
      };
      batches: {
        Row: { id: string; name: string; start_year: number; end_year: number; created_at: string };
        Insert: { id?: string; name: string; start_year: number; end_year: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["batches"]["Row"]>;
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          plan: MembershipPlan;
          status: MembershipStatus;
          started_at: string;
          expires_at: string | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["memberships"]["Row"]> & {
          user_id: string;
          plan: MembershipPlan;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          membership_id: string | null;
          amount: number;
          currency: string;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          user_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          banner_url: string | null;
          location: string | null;
          is_virtual: boolean;
          start_time: string;
          end_time: string;
          capacity: number | null;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          title: string;
          description: string;
          start_time: string;
          end_time: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          checked_in: boolean;
          qr_code: string;
          registered_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_registrations"]["Row"]> & {
          event_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_registrations"]["Row"]>;
      };
      jobs: {
        Row: {
          id: string;
          posted_by: string;
          title: string;
          company: string;
          location: string | null;
          job_type: JobType;
          description: string;
          requirements: string | null;
          apply_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jobs"]["Row"]> & {
          posted_by: string;
          title: string;
          company: string;
          job_type: JobType;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          cover_letter: string | null;
          resume_url: string | null;
          status: string;
          applied_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["job_applications"]["Row"]> & {
          job_id: string;
          applicant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_applications"]["Row"]>;
      };
      mentorship_requests: {
        Row: {
          id: string;
          student_id: string;
          alumni_id: string;
          message: string;
          status: MentorshipStatus;
          scheduled_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mentorship_requests"]["Row"]> & {
          student_id: string;
          alumni_id: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["mentorship_requests"]["Row"]>;
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          image_url: string | null;
          department_id: string | null;
          batch_id: string | null;
          likes_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["posts"]["Row"]> & {
          author_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Row"]>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comments"]["Row"]> & {
          post_id: string;
          author_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      gallery: {
        Row: {
          id: string;
          event_id: string | null;
          image_url: string;
          caption: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["gallery"]["Row"]> & {
          image_url: string;
          uploaded_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["gallery"]["Row"]>;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contact_messages"]["Row"]> & {
          name: string;
          email: string;
          subject: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Row"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type Batch = Database["public"]["Tables"]["batches"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];s