(function () {
  function setupContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form || form.getAttribute('data-contact-ready') === 'true') return;
    form.setAttribute('data-contact-ready', 'true');

    if (!window.fetch || !window.FormData) return;

    var submitButton = form.querySelector('[data-contact-submit]');
    var statusBox = document.querySelector('[data-contact-status]');
    var defaultButtonText = submitButton ? submitButton.textContent : '送信する';

    function showStatus(type, message) {
      if (!statusBox) return;
      statusBox.hidden = false;
      statusBox.classList.remove('is-success', 'is-error');
      statusBox.classList.add(type === 'success' ? 'is-success' : 'is-error');
      statusBox.textContent = message;
      statusBox.focus({ preventScroll: true });
      statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function setSubmitting(isSubmitting) {
      if (!submitButton) return;
      submitButton.disabled = isSubmitting;
      submitButton.textContent = isSubmitting ? '送信中…' : defaultButtonText;
    }

    function responseErrorMessage(response, data) {
      if (response.status === 429) {
        return '短時間に送信が集中しています。少し時間を置いてから、もう一度お試しください。';
      }
      if (data && Array.isArray(data.errors) && data.errors.length) {
        var messages = data.errors.map(function (error) { return error && error.message; }).filter(Boolean);
        if (messages.length) return messages.join(' ');
      }
      return '送信できませんでした。入力内容を確認し、時間を置いてからもう一度お試しください。';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submitButton && submitButton.disabled) return;

      if (statusBox) {
        statusBox.hidden = true;
        statusBox.classList.remove('is-success', 'is-error');
        statusBox.textContent = '';
      }

      setSubmitting(true);

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        credentials: 'omit'
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            if (!response.ok) throw { response: response, data: data };
            return data;
          });
        })
        .then(function () {
          form.reset();
          showStatus('success', 'お問い合わせを送信しました。返信先が入力されている場合は、必要に応じてご連絡します。');
        })
        .catch(function (error) {
          var response = error && error.response ? error.response : { status: 0 };
          var data = error && error.data ? error.data : null;
          showStatus('error', responseErrorMessage(response, data));
        })
        .finally(function () {
          setSubmitting(false);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContactForm);
  } else {
    setupContactForm();
  }
})();
