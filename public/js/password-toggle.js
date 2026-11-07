(() => {
  const EYE = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const EYE_OFF = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18"/>
      <path d="M10.6 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.1 3.8"/>
      <path d="M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.4 4.1-1"/>
      <path d="M10 10a3 3 0 0 0 4 4"/>
    </svg>
  `;

  function setup(input) {
    if (input.dataset.eyeReady) return;

    const parent = input.closest(
      '.password-wrapper, .password-input-wrap'
    );

    let button = parent?.querySelector(
      '.toggle-password, .password-toggle'
    );

    if (!button) {
      const wrap = document.createElement('div');
      wrap.className = 'password-input-wrap';

      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      button = document.createElement('button');
      button.className = 'password-toggle';
      button.type = 'button';

      wrap.appendChild(button);
    }

    button.type = 'button';
    input.dataset.eyeReady = '1';

    const render = () => {
      const shown = input.type === 'text';

      button.innerHTML = shown ? EYE_OFF : EYE;

      button.setAttribute(
        'aria-label',
        shown ? 'Hide password' : 'Show password'
      );

      button.setAttribute(
        'aria-pressed',
        String(shown)
      );

      button.title = shown
        ? 'Hide password'
        : 'Show password';
    };

    render();

    button.addEventListener('click', () => {
      input.type = input.type === 'password'
        ? 'text'
        : 'password';

      render();
    });
  }

  function scan() {
    document.querySelectorAll(
      'input[type="password"], input[data-eye-ready="1"]'
    ).forEach(setup);
  }

  function start() {
    scan();

    new MutationObserver(scan).observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      start
    );
  } else {
    start();
  }
})();