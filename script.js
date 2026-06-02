// script.js - обновлён с функцией сброса показаний

let accounts = [];
let transactions = [];
let editingTransactionId = null;

// DOM элементы
const accountSelect = document.getElementById('accountSelect');
const accountsBalanceDiv = document.getElementById('accountsBalanceList');
const transactionsContainer = document.getElementById('transactionsList');
const amountInput = document.getElementById('amountInput');
const descriptionInput = document.getElementById('descriptionInput');
const addBtn = document.getElementById('addTransactionBtn');
const addAccountBtn = document.getElementById('addAccountBtn');
const newAccountNameInput = document.getElementById('newAccountName');
const incomeTypeBtn = document.getElementById('incomeTypeBtn');
const expenseTypeBtn = document.getElementById('expenseTypeBtn');

// Коммунальные поля
const coldCurrent = document.getElementById('coldWaterCurrent');
const coldPrev = document.getElementById('coldWaterPrev');
const coldTariff = document.getElementById('coldTariff');
const coldResult = document.getElementById('coldResult');
const hotCurrent = document.getElementById('hotWaterCurrent');
const hotPrev = document.getElementById('hotWaterPrev');
const hotTariff = document.getElementById('hotTariff');
const hotResult = document.getElementById('hotResult');
const elecCurrent = document.getElementById('elecCurrent');
const elecPrev = document.getElementById('elecPrev');
const elecTariff = document.getElementById('elecTariff');
const elecResult = document.getElementById('elecResult');
const drainVolume = document.getElementById('drainVolume');
const drainTariff = document.getElementById('drainTariff');
const drainResult = document.getElementById('drainResult');
const totalUtilitiesSpan = document.getElementById('totalUtilitiesAmount');
const addUtilitiesBtn = document.getElementById('addUtilitiesExpenseBtn');
const resetReadingsBtn = document.getElementById('resetReadingsBtn');

let currentType = true;

// ---------- Основные функции ----------
function saveData() {
    localStorage.setItem('fin_accounts', JSON.stringify(accounts));
    localStorage.setItem('fin_transactions', JSON.stringify(transactions));
    saveUtilitiesState(); // Сохраняем показания
}

function loadData() {
    const storedAccounts = localStorage.getItem('fin_accounts');
    const storedTransactions = localStorage.getItem('fin_transactions');
    if (storedAccounts) accounts = JSON.parse(storedAccounts);
    else accounts = [
        { id: 'acc1', name: 'Наличные', balance: 8500 },
        { id: 'acc2', name: 'Дебетовая карта', balance: 12400 }
    ];
    if (storedTransactions) transactions = JSON.parse(storedTransactions);
    else transactions = [
        { id: 't1', type: 'income', amount: 35000, accountId: 'acc2', description: 'Зарплата', dateISO: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 't2', type: 'expense', amount: 520, accountId: 'acc1', description: 'Продукты', dateISO: new Date(Date.now() - 86400000).toISOString() },
        { id: 't3', type: 'expense', amount: 890, accountId: 'acc2', description: 'Кафе', dateISO: new Date().toISOString() }
    ];
    loadUtilitiesState(); // Загружаем сохранённые показания
    recalcAllBalances();
    saveData();
}

// Сохранение показаний счётчиков в localStorage
function saveUtilitiesState() {
    const utilitiesState = {
        coldCurrent: coldCurrent.value,
        coldPrev: coldPrev.value,
        coldTariff: coldTariff.value,
        hotCurrent: hotCurrent.value,
        hotPrev: hotPrev.value,
        hotTariff: hotTariff.value,
        elecCurrent: elecCurrent.value,
        elecPrev: elecPrev.value,
        elecTariff: elecTariff.value,
        drainTariff: drainTariff.value
    };
    localStorage.setItem('utilities_state', JSON.stringify(utilitiesState));
}

function loadUtilitiesState() {
    const saved = localStorage.getItem('utilities_state');
    if (saved) {
        const state = JSON.parse(saved);
        if (state.coldCurrent) coldCurrent.value = state.coldCurrent;
        if (state.coldPrev) coldPrev.value = state.coldPrev;
        if (state.coldTariff) coldTariff.value = state.coldTariff;
        if (state.hotCurrent) hotCurrent.value = state.hotCurrent;
        if (state.hotPrev) hotPrev.value = state.hotPrev;
        if (state.hotTariff) hotTariff.value = state.hotTariff;
        if (state.elecCurrent) elecCurrent.value = state.elecCurrent;
        if (state.elecPrev) elecPrev.value = state.elecPrev;
        if (state.elecTariff) elecTariff.value = state.elecTariff;
        if (state.drainTariff) drainTariff.value = state.drainTariff;
    } else {
        // Значения по умолчанию для демо
        coldCurrent.value = '';
        coldPrev.value = '';
        coldTariff.value = '29.34';
        hotCurrent.value = '';
        hotPrev.value = '';
        hotTariff.value = '30';
        elecCurrent.value = '';
        elecPrev.value = '';
        elecTariff.value = '5.8';
        drainTariff.value = '23.75';
    }
}

