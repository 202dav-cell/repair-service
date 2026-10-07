/* DAV Service — employees service */
async function getEmployees() {
    return supabaseClient
        .from('profiles')
        .select('id, full_name, role, social_networks')
        .order('full_name');
}

async function createEmployeeAccount(fullName, email, password, role, socialNetworks) {
    const result = await supabaseClient.functions.invoke('create-employee', {
        body: {
            full_name: fullName,
            email,
            password,
            role,
            social_networks: socialNetworks || ''
        }
    });

    if (result.error) {
        let message = result.error.message || 'Ошибка создания сотрудника.';

        // Supabase часто показывает только "Edge Function returned a non-2xx status code".
        // Читаем тело ответа Edge Function, чтобы показать пользователю реальную причину.
        try {
            const response = result.error.context;
            if (response && typeof response.clone === 'function') {
                const cloned = response.clone();
                const contentType = cloned.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const body = await cloned.json();
                    if (body?.error) message = body.error;
                } else {
                    const bodyText = await cloned.text();
                    if (bodyText) {
                        try {
                            const body = JSON.parse(bodyText);
                            if (body?.error) message = body.error;
                        } catch (_) {
                            // Оставляем исходное сообщение Supabase.
                        }
                    }
                }
            }
        } catch (_) {
            // Оставляем исходное сообщение Supabase.
        }

        return { data: null, error: new Error(message) };
    }

    return result;
}

async function updateEmployeeRole(userId, role) {
    return supabaseClient.functions.invoke('update-employee-role', {
        body: { user_id: userId, role }
    });
}
