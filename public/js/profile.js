requireLogin();

const $ = id => document.getElementById(id);

async function loadProfile() {
  try {
    const user = await api('/api/auth/me');

    const firstName = user.first_name || '';
    const lastName = user.last_name || '';

    const fullName =
      `${firstName} ${lastName}`.trim() || 'User';

    const initials =
      `${firstName.charAt(0)}${lastName.charAt(0)}`
        .toUpperCase() || 'U';

    $('profile-initials').textContent = initials;
    $('profile-fullname').textContent = fullName;

    $('profile-email').textContent =
      user.email || '—';

    $('profile-role').textContent =
      user.role || '—';

    $('profile-firstname').textContent =
      firstName || '—';

    $('profile-lastname').textContent =
      lastName || '—';

    $('profile-email-detail').textContent =
      user.email || '—';

    $('profile-role-detail').textContent =
      user.role || '—';

    $('profile-status').textContent =
      user.status || '—';

    $('profile-created').textContent =
      user.created_at
        ? new Date(user.created_at)
            .toLocaleDateString()
        : '—';

  } catch (error) {
    $('profile-fullname').textContent =
      'Unable to load profile';

    $('profile-email').textContent =
      error.message;
  }
}

loadProfile();