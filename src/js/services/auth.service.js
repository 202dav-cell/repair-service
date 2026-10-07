/* DAV Service — authentication service */
async function signIn(email, password) {
    return supabaseClient.auth.signInWithPassword({ email, password });
}

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    return { user: data.user, error };
}

async function getCurrentSession() {
    return supabaseClient.auth.getSession();
}

async function getUserProfile(userId) {
    return supabaseClient
        .from('profiles')
        .select('full_name, role')
        .eq('id', userId)
        .single();
}

async function signOut() {
    return supabaseClient.auth.signOut();
}
