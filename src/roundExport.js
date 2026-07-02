import { getQuestionnaireByCode } from "./questionnaires.js";

const ROUND_EXPORT_DEFINITIONS = {
  kolo1: {
    roundKey: "kolo1",
    roundNumber: 1,
    fileName: "1.kolo.csv",
    fileLabel: "1.kolo export",
    sheetName: "1.kolo",
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
    inhalationColumns: [
      "1_pro\u0161kolen",
      "1_pozn",
      "2_l\u00e9ka\u0159",
      "2_sestra",
      "2_farmaceut",
      "2_nev\u00edm",
      "2_nepro\u0161kolen",
      "3_jak \u010dasto1",
      "4_pro\u0161kolen\u00ed dostate\u010dn\u00e91",
      "5_samo1",
      "5_samo1_ti\u0161t\u011bn\u00e9",
      "5_samo1_videa",
      "5_samo1_elearning",
      "5_samo1_aplikace",
      "5_zdravotn\u00edk1",
      "5_zdravotn\u00edk1_n\u00e1cvik",
      "5_zdravotn\u00edk1_bez n\u00e1cviku",
      "6_d\u016fvod l\u00e9\u010dby",
      "6_pozn",
      "7_um\u00edm pou\u017e\u00edvat",
      "8_snadno_IS1",
      "8_snadno_IS2",
      "8_snadno_IS3",
      "9_p\u0159ed inhalac\u00ed1",
      "10_DPI1",
      "11_pMDI1",
      "12_SMI1",
      "13_po inhalaci1",
      "14_vzd\u011bl\u00e1n\u00ed",
      "15_s\u00e1m",
      "16_studuj\u00edc\u00ed",
      "16_pracuj\u00edc\u00ed",
      "16_starobn\u00ed",
      "16_invalidn\u00ed",
      "16_jin\u00e9",
      "16_pozn\u00e1mka",
      "17_zdravotn\u00edk",
      "18_typ zdravotn\u00edka",
      "18_pozn",
      "19_ku\u0159\u00e1k1",
      "19_pozn1",
      "20_klasick\u00e11",
      "20_iqos1",
      "20_elektronick\u00e11",
      "20_d\u00fdmka1",
      "20_marihuana1",
      "20_jin\u00e91",
      "20_pozn1",
      "20_neku\u0159\u00e1k1",
      "21_pasivn\u00ed ku\u0159\u00e1k1",
      "22_klasick\u00e11",
      "22_iqos1",
      "22_elektronick\u00e11",
      "22_d\u00fdmka1",
      "22_marihuana1",
      "22_jin\u00e91",
      "22_pozn1",
      "22_neku\u0159\u00e1k1"
    ]
  },
  kolo2: {
    roundKey: "kolo2",
    roundNumber: 2,
    fileName: "2.kolo.csv",
    fileLabel: "2.kolo export",
    sheetName: "2.kolo",
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
    inhalationColumns: [
      "1_jist\u011bj\u0161\u00ed_IS1",
      "1_jist\u011bj\u0161\u00ed_IS2",
      "1_jist\u011bj\u0161\u00ed_IS3",
      "2_zdravotn\u00ed stav",
      "3_spokojen",
      "4_vysv\u011btlen\u00ed",
      "4_vitalograph",
      "4_n\u00e1vod",
      "4_video",
      "4_SMS",
      "4_konzultace",
      "5_dopln\u011bn\u00ed",
      "6_neschopen",
      "7_neschopen pro\u010d",
      "7_pozn",
      "8_poka\u017ed\u00e9",
      "8_pravideln\u011b",
      "8_p\u0159i nov\u00e9m IS",
      "8_p\u0159i zhor\u0161en\u00ed",
      "9_\u0161kolil jin\u00fd",
      "10_jin\u00e9 info",
      "10_pozn",
      "11_p\u0159ed inhalac\u00ed2",
      "12_DPI2",
      "13_pMDI2",
      "14_SMI2",
      "15_po inhalaci2",
      "16_pro\u0161kolen\u00ed dostate\u010dn\u00e92",
      "17_samo2",
      "17_samo2_ti\u0161t\u011bn\u00e9",
      "17_samo2_videa",
      "17_samo2_elearning",
      "17_samo2_aplikace",
      "17_zdravotn\u00edk2",
      "17_zdravotn\u00edk2_n\u00e1cvik",
      "17_zdravotn\u00edk2_bez n\u00e1cviku",
      "18_s\u00e1m2",
      "19_ku\u0159\u00e1k2",
      "19_pozn2",
      "20_klasick\u00e12",
      "20_iqos2",
      "20_elektronick\u00e12",
      "20_d\u00fdmka2",
      "20_marihuana2",
      "20_jin\u00e92",
      "20_pozn2",
      "20_neku\u0159\u00e1k2",
      "21_pasivn\u00ed ku\u0159\u00e1k2",
      "22_klasick\u00e12",
      "22_iqos2",
      "22_elektronick\u00e12",
      "22_d\u00fdmka2",
      "22_marihuana2",
      "22_jin\u00e92",
      "22_pozn2",
      "22_neku\u0159\u00e1k2"
    ]
  }
};

const AGREEMENT_MAP = {
  agree: "souhlasím",
  rather_agree: "spíše souhlasím",
  unknown: "nevím",
  rather_disagree: "spíše nesouhlasím",
  disagree: "nesouhlasím"
};

const YES_NO_MAP = {
  yes: "ano",
  no: "ne",
  unknown: "nevím"
};

const EDUCATION_BEFORE_MAP = {
  all: "ano, se všemi",
  some: "ano, s některými",
  none: "ne",
  unknown: "nevím"
};

const THEORY_BEFORE_MAP = {
  normal_outside: "běžně mimo inhalátor",
  max_into_device: "maximálně do inhalátoru",
  max_outside: "maximálně mimo inhalátor",
  unknown: "nevím"
};

const THEORY_INHALE_MAP = {
  slow_deep: "pomalý a hluboký",
  fast_intense: "rychlý a intenzivní",
  continuous_any: "plynulý",
  unknown: "nevím"
};

