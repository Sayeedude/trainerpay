import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * These tests don't need a live Postgres connection — they read the SQL
 * migration files directly and check structural invariants the spec cares
 * about. They're a cheap way to catch "someone added a table and forgot
 * RLS" or "someone accidentally gave a write policy to the wrong role"
 * before it ever reaches a real database. They complement, not replace,
 * running the migrations against a real Supabase project.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, "../../database/migrations");

function readAllMigrations(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  expect(files.length, "expected at least one migration file").toBeGreaterThan(0);
  return files.map((f) => readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")).join("\n\n");
}

// Spec section 14's minimum table list.
const REQUIRED_TABLES = [
  "users",
  "employees",
  "pay_rates",
  "classes",
  "class_allocations",
  "leave",
  "cover",
  "payroll_periods",
  "payroll_lines",
  "payroll_exceptions",
  "audit_log",
];

describe("database schema (spec section 14)", () => {
  const sql = readAllMigrations();

  it.each(REQUIRED_TABLES)("creates the %s table", (table) => {
    const re = new RegExp(`create table\\s+${table}\\s*\\(`, "i");
    expect(sql).toMatch(re);
  });

  it.each(REQUIRED_TABLES)("enables Row Level Security on %s", (table) => {
    const re = new RegExp(`alter table ${table} enable row level security`, "i");
    expect(sql).toMatch(re);
  });

  it("never overwrites pay_rates in place — enforces one current row per employee instead", () => {
    expect(sql).toMatch(/create unique index idx_pay_rates_one_current_per_employee/i);
  });

  it("distinguishes raw hours from payroll hours per the 3x-multiplier rule (spec section 7)", () => {
    expect(sql).toMatch(/raw_hours numeric/i);
    expect(sql).toMatch(/payroll_hours numeric/i);
    expect(sql).toMatch(/create type hours_source as enum/i);
  });

  it("marks a former employee inactive at the schema level (spec section 4)", () => {
    expect(sql).toMatch(/employees_former_is_inactive/i);
  });
});

describe("RLS policy guarantees (spec section 15)", () => {
  const sql = readAllMigrations();

  it("gives audit_log no write policy for any role — append-only via log_audit_event() only", () => {
    const auditLogPolicies = [...sql.matchAll(/create policy\s+(\S+)\s+on\s+audit_log\s+for\s+(\w+)/gi)];
    expect(auditLogPolicies.length).toBeGreaterThan(0);
    for (const [, , command] of auditLogPolicies) {
      expect(command.toLowerCase()).toBe("select");
    }
  });

  it("gives pay_rates no write policy that isn't admin-gated", () => {
    // Every INSERT/UPDATE/DELETE/ALL policy on pay_rates must check is_admin().
    const writePolicyBlocks = [...sql.matchAll(/create policy\s+\S+\s+on\s+pay_rates\s+for\s+(all|insert|update|delete)([\s\S]*?);/gi)];
    expect(writePolicyBlocks.length).toBeGreaterThan(0);
    for (const [, , body] of writePolicyBlocks) {
      expect(body).toMatch(/is_admin\(\)/);
    }
  });

  it("requires is_admin() (not ACADEMIC_MANAGER) to write payroll_periods", () => {
    const block = sql.match(/create policy payroll_periods_write_admin[\s\S]*?;/i);
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/is_admin\(\)/);
    expect(block![0]).not.toMatch(/is_academic_manager/);
  });
});
