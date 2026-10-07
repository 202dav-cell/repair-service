/* DAV Service — employees service */
async function getEmployees() {
    return supabaseClient
        .from('profiles')
        .select('id, full_name, role, social_networks')
        .order('full_name');
}

async function createEmployeeAccount(fullName, email, password, role, socialNetworks) {
    return supabaseClient.functions.invoke('create-employee', {
        body: {
            full_name: fullName,
            email,
            password,
            role,
            social_networks: socialNetworks || ''
        }
    });
}

async function updateEmployeeRole(userId, role) {
    return supabaseClient.functions.invoke('update-employee-role', {
        body: { user_id: userId, role }
    });
}
