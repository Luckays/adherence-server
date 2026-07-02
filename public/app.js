const state = {
  user: null,
  patients: [],
  users: [],
  currentView: "patients",
  selectedPatientId: null,
  selectedPatient: null,
  selectedPatientSubmissions: [],
  questionnaires: [],
  activeSubmission: null,
  activeQuestionnaire: null,
  openInhalerEvaluations: []
};

const elements = {
  loginCard: document.querySelector("#loginCard"),
  loginForm: document.querySelector("#loginForm"),
  loginMessage: document.querySelector("#loginMessage"),
  appShell: document.querySelector("#appShell"),
  sessionBadge: document.querySelector("#sessionBadge"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  patientSummary: document.querySelector("#patientSummary"),
  patientTableWrap: document.querySelector("#patientTableWrap"),
  patientForm: document.querySelector("#patientForm"),
  userForm: document.querySelector("#userForm"),
  userList: document.querySelector("#userList"),
  adminUserSection: document.querySelector("#adminUserSection"),
  patientsView: document.querySelector("#patientsView"),
  patientView: document.querySelector("#patientView"),
  questionnaireView: document.querySelector("#questionnaireView"),
  logoutButton: document.querySelector("#logoutButton"),
  backupButton: document.querySelector("#backupButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  exportRound1Button: document.querySelector("#exportRound1Button"),
  exportRound2Button: document.querySelector("#exportRound2Button")
};

init();

async function init() {
  wireEvents();
  await tryRestoreSession();
}

function wireEvents() {
  elements.loginForm.addEventListener("submit", onLoginSubmit);
  elements.searchForm.addEventListener("submit", onSearchSubmit);
  elements.searchInput.addEventListener("input", onSearchInput);
  elements.patientForm.addEventListener("submit", onPatientCreate);
  elements.userForm.addEventListener("submit", onUserCreate);
  elements.logoutButton.addEventListener("click", onLogout);
  elements.backupButton.addEventListener("click", onBackupDownload);
  elements.exportCsvButton.addEventListener("click", () => onDataExport("csv"));
  elements.exportRound1Button.addEventListener("click", () => onRoundExport("kolo1"));
  elements.exportRound2Button.addEventListener("click", () => onRoundExport("kolo2"));
}

async function tryRestoreSession() {
  try {
    const response = await api("/api/auth/me");
    state.user = response.user;
    await afterLogin();
  } catch {
    renderAuth();
  }
}

async function onLoginSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  try {
    const response = await api("/api/auth/login", {
      method: "POST",
      body: {
        loginId: formData.get("loginId"),
        password: formData.get("password")
      }
    });

    state.user = response.user;
    elements.loginMessage.textContent = "";
    await afterLogin();
  } catch (error) {
    elements.loginMessage.textContent = "Přihlášení se nepodařilo. Zkontroluj účet nebo bootstrap admina.";
  }
}

async function afterLogin() {
  renderAppChrome();
  await Promise.all([loadQuestionnaires(), loadPatients(""), loadUsersIfAdmin()]);
  showView("patients");
}

async function onLogout() {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.selectedPatientId = null;
  state.selectedPatient = null;
  state.selectedPatientSubmissions = [];
  state.activeSubmission = null;
  state.activeQuestionnaire = null;
  state.currentView = "patients";
  renderAuth();
}

async function onSearchSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  await loadPatients(String(formData.get("query") ?? ""));
}

let searchDebounceId = null;

function onSearchInput(event) {
  const query = String(event.currentTarget.value ?? "");
  clearTimeout(searchDebounceId);
  searchDebounceId = setTimeout(() => {
    loadPatients(query);
  }, 120);
}

async function onPatientCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  try {
    const response = await api("/api/patients", {
      method: "POST",
      body: {
        noveid: formData.get("noveid"),
        notes: formData.get("notes")
      }
    });

    form.reset();
    await loadPatients(elements.searchInput.value);
    await selectPatient(response.patient.id);
  } catch (error) {
    alert(`Pacienta se nepodařilo uložit. ${error.message}`);
  }
}

async function onUserCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  try {
    await api("/api/admin/users", {
      method: "POST",
      body: {
        loginId: formData.get("loginId"),
        password: formData.get("password"),
        role: formData.get("role")
      }
    });

    form.reset();
    await loadUsersIfAdmin();
  } catch (error) {
    alert(`Uživatele se nepodařilo uložit. ${error.message}`);
  }
}

async function onPatientDelete() {
  if (!state.selectedPatientId || !state.selectedPatient) {
    return;
  }

  const confirmed = window.confirm(`Opravdu smazat pacienta ${state.selectedPatient.noveid} včetně všech verzí dotazníků?`);
  if (!confirmed) {
    return;
  }

  await api(`/api/patients/${state.selectedPatientId}`, { method: "DELETE" });
  state.selectedPatientId = null;
  state.selectedPatient = null;
  state.selectedPatientSubmissions = [];
  state.activeSubmission = null;
  state.activeQuestionnaire = null;
  await loadPatients(elements.searchInput.value);
  showView("patients");
}

async function onSubmissionDelete(submissionId) {
  const confirmed = window.confirm("Opravdu smazat tuto verzi dotazníku?");
  if (!confirmed) {
    return;
  }

  await api(`/api/submissions/${submissionId}`, { method: "DELETE" });
  await refreshSelectedPatientSubmissions();
  const patientResponse = await api(`/api/patients/${state.selectedPatientId}`);
  state.selectedPatient = patientResponse.patient;
  state.selectedPatientSummary = patientResponse.summary;
  await loadPatients(elements.searchInput.value);
  renderPatientDetail();
}

async function loadPatients(query) {
  const response = await api(`/api/patients?query=${encodeURIComponent(query)}`);
  state.patients = response.items;
  renderPatientsTable();
  renderPatientSummary(query);
}

async function loadQuestionnaires() {
  const response = await api("/api/questionnaires");
  state.questionnaires = response.items;
}

async function selectPatient(patientId) {
  state.selectedPatientId = patientId;
  const [patientResponse, submissionsResponse] = await Promise.all([
    api(`/api/patients/${patientId}`),
    api(`/api/patients/${patientId}/submissions`)
  ]);

  state.selectedPatient = patientResponse.patient;
  state.selectedPatientSummary = patientResponse.summary;
  state.selectedPatientSubmissions = submissionsResponse.items;
  state.activeSubmission = null;
  state.activeQuestionnaire = null;

  renderPatientsTable();
  renderPatientDetail();
  showView("patient");
}

async function startQuestionnaire(questionnaireCode) {
  if (!state.selectedPatientId) {
    return;
  }

  const questionnaireState = getPatientQuestionnaireState(questionnaireCode);
  if (questionnaireState?.lastCompletedId) {
    const confirmed = window.confirm("Tento dotazník už je veden jako dokončený. Opravdu chcete založit novou verzi?");
    if (!confirmed) {
      return;
    }
  }

  const response = await api(`/api/patients/${state.selectedPatientId}/submissions`, {
    method: "POST",
    body: { questionnaireCode }
  });

  state.activeSubmission = response.submission;
  state.activeQuestionnaire = response.questionnaire;
  state.openInhalerEvaluations = [];
  await refreshSelectedPatientSubmissions();
  renderQuestionnaireEditor();
  showView("questionnaire");
}

async function openSubmission(submissionId) {
  const response = await api(`/api/submissions/${submissionId}`);
  state.activeSubmission = response.submission;
  state.activeQuestionnaire = response.questionnaire;
  state.openInhalerEvaluations = [];
  renderQuestionnaireEditor();
  showView("questionnaire");
}

async function saveSubmission(status, options = {}) {
  if (!state.activeSubmission || !state.activeQuestionnaire) {
    return;
  }

  const answers = collectAnswers();
  if (options.markPatientUnfilled) {
    answers.__patient_not_filled = true;
  }

  if (status === "completed" && !options.skipValidation) {
    const missing = validateRequiredAnswers(state.activeQuestionnaire, answers);
    if (missing.length) {
      alert(`Před dokončením je potřeba vyplnit: ${missing.join(", ")}`);
      return;
    }
  }

  const response = await api(`/api/submissions/${state.activeSubmission.id}`, {
    method: "PUT",
    body: {
      status,
      answers
    }
  });

  state.activeSubmission = response.submission;
  await refreshSelectedPatientSubmissions();
  renderPatientDetail();
  renderQuestionnaireEditor();

  if (options.closeAfterSave) {
    showView("patient");
  }
}

async function printSubmission(submissionId) {
  const response = await api(`/api/submissions/${submissionId}`);
  const printableHtml = buildPrintableHtml(response.questionnaire, response.submission, state.selectedPatient);
  const popup = window.open("", "_blank", "width=1100,height=900");
  if (!popup) {
    alert("Nepodařilo se otevřít tiskové okno.");
    return;
  }

  popup.document.open();
  popup.document.write(printableHtml);
  popup.document.close();
  popup.focus();
  popup.print();
}

async function refreshSelectedPatientSubmissions() {
  if (!state.selectedPatientId) {
    return;
  }

  const response = await api(`/api/patients/${state.selectedPatientId}/submissions`);
  state.selectedPatientSubmissions = response.items;
}

function renderAuth() {
  elements.loginCard.classList.remove("hidden");
  elements.appShell.classList.add("hidden");
  elements.sessionBadge.classList.add("hidden");
  elements.backupButton.classList.add("hidden");
  elements.adminUserSection.classList.add("hidden");
}

function renderAppChrome() {
  elements.loginCard.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.sessionBadge.classList.remove("hidden");
  elements.sessionBadge.textContent = `${state.user.login_id || state.user.email || "uživatel"} · ${state.user.role}`;
  elements.backupButton.classList.toggle("hidden", state.user.role !== "admin");
  elements.adminUserSection.classList.toggle("hidden", state.user.role !== "admin");
}

function showView(viewName) {
  state.currentView = viewName;
  elements.patientsView.classList.toggle("hidden", viewName !== "patients");
  elements.patientView.classList.toggle("hidden", viewName !== "patient");
  elements.questionnaireView.classList.toggle("hidden", viewName !== "questionnaire");
}

