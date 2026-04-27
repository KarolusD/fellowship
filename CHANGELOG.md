# Changelog

All notable changes to Fellowship are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-27

Initial public release.

### Added

- Nine specialized companions covering the full product lifecycle (Aragorn, Merry, Gimli, Legolas, Boromir, Pippin, Sam, Arwen, Bilbo).
- Gandalf orchestrator, skill-injected via SessionStart hook — no agent override required.
- Persistent project memory via `docs/fellowship/` and per-agent memory.
- Tiered routing (Tier 1–4) with conservative escalation.
- Scoped tool permissions per agent.
- Cross-platform hooks (Unix + Windows via polyglot `run-hook.cmd`).
- Health check (`hooks/health-check.mjs`) validating manifests, hooks, agent frontmatter, and skill directories.
- AutoImprove loop for overnight agent improvement (Gimli, Gandalf, Legolas).
