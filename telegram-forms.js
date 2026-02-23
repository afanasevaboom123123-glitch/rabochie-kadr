/**
 * Отправка заявок в Telegram.
 * Укажите URL вашего API в window.TELEGRAM_API_URL (по умолчанию /api/send-to-telegram или send-telegram.php).
 */
(function () {
  var API_URL = window.TELEGRAM_API_URL || (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin + '/.netlify/functions/send-to-telegram' : '/.netlify/functions/send-to-telegram');

  function showMessage(msg, isError) {
    msg = String(msg || '');
    var styleId = 'form-toast-styles';
    if (!document.getElementById(styleId)) {
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = '.form-toast-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}.form-toast-box{background:#fff;border-radius:12px;padding:24px;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.2);text-align:center;}.form-toast-box p{margin:0 0 20px;font-size:1rem;line-height:1.5;color:#1c1917;}.form-toast-box.form-toast-error p{color:#b91c1c;}.form-toast-box button{padding:10px 24px;background:#047857;color:#fff;border:none;border-radius:8px;font-size:0.9375rem;font-weight:600;cursor:pointer;}.form-toast-box button:hover{background:#065f46;}';
      document.head.appendChild(style);
    }
    var overlay = document.createElement('div');
    overlay.className = 'form-toast-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Уведомление');
    var box = document.createElement('div');
    box.className = 'form-toast-box' + (isError ? ' form-toast-error' : '');
    box.innerHTML = '<p>' + msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p><button type="button">OK</button>';
    overlay.appendChild(box);
    function close() {
      overlay.remove();
      overlay = null;
    }
    box.querySelector('button').onclick = close;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
  }

  function sendToTelegram(data, done) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var ok = xhr.status >= 200 && xhr.status < 300;
      var json = null;
      try { json = JSON.parse(xhr.responseText || '{}'); } catch (e) {}
      var err = (json && json.error) || (ok ? null : 'Ошибка отправки (код ' + xhr.status + ')');
      done(ok && !err, err);
    };
    xhr.onerror = function () { done(false, 'Нет связи с сервером. Проверьте интернет и что сайт задеплоен через Git (функции не работают при загрузке папкой).'); };
    xhr.send(JSON.stringify(data));
  }

  // Квиз: форма в конце квиза (шаг 5). Отправка через наш код, не нативная отправка формы.
  function doQuizSubmit() {
    var quizForm = document.getElementById('quiz-form');
    if (!quizForm) return;
    var nameEl = document.getElementById('quiz-name');
    var phoneEl = document.getElementById('quiz-phone');
    var peopleEl = document.getElementById('quiz-people');
    var citizenshipEl = document.getElementById('quiz-citizenship');
    var q2 = document.querySelector('input[name="q2"]:checked');
    var q3 = document.querySelector('input[name="q3"]:checked');
    var name = (nameEl && nameEl.value || '').trim();
    var phone = (phoneEl && phoneEl.value || '').trim();
    if (!name || !phone) {
      showMessage('Укажите имя и телефон.', true);
      return;
    }
    var data = {
      source: 'quiz',
      name: name,
      phone: phone,
      people_count: peopleEl ? (peopleEl.value || '').trim() : '',
      citizenship: citizenshipEl ? citizenshipEl.value : '',
      contract_type: q2 ? q2.value : '',
      contact_pref: q3 ? q3.value : '',
    };
    sendToTelegram(data, function (ok, err) {
      if (ok) {
        showMessage('Заявка отправлена! Мы свяжемся с вами в течение 5 минут.');
        quizForm.reset();
      } else {
        showMessage(err || 'Не удалось отправить. Попробуйте позже.', true);
      }
    });
  }
  var quizForm = document.getElementById('quiz-form');
  if (quizForm) {
    quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();
      doQuizSubmit();
      return false;
    });
    var quizBtn = quizForm.querySelector('button[type="submit"], button.submit');
    if (quizBtn) {
      quizBtn.setAttribute('type', 'button');
      quizBtn.addEventListener('click', function () { doQuizSubmit(); });
    }
  }

  // Онлайн-заявка
  var leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var regionEl = document.getElementById('region');
      var nameEl = document.getElementById('name');
      var phoneEl = document.getElementById('phone');
      var commentEl = document.getElementById('comment');
      var name = (nameEl && nameEl.value || '').trim();
      var phone = (phoneEl && phoneEl.value || '').trim();
      if (!name || !phone) {
        showMessage('Укажите имя и телефон.', true);
        return;
      }
      var data = {
        source: 'online_form',
        name: name,
        phone: phone,
        region: regionEl ? (regionEl.value || '').trim() : '',
        comment: commentEl ? (commentEl.value || '').trim() : '',
      };
      sendToTelegram(data, function (ok, err) {
        if (ok) {
          showMessage('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
          leadForm.reset();
        } else {
          showMessage(err || 'Не удалось отправить. Попробуйте позже.', true);
        }
      });
    });
  }
})();
