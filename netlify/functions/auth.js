exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const { action, email, password, name, role } = JSON.parse(event.body || '{}');

  async function sbFetch(path, opts = {}) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      ...opts,
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    return res.json();
  }

  try {
    if (action === 'login') {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: data.error_description || 'Credenciais inválidas' }) };
      const profiles = await sbFetch(`/rest/v1/profiles?id=eq.${data.user.id}&select=*`);
      return { statusCode: 200, headers, body: JSON.stringify({ token: data.access_token, user: { ...data.user, profile: profiles[0] } }) };
    }

    if (action === 'register') {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ email, password, data: { name } })
      });
      const data = await res.json();
      if (!res.ok) return { statusCode: 400, headers, body: JSON.stringify({ error: data.error_description || 'Erro ao cadastrar' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Conta criada! Faça login.' }) };
    }

    if (action === 'me') {
      const token = (event.headers.authorization || '').replace('Bearer ', '');
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token inválido' }) };
      const profiles = await sbFetch(`/rest/v1/profiles?id=eq.${data.id}&select=*`);
      return { statusCode: 200, headers, body: JSON.stringify({ user: { ...data, profile: profiles[0] } }) };
    }

    if (action === 'create_gestor_user') {
      const token = (event.headers.authorization || '').replace('Bearer ', '');
      const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      const me = await meRes.json();
      if (!meRes.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autorizado' }) };
      const myProfile = await sbFetch(`/rest/v1/profiles?id=eq.${me.id}&select=role`);
      if (!myProfile[0] || myProfile[0].role !== 'admin')
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Apenas admins podem criar gestores' }) };

      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } })
      });
      const created = await createRes.json();
      if (!createRes.ok) return { statusCode: 400, headers, body: JSON.stringify({ error: created.message || 'Erro ao criar usuário' }) };

      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${created.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'gestor', name, email })
      });

      return { statusCode: 200, headers, body: JSON.stringify({ user_id: created.id, message: 'Gestor criado com acesso.' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação inválida' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
