/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    'https://xuhpdymilkoksowgefhr.supabase.co';


/*
   ВСТАВЬ СЮДА СВОЙ PUBLISHABLE KEY.
   SECRET KEY НЕ ИСПОЛЬЗОВАТЬ.
*/

const SUPABASE_KEY =
    'sb_publishable_Id3MLPNpCV-CAL3gpyhqog_eqxeB2ZA';


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   VARIABLES
===================================================== */

let allRepairs = [];

let currentTab = 'NEW';


/* =====================================================
   ELEMENTS
===================================================== */

const loginScreen =
    document.getElementById('loginScreen');

const app =
    document.getElementById('app');

const loginForm =
    document.getElementById('loginForm');

const loginError =
    document.getElementById('loginError');

const newRepairModal =
    document.getElementById('newRepairModal');

const newRepairForm =
    document.getElementById('newRepairForm');

const formMessage =
    document.getElementById('formMessage');


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener(
    'submit',
    async function(event) {

        event.preventDefault();

        loginError.textContent = '';

        const email =
            document.getElementById('email')
                .value
                .trim();

        const password =
            document.getElementById('password')
                .value;


        const {
            error
        } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            loginError.textContent =
                'Ошибка входа: ' + error.message;

            return;
        }


        await showApplication();

    }
);


/* =====================================================
   SHOW APP
===================================================== */

async function showApplication() {

    loginScreen.style.display = 'none';

    app.style.display = 'block';

    await loadUser();

    await loadRepairs();

}


/* =====================================================
   LOAD USER
===================================================== */

async function loadUser() {

    const {
        data: {
            user
        }
    } =
    await supabaseClient.auth.getUser();


    if (!user) {
        return;
    }


    const {
        data: profile,
        error
    } =
    await supabaseClient
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();


    if (error) {

        document.getElementById(
            'userInfo'
        ).textContent =
            user.email;

        return;
    }


    document.getElementById(
        'userInfo'
    ).textContent =
        (profile.full_name || user.email)
        + ' • '
        + profile.role;

}


/* =====================================================
   LOAD REPAIRS
===================================================== */

async function loadRepairs() {

    const container =
        document.getElementById(
            'tableContainer'
        );


    container.innerHTML =
        '<div class="loading">Загрузка ремонтов...</div>';


    const {
        data,
        error
    } =
    await supabaseClient
        .from('repair_overview')
        .select('*')
        .order(
            'created_at',
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        container.innerHTML =
            '<div class="empty">'
            + escapeHtml(error.message)
            + '</div>';

        return;
    }


    allRepairs = data || [];


    updateCounters();

    renderCurrentTab();

}


/* =====================================================
   COUNTERS
===================================================== */

function updateCounters() {

    const newCount =
        allRepairs.filter(
            repair =>
                repair.status === 'NEW'
        ).length;


    const repairCount =
        allRepairs.filter(
            repair =>
                repair.status === 'IN_REPAIR'
        ).length;


    const overdueCount =
        allRepairs.filter(
            repair =>
                repair.status === 'IN_REPAIR'
                &&
                repair.is_overdue === true
        ).length;


    const readyCount =
        allRepairs.filter(
            repair =>
                repair.status === 'READY'
        ).length;


    document.getElementById(
        'counterNew'
    ).textContent = newCount;


    document.getElementById(
        'counterRepair'
    ).textContent = repairCount;


    document.getElementById(
        'counterOverdue'
    ).textContent = overdueCount;


    document.getElementById(
        'counterReady'
    ).textContent = readyCount;

}


/* =====================================================
   TABS
===================================================== */

document
    .querySelectorAll('.tab')
    .forEach(
        button => {

            button.addEventListener(
                'click',
                function() {

                    document
                        .querySelectorAll('.tab')
                        .forEach(
                            b =>
                                b.classList.remove('active')
                        );


                    this.classList.add('active');


                    currentTab =
                        this.dataset.tab;


                    renderCurrentTab();

                }
            );

        }
    );


/* =====================================================
   RENDER CURRENT TAB
===================================================== */

function renderCurrentTab() {

    let repairs = [];


    if (currentTab === 'NEW') {

        repairs =
            allRepairs.filter(
                repair =>
                    repair.status === 'NEW'
            );

        document.getElementById(
            'pageTitle'
        ).textContent =
            'Новые ремонты';

    }


    else if (currentTab === 'IN_REPAIR') {

        repairs =
            allRepairs.filter(
                repair =>
                    repair.status === 'IN_REPAIR'
            );

        document.getElementById(
            'pageTitle'
        ).textContent =
            'Ремонты в работе';

    }


    else if (currentTab === 'OVERDUE') {

        repairs =
            allRepairs.filter(
                repair =>
                    repair.status === 'IN_REPAIR'
                    &&
                    repair.is_overdue === true
            );

        document.getElementById(
            'pageTitle'
        ).textContent =
            'Просроченные ремонты';

    }


    else if (currentTab === 'READY') {

        repairs =
            allRepairs.filter(
                repair =>
                    repair.status === 'READY'
            );

        document.getElementById(
            'pageTitle'
        ).textContent =
            'Готово к выдаче';

    }


    else if (currentTab === 'ARCHIVE') {

        repairs =
            allRepairs.filter(
                repair =>
                    repair.status === 'ISSUED'
                    ||
                    repair.status === 'CANCELLED'
            );

        document.getElementById(
            'pageTitle'
        ).textContent =
            'Архив';

    }


    renderTable(repairs);

}


