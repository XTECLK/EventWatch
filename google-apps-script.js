function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('EventWatch')
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

