// Installed as the sheet's onOpen trigger by createDashboardSheet_().
function onSheetOpen() {
  SpreadsheetApp.getUi()
      .createMenu('EventWatch')
      .addItem('Send WhatsApp Message', 'sendWhatsAppMessage')
      .addToUi();
}

function sendWhatsAppMessage() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  
  if (!range) {
    SpreadsheetApp.getUi().alert('කරුණාකර පේළියක් තෝරන්න (Please select a row).');
    return;
  }
  
  const rowIndex = range.getRow();
  
  // Exclude header row if clicked accidentally
  if (rowIndex === 1) {
    SpreadsheetApp.getUi().alert('කරුණාකර දත්ත පේළියක් තෝරන්න (Please select a data row, not the header).');
    return;
  }
  
  // Get columns A to G (1 to 7) for the selected row
  const rowData = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
  
  // A - EventName (Index 0)
  const eventName = String(rowData[0] || '').trim() || 'නොදනී';
  // B - Location (Index 1)
  const location = String(rowData[1] || '').trim() || 'ස්ථානය පසුවට දැනුම් දේ';
  // C - Status (Index 2)
  const status = String(rowData[2] || '').toLowerCase().trim();
  // D - Places (Index 3)
  const placesRaw = String(rowData[3] || '').trim();
  let places = parseInt(placesRaw, 10);
  if (isNaN(places)) places = 3;
  
  // E - 1st place (Index 4)
  let first = String(rowData[4] || '').trim();
  // F - 2nd place (Index 5)
  let second = String(rowData[5] || '').trim();
  // G - 3rd place (Index 6)
  let third = String(rowData[6] || '').trim();
  
  let resText = '';
  
  // Logic mimicking script.js
  if (status === 'finished') {
    resText = `🏆 *තරග ප්‍රතිඵල:*\n\n🏃 *තරගය:* ${eventName}\n`;
    
    if (places === 0) {
      resText += `\nමෙම තරගය සඳහා ජයග්‍රාහකයින් තෝරා නොගැනේ.`;
    } else if (places === 1) {
      first = first || 'තේරී නැත';
      resText += `\n🥇 *ජයග්‍රාහකයා:* ${first}`;
    } else {
      first = first || 'තේරී නැත';
      second = second || 'තේරී නැත';
      third = third || 'තේරී නැත';
      resText += `\n🥇 *ප්‍රථම ස්ථානය:* ${first}`;
      if (places >= 2) resText += `\n🥈 *දෙවන ස්ථානය:* ${second}`;
      if (places >= 3) resText += `\n🥉 *තෙවන ස්ථානය:* ${third}`;
    }
  } else if (status === 'cancelled') {
    resText = `🚫 *තරගය අවලංගු කර ඇත:*\n\n🏃 *තරගය:* ${eventName}\n\nමෙම තරගය අවලංගු කර ඇති බව කරුණාවෙන් සලකන්න.`;
  } else if (status === 'on going' || status === 'ongoing') {
    // New On Going Message Format
    resText = `🔥 *දැන් පැවැත්වේ:*\n\n🏃 *තරගය:* ${eventName}\n📍 *ස්ථානය:* ${location}\n\nමෙම තරගය මේ වන විට ආරම්භ වී ඇත.`;
  } else {
    // Default / Pending Message Format
    resText = `📢 *දැනුම්දීමයි:*\n\n🏃 *තරගය:* ${eventName}\n📍 *ස්ථානය:* ${location}\n\nකරුණාකර අදාල තරගකරුවන් වහාම වාර්තා කරන්න.`;
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
        <h3>WhatsApp විවෘත වෙමින් පවතී...</h3>
        <p>එය ස්වයංක්‍රීයව විවෘත නොවන්නේ නම්, පහත බොත්තම ඔබන්න.</p>
        <a href="${whatsappUrl}" class="btn" target="_blank" onclick="setTimeout(function(){ google.script.host.close(); }, 1000);">Open WhatsApp</a>
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
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Send WhatsApp Notification');
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
  flags.getRange(2, 1, 8, 2).setValues([
    ['EventName', title || 'My Event 2026'],
    ['EventSubtext', 'Live event dashboard'],
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
  events.getRange(2, 1, 3, 4).setValues([
    ['100m Sprint', 'Main Ground', 'pending', 3],
    ['Long Jump', 'Sand Pit', 'ongoing', 3],
    ['Relay', 'Main Ground', 'cancelled', 3]
  ]);
  events.getRange(2, 3, 200, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['pending', 'ongoing', 'finished', 'cancelled'], true).build());
  events.setFrozenRows(1);
  events.autoResizeColumns(1, headers.length);

  DriveApp.getFileById(ss.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  ScriptApp.newTrigger('onSheetOpen').forSpreadsheet(ss).onOpen().create();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();

  props.setProperty('SHEET_ID', ss.getId());
  return { sheetId: ss.getId(), sheetUrl: ss.getUrl(), created: true };
}
