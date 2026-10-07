/* DAV Service — employees UI */
const employeeSearch = document.getElementById('employeeSearch');
const employeeModal = document.getElementById('employeeModal');
const employeeForm = document.getElementById('employeeForm');
const employeeFormMessage = document.getElementById('employeeFormMessage');
const employeeDetailsModal = document.getElementById('employeeDetailsModal');
const employeeDetailsForm = document.getElementById('employeeDetailsForm');
const employeeDetailsMessage = document.getElementById('employeeDetailsMessage');
let allEmployees = [];
let selectedEmployee = null;
let employeeDetailsEditing = false;

const roleLabels = {
    ADMIN: 'Администратор',
    MASTER: 'Мастер',
    RECEPTION: 'Приёмщик',
    master: 'Мастер',
    reception: 'Приёмщик'
};

function isAdmin() {
    return currentUserProfile && String(currentUserProfile.role || '').toUpperCase() === 'ADMIN';
}

function openEmployeesPage() {
    if (!isAdmin()) return;
    document.getElementById('repairsPage').style.display = 'none';
    document.getElementById('employeesPage').classList.remove('page-hidden');
    document.getElementById('pageTitle').textContent = 'Сотрудники';
    loadEmployees();
}

function closeEmployeesPage() {
    document.getElementById('employeesPage').classList.add('page-hidden');
    document.getElementById('repairsPage').style.display = 'block';
}

async function loadEmployees() {
    const container = document.getElementById('employeesTableContainer');
    container.innerHTML = '<div class="loading">Загрузка сотрудников...</div>';

    const { data, error } = await getEmployees();

    if (error) {
        container.innerHTML = '<div class="empty">' + escapeHtml(error.message) + '</div>';
        return;
    }

    allEmployees = data || [];
    renderEmployees();
}

function renderEmployees() {
    const container = document.getElementById('employeesTableContainer');
    const query = (employeeSearch.value || '').trim().toLowerCase();

    const employees = allEmployees.filter(employee =>
        (employee.full_name || '').toLowerCase().includes(query) ||
        String(roleLabels[employee.role] || employee.role || '').toLowerCase().includes(query) ||
        (employee.social_networks || '').toLowerCase().includes(query)
    );

    if (!employees.length) {
        container.innerHTML = '<div class="empty">Сотрудники не найдены</div>';
        return;
    }

    let html = '<div class="table-wrapper"><table class="employees-table"><thead><tr>';
    html += '<th>Сотрудник</th><th>Соц. сети</th><th>Уровень доступа</th></tr></thead><tbody>';

    employees.forEach(employee => {
        const role = String(employee.role || '');

        html += '<tr class="employee-row" data-user-id="' + escapeHtml(employee.id) + '">';
        html += '<td><strong>' + escapeHtml(employee.full_name || 'Без имени') + '</strong></td>';
        html += '<td>' + escapeHtml(employee.social_networks || '—') + '</td>';
        html += '<td><span class="role-badge role-' + escapeHtml(role) + '">' +
            escapeHtml(roleLabels[role] || role || 'Не назначен') + '</span></td>';
        html += '<td><button type="button" class="employee-open-button">Открыть</button></td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    container.querySelectorAll('.employee-row').forEach(row => {
        row.style.cursor = 'pointer';
    });

    container.onclick = async event => {
        const row = event.target.closest('.employee-row');
        if (!row) return;

        const userId = row.getAttribute('data-user-id');
        if (!userId) return;

        await openEmployeeDetails(userId);
    };
}

async function openEmployeeDetails(userId) {
    if (!isAdmin()) return;

    selectedEmployee = allEmployees.find(employee => employee.id === userId) || null;

    if (!selectedEmployee) return;

    employeeDetailsEditing = false;
    setEmployeeDetailsMode(false);

    document.getElementById('employeeDetailsName').value = selectedEmployee.full_name || '';
    document.getElementById('employeeDetailsEmail').value = selectedEmployee.email || '';
    document.getElementById('employeeDetailsSocialNetworks').value = selectedEmployee.social_networks || '';

    const role = String(selectedEmployee.role || '');
    document.getElementById('employeeDetailsRole').value =
        role === 'MASTER' ? 'master' :
        role === 'RECEPTION' ? 'reception' :
        role === 'ADMIN' ? 'ADMIN' : role;

    document.getElementById('employeeDetailsPasswordInput').value = '';
    employeeDetailsMessage.style.display = 'none';
    employeeDetailsMessage.textContent = '';

    employeeDetailsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    const result = await getEmployeeDetails(userId);

    if (!result.error && result.data) {
        selectedEmployee = { ...selectedEmployee, ...result.data };

        document.getElementById('employeeDetailsName').value = selectedEmployee.full_name || '';
        document.getElementById('employeeDetailsEmail').value = selectedEmployee.email || '';
        document.getElementById('employeeDetailsSocialNetworks').value = selectedEmployee.social_networks || '';
    }
}

function setEmployeeDetailsMode(editing) {
    employeeDetailsEditing = editing;

    document.getElementById('employeeDetailsName').disabled = !editing;
    document.getElementById('employeeDetailsEmail').disabled = !editing;
    document.getElementById('employeeDetailsSocialNetworks').disabled = !editing;
    document.getElementById('employeeDetailsRole').disabled = !editing;
    document.getElementById('employeeDetailsPasswordInput').disabled = !editing;

    document.getElementById('employeeDetailsEditButton').style.display = editing ? 'none' : 'inline-block';
    document.getElementById('employeeDetailsSaveButton').style.display = editing ? 'inline-block' : 'none';
    document.getElementById('employeeDetailsCancelEditButton').style.display = editing ? 'inline-block' : 'none';

    document.getElementById('employeeDetailsPassword').style.display = editing ? 'block' : 'none';
}

