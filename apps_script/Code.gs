/**
 * Beginner English Pattern Trainer (Google Apps Script)
 * - Mobile-friendly Web App for solo learning
 * - Optional Telegram bot integration
 * - Tracks mistakes and frequently missed pattern slots
 */

const SHEET_NAMES = {
  PATTERNS: 'patterns',
  SESSIONS: 'sessions',
  MISTAKES: 'mistakes'
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('영어회화 패턴 트레이너')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let patterns = ss.getSheetByName(SHEET_NAMES.PATTERNS);
  if (!patterns) patterns = ss.insertSheet(SHEET_NAMES.PATTERNS);
  if (patterns.getLastRow() === 0) {
    patterns.appendRow(['id', 'ko_prompt', 'en_answer', 'pattern', 'slots', 'tags']);
    seedPatterns_(patterns);
  }

  let sessions = ss.getSheetByName(SHEET_NAMES.SESSIONS);
  if (!sessions) sessions = ss.insertSheet(SHEET_NAMES.SESSIONS);
  if (sessions.getLastRow() === 0) {
    sessions.appendRow([
      'timestamp',
      'pattern_id',
      'ko_prompt',
      'expected',
      'user_answer',
      'self_score',
      'mistake_tags',
      'slot_errors',
      'notes'
    ]);
  }

  let mistakes = ss.getSheetByName(SHEET_NAMES.MISTAKES);
  if (!mistakes) mistakes = ss.insertSheet(SHEET_NAMES.MISTAKES);
  if (mistakes.getLastRow() === 0) {
    mistakes.appendRow(['mistake_tag', 'count', 'last_updated']);
  }

  return 'OK';
}

function seedPatterns_(sheet) {
  const rows = [
    [1, '나 샤워해야 해.', 'I need to take a shower.', 'I need to take [N].', 'shower|break|chance', 'light-verb,need'],
    [2, '잠깐 쉴래.', 'I want to take a break.', 'I want to take [N].', 'break|nap|walk', 'light-verb,want'],
    [3, '결정해야 해.', 'I need to make a decision.', 'I need to make [N].', 'decision|plan|list', 'light-verb,need'],
    [4, '친구한테 전화할게.', 'I will give my friend a call.', 'I will give [PERSON] a [N].', 'friend|call|text', 'light-verb,future'],
    [5, '질문 하나 해도 돼?', 'Can I ask a question?', 'Can I ask [N]?', 'a question|for help|again', 'light-verb,question'],
    [6, '운동 좀 해야겠어.', 'I should get some exercise.', 'I should get [N].', 'some exercise|some rest|some help', 'light-verb,health'],
    [7, '약속 잡자.', "Let's make a plan.", "Let's make [N].", 'a plan|a list|a schedule', 'light-verb,suggestion'],
    [8, '사진 한 장 찍어줘.', 'Please take a picture.', 'Please take [N].', 'a picture|a seat|a look', 'light-verb,request']
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function getRandomPattern() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PATTERNS);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error('patterns 시트가 비어 있습니다. setupSheets()를 먼저 실행하세요.');

  const rows = values.slice(1);
  const picked = rows[Math.floor(Math.random() * rows.length)];

  return {
    id: picked[0],
    koPrompt: picked[1],
    enAnswer: picked[2],
    pattern: picked[3],
    slots: String(picked[4] || '').split('|').filter(Boolean),
    tags: String(picked[5] || '').split(',').filter(Boolean),
    variations: buildVariations_(picked[3], String(picked[4] || '').split('|').filter(Boolean), 3)
  };
}

function buildVariations_(pattern, slotCandidates, limit) {
  const output = [];
  for (let i = 0; i < Math.min(limit, slotCandidates.length); i += 1) {
    output.push(pattern.replace('[N]', slotCandidates[i]));
  }
  return output;
}

function submitAttempt(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sessions = ss.getSheetByName(SHEET_NAMES.SESSIONS);

  const mistakeTags = (payload.mistakeTags || []).join(',');
  const slotErrors = (payload.slotErrors || []).join(',');

  sessions.appendRow([
    new Date(),
    payload.patternId,
    payload.koPrompt,
    payload.expected,
    payload.userAnswer,
    payload.selfScore,
    mistakeTags,
    slotErrors,
    payload.notes || ''
  ]);

  updateMistakeStats_(payload.mistakeTags || []);
  return { ok: true };
}

function updateMistakeStats_(tags) {
  if (!tags.length) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MISTAKES);
  const values = sheet.getDataRange().getValues();
  const map = {};

  values.slice(1).forEach((row, idx) => {
    map[row[0]] = { rowIndex: idx + 2, count: row[1] || 0 };
  });

  tags.forEach((tag) => {
    if (map[tag]) {
      sheet.getRange(map[tag].rowIndex, 2).setValue(Number(map[tag].count) + 1);
      sheet.getRange(map[tag].rowIndex, 3).setValue(new Date());
    } else {
      sheet.appendRow([tag, 1, new Date()]);
    }
  });
}

function getMistakeDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MISTAKES);
  const values = sheet.getDataRange().getValues();

  return values
    .slice(1)
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .map((row) => ({
      tag: row[0],
      count: row[1],
      updatedAt: row[2]
    }));
}

/**
 * Telegram integration (optional)
 * 1) Set Script Property: TELEGRAM_BOT_TOKEN
 * 2) Deploy web app and set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEB_APP_URL>
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  const message = body.message;
  if (!message || !message.chat || !message.text) {
    return ContentService.createTextOutput('OK');
  }

  const chatId = message.chat.id;
  const text = String(message.text).trim();

  if (text === '/start' || text === '/next') {
    const p = getRandomPattern();
    sendTelegramMessage_(chatId, `🇰🇷 ${p.koPrompt}\n\n말해보거나 적어본 뒤 /show 입력!\n(패턴: ${p.pattern})`);
    cacheTelegramPattern_(chatId, p);
    return ContentService.createTextOutput('OK');
  }

  if (text === '/show') {
    const p = getTelegramCachedPattern_(chatId);
    if (!p) {
      sendTelegramMessage_(chatId, '먼저 /next 로 문제를 받아주세요.');
      return ContentService.createTextOutput('OK');
    }
    const variations = (p.variations || []).map((v) => `- ${v}`).join('\n');
    sendTelegramMessage_(chatId, `✅ 정답: ${p.enAnswer}\n\n🔁 응용:\n${variations}`);
    return ContentService.createTextOutput('OK');
  }

  sendTelegramMessage_(chatId, '명령어: /next, /show');
  return ContentService.createTextOutput('OK');
}

function cacheTelegramPattern_(chatId, patternObj) {
  const cache = CacheService.getScriptCache();
  cache.put(`chat:${chatId}:pattern`, JSON.stringify(patternObj), 3600);
}

function getTelegramCachedPattern_(chatId) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(`chat:${chatId}:pattern`);
  return raw ? JSON.parse(raw) : null;
}

function sendTelegramMessage_(chatId, text) {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text })
  });
}
