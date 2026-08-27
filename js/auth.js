const Auth = {
    user: null,

    getToken() { return localStorage.getItem('auth_token'); },

    authHeaders() {
        const t = this.getToken();
        return t ? { 'Authorization': 'Bearer ' + t } : {};
    },

    async init() {
        const token = this.getToken();
        if (token) {
            try {
                const res = await fetch('/api/auth/me', { headers: this.authHeaders() });
                if (res.ok) this.user = await res.json();
                else localStorage.removeItem('auth_token');
            } catch (e) { localStorage.removeItem('auth_token'); }
        }
        this.updateNavButton();
    },

    openModal() {
        const m = document.getElementById('authModal');
        const ct = document.getElementById('authModalContent');
        if (!m || !ct) return;

        if (this.user) {
            ct.innerHTML = `
                <div class="text-center pt-4">
                    <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold mx-auto mb-3">${this.escapeHtml((this.user.display_name || this.user.username)[0]?.toUpperCase() || '?')}</div>
                    <h3 class="text-lg font-bold text-emerald-900">${this.escapeHtml(this.user.display_name || this.user.username)}</h3>
                    <p class="text-sm text-emerald-600/50 mb-1">@${this.escapeHtml(this.user.username)}</p>
                    ${this.user.is_admin ? '<span class="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium mb-3">Admin</span>' : ''}
                    <div class="mt-4 pt-4 border-t border-emerald-100">
                        <button onclick="Auth._modalLogout()" class="w-full px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">Sign Out</button>
                    </div>
                </div>`;
        } else {
            ct.innerHTML = `
                <div class="text-center mb-4 pt-2">
                    <h3 class="text-lg font-bold text-emerald-900">Welcome</h3>
                    <p class="text-sm text-emerald-600/50">Sign in to leave comments on the blog</p>
                </div>
                <div id="authModal_form"></div>`;
            this.renderInlineForm('authModal_form', () => {
                this.closeModal();
                this.updateNavButton();
            });
        }

        m.classList.remove('hidden');
        m.classList.add('flex');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        const m = document.getElementById('authModal');
        if (!m) return;
        m.classList.add('hidden');
        m.classList.remove('flex');
        document.body.style.overflow = '';
    },

    updateNavButton() {
        const btn = document.getElementById('navAuthBtn');
        if (!btn) return;
        if (this.user) {
            const initial = (this.user.display_name || this.user.username)[0]?.toUpperCase() || '?';
            btn.innerHTML = `<span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">${initial}</span>`;
            btn.title = this.user.display_name || this.user.username;
        } else {
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="user" aria-hidden="true" class="lucide lucide-user w-5 h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
            btn.title = 'Sign In';
        }
    },

    async _modalLogout() {
        await this.logout();
        this.closeModal();
        this.updateNavButton();
    },

    async signup(username, email, password, displayName) {
        const res = await fetch('/api/auth/signup', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, display_name: displayName })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            this.user = data.user;
        }
        return data;
    },

    async login(usernameOrEmail, password) {
        const res = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameOrEmail, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            this.user = data.user;
        }
        return data;
    },

    async logout() {
        try { await fetch('/api/auth/logout', { method: 'POST', headers: this.authHeaders() }); } catch (e) {}
        localStorage.removeItem('auth_token');
        this.user = null;
    },

    renderInlineForm(containerId, onAuthSuccess) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (this.user) {
            el.innerHTML = `
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">${this.user.display_name?.[0]?.toUpperCase() || '?'}</div>
                    <span class="text-sm font-medium text-emerald-900">${this.escapeHtml(this.user.display_name || this.user.username)}</span>
                    ${this.user.is_admin ? '<span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Admin</span>' : ''}
                    <button onclick="Auth._doLogout('${containerId}', ${onAuthSuccess})" class="ml-auto text-xs text-emerald-600/50 hover:text-red-500 transition-colors">Logout</button>
                </div>`;
            return;
        }

        el.innerHTML = `
        <div class="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <div class="flex mb-3 border-b border-emerald-100">
                <button id="${containerId}_tabLogin" onclick="Auth._switchTab('${containerId}','login')" class="px-4 py-2 text-sm font-medium text-emerald-700 border-b-2 border-emerald-600">Log In</button>
                <button id="${containerId}_tabSignup" onclick="Auth._switchTab('${containerId}','signup')" class="px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-600 border-b-2 border-transparent">Sign Up</button>
            </div>
            <div id="${containerId}_formLogin">
                <input id="${containerId}_loginUser" type="text" placeholder="Username or email" class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 mb-2">
                <input id="${containerId}_loginPw" type="password" placeholder="Password" class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 mb-2">
                <div class="flex justify-between items-center">
                    <p id="${containerId}_loginErr" class="text-red-500 text-xs hidden"></p>
                    <button onclick="Auth._doLogin('${containerId}', ${onAuthSuccess})" id="${containerId}_loginBtn" class="ml-auto px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">Log In</button>
                </div>
            </div>
            <div id="${containerId}_formSignup" class="hidden">
                <input id="${containerId}_signUser" type="text" placeholder="Username (3-30 chars)" class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 mb-2">
                <input id="${containerId}_signEmail" type="email" placeholder="Email" class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 mb-2">
                <input id="${containerId}_signName" type="text" placeholder="Display name (optional)" class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 mb-2">
                <input id="${containerId}_signPw" type="password" placeholder="Password (min 6 chars)" class="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white text-emerald-900 outline-none focus:border-emerald-500 mb-2">
                <div class="flex justify-between items-center">
                    <p id="${containerId}_signErr" class="text-red-500 text-xs hidden"></p>
                    <button onclick="Auth._doSignup('${containerId}', ${onAuthSuccess})" id="${containerId}_signBtn" class="ml-auto px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">Sign Up</button>
                </div>
            </div>
        </div>`;
    },

    _switchTab(containerId, tab) {
        const loginTab = document.getElementById(containerId + '_tabLogin');
        const signTab = document.getElementById(containerId + '_tabSignup');
        const loginForm = document.getElementById(containerId + '_formLogin');
        const signForm = document.getElementById(containerId + '_formSignup');
        if (tab === 'login') {
            loginTab.className = 'px-4 py-2 text-sm font-medium text-emerald-700 border-b-2 border-emerald-600';
            signTab.className = 'px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-600 border-b-2 border-transparent';
            loginForm.classList.remove('hidden'); signForm.classList.add('hidden');
        } else {
            signTab.className = 'px-4 py-2 text-sm font-medium text-emerald-700 border-b-2 border-emerald-600';
            loginTab.className = 'px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-600 border-b-2 border-transparent';
            signForm.classList.remove('hidden'); loginForm.classList.add('hidden');
        }
    },

    async _doLogin(cid, cb) {
        const user = document.getElementById(cid + '_loginUser').value.trim();
        const pw = document.getElementById(cid + '_loginPw').value;
        const err = document.getElementById(cid + '_loginErr');
        if (!user || !pw) { err.textContent = 'Fill in all fields'; err.classList.remove('hidden'); return; }
        const btn = document.getElementById(cid + '_loginBtn');
        btn.disabled = true; btn.textContent = '...';
        const data = await this.login(user, pw);
        btn.disabled = false; btn.textContent = 'Log In';
        if (data.success) { this.renderInlineForm(cid, cb); if (cb) cb(); }
        else { err.textContent = data.error || 'Login failed'; err.classList.remove('hidden'); }
    },

    async _doSignup(cid, cb) {
        const username = document.getElementById(cid + '_signUser').value.trim();
        const email = document.getElementById(cid + '_signEmail').value.trim();
        const name = document.getElementById(cid + '_signName').value.trim();
        const pw = document.getElementById(cid + '_signPw').value;
        const err = document.getElementById(cid + '_signErr');
        if (!username || !email || !pw) { err.textContent = 'Fill in required fields'; err.classList.remove('hidden'); return; }
        const btn = document.getElementById(cid + '_signBtn');
        btn.disabled = true; btn.textContent = '...';
        const data = await this.signup(username, email, pw, name);
        btn.disabled = false; btn.textContent = 'Sign Up';
        if (data.success) { this.renderInlineForm(cid, cb); if (cb) cb(); }
        else { err.textContent = data.error || 'Signup failed'; err.classList.remove('hidden'); }
    },

    async _doLogout(cid, cb) {
        await this.logout();
        this.renderInlineForm(cid, cb);
        if (cb) cb();
    },

    escapeHtml(str) {
        const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
    }
};
