# Definice projektu

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

- Backend: Node.js 24+
- Web framework: Express
- Databaze: SQLite
- Frontend: HTML, CSS, JavaScript
- Reverse proxy: nginx
- Sprava behu sluzby: systemd
- HTTPS: certbot / Let's Encrypt
- Bezpecna zaloha DB: SQLite snapshot pres VACUUM INTO
- Migrace: inkrementalni SQL migrace ze slozky `migrations/`
- Ochrana loginu: rate limiting bootstrap a login endpointu

## Nazev

Adherence k inhalacni lecbe

## Ucel

Webova aplikace pro spravu pacientu a vyplnovani formularu souvisejicich s inhalacni lecbou.

## Typ aplikace

Self-hosted interni webova aplikace provozovana na vlastnim Linux serveru.

## Struktura

- `public/` uzivatelske rozhrani
- `src/server.js` vstupni bod serveru
- `src/appApi.js` aplikacni API logika
- `src/questionnaires.js` definice dotazniku
- `src/roundExport.js` exporty CSV
- `src/backup.js` bezpecna lokalni zaloha SQLite
- `migrations/` inkrementalni SQL migrace
- `schema.sql` referencni schema
- `data/app.db` SQLite databaze

## Role v systemu

- admin
- vysetrujici
- zdravotnik

## Hlavni funkce

- prihlaseni internich uzivatelu
- prihlaseni zdravotnika do samostatneho portalu
- registrace a sprava pacientu
- vytvareni rozepsanych i dokoncenych verzi formularu
- historie vyplneni
- exporty CSV
- stazeni lokalni databazove zalohy

## Sitovy model

- aplikace bezi lokalne na `127.0.0.1:3000`
- nginx ji zverejnuje pres domenu
- HTTPS zajistuje Let's Encrypt / certbot

## Provozni soubory

- konfigurace: `.env`
- databaze: `data/app.db`
- zaloha: `data/backups/`
- systemd jednotka: `deploy/app.service.example`
- nginx konfigurace: `deploy/nginx.adherence.example.conf`
