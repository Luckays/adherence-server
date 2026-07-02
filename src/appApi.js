import { getQuestionnaireByCode, getQuestionnaireCatalog } from "./questionnaires.js";
import { buildRoundExportResponse, getRoundExportDefinition as getRoundExportDefinitionV2 } from "./roundExport.js";

const SESSION_COOKIE = "patient_questionnaire_session";
const DOCTOR_PORTAL_COOKIE = "doctor_portal_session";
const SESSION_MAX_AGE = 60 * 60 * 12;
const PASSWORD_ITERATIONS = 100000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (error) {
        console.error("Unhandled API error", error);
        return json(
          {
            error: "server_error",
            message: "Neočekávaná chyba serveru."
          },
          500
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};

export { handleApi };

async function handleApi(request, env, url) {
  if (url.pathname === "/api/health" && request.method === "GET") {
    return json({ ok: true, date: new Date().toISOString() });
  }

  if (url.pathname === "/api/setup/bootstrap" && request.method === "POST") {
    return bootstrapAdmin(request, env);
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    return login(request, env);
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return logout(request, env);
  }

  if (url.pathname === "/api/doctor-portal/login" && request.method === "POST") {
    return doctorPortalLogin(request, env);
  }

  if (url.pathname === "/api/doctor-portal/logout" && request.method === "POST") {
    return doctorPortalLogout(request, env);
  }

  if (url.pathname.startsWith("/api/doctor-portal/")) {
    const doctorSession = await requireDoctorPortalSession(request, env);
    if (!doctorSession) {
      return json({ error: "unauthorized" }, 401);
    }

    if (url.pathname === "/api/doctor-portal/me" && request.method === "GET") {
      return json({ user: doctorSession.user });
    }

    if (url.pathname === "/api/doctor-portal/patient-lookup" && request.method === "POST") {
      return doctorPortalPatientLookup(request, env, doctorSession.user);
    }

    if (url.pathname === "/api/doctor-portal/questionnaires" && request.method === "GET") {
      return json({ items: getQuestionnaireCatalog().filter(isDoctorPortalQuestionnaire) });
    }

    const doctorPatientSubmissionsMatch = url.pathname.match(/^\/api\/doctor-portal\/patients\/(\d+)\/submissions$/);
    if (doctorPatientSubmissionsMatch && request.method === "GET") {
      return listDoctorPatientSubmissions(env, Number(doctorPatientSubmissionsMatch[1]), doctorSession.user);
    }

    if (doctorPatientSubmissionsMatch && request.method === "POST") {
      return createSubmission(request, env, doctorSession.user, Number(doctorPatientSubmissionsMatch[1]), "doctor");
    }

    const doctorSubmissionMatch = url.pathname.match(/^\/api\/doctor-portal\/submissions\/(\d+)$/);
    if (doctorSubmissionMatch && request.method === "GET") {
      return getSubmission(env, Number(doctorSubmissionMatch[1]), "doctor", doctorSession.user);
    }

    if (doctorSubmissionMatch && request.method === "PUT") {
      return updateSubmission(request, env, doctorSession.user, Number(doctorSubmissionMatch[1]), "doctor");
    }
  }

  const session = await requireSession(request, env);
  if (!session) {
    return json({ error: "unauthorized" }, 401);
  }

  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    return json({ user: session.user });
  }

  if (url.pathname === "/api/questionnaires" && request.method === "GET") {
    return json({ items: getQuestionnaireCatalog() });
  }

  const exportMatch = url.pathname.match(/^\/api\/exports\/full\.(txt|csv)$/);
  if (exportMatch && request.method === "GET") {
    if (session.user.role !== "admin") {
      return json({ error: "forbidden" }, 403);
    }
    return exportQuestionnaireAnswerData(env, session.user, exportMatch[1]);
  }

  const roundExportMatch = url.pathname.match(/^\/api\/exports\/(kolo1|kolo2)\.csv$/);
  if (roundExportMatch && request.method === "GET") {
    if (!["admin", "editor"].includes(session.user.role)) {
      return json({ error: "forbidden" }, 403);
    }
    return exportRoundWorkbook(env, session.user, roundExportMatch[1]);
  }

  if (url.pathname === "/api/admin/backup-export" && request.method === "POST") {
    if (session.user.role !== "admin") {
      return json({ error: "forbidden" }, 403);
    }
    return exportDatabaseBackup(env, session.user);
  }

  if (url.pathname === "/api/admin/users" && request.method === "GET") {
    if (session.user.role !== "admin") {
      return json({ error: "forbidden" }, 403);
    }
    return listUsers(env);
  }

  if (url.pathname === "/api/admin/users" && request.method === "POST") {
    if (session.user.role !== "admin") {
      return json({ error: "forbidden" }, 403);
    }
    return createUser(request, env, session.user);
  }

  const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/(internal|doctor)\/(\d+)$/);
  if (adminUserMatch && request.method === "DELETE") {
    if (session.user.role !== "admin") {
      return json({ error: "forbidden" }, 403);
    }
    return deleteUser(env, session.user, adminUserMatch[1], Number(adminUserMatch[2]));
  }

  const questionnaireMatch = url.pathname.match(/^\/api\/questionnaires\/([^/]+)$/);
  if (questionnaireMatch && request.method === "GET") {
    const questionnaire = getQuestionnaireByCode(decodeURIComponent(questionnaireMatch[1]));
    if (!questionnaire) {
      return json({ error: "not_found" }, 404);
    }
    return json({ item: questionnaire });
  }

  if (url.pathname === "/api/patients" && request.method === "GET") {
    return listPatients(env, url);
  }

  if (url.pathname === "/api/patients" && request.method === "POST") {
    return createPatient(request, env, session.user);
  }

  const patientMatch = url.pathname.match(/^\/api\/patients\/(\d+)$/);
  if (patientMatch && request.method === "GET") {
    return getPatient(env, Number(patientMatch[1]));
  }

  if (patientMatch && request.method === "DELETE") {
    return deletePatient(env, session.user, Number(patientMatch[1]));
  }

  const patientSubmissionsMatch = url.pathname.match(/^\/api\/patients\/(\d+)\/submissions$/);
  if (patientSubmissionsMatch && request.method === "GET") {
    return listPatientSubmissions(env, Number(patientSubmissionsMatch[1]));
  }

  if (patientSubmissionsMatch && request.method === "POST") {
    return createSubmission(request, env, session.user, Number(patientSubmissionsMatch[1]));
  }

  const submissionMatch = url.pathname.match(/^\/api\/submissions\/(\d+)$/);
  if (submissionMatch && request.method === "GET") {
    return getSubmission(env, Number(submissionMatch[1]));
  }

  if (submissionMatch && request.method === "PUT") {
    return updateSubmission(request, env, session.user, Number(submissionMatch[1]));
  }

  if (submissionMatch && request.method === "DELETE") {
    return deleteSubmission(env, session.user, Number(submissionMatch[1]));
  }

  return json({ error: "not_found" }, 404);
}

async function bootstrapAdmin(request, env) {
  const body = await readJson(request);
  if (!body?.setupToken || body.setupToken !== env.BOOTSTRAP_SETUP_TOKEN) {
    return json({ error: "forbidden" }, 403);
  }

  const existing = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  if ((existing?.count ?? 0) > 0) {
    return json({ error: "bootstrap_already_completed" }, 409);
  }

  const loginId = String(body.loginId ?? body.email ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!loginId || password.length < 10) {
    return json({ error: "validation_error", message: "Login ID a heslo alespoň 10 znaků." }, 400);
  }

  const passwordHash = await createPasswordHash(password);
  await env.DB.prepare(
    "INSERT INTO users (email, login_id, password_hash, role) VALUES (?, ?, ?, 'admin')"
  )
    .bind(email || null, loginId, passwordHash)
    .run();

  return json({ ok: true });
}

