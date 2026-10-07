/* DAV Service — employees service */
async function getEmployees() {
    return supabaseClient
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');
}

async function createEmployeeAccount(fullName, email, password, role) {
    const { data: currentSessionData } = await supabaseClient.auth.getSession();
    const adminSession = currentSessionData.session;

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
    });

    if (adminSession && data.session) {
        await supabaseClient.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token
        });
    }

    if (error) return { data, error };
    if (!data.user) return { data, error: new Error('Supabase не вернул созданного пользователя.') };

    const profileResult = await supabaseClient
        .from('profiles')
        .upsert({ id: data.user.id, full_name: fullName, role }, { onConflict: 'id' })
        .select('id, full_name, role')
        .single();

    return { data: { ...data, profile: profileResult.data }, error: profileResult.error };
}

async function updateEmployeeRole(userId, role) {
    return supabaseClient
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select('id, full_name, role')
        .single();
}
