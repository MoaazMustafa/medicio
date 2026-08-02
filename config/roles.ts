/**
 * Single source of truth for role-based routing.
 * Kept dependency-free so it can be imported from middleware (Edge), Route
 * Handlers (Node) and Client Components without pulling in Prisma.
 */

export const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/chatbot",
  DOCTOR: "/doctor/dashboard",
  PHARMACY_ADMIN: "/pharmacy/dashboard",
  LAB_ADMIN: "/lab/dashboard",
  HOSPITAL_ADMIN: "/hospital/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

export const HOME_ROUTE = "/";

export function dashboardForRole(role?: string | null): string {
  if (!role) return HOME_ROUTE;

  return ROLE_DASHBOARDS[role] ?? HOME_ROUTE;
}

/** Routes that authenticated users should never see. */
export const GUEST_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
] as const;

/** Route prefixes gated by role. Super Admin and Admin can access all portals. */
export const PROTECTED_ROUTES: ReadonlyArray<{
  prefix: string;
  allowedRoles: readonly string[];
}> = [
  {
    prefix: "/chatbot",
    allowedRoles: [
      "PATIENT",
      "DOCTOR",
      "HOSPITAL_ADMIN",
      "LAB_ADMIN",
      "PHARMACY_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
    ],
  },
  { prefix: "/admin", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/doctor", allowedRoles: ["DOCTOR", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/pharmacy", allowedRoles: ["PHARMACY_ADMIN", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/lab", allowedRoles: ["LAB_ADMIN", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/hospital", allowedRoles: ["HOSPITAL_ADMIN", "ADMIN", "SUPER_ADMIN"] },
  {
    prefix: "/settings",
    allowedRoles: [
      "PATIENT",
      "DOCTOR",
      "HOSPITAL_ADMIN",
      "LAB_ADMIN",
      "PHARMACY_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
    ],
  },
];
