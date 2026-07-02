const state = {
  doctor: null,
  patient: null,
  patientSummary: null,
  questionnaireStatuses: [],
  questionnaires: [],
  selectedRoundKey: null,
  activeSubmission: null,
  activeQuestionnaire: null,
  openInhalerEvaluations: []
};

const elements = {
  doctorLoginCard: document.querySelector("#doctorLoginCard"),
  doctorLoginForm: document.querySelector("#doctorLoginForm"),
  doctorLoginMessage: document.querySelector("#doctorLoginMessage"),
  doctorApp: document.querySelector("#doctorApp"),
  doctorBadge: document.querySelector("#doctorBadge"),
  doctorHomeView: document.querySelector("#doctorHomeView")
};

init();

async function init() {
  wireEvents();
  await tryRestoreSession();
}

function wireEvents() {
  elements.doctorLoginForm.addEventListener("submit", onLoginSubmit);
}

async function tryRestoreSession() {
  try {
    const response = await api("/api/doctor-portal/me");
    state.doctor = response.user;
    await afterLogin();
  } catch {
    renderAuth();
  }
}

async function onLoginSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  try {
    const response = await api("/api/doctor-portal/login", {
      method: "POST",
      body: {
        loginId: formData.get("loginId"),
        password: formData.get("password")
      }
    });

    state.doctor = response.user;
    state.patient = null;
    state.patientSummary = null;
    state.questionnaireStatuses = [];
    state.selectedRoundKey = null;
    state.activeSubmission = null;
    state.activeQuestionnaire = null;
    elements.doctorLoginMessage.textContent = "";
    await afterLogin();
  } catch (error) {
    elements.doctorLoginMessage.textContent = error.message || "Přihlášení se nepodařilo.";
  }
}

async function afterLogin() {
  await loadQuestionnaires();
  renderApp();
}

async function onLogout() {
  await api("/api/doctor-portal/logout", { method: "POST" });
  state.doctor = null;
  state.patient = null;
  state.patientSummary = null;
  state.questionnaireStatuses = [];
  state.selectedRoundKey = null;
  state.activeSubmission = null;
  state.activeQuestionnaire = null;
  state.openInhalerEvaluations = [];
  elements.doctorLoginForm.reset();
  renderAuth();
}

async function loadQuestionnaires() {
  const response = await api("/api/doctor-portal/questionnaires");
  state.questionnaires = response.items;
}

async function onPatientLookup(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const noveid = String(formData.get("noveid") ?? "").trim();

  try {
    const response = await api("/api/doctor-portal/patient-lookup", {
      method: "POST",
      body: { noveid }
    });

    state.patient = response.patient;
    state.patientSummary = response.summary;
    state.questionnaireStatuses = response.questionnaireStatuses ?? [];
    state.selectedRoundKey = null;
    state.activeSubmission = null;
    state.activeQuestionnaire = null;
    renderHome();
  } catch (error) {
    state.patient = null;
    state.patientSummary = null;
    state.questionnaireStatuses = [];
    state.selectedRoundKey = null;
    state.activeSubmission = null;
    state.activeQuestionnaire = null;
    renderHome(error.message || "Pacient nebyl nalezen.");
  }
}

async function refreshPatientData() {
  if (!state.patient?.noveid) {
    return;
  }

  const response = await api("/api/doctor-portal/patient-lookup", {
    method: "POST",
    body: { noveid: state.patient.noveid }
  });

  state.patient = response.patient;
  state.patientSummary = response.summary;
  state.questionnaireStatuses = response.questionnaireStatuses ?? [];
}

function renderAuth() {
  elements.doctorLoginCard.classList.remove("hidden");
  elements.doctorApp.classList.add("hidden");
  elements.doctorBadge.classList.add("hidden");
}

function renderApp() {
  elements.doctorLoginCard.classList.add("hidden");
  elements.doctorApp.classList.remove("hidden");
  elements.doctorBadge.classList.remove("hidden");
  elements.doctorBadge.textContent = `Zdravotník ${state.doctor.login_id}`;
  renderHome();
}

