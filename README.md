# 🎱 Pool Competitie - Jesse vs Flip

Een moderne Progressive Web App (PWA) voor het bijhouden van een pool-competitie met een streak-based economie en tactische power-ups.

## ✨ Features

### 🔥 Streak Systeem
- **Exponentiële groei**: €0,50 × 2^(streak - 1)
- **Visuele feedback**: Danger zone effecten bij hoge streaks
- **Anti-faillissement**: Automatische cap bij >€150 verschil

### 💪 Power-ups (Maandelijks beperkt)
1. **Ballenbak Bizarre** (1x p/m): Streak += tegenstander ballen (min. 3 eigen ballen)
2. **Cumback Kid** (1x p/m): Verliezer neemt winnaar streak - 1
3. **Toep** (5x p/m): Direct +1 streak (min. 2 eigen ballen)
4. **Ballenbak** (5x p/m): €2 boete per bal van tegenstander
5. **Pull The Plug** (1x p/m): Reset tegenstander streak naar 0
6. **Sniper** (3x p/m): 3 ballen = +1, 4 ballen = x2
7. **Speedpot** (2x p/m): Activeert 5-seconden regel
8. **BBC** (∞): Zwarte bal bij afstoot = +€5 bonus

### 📱 UI/UX
- **Touch-optimized**: Grote knoppen perfect voor gebruik bij de pooltafel
- **Real-time updates**: Live berekeningen en visuele feedback
- **Danger zone**: Visuele waarschuwingen bij hoge streaks
- **Match geschiedenis**: Volledig overzicht met correctie mogelijkheid
- **PWA**: Installeerbaar op mobiel, werkt offline

## 🏗️ Technische Architectuur

### Tech Stack
- **Next.js 15** met App Router
- **TypeScript** voor type-safety
- **Tailwind CSS** voor styling
- **Framer Motion** voor animaties
- **Local Storage** voor data persistentie

### Data Structuur

```typescript
GameState {
  jesse: Player
  flip: Player
  currentMonth: string
  matches: MatchResult[]
}

Player {
  name: PlayerName
  streak: number
  monthlyTotal: number
  powerUpQuota: PowerUpQuota
}
```

### Streak Engine
De `calculateMatch()` functie in `/lib/streakEngine.ts` bevat alle spelregels:
1. Power-ups van verliezer (Cumback Kid)
2. Pre-match power-ups winnaar (Toep, Pull The Plug, Sniper)
3. Basis streak berekening
4. Ballenbak Bizarre bonus
5. Sniper bonus toepassen
6. Bedrag berekening + anti-faillissement check
7. Ballenbak penalty
8. BBC bonus
9. Totalen updaten

## 🚀 Installatie & Setup

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev

# Build voor productie
npm run build

# Start productie server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## 📦 Projectstructuur

```
Pool/
├── app/
│   ├── globals.css          # Globale styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Hoofdpagina
├── components/
│   ├── PlayerCard.tsx        # Speler statistieken
│   ├── MatchInputModal.tsx   # Match invoer formulier
│   └── MatchHistory.tsx      # Match geschiedenis
├── lib/
│   ├── streakEngine.ts       # Spelregels & berekeningen
│   └── storage.ts            # Local storage helpers
├── types/
│   └── index.ts              # TypeScript definities
└── public/
    ├── manifest.json         # PWA manifest
    └── sw.js                 # Service worker
```

## 🎮 Gebruik

1. **Nieuw potje**: Klik op de + knop rechtsonder
2. **Selecteer winnaar**: Jesse of Flip
3. **Voer details in**: 
   - Aantal ballen tegenstander
   - Aantal eigen ballen winnaar
   - Actieve power-ups
4. **Opslaan**: De app berekent automatisch alles
5. **Geschiedenis**: Bekijk alle potjes en corrigeer indien nodig

## 🔧 Configuratie

### Constanten aanpassen
In `types/index.ts`:
```typescript
export const BASE_AMOUNT = 0.50;
export const MAX_DIFFERENCE_THRESHOLD = 150;
export const CAPPED_BASE_AMOUNT = 10;
export const CAPPED_INCREMENT = 2;
export const DANGER_ZONE_STREAK = 6;
```

### Power-up quota's aanpassen
In `types/index.ts`:
```typescript
export const INITIAL_POWER_UP_QUOTA: PowerUpQuota = {
  ballenBakBizarre: 1,
  cumbackKid: 1,
  toep: 5,
  // ... etc
};
```

## 📱 PWA Installatie

### iOS (Safari)
1. Open de app in Safari
2. Tap het share icoon
3. Selecteer "Add to Home Screen"

### Android (Chrome)
1. Open de app in Chrome
2. Tap het menu (drie stippen)
3. Selecteer "Install app" of "Add to Home Screen"

## 🧪 Testing

Test verschillende scenarios:
- Normale streak progressie
- Power-up combinaties
- Anti-faillissement limiet
- Maand overgang (reset power-ups)
- Match correcties

## 📄 Licentie

Private project - Jesse vs Flip Pool Competitie

## 🎯 Roadmap

Potentiële uitbreidingen:
- [ ] Multi-player support (meer dan 2 spelers)
- [ ] Statistieken & grafieken
- [ ] Achievement systeem
- [ ] Export/import functionaliteit
- [ ] Cloud sync (optioneel)
- [ ] Tournament mode

---

**Veel plezier met de competitie! 🎱🔥**
