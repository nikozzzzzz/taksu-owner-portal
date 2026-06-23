# Deployment & Infrastructure Guide

This application is deployed on a self-hosted infrastructure consisting of a Node.js application (Next.js) running via PM2, and a local PostgreSQL database powered by a Dockerized Supabase stack. Both are served via an Nginx reverse proxy.

## Architecture

*   **Frontend / API**: Next.js 15 app running on Node.js.
*   **Process Manager**: PM2 (maintains uptime and restarts the Node process).
*   **Database & Auth**: Supabase Stack (PostgreSQL, GoTrue for Auth, PostgREST for APIs, Storage).
*   **Reverse Proxy**: Nginx (handles HTTPS, TLS termination, and routing).

## Routing Setup (Nginx)

All external traffic arrives via HTTPS (port 443). Nginx routes traffic based on URL paths:
*   `/auth`, `/rest`, `/realtime`, `/storage`, `/graphql`, `/pg` ➡️ Proxied to Supabase API Gateway (`127.0.0.1:8000`).
*   `/` (everything else) ➡️ Proxied to Next.js (`127.0.0.1:3000`).

## Supabase Docker Stack

Supabase is running locally on the server to keep all investor data private and secure.

*   **Location**: `/var/www/supabase`
*   **Configuration File**: `/var/www/supabase/.env`
*   **Control Commands**:
    ```bash
    cd /var/www/supabase
    docker compose up -d      # Start Supabase
    docker compose down       # Stop Supabase
    docker compose restart    # Restart all containers
    ```

### Accessing the Database Directly

If you need to run manual SQL queries or apply migrations directly to the database container:

```bash
docker exec -it supabase-db psql -U postgres
```

## Deployment Workflow

To deploy updates to the application code, a local shell script is provided:

```bash
./deploy.sh
```

**What `deploy.sh` does:**
1. Syncs all source files (excluding `.git`, `node_modules`, etc.) to the server using `rsync`.
2. Syncs the local `.env.local` to the server.
3. SSHes into the server and runs `pnpm install` and `pnpm build`.
4. Restarts the PM2 process to serve the new build.

> [!IMPORTANT]
> **Environment Variables**
> Do not modify `.env.local` on the server manually if you plan to use `deploy.sh`. The script always overwrites the remote `.env.local` with your local copy. Any permanent changes to environment variables should be made locally first, then deployed.

## Local Development vs Production

*   **Local Development**: Next.js runs on `http://localhost:3000` and points to a Supabase URL defined in `.env.local`.
*   **Production**: Next.js runs behind Nginx and communicates with the *local* Supabase instance via the public server IP (`https://192.168.101.122`). 

## Backup Strategy

Currently, Supabase uses Docker volumes to store data.
*   **Database Volume**: `supabase_db-data`
*   **Storage Volume**: `supabase_storage-data`

It is highly recommended to setup an automated backup cronjob that dumps the database and synchronizes it to an off-site location (e.g., AWS S3 or a separate backup server).

Example manual backup:
```bash
docker exec supabase-db pg_dumpall -U postgres > backup_$(date +%Y%m%d).sql
```
