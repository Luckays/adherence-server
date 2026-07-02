# Linux Deployment Guide

Tento dokument popisuje doporuceny postup nasazeni aplikace **Adherence k inhalacni lecbe** na vlastni Linux server.

Zdrojovy repozitar:
- [Luckays/adherence-server](https://github.com/Luckays/adherence-server)

## Pozadavky na server

- Linux server nebo VPS
- Node.js 24+
- npm
- SQLite
- nginx
- systemd
- git
- domena a HTTPS pro produkcni provoz

## Pouzite nastroje aplikace

- Node.js + Express
- SQLite
- HTML, CSS, JavaScript
- CSV exporty
- inkrementalni SQL migrace
- rate limiting pro citlive login endpointy
- bezpecna SQLite zaloha pres `VACUUM INTO`
- nginx
- systemd
- certbot / Let's Encrypt

## 1. Priprava serveru

Nainstalujte zakladni systemove balicky:

```bash
sudo apt update
sudo apt install -y nginx git curl
```

Node.js 24 doporucujeme instalovat pres `nvm`.

Priklad instalace:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
node -v
npm -v
```

## 2. Stazeni aplikace

Vytvorte cilovy adresar a naklonujte projekt:

```bash
sudo mkdir -p /opt/adherence-app
sudo chown $USER:$USER /opt/adherence-app
cd /opt/adherence-app
git clone https://github.com/Luckays/adherence-server.git .
```

Pokud pouzivate SSH pristup ke GitHubu, muzete pouzit i SSH variantu URL.

## 3. Instalace zavislosti

```bash
cp .env.example .env
npm install
```

## 4. Konfigurace aplikace

Upravte soubor `.env` podle ciloveho prostredi.

Minimalni produkcni priklad:

```env
PORT=3000
HOST=127.0.0.1
APP_BASE_URL=https://app.tvoje-domena.cz
SQLITE_PATH=./data/app.db
BOOTSTRAP_SETUP_TOKEN=zvol-vlastni-dlouhy-token
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=10
```

Poznamky:
- `HOST=127.0.0.1` ponechte, pokud aplikaci zverejnujete pres nginx
- `APP_BASE_URL` musi odpovidat finalni verejne adrese aplikace
- `BOOTSTRAP_SETUP_TOKEN` slouzi jen pro prvotni vytvoreni admin uctu

## 5. Inicializace databaze

Spustte databazove migrace:

```bash
npm run migrate
```

## 6. Overeni lokalniho behu

Pred zapojenim systemd a nginx doporucujeme aplikaci kratce overit v interaktivnim rezimu:

```bash
npm run dev
```

V druhem terminalu:

```bash
curl http://127.0.0.1:3000/api/health
```

Pokud endpoint odpovi JSON objektem s `ok: true`, je backend funkcni.
Potom lze proces ukoncit klavesovou zkratkou `Ctrl+C`.

## 7. Vytvoreni prvniho admin uctu

Po spusteni aplikace vytvorte prvni administrativni ucet:

```bash
curl -X POST http://127.0.0.1:3000/api/setup/bootstrap \
  -H "content-type: application/json" \
  -d '{
    "setupToken":"zvol-vlastni-dlouhy-token",
    "loginId":"admin",
    "password":"SemDejSilneAdminHeslo123!"
  }'
```

Bootstrap endpoint funguje pouze jednou, pokud v databazi zatim neexistuje zadny admin.

## 8. Konfigurace systemd sluzby

Zkopirujte pripravenou ukazku:

```bash
sudo cp /opt/adherence-app/deploy/app.service.example /etc/systemd/system/adherence-app.service
```

Pred spustenim zkontrolujte a pripadne upravte:
- `User`
- `Group`
- `WorkingDirectory`
- `ExecStart`

To je dulezite zejmena v pripade, ze Node.js pouzivate pres `nvm` a cesta k binarce `node` neni `/usr/bin/node`.

Po uprave aktivujte sluzbu:

```bash
sudo systemctl daemon-reload
sudo systemctl enable adherence-app
sudo systemctl start adherence-app
sudo systemctl status adherence-app
```

## 9. Konfigurace nginx

Zkopirujte vzorovou konfiguraci:

```bash
sudo cp /opt/adherence-app/deploy/nginx.adherence.example.conf /etc/nginx/sites-available/adherence-app
```

V konfiguraci nastavte zejmena:
- `server_name`

Nyni konfiguraci aktivujte:

```bash
sudo ln -s /etc/nginx/sites-available/adherence-app /etc/nginx/sites-enabled/adherence-app
sudo nginx -t
sudo systemctl reload nginx
```

## 10. DNS a domena

V DNS nastavte `A` zaznam smerujici na IP adresu serveru.

Priklad:
- `app.tvoje-domena.cz -> verejna IP serveru`

## 11. HTTPS

Pro produkcni provoz doporucujeme certifikat Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.tvoje-domena.cz
```

Po uspesnem vystaveni certifikatu overte, ze `.env` obsahuje:

```env
APP_BASE_URL=https://app.tvoje-domena.cz
```

Pote restartujte aplikaci:

```bash
sudo systemctl restart adherence-app
```

## 12. Aktualizace aplikace

Doporuceny postup pri nasazeni nove verze:

```bash
cd /opt/adherence-app
git fetch origin
git reset --hard origin/main
npm install
npm run migrate
sudo systemctl restart adherence-app
```

Pokud ve vlastni instalaci udrzujete lokalni upravy, zvolte misto `reset --hard` jinou Git strategii.

## 13. Bezpecna zaloha databaze

Databaze je ulozena v souboru:

```bash
/opt/adherence-app/data/app.db
```

Aplikace pouziva SQLite v rezimu `WAL`. Za behu proto nekopirujte pouze samotny soubor `app.db`.

Pro bezpecnou zalohu pouzijte aplikacni prikaz:

```bash
cd /opt/adherence-app
npm run backup
```

Tento prikaz vytvori konzistentni snapshot do adresare:

```bash
/opt/adherence-app/data/backups/
```

Alternativne lze vyuzit i stazeni DB zalohy z administracniho rozhrani.

## 14. Obnova databaze

Pri obnove postupujte nasledovne:

1. zastavte sluzbu
2. nahraďte `data/app.db` zvolenou zalohou
3. znovu spustte sluzbu

```bash
sudo systemctl stop adherence-app
cp /opt/adherence-app/data/backups/app-backup-YYYY-MM-DD-HH-MM-SS.db /opt/adherence-app/data/app.db
sudo systemctl start adherence-app
```

## 15. Doporucene provozni overeni po nasazeni

Po dokonceni instalace doporucujeme overit:

1. prihlaseni admina
2. vytvoreni zdravotnika
3. vytvoreni pacienta
4. otevreni formulare
5. ulozeni rozepsaneho formulare
6. dokonceni formulare
7. CSV export
8. stazeni DB zalohy
9. funkcnost prikazu `npm run backup`
