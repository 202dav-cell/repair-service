/* DAV Service — clients service */
async function getClients() {
    return supabaseClient
        .from('clients')
        .select('id, full_name, phone, social_networks')
        .order('full_name');
}

async function findClientByName(fullName) {
    if (!fullName) return { data: null, error: null };
    return supabaseClient
        .from('clients')
        .select('*')
        .eq('full_name', fullName)
        .maybeSingle();
}

async function createClient(fullName, phone, socialNetworks) {
    return supabaseClient
        .from('clients')
        .insert({
            full_name: fullName || null,
            phone: phone || null,
            social_networks: socialNetworks || null
        })
        .select()
        .single();
}
