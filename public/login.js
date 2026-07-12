'use strict';

const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('accessPassword');
const passwordToggle = document.getElementById('passwordToggle');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginError = document.getElementById('loginError');

initialize();

function initialize() {
  refreshIcons();
  passwordToggle.addEventListener('click', togglePassword);
  loginForm.addEventListener('submit', submitLogin);
}

async function submitLogin(event) {
  event.preventDefault();

  if (loginBtn.disabled) {
    return;
  }

  setError('');
  setSubmitting(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value })
    });
    let result;

    try {
      result = await response.json();
    } catch (error) {
      throw new Error('登录服务返回了无法识别的响应');
    }

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || '验证失败，请稍后重试');
    }

    window.location.replace(getSafeNextPath());
  } catch (error) {
    setError(error.message || '网络错误，请稍后重试');
    passwordInput.focus({ preventScroll: true });
    passwordInput.select();
  } finally {
    setSubmitting(false);
  }
}

function togglePassword() {
  const visible = passwordInput.type === 'text';
  passwordInput.type = visible ? 'password' : 'text';
  passwordToggle.setAttribute('aria-label', visible ? '显示密码' : '隐藏密码');
  passwordToggle.setAttribute('aria-pressed', String(!visible));
  passwordToggle.title = visible ? '显示密码' : '隐藏密码';
  setButtonIcon(passwordToggle, visible ? 'eye' : 'eye-off');
  passwordInput.focus({ preventScroll: true });
}

function setSubmitting(active) {
  loginForm.setAttribute('aria-busy', String(active));
  loginBtn.disabled = active;
  passwordToggle.disabled = active;
  loginBtnText.textContent = active ? '正在验证' : '进入系统';
  loginBtn.querySelector('.button-spinner').hidden = !active;

  const loginIcon = loginBtn.querySelector('svg');
  if (loginIcon) {
    loginIcon.hidden = active;
  }
}

function setError(message) {
  loginError.textContent = message;
  loginError.hidden = !message;
  passwordInput.setAttribute('aria-invalid', String(Boolean(message)));
}

function getSafeNextPath() {
  const next = new URLSearchParams(window.location.search).get('next');

  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/';
  }

  const candidate = new URL(next, window.location.origin);

  if (candidate.origin !== window.location.origin) {
    return '/';
  }

  const normalized = candidate.pathname.toLowerCase();

  if (normalized === '/login' || normalized === '/login.html' || normalized.startsWith('/login/')) {
    return '/';
  }

  return candidate.href;
}

function setButtonIcon(button, iconName) {
  const icon = button.querySelector('[data-lucide]');

  if (icon) {
    icon.setAttribute('data-lucide', iconName);
    refreshIcons();
  }
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}