async function login(request, env) {
  const body = await readJson(request);
  const loginId = String(body?.loginId ?? body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const user = await env.DB.prepare(
    "SELECT id, email, login_id, password_hash, role, is_active FROM users WHERE login_id = ? OR email = ? LIMIT 1"
  )
    .bind(loginId, loginId)
    .first();

  if (!user || !user.is_active) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const token = createSessionToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO user_sessions (user_id, session_token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      user.id,
      tokenHash,
      expiresAt,
      request.headers.get("CF-Connecting-IP"),
      request.headers.get("User-Agent")
    )
    .run();

  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", buildSessionCookie(token));
  return new Response(JSON.stringify({ user: sanitizeUser(user) }), { status: 200, headers });
}

async function logout(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM user_sessions WHERE session_token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", clearSessionCookie());
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function doctorPortalLogin(request, env) {
  const body = await readJson(request);
  const loginId = String(body?.loginId ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!loginId || !password) {
    return json({ error: "validation_error", message: "Zadejte zdravotnické ID a heslo." }, 400);
  }

  const doctor = await env.DB.prepare(
    `SELECT id, login_id, password_hash, is_active
     FROM doctor_accounts
     WHERE login_id = ?
     LIMIT 1`
  )
    .bind(loginId)
    .first();

  if (!doctor || !doctor.is_active) {
    return json({ error: "invalid_credentials", message: "Neplatné zdravotnické ID nebo heslo." }, 401);
  }

  const isValid = await verifyPassword(password, doctor.password_hash);
  if (!isValid) {
    return json({ error: "invalid_credentials", message: "Neplatné zdravotnické ID nebo heslo." }, 401);
  }

  const token = createSessionToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO doctor_portal_sessions (doctor_account_id, session_token_hash, expires_at) VALUES (?, ?, ?)"
  )
    .bind(doctor.id, tokenHash, expiresAt)
    .run();

  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", buildDoctorPortalCookie(token));
  return new Response(JSON.stringify({ user: sanitizeDoctorUser(doctor) }), {
    status: 200,
    headers
  });
}

async function doctorPortalLogout(request, env) {
  const token = readCookie(request, DOCTOR_PORTAL_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM doctor_portal_sessions WHERE session_token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", clearDoctorPortalCookie());
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function requireSession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(
    `SELECT
      s.id,
      s.expires_at,
      u.id AS user_id,
      u.email,
      u.login_id,
      u.role,
      u.is_active
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token_hash = ?
    LIMIT 1`
  )
    .bind(tokenHash)
    .first();

  if (!session || !session.is_active) {
    return null;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM user_sessions WHERE id = ?").bind(session.id).run();
    return null;
  }

  await env.DB.prepare("UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(session.id)
    .run();

  return {
    user: {
      id: session.user_id,
      email: session.email,
      login_id: session.login_id,
      role: session.role
    }
  };
}

async function requireDoctorPortalSession(request, env) {
  const token = readCookie(request, DOCTOR_PORTAL_COOKIE);
  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(
    `SELECT
      s.id,
      s.expires_at,
      d.id AS doctor_id,
      d.login_id,
      d.is_active
    FROM doctor_portal_sessions s
    JOIN doctor_accounts d ON d.id = s.doctor_account_id
    WHERE s.session_token_hash = ?
    LIMIT 1`
  )
    .bind(tokenHash)
    .first();

  if (!session || !session.is_active) {
    return null;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM doctor_portal_sessions WHERE id = ?").bind(session.id).run();
    return null;
  }

  await env.DB.prepare("UPDATE doctor_portal_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(session.id)
    .run();

  return {
    user: {
      id: session.doctor_id,
      login_id: session.login_id,
      role: "doctor"
    }
  };
}

async function listPatients(env, url) {
  const query = (url.searchParams.get("query") ?? "").trim();
  const search = query ? `%${query.toLowerCase()}%` : "%";

  const result = await env.DB.prepare(
    `SELECT
      p.id,
      p.noveid,
      p.notes,
      p.updated_at,
      COALESCE(COUNT(s.id), 0) AS submission_count,
      COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
      COALESCE(SUM(CASE WHEN s.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_count,
      MAX(s.updated_at) AS last_submission_at
    FROM patients p
    LEFT JOIN questionnaire_submissions s ON s.patient_id = p.id
    WHERE
      LOWER(COALESCE(p.noveid, '')) LIKE ?
    GROUP BY p.id
    ORDER BY COALESCE(MAX(s.updated_at), p.updated_at) DESC, p.noveid ASC
    LIMIT 50`
  )
    .bind(search)
    .all();

  const items = result.results ?? [];
  for (const patient of items) {
    const submissions = await env.DB.prepare(
      `SELECT questionnaire_code, questionnaire_title, status, updated_at, evaluation_slot
       FROM questionnaire_submissions
       WHERE patient_id = ?
       ORDER BY updated_at DESC`
    )
      .bind(patient.id)
      .all();

    patient.form_summaries = summarizePatientForms(submissions.results ?? []);
  }

  return json({ items });
}

async function createPatient(request, env, user) {
  const body = await readJson(request);
  const noveid = String(body.noveid ?? "").trim();

  if (!noveid) {
    return json({ error: "validation_error", message: "Pole noveid je povinné." }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO patients (noveid, notes) VALUES (?, ?)`
  )
    .bind(noveid, normalizeNullable(body.notes))
    .run();

  await logAudit(env, user.id, "patient", Number(result.meta.last_row_id), "create", body);
  return getPatient(env, Number(result.meta.last_row_id));
}

async function getPatient(env, patientId) {
  const patient = await env.DB.prepare("SELECT * FROM patients WHERE id = ? LIMIT 1")
    .bind(patientId)
    .first();

  if (!patient) {
    return json({ error: "not_found" }, 404);
  }

  const summary = await env.DB.prepare(
    `SELECT
      COUNT(*) AS submission_count,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
      COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_count,
      MAX(updated_at) AS last_submission_at
    FROM questionnaire_submissions
    WHERE patient_id = ?`
  )
    .bind(patientId)
    .first();

  return json({ patient, summary });
}

async function deletePatient(env, user, patientId) {
  const patient = await env.DB.prepare("SELECT id, noveid FROM patients WHERE id = ? LIMIT 1")
    .bind(patientId)
    .first();

  if (!patient) {
    return json({ error: "not_found" }, 404);
  }

  const submissionIds = await env.DB.prepare(
    "SELECT id FROM questionnaire_submissions WHERE patient_id = ?"
  )
    .bind(patientId)
    .all();

  await env.DB.prepare("DELETE FROM questionnaire_submissions WHERE patient_id = ?")
    .bind(patientId)
    .run();
  await env.DB.prepare("DELETE FROM patients WHERE id = ?")
    .bind(patientId)
    .run();

  const removedSubmissionIds = (submissionIds.results ?? []).map((item) => Number(item.id));
  await logAudit(env, user.id, "patient", patientId, "delete", {
    noveid: patient.noveid,
    removedSubmissionIds
  });

  return json({ ok: true });
}

async function listPatientSubmissions(env, patientId) {
  const rows = await env.DB.prepare(
    `SELECT
      id,
      questionnaire_code,
      questionnaire_title,
      questionnaire_version,
      round_key,
      form_key,
      form_order,
      evaluation_slot,
      inhaler_slot,
      status,
      answers_json,
      started_at,
      completed_at,
      updated_at
    FROM questionnaire_submissions
    WHERE patient_id = ?
    ORDER BY updated_at DESC`
  )
    .bind(patientId)
    .all();

  return json({
    items: (rows.results ?? []).map((row) => ({
      ...row,
      answers: safeJsonParse(row.answers_json, {})
    }))
  });
}

async function listDoctorPatientSubmissions(env, patientId, user) {
  const rows = await env.DB.prepare(
    `SELECT
      id,
      questionnaire_code,
      questionnaire_title,
      questionnaire_version,
      round_key,
      form_key,
      form_order,
      evaluation_slot,
      inhaler_slot,
      status,
      answers_json,
      started_at,
      completed_at,
      updated_at
    FROM questionnaire_submissions
    WHERE patient_id = ? AND form_key = 'dalsi-formular' AND filled_by_doctor_account_id = ?
    ORDER BY updated_at DESC`
  )
    .bind(patientId, user.id)
    .all();

  return json({
    items: (rows.results ?? []).map((row) => ({
      ...row,
      answers: safeJsonParse(row.answers_json, {})
    }))
  });
}

async function doctorPortalPatientLookup(request, env, user) {
  const body = await readJson(request);
  const noveid = String(body?.noveid ?? "").trim();

  if (!noveid) {
    return json({ error: "validation_error", message: "Zadejte kód pacienta." }, 400);
  }

  const patient = await env.DB.prepare(
    "SELECT id, noveid, notes, created_at, updated_at FROM patients WHERE noveid = ? LIMIT 1"
  )
    .bind(noveid)
    .first();

  if (!patient) {
    return json({ error: "not_found", message: "Pacient s tímto kódem nebyl nalezen." }, 404);
  }

  const [summary, submissions] = await Promise.all([
    env.DB.prepare(
      `SELECT
        COUNT(*) AS submission_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_count,
        MAX(updated_at) AS last_submission_at
      FROM questionnaire_submissions
      WHERE patient_id = ?`
    )
      .bind(patient.id)
      .first(),
    env.DB.prepare(
      `SELECT
        id,
        questionnaire_code,
        questionnaire_title,
        questionnaire_version,
        round_key,
        form_key,
        form_order,
        evaluation_slot,
        status,
        started_at,
        completed_at,
        updated_at
      FROM questionnaire_submissions
      WHERE patient_id = ?
      ORDER BY updated_at DESC`
    )
      .bind(patient.id)
      .all()
  ]);

  await logAudit(env, null, "doctor_portal_patient_lookup", patient.id, "lookup", {
    noveid,
    actorType: "doctor",
    actorId: user.id
  });
  return json({
    patient,
    summary,
    questionnaireStatuses: buildDoctorQuestionnaireStatuses(
      getQuestionnaireCatalog().filter((item) => item.formKey === "dalsi-formular"),
      submissions.results ?? [],
      user.id
    )
  });
}

function buildQuestionnaireStatuses(questionnaires, submissions) {
  return questionnaires.map((questionnaire) => {
    const related = submissions
      .filter((submission) => submission.questionnaire_code === questionnaire.code)
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());

    const internalRelated =
      questionnaire.formKey === "dalsi-formular"
        ? related.filter((submission) => normalizeEvaluationSlot(submission.evaluation_slot) === "h0")
        : related;
    const doctorRelated =
      questionnaire.formKey === "dalsi-formular"
        ? related.filter((submission) => /^h[1-6]$/i.test(String(submission.evaluation_slot ?? "")))
        : [];

    const latestSubmission = internalRelated[0] ?? null;
    const lastInProgress = internalRelated.find((submission) => submission.status === "in_progress");
    const lastCompleted = internalRelated.find((submission) => submission.status === "completed");
    const usedDoctorSlots = new Set(
      doctorRelated.map((submission) => normalizeEvaluationSlot(submission.evaluation_slot)).filter(Boolean)
    );

    let statusLabel = "Nevyplněno";
    let statusClass = "not-started";

    if (latestSubmission?.status === "in_progress") {
      statusLabel = "Rozepsané";
      statusClass = "in-progress";
    } else if (latestSubmission?.status === "completed") {
      statusLabel = "Vyplněno";
      statusClass = "completed";
    }

    return {
      ...questionnaire,
      shortTitle: createShortTitle(questionnaire.title),
      statusLabel,
      statusClass,
      lastUpdatedAt: latestSubmission?.updated_at || null,
      lastInProgressId: latestSubmission?.status === "in_progress" ? latestSubmission.id : lastInProgress?.id ?? null,
      lastCompletedId: latestSubmission?.status === "completed" ? latestSubmission.id : lastCompleted?.id ?? null,
      doctorEvaluationCount: usedDoctorSlots.size,
      doctorEvaluationLimit: 6,
      doctorEvaluationLimitReached: usedDoctorSlots.size >= 6
    };
  });
}

function buildDoctorQuestionnaireStatuses(questionnaires, submissions, doctorAccountId) {
  return questionnaires.map((questionnaire) => {
    const related = submissions
      .filter(
        (submission) =>
          submission.questionnaire_code === questionnaire.code &&
          /^h[1-6]$/i.test(String(submission.evaluation_slot ?? ""))
      )
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());

    const currentDoctorRelated = related.filter(
      (submission) => Number(submission.filled_by_doctor_account_id ?? 0) === Number(doctorAccountId ?? 0)
    );
    const latestSubmission = currentDoctorRelated[0] ?? null;
    const lastInProgress = currentDoctorRelated.find((submission) => submission.status === "in_progress");
    const lastCompleted = currentDoctorRelated.find((submission) => submission.status === "completed");
    const usedDoctorSlots = new Set(
      related.map((submission) => normalizeEvaluationSlot(submission.evaluation_slot)).filter(Boolean)
    );

    let statusLabel = "NevyplnÄ›no";
    let statusClass = "not-started";

    if (latestSubmission?.status === "in_progress") {
      statusLabel = "RozepsanĂ©";
      statusClass = "in-progress";
    } else if (latestSubmission?.status === "completed") {
      statusLabel = "VyplnÄ›no";
      statusClass = "completed";
    }

    return {
      ...questionnaire,
      shortTitle: createShortTitle(questionnaire.title),
      statusLabel,
      statusClass,
      lastUpdatedAt: latestSubmission?.updated_at || null,
      lastInProgressId: lastInProgress?.id ?? null,
      lastCompletedId: lastCompleted?.id ?? null,
      currentDoctorCompleted: Boolean(lastCompleted),
      doctorEvaluationCount: usedDoctorSlots.size,
      doctorEvaluationLimit: 6,
      doctorEvaluationLimitReached: usedDoctorSlots.size >= 6
    };
  });
}

async function createSubmission(request, env, user, patientId, actorType = "internal") {
  const body = await readJson(request);
  const questionnaire = getQuestionnaireByCode(String(body.questionnaireCode ?? ""));

  if (!questionnaire) {
    return json({ error: "questionnaire_not_found" }, 404);
  }

  if (actorType === "doctor" && !isDoctorPortalQuestionnaire(questionnaire)) {
    return json({ error: "forbidden" }, 403);
  }

  const patient = await env.DB.prepare("SELECT id FROM patients WHERE id = ? LIMIT 1")
    .bind(patientId)
    .first();

  if (!patient) {
    return json({ error: "patient_not_found" }, 404);
  }

  const metadata = getQuestionnaireMetadata(questionnaire);
  const inhalers = metadata.roundKey ? await loadPatientRoundInhalers(env, patientId, metadata.roundKey) : [];
  const prefilledAnswers = buildPrefilledAnswers(questionnaire, inhalers);

  if (actorType === "doctor" && questionnaire.formKey === "dalsi-formular") {
    const existingDoctorSubmission = await env.DB.prepare(
      `SELECT id, status
       FROM questionnaire_submissions
       WHERE patient_id = ? AND round_key = ? AND form_key = 'dalsi-formular' AND filled_by_doctor_account_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`
    )
      .bind(patientId, questionnaire.roundKey, user.id)
      .first();

    if (existingDoctorSubmission?.status === "completed") {
      return json(
        {
          error: "doctor_already_completed",
          message: "Tento zdravotník už má pro toto kolo hotové hodnocení a nemůže vyplnit další."
        },
        409
      );
    }

    if (existingDoctorSubmission?.status === "in_progress") {
      return getSubmission(env, Number(existingDoctorSubmission.id), "doctor", user);
    }
  }

  const evaluationSlot = await assignEvaluationSlot(env, patientId, questionnaire, actorType);

  if (actorType === "doctor" && questionnaire.formKey === "dalsi-formular" && !evaluationSlot) {
    return json(
      {
        error: "doctor_evaluation_limit_reached",
        message: "Pro toto kolo už existuje maximální počet zdravotnických hodnocení (6)."
      },
      409
    );
  }

  const result = await env.DB.prepare(
    `INSERT INTO questionnaire_submissions (
      patient_id,
      questionnaire_code,
      questionnaire_title,
      questionnaire_version,
      round_key,
      round_label,
      round_order,
      form_key,
      form_order,
      inhaler_slot,
      evaluation_slot,
      filled_by_user_id,
      filled_by_doctor_account_id,
      status,
      answers_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', ?)`
  )
    .bind(
      patientId,
      questionnaire.code,
      questionnaire.title,
      questionnaire.version,
      metadata.roundKey,
      metadata.roundLabel,
      metadata.roundOrder,
      metadata.formKey,
      metadata.formOrder,
      metadata.inhalerSlot,
      evaluationSlot,
      actorType === "doctor" ? null : user.id,
      actorType === "doctor" ? user.id : null,
      JSON.stringify(prefilledAnswers)
    )
    .run();

  await logAudit(
    env,
    actorType === "doctor" ? null : user.id,
    "submission",
    Number(result.meta.last_row_id),
    "create",
    {
      questionnaireCode: questionnaire.code,
      actorType,
      actorId: user.id
    }
  );

  return getSubmission(env, Number(result.meta.last_row_id), actorType, user);
}

async function getSubmission(env, submissionId, actorType = "internal", user = null) {
  const access = await getSubmissionAccess(env, submissionId, actorType, user);
  if (access.error) {
    return json({ error: access.error }, access.error === "not_found" ? 404 : 403);
  }
  const submission = access.submission;

  const questionnaire = getQuestionnaireByCode(submission.questionnaire_code);
  const storedAnswers = safeJsonParse(submission.answers_json, {});
  const inhalers = submission.round_key
    ? await loadPatientRoundInhalers(env, submission.patient_id, submission.round_key)
    : [];
  const prefilledAnswers = questionnaire ? buildPrefilledAnswers(questionnaire, inhalers) : {};
  const mergedAnswers = mergePrefilledAnswers(prefilledAnswers, storedAnswers);

  return json({
    submission: {
      ...submission,
      answers: mergedAnswers
    },
    questionnaire
  });
}

async function updateSubmission(request, env, user, submissionId, actorType = "internal") {
  const body = await readJson(request);
  const access = await getSubmissionAccess(env, submissionId, actorType, user);
  if (access.error) {
    return json({ error: access.error }, access.error === "not_found" ? 404 : 403);
  }
  const submission = access.submission;

  if (submission.form_key === "dalsi-formular" && submission.round_key) {
    const linkedInhalers = await loadPatientRoundInhalers(env, submission.patient_id, submission.round_key);
    body.answers = {
      ...(body.answers ?? {}),
      selected_inhalers: linkedInhalers.slice(0, 3)
    };
  }

  const status = body.status === "completed" ? "completed" : "in_progress";
  const answersJson = JSON.stringify(body.answers ?? {});
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  await env.DB.prepare(
    `UPDATE questionnaire_submissions
    SET answers_json = ?, status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  )
    .bind(answersJson, status, completedAt, submissionId)
    .run();

  if (submission.form_key === "inhalacni-technika" && submission.round_key) {
    await syncPatientRoundInhalers(
      env,
      submission.patient_id,
      submission.round_key,
      Array.isArray(body.answers?.inhalation_systems) ? body.answers.inhalation_systems : [],
      submissionId
    );
  }

  await logAudit(env, actorType === "doctor" ? null : user.id, "submission", submissionId, "update", {
    status,
    actorType,
    actorId: user.id
  });
  return getSubmission(env, submissionId, actorType, user);
}

async function deleteSubmission(env, user, submissionId) {
  const submission = await env.DB.prepare(
    `SELECT id, patient_id, questionnaire_code, questionnaire_version
     FROM questionnaire_submissions
     WHERE id = ? LIMIT 1`
  )
    .bind(submissionId)
    .first();

  if (!submission) {
    return json({ error: "not_found" }, 404);
  }

  await env.DB.prepare("DELETE FROM questionnaire_submissions WHERE id = ?")
    .bind(submissionId)
    .run();

  await logAudit(env, user.id, "submission", submissionId, "delete", {
    patientId: submission.patient_id,
    questionnaireCode: submission.questionnaire_code,
    questionnaireVersion: submission.questionnaire_version
  });

  return json({ ok: true });
}

async function getSubmissionAccess(env, submissionId, actorType, user) {
  const submission = await env.DB.prepare("SELECT * FROM questionnaire_submissions WHERE id = ? LIMIT 1")
    .bind(submissionId)
    .first();

  if (!submission) {
    return { error: "not_found", submission: null };
  }

  if (actorType === "doctor") {
    if (submission.form_key !== "dalsi-formular") {
      return { error: "forbidden", submission: null };
    }

    if (!user || Number(submission.filled_by_doctor_account_id) !== Number(user.id)) {
      return { error: "forbidden", submission: null };
    }
  }

  return { error: null, submission };
}

function getQuestionnaireMetadata(questionnaire) {
  const inhalerSlot =
    questionnaire.formKey === "fsi-1"
      ? 1
      : questionnaire.formKey === "fsi-2"
        ? 2
        : questionnaire.formKey === "fsi-3"
          ? 3
          : null;

  return {
    roundKey: questionnaire.roundKey ?? null,
    roundLabel: questionnaire.roundLabel ?? null,
    roundOrder: questionnaire.roundOrder ?? null,
    formKey: questionnaire.formKey ?? null,
    formOrder: questionnaire.formOrder ?? null,
    inhalerSlot
  };
}

function normalizeEvaluationSlot(value) {
  const slot = String(value ?? "").trim().toLowerCase();
  return slot || null;
}

function isDoctorPortalQuestionnaire(questionnaire) {
  return questionnaire?.formKey === "dalsi-formular";
}

async function assignEvaluationSlot(env, patientId, questionnaire, actorType) {
  if (questionnaire.formKey !== "dalsi-formular") {
    return null;
  }

  if (actorType !== "doctor") {
    return "h0";
  }

  const existing = await env.DB.prepare(
    `SELECT evaluation_slot
     FROM questionnaire_submissions
     WHERE patient_id = ? AND round_key = ? AND form_key = 'dalsi-formular'`
  )
    .bind(patientId, questionnaire.roundKey)
    .all();

  const used = new Set(
    (existing.results ?? [])
      .map((row) => normalizeEvaluationSlot(row.evaluation_slot))
      .filter((slot) => /^h[1-6]$/.test(String(slot ?? "")))
  );

  for (let index = 1; index <= 6; index += 1) {
    const candidate = `h${index}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function loadPatientRoundInhalers(env, patientId, roundKey) {
  const result = await env.DB.prepare(
    `SELECT inhaler_slot, inhaler_code
     FROM patient_round_inhalers
     WHERE patient_id = ? AND round_key = ?
     ORDER BY inhaler_slot ASC`
  )
    .bind(patientId, roundKey)
    .all();

  const fromTable = (result.results ?? []).map((row) => String(row.inhaler_code ?? "").trim()).filter(Boolean);
  if (fromTable.length) {
    return fromTable;
  }

  const fallback = await env.DB.prepare(
    `SELECT answers_json
     FROM questionnaire_submissions
     WHERE patient_id = ? AND round_key = ? AND form_key = 'inhalacni-technika'
     ORDER BY updated_at DESC
     LIMIT 1`
  )
    .bind(patientId, roundKey)
    .first();

  const answers = safeJsonParse(fallback?.answers_json, {});
  return Array.isArray(answers?.inhalation_systems) ? answers.inhalation_systems.filter(Boolean).slice(0, 3) : [];
}

function buildVitalographInhalerPrefill(inhalers) {
  const selected = [];
  const hasPmdiFamily = inhalers.some((item) =>
    ["pmdi", "pmdi_nastavec", "aerosphere", "respimat", "respimat_nastavec"].includes(String(item))
  );
  const hasDpiFamily = inhalers.some((item) =>
    [
      "aerolizer",
      "breezhaler",
      "diskus",
      "easyhaler",
      "ellipta",
      "forspiro",
      "genuair",
      "handihaler",
      "nexthaler",
      "spiromax",
      "turbuhaler",
      "twisthaler"
    ].includes(String(item))
  );

  if (hasPmdiFamily) {
    selected.push("pmdi");
  }
  if (hasDpiFamily) {
    selected.push("dpi");
  }

  return selected.length ? { selected } : {};
}

function buildPrefilledAnswers(questionnaire, inhalers) {
  if (questionnaire.formKey === "dalsi-formular") {
    return {
      selected_inhalers: inhalers.slice(0, 3)
    };
  }

  if (questionnaire.formKey === "vitalograf") {
    return {
      vitalograph_inhaler_types: buildVitalographInhalerPrefill(inhalers)
    };
  }

  return {};
}

function mergePrefilledAnswers(prefilledAnswers, storedAnswers) {
  const merged = { ...(storedAnswers ?? {}) };

  for (const [key, value] of Object.entries(prefilledAnswers ?? {})) {
    if (key === "selected_inhalers") {
      merged[key] = Array.isArray(value) ? value : [];
      continue;
    }

    const current = storedAnswers?.[key];

    if (Array.isArray(current)) {
      merged[key] = current.length ? current : value;
      continue;
    }

    if (current && typeof current === "object") {
      const hasSelectedArray = Array.isArray(current.selected) && current.selected.length > 0;
      const hasSelectedString = typeof current.selected === "string" && current.selected.trim() !== "";
      const hasMeaningfulNestedValue = Object.entries(current).some(([nestedKey, nestedValue]) => {
        if (nestedKey === "selected") {
          return false;
        }
        if (Array.isArray(nestedValue)) {
          return nestedValue.length > 0;
        }
        if (nestedValue && typeof nestedValue === "object") {
          return Object.keys(nestedValue).length > 0;
        }
        return nestedValue != null && String(nestedValue).trim() !== "";
      });
      if (hasSelectedArray || hasSelectedString || hasMeaningfulNestedValue) {
        merged[key] = current;
        continue;
      }
    }

    if (current == null || current === "" || (typeof current === "object" && Object.keys(current).length === 0)) {
      merged[key] = value;
    }
  }

  return merged;
}

async function syncPatientRoundInhalers(env, patientId, roundKey, inhalers, submissionId) {
  const normalized = inhalers
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 3);

  await env.DB.prepare("DELETE FROM patient_round_inhalers WHERE patient_id = ? AND round_key = ?")
    .bind(patientId, roundKey)
    .run();

  for (let index = 0; index < normalized.length; index += 1) {
    await env.DB.prepare(
      `INSERT INTO patient_round_inhalers (
        patient_id,
        round_key,
        inhaler_slot,
        inhaler_code,
        source_submission_id
      ) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(patientId, roundKey, index + 1, normalized[index], submissionId)
      .run();
  }
}

async function exportDatabaseBackup(env, user) {
  if (env.SELFHOST_SQLITE_PATH) {
    return exportLocalDatabaseBackup(env, user);
  }

  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;

  if (!apiToken || !accountId || !databaseId) {
    return json({ error: "backup_not_configured" }, 500);
  }

  const exportUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/export`;
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json; charset=utf-8"
  };

  let bookmark = null;
  let signedUrl = null;
  let filename = `d1-backup-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.sql`;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const payload = bookmark
      ? { output_format: "polling", current_bookmark: bookmark }
      : { output_format: "polling" };

    const exportResponse = await fetch(exportUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const exportJson = await exportResponse.json();
    if (!exportResponse.ok || !exportJson?.success) {
      return json({ error: "backup_export_failed", detail: exportJson?.errors ?? exportJson }, 502);
    }

    const result = exportJson.result ?? {};
    bookmark = result.at_bookmark ?? bookmark;

    if (result.status === "error") {
      return json({ error: "backup_export_failed", detail: result.error ?? "Export failed" }, 502);
    }

    if (result.status === "complete" && result.result?.signed_url) {
      signedUrl = result.result.signed_url;
      filename = result.result.filename || filename;
      break;
    }

    await delay(3000);
  }

  if (!signedUrl) {
    return json({ error: "backup_export_timeout" }, 504);
  }

  const downloadResponse = await fetch(signedUrl);
  if (!downloadResponse.ok) {
    return json({ error: "backup_download_failed" }, 502);
  }

  await logAudit(env, user.id, "database_backup", 0, "download", { filename });

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", "application/sql; charset=utf-8");
  responseHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(downloadResponse.body, { status: 200, headers: responseHeaders });
}

async function exportLocalDatabaseBackup(env, user) {
  const sqlitePath = env.SELFHOST_SQLITE_PATH;
  if (!sqlitePath) {
    return json({ error: "backup_not_configured" }, 500);
  }

  let data;
  let filename;

  if (typeof env.SELFHOST_CREATE_SQLITE_BACKUP === "function") {
    const snapshot = await env.SELFHOST_CREATE_SQLITE_BACKUP();
    data = snapshot?.data;
    filename = snapshot?.filename;
  }

  if (!data) {
    const fsModule = await import("node:fs/promises");
    data = await fsModule.readFile(sqlitePath);
    filename = filename || `sqlite-backup-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.db`;
  }

  filename = filename || `sqlite-backup-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.db`;

  if (user?.id) {
    await logAudit(env, user.id, "database_backup", 0, "download", { filename, mode: "selfhost" });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}

async function exportFullData(env, user, format) {
  const tables = await loadExportTables(env);

  await logAudit(env, user.id, "full_export", 0, "download", { format });

  if (format === "txt") {
    const sections = tables.map(({ name, rows }) => {
      const body = rows.length
        ? rows.map((row) => JSON.stringify(row, null, 2)).join("\n\n")
        : "(prázdná tabulka)";
      return `=== ${name.toUpperCase()} ===\n${body}`;
    });

    return new Response(sections.join("\n\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="kompletni-export-${new Date().toISOString().slice(0, 10)}.txt"`,
        "Cache-Control": "no-store"
      }
    });
  }

  const lines = ["table_name,row_id,record_json"];
  for (const table of tables) {
    for (const row of table.rows) {
      const rowId = row.id ?? "";
      lines.push(`${csvEscape(table.name)},${csvEscape(String(rowId))},${csvEscape(JSON.stringify(row))}`);
    }
    if (!table.rows.length) {
      lines.push(`${csvEscape(table.name)},,${csvEscape("{}")}`);
    }
  }

  const csvBody = ["sep=,", ...lines].join("\r\n");

  return new Response(`\uFEFF${csvBody}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kompletni-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}

async function exportPatientData(env, user, format) {
  const patientRows = await env.DB.prepare(
    `SELECT
      p.id,
      p.noveid,
      p.notes,
      p.updated_at,
      COALESCE(COUNT(s.id), 0) AS submission_count,
      COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
      COALESCE(SUM(CASE WHEN s.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS in_progress_count,
      MAX(s.updated_at) AS last_submission_at
    FROM patients p
    LEFT JOIN questionnaire_submissions s ON s.patient_id = p.id
    GROUP BY p.id
    ORDER BY COALESCE(MAX(s.updated_at), p.updated_at) DESC, p.noveid ASC`
  ).all();

  const items = patientRows.results ?? [];
  for (const patient of items) {
    const submissions = await env.DB.prepare(
      `SELECT questionnaire_code, questionnaire_title, status, updated_at
       FROM questionnaire_submissions
       WHERE patient_id = ?
       ORDER BY updated_at DESC`
    )
      .bind(patient.id)
      .all();

    patient.form_summaries = summarizePatientForms(submissions.results ?? []);
  }

  const catalog = getQuestionnaireCatalog();
  const exportRows = items.map((patient) => {
    const forms = Array.isArray(patient.form_summaries) ? patient.form_summaries : [];
    const formsText = forms
      .map((item) => `${item.short_title}: ${item.status_label}`)
      .join(", ");

    return {
      identifikator: patient.noveid,
      poznamka: patient.notes ?? "",
      formulare: formsText,
      posledni_zmena: formatDateTimeForExport(patient.last_submission_at || patient.updated_at)
    };
  });

  await logAudit(env, user.id, "patient_export", 0, "download", { format });

  if (format === "txt") {
    const header = ["Identifikátor", "Poznámka", "Formuláře", "Poslední změna"].join("\t");
    const lines = exportRows.map((row) =>
      [row.identifikator, row.poznamka, row.formulare, row.posledni_zmena]
        .map((value) => String(value ?? "").replaceAll("\t", " ").replaceAll("\n", " "))
        .join("\t")
    );
    return new Response([header, ...lines].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="pacienti-${new Date().toISOString().slice(0, 10)}.txt"`,
        "Cache-Control": "no-store"
      }
    });
  }

  const formHeaders = catalog.map((item) => escapeHtml(item.short_title || createShortTitle(item.title)));
  const rowsHtml = items
    .map((patient) => {
      const formMap = new Map((patient.form_summaries ?? []).map((item) => [item.code, item]));
      const formCells = catalog
        .map((questionnaire) => {
          const item = formMap.get(questionnaire.code);
          const label = item?.status_label ?? "Nevyplněno";
          return `<td>${escapeHtml(label)}</td>`;
        })
        .join("");

      return `
        <tr>
          <td>${escapeHtml(patient.noveid)}</td>
          <td>${escapeHtml(patient.notes ?? "")}</td>
          ${formCells}
          <td>${escapeHtml(formatDateTimeForExport(patient.last_submission_at || patient.updated_at))}</td>
        </tr>
      `;
    })
    .join("");

  const html = `<!doctype html>
  <html lang="cs">
    <head>
      <meta charset="utf-8">
      <title>Export pacientů</title>
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #c9c9c9; padding: 8px; text-align: left; }
        th { background: #eef3ef; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th>Identifikátor</th>
            <th>Poznámka</th>
            ${formHeaders.map((header) => `<th>${header}</th>`).join("")}
            <th>Poslední změna</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
  </html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="pacienti-${new Date().toISOString().slice(0, 10)}.xls"`,
      "Cache-Control": "no-store"
    }
  });
}

async function listUsers(env) {
  const internalResult = await env.DB.prepare(
    `SELECT
      'internal' AS account_type,
      id,
      email,
      login_id,
      role,
      is_active,
      created_at
     FROM users
     ORDER BY created_at ASC`
  ).all();

  const doctorResult = await env.DB.prepare(
    `SELECT
      'doctor' AS account_type,
      id,
      NULL AS email,
      login_id,
      'doctor' AS role,
      is_active,
      created_at
     FROM doctor_accounts
     ORDER BY created_at ASC`
  ).all();

  const items = [...(internalResult.results ?? []), ...(doctorResult.results ?? [])].sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );

  return json({ items });
}

async function createUser(request, env, actor) {
  const body = await readJson(request);
  const loginId = String(body?.loginId ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const role = body?.role === "admin" ? "admin" : body?.role === "doctor" ? "doctor" : "editor";

  if (password.length < 10) {
    return json({ error: "validation_error", message: "Heslo musí mít alespoň 10 znaků." }, 400);
  }

  if ((role === "admin" || role === "editor") && !loginId) {
    return json({ error: "validation_error", message: "Interní uživatel musí mít své login ID." }, 400);
  }

  if (role === "doctor" && !loginId) {
    return json({ error: "validation_error", message: "Zdravotník musí mít své login ID." }, 400);
  }

  const passwordHash = await createPasswordHash(password);
  if (role === "doctor") {
    await env.DB.prepare(
      "INSERT INTO doctor_accounts (login_id, password_hash) VALUES (?, ?)"
    )
      .bind(loginId, passwordHash)
      .run();
  } else {
    await env.DB.prepare(
      "INSERT INTO users (email, login_id, password_hash, role) VALUES (?, ?, ?, ?)"
    )
      .bind(null, loginId, passwordHash, role)
      .run();
  }

  await logAudit(env, actor.id, "user", 0, "create", { loginId, role });
  return json({ ok: true });
}

async function deleteUser(env, actor, accountType, userId) {
  if (accountType === "internal" && actor.id === userId) {
    return json({ error: "validation_error", message: "Nelze odstranit vlastní účet." }, 400);
  }

  if (accountType === "doctor") {
    await env.DB.prepare("DELETE FROM doctor_accounts WHERE id = ?").bind(userId).run();
  } else {
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  }

  await logAudit(env, actor.id, "user", userId, "delete", { accountType });
  return json({ ok: true });
}

async function logAudit(env, userId, entityType, entityId, action, payload) {
  await env.DB.prepare(
    "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, payload_json) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, entityType, entityId, action, JSON.stringify(payload ?? {}))
    .run();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    login_id: user.login_id,
    role: user.role
  };
}

function sanitizeDoctorUser(user) {
  return {
    id: user.id,
    login_id: user.login_id,
    role: "doctor"
  };
}

function summarizePatientForms(submissions) {
  return getQuestionnaireCatalog().map((questionnaire) => {
    const related = submissions
      .filter((submission) => submission.questionnaire_code === questionnaire.code)
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
    const internalRelated =
      questionnaire.formKey === "dalsi-formular"
        ? related.filter((submission) => normalizeEvaluationSlot(submission.evaluation_slot) === "h0")
        : related;
    const submission = internalRelated[0] ?? null;
    const doctorEvaluationCount =
      questionnaire.formKey === "dalsi-formular"
        ? new Set(
            related
              .map((item) => normalizeEvaluationSlot(item.evaluation_slot))
              .filter((slot) => /^h[1-6]$/.test(String(slot ?? "")))
          ).size
        : 0;
    const status = submission
      ? submission.status === "completed"
        ? "completed"
        : "in-progress"
      : "not-started";

    return {
      code: questionnaire.code,
      title: questionnaire.title,
      short_title: questionnaire.short_title || createShortTitle(questionnaire.title),
      short_abbr: createShortAbbr(questionnaire.title),
      round_key: questionnaire.roundKey ?? null,
      round_label: questionnaire.roundLabel ?? null,
      form_key: questionnaire.formKey ?? null,
      form_order: questionnaire.formOrder ?? null,
      is_legacy: Boolean(questionnaire.isLegacy),
      doctor_evaluation_count: doctorEvaluationCount,
      status,
      status_label:
        status === "completed"
          ? "Vyplněno"
          : status === "in-progress"
            ? "Rozepsané"
            : "Nevyplněno"
    };
  });
}

function createShortTitle(title) {
  const text = String(title ?? "").trim();
  if (!text) {
    return "";
  }

  const normalized = text
    .replace(/^Dotazník o\s+/i, "")
    .replace(/\s+[–-]\s+pacienti$/i, "")
    .replace(/\s+[–-]\s+pacienti$/i, "")
    .trim();

  if (normalized.length <= 24) {
    return normalized;
  }

  return `${normalized.slice(0, 24)}…`;
}

function createShortAbbr(title) {
  const normalized = String(title ?? "")
    .replace(/^Dotazník o\s+/i, "")
    .replace(/^Krátký\s+/i, "")
    .replace(/\s+[–-]\s+pacienti$/i, "")
    .trim();

  const words = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .filter(Boolean);

  return words.slice(0, 2).join("") || "D";
}

function normalizeNullable(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function readCookie(request, cookieName) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  for (const entry of cookies) {
    const [name, ...rest] = entry.split("=");
    if (name === cookieName) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function buildSessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function buildDoctorPortalCookie(token) {
  return `${DOCTOR_PORTAL_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

function createSessionToken() {
  return `${crypto.randomUUID()}-${bytesToHex(crypto.getRandomValues(new Uint8Array(16)))}`;
}

function clearDoctorPortalCookie() {
  return `${DOCTOR_PORTAL_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2$${PASSWORD_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, iterationsText, saltHex, hashHex] = String(encodedHash).split("$");
  if (algorithm !== "pbkdf2") {
    return false;
  }

  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(hashHex);
  const actual = await pbkdf2(password, salt, Number(iterationsText));
  return timingSafeEqual(actual, expected);
}

async function pbkdf2(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    keyMaterial,
    256
  );

  return new Uint8Array(bits);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function loadExportTables(env) {
  return [
    { name: "users", rows: await fetchTableRows(env, "SELECT id, email, login_id, role, is_active, created_at, updated_at FROM users ORDER BY id ASC") },
    { name: "doctor_accounts", rows: await fetchTableRows(env, "SELECT id, login_id, is_active, created_at, updated_at FROM doctor_accounts ORDER BY id ASC") },
    { name: "user_sessions", rows: await fetchTableRows(env, "SELECT id, user_id, expires_at, created_at, last_seen_at, ip_address, user_agent FROM user_sessions ORDER BY id ASC") },
    { name: "doctor_portal_sessions", rows: await fetchTableRows(env, "SELECT id, doctor_account_id, expires_at, created_at, last_seen_at FROM doctor_portal_sessions ORDER BY id ASC") },
    { name: "patients", rows: await fetchTableRows(env, "SELECT * FROM patients ORDER BY id ASC") },
    {
      name: "questionnaire_submissions",
      rows: await fetchTableRows(
        env,
        "SELECT id, patient_id, questionnaire_code, questionnaire_title, questionnaire_version, round_key, form_key, inhaler_slot, evaluation_slot, filled_by_user_id, filled_by_doctor_account_id, status, answers_json, started_at, completed_at, updated_at FROM questionnaire_submissions ORDER BY id ASC"
      )
    },
    {
      name: "patient_round_inhalers",
      rows: await fetchTableRows(
        env,
        "SELECT id, patient_id, round_key, inhaler_slot, inhaler_code, source_submission_id, created_at, updated_at FROM patient_round_inhalers ORDER BY id ASC"
      )
    },
    { name: "audit_logs", rows: await fetchTableRows(env, "SELECT * FROM audit_logs ORDER BY id ASC") }
  ];
}

async function fetchTableRows(env, sql) {
  const result = await env.DB.prepare(sql).all();
  return result.results ?? [];
}

async function exportQuestionnaireAnswerData(env, user, format) {
  const groups = await loadLatestCompletedSubmissionGroups(env);

  await logAudit(env, user.id, "questionnaire_answer_export", 0, "download", { format });

  if (format === "txt") {
    const sections = groups.map((group) => {
      const body = group.rows.length
        ? group.rows
            .map((row) => {
              const answers = row.answers.length
                ? row.answers.map((answer) => `- ${answer.label}: ${answer.value}`).join("\n")
                : "- Bez odpovědí";
              return [
                `Pacient: ${row.patient_noveid}`,
                `Vyplněno: ${row.completed_at}`,
                `Verze: ${row.questionnaire_version}`,
                answers
              ].join("\n");
            })
            .join("\n\n")
        : "(bez dokončených dotazníků)";

      return `=== ${group.questionnaire_title} ===\n${body}`;
    });

    return new Response(sections.join("\n\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="odpovedi-dotazniku-${new Date().toISOString().slice(0, 10)}.txt"`,
        "Cache-Control": "no-store"
      }
    });
  }

  const lines = ["questionnaire_code;questionnaire_title;patient_noveid;questionnaire_version;completed_at;question_key;question_label;answer_value"];
  for (const group of groups) {
    if (!group.rows.length) {
      lines.push([
        csvEscape(group.questionnaire_code),
        csvEscape(group.questionnaire_title),
        csvEscape(""),
        csvEscape(group.questionnaire_version),
        csvEscape(""),
        csvEscape(""),
        csvEscape(""),
        csvEscape("")
      ].join(";"));
      continue;
    }

    for (const row of group.rows) {
      if (!row.answers.length) {
        lines.push([
          csvEscape(group.questionnaire_code),
          csvEscape(group.questionnaire_title),
          csvEscape(row.patient_noveid),
          csvEscape(row.questionnaire_version),
          csvEscape(row.completed_at),
          csvEscape(""),
          csvEscape(""),
          csvEscape("")
        ].join(";"));
        continue;
      }

      for (const answer of row.answers) {
        lines.push([
          csvEscape(group.questionnaire_code),
          csvEscape(group.questionnaire_title),
          csvEscape(row.patient_noveid),
          csvEscape(row.questionnaire_version),
          csvEscape(row.completed_at),
          csvEscape(answer.key),
          csvEscape(answer.label),
          csvEscape(answer.value)
        ].join(";"));
      }
    }
  }

  return new Response(`\uFEFF${lines.join("\n")}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="odpovedi-dotazniku-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}

async function exportRoundWorkbook(env, user, roundKey) {
  const definition = getRoundExportDefinitionV2(roundKey);
  if (!definition) {
    return json({ error: "not_found" }, 404);
  }

  const context = await loadRoundExportContext(env, roundKey);

  await logAudit(env, user.id, "round_export", 0, "download", { roundKey });

  return buildRoundExportResponse(roundKey, context);
}

async function loadRoundExportContext(env, roundKey) {
  const [patientsResult, submissionsResult, internalUsersResult, doctorsResult] = await Promise.all([
    env.DB.prepare("SELECT id, noveid, notes, updated_at FROM patients ORDER BY noveid ASC").all(),
    env.DB.prepare(
      `SELECT
        s.*,
        p.noveid AS patient_noveid
      FROM questionnaire_submissions s
      JOIN patients p ON p.id = s.patient_id
      WHERE s.round_key = ?
      ORDER BY s.patient_id ASC, s.updated_at DESC`
    )
      .bind(roundKey)
      .all(),
    env.DB.prepare("SELECT id, login_id, email FROM users ORDER BY id ASC").all(),
    env.DB.prepare("SELECT id, login_id FROM doctor_accounts ORDER BY id ASC").all()
  ]);

  return {
    patients: patientsResult.results ?? [],
    submissionsByPatient: groupBy(submissionsResult.results ?? [], (row) => String(row.patient_id)),
    internalUsersById: new Map((internalUsersResult.results ?? []).map((row) => [Number(row.id), row])),
    doctorsById: new Map((doctorsResult.results ?? []).map((row) => [Number(row.id), row]))
  };
}

function getRoundExportDefinition(roundKey) {
  if (roundKey === "kolo1") {
    return {
      roundKey,
      roundNumber: 1,
      fileName: "1.kolo.xls",
      fileLabel: "1.kolo export",
      inhalationCode: "kolo1-inhalacni-technika",
      vitalografCode: "kolo1-vitalograf",
      marsCode: "kolo1-mars-a",
      fsiCodes: ["kolo1-fsi-1", "kolo1-fsi-2", "kolo1-fsi-3"],
      evaluationCode: "kolo1-dalsi-formular",
      dateHeader: "datum 1hodnocení",
      statusHeader: "dotazník1_vyplnění",
      noteHeader: "poznámka k pacientovi1",
      countHeader: "1počet IS",
      aerosolHeader: "aerosol1",
      dpiHeader: "DPI1",
      comboHeader: "kombinace aerosol/DPI1",
      evaluatorHeader: "hodnotil H0",
      trailingDoctorHeader: "H1",
      inhalationColumns: [
        "1_proškolen", "1_pozn", "2_lékař", "2_sestra", "2_farmaceut", "2_nevím", "2_neproškolen",
        "3_jak často1", "4_proškolení dostatečné1", "5_forma_tištěné1", "5_forma_samo_videa1",
        "5_forma_samo_elearning1", "5_forma_samo_aplikace1", "5_forma_zdravotník_nácvik1",
        "5_forma_zdravotník_bez nácviku1", "6_důvod léčby", "6_pozn", "7_umím používat",
        "8_snadno_IS1", "8_snadno_IS2", "8_snadno_IS3", "9_před inhalací1", "10_DPI1", "11_pMDI1",
        "12_SMI1", "13_po inhalaci1", "14_vzdělání", "15_sám", "16_povolání", "16_pozn",
        "17_zdravotník", "18_typ zdravotníka", "18_pozn", "19_kuřák1", "19_pozn1",
        "20_způsob aktivně1a", "20_způsob aktivně1b", "20_způsob aktivně1c", "20_pozn1",
        "21_pasivní kuřák1", "22_způsob pasivně1a", "22_způsob pasivně1b", "22_způsob pasivně1d", "22_pozn1"
      ]
    };
  }

  if (roundKey === "kolo2") {
    return {
      roundKey,
      roundNumber: 2,
      fileName: "2.kolo.xls",
      fileLabel: "2.kolo export",
      inhalationCode: "kolo2-inhalacni-technika",
      vitalografCode: "kolo2-vitalograf",
      marsCode: "kolo2-mars-a",
      fsiCodes: ["kolo2-fsi-1", "kolo2-fsi-2", "kolo2-fsi-3"],
      evaluationCode: "kolo2-dalsi-formular",
      dateHeader: "datum 2hodnocení",
      statusHeader: "dotazník2_vyplnění",
      noteHeader: "poznámka k pacientovi2",
      countHeader: "2počet IS",
      aerosolHeader: "aerosol2",
      dpiHeader: "DPI2",
      comboHeader: "kombinace aerosol/DPI2",
      evaluatorHeader: "hodnotil H0",
      trailingDoctorHeader: "H1",
      inhalationColumns: [
        "1_jistější_IS1", "1_jistější_IS2", "1_jistější_IS3", "2_zdravotní stav", "3_spokojen",
        "4_vysvětlení", "4_vitalograph", "4_návod", "4_video", "4_SMS", "4_konzultace",
        "5_doplnění", "6_neschopen", "7_neschopen proč", "7_pozn", "8_jak často2a", "8_jak často2b",
        "8_pozn", "9_školil jiný", "10_jiné info", "10_pozn", "11_před inhalací2", "12_DPI2",
        "13_pMDI2", "14_SMI2", "15_po inhalaci2", "16_proškolení dostatečné2", "17_forma_samo2",
        "17_forma_zdravotník2", "18_sám2", "19_kuřák2", "19_pozn2", "20_způsob aktivně2a",
        "20_způsob aktivně2b", "20_způsob aktivně2c", "20_pozn2", "21_pasivní kuřák2",
        "22_způsob pasivně2a", "22_způsob pasivně2b", "22_způsob pasivně2c", "22_pozn2"
      ]
    };
  }

  return null;
}

function buildRoundExportHeaders(definition) {
  const headers = [
    "identifikátor",
    definition.dateHeader,
    definition.statusHeader,
    "IS1",
    "IS2",
    "IS3",
    ...definition.inhalationColumns,
    ...buildVitalographHeaders(definition.roundNumber),
    ...buildMarsHeaders(definition.roundNumber),
    ...buildFsiHeaders(definition.roundNumber, 1),
    ...buildFsiHeaders(definition.roundNumber, 2),
    ...buildFsiHeaders(definition.roundNumber, 3),
    definition.noteHeader,
    definition.countHeader,
    definition.aerosolHeader,
    definition.dpiHeader,
    definition.comboHeader,
    definition.evaluatorHeader,
    ...buildEvaluationHeaders(definition.roundNumber),
    definition.trailingDoctorHeader
  ];

  return headers;
}

function buildVitalographHeaders(roundNumber) {
  const prefix = `V${roundNumber}`;
  return [
    `${prefix}_pMDI_před`,
    `${prefix}_pMDI_před_úroveň IT`,
    `${prefix}_pMDI_před_aktivace`,
    `${prefix}_pMDI_před_průtok`,
    `${prefix}_pMDI_před_délka`,
    `${prefix}_pMDI_před_zadržení`,
    `${prefix}_pMDI_po`,
    `${prefix}_pMDI_po_úroveň IT`,
    `${prefix}_pMDI_po_aktivace`,
    `${prefix}_pMDI_po_průtok`,
    `${prefix}_pMDI_po_délka`,
    `${prefix}_pMDI_po_zadržení`,
    `${prefix}_DPI_před`,
    `${prefix}_DPI_před_úroveň IT`,
    `${prefix}_DPI_před_průtok`,
    `${prefix}_DPI_před_délka`,
    `${prefix}_DPI_před_zadržení`,
    `${prefix}_DPI_po`,
    `${prefix}_DPI_po_úroveň IT`,
    `${prefix}_DPI_po_průtok`,
    `${prefix}_DPI_po_délka`,
    `${prefix}_DPI_po_zadržení`
  ];
}

function buildMarsHeaders(roundNumber) {
  const prefix = `MARS${roundNumber}`;
  return [
    `${prefix}_vyplnění`,
    `${prefix}_ot1`,
    `${prefix}_ot2`,
    `${prefix}_ot3`,
    `${prefix}_ot4`,
    `${prefix}_ot5`,
    `součet MARS${roundNumber}`
  ];
}

function buildFsiHeaders(roundNumber, slot) {
  const prefix = `FSI${roundNumber}_IS${slot}`;
  return [
    `${prefix}_vyplnění`,
    `${prefix}_ot1`,
    `${prefix}_ot2`,
    `${prefix}_ot3`,
    `${prefix}_ot4`,
    `${prefix}_ot5`,
    `${prefix}_ot6`,
    `${prefix}_ot7`,
    `${prefix}_ot8`,
    `${prefix}_ot9`,
    `${prefix}_ot10`,
    `${prefix}_součet`
  ];
}

function buildEvaluationHeaders(roundNumber) {
  const templates = getEvaluationTemplatesByCode(`kolo${roundNumber}-dalsi-formular`);
  const slotLabel = `H0${roundNumber}`;
  const headers = [];

  for (const [deviceKey, prefix] of getEvaluationExportOrder()) {
    const template = templates[deviceKey];
    headers.push(`${prefix}_${slotLabel}`);
    for (let groupIndex = 0; groupIndex < (template?.errorGroups?.length ?? 0); groupIndex += 1) {
      const stepNumber = groupIndex + 1;
      headers.push(`${prefix}_${slotLabel}_${stepNumber}`);
      const items = template.errorGroups[groupIndex]?.items ?? [];
      for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        headers.push(`${prefix}_${slotLabel}_${stepNumber}${String.fromCharCode(97 + itemIndex)}`);
      }
    }
    headers.push(`${prefix}_${slotLabel}_chyby celkově`);
    headers.push(`${prefix}_${slotLabel}_chybné kroky`);
  }

  return headers;
}

function buildRoundExportRow(definition, context, patient) {
  const row = {};
  const patientSubmissions = context.submissionsByPatient.get(String(patient.id)) ?? [];
  const inhalationSubmission = getLatestSubmission(patientSubmissions, definition.inhalationCode);
  const vitalografSubmission = getLatestSubmission(patientSubmissions, definition.vitalografCode);
  const marsSubmission = getLatestSubmission(patientSubmissions, definition.marsCode);
  const fsi1Submission = getLatestSubmission(patientSubmissions, definition.fsiCodes[0]);
  const fsi2Submission = getLatestSubmission(patientSubmissions, definition.fsiCodes[1]);
  const fsi3Submission = getLatestSubmission(patientSubmissions, definition.fsiCodes[2]);
  const h0Submission = getLatestSubmission(patientSubmissions, definition.evaluationCode, (item) => normalizeEvaluationSlot(item.evaluation_slot) === "h0");
  const h1Submission = getLatestSubmission(patientSubmissions, definition.evaluationCode, (item) => normalizeEvaluationSlot(item.evaluation_slot) === "h1");

  const inhalationAnswers = safeJsonParse(inhalationSubmission?.answers_json, {});
  const vitalografAnswers = safeJsonParse(vitalografSubmission?.answers_json, {});
  const marsAnswers = safeJsonParse(marsSubmission?.answers_json, {});
  const fsi1Answers = safeJsonParse(fsi1Submission?.answers_json, {});
  const fsi2Answers = safeJsonParse(fsi2Submission?.answers_json, {});
  const fsi3Answers = safeJsonParse(fsi3Submission?.answers_json, {});
  const h0Answers = safeJsonParse(h0Submission?.answers_json, {});
  const inhalers = Array.isArray(inhalationAnswers?.inhalation_systems)
    ? inhalationAnswers.inhalation_systems.filter(Boolean).slice(0, 3)
    : [];

  row["identifikátor"] = patient.noveid ?? "";
  row[definition.dateHeader] = valueOrNaN(inhalationAnswers?.evaluation_date);
  row[definition.statusHeader] = formatSubmissionState(inhalationSubmission);
  row["IS1"] = valueOrNaN(exportInhalerLabel(inhalers[0]));
  row["IS2"] = valueOrNaN(exportInhalerLabel(inhalers[1]));
  row["IS3"] = valueOrNaN(exportInhalerLabel(inhalers[2]));

  Object.assign(row, buildInhalationQuestionColumns(definition.roundKey, inhalationSubmission, inhalationAnswers, inhalers));
  Object.assign(row, buildVitalographColumnsWithStatus(definition.roundNumber, vitalografSubmission, vitalografAnswers));
  Object.assign(row, buildMarsColumns(definition.roundNumber, marsSubmission, marsAnswers));
  Object.assign(row, buildFsiColumns(definition.roundNumber, 1, fsi1Submission, fsi1Answers));
  Object.assign(row, buildFsiColumns(definition.roundNumber, 2, fsi2Submission, fsi2Answers));
  Object.assign(row, buildFsiColumns(definition.roundNumber, 3, fsi3Submission, fsi3Answers));

  row[definition.noteHeader] = valueOrNaN(patient.notes);
  row[definition.countHeader] = inhalers.length || "NaN";
  row[definition.aerosolHeader] = hasAerosolInhaler(inhalers) ? 1 : inhalers.length ? 0 : "NaN";
  row[definition.dpiHeader] = hasDpiInhaler(inhalers) ? 1 : inhalers.length ? 0 : "NaN";
  row[definition.comboHeader] = hasAerosolInhaler(inhalers) && hasDpiInhaler(inhalers) ? 1 : inhalers.length ? 0 : "NaN";
  row[definition.evaluatorHeader] = valueOrNaN(resolveSubmissionActor(h0Submission, context));

  Object.assign(row, buildEvaluationColumns(definition.roundNumber, h0Submission, h0Answers));
  row[definition.trailingDoctorHeader] = valueOrNaN(resolveSubmissionActor(h1Submission, context));

  return row;
}

function getLatestSubmission(submissions, questionnaireCode, predicate = null) {
  return submissions.find(
    (submission) =>
      submission.questionnaire_code === questionnaireCode &&
      (!predicate || predicate(submission))
  ) ?? null;
}

function formatSubmissionState(submission) {
  if (!submission) {
    return "NaN";
  }

  const answers = safeJsonParse(submission.answers_json, {});
  if (answers?.__patient_not_filled) {
    return "nevyplněno";
  }

  if (submission.status === "completed") {
    return "vyplněno";
  }

  if (submission.status === "in_progress") {
    return "rozepsáno";
  }

  return "NaN";
}

function buildInhalationQuestionColumns(roundKey, submission, answers, inhalers) {
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);

  const set = (header, value) => {
    row[header] = allNaN ? "NaN" : allZero ? 0 : valueOrNaN(value);
  };

  if (roundKey === "kolo1") {
    set("1_proškolen", mapFirstRoundEducation(answers?.q1_education_before));
    set("1_pozn", answers?.q1_education_before?.freeText);
    const q2 = answers?.q2_who_educated ?? {};
    set("2_lékař", mapNestedFrequency(q2, "doctor"));
    set("2_sestra", mapNestedFrequency(q2, "nurse"));
    set("2_farmaceut", mapNestedFrequency(q2, "pharmacist"));
    set("2_nevím", hasSelectedMulti(q2, "unknown") ? 1 : 0);
    set("2_neproškolen", extractComparableValue(answers?.q1_education_before) === "none" ? 1 : 0);
    set("3_jak často1", normalizeChoiceValue(answers?.q3_repeat_frequency));
    set("4_proškolení dostatečné1", normalizeChoiceValue(answers?.q4_education_sufficient));

    const q5 = answers?.q5_preferred_education ?? {};
    set("5_forma_tištěné1", hasNestedMulti(q5, "self_study", "educational_leaflets") ? 1 : 0);
    set("5_forma_samo_videa1", hasNestedMulti(q5, "self_study", "videos") ? 1 : 0);
    set("5_forma_samo_elearning1", hasNestedMulti(q5, "self_study", "elearning") ? 1 : 0);
    set("5_forma_samo_aplikace1", hasNestedMulti(q5, "self_study", "interactive_app") ? 1 : 0);
    set("5_forma_zdravotník_nácvik1", hasNestedMulti(q5, "healthcare_worker", "practical_training") ? 1 : 0);
    set("5_forma_zdravotník_bez nácviku1", hasNestedMulti(q5, "healthcare_worker", "online_demo") ? 1 : 0);

    set("6_důvod léčby", normalizeChoiceValue(answers?.q6_diagnosis));
    set("6_pozn", answers?.q6_diagnosis?.freeText);
    set("7_umím používat", normalizeChoiceValue(answers?.q8_can_use_inhalers));

    const easeRows = Array.isArray(answers?.q9_inhaler_ease) ? answers.q9_inhaler_ease : [];
    set("8_snadno_IS1", normalizeChoiceValue(easeRows[0]?.rating));
    set("8_snadno_IS2", normalizeChoiceValue(easeRows[1]?.rating));
    set("8_snadno_IS3", normalizeChoiceValue(easeRows[2]?.rating));

    set("9_před inhalací1", normalizeChoiceValue(answers?.q10_exhale_before_inhalation));
    set("10_DPI1", normalizeChoiceValue(answers?.q11_dpi_inhale));
    set("11_pMDI1", normalizeChoiceValue(answers?.q12_pmdi_inhale));
    set("12_SMI1", normalizeChoiceValue(answers?.q13_respimat_inhale));
    set("13_po inhalaci1", normalizeChoiceValue(answers?.q14_hold_breath));

    set("14_vzdělání", normalizeChoiceValue(answers?.q15_education_level));
    set("15_sám", normalizeChoiceValue(answers?.q16_lives_alone));
    set("16_povolání", normalizeMultiSlotValue(answers?.q16_current_status, 0));
    set("16_pozn", extractMultiFreeText(answers?.q16_current_status, "other"));
    set("17_zdravotník", normalizeChoiceValue(answers?.q17_healthcare_background));
    set("18_typ zdravotníka", normalizeChoiceValue(answers?.q18_healthcare_field));
    set("18_pozn", answers?.q18_healthcare_field?.freeText);
    set("19_kuřák1", normalizeChoiceValue(answers?.q19_smoking));
    set("19_pozn1", answers?.q19_smoking?.freeText);
    set("20_způsob aktivně1a", normalizeMultiSlotValue(answers?.q20_smoking_types, 0));
    set("20_způsob aktivně1b", normalizeMultiSlotValue(answers?.q20_smoking_types, 1));
    set("20_způsob aktivně1c", normalizeMultiSlotValue(answers?.q20_smoking_types, 2));
    set("20_pozn1", extractMultiFreeText(answers?.q20_smoking_types, "other"));
    set("21_pasivní kuřák1", normalizeChoiceValue(answers?.q21_passive_smoking));
    set("22_způsob pasivně1a", normalizeMultiSlotValue(answers?.q22_passive_smoking_types, 0));
    set("22_způsob pasivně1b", normalizeMultiSlotValue(answers?.q22_passive_smoking_types, 1));
    set("22_způsob pasivně1d", normalizeMultiSlotValue(answers?.q22_passive_smoking_types, 2));
    set("22_pozn1", extractMultiFreeText(answers?.q22_passive_smoking_types, "other"));
    return row;
  }

  const confidenceRows = Array.isArray(answers?.sr_q1_confident) ? answers.sr_q1_confident : [];
  set("1_jistější_IS1", normalizeChoiceValue(confidenceRows[0]?.rating));
  set("1_jistější_IS2", normalizeChoiceValue(confidenceRows[1]?.rating));
  set("1_jistější_IS3", normalizeChoiceValue(confidenceRows[2]?.rating));
  set("2_zdravotní stav", normalizeChoiceValue(answers?.sr_q2_health_improvement));
  set("3_spokojen", normalizeChoiceValue(answers?.sr_q3_training_satisfaction));

  const q4 = answers?.sr_q4_training_benefit ?? {};
  set("4_vysvětlení", normalizeChoiceValue(q4?.pharmacist_training));
  set("4_vitalograph", normalizeChoiceValue(q4?.vitalograph_training));
  set("4_návod", normalizeChoiceValue(q4?.printed_guide));
  set("4_video", normalizeChoiceValue(q4?.video_link));
  set("4_SMS", normalizeChoiceValue(q4?.sms_video));
  set("4_konzultace", normalizeChoiceValue(q4?.whatsapp_reminder));
  set("5_doplnění", answers?.sr_q5_training_improve);
  set("6_neschopen", normalizeChoiceValue(answers?.sr_q6_cannot_do_all_steps));
  set("7_neschopen proč", normalizeMultiSlotValue(answers?.sr_q7_why_not, 0));
  set("7_pozn", extractMultiFreeText(answers?.sr_q7_why_not, "other"));
  set("8_jak často2a", normalizeMultiSlotValue(answers?.sr_q8_training_frequency, 0));
  set("8_jak často2b", normalizeMultiSlotValue(answers?.sr_q8_training_frequency, 1));
  set("8_pozn", "NaN");
  set("9_školil jiný", normalizeChoiceValue(answers?.sr_q9_other_training));
  set("10_jiné info", normalizeChoiceValue(answers?.sr_q10_other_training_differs));
  set("10_pozn", answers?.sr_q10_other_training_differs?.freeText);
  set("11_před inhalací2", normalizeChoiceValue(answers?.sr_q11_exhale_before_inhalation));
  set("12_DPI2", normalizeChoiceValue(answers?.sr_q12_dpi_inhale));
  set("13_pMDI2", normalizeChoiceValue(answers?.sr_q13_pmdi_inhale));
  set("14_SMI2", normalizeChoiceValue(answers?.sr_q14_respimat_inhale));
  set("15_po inhalaci2", normalizeChoiceValue(answers?.sr_q15_hold_breath));
  set("16_proškolení dostatečné2", normalizeChoiceValue(answers?.sr_q16_prior_training_sufficient));
  const q17 = answers?.sr_q17_preferred_training_form ?? {};
  set("17_forma_samo2", hasSelectedMulti(q17, "self_study") ? 1 : 0);
  set("17_forma_zdravotník2", hasSelectedMulti(q17, "healthcare_worker") ? 1 : 0);
  set("18_sám2", normalizeChoiceValue(answers?.sr_q18_lives_alone));
  set("19_kuřák2", normalizeChoiceValue(answers?.sr_q19_smoking));
  set("19_pozn2", answers?.sr_q19_smoking?.freeText);
  set("20_způsob aktivně2a", normalizeMultiSlotValue(answers?.sr_q20_smoking_types, 0));
  set("20_způsob aktivně2b", normalizeMultiSlotValue(answers?.sr_q20_smoking_types, 1));
  set("20_způsob aktivně2c", normalizeMultiSlotValue(answers?.sr_q20_smoking_types, 2));
  set("20_pozn2", extractMultiFreeText(answers?.sr_q20_smoking_types, "other"));
  set("21_pasivní kuřák2", normalizeChoiceValue(answers?.sr_q21_passive_smoking));
  set("22_způsob pasivně2a", normalizeMultiSlotValue(answers?.sr_q22_passive_smoking_types, 0));
  set("22_způsob pasivně2b", normalizeMultiSlotValue(answers?.sr_q22_passive_smoking_types, 1));
  set("22_způsob pasivně2c", normalizeMultiSlotValue(answers?.sr_q22_passive_smoking_types, 2));
  set("22_pozn2", extractMultiFreeText(answers?.sr_q22_passive_smoking_types, "other"));
  return row;
}

function buildVitalographColumns(roundNumber, submission, answers) {
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);
  const prefix = `V${roundNumber}`;
  const set = (header, value) => {
    row[header] = allNaN ? "NaN" : allZero ? 0 : valueOrNaN(value);
  };

  const pmdiSelected = hasSelectedMulti(answers?.vitalograph_inhaler_types, "pmdi");
  const dpiSelected = hasSelectedMulti(answers?.vitalograph_inhaler_types, "dpi");

  set(`${prefix}_pMDI_před`, pmdiSelected ? 1 : "NaN");
  set(`${prefix}_pMDI_před_úroveň IT`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.before?.technique_level));
  set(`${prefix}_pMDI_před_aktivace`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.before?.reservoir_activation));
  set(`${prefix}_pMDI_před_průtok`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.before?.flow_rate));
  set(`${prefix}_pMDI_před_délka`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.before?.inhalation_length));
  set(`${prefix}_pMDI_před_zadržení`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.before?.breath_hold));
  set(`${prefix}_pMDI_po`, pmdiSelected ? 1 : "NaN");
  set(`${prefix}_pMDI_po_úroveň IT`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.after?.technique_level));
  set(`${prefix}_pMDI_po_aktivace`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.after?.reservoir_activation));
  set(`${prefix}_pMDI_po_průtok`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.after?.flow_rate));
  set(`${prefix}_pMDI_po_délka`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.after?.inhalation_length));
  set(`${prefix}_pMDI_po_zadržení`, normalizeChoiceValue(answers?.vitalograph_pmdi_assessment?.after?.breath_hold));
  set(`${prefix}_DPI_před`, dpiSelected ? 1 : "NaN");
  set(`${prefix}_DPI_před_úroveň IT`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.before?.technique_level));
  set(`${prefix}_DPI_před_průtok`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.before?.flow_rate));
  set(`${prefix}_DPI_před_délka`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.before?.inhalation_length));
  set(`${prefix}_DPI_před_zadržení`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.before?.breath_hold));
  set(`${prefix}_DPI_po`, dpiSelected ? 1 : "NaN");
  set(`${prefix}_DPI_po_úroveň IT`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.after?.technique_level));
  set(`${prefix}_DPI_po_průtok`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.after?.flow_rate));
  set(`${prefix}_DPI_po_délka`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.after?.inhalation_length));
  set(`${prefix}_DPI_po_zadržení`, normalizeChoiceValue(answers?.vitalograph_dpi_assessment?.after?.breath_hold));
  return row;
}

function buildVitalographColumnsWithStatus(roundNumber, submission, answers) {
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);
  const prefix = `V${roundNumber}`;
  const set = (header, value) => {
    row[header] = allNaN ? "NaN" : allZero ? 0 : valueOrNaN(value);
  };
  const normalizeVitalographChoice = (value, isUnfilled, isNotNeeded = false) =>
    isUnfilled ? "nevyplneno" : isNotNeeded ? "netreba" : normalizeChoiceValue(value);

  const pmdiSelected = hasSelectedMulti(answers?.vitalograph_inhaler_types, "pmdi");
  const dpiSelected = hasSelectedMulti(answers?.vitalograph_inhaler_types, "dpi");
  const pmdiUnfilled = hasVitalographTypeUnfilledWorker(answers?.vitalograph_inhaler_types, "pmdi");
  const dpiUnfilled = hasVitalographTypeUnfilledWorker(answers?.vitalograph_inhaler_types, "dpi");
  const pmdiAfterNotNeeded = hasVitalographStatusWorker(answers?.vitalograph_pmdi_assessment?.after?.__status, "not_needed");
  const dpiAfterNotNeeded = hasVitalographStatusWorker(answers?.vitalograph_dpi_assessment?.after?.__status, "not_needed");

  set(`${prefix}_pMDI_pĹ™ed`, pmdiUnfilled ? "nevyplneno" : pmdiSelected ? 1 : "NaN");
  set(`${prefix}_pMDI_pĹ™ed_ĂşroveĹ IT`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.before?.technique_level, pmdiUnfilled));
  set(`${prefix}_pMDI_pĹ™ed_aktivace`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.before?.reservoir_activation, pmdiUnfilled));
  set(`${prefix}_pMDI_pĹ™ed_prĹŻtok`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.before?.flow_rate, pmdiUnfilled));
  set(`${prefix}_pMDI_pĹ™ed_dĂ©lka`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.before?.inhalation_length, pmdiUnfilled));
  set(`${prefix}_pMDI_pĹ™ed_zadrĹľenĂ­`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.before?.breath_hold, pmdiUnfilled));
  set(`${prefix}_pMDI_po`, pmdiUnfilled ? "nevyplneno" : pmdiAfterNotNeeded ? "netreba" : pmdiSelected ? 1 : "NaN");
  set(`${prefix}_pMDI_po_ĂşroveĹ IT`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.after?.technique_level, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_aktivace`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.after?.reservoir_activation, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_prĹŻtok`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.after?.flow_rate, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_dĂ©lka`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.after?.inhalation_length, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_zadrĹľenĂ­`, normalizeVitalographChoice(answers?.vitalograph_pmdi_assessment?.after?.breath_hold, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_DPI_pĹ™ed`, dpiUnfilled ? "nevyplneno" : dpiSelected ? 1 : "NaN");
  set(`${prefix}_DPI_pĹ™ed_ĂşroveĹ IT`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.before?.technique_level, dpiUnfilled));
  set(`${prefix}_DPI_pĹ™ed_prĹŻtok`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.before?.flow_rate, dpiUnfilled));
  set(`${prefix}_DPI_pĹ™ed_dĂ©lka`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.before?.inhalation_length, dpiUnfilled));
  set(`${prefix}_DPI_pĹ™ed_zadrĹľenĂ­`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.before?.breath_hold, dpiUnfilled));
  set(`${prefix}_DPI_po`, dpiUnfilled ? "nevyplneno" : dpiAfterNotNeeded ? "netreba" : dpiSelected ? 1 : "NaN");
  set(`${prefix}_DPI_po_ĂşroveĹ IT`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.after?.technique_level, dpiUnfilled, dpiAfterNotNeeded));
  set(`${prefix}_DPI_po_prĹŻtok`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.after?.flow_rate, dpiUnfilled, dpiAfterNotNeeded));
  set(`${prefix}_DPI_po_dĂ©lka`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.after?.inhalation_length, dpiUnfilled, dpiAfterNotNeeded));
  set(`${prefix}_DPI_po_zadrĹľenĂ­`, normalizeVitalographChoice(answers?.vitalograph_dpi_assessment?.after?.breath_hold, dpiUnfilled, dpiAfterNotNeeded));
  return row;
}

