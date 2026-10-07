import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Метод запроса не поддерживается." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse({ error: "Необходима авторизация." }, 401);
    }

    const token = authorization.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        { error: "Не настроены переменные окружения Supabase." },
        500
      );
    }

    const authClient = createClient(supabaseUrl, anonKey);

    const {
      data: userData,
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return jsonResponse({ error: "Недействительная сессия." }, 401);
    }

    const currentUser = userData.user;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (
      adminProfileError ||
      String(adminProfile?.role || "").toUpperCase() !== "ADMIN"
    ) {
      return jsonResponse(
        {
          error:
            "Недостаточно прав. Только администратор может управлять сотрудниками.",
        },
        403
      );
    }

    const body = await req.json();
    const action = String(body.action || "update").trim();
    const userId = String(body.user_id || "").trim();

    if (!userId) {
      return jsonResponse({ error: "Не указан сотрудник." }, 400);
    }

    if (action === "get") {
      const {
        data: authResult,
        error: authError,
      } = await adminClient.auth.admin.getUserById(userId);

      if (authError || !authResult?.user) {
        return jsonResponse(
          {
            error:
              authError?.message || "Пользователь Auth не найден.",
          },
          404
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await adminClient
        .from("profiles")
        .select("id, full_name, role, social_networks")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return jsonResponse(
          {
            error:
              profileError?.message || "Профиль сотрудника не найден.",
          },
          404
        );
      }

      return jsonResponse({
        data: {
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role,
          social_networks: profile.social_networks,
          email: authResult.user.email || "",
        },
      });
    }

    const requestedRole = String(body.role || "").trim();

    const roleMap: Record<string, string> = {
      ADMIN: "ADMIN",
      admin: "ADMIN",
      master: "MASTER",
      MASTER: "MASTER",
      repairman: "MASTER",
      REPAIRMAN: "MASTER",
      reception: "RECEPTION",
      RECEPTION: "RECEPTION",
    };

    const role = roleMap[requestedRole] || "";

    if (!role) {
      return jsonResponse(
        {
          error: "Недопустимый уровень доступа: " + requestedRole,
        },
        400
      );
    }

    if (userId === currentUser.id && role !== "ADMIN") {
      return jsonResponse(
        {
          error:
            "Нельзя снять права администратора с собственной учетной записи.",
        },
        400
      );
    }

    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const socialNetworks = String(body.social_networks || "").trim();

    if (fullName.length < 2) {
      return jsonResponse({ error: "Укажите ФИО сотрудника." }, 400);
    }

    if (!email || !email.includes("@")) {
      return jsonResponse({ error: "Укажите корректный email." }, 400);
    }

    if (password && password.length < 6) {
      return jsonResponse(
        { error: "Новый пароль должен содержать минимум 6 символов." },
        400
      );
    }

    const authAttributes: Record<string, unknown> = {
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    };

    if (password) {
      authAttributes.password = password;
    }

    const {
      data: updatedAuth,
      error: authUpdateError,
    } = await adminClient.auth.admin.updateUserById(
      userId,
      authAttributes
    );

    if (authUpdateError || !updatedAuth?.user) {
      return jsonResponse(
        {
          error:
            authUpdateError?.message ||
            "Не удалось изменить данные учетной записи.",
        },
        400
      );
    }

    const {
      data: profile,
      error: profileUpdateError,
    } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        social_networks: socialNetworks || null,
      })
      .eq("id", userId)
      .select("id, full_name, role, social_networks")
      .single();

    if (profileUpdateError || !profile) {
      return jsonResponse(
        {
          error:
            profileUpdateError?.message ||
            "Учетная запись обновлена, но профиль сотрудника не удалось обновить.",
        },
        400
      );
    }

    return jsonResponse({
      data: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        social_networks: profile.social_networks,
        email: updatedAuth.user.email || email,
      },
      message: "Данные сотрудника сохранены.",
    });
  } catch (error) {
    console.error("update-employee-role error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Внутренняя ошибка сервера.",
      },
      500
    );
  }
});
