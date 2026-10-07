/* DAV Service — employees service */
async function getEmployees() {
    return supabaseClient
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');
}

async function createEmployeeAccount(fullName, email, password, role) {
    return supabaseClient.functions.invoke('create-employee', {
        body: { full_name: fullName, email, password, role }
    });
}

async function updateEmployeeRole(userId, role) {
    return supabaseClient.functions.invoke('update-employee-role', {
        body: { user_id: userId, role }
    });
}
