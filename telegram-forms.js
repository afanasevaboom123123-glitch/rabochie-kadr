/**
 * Отправка заявок в Telegram.
 * Укажите URL вашего API в window.TELEGRAM_API_URL (по умолчанию /api/send-to-telegram или send-telegram.php).
 */
(function () {
  var API_URL = window.TELEGRAM_API_URL || '/api/send-to-telegram';

  function showMessage(msg, isError) {
    if (typeof alert === 'function') alert(msg);
    else console.log(isError ? 'Error: ' : '', msg);
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

  // Квиз: форма в конце квиза (шаг 5)
  var quizForm = document.getElementById('quiz-form');
  if (quizForm) {
    quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
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
    });
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
