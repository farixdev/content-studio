# Deploying Mindcob Content Studio — Plain-English Guide

This guide is written for someone who is **not** a developer. Read section 0 first — it
answers your main question ("will my paid hosting + domain work?").

---

## 0. The ONE thing you must understand first

This app is made of **two parts that both have to run 24/7**:

1. **The app** — a **Next.js / Node.js** program (the website you see).
2. **The database** — a **PostgreSQL** server that stores everything: projects, content,
   users, chat messages, files.

> ⚠️ This is **not** a WordPress/PHP site and **not** a plain static website.
> So the cheap "shared hosting / cPanel" that people buy for WordPress **will NOT run it by
> itself**, unless that host specifically supports **"Node.js apps"**.

**So: having *a* paid hosting + a domain is not automatically enough — it depends on the *type*
of hosting.** The table below tells you exactly.

---

## 1. "Will my paid hosting work?" — quick decision table

| What you have | Will it run this app? | What to do |
|---|---|---|
| **Shared / cPanel hosting** made for WordPress/PHP (Hostinger *shared*, GoDaddy, Bluehost, Namecheap shared) | ❌ Not directly | Use it only for the **domain**, and run the app on Vercel (Option A) or a VPS (Option B). Some cPanels have a **"Setup Node.js App"** button → then see Option C. |
| **Vercel / Railway / Render / DigitalOcean App Platform** | ✅ Easiest | Option A |
| **A VPS / cloud server** (DigitalOcean, Hostinger **VPS**, Contabo, Linode, AWS Lightsail) | ✅ Full control | Option B |

**Your domain** (from any registrar — GoDaddy, Namecheap, Hostinger, etc.) works with **all**
options. A domain is just a name you point at wherever the app lives. You never need a "special"
domain.

---

## 2. Shopping list (what you need before starting)

