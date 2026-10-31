// Simple trigger: runs when the sheet is opened. The first time, it fills an
// empty spreadsheet with the Flags and Events tabs and sample data.
function onOpen() {
  ensureInitialized_();
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

// Simple trigger: stamps the finish time when an event's Status becomes Finished.
function onEdit(e) {
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
 * Creates the Flags and Events tabs with sample data if they don't exist yet.
 * Runs from the onOpen simple trigger, so it needs no extra permissions
 * beyond this one spreadsheet.
 */
function ensureInitialized_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Flags') && ss.getSheetByName('Events')) return;

  const flags = ss.getSheetByName('Flags') || ss.insertSheet('Flags');
  flags.clear();
  flags.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
  const start = new Date(Date.now() + 24 * 3600 * 1000);
  flags.getRange(2, 1, 9, 2).setValues([
    ['EventName', ss.getName()],
    ['EventSubtext', 'Live event dashboard'],
    ['Language', 'en'], // en | si
    ['EventStatus', 'PENDING'], // PENDING | ON_GOING | FINISHED
    ['EventStartDate', Utilities.formatDate(start, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd')],
    ['EventStartTime', '09:00:00'],
    ['Organizer', 'Your organization'],
    ['WhatsappLink', ''],
    ['FacebookLink', '']
  ]);
  flags.getRange('B4').setDataValidation(dropdown_(['en', 'si']));                       // Language
  flags.getRange('B5').setDataValidation(dropdown_(['PENDING', 'ON_GOING', 'FINISHED'])); // EventStatus
  flags.autoResizeColumns(1, 2);

  const events = ss.getSheetByName('Events') || ss.insertSheet('Events');
  events.clear();
  const headers = ['Event', 'Location', 'Status', 'Places', '1st', '2nd', '3rd', 'EndedTime'];
  events.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  events.getRange(2, 1, 4, 4).setValues([
    ['100m Sprint', 'Main Ground', 'Up Next', 3],
    ['Long Jump', 'Sand Pit', 'On Going', 3],
    ['Relay', 'Main Ground', 'Pending', 3],
    ['High Jump', 'Sand Pit', 'Cancelled', 3]
  ]);
  events.getRange(2, 3, 200, 1).setDataValidation(
    dropdown_(['Pending', 'Up Next', 'On Going', 'Finished', 'Cancelled']));
  events.setFrozenRows(1);
  events.autoResizeColumns(1, headers.length);

  // Remove the blank default sheet that came with the new spreadsheet
  const blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 2 && blank.getLastRow() === 0) ss.deleteSheet(blank);
  ss.setActiveSheet(events);
}

function dropdown_(values) {
  return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
}
