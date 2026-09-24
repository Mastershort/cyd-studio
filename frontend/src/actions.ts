// Action builder – mirrors generator/actions.py and the helpers in generator/model.py.
import type { Project, Widget } from "./types";

export type Trigger = "tap" | "long_press" | "double_tap";
export const TRIGGERS: Trigger[] = ["tap", "long_press", "double_tap"];
export const STEP_TYPES = ["toggle", "service", "page", "back", "home", "popup", "delay"] as const;
export type StepType = (typeof STEP_TYPES)[number];

export interface ActionStep {
  type: StepType;
  entity?: string | null;
  service?: string;
  target?: string | null;
  data?: Record<string, unknown>;
  page?: string;
  ms?: number;
}

const ID_RE = /^[a-z_]+\.[a-z0-9_]+$/;

/** Configured steps of a trigger, or null for the widget's built-in behavior. */
export function triggerSteps(w: Widget, trigger: Trigger): ActionStep[] | null {
  const conf = (w as unknown as Record<string, unknown>)[trigger] as { actions?: unknown } | null | undefined;
  if (!conf || typeof conf !== "object" || !Array.isArray(conf.actions)) return null;
  return (conf.actions as ActionStep[]).filter((s) => s && typeof s === "object" && STEP_TYPES.includes(s.type));
}

/** Why a step cannot run (null = fine); same keys as generator/model.step_problem. */
export function stepProblem(project: Project, w: Widget, s: ActionStep): "entity" | "service" | "page" | null {
  if (s.type === "toggle") {
    const entity = s.entity || w.entity;
    return entity && ID_RE.test(entity) ? null : "entity";
  }
  if (s.type === "service") {
    if (!ID_RE.test(String(s.service ?? ""))) return "service";
    return s.target && !ID_RE.test(s.target) ? "entity" : null;
  }
  if (s.type === "page") return project.pages.some((p) => p.id === s.page) ? null : "page";
  return null;
}
