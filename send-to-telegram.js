/**
 * Netlify Function: отправка заявки в Telegram.
 * В настройках сайта Netlify задайте переменные: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

function escapeHtml(text) {
  if (text == null || text === '') return '—';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMessage(data) {
  const { source, name, phone, region, comment, people_count, citizenship, contract_type, contact_pref } = data;
  const lines = [
    '📩 <b>Новая заявка</b> (' + (source === 'quiz' ? 'Квиз' : 'Онлайн-заявка') + ')',
    '',
    '👤 Имя: ' + escapeHtml(name),
    '📞 Телефон: ' + escapeHtml(phone),
  ];
  if (region) lines.push('📍 Регион: ' + escapeHtml(region));
  if (comment) lines.push('💬 Комментарий: ' + escapeHtml(comment));
  if (people_count != null && people_count !== '') lines.push('👥 Количество человек: ' + escapeHtml(people_count));
  if (citizenship) lines.push('🌐 Гражданство: ' + escapeHtml(citizenship));
  if (contract_type) lines.push('📄 Оформление: ' + escapeHtml(contract_type));
  if (contact_pref) lines.push('📲 Способ связи: ' + escapeHtml(contact_pref));
  return lines.join('\n');
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(statusCode, data) {
  return { statusCode, headers, body: JSON.stringify(data) };
}

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return jsonResponse(500, { ok: false, error: 'Telegram not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Netlify → Site configuration → Environment variables.' });
  }

  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  } catch (e) {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON' });
  }

  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  if (!name || !phone) {
    return jsonResponse(400, { ok: false, error: 'Name and phone required' });
  }

  const text = formatMessage({
    source: body.source || 'online_form',
    name,
    phone,
    region: body.region || '',
    comment: body.comment || '',
    people_count: body.people_count,
    citizenship: body.citizenship || '',
    contract_type: body.contract_type || '',
    contact_pref: body.contact_pref || '',
  });

  const url = TELEGRAM_API + token + '/sendMessage';
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (!result.ok) {
      return jsonResponse(500, { ok: false, error: result.description || 'Telegram API error' });
    }
    return jsonResponse(200, { ok: true });
  } catch (err) {
    return jsonResponse(500, { ok: false, error: err.message || 'Request failed' });
  }
};
