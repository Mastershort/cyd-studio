// Conditions (visible_if) and state rules (style_rules) – mirrors generator/logic.py.
import { ON_STATES } from "./model";
import type { HassEntity, Widget } from "./types";

export type Op = "eq" | "ne" | "on" | "off" | "gt" | "lt";
export const OPS: Op[] = ["eq", "ne", "on", "off", "gt", "lt"];

export interface Condition {
  entity?: string | null;
  op: Op;
  value?: string;
}

export interface StyleRule extends Condition {
  bg?: string;
  border?: string;
  text?: string;
  icon?: string;
}

type Resolver = (entityId: string) => HassEntity | undefined;

function valid(c: Condition, w: Widget): boolean {
  const entity = c.entity || w.entity;
  if (!OPS.includes(c.op) || !entity || !/^[a-z_]+\.[a-z0-9_]+$/.test(entity)) return false;
  if ((c.op === "gt" || c.op === "lt") && Number.isNaN(Number.parseFloat(String(c.value ?? "")))) return false;
  return true;
}

/** Same semantics as generator/logic.cpp_condition (state strings, atof for numbers). */
export function evalCondition(c: Condition, w: Widget, state: Resolver): boolean {
  const st = state(String(c.entity || w.entity))?.state ?? "";
  switch (c.op) {
    case "on": return ON_STATES.includes(st);
    case "off": return !ON_STATES.includes(st);
    case "gt": return st !== "" && (Number.parseFloat(st) || 0) > Number.parseFloat(String(c.value));
    case "lt": return st !== "" && (Number.parseFloat(st) || 0) < Number.parseFloat(String(c.value));
    case "eq": return st === String(c.value ?? "");
    case "ne": return st !== String(c.value ?? "");
  }
}

export function isVisible(w: Widget, state: Resolver): boolean {
  const conds = ((w.visible_if ?? []) as Condition[]).filter((c) => valid(c, w));
  return conds.every((c) => evalCondition(c, w, state));
}

export function matchingRule(w: Widget, state: Resolver): StyleRule | null {
  const rules = ((w.style_rules ?? []) as StyleRule[]).filter((r) => valid(r, w));
  return rules.find((r) => evalCondition(r, w, state)) ?? null;
}