const HOLD_BREATH_MAP = {
  yes_4_5: "ano",
  yes_5: "ano",
  depends: "záleží",
  no: "ne",
  unknown: "nevím"
};

const DIAGNOSIS_MAP = {
  asthma: "astma",
  copd: "CHOPN",
  other: "jiné",
  unknown: "nevím"
};

const EDUCATION_LEVEL_MAP = {
  primary: "základní",
  secondary_vocational: "výuční list",
  secondary_graduation: "maturita",
  higher_professional: "vyšší odborné",
  bachelor: "bakalářské",
  masters: "magisterské",
  doctoral: "doktorské"
};

const CURRENT_STATUS_MAP = {
  student: "studující",
  working: "pracující",
  old_age_retirement: "starobní důchod",
  disability_retirement: "invalidní důchod",
  other: "jiné"
};

const HEALTHCARE_FIELD_MAP = {
  doctor: "lékař",
  nurse: "sestra",
  pharmacist: "farmaceut",
  other: "jiné"
};

const SMOKING_MAP = {
  daily: "ano",
  occasional: "ano",
  former: "ne, bývalý kuřák",
  never: "ne"
};

const SMOKING_TYPE_MAP = {
  classic_cigarette: "klasická cigareta",
  heated_tobacco: "zahřívaný tabák",
  ecigarette: "elektronická cigareta",
  pipe: "dýmka",
  cigar: "doutník",
  marijuana: "marihuana",
  other: "jiné"
};

const VITALOGRAPH_VALUE_MAP = {
  insufficient: "nedostatečná",
  suboptimal: "suboptimální",
  optimal: "optimální",
  correct: "správně",
  incorrect: "nesprávně",
  too_high: "příliš vysoká",
  too_low: "příliš nízká",
  sufficient: "dostatečná"
};

const SECOND_ROUND_HEALTH_MAP = {
  agree: "zlep\u0161en\u00ed",
  rather_agree: "sp\u00ed\u0161e zlep\u0161en\u00ed",
  unknown: "stejn\u00fd stav",
  rather_disagree: "sp\u00ed\u0161e zhor\u0161en\u00ed",
  disagree: "zhor\u0161en\u00ed"
};

const EVALUATION_SLOT_NUMBERS = [0, 1, 2, 3, 4, 5, 6];

export function getRoundExportDefinition(roundKey) {
  return ROUND_EXPORT_DEFINITIONS[roundKey] ?? null;
}