function buildMarsColumns(roundNumber, submission, answers) {
  const prefix = `MARS${roundNumber}`;
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);
  const set = (header, value) => {
    row[header] = allNaN ? "NaN" : allZero ? 0 : valueOrNaN(value);
  };

  const scores = [
    scoreMars(answers?.mars_cz?.forget),
    scoreMars(answers?.mars_cz?.adjust),
    scoreMars(answers?.mars_cz?.stop_temporarily),
    scoreMars(answers?.mars_cz?.skip),
    scoreMars(answers?.mars_cz?.less_than_prescribed)
  ];

  set(`${prefix}_vyplnění`, formatSubmissionState(submission));
  set(`${prefix}_ot1`, scores[0]);
  set(`${prefix}_ot2`, scores[1]);
  set(`${prefix}_ot3`, scores[2]);
  set(`${prefix}_ot4`, scores[3]);
  set(`${prefix}_ot5`, scores[4]);
  set(`součet MARS${roundNumber}`, scores.every((item) => typeof item === "number") ? scores.reduce((sum, item) => sum + item, 0) : "NaN");
  return row;
}

function buildFsiColumns(roundNumber, slot, submission, answers) {
  const prefix = `FSI${roundNumber}_IS${slot}`;
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);
  const set = (header, value) => {
    row[header] = allNaN ? "NaN" : allZero ? 0 : valueOrNaN(value);
  };

  const fsi = answers?.fsi10 ?? {};
  const scoreKeys = [
    "learn",
    "prepare",
    "use",
    "clean",
    "activities",
    "lips",
    "size_weight",
    "carry",
    "correct_use_feeling",
    "overall_satisfaction"
  ];
  const scores = scoreKeys.map((key) => scoreFsi(fsi?.[key]));

  set(`${prefix}_vyplnění`, formatSubmissionState(submission));
  scoreKeys.forEach((_, index) => {
    set(`${prefix}_ot${index + 1}`, scores[index]);
  });
  set(`${prefix}_součet`, scores.every((item) => typeof item === "number") ? scores.reduce((sum, item) => sum + item, 0) : "NaN");
  return row;
}