// Сброс показаний: текущие показатели становятся предыдущими
function resetReadings() {
    if (confirm('🔄 Сбросить показания?\n\nТекущие показатели станут предыдущими (для следующего месяца).\nПоля ввода текущих показаний очистятся.')) {
        // Холодная вода
        if (coldCurrent.value && !isNaN(parseFloat(coldCurrent.value))) {
            coldPrev.value = coldCurrent.value;
            coldCurrent.value = '';
        }
        // Горячая вода
        if (hotCurrent.value && !isNaN(parseFloat(hotCurrent.value))) {
            hotPrev.value = hotCurrent.value;
            hotCurrent.value = '';
        }
        // Электричество
        if (elecCurrent.value && !isNaN(parseFloat(elecCurrent.value))) {
            elecPrev.value = elecCurrent.value;
            elecCurrent.value = '';
        }

        calculateUtilities();
        saveUtilitiesState();

        // Показываем сообщение об успехе
        const totalSpan = document.getElementById('totalUtilitiesAmount');
        const originalText = totalSpan.innerText;
        totalSpan.style.background = '#dff0e6';
        totalSpan.style.padding = '4px 12px';
        totalSpan.style.borderRadius = '20px';
        setTimeout(() => {
            totalSpan.style.background = '';
            totalSpan.style.padding = '';
        }, 800);

        alert('✅ Показания сброшены!\n\nТеперь предыдущие показатели = бывшие текущие.\nВведите новые текущие показания в следующем месяце.');
    }
}

function recalcAllBalances() {
    const balanceMap = new Map();
    accounts.forEach(acc => balanceMap.set(acc.id, 0));
    transactions.forEach(tx => {
        if (balanceMap.has(tx.accountId)) {
            let bal = balanceMap.get(tx.accountId);
            if (tx.type === 'income') bal += tx.amount;
            else if (tx.type === 'expense') bal -= tx.amount;
            balanceMap.set(tx.accountId, bal);
        }
    });
    accounts.forEach(acc => { acc.balance = balanceMap.get(acc.id) || 0; });
}

function addTransaction(amount, typeStr, accountId, description) {
    if (!accountId || accounts.findIndex(a => a.id === accountId) === -1) return false;
    const newTx = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: typeStr,
        amount: amount,
        accountId: accountId,
        description: description || (typeStr === 'income' ? 'Доход' : 'Расход'),
        dateISO: new Date().toISOString()
    };
    transactions.push(newTx);
    recalcAllBalances();
    saveData();
    refreshUI();
    return true;
}

function updateTransaction(txId, newAmount, newType, newAccountId, newDescription) {
    const txIndex = transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) return false;
    transactions[txIndex] = {
        ...transactions[txIndex],
        amount: newAmount,
        type: newType,
        accountId: newAccountId,
        description: newDescription || (newType === 'income' ? 'Доход' : 'Расход')
    };
    recalcAllBalances();
    saveData();
    refreshUI();
    return true;
}

function deleteTransactionById(transId) {
    if (confirm('Удалить эту операцию?')) {
        const idx = transactions.findIndex(t => t.id === transId);
        if (idx !== -1) transactions.splice(idx, 1);
        recalcAllBalances();
        saveData();
        refreshUI();
    }
}

function deleteAccountById(accountId) {
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) return;
    const accountName = accounts[accountIndex].name;
    const txCount = transactions.filter(tx => tx.accountId === accountId).length;
    if (confirm(`Удалить счёт "${accountName}"? ${txCount > 0 ? `\nПо нему есть ${txCount} операций. Они останутся в истории.` : ''}`)) {
        accounts.splice(accountIndex, 1);
        recalcAllBalances();
        saveData();
        refreshUI();
    }
}

function addNewAccount() {
    let newName = newAccountNameInput.value.trim();
    if (!newName) { alert('Введите название счёта'); return; }
    const newId = 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    accounts.push({ id: newId, name: newName, balance: 0 });
    saveData();
    refreshUI();
    newAccountNameInput.value = '';
}

