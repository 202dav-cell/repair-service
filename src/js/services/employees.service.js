/* DAV Service — employees service */
async function getEmployees() {
    return supabaseClient
        .from('profiles')
        .select('id, full_name, role, social_networks')
        .order('full_name');
}

async function createEmployeeAccount(fullName, email, password, role, socialNetworks) {
    try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) {
            return { data: null, error: new Error('Сессия пользователя не найдена. Войдите в систему заново.') };
        }

        const response = await fetch(
            SUPABASE_URL + '/functions/v1/create-employee',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + sessionData.session.access_token,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    password,
                    role,
                    social_networks: socialNetworks || ''
                })
            }
        );

        const responseText = await response.text();
        let body = {};
        try {
            body = responseText ? JSON.parse(responseText) : {};
        } catch (_) {
            body = {};
        }

        if (!response.ok) {
            return {
                data: null,
                error: new Error(
                    body?.error ||
                    body?.message ||
                    ('Ошибка создания сотрудника. HTTP ' + response.status)
                )
            };
        }

        return { data: body?.data || body, error: null };
    } catch (error) {
        return {
            data: null,
            error: new Error(error?.message || 'Не удалось выполнить запрос к серверу.')
        };
    }
}

async function updateEmployeeRole(userId, role) {
    return supabaseClient.functions.invoke('update-employee-role', {
        body: { user_id: userId, role }
    });
}