function buildEvaluationColumns(roundNumber, submission, answers) {
  const templates = getEvaluationTemplatesByCode(`kolo${roundNumber}-dalsi-formular`);
  const slotLabel = `H0${roundNumber}`;
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);
  const devices = new Map(
    (Array.isArray(answers?.device_assessments?.devices) ? answers.device_assessments.devices : []).map((device) => [
      String(device.deviceKey ?? ""),
      device
    ])
  );

  for (const [deviceKey, prefix] of getEvaluationExportOrder()) {
    const template = templates[deviceKey];
    const device = devices.get(deviceKey);
    const selectedErrors = device?.selectedErrors ?? {};
    const selectedSlots = Array.isArray(answers?.selected_inhalers) ? answers.selected_inhalers : [];

    row[`${prefix}_${slotLabel}`] = allNaN ? "NaN" : allZero ? 0 : selectedSlots.includes(deviceKey) ? 1 : "NaN";

    let totalErrors = 0;
    let touchedSteps = 0;
    for (let groupIndex = 0; groupIndex < (template?.errorGroups?.length ?? 0); groupIndex += 1) {
      const stepNumber = groupIndex + 1;
      const checked = Array.isArray(selectedErrors?.[groupIndex]) ? selectedErrors[groupIndex] : [];
      row[`${prefix}_${slotLabel}_${stepNumber}`] = allNaN ? "NaN" : allZero ? 0 : device ? 1 : "NaN";
      if (checked.length > 0) {
        touchedSteps += 1;
      }
      const itemCount = template.errorGroups[groupIndex]?.items?.length ?? 0;
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        const isChecked = checked.includes(itemIndex);
        row[`${prefix}_${slotLabel}_${stepNumber}${String.fromCharCode(97 + itemIndex)}`] = allNaN ? "NaN" : allZero ? 0 : device ? (isChecked ? 1 : 0) : "NaN";
        if (isChecked) {
          totalErrors += 1;
        }
      }
    }
    row[`${prefix}_${slotLabel}_chyby celkově`] = allNaN ? "NaN" : allZero ? 0 : device ? totalErrors : "NaN";
    row[`${prefix}_${slotLabel}_chybné kroky`] = allNaN ? "NaN" : allZero ? 0 : device ? touchedSteps : "NaN";
  }

  return row;
}