// ---------- Расчёт коммуналки ----------
function calculateUtilities() {
    let coldCurr = parseFloat(coldCurrent.value) || 0;
    let coldPrevVal = parseFloat(coldPrev.value) || 0;
    let coldTariffVal = parseFloat(coldTariff.value) || 0;
    let coldDiff = Math.max(0, coldCurr - coldPrevVal);
    let coldSum = coldDiff * coldTariffVal;
    coldResult.innerText = coldSum.toFixed(2) + ' ₽';

    let hotCurr = parseFloat(hotCurrent.value) || 0;
    let hotPrevVal = parseFloat(hotPrev.value) || 0;
    let hotTariffVal = parseFloat(hotTariff.value) || 0;
    let hotDiff = Math.max(0, hotCurr - hotPrevVal);
    let hotSum = hotDiff * hotTariffVal;
    hotResult.innerText = hotSum.toFixed(2) + ' ₽';

    let elecCurr = parseFloat(elecCurrent.value) || 0;
    let elecPrevVal = parseFloat(elecPrev.value) || 0;
    let elecTariffVal = parseFloat(elecTariff.value) || 0;
    let elecDiff = Math.max(0, elecCurr - elecPrevVal);
    let elecSum = elecDiff * elecTariffVal;
    elecResult.innerText = elecSum.toFixed(2) + ' ₽';

    let drainVolumeVal = coldDiff + hotDiff;
    drainVolume.value = drainVolumeVal.toFixed(2);
    let drainTariffVal = parseFloat(drainTariff.value) || 0;
    let drainSum = drainVolumeVal * drainTariffVal;
    drainResult.innerText = drainSum.toFixed(2) + ' ₽';

    let total = coldSum + hotSum + elecSum + drainSum;
    totalUtilitiesSpan.innerText = total.toFixed(2) + ' ₽';
    saveUtilitiesState();
    return total;
}

function addUtilitiesAsExpense() {
    if (accounts.length === 0) {
        alert('Сначала создайте счёт');
        return;
    }
    const selectedAccountId = accountSelect.value;
    if (!selectedAccountId || accounts.findIndex(a => a.id === selectedAccountId) === -1) {
        alert('Выберите счёт для списания');
        return;
    }
    const total = calculateUtilities();
    if (total <= 0.01) {
        alert('Сумма к оплате равна 0. Проверьте показания (текущие должны быть больше предыдущих)');
        return;
    }
    if (confirm(`Добавить расход ${total.toFixed(2)} ₽ (коммуналка) на счёт "${accounts.find(a => a.id === selectedAccountId)?.name}"?`)) {
        addTransaction(total, 'expense', selectedAccountId, `Коммунальные платежи (вода, эл-во, водоотведение)`);
        alert(`✅ Расход ${total.toFixed(2)} ₽ добавлен!\n\nНе забудьте нажать «Сбросить показания» для подготовки к следующему месяцу.`);
    }
}

// ---------- Редактирование ----------
function openEditModal(txId) {
    const transaction = transactions.find(t => t.id === txId);
    if (!transaction) return;
    editingTransactionId = txId;
    editAmount.value = transaction.amount;
    editType.value = transaction.type;
    editDescription.value = transaction.description || '';
    renderEditAccountSelect(transaction.accountId);
    modal.style.display = 'block';
}

function renderEditAccountSelect(selectedAccountId) {
    editAccountId.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = `${acc.name} (${acc.balance.toFixed(2)} ₽)`;
        if (acc.id === selectedAccountId) option.selected = true;
        editAccountId.appendChild(option);
    });
    if (accounts.length === 0) {
        const option = document.createElement('option');
        option.text = 'Нет доступных счетов';
        option.disabled = true;
        editAccountId.appendChild(option);
    }
}

// ---------- UI отрисовка ----------
function refreshUI() {
    renderAccountsAndBalances();
    renderAccountSelect();
    renderTransactionsList();
    calculateUtilities();
}

function renderAccountsAndBalances() {
    if (!accountsBalanceDiv) return;
    let html = '';
    let totalMoney = 0;
    accounts.forEach(acc => {
        html += `
            <div class="balance-item">
                <span class="balance-name">🏦 ${escapeHtml(acc.name)}</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="balance-amount">₽ ${acc.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span>
                    <button class="delete-account-btn" data-id="${acc.id}" title="Удалить счёт">🗑️</button>
                </div>
            </div>
        `;
        totalMoney += acc.balance;
    });
    html += `<div class="total-balance"><span>💰 ИТОГО:</span><span>₽ ${totalMoney.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span></div>`;
    if (accounts.length === 0) html = '<div class="empty-state">❌ Нет счетов</div>';
    accountsBalanceDiv.innerHTML = html;

    document.querySelectorAll('.delete-account-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteAccountById(btn.getAttribute('data-id'));
        });
    });
}

function renderAccountSelect() {
    if (!accountSelect) return;
    accountSelect.innerHTML = '';
    if (accounts.length === 0) {
        let opt = document.createElement('option');
        opt.text = '❌ Сначала создайте счёт';
        opt.disabled = true;
        accountSelect.appendChild(opt);
        return;
    }
    accounts.forEach(acc => {
        let opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = `${acc.name} (${acc.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽)`;
        accountSelect.appendChild(opt);
    });
}

