import { requireSupabase } from "../lib/supabase";
import type { CustomerRequestRow, CustomerRequestStatus, DriverApplicationRow, DriverApplicationStatus, TourPackageRow } from "../types/database";

const PAGE_SIZE = 500;

async function readPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export function fetchAdminCustomerRequests(): Promise<CustomerRequestRow[]> {
  const client = requireSupabase();
  return readPages((from, to) => client.from("customer_requests").select("*").order("created_at", { ascending: false }).order("request_id", { ascending: false }).range(from, to));
}

export function fetchAdminDriverApplications(): Promise<DriverApplicationRow[]> {
  const client = requireSupabase();
  return readPages((from, to) => client.from("driver_applications").select("*").order("created_at", { ascending: false }).order("application_id", { ascending: false }).range(from, to));
}

export function fetchAdminTourPackages(): Promise<TourPackageRow[]> {
  const client = requireSupabase();
  return readPages((from, to) => client.from("tour_packages").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true }).range(from, to));
}

export async function updateCustomerRequest(requestId: string, patch: Partial<Pick<CustomerRequestRow, "status" | "quoted_amount" | "quote_notes" | "admin_notes">>): Promise<CustomerRequestRow> {
  const { data, error } = await requireSupabase().from("customer_requests").update(patch).eq("request_id", requestId).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDriverApplication(applicationId: string, patch: Partial<Pick<DriverApplicationRow, "status" | "admin_notes">>): Promise<DriverApplicationRow> {
  const { data, error } = await requireSupabase().from("driver_applications").update(patch).eq("application_id", applicationId).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTourPackage(id: string, patch: Partial<TourPackageRow>): Promise<TourPackageRow> {
  const { data, error } = await requireSupabase().from("tour_packages").update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createTourPackage(packageRow: Omit<TourPackageRow, "created_at" | "updated_at">): Promise<TourPackageRow> {
  const { data, error } = await requireSupabase().from("tour_packages").insert(packageRow).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTourPackage(id: string): Promise<void> {
  const { error } = await requireSupabase().from("tour_packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type AdminStatus = CustomerRequestStatus | DriverApplicationStatus;