function renderHomeView(message = "") {
  const roundGroups = groupQuestionnairesByRound(getDoctorQuestionnaireStatuses());
  const roundsMarkup = !state.patient
    ? ``
    : `
      <div class="detail-grid">
        <div class="detail-card">
          <strong>Pacient</strong>
          <div>${escapeHtml(state.patient.noveid)}</div>
        </div>
        <div class="detail-card">
          <strong>Rozepsané</strong>
          <div>${state.patientSummary?.in_progress_count ?? 0}</div>
        </div>
        <div class="detail-card">
          <strong>Dokončené</strong>
          <div>${state.patientSummary?.completed_count ?? 0}</div>
        </div>
      </div>

      <div class="portal-grid">
        ${roundGroups.map((group) => renderDoctorRoundCard(group)).join("")}
      </div>
    `;

  elements.doctorHomeView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="portal-home-head">
        <div>
          <p class="eyebrow">Portál zdravotníka</p>
          <h2>Vyhledání pacienta</h2>
        </div>
        <div class="editor-actions">
          <button class="ghost" data-doctor-home>Domů</button>
          <button class="ghost" data-doctor-logout>Odhlásit</button>
        </div>
      </div>

      <div class="section-card">
        <form id="doctorPatientLookupForm" class="stack">
          <label>
            <span>Identifikátor pacienta</span>
            <input type="text" name="noveid" value="${escapeHtml(state.patient?.noveid || "")}" autocomplete="off" required>
          </label>
          <div class="editor-actions">
            <button type="submit" class="primary">Najít pacienta</button>
          </div>
          ${message ? `<div class="message">${escapeHtml(message)}</div>` : ""}
        </form>
      </div>

      <div class="section-card">
        <div class="submission-head">
          <div>
            <h3>Kola formulářů</h3>
          </div>
        </div>
        ${roundsMarkup}
      </div>
    </section>
  `;

  elements.doctorHomeView.querySelector("[data-doctor-home]").addEventListener("click", () => renderHome());
  elements.doctorHomeView.querySelector("[data-doctor-logout]").addEventListener("click", onLogout);
  elements.doctorHomeView.querySelector("#doctorPatientLookupForm").addEventListener("submit", onPatientLookup);

  elements.doctorHomeView.querySelectorAll("[data-open-round]").forEach((button) => {
    button.addEventListener("click", () => {
      openDoctorRound(button.dataset.openRound);
    });
  });
}

function renderDoctorRoundCardView(group) {
  const aggregatedStatus = getRoundAggregateStatus(group.items);
  const roundNumber = extractRoundNumber(group.roundKey);
  const roundItem = group.items[0] ?? null;
  const alreadyCompleted = Boolean(roundItem?.currentDoctorCompleted);
  const limitReached = Boolean(roundItem?.doctorEvaluationLimitReached);
  const actionLabel = roundItem?.lastInProgressId
    ? "Pokračovat"
    : alreadyCompleted
      ? "Již vyplněno"
    : limitReached
      ? "Limit 6/6"
      : "Vyplnit formulář";

  return `
    <article class="portal-card">
      <div class="portal-card-top">
        <div class="portal-icon ${escapeHtml(aggregatedStatus.statusClass)}">K${escapeHtml(roundNumber)}</div>
        <span class="status-chip ${escapeHtml(aggregatedStatus.statusClass)}">${escapeHtml(aggregatedStatus.statusLabel)}</span>
      </div>
      <div class="portal-card-body">
        <h3>Hodnocení ${escapeHtml(roundNumber)}</h3>
        <p class="muted">Kolo ${escapeHtml(roundNumber)} · Poslední změna: ${escapeHtml(formatDateTime(group.lastUpdatedAt))}</p>
        <p class="muted">Zdravotnická hodnocení: ${Number(roundItem?.doctorEvaluationCount ?? 0)}/6</p>
      </div>
      <div class="editor-actions">
        <button class="${(limitReached || alreadyCompleted) && !roundItem?.lastInProgressId ? "danger" : "primary"}" data-open-round="${escapeHtml(group.roundKey)}" ${(limitReached || alreadyCompleted) && !roundItem?.lastInProgressId ? "disabled" : ""}>${actionLabel}</button>
      </div>
    </article>
  `;
}

function renderRoundViewProduct() {
  if (!state.patient || !state.selectedRoundKey) {
    renderHome();
    return;
  }

  const group = groupQuestionnairesByRound(getDoctorQuestionnaireStatuses()).find((item) => item.roundKey === state.selectedRoundKey);
  if (!group) {
    renderHome();
    return;
  }

  elements.doctorHomeView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="back-row">
        <div class="questionnaire-actions">
          <button class="ghost" data-back-home>Domů</button>
          <button class="ghost" data-back-rounds>Zpět</button>
        </div>
        <span class="meta-pill">${escapeHtml(state.patient.noveid)}</span>
      </div>

      <div class="patient-header">
        <div>
          <p class="eyebrow">Zdravotník · ${escapeHtml(group.roundKey)}</p>
          <h2>${escapeHtml(group.roundLabel)}</h2>
        </div>
      </div>

      <div class="section-card">
        <div class="round-list">
          ${renderQuestionnaireRound(group)}
        </div>
      </div>
    </section>
  `;

  elements.doctorHomeView.querySelector("[data-back-home]").addEventListener("click", () => {
    state.selectedRoundKey = null;
    renderHome();
  });
  elements.doctorHomeView.querySelector("[data-back-rounds]").addEventListener("click", () => {
    state.selectedRoundKey = null;
    renderHome();
  });

  elements.doctorHomeView.querySelectorAll("[data-start-questionnaire]").forEach((button) => {
    button.addEventListener("click", () => startQuestionnaire(button.dataset.startQuestionnaire));
  });

  elements.doctorHomeView.querySelectorAll("[data-open-submission]").forEach((button) => {
    button.addEventListener("click", () => openSubmission(button.dataset.openSubmission));
  });
}

