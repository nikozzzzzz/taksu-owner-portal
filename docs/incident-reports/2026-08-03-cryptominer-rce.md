# Incident Report: Cryptominer Injection and RCE
**Date:** August 3, 2026
**Target System:** Taksu Owner Portal Production Server (portal.taksuliving.com)

## Executive Summary
An attacker successfully executed a Remote Code Execution (RCE) payload on the production server, injecting a cryptominer (`XMRig`) into the `/tmp` and `/dev/shm` directories. The attacker exploited a compromised/hijacked NPM dependency (`zod@3.25.76`) triggered via an unauthenticated webhook endpoint (`/api/webhooks/beds24`). Environment variables, including Supabase service keys and third-party API tokens, were exfiltrated. The vulnerability has been patched, the malicious package removed, the keys rotated, and the application has been containerized to prevent future persistence.

## Root Cause Analysis
1.  **Vulnerable Webhook Endpoint (`app/api/webhooks/beds24/route.ts`)**: The endpoint validated the `BEDS24_WEBHOOK_SECRET` but failed to return early if the authentication check failed. Instead, it continued processing, invoking `req.json()` and parsing the unauthenticated payload.
2.  **Hijacked Dependency (`zod@3.25.76`)**: The `package.json` loosely pinned `zod` as `"^3.23.8"`. A malicious actor published `3.25.76` (bypassing legitimate 3.23.8/3.24 versions) which contained an obfuscated payload. When the unauthenticated webhook triggered a JSON parsing error (`SyntaxError: Bad escaped character in JSON`), the malicious Zod package executed the attacker's shell payload (`child_process.execSync`).

## Impact
- **Code Execution**: The attacker executed bash commands, downloaded external binaries (`wget -q ... /gg10`), and ran the cryptominer.
- **Resource Exhaustion**: High CPU utilization from the mining process.
- **Data Exfiltration**: The production `.env.local` was compromised. The attacker obtained Supabase keys, Resend keys, and Telegram tokens.

## Actions Taken
1.  **Neutralized the Threat**:
    - Terminated the running cryptominer processes on the host machine.
    - Deleted the malicious binaries from `/tmp` and `/dev/shm`.
2.  **Patched the Webhook**:
    - Modified `app/api/webhooks/beds24/route.ts` to strictly return a `401 Unauthorized` response before parsing any JSON payload if the secret is missing or invalid.
3.  **Removed Malicious Dependency**:
    - Pinned `zod` strictly to `"3.23.8"` (without the caret) in `package.json`.
    - Deleted `node_modules` and `pnpm-lock.yaml` and reinstalled dependencies cleanly.
4.  **Secured Infrastructure (Host Level)**:
    - Enabled `ufw` on the production server, restricting access to strictly necessary ports (22, 80, 443, 3000).
5.  **Rotated Supabase Secrets**:
    - Generated a new `JWT_SECRET`.
    - Signed new `ANON_KEY` and `SERVICE_ROLE_KEY` tokens.
    - Updated `/var/www/supabase/.env` and `/var/www/taksu-owner-portal/.env.local` on the production server.
    - Restarted Supabase Docker containers to apply the new keys securely.
6.  **Containerized Application Environment**:
    - Implemented a multi-stage `Dockerfile` and `docker-compose.yml`.
    - Set the container to run as a non-root user (`nextjs`).
    - Enforced a read-only root filesystem (`read_only: true`) and dropped all privileges (`cap_drop: ALL`, `no-new-privileges: true`), preventing future malwares from being written to the filesystem.

## Required Actions (Pending User Action)
While the automated credentials (Supabase) have been rotated securely, the following manual steps MUST be completed immediately by the owner:
1.  **Resend API Key**: Regenerate the API Key in the Resend dashboard and update `.env.local`.
2.  **Beds24 Webhook Secret**: Generate a new string, update it in `.env.local`, and configure it within the Beds24 Notifications settings.
3.  **Telegram Bot Token**: Go to BotFather on Telegram, revoke the current token, and generate a new one. Update `.env.local` accordingly.
