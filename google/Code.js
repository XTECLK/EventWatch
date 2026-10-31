// Installed as the sheet's onOpen trigger by createDashboardSheet_().
function onSheetOpen() {
  SpreadsheetApp.getUi()
      .createMenu('EventWatch')
      .addItem('Send WhatsApp Message', 'sendWhatsAppMessage')
      .addToUi();
}

// Message texts per language (the sheet's Flags tab "Language": en | si).
const MESSAGES = {
  en: {
    selectRow: 'Please select a row.',
    selectDataRow: 'Please select a data row, not the header.',
    unknown: 'Unknown', locationTbd: 'Location to be announced', notSelected: 'Not selected',
    resultsTitle: '🏆 *Results:*', event: '🏃 *Event:*', location: '📍 *Location:*',
    noWinners: 'No winners are selected for this event.',
    winner: '🥇 *Winner:*', first: '🥇 *1st place:*', second: '🥈 *2nd place:*', third: '🥉 *3rd place:*',
    cancelledTitle: '🚫 *Event cancelled:*', cancelledBody: 'Please note that this event has been cancelled.',
    ongoingTitle: '🔥 *Happening now:*', ongoingBody: 'This event has started.',
    pendingTitle: '📢 *Announcement:*', pendingBody: 'Participants, please report immediately.',
    opening: 'Opening WhatsApp...', openingHint: 'If it does not open automatically, press the button below.',
    open: 'Open WhatsApp', dialog: 'Send WhatsApp Notification'
  },
  si: {
    selectRow: 'කරුණාකර පේළියක් තෝරන්න.',
    selectDataRow: 'කරුණාකර දත්ත පේළියක් තෝරන්න (ශීර්ෂය නොවේ).',
    unknown: 'නොදනී', locationTbd: 'ස්ථානය පසුවට දැනුම් දේ', notSelected: 'තේරී නැත',
    resultsTitle: '🏆 *තරග ප්‍රතිඵල:*', event: '🏃 *තරගය:*', location: '📍 *ස්ථානය:*',
    noWinners: 'මෙම තරගය සඳහා ජයග්‍රාහකයින් තෝරා නොගැනේ.',
    winner: '🥇 *ජයග්‍රාහකයා:*', first: '🥇 *ප්‍රථම ස්ථානය:*', second: '🥈 *දෙවන ස්ථානය:*', third: '🥉 *තෙවන ස්ථානය:*',
    cancelledTitle: '🚫 *තරගය අවලංගු කර ඇත:*', cancelledBody: 'මෙම තරගය අවලංගු කර ඇති බව කරුණාවෙන් සලකන්න.',
    ongoingTitle: '🔥 *දැන් පැවැත්වේ:*', ongoingBody: 'මෙම තරගය මේ වන විට ආරම්භ වී ඇත.',
    pendingTitle: '📢 *දැනුම්දීමයි:*', pendingBody: 'කරුණාකර අදාල තරගකරුවන් වහාම වාර්තා කරන්න.',
    opening: 'WhatsApp විවෘත වෙමින් පවතී...', openingHint: 'එය ස්වයංක්‍රීයව විවෘත නොවන්නේ නම්, පහත බොත්තම ඔබන්න.',
    open: 'WhatsApp විවෘත කරන්න', dialog: 'WhatsApp පණිවිඩය යවන්න'
  }
};

function getLanguage_(ss) {
  const flags = ss.getSheetByName('Flags');
  if (flags) {
    const rows = flags.getDataRange().getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === 'Language') {
        const code = String(rows[i][1]).trim().toLowerCase();
        if (MESSAGES[code]) return code;
      }
    }
  }
  return 'si';
}

