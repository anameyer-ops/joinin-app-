exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Content-Type':'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body:'' };
  const SB = process.env.SUPABASE_URL, SK = process.env.SUPABASE_SERVICE_KEY;
  const token = (event.headers.authorization||'').replace('Bearer ','');
  async function getUser(){const r=await fetch(`${SB}/auth/v1/user`,{headers:{'apikey':SK,'Authorization':`Bearer ${token}`}});if(!r.ok)return null;return r.json();}
  async function sb(path,opts={}){const r=await fetch(`${SB}${path}`,{...opts,headers:{'apikey':SK,'Authorization':`Bearer ${SK}`,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}});return r.json();}
  const user=await getUser();
  if(!user)return{statusCode:401,headers,body:JSON.stringify({error:'Não autorizado'})};
  const id=event.queryStringParameters?.id;
  try{
    if(event.httpMethod==='GET'){const d=await sb(`/rest/v1/gestores?user_id=eq.${user.id}&select=*&order=nome`);return{statusCode:200,headers,body:JSON.stringify(d)};}
    if(event.httpMethod==='POST'){const b=JSON.parse(event.body);const d=await sb('/rest/v1/gestores',{method:'POST',body:JSON.stringify({...b,user_id:user.id})});return{statusCode:201,headers,body:JSON.stringify(Array.isArray(d)?d[0]:d)};}
    if(event.httpMethod==='PUT'){const b=JSON.parse(event.body);const d=await sb(`/rest/v1/gestores?id=eq.${id}&user_id=eq.${user.id}`,{method:'PATCH',body:JSON.stringify(b)});return{statusCode:200,headers,body:JSON.stringify(Array.isArray(d)?d[0]:d)};}
    if(event.httpMethod==='DELETE'){await sb(`/rest/v1/gestores?id=eq.${id}&user_id=eq.${user.id}`,{method:'DELETE'});return{statusCode:200,headers,body:JSON.stringify({ok:true})};}
  }catch(e){return{statusCode:500,headers,body:JSON.stringify({error:e.message})};}
};
