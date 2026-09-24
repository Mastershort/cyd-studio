// Condition semantics must match generator/logic.cpp_condition (C++ on the device).
import { describe, expect, it } from "vitest";
import { evalCondition, isVisible, matchingRule } from "../src/logic";
import type { HassEntity, Widget } from "../src/types";

const states: Record<string, string> = { "sensor.t": "26.5", "person.a": "home", "light.l": "off", "sensor.x": "unavailable" };
const res = (id: string): HassEntity | undefined => (id in states ? { entity_id: id, state: states[id], attributes: {} } : undefined);
const w = (extra: Partial<Widget> = {}): Widget => ({ id: "w", type: "sensor_value", x: 0, y: 0, w: 1, h: 1, entity: "sensor.t", props: {}, ...extra });

describe("conditions", () => {
  it("numeric and state comparisons", () => {
    expect(evalCondition({ op: "gt", value: "25" }, w(), res)).toBe(true);
    expect(evalCondition({ op: "lt", value: "25" }, w(), res)).toBe(false);
    expect(evalCondition({ entity: "sensor.x", op: "gt", value: "-1" }, w(), res)).toBe(true); // atof("unavailable") == 0
    expect(evalCondition({ entity: "sensor.missing", op: "gt", value: "-1" }, w(), res)).toBe(false); // empty state
    expect(evalCondition({ entity: "person.a", op: "eq", value: "home" }, w(), res)).toBe(true);
    expect(evalCondition({ entity: "light.l", op: "on" }, w(), res)).toBe(false);
    expect(evalCondition({ entity: "light.l", op: "off" }, w(), res)).toBe(true);
  });
  it("visibility needs all conditions; invalid ones are ignored", () => {
    expect(isVisible(w({ visible_if: [{ entity: "person.a", op: "eq", value: "home" }, { op: "gt", value: "30" }] }), res)).toBe(false);
    expect(isVisible(w({ visible_if: [{ entity: "person.a", op: "eq", value: "home" }, { op: "gt", value: "abc" }] }), res)).toBe(true);
  });
  it("first matching rule wins", () => {
    const rules = [{ op: "gt", value: "30", text: "#111111" }, { op: "gt", value: "25", text: "#ef4444" }, { op: "gt", value: "0", text: "#00ff00" }];
    expect(matchingRule(w({ style_rules: rules }), res)?.text).toBe("#ef4444");
  });
});
