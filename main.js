// ============ AUTHENTICATION FUNCTIONS ============

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (data.success && data.logged_in) {
            showLoggedInState(data.username, data.profile);
            return true;
        } else {
            showLoggedOutState();
            return false;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLoggedOutState();
        return false;
    }
}

function showLoggedInState(username, profile) {
    const loggedOutEl = document.getElementById('loggedOutState');
    const loggedInEl = document.getElementById('loggedInState');

    if (loggedOutEl) loggedOutEl.style.display = 'none';
    if (loggedInEl) loggedInEl.style.display = 'flex';

    const sidebarUsername = document.getElementById('sidebarUsername');
    if (sidebarUsername) sidebarUsername.textContent = profile?.name || username;

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (!sidebarAvatar) return;

    if (profile?.photo) {
        sidebarAvatar.src = profile.photo;
    } else {
        sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=fff&size=32`;
    }
}

function showLoggedOutState() {
    const loggedOutEl = document.getElementById('loggedOutState');
    const loggedInEl = document.getElementById('loggedInState');
    if (loggedOutEl) loggedOutEl.style.display = 'flex';
    if (loggedInEl) loggedInEl.style.display = 'none';
}

function closeModal() {
    document.querySelectorAll('.modal.show, .modal[style*="block"], .modal[style*="display: block"], .modal').forEach(() => {});

    const modals = document.querySelectorAll('.modal');
    modals.forEach((m) => {
        // Use inline style toggles because some templates use style="display:none".
        m.style.display = 'none';
    });
}

function showModal(id) {
    closeModal();
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function showToast(message, type = 'success') {
    let toastWrap = document.getElementById('toastWrap');
    if (!toastWrap) {
        toastWrap = document.createElement('div');
        toastWrap.id = 'toastWrap';
        toastWrap.style.position = 'fixed';
        toastWrap.style.right = '18px';
        toastWrap.style.bottom = '18px';
        toastWrap.style.zIndex = '2000';
        toastWrap.style.display = 'grid';
        toastWrap.style.gap = '10px';
        document.body.appendChild(toastWrap);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.minWidth = '260px';
    toast.style.maxWidth = '420px';
    toast.style.padding = '12px 14px';
    toast.style.borderRadius = '10px';
    toast.style.border = '1px solid rgba(148,163,184,0.22)';
    toast.style.background = 'rgba(17,24,39,0.92)';
    toast.style.color = '#f8fafc';
    toast.style.boxShadow = '0 22px 60px rgba(2,6,23,0.38)';
    toast.style.fontWeight = '700';
    toast.style.backdropFilter = 'blur(10px)';

    if (type === 'error') {
        toast.style.borderColor = 'rgba(239,68,68,0.45)';
        toast.style.background = 'rgba(127,29,29,0.26)';
    } else if (type === 'warning') {
        toast.style.borderColor = 'rgba(245,158,11,0.45)';
        toast.style.background = 'rgba(180,83,9,0.20)';
    } else if (type === 'success') {
        toast.style.borderColor = 'rgba(20,184,166,0.45)';
    }

    toastWrap.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 200ms ease';
        toast.style.opacity = '0';
    }, 2600);

    setTimeout(() => {
        toast.remove();
        if (toastWrap && toastWrap.childElementCount === 0) toastWrap.remove();
    }, 2900);
}

function showLoginModal() {
    closeModal();
    const m = document.getElementById('loginModal');
    if (m) m.style.display = 'flex';
    const u = document.getElementById('loginUsername');
    const p = document.getElementById('loginPassword');
    if (u) u.value = '';
    if (p) p.value = '';
}

function showRegisterModal() {
    closeModal();
    const m = document.getElementById('registerModal');
    if (m) m.style.display = 'flex';
    const u = document.getElementById('registerUsername');
    const e = document.getElementById('registerEmail');
    const p = document.getElementById('registerPassword');
    if (u) u.value = '';
    if (e) e.value = '';
    if (p) p.value = '';
}

function switchToLogin() {
    closeModal();
    showLoginModal();
}

function switchToRegister() {
    closeModal();
    showRegisterModal();
}

async function loginUser(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            closeModal();
            showToast('Welcome back, ' + username + '! 🎉', 'success');
            showLoggedInState(username, data.profile);
            await loadProfile();
            await loadSection(currentSection);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

async function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!username || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email })
        });

        const data = await response.json();

        if (data.success) {
            closeModal();
            showToast('Registration successful! Please login 🎉', 'success');
            showLoginModal();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed. Please try again.', 'error');
    }
}

async function logoutUser() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            showToast('Logged out successfully 👋', 'success');
            showLoggedOutState();
            const img = document.getElementById('profileImage');
            const name = document.getElementById('profileName');
            const phone = document.getElementById('profilePhone');
            const email = document.getElementById('profileEmail');
            const addr = document.getElementById('profileAddress');
            if (img) img.src = '';
            if (name) name.value = '';
            if (phone) phone.value = '';
            if (email) email.value = '';
            if (addr) addr.value = '';
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed', 'error');
    }
}

// ============ PROFILE FUNCTIONS ============

function toggleProfile() {
    const loggedInStateEl = document.getElementById('loggedInState');
    const isLoggedIn = loggedInStateEl && loggedInStateEl.style.display === 'flex';

    if (!isLoggedIn) {
        showToast('Please login first', 'warning');
        showLoginModal();
        return;
    }
    loadProfile();
    const m = document.getElementById('profileModal');
    if (m) m.style.display = 'flex';
}

async function loadProfile() {
    try {
        const response = await fetch('/api/profile');
        const data = await response.json();

        if (data.success && data.profile) {
            const profile = data.profile;
            const set = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val ?? '';
            };

            set('profileName', profile.name);
            set('profilePhone', profile.phone);
            set('profileEmail', profile.email);
            set('profileAddress', profile.address);

            const avatar = document.getElementById('profileImage');
            if (!avatar) return;

            if (profile.photo) {
                avatar.src = profile.photo;
            } else {
                const username = (document.getElementById('sidebarUsername')?.textContent || 'User').trim();
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=fff&size=140`;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function saveProfile() {
    const profile = {
        name: document.getElementById('profileName').value,
        phone: document.getElementById('profilePhone').value,
        email: document.getElementById('profileEmail').value,
        address: document.getElementById('profileAddress').value,
        photo: document.getElementById('profileImage').src || ''
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });

        const data = await response.json();
        if (data.success) {
            closeModal();
            showToast('Profile saved successfully! ✅', 'success');

            if (profile.name) {
                const u = document.getElementById('sidebarUsername');
                if (u) u.textContent = profile.name;
            }
            if (profile.photo) {
                const a = document.getElementById('sidebarAvatar');
                if (a) a.src = profile.photo;
            }
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile ❌', 'error');
    }
}

function uploadPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Max 5MB.', 'error');
        return;
    }

    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.getElementById('profileImage');
        if (img) img.src = e.target.result;
        showToast('Photo uploaded successfully! 📸', 'success');
    };
    reader.onerror = function () {
        showToast('Error reading file. Please try again.', 'error');
    };
    reader.readAsDataURL(file);
}

