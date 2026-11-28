export type AppPage = "home" | "driver-register" | "admin" | "cab-attachment" | "temple-tours" | "tour-package";

export const ADMIN_PATHS = ["/admin", "/dashboard", "/driver-admin"] as const;
export const DRIVER_REGISTER_PATH = "/driver-register";
export const CAB_ATTACHMENT_PATH = "/cab-attachment";

function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isDriverAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.includes(normalizePathname(pathname) as (typeof ADMIN_PATHS)[number]);
}

export function isDriverRegisterPath(pathname: string): boolean {
  return normalizePathname(pathname) === DRIVER_REGISTER_PATH;
}

export function isCabAttachmentPath(pathname: string): boolean {
  return normalizePathname(pathname) === CAB_ATTACHMENT_PATH;
}

export function isTourPath(pathname: string): boolean {
  return pathname.startsWith("/tour-packages") || pathname.startsWith("/chennai-to-kodaikanal-cab") || pathname.startsWith("/chennai-to-ooty-cab");
}
