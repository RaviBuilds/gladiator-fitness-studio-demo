// Zero-dependency tests for the shared tool session handoff + Tool 03 state, and the event emitter.
// Run: node --test scripts/tool-session.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIRST30_KEY,
  HANDOFF_KEY,
  clearFirst30State,
  mergeToolHandoff,
  parseFirst30State,
  parseToolHandoff,
  readFirst30State,
  readToolHandoff,
  serializeFirst30State,
  serializeToolHandoff,
  writeFirst30State,
  writeToolHandoff,
} from "../lib/tool-session.ts";
import { TOOL_EVENT, emitToolEvent } from "../lib/tool-events.ts";

test("handoff round-trips", () => {
  const h = { v: 1, source: "start", experience: "new", timePreference: "evening", daysPerWeek: "3" };
  assert.deepEqual(parseToolHandoff(serializeToolHandoff(h)), h);
});

test("handoff: wrong version, unknown source, malformed or unsafe values are rejected", () => {
  for (const raw of [null, "", "{", "[]", "42", '{"v":2,"source":"start"}', '{"v":1,"source":"other"}']) {
    assert.equal(parseToolHandoff(raw), null, String(raw));
  }
  const dirty = parseToolHandoff(JSON.stringify({ v: 1, source: "journey", experience: "<script>", daysPerWeek: 3 }));
  assert.deepEqual(dirty, { v: 1, source: "journey" });
});

test("handoff merge: a later tool never wipes an earlier tool's field", () => {
  const fromStart = mergeToolHandoff(null, { source: "start", experience: "regular", timePreference: "morning", daysPerWeek: "4" });
  const fromJourney = mergeToolHandoff(fromStart, { source: "journey", experience: "new", daysPerWeek: "2" });
  assert.deepEqual(fromJourney, { v: 1, source: "journey", experience: "new", timePreference: "morning", daysPerWeek: "2" });
});

test("tool state round-trips and rejects bad shapes", () => {
  const s = { phase: "flow", step: 2, answers: { experience: "new", days: ["tue"] }, includeObstacle: true };
  assert.deepEqual(parseFirst30State(serializeFirst30State(s)), { v: 1, ...s });
  assert.equal(parseFirst30State('{"v":0,"phase":"flow"}'), null);
  assert.equal(parseFirst30State('{"v":1,"phase":"done"}'), null);
  assert.deepEqual(parseFirst30State('{"v":1,"phase":"result","step":99,"answers":[1]}'), {
    v: 1,
    phase: "result",
    step: 0,
    answers: {},
    includeObstacle: false,
  });
});

test("browser wrappers are no-ops without window (SSR / Node)", () => {
  assert.equal(readToolHandoff(), null);
  assert.equal(readFirst30State(), null);
  writeToolHandoff({ source: "start", experience: "new" });
  writeFirst30State({ phase: "entry", step: 0, answers: {}, includeObstacle: false });
  clearFirst30State();
  emitToolEvent("first30_started");
});

test("wrappers use sessionStorage; clearing Tool 03 keeps the shared handoff", () => {
  const store = new Map();
  const target = new EventTarget();
  const fakeWindow = {
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    dispatchEvent: (e) => target.dispatchEvent(e),
    dataLayer: [],
  };
  globalThis.window = fakeWindow;
  try {
    writeToolHandoff({ source: "start", experience: "new", timePreference: "evening" });
    writeFirst30State({ phase: "flow", step: 1, answers: { feeling: "nervous" }, includeObstacle: false });
    assert.equal(readToolHandoff().experience, "new");
    assert.equal(readFirst30State().step, 1);
    clearFirst30State();
    assert.equal(store.has(FIRST30_KEY), false);
    assert.equal(store.has(HANDOFF_KEY), true, "Start over preserves the handoff");

    const seen = [];
    target.addEventListener(TOOL_EVENT, (e) => seen.push(e.detail));
    emitToolEvent("first30_question_completed", { step: "schedule" });
    assert.deepEqual(seen, [{ name: "first30_question_completed", step: "schedule" }]);
    assert.deepEqual(fakeWindow.dataLayer, [{ event: "first30_question_completed", step: "schedule" }]);

    // A throwing storage (privacy mode) never breaks a tool.
    fakeWindow.sessionStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    assert.equal(readToolHandoff(), null);
    writeToolHandoff({ source: "journey", experience: "new" });
    clearFirst30State();
  } finally {
    delete globalThis.window;
  }
});
