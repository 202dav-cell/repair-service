/* DAV Service — repairs service */
async function getRepairs() {
    return supabaseClient
        .from('repair_overview')
        .select('*')
        .order('created_at', { ascending: false });
}

async function createRepair(payload) {
    return supabaseClient
        .from('repair_requests')
        .insert(payload)
        .select()
        .single();
}