/* =====================================================
   TABLE
===================================================== */

function renderTable(repairs) {

    const container =
        document.getElementById(
            'tableContainer'
        );


    if (!repairs.length) {

        container.innerHTML =
            '<div class="empty">'
            + 'Здесь пока нет ремонтов'
            + '</div>';

        return;
    }


    let html = '';

    html += '<div class="table-wrapper>';

    html += '<table>';

    html += '<thead>';

    html += '<tr>';

    html += '<th>№ ремонта</th>';
    html += '<th>Оборудование</th>';
    html += '<th>Бренд</th>';
    html += '<th>Модель</th>';
    html += '<th>Серийный номер</th>';
    html += '<th>Проблема клиента</th>';
    html += '<th>Статус</th>';
    html += '<th>Дата</th>';
    html += '<th>Дней</th>';

    html += '</tr>';

    html += '</thead>';

    html += '<tbody>';


    repairs.forEach(
        repair => {

            const overdue =
                repair.status === 'IN_REPAIR'
                &&
                repair.is_overdue === true;


            html += '<tr class="'
                + (
                    overdue
                    ? 'overdue-row'
                    : ''
                )
                + '">';


            html += '<td>'
                + '<span class="repair-number">'
                + escapeHtml(
                    formatRepairNumber(
                        repair.repair_number
                    )
                )
                + '</span>'
                + '</td>';


            html += '<td>'
                + escapeHtml(
                    repair.equipment_name || '—'
                )
                + '</td>';


            html += '<td>'
                + escapeHtml(
                    repair.brand || '—'
                )
                + '</td>';


            html += '<td>'
                + escapeHtml(
                    repair.model || '—'
                )
                + '</td>';


            html += '<td>'
                + escapeHtml(
                    repair.serial_number || '—'
                )
                + '</td>';


            html += '<td>'
                + escapeHtml(
                    repair.customer_problem || '—'
                )
                + '</td>';


            html += '<td>'
                + getStatusHtml(
                    repair.status,
                    overdue
                )
                + '</td>';


            html += '<td>'
                + formatDate(
                    repair.created_at
                )
                + '</td>';


            html += '<td>'
                + (
                    repair.days_in_repair !== null
                    &&
                    repair.days_in_repair !== undefined
                    ?
                    escapeHtml(
                        String(
                            repair.days_in_repair
                        )
                    )
                    :
                    '—'
                )
                + '</td>';


            html += '</tr>';

        }
    );


    html += '</tbody>';

    html += '</table>';

    html += '</div>';


    container.innerHTML = html;

}


/* =====================================================
   STATUS
===================================================== */

function getStatusHtml(
    status,
    overdue
) {

    if (status === 'NEW') {

        return `
            <span class="status status-new">
                НОВАЯ
            </span>
        `;

    }


    if (status === 'IN_REPAIR') {

        if (overdue) {

            return `
                <span class="status status-repair">
                    В РЕМОНТЕ
                </span>
                <br>
                <span class="overdue-label">
                    ПРОСРОЧЕНО
                </span>
            `;

        }


        return `
            <span class="status status-repair">
                В РЕМОНТЕ
            </span>
        `;

    }


    if (status === 'READY') {

        return `
            <span class="status status-ready">
                ГОТОВО
            </span>
        `;

    }


    if (status === 'ISSUED') {

        return `
            <span class="status status-issued">
                ВЫДАНО
            </span>
        `;

    }


    if (status === 'CANCELLED') {

        return `
            <span class="status status-cancelled">
                ОТМЕНА
            </span>
        `;

    }


    return escapeHtml(
        status || '—'
    );

}


/* =====================================================
   NEW REPAIR MODAL
===================================================== */

document
    .getElementById('newRepairButton')
    .addEventListener(
        'click',
        function() {

            openNewRepairModal();

        }
    );


function openNewRepairModal() {

    newRepairForm.reset();

    formMessage.style.display = 'none';

    formMessage.textContent = '';

    newRepairModal.style.display = 'block';

    document.body.style.overflow = 'hidden';

}


function closeNewRepairModal() {

    newRepairModal.style.display = 'none';

    document.body.style.overflow = '';

}


document
    .getElementById('closeModalButton')
    .addEventListener(
        'click',
        closeNewRepairModal
    );


document
    .getElementById('cancelModalButton')
    .addEventListener(
        'click',
        closeNewRepairModal
    );


newRepairModal.addEventListener(
    'click',
    function(event) {

        if (
            event.target === newRepairModal
        ) {

            closeNewRepairModal();

        }

    }
);


/* =====================================================
   SAVE NEW REPAIR
===================================================== */