export function buildRoundExportResponse(roundKey, context) {
  const definition = getRoundExportDefinition(roundKey);
  if (!definition) {
    return null;
  }

  const headers = buildRoundExportHeaders(definition);
  const rows = context.patients.map((patient) => buildRoundExportRow(definition, context, patient, headers));
  const csv = buildRoundExportCsv(headers, rows);

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${definition.fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}

function buildRoundExportCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(";")];

  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(";"));
  }

  return lines.join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildRoundExportHeaders(definition) {
  const headers = [
    "identifikátor ",
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
    definition.comboHeader
  ];

  for (const slotNumber of EVALUATION_SLOT_NUMBERS) {
    headers.push(`hodnotil H${slotNumber}`);
    headers.push(...buildEvaluationHeaders(definition.roundNumber, slotNumber));
  }

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

function buildEvaluationHeaders(roundNumber, slotNumber) {
  const templates = getEvaluationTemplatesByCode(`kolo${roundNumber}-dalsi-formular`);
  const slotLabel = `${roundNumber}H0${slotNumber}`;
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

function buildRoundExportRow(definition, context, patient, headers) {
  const row = Object.fromEntries(headers.map((header) => [header, "NaN"]));
  const patientSubmissions = context.submissionsByPatient.get(String(patient.id)) ?? [];
  const inhalationSubmission = getLatestSubmission(patientSubmissions, definition.inhalationCode);
  const vitalografSubmission = getLatestSubmission(patientSubmissions, definition.vitalografCode);
  const marsSubmission = getLatestSubmission(patientSubmissions, definition.marsCode);
  const fsi1Submission = getLatestSubmission(patientSubmissions, definition.fsiCodes[0]);
  const fsi2Submission = getLatestSubmission(patientSubmissions, definition.fsiCodes[1]);
  const fsi3Submission = getLatestSubmission(patientSubmissions, definition.fsiCodes[2]);

  const inhalationAnswers = safeJsonParse(inhalationSubmission?.answers_json, {});
  const vitalografAnswers = safeJsonParse(vitalografSubmission?.answers_json, {});
  const marsAnswers = safeJsonParse(marsSubmission?.answers_json, {});
  const fsi1Answers = safeJsonParse(fsi1Submission?.answers_json, {});
  const fsi2Answers = safeJsonParse(fsi2Submission?.answers_json, {});
  const fsi3Answers = safeJsonParse(fsi3Submission?.answers_json, {});

  const inhalers = Array.isArray(inhalationAnswers?.inhalation_systems)
    ? inhalationAnswers.inhalation_systems.filter(Boolean).slice(0, 3)
    : [];

  row["identifikátor "] = patient.noveid ?? "";
  row[definition.dateHeader] = extractFormValue(inhalationSubmission, inhalationAnswers?.evaluation_date);
  row[definition.statusHeader] = formatSubmissionState(inhalationSubmission);
  row.IS1 = valueOrNaN(exportInhalerLabel(inhalers[0]));
  row.IS2 = valueOrNaN(exportInhalerLabel(inhalers[1]));
  row.IS3 = valueOrNaN(exportInhalerLabel(inhalers[2]));

  Object.assign(row, buildInhalationQuestionColumns(definition, inhalationSubmission, inhalationAnswers));
  Object.assign(row, buildVitalographColumns(definition.roundNumber, vitalografSubmission, vitalografAnswers));
  Object.assign(row, buildMarsColumns(definition.roundNumber, marsSubmission, marsAnswers));
  Object.assign(row, buildFsiColumns(definition.roundNumber, 1, fsi1Submission, fsi1Answers));
  Object.assign(row, buildFsiColumns(definition.roundNumber, 2, fsi2Submission, fsi2Answers));
  Object.assign(row, buildFsiColumns(definition.roundNumber, 3, fsi3Submission, fsi3Answers, inhalers[2]));

  row[definition.noteHeader] = valueOrNaN(patient.notes);
  row[definition.countHeader] = inhalers.length ? inhalers.length : "NaN";
  row[definition.aerosolHeader] = inhalers.length ? (hasAerosolInhaler(inhalers) ? 1 : 0) : "NaN";
  row[definition.dpiHeader] = inhalers.length ? (hasDpiInhaler(inhalers) ? 1 : 0) : "NaN";
  row[definition.comboHeader] = inhalers.length ? (hasAerosolInhaler(inhalers) && hasDpiInhaler(inhalers) ? 1 : 0) : "NaN";

  for (const slotNumber of EVALUATION_SLOT_NUMBERS) {
    const slotKey = `h${slotNumber}`;
    const submission = getLatestSubmission(
      patientSubmissions,
      definition.evaluationCode,
      (item) => normalizeEvaluationSlot(item.evaluation_slot) === slotKey
    );
    const answers = safeJsonParse(submission?.answers_json, {});

    row[`hodnotil H${slotNumber}`] = valueOrNaN(resolveSubmissionActor(submission, context));
    Object.assign(row, buildEvaluationColumns(definition.roundNumber, slotNumber, submission, answers));
  }

  return row;
}

function buildInhalationQuestionColumns(definition, submission, answers) {
  const row = {};
  const set = createQuestionSetter(row, submission, answers);

  if (definition.roundKey === "kolo1") {
    const q2 = answers?.q2_who_educated ?? {};
    const q5 = answers?.q5_preferred_education ?? {};
    const q9Rows = Array.isArray(answers?.q9_inhaler_ease) ? answers.q9_inhaler_ease : [];
    const q19Value = extractComparableValue(answers?.q19_smoking);
    const q21Value = extractComparableValue(answers?.q21_passive_smoking);

    set("1_pro\u0161kolen", mapExportValue(answers?.q1_education_before, EDUCATION_BEFORE_MAP));
    set("1_pozn", extractTextValue(answers?.q1_education_before?.freeText, answers?.q1_education_before));
    set("2_l\u00e9ka\u0159", mapNestedFrequencyV2(q2, "doctor"));
    set("2_sestra", mapNestedFrequencyV2(q2, "nurse"));
    set("2_farmaceut", mapNestedFrequencyV2(q2, "pharmacist"));
    set("2_nev\u00edm", mapSingleFlagFromMulti(q2, "unknown"));
    set("2_nepro\u0161kolen", mapSingleChoiceFlag(answers?.q1_education_before, "none"));
    set("3_jak \u010dasto1", mapChoiceLabel("kolo1-inhalacni-technika", "q3_repeat_frequency", answers?.q3_repeat_frequency));
    set("4_pro\u0161kolen\u00ed dostate\u010dn\u00e91", mapExportValue(answers?.q4_education_sufficient, AGREEMENT_MAP));
    set("5_samo1", countNestedMultiSelection(q5, "self_study"));
    set("5_samo1_ti\u0161t\u011bn\u00e9", mapNestedMultiFlag(q5, "self_study", "educational_leaflets"));
    set("5_samo1_videa", mapNestedMultiFlag(q5, "self_study", "videos"));
    set("5_samo1_elearning", mapNestedMultiFlag(q5, "self_study", "elearning"));
    set("5_samo1_aplikace", mapNestedMultiFlag(q5, "self_study", "interactive_app"));
    set("5_zdravotn\u00edk1", countNestedMultiSelection(q5, "healthcare_worker"));
    set("5_zdravotn\u00edk1_n\u00e1cvik", mapNestedMultiFlag(q5, "healthcare_worker", "practical_training"));
    set("5_zdravotn\u00edk1_bez n\u00e1cviku", mapNestedMultiFlag(q5, "healthcare_worker", "online_demo"));
    set("6_d\u016fvod l\u00e9\u010dby", mapExportValue(answers?.q6_diagnosis, DIAGNOSIS_MAP));
    set("6_pozn", extractTextValue(answers?.q6_diagnosis?.freeText, answers?.q6_diagnosis));
    set("7_um\u00edm pou\u017e\u00edvat", mapExportValue(answers?.q8_can_use_inhalers, AGREEMENT_MAP));
    set("8_snadno_IS1", mapExportValue(q9Rows[0]?.rating, AGREEMENT_MAP));
    set("8_snadno_IS2", mapExportValue(q9Rows[1]?.rating, AGREEMENT_MAP));
    set("8_snadno_IS3", mapExportValue(q9Rows[2]?.rating, AGREEMENT_MAP));
    set("9_p\u0159ed inhalac\u00ed1", mapExportValue(answers?.q10_exhale_before_inhalation, THEORY_BEFORE_MAP));
    set("10_DPI1", mapExportValue(answers?.q11_dpi_inhale, THEORY_INHALE_MAP));
    set("11_pMDI1", mapExportValue(answers?.q12_pmdi_inhale, THEORY_INHALE_MAP));
    set("12_SMI1", mapExportValue(answers?.q13_respimat_inhale, THEORY_INHALE_MAP));
    set("13_po inhalaci1", mapExportValue(answers?.q14_hold_breath, HOLD_BREATH_MAP));
    set("14_vzd\u011bl\u00e1n\u00ed", mapExportValue(answers?.q15_education_level, EDUCATION_LEVEL_MAP));
    set("15_s\u00e1m", mapExportValue(answers?.q16_lives_alone, YES_NO_MAP));
    set("16_studuj\u00edc\u00ed", mapSingleFlagFromMulti(answers?.q16_current_status, "student"));
    set("16_pracuj\u00edc\u00ed", mapSingleFlagFromMulti(answers?.q16_current_status, "working"));
    set("16_starobn\u00ed", mapSingleFlagFromMulti(answers?.q16_current_status, "old_age_retirement"));
    set("16_invalidn\u00ed", mapSingleFlagFromMulti(answers?.q16_current_status, "disability_retirement"));
    set("16_jin\u00e9", mapSingleFlagFromMulti(answers?.q16_current_status, "other"));
    set("16_pozn\u00e1mka", extractMultiFreeTextV2(answers?.q16_current_status, "other"));
    set("17_zdravotn\u00edk", mapExportValue(answers?.q17_healthcare_background, YES_NO_MAP));
    set("18_typ zdravotn\u00edka", mapExportValue(answers?.q18_healthcare_field, HEALTHCARE_FIELD_MAP));
    set("18_pozn", extractTextValue(answers?.q18_healthcare_field?.freeText, answers?.q18_healthcare_field));
    set("19_ku\u0159\u00e1k1", mapExportValue(answers?.q19_smoking, SMOKING_MAP));
    set("19_pozn1", extractTextValue(answers?.q19_smoking?.freeText, answers?.q19_smoking));
    set("20_klasick\u00e11", mapConditionalMultiFlag(answers?.q20_smoking_types, "classic_cigarette", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_iqos1", mapConditionalMultiFlag(answers?.q20_smoking_types, "heated_tobacco", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_elektronick\u00e11", mapConditionalMultiFlag(answers?.q20_smoking_types, "ecigarette", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_d\u00fdmka1", mapConditionalMultiFlag(answers?.q20_smoking_types, "pipe", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_marihuana1", mapConditionalMultiFlag(answers?.q20_smoking_types, "marijuana", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_jin\u00e91", mapConditionalMultiFlag(answers?.q20_smoking_types, "other", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_pozn1", mapConditionalMultiFreeText(answers?.q20_smoking_types, "other", q19Value, ["daily", "occasional", "former"], ["never"]));
    set("20_neku\u0159\u00e1k1", mapSingleChoiceFlag(answers?.q19_smoking, "never"));
    set("21_pasivn\u00ed ku\u0159\u00e1k1", mapExportValue(answers?.q21_passive_smoking, YES_NO_MAP));
    set("22_klasick\u00e11", mapConditionalMultiFlag(answers?.q22_passive_smoking_types, "classic_cigarette", q21Value, ["yes"], ["no"]));
    set("22_iqos1", mapConditionalMultiFlag(answers?.q22_passive_smoking_types, "heated_tobacco", q21Value, ["yes"], ["no"]));
    set("22_elektronick\u00e11", mapConditionalMultiFlag(answers?.q22_passive_smoking_types, "ecigarette", q21Value, ["yes"], ["no"]));
    set("22_d\u00fdmka1", mapConditionalMultiFlag(answers?.q22_passive_smoking_types, "pipe", q21Value, ["yes"], ["no"]));
    set("22_marihuana1", mapConditionalMultiFlag(answers?.q22_passive_smoking_types, "marijuana", q21Value, ["yes"], ["no"]));
    set("22_jin\u00e91", mapConditionalMultiFlag(answers?.q22_passive_smoking_types, "other", q21Value, ["yes"], ["no"]));
    set("22_pozn1", mapConditionalMultiFreeText(answers?.q22_passive_smoking_types, "other", q21Value, ["yes"], ["no"]));
    set("22_neku\u0159\u00e1k1", mapSingleChoiceFlag(answers?.q21_passive_smoking, "no"));
    return row;
  }

  const q4 = answers?.sr_q4_training_benefit ?? {};
  const confidenceRows = Array.isArray(answers?.sr_q1_confident) ? answers.sr_q1_confident : [];
  const q17 = answers?.sr_q17_preferred_training_form ?? {};
  const srQ19Value = extractComparableValue(answers?.sr_q19_smoking);
  const srQ21Value = extractComparableValue(answers?.sr_q21_passive_smoking);

  set("1_jist\u011bj\u0161\u00ed_IS1", mapExportValue(confidenceRows[0]?.rating, AGREEMENT_MAP));
  set("1_jist\u011bj\u0161\u00ed_IS2", mapExportValue(confidenceRows[1]?.rating, AGREEMENT_MAP));
  set("1_jist\u011bj\u0161\u00ed_IS3", mapExportValue(confidenceRows[2]?.rating, AGREEMENT_MAP));
  set("2_zdravotn\u00ed stav", mapExportValue(answers?.sr_q2_health_improvement, SECOND_ROUND_HEALTH_MAP));
  set("3_spokojen", mapExportValue(answers?.sr_q3_training_satisfaction, AGREEMENT_MAP));
  set("4_vysv\u011btlen\u00ed", mapMatrixCellValue(q4?.pharmacist_training));
  set("4_vitalograph", mapMatrixCellValue(q4?.vitalograph_training));
  set("4_n\u00e1vod", mapMatrixCellValue(q4?.printed_guide));
  set("4_video", mapMatrixCellValue(q4?.video_link));
  set("4_SMS", mapMatrixCellValue(q4?.sms_video));
  set("4_konzultace", mapMatrixCellValue(q4?.whatsapp_reminder));
  set("5_dopln\u011bn\u00ed", extractTextValue(answers?.sr_q5_training_improve, answers?.sr_q5_training_improve));
  set("6_neschopen", mapExportValue(answers?.sr_q6_cannot_do_all_steps, YES_NO_MAP));
  set("7_neschopen pro\u010d", normalizeMultiSlotChoiceLabelV2("kolo2-inhalacni-technika", "sr_q7_why_not", answers?.sr_q7_why_not, 0));
  set("7_pozn", extractMultiFreeTextV2(answers?.sr_q7_why_not, "other"));
  set("8_poka\u017ed\u00e9", mapSingleFlagFromMulti(answers?.sr_q8_training_frequency, "every_visit"));
  set("8_pravideln\u011b", mapSingleFlagFromMulti(answers?.sr_q8_training_frequency, "regular_not_every"));
  set("8_p\u0159i nov\u00e9m IS", mapSingleFlagFromMulti(answers?.sr_q8_training_frequency, "new_device_only"));
  set("8_p\u0159i zhor\u0161en\u00ed", mapSingleFlagFromMulti(answers?.sr_q8_training_frequency, "worsening_only"));
  set("9_\u0161kolil jin\u00fd", mapExportValue(answers?.sr_q9_other_training, YES_NO_MAP));
  set("10_jin\u00e9 info", mapChoiceLabel("kolo2-inhalacni-technika", "sr_q10_other_training_differs", answers?.sr_q10_other_training_differs));
  set("10_pozn", extractTextValue(answers?.sr_q10_other_training_differs?.freeText, answers?.sr_q10_other_training_differs));
  set("11_p\u0159ed inhalac\u00ed2", mapExportValue(answers?.sr_q11_exhale_before_inhalation, THEORY_BEFORE_MAP));
  set("12_DPI2", mapExportValue(answers?.sr_q12_dpi_inhale, THEORY_INHALE_MAP));
  set("13_pMDI2", mapExportValue(answers?.sr_q13_pmdi_inhale, THEORY_INHALE_MAP));
  set("14_SMI2", mapExportValue(answers?.sr_q14_respimat_inhale, THEORY_INHALE_MAP));
  set("15_po inhalaci2", mapExportValue(answers?.sr_q15_hold_breath, HOLD_BREATH_MAP));
  set("16_pro\u0161kolen\u00ed dostate\u010dn\u00e92", mapExportValue(answers?.sr_q16_prior_training_sufficient, AGREEMENT_MAP));
  set("17_samo2", countNestedMultiSelection(q17, "self_study"));
  set("17_samo2_ti\u0161t\u011bn\u00e9", mapNestedMultiFlag(q17, "self_study", "educational_leaflets"));
  set("17_samo2_videa", mapNestedMultiFlag(q17, "self_study", "videos"));
  set("17_samo2_elearning", mapNestedMultiFlag(q17, "self_study", "elearning"));
  set("17_samo2_aplikace", mapNestedMultiFlag(q17, "self_study", "interactive_app"));
  set("17_zdravotn\u00edk2", countNestedMultiSelection(q17, "healthcare_worker"));
  set("17_zdravotn\u00edk2_n\u00e1cvik", mapNestedMultiFlag(q17, "healthcare_worker", "practical_training"));
  set("17_zdravotn\u00edk2_bez n\u00e1cviku", mapNestedMultiFlag(q17, "healthcare_worker", "online_demo"));
  set("18_s\u00e1m2", mapExportValue(answers?.sr_q18_lives_alone, YES_NO_MAP));
  set("19_ku\u0159\u00e1k2", mapExportValue(answers?.sr_q19_smoking, SMOKING_MAP));
  set("19_pozn2", extractTextValue(answers?.sr_q19_smoking?.freeText, answers?.sr_q19_smoking));
  set("20_klasick\u00e12", mapConditionalMultiFlag(answers?.sr_q20_smoking_types, "classic_cigarette", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_iqos2", mapConditionalMultiFlag(answers?.sr_q20_smoking_types, "heated_tobacco", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_elektronick\u00e12", mapConditionalMultiFlag(answers?.sr_q20_smoking_types, "ecigarette", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_d\u00fdmka2", mapConditionalMultiFlag(answers?.sr_q20_smoking_types, "pipe", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_marihuana2", mapConditionalMultiFlag(answers?.sr_q20_smoking_types, "marijuana", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_jin\u00e92", mapConditionalMultiFlag(answers?.sr_q20_smoking_types, "other", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_pozn2", mapConditionalMultiFreeText(answers?.sr_q20_smoking_types, "other", srQ19Value, ["daily", "occasional", "former"], ["never"]));
  set("20_neku\u0159\u00e1k2", mapSingleChoiceFlag(answers?.sr_q19_smoking, "never"));
  set("21_pasivn\u00ed ku\u0159\u00e1k2", mapExportValue(answers?.sr_q21_passive_smoking, YES_NO_MAP));
  set("22_klasick\u00e12", mapConditionalMultiFlag(answers?.sr_q22_passive_smoking_types, "classic_cigarette", srQ21Value, ["yes"], ["no"]));
  set("22_iqos2", mapConditionalMultiFlag(answers?.sr_q22_passive_smoking_types, "heated_tobacco", srQ21Value, ["yes"], ["no"]));
  set("22_elektronick\u00e12", mapConditionalMultiFlag(answers?.sr_q22_passive_smoking_types, "ecigarette", srQ21Value, ["yes"], ["no"]));
  set("22_d\u00fdmka2", mapConditionalMultiFlag(answers?.sr_q22_passive_smoking_types, "pipe", srQ21Value, ["yes"], ["no"]));
  set("22_marihuana2", mapConditionalMultiFlag(answers?.sr_q22_passive_smoking_types, "marijuana", srQ21Value, ["yes"], ["no"]));
  set("22_jin\u00e92", mapConditionalMultiFlag(answers?.sr_q22_passive_smoking_types, "other", srQ21Value, ["yes"], ["no"]));
  set("22_pozn2", mapConditionalMultiFreeText(answers?.sr_q22_passive_smoking_types, "other", srQ21Value, ["yes"], ["no"]));
  set("22_neku\u0159\u00e1k2", mapSingleChoiceFlag(answers?.sr_q21_passive_smoking, "no"));
  return row;
}

function buildVitalographColumns(roundNumber, submission, answers) {
  const row = {};
  const set = createQuestionSetter(row, submission, answers);
  const prefix = `V${roundNumber}`;
  const pmdiUnfilled = hasVitalographTypeUnfilled(answers?.vitalograph_inhaler_types, "pmdi");
  const dpiUnfilled = hasVitalographTypeUnfilled(answers?.vitalograph_inhaler_types, "dpi");
  const pmdiAfterNotNeeded = hasVitalographStatus(answers?.vitalograph_pmdi_assessment?.after?.__status, "not_needed");
  const dpiAfterNotNeeded = hasVitalographStatus(answers?.vitalograph_dpi_assessment?.after?.__status, "not_needed");
  const vitalographValue = (value, map, isUnfilled, isNotNeeded = false) =>
    isUnfilled ? "nevyplneno" : isNotNeeded ? "netreba" : mapExportValue(value, map);

  const pmdiSelected = hasSelectedMulti(answers?.vitalograph_inhaler_types, "pmdi");
  const dpiSelected = hasSelectedMulti(answers?.vitalograph_inhaler_types, "dpi");

  set(`${prefix}_pMDI_před`, pmdiUnfilled ? "nevyplneno" : pmdiSelected ? 1 : "NaN");
  set(`${prefix}_pMDI_před_úroveň IT`, vitalographValue(answers?.vitalograph_pmdi_assessment?.before?.technique_level, VITALOGRAPH_VALUE_MAP, pmdiUnfilled));
  set(`${prefix}_pMDI_před_aktivace`, vitalographValue(answers?.vitalograph_pmdi_assessment?.before?.reservoir_activation, VITALOGRAPH_VALUE_MAP, pmdiUnfilled));
  set(`${prefix}_pMDI_před_průtok`, vitalographValue(answers?.vitalograph_pmdi_assessment?.before?.flow_rate, VITALOGRAPH_VALUE_MAP, pmdiUnfilled));
  set(`${prefix}_pMDI_před_délka`, vitalographValue(answers?.vitalograph_pmdi_assessment?.before?.inhalation_length, VITALOGRAPH_VALUE_MAP, pmdiUnfilled));
  set(`${prefix}_pMDI_před_zadržení`, vitalographValue(answers?.vitalograph_pmdi_assessment?.before?.breath_hold, VITALOGRAPH_VALUE_MAP, pmdiUnfilled));
  set(`${prefix}_pMDI_po`, pmdiUnfilled ? "nevyplneno" : pmdiAfterNotNeeded ? "netreba" : pmdiSelected ? 1 : "NaN");
  set(`${prefix}_pMDI_po_úroveň IT`, vitalographValue(answers?.vitalograph_pmdi_assessment?.after?.technique_level, VITALOGRAPH_VALUE_MAP, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_aktivace`, vitalographValue(answers?.vitalograph_pmdi_assessment?.after?.reservoir_activation, VITALOGRAPH_VALUE_MAP, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_průtok`, vitalographValue(answers?.vitalograph_pmdi_assessment?.after?.flow_rate, VITALOGRAPH_VALUE_MAP, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_délka`, vitalographValue(answers?.vitalograph_pmdi_assessment?.after?.inhalation_length, VITALOGRAPH_VALUE_MAP, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_pMDI_po_zadržení`, vitalographValue(answers?.vitalograph_pmdi_assessment?.after?.breath_hold, VITALOGRAPH_VALUE_MAP, pmdiUnfilled, pmdiAfterNotNeeded));
  set(`${prefix}_DPI_před`, dpiUnfilled ? "nevyplneno" : dpiSelected ? 1 : "NaN");
  set(`${prefix}_DPI_před_úroveň IT`, vitalographValue(answers?.vitalograph_dpi_assessment?.before?.technique_level, VITALOGRAPH_VALUE_MAP, dpiUnfilled));
  set(`${prefix}_DPI_před_průtok`, vitalographValue(answers?.vitalograph_dpi_assessment?.before?.flow_rate, VITALOGRAPH_VALUE_MAP, dpiUnfilled));
  set(`${prefix}_DPI_před_délka`, vitalographValue(answers?.vitalograph_dpi_assessment?.before?.inhalation_length, VITALOGRAPH_VALUE_MAP, dpiUnfilled));
  set(`${prefix}_DPI_před_zadržení`, vitalographValue(answers?.vitalograph_dpi_assessment?.before?.breath_hold, VITALOGRAPH_VALUE_MAP, dpiUnfilled));
  set(`${prefix}_DPI_po`, dpiUnfilled ? "nevyplneno" : dpiAfterNotNeeded ? "netreba" : dpiSelected ? 1 : "NaN");
  set(`${prefix}_DPI_po_úroveň IT`, vitalographValue(answers?.vitalograph_dpi_assessment?.after?.technique_level, VITALOGRAPH_VALUE_MAP, dpiUnfilled, dpiAfterNotNeeded));
  set(`${prefix}_DPI_po_průtok`, vitalographValue(answers?.vitalograph_dpi_assessment?.after?.flow_rate, VITALOGRAPH_VALUE_MAP, dpiUnfilled, dpiAfterNotNeeded));
  set(`${prefix}_DPI_po_délka`, vitalographValue(answers?.vitalograph_dpi_assessment?.after?.inhalation_length, VITALOGRAPH_VALUE_MAP, dpiUnfilled, dpiAfterNotNeeded));
  set(`${prefix}_DPI_po_zadržení`, vitalographValue(answers?.vitalograph_dpi_assessment?.after?.breath_hold, VITALOGRAPH_VALUE_MAP, dpiUnfilled, dpiAfterNotNeeded));
  return row;
}

function buildMarsColumns(roundNumber, submission, answers) {
  const prefix = `MARS${roundNumber}`;
  const row = {};
  const set = createQuestionSetter(row, submission, answers);

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
  const set = createQuestionSetter(row, submission, answers);

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
  scoreKeys.forEach((_, index) => set(`${prefix}_ot${index + 1}`, scores[index]));
  set(`${prefix}_součet`, scores.every((item) => typeof item === "number") ? scores.reduce((sum, item) => sum + item, 0) : "NaN");
  return row;
}

function buildEvaluationColumns(roundNumber, slotNumber, submission, answers) {
  const templates = getEvaluationTemplatesByCode(`kolo${roundNumber}-dalsi-formular`);
  const slotLabel = `${roundNumber}H0${slotNumber}`;
  const row = {};
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);
  const devices = new Map(
    (Array.isArray(answers?.device_assessments?.devices) ? answers.device_assessments.devices : []).map((device) => [
      String(device.deviceKey ?? ""),
      device
    ])
  );
  const selectedSlots = Array.isArray(answers?.selected_inhalers) ? answers.selected_inhalers : [];

  for (const [deviceKey, prefix] of getEvaluationExportOrder()) {
    const template = templates[deviceKey];
    const device = devices.get(deviceKey);
    const selectedErrors = device?.selectedErrors ?? {};

    row[`${prefix}_${slotLabel}`] = allNaN ? "NaN" : allZero ? "nevyplneno" : selectedSlots.includes(deviceKey) ? 1 : "NaN";

    let totalErrors = 0;
    let touchedSteps = 0;

    for (let groupIndex = 0; groupIndex < (template?.errorGroups?.length ?? 0); groupIndex += 1) {
      const stepNumber = groupIndex + 1;
      const checked = Array.isArray(selectedErrors?.[groupIndex]) ? selectedErrors[groupIndex] : [];
      row[`${prefix}_${slotLabel}_${stepNumber}`] = allNaN ? "NaN" : allZero ? "nevyplneno" : device ? 1 : "NaN";
      if (checked.length > 0) {
        touchedSteps += 1;
      }

      const itemCount = template.errorGroups[groupIndex]?.items?.length ?? 0;
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        const isChecked = checked.includes(itemIndex);
        row[`${prefix}_${slotLabel}_${stepNumber}${String.fromCharCode(97 + itemIndex)}`] =
          allNaN ? "NaN" : allZero ? "nevyplneno" : device ? (isChecked ? 1 : 0) : "NaN";
        if (isChecked) {
          totalErrors += 1;
        }
      }
    }

    row[`${prefix}_${slotLabel}_chyby celkově`] = allNaN ? "NaN" : allZero ? "nevyplneno" : device ? totalErrors : "NaN";
    row[`${prefix}_${slotLabel}_chybné kroky`] = allNaN ? "NaN" : allZero ? "nevyplneno" : device ? touchedSteps : "NaN";
  }

  return row;
}

function createQuestionSetter(target, submission, answers) {
  const allNaN = !submission;
  const allZero = Boolean(answers?.__patient_not_filled);

  return (header, value) => {
    target[header] = allNaN ? "NaN" : allZero ? "nevyplneno" : valueOrNaN(value);
  };
}

function extractFormValue(submission, value) {
  if (!submission) {
    return "NaN";
  }
  const answers = safeJsonParse(submission.answers_json, {});
  if (answers?.__patient_not_filled) {
    return "nevyplneno";
  }
  return valueOrNaN(value);
}

function mapExportValue(value, map) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }
  return map?.[comparable] ?? comparable;
}

function mapChoiceLabel(questionnaireCode, questionKey, value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }
  const label = findOptionLabel(questionnaireCode, questionKey, comparable);
  return label ? normalizeLabel(label) : comparable;
}

function mapMatrixCellValue(value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }
  return comparable;
}

function mapNestedFrequencyV2(value, optionKey) {
  if (!value || typeof value !== "object") {
    return "NaN";
  }
  const selected = Array.isArray(value.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  const nestedValue = value.nested?.[optionKey]?.selected;
  if (!selected.includes(optionKey) && !nestedValue) {
    return 0;
  }
  return mapExportValue(nestedValue, { once: "jednou", repeated: "opakovaně", unknown: "nevím" });
}

function normalizeMultiSlotValueV2(value, slotIndex, map = null) {
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  const filtered = selected.filter((item) => !isUnfilledComparable(item));
  const picked = filtered[slotIndex];
  if (!picked) {
    return "NaN";
  }
  return map?.[picked] ?? picked;
}

function normalizeMultiSlotChoiceLabelV2(questionnaireCode, questionKey, value, slotIndex) {
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  const filtered = selected.filter((item) => !isUnfilledComparable(item));
  const picked = filtered[slotIndex];
  if (!picked) {
    return "NaN";
  }
  const label = findOptionLabel(questionnaireCode, questionKey, picked);
  return label ? normalizeLabel(label) : picked;
}

function extractMultiFreeTextV2(value, optionKey) {
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  return value?.freeTextMap?.[optionKey] || "NaN";
}

function extractTextValue(value, holder) {
  if (isUnfilledComparable(extractComparableValue(holder)) || isUnfilledComparable(value)) {
    return "nevyplneno";
  }
  return valueOrNaN(value);
}

function findOptionLabel(questionnaireCode, questionKey, optionKey) {
  const question = findQuestion(questionnaireCode, questionKey);
  const option = question?.options?.find((item) => item.key === optionKey);
  return option?.label ?? null;
}

function findQuestion(questionnaireCode, questionKey) {
  const questionnaire = getQuestionnaireByCode(questionnaireCode);
  for (const section of questionnaire?.sections ?? []) {
    for (const question of section.questions ?? []) {
      if (question.key === questionKey) {
        return question;
      }
    }
  }
  return null;
}

function normalizeLabel(label) {
  return String(label ?? "").trim().replace(/\.$/, "");
}

function scoreMars(value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }

  return {
    always: 1,
    often: 2,
    sometimes: 3,
    rarely: 4,
    never: 5
  }[comparable] ?? "NaN";
}

function scoreFsi(value) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }

  return {
    very: 5,
    quite: 4,
    partly: 3,
    little: 2,
    almost_not: 1
  }[comparable] ?? "NaN";
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

function getLatestSubmission(submissions, questionnaireCode, predicate = null) {
  return submissions.find(
    (submission) =>
      submission.questionnaire_code === questionnaireCode &&
      (!predicate || predicate(submission))
  ) ?? null;
}

function normalizeEvaluationSlot(value) {
  const slot = String(value ?? "").trim().toLowerCase();
  return slot || null;
}

function isUnfilledComparable(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "0" || normalized === "nevyplneno";
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

function buildSpreadsheetXml(sheetName, headers, rows) {
  const xmlRows = [
    buildSpreadsheetRow(headers, true),
    ...rows.map((row) => buildSpreadsheetRow(headers.map((header) => row[header])))
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8F1EE" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

function buildSpreadsheetRow(values, isHeader = false) {
  const cells = values
    .map((value) => {
      const style = isHeader ? ' ss:StyleID="Header"' : "";
      return `<Cell${style}><Data ss:Type="String">${escapeXml(value ?? "")}</Data></Cell>`;
    })
    .join("");
  return `<Row>${cells}</Row>`;
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

function hasSelectedMulti(value, optionKey) {
  const selected = Array.isArray(value?.selected) ? value.selected : Array.isArray(value) ? value : [];
  return selected.includes(optionKey);
}

function hasNestedMulti(value, optionKey, nestedKey) {
  const nestedSelected = Array.isArray(value?.nested?.[optionKey]?.selected)
    ? value.nested[optionKey].selected
    : [];
  return nestedSelected.includes(nestedKey);
}

function hasVitalographTypeUnfilled(value, optionKey) {
  const unfilled = Array.isArray(value?.unfilled) ? value.unfilled : [];
  return unfilled.includes(optionKey);
}

function hasVitalographStatus(value, expected) {
  return String(value ?? "").trim().toLowerCase() === String(expected ?? "").trim().toLowerCase();
}

function extractComparableValue(value) {
  if (value && typeof value === "object" && "selected" in value && typeof value.selected === "string") {
    return value.selected;
  }
  return value;
}

function exportInhalerLabel(code) {
  if (!code) {
    return "";
  }

  const question = findQuestion("kolo1-inhalacni-technika", "inhalation_systems");
  const option = question?.options?.find((item) => item.key === code);
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

function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function hasAnyMultiAnswer(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const selected = Array.isArray(value.selected) ? value.selected : [];
  if (selected.length > 0) {
    return true;
  }

  const nestedValues = Object.values(value.nested ?? {});
  return nestedValues.some((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }
    if (Array.isArray(item.selected)) {
      return item.selected.length > 0;
    }
    return item.selected != null && String(item.selected).trim() !== "";
  });
}

function hasMultiUnfilled(value) {
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  return selected.some((item) => isUnfilledComparable(item));
}

function mapNestedFrequency(value, optionKey) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (hasMultiUnfilled(value)) {
    return "nevyplneno";
  }
  const nestedValue = value?.nested?.[optionKey]?.selected;
  if (!selected.includes(optionKey) && !nestedValue) {
    return 0;
  }
  if (selected.includes(optionKey) && !nestedValue) {
    return "NaN";
  }
  return mapExportValue(nestedValue, { once: "jednou", repeated: "opakovanÄ›", unknown: "nevĂ­m" });
}

function normalizeMultiSlotValue(value, slotIndex, map = null) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  const filtered = selected.filter((item) => !isUnfilledComparable(item));
  const picked = filtered[slotIndex];
  if (!picked) {
    return "NaN";
  }
  return map?.[picked] ?? picked;
}

function normalizeMultiSlotChoiceLabel(questionnaireCode, questionKey, value, slotIndex) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  const filtered = selected.filter((item) => !isUnfilledComparable(item));
  const picked = filtered[slotIndex];
  if (!picked) {
    return "NaN";
  }
  const label = findOptionLabel(questionnaireCode, questionKey, picked);
  return label ? normalizeLabel(label) : picked;
}

function extractMultiFreeText(value, optionKey) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (selected.some((item) => isUnfilledComparable(item))) {
    return "nevyplneno";
  }
  return value?.freeTextMap?.[optionKey] || "NaN";
}

function mapSingleFlagFromMulti(value, optionKey) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  if (hasMultiUnfilled(value)) {
    return "nevyplneno";
  }
  const selected = Array.isArray(value?.selected) ? value.selected : [];
  return selected.includes(optionKey) ? 1 : 0;
}

function mapNestedMultiFlag(value, optionKey, nestedKey) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  if (hasMultiUnfilled(value)) {
    return "nevyplneno";
  }

  const selected = Array.isArray(value?.selected) ? value.selected : [];
  const nestedSelected = Array.isArray(value?.nested?.[optionKey]?.selected)
    ? value.nested[optionKey].selected.filter((item) => !isUnfilledComparable(item))
    : [];

  if (!selected.includes(optionKey)) {
    return selected.length > 0 ? 0 : "NaN";
  }
  if (nestedSelected.length === 0) {
    return "NaN";
  }
  return nestedSelected.includes(nestedKey) ? 1 : 0;
}

function mapSingleChoiceFlag(value, expectedKey) {
  const comparable = extractComparableValue(value);
  if (comparable == null || comparable === "") {
    return "NaN";
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }
  return comparable === expectedKey ? 1 : 0;
}

function countNestedMultiSelection(value, optionKey) {
  if (!hasAnyMultiAnswer(value)) {
    return "NaN";
  }
  if (hasMultiUnfilled(value)) {
    return "nevyplneno";
  }

  const selected = Array.isArray(value?.selected) ? value.selected : [];
  if (!selected.includes(optionKey)) {
    return selected.length > 0 ? 0 : "NaN";
  }

  const nestedSelected = Array.isArray(value?.nested?.[optionKey]?.selected)
    ? value.nested[optionKey].selected.filter((item) => !isUnfilledComparable(item))
    : [];

  if (nestedSelected.length === 0) {
    return "NaN";
  }

  return nestedSelected.length;
}

function mapConditionalMultiFlag(value, optionKey, parentValue, visibleValues = [], zeroValues = []) {
  const comparable = extractComparableValue(parentValue);
  if (comparable == null || comparable === "") {
    return mapSingleFlagFromMulti(value, optionKey);
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }
  if (zeroValues.includes(comparable)) {
    return 0;
  }
  if (!visibleValues.includes(comparable)) {
    return "NaN";
  }
  return mapSingleFlagFromMulti(value, optionKey);
}

function mapConditionalMultiFreeText(value, optionKey, parentValue, visibleValues = [], zeroValues = []) {
  const comparable = extractComparableValue(parentValue);
  if (comparable == null || comparable === "") {
    return extractMultiFreeTextV2(value, optionKey);
  }
  if (isUnfilledComparable(comparable)) {
    return "nevyplneno";
  }
  if (zeroValues.includes(comparable)) {
    return "NaN";
  }
  if (!visibleValues.includes(comparable)) {
    return "NaN";
  }
  return extractMultiFreeTextV2(value, optionKey);
}
