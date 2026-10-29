var EVENT_DAYS = [
  { n: 1, date: '2026-11-06', label: 'Friday 6 November' },
  { n: 2, date: '2026-11-07', label: 'Saturday 7 November' },
  { n: 3, date: '2026-11-08', label: 'Sunday 8 November' }
];

var EXTRA_HEADERS = ['Ticket code', 'Days allowed', 'Day 1', 'Day 2', 'Day 3', 'Email sent', 'Send test'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Conference tickets')
    .addItem('1. Prepare this sheet', 'prepareSheet')
    .addItem('2. Create ticket codes', 'issueCodes')
    .addItem('3. Send ticked test emails', 'sendTestEmails')
    .addItem('Turn on instant ticket emails', 'enableInstantTicketEmails')
    .addItem('Email everyone not sent yet', 'emailEveryoneOutstanding')
    .addItem('Check for bounced emails', 'markBouncedTickets')
    .addItem('Set the shared ticket address', 'setTicketAddress')
    .addItem('Link the other sign-up sheet', 'linkOtherSheet')
    .addSeparator()
    .addItem('Treat today as day 1', 'setTestDay1')
    .addItem('Treat today as day 2', 'setTestDay2')
    .addItem('Treat today as day 3', 'setTestDay3')
    .addItem('Use the real November dates', 'clearTestDay')
    .addSeparator()
    .addItem('Set the door PIN', 'setStaffPin')
    .addItem('Set the one.com sender address', 'setSenderEmail')
    .addToUi();
}

function setTestDay1() { setTestDay('1'); }
function setTestDay2() { setTestDay('2'); }
function setTestDay3() { setTestDay('3'); }
function clearTestDay() { setTestDay(''); }

function setTestDay(day) {
  props_().setProperty('TEST_DAY', day);
  SpreadsheetApp.getUi().alert(day
    ? 'Test mode is on. Today will count as day ' + day + '/3.'
    : 'Test mode is off. Scans follow 6, 7 and 8 November.');
}

function setStaffPin() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.prompt('Door PIN', 'Choose a PIN the team will type into the scanner.', ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var pin = answer.getResponseText().trim();
  if (pin.length < 4) {
    ui.alert('Use at least 4 characters.');
    return;
  }
  props_().setProperty('STAFF_PIN', pin);
  ui.alert('The door PIN is saved in this script. It is not written on the sheet.');
}

function setSenderEmail() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.prompt(
    'Sender address',
    'Type the one.com address, for example info@markazrahma.org. It must already be added in Gmail under Settings, Accounts, Send mail as. Leave blank to send from this Google account for the test.',
    ui.ButtonSet.OK_CANCEL
  );
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  props_().setProperty('SENDER_EMAIL', answer.getResponseText().trim());
  ui.alert('Sender address saved.');
}

function prepareSheet() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var map = headerMap_(sheet);
  requireColumns_(map, ['Email address', 'First Name', 'Last Name']);
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  EXTRA_HEADERS.forEach(function(name) {
    if (!map[name]) {
      lastCol += 1;
      sheet.getRange(1, lastCol).setValue(name);
      map[name] = lastCol;
    }
  });
  var sendCol = map['Send test'];
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, sendCol, sheet.getLastRow() - 1, 1).insertCheckboxes();
  }
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('Ticket columns are ready on "' + sheet.getName() + '". Rename the tab to Brothers or Sisters if it is not named that yet.');
}

function issueCodes() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var map = headerMap_(sheet);
  requireColumns_(map, ['Email address', 'First Name', 'Last Name', 'Ticket code', 'Days allowed']);
  var last = sheet.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getUi().alert('Add a test row first.');
    return;
  }
  var width = sheet.getLastColumn();
  var rows = sheet.getRange(2, 1, last - 1, width).getValues();
  var listName = listName_(sheet.getName());
  var made = 0;
  rows.forEach(function(row, index) {
    var email = String(row[map['Email address'] - 1] || '').trim();
    var first = String(row[map['First Name'] - 1] || '').trim();
    if (!email || !first) return;
    if (!eligible_(row[ageCol_(map) - 1])) {
      sheet.getRange(index + 2, map['Ticket code']).setValue('Not eligible');
      return;
    }
    var code = String(row[map['Ticket code'] - 1] || '').trim();
    if (!code || code === 'Not eligible') {
      code = newCode_(listName);
      sheet.getRange(index + 2, map['Ticket code']).setValue(code);
      made += 1;
    }
    sheet.getRange(index + 2, map['Days allowed']).setValue(allowedDays_(row[daysCol_(map) - 1]).join(','));
  });
  SpreadsheetApp.getUi().alert('Created ' + made + ' new ticket code' + (made === 1 ? '' : 's') + ' on ' + listName + '.');
}

function sendTestEmails() {
  var url = ticketBaseUrl_();
  if (!url) {
    SpreadsheetApp.getUi().alert('Set the shared ticket address first. Paste the one web app address that ends in /exec — the same one saved for the door. Deploy that web app on one sheet only.');
    return;
  }
  var sheet = SpreadsheetApp.getActiveSheet();
  var map = headerMap_(sheet);
  requireColumns_(map, ['Email address', 'First Name', 'Last Name', 'Ticket code', 'Days allowed', 'Send test', 'Email sent']);
  var last = sheet.getLastRow();
  if (last < 2) return;
  var rows = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  var listName = listName_(sheet.getName());
  var sent = 0;
  rows.forEach(function(row, index) {
    if (!isChecked_(row[map['Send test'] - 1])) return;
    var email = String(row[map['Email address'] - 1] || '').trim();
    var code = String(row[map['Ticket code'] - 1] || '').trim();
    var first = String(row[map['First Name'] - 1] || '').trim();
    var last = String(row[map['Last Name'] - 1] || '').trim();
    if (!email || !code || code === 'Not eligible') return;
    if (sent >= 25) return;
    sendTicketEmail_(email, first, last, listName, code, '1,2,3');
    sheet.getRange(index + 2, map['Email sent']).setValue(new Date());
    sheet.getRange(index + 2, map['Days allowed']).setValue('1,2,3');
    sheet.getRange(index + 2, map['Send test']).setValue(false);
    paintSentRow_(sheet, index + 2);
    noteMailSends_(1);
    sent += 1;
  });
  SpreadsheetApp.getUi().alert(sent >= 25
    ? 'Sent 25 test emails. Leave the other ticks in place and run this again in 5 minutes.'
    : 'Sent ' + sent + ' test email' + (sent === 1 ? '' : 's') + '.');
}

function sendTicketEmail_(email, first, last, listName, code, allowed) {
  var ticketUrl = 'https://www.markazrahma.org/ticket.html?ticket=' + encodeURIComponent(code);
  var qrBlob = UrlFetchApp.fetch('https://quickchart.io/qr?size=480&margin=1&text=' + encodeURIComponent(ticketUrl)).getBlob().setName('ticket.png');
  var options = {
    htmlBody: emailHtml_(first, last, listName, ticketUrl, allowed),
    inlineImages: { qr: qrBlob },
    name: 'Markaz Al-Rahma'
  };
  var sender = props_().getProperty('SENDER_EMAIL') || '';
  if (sender) options.from = sender;
  GmailApp.sendEmail(email, 'Your ticket — Building Sound Foundations in Islam', emailText_(first, last, listName, ticketUrl, allowed), options);
}

// Installable trigger only. A simple onFormSubmit cannot send Gmail, and both together would email twice.
function sendTicketOnSignup(e) {
  var rowIndex = 0;
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    rowIndex = e.range.getRow();
    if (rowIndex < 2) return;
    var map = headerMap_(sheet);
    var needed = ['Email address', 'First Name', 'Last Name', 'Ticket code', 'Days allowed', 'Email sent'];
    for (var i = 0; i < needed.length; i++) {
      if (!map[needed[i]]) {
        Logger.log('Instant ticket: missing column "' + needed[i] + '" on row ' + rowIndex + '. Run Prepare this sheet.');
        return;
      }
    }
    var row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    var code = String(row[map['Ticket code'] - 1] || '').trim();
    var alreadySent = String(row[map['Email sent'] - 1] || '').trim();
    if (code || alreadySent) return;
    if (!eligible_(row[ageCol_(map) - 1])) return;
    var email = String(row[map['Email address'] - 1] || '').trim();
    var first = String(row[map['First Name'] - 1] || '').trim();
    var last = String(row[map['Last Name'] - 1] || '').trim();
    if (!first) return;
    var listName = listName_(sheet.getName());
    var days = '1,2,3';
    code = newCode_(listName);
    sheet.getRange(rowIndex, map['Ticket code']).setValue(code);
    sheet.getRange(rowIndex, map['Days allowed']).setValue(days);
    if (!email) {
      Logger.log('Instant ticket: row ' + rowIndex + ' has no email address. Code saved, nothing sent.');
      return;
    }
    if (mailRoom_() < 1) {
      ensureBacklogTrigger_();
      Logger.log('Instant ticket queued on row ' + rowIndex + ' because 25 emails were already sent in the last 5 minutes.');
      return;
    }
    sendTicketEmail_(email, first, last, listName, code, days);
    sheet.getRange(rowIndex, map['Email sent']).setValue(new Date());
    paintSentRow_(sheet, rowIndex);
    noteMailSends_(1);
  } catch (err) {
    Logger.log('Instant ticket email failed on row ' + rowIndex + ': ' + err);
  }
}