function getEvaluationTemplatesByCode(questionnaireCode) {
  const questionnaire = getQuestionnaireByCode(questionnaireCode);
  const bundleQuestion = questionnaire?.sections
    ?.flatMap((section) => section.questions ?? [])
    ?.find((question) => question.key === "device_assessments");

  return bundleQuestion?.templates ?? {};
}

function getEvaluationExportOrder() {
  return [
    ["aerolizer", "aerolizer"],
    ["aerosphere", "aerosphere"],
    ["pmdi", "pMDI"],
    ["pmdi_nastavec", "pMDIN"],
    ["breezhaler", "breezhaler"],
    ["diskus", "diskus"],
    ["easyhaler", "easy"],
    ["ellipta", "ellipta"],
    ["forspiro", "forspiro"],
    ["genuair", "genuair"],
    ["handihaler", "handi"],
    ["nexthaler", "next"],
    ["respimat", "respimat"],
    ["respimat_nastavec", "respimatN"],
    ["spiromax", "spiromax"],
    ["turbuhaler", "turbu"],
    ["twisthaler", "twist"]
  ];
}

function groupBy(items, getKey) {
  const grouped = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  }
  return grouped;
}

function normalizeChoiceValue(value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (String(comparable) === "0") {
    return 0;
  }
  return comparable;
}

