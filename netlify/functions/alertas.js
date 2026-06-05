exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body:'' };

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const RH_EMAILS = ['ana.meyer@joinin.com.br','raissa.gomes@joinin.com.br'];
  const { type, data } = JSON.parse(event.body || '{}');

  async function sendEmail(to, subject, html) {
    const r = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{'Authorization':`Bearer ${RESEND_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:'JoinIn People <noreply@joinin.com.br>', to, subject, html})
    });
    return r.json();
  }

  function base(title, content, cor='#04BFAD') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:'Segoe UI',sans-serif;background:#f4fafb;margin:0;padding:0}
    .wrap{max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(5,65,89,.1)}
    .hd{background:${cor};padding:28px 32px;color:#fff}.hd h1{margin:0;font-size:20px;font-weight:700}
    .hd p{margin:6px 0 0;opacity:.85;font-size:13px}.body{padding:28px 32px}
    .row{margin-bottom:14px;border-bottom:1px solid #eef4f6;padding-bottom:14px}.row:last-child{border-bottom:none}
    .lbl{font-size:10px;font-weight:600;color:#7fa4b4;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .val{font-size:13.5px;color:#0d2f3f;line-height:1.55}
    .badge{display:inline-block;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:600}
    .ok{background:#edf9f0;color:#2a7a40}.warn{background:#fff8ec;color:#a06800}.danger{background:#fef0ee;color:#b03020}
    .footer{background:#f4fafb;padding:14px 32px;font-size:10.5px;color:#7fa4b4;text-align:center}
    </style></head><body><div class="wrap">
    <div class="hd"><h1>🚀 JoinIn · People Intelligence</h1><p>${title}</p></div>
    <div class="body">${content}</div>
    <div class="footer">JoinIn Tecnologia · Sistema de RH · E-mail automático · LGPD compliant</div>
    </div></body></html>`;
  }

  function row(lbl, val) { return val ? `<div class="row"><div class="lbl">${lbl}</div><div class="val">${val}</div></div>` : ''; }

  try {
    // CHECKIN - risco alto ou NPS detrator
    if (type === 'checkin_alert') {
      const { colaborador, area, gestor, score, nps, bem, riscos, data_checkin } = data;
      if (riscos !== 'alto' && nps > 4) return { statusCode:200, headers, body:JSON.stringify({ok:true,sent:false}) };
      const cor = riscos === 'alto' ? '#E85C4A' : '#F5A623';
      const titulo = riscos === 'alto' ? `🚨 Risco Psicossocial Alto — ${colaborador}` : `📉 NPS Detrator — ${colaborador}`;
      const content = row('Colaborador',`<strong>${colaborador}</strong> · ${area}`) + row('Gestor(a)',gestor) + row('Data',data_checkin)
        + row('Score geral',`<strong>${score}</strong>/10`) + row('NPS',`<span class="badge ${nps>=9?'ok':nps>=7?'warn':'danger'}">${nps} · ${nps>=9?'Promotor':nps>=7?'Neutro':'Detrator'}</span>`)
        + row('Bem-estar',`<span class="badge ${bem>=7?'ok':bem>=6?'warn':'danger'}">${Number(bem).toFixed(1)}/10</span>`)
        + row('Risco NR-1',`<span class="badge ${riscos==='alto'?'danger':riscos==='medio'?'warn':'ok'}">${riscos.toUpperCase()}</span>`)
        + `<div class="row" style="background:#fff8ec;border-radius:8px;padding:10px;margin-top:8px">⚠️ <strong>Ação recomendada:</strong> Agende um 1:1 nos próximos 3 dias úteis.</div>`;
      await sendEmail(RH_EMAILS, titulo, base(titulo, content, cor));
      return { statusCode:200, headers, body:JSON.stringify({ok:true,sent:true}) };
    }

    // PRAZO 40/45/90 dias
    if (type === 'prazo_alert') {
      const { colaborador, cargo, area, gestor, gestor_email, dias, admissao } = data;
      const titulo = `📅 Check-in de ${dias} dias — ${colaborador}`;
      const content = row('Colaborador',`<strong>${colaborador}</strong>`) + row('Cargo / Área',`${cargo} · ${area}`)
        + row('Gestor(a)',gestor) + row('Admissão',admissao)
        + row('Marco',`<span class="badge warn">${dias} dias na empresa</span>`)
        + `<div class="row" style="background:#fff8ec;border-radius:8px;padding:10px;margin-top:8px">📋 <strong>Ação:</strong> Realize o check-in de <strong>${dias} dias</strong> com este colaborador.</div>`;
      const destinos = [...new Set([...RH_EMAILS, gestor_email].filter(Boolean))];
      await sendEmail(destinos, titulo, base(titulo, content, '#054159'));
      return { statusCode:200, headers, body:JSON.stringify({ok:true,sent:true}) };
    }

    // FEEDBACK PREENCHIDO
    if (type === 'feedback_preenchido') {
      const { colaborador, area, gestor, data_fb, indicadores, comportamento, pontos_atencao, impacto, comportamentos_manter, plano_acao } = data;
      const titulo = `📝 Feedback preenchido — ${colaborador}`;
      const content = row('Colaborador',`<strong>${colaborador}</strong> · ${area}`) + row('Gestor(a)',gestor) + row('Data',data_fb)
        + (indicadores ? row('1. Indicadores / Desempenho', indicadores) : '')
        + (comportamento ? row('2. Comportamento', comportamento) : '')
        + (pontos_atencao ? row('3. Pontos de atenção', pontos_atencao) : '')
        + (impacto ? row('4. Impacto das situações', impacto) : '')
        + (comportamentos_manter ? row('Comportamentos a manter', comportamentos_manter) : '')
        + (plano_acao ? row('Plano de ação', plano_acao) : '');
      await sendEmail(RH_EMAILS, titulo, base(titulo, content, '#7F77DD'));
      return { statusCode:200, headers, body:JSON.stringify({ok:true,sent:true}) };
    }

    // PDI PREENCHIDO
    if (type === 'pdi_preenchido') {
      const { colaborador, area, gestor, data_pdi, objetivo, diagnostico, metas, acoes } = data;
      const titulo = `🎯 PDI preenchido — ${colaborador}`;
      const acoesHtml = (acoes||[]).length
        ? `<div style="display:flex;flex-direction:column;gap:5px">${acoes.map(a=>`<div style="background:#f4fafb;border-radius:6px;padding:7px;font-size:12px"><strong>${a.competencia||'—'}</strong>: ${a.acao||'—'} · Prazo: ${a.prazo||'—'}</div>`).join('')}</div>` : '';
      const content = row('Colaborador',`<strong>${colaborador}</strong> · ${area}`) + row('Gestor(a)',gestor) + row('Data',data_pdi)
        + (objetivo ? row('Objetivo', objetivo) : '') + (diagnostico ? row('Diagnóstico', diagnostico) : '')
        + (metas ? row('Metas', metas) : '') + (acoesHtml ? row(`Plano de ação (${(acoes||[]).length} ações)`, acoesHtml) : '');
      await sendEmail(RH_EMAILS, titulo, base(titulo, content, '#04BFAD'));
      return { statusCode:200, headers, body:JSON.stringify({ok:true,sent:true}) };
    }

    return { statusCode:400, headers, body:JSON.stringify({error:'Tipo inválido'}) };
  } catch(e) {
    return { statusCode:500, headers, body:JSON.stringify({error:e.message}) };
  }
};
