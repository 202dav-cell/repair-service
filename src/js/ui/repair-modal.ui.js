/* DAV Service — new repair modal UI */
document.getElementById('newRepairButton').addEventListener('click', openNewRepairModal);
document.getElementById('closeModalButton').addEventListener('click', closeNewRepairModal);
document.getElementById('cancelModalButton').addEventListener('click', closeNewRepairModal);

newRepairModal.addEventListener('click', function(event) {
    if (event.target === newRepairModal) closeNewRepairModal();
});

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

newRepairForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const saveButton = document.getElementById('saveRepairButton');
    saveButton.disabled = true;
    saveButton.textContent = 'Сохранение...';
    formMessage.style.display = 'none';

    try {
        const { user, error: userError } = await getCurrentUser();
        if (userError || !user) throw new Error('Не удалось определить пользователя.');

        const clientName = document.getElementById('clientName').value.trim();
        const clientPhone = document.getElementById('clientPhone').value.trim();
        const equipmentName = document.getElementById('equipmentName').value.trim();
        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const serialNumber = document.getElementById('serialNumber').value.trim();
        const customerProblem = document.getElementById('customerProblem').value.trim();

        let client;
        const { data: existingClient, error: findClientError } = await findClientByName(clientName);
        if (findClientError) throw new Error('Ошибка поиска клиента: ' + findClientError.message);

        if (existingClient) {
            client = existingClient;
        } else {
            const { data: newClient, error: clientError } = await createClient(clientName, clientPhone);
            if (clientError) throw new Error('Ошибка создания клиента: ' + clientError.message);
            client = newClient;
        }

        const { data: repair, error: repairError } = await createRepair({
            client_id: client.id,
            equipment_name: equipmentName,
            brand: brand || null,
            model: model || null,
            serial_number: serialNumber || null,
            customer_problem: customerProblem,
            status: 'NEW',
            created_by: user.id
        });

        if (repairError) throw new Error('Клиент создан, но ремонт не создан: ' + repairError.message);

        formMessage.className = 'form-message success-message';
        formMessage.textContent = 'Ремонт №' + formatRepairNumber(repair.repair_number) + ' успешно создан.';
        formMessage.style.display = 'block';
        await loadRepairs();

        setTimeout(closeNewRepairModal, 1200);
    } catch (error) {
        console.error(error);
        formMessage.className = 'form-message error-message';
        formMessage.textContent = error.message;
        formMessage.style.display = 'block';
    }

    saveButton.disabled = false;
    saveButton.textContent = 'Сохранить ремонт';
});
