exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Content-Type':'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body:'' };
  const SB=process.env.SUPABASE_URL, SK=process.env.SUPABASE_SERVICE_KEY;
  const token=(event.headers.authorization||'').replace('Bearer ','');
  async function getUser(){const r=await fetch(`${SB}/auth/v1/user`,{headers:{'apikey':SK,'Authorization':`Bearer ${token}`}});if(!r.ok)return null;return r.json();}
  async function sb(path,opts={}){const r=await fetch(`${SB}${path}`,{...opts,headers:{'apikey':SK,'Authorization':`Bearer ${SK}`,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}});return r.json();}
  const user=await getUser();
  if(!user)return{statusCode:401,headers,body:JSON.stringify({error:'Não autorizado'})};
  const profile=await sb(`/rest/v1/profiles?id=eq.${user.id}&select=role,gestor_id`);
  const role=profile[0]?.role||'admin', gestor_id=profile[0]?.gestor_id;
  const id=event.queryStringParameters?.id, bulk=event.queryStringParameters?.bulk==='true';
  try{
    if(event.httpMethod==='GET'){
      const path=role==='gestor'&&gestor_id
        ?`/rest/v1/colaboradores?user_id=eq.${user.id}&gestor_id=eq.${gestor_id}&select=*,gestores(nome,area)&order=nome`
        :`/rest/v1/colaboradores?user_id=eq.${user.id}&select=*,gestores(nome,area)&order=nome`;
      const d=await sb(path);return{statusCode:200,headers,body:JSON.stringify(d)};
    }
    if(event.httpMethod==='POST'){
      if(bulk){const{rows}=JSON.parse(event.body);const d=await sb('/rest/v1/colaboradores',{method:'POST',body:JSON.stringify(rows.map(r=>({...r,user_id:user.id})))});return{statusCode:201,headers,body:JSON.stringify({inserted:Array.isArray(d)?d.length:1})};}
      const b=JSON.parse(event.body);const d=await sb('/rest/v1/colaboradores',{method:'POST',body:JSON.stringify({...b,user_id:user.id})});return{statusCode:201,headers,body:JSON.stringify(Array.isArray(d)?d[0]:d)};
    }
    if(event.httpMethod==='PUT'){const b=JSON.parse(event.body);const d=await sb(`/rest/v1/colaboradores?id=eq.${id}&user_id=eq.${user.id}`,{method:'PATCH',body:JSON.stringify(b)});return{statusCode:200,headers,body:JSON.stringify(Array.isArray(d)?d[0]:d)};}
    if(event.httpMethod==='DELETE'){await sb(`/rest/v1/colaboradores?id=eq.${id}&user_id=eq.${user.id}`,{method:'DELETE'});return{statusCode:200,headers,body:JSON.stringify({ok:true})};}
  }catch(e){return{statusCode:500,headers,body:JSON.stringify({error:e.message})};}
};
