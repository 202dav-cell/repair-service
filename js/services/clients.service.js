/* DAV Service — clients service */
async function getClients() {
    return supabaseClient
        .from('clients')
        .select('id, full_name, phone')
        .order('full_name');
}

async function findClientByName(fullName) {
    return supabaseClient
        .from('clients')
        .select('*')
        .eq('full_name', fullName)
        .maybeSingle();
}

async function createClient(fullName, phone) {
    return supabaseClient
        .from('clients')
        .insert({ full_name: fullName, phone })
        .select()
        .single();
}