newRepairForm.addEventListener(
    'submit',
    async function(event) {

        event.preventDefault();


        const saveButton =
            document.getElementById(
                'saveRepairButton'
            );


        saveButton.disabled = true;

        saveButton.textContent =
            'Сохранение...';


        formMessage.style.display = 'none';


        try {

            /* =========================
               GET CURRENT USER
            ========================= */

            const {
                data: {
                    user
                },
                error: userError
            } =
            await supabaseClient.auth.getUser();


            if (
                userError
                ||
                !user
            ) {

                throw new Error(
                    'Не удалось определить пользователя.'
                );

            }


            /* =========================
               FORM DATA
            ========================= */

            const clientName =
                document.getElementById(
                    'clientName'
                ).value.trim();


            const clientPhone =
                document.getElementById(
                    'clientPhone'
                ).value.trim();


            const equipmentName =
                document.getElementById(
                    'equipmentName'
                ).value.trim();


            const brand =
                document.getElementById(
                    'brand'
                ).value.trim();


            const model =
                document.getElementById(
                    'model'
                ).value.trim();


            const serialNumber =
                document.getElementById(
                    'serialNumber'
                ).value.trim();


            const customerProblem =
                document.getElementById(
                    'customerProblem'
                ).value.trim();


/* =========================
   FIND OR CREATE CLIENT
========================= */

let client;

const {
    data: existingClient,
    error: findClientError
} = await supabaseClient
    .from('clients')
    .select('*')
    .eq('full_name', clientName)
    .maybeSingle();

if (findClientError) {
    throw new Error(
        'Ошибка поиска клиента: ' +
        findClientError.message
    );
}

if (existingClient) {

    client = existingClient;

} else {

    const {
        data: newClient,
        error: clientError
    } = await supabaseClient
        .from('clients')
        .insert({
            full_name: clientName,
            phone: clientPhone
        })
        .select()
        .single();

    if (clientError) {
        throw new Error(
            'Ошибка создания клиента: ' +
            clientError.message
        );
    }

    client = newClient;
}


            /* =========================
               CREATE REPAIR
            ========================= */

            const {
                data: repair,
                error: repairError
            } =
            await supabaseClient
                .from('repair_requests')
                .insert({

                    client_id: client.id,

                    equipment_name: equipmentName,

                    brand: brand || null,

                    model: model || null,

                    serial_number:
                        serialNumber || null,

                    customer_problem:
                        customerProblem,

                    status: 'NEW',

                    created_by: user.id

                })
                .select()
                .single();


            if (repairError) {

                throw new Error(
                    'Клиент создан, но ремонт не создан: '
                    +
                    repairError.message
                );

            }


            /* =========================
               SUCCESS
            ========================= */

            formMessage
                .className =
                    'form-message success-message';


            formMessage.textContent =
                'Ремонт №'
                +
                formatRepairNumber(
                    repair.repair_number
                )
                +
                ' успешно создан.';


            formMessage.style.display =
                'block';


            await loadRepairs();


            setTimeout(
                function() {

                    closeNewRepairModal();

                },
                1200
            );


        }
        catch (error) {

            console.error(error);


            formMessage
                .className =
                    'form-message error-message';


            formMessage.textContent =
                error.message;


            formMessage.style.display =
                'block';

        }


        saveButton.disabled = false;

        saveButton.textContent =
            'Сохранить ремонт';

    }
);


/* =====================================================
   REFRESH
===================================================== */

document
    .getElementById('refreshButton')
    .addEventListener(
        'click',
        async function() {

            await loadRepairs();

        }
    );


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById('logoutButton')
    .addEventListener(
        'click',
        async function() {

            await supabaseClient.auth.signOut();

            app.style.display = 'none';

            loginScreen.style.display = 'flex';

            document.getElementById(
                'email'
            ).value = '';

            document.getElementById(
                'password'
            ).value = '';

        }
    );


/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatRepairNumber(number) {

    if (
        number === null
        ||
        number === undefined
    ) {

        return '—';

    }


    return String(number)
        .padStart(6, '0');

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(date) {

    if (!date) {

        return '—';

    }


    const d =
        new Date(date);


    if (isNaN(d.getTime())) {

        return '—';

    }


    return d.toLocaleDateString(
        'ru-RU',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return '';

    }


    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =====================================================
   CHECK SESSION
===================================================== */

async function checkSession() {

    const {
        data: {
            session
        }
    } =
    await supabaseClient.auth.getSession();


    if (session) {

        await showApplication();

    }

}


/* =====================================================
   START
===================================================== */

async function loadClients() {
    const { data, error } = await supabaseClient
        .from('clients')
        .select('id, full_name, phone')
        .order('full_name');

    if (error) {
        console.error('Ошибка загрузки клиентов:', error);
        return;
    }

    console.log('Клиенты загружены:', data);

    const clientsList = document.getElementById('clientsList');

    if (clientsList) {
        clientsList.innerHTML = '';

        data.forEach(client => {
            const option = document.createElement('option');
            option.value = client.full_name;
            clientsList.appendChild(option);
        });
    }
}

checkSession();
loadClients();