function sendWhatsAppMessage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const L = MESSAGES[getLanguage_(ss)];
  const sheet = ss.getActiveSheet();
  const range = sheet.getActiveRange();

  if (!range) {
    SpreadsheetApp.getUi().alert(L.selectRow);
    return;
  }

  const rowIndex = range.getRow();
  if (rowIndex === 1) {
    SpreadsheetApp.getUi().alert(L.selectDataRow);
    return;
  }

  // Columns A-G: Event, Location, Status, Places, 1st, 2nd, 3rd
  const rowData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  const eventName = String(rowData[0] || '').trim() || L.unknown;
  const location = String(rowData[1] || '').trim() || L.locationTbd;
  const status = String(rowData[2] || '').toLowerCase().replace(/[\s_-]/g, '');
  let places = parseInt(String(rowData[3] || '').trim(), 10);
  if (isNaN(places)) places = 3;
  const first = String(rowData[4] || '').trim() || L.notSelected;
  const second = String(rowData[5] || '').trim() || L.notSelected;
  const third = String(rowData[6] || '').trim() || L.notSelected;

  let resText = '';
  if (status === 'finished') {
    resText = `${L.resultsTitle}\n\n${L.event} ${eventName}\n`;
    if (places === 0) {
      resText += `\n${L.noWinners}`;
    } else if (places === 1) {
      resText += `\n${L.winner} ${first}`;
    } else {
      resText += `\n${L.first} ${first}`;
      if (places >= 2) resText += `\n${L.second} ${second}`;
      if (places >= 3) resText += `\n${L.third} ${third}`;
    }
  } else if (status === 'cancelled') {
    resText = `${L.cancelledTitle}\n\n${L.event} ${eventName}\n\n${L.cancelledBody}`;
  } else if (status === 'ongoing') {
    resText = `${L.ongoingTitle}\n\n${L.event} ${eventName}\n${L.location} ${location}\n\n${L.ongoingBody}`;
  } else {
    resText = `${L.pendingTitle}\n\n${L.event} ${eventName}\n${L.location} ${location}\n\n${L.pendingBody}`;
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(resText)}`;
  
  // Use a modal dialog to safely open the WhatsApp link
  // (Prevents the browser's pop-up blocker from silently blocking it)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 20px; color: #333; }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #25D366;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 20px;
            font-size: 16px;
          }
          .btn:hover { background-color: #128C7E; }
        </style>
      </head>
      <body>
        <h3>${L.opening}</h3>
        <p>${L.openingHint}</p>
        <a href="${whatsappUrl}" class="btn" target="_blank" onclick="setTimeout(function(){ google.script.host.close(); }, 1000);">${L.open}</a>
        <script>
          // Attempt to open immediately
          window.open("${whatsappUrl}", "_blank");
        </script>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(200);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, L.dialog);
}

// Installed as the sheet's onEdit trigger by createDashboardSheet_().
function onSheetEdit(e) {
  if (!e) return;
  const range = e.range;
  const sheet = range.getSheet();
  
  // Status column is C (3)
  if (range.getColumn() === 3 && range.getRow() > 1) {
    const value = String(e.value || range.getValue()).toLowerCase().trim();
    
    // Column H is 8
    const timeCell = sheet.getRange(range.getRow(), 8);
    
    if (value === 'finished') {
      // Set current date/time when status changes to finished
      // Format it as a readable string or a date object
      const now = new Date();
      timeCell.setValue(now);
    }
  }
}



/**
 * Web app API, called by scripts/google-app.mjs at setup time. JSON POST
 * { action }. No secret is needed: `init` only creates the sheet once and then
 * just returns the (public, view-only) sheet's id; nothing else is writable.
 *
 *   ping   -> { ok: true }
 *   init   -> creates the dashboard spreadsheet (once) and returns its id
 */
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { /* handled below */ }
  try {
    if (body.action === 'ping') return json_({ ok: true });
    if (body.action === 'init') return json_(Object.assign({ ok: true }, initDashboard_(body.title)));
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() { return json_({ ok: true, service: 'EventWatch' }); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run once from the Apps Script editor to approve the script's access to
 * Sheets, Drive and triggers. (Google only lets you do this by hand.)
 */
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet();
  DriveApp.getRootFolder();
  ScriptApp.getProjectTriggers();
  Logger.log('Authorized. Return to the terminal and press Enter.');
}

/**
 * Creates the spreadsheet with Flags and Events tabs and sample data, shares
 * it as view-only for anyone with the link, and installs the menu and
 * finish-time triggers. Idempotent: reuses the sheet remembered in the
 * script properties.
 */
function initDashboard_(title) {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty('SHEET_ID');
  if (existing) {
    try {
      const ss = SpreadsheetApp.openById(existing);
      return { sheetId: existing, sheetUrl: ss.getUrl(), created: false };
    } catch (err) { /* deleted: make a new one */ }
  }

  const ss = SpreadsheetApp.create(title || 'EventWatch');
  const flags = ss.getSheets()[0].setName('Flags');
  flags.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
  const start = new Date(Date.now() + 24 * 3600 * 1000);
  flags.getRange(2, 1, 9, 2).setValues([
    ['EventName', title || 'My Event 2026'],
    ['EventSubtext', 'Live event dashboard'],
    ['Language', 'en'], // en | si
    ['EventStatus', 'PENDING'], // PENDING | ON_GOING | FINISHED
    ['EventStartDate', Utilities.formatDate(start, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd')],
    ['EventStartTime', '09:00:00'],
    ['Organizer', 'Your organization'],
    ['WhatsappLink', ''],
    ['FacebookLink', '']
  ]);
  flags.autoResizeColumns(1, 2);

  const events = ss.insertSheet('Events');
  const headers = ['Event', 'Location', 'Status', 'Places', '1st', '2nd', '3rd', 'EndedTime'];
  events.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  events.getRange(2, 1, 4, 4).setValues([
    ['100m Sprint', 'Main Ground', 'Up Next', 3],
    ['Long Jump', 'Sand Pit', 'On Going', 3],
    ['Relay', 'Main Ground', 'Pending', 3],
    ['High Jump', 'Sand Pit', 'Cancelled', 3]
  ]);
  events.getRange(2, 3, 200, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pending', 'Up Next', 'On Going', 'Finished', 'Cancelled'], true).build());
  events.setFrozenRows(1);
  events.autoResizeColumns(1, headers.length);

  DriveApp.getFileById(ss.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  ScriptApp.newTrigger('onSheetOpen').forSpreadsheet(ss).onOpen().create();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();

  props.setProperty('SHEET_ID', ss.getId());
  return { sheetId: ss.getId(), sheetUrl: ss.getUrl(), created: true };
}
