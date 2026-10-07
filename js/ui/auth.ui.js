/* DAV Service — authentication UI */
loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const { error } = await signIn(email, password);

    if (error) {
        loginError.textContent = 'Ошибка входа: ' + error.message;
        return;
    }

    await showApplication();
});

async function showApplication() {
    loginScreen.style.display = 'none';
    app.style.display = 'block';
    await loadUser();
    await loadRepairs();
}

async function loadUser() {
    const { user } = await getCurrentUser();
    if (!user) return;

    const { data: profile, error } = await getUserProfile(user.id);

    document.getElementById('userInfo').textContent = error
        ? user.email
        : ((profile.full_name || user.email) + ' • ' + profile.role);
}

async function checkSession() {
    const { data: { session } } = await getCurrentSession();
    if (session) await showApplication();
}

document.getElementById('logoutButton').addEventListener('click', async function() {
    await signOut();
    app.style.display = 'none';
    loginScreen.style.display = 'flex';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});