function enableInstantTicketEmails() {
  var book = SpreadsheetApp.getActive();
  props_().setProperty('SPREADSHEET_ID', book.getId());
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    var handler = trigger.getHandlerFunction();
    if (handler === 'sendTicketOnSignup' || handler === 'markBouncedTickets') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('sendTicketOnSignup')
    .forSpreadsheet(book)
    .onFormSubmit()
    .create();
  ScriptApp.newTrigger('markBouncedTickets')
    .timeBased()
    .everyMinutes(15)
    .create();
  markBouncedTickets();
  var url = ticketBaseUrl_();
  SpreadsheetApp.getUi().alert(url
    ? 'New signups on the Brothers and Sisters tabs will be emailed a ticket straight away. A sent row turns green. A bounced address turns red on the next check, about every 15 minutes. Every ticket is valid for all 3 days. People already on the sheet are not emailed until you run Email everyone not sent yet.'
    : 'The trigger is on, but no ticket address is set, so the email cannot be sent yet. Deploy this spreadsheet’s web app, or use Set the shared ticket address and paste its /exec address.');
}

function emailEveryoneOutstanding() {
  var book = SpreadsheetApp.getActive();
  props_().setProperty('SPREADSHEET_ID', book.getId());
  if (!ticketBaseUrl_()) {
    SpreadsheetApp.getUi().alert('Deploy the web app first. In Apps Script choose Deploy, New deployment, Web app. Execute as Me. Who has access: Anyone. Then run this again.');
    return;
  }
  var sent = sendOutstandingTickets();
  var remaining = countUnsent_(book);
  var sender = props_().getProperty('SENDER_EMAIL') || 'this Google account';
  SpreadsheetApp.getUi().alert(remaining
    ? 'Sent ' + sent + ' from ' + sender + '. ' + remaining + ' still to go. The rest send on their own, 25 every 5 minutes, until the list is finished.'
    : 'Sent ' + sent + ' from ' + sender + '. Everyone with an email address now has a ticket.');
}

function sendOutstandingTickets() {
  var sent = 0;
  try {
    var pauseUntil = Number(props_().getProperty('MAIL_PAUSE_UNTIL') || '0');
    if (pauseUntil && Date.now() < pauseUntil) {
      ensureBacklogTrigger_();
      return 0;
    }
    var book = conferenceBook_();
    if (!book || !ticketBaseUrl_()) return 0;
    var room = mailRoom_();
    if (room < 1) {
      ensureBacklogTrigger_();
      return 0;
    }
    eachUnsentRow_(book, function(sheet, map, rowIndex, row) {
      if (sent >= room) return false;
      var email = String(row[map['Email address'] - 1] || '').trim();
      var first = String(row[map['First Name'] - 1] || '').trim();
      var last = String(row[map['Last Name'] - 1] || '').trim();
      var listName = listName_(sheet.getName());
      var code = String(row[map['Ticket code'] - 1] || '').trim();
      if (!code || code === 'Not eligible') code = newCode_(listName);
      sheet.getRange(rowIndex, map['Ticket code']).setValue(code);
      sheet.getRange(rowIndex, map['Days allowed']).setValue('1,2,3');
      sheet.getRange(rowIndex, map['Email sent']).setValue('Sending');
      try {
        sendTicketEmail_(email, first, last, listName, code, '1,2,3');
        sheet.getRange(rowIndex, map['Email sent']).setValue(new Date());
        paintSentRow_(sheet, rowIndex);
        noteMailSends_(1);
        sent += 1;
      } catch (err) {
        sheet.getRange(rowIndex, map['Email sent']).setValue('');
        Logger.log('Outstanding ticket failed on row ' + rowIndex + ': ' + err);
        if (isMailLimit_(err)) {
          props_().setProperty('MAIL_PAUSE_UNTIL', String(Date.now() + pauseFor_(err)));
          return false;
        }
      }
    });
  } catch (err) {
    Logger.log('Outstanding tickets failed: ' + err);
  }
  try {
    var current = conferenceBook_();
    if (current && countUnsent_(current) > 0) ensureBacklogTrigger_();
    else removeBacklogTrigger_();
  } catch (err) {
    Logger.log('Outstanding ticket trigger update failed: ' + err);
  }
  return sent;
}

