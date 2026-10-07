import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Необходима авторизация." }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) return json({ error: "Недействительная сессия." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || String(adminProfile?.role || "").toUpperCase() !== "ADMIN") {
      return json({ error: "Недостаточно прав." }, 403);
    }

    const body = await req.json();
    const userId = String(body.user_id || "");
    const role = String(body.role || "").toUpperCase();
    const allowedRoles = new Set(["ADMIN", "REPAIRMAN", "RECEPTION"]);

    if (!userId) return json({ error: "Не указан сотрудник." }, 400);
    if (!allowedRoles.has(role)) return json({ error: "Недопустимый уровень доступа." }, 400);
    if (userId === user.id && role !== "ADMIN") {
      return json({ error: "Нельзя снять права администратора с собственной учетной записи." }, 400);
    }

    const { data: profile, error: updateError } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select("id, full_name, role")
      .single();

    if (updateError) return json({ error: updateError.message }, 400);
    return json({ data: profile });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Внутренняя ошибка сервера." }, 500);
  }
});
