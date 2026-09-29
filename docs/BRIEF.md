# Project Brief

> The original requirements for this repository. Later work sessions start from this file,
> [PLAN.md](PLAN.md) and [../CLAUDE.md](../CLAUDE.md).

## Goal

A public reference repository showing senior-level test automation with Playwright + TypeScript,
plus a human-in-the-loop, AI-assisted test generation workflow. The intended readers are
engineering teams (e.g. FinTech / SaaS) evaluating test automation approaches. It must look and
behave like a real production framework, not a tutorial.

## Hard constraints

- No reference to any employer, internal project, client, or proprietary code/data. Everything is
  original and uses public demo apps/APIs.
- No secrets in the repo. Use `.env.example` and environment variables.
- No hard waits (no `waitForTimeout`). Use web-first assertions and proper locators
  (`getByRole` / `getByLabel` / `getByTestId` first).
- Tests are deterministic and pass locally and in CI before each commit.
- No invented metrics, badges, or claims.

## Step 0 — plan before coding

1. Propose 2–3 candidate systems under test (banking/payments-like UI flows preferred, plus a
   public REST API with an OpenAPI/Swagger spec). Verify reachability, note stability risks and a
   fallback.
2. Propose the repo name, folder structure and key design decisions.
3. Wait for approval before writing code.

## Phase 1 (MVP) — framework skeleton

- Playwright + TypeScript (strict), ESLint + Prettier, npm scripts.
- Config: multiple environments via env vars; projects for chromium/firefox/webkit plus one mobile
  viewport; retries only in CI; trace/screenshot/video on failure; HTML report.
- UI layer: page objects exposed through custom fixtures; test data builders; tags
  (`@smoke`, `@regression`) with scripts to run by tag.
- API layer: model / builder / service pattern (typed request/response models, payload builders,
  service classes wrapping endpoints), plus schema validation of responses.
- 4–5 meaningful UI tests (e.g. login, transfer funds, validation errors) and 4–5 API tests
  (happy path, negative, schema).
- GitHub Actions: lint, typecheck, tests with sharding, HTML report uploaded as an artifact.
- Commit at the end of the phase using conventional commits.

## Phase 2 — AI-assisted workflow

- Playwright MCP config (`.mcp.json`) so an AI agent can explore the app in a browser.
- Reusable, versioned AI instructions (under `/ai`, exposed as Claude Code commands), each with
  inputs, steps, conventions and an output checklist:
  1. `generate-ui-test` — from a user story, explore the app via Playwright MCP, then write tests
     that follow this repo's page objects, fixtures and locator rules.
  2. `generate-api-tests` — from the OpenAPI spec, generate tests using the model/builder/service
     structure.
  3. `change-impact` — from a git diff, list affected areas, tests to run, and tests to update/add.
  4. `review-ai-tests` — checklist for reviewing AI-generated tests (locator quality, assertions
     that verify behaviour, no hard waits, data isolation, flakiness risks).
- `CLAUDE.md` with repo conventions so any AI agent follows them.
- One real end-to-end demo: user story → generated test → run → review with the checklist → fix.
  Record before/after in `docs/ai-workflow-example.md`, including what the AI got wrong and how
  the review caught it. Commit the AI draft and the reviewed version separately so history shows
  the review.

## Phase 3 — README

- Top section: what the repo demonstrates, in ≤ 5 lines.
- Architecture diagram (Mermaid), how to run locally and in CI, main design decisions and
  trade-offs.
- "AI-assisted testing workflow" section: human-in-the-loop, what is automated vs reviewed, link
  to the worked example.
- Short "Applying this to a project" section (assessment → framework → CI → AI workflow).
- MIT license. Author name and links as placeholders.

## Working style

- Work phase by phase. After each phase: summary, test run results, open questions — then wait
  for a go-ahead.
- If a demo app is down or flaky, stop and report rather than weakening the tests.