function closeEmployeeDetails() {
    employeeDetailsModal.style.display = 'none';
    document.body.style.overflow = '';
    selectedEmployee = null;
    employeeDetailsEditing = false;
}

function openEmployeeModal() {
    if (!isAdmin()) return;

    employeeForm.reset();
    document.getElementById('employeeRole').value = 'reception';
    employeeFormMessage.style.display = 'none';
    employeeFormMessage.textContent = '';
    employeeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEmployeeModal() {
    employeeModal.style.display = 'none';
    document.body.style.overflow = '';
}

document.getElementById('employeesButton').addEventListener('click', openEmployeesPage);
document.getElementById('backToRepairsButton').addEventListener('click', closeEmployeesPage);
document.getElementById('addEmployeeButton').addEventListener('click', openEmployeeModal);
document.getElementById('closeEmployeeModalButton').addEventListener('click', closeEmployeeModal);
document.getElementById('cancelEmployeeModalButton').addEventListener('click', closeEmployeeModal);

employeeModal.addEventListener('click', event => {
    if (event.target === employeeModal) closeEmployeeModal();
});

employeeDetailsModal.addEventListener('click', event => {
    if (event.target === employeeDetailsModal) closeEmployeeDetails();
});

document.getElementById('closeEmployeeDetailsButton').addEventListener('click', closeEmployeeDetails);
document.getElementById('closeEmployeeDetailsButtonBottom').addEventListener('click', closeEmployeeDetails);

document.getElementById('employeeDetailsEditButton').addEventListener('click', () => {
    setEmployeeDetailsMode(true);
});

document.getElementById('employeeDetailsCancelEditButton').addEventListener('click', () => {
    if (!selectedEmployee) return;

    document.getElementById('employeeDetailsName').value = selectedEmployee.full_name || '';
    document.getElementById('employeeDetailsEmail').value = selectedEmployee.email || '';
    document.getElementById('employeeDetailsSocialNetworks').value = selectedEmployee.social_networks || '';

    const role = String(selectedEmployee.role || '');
    document.getElementById('employeeDetailsRole').value =
        role === 'MASTER' ? 'master' :
        role === 'RECEPTION' ? 'reception' :
        role === 'ADMIN' ? 'ADMIN' : role;

    document.getElementById('employeeDetailsPasswordInput').value = '';
    employeeDetailsMessage.style.display = 'none';
    setEmployeeDetailsMode(false);
});

employeeSearch.addEventListener('input', renderEmployees);

employeeForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const saveButton = document.getElementById('saveEmployeeButton');
    saveButton.disabled = true;
    saveButton.textContent = 'Создание...';
    employeeFormMessage.style.display = 'none';

    try {
        const fullName = document.getElementById('employeeName').value.trim();
        const email = document.getElementById('employeeEmail').value.trim();
        const password = document.getElementById('employeePassword').value;
        const socialNetworks = document.getElementById('employeeSocialNetworks').value.trim();
        const role = document.getElementById('employeeRole').value;

        const { error } = await createEmployeeAccount(
            fullName,
            email,
            password,
            role,
            socialNetworks
        );

        if (error) throw new Error(error.message);

        employeeFormMessage.className = 'form-message success-message';
        employeeFormMessage.textContent = 'Сотрудник создан.';
        employeeFormMessage.style.display = 'block';

        await loadEmployees();

        setTimeout(closeEmployeeModal, 1200);
    } catch (error) {
        console.error(error);
        employeeFormMessage.className = 'form-message error-message';
        employeeFormMessage.textContent = error.message;
        employeeFormMessage.style.display = 'block';
    }

    saveButton.disabled = false;
    saveButton.textContent = 'Создать сотрудника';
});

employeeDetailsForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    if (!selectedEmployee) return;

    const saveButton = document.getElementById('employeeDetailsSaveButton');
    saveButton.disabled = true;
    saveButton.textContent = 'Сохранение...';
    employeeDetailsMessage.style.display = 'none';

    try {
        const payload = {
            user_id: selectedEmployee.id,
            full_name: document.getElementById('employeeDetailsName').value.trim(),
            email: document.getElementById('employeeDetailsEmail').value.trim(),
            password: document.getElementById('employeeDetailsPasswordInput').value,
            social_networks: document.getElementById('employeeDetailsSocialNetworks').value.trim(),
            role: document.getElementById('employeeDetailsRole').value
        };

        const { data, error } = await updateEmployee(payload);

        if (error) throw new Error(error.message);

        selectedEmployee = {
            ...selectedEmployee,
            ...data
        };

        employeeDetailsMessage.className = 'form-message success-message';
        employeeDetailsMessage.textContent = 'Данные сотрудника сохранены.';
        employeeDetailsMessage.style.display = 'block';

        document.getElementById('employeeDetailsPasswordInput').value = '';
        closeEmployeeDetails();
        await loadEmployees();
    } catch (error) {
        console.error(error);
        employeeDetailsMessage.className = 'form-message error-message';
        employeeDetailsMessage.textContent = error.message;
        employeeDetailsMessage.style.display = 'block';
    }

    saveButton.disabled = false;
    saveButton.textContent = 'Сохранить';
});
