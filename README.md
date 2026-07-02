# Adherence k inhalacni lecbe

Cista self-hosted verze pro Linux server.

## Pozadavky na server

- Linux server nebo VPS
- Node.js 24+
- npm
- SQLite
- nginx
- systemd
- git
- domena a HTTPS pro produkcni provoz

## Pouzite nastroje a technologie

- Backend: Node.js + Express
- Databaze: SQLite v WAL rezimu
- Frontend: HTML, CSS, JavaScript
- Exporty: CSV
- Reverse proxy: nginx
- Beh aplikace jako sluzby: systemd
- HTTPS: certbot / Let's Encrypt
- Bezpecna zaloha DB: SQLite snapshot pres VACUUM INTO
- Migrace: inkrementalni SQL migrace

## Co je v repozitari

- `public/` frontend
- `src/` backend a aplikacni logika
- `migrations/` inkrementalni SQL migrace
- `schema.sql` referencni databazove schema
- `deploy/` ukazky pro nginx a systemd
- `.env.example` konfigurace

## Lokalni start

```bash
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Bezpecna zaloha:

```bash
npm run backup
```

## Produkcni nasazeni

Viz:

- `deploy/LINUX_DEPLOY_STEP_BY_STEP.md`
- `docs/MANUAL_PROVOZ.md`
- `docs/DEFINICE_PROJEKTU.md`