1. **The code** — already on GitHub: `https://github.com/farixdev/content-studio`
2. **A PostgreSQL database** — e.g. [Neon](https://neon.tech) (has a free tier; ~$19/mo for a
   proper always-on plan) or [Supabase](https://supabase.com). **It must be PostgreSQL, not
   MySQL.**
3. **A place to run the Node app** — Vercel (Option A) **or** a VPS (Option B).
4. **Your domain.**
5. **A few secret values** (called *environment variables*) — explained next.

---

## 3. The secret values (environment variables) — what each one is

You will paste these into Vercel, or into a file called `.env` on your server. (There's a
template in the project: `.env.example`.)

| Name | What it is | Example / how to get it |
|---|---|---|
| `DATABASE_URL` | The address + password of your Postgres DB | Copy from Neon/Supabase dashboard. Looks like `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | A long random password that signs logins. **Must be 32+ characters.** | Generate one (see below). Keep it secret. |
| `NODE_ENV` | Tells the app it's live | `production` |
| `SEED_ADMIN_PASSWORD` | The password for the first admin login | Choose a strong password |
| `SEED_DEMO` | Whether to create fake demo users | `false` for a real site (admin only) |
| `OPENROUTER_API_KEY` | *(optional)* Turns on the AI "generate guide / audit" buttons | From openrouter.ai — leave blank to disable AI |
| `GROQ_API_KEY` | *(optional)* Backup AI provider | From console.groq.com — leave blank |

**Generate a JWT_SECRET** — run this on your computer (or use any random 40+ character string):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## OPTION A — Easiest & recommended: Vercel + Neon + your domain

This is exactly how the app is running right now. Almost no server maintenance.

### A1. Create the database (Neon)
1. Go to https://neon.tech → sign up → **Create project** (pick a region near your users).
2. On the project dashboard, copy the **connection string** (starts with `postgresql://`). This
   is your `DATABASE_URL`.
3. For a **permanent, always-on** site, upgrade Neon to a paid plan (the free tier can pause the
   database after inactivity, which makes the first visit slow).

### A2. Connect the code to Vercel
1. Go to https://vercel.com → sign up **with your GitHub account**.
2. **Add New → Project → Import** `farixdev/content-studio`.
3. Framework preset: **Next.js** (it auto-detects). Leave build settings as default — the build
   command is already `prisma generate && next build`.

### A3. Add the environment variables in Vercel
In the import screen (or later under **Project → Settings → Environment Variables**), add:
- `DATABASE_URL` = *(your Neon string)*
- `JWT_SECRET` = *(your generated 40-char string)*
- `NODE_ENV` = `production`
- `SEED_ADMIN_PASSWORD` = *(a strong password you choose)*
- `SEED_DEMO` = `false`
- *(optional)* `OPENROUTER_API_KEY` = *(your key)*

Click **Deploy**. Wait for it to finish (green ✓).

### A4. Create the database tables (one time)
The database is empty at first. From **your own computer**, in the project folder:
```bash
# put your Neon DATABASE_URL in a local .env file first, then:
npm install
npx prisma db push      # creates all the tables
npm run seed            # creates the admin login (uses SEED_ADMIN_PASSWORD, SEED_DEMO)
```
> Set `SEED_DEMO=false` in your local `.env` so it creates **only** the admin (no demo users).
> Tables only need to be created once; after that, the live site uses them.

### A5. Add your custom domain
1. Vercel → **Project → Settings → Domains → Add** → type `yourdomain.com`.
2. Vercel shows you a DNS record (an **A record** or **CNAME**). Go to your domain registrar
   (where you bought the domain) → DNS settings → add exactly what Vercel shows.
3. Wait a few minutes to a few hours. **HTTPS/SSL is automatic** — you don't buy a certificate.

### A6. Log in
Go to `https://yourdomain.com` → log in with **username `admin`** and the
`SEED_ADMIN_PASSWORD` you set. Create your real team under **Team**, then change/secure the
admin password.

**Rough cost (permanent):** Vercel Pro ≈ $20/mo + Neon paid ≈ $19/mo ≈ **$40/mo**, and you never
touch a server.

---

## OPTION B — Full control on your own VPS (cheapest permanent, ~$6/mo)

Use this for a **Hostinger VPS**, DigitalOcean droplet, Contabo, Linode, AWS Lightsail, etc.
Everything (app **and** database) runs on one small server. You need to be comfortable pasting
commands into a black terminal — the steps below are copy-paste.

### B1. Buy the server
- Get a **VPS with Ubuntu 22.04**, at least **1 GB RAM** (2 GB is comfier).
- The host gives you an **IP address** and a **root password**.

### B2. Connect to it
On Windows use **PowerShell** (or PuTTY):
```bash
ssh root@YOUR_SERVER_IP
```

### B3. Install Node.js 20 + git
```bash
apt update && apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git
node -v      # should print v20.x
```

### B4. Install PostgreSQL (the database) on the same server
```bash
apt install -y postgresql
sudo -u postgres psql -c "CREATE USER studio WITH PASSWORD 'CHOOSE_A_DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE studio OWNER studio;"
```
Your `DATABASE_URL` will be:
`postgresql://studio:CHOOSE_A_DB_PASSWORD@localhost:5432/studio`
*(Prefer a managed DB instead? Use a Neon URL here and skip this step.)*

### B5. Get the code and configure it
```bash
cd /var/www 2>/dev/null || mkdir -p /var/www && cd /var/www
git clone https://github.com/farixdev/content-studio.git
cd content-studio
```
Create the secrets file:
```bash
nano .env
```
Paste (edit the values), then save with **Ctrl+O, Enter, Ctrl+X**:
```
DATABASE_URL="postgresql://studio:CHOOSE_A_DB_PASSWORD@localhost:5432/studio"
JWT_SECRET="paste-a-long-random-40-plus-character-string-here"
NODE_ENV="production"
SEED_ADMIN_PASSWORD="your-strong-admin-password"
SEED_DEMO="false"
# OPENROUTER_API_KEY="sk-or-..."   # optional, for AI features
```

### B6. Install, build, create tables, seed
```bash
npm install
npx prisma db push      # create all tables
npm run seed            # create the admin login
npm run build           # build the production site
```

### B7. Keep it running forever with PM2
```bash
npm install -g pm2
pm2 start "npm run start" --name studio
pm2 save
pm2 startup            # run the command it prints, so it restarts after a reboot
```
The app is now running on `http://YOUR_SERVER_IP:3000`.

### B8. Put it on your domain with Nginx (port 80/443 → 3000)
```bash
apt install -y nginx
nano /etc/nginx/sites-available/studio
```
Paste (replace `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
```
Enable it:
```bash
ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

### B9. Point your domain at the server
At your domain registrar → DNS → add an **A record**: `@` → `YOUR_SERVER_IP`
(and another A record `www` → `YOUR_SERVER_IP`). Wait for it to take effect.

### B10. Free HTTPS/SSL with Let's Encrypt
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Follow the prompts. It auto-renews. Your site is now `https://yourdomain.com`.

### B11. Updating the app later (when there are new changes)
```bash
cd /var/www/content-studio
git pull
npm install
npx prisma db push      # only if the database structure changed
npm run build
pm2 restart studio
```

**Rough cost (permanent):** one VPS ≈ **$5–10/mo** for everything. You maintain the server.

---

## OPTION C — Shared/cPanel hosting that has "Setup Node.js App"

Some shared hosts (e.g. certain Hostinger/cPanel plans) include a **"Setup Node.js App"** tool.
It *can* work, but it's fiddly, and **most cPanel plans only offer MySQL — this app needs
PostgreSQL**, so you'll still use **Neon** for the database.

Rough steps:
1. In cPanel → **Setup Node.js App** → Create → Node **20**, application root = your uploaded
   project folder, startup file = leave for now.
2. Upload the code (via Git or File Manager), or clone it.
3. In the Node app panel add the **environment variables** from section 3 (with a Neon
   `DATABASE_URL`).
4. Run **NPM Install**, then in the terminal run `npx prisma db push`, `npm run seed`,
   `npm run build`.
5. Set the app to run `npm run start` and restart it.
6. Point the domain to the app per your host's instructions.

If this sounds painful, **Option A (Vercel) is much easier** and you can still use your cPanel
domain by just pointing DNS at Vercel.

---

## 4. Important notes specific to THIS app

- **Database must be PostgreSQL** (not MySQL). The `prisma/dev.db` file is SQLite and is **only
  for local testing** — ignore it in production.
- **Uploaded files are stored inside the database** (not on disk). Good news: you don't need
  special file storage. Watch-out: many big files make the database large. There's a **4 MB**
  cap on task uploads and **1 MB** on chat attachments.
- **First admin login:** username `admin`, password = your `SEED_ADMIN_PASSWORD` (or `123` if you
  didn't set one — change it immediately). Add your real team under **Team**.
- **Backups:** back up your PostgreSQL database regularly. On Neon this is built in; on a VPS use
  `pg_dump studio > backup.sql` (put it on a schedule).
- **AI features are optional.** Without `OPENROUTER_API_KEY`/`GROQ_API_KEY` the app works fully;
  only the "Generate guide with AI" and "AI audit" buttons are disabled.

---

## 5. Cost summary for an always-on ("permanent") setup

| Setup | Monthly cost | Effort |
|---|---|---|
| **Vercel Pro + Neon paid** (Option A) | ≈ $40 | Easiest — zero server admin |
| **One small VPS running app + DB** (Option B) | ≈ $6–10 | Cheapest — you manage the server |
| Free Vercel Hobby + free Neon | $0 | Fine for testing; not ideal for a real business (limits, DB can sleep) |

---

## 6. TL;DR answer to your question

- **"I have paid hosting + a domain — will it work?"** → **Only if the hosting can run Node.js
  apps** (a VPS, or a plan with "Setup Node.js App"). Plain shared/WordPress hosting **cannot**
  run it directly.
- **Simplest permanent setup:** keep it on **Vercel**, attach **your domain**, use a **paid Neon**
  database. (~$40/mo, no server to babysit.)
- **Cheapest permanent setup:** one **VPS** running both the app and PostgreSQL (~$6/mo, but you
  maintain it).
- **Your domain** always works — you just point its DNS at whichever option you choose.