function eachUnsentRow_(book, fn) {
  var sheets = book.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var map = headerMap_(sheet);
    if (!map['Email address'] || !map['First Name'] || !map['Ticket code'] || !map['Email sent'] || !map['Days allowed']) continue;
    var last = sheet.getLastRow();
    if (last < 2) continue;
    var rows = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (asDate_(row[map['Email sent'] - 1])) continue;
      var pending = String(row[map['Email sent'] - 1] || '').trim();
      if (pending && pending !== 'Sending') continue;
      var email = String(row[map['Email address'] - 1] || '').trim();
      var first = String(row[map['First Name'] - 1] || '').trim();
      if (!email || !first) continue;
      if (!eligible_(row[ageCol_(map) - 1])) continue;
      if (String(row[map['Ticket code'] - 1] || '').trim() === 'Not eligible') continue;
      if (fn(sheet, map, i + 2, row) === false) return;
    }
  }
}

function countUnsent_(book) {
  var count = 0;
  eachUnsentRow_(book, function() { count += 1; });
  return count;
}

function mailRoom_() {
  var hour = recentMailSends_(60 * 60 * 1000);
  var cutoff = Date.now() - 5 * 60 * 1000;
  var five = 0;
  hour.forEach(function(stamp) { if (stamp >= cutoff) five += 1; });
  return Math.max(0, Math.min(25 - five, 250 - hour.length));
}

function recentMailSends_(windowMs) {
  var stamps = [];
  try {
    stamps = JSON.parse(props_().getProperty('MAIL_SEND_LOG') || '[]');
  } catch (err) {
    stamps = [];
  }
  var cutoff = Date.now() - windowMs;
  return stamps.filter(function(stamp) { return stamp >= cutoff; });
}

function noteMailSends_(count) {
  var stamps = recentMailSends_(60 * 60 * 1000);
  var now = Date.now();
  for (var i = 0; i < count; i++) stamps.push(now);
  props_().setProperty('MAIL_SEND_LOG', JSON.stringify(stamps));
}

function ensureBacklogTrigger_() {
  var exists = false;
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendOutstandingTickets') exists = true;
  });
  if (!exists) ScriptApp.newTrigger('sendOutstandingTickets').timeBased().everyMinutes(5).create();
}

function removeBacklogTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendOutstandingTickets') ScriptApp.deleteTrigger(trigger);
  });
  props_().deleteProperty('MAIL_PAUSE_UNTIL');
}

function isMailLimit_(err) {
  return /quota|rate limit|too many|limit exceeded|user-rate|daily limit/i.test(String(err && err.message ? err.message : err));
}