function extractComparableValue(value) {
  if (value && typeof value === "object" && "selected" in value && typeof value.selected === "string") {
    return value.selected;
  }
  return value;
}

function mapFirstRoundEducation(value) {
  const comparable = extractComparableValue(value);
  if (comparable === "0") {
    return 0;
  }
  if (!comparable) {
    return "NaN";
  }
  return comparable;
}

function mapNestedFrequency(value, optionKey) {
  if (!value || typeof value !== "object") {
    return "NaN";
  }
  const selected = Array.isArray(value.selected) ? value.selected : [];
  const nestedValue = value.nested?.[optionKey]?.selected;
  if (!selected.includes(optionKey) && !nestedValue) {
    return 0;
  }
  if (!nestedValue || nestedValue === "0") {
    return 0;
  }
  return nestedValue;
}

function hasSelectedMulti(value, optionKey) {
  const selected = Array.isArray(value?.selected) ? value.selected : Array.isArray(value) ? value : [];
  return selected.includes(optionKey);
}

function hasVitalographTypeUnfilledWorker(value, optionKey) {
  const unfilled = Array.isArray(value?.unfilled) ? value.unfilled : [];
  return unfilled.includes(optionKey);
}

function hasVitalographStatusWorker(value, expected) {
  return String(value ?? "").trim().toLowerCase() === String(expected ?? "").trim().toLowerCase();
}

