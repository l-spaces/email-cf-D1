'use strict';

let emails = [];
let currentEditId = null;
let pendingDeleteId = null;
let searchQuery = '';
let isLoading = false;

const revealedPasswords = new Set();

const emailDialog = document.getElementById('emailDialog');
const deleteDialog = document.getElementById('deleteDialog');
const addBtn = document.getElementById('addBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchInput = document.getElementById('searchInput');
const emailForm = document.getElementById('emailForm');
const tableBody = document.getElementById('emailTableBody');
const tableFrame = document.getElementById('tableFrame');
const resultSummary = document.getElementById('resultSummary');
const syncStatus = document.getElementById('syncStatus');
const syncStatusText = document.getElementById('syncStatusText');
const modalMode = document.getElementById('modalMode');
const modalTitle = document.getElementById('modalTitle');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const descriptionInput = document.getElementById('description');
const formPasswordToggle = document.getElementById('formPasswordToggle');
const formError = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');
const submitLabel = document.getElementById('submitLabel');
const cancelBtn = document.getElementById('cancelBtn');
const closeDialogBtn = document.getElementById('closeDialogBtn');
const deleteEmailLabel = document.getElementById('deleteEmail');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteDialogBtn = document.getElementById('closeDeleteDialogBtn');
const toastContainer = document.getElementById('toastContainer');

initialize();

function initialize() {
  refreshIcons();

  addBtn.addEventListener('click', () => openEditor());
  logoutBtn.addEventListener('click', logout);
  refreshBtn.addEventListener('click', () => loadEmails({ announce: true }));
  clearSearchBtn.addEventListener('click', () => clearSearch());
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('keydown', handleSearchKeydown);
  tableBody.addEventListener('click', handleTableAction);

  closeDialogBtn.addEventListener('click', () => closeDialog(emailDialog));
  cancelBtn.addEventListener('click', () => closeDialog(emailDialog));
  formPasswordToggle.addEventListener('click', toggleFormPassword);
  emailForm.addEventListener('submit', submitEmailForm);

  closeDeleteDialogBtn.addEventListener('click', () => closeDialog(deleteDialog));
  cancelDeleteBtn.addEventListener('click', () => closeDialog(deleteDialog));
  confirmDeleteBtn.addEventListener('click', confirmDelete);

  bindDialogBehavior(emailDialog, resetEditor);
  bindDialogBehavior(deleteDialog, resetDeleteDialog);

  loadEmails();
}

async function loadEmails({ announce = false } = {}) {
  if (isLoading) {
    return;
  }

  isLoading = true;
  refreshBtn.disabled = true;
  refreshBtn.classList.add('is-loading');
  tableFrame.setAttribute('aria-busy', 'true');
  setSyncStatus('正在同步', 'syncing');

  if (emails.length === 0) {
    renderLoadingState();
  }

  try {
    const result = await requestJson('/api/emails');
    emails = normalizeEmails(result.data);
    removeMissingRevealedPasswords();
    renderTable();
    setSyncStatus('已同步', 'ready');

    if (announce) {
      showToast('账号列表已刷新', 'info');
    }
  } catch (error) {
    renderErrorState();
    setSyncStatus('连接失败', 'error');

    if (announce) {
      showToast(error.message || '刷新失败', 'error');
    }
  } finally {
    isLoading = false;
    refreshBtn.disabled = false;
    refreshBtn.classList.remove('is-loading');
    tableFrame.setAttribute('aria-busy', 'false');
  }
}

function normalizeEmails(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((record) => ({
      id: Number(record.id),
      email: String(record.email ?? ''),
      password: String(record.password ?? ''),
      description: String(record.description ?? ''),
      createdAt: String(record.created_at ?? '')
    }))
    .filter((record) => Number.isSafeInteger(record.id) && record.id > 0);
}

function getFilteredEmails() {
  const query = searchQuery.trim().toLocaleLowerCase('zh-CN');

  if (!query) {
    return emails;
  }

  return emails.filter((record) => {
    const searchable = `${record.email} ${record.description} ${record.id}`.toLocaleLowerCase('zh-CN');
    return searchable.includes(query);
  });
}

function renderTable() {
  const filteredEmails = getFilteredEmails();
  updateResultSummary(filteredEmails.length);

  if (emails.length === 0) {
    renderEmptyState();
    return;
  }

  if (filteredEmails.length === 0) {
    renderNoResultsState();
    return;
  }

  tableBody.innerHTML = filteredEmails.map((record) => renderEmailRow(record)).join('');
  refreshIcons();
}

function renderEmailRow(record) {
  const isRevealed = revealedPasswords.has(record.id);
  const safeEmail = escapeHtml(record.email);
  const emailLabel = escapeAttribute(record.email);
  const password = isRevealed ? escapeHtml(record.password) : '••••••••••';
  const note = record.description ? escapeHtml(record.description) : '未添加备注';
  const domain = escapeHtml(getEmailDomain(record.email));
  const avatar = escapeHtml(getAvatarText(record.email));
  const tone = getAvatarTone(record.email);
  const formattedDate = escapeHtml(formatDate(record.createdAt));

  return `
    <tr class="account-row">
      <td class="account-column" data-label="邮箱账号">
        <div class="account-cell">
          <span class="account-avatar avatar-tone-${tone}" aria-hidden="true">${avatar}</span>
          <div class="account-details">
            <span class="account-email">${safeEmail}</span>
            <span class="account-meta">
              <span>#${record.id}</span>
              <span aria-hidden="true">·</span>
              <span>${domain}</span>
            </span>
          </div>
        </div>
      </td>
      <td class="password-column" data-label="密码">
        <div class="password-cell">
          <code class="password-value${isRevealed ? '' : ' is-masked'}">${password}</code>
          <button
            class="cell-action"
            type="button"
            data-action="toggle-password"
            data-id="${record.id}"
            aria-label="${isRevealed ? '隐藏' : '显示'} ${emailLabel} 的密码"
            title="${isRevealed ? '隐藏密码' : '显示密码'}"
          >
            <i data-lucide="${isRevealed ? 'eye-off' : 'eye'}" aria-hidden="true"></i>
          </button>
          <button
            class="cell-action"
            type="button"
            data-action="copy-password"
            data-id="${record.id}"
            aria-label="复制 ${emailLabel} 的密码"
            title="复制密码"
          >
            <i data-lucide="copy" aria-hidden="true"></i>
          </button>
        </div>
      </td>
      <td class="note-column" data-label="备注">
        <span class="note-text${record.description ? '' : ' is-empty'}">${note}</span>
      </td>
      <td class="date-column" data-label="创建时间">
        <span class="created-time">${formattedDate}</span>
      </td>
      <td class="actions-column" data-label="操作">
        <div class="row-actions">
          <button
            class="icon-btn row-action"
            type="button"
            data-action="edit"
            data-id="${record.id}"
            aria-label="编辑 ${emailLabel}"
            title="编辑"
          >
            <i data-lucide="pencil" aria-hidden="true"></i>
            <span class="action-label">编辑</span>
          </button>
          <button
            class="icon-btn row-action delete-action"
            type="button"
            data-action="delete"
            data-id="${record.id}"
            aria-label="删除 ${emailLabel}"
            title="删除"
          >
            <i data-lucide="trash-2" aria-hidden="true"></i>
            <span class="action-label">删除</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderLoadingState() {
  resultSummary.textContent = '正在载入账号';
  tableBody.innerHTML = `
    <tr class="status-row">
      <td colspan="5">
        <div class="loading-state" role="status">
          <span class="spinner" aria-hidden="true"></span>
          <span>正在加载账号</span>
        </div>
      </td>
    </tr>
  `;
}

function renderEmptyState() {
  tableBody.innerHTML = `
    <tr class="status-row">
      <td colspan="5">
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true"><i data-lucide="inbox"></i></span>
          <h3>暂无邮箱账号</h3>
          <p>添加第一条账号记录。</p>
          <button class="btn btn-primary" type="button" data-action="add">
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>添加邮箱</span>
          </button>
        </div>
      </td>
    </tr>
  `;
  refreshIcons();
}

function renderNoResultsState() {
  tableBody.innerHTML = `
    <tr class="status-row">
      <td colspan="5">
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true"><i data-lucide="search-x"></i></span>
          <h3>没有匹配的账号</h3>
          <p>当前搜索没有结果。</p>
          <button class="btn btn-secondary" type="button" data-action="clear-search">清空搜索</button>
        </div>
      </td>
    </tr>
  `;
  refreshIcons();
}

function renderErrorState() {
  resultSummary.textContent = '账号加载失败';
  tableBody.innerHTML = `
    <tr class="status-row">
      <td colspan="5">
        <div class="error-state" role="alert">
          <span class="error-icon" aria-hidden="true"><i data-lucide="triangle-alert"></i></span>
          <h3>无法加载账号</h3>
          <p>请检查网络连接后重试。</p>
          <button class="btn btn-secondary" type="button" data-action="retry">
            <i data-lucide="refresh-cw" aria-hidden="true"></i>
            <span>重新加载</span>
          </button>
        </div>
      </td>
    </tr>
  `;
  refreshIcons();
}

function updateResultSummary(filteredCount) {
  if (searchQuery.trim()) {
    resultSummary.textContent = `${filteredCount} 个匹配结果，共 ${emails.length} 个账号`;
    return;
  }

  resultSummary.textContent = `共 ${emails.length} 个账号`;
}

function handleSearch(event) {
  searchQuery = event.target.value;
  clearSearchBtn.hidden = searchQuery.length === 0;
  renderTable();
}

function handleSearchKeydown(event) {
  if (event.key === 'Escape' && searchInput.value) {
    event.preventDefault();
    clearSearch();
  }
}

function clearSearch({ focus = true } = {}) {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.hidden = true;
  renderTable();

  if (focus) {
    searchInput.focus();
  }
}

function handleTableAction(event) {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest('button[data-action]');

  if (!button || !tableBody.contains(button)) {
    return;
  }

  const action = button.dataset.action;

  if (action === 'add') {
    openEditor();
    return;
  }

  if (action === 'clear-search') {
    clearSearch();
    return;
  }

  if (action === 'retry') {
    loadEmails({ announce: true });
    return;
  }

  const id = Number(button.dataset.id);
  const record = emails.find((item) => item.id === id);

  if (!record) {
    showToast('未找到该账号，请刷新后重试', 'error');
    return;
  }

  if (action === 'edit') {
    openEditor(record);
  } else if (action === 'delete') {
    openDeleteDialog(record);
  } else if (action === 'toggle-password') {
    toggleRowPassword(id);
  } else if (action === 'copy-password') {
    copyPassword(record);
  }
}

function openEditor(record = null) {
  emailForm.reset();
  setFormError('');
  passwordInput.type = 'password';
  updatePasswordToggle(false);

  if (record) {
    currentEditId = record.id;
    modalMode.textContent = '编辑账号';
    modalTitle.textContent = '编辑邮箱';
    submitLabel.textContent = '更新账号';
    emailInput.value = record.email;
    passwordInput.value = record.password;
    descriptionInput.value = record.description;
  } else {
    currentEditId = null;
    modalMode.textContent = '新账号';
    modalTitle.textContent = '添加邮箱';
    submitLabel.textContent = '保存账号';
  }

  showDialog(emailDialog, emailInput);
}

async function submitEmailForm(event) {
  event.preventDefault();

  if (submitBtn.disabled) {
    return;
  }

  const isEditing = currentEditId !== null;
  const editId = currentEditId;
  const data = {
    email: emailInput.value.trim(),
    password: passwordInput.value,
    description: descriptionInput.value.trim()
  };

  setFormSubmitting(true);
  setFormError('');

  try {
    await requestJson(isEditing ? `/api/emails/${editId}` : '/api/emails', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    setFormSubmitting(false);
    closeDialog(emailDialog);
    showToast(isEditing ? '账号已更新' : '账号已添加', 'success');
    await loadEmails();
  } catch (error) {
    setFormError(error.message || '保存失败，请稍后重试');
  } finally {
    setFormSubmitting(false);
  }
}

function setFormSubmitting(active) {
  emailForm.setAttribute('aria-busy', String(active));
  submitBtn.disabled = active;
  cancelBtn.disabled = active;
  closeDialogBtn.disabled = active;
  submitBtn.querySelector('.button-spinner').hidden = !active;

  const saveIcon = submitBtn.querySelector('svg');
  if (saveIcon) {
    saveIcon.hidden = active;
  }
}

function setFormError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function resetEditor() {
  currentEditId = null;
  emailForm.reset();
  setFormError('');
  setFormSubmitting(false);
  passwordInput.type = 'password';
  updatePasswordToggle(false);
}

function toggleFormPassword() {
  const isVisible = passwordInput.type === 'text';
  passwordInput.type = isVisible ? 'password' : 'text';
  updatePasswordToggle(!isVisible);
  passwordInput.focus({ preventScroll: true });
}

function updatePasswordToggle(isVisible) {
  formPasswordToggle.setAttribute('aria-label', isVisible ? '隐藏密码' : '显示密码');
  formPasswordToggle.title = isVisible ? '隐藏密码' : '显示密码';
  setButtonIcon(formPasswordToggle, isVisible ? 'eye-off' : 'eye');
}

function toggleRowPassword(id) {
  if (revealedPasswords.has(id)) {
    revealedPasswords.delete(id);
  } else {
    revealedPasswords.add(id);
  }

  renderTable();
}

async function copyPassword(record) {
  try {
    await copyText(record.password);
    showToast(`${record.email} 的密码已复制`, 'success');
  } catch (error) {
    showToast('复制失败，请手动选择密码', 'error');
  }
}

function openDeleteDialog(record) {
  pendingDeleteId = record.id;
  deleteEmailLabel.textContent = record.email;
  showDialog(deleteDialog, cancelDeleteBtn);
}

async function confirmDelete() {
  if (pendingDeleteId === null || confirmDeleteBtn.disabled) {
    return;
  }

  const deleteId = pendingDeleteId;
  const record = emails.find((item) => item.id === deleteId);
  setDeleteSubmitting(true);

  try {
    await requestJson(`/api/emails/${deleteId}`, { method: 'DELETE' });
    emails = emails.filter((item) => item.id !== deleteId);
    revealedPasswords.delete(deleteId);
    setDeleteSubmitting(false);
    closeDialog(deleteDialog);
    renderTable();
    showToast(record ? `${record.email} 已删除` : '账号已删除', 'success');
    await loadEmails();
  } catch (error) {
    showToast(error.message || '删除失败，请稍后重试', 'error');
  } finally {
    setDeleteSubmitting(false);
  }
}

function setDeleteSubmitting(active) {
  deleteDialog.setAttribute('aria-busy', String(active));
  confirmDeleteBtn.disabled = active;
  cancelDeleteBtn.disabled = active;
  closeDeleteDialogBtn.disabled = active;
  confirmDeleteBtn.querySelector('.button-spinner').hidden = !active;

  const deleteIcon = confirmDeleteBtn.querySelector('svg');
  if (deleteIcon) {
    deleteIcon.hidden = active;
  }
}

function resetDeleteDialog() {
  pendingDeleteId = null;
  deleteEmailLabel.textContent = '';
  setDeleteSubmitting(false);
}

function bindDialogBehavior(dialog, reset) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && !isDialogBusy(dialog)) {
      closeDialog(dialog);
    }
  });

  dialog.addEventListener('cancel', (event) => {
    if (isDialogBusy(dialog)) {
      event.preventDefault();
    }
  });

  dialog.addEventListener('close', () => {
    reset();
    syncBodyLock();
    restoreDialogFocus(dialog);
  });
}

function showDialog(dialog, focusTarget) {
  dialog.returnFocus = document.activeElement;

  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }

  syncBodyLock();
  requestAnimationFrame(() => focusTarget?.focus());
}

function closeDialog(dialog) {
  if (!dialog.open || isDialogBusy(dialog)) {
    return;
  }

  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}

function isDialogBusy(dialog) {
  return dialog === emailDialog ? submitBtn.disabled : confirmDeleteBtn.disabled;
}

function syncBodyLock() {
  document.body.classList.toggle('modal-open', emailDialog.open || deleteDialog.open);
}

function restoreDialogFocus(dialog) {
  const focusTarget = dialog.returnFocus;
  dialog.returnFocus = null;

  if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
    requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  let result;

  if (response.status === 401) {
    redirectToLogin();
    throw new Error('登录已过期');
  }

  try {
    result = await response.json();
  } catch (error) {
    throw new Error('服务器返回了无法识别的响应');
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.error || `请求失败 (${response.status})`);
  }

  return result;
}

async function logout() {
  if (logoutBtn.disabled) {
    return;
  }

  logoutBtn.disabled = true;
  logoutBtn.classList.add('is-loading');
  setButtonIcon(logoutBtn, 'loader-circle');

  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('退出失败');
    }

    window.location.replace('/login');
  } catch (error) {
    logoutBtn.disabled = false;
    logoutBtn.classList.remove('is-loading');
    setButtonIcon(logoutBtn, 'log-out');
    showToast('退出失败，请稍后重试', 'error');
  }
}

function redirectToLogin() {
  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('next', `${window.location.pathname}${window.location.search}${window.location.hash}`);
  window.location.replace(`${loginUrl.pathname}${loginUrl.search}`);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard unavailable');
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const iconName = type === 'error' ? 'triangle-alert' : type === 'info' ? 'info' : 'check-circle';
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<i data-lucide="${iconName}"></i>`;

  const text = document.createElement('p');
  text.className = 'toast-message';
  text.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.type = 'button';
  close.setAttribute('aria-label', '关闭通知');
  close.innerHTML = '<i data-lucide="x" aria-hidden="true"></i>';

  toast.append(icon, text, close);
  toastContainer.appendChild(toast);
  refreshIcons();

  const dismiss = () => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 170);
  };

  close.addEventListener('click', dismiss, { once: true });
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(dismiss, type === 'error' ? 5200 : 3400);
}

function setSyncStatus(text, state) {
  syncStatusText.textContent = text;
  syncStatus.classList.toggle('is-syncing', state === 'syncing');
  syncStatus.classList.toggle('is-error', state === 'error');
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

function removeMissingRevealedPasswords() {
  const ids = new Set(emails.map((record) => record.id));
  revealedPasswords.forEach((id) => {
    if (!ids.has(id)) {
      revealedPasswords.delete(id);
    }
  });
}

function getEmailDomain(email) {
  const parts = email.split('@');
  return parts.length > 1 && parts[1] ? parts[1] : '未知域名';
}

function getAvatarText(email) {
  const firstCharacter = Array.from(email.trim())[0];
  return firstCharacter ? firstCharacter.toLocaleUpperCase('zh-CN') : '?';
}

function getAvatarTone(email) {
  const hash = Array.from(email).reduce((total, character) => total + character.codePointAt(0), 0);
  return hash % 4;
}

function formatDate(dateString) {
  if (!dateString) {
    return '—';
  }

  const sqliteTimestamp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  const normalized = sqliteTimestamp.test(dateString) ? `${dateString.replace(' ', 'T')}Z` : dateString;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
