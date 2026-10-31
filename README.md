# EventWatch

A live event status dashboard that uses a **Google Sheet as its backend**. Organizers edit a spreadsheet; every visitor's browser sees the update within ~15 seconds. No server, no database, no build step - just static files plus a small Google Apps Script.

**Features**
- Countdown to the event start, then automatic switch to "on going"
- Live lists of ongoing, upcoming and finished competitions, with podium results (1st/2nd/3rd)
- Agenda modal, WhatsApp channel banner, photos link, organizer footer
- Sheet menu **EventWatch → Send WhatsApp Message** to share a row's status/results to WhatsApp
- Auto-stamps the finish time when an event's status is set to `finished`
- Display modes via URL params (for big screens / embeds)

## Quick start

Prerequisites: Node.js 18+, a Google account, and the Apps Script API turned **on** at <https://script.google.com/home/usersettings>.

```bash
git clone <this-repo> my-event && cd my-event
npm install
npm run setup
```

`npm run setup` will:
1. Log you into Google through [`clasp`](https://github.com/google/clasp) (browser window).
2. Create a standalone Apps Script project (`google/`), deploy it as a web app.
3. Open the script editor so you can run `authorize` once (Google requires this click), then call the web app, which **creates the Google Sheet** (with `Flags` and `Events` tabs and sample data), shares it view-only by link and installs the sheet's menu/triggers.
4. Save everything it learned, and the frontend config, to `.eventwatch/app.json` (script ID, deployment ID, web app URL, sheet ID/URL, tab names, refresh). It is gitignored, so each fork gets its own; the site reads the generated `public/config.json`.
5. Deploy the frontend to Vercel or Netlify (or skip and use `npm start`).

Afterwards: `npm run google:update` pushes script changes to the same deployment, and `npm run deploy` redeploys the frontend.

The website never writes to the sheet. It only fetches the sheet as CSV and displays it; you edit the sheet directly. The Apps Script web app is used only at setup time.

## Sheet structure

The sheet is read as CSV, so it must be shared as **Anyone with the link → Viewer** (setup does this).

### `Flags` tab - key/value settings (column A = key, column B = value)

| Key | Meaning |
|---|---|
| `EventName` | Title in the header |
| `EventSubtext` | Subtitle in the header |
| `EventStatus` | `PENDING` (countdown shown), `ON_GOING`, or `FINISHED` |
| `EventStartDate` | `YYYY-MM-DD` - countdown target |
| `EventStartTime` | `HH:MM:SS` - countdown target |
| `Organizer` | Footer text |
| `WhatsappLink` | WhatsApp channel/group link (banner hidden when empty) |
| `FacebookLink` | Photos/album link for the footer button |

### `Events` tab - one row per competition

| Column | Meaning |
|---|---|
| `Event` | Name |
| `Location` | Venue |
| `Status` | `pending`, `ongoing`, `finished` or `cancelled` |
| `Places` | How many podium places (`0`-`3`, default 3) |
| `1st`, `2nd`, `3rd` | Winners |
| `EndedTime` | Auto-filled when Status becomes `finished`; used to sort results |

Keep the header row exactly as above. The Apps Script relies on column positions: Status must be column C and EndedTime column H.

## Configuration (`.eventwatch/app.json`)

`npm run setup` writes this file and `npm run deploy` (and `npm start`) stage the site into the gitignored `public/` folder, writing the browser-relevant fields (`sheetId`, tabs, `refresh`) to `public/config.json`, which the site loads at runtime. `public/` is what gets uploaded.

```json
{
  "sheetId": "…",
  "flagsTab": "Flags",
  "eventsTab": "Events",
  "refresh": 15000
}
```

- `refresh` - polling interval in ms.
- The other fields (`scriptId`, `deploymentId`, `url`, `sheetUrl`) are used by the setup tooling.

## URL parameters

| Param | Effect |
|---|---|
| `?fullscreen=true` | Shows a "start" overlay that enters browser fullscreen (kiosk screens) |
| `?hidefooter=true` | Hides the footer |
| `?screen=true` | Footer without buttons (big display) |

## Manual setup (without the scripts)

1. Create a Google Sheet with `Flags` and `Events` tabs as described above, and share it "Anyone with the link → Viewer".
2. Put the site files in a folder with a `config.json` containing at least `{ "sheetId": "<your sheet id>" }`.
3. Host the folder on any static host (or `npm start`). The menu and auto-timestamp in `google/Code.js` are optional; paste it into the sheet's Apps Script editor and rename `onSheetOpen`/`onSheetEdit` to `onOpen`/`onEdit` to use them.

## Customizing

- UI text (Sinhala by default) lives in `index.html` and `script.js`; the WhatsApp messages are in `google/Code.js`. Replace them with your language.
- Styling is in `style.css`; the background image is in `assets/`.

## Project layout

```
index.html / style.css / script.js   frontend
config.js                            loads config.json (generated into public/)
public/                              staged site that gets deployed (generated, gitignored)
google/                              Apps Script web app (creates the sheet; menu, WhatsApp share, auto timestamps)
scripts/                             setup, google-app (clasp) and deploy tooling
.eventwatch/app.json                 IDs + frontend config (created by setup, gitignored)
```

## Troubleshooting

- **Page stuck on loading**: the sheet isn't shared as "Anyone with the link", `sheetId` in `public/config.json` is wrong, or a tab name differs from it.
- **`clasp create` fails with "Apps Script API has not been used"**: enable it at <https://script.google.com/home/usersettings>.
- **Setup says "Not authorized yet"**: in the script editor run `authorize` and accept (Advanced → Go to project), then press Enter again.
- **Menu missing in the sheet**: reload the spreadsheet.
