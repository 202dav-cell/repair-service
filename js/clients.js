/* DAV Service — clients */
async function loadClients() {
    const { data, error } = await supabaseClient
        .from('clients')
        .select('id, full_name, phone')
        .order('full_name');

    if (error) {
        console.error('Ошибка загрузки клиентов:', error);
        return;
    }

    const clientsList = document.getElementById('clientsList');
    if (!clientsList) return;

    clientsList.innerHTML = '';
    data.forEach(client => {
        const option = document.createElement('option');
        option.value = client.full_name;
        clientsList.appendChild(option);
    });
}
