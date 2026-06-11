const { createClient } = require('@supabase/supabase-js');
const APPLICATION_LIMIT = 30;

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error('Supabase environment variables are missing.');
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function normalizeApplication(body = {}) {
  return {
    company_name: String(body.companyName || '').trim(),
    attendee1_name: String(body.attendee1Name || '').trim(),
    attendee1_role: String(body.attendee1Role || '').trim(),
    attendee1_email: String(body.attendee1Email || '').trim(),
    attendee1_phone: String(body.attendee1Phone || '').trim(),
    attendee2_name: String(body.attendee2Name || '').trim() || null,
    attendee2_role: String(body.attendee2Role || '').trim() || null,
    selected_projects: Array.isArray(body.projects) ? body.projects.map(String) : [],
    meetup_status: body.meetup === 'Y' ? 'Y' : body.meetup === 'N' ? 'N' : ''
  };
}

function validate(application) {
  if (!application.company_name || !application.attendee1_name || !application.attendee1_role || !application.attendee1_phone) {
    return '필수 입력 항목을 모두 입력해 주세요.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.attendee1_email)) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }
  if (!application.selected_projects.length) return '관심 연구과제를 한 개 이상 선택해 주세요.';
  if (!application.meetup_status) return '1:1 밋업 참여 여부를 선택해 주세요.';
  return null;
}

module.exports = async function handler(request, response) {
  try {
    const supabase = getSupabase();

    if (request.method === 'POST') {
      const application = normalizeApplication(request.body);
      const validationError = validate(application);
      if (validationError) return json(response, 400, { error: validationError });

      const { count, error: countError } = await supabase
        .from('event_applications')
        .select('id', { count: 'exact', head: true });
      if (countError) throw countError;
      if ((count || 0) >= APPLICATION_LIMIT) {
        return json(response, 429, {
          code: 'APPLICATION_CLOSED',
          error: '신청 접수가 마감되었습니다.'
        });
      }

      const { error } = await supabase.from('event_applications').insert(application);
      if (error) throw error;
      return json(response, 201, { ok: true });
    }

    if (request.method === 'GET') {
      const password = request.headers['x-admin-password'];
      if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return json(response, 401, { error: '관리자 인증에 실패했습니다.' });
      }

      const { data, error } = await supabase
        .from('event_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(response, 200, { applications: data });
    }

    if (request.method === 'DELETE') {
      const password = request.headers['x-admin-password'];
      if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return json(response, 401, { error: '관리자 인증에 실패했습니다.' });
      }

      const ids = Array.isArray(request.body?.ids)
        ? request.body.ids.map(Number).filter(Number.isSafeInteger)
        : [];
      if (!ids.length) return json(response, 400, { error: '삭제할 신청을 선택해 주세요.' });

      const { error } = await supabase.from('event_applications').delete().in('id', ids);
      if (error) throw error;
      return json(response, 200, { ok: true, deleted: ids.length });
    }

    response.setHeader('Allow', 'GET, POST, DELETE');
    return json(response, 405, { error: '지원하지 않는 요청입니다.' });
  } catch (error) {
    console.error('applications API error', error);
    return json(response, 500, { error: '서버 처리 중 오류가 발생했습니다.' });
  }
};
