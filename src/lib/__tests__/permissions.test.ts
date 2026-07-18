import { describe, it, expect } from "vitest";
import {
  canSeeAllProjects,
  canEditProductCatalog,
  canManageUsers,
  canDeleteProject,
  canUpdateMarkup,
} from "../permissions";

// These lock in the Phase-0 "fail closed" fix: a null user (unauthenticated,
// unlinked, or Clerk error) must be denied every permission. Before the fix
// each helper returned true for null, which meant any unknown caller got full
// access.
describe("permissions fail closed for a null user", () => {
  it("canSeeAllProjects(null) is false", () => {
    expect(canSeeAllProjects(null)).toBe(false);
  });
  it("canEditProductCatalog(null) is false", () => {
    expect(canEditProductCatalog(null)).toBe(false);
  });
  it("canManageUsers(null) is false", () => {
    expect(canManageUsers(null)).toBe(false);
  });
  it("canDeleteProject(null) is false", () => {
    expect(canDeleteProject(null)).toBe(false);
  });
  it("canUpdateMarkup(null, ...) is false", () => {
    expect(canUpdateMarkup(null, "any-user-id")).toBe(false);
  });
});

describe("permissions honor roles", () => {
  it("a PROJECT_MANAGER cannot see all projects", () => {
    expect(canSeeAllProjects({ role: "PROJECT_MANAGER" })).toBe(false);
  });
  it("senior/admin roles can see all projects", () => {
    for (const role of ["SENIOR_PM", "OFFICE_ADMIN", "OPS_MANAGER", "SYSTEM_ADMIN"]) {
      expect(canSeeAllProjects({ role })).toBe(true);
    }
  });
  it("only admin/ops/office may edit the catalog", () => {
    expect(canEditProductCatalog({ role: "OFFICE_ADMIN" })).toBe(true);
    expect(canEditProductCatalog({ role: "OPS_MANAGER" })).toBe(true);
    expect(canEditProductCatalog({ role: "SENIOR_PM" })).toBe(false);
    expect(canEditProductCatalog({ role: "PROJECT_MANAGER" })).toBe(false);
  });
  it("only admin/ops may delete projects (plus senior PM)", () => {
    expect(canDeleteProject({ role: "SENIOR_PM" })).toBe(true);
    expect(canDeleteProject({ role: "PROJECT_MANAGER" })).toBe(false);
  });
  it("a user may edit their own markup; PMs may not edit others'", () => {
    expect(canUpdateMarkup({ id: "u1", role: "PROJECT_MANAGER" }, "u1")).toBe(true);
    expect(canUpdateMarkup({ id: "u1", role: "PROJECT_MANAGER" }, "u2")).toBe(false);
    expect(canUpdateMarkup({ id: "a1", role: "OPS_MANAGER" }, "u2")).toBe(true);
  });
});