function hasNestedMulti(value, optionKey, nestedKey) {
  const nestedSelected = Array.isArray(value?.nested?.[optionKey]?.selected)
    ? value.nested[optionKey].selected
    : [];
  return nestedSelected.includes(nestedKey);
}

function normalizeMultiSlotValue(value, slotIndex) {
  const selected = Array.isArray(value?.selected) ? value.selected.filter((item) => item !== "0") : [];
  const picked = selected[slotIndex];
  return picked ? picked : selected.length ? "NaN" : "NaN";
}

function extractMultiFreeText(value, optionKey) {
  return value?.freeTextMap?.[optionKey] || "";
}

function scoreMars(value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (String(comparable) === "0") {
    return 0;
  }

  const scores = {
    always: 1,
    often: 2,
    sometimes: 3,
    rarely: 4,
    never: 5
  };

  return scores[comparable] ?? "NaN";
}

function scoreFsi(value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (String(comparable) === "0") {
    return 0;
  }

  const scores = {
    very: 5,
    quite: 4,
    partly: 3,
    little: 2,
    almost_not: 1
  };

  return scores[comparable] ?? "NaN";
}

function exportInhalerLabel(code) {
  if (!code) {
    return "";
  }

  const questionnaire = getQuestionnaireByCode("kolo1-inhalacni-technika");
  const inhalerQuestion = questionnaire?.sections?.[0]?.questions?.find((item) => item.key === "inhalation_systems");
  const option = inhalerQuestion?.options?.find((item) => item.key === code);
  return option?.label ?? code;
}

