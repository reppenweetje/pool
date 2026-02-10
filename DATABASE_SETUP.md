# 🗄️ Database Setup Guide - Vercel Postgres

Deze app gebruikt **Vercel Postgres** voor data persistentie en real-time gameplay.

## 🚀 Stap 1: Vercel Postgres Activeren

### Via Vercel Dashboard (Aanbevolen)

1. **Ga naar je Vercel project**: [vercel.com/dashboard](https://vercel.com/dashboard)

2. **Klik op je `pool` project**

3. **Ga naar de "Storage" tab** (bovenaan)

4. **Klik "Create Database"**

5. **Selecteer "Postgres"**
   - **Database Name**: `pool-competition` (of een andere naam)
   - **Region**: Kies het dichtstbijzijnde (bijv. Frankfurt)

6. **Klik "Create"** 
   - Vercel maakt nu automatisch de database aan
   - Dit duurt ~30 seconden

7. **Database credentials worden automatisch toegevoegd** als environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - enz.

## 🔧 Stap 2: Database Schema Aanmaken

### Optie A: Via Vercel Dashboard (Makkelijkst)

1. In je Vercel project, ga naar **Storage** → **Je Postgres database**

2. Klik op de **".sql" tab** of **"Query"**

3. **Kopieer en plak** de volledige inhoud van `/lib/db/schema.sql`

4. **Klik "Run"** of "Execute"
   - Dit maakt alle tables, indexes en triggers aan

5. **Done!** ✅

### Optie B: Via Terminal (Advanced)

```bash
# Installeer Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations (gebruik psql of een database client)
psql $POSTGRES_URL < lib/db/schema.sql
```

## ✅ Stap 3: Verifieer Setup

### Test de database:

1. **Ga terug naar je live app** op Vercel

2. **Refresh de pagina** - je zou je huidige game state moeten zien

3. **Speel een test potje** - check of het wordt opgeslagen

4. **Refresh opnieuw** - data moet bewaard blijven! 🎉

### Check in Vercel Dashboard:

1. Ga naar **Storage** → **Je database** → **Data tab**

2. Je zou deze tables moeten zien:
   - `players` (Jesse & Flip)
   - `game_sessions` (huidige maand)
   - `matches` (gespeelde potjes)
   - `live_games` (actieve live games)

## 🔥 Live Features

### Live Game Mode (met TOEP)

**Nieuwe features:**
- **TOEP mechanisme**: Verdubbel de inzet tijdens het spel
- **Accept/Reject**: Tegenstander moet accepteren of direct verliezen
- **Overtoepen**: Alleen de ander kan overtoepen (escalerend)
- **Real-time updates**: Poll elke 2 seconden voor wijzigingen
- **Live ball tracking**: Beide spelers kunnen ballen updaten

### Hoe werkt TOEP?

1. **Start Live Potje**: Klik op de gele ⚡ knop

2. **Tijdens het spel**: Elke speler kan "TOEP" drukken
   - Eerste toep: 1 → 2 streaks
   - Overtoepen: 2 → 3 streaks
   - Etc...

3. **Tegenstander moet kiezen**:
   - **Accepteren**: Speel door om X streaks
   - **Weigeren**: Verlies direct met 1 streak

4. **Regels**:
   - Na toep kan ALLEEN de ander overtoepen
   - Dezelfde speler kan niet 2x achter elkaar toepen
   - Winner krijgt X streaks erbij (ipv 1)

## 🔄 Migratie van Local Storage

Als je al data had in local storage:

1. **Export oude data** (via browser console):
```javascript
console.log(localStorage.getItem('pool-competition-state'))
```

2. **Kopieer de JSON**

3. **Voeg handmatig matches toe** via de normale UI
   - Of: schrijf een migratie script (advanced)

## 🐛 Troubleshooting

### "Failed to fetch game state"

**Oplossing**:
1. Check of database is aangemaakt in Vercel
2. Verifieer dat environment variables zijn ingesteld
3. Run de schema.sql opnieuw

### "Database connection error"

**Oplossing**:
1. Ga naar Vercel → Settings → Environment Variables
2. Check of `POSTGRES_URL` bestaat
3. Redeploy je app (Vercel → Deployments → Redeploy)

### Tables bestaan niet

**Oplossing**:
1. Ga naar Storage → Data tab in Vercel
2. Run `/lib/db/schema.sql` opnieuw in de Query tab

### Live Game werkt niet

**Oplossing**:
1. Check of `live_games` table bestaat
2. Verifieer dat beide spelers dezelfde app URL gebruiken
3. Poll interval is 2 seconden - even geduld

## 📊 Database Schema

```sql
Tables:
- players (Jesse, Flip)
- game_sessions (maandelijkse competitie state)
- matches (alle gespeelde potjes)
- live_games (actieve live games met toep state)
```

## 💾 Backup & Reset

### Backup maken:

```sql
-- Via Vercel Query tab
SELECT * FROM matches ORDER BY created_at;
-- Kopieer resultaten
```

### Reset (komt binnenkort):
- Via Settings in de app
- Of handmatig via Vercel Query tab

## 🎯 Volgende Stappen

1. ✅ Setup database (zie boven)
2. ✅ Run schema.sql
3. ✅ Test de app
4. 🎱 Speel pool met TOEP!

---

**Hulp nodig?** Check de Vercel Postgres docs: [vercel.com/docs/storage/vercel-postgres](https://vercel.com/docs/storage/vercel-postgres)