async function onBackupDownload() {
  const confirmed = window.confirm("Spustit export databáze a stáhnout SQL zálohu?");
  if (!confirmed) {
    return;
  }

  const response = await fetch("/api/admin/backup-export", {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    alert("Zalohu se nepodarilo vytvorit.");
    return;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=\"([^\"]+)\"/);
  const fileName = match ? match[1] : "backup.sql";
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}

async function onDataExport(format) {
  const response = await fetch(`/api/exports/full.${format}`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) {
    alert(`Export ${format.toUpperCase()} se nepodařilo vytvořit.`);
    return;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=\"([^\"]+)\"/);
  const fileName = match ? match[1] : `full-export.${format}`;
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}

async function onRoundExport(roundKey) {
  const response = await fetch(`/api/exports/${roundKey}.csv`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) {
    alert(`Export ${roundKey} se nepodařilo vytvořit.`);
    return;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=\"([^\"]+)\"/);
  const fileName = match ? match[1] : `${roundKey}.csv`;
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}

function renderPatientSummaryView(query) {
  const total = state.patients.length;

  elements.patientSummary.innerHTML = `
    <div class="meta-pill">Pacientů: ${total}</div>
    ${query ? `<div class="meta-pill">Filtr: ${escapeHtml(query)}</div>` : ""}
  `;
}

function renderPatientsTableView() {
  if (!state.patients.length) {
    elements.patientTableWrap.innerHTML = `<div class="panel-inline"><p>Nebyl nalezen žádný pacient.</p></div>`;
    return;
  }

  elements.patientTableWrap.innerHTML = `
    <table class="patient-table">
      <thead>
        <tr>
          <th>Identifikátor</th>
          <th>Formuláře</th>
          <th>Poslední změna</th>
        </tr>
      </thead>
      <tbody>
        ${state.patients
          .map((patient) => {
            const tags = renderPatientFormTags(patient);
            return `
              <tr>
                <td>
                  <button class="patient-row-button" data-patient-id="${patient.id}">
                    <strong>${escapeHtml(patient.noveid)}</strong>
                  </button>
                </td>
                <td>${tags}</td>
                <td>${formatDateTime(patient.last_submission_at || patient.updated_at)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;

  elements.patientTableWrap.querySelectorAll("[data-patient-id]").forEach((item) => {
    item.addEventListener("click", () => selectPatient(item.dataset.patientId));
  });
}

function renderUserListView() {
  if (state.user?.role !== "admin") {
    return;
  }

  if (!state.users.length) {
    elements.userList.innerHTML = `<div class="panel-inline"><p>Zatím tu není žádný další uživatel.</p></div>`;
    return;
  }

  elements.userList.innerHTML = state.users
    .map(
      (user) => `
        <article class="question-card">
          <div class="submission-head">
            <div>
              <strong>${escapeHtml(user.login_id || user.email || `Uživatel ${user.id}`)}</strong>
              <p class="muted">${escapeHtml(
                user.role === "admin"
                  ? `Admin${user.login_id ? ` · ID ${user.login_id}` : ""}`
                  : user.role === "doctor"
                    ? `Zdravotník${user.login_id ? ` · ID ${user.login_id}` : ""}`
                    : `Vyšetřující${user.login_id ? ` · ID ${user.login_id}` : ""}`
              )}</p>
            </div>
            <span class="status-chip ${user.is_active ? "completed" : "not-started"}">
              ${user.is_active ? "Aktivní" : "Neaktivní"}
            </span>
          </div>
          <div class="questionnaire-actions">
            ${
              !(user.account_type === "internal" && user.id === state.user.id)
                ? `<button class="ghost small" data-delete-user="${user.account_type}:${user.id}">Odstranit</button>`
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");

  elements.userList.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Opravdu odstranit tohoto uživatele?");
      if (!confirmed) {
        return;
      }
      const [accountType, id] = String(button.dataset.deleteUser).split(":");
      await api(`/api/admin/users/${accountType}/${id}`, { method: "DELETE" });
      await loadUsersIfAdmin();
    });
  });
}

function renderPatientDetailView() {
  if (!state.selectedPatient) {
    showView("patients");
    return;
  }

  const patient = state.selectedPatient;
  const summary = state.selectedPatientSummary ?? {};
  const questionnaireStatuses = summarizeQuestionnaires(
    state.questionnaires,
    state.selectedPatientSubmissions
  );
  const groupedQuestionnaires = groupQuestionnairesByRound(questionnaireStatuses);

  elements.patientView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="back-row">
        <div class="questionnaire-actions">
          <button class="ghost" data-back-to-patients>Domů</button>
          <button class="danger small" data-delete-patient>Smazat pacienta</button>
        </div>
      </div>

      <div class="patient-header">
        <div>
          <p class="eyebrow">Detail pacienta</p>
          <h2>${escapeHtml(patient.noveid)}</h2>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <strong>Identifikátor</strong>
          <div>${escapeHtml(patient.noveid)}</div>
        </div>
        <div class="detail-card">
          <strong>Poznámka</strong>
          <div>${escapeHtml(patient.notes || "Neuvedeno")}</div>
        </div>
        <div class="detail-card">
          <strong>Rozepsané</strong>
          <div>${summary.in_progress_count ?? 0}</div>
        </div>
        <div class="detail-card">
          <strong>Dokončené</strong>
          <div>${summary.completed_count ?? 0}</div>
        </div>
      </div>

      <div class="section-card">
        <div class="submission-head">
          <div>
            <h3>Dotazníky</h3>
            <p class="muted">Formuláře jsou rozdělené do dvou kol. U každého je stav podle posledního relevantního vyplnění.</p>
          </div>
        </div>
        <div class="round-list">
          ${groupedQuestionnaires.map((group) => renderQuestionnaireRound(group)).join("")}
        </div>
      </div>

      <details class="section-card history-toggle">
        <summary>
          <div>
            <h3>Historie a přehled</h3>
            <p class="muted">Rozkliknutím zobrazíš historii vyplnění a změn stavu.</p>
          </div>
        </summary>
        <div class="submission-list scroll-panel">
          ${renderSubmissionList()}
        </div>
      </details>
    </section>
  `;

  elements.patientView.querySelector("[data-back-to-patients]").addEventListener("click", () => {
    showView("patients");
  });
  elements.patientView.querySelector("[data-delete-patient]").addEventListener("click", onPatientDelete);

  elements.patientView.querySelectorAll("[data-start-questionnaire]").forEach((button) => {
    button.addEventListener("click", () => startQuestionnaire(button.dataset.startQuestionnaire));
  });

  elements.patientView.querySelectorAll("[data-open-submission]").forEach((button) => {
    button.addEventListener("click", () => openSubmission(button.dataset.openSubmission));
  });

  elements.patientView.querySelectorAll("[data-print-submission]").forEach((button) => {
    button.addEventListener("click", () => printSubmission(button.dataset.printSubmission));
  });

  elements.patientView.querySelectorAll("[data-delete-submission]").forEach((button) => {
    button.addEventListener("click", () => onSubmissionDelete(button.dataset.deleteSubmission));
  });
}

function renderSubmissionListView() {
  if (!state.selectedPatientSubmissions.length) {
    return `<div class="question-card"><p>Zatím tu není žádný dotazník.</p></div>`;
  }

  return state.selectedPatientSubmissions
    .map(
      (submission) => `
        <article class="submission-card">
          <div class="submission-head">
            <div>
              <h3>${escapeHtml(submission.questionnaire_title)}</h3>
              <p class="muted">${escapeHtml(submission.questionnaire_code)} · verze ${escapeHtml(submission.questionnaire_version)}</p>
            </div>
            <span class="status-chip ${submission.status === "completed" ? "completed" : "in-progress"}">
              ${submission.status === "completed" ? "Dokončený" : "Rozepsaný"}
            </span>
          </div>
          <div class="meta-line">
            <span>Založeno: ${formatDateTime(submission.started_at)}</span>
            <span>Poslední změna: ${formatDateTime(submission.updated_at)}</span>
          </div>
          <div class="questionnaire-actions">
            <button class="ghost small" data-open-submission="${submission.id}">Otevřít / upravit</button>
            <button class="ghost small" data-print-submission="${submission.id}">Tisk</button>
            <button class="danger small" data-delete-submission="${submission.id}">Smazat verzi</button>
          </div>
        </article>
      `
    )
    .join("");
}

function summarizeQuestionnaires(questionnaires, submissions) {
  return questionnaires.map((questionnaire) => {
    const related = submissions
      .filter((submission) => submission.questionnaire_code === questionnaire.code)
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());

    const internalRelated =
      questionnaire.formKey === "dalsi-formular"
        ? related.filter((submission) => String(submission.evaluation_slot || "").toLowerCase() === "h0")
        : related;
    const latestSubmission = internalRelated[0] || null;
    const lastInProgress = internalRelated.find((submission) => submission.status === "in_progress");
    const lastCompleted = internalRelated.find((submission) => submission.status === "completed");
    const doctorEvaluationCount =
      questionnaire.formKey === "dalsi-formular"
        ? new Set(
            related
              .map((submission) => String(submission.evaluation_slot || "").toLowerCase())
              .filter((slot) => /^h[1-6]$/.test(slot))
          ).size
        : 0;

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
      statusLabel,
      statusClass,
      lastUpdatedAt: latestSubmission?.updated_at || null,
      lastInProgressId: latestSubmission?.status === "in_progress" ? latestSubmission.id : lastInProgress?.id || null,
      lastCompletedId: latestSubmission?.status === "completed" ? latestSubmission.id : lastCompleted?.id || null,
      doctorEvaluationCount
    };
  });
}

function groupQuestionnairesByRound(questionnaireStatuses) {
  const roundItems = questionnaireStatuses
    .filter((item) => !item.isLegacy && item.roundKey)
    .sort((left, right) => {
      const roundOrderDiff = Number(left.roundOrder ?? 999) - Number(right.roundOrder ?? 999);
      if (roundOrderDiff !== 0) {
        return roundOrderDiff;
      }
      return Number(left.formOrder ?? 999) - Number(right.formOrder ?? 999);
    });

  const grouped = new Map();
  for (const item of roundItems) {
    if (!grouped.has(item.roundKey)) {
      grouped.set(item.roundKey, {
        roundKey: item.roundKey,
        roundLabel: item.roundLabel,
        roundOrder: item.roundOrder,
        lastUpdatedAt: null,
        items: []
      });
    }
    const group = grouped.get(item.roundKey);
    group.items.push(item);
    const candidateDate = item.lastUpdatedAt ? new Date(item.lastUpdatedAt).getTime() : 0;
    const currentDate = group.lastUpdatedAt ? new Date(group.lastUpdatedAt).getTime() : 0;
    if (candidateDate > currentDate) {
      group.lastUpdatedAt = item.lastUpdatedAt;
    }
  }

  return Array.from(grouped.values()).sort(
    (left, right) => Number(left.roundOrder ?? 999) - Number(right.roundOrder ?? 999)
  );
}

function renderQuestionnaireRound(group) {
  const visibleItems = getVisibleRoundItems(group.items, group.roundKey);
  return `
    <section class="round-card">
      <div class="submission-head">
        <div>
          <p class="eyebrow">${escapeHtml(group.roundKey)}</p>
          <h3>${escapeHtml(group.roundLabel)}</h3>
        </div>
        <span class="meta-pill">Poslední změna: ${escapeHtml(formatDateTime(group.lastUpdatedAt))}</span>
      </div>
      <div class="round-shortcuts">
        ${visibleItems.map((item) => renderQuestionnaireShortcut(item)).join("")}
      </div>
    </section>
  `;
}

function renderQuestionnaireShortcut(item) {
  const label = getQuestionnaireShortcutLabel(item);
  const evaluationMeta =
    item.formKey === "dalsi-formular"
      ? `<span class="meta-pill">H ${Number(item.doctorEvaluationCount ?? 0)}/6</span>`
      : "";
  return `
    <article class="round-shortcut ${escapeHtml(item.statusClass)}">
      <div class="round-shortcut-head">
        <span class="round-shortcut-label">${escapeHtml(label)}</span>
        <div class="questionnaire-actions">
          ${evaluationMeta}
          <span class="status-chip ${item.statusClass}">${escapeHtml(item.statusLabel)}</span>
        </div>
      </div>
      <div class="questionnaire-actions">
        ${
          item.lastInProgressId
            ? `<button class="primary small" data-open-submission="${item.lastInProgressId}">Pokračovat</button>`
            : `<button class="primary small" data-start-questionnaire="${escapeHtml(item.code)}">Vyplnit dotazník</button>`
        }
        ${
          item.lastCompletedId
            ? `<button class="ghost small" data-open-submission="${item.lastCompletedId}">Otevřít poslední</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function getPatientQuestionnaireState(questionnaireCode) {
  const summaries = summarizeQuestionnaires(state.questionnaires, state.selectedPatientSubmissions || []);
  return summaries.find((item) => item.code === questionnaireCode) || null;
}

function getQuestionnaireShortcutLabel(item) {
  const roundNumber = extractRoundNumber(item.roundKey);
  const formKey = String(item.formKey ?? "");
  const linkedInhalerLabel = getLinkedInhalerLabel(item);

  if (formKey === "inhalacni-technika") {
    return `Dotazník ${roundNumber}`;
  }

  if (formKey === "vitalograf") {
    return `Vitalograf ${roundNumber}`;
  }

  if (formKey.startsWith("fsi-")) {
    const instance = formKey.split("-")[1] ?? "";
    return linkedInhalerLabel ? `FSI ${roundNumber}.${instance} · ${linkedInhalerLabel}` : `FSI ${roundNumber}.${instance}`;
  }

  if (formKey === "mars-a") {
    return `MARS ${roundNumber}`;
  }

  if (formKey === "dalsi-formular") {
    return `Hodnocení ${roundNumber}`;
  }

  return `${item.title} ${roundNumber}`.trim();
}

function extractRoundNumber(roundKey) {
  const match = String(roundKey ?? "").match(/(\d+)/);
  return match ? match[1] : "";
}

function getVisibleRoundItems(items, roundKey) {
  const inhalers = getRoundInhalers(roundKey);
  return items.filter((item) => {
    if (item.formKey === "vitalograf") {
      return getRoundVitalographTypes(roundKey).length > 0;
    }
    const slot = getFsiSlotForFormKey(item.formKey);
    if (!slot) {
      return true;
    }
    return Boolean(inhalers[slot - 1]);
  });
}

function getFsiSlotForFormKey(formKey) {
  const match = String(formKey ?? "").match(/^fsi-(\d)$/);
  return match ? Number(match[1]) : null;
}

function getRoundInhalers(roundKey) {
  const submissions = Array.isArray(state.selectedPatientSubmissions) ? state.selectedPatientSubmissions : [];
  const inhalationSubmission = submissions
    .filter((submission) => submission.round_key === roundKey && submission.form_key === "inhalacni-technika")
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0];

  const selected = Array.isArray(inhalationSubmission?.answers?.inhalation_systems)
    ? inhalationSubmission.answers.inhalation_systems
    : [];
  return selected.filter(Boolean).slice(0, 3);
}

function getRoundVitalographTypes(roundKey) {
  const inhalers = getRoundInhalers(roundKey);
  const types = [];

  if (inhalers.some((item) => ["pmdi", "aerosphere", "respimat"].includes(item))) {
    types.push("pmdi");
  }

  if (
    inhalers.some((item) =>
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
    )
  ) {
    types.push("dpi");
  }

  return types;
}

function getInhalerLabelByCode(deviceKey) {
  if (!deviceKey) {
    return "";
  }

  for (const questionnaire of state.questionnaires ?? []) {
    for (const section of questionnaire.sections ?? []) {
      for (const question of section.questions ?? []) {
        if (!Array.isArray(question.options)) {
          continue;
        }
        const option = question.options.find((item) => item.key === deviceKey);
        if (option?.label) {
          return option.label;
        }
      }
    }
  }

  return String(deviceKey);
}

function getLinkedInhalerLabel(item) {
  const slot = item?.inhalerSlot ?? getFsiSlotForFormKey(item?.formKey);
  if (!slot || !item?.roundKey) {
    return "";
  }
  return getInhalerLabelByCode(getRoundInhalers(item.roundKey)[slot - 1]);
}

function getActiveQuestionnaireInhalerLabel() {
  if (!state.activeQuestionnaire) {
    return "";
  }

  return getLinkedInhalerLabel({
    formKey: state.activeQuestionnaire.formKey,
    roundKey: state.activeQuestionnaire.roundKey,
    inhalerSlot: state.activeSubmission?.inhaler_slot
  });
}

function getDisplaySectionTitle(section) {
  const inhalerLabel = getActiveQuestionnaireInhalerLabel();
  if (!inhalerLabel) {
    return section.title;
  }

  if (String(state.activeQuestionnaire?.formKey ?? "").startsWith("fsi-")) {
    return `${section.title} · ${inhalerLabel}`;
  }

  return section.title;
}

const UNFILLED_VALUE = "nevyplneno";

function isUnfilledValue(value) {
  return value === "0" || value === UNFILLED_VALUE;
}

function normalizeEditorAnswers(questionnaire, answers, status) {
  if (status !== "in_progress" || !questionnaire || !answers || typeof answers !== "object") {
    return answers;
  }

  const normalized = structuredClone(answers);

  for (const section of questionnaire.sections ?? []) {
    for (const question of section.questions ?? []) {
      normalized[question.key] = normalizeQuestionAnswerForEditor(question, normalized[question.key]);
    }
  }

  if (
    questionnaire.formKey === "vitalograf" &&
    (!Array.isArray(normalized.vitalograph_inhaler_types?.selected) ||
      normalized.vitalograph_inhaler_types.selected.length === 0)
  ) {
    normalized.vitalograph_inhaler_types = {
      selected: getRoundVitalographTypes(questionnaire.roundKey),
      freeTextMap: {},
      unfilled: []
    };
  }

  return normalized;
}

function normalizeQuestionAnswerForEditor(question, value) {
  if (value == null) {
    return value;
  }

  if (question.type === "single_choice") {
    if (isUnfilledValue(value)) {
      return null;
    }
    if (typeof value === "object" && isUnfilledValue(value.selected)) {
      return null;
    }
    return value;
  }

  if (question.type === "multi_choice") {
    if (typeof value === "object" && Array.isArray(value.selected)) {
      return {
        ...value,
        selected: value.selected.filter((item) => !isUnfilledValue(item)),
        unfilled: Array.isArray(value.unfilled) ? value.unfilled.filter((item) => !isUnfilledValue(item)) : []
      };
    }
    return value;
  }

  if (question.type === "multi_choice_nested") {
    const normalized = {
      ...(value && typeof value === "object" ? value : {}),
      selected: Array.isArray(value?.selected) ? value.selected.filter((item) => !isUnfilledValue(item)) : [],
      nested: {}
    };

    for (const option of question.options ?? []) {
      const nestedValue = value?.nested?.[option.key];
      if (option.nestedSingleChoice) {
        normalized.nested[option.key] = {
          selected: isUnfilledValue(nestedValue?.selected) ? null : nestedValue?.selected ?? null
        };
      } else if (option.nestedMultiChoice) {
        normalized.nested[option.key] = {
          selected: Array.isArray(nestedValue?.selected) ? nestedValue.selected.filter((item) => !isUnfilledValue(item)) : []
        };
      }
    }

    return normalized;
  }

  if (question.type === "fixed_matrix_single") {
    const normalized = { ...(value && typeof value === "object" ? value : {}) };
    for (const row of question.rows ?? []) {
      if (isUnfilledValue(normalized[row.key])) {
        normalized[row.key] = null;
      }
    }
    return normalized;
  }

  if (question.type === "vitalograph_assessment") {
    const normalized = { ...(value && typeof value === "object" ? value : {}) };
    for (const column of question.columns ?? []) {
      normalized[column.key] = { ...(normalized[column.key] ?? {}) };
      if (isUnfilledValue(normalized[column.key].__status)) {
        normalized[column.key].__status = null;
      }
      for (const metric of question.metrics ?? []) {
        if (isUnfilledValue(normalized[column.key][metric.key])) {
          normalized[column.key][metric.key] = null;
        }
      }
    }
    return normalized;
  }

  if (question.type === "repeatable_matrix_single" && Array.isArray(value)) {
    return value.map((row) => ({
      ...row,
      rating: isUnfilledValue(row?.rating) ? null : row?.rating ?? null
    }));
  }

  return value;
}

function renderPatientFormTags(patient) {
  const items = Array.isArray(patient.form_summaries) ? patient.form_summaries.filter((item) => !item.is_legacy) : [];
  const tags = items.map((item) => {
    const label =
      item.form_key === "dalsi-formular"
        ? `H ${Number(item.doctor_evaluation_count ?? 0)}/6`
        : item.short_abbr || item.short_title || item.title || item.code;
    return `<span class="form-tag ${escapeHtml(item.status)}">${escapeHtml(label)}</span>`;
  });
  return `<div class="form-tags">${tags.join("")}</div>`;
}

async function loadUsersIfAdmin() {
  if (state.user?.role !== "admin") {
    state.users = [];
    return;
  }

  const response = await api("/api/admin/users");
  state.users = response.items;
  renderUserList();
}

function renderQuestionnaireEditorView() {
  if (!state.activeSubmission || !state.activeQuestionnaire) {
    elements.questionnaireView.innerHTML = "";
    return;
  }

  const answers = normalizeEditorAnswers(
    state.activeQuestionnaire,
    state.activeSubmission.answers ?? {},
    state.activeSubmission.status
  );
  state.activeSubmission.answers = answers;
  const linkedInhalerLabel = getActiveQuestionnaireInhalerLabel();
  const titleWithInhaler = linkedInhalerLabel
    ? `${state.activeQuestionnaire.title} · ${linkedInhalerLabel}`
    : state.activeQuestionnaire.title;
  const patientUnfilledButton = state.activeQuestionnaire.allowPatientUnfilled
    ? `<button id="markPatientUnfilledButton" class="ghost">Nevyplněno pacientem</button>`
    : "";
  const patientUnfilledButtonBottom = state.activeQuestionnaire.allowPatientUnfilled
    ? `<button type="button" id="markPatientUnfilledButtonBottom" class="ghost">Nevyplněno pacientem</button>`
    : "";

  elements.questionnaireView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="back-row">
        <div class="questionnaire-actions">
          <button class="ghost" data-back-to-patient>Zpět na detail pacienta</button>
          <button class="ghost" data-go-home>Domů</button>
        </div>
        <span class="meta-pill">${escapeHtml(state.selectedPatient?.noveid || "")}</span>
      </div>

      <div class="editor-header">
        <div>
          <p class="eyebrow">Editor dotazníku</p>
          <h2>${escapeHtml(titleWithInhaler)}</h2>
          <p class="muted">Stav: ${state.activeSubmission.status === "completed" ? "dokončený" : "rozepsaný"}</p>
        </div>
        <div class="editor-actions">
          ${patientUnfilledButton}
          <button id="saveDraftButton" class="ghost">Uložit rozepsané</button>
          <button id="completeButton" class="primary">Dokončit a zavřít</button>
        </div>
      </div>

      <form id="questionnaireForm" class="editor-form">
        ${state.activeQuestionnaire.sections.map((section) => renderSection(section, answers)).join("")}

        <div class="section-card">
          <div class="editor-actions">
            ${patientUnfilledButtonBottom}
            <button type="button" id="saveDraftButtonBottom" class="ghost">Uložit rozepsané</button>
            <button type="button" id="completeButtonBottom" class="primary">Dokončit a zavřít</button>
          </div>
        </div>
      </form>
    </section>
  `;

  bindDynamicQuestionnaireBehavior();
  elements.questionnaireView.querySelector("[data-back-to-patient]").addEventListener("click", () => {
    renderPatientDetail();
    showView("patient");
  });
  elements.questionnaireView.querySelector("[data-go-home]").addEventListener("click", () => {
    showView("patients");
  });
  elements.questionnaireView.querySelector("#markPatientUnfilledButton")?.addEventListener("click", () =>
    saveSubmission("completed", { closeAfterSave: true, skipValidation: true, markPatientUnfilled: true })
  );
  elements.questionnaireView
    .querySelector("#saveDraftButton")
    .addEventListener("click", () => saveSubmission("in_progress", { closeAfterSave: true }));
  elements.questionnaireView.querySelector("#completeButton").addEventListener("click", () => saveSubmission("completed", { closeAfterSave: true }));
  elements.questionnaireView.querySelector("#markPatientUnfilledButtonBottom")?.addEventListener("click", () =>
    saveSubmission("completed", { closeAfterSave: true, skipValidation: true, markPatientUnfilled: true })
  );
  elements.questionnaireView
    .querySelector("#saveDraftButtonBottom")
    .addEventListener("click", () => saveSubmission("in_progress", { closeAfterSave: true }));
  elements.questionnaireView.querySelector("#completeButtonBottom").addEventListener("click", () => saveSubmission("completed", { closeAfterSave: true }));
}

function renderSection(section, answers) {
  return `
    <section class="section-card">
      <h3>${escapeHtml(getDisplaySectionTitle(section))}</h3>
      <div class="stack">
        ${section.questions.map((question) => renderQuestion(question, answers)).join("")}
      </div>
    </section>
  `;
}

function renderQuestion(question, answers) {
  const value = answers[question.key];
  const hidden = !isQuestionVisible(question, answers);

  return `
    <article class="question-card ${hidden ? "hidden" : ""}" data-question-key="${escapeHtml(question.key)}" data-visible-when='${escapeHtml(JSON.stringify(question.visibleWhen || null))}'>
      <h3>${escapeHtml(question.label)}</h3>
      <div class="question-block">
        ${renderQuestionInput(question, value, answers)}
      </div>
    </article>
  `;
}

function renderQuestionInput(question, value, answers) {
  switch (question.type) {
    case "text":
      return `<input name="${escapeHtml(question.key)}" value="${escapeHtml(value || "")}">`;
    case "date":
      return `<input type="date" name="${escapeHtml(question.key)}" value="${escapeHtml(value || "")}">`;
    case "textarea":
      return `<textarea name="${escapeHtml(question.key)}" rows="3">${escapeHtml(value || "")}</textarea>`;
    case "inhaler_selector":
      return renderInhalerSelector(question, value);
    case "inhaler_evaluation_bundle":
      return renderInhalerEvaluationBundle(question, value || {}, answers);
    case "vitalograph_assessment":
      return renderVitalographAssessment(question, value || {});
    case "fixed_matrix_single":
      return renderFixedMatrixSingle(question, value || {});
    case "single_choice":
      return renderSingleChoice(question, value);
    case "multi_choice":
      return renderMultiChoice(question, value);
    case "multi_choice_nested":
      return renderNestedChoice(question, value || {});
    case "repeatable_matrix_single":
      return renderRepeatableMatrix(question, value || [], answers);
    default:
      return ``;
  }
}

function renderInhalerSelector(question, value) {
  const lockedToRoundInhalers =
    question.key === "selected_inhalers" && String(state.activeQuestionnaire?.formKey ?? "") === "dalsi-formular";
  const selected = lockedToRoundInhalers
    ? (getRoundInhalers(state.activeQuestionnaire?.roundKey).length
        ? getRoundInhalers(state.activeQuestionnaire?.roundKey).slice(0, 3)
        : Array.isArray(value) && value.length
          ? value.slice(0, 3)
          : [""])
    : Array.isArray(value) && value.length
      ? value.slice(0, 3)
      : [""];
  const rows = selected.map((item, index) => renderInhalerSelectorRow(question, item, index));

  return `
    <div class="inhaler-selector" data-inhaler-key="${escapeHtml(question.key)}">
      ${rows.join("")}
      <div class="inhaler-selector-actions">
        ${
          lockedToRoundInhalers
            ? `<p class="muted"></p>`
            : selected.length < 3
              ? `<button type="button" class="ghost small" data-add-inhaler="${escapeHtml(question.key)}">+ Přidat inhalátor</button>`
              : ""
        }
      </div>
    </div>
  `;
}

function renderInhalerSelectorRow(question, currentValue, index) {
  const lockedToRoundInhalers =
    question.key === "selected_inhalers" && String(state.activeQuestionnaire?.formKey ?? "") === "dalsi-formular";
  return `
    <div class="inhaler-selector-row">
      <select name="${escapeHtml(question.key)}__select__${index}" ${lockedToRoundInhalers ? "disabled" : ""}>
        <option value="">Vyberte inhalátor</option>
        ${question.options
          .map(
            (option) => `
              <option value="${escapeHtml(option.key)}" ${currentValue === option.key ? "selected" : ""}>
                ${escapeHtml(option.label)}
              </option>
            `
          )
          .join("")}
      </select>
      ${
        lockedToRoundInhalers
          ? `<span></span>`
          : index > 0
            ? `<button type="button" class="ghost small" data-remove-inhaler="${escapeHtml(question.key)}" data-remove-index="${index}">Odebrat</button>`
            : `<span></span>`
      }
    </div>
  `;
}

function renderInhalerEvaluationBundle(question, value, answers) {
  const selectedKeys =
    question.sourceQuestionKey === "selected_inhalers" && String(state.activeQuestionnaire?.formKey ?? "") === "dalsi-formular"
      ? getRoundInhalers(state.activeQuestionnaire?.roundKey)
      : Array.isArray(answers?.[question.sourceQuestionKey])
        ? answers[question.sourceQuestionKey]
        : [];
  const sourceQuestion = state.activeQuestionnaire?.sections
    ?.flatMap((section) => section.questions)
    ?.find((item) => item.key === question.sourceQuestionKey);

  if (!selectedKeys.length) {
    return ``;
  }

  const selectedDevices = selectedKeys.map((deviceKey, index) => {
    const option = sourceQuestion?.options?.find((item) => item.key === deviceKey);
    const template = question.templates?.[deviceKey] ?? null;
    const deviceValue = Array.isArray(value?.devices)
      ? value.devices.find((item) => item.slot === index && item.deviceKey === deviceKey) ?? null
      : null;

    return {
      slot: index,
      deviceKey,
      label: option?.label ?? deviceKey,
      template,
      value: deviceValue
    };
  });

  return `
    <div class="inhaler-evaluation-bundle">
      <div class="inhaler-evaluation-nav">
        ${selectedDevices.map((device) => renderInhalerEvaluationNavCard(device)).join("")}
      </div>
      <div class="inhaler-evaluation-list">
        ${selectedDevices.map((device) => renderInhalerEvaluationDevice(question, device)).join("")}
      </div>
    </div>
  `;
}

function renderInhalerEvaluationNavCard(device) {
  const isOpen = state.openInhalerEvaluations.includes(device.slot);
  return `
    <article class="inhaler-evaluation-nav-card">
      <div>
        <strong>${escapeHtml(`Inhalátor ${device.slot + 1}`)}</strong>
        <div class="muted">${escapeHtml(device.label)}</div>
      </div>
      <button
        type="button"
        class="ghost small"
        data-toggle-evaluation="${device.slot}"
      >
        ${isOpen ? "Zavřít formulář" : "Otevřít formulář"}
      </button>
    </article>
  `;
}

function renderInhalerEvaluationDevice(question, device) {
  const isOpen = state.openInhalerEvaluations.includes(device.slot);
  if (!device.template) {
    return `
      <section class="inhaler-evaluation-device ${isOpen ? "" : "hidden"}" id="device-evaluation-${device.slot}">
        <div class="inhaler-evaluation-head">
          <div>
            <p class="eyebrow">Inhalátor ${device.slot + 1}</p>
            <h4>${escapeHtml(device.label)}</h4>
          </div>
        </div>
        <p class="muted">Pro tento typ zatím není připravená šablona hodnocení.</p>
      </section>
    `;
  }

  return `
    <section class="inhaler-evaluation-device ${isOpen ? "" : "hidden"}" id="device-evaluation-${device.slot}">
      <div class="inhaler-evaluation-head">
        <div>
          <p class="eyebrow">Inhalátor ${device.slot + 1}</p>
          <h4>${escapeHtml(device.label)}</h4>
          <p class="muted">${escapeHtml(device.template.title)}</p>
        </div>
      </div>
      <div class="inhaler-evaluation-steps">
        ${device.template.steps.map((step, stepIndex) => `
          <article class="inhaler-step-card">
            <div class="inhaler-step-head">
              <span class="inhaler-step-badge">${escapeHtml(String(stepIndex + 1))}</span>
              <div class="inhaler-step-title">${escapeHtml(step.title)}</div>
            </div>
            <p>${escapeHtml(step.instruction)}</p>
          </article>
        `).join("")}
      </div>
      <div class="inhaler-evaluation-errors">
        <h5>Chyby, na které bych se měl/a zaměřit</h5>
        ${device.template.errorGroups.map((group, groupIndex) => `
          <section class="inhaler-error-group">
            <div class="inhaler-error-group-title">Krok ${escapeHtml(String(groupIndex + 1))}</div>
            <div class="stack">
              ${group.items.map((item, itemIndex) => {
                const inputName = `${question.key}__device__${device.slot}__group__${groupIndex}`;
                const checked = Array.isArray(device.value?.selectedErrors?.[groupIndex])
                  ? device.value.selectedErrors[groupIndex].includes(itemIndex)
                  : false;
                return `
                  <label class="choice-line inhaler-error-item">
                    <input
                      type="checkbox"
                      name="${escapeHtml(inputName)}"
                      value="${escapeHtml(String(itemIndex))}"
                      ${checked ? "checked" : ""}
                    >
                    <span class="inhaler-error-text">${escapeHtml(item)}</span>
                  </label>
                `;
              }).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

function renderVitalographAssessment(question, value) {
  return `
    <div class="vitalograph-assessment">
      <div class="vitalograph-phase-grid">
        ${question.columns
          .map((column) => renderVitalographPhase(question, column, value?.[column.key] || {}))
          .join("")}
      </div>
    </div>
  `;
}

function renderVitalographPhase(question, column, columnValue) {
  return `
    <section class="vitalograph-phase">
      <h4>${escapeHtml(column.label)}</h4>
      <div class="vitalograph-phase-status">
        ${(column.statusOptions ?? [])
          .map((option) => {
            const inputName = `${question.key}__${column.key}__status`;
            return `
              <label class="choice-line vitalograph-choice vitalograph-status-choice">
                <input
                  type="radio"
                  name="${escapeHtml(inputName)}"
                  value="${escapeHtml(option.key)}"
                  ${columnValue?.__status === option.key ? "checked" : ""}
                >
                <span class="vitalograph-choice-text">${escapeHtml(option.label)}</span>
              </label>
            `;
          })
          .join("")}
      </div>
      <div class="vitalograph-metric-list">
        ${question.metrics
          .map((metric) => renderVitalographMetric(question, column.key, metric, columnValue?.[metric.key] || ""))
          .join("")}
      </div>
    </section>
  `;
}

function renderVitalographMetric(question, columnKey, metric, selectedValue) {
  return `
    <div class="vitalograph-metric">
      <div class="vitalograph-metric-label">${escapeHtml(metric.label)}:</div>
      <div class="vitalograph-options">
        ${metric.options
          .map((option) => {
            const inputName = `${question.key}__${columnKey}__${metric.key}`;
            return `
              <label class="choice-line vitalograph-choice">
                <input
                  type="radio"
                  name="${escapeHtml(inputName)}"
                  value="${escapeHtml(option.key)}"
                  ${selectedValue === option.key ? "checked" : ""}
                >
                <span class="vitalograph-choice-text">${escapeHtml(option.label)}</span>
              </label>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderFixedMatrixSingle(question, value) {
  return `
    <div class="fixed-matrix" style="--matrix-columns:${question.options.length};">
      <div class="fixed-matrix-table">
        <div class="fixed-matrix-row fixed-matrix-head" style="--matrix-columns:${question.options.length};">
          <div class="fixed-matrix-cell fixed-matrix-statement"></div>
          ${question.options
            .map((option) => `<div class="fixed-matrix-cell fixed-matrix-option-head">${escapeHtml(option.label)}</div>`)
            .join("")}
        </div>
        ${question.rows
          .map((row) => renderFixedMatrixRow(question, row, value?.[row.key] || ""))
          .join("")}
      </div>
    </div>
  `;
}

function renderFixedMatrixRow(question, row, selectedValue) {
  return `
    <div class="fixed-matrix-row" style="--matrix-columns:${question.options.length};">
      <div class="fixed-matrix-cell fixed-matrix-statement">${escapeHtml(row.label)}</div>
      ${question.options
        .map((option) => {
          const inputName = `${question.key}__row__${row.key}`;
          return `
            <label class="fixed-matrix-cell fixed-matrix-option">
              <input
                type="radio"
                name="${escapeHtml(inputName)}"
                value="${escapeHtml(option.key)}"
                ${selectedValue === option.key ? "checked" : ""}
              >
              <span>${escapeHtml(option.label)}</span>
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSingleChoice(question, value) {
  return `
    <div class="radio-list">
      ${question.options
        .map((option) => {
          const freeTextValue = typeof value === "object" && value ? value.freeText ?? "" : "";
          const selected = typeof value === "object" && value ? value.selected === option.key : value === option.key;
          return `
            <label class="option-block">
              <span class="choice-line">
                <input
                  type="radio"
                  name="${escapeHtml(question.key)}"
                  value="${escapeHtml(option.key)}"
                  ${selected ? "checked" : ""}
                >
                <span>${escapeHtml(option.label)}</span>
              </span>
              ${option.allowsFreeText ? `
                <input
                  type="text"
                  name="${escapeHtml(question.key)}__freeText__${escapeHtml(option.key)}"
                  placeholder="${escapeHtml(option.freeTextLabel || "Doplňte")}"
                  value="${escapeHtml(selected ? freeTextValue : "")}"
                >
              ` : ""}
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderMultiChoice(question, value) {
  const selected = Array.isArray(value?.selected) ? value.selected : Array.isArray(value) ? value : [];
  const freeTextMap = value?.freeTextMap ?? {};
  const unfilled = Array.isArray(value?.unfilled) ? value.unfilled : [];

  if (question.key === "vitalograph_inhaler_types") {
    return `
      <div class="checkbox-list">
        ${question.options
          .map(
            (option) => `
              <label class="option-block">
                <span class="choice-line">
                  <input
                    type="checkbox"
                    name="${escapeHtml(question.key)}"
                    value="${escapeHtml(option.key)}"
                    ${selected.includes(option.key) ? "checked" : ""}
                  >
                  <span>${escapeHtml(option.label)}</span>
                  <span class="inline-choice-spacer"></span>
                  <input
                    type="checkbox"
                    name="${escapeHtml(question.key)}__unfilled__${escapeHtml(option.key)}"
                    value="nevyplneno"
                    data-vitalograph-unfilled="${escapeHtml(option.key)}"
                    ${unfilled.includes(option.key) ? "checked" : ""}
                  >
                  <span class="inline-choice-label">Nevyplněno</span>
                </span>
              </label>
            `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="checkbox-list">
      ${question.options
        .map(
          (option) => `
            <label class="option-block">
              <span class="choice-line">
                <input
                  type="checkbox"
                  name="${escapeHtml(question.key)}"
                  value="${escapeHtml(option.key)}"
                  ${selected.includes(option.key) ? "checked" : ""}
                >
                <span>${escapeHtml(option.label)}</span>
              </span>
              ${
                option.allowsFreeText
                  ? `<input
                      type="text"
                      name="${escapeHtml(question.key)}__freeText__${escapeHtml(option.key)}"
                      placeholder="${escapeHtml(option.freeTextLabel || "Doplňte")}"
                      value="${escapeHtml(freeTextMap[option.key] || "")}"
                    >`
                  : ""
              }
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderNestedChoice(question, value) {
  const selectedOptions = value.selected ?? [];
  const nested = value.nested ?? {};
  const parentInputType = question.singleParentSelection ? "radio" : "checkbox";
  const parentInputName = question.singleParentSelection
    ? `${question.key}__selected_single`
    : `${question.key}__selected`;

  return `
    <div class="stack nested-choice-group">
      ${question.options
        .map((option) => {
          const checked = selectedOptions.includes(option.key);
          return `
            <div class="option-block nested-option">
              <label class="nested-option-head">
                <input
                  type="${parentInputType}"
                  name="${escapeHtml(parentInputName)}"
                  value="${escapeHtml(option.key)}"
                  data-single-parent-selection="${question.singleParentSelection ? "true" : "false"}"
                  ${checked ? "checked" : ""}
                >
                <span class="nested-option-title">${escapeHtml(option.label)}</span>
              </label>
              ${renderNestedOptionContent(question.key, option, nested[option.key] || {})}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderNestedOptionContent(questionKey, option, nestedValue) {
  if (option.nestedSingleChoice) {
    return `
      <div class="nested-block nested-single-choice">
        ${option.nestedSingleChoice.options
          .map(
            (nestedOption) => `
              <label class="choice-line">
                <input
                  type="radio"
                  name="${escapeHtml(questionKey)}__nested__${escapeHtml(option.key)}"
                  value="${escapeHtml(nestedOption.key)}"
                  data-parent-option="${escapeHtml(option.key)}"
                  ${nestedValue.selected === nestedOption.key ? "checked" : ""}
                >
                <span>${escapeHtml(nestedOption.label)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    `;
  }

  if (option.nestedMultiChoice) {
    const selected = nestedValue.selected ?? [];
    return `
      <div class="nested-block stack">
        ${option.nestedMultiChoice.options
          .map(
            (nestedOption) => `
              <label class="choice-line">
                <input
                  type="checkbox"
                  name="${escapeHtml(questionKey)}__nestedmulti__${escapeHtml(option.key)}"
                  value="${escapeHtml(nestedOption.key)}"
                  data-parent-option="${escapeHtml(option.key)}"
                  ${selected.includes(nestedOption.key) ? "checked" : ""}
                >
                <span>${escapeHtml(nestedOption.label)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    `;
  }

  return "";
}

function renderRepeatableMatrix(question, rows, answers) {
  const effectiveRows = usesSelectedInhalerRows(question.key)
    ? buildRowsFromSelectedInhalers(question, rows, answers)
    : rows;

  return `
    <div class="matrix-rows" data-matrix-key="${escapeHtml(question.key)}">
      ${effectiveRows.map((row, index) => renderMatrixRow(question, row, index, usesSelectedInhalerRows(question.key))).join("")}
    </div>
  `;
}

function renderMatrixRow(question, row, index, lockName = false) {
  return `
    <div class="matrix-row">
      <label>
        <span>${escapeHtml(question.rowLabel)}</span>
        <input type="text" name="${escapeHtml(question.key)}__rowname__${index}" value="${escapeHtml(row.name || "")}" ${lockName ? "readonly" : ""}>
      </label>
      <div class="radio-list">
        ${question.options
          .map(
            (option) => `
              <label>
                <input
                  type="radio"
                  name="${escapeHtml(question.key)}__rowrating__${index}"
                  value="${escapeHtml(option.key)}"
                  ${row.rating === option.key ? "checked" : ""}
                >
                ${escapeHtml(option.label)}
              </label>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function usesSelectedInhalerRows(questionKey) {
  return ["q9_inhaler_ease", "sr_q1_confident"].includes(questionKey);
}

function buildRowsFromSelectedInhalers(question, rows, answers) {
  const selectedKeys = Array.isArray(answers?.inhalation_systems) ? answers.inhalation_systems : [];
  const inhalerQuestion = state.activeQuestionnaire?.sections
    ?.flatMap((section) => section.questions)
    ?.find((item) => item.key === "inhalation_systems");

  return selectedKeys.map((key, index) => {
    const existingRow = Array.isArray(rows) ? rows[index] ?? {} : {};
    const option = inhalerQuestion?.options?.find((item) => item.key === key);
    return {
      name: option?.label ?? key,
      rating: existingRow.rating ?? ""
    };
  });
}

function bindDynamicQuestionnaireBehavior() {
  const inhalerAddButtons = elements.questionnaireView.querySelectorAll("[data-add-inhaler]");
  inhalerAddButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.addInhaler;
      const current = collectAnswers();
      const rows = Array.isArray(current[key]) ? current[key].slice(0, 3) : [];
      if (rows.length < 3) {
        rows.push("");
      }
      state.activeSubmission.answers = { ...current, [key]: rows };
      renderQuestionnaireEditor();
    });
  });

  const inhalerRemoveButtons = elements.questionnaireView.querySelectorAll("[data-remove-inhaler]");
  inhalerRemoveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.removeInhaler;
      const removeIndex = Number(button.dataset.removeIndex);
      const current = collectAnswers();
      const rows = Array.isArray(current[key]) ? current[key].slice(0, 3) : [];
      rows.splice(removeIndex, 1);
      state.activeSubmission.answers = { ...current, [key]: rows.length ? rows : [""] };
      renderQuestionnaireEditor();
    });
  });

  const inhalerSelects = elements.questionnaireView.querySelectorAll('[name^="inhalation_systems__select__"]');
  inhalerSelects.forEach((field) => {
    field.addEventListener("change", () => {
      const current = collectAnswers();
      state.activeSubmission.answers = {
        ...(state.activeSubmission.answers ?? {}),
        ...current
      };
      renderQuestionnaireEditor();
    });
  });

  const selectedInhalerSelects = elements.questionnaireView.querySelectorAll('[name^="selected_inhalers__select__"]');
  selectedInhalerSelects.forEach((field) => {
    field.addEventListener("change", () => {
      const current = collectAnswers();
      state.openInhalerEvaluations = [];
      state.activeSubmission.answers = {
        ...(state.activeSubmission.answers ?? {}),
        ...current
      };
      renderQuestionnaireEditor();
    });
  });

  const toggleButtons = elements.questionnaireView.querySelectorAll("[data-toggle-evaluation]");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const slot = Number(button.dataset.toggleEvaluation);
      if (Number.isNaN(slot)) {
        return;
      }
      const isOpen = state.openInhalerEvaluations.includes(slot);
      state.openInhalerEvaluations = isOpen
        ? state.openInhalerEvaluations.filter((item) => item !== slot)
        : [...state.openInhalerEvaluations, slot];
      renderQuestionnaireEditor();
      if (!isOpen) {
        requestAnimationFrame(() => {
          const target = elements.questionnaireView.querySelector(`#${cssEscape(`device-evaluation-${slot}`)}`);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    });
  });

  const addButtons = elements.questionnaireView.querySelectorAll("[data-add-matrix-row]");
  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.addMatrixRow;
      const current = collectAnswers();
      const rows = Array.isArray(current[key]) ? current[key] : [];
      rows.push({ name: "", rating: "" });
      state.activeSubmission.answers = { ...current, [key]: rows };
      renderQuestionnaireEditor();
    });
  });

  elements.questionnaireView.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("change", () => {
      syncNestedParentChecks(elements.questionnaireView);
      updateVisibility();
    });
  });

  syncNestedParentChecks(elements.questionnaireView);
  updateVisibility();
}

function updateVisibility() {
  const answers = collectAnswers();
  elements.questionnaireView.querySelectorAll("[data-question-key]").forEach((questionElement) => {
    const rawCondition = questionElement.dataset.visibleWhen;
    const condition = rawCondition ? JSON.parse(rawCondition) : null;
    const visible = isVisibleByCondition(condition, answers);
    questionElement.classList.toggle("hidden", !visible);
  });
}

function collectAnswers() {
  const form = elements.questionnaireView.querySelector("#questionnaireForm");
  if (!form || !state.activeQuestionnaire) {
    return {};
  }

  const answers = {};

  for (const section of state.activeQuestionnaire.sections) {
    for (const question of section.questions) {
      answers[question.key] = readQuestionValue(form, question);
    }
  }

  return answers;
}

function readQuestionValue(form, question) {
  switch (question.type) {
    case "text":
    case "date":
    case "textarea":
      return form.elements[question.key]?.value ?? "";
    case "inhaler_selector":
      return readInhalerSelector(form, question);
    case "inhaler_evaluation_bundle":
      return readInhalerEvaluationBundle(form, question);
    case "vitalograph_assessment":
      return readVitalographAssessment(form, question);
    case "fixed_matrix_single":
      return readFixedMatrixSingle(form, question);
    case "single_choice":
      return readSingleChoice(form, question);
    case "multi_choice":
      return readMultiChoice(form, question);
    case "multi_choice_nested":
      return readNestedChoice(form, question);
    case "repeatable_matrix_single":
      return readRepeatableMatrix(form, question);
    default:
      return null;
  }
}

function readInhalerSelector(form, question) {
  const values = [];
  for (let index = 0; index < 3; index += 1) {
    const field = form.querySelector(`select[name="${cssEscape(question.key)}__select__${index}"]`);
    if (!field) {
      continue;
    }
    const value = String(field.value ?? "").trim();
    if (value) {
      values.push(value);
    }
  }
  return values;
}

function readInhalerEvaluationBundle(form, question) {
  const sourceQuestion = state.activeQuestionnaire?.sections
    ?.flatMap((section) => section.questions)
    ?.find((item) => item.key === question.sourceQuestionKey);

  const selectedKeys = sourceQuestion ? readInhalerSelector(form, sourceQuestion) : [];
  const devices = selectedKeys.map((deviceKey, slot) => {
    const template = question.templates?.[deviceKey] ?? null;
    const selectedErrors = {};

    (template?.errorGroups ?? []).forEach((group, groupIndex) => {
      const inputName = `${question.key}__device__${slot}__group__${groupIndex}`;
      const checked = Array.from(form.querySelectorAll(`input[name="${cssEscape(inputName)}"]:checked`)).map((item) =>
        Number(item.value)
      );
      selectedErrors[groupIndex] = checked;
    });

    return {
      slot,
      deviceKey,
      selectedErrors
    };
  });

  return { devices };
}

function readVitalographAssessment(form, question) {
  const result = {};

  for (const column of question.columns ?? []) {
    const statusInputName = `${question.key}__${column.key}__status`;
    const statusSelected = form.querySelector(`input[name="${cssEscape(statusInputName)}"]:checked`);
    const columnResult = {
      __status: statusSelected?.value ?? null
    };

    for (const metric of question.metrics ?? []) {
      const inputName = `${question.key}__${column.key}__${metric.key}`;
      const selected = form.querySelector(`input[name="${cssEscape(inputName)}"]:checked`);
      columnResult[metric.key] = selected?.value ?? null;
    }

    result[column.key] = columnResult;
  }

  return result;
}

function readFixedMatrixSingle(form, question) {
  const result = {};

  for (const row of question.rows ?? []) {
    const inputName = `${question.key}__row__${row.key}`;
    const selected = form.querySelector(`input[name="${cssEscape(inputName)}"]:checked`);
    result[row.key] = selected?.value ?? null;
  }

  return result;
}

function readSingleChoice(form, question) {
  const selected = form.querySelector(`input[name="${cssEscape(question.key)}"]:checked`);
  if (!selected) {
    return null;
  }

  const option = question.options.find((item) => item.key === selected.value);
  if (!option?.allowsFreeText) {
    return selected.value;
  }

  const freeText = form.querySelector(
    `input[name="${cssEscape(question.key)}__freeText__${cssEscape(option.key)}"]`
  )?.value;

  return { selected: selected.value, freeText: freeText ?? "" };
}

function readMultiChoice(form, question) {
  let selected = Array.from(form.querySelectorAll(`input[name="${cssEscape(question.key)}"]:checked`)).map(
    (item) => item.value
  );
  const unfilled = question.key === "vitalograph_inhaler_types"
    ? (question.options ?? [])
      .filter((option) =>
        Boolean(form.querySelector(`input[name="${cssEscape(question.key)}__unfilled__${cssEscape(option.key)}"]:checked`))
      )
      .map((option) => option.key)
    : [];

  if (selected.some((item) => isUnfilledValue(item)) && selected.length > 1) {
    selected = [UNFILLED_VALUE];
  }

  const freeTextMap = {};
  for (const option of question.options) {
    if (option.allowsFreeText) {
      freeTextMap[option.key] =
        form.querySelector(`input[name="${cssEscape(question.key)}__freeText__${cssEscape(option.key)}"]`)?.value ?? "";
    }
  }

  return { selected, freeTextMap, unfilled };
}

function readNestedChoice(form, question) {
  const selectedInputName = question.singleParentSelection
    ? `${question.key}__selected_single`
    : `${question.key}__selected`;
  const selectedSet = new Set(
    Array.from(form.querySelectorAll(`input[name="${cssEscape(selectedInputName)}"]:checked`)).map((item) => item.value)
  );

  const nested = {};
  for (const option of question.options) {
    if (option.nestedSingleChoice) {
      const selectedNested = form.querySelector(
        `input[name="${cssEscape(question.key)}__nested__${cssEscape(option.key)}"]:checked`
      )?.value;
      nested[option.key] = { selected: selectedNested ?? null };
      if (selectedNested && !isUnfilledValue(selectedNested)) {
        selectedSet.add(option.key);
      }
    }

    if (option.nestedMultiChoice) {
      let nestedSelected = Array.from(
        form.querySelectorAll(`input[name="${cssEscape(question.key)}__nestedmulti__${cssEscape(option.key)}"]:checked`)
      ).map((item) => item.value);
      if (nestedSelected.some((item) => isUnfilledValue(item)) && nestedSelected.length > 1) {
        nestedSelected = [UNFILLED_VALUE];
      }
      nested[option.key] = {
        selected: nestedSelected
      };
      if (nestedSelected.some((item) => !isUnfilledValue(item))) {
        selectedSet.add(option.key);
      }
    }
  }

  let selected = Array.from(selectedSet);
  if (selected.some((item) => isUnfilledValue(item)) && selected.length > 1) {
    selected = [UNFILLED_VALUE];
  }

  return { selected, nested };
}

function syncNestedParentChecks(root) {
  root.querySelectorAll('input[data-single-parent-selection="true"]').forEach((field) => {
    field.addEventListener("change", () => {
      if (!field.checked || !field.name) {
        return;
      }

      root.querySelectorAll(`input[name="${cssEscape(field.name)}"]`).forEach((item) => {
        if (item === field) {
          return;
        }
        item.checked = false;
        const siblingValue = item.value;
        root.querySelectorAll(`[data-parent-option="${cssEscape(siblingValue)}"]`).forEach((nestedField) => {
          if (nestedField instanceof HTMLInputElement) {
            nestedField.checked = false;
          }
        });
      });
    });
  });

  root.querySelectorAll("[data-parent-option]").forEach((field) => {
    const parentOption = field.dataset.parentOption;
    if (!parentOption || !field.name) {
      return;
    }

    const questionKey = field.name.split("__")[0];
    const parentInput =
      root.querySelector(`input[name="${cssEscape(questionKey)}__selected_single"][value="${cssEscape(parentOption)}"]`) ||
      root.querySelector(`input[name="${cssEscape(questionKey)}__selected"][value="${cssEscape(parentOption)}"]`);

    if (!parentInput) {
      return;
    }

    const shouldCheck =
      field.type === "radio"
        ? field.checked
        : field.type === "checkbox"
          ? field.checked || Array.from(root.querySelectorAll(`input[name="${cssEscape(field.name)}"]`)).some((item) => item.checked)
          : false;

    if (shouldCheck) {
      parentInput.checked = true;
    }
  });

  root.querySelectorAll("[data-vitalograph-unfilled]").forEach((field) => {
    if (!(field instanceof HTMLInputElement) || !field.name) {
      return;
    }

    const optionKey = field.dataset.vitalographUnfilled;
    const questionKey = field.name.split("__unfilled__")[0];
    const parentInput = root.querySelector(`input[name="${cssEscape(questionKey)}"][value="${cssEscape(optionKey)}"]`);

    if (!parentInput || !(parentInput instanceof HTMLInputElement)) {
      return;
    }

    if (field.checked) {
      parentInput.checked = true;
    }

    if (!parentInput.checked) {
      field.checked = false;
    }
  });
}

function readRepeatableMatrix(form, question) {
  if (usesSelectedInhalerRows(question.key)) {
    return readMatrixFromSelectedInhalers(form, question);
  }

  const rows = [];
  let index = 0;
  while (true) {
    const nameInput = form.querySelector(`input[name="${cssEscape(question.key)}__rowname__${index}"]`);
    if (!nameInput) {
      break;
    }

    const ratingInput = form.querySelector(
      `input[name="${cssEscape(question.key)}__rowrating__${index}"]:checked`
    );

    if (nameInput.value.trim() || ratingInput?.value) {
      rows.push({
        name: nameInput.value.trim(),
        rating: ratingInput?.value ?? null
      });
    }
    index += 1;
  }

  return rows;
}

function readMatrixFromSelectedInhalers(form, question) {
  const inhalerQuestion = state.activeQuestionnaire?.sections
    ?.flatMap((section) => section.questions)
    ?.find((item) => item.key === "inhalation_systems");

  const selectedKeys = inhalerQuestion ? readInhalerSelector(form, inhalerQuestion) : [];
  return selectedKeys.map((key, index) => {
    const option = inhalerQuestion?.options?.find((item) => item.key === key);
    const ratingInput = form.querySelector(`input[name="${cssEscape(question.key)}__rowrating__${index}"]:checked`);
    return {
      name: option?.label ?? key,
      rating: ratingInput?.value ?? null
    };
  });
}

function isQuestionVisible(question, answers) {
  return isVisibleByCondition(question.visibleWhen ?? null, answers);
}

function isVisibleByCondition(condition, answers) {
  if (!condition) {
    return true;
  }

  const currentValue = answers[condition.questionKey];

  if (condition.operator === "equals") {
    return extractComparableValue(currentValue) === condition.value;
  }

  if (condition.operator === "in") {
    return condition.value.includes(extractComparableValue(currentValue));
  }

  if (condition.operator === "contains") {
    if (Array.isArray(currentValue)) {
      return currentValue.includes(condition.value);
    }

    if (Array.isArray(currentValue?.selected)) {
      const unfilled = Array.isArray(currentValue?.unfilled) ? currentValue.unfilled : [];
      return currentValue.selected.includes(condition.value) && !unfilled.includes(condition.value);
    }

    return false;
  }

  if (condition.operator === "containsAny") {
    const values = Array.isArray(currentValue)
      ? currentValue
      : Array.isArray(currentValue?.selected)
        ? currentValue.selected
        : [];
    const unfilled = Array.isArray(currentValue?.unfilled) ? currentValue.unfilled : [];

    return condition.value.some((item) => values.includes(item) && !unfilled.includes(item));
  }

  if (condition.operator === "anyNestedEquals") {
    if (!currentValue || typeof currentValue !== "object") {
      return false;
    }

    const nestedValues = Object.values(currentValue.nested ?? {});
    return nestedValues.some((item) => item?.selected === condition.value);
  }

  return true;
}

function extractComparableValue(value) {
  if (value && typeof value === "object" && "selected" in value && typeof value.selected === "string") {
    return value.selected;
  }
  return value;
}

function renderPatientSummary(query) {
  return renderPatientSummaryView(query);
  const total = state.patients.length;

  elements.patientSummary.innerHTML = `
    <article class="summary-card">
      <span class="summary-card-label">Pacienti v seznamu</span>
      <strong class="summary-card-value">${total}</strong>
      <span class="summary-card-note">Aktuálně zobrazené výsledky</span>
    </article>
    <article class="summary-card">
      <span class="summary-card-label">Vyhledávání</span>
      <strong class="summary-card-value">${query ? escapeHtml(query) : "Bez filtru"}</strong>
      <span class="summary-card-note">${query ? "Živý filtr podle identifikátoru" : "Zobrazen je celý výběr"}</span>
    </article>
  `;
}

function renderPatientsTable() {
  return renderPatientsTableView();
  if (!state.patients.length) {
    elements.patientTableWrap.innerHTML = `<div class="panel-inline"><p>Nebyl nalezen žádný pacient.</p></div>`;
    return;
  }

  elements.patientTableWrap.innerHTML = `
    <div class="table-shell">
      <div class="table-caption">
        <div>
          <strong>Přehled pacientů</strong>
          <p class="muted">Kliknutím na identifikátor otevřeš detail pacienta a historii jeho práce.</p>
        </div>
      </div>
      <table class="patient-table">
        <thead>
          <tr>
            <th>Identifikátor</th>
            <th>Formuláře</th>
            <th>Poslední změna</th>
          </tr>
        </thead>
        <tbody>
          ${state.patients
            .map((patient) => {
              const tags = renderPatientFormTags(patient);
              return `
                <tr>
                  <td>
                    <button class="patient-row-button" data-patient-id="${patient.id}">
                      <strong>${escapeHtml(patient.noveid)}</strong>
                      <span class="row-helper">Otevřít detail pacienta</span>
                    </button>
                  </td>
                  <td>${tags}</td>
                  <td>${formatDateTime(patient.last_submission_at || patient.updated_at)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  elements.patientTableWrap.querySelectorAll("[data-patient-id]").forEach((item) => {
    item.addEventListener("click", () => selectPatient(item.dataset.patientId));
  });
}

function renderUserList() {
  return renderUserListView();
  if (state.user?.role !== "admin") {
    return;
  }

  if (!state.users.length) {
    elements.userList.innerHTML = `<div class="panel-inline"><p>Zatím tu není žádný další uživatel.</p></div>`;
    return;
  }

  elements.userList.innerHTML = state.users
    .map(
      (user) => `
        <article class="question-card">
          <div class="submission-head">
            <div>
              <strong>${escapeHtml(user.login_id || user.email || `Uživatel ${user.id}`)}</strong>
              <p class="muted">${escapeHtml(
                user.role === "admin"
                  ? `Admin${user.login_id ? ` · ID ${user.login_id}` : ""}`
                  : user.role === "doctor"
                    ? `Zdravotník${user.login_id ? ` · ID ${user.login_id}` : ""}`
                    : `Vyšetřující${user.login_id ? ` · ID ${user.login_id}` : ""}`
              )}</p>
            </div>
            <span class="status-chip ${user.is_active ? "completed" : "not-started"}">
              ${user.is_active ? "Aktivní" : "Neaktivní"}
            </span>
          </div>
          <div class="questionnaire-actions">
            ${
              !(user.account_type === "internal" && user.id === state.user.id)
                ? `<button class="ghost small" data-delete-user="${user.account_type}:${user.id}">Odstranit</button>`
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");

  elements.userList.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Opravdu odstranit tohoto uživatele?");
      if (!confirmed) {
        return;
      }
      const [accountType, id] = String(button.dataset.deleteUser).split(":");
      await api(`/api/admin/users/${accountType}/${id}`, { method: "DELETE" });
      await loadUsersIfAdmin();
    });
  });
}

function renderPatientDetail() {
  return renderPatientDetailView();
  if (!state.selectedPatient) {
    showView("patients");
    return;
  }

  const patient = state.selectedPatient;
  const summary = state.selectedPatientSummary ?? {};
  const questionnaireStatuses = summarizeQuestionnaires(
    state.questionnaires,
    state.selectedPatientSubmissions
  );
  const groupedQuestionnaires = groupQuestionnairesByRound(questionnaireStatuses);

  elements.patientView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="back-row">
        <div class="questionnaire-actions">
          <button class="ghost" data-back-to-patients>Domů</button>
          <button class="danger small" data-delete-patient>Smazat pacienta</button>
        </div>
        <span class="meta-pill">Pacient ${escapeHtml(patient.noveid)}</span>
      </div>

      <div class="patient-header">
        <div>
          <p class="eyebrow">Karta Pacienta</p>
          <h2>${escapeHtml(patient.noveid)}</h2>
          <p class="muted">Centrální přehled kol, verzí formulářů a navazujících akcí.</p>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <strong>Identifikátor</strong>
          <div>${escapeHtml(patient.noveid)}</div>
        </div>
        <div class="detail-card">
          <strong>Poznámka</strong>
          <div>${escapeHtml(patient.notes || "Neuvedeno")}</div>
        </div>
        <div class="detail-card">
          <strong>Rozepsané</strong>
          <div>${summary.in_progress_count ?? 0}</div>
        </div>
        <div class="detail-card">
          <strong>Dokončené</strong>
          <div>${summary.completed_count ?? 0}</div>
        </div>
      </div>

      <div class="section-card">
        <div class="submission-head">
          <div>
            <h3>Aktivní formuláře</h3>
            <p class="muted">Formuláře jsou seskupené po kolech a vždy ukazují poslední relevantní stav.</p>
          </div>
        </div>
        <div class="round-list">
          ${groupedQuestionnaires.map((group) => renderQuestionnaireRound(group)).join("")}
        </div>
      </div>

      <details class="section-card history-toggle">
        <summary>
          <div>
            <h3>Historie a přehled</h3>
            <p class="muted">Rozkliknutím zobrazíš jednotlivé verze, jejich stav a dostupné akce.</p>
          </div>
        </summary>
        <div class="submission-list scroll-panel">
          ${renderSubmissionList()}
        </div>
      </details>
    </section>
  `;

  elements.patientView.querySelector("[data-back-to-patients]").addEventListener("click", () => {
    showView("patients");
  });
  elements.patientView.querySelector("[data-delete-patient]").addEventListener("click", onPatientDelete);

  elements.patientView.querySelectorAll("[data-start-questionnaire]").forEach((button) => {
    button.addEventListener("click", () => startQuestionnaire(button.dataset.startQuestionnaire));
  });

  elements.patientView.querySelectorAll("[data-open-submission]").forEach((button) => {
    button.addEventListener("click", () => openSubmission(button.dataset.openSubmission));
  });

  elements.patientView.querySelectorAll("[data-print-submission]").forEach((button) => {
    button.addEventListener("click", () => printSubmission(button.dataset.printSubmission));
  });

  elements.patientView.querySelectorAll("[data-delete-submission]").forEach((button) => {
    button.addEventListener("click", () => onSubmissionDelete(button.dataset.deleteSubmission));
  });
}

function renderSubmissionList() {
  return renderSubmissionListView();
  if (!state.selectedPatientSubmissions.length) {
    return `<div class="question-card"><p>Zatím tu není žádný dotazník.</p></div>`;
  }

  return state.selectedPatientSubmissions
    .map(
      (submission) => `
        <article class="submission-card">
          <div class="submission-head">
            <div>
              <h3>${escapeHtml(submission.questionnaire_title)}</h3>
              <p class="muted">${escapeHtml(submission.questionnaire_code)} · verze ${escapeHtml(submission.questionnaire_version)}</p>
            </div>
            <span class="status-chip ${submission.status === "completed" ? "completed" : "in-progress"}">
              ${submission.status === "completed" ? "Dokončený" : "Rozepsaný"}
            </span>
          </div>
          <div class="meta-line">
            <span>Založeno: ${formatDateTime(submission.started_at)}</span>
            <span>Poslední změna: ${formatDateTime(submission.updated_at)}</span>
          </div>
          <div class="questionnaire-actions">
            <button class="ghost small" data-open-submission="${submission.id}">Otevřít / upravit</button>
            <button class="ghost small" data-print-submission="${submission.id}">Tisk</button>
            <button class="danger small" data-delete-submission="${submission.id}">Smazat verzi</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderQuestionnaireEditor() {
  return renderQuestionnaireEditorView();
  if (!state.activeSubmission || !state.activeQuestionnaire) {
    elements.questionnaireView.innerHTML = "";
    return;
  }

  const answers = state.activeSubmission.answers ?? {};

  elements.questionnaireView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="back-row">
        <div class="questionnaire-actions">
          <button class="ghost" data-back-to-patient>Zpět na detail pacienta</button>
          <button class="ghost" data-go-home>Domů</button>
        </div>
        <span class="meta-pill">${escapeHtml(state.selectedPatient?.noveid || "")}</span>
      </div>

      <div class="editor-header">
        <div>
          <p class="eyebrow">Editor Dotazníku</p>
          <h2>${escapeHtml(state.activeQuestionnaire.title)}</h2>
          <p class="muted">Pracovní režim formuláře s průběžným uložením i finálním dokončením.</p>
        </div>
        <div class="editor-meta">
          <span class="meta-pill">${state.activeSubmission.status === "completed" ? "Dokončeno" : "Rozepsáno"}</span>
          <span class="meta-pill">${escapeHtml(state.activeQuestionnaire.code)}</span>
          <span class="meta-pill">Verze ${escapeHtml(state.activeQuestionnaire.version)}</span>
        </div>
        <div class="editor-actions">
          <button id="saveDraftButton" class="ghost">Uložit rozepsané</button>
          <button id="completeButton" class="primary">Dokončit a zavřít</button>
        </div>
      </div>

      <form id="questionnaireForm" class="editor-form">
        ${state.activeQuestionnaire.sections.map((section) => renderSection(section, answers)).join("")}

        <div class="section-card editor-footer-bar">
          <div class="editor-actions">
            <button type="button" id="saveDraftButtonBottom" class="ghost">Uložit rozepsané</button>
            <button type="button" id="completeButtonBottom" class="primary">Dokončit a zavřít</button>
          </div>
        </div>
      </form>
    </section>
  `;

  bindDynamicQuestionnaireBehavior();
  elements.questionnaireView.querySelector("[data-back-to-patient]").addEventListener("click", () => {
    renderPatientDetail();
    showView("patient");
  });
  elements.questionnaireView.querySelector("[data-go-home]").addEventListener("click", () => {
    showView("patients");
  });
  elements.questionnaireView
    .querySelector("#saveDraftButton")
    .addEventListener("click", () => saveSubmission("in_progress", { closeAfterSave: true }));
  elements.questionnaireView.querySelector("#completeButton").addEventListener("click", () => saveSubmission("completed", { closeAfterSave: true }));
  elements.questionnaireView
    .querySelector("#saveDraftButtonBottom")
    .addEventListener("click", () => saveSubmission("in_progress", { closeAfterSave: true }));
  elements.questionnaireView.querySelector("#completeButtonBottom").addEventListener("click", () => saveSubmission("completed", { closeAfterSave: true }));
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
    } catch {
      // Ignore parse errors and keep fallback message.
    }
    throw new Error(message);
  }

  return response.json();
}

function formatDateTime(value) {
  if (!value) {
    return "neuvedeno";
  }

  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cssEscape(value) {
  return String(value ?? "").replaceAll('"', '\\"');
}

function validateRequiredAnswers(questionnaire, answers) {
  const missing = [];

  for (const section of questionnaire.sections) {
    for (const question of section.questions) {
      if (!question.required || !isQuestionVisible(question, answers)) {
        continue;
      }

      const value = answers[question.key];
      if (isEmptyAnswer(value)) {
        missing.push(question.label);
      }
    }
  }

  return missing;
}

function isEmptyAnswer(value) {
  if (value == null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    if ("selected" in value) {
      if (Array.isArray(value.selected)) {
        return value.selected.length === 0;
      }
      return String(value.selected ?? "").trim() === "";
    }

    return Object.keys(value).length === 0;
  }

  return false;
}

function buildPrintableHtml(questionnaire, submission, patient) {
  const sections = questionnaire.sections
    .map((section) => {
      const rows = section.questions
        .filter((question) => isQuestionVisible(question, submission.answers ?? {}))
        .map((question) => {
          const rendered = renderAnswerForPrint(question, submission.answers?.[question.key]);
          return `
            <div class="print-row">
              <div class="print-label">${escapeHtml(question.label)}</div>
              <div class="print-value">${rendered}</div>
            </div>
          `;
        })
        .join("");

      return `
        <section class="print-section">
          <h2>${escapeHtml(section.title)}</h2>
          ${rows}
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
  <html lang="cs">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(questionnaire.title)}</title>
      <style>
        body { font-family: Georgia, serif; color: #222; margin: 32px; }
        h1, h2 { margin: 0 0 12px; }
        .meta { margin-bottom: 24px; display: grid; gap: 6px; }
        .print-section { margin-top: 24px; page-break-inside: avoid; }
        .print-row { border-top: 1px solid #ddd; padding: 10px 0; }
        .print-label { font-weight: 700; margin-bottom: 4px; }
        .print-value { color: #333; white-space: pre-wrap; }
        .muted { color: #666; }
        ul { margin: 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(questionnaire.title)}</h1>
      <div class="meta">
        <div><strong>Pacient:</strong> ${escapeHtml(patient?.noveid || "")}</div>
        <div><strong>Verze:</strong> ${escapeHtml(submission.questionnaire_version)}</div>
        <div><strong>Stav:</strong> ${escapeHtml(submission.status === "completed" ? "Dokončený" : "Rozepsaný")}</div>
        <div><strong>Uloženo:</strong> ${escapeHtml(formatDateTime(submission.updated_at))}</div>
      </div>
      ${sections}
    </body>
  </html>`;
}

function renderAnswerForPrint(question, value) {
  if (value == null || value === "") {
    return `<span class="muted">Bez odpovědi</span>`;
  }

  if (question.type === "single_choice") {
    const selectedKey = typeof value === "object" ? value.selected : value;
    const option = question.options.find((item) => item.key === selectedKey);
    const text = option?.label ?? String(selectedKey);
    const suffix = typeof value === "object" && value.freeText ? ` (${escapeHtml(value.freeText)})` : "";
    return `${escapeHtml(text)}${suffix}`;
  }

  if (question.type === "multi_choice") {
    const selected = value.selected ?? [];
    const items = selected.map((selectedKey) => {
      const option = question.options.find((item) => item.key === selectedKey);
      const freeText = value.freeTextMap?.[selectedKey];
      return `<li>${escapeHtml(option?.label ?? selectedKey)}${freeText ? ` (${escapeHtml(freeText)})` : ""}</li>`;
    });
    return items.length ? `<ul>${items.join("")}</ul>` : `<span class="muted">Bez odpovědi</span>`;
  }

  if (question.type === "multi_choice_nested") {
    const selected = value.selected ?? [];
    const items = selected.map((selectedKey) => {
      const option = question.options.find((item) => item.key === selectedKey);
      const nestedValue = value.nested?.[selectedKey];
      const nestedText = nestedValue?.selected
        ? ` - ${escapeHtml(findNestedLabel(option, nestedValue.selected) || nestedValue.selected)}`
        : "";
      const nestedMulti = Array.isArray(nestedValue?.selected) && nestedValue.selected.length
        ? ` - ${nestedValue.selected.map((key) => escapeHtml(findNestedLabel(option, key) || key)).join(", ")}`
        : "";
      return `<li>${escapeHtml(option?.label ?? selectedKey)}${nestedText}${nestedMulti}</li>`;
    });
    return items.length ? `<ul>${items.join("")}</ul>` : `<span class="muted">Bez odpovědi</span>`;
  }

  if (question.type === "repeatable_matrix_single") {
    const rows = Array.isArray(value) ? value : [];
    if (!rows.length) {
      return `<span class="muted">Bez odpovědi</span>`;
    }
    return `<ul>${rows
      .map((row) => {
        const option = question.options.find((item) => item.key === row.rating);
        return `<li>${escapeHtml(row.name || "Bez názvu")}: ${escapeHtml(option?.label ?? row.rating ?? "")}</li>`;
      })
      .join("")}</ul>`;
  }

  if (question.type === "fixed_matrix_single") {
    const items = (question.rows ?? [])
      .map((row) => {
        const selectedKey = value?.[row.key];
        if (!selectedKey) {
          return "";
        }
        const option = question.options.find((item) => item.key === selectedKey);
        return `<li>${escapeHtml(row.label)}: ${escapeHtml(option?.label ?? selectedKey)}</li>`;
      })
      .filter(Boolean);

    return items.length ? `<ul>${items.join("")}</ul>` : `<span class="muted">Bez odpovědi</span>`;
  }

  if (question.type === "vitalograph_assessment") {
    const parts = (question.columns ?? []).map((column) => {
      const columnValue = value?.[column.key] ?? {};
      const metricItems = (question.metrics ?? [])
        .map((metric) => {
          const selectedKey = columnValue?.[metric.key];
          if (!selectedKey) {
            return "";
          }
          const option = metric.options.find((item) => item.key === selectedKey);
          return `<li>${escapeHtml(metric.label)}: ${escapeHtml(option?.label ?? selectedKey)}</li>`;
        })
        .filter(Boolean);

      if (!metricItems.length) {
        return `<div><strong>${escapeHtml(column.label)}:</strong> <span class="muted">Bez odpovědi</span></div>`;
      }

      return `
        <div>
          <strong>${escapeHtml(column.label)}:</strong>
          <ul>${metricItems.join("")}</ul>
        </div>
      `;
    });

    return parts.join("");
  }

  if (question.type === "inhaler_evaluation_bundle") {
    const devices = Array.isArray(value?.devices) ? value.devices : [];
    if (!devices.length) {
      return `<span class="muted">Bez odpovědi</span>`;
    }

    const items = devices.map((device) => {
      const template = question.templates?.[device.deviceKey];
      const deviceLabel = template?.title ?? device.deviceKey;
      const selectedErrors = Object.entries(device.selectedErrors ?? {})
        .flatMap(([groupIndex, indexes]) =>
          (Array.isArray(indexes) ? indexes : []).map((itemIndex) => {
            const group = template?.errorGroups?.[Number(groupIndex)];
            return group?.items?.[Number(itemIndex)] ?? "";
          })
        )
        .filter(Boolean);

      return `
        <li>
          ${escapeHtml(deviceLabel)}
          ${selectedErrors.length ? `<ul>${selectedErrors.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ` <span class="muted">Bez označených chyb</span>`}
        </li>
      `;
    });

    return `<ul>${items.join("")}</ul>`;
  }

  return escapeHtml(String(value));
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
