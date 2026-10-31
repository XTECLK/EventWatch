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
2. Create a Google Sheet with the Apps Script (`google/`) **attached to it**, and push the code. The script can only touch that one spreadsheet (permissions: that sheet + its menu), nothing else in your Drive.
3. Open the sheet. On first open it fills itself with the `Flags` and `Events` tabs and sample data. You click **Share → Anyone with the link → Viewer** once (the site reads the sheet as public CSV), then press Enter; setup checks it can read it.
4. Save the IDs and frontend config to `.eventwatch/app.json` (script ID, sheet ID/URL, tab names, refresh). It is gitignored, so each fork gets its own; the site reads the generated `public/config.json`.
5. Deploy the frontend to Vercel or Netlify (or skip and use `npm start`).

Afterwards: `npm run google:update` pushes script changes to the sheet's script (reload the sheet to use them), and `npm run deploy` redeploys the frontend. Updating the script never changes data already in the sheet.

The website never writes to the sheet. It only fetches the sheet as CSV and displays it; you edit the sheet directly.

## Sheet structure

The sheet is read as CSV, so it must be shared as **Anyone with the link → Viewer** (you do this once during setup).

### `Flags` tab - key/value settings (column A = key, column B = value)

| Key | Meaning |
|---|---|
| `EventName` | Title in the header |
| `EventSubtext` | Subtitle in the header |
| `Language` | `en` (English) or `si` (Sinhala); defaults to `si` if missing. Switches all labels on the site and the WhatsApp messages from the sheet menu |
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
| `Status` | `Pending`, `Up Next`, `On Going`, `Finished` or `Cancelled` (case, spaces and dashes don't matter) |
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
- The other fields (`scriptId`, `sheetUrl`) are used by the setup tooling.

## URL parameters

| Param | Effect |
|---|---|
| `?lang=en` / `?lang=si` | Overrides the sheet's `Language` |
| `?fullscreen=true` | Shows a "start" overlay that enters browser fullscreen (kiosk screens) |
| `?hidefooter=true` | Hides the footer |
| `?screen=true` | Footer without buttons (big display) |

## Manual setup (without the scripts)

1. Create a Google Sheet (with `google/Code.js` in Extensions → Apps Script it creates the `Flags` and `Events` tabs on first open, or add them yourself as described above) and share it "Anyone with the link → Viewer".
2. Put the site files in a folder with a `config.json` containing at least `{ "sheetId": "<your sheet id>" }`.
3. Host the folder on any static host (or `npm start`). The menu and auto-timestamp in `google/Code.js` are optional; paste it into a new sheet's Extensions → Apps Script editor and reload; it fills in the tabs for you.

## Customizing

- **Languages:** English and Sinhala are built in. Set `Language` in the `Flags` tab, or add `?lang=en` / `?lang=si` to the URL to override. Site labels live in `i18n.js`; the WhatsApp messages in `google/Code.js` (`MESSAGES`). To add a language, copy one block in each and translate it.
- Styling is in `style.css`; the background image is in `assets/`.

## Project layout

```
index.html / style.css / script.js   frontend
i18n.js                              English / Sinhala labels
config.js                            loads config.json (generated into public/)
public/                              staged site that gets deployed (generated, gitignored)
google/                              Apps Script attached to the sheet (first-open sample data, WhatsApp menu, finish-time stamp)
scripts/                             setup, google-app (clasp) and deploy tooling
.eventwatch/app.json                 IDs + frontend config (created by setup, gitignored)
```

## Troubleshooting

- **Page stuck on loading**: the sheet isn't shared as "Anyone with the link", `sheetId` in `public/config.json` is wrong, or a tab name differs from it.
- **`clasp create` fails with "Apps Script API has not been used"**: enable it at <https://script.google.com/home/usersettings>.
- **Setup says it can't read the Flags tab**: reload the sheet so it fills itself in, and check Share → General access is "Anyone with the link".
- **Menu missing in the sheet**: reload the spreadsheet.
