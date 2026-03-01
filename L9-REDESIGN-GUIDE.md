# L9 AI Studios — Dashboard Redesign Guide
## Kompletní průvodce pro Claude Code

> **Stack:** Next.js 14 · Tailwind CSS · shadcn/ui · TypeScript  
> **Styl:** Minimalistický dark · Mobile-first  
> **Priorita:** Mobile → UX → Vizuál → Rychlost

---

## FÁZE 0 — Design System (udělej jako první)

### Barevná paleta

```css
/* globals.css — přepsat :root a .dark */
:root {
  --background: 0 0% 4%;        /* #0A0A0A — téměř černá */
  --foreground: 0 0% 95%;       /* #F2F2F2 — bílá */
  --card: 0 0% 7%;              /* #111111 — karta */
  --card-foreground: 0 0% 95%;
  --border: 0 0% 12%;           /* #1F1F1F — jemná hranice */
  --input: 0 0% 9%;             /* #171717 — input bg */
  --primary: 217 91% 60%;       /* #3B82F6 — modrá akce */
  --primary-foreground: 0 0% 100%;
  --muted: 0 0% 10%;            /* #1A1A1A — muted bg */
  --muted-foreground: 0 0% 45%; /* #737373 — šedý text */
  --accent: 217 91% 60%;
  --destructive: 0 84% 60%;     /* #F87171 — červená */
  --ring: 217 91% 60%;
  --radius: 0.75rem;
}
```

### Typografie

- **Font:** Inter (already in Next.js Google Fonts)
- **Heading:** `text-sm font-medium tracking-wide text-muted-foreground uppercase` — nadpisy sekcí
- **Title:** `text-2xl font-semibold text-foreground` — názvy stránek
- **Body:** `text-sm text-foreground` — běžný text
- **Micro:** `text-xs text-muted-foreground` — pomocné info

### Spacing systém

- Padding karet: `p-4` (mobile) → `p-5` (desktop)
- Gap mezi kartami: `gap-3` (mobile) → `gap-4` (desktop)
- Page padding: `px-4 py-6` (mobile) → `px-6 py-8` (desktop)

### Komponenty které musíš nainstalovat

```bash
npx shadcn@latest add card badge button input label separator skeleton tabs scroll-area
```

---

## FÁZE 1 — Layout a Navigace

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Redesign the app layout and navigation. Mobile-first.

