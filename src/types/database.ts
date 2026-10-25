export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row extends Record<string, unknown>, Insert extends Record<string, unknown>, Update extends Record<string, unknown>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type CustomerRequestType = "cab_booking" | "tour_quote" | "temple_tour" | "cab_attachment";
export type CustomerRequestStatus = "New" | "Reviewing" | "Quoted" | "Contacted" | "Confirmed" | "Rejected" | "Completed";
export type DriverApplicationStatus = "New" | "Reviewing" | "Shortlisted" | "Contacted" | "Rejected" | "Hired";

export type CustomerRequestRow = {
  request_id: string;
  submission_id: string;
  request_type: CustomerRequestType;
  customer_name: string;
  mobile: string;
  request_data: Json;
  contact_consent: boolean;
  status: CustomerRequestStatus;
  quoted_amount: number | null;
  quote_notes: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export type DriverApplicationRow = {
  application_id: string;
  full_name: string;
  mobile: string;
  whatsapp: string;
  city_area: string;
  experience_years: number;
  licence_status: "Valid" | "Renewal in progress" | "No";
  badge_status: "Yes" | "No" | "Not applicable";
  police_verification_certificate: "Yes" | "No";
  preferred_work_type: "Full-time" | "Part-time" | "Weekend";
  preferred_shift: string;
  languages: string;
  previous_experience: string;
  expected_monthly_salary: number | null;
  additional_information: string;
  contact_consent: boolean;
  status: DriverApplicationStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export type TourPackageRow = {
  id: string;
  slug: string;
  name: string;
  state: string;
  categories: string[];
  hero_image: string;
  package_data: Json;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      customer_requests: Table<CustomerRequestRow, Omit<CustomerRequestRow, "request_id" | "status" | "quoted_amount" | "quote_notes" | "admin_notes" | "created_at" | "updated_at"> & Partial<Pick<CustomerRequestRow, "request_id" | "status" | "quoted_amount" | "quote_notes" | "admin_notes" | "created_at" | "updated_at">>, Partial<CustomerRequestRow>>;
      driver_applications: Table<DriverApplicationRow, Omit<DriverApplicationRow, "application_id" | "status" | "admin_notes" | "created_at" | "updated_at"> & Partial<Pick<DriverApplicationRow, "application_id" | "status" | "admin_notes" | "created_at" | "updated_at">>, Partial<DriverApplicationRow>>;
      tour_packages: Table<TourPackageRow, Omit<TourPackageRow, "created_at" | "updated_at"> & Partial<Pick<TourPackageRow, "created_at" | "updated_at">>, Partial<TourPackageRow>>;
      driver_application_rate_limits: Table<{ ip_hash: string; window_started_at: string; request_count: number }, { ip_hash: string; window_started_at?: string; request_count?: number }, Partial<{ ip_hash: string; window_started_at: string; request_count: number }>>;
    };
    Views: Record<string, never>;
    Functions: {
      is_driver_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      consume_driver_application_rate_limit: { Args: { p_ip_hash: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
