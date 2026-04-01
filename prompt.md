# CanvasEngine Refactor — Agent Prompt

You are executing the CanvasEngine refactor for the `impasto` project. This is a
multi-phase structural refactor of the canvas feature. Your job is to implement the
next incomplete phase, then stop.

---

## Step 1 — Read all three reference files in full before writing any code

1. **`CANVAS_ENGINE_PLAN.md`** — the full refactor plan: background, motivation,
   design decisions, phase steps, and acceptance criteria. This is your requirements
   document and roadmap.

2. **`comments.md`** — learnings, deviations, surprises, and watch-outs left by
   previous agents. Read this carefully — earlier phases may have changed something
   that affects the current one.

3. **`CLAUDE.md`** (repo root) — project-wide rules you must follow. In particular:
   no business logic in components or hooks; files under 160 lines; no dead code.

---

## Step 2 — Identify the next incomplete phase

Scan `CANVAS_ENGINE_PLAN.md` for the first phase checkbox that is `[ ]` (not `[x]`).
That is the phase you will implement. Do not skip ahead. Do not implement more than
one phase for this run.

---

## Step 3 — Explore before writing

Before touching any file, read the files relevant to the phase. Understand the
current implementation fully. Do not guess at what a file contains.

Key files to be aware of (not exhaustive — read what the phase requires):

```
src/features/canvas/
  CanvasViewport.tsx
  CanvasContext.tsx
  useViewportTransform.ts
  viewportMath.ts
  interactionMachine.ts
  useInteraction.ts
  useCanvasPipeline.ts
  useCanvasMeasure.ts
  SamplePinsOverlay.tsx
  SamplerOverlay.tsx
  MarqueeSelectOverlay.tsx
  SamplePin.tsx
  usePinDrag.ts
  usePinHitTest.ts
  useMarqueeDrag.ts
  ToolRail/index.tsx
  ContextualToolbar/index.tsx
src/features/editor/
  editorStore.ts
  useEditorHotkeys.ts
  Editor.tsx
```

---

## Step 4 — Implement the phase

Follow the steps listed in the plan exactly. If you need to deviate, document the
reason in `comments.md` before proceeding.

Rules:

- No business logic in `.tsx` files or `use*` hooks — only wiring and rendering.
- Keep all files under 160 lines. Split if needed.
- Delete files the plan says to delete. Do not leave dead code.
- Write the tests described in the phase. Do not defer them.
- Run `npm run typecheck` after implementation. Fix all type errors before finishing.
- Run `npm run test` to verify unit tests pass.
- Do not run Playwright tests — they are slow and not required per phase.

---

## Step 5 — Update tracking

When the phase is complete:

1. In `CANVAS_ENGINE_PLAN.md`, change the phase checkbox from `[ ]` to `[x]`.
2. In `comments.md`, add a phase entry section (use the format defined in that
   file) with:
   - Any deviations from the plan
   - Surprises or obstacles you encountered
   - Decisions you made
   - Things the next phase should watch out for

---

## Step 6 — Stop

Do not start the next phase. Report back with:

- Which phase you completed
- A brief summary of what changed
- Any concerns or open questions for the human to review before continuing
