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
  var url = ScriptApp.getService().getUrl();
  if (!url) {
    SpreadsheetApp.getUi().alert('Deploy the scanner first. In Apps Script choose Deploy, New deployment, Web app. Execute as Me. Who has access: Anyone.');
    return;
  }
  var sheet = SpreadsheetApp.getActiveSheet();
  var map = headerMap_(sheet);
  requireColumns_(map, ['Email address', 'First Name', 'Last Name', 'Ticket code', 'Days allowed', 'Send test', 'Email sent']);
  var last = sheet.getLastRow();
  if (last < 2) return;
  var rows = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  var listName = listName_(sheet.getName());
  var sender = props_().getProperty('SENDER_EMAIL') || '';
  var sent = 0;
  rows.forEach(function(row, index) {
    if (!isChecked_(row[map['Send test'] - 1])) return;
    var email = String(row[map['Email address'] - 1] || '').trim();
    var code = String(row[map['Ticket code'] - 1] || '').trim();
    var first = String(row[map['First Name'] - 1] || '').trim();
    var last = String(row[map['Last Name'] - 1] || '').trim();
    if (!email || !code || code === 'Not eligible') return;
    var ticketUrl = url + '?ticket=' + encodeURIComponent(code);
    var qrBlob = UrlFetchApp.fetch('https://quickchart.io/qr?size=480&margin=1&text=' + encodeURIComponent(ticketUrl)).getBlob().setName('ticket.png');
    var options = {
      htmlBody: emailHtml_(first, last, listName, ticketUrl, row[map['Days allowed'] - 1]),
      inlineImages: { qr: qrBlob },
      name: 'Markaz Al-Rahma'
    };
    if (sender) options.from = sender;
    GmailApp.sendEmail(email, 'Your ticket — Building Sound Foundations in Islam', emailText_(first, ticketUrl), options);
    sheet.getRange(index + 2, map['Email sent']).setValue(new Date());
    sheet.getRange(index + 2, map['Send test']).setValue(false);
    sent += 1;
    if (sent % 25 === 0) Utilities.sleep(5 * 60 * 1000);
  });
  SpreadsheetApp.getUi().alert('Sent ' + sent + ' test email' + (sent === 1 ? '' : 's') + '.');
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action === 'scan' || params.action === 'pin' || params.callback) return doorCallback_(params);
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
  var callback = String(params.callback || '').replace(/[^\w$]/g, '');
  if (!callback) callback = 'doorCallback';
  var result = { ok: false, message: 'Unknown action.' };
  if (params.action === 'pin') result = checkPin(params.pin);
  if (params.action === 'scan') result = scanTicket(params.code, params.pin);
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
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
  var raw = String(found.sheet.getRange(found.row, found.map['Days allowed']).getValue() || '');
  return raw.split(',').map(function(part) { return Number(part); }).filter(function(n) { return n >= 1 && n <= 3; });
}

function allowedDays_(value) {
  var text = String(value || '');
  var days = [];
  if (/\b6\b|6th|friday/i.test(text)) days.push(1);
  if (/\b7\b|7th|saturday/i.test(text)) days.push(2);
  if (/\b8\b|8th|sunday/i.test(text)) days.push(3);
  if (!days.length || /all|every|whole|three/i.test(text)) return [1, 2, 3];
  return days;
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
  var sheets = SpreadsheetApp.getActive().getSheets();
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
  return null;
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

function emailText_(first, ticketUrl) {
  return 'Assalamu alaikum ' + first + ',\n\nYour ticket for Building Sound Foundations in Islam is ready.\n\n6–8 November 2026\nCavendish Banqueting Hall, Edgware Road, London NW9 5AL\n\nOpen your ticket: ' + ticketUrl + '\n\nShow the QR code at the door each day you attend. Each code can be scanned once per day.\n\nMarkaz Al-Rahma';
}

function emailHtml_(first, last, listName, ticketUrl, allowed) {
  var days = allowedDaysLabel_(allowed);
  return '<div style="font-family:Georgia,serif;color:#1f2933;line-height:1.5">'
    + '<p>Assalamu alaikum ' + escapeHtml_(first) + ',</p>'
    + '<p>Your ticket for <strong>Building Sound Foundations in Islam</strong> with Sheikh Badr Al Badr is ready.</p>'
    + '<p>6–8 November 2026<br>Cavendish Banqueting Hall, Edgware Road, London NW9 5AL</p>'
    + '<p><strong>' + escapeHtml_(first + ' ' + last) + '</strong><br>' + escapeHtml_(listName) + '<br>' + escapeHtml_(days) + '</p>'
    + '<p><img src="cid:qr" alt="Ticket QR code" width="240" height="240"></p>'
    + '<p><a href="' + ticketUrl + '">Open your ticket</a></p>'
    + '<p>Show this QR code at the door each day you attend. It can be scanned once per day.</p>'
    + '<p>Markaz Al-Rahma</p></div>';
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