function openDoctorRound(roundKey) {
  state.selectedRoundKey = roundKey;
  const group = groupQuestionnairesByRound(getDoctorQuestionnaireStatuses()).find((item) => item.roundKey === roundKey);
  const item = group?.items?.[0];

  if (!item) {
    renderHome();
    return;
  }

  if (item.lastInProgressId) {
    openSubmission(item.lastInProgressId);
    return;
  }

  if (item.doctorEvaluationLimitReached) {
    return;
  }

  if (item.currentDoctorCompleted) {
    const confirmed = window.confirm("Tento formul?? u? m?? dokon?en?. Opravdu chce? zalo?it novou verzi?");
    if (!confirmed) {
      return;
    }
  }

  startQuestionnaire(item.code);
}

function renderQuestionnaireRound(group) {
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
        ${group.items.map((item) => renderQuestionnaireShortcut(item)).join("")}
      </div>
    </section>
  `;
}

function renderQuestionnaireShortcut(item) {
  const label = getQuestionnaireShortcutLabel(item);
  const limitReached = Boolean(item.doctorEvaluationLimitReached);
  const alreadyCompleted = Boolean(item.currentDoctorCompleted);
  return `
    <article class="round-shortcut ${escapeHtml(item.statusClass)}">
      <div class="round-shortcut-head">
        <span class="round-shortcut-label">${escapeHtml(label)}</span>
        <span class="status-chip ${escapeHtml(item.statusClass)}">${escapeHtml(item.statusLabel)}</span>
      </div>
      <div class="questionnaire-actions">
        ${
          item.lastInProgressId
            ? `<button class="primary small" data-open-submission="${item.lastInProgressId}">Pokračovat</button>`
            : `<button class="${(limitReached || alreadyCompleted) ? "danger" : "primary"} small" ${(limitReached || alreadyCompleted) ? "disabled" : `data-start-questionnaire="${escapeHtml(item.code)}"`}>${alreadyCompleted ? "Již vyplněno" : limitReached ? "Limit 6/6" : "Vyplnit formulář"}</button>`
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

async function startQuestionnaire(questionnaireCode) {
  if (!state.patient?.id) {
    return;
  }

  const questionnaireState = getDoctorQuestionnaireStatuses().find((item) => item.code === questionnaireCode) || null;
  if (questionnaireState?.lastCompletedId || questionnaireState?.currentDoctorCompleted) {
    const confirmed = window.confirm("Tento formul?? u? je veden? jako dokon?en?. Opravdu chce? zalo?it novou verzi?");
    if (!confirmed) {
      return;
    }
  }

  const response = await api(`/api/doctor-portal/patients/${state.patient.id}/submissions`, {
    method: "POST",
    body: { questionnaireCode }
  });

  state.activeSubmission = response.submission;
  state.activeQuestionnaire = response.questionnaire;
  state.openInhalerEvaluations = [];
  await refreshPatientData();
  renderQuestionnaireEditor();
}

async function openSubmission(submissionId) {
  const response = await api(`/api/doctor-portal/submissions/${submissionId}`);
  state.activeSubmission = response.submission;
  state.activeQuestionnaire = response.questionnaire;
  state.openInhalerEvaluations = [];
  renderQuestionnaireEditor();
}

async function saveSubmission(status, options = {}) {
  if (!state.activeSubmission || !state.activeQuestionnaire) {
    return;
  }

  const answers = collectAnswers();
  if (status === "completed") {
    const missing = validateRequiredAnswers(state.activeQuestionnaire, answers);
    if (missing.length) {
      alert(`Před dokončením je potřeba vyplnit: ${missing.join(", ")}`);
      return;
    }
  }

  const response = await api(`/api/doctor-portal/submissions/${state.activeSubmission.id}`, {
    method: "PUT",
    body: { status, answers }
  });

  state.activeSubmission = response.submission;
  await refreshPatientData();
  renderQuestionnaireEditor();

  if (options.closeAfterSave) {
    state.activeSubmission = null;
    state.activeQuestionnaire = null;
    renderHome();
  }
}

function renderQuestionnaireEditor() {
  if (!state.activeSubmission || !state.activeQuestionnaire || !state.patient) {
    renderHome();
    return;
  }

  const answers = normalizeEditorAnswers(
    state.activeQuestionnaire,
    state.activeSubmission.answers ?? {},
    state.activeSubmission.status
  );
  state.activeSubmission.answers = answers;

  elements.doctorHomeView.innerHTML = `
    <section class="panel page-view content-shell">
      <div class="back-row">
        <div class="questionnaire-actions">
          <button class="ghost" data-back-home>Domů</button>
          <button class="ghost" data-back-round>Zpět</button>
        </div>
        <span class="meta-pill">${escapeHtml(state.patient.noveid)}</span>
      </div>

      <div class="editor-header">
        <div>
          <p class="eyebrow">Editor dotazníku</p>
          <h2>${escapeHtml(state.activeQuestionnaire.title)}</h2>
          <p class="muted">Stav: ${state.activeSubmission.status === "completed" ? "dokončený" : "rozepsaný"}</p>
        </div>
        <div class="editor-actions">
          <button id="saveDraftButton" class="ghost">Uložit rozepsané</button>
          <button id="completeButton" class="primary">Dokončit a zavřít</button>
        </div>
      </div>

      <form id="questionnaireForm" class="editor-form">
        ${state.activeQuestionnaire.sections.map((section) => renderSection(section, answers)).join("")}

        <div class="section-card">
          <div class="editor-actions">
            <button type="button" id="saveDraftButtonBottom" class="ghost">Uložit rozepsané</button>
            <button type="button" id="completeButtonBottom" class="primary">Dokončit a zavřít</button>
          </div>
        </div>
      </form>
    </section>
  `;

  bindDynamicQuestionnaireBehavior();
  elements.doctorHomeView.querySelector("[data-back-home]").addEventListener("click", () => {
    state.activeSubmission = null;
    state.activeQuestionnaire = null;
    state.selectedRoundKey = null;
    renderHome();
  });
  elements.doctorHomeView.querySelector("[data-back-round]").addEventListener("click", () => {
    state.activeSubmission = null;
    state.activeQuestionnaire = null;
    renderHome();
  });
  elements.doctorHomeView
    .querySelector("#saveDraftButton")
    .addEventListener("click", () => saveSubmission("in_progress", { closeAfterSave: true }));
  elements.doctorHomeView.querySelector("#completeButton").addEventListener("click", () => saveSubmission("completed", { closeAfterSave: true }));
  elements.doctorHomeView
    .querySelector("#saveDraftButtonBottom")
    .addEventListener("click", () => saveSubmission("in_progress", { closeAfterSave: true }));
  elements.doctorHomeView.querySelector("#completeButtonBottom").addEventListener("click", () => saveSubmission("completed", { closeAfterSave: true }));
}

function renderSection(section, answers) {
  return `
    <section class="section-card">
      <h3>${escapeHtml(section.title)}</h3>
      <div class="stack">
        ${section.questions.map((question) => renderQuestion(question, answers)).join("")}
      </div>
    </section>
  `;
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
    ? (Array.isArray(state.activeSubmission?.answers?.selected_inhalers) && state.activeSubmission.answers.selected_inhalers.length
        ? state.activeSubmission.answers.selected_inhalers.slice(0, 3)
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
            ? `<p class="muted">Inhalátory se do hodnocení přebírají automaticky z úvodního dotazníku tohoto kola.</p>`
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
      ? Array.isArray(state.activeSubmission?.answers?.selected_inhalers)
        ? state.activeSubmission.answers.selected_inhalers
        : []
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
        ${device.template.steps
          .map(
            (step, stepIndex) => `
              <article class="inhaler-step-card">
                <div class="inhaler-step-head">
                  <span class="inhaler-step-badge">${escapeHtml(String(stepIndex + 1))}</span>
                  <div class="inhaler-step-title">${escapeHtml(step.title)}</div>
                </div>
                <p>${escapeHtml(step.instruction)}</p>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="inhaler-evaluation-errors">
        <h5>Chyby, na které bych se měl/a zaměřit</h5>
        ${device.template.errorGroups
          .map(
            (group, groupIndex) => `
              <section class="inhaler-error-group">
                <div class="inhaler-error-group-title">Krok ${escapeHtml(String(groupIndex + 1))}</div>
                <div class="stack">
                  ${group.items
                    .map((item, itemIndex) => {
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
                    })
                    .join("")}
                </div>
              </section>
            `
          )
          .join("")}
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
    <div class="fixed-matrix">
      <div class="fixed-matrix-table">
        <div class="fixed-matrix-row fixed-matrix-head">
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
    <div class="fixed-matrix-row">
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
                    type="radio"
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

  return `
    <div class="stack nested-choice-group">
      ${question.options
        .map((option) => {
          const checked = selectedOptions.includes(option.key);
          return `
            <div class="option-block nested-option">
              <label class="nested-option-head">
                <input
                  type="checkbox"
                  name="${escapeHtml(question.key)}__selected"
                  value="${escapeHtml(option.key)}"
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
  const inhalerAddButtons = elements.doctorHomeView.querySelectorAll("[data-add-inhaler]");
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

  const inhalerRemoveButtons = elements.doctorHomeView.querySelectorAll("[data-remove-inhaler]");
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

  const inhalerSelects = elements.doctorHomeView.querySelectorAll('[name^="inhalation_systems__select__"]');
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

  const selectedInhalerSelects = elements.doctorHomeView.querySelectorAll('[name^="selected_inhalers__select__"]');
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

  const toggleButtons = elements.doctorHomeView.querySelectorAll("[data-toggle-evaluation]");
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
          const target = elements.doctorHomeView.querySelector(`#${cssEscape(`device-evaluation-${slot}`)}`);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    });
  });

  elements.doctorHomeView.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("change", () => {
      syncNestedParentChecks(elements.doctorHomeView);
      updateVisibility();
    });
  });

  syncNestedParentChecks(elements.doctorHomeView);
  updateVisibility();
}

function updateVisibility() {
  const answers = collectAnswers();
  elements.doctorHomeView.querySelectorAll("[data-question-key]").forEach((questionElement) => {
    const rawCondition = questionElement.dataset.visibleWhen;
    const condition = rawCondition ? JSON.parse(rawCondition) : null;
    const visible = isVisibleByCondition(condition, answers);
    questionElement.classList.toggle("hidden", !visible);
  });
}

function collectAnswers() {
  const form = elements.doctorHomeView.querySelector("#questionnaireForm");
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
    const columnResult = {};

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
  const selectedSet = new Set(
    Array.from(form.querySelectorAll(`input[name="${cssEscape(question.key)}__selected"]:checked`)).map((item) => item.value)
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
  root.querySelectorAll("[data-parent-option]").forEach((field) => {
    const parentOption = field.dataset.parentOption;
    if (!parentOption || !field.name) {
      return;
    }

    const questionKey = field.name.split("__")[0];
    const parentInput = root.querySelector(
      `input[name="${cssEscape(questionKey)}__selected"][value="${cssEscape(parentOption)}"]`
    );

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

function getDoctorQuestionnaireStatuses() {
  return (state.questionnaireStatuses ?? []).filter((item) => String(item.formKey ?? "") === "dalsi-formular");
}

function getRoundAggregateStatus(items) {
  const latestItem = items
    .filter((item) => item.lastUpdatedAt)
    .sort((left, right) => new Date(right.lastUpdatedAt).getTime() - new Date(left.lastUpdatedAt).getTime())[0];

  if (latestItem?.statusClass === "in-progress") {
    return { statusClass: "in-progress", statusLabel: "Rozepsané" };
  }

  if (items.length > 0 && items.every((item) => item.statusClass === "completed")) {
    return { statusClass: "completed", statusLabel: "Vyplněné" };
  }

  if (items.some((item) => item.statusClass === "completed")) {
    return { statusClass: "completed", statusLabel: "Částečně" };
  }

  return { statusClass: "not-started", statusLabel: "Nevyplněné" };
}

function getQuestionnaireShortcutLabel(item) {
  const roundNumber = extractRoundNumber(item.roundKey);
  const formKey = String(item.formKey ?? "");

  if (formKey === "inhalacni-technika") {
    return `Dotazník ${roundNumber}`;
  }

  if (formKey === "vitalograf") {
    return `Vitalograf ${roundNumber}`;
  }

  if (formKey.startsWith("fsi-")) {
    const instance = formKey.split("-")[1] ?? "";
    return `FSI ${roundNumber}.${instance}`;
  }

  if (formKey === "mars-a") {
    return `MARS ${roundNumber}`;
  }

  if (formKey === "dalsi-formular") {
    return `Hodnocení ${roundNumber} · H ${Number(item.doctorEvaluationCount ?? 0)}/6`;
  }

  return `${item.title} ${roundNumber}`.trim();
}

function extractRoundNumber(roundKey) {
  const match = String(roundKey ?? "").match(/(\d+)/);
  return match ? match[1] : "";
}

function renderHome(message = "") {
  return renderHomeView(message);
}

function renderDoctorRoundCard(group) {
  return renderDoctorRoundCardView(group);
}

function renderRoundView() {
  return renderRoundViewProduct();
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
      // ignore
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
