/* DAV Service — employees UI */
const employeeSearch = document.getElementById('employeeSearch');
const employeeModal = document.getElementById('employeeModal');
const employeeForm = document.getElementById('employeeForm');
const employeeFormMessage = document.getElementById('employeeFormMessage');
let allEmployees = [];

const roleLabels = {
    ADMIN: 'Администратор',
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
    html += '<th>Сотрудник</th><th>Соц. сети</th><th>Уровень доступа</th><th>Изменить доступ</th></tr></thead><tbody>';
    employees.forEach(employee => {
        const role = String(employee.role || '');
        html += '<tr>';
        html += '<td><strong>' + escapeHtml(employee.full_name || 'Без имени') + '</strong></td>';
        html += '<td>' + escapeHtml(employee.social_networks || '—') + '</td>';
        html += '<td><span class="role-badge role-' + escapeHtml(role) + '">' + escapeHtml(roleLabels[role] || role || 'Не назначен') + '</span></td>';
        html += '<td><select class="employee-role-select" data-user-id="' + escapeHtml(employee.id) + '">';
        Object.entries(roleLabels).forEach(([value, label]) => {
            html += '<option value="' + value + '"' + (role === value ? ' selected' : '') + '>' + label + '</option>';
        });
        html += '</select></td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;

    container.querySelectorAll('.employee-role-select').forEach(select => {
        select.addEventListener('change', async function() {
            const userId = this.dataset.userId;
            const role = this.value;
            this.disabled = true;
            const { error } = await updateEmployeeRole(userId, role);
            this.disabled = false;
            if (error) {
                alert('Не удалось изменить уровень доступа: ' + error.message);
                await loadEmployees();
                return;
            }
            await loadEmployees();
        });
    });
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
        const { data, error } = await createEmployeeAccount(fullName, email, password, role, socialNetworks);
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