// ============ KNOWLEDGE + UI ============

let currentSection = 'daily';
let autoRotateTimer = null;

// ============ Books Reading / Special Features ============
let readingState = {
    secondsRemaining: 0,
    isRunning: false,
    timer: null
};

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function getTodayKey() {
    const d = new Date();
    return d.toISOString().slice(0,10);
}

function loadReadingProgressLocal() {
    try {
        const raw = localStorage.getItem('readingProgress');
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveReadingProgressLocal(progress) {
    localStorage.setItem('readingProgress', JSON.stringify(progress));
}

function getReadingSessionSecondsDefault() {
    const v = localStorage.getItem('readingSessionSeconds');
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10 * 60;
}

function renderReadingSpecialUI({mode, title}) {
    const grid = document.getElementById('knowledgeDisplay');
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) sectionTitle.textContent = title;
    if (!grid) return;

    grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
                <div>
                    <div style="font-weight:900;font-size:1.1rem;">🔥 Reading Streak</div>
                    <div id="readingStreakVal" style="font-size:2rem;font-weight:900;margin-top:4px;">0</div>
                    <div id="readingTodayVal" style="color:var(--text-secondary);font-weight:700;margin-top:6px;">Today completed: 0</div>
                </div>

                <div style="min-width:260px;">
                    <div style="font-weight:900;margin-bottom:8px;">Reading Timer</div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                        <div id="readingTimerVal" style="font-size:1.6rem;font-weight:900;">${formatTime(getReadingSessionSecondsDefault())}</div>
                        <div style="font-weight:800;color:var(--text-secondary);">set</div>
                    </div>

                    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
                        <button class="btn-refresh" style="background:var(--gradient);border:0;" onclick="startReadingTimer()">
                            <i class="fas fa-play"></i> Start
                        </button>
                        <button class="btn-history" onclick="pauseReadingTimer()">
                            <i class="fas fa-pause"></i> Pause
                        </button>
                        <button class="btn-history" onclick="resetReadingTimer()">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </div>
            </div>

            <div style="margin-top:14px; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
                <label style="font-weight:800;color:var(--text-secondary); display:flex; gap:10px; align-items:center;">
                    <span>Session minutes</span>
                    <input id="readingSessionMinutes" type="number" min="1" max="180" value="${Math.floor(getReadingSessionSecondsDefault()/60)}" style="width:110px;" onchange="updateReadingSessionMinutesFromUI()" />
                </label>
                <button class="btn-refresh" style="background:rgba(20,184,166,0.18);border:1px solid rgba(20,184,166,0.35);" onclick="markReadingDoneFromUI()">
                    <i class="fas fa-check"></i> Mark current as done
                </button>
            </div>
        </div>
        <div id="readingCardsWrap" class="knowledge-grid" style="margin-top:14px;grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));"></div>
    `;

    updateReadingStreakAndTodayUI();
    // Render cards for the selected mode using normal category rendering
    const wrap = document.getElementById('readingCardsWrap');
    const selectedMode = mode;
    if (wrap) {
        wrap.innerHTML = `<div class="empty-state">Loading ${selectedMode.replaceAll('_',' ')}...</div>`;
    }

    // load category like normal
    if (mode === 'books_reading' || mode === 'book_quotes' || mode === 'reading_challenges') {
        displayCategoryKnowledgeInto(mode, wrap);
    }
}

function updateReadingStreakAndTodayUI() {
    const progress = loadReadingProgressLocal();
    const todayKey = getTodayKey();
    const today = progress[todayKey] || { completed: 0 };
    const todayCompleted = today.completed || 0;

    // streak: count consecutive days with completed>0
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 3650; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0,10);
        const val = progress[key];
        const done = val && (val.completed || 0);
        if (done > 0) streak++;
        else break;
    }

    const sEl = document.getElementById('readingStreakVal');
    const tEl = document.getElementById('readingTodayVal');
    if (sEl) sEl.textContent = String(streak);
    if (tEl) tEl.textContent = `Today completed: ${todayCompleted}`;

    const timerVal = document.getElementById('readingTimerVal');
    if (timerVal) timerVal.textContent = formatTime(getReadingSessionSecondsDefault());
}

function startReadingTimer() {
    const minutesEl = document.getElementById('readingSessionMinutes');
    if (minutesEl) {
        const v = Number(minutesEl.value);
        if (Number.isFinite(v) && v > 0) {
            localStorage.setItem('readingSessionSeconds', String(Math.floor(v*60)));
        }
    }

    if (readingState.timer) clearInterval(readingState.timer);
    readingState.secondsRemaining = getReadingSessionSecondsDefault();
    readingState.isRunning = true;

    const timerVal = document.getElementById('readingTimerVal');
    if (timerVal) timerVal.textContent = formatTime(readingState.secondsRemaining);

    readingState.timer = setInterval(() => {
        readingState.secondsRemaining -= 1;
        const tv = document.getElementById('readingTimerVal');
        if (tv) tv.textContent = formatTime(Math.max(0, readingState.secondsRemaining));

        if (readingState.secondsRemaining <= 0) {
            clearInterval(readingState.timer);
            readingState.timer = null;
            readingState.isRunning = false;
            showToast('Time up! Mark done when finished ✅', 'success');
        }
    }, 1000);
}

function pauseReadingTimer() {
    if (readingState.timer) {
        clearInterval(readingState.timer);
        readingState.timer = null;
    }
    readingState.isRunning = false;
}

function resetReadingTimer() {
    if (readingState.timer) clearInterval(readingState.timer);
    readingState.timer = null;
    readingState.isRunning = false;
    readingState.secondsRemaining = getReadingSessionSecondsDefault();
    const tv = document.getElementById('readingTimerVal');
    if (tv) tv.textContent = formatTime(readingState.secondsRemaining);
}

function updateReadingSessionMinutesFromUI() {
    const minutesEl = document.getElementById('readingSessionMinutes');
    if (!minutesEl) return;
    const v = Number(minutesEl.value);
    if (!Number.isFinite(v) || v <= 0) return;
    localStorage.setItem('readingSessionSeconds', String(Math.floor(v*60)));
    const tv = document.getElementById('readingTimerVal');
    if (tv) tv.textContent = formatTime(Math.floor(v*60));
}

function markReadingDoneFromUI() {
    const progress = loadReadingProgressLocal();
    const todayKey = getTodayKey();
    if (!progress[todayKey]) progress[todayKey] = { completed: 0 };
    progress[todayKey].completed = (progress[todayKey].completed || 0) + 1;
    saveReadingProgressLocal(progress);

    updateReadingStreakAndTodayUI();
    showToast('Reading marked as done ✅', 'success');

    // Optionally stop timer
    if (readingState.timer) {
        clearInterval(readingState.timer);
        readingState.timer = null;
    }
    readingState.isRunning = false;
    readingState.secondsRemaining = getReadingSessionSecondsDefault();
    const tv = document.getElementById('readingTimerVal');
    if (tv) tv.textContent = formatTime(readingState.secondsRemaining);
}

async function displayCategoryKnowledgeInto(category, wrapEl) {
    if (!wrapEl) return;

    const res = await fetch(`/api/get_knowledge?category=${encodeURIComponent(category)}`);
    const data = await res.json();

    if (!data.success) {
        wrapEl.innerHTML = `<div class="error-message">${data.message || 'Failed to load knowledge'}</div>`;
        return;
    }

    wrapEl.innerHTML = '';
    if (data.data) {
        // add a mark button on each card
        const card = createKnowledgeCard(data.data);
        const btn = document.createElement('button');
        btn.className = 'btn-history';
        btn.style.marginTop = '10px';
        btn.style.width = '100%';
        btn.innerHTML = `<i class="fas fa-check"></i> Mark done`;
        btn.onclick = () => markReadingDoneFromUI();
        card.appendChild(btn);
        wrapEl.appendChild(card);
    }
}


function setupAutoRotate(enabled, intervalSeconds) {
    if (!enabled) {
        if (autoRotateTimer) clearInterval(autoRotateTimer);
        autoRotateTimer = null;
        return;
    }

    if (autoRotateTimer) clearInterval(autoRotateTimer);
    const ms = Math.max(10, intervalSeconds) * 1000;

    autoRotateTimer = setInterval(() => {
        // Refresh current view
        if (currentSection === 'daily') {
            refreshKnowledge();
        } else {
            loadSection(currentSection);
        }
    }, ms);
}

function createKnowledgeCard(item) {
    const card = document.createElement('div');
    card.className = 'knowledge-card';

    const emoji = item.emoji ? `<div class="card-emoji">${item.emoji}</div>` : '';
    const category = item.category ? `<div class="card-category">${item.category}</div>` : '';

    card.innerHTML = `
        ${emoji}
        ${category}
        <h3>${item.title || 'Untitled'}</h3>
        <p>${item.content || ''}</p>
    `;

    return card;
}

async function displayDailyKnowledge() {
    const grid = document.getElementById('knowledgeDisplay');
    if (!grid) return;

    const title = document.getElementById('sectionTitle');
    if (title) title.textContent = '📚 Daily Knowledge';

    grid.innerHTML = `<div class="empty-state">Loading daily knowledge...</div>`;

    const res = await fetch('/api/get_daily');
    const data = await res.json();

    if (!data.success) {
        grid.innerHTML = `<div class="error-message">${data.message || 'Failed to load daily knowledge'}</div>`;
        return;
    }

    grid.innerHTML = '';
    (data.data || []).forEach((item) => grid.appendChild(createKnowledgeCard(item)));
}

async function displayCategoryKnowledge(category) {
    const grid = document.getElementById('knowledgeDisplay');
    if (!grid) return;

    const title = document.getElementById('sectionTitle');
    if (title) title.textContent = `📚 ${category.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`;

    grid.innerHTML = `<div class="empty-state">Loading ${category}...</div>`;

    const res = await fetch(`/api/get_knowledge?category=${encodeURIComponent(category)}`);
    const data = await res.json();

    if (!data.success) {
        grid.innerHTML = `<div class="error-message">${data.message || 'Failed to load knowledge'}</div>`;
        return;
    }

    grid.innerHTML = '';
    if (data.data) grid.appendChild(createKnowledgeCard(data.data));
}

function activateNav(sectionId) {
    const links = document.querySelectorAll('.nav-links li');
    links.forEach((li) => {
        const id = li.getAttribute('data-section');
        li.classList.toggle('active', id === sectionId);
    });
}

async function loadSection(section) {
    currentSection = section;
    activateNav(section === 'daily' ? 'daily' : section);

    // Special reading UI for book reading features
    if (section === 'books_reading' || section === 'book_quotes' || section === 'reading_challenges') {
        renderReadingSpecialUI({ mode: section, title: `📚 ${section.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}` });
        return;
    }

    if (section === 'daily') {
        await displayDailyKnowledge();
    } else {
        await displayCategoryKnowledge(section);
    }
}


async function refreshKnowledge() {
    // New daily digest
    if (currentSection === 'daily') {
        await loadSection('daily');
    } else {
        await loadSection(currentSection);
    }
    showToast('New knowledge loaded ✅', 'success');
}

async function showHistory() {
    const grid = document.getElementById('historyContent');
    if (!grid) return;

    showModal('historyModal');
    grid.innerHTML = `<div class="empty-state">Loading history...</div>`;

    try {
        const res = await fetch('/api/history');
        const data = await res.json();

        if (!data.success) {
            grid.innerHTML = `<div class="error-message">${data.message || 'Failed to load history'}</div>`;
            return;
        }

        const history = data.history || [];
        if (!history.length) {
            grid.innerHTML = `<div class="empty-state">No history yet.</div>`;
            return;
        }

        grid.innerHTML = '';

        history.forEach((entry) => {
            const wrap = document.createElement('div');
            wrap.className = 'empty-state';
            wrap.style.background = 'rgba(99,102,241,0.08)';

            const items = entry.items || [];
            wrap.innerHTML = `
                <div style="font-weight:800;margin-bottom:6px;">${entry.date}</div>
                <div style="display:grid;gap:10px;">${items.map((it) => `
                    <div>
                        <div style="font-weight:800;color:var(--text-primary);">${it.title}</div>
                        <div style="color:var(--text-secondary);">${it.content}</div>
                    </div>
                `).join('')}</div>
            `;
            grid.appendChild(wrap);
        });
    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div class="error-message">Error loading history</div>`;
    }
}

async function togglePreferences() {
    // Require login to save; but allow viewing.
    // If not logged in, prompt.
    const loggedInStateEl = document.getElementById('loggedInState');
    const isLoggedIn = loggedInStateEl && loggedInStateEl.style.display === 'flex';

    if (!isLoggedIn) {
        showToast('Please login to save preferences', 'warning');
        showLoginModal();
        return;
    }

    showModal('preferencesModal');

    // Load current preferences into UI
    try {
        const res = await fetch('/api/preferences');
        const data = await res.json();
        if (!data.success) return;

        const prefs = data.preferences || {};

        const setCheck = (id, val) => {
            const el = document.querySelector(`input[type="checkbox"][data-category="${id}"]`);
            if (el) el.checked = Boolean(val);
        };

        setCheck('daily_facts', prefs.daily_facts);
        setCheck('life_skills', prefs.life_skills);
        setCheck('career_tips', prefs.career_tips);
        setCheck('money_tips', prefs.money_tips);
        setCheck('health_awareness', prefs.health_awareness);
        setCheck('technology_updates', prefs.technology_updates);

        const auto = document.getElementById('autoRotate');
        if (auto) auto.checked = prefs.auto_rotate !== false;

        const intervalSel = document.getElementById('rotationInterval');
        if (intervalSel) intervalSel.value = String(prefs.rotation_interval || 60);

        // Theme icon/text
        if (prefs.dark_mode === false) {
            document.documentElement.setAttribute('data-theme', 'light');
            const icon = document.getElementById('themeIcon');
            if (icon) icon.className = 'fas fa-sun';
            const t = document.getElementById('themeText');
            if (t) t.textContent = 'Light Mode';
        }
    } catch (e) {
        console.error('Error loading preferences:', e);
    }
}

async function savePreferences() {
    const payload = {
        daily_facts: document.querySelector('input[data-category="daily_facts"]').checked,
        life_skills: document.querySelector('input[data-category="life_skills"]').checked,
        career_tips: document.querySelector('input[data-category="career_tips"]').checked,
        money_tips: document.querySelector('input[data-category="money_tips"]').checked,
        health_awareness: document.querySelector('input[data-category="health_awareness"]').checked,
        technology_updates: document.querySelector('input[data-category="technology_updates"]').checked,
        auto_rotate: Boolean(document.getElementById('autoRotate').checked),
        rotation_interval: Number(document.getElementById('rotationInterval').value || 60),
        // dark_mode is derived from theme toggle
        dark_mode: document.documentElement.getAttribute('data-theme') !== 'light'
    };

    try {
        const res = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            closeModal();
            showToast('Preferences saved ✅', 'success');
            // Apply auto-rotate again
            setupAutoRotate(payload.auto_rotate, payload.rotation_interval);
            // Refresh current view
            await loadSection(currentSection);
        } else {
            showToast(data.message || 'Failed to save preferences', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Failed to save preferences', 'error');
    }
}

function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const nextLight = !isLight;

    document.documentElement.setAttribute('data-theme', nextLight ? 'light' : 'dark');

    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = nextLight ? 'fas fa-sun' : 'fas fa-moon';

    const t = document.getElementById('themeText');
    if (t) t.textContent = nextLight ? 'Light Mode' : 'Dark Mode';

    showToast(nextLight ? 'Switched to Light Mode' : 'Switched to Dark Mode', 'success');
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async () => {
    // Nav click wiring
    document.querySelectorAll('.nav-links li').forEach((li) => {
        li.addEventListener('click', async () => {
            const section = li.getAttribute('data-section');
            await loadSection(section);
        });
    });

    await checkAuthStatus();

    // Load preferences and apply theme/auto-rotate
    try {
        const response = await fetch('/api/preferences');
        const data = await response.json();
        if (data.success) {
            const prefs = data.preferences || {};
            setupAutoRotate(prefs.auto_rotate !== false, prefs.rotation_interval || 60);

            if (prefs.dark_mode === false) {
                document.documentElement.setAttribute('data-theme', 'light');
                const icon = document.getElementById('themeIcon');
                if (icon) icon.className = 'fas fa-sun';
                const t = document.getElementById('themeText');
                if (t) t.textContent = 'Light Mode';
            }
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }

    // Default view
    await loadSection('daily');
});

console.log('🌟 One Minute Knowledge loaded with backend-connected UI!');

