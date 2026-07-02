# Manual provozu

## Pozadavky na server

- Linux server nebo VPS
- Node.js 24+
- npm
- SQLite
- nginx
- systemd
- git

## Pouzite nastroje aplikace

- Node.js + Express
- SQLite
- HTML, CSS, JavaScript
- CSV exporty
- nginx
- systemd
- certbot / Let's Encrypt
- inkrementalni SQL migrace
- bezpecna SQLite zaloha pres VACUUM INTO
- rate limiting pro citlive login endpointy

## Jak bude web udrzovan v chodu

Aplikace se udrzuje v chodu pomoci techto vrstev:

1. Node.js server bezi jako systemd sluzba
2. systemd pri padu sluzbu automaticky restartuje
3. nginx preposila pozadavky z domeny na lokalni port aplikace
4. SQLite databaze je ulozena lokalne v souboru

To znamena, ze bezny chod zajistuje:

- `adherence-app.service`
- nginx
- Linux server

## Denni provoz

Kontrola, ze sluzba bezi:

```bash
sudo systemctl status adherence-app
```

Restart sluzby:

```bash
sudo systemctl restart adherence-app
```

Zobrazeni logu:

```bash
journalctl -u adherence-app -n 100
journalctl -u adherence-app -f
```

Kontrola nginx:

```bash
sudo systemctl status nginx
sudo nginx -t
```

## Aktualizace aplikace z GitHubu

```bash
cd /opt/adherence-app
git pull
npm install
npm run migrate
sudo systemctl restart adherence-app
```

## Kdyz aplikace nebezi

1. zkontroluj status sluzby
2. zkontroluj logy pres journalctl
3. over, ze port 3000 pouziva Node proces
4. over, ze nginx konfigurace je validni

Uzitecne prikazy:

```bash
sudo systemctl status adherence-app
journalctl -u adherence-app -n 100
ss -ltnp | grep 3000
sudo nginx -t
```

## Zaloha databaze

Databaze je v souboru:

```
/opt/adherence-app/data/app.db
```

Aplikace pouziva WAL rezim. Za behu nikdy nekopiruj jen samotny `app.db`.

Bezpecna zaloha:

```bash
cd /opt/adherence-app
npm run backup
```

To vytvori konzistentni snapshot do slozky:

```
/opt/adherence-app/data/backups/
```

## Obnova databaze

1. zastav sluzbu
2. nahrad `app.db` zalohou
3. spust sluzbu

```bash
sudo systemctl stop adherence-app
cp /opt/adherence-app/data/backups/app-backup-YYYY-MM-DD-HH-MM-SS.db /opt/adherence-app/data/app.db
sudo systemctl start adherence-app
```

## Konfiguracni zmeny

Po zmene `.env`:

```bash
sudo systemctl restart adherence-app
```

## Zmena domeny

1. uprav DNS
2. uprav `server_name` v nginx konfiguraci
3. uprav `APP_BASE_URL` v `.env`
4. obnov certifikat nebo spust certbot znovu
5. restartuj nginx a aplikaci

## Co pravidelne kontrolovat

- dostupnost webu
- stav systemd sluzby
- volne misto na disku
- velikost databaze
- zda funguji exporty a zaloha
- zda funguje `npm run backup`
