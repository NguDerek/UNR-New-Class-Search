export type Role = "Guest" | "Student" | "Instructor" | "Advisor" | "Admin";

export const viewPermissions: Record<string, Role[]> = {
  home: ["Guest", "Student", "Instructor", "Advisor", "Admin"],
  search: ["Guest", "Student", "Instructor", "Admin"],
  planner: ["Guest", "Student"],
  programs: ["Guest", "Student", "Advisor"],
  settings: ["Student", "Instructor", "Advisor", "Admin"],
  admin: ["Admin"],
};