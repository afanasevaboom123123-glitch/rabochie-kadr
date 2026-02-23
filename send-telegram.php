<?php
/**
 * Отправка заявки в Telegram (для обычного хостинга с PHP).
 * В начале файла задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Вставьте сюда токен от @BotFather и свой Chat ID (число из getUpdates):
$token = getenv('TELEGRAM_BOT_TOKEN') ?: '8504727434:AAE8Vn0onfFpQL7rQy3i7VxCtfNClhrwEuY';
$chatId = getenv('TELEGRAM_CHAT_ID') ?: '955532465';

if ($token === '8504727434:AAE8Vn0onfFpQL7rQy3i7VxCtfNClhrwEuY' || $chatId === '955532465') {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Telegram not configured']);
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$name = trim((string)($body['name'] ?? ''));
$phone = trim((string)($body['phone'] ?? ''));

if ($name === '' || $phone === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Name and phone required']);
  exit;
}

function esc($s) {
  if ($s === null || $s === '') return '—';
  return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

$source = $body['source'] ?? 'online_form';
$lines = [
  '📩 Новая заявка (' . ($source === 'quiz' ? 'Квиз' : 'Онлайн-заявка') . ')',
  '',
  '👤 Имя: ' . esc($name),
  '📞 Телефон: ' . esc($phone),
];
if (!empty($body['region'])) $lines[] = '📍 Регион: ' . esc($body['region']);
if (!empty($body['comment'])) $lines[] = '💬 Комментарий: ' . esc($body['comment']);
if (isset($body['people_count']) && $body['people_count'] !== '') $lines[] = '👥 Количество человек: ' . esc($body['people_count']);
if (!empty($body['citizenship'])) $lines[] = '🌐 Гражданство: ' . esc($body['citizenship']);
if (!empty($body['contract_type'])) $lines[] = '📄 Оформление: ' . esc($body['contract_type']);
if (!empty($body['contact_pref'])) $lines[] = '📲 Способ связи: ' . esc($body['contact_pref']);

$text = implode("\n", $lines);

$url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
$payload = [
  'chat_id' => $chatId,
  'text' => $text,
];

$ctx = stream_context_create([
  'http' => [
    'method' => 'POST',
    'header' => 'Content-Type: application/x-www-form-urlencoded',
    'content' => http_build_query($payload),
  ],
]);

$response = @file_get_contents($url, false, $ctx);

if ($response === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Request failed']);
  exit;
}

$result = json_decode($response, true);
if (empty($result['ok'])) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $result['description'] ?? 'Telegram API error']);
  exit;
}

echo json_encode(['ok' => true]);
