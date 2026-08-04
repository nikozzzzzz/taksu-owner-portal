# Taksu Owner Portal - InfoSec & DevSecOps Rules for AI Agents

**CRITICAL INSTRUCTION FOR ALL AI ASSISTANTS AND AGENTS:**
Before modifying code, updating dependencies, or modifying deployment architecture, you MUST read and strictly adhere to these security principles. This project has been targeted by supply-chain attacks and RCE vulnerabilities in the past.

## 1. Dependency Management & Supply Chain Security
* **Never blindly upgrade packages.** If the user asks you to install or update a package, pin it to an exact version (no `^` or `~`) unless absolutely necessary.
* **Strict Overrides:** We use pnpm workspaces. If a transitive dependency is found to be malicious or vulnerable (e.g., the `zod@3.25.x` hijack), enforce the safe version universally using the `overrides` block in `pnpm-workspace.yaml` and lock it as a direct dependency in `package.json`.
* **Avoid Hacked/Fake Packages:** Always verify package legitimacy. If a dependency throws a module resolution error, do not assume upgrading is the safe fix—downgrade to the last known secure version instead.

## 2. Secure Deployment Architecture (Docker)
* **Never use PM2 on the host.** The application is strictly containerized.
* **Least Privilege:** The Next.js Docker container must run as a non-privileged user (`uid 1001`, `nextjs`).
* **Container Hardening:** 
    * `cap_drop: ALL`
    * `security_opt: [no-new-privileges:true]`
    * `read_only: true` (Root filesystem must be read-only to prevent attackers from dropping malware into `/tmp`, `/var`, or `/usr/bin`).
* **Multi-stage Builds:** The `Dockerfile` must utilize multi-stage builds (`deps` -> `builder` -> `runner`) to ensure build-time dependencies (like `typescript`, `eslint`) do not leak into the production image.

## 3. The Deployment Workflow
* **Shift-Left Security:** Before deploying, always run `./build-local.sh`. This script builds the isolated Docker image locally and runs `trivy image --severity HIGH,CRITICAL` to scan for known CVEs.
* **Deploy Script:** Use `./deploy.sh` to push to production. It syncs the code and runs `docker compose up -d --build` natively on the remote host. Do not add local `pnpm build` or native host processes back to the deployment script.

## 4. API & Webhook Security
* **Early Authentication:** Public-facing API routes (e.g., `POST /api/webhooks/beds24`) must authenticate the request *before* executing `.json()` on the request body. This mitigates unauthenticated RCE exploits triggered by malicious JSON payload parsers.
* **Data Sanitization:** Always sanitize and type-check inputs (using the secure, pinned version of `zod`).

## 5. Environment & Secrets Management
* **No Committing Secrets:** Never commit `.env` or `.env.local` files.
* **Supabase Service Role Key:** Treat the `SUPABASE_SERVICE_ROLE_KEY` with extreme caution. Only use it in strictly protected server-side API routes (e.g., bypassing Row Level Security to log AI tokens). Never leak it to the client.
* **Supabase JWTs:** Ensure the Supabase `JWT_SECRET` is kept out of source code. If exposed, it must be aggressively rotated, followed by a full recreation of the Supabase auth containers via `docker compose up -d`.
