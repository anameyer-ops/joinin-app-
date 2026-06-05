const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

async function getUser(event) {
  const token = (event.headers.authorization || '').replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const user = await getUser(event);
  if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autorizado' }) };

  const id = event.queryStringParameters?.id;
  const colaboradorId = event.queryStringParameters?.colaborador_id;

  try {
    if (event.httpMethod === 'GET') {
      let query = supabase
        .from('checkins')
        .select(`
          *,
          colaboradores(nome, cargo, area, admissao, modalidade, status, gestores(nome))
        `)
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (colaboradorId) query = query.eq('colaborador_id', colaboradorId);
      if (id) query = query.eq('id', id).single();

      const { data, error } = await query;
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { data, error } = await supabase
        .from('checkins')
        .insert({ ...body, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return { statusCode: 201, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'DELETE') {
      const { error } = await supabase.from('checkins').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