function renderTransactionsList() {
    if (!transactionsContainer) return;
    if (transactions.length === 0) {
        transactionsContainer.innerHTML = '<div class="empty-state">📭 Нет операций</div>';
        return;
    }
    const sorted = [...transactions].sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
    let html = '';
    sorted.forEach(tx => {
        const accExists = accounts.some(a => a.id === tx.accountId);
        let accountDisplay = accExists ? (accounts.find(a => a.id === tx.accountId)?.name || 'Счёт') : '🗑️ Счёт удалён';
        const sign = tx.type === 'income' ? '+' : '−';
        const amountClass = tx.type === 'income' ? 'income-text' : 'expense-text';
        const typeClass = tx.type === 'income' ? 'transaction-income' : 'transaction-expense';
        const dateObj = new Date(tx.dateISO);
        const localDate = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        html += `
            <div class="transaction-item ${typeClass}">
                <div class="transaction-info">
                    <div class="transaction-desc">${escapeHtml(tx.description)}</div>
                    <div class="transaction-meta">
                        <span>${escapeHtml(accountDisplay)}</span>
                        <span>📅 ${localDate}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="transaction-amount ${amountClass}">${sign} ₽ ${tx.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</div>
                    <div class="transaction-actions">
                        <button class="edit-btn" data-id="${tx.id}" title="Редактировать">✏️</button>
                        <button class="delete-btn" data-id="${tx.id}" title="Удалить">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
    transactionsContainer.innerHTML = html;
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTransactionById(btn.getAttribute('data-id')));
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

function setActiveType(isIncome) {
    currentType = isIncome;
    if (isIncome) {
        incomeTypeBtn.classList.add('active-income');
        expenseTypeBtn.classList.remove('active-expense');
    } else {
        expenseTypeBtn.classList.add('active-expense');
        incomeTypeBtn.classList.remove('active-income');
    }
}

function handleAddTransaction() {
    let amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) { alert('Введите сумму > 0'); return; }
    if (accounts.length === 0) { alert('Создайте счёт'); return; }
    const selectedAccount = accountSelect.value;
    if (!selectedAccount) { alert('Выберите счёт'); return; }
    let desc = descriptionInput.value.trim();
    if (desc === '') desc = currentType ? 'Доход' : 'Расход';
    addTransaction(amount, currentType ? 'income' : 'expense', selectedAccount, desc);
    amountInput.value = '';
    descriptionInput.value = '';
}

// Модальное окно
const modal = document.getElementById('editModal');
const editAmount = document.getElementById('editAmount');
const editType = document.getElementById('editType');
const editAccountId = document.getElementById('editAccountId');
const editDescription = document.getElementById('editDescription');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const modalClose = document.querySelector('.modal-close');

function closeModal() {
    modal.style.display = 'none';
    editingTransactionId = null;
}

function saveEdit() {
    if (!editingTransactionId) return;
    let newAmount = parseFloat(editAmount.value);
    if (isNaN(newAmount) || newAmount <= 0) {
        alert('Введите корректную сумму (больше нуля)');
        return;
    }
    const newType = editType.value;
    const newAccountId = editAccountId.value;
    if (!newAccountId || accounts.findIndex(a => a.id === newAccountId) === -1) {
        alert('Выберите существующий счёт');
        return;
    }
    let newDescription = editDescription.value.trim();
    if (newDescription === '') newDescription = newType === 'income' ? 'Доход' : 'Расход';
    updateTransaction(editingTransactionId, newAmount, newType, newAccountId, newDescription);
    closeModal();
}

// Инициализация
function init() {
    loadData();
    refreshUI();
    setActiveType(true);

    addBtn.addEventListener('click', handleAddTransaction);
    addAccountBtn.addEventListener('click', addNewAccount);
    incomeTypeBtn.addEventListener('click', () => setActiveType(true));
    expenseTypeBtn.addEventListener('click', () => setActiveType(false));
    addUtilitiesBtn.addEventListener('click', addUtilitiesAsExpense);
    resetReadingsBtn.addEventListener('click', resetReadings);

    modalClose.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);
    saveEditBtn.addEventListener('click', saveEdit);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const utilityInputs = [coldCurrent, coldPrev, coldTariff, hotCurrent, hotPrev, hotTariff, elecCurrent, elecPrev, elecTariff, drainTariff];
    utilityInputs.forEach(inp => inp.addEventListener('input', () => calculateUtilities()));
    calculateUtilities();
}

document.addEventListener('DOMContentLoaded', init);
