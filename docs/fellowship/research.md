# Research Behind Fellowship's Design

Fellowship's architecture isn't guesswork — it's informed by academic research, industry best practices, and production experience from existing multi-agent systems. This document maps key design decisions to the research that shaped them.

---

## Multi-Agent Orchestration

**How should an orchestrator communicate with its workers?**

The most critical design question for any multi-agent system. Fellowship uses a **principles + reporting protocol** pattern: workers (companions) get engineering principles for craft quality and a structured reporting format for communication. The orchestrator (Gandalf) owns the workflow and routing logic.

### Key findings

- **Anthropic's multi-agent research system** found that "simple, short instructions" caused worker misinterpretation. They evolved to granular task descriptions with specific objectives, output formats, and clear boundaries. Fellowship's dispatching protocol follows this — Gandalf provides full task text, relevant context, and scope boundaries. ([Source](https://www.anthropic.com/engineering/multi-agent-research-system))

- **Anthropic's agent-building guide** recommends: "Instill good heuristics rather than rigid rules by studying how skilled humans approach tasks and encoding these strategies in prompts." This directly informed our choice of principles over prescriptive workflow stages. ([Source](https://www.anthropic.com/research/building-effective-agents))

- **Superpowers plugin** (the most mature open-source Claude Code multi-agent system) uses a 4-status reporting protocol (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED) that Fellowship adopts. Their pattern: heavy process in the orchestrator, principles in the worker. ([Source](https://github.com/obra/superpowers))

- **OpenAI Agents SDK** distinguishes "agents as tools" (orchestrator keeps control) from "handoffs" (ownership transfers). Fellowship uses the tools pattern — Gandalf keeps control, companions assist. ([Source](https://openai.github.io/openai-agents-python/multi_agent/))

- **Klarna's production pattern** emphasizes: "Every handoff has an explicit contract" and architectures should "fail gracefully rather than cascade." Fellowship's reporting protocol is that contract. ([Source](https://www.klarna.com/international/press/klarna-internal-data-shows-ai-utilization-up-across-customer-facing-and-internal-workstreams/))

### What we chose NOT to do

- **Prescriptive workflow stages** — research showed that worker performance degrades with too much instruction (~3,000 token threshold per CodeScene). The orchestrator should own the workflow; the worker should own the craft.
- **Background observer agents** — Mastra uses these for memory compression, but Claude Code can't run background agents. Not architecturally possible.
- **Agent-to-agent handoffs** — Claude Code subagents can't spawn other subagents. All orchestration goes through Gandalf.

---

## Engineering Principles

**What makes AI-generated code good?**

Fellowship's seven engineering principles are each grounded in documented failure modes of AI coding agents.

### Key findings

- **Addy Osmani** ("My LLM Coding Workflow Going Into 2026") advocates spec-before-code and spending ~70% on specifications. Forcing thinking before code reduces hallucination ~40%. This informed "understand before building." ([Source](https://addyosmani.com/blog/ai-coding-workflow/))

- **Armin Ronacher** ("Agentic Coding Recommendations") found that agents produce 2x concurrency errors and 3x readability issues versus human code. Common failures: abstraction bloat, dead code accumulation, assumption propagation. This informed "simplicity first" and "no dead code." ([Source](https://lucumr.pocoo.org/))

- **CodeScene's research** showed that agents perform best in healthy codebases (Code Health 9.5+) and that without test guardrails, AI adoption produces up to 41% more defects. This informed "match existing patterns" and "verify your work." ([Source](https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality))

- **Pete Hodgson** ("Why Your AI Coding Assistant Keeps Doing It Wrong") noted that agents arrive as "brand new hires" each session. Providing 2-3 similar implementations as reference dramatically improves output. This informed "understand before building" — find references first. ([Source](https://blog.petehodgson.com/))

- **Simon Willison** ("Agentic Engineering Patterns", Feb 2026) recommends test-first development with agents: write tests, audit them, then implement. This informed our verification principle — though Fellowship makes new tests a judgment call rather than a mandate, because we have Pippin for dedicated testing. ([Source](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/))

- **MIT Missing Semester 2026** explicitly recommends TDD with agents and emphasizes the tight feedback loop: write code, run tests, fix, iterate. Fellowship's verification principle captures this loop without mandating TDD for every change. ([Source](https://missing.csail.mit.edu/2026/agentic-coding/))

- **Wiz Research** found 45% of AI-generated code contains OWASP Top-10 vulnerabilities. This is why Fellowship's self-review checklist includes a security check — even though Boromir handles dedicated security reviews. ([Source](https://www.wiz.io/blog/safer-vibe-coding-rules-files))

- **Anthropic's Claude Code best practices** emphasize "only make changes that are directly requested or clearly necessary." This informed the scope check in the self-review checklist — agents should not make unsolicited improvements. ([Source](https://www.anthropic.com/engineering/claude-code-best-practices))

### The testing decision

Superpowers mandates TDD as an iron law: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST." Fellowship takes a different approach:

- **Gimli** (engineer) verifies his work — runs existing tests, writes new tests only for non-trivial logic
- **Pippin** (test engineer) writes thorough test suites as planned, dedicated work
- **Gandalf** (orchestrator) decides whether to dispatch Pippin based on the criticality of the code

This avoids test sprawl while maintaining verification as a mandatory practice. The research supports both approaches — Fellowship's advantage is having specialized companions, so the engineer doesn't need to be a TDD zealot.

---

## Memory Architecture

**How should agents remember across sessions?**

Fellowship uses a three-layer memory architecture. Each layer was chosen based on specific research findings.

### Key findings

- **Mastra's Observational Memory** (2026) achieved 94.87% on LongMemEval — the highest score ever recorded — by converting raw messages into structured, timestamped observations. Their key insight: *observations during execution* are a distinct memory type most systems miss. Fellowship's learnings log (`docs/fellowship/learnings.md`) captures this episodic knowledge without Mastra's infrastructure overhead. ([Source](https://mastra.ai/research/observational-memory))

- **"Memory in the Age of AI Agents"** survey (Dec 2025, arXiv:2512.13564) decomposes memory into Formation, Evolution, and Retrieval. It identifies three types: semantic (facts), episodic (experiences), and procedural (workflows). Fellowship's specs are semantic, the learnings log is episodic, and plans are procedural — covering all three without a specialized memory system.

- **A-MEM** (NeurIPS 2025, arXiv:2502.12110) uses Zettelkasten-inspired notes with LLM-generated keywords and dynamic links. The insight: categorized, tagged memories are more retrievable than unstructured ones. Fellowship's learnings log uses categories (`engineering`, `tooling`, `codebase`, `process`, `environment`) for this reason — scannable without search infrastructure.

- **"Multi-Agent Memory from a Computer Architecture Perspective"** (Mar 2026, arXiv:2603.10062) proposes a three-layer hierarchy: I/O layer, cache layer, memory layer. Fellowship mirrors this: context window (working), per-agent memory (cache), shared files (long-term).

- **File-based memory consensus** (claude-mem, Manus, OpenClaw, Claude Code itself) — multiple successful projects converge on markdown files as the memory store. The pattern works well up to ~5MB. Beyond that, you need search. Fellowship will stay well under this threshold. ([Source](https://dev.to/imaginex/ai-agent-memory-management-when-markdown-files-are-all-you-need-5ekk))

- **Collaborative Memory** (ICML 2025, arXiv:2505.18279) explores multi-agent memory with access controls: private memory visible only to the originating agent, shared memory with selective fragments. Fellowship implements this naturally: per-agent memory is private, `docs/fellowship/` is shared, and Gandalf curates what each companion receives.

### The three layers

| Layer | Research basis | What it handles |
|---|---|---|
| Claude Code auto-memory | Built-in, proven at scale | User preferences, build commands, working style |
| Per-agent memory (`memory: project`) | Collaborative Memory (ICML 2025) — private agent knowledge | Agent-specific patterns and discoveries |
| Fellowship shared memory (`docs/fellowship/`) | Mastra, A-MEM, file-based consensus | Quest log, learnings, specs, plans |

### The curator pattern

Rather than giving every agent access to all memory, Gandalf reads shared memory and selects what's relevant for each companion's dispatch. This is supported by:

- **Context engineering research** (Weaviate, 2026): treat the context window as a scarce resource. Optimize what information is included. ([Source](https://weaviate.io/blog/context-engineering))
- **Anthropic's context engineering guidance** (Sep 2025): "Every unnecessary word actively degrades agent performance." ([Source](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents))
- **GAM (General Agentic Memory)**: keeps a full archive plus minimal cues, then compiles tailored context per request. Outperforms long-context LLMs. ([Source](https://venturebeat.com/ai/gam-takes-aim-at-context-rot-a-dual-agent-memory-architecture/))

### What we chose NOT to build

- **Vector database / semantic search** — overkill for a file-based plugin under 5MB. Contradicts "light and non-intrusive" philosophy.
- **Background Observer/Reflector agents** — can't run background agents in Claude Code. The overhead isn't justified at our scale.
- **AI summarization at session end** — Claude Code's SessionEnd hook has a 1.5-second timeout. Not enough for AI compression.
- **Linked note graphs (A-MEM style)** — insufficient volume of memories to warrant associative retrieval.

---

## Escalation Protocol

**When should an AI agent stop and ask for help?**

This is arguably the most important design decision for any coding agent.

### Key findings

- **Anthropic's autonomy research** ("Measuring Agent Autonomy") found that on complex tasks, Claude Code stops to ask for clarification more than twice as often as humans interrupt it — and this is a feature, not a bug. Agents that force solutions produce worse outcomes than agents that escalate. ([Source](https://www.anthropic.com/research/measuring-agent-autonomy))

- **ESCALATE.md protocol** — an open standard for AI agent human approval, defining when agents should pause for human input. Fellowship's escalation triggers (ambiguous requirements, multiple valid approaches, high-impact operations, low confidence) align with this standard. ([Source](https://escalate.md/))

- **Steve Kinney** ("Sub-Agent Anti-Patterns") documents the "silent failure" anti-pattern: agents produce work they're unsure about rather than escalating. Fellowship counters this with explicit instruction: "Bad work is worse than no work. It is always OK to stop and say 'I need help.'" ([Source](https://stevekinney.com/courses/ai-development/subagent-anti-patterns))

- **Anthropic's harness guidance** ("Effective Harnesses for Long-Running Agents") recommends: "Let the agent know when a tool is failing and let it adapt." Systems should resume from checkpoints rather than restart. Fellowship's BLOCKED status enables this pattern. ([Source](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents))

---

## Session Continuity

**How do you resume work across sessions?**

The simplest unsolved problem in most AI coding tools.

### Key findings

- **Superpowers plugin** has no cross-session memory. Each session starts fresh. If work stops mid-plan, the next session must be told where to resume. Fellowship's quest log (`docs/fellowship/quest-log.md`) solves this with a single, human-readable file.

- **claude-mem** (37.2k GitHub stars) hooks into 5 lifecycle events and achieves cross-session continuity through dual storage (SQLite + ChromaDB). Effective but heavy. Fellowship achieves the core benefit (session continuity) with a single markdown file — no databases, no services. ([Source](https://github.com/thedotmack/claude-mem))

- **Architecture Decision Records (ADR)** — a proven software engineering practice for capturing decision provenance. Fellowship's design specs serve this role, with dates in filenames for temporal context. ([Source](https://adr.github.io/))

---

## Progress Tracking & Quest Log Design

**How should an orchestrator track progress without the file growing unbounded?**

The quest log needs to serve two purposes: "where am I now?" (session continuity) and "what has been built?" (architectural context). Every system that handles both uses some form of tiered retention.

### Key findings

- **Letta/MemGPT** uses OS-inspired memory tiering — core memory (always in context, like RAM) vs archival memory (searchable, like disk). Evicted messages undergo recursive summarization. This inspired Fellowship's three-zone quest log: Current (RAM), Recently Completed (cache), What Exists (consolidated). ([Source](https://www.letta.com/blog/agent-memory))

- **Mastra's Reflector** consolidates observations when they exceed a count threshold — combining related items, identifying patterns, dropping irrelevant context. Fellowship adopts count-triggered consolidation: when Recently Completed exceeds 7 items, oldest fold into What Exists. ([Source](https://mastra.ai/docs/memory/observational-memory))

- **Mem0** merges related information and resolves conflicts at write time rather than appending indefinitely. This informed our consolidation approach — What Exists is a living summary, not an append-only list. ([Source](https://mem0.ai/research))

- **Context window budget research** shows Claude Code's own CLAUDE.md files see reduced adherence beyond 200 lines. The quest log targets an 80-line budget to stay well within useful context range. ([Source](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents))

### The three-zone pattern

| Zone | Purpose | Cap | Detail level |
|---|---|---|---|
| Current | "Where am I now?" | 3 items | Full detail |
| Recently Completed | "What was just built?" | 7 items | One line each |
| What Exists | "What capabilities exist?" | 15 lines | Architectural summary |

When Recently Completed overflows, oldest items consolidate into What Exists and get appended to an archive file (`quest-log-archive.md`) that is never auto-loaded — zero token cost unless explicitly requested.

---

## Full Source List

### Anthropic
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Measuring Agent Autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Engineering Practices
- [Addy Osmani — My LLM Coding Workflow Going Into 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [Simon Willison — Agentic Engineering Patterns (Feb 2026)](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/)
- [MIT Missing Semester 2026 — Agentic Coding](https://missing.csail.mit.edu/2026/agentic-coding/)
- [CodeScene — Agentic AI Coding Best Practice Patterns](https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality)
- [Armin Ronacher — Agentic Coding Recommendations](https://lucumr.pocoo.org/)
- [Wiz — Secure AI Vibe Coding with Rules Files](https://www.wiz.io/blog/safer-vibe-coding-rules-files)
- [ESCALATE.md — AI Agent Human Approval Protocol](https://escalate.md/)

### Memory, Context & Progress Tracking
- [Mastra — Observational Memory Research](https://mastra.ai/research/observational-memory)
- [Memory in the Age of AI Agents (arXiv:2512.13564)](https://arxiv.org/abs/2512.13564)
- [A-MEM: Agentic Memory for LLM Agents (NeurIPS 2025)](https://arxiv.org/abs/2502.12110)
- [Collaborative Memory (ICML 2025)](https://arxiv.org/abs/2505.18279)
- [Context Engineering (Weaviate)](https://weaviate.io/blog/context-engineering)
- [AI Agent Memory Management: When Markdown Files Are All You Need](https://dev.to/imaginex/ai-agent-memory-management-when-markdown-files-are-all-you-need-5ekk)
- [Letta/MemGPT — Agent Memory Architecture](https://www.letta.com/blog/agent-memory)
- [Mem0 — Intelligent Memory Consolidation](https://mem0.ai/research)
- [Context Rot (Chroma Research)](https://research.trychroma.com/context-rot)

### Multi-Agent Systems
- [Superpowers Plugin](https://github.com/obra/superpowers)
- [OpenAI Agents SDK — Multi-agent orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
- [Steve Kinney — Sub-Agent Anti-Patterns](https://stevekinney.com/courses/ai-development/subagent-anti-patterns)
- [How Agent Handoffs Work in Multi-Agent Systems](https://towardsdatascience.com/how-agent-handoffs-work-in-multi-agent-systems/)
- [Architecture Decision Records](https://adr.github.io/)
- [claude-mem Plugin](https://github.com/thedotmack/claude-mem)
