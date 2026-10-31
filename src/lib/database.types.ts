export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          college: string;
          roll_number: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          college?: string;
          roll_number: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          college?: string;
          roll_number?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          chief_coordinator: string | null;
          contact: string | null;
          icon_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          chief_coordinator?: string | null;
          contact?: string | null;
          icon_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          chief_coordinator?: string | null;
          contact?: string | null;
          icon_name?: string | null;
          created_at?: string;
        };
      };
      admin_roles: {
        Row: {
          id: string;
          user_id: string;
          role:
            | 'super_admin'
            | 'dean_sac'
            | 'connect_club'
            | 'vencorpia'
          | 'dept_chief_coordinator'
            | 'dept_coordinator'
            | 'event_coordinator'
          | 'faculty_coord'
          | 'student_coord'
            | 'finance_reviewer'
          | 'volunteer_checkin'
            | 'checkin_staff';
          username: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          access_boundary: string | null;
          active: boolean;
          department_code: string | null;
          event_id: string | null;
          granted_by: string | null;
          designation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role:
            | 'super_admin'
            | 'dean_sac'
            | 'connect_club'
            | 'vencorpia'
            | 'dept_chief_coordinator'
            | 'dept_coordinator'
            | 'event_coordinator'
            | 'faculty_coord'
            | 'student_coord'
            | 'finance_reviewer'
            | 'volunteer_checkin'
            | 'checkin_staff';
          username?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          access_boundary?: string | null;
          active?: boolean;
          department_code?: string | null;
          event_id?: string | null;
          granted_by?: string | null;
          designation?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?:
            | 'super_admin'
            | 'dean_sac'
            | 'connect_club'
            | 'vencorpia'
            | 'dept_chief_coordinator'
            | 'dept_coordinator'
            | 'event_coordinator'
            | 'faculty_coord'
            | 'student_coord'
            | 'finance_reviewer'
            | 'volunteer_checkin'
            | 'checkin_staff';
          username?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          access_boundary?: string | null;
          active?: boolean;
          department_code?: string | null;
          event_id?: string | null;
          granted_by?: string | null;
          designation?: string | null;
          created_at?: string;
        };
      };
      admin_event_assignments: {
        Row: {
          admin_user_id: string;
          event_id: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          admin_user_id: string;
          event_id: string;
          granted_by?: string | null;
          created_at?: string;
        };
        Update: {
          admin_user_id?: string;
          event_id?: string;
          granted_by?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          tagline: string | null;
          department_id: string | null;
          department_code: string;
          category: 'technical' | 'workshop' | 'hackathon' | 'non-technical' | 'gaming' | 'departmental';
          format: 'individual' | 'duo' | 'team';
          min_team_size: number;
          max_team_size: number;
          fee: number;
          capacity: number;
          registered_count: number;
          deadline: string;
          date_display: string;
          time_display: string;
          venue: string;
          description: string;
          rules: Json;
          prizes: Json;
          eligibility: string;
          coordinator_name: string;
          coordinator_phone: string;
          coordinator_email: string;
          status: 'upcoming' | 'open' | 'full' | 'closed' | 'completed' | 'pending_approval';
          banner_gradient: string;
          payment_instructions: string | null;
          faqs: Json;
          approval_status: 'approved' | 'pending' | 'rejected';
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          tagline?: string | null;
          department_id?: string | null;
          department_code: string;
          category: 'technical' | 'workshop' | 'hackathon' | 'non-technical' | 'gaming' | 'departmental';
          format: 'individual' | 'duo' | 'team';
          min_team_size?: number;
          max_team_size?: number;
          fee?: number;
          capacity?: number;
          registered_count?: number;
          deadline?: string;
          date_display?: string;
          time_display?: string;
          venue?: string;
          description?: string;
          rules?: Json;
          prizes?: Json;
          eligibility?: string;
          coordinator_name?: string;
          coordinator_phone?: string;
          coordinator_email?: string;
          status?: 'upcoming' | 'open' | 'full' | 'closed' | 'completed' | 'pending_approval';
          banner_gradient?: string;
          payment_instructions?: string | null;
          faqs?: Json;
          approval_status?: 'approved' | 'pending' | 'rejected';
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          tagline?: string | null;
          department_id?: string | null;
          department_code?: string;
          category?: 'technical' | 'workshop' | 'hackathon' | 'non-technical' | 'gaming' | 'departmental';
          format?: 'individual' | 'duo' | 'team';
          min_team_size?: number;
          max_team_size?: number;
          fee?: number;
          capacity?: number;
          registered_count?: number;
          deadline?: string;
          date_display?: string;
          time_display?: string;
          venue?: string;
          description?: string;
          rules?: Json;
          prizes?: Json;
          eligibility?: string;
          coordinator_name?: string;
          coordinator_phone?: string;
          coordinator_email?: string;
          status?: 'upcoming' | 'open' | 'full' | 'closed' | 'completed' | 'pending_approval';
          banner_gradient?: string;
          payment_instructions?: string | null;
          faqs?: Json;
          approval_status?: 'approved' | 'pending' | 'rejected';
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      registrations: {
        Row: {
          id: string;
          display_id: string;
          user_id: string | null;
          buyer_roll: string | null;
          event_id: string;
          event_title: string;
          leader_name: string;
          leader_email: string;
          leader_phone: string;
          leader_college: string;
          leader_roll: string;
          format: 'individual' | 'duo' | 'team';
          fee: number;
          source: 'online' | 'spot';
          team_name: string | null;
          team_code: string | null;
          department_code: string | null;
          checked_in: boolean;
          checked_in_at: string | null;
          checked_in_by: string | null;
          payment_status: 'payment_required' | 'verification_pending' | 'verified' | 'rejected' | 'not_applicable';
          transaction_id: string | null;
          payment_screenshot_url: string | null;
          rejection_reason: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_id: string;
          user_id?: string | null;
          buyer_roll?: string | null;
          event_id: string;
          event_title: string;
          leader_name: string;
          leader_email: string;
          leader_phone: string;
          leader_college?: string;
          leader_roll: string;
          format?: 'individual' | 'duo' | 'team';
          fee?: number;
          source?: 'online' | 'spot';
          team_name?: string | null;
          team_code?: string | null;
          department_code?: string | null;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          payment_status?: 'payment_required' | 'verification_pending' | 'verified' | 'rejected' | 'not_applicable';
          transaction_id?: string | null;
          payment_screenshot_url?: string | null;
          rejection_reason?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_id?: string;
          user_id?: string | null;
          buyer_roll?: string | null;
          event_id?: string;
          event_title?: string;
          leader_name?: string;
          leader_email?: string;
          leader_phone?: string;
          leader_college?: string;
          leader_roll?: string;
          format?: 'individual' | 'duo' | 'team';
          fee?: number;
          source?: 'online' | 'spot';
          team_name?: string | null;
          team_code?: string | null;
          department_code?: string | null;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          payment_status?: 'payment_required' | 'verification_pending' | 'verified' | 'rejected' | 'not_applicable';
          transaction_id?: string | null;
          payment_screenshot_url?: string | null;
          rejection_reason?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      registration_members: {
        Row: {
          id: string;
          registration_id: string;
          name: string;
          email: string;
          phone: string;
          college: string;
          roll_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          name: string;
          email: string;
          phone: string;
          college: string;
          roll_number: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          college?: string;
          roll_number?: string;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          registration_id: string;
          qr_token: string;
          checked_in: boolean;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          qr_token: string;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          qr_token?: string;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
      };
      payment_proofs: {
        Row: {
          id: string;
          registration_id: string;
          screenshot_path: string;
          transaction_ref: string | null;
          status: string;
          reviewed_by: string | null;
          rejection_reason: string | null;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          registration_id: string;
          screenshot_path: string;
          transaction_ref?: string | null;
          status?: string;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          registration_id?: string;
          screenshot_path?: string;
          transaction_ref?: string | null;
          status?: string;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: 'urgent' | 'general' | 'prize' | 'workshop';
          scope: 'fest-wide' | 'department' | 'event';
          department_code: string | null;
          published_by: string | null;
          date_display: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          type: 'urgent' | 'general' | 'prize' | 'workshop';
          scope: 'fest-wide' | 'department' | 'event';
          department_code?: string | null;
          published_by?: string | null;
          date_display?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          type?: 'urgent' | 'general' | 'prize' | 'workshop';
          scope?: 'fest-wide' | 'department' | 'event';
          department_code?: string | null;
          published_by?: string | null;
          date_display?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_registration: {
        Args: {
          p_event_id: string;
          p_user_id?: string | null;
          p_buyer_roll?: string | null;
          p_leader_name?: string;
          p_leader_email?: string;
          p_leader_phone?: string;
          p_leader_college?: string;
          p_leader_roll?: string;
          p_format?: string;
          p_fee?: number;
          p_source?: string;
          p_payment_status?: string;
          p_transaction_id?: string | null;
          p_payment_screenshot_url?: string | null;
          p_spot_registered_by?: string | null;
          p_teammates?: Json;
          p_team_name?: string | null;
          p_team_code?: string | null;
        };
        Returns: Json;
      };
      create_registrations: {
        Args: {
          p_user_id?: string | null;
          p_items?: Json;
          p_source?: string;
        };
        Returns: Json;
      };
      review_registration_payment: {
        Args: { p_display_id: string; p_status: string; p_rejection_reason?: string | null };
        Returns: Json;
      };
      check_in_registration: {
        Args: {
          p_qr_token_or_id: string;
          p_staff_name?: string;
        };
        Returns: Json;
      };
      toggle_check_in_registration: {
        Args: { p_display_id: string; p_staff_name?: string };
        Returns: Json;
      };
      soft_delete_event: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      get_user_role: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          role: string;
          department_code: string | null;
          event_id: string | null;
        }[];
      };
      is_admin: {
        Args: {
          p_user_id: string;
        };
        Returns: boolean;
      };
      is_global_admin: {
        Args: {
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
