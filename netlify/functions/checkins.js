exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Content-Type':'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body:'' };
  const SB=process.env.SUPABASE_URL, SK=process.env.SUPABASE_SERVICE_KEY;
  const token=(event.headers.authorization||'').replace('Bearer ','');
  async function getUser(){const r=await fetch(`${SB}/auth/v1/user`,{headers:{'apikey':SK,'Authorization':`Bearer ${token}`}});if(!r.ok)return null;return r.json();}
  async function sb(path,opts={}){const r=await fetch(`${SB}${path}`,{...opts,headers:{'apikey':SK,'Authorization':`Bearer ${SK}`,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}});return r.json();}
  const user=await getUser();
  if(!user)return{statusCode:401,headers,body:JSON.stringify({error:'Não autorizado'})};
  const profile=await sb(`/rest/v1/profiles?id=eq.${user.id}&select=role,gestor_id`);
  const role=profile[0]?.role||'admin', gestor_id=profile[0]?.gestor_id;
  const id=event.queryStringParameters?.id, colaborador_id=event.queryStringParameters?.colaborador_id;
  try{
    if(event.httpMethod==='GET'){
      let base,filter='';
      if(role==='gestor'&&gestor_id){
        const colab=await sb(`/rest/v1/colaboradores?user_id=eq.${user.id}&gestor_id=eq.${gestor_id}&select=id`);
        const ids=colab.map(c=>c.id);
        if(!ids.length)return{statusCode:200,headers,body:JSON.stringify([])};
        base=`colaborador_id=in.(${ids.join(',')})`;
      }else{base=`user_id=eq.${user.id}`;}
      if(colaborador_id)filter=`&colaborador_id=eq.${colaborador_id}`;
      const path=`/rest/v1/checkins?${base}${filter}&select=*,colaboradores(nome,cargo,area,admissao,modalidade,status,gestores(nome))&order=data.desc`;
      const d=await sb(id?`/rest/v1/checkins?id=eq.${id}&select=*`:path);
      return{statusCode:200,headers,body:JSON.stringify(id?d[0]:d)};
    }
    if(event.httpMethod==='POST'){const b=JSON.parse(event.body);const d=await sb('/rest/v1/checkins',{method:'POST',body:JSON.stringify({...b,user_id:user.id})});return{statusCode:201,headers,body:JSON.stringify(Array.isArray(d)?d[0]:d)};}
    if(event.httpMethod==='DELETE'){await sb(`/rest/v1/checkins?id=eq.${id}&user_id=eq.${user.id}`,{method:'DELETE'});return{statusCode:200,headers,body:JSON.stringify({ok:true})};}
  }catch(e){return{statusCode:500,headers,body:JSON.stringify({error:e.message})};}
};