function pauseFor_(err) {
  var text = String(err && err.message ? err.message : err);
  if (/per day|daily|one day/i.test(text)) return 12 * 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function markBouncedTickets() {
  try {
    var book = conferenceBook_();
    if (!book) return;
    var bounces = bouncedAddresses_();
    book.getSheets().forEach(function(sheet) {
      grantAllDays_(sheet);
      paintTicketRows_(sheet, bounces);
    });
  } catch (err) {
    Logger.log('Bounce check failed: ' + err);
  }
}

function paintSentRow_(sheet, rowIndex) {
  var width = Math.max(sheet.getLastColumn(), 1);
  sheet.getRange(rowIndex, 1, 1, width).setBackground('#d9ead3');
}

function paintTicketRows_(sheet, bounces) {
  var map = headerMap_(sheet);
  if (!map['Email address'] || !map['Email sent']) return;
  var last = sheet.getLastRow();
  if (last < 2) return;
  var width = sheet.getLastColumn();
  var rows = sheet.getRange(2, 1, last - 1, width).getValues();
  var backgrounds = sheet.getRange(2, 1, last - 1, width).getBackgrounds();
  var changed = false;
  rows.forEach(function(row, index) {
    var sent = asDate_(row[map['Email sent'] - 1]);
    if (!sent) return;
    var email = String(row[map['Email address'] - 1] || '').trim().toLowerCase();
    var bounceAt = email ? bounces[email] : null;
    var colour = (bounceAt && (!sent || bounceAt.getTime() >= sent.getTime())) ? '#f4c7c3' : '#d9ead3';
    for (var c = 0; c < width; c++) {
      if (backgrounds[index][c] !== colour) {
        backgrounds[index][c] = colour;
        changed = true;
      }
    }
  });
  if (changed) sheet.getRange(2, 1, last - 1, width).setBackgrounds(backgrounds);
}

function grantAllDays_(sheet) {
  var map = headerMap_(sheet);
  if (!map['Ticket code'] || !map['Days allowed']) return;
  var last = sheet.getLastRow();
  if (last < 2) return;
  var codes = sheet.getRange(2, map['Ticket code'], last - 1, 1).getValues();
  var days = sheet.getRange(2, map['Days allowed'], last - 1, 1).getValues();
  var changed = false;
  codes.forEach(function(codeRow, index) {
    if (!/^MR[BS]-/.test(String(codeRow[0] || '').trim())) return;
    if (String(days[index][0]) === '1,2,3') return;
    days[index][0] = '1,2,3';
    changed = true;
  });
  if (changed) sheet.getRange(2, map['Days allowed'], last - 1, 1).setValues(days);
}

function bouncedAddresses_() {
  var found = {};
  var query = '(from:mailer-daemon OR from:postmaster OR subject:undeliverable OR subject:"delivery status notification" OR subject:"delivery incomplete" OR subject:"address not found") newer_than:30d';
  GmailApp.search(query, 0, 50).forEach(function(thread) {
    thread.getMessages().forEach(function(message) {
      if (!isBounceMessage_(message)) return;
      var body = '';
      try {
        body = message.getPlainBody() || '';
      } catch (err) {
        body = '';
      }
      var recipients = failedRecipients_(body);
      if (!recipients.length) {
        try {
          recipients = failedRecipients_(String(message.getRawContent() || '').substring(0, 20000));
        } catch (err) {
          recipients = [];
        }
      }
      var when = message.getDate();
      recipients.forEach(function(email) {
        if (!found[email] || when > found[email]) found[email] = when;
      });
    });
  });
  return found;
}

function isBounceMessage_(message) {
  var from = '';
  var subject = '';
  try {
    from = message.getFrom() || '';
    subject = message.getSubject() || '';
  } catch (err) {
    return false;
  }
  return /mailer-daemon|postmaster|mail delivery/i.test(from)
    || /undeliverable|delivery status|delivery incomplete|address not found|failure notice/i.test(subject);
}

function failedRecipients_(body) {
  var text = String(body || '').replace(/<[^>]+>/g, ' ');
  var patterns = [
    /Final-Recipient:\s*rfc822;\s*<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi,
    /X-Failed-Recipients:\s*<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi,
    /wasn['’]t delivered to\s+<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi,
    /could not be delivered to\s+<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi,
    /delivery to the following recipient(?:s)? failed(?: permanently)?:\s*<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi,
    /failed permanently:\s*<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi
  ];
  var seen = {};
  var list = [];
  patterns.forEach(function(pattern) {
    var match;
    while ((match = pattern.exec(text))) {
      var email = String(match[1] || '').toLowerCase().replace(/[>;,]+$/, '');
      if (!email || seen[email]) continue;
      seen[email] = true;
      list.push(email);
    }
  });
  return list;
}

function asDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  return null;
}

function conferenceBook_() {
  var active = SpreadsheetApp.getActive();
  if (active) return active;
  var id = props_().getProperty('SPREADSHEET_ID') || '';
  if (!id) return null;
  return SpreadsheetApp.openById(id);
}

function setTicketAddress() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.prompt(
    'Shared ticket address',
    'Paste the one web app address that ends in /exec. Use the same address on both sheets, and the same one saved for the door. Leave blank to clear it.',
    ui.ButtonSet.OK_CANCEL
  );
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var url = webAppUrl_(answer.getResponseText());
  if (answer.getResponseText().trim() && !url) {
    ui.alert('Use the web app address that starts with https://script.google.com/macros/s/ and ends in /exec.');
    return;
  }
  props_().setProperty('TICKET_WEB_APP_URL', url);
  ui.alert(url ? 'Ticket emails from this sheet will use that address.' : 'Shared ticket address cleared.');
}

