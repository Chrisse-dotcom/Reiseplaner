# ✈️ Reiseplaner

Dein persönlicher Reiseplaner – mobile-first Web-App, optimiert für iPhone.

## Features

- **Reisen verwalten** – Neue Reise erstellen, gespeicherte Reisen laden
- **KI-Reiseinfos** – Claude AI liefert alle wichtigen Infos zum Reiseziel (Trinkgeld, Währung, Klima, Warnungen, Kultur...)
- **Aufgaben-Checkliste** – Per Text oder Sprache eingeben, mit Datum und Erinnerung auf dem Dashboard
- **Packliste** – Gegenstände abhaken (bleibt durchgestrichen sichtbar), per Text oder Sprache
- **Checklisten kopieren** – Checklisten von einer Reise in eine andere übertragen
- **PWA-ready** – Funktioniert auf dem iPhone wie eine native App

## Tech Stack

- **Frontend**: React + Vite (mobile-first)
- **Backend**: Node.js + Express
- **Datenbank**: PostgreSQL
- **KI**: Anthropic Claude API
- **Deployment**: Railway

## Setup (lokal)

```bash
# 1. Abhängigkeiten installieren
npm run install:all

# 2. .env Datei erstellen
cp .env.example .env
# DATABASE_URL und ANTHROPIC_API_KEY eintragen

# 3. App starten (Frontend + Backend gleichzeitig)
npm run dev
```

## Deployment auf Railway

1. Repo auf GitHub pushen
2. Neues Projekt auf [railway.app](https://railway.app) erstellen
3. "Deploy from GitHub" wählen
4. PostgreSQL Plugin hinzufügen (DATABASE_URL wird automatisch gesetzt)
5. Environment Variable setzen: `ANTHROPIC_API_KEY=sk-ant-...`
6. Deploy!

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL Connection String (Railway setzt automatisch) |
| `ANTHROPIC_API_KEY` | API Key von console.anthropic.com |
| `NODE_ENV` | `production` für Railway |
| `PORT` | Server-Port (Railway setzt automatisch) |