1. Update app/layout.tsx:
   - Remove any existing sidebar
   - Add a BOTTOM navigation bar for mobile (fixed bottom, z-50)
   - Add a TOP navigation bar for desktop (md: and above)
   - Bottom nav has 4 icons + labels: Dashboard (LayoutDashboard), Viral Ideas (Flame), Média (Film), Nastavení (Settings)
   - Use lucide-react icons
   - Active state: icon and text in primary blue (#3B82F6), inactive: text-muted-foreground
   - Bottom nav style: bg-[#111111] border-t border-[#1F1F1F] h-16 flex items-center justify-around
   - Desktop top nav: hidden on mobile (hidden md:flex), horizontal, logo left + nav links right
   - Add padding-bottom: 4rem to main content on mobile so content isn't hidden behind bottom nav

2. Update globals.css with this color palette:
   --background: 0 0% 4%;
   --foreground: 0 0% 95%;
   --card: 0 0% 7%;
   --card-foreground: 0 0% 95%;
   --border: 0 0% 12%;
   --input: 0 0% 9%;
   --primary: 217 91% 60%;
   --primary-foreground: 0 0% 100%;
   --muted: 0 0% 10%;
   --muted-foreground: 0 0% 45%;
   --radius: 0.75rem;

3. Install these shadcn components first:
   npx shadcn@latest add card badge button input label separator skeleton tabs

4. Create components/BottomNav.tsx and components/TopNav.tsx as separate components.

Run npm run build after and fix any errors.
```

---

## FÁZE 2 — Dashboard stránka

### Co tam má být (nový layout):

**Mobile layout (single column):**
1. Header: "Sobota · Týden 9" + datum, vpravo "+ Generovat" button
2. Stats row: 3 mini karty vedle sebe (Čeká / Schváleno / Zveřejněno)
3. Týdenní calendar: horizontální scroll, 7 dní jako pill buttons
4. Dnešní post card: velká karta s obsahem postu + akce

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Redesign app/page.tsx (Dashboard) completely. Keep all existing logic and API calls, only change the visual layout.

New layout structure:

1. PAGE HEADER (sticky top on mobile):
   - Left: day name (bold, large) + "Týden X · Datum" below in muted text
   - Right: Button "+ 3 varianty" in primary blue, small, rounded-full
   - Style: px-4 py-4 border-b border-[#1F1F1F] bg-[#0A0A0A] sticky top-0 z-40

2. STATS ROW (3 cards in a row, equal width):
   - Each card: bg-[#111111] rounded-xl p-3 flex flex-col gap-1
   - Number: text-2xl font-bold text-foreground
   - Label: text-xs text-muted-foreground
   - Čeká na schválení (yellow dot), Schváleno (green dot), Zveřejněno (blue dot)
   - Layout: grid grid-cols-3 gap-2 px-4 py-3

3. WEEKLY CALENDAR:
   - Horizontal scrollable row: flex overflow-x-auto gap-2 px-4 py-3 scrollbar-hide
   - Each day pill: rounded-full px-3 py-2 text-xs font-medium
   - Active day: bg-primary text-white
   - Inactive: bg-[#111111] text-muted-foreground
   - Show emoji icon under day name (same as current)
   - No horizontal scrollbar visible (scrollbar-hide class via tailwind plugin)

4. SECTION LABEL: "DNEŠNÍ POST" in text-xs font-medium tracking-widest text-muted-foreground uppercase px-4 pb-2

5. POST CARD (if exists):
   - bg-[#111111] rounded-2xl mx-4 overflow-hidden
   - Top section p-4: status badge (rounded-full text-xs), then post title/hook text in font-medium
   - Divider: border-t border-[#1F1F1F]
   - Actions row p-3: horizontal scroll of action buttons
   - Action buttons: text-xs rounded-full px-3 py-1.5 border border-[#1F1F1F] hover:border-primary hover:text-primary transition-colors
   - Different buttons per status (keep existing logic)

6. EMPTY STATE (no post):
   - Center of card, icon + "Žádný post pro dnešek" + muted subtext
   - Dashed border card: border border-dashed border-[#2A2A2A] rounded-2xl mx-4 p-12 text-center

Keep all existing useState, useEffect, API calls exactly as they are.
Run npm run build after.
```

---

## FÁZE 3 — Viral Ideas stránka

### Nový layout:

1. Header s názvem + stats pills
2. Generate input card (velká, prominentní)
3. Lista nápadů s barevnými status badges

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Redesign the Viral Ideas page (find it in app/ directory — probably app/viral-ideas/page.tsx or similar).

New layout:

1. PAGE HEADER:
   - "🔥 Virální Ideas" title text-2xl font-semibold
   - Below: 4 status pills in a horizontal scroll row
   - Each pill: rounded-full px-3 py-1 text-xs font-medium bg-[#111111] border border-[#1F1F1F]
   - Active/count shown: "4 Nové" "2 Scénář" etc. with colored dots

2. GENERATE CARD:
   - bg-[#111111] rounded-2xl p-4 mx-4 my-3
   - Label: "VYGENEROVAT NOVÝ NÁPAD" text-xs tracking-widest text-muted-foreground mb-3
   - Input: full width, bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary outline-none
   - Button below input: w-full bg-primary text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2
   - Loading state: spinner + "Generuji..."
   - Helper text: text-xs text-muted-foreground mt-2 text-center

3. IDEAS LIST:
   - Section label "NÁPADY" uppercase tracking
   - Each idea card: bg-[#111111] rounded-2xl mx-4 mb-3 p-4
   - Top row: status badge (colored, rounded-full) + timestamp right aligned muted
   - Status colors: Nové=blue, Scénář=yellow, Natočeno=orange, Zveřejněno=green
   - Hook text: font-medium text-sm mt-2 line-clamp-2
   - Brief text: text-xs text-muted-foreground mt-1 line-clamp-1
   - Bottom actions row: small text buttons separated by dots

Keep all existing API logic unchanged. Run npm run build.
```

---

## FÁZE 4 — Média stránka

### Nový layout:

Upload area + grid galerie videí/obrázků

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Redesign the Média page completely. Keep all upload logic.

New layout:

1. PAGE HEADER:
   - "🎬 Média" + file count + total size in muted text
   - Right: Upload button (primary, rounded-full, small)

2. UPLOAD ZONE:
   - Dashed border drop zone: border-2 border-dashed border-[#2A2A2A] rounded-2xl mx-4 p-8 text-center
   - On hover/drag: border-primary bg-primary/5
   - Icon: Upload icon from lucide, text-muted-foreground
   - Text: "Přetáhni videa nebo fotky" font-medium
   - Sub: "MP4, MOV, JPG, PNG · max 500 MB" text-xs text-muted-foreground
   - During upload: show progress bar inside the zone (bg-primary rounded-full h-1)

3. FILTER TABS:
   - Horizontal pill tabs: Vše / Obrázky / Videa
   - Active: bg-[#1F1F1F] text-foreground
   - Inactive: text-muted-foreground
   - Style: flex gap-1 px-4 py-2

4. MEDIA GRID:
   - grid grid-cols-2 gap-2 px-4 (mobile) → grid-cols-3 md:grid-cols-4 (tablet+)
   - Each media card: aspect-square rounded-xl overflow-hidden relative bg-[#111111]
   - Video thumbnail: show first frame or video icon overlay
   - Image: object-cover w-full h-full
   - Overlay on hover: bg-black/50 flex items-center justify-center gap-2
   - Overlay buttons: copy URL icon, delete icon (white, small)
   - File type badge: absolute top-2 right-2 rounded-full bg-black/70 text-white text-xs px-2 py-0.5

5. EMPTY STATE:
   - Large centered empty state with icon if no media

Keep all existing upload logic and API calls. Run npm run build.
```

---

## FÁZE 5 — Nastavení stránka

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Redesign the Nastavení (Settings) page. Keep all save logic.

New layout:

1. PAGE HEADER:
   - "⚙️ Nastavení" title
   - Subtitle: text-xs text-muted-foreground "API klíče a integrace"

2. SETTINGS SECTIONS (each as a card):
   Style for each card: bg-[#111111] rounded-2xl mx-4 mb-3 overflow-hidden

   Each section:
   - Header inside card: p-4 border-b border-[#1F1F1F] — icon + section name font-medium + description text-xs text-muted-foreground
   - Body: p-4 flex flex-col gap-4

   Each field:
   - Label: text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5
   - Input: w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-4 py-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors
   - Password inputs: show/hide toggle (Eye/EyeOff icon from lucide) — absolute right-3 top-1/2 -translate-y-1/2
   - Helper link: text-xs text-primary mt-1 (e.g. "console.anthropic.com →")

3. SECTIONS ORDER:
   - 🤖 Claude / Anthropic (ANTHROPIC_API_KEY)
   - 🎙️ ElevenLabs (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID)  
   - 📱 WhatsApp / Twilio (TWILIO fields)
   - 📸 Instagram (INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID)

4. SAVE BUTTON:
   - Fixed bottom bar on mobile: bg-[#0A0A0A] border-t border-[#1F1F1F] p-4
   - Full width button: bg-primary text-white rounded-xl py-3 font-medium
   - Success state: bg-green-600 "Uloženo ✓" for 2 seconds

Keep all existing save/load API logic unchanged. Run npm run build.
```

---

## FÁZE 6 — PostCard komponenta (akce pro všechny statusy)

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Redesign components/PostCard.tsx visual style only. Keep ALL existing handler functions and logic.

Visual changes:

STATUS BADGE styles (rounded-full text-xs px-2.5 py-0.5 font-medium):
- pending_review: bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 "⏳ Čeká na schválení"
- approved: bg-blue-500/15 text-blue-400 border border-blue-500/20 "✓ Schváleno"
- rendering: bg-purple-500/15 text-purple-400 border border-purple-500/20 "⚡ Renderuje se"
- ready_for_review: bg-orange-500/15 text-orange-400 border border-orange-500/20 "👁 Ke kontrole"
- scheduled: bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 "🕕 Naplánováno"
- posted: bg-green-500/15 text-green-400 border border-green-500/20 "✓ Zveřejněno"
- failed: bg-red-500/15 text-red-400 border border-red-500/20 "✗ Chyba"

ACTION BUTTONS style:
- Container: flex flex-wrap gap-2 pt-3 border-t border-[#1F1F1F]
- Each button: text-xs rounded-full px-3 py-1.5 font-medium transition-all
- Primary action: bg-primary text-white hover:bg-primary/90
- Secondary action: border border-[#2A2A2A] text-muted-foreground hover:border-primary hover:text-primary bg-transparent
- Danger action: border border-red-500/20 text-red-400 hover:border-red-500 bg-transparent

VIDEO PREVIEW (status: ready_for_review):
- Show video element if video_url exists: rounded-xl overflow-hidden mb-3 aspect-video bg-[#0A0A0A]
- <video src={videoUrl} controls className="w-full h-full object-cover" />

RENDERING STATE:
- Show animated spinner + "Renderuje se... může trvat 2-5 minut" text-xs text-muted-foreground
- Use CSS animation: animate-pulse on a gradient bar

Keep every single existing function: handleApprove, handleReject, handleRender, handlePublish, handleSchedule, uploadVideos etc.
Run npm run build.
```

---

## FÁZE 7 — Finální polish

### Prompt pro Claude Code:

```prompt
Project is at C:\Users\lukyr\L9-Pipeline

TASK: Final polish pass. Fix any remaining issues.

1. Add loading skeletons everywhere data is fetching:
   - Import Skeleton from shadcn/ui
   - Stats cards: 3 skeleton rectangles h-16 rounded-xl
   - Post card: skeleton h-32 rounded-2xl
   - Ideas list: 3 skeleton items

2. Add empty states for all pages:
   - Dashboard no posts: centered icon + text + CTA button
   - Viral Ideas no ideas: "Vygeneruj svůj první nápad" 
   - Média no files: upload icon + instructions

3. Fix any spacing issues on iPhone SE (375px width):
   - All horizontal paddings minimum px-4
   - No horizontal overflow anywhere
   - Test by setting viewport to 375px in devtools

4. Add smooth page transitions:
   - Wrap main content in each page with: className="animate-in fade-in duration-200"
   - Add to tailwind.config.ts: require('tailwindcss-animate') plugin

5. Ensure all text is readable:
   - Minimum text-xs (12px) anywhere
   - No low-contrast text under 4.5:1 ratio
   - All interactive elements minimum 44px touch target

6. Run final: npm run build
   Fix ALL TypeScript errors before finishing.
   Report: list of all changed files.
```

---

## Pořadí spuštění

1. `FÁZE 0` — spusť `npx shadcn@latest add card badge button input label separator skeleton tabs` ručně
2. `FÁZE 1` — Layout + Navigace
3. `FÁZE 2` — Dashboard
4. `FÁZE 3` — Viral Ideas  
5. `FÁZE 4` — Média
6. `FÁZE 5` — Nastavení
7. `FÁZE 6` — PostCard
8. `FÁZE 7` — Finální polish

Po každé fázi: `git add . && git commit -m "redesign: fáze X" && git push origin main`

---

## Referenční design principy

**Co dělá Linear/Vercel dashboardy skvělé:**
- Téměř černé pozadí (#0A0A0A), ne #000000
- Karty jsou jen o 2-3% světlejší než pozadí
- Hranice jsou jemné (opacity 12-15%)
- Primární akce jsou jediná výrazná barva na stránce
- Velké množství whitespace — nekrmit karty přeplněným obsahem
- Status badges jsou vždy "pill" tvar s průhledným pozadím barvy stavu
- Ikony z lucide-react — konzistentní velikost 16px nebo 20px
- Fonty jsou Inter nebo system-ui, nikdy dekorativní
- Animace jsou subtle: 150-200ms, ease-out

**Mobile-first checklist:**
- [ ] Bottom navigation funguje a je viditelná
- [ ] Content není skrytý za bottom nav (padding-bottom)
- [ ] Touch targety jsou min 44×44px
- [ ] Žádný horizontální overflow
- [ ] Formuláře mají správný keyboard type (email, tel, etc.)
- [ ] Scrollování je plynulé (-webkit-overflow-scrolling: touch)