function linkOtherSheet() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.prompt(
    'Other sign-up sheet',
    'Paste the address of the other form’s response spreadsheet. Run this on the one sheet whose web app is used for the door, so a scan can find either list.',
    ui.ButtonSet.OK_CANCEL
  );
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var id = spreadsheetId_(answer.getResponseText());
  if (!id) {
    ui.alert('Paste the Google Sheet address, the one that contains /spreadsheets/d/.');
    return;
  }
  if (id === SpreadsheetApp.getActive().getId()) {
    ui.alert('That is this spreadsheet. Paste the other form’s spreadsheet.');
    return;
  }
  props_().setProperty('OTHER_SPREADSHEET_ID', id);
  ui.alert('This door deployment will check that sheet as well. In Apps Script choose Deploy, Manage deployments, edit this web app, and set the version to New version. Vercel keeps this sheet’s /exec address only.');
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action === 'scan' || params.action === 'pin' || params.action === 'ticket' || params.callback) return doorCallback_(params);
  var ticket = params.ticket;
  if (ticket) {
    var page = HtmlService.createTemplateFromFile('Ticket');
    page.payload = JSON.stringify(getTicket(ticket)).replace(/</g, '\\u003c');
    return page.evaluate().setTitle('Conference ticket').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return HtmlService.createHtmlOutputFromFile('Scanner')
    .setTitle('Door scanner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doorCallback_(params) {
  var result = { ok: false, message: 'Unknown action.' };
  if (params.action === 'pin') result = checkPin(params.pin);
  if (params.action === 'scan') result = scanTicket(params.code, params.pin);
  if (params.action === 'ticket') result = getTicket(params.code || params.ticket);
  var body = JSON.stringify(result);
  var callback = String(params.callback || '').replace(/[^\w$]/g, '');
  if (!callback) {
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(callback + '(' + body + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getTicket(code) {
  var found = findTicket_(String(code || '').trim());
  if (!found) return { ok: false, message: 'This ticket was not found.' };
  return { ok: true, ticket: publicTicket_(found) };
}

function checkPin(pin) {
  var saved = props_().getProperty('STAFF_PIN') || '';
  if (!saved) return { ok: false, message: 'Set the door PIN from the Conference tickets menu, then deploy the web app again.' };
  if (String(pin || '').trim() !== saved) return { ok: false, message: 'The door PIN is wrong.' };
  return { ok: true, message: 'PIN accepted. You can scan now.' };
}

function scanTicket(code, pin) {
  var saved = props_().getProperty('STAFF_PIN') || '';
  if (!saved || String(pin || '').trim() !== saved) {
    return { ok: false, message: 'The door PIN is wrong.' };
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var found = findTicket_(String(code || '').trim());
    if (!found) return { ok: false, message: 'This ticket was not found.' };
    var day = currentDay_();
    if (!day) {
      return { ok: false, message: 'Today is not a conference day. Turn on a test day from the Conference tickets menu.', ticket: publicTicket_(found) };
    }
    var allowed = allowedFromStored_(found);
    var already = String(found.sheet.getRange(found.row, found.map['Day ' + day.n]).getValue() || '').trim();
    if (allowed.indexOf(day.n) === -1) {
      return { ok: false, message: 'Not registered for day ' + day.n + '/3.', ticket: publicTicket_(found) };
    }
    if (already) {
      return { ok: false, message: 'Already validated for day ' + day.n + '/3.', ticket: publicTicket_(found) };
    }
    var stamp = Utilities.formatDate(new Date(), 'Europe/London', 'd MMM HH:mm');
    found.sheet.getRange(found.row, found.map['Day ' + day.n]).setValue('Validated ' + stamp);
    SpreadsheetApp.flush();
    return { ok: true, message: 'Validated day ' + day.n + '/3.', ticket: publicTicket_(found) };
  } finally {
    lock.releaseLock();
  }
}

function publicTicket_(found) {
  var row = found.sheet.getRange(found.row, 1, 1, found.sheet.getLastColumn()).getValues()[0];
  var map = found.map;
  var allowed = allowedFromStored_(found);
  var first = String(row[map['First Name'] - 1] || '').trim();
  var last = String(row[map['Last Name'] - 1] || '').trim();
  return {
    name: (first + ' ' + last).trim(),
    list: listName_(found.sheet.getName()),
    code: String(row[map['Ticket code'] - 1] || ''),
    days: EVENT_DAYS.map(function(day) {
      var value = String(row[map['Day ' + day.n] - 1] || '').trim();
      var state = 'not-attending';
      if (allowed.indexOf(day.n) !== -1) state = value ? 'validated' : 'open';
      return { n: day.n, label: 'Day ' + day.n + '/3', when: day.label, state: state, detail: value };
    })
  };
}

function currentDay_() {
  var test = props_().getProperty('TEST_DAY') || '';
  if (test === '1' || test === '2' || test === '3') {
    return EVENT_DAYS[Number(test) - 1];
  }
  var today = Utilities.formatDate(new Date(), 'Europe/London', 'yyyy-MM-dd');
  for (var i = 0; i < EVENT_DAYS.length; i++) {
    if (EVENT_DAYS[i].date === today) return EVENT_DAYS[i];
  }
  return null;
}

function allowedFromStored_(found) {
  return [1, 2, 3];
}

function allowedDays_(value) {
  return [1, 2, 3];
}

function eligible_(value) {
  var text = String(value || '').trim();
  if (!text) return true;
  return !/^no\b/i.test(text);
}

function newCode_(listName) {
  var prefix = listName === 'Sisters' ? 'MRS-' : 'MRB-';
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var body = '';
  for (var i = 0; i < 8; i++) body += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return prefix + body;
}

function listName_(sheetName) {
  if (/sister/i.test(sheetName)) return 'Sisters';
  if (/brother/i.test(sheetName)) return 'Brothers';
  return sheetName;
}

function findTicket_(code) {
  if (!code) return null;
  var books = [SpreadsheetApp.getActive()];
  var otherId = props_().getProperty('OTHER_SPREADSHEET_ID') || '';
  if (otherId && otherId !== books[0].getId()) {
    try {
      books.push(SpreadsheetApp.openById(otherId));
    } catch (err) {
      Logger.log('Could not open the other sign-up sheet: ' + err);
    }
  }
  for (var b = 0; b < books.length; b++) {
    var sheets = books[b].getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var map = headerMap_(sheets[s]);
      if (!map['Ticket code']) continue;
      var last = sheets[s].getLastRow();
      if (last < 2) continue;
      var values = sheets[s].getRange(2, map['Ticket code'], last - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (String(values[i][0]).trim() === code) return { sheet: sheets[s], row: i + 2, map: map };
      }
    }
  }
  return null;
}

function ticketBaseUrl_() {
  var saved = props_().getProperty('TICKET_WEB_APP_URL') || '';
  if (!saved) saved = ScriptApp.getService().getUrl() || '';
  return String(saved).replace(/\/$/, '');
}

function webAppUrl_(text) {
  var url = String(text || '').trim().split('?')[0].replace(/\/$/, '');
  if (!url) return '';
  if (url.indexOf('https://script.google.com/macros/s/') !== 0 || url.slice(-5) !== '/exec') return '';
  return url;
}

function spreadsheetId_(text) {
  var match = String(text || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  var bare = String(text || '').trim();
  if (/^[a-zA-Z0-9-_]{20,}$/.test(bare)) return bare;
  return '';
}

function headerMap_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  var map = {};
  headers.forEach(function(header, index) {
    var name = String(header || '').trim();
    if (name) map[name] = index + 1;
  });
  return map;
}

function ageCol_(map) {
  return map['Are you 15 and/or over?'] || map['First Name'];
}

function daysCol_(map) {
  return map['Which days are you able to attend?'] || map['First Name'];
}

function requireColumns_(map, names) {
  names.forEach(function(name) {
    if (!map[name]) throw new Error('Missing column: ' + name + '. Run Prepare this sheet on a tab that has the form headers.');
  });
}

function isChecked_(value) {
  return value === true || /^yes|true$/i.test(String(value).trim());
}

function props_() {
  return PropertiesService.getScriptProperties();
}

function emailText_(first, last, listName, ticketUrl, allowed) {
  return 'اَلسَلامُ عَلَيْكُم وَرَحْمَةُ اَللهِ وَبَرَكاتُهُ ' + first + ',\n\n'
    + 'Your ticket for Building Sound Foundations in Islam with Sheikh Badr Al Badr is ready.\n\n'
    + '6–8 November 2026\n'
    + 'Cavendish Banqueting Hall, Edgware Road, London NW9 5AL\n\n'
    + (first + ' ' + last).trim() + '\n'
    + listName + '\n'
    + allowedDaysLabel_(allowed) + '\n\n'
    + 'Open your ticket: ' + ticketUrl + '\n\n'
    + 'Show this QR code at the door each day you attend. It can be scanned once per day.\n\n'
    + 'JazakAllah Khair and we hope you benefit from the event إن شاء الله,\n\n'
    + '- Markaz Al-Rahma';
}

function emailHtml_(first, last, listName, ticketUrl, allowed) {
  var days = allowedDaysLabel_(allowed);
  var name = escapeHtml_((first + ' ' + last).trim());
  var safeUrl = escapeHtml_(ticketUrl);
  var font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  var arabic = "'Noto Naskh Arabic',Amiri,Georgia,'Times New Roman',serif";
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6f3;margin:0;padding:0;">'
    + '<tr><td align="center" style="padding:28px 12px;">'
    + '<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">'
    + '<tr><td style="padding:22px 28px 18px 28px;border-bottom:3px solid #0891b2;">'
    + '<img src="https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/q7pgbb1k_Untitled%20design%20%2848%29.png" alt="Markaz Al-Rahma" width="36" height="36" style="display:inline-block;vertical-align:middle;border:0;">'
    + '<span style="display:inline-block;vertical-align:middle;padding-left:10px;font-family:' + font + ';font-size:18px;font-weight:700;color:#111827;">Markaz Al-Rahma</span>'
    + '</td></tr>'
    + '<tr><td style="padding:28px 28px 8px 28px;font-family:' + font + ';color:#111827;">'
    + '<p style="margin:0 0 18px 0;font-size:20px;line-height:1.6;"><span dir="rtl" style="font-family:' + arabic + ';">اَلسَلامُ عَلَيْكُم وَرَحْمَةُ اَللهِ وَبَرَكاتُهُ</span> ' + escapeHtml_(first) + ',</p>'
    + '<p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;">Your ticket for <strong>Building Sound Foundations in Islam</strong> with Sheikh Badr Al Badr is ready.</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">6–8 November 2026<br>Cavendish Banqueting Hall, Edgware Road, London NW9 5AL</p>'
    + '</td></tr>'
    + '<tr><td style="padding:18px 28px 8px 28px;">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6f3;border-radius:10px;">'
    + '<tr><td style="padding:16px 18px;font-family:' + font + ';color:#111827;">'
    + '<p style="margin:0;font-size:18px;font-weight:700;">' + name + '</p>'
    + '<p style="margin:4px 0 0 0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#0e7490;">' + escapeHtml_(listName) + '</p>'
    + '<p style="margin:8px 0 0 0;font-size:14px;line-height:1.5;color:#4b5563;">' + escapeHtml_(days) + '</p>'
    + '</td></tr></table>'
    + '</td></tr>'
    + '<tr><td align="center" style="padding:22px 28px 8px 28px;">'
    + '<img src="cid:qr" alt="Ticket QR code" width="220" height="220" style="display:block;border:0;">'
    + '</td></tr>'
    + '<tr><td align="center" style="padding:8px 28px 6px 28px;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td align="center" bgcolor="#0891b2" style="background:#0891b2;border-radius:8px;">'
    + '<a href="' + safeUrl + '" style="display:inline-block;padding:12px 22px;font-family:' + font + ';font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Open your ticket</a>'
    + '</td></tr></table>'
    + '</td></tr>'
    + '<tr><td style="padding:16px 28px 8px 28px;font-family:' + font + ';font-size:14px;line-height:1.6;color:#4b5563;">'
    + 'Show this QR code at the door each day you attend. It can be scanned once per day.'
    + '</td></tr>'
    + '<tr><td style="padding:8px 28px 28px 28px;font-family:' + font + ';font-size:15px;line-height:1.6;color:#111827;">'
    + 'JazakAllah Khair and we hope you benefit from the event <span dir="rtl" style="font-family:' + arabic + ';">إن شاء الله</span>,<br><br>- Markaz Al-Rahma'
    + '</td></tr>'
    + '</table>'
    + '</td></tr></table>';
}

function allowedDaysLabel_(stored) {
  var nums = String(stored || '').split(',').map(function(part) { return Number(part); });
  var labels = EVENT_DAYS.filter(function(day) { return nums.indexOf(day.n) !== -1; }).map(function(day) { return day.label; });
  return labels.length ? labels.join(', ') : '6–8 November 2026';
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}
