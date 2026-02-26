# CLAUDE.md — AI Assistant Guide for This Repository

This file provides guidance for Claude and other AI assistants working in this codebase. It documents repository conventions, development workflows, and important context to enable effective, consistent contributions.

---

## Repository Overview

| Field       | Value                                  |
|-------------|----------------------------------------|
| Repo        | `khachoangmmo/Claude-Code`             |
| Branch      | `claude/claude-md-mm2vz3b7esdut2tn-vysDT` (feature branch) |
| Remote      | `http://local_proxy@127.0.0.1:37342/git/khachoangmmo/Claude-Code` |
| Status      | Newly initialized — no commits yet     |

> This repository was created for use with **Claude Code** (Anthropic's AI-powered CLI). This CLAUDE.md acts as the foundational reference document for all AI-assisted development.

---

## Project Structure (To Be Established)

As the project grows, the structure should follow this convention:

```
Claude-Code/
├── CLAUDE.md              # This file — AI assistant reference
├── README.md              # Human-facing project overview
├── .gitignore             # Files to exclude from version control
├── src/                   # Main source code
│   ├── index.ts (or .js)  # Entry point
│   └── ...
├── tests/                 # Test files mirroring src/ structure
│   └── ...
├── docs/                  # Extended documentation
├── .github/
│   └── workflows/         # CI/CD GitHub Actions
└── package.json           # (if Node.js) or equivalent manifest
```

Update this section when the actual structure is established.

---

## Git Workflow

### Branch Naming

- Feature branches: `claude/claude-md-<session-id>` (assigned by Claude Code sessions)
- Human feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Hotfixes: `hotfix/<short-description>`

> **Critical:** Claude Code branches must start with `claude/` and end with the session ID. Pushing to any other pattern will fail with HTTP 403.

### Commit Conventions

Use clear, imperative commit messages following the format:

```
<type>: <short summary>

[optional body explaining why, not what]

https://claude.ai/code/session_<id>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation changes
- `refactor` — code restructuring without behavior change
- `test` — adding or updating tests
- `chore` — maintenance tasks (deps, config)
- `ci` — CI/CD pipeline changes

**Examples:**
```
feat: add user authentication flow
fix: correct off-by-one error in pagination
docs: update API reference for v2 endpoints
```

### Push Protocol

```bash
# Always use -u to set upstream tracking
git push -u origin <branch-name>

# If push fails due to network error, retry with backoff:
# wait 2s → retry → wait 4s → retry → wait 8s → retry → wait 16s → retry
```

---

## Development Workflows

### Starting Work on a Task

1. Confirm you are on the correct branch
2. Read all relevant existing files before making changes
3. Create a todo list for multi-step tasks using Claude Code's `TodoWrite` tool
4. Make targeted, minimal changes — avoid unrelated refactoring
5. Commit with a descriptive message
6. Push to the feature branch

### Making Changes

- **Read before editing**: Always read a file fully before modifying it
- **Minimal scope**: Only change what is necessary for the task
- **No speculative improvements**: Do not add features, refactor, or clean up code unless explicitly requested
- **No unnecessary files**: Do not create files unless strictly required
- **Security first**: Avoid introducing OWASP Top 10 vulnerabilities (XSS, SQLi, command injection, etc.)

### Code Quality Principles

- Keep solutions simple — complexity should match the minimum required
- Prefer editing existing files over creating new ones
- Do not add docstrings, comments, or type annotations to unchanged code
- Trust framework and internal guarantees; validate only at system boundaries
- Three similar lines of code is better than a premature abstraction

---

## Language & Framework Conventions

> **To be populated once the tech stack is established.**

When the stack is decided, document here:
- Language version (e.g., Node.js 20 LTS, Python 3.12)
- Framework (e.g., Express, FastAPI, Next.js)
- Linter configuration (e.g., ESLint + Prettier, Ruff)
- Test framework (e.g., Jest, Pytest, Vitest)
- Build tooling (e.g., esbuild, Vite, tsc)

---

## Testing

> **To be populated once tests are established.**

Document here:
- How to run the full test suite
- How to run a single test file
- Coverage requirements
- Test file naming conventions (e.g., `*.test.ts`, `*_test.py`)

**General rules for AI assistants:**
- Write tests for new functionality
- Do not mark tasks complete if tests are failing
- Run tests before committing when possible

---

## Environment & Configuration

> **To be populated once env vars are established.**

Document:
- Required environment variables
- Where `.env.example` lives
- Secrets management approach

**Never commit:**
- `.env` files or any file containing secrets
- API keys, tokens, or credentials
- Private certificates

---

## CI/CD

> **To be populated once pipelines are set up.**

Document:
- Which CI system is used (GitHub Actions, etc.)
- What checks run on PRs
- Deployment targets and triggers

---

## Pull Requests

When creating a PR:

1. Title: under 70 characters, imperative mood
2. Body should include:
   - **Summary**: 1–3 bullet points of what changed
   - **Test plan**: checklist of how to verify the change
   - Session link: `https://claude.ai/code/session_<id>`

Use the GitHub CLI:

```bash
gh pr create --title "feat: brief description" --body "$(cat <<'EOF'
## Summary
- Changed X to do Y
- Fixed Z

## Test plan
- [ ] Run `npm test` and confirm all pass
- [ ] Manually verify the feature in browser

https://claude.ai/code/session_<id>
EOF
)"
```

---

## AI Assistant Guidelines

### What Claude Should Do

- Work on the designated `claude/` branch
- Read files before editing them
- Make minimal, focused changes
- Confirm before taking destructive or irreversible actions
- Use parallel tool calls where tasks are independent
- Track multi-step work with `TodoWrite`
- Push to the feature branch when work is complete

### What Claude Should NOT Do

- Push to `main` or `master` without explicit permission
- Use `--force`, `--no-verify`, or `--hard reset` without asking
- Delete branches or files unless explicitly instructed
- Add unrequested features or refactors
- Commit `.env` files, secrets, or credentials
- Retry failed commands in a loop without diagnosing the root cause
- Skip pre-commit hooks or safety checks

### Handling Ambiguity

If a task is unclear:
1. Use `AskUserQuestion` to clarify before proceeding
2. Do not guess at requirements and implement speculatively
3. For large tasks, propose a plan and get approval before coding

### Handling Errors

- If a command fails, diagnose the root cause — do not retry blindly
- If blocked by a permission error or hook, investigate before bypassing
- If tests fail after a change, fix the tests (or the code) — do not skip

---

## Updating This File

This CLAUDE.md should be kept current. Update it when:
- The tech stack is decided
- New tooling is added (linters, formatters, test frameworks)
- CI/CD pipelines are established
- New conventions are adopted by the team
- The project structure changes significantly

---

*Last updated: 2026-02-26 | Maintained for use with [Claude Code](https://claude.ai/code)*
