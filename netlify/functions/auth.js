const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const { action, email, password, name } = JSON.parse(event.body || '{}');

  try {
    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { statusCode: 401, headers, body: JSON.stringify({ error: error.message }) };
      // fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      return { statusCode: 200, headers, body: JSON.stringify({ token: data.session.access_token, user: { ...data.user, profile } }) };
    }

    if (action === 'register') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
      // create profile
      await supabase.from('profiles').insert({ id: data.user.id, name, email, role: 'admin' });
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.' }) };
    }

    if (action === 'me') {
      const token = (event.headers.authorization || '').replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token inválido' }) };
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return { statusCode: 200, headers, body: JSON.stringify({ user: { ...user, profile } }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação inválida' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