function hasAerosolInhaler(inhalers) {
  return inhalers.some((item) => ["pmdi", "pmdi_nastavec", "aerosphere", "respimat", "respimat_nastavec"].includes(item));
}

function hasDpiInhaler(inhalers) {
  return inhalers.some((item) =>
    [
      "aerolizer",
      "breezhaler",
      "diskus",
      "easyhaler",
      "ellipta",
      "forspiro",
      "genuair",
      "handihaler",
      "nexthaler",
      "spiromax",
      "turbuhaler",
      "twisthaler"
    ].includes(item)
  );
}

function resolveSubmissionActor(submission, context) {
  if (!submission) {
    return "";
  }

  if (submission.filled_by_user_id) {
    const user = context.internalUsersById.get(Number(submission.filled_by_user_id));
    return user?.login_id || user?.email || "";
  }

  if (submission.filled_by_doctor_account_id) {
    const doctor = context.doctorsById.get(Number(submission.filled_by_doctor_account_id));
    return doctor?.login_id || "";
  }

  return "";
}

function valueOrNaN(value) {
  if (value == null) {
    return "NaN";
  }
  if (typeof value === "string" && value.trim() === "") {
    return "NaN";
  }
  return value;
}

function escapeHtmlForHtmlExport(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadLatestCompletedSubmissionGroups(env) {
  const result = await env.DB.prepare(
    `SELECT
      s.id,
      s.patient_id,
      p.noveid AS patient_noveid,
      s.questionnaire_code,
      s.questionnaire_title,
      s.questionnaire_version,
      s.answers_json,
      s.completed_at,
      s.updated_at
    FROM questionnaire_submissions s
    JOIN patients p ON p.id = s.patient_id
    WHERE s.status = 'completed'
    ORDER BY s.questionnaire_code ASC, p.noveid ASC, COALESCE(s.completed_at, s.updated_at) DESC`
  ).all();

  const rows = result.results ?? [];
  const latestByPatientAndQuestionnaire = new Map();

  for (const row of rows) {
    const key = `${row.questionnaire_code}::${row.patient_id}`;
    if (!latestByPatientAndQuestionnaire.has(key)) {
      latestByPatientAndQuestionnaire.set(key, row);
    }
  }

  const groupedRows = Array.from(latestByPatientAndQuestionnaire.values());
  const catalog = getQuestionnaireCatalog();

  return catalog.map((questionnaire) => {
    const questionnaireRows = groupedRows
      .filter((row) => row.questionnaire_code === questionnaire.code)
      .sort((left, right) => String(left.patient_noveid).localeCompare(String(right.patient_noveid), "cs"));

    return {
      questionnaire_code: questionnaire.code,
      questionnaire_title: questionnaire.title,
      questionnaire_version: questionnaire.version,
      rows: questionnaireRows.map((row) => ({
        patient_noveid: row.patient_noveid,
        questionnaire_version: row.questionnaire_version,
        completed_at: formatDateTimeForExport(row.completed_at || row.updated_at),
        answers: flattenAnswersForExport(questionnaire.code, safeJsonParse(row.answers_json, {}))
      }))
    };
  });
}

function flattenAnswersForExport(questionnaireCode, answers) {
  const questionnaire = getQuestionnaireByCode(questionnaireCode);
  if (!questionnaire) {
    return [];
  }

  const flattened = [];
  for (const section of questionnaire.sections) {
    for (const question of section.questions) {
      flattened.push({
        key: question.key,
        label: question.label,
        value: formatAnswerValueForExport(question, answers?.[question.key])
      });
    }
  }

  return flattened;
}

function formatAnswerValueForExport(question, value) {
  if (value == null || value === "") {
    return "";
  }

  if (question.type === "text" || question.type === "date" || question.type === "textarea") {
    return String(value);
  }

  if (question.type === "single_choice") {
    const selectedKey = typeof value === "object" ? value.selected : value;
    const option = question.options.find((item) => item.key === selectedKey);
    const text = option?.label ?? String(selectedKey);
    return typeof value === "object" && value.freeText ? `${text} (${value.freeText})` : text;
  }

  if (question.type === "multi_choice") {
    const selected = value.selected ?? [];
    return selected
      .map((selectedKey) => {
        const option = question.options.find((item) => item.key === selectedKey);
        const freeText = value.freeTextMap?.[selectedKey];
        return `${option?.label ?? selectedKey}${freeText ? ` (${freeText})` : ""}`;
      })
      .join("; ");
  }

  if (question.type === "multi_choice_nested") {
    const selected = value.selected ?? [];
    return selected
      .map((selectedKey) => {
        const option = question.options.find((item) => item.key === selectedKey);
        const nestedValue = value.nested?.[selectedKey];
        const nestedSingle = nestedValue?.selected ? findNestedLabel(option, nestedValue.selected) || nestedValue.selected : "";
        const nestedMulti = Array.isArray(nestedValue?.selected)
          ? nestedValue.selected.map((key) => findNestedLabel(option, key) || key).join(", ")
          : "";
        const suffix = [nestedSingle, nestedMulti].filter(Boolean).join(" / ");
        return suffix ? `${option?.label ?? selectedKey} (${suffix})` : option?.label ?? selectedKey;
      })
      .join("; ");
  }

  if (question.type === "repeatable_matrix_single") {
    const rows = Array.isArray(value) ? value : [];
    return rows
      .map((row) => {
        const option = question.options.find((item) => item.key === row.rating);
        return `${row.name || "Bez názvu"}: ${option?.label ?? row.rating ?? ""}`;
      })
      .join("; ");
  }

  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function findNestedLabel(option, key) {
  const nestedSingle = option?.nestedSingleChoice?.options?.find((item) => item.key === key);
  if (nestedSingle) {
    return nestedSingle.label;
  }

  const nestedMulti = option?.nestedMultiChoice?.options?.find((item) => item.key === key);
  if (nestedMulti) {
    return nestedMulti.label;
  }

  return null;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function formatDateTimeForExport(value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
