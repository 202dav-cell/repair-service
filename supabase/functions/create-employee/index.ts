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
      return json({ error: "Недостаточно прав. Только администратор может создавать сотрудников." }, 403);
    }

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const requestedRole = String(body.role || "").trim();

    const roleMap: Record<string, string> = {
      ADMIN: "ADMIN",
      admin: "ADMIN",
      master: "master",
      MASTER: "master",
      repairman: "master",
      REPAIRMAN: "master",
      reception: "reception",
      RECEPTION: "reception"
    };

    const role = roleMap[requestedRole] || "";
    if (fullName.length < 2) return json({ error: "Укажите ФИО сотрудника." }, 400);
    if (!email || !email.includes("@")) return json({ error: "Укажите корректный email." }, 400);
    if (password.length < 6) return json({ error: "Пароль должен содержать минимум 6 символов." }, 400);
    if (!role) return json({ error: "Недопустимый уровень доступа." }, 400);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      return json({ error: createError?.message || "Не удалось создать пользователя." }, 400);
    }

    const { data: profile, error: insertError } = await adminClient
      .from("profiles")
      .insert({ id: created.user.id, full_name: fullName, role })
      .select("id, full_name, role")
      .single();

    if (insertError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: "Пользователь создан, но профиль не создан: " + insertError.message }, 500);
    }

    return json({ data: { profile } }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Внутренняя ошибка сервера." }, 500);
  }
});
