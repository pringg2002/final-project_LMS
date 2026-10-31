if (getToken()) window.location.href = 'dashboard.html';

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const msg = document.getElementById('msg');

function toggleMode(showRegister) {
  loginForm.hidden = showRegister;
  registerForm.hidden = !showRegister;
  msg.className = 'msg';
}
document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); toggleMode(true); });
document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); toggleMode(false); });

async function submitAuth(form, path, payload) {
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const { token, user } = await api(path, { method: 'POST', body: payload });
    saveSession(token, user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showMessage(msg, err.message);
    btn.disabled = false;
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitAuth(loginForm, '/api/auth/login', {
    email: loginForm.email.value,
    password: loginForm.password.value,
  });
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitAuth(registerForm, '/api/auth/register', {
    first_name: registerForm.first_name.value,
    last_name: registerForm.last_name.value,
    email: registerForm.email.value,
    password: registerForm.password.value,
  });
});
