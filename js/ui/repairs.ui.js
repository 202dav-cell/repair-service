/* DAV Service — repairs UI, counters, tabs and table */
async function loadRepairs() {
    const container = document.getElementById('tableContainer');
    container.innerHTML = '<div class="loading">Загрузка ремонтов...</div>';

    const { data, error } = await getRepairs();

    if (error) {
        console.error(error);
        container.innerHTML = '<div class="empty">' + escapeHtml(error.message) + '</div>';
        return;
    }

    allRepairs = data || [];
    updateCounters();
    renderCurrentTab();
}

function updateCounters() {
    document.getElementById('counterNew').textContent = allRepairs.filter(r => r.status === 'NEW').length;
    document.getElementById('counterRepair').textContent = allRepairs.filter(r => r.status === 'IN_REPAIR').length;
    document.getElementById('counterOverdue').textContent = allRepairs.filter(r => r.status === 'IN_REPAIR' && r.is_overdue === true).length;
    document.getElementById('counterReady').textContent = allRepairs.filter(r => r.status === 'READY').length;
}

document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        renderCurrentTab();
    });
});

function renderCurrentTab() {
    const views = {
        NEW: ['Новые ремонты', r => r.status === 'NEW'],
        IN_REPAIR: ['Ремонты в работе', r => r.status === 'IN_REPAIR'],
        OVERDUE: ['Просроченные ремонты', r => r.status === 'IN_REPAIR' && r.is_overdue === true],
        READY: ['Готово к выдаче', r => r.status === 'READY'],
        ARCHIVE: ['Архив', r => r.status === 'ISSUED' || r.status === 'CANCELLED']
    };
    const view = views[currentTab] || views.NEW;
    document.getElementById('pageTitle').textContent = view[0];
    renderTable(allRepairs.filter(view[1]));
}

function renderTable(repairs) {
    const container = document.getElementById('tableContainer');
    if (!repairs.length) {
        container.innerHTML = '<div class="empty">Здесь пока нет ремонтов</div>';
        return;
    }

    let html = '<div class="table-wrapper">';
    html += '<table><thead><tr>';
    html += '<th>№ ремонта</th><th>Оборудование</th><th>Бренд</th><th>Модель</th><th>Серийный номер</th><th>Проблема клиента</th><th>Статус</th><th>Дата</th><th>Дней</th>';
    html += '</tr></thead><tbody>';

    repairs.forEach(repair => {
        const overdue = repair.status === 'IN_REPAIR' && repair.is_overdue === true;
        html += '<tr class="' + (overdue ? 'overdue-row' : '') + '">';
        html += '<td><span class="repair-number">' + escapeHtml(formatRepairNumber(repair.repair_number)) + '</span></td>';
        html += '<td>' + escapeHtml(repair.equipment_name || '—') + '</td>';
        html += '<td>' + escapeHtml(repair.brand || '—') + '</td>';
        html += '<td>' + escapeHtml(repair.model || '—') + '</td>';
        html += '<td>' + escapeHtml(repair.serial_number || '—') + '</td>';
        html += '<td>' + escapeHtml(repair.customer_problem || '—') + '</td>';
        html += '<td>' + getStatusHtml(repair.status, overdue) + '</td>';
        html += '<td>' + formatDate(repair.created_at) + '</td>';
        html += '<td>' + (repair.days_in_repair !== null && repair.days_in_repair !== undefined ? escapeHtml(String(repair.days_in_repair)) : '—') + '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function getStatusHtml(status, overdue) {
    if (status === 'NEW') return '<span class="status status-new">НОВАЯ</span>';
    if (status === 'IN_REPAIR') {
        if (overdue) return '<span class="status status-repair">В РЕМОНТЕ</span><br><span class="overdue-label">ПРОСРОЧЕНО</span>';
        return '<span class="status status-repair">В РЕМОНТЕ</span>';
    }
    if (status === 'READY') return '<span class="status status-ready">ГОТОВО</span>';
    if (status === 'ISSUED') return '<span class="status status-issued">ВЫДАНО</span>';
    if (status === 'CANCELLED') return '<span class="status status-cancelled">ОТМЕНА</span>';
    return escapeHtml(status || '—');
}

document.getElementById('refreshButton').addEventListener('click', loadRepairs);
