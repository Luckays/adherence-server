import { inhalerEvaluationTemplates } from "./inhalerTemplates.generated.js";

const legacyQuestionnaires = [
  {
    code: "inhalacni-technika",
    version: "2025-04-15",
    title: "Dotazník o inhalační technice – pacienti",
    description: "Revize 15.4.2025",
    sections: [
      {
        id: "meta",
        title: "Identifikace a metadata",
        questions: [
          {
            key: "evaluation_number",
            label: "Hodnocení č.",
            type: "single_choice",
            options: [
              { key: "1", label: "1" },
              { key: "2", label: "2" }
            ]
          },
          {
            key: "evaluation_date",
            label: "Datum hodnocení",
            type: "date",
            required: true
          },
          {
            key: "inhalation_systems",
            label: "Hodnocené inhalační systémy (pokud jich pacient užívá více, uveďte všechny)",
            type: "inhaler_selector",
            required: true,
            options: [
              { key: "aerolizer", label: "aerolizer" },
              { key: "pmdi", label: "pMDI" },
              { key: "pmdi_nastavec", label: "pMDI nástavec" },
              { key: "breezhaler", label: "breezhaler" },
              { key: "diskus", label: "diskus" },
              { key: "easyhaler", label: "easyhaler" },
              { key: "ellipta", label: "ellipta" },
              { key: "forspiro", label: "forspiro" },
              { key: "genuair", label: "genuair" },
              { key: "handihaler", label: "handihaler" },
              { key: "nexthaler", label: "nexthaler" },
              { key: "aerosphere", label: "aerosphere" },
              { key: "respimat", label: "respimat" },
              { key: "respimat_nastavec", label: "respimat nástavec" },
              { key: "spiromax", label: "spiromax" },
              { key: "turbuhaler", label: "turbuhaler" },
              { key: "twisthaler", label: "twisthaler" }
            ]
          }
        ]
      },
      {
        id: "education",
        title: "Edukace v oblasti inhalační techniky",
        questions: [
          {
            key: "q1_education_before",
            label: "1. Byl/a jste v minulosti proškolen/a, jak správně zacházet s aktuálně používanými inhalátory?",
            type: "single_choice",
            required: true,
            options: [
              { key: "all", label: "Ano, se všemi aktuálně používanými inhalátory." },
              { key: "some", label: "Ano, ale jen s některými aktuálně používanými inhalátory.", allowsFreeText: true, freeTextLabel: "Uveďte s jakými" },
              { key: "none", label: "Ne, s žádnými aktuálně používanými inhalátory." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q2_who_educated",
            label: "2. Pokud jste na předchozí otázku odpověděl/a ANO, kým bylo proškolení provedeno?",
            helpText: "Vyberte 1 nebo více možností a 1 příslušnou dílčí možnost.",
            type: "multi_choice_nested",
            visibleWhen: {
              questionKey: "q1_education_before",
              operator: "in",
              value: ["all", "some"]
            },
            options: [
              {
                key: "doctor",
                label: "Lékařem.",
                nestedSingleChoice: {
                  key: "doctor_frequency",
                  options: [
                    { key: "once", label: "Jednou." },
                    { key: "repeated", label: "Opakovaně." },
                    { key: "unknown", label: "Nevím." }
                  ]
                }
              },
              {
                key: "nurse",
                label: "Sestrou.",
                nestedSingleChoice: {
                  key: "nurse_frequency",
                  options: [
                    { key: "once", label: "Jednou." },
                    { key: "repeated", label: "Opakovaně." },
                    { key: "unknown", label: "Nevím." }
                  ]
                }
              },
              {
                key: "pharmacist",
                label: "Farmaceutem.",
                nestedSingleChoice: {
                  key: "pharmacist_frequency",
                  options: [
                    { key: "once", label: "Jednou." },
                    { key: "repeated", label: "Opakovaně." },
                    { key: "unknown", label: "Nevím." }
                  ]
                }
              },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q3_repeat_frequency",
            label: "3. Pokud jste na předchozí otázku odpověděl/a OPAKOVANĚ, jak často bylo proškolení provedeno?",
            type: "single_choice",
            visibleWhen: {
              questionKey: "q2_who_educated",
              operator: "anyNestedEquals",
              value: "repeated"
            },
            options: [
              { key: "every_visit", label: "Při každé návštěvě ambulance/hospitalizaci/podání inhalačního léčivého přípravku nebo při výdeji inhalačního léčivého přípravku v lékárně." },
              { key: "regular_not_every", label: "Pravidelně, ale NE při každé návštěvě ambulance/hospitalizaci/podání inhalačního léčivého přípravku nebo při výdeji inhalačního léčivého přípravku v lékárně." },
              { key: "new_device_only", label: "Pouze při předepsání/výdeji nového typu inhalátoru." },
              { key: "worsening_only", label: "Pouze v případě zhoršování onemocnění." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q4_education_sufficient",
            label: "4. Svoje dosavadní proškolení ohledně správného zacházení s inhalátory považuji za dostatečné.",
            type: "single_choice",
            options: [
              { key: "agree", label: "Souhlasím." },
              { key: "rather_agree", label: "Spíše souhlasím." },
              { key: "unknown", label: "Nevím." },
              { key: "rather_disagree", label: "Spíše nesouhlasím." },
              { key: "disagree", label: "Nesouhlasím." }
            ]
          },
          {
            key: "q5_preferred_education",
            label: "5. Jakou formu edukace ohledně správného zacházení s inhalátory preferujete?",
            helpText: "Vyberte 1 nebo více možností.",
            type: "multi_choice_nested",
            options: [
              {
                key: "self_study",
                label: "Samostudium.",
                nestedMultiChoice: {
                  key: "self_study_formats",
                  options: [
                    { key: "educational_leaflets", label: "Tištěné materiály." },
                    { key: "videos", label: "Vzdělávací videa." },
                    {
                      key: "elearning",
                      label:
                        "E-learning kombinující výukový text a předvedení správné inhalační techniky. (pozn: e-learning je forma vzdělávání využívající výpočetní techniku a internet)"
                    },
                    {
                      key: "interactive_app",
                      label:
                        "Interaktivní mobilní/webová aplikace s předvedením správné inhalační techniky. (pozn: aplikace zde znamená programové vybavení mobilu nebo počítače)"
                    }
                  ]
                }
              },
              {
                key: "healthcare_worker",
                label: "Proškolení prováděné zdravotníkem.",
                nestedMultiChoice: {
                  key: "healthcare_worker_formats",
                  options: [
                    { key: "practical_training", label: "Praktický nácvik správné inhalační techniky při návštěvě ambulance/výdeji inhalačního léčivého přípravku v lékárně." },
                    {
                      key: "online_demo",
                      label:
                        "Předvedení správné inhalační techniky (bez nácviku) osobně nebo s využitím videohovoru (např. WhatsApp, Skype, Teams)."
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        id: "attitudes",
        title: "Postoje a názory na inhalační léčbu",
        questions: [
          {
            key: "q6_diagnosis",
            label: "6. Víte, z důvodu jakého onemocnění užíváte inhalační léčbu?",
            type: "single_choice",
            options: [
              { key: "asthma", label: "Bronchiální astma." },
              { key: "copd", label: "Chronická obstrukční plicní nemoc." },
              { key: "other", label: "Jiné.", allowsFreeText: true, freeTextLabel: "Uveďte jaké" },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q8_can_use_inhalers",
            label: "7. Svoje inhalátory umím používat.",
            type: "single_choice",
            options: [
              { key: "agree", label: "Souhlasím." },
              { key: "rather_agree", label: "Spíše souhlasím." },
              { key: "unknown", label: "Nevím." },
              { key: "rather_disagree", label: "Spíše nesouhlasím." },
              { key: "disagree", label: "Nesouhlasím." }
            ]
          },
          {
            key: "q9_inhaler_ease",
            label: "8. Můj inhalátor se mi používá snadno.",
            helpText: "Doplňte název inhalátoru a vyberte 1 možnost.",
            type: "repeatable_matrix_single",
            rowLabel: "Název inhalátoru",
            options: [
              { key: "agree", label: "Souhlasím." },
              { key: "rather_agree", label: "Spíše souhlasím." },
              { key: "unknown", label: "Nevím." },
              { key: "rather_disagree", label: "Spíše nesouhlasím." },
              { key: "disagree", label: "Nesouhlasím." }
            ]
          }
        ]
      },
      {
        id: "theory",
        title: "Teoretická část – pacient bude dotazován pouze na otázky (11–13), které se týkají aktuálně používaných inhalátorů s ukázkou konkrétního inhalátoru",
        questions: [
          {
            key: "q10_exhale_before_inhalation",
            label: "9. Bezprostředně před inhalací by pacient měl:",
            type: "single_choice",
            visibleWhen: {
              questionKey: "inhalation_systems",
              operator: "containsAny",
              value: [
                "aerolizer",
                "pmdi",
                "breezhaler",
                "diskus",
                "easyhaler",
                "ellipta",
                "forspiro",
                "genuair",
                "handihaler",
                "nexthaler",
                "aerosphere",
                "respimat",
                "spiromax",
                "turbuhaler",
                "twisthaler"
              ]
            },
            options: [
              { key: "normal_outside", label: "vydechnout běžným způsobem mimo inhalátor." },
              { key: "max_into_device", label: "vydechnout pomalu a maximálně do inhalátoru." },
              { key: "max_outside", label: "vydechnout pomalu a maximálně mimo inhalátor." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q11_dpi_inhale",
            label: "10. Při inhalaci práškovými inhalátory (DPI) je vyžadován nádech:",
            type: "single_choice",
            visibleWhen: {
              questionKey: "inhalation_systems",
              operator: "containsAny",
              value: ["aerolizer", "breezhaler", "diskus", "easyhaler", "ellipta", "forspiro", "genuair", "handihaler", "nexthaler", "spiromax", "turbuhaler", "twisthaler"]
            },
            options: [
              { key: "slow_deep", label: "Pomalý a hluboký." },
              { key: "fast_intense", label: "Rychlý a intenzivní." },
              { key: "continuous_any", label: "Je to jedno, nádech musí být především plynulý." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q12_pmdi_inhale",
            label: "11. Při inhalaci aerosolovými inhalátory (pMDI) je vyžadován nádech:",
            type: "single_choice",
            visibleWhen: {
              questionKey: "inhalation_systems",
              operator: "containsAny",
              value: ["pmdi", "aerosphere"]
            },
            options: [
              { key: "slow_deep", label: "Pomalý a hluboký." },
              { key: "fast_intense", label: "Rychlý a intenzivní." },
              { key: "continuous_any", label: "Je to jedno, nádech musí být především plynulý." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q13_respimat_inhale",
            label: "12. Při inhalaci inhalátorem jemné mlžiny (Respimat) je vyžadován nádech:",
            type: "single_choice",
            visibleWhen: {
              questionKey: "inhalation_systems",
              operator: "containsAny",
              value: ["respimat"]
            },
            options: [
              { key: "slow_deep", label: "Pomalý a hluboký." },
              { key: "fast_intense", label: "Rychlý a intenzivní." },
              { key: "continuous_any", label: "Je to jedno, nádech musí být především plynulý." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q14_hold_breath",
            label: "13. Je třeba zadržet po inhalaci dech?",
            type: "single_choice",
            visibleWhen: {
              questionKey: "inhalation_systems",
              operator: "containsAny",
              value: [
                "aerolizer",
                "pmdi",
                "breezhaler",
                "diskus",
                "easyhaler",
                "ellipta",
                "forspiro",
                "genuair",
                "handihaler",
                "nexthaler",
                "aerosphere",
                "respimat",
                "spiromax",
                "turbuhaler",
                "twisthaler"
              ]
            },
            options: [
              { key: "yes_4_5", label: "Ano, dech by se měl zadržet po dobu alespoň 4-5 sekund." },
              { key: "depends", label: "Záleží na typu inhalátoru." },
              { key: "no", label: "Ne, lze okamžitě dýchat normálně, nemá to vliv." },
              { key: "unknown", label: "Nevím." }
            ]
          }
        ]
      },
      {
        id: "sociodemographic",
        title: "Sociodemografická data",
        questions: [
          {
            key: "q15_education_level",
            label: "14. Nejvyšší dosažené vzdělání:",
            type: "single_choice",
            options: [
              { key: "primary", label: "Základní" },
              { key: "secondary_vocational", label: "Středoškolské s výučním listem" },
              { key: "secondary_graduation", label: "Středoškolské s maturitou" },
              { key: "higher_professional", label: "Vyšší odborné (DiS.)" },
              { key: "bachelor", label: "Bakalářské (Bc.)" },
              { key: "masters", label: "Magisterské (např. Mgr., Ing.)" },
              { key: "doctoral", label: "Doktorské (Ph.D.)" }
            ]
          },
          {
            key: "q16_lives_alone",
            label: "15. V současnosti žijete sám/sama?",
            type: "single_choice",
            options: [
              { key: "yes", label: "Ano." },
              { key: "no", label: "Ne." }
            ]
          },
          {
            key: "q16_current_status",
            label: "16. V současnosti jste:",
            type: "multi_choice",
            options: [
              { key: "student", label: "Studující" },
              { key: "working", label: "Pracující" },
              { key: "old_age_retirement", label: "Ve starobním důchodu" },
              { key: "disability_retirement", label: "V invalidním důchodu" },
              { key: "other", label: "Jiné", allowsFreeText: true, freeTextLabel: "Uveďte" }
            ]
          },
          {
            key: "q17_healthcare_background",
            label: "17. Pracujete/pracoval/a jste ve zdravotnictví nebo studujete/studoval/a jste zdravotnický obor?",
            type: "single_choice",
            options: [
              { key: "yes", label: "Ano." },
              { key: "no", label: "Ne." }
            ]
          },
          {
            key: "q18_healthcare_field",
            label: "18. Pokud jste na předchozí otázku odpověděl/a ANO, o jaký zdravotnický obor se jedná/jednalo?",
            type: "single_choice",
            visibleWhen: {
              questionKey: "q17_healthcare_background",
              operator: "equals",
              value: "yes"
            },
            options: [
              { key: "doctor", label: "Lékař/ka." },
              { key: "nurse", label: "Sestra." },
              { key: "pharmacist", label: "Farmaceut/ka." },
              { key: "other", label: "Jiné.", allowsFreeText: true, freeTextLabel: "Uveďte jaké" }
            ]
          },
          {
            key: "q19_smoking",
            label: "19. Kouříte?",
            type: "single_choice",
            options: [
              { key: "daily", label: "Ano, kouřím každý den. (kuřák)" },
              { key: "occasional", label: "Ano, kouřím příležitostně, ale ne každý den. (příležitostný kuřák)" },
              { key: "former", label: "Ne, přestal jsem kouřit. (bývalý kuřák)", allowsFreeText: true, freeTextLabel: "Jak dlouho abstinujete?" },
              { key: "never", label: "Ne, nikdy jsem nevykouřil víc než 100 cigaret. (nekuřák)" }
            ]
          },
          {
            key: "q20_smoking_types",
            label: "20. Uveďte způsob kouření:",
            type: "multi_choice",
            visibleWhen: {
              questionKey: "q19_smoking",
              operator: "in",
              value: ["daily", "occasional", "former"]
            },
            options: [
              { key: "classic_cigarette", label: "Klasická cigareta" },
              { key: "heated_tobacco", label: "Zahřívaný tabák (např. IQOS)" },
              { key: "ecigarette", label: "Elektronická cigareta s liquidem (např. Elf Bar)" },
              { key: "pipe", label: "Dýmka" },
              { key: "cigar", label: "Doutník" },
              { key: "marijuana", label: "Marihuana" },
              { key: "other", label: "Jiné", allowsFreeText: true, freeTextLabel: "" }
            ]
          },
          {
            key: "q21_passive_smoking",
            label: "21. Jste pravidelně vystavován/a pasivnímu kouření (např. doma, v práci)?",
            type: "single_choice",
            options: [
              { key: "yes", label: "Ano, jsem pasivní kuřák." },
              { key: "no", label: "Ne." },
              { key: "unknown", label: "Nevím." }
            ]
          },
          {
            key: "q22_passive_smoking_types",
            label: "22. Uveďte způsob kouření:",
            type: "multi_choice",
            visibleWhen: {
              questionKey: "q21_passive_smoking",
              operator: "equals",
              value: "yes"
            },
            options: [
              { key: "classic_cigarette", label: "Klasická cigareta" },
              { key: "heated_tobacco", label: "Zahřívaný tabák (např. IQOS)" },
              { key: "ecigarette", label: "Elektronická cigareta s liquidem (např. Elf Bar)" },
              { key: "pipe", label: "Dýmka" },
              { key: "cigar", label: "Doutník" },
              { key: "marijuana", label: "Marihuana" },
              { key: "other", label: "Jiné", allowsFreeText: true, freeTextLabel: "" }
            ]
          }
        ]
      }
    ]
  },
  {
    code: "kontrolni-navsteva",
    version: "2026-01-01",
    title: "Krátký kontrolní dotazník",
    description: "Ukázka druhého dotazníku pro víceformulářový frontend.",
    sections: [
      {
        id: "control",
        title: "Kontrolní návštěva",
        questions: [
          {
            key: "visit_date",
            label: "Datum kontroly",
            type: "date",
            required: true
          },
          {
            key: "subjective_state",
            label: "Jak se pacient cítí?",
            type: "single_choice",
            options: [
              { key: "better", label: "Lépe" },
              { key: "same", label: "Stejně" },
              { key: "worse", label: "Hůře" }
            ]
          },
          {
            key: "control_note",
            label: "Poznámka",
            type: "textarea"
          }
        ]
      }
    ]
  }
];

const roundDefinitions = [
  { key: "kolo1", label: "Kolo 1", order: 1 },
  { key: "kolo2", label: "Kolo 2", order: 2 }
];

const vitalographMetricSets = {
  pmdi: [
    {
      key: "technique_level",
      label: "Úroveň inhalační techniky",
      options: [
        { key: "insufficient", label: "Nedostatečná" },
        { key: "suboptimal", label: "Suboptimální" },
        { key: "optimal", label: "Optimální" }
      ]
    },
    {
      key: "reservoir_activation",
      label: "Aktivace zásobníku",
      options: [
        { key: "correct", label: "Správně" },
        { key: "incorrect", label: "Nesprávně" }
      ]
    },
    {
      key: "flow_rate",
      label: "Průtoková rychlost",
      options: [
        { key: "too_high", label: "Příliš vysoká" },
        { key: "optimal", label: "Optimální" },
        { key: "too_low", label: "Příliš nízká" }
      ]
    },
    {
      key: "inhalation_length",
      label: "Délka nádechu",
      options: [
        { key: "sufficient", label: "Dostatečná" },
        { key: "insufficient", label: "Nedostatečná" }
      ]
    },
    {
      key: "breath_hold",
      label: "Zadržení dechu",
      options: [
        { key: "sufficient", label: "Dostatečné" },
        { key: "insufficient", label: "Nedostatečné" }
      ]
    }
  ],
  dpi: [
    {
      key: "technique_level",
      label: "Úroveň inhalační techniky",
      options: [
        { key: "insufficient", label: "Nedostatečná" },
        { key: "suboptimal", label: "Suboptimální" },
        { key: "optimal", label: "Optimální" }
      ]
    },
    {
      key: "flow_rate",
      label: "Průtoková rychlost",
      options: [
        { key: "too_high", label: "Příliš vysoká" },
        { key: "optimal", label: "Optimální" },
        { key: "too_low", label: "Příliš nízká" }
      ]
    },
    {
      key: "inhalation_length",
      label: "Délka nádechu",
      options: [
        { key: "sufficient", label: "Dostatečná" },
        { key: "insufficient", label: "Nedostatečná" }
      ]
    },
    {
      key: "breath_hold",
      label: "Zadržení dechu",
      options: [
        { key: "sufficient", label: "Dostatečné" },
        { key: "insufficient", label: "Nedostatečné" }
      ]
    }
  ]
};

const fsi10Options = [
  { key: "very", label: "Velmi" },
  { key: "quite", label: "Docela" },
  { key: "partly", label: "Částečně" },
  { key: "little", label: "Málo" },
  { key: "almost_not", label: "Téměř vůbec" }
];

const fsi10Rows = [
  { key: "learn", label: "Bylo snadné naučit se zacházet s inhalátorem?" },
  { key: "prepare", label: "Bylo snadné připravit inhalátor k použití?" },
  { key: "use", label: "Bylo snadné používat inhalátor?" },
  { key: "clean", label: "Bylo snadné udržovat inhalátor čistý a v dobrém stavu?" },
  { key: "activities", label: "Bylo snadné pokračovat v běžných aktivitách i během používání inhalátoru?" },
  { key: "lips", label: "Pasoval inhalátor pohodlně na Vaše rty?" },
  { key: "size_weight", label: "Bylo používání inhalátoru snadné vzhledem k jeho velikosti a hmotnosti?" },
  { key: "carry", label: "Bylo snadné nosit inhalátor s sebou?" },
  { key: "correct_use_feeling", label: "Měl/a jste po použití inhalátoru pocit, že jste ho použil/a správně?" },
  { key: "overall_satisfaction", label: "Jste celkově spokojený/á s inhalátorem s ohledem na předchozí odpovědi?" }
];

const secondRoundAgreementOptions = [
  { key: "agree", label: "Souhlasím." },
  { key: "rather_agree", label: "Spíše souhlasím." },
  { key: "unknown", label: "Nevím." },
  { key: "rather_disagree", label: "Spíše nesouhlasím." },
  { key: "disagree", label: "Nesouhlasím." }
];

const secondRoundTrainingBenefitOptions = [
  { key: "1", label: "1" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "4", label: "4" },
  { key: "5", label: "5" },
  { key: "x", label: "x" }
];

const secondRoundTrainingBenefitRows = [
  { key: "pharmacist_training", label: "Vysvětlení, předvedení a nácvik správného zacházení s inhalátorem/inhalátory farmaceutem" },
  { key: "vitalograph_training", label: "Nácvik správného nádechu pomocí přístroje Vitalograph" },
  { key: "printed_guide", label: "Tištěný návod s vyznačenými chybami" },
  { key: "video_link", label: "Odkaz na edukační video" },
  { key: "sms_video", label: "SMS připomenutí s odkazem na edukační video" },
  { key: "whatsapp_reminder", label: "Online/telefonické* připomenutí správného zacházení s inhalátorem/inhalátory farmaceutem přes WhatsApp" }
];

const secondRoundInhalationSections = [
  {
    id: "meta",
    title: "Identifikace a metadata",
    questions: [
      {
        key: "evaluation_number",
        label: "Hodnocení č.",
        type: "single_choice",
        options: [
          { key: "1", label: "1" },
          { key: "2", label: "2" }
        ]
      },
      {
        key: "evaluation_date",
        label: "Datum hodnocení",
        type: "date",
        required: true
      },
      {
        key: "inhalation_systems",
        label: "Hodnocené inhalační systémy (pokud jich pacient užívá více, uveďte všechny):",
        type: "inhaler_selector",
        required: true,
        options: cloneSections(legacyQuestionnaires[0].sections)[0].questions[2].options
      }
    ]
  },
  {
    id: "study_feedback",
    title: "Zpětná vazba k předchozímu proškolení ohledně správného zacházení s aktuálně používaným inhalátorem/inhalátory v rámci probíhající studie",
    questions: [
      {
        key: "sr_q1_confident",
        label: "1. V porovnání s dobou před předchozím proškolením jsem si jistější v zacházení se svým/i inhalátorem/inhalátory.",
        helpText: "Vyberte 1 možnost pro každý aktuálně používaný inhalátor.",
        type: "repeatable_matrix_single",
        rowLabel: "Název inhalátoru",
        options: secondRoundAgreementOptions
      },
      {
        key: "sr_q2_health_improvement",
        label: "2. V porovnání s dobou před prvním proškolením pociťuji změnu svého zdravotního stavu (např. v porovnání se stejným obdobím v loňském roce).",
        type: "single_choice",
        options: [
          { key: "agree", label: "Pociťuji zlepšení." },
          { key: "rather_agree", label: "Pociťuji spíše zlepšení." },
          { key: "unknown", label: "Nepociťuji změnu stavu." },
          { key: "rather_disagree", label: "Pociťuji spíše zhoršení." },
          { key: "disagree", label: "Pociťuji zhoršení." }
        ]
      },
      {
        key: "sr_q3_training_satisfaction",
        label: "3. Byl/a jsem celkově spokojený/á se způsobem proškolení.",
        type: "single_choice",
        options: secondRoundAgreementOptions
      },
      {
        key: "sr_q4_training_benefit",
        label: "4. Jaký přínos pro vás měly jednotlivé části proškolení?",
        helpText: "Ohodnoťte každou část známkami 1-5 jako ve škole (1 = velmi přínosné, 5 = zcela nepřínosné). Pokud jste některou z částí proškolení neabsolvovali, označte možnost x a nehodnoťte ji.",
        type: "fixed_matrix_single",
        options: secondRoundTrainingBenefitOptions,
        rows: secondRoundTrainingBenefitRows
      },
      {
        key: "sr_q5_training_improve",
        label: "5. Co by se dle Vašeho názoru mohlo ohledně proškolení změnit/zlepšit?",
        type: "textarea"
      },
      {
        key: "sr_q6_cannot_do_all_steps",
        label: "6. Přestože se snažím postupovat při zacházení s inhalátorem/inhalátory podle doporučení, nejsem schopen provést všechny kroky inhalační techniky správně.",
        type: "single_choice",
        options: [
          { key: "yes", label: "Ano, souhlasím." },
          { key: "no", label: "Ne, nesouhlasím." }
        ]
      },
      {
        key: "sr_q7_why_not",
        label: "7. Pokud jste na předchozí otázku odpověděl/a \"ANO, souhlasím\", specifikujte proč.",
        type: "multi_choice",
        visibleWhen: {
          questionKey: "sr_q6_cannot_do_all_steps",
          operator: "equals",
          value: "yes"
        },
        options: [
          { key: "health_condition", label: "Omezuje mě můj zdravotní stav (např. nejsem schopen/schopna se dostatečně nadechnout)." },
          { key: "strength", label: "Nemám dostatečnou sílu (např. nejsem schopen/schopna stisknout tlakovou nádobku)." },
          { key: "unclear_explanation", label: "Vysvětlení zacházení s inhalátorem pro mě bylo nesrozumitelné." },
          { key: "other", label: "Jiné.", allowsFreeText: true, freeTextLabel: "Uveďte" }
        ]
      },
      {
        key: "sr_q8_training_frequency",
        label: "8. Jak často byste chtěl/a být proškolován/a ohledně správného zacházení s inhalátorem/inhalátory?",
        helpText: "Vyberte 1 nebo více možností.",
        type: "multi_choice",
        options: [
          { key: "every_visit", label: "Při každé návštěvě ambulance/hospitalizaci/podání inhalačního léčivého přípravku nebo při výdeji inhalačního léčivého přípravku v lékárně." },
          { key: "regular_not_every", label: "Pravidelně, ale NE při každé návštěvě ambulance/hospitalizaci/podání inhalačního léčivého přípravku nebo při výdeji inhalačního léčivého přípravku v lékárně." },
          { key: "new_device_only", label: "Pouze při předepsání/výdeji nového typu inhalátoru." },
          { key: "worsening_only", label: "Pouze v případě zhoršování onemocnění." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q9_other_training",
        label: "9. Byl/a jste v období od vstupu do probíhající studie do dnešní návštěvy proškolen/a jinou osobou (mimo probíhající studii) ohledně správného zacházení s inhalátorem/inhalátory?",
        type: "single_choice",
        options: [
          { key: "yes", label: "Ano." },
          { key: "no", label: "Ne." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q10_other_training_differs",
        label: "10. Pokud jste na předchozí otázku odpověděl/a \"ANO\", specifikujte, zda se informace ohledně správného zacházení s inhalátorem/inhalátory od jiné osoby lišily od informací, které jsem obdržel/a v rámci probíhající studie.",
        type: "single_choice",
        visibleWhen: {
          questionKey: "sr_q9_other_training",
          operator: "equals",
          value: "yes"
        },
        options: [
          { key: "all", label: "Ano, u všech aktuálně používaných inhalátorů." },
          { key: "some", label: "Ano, ale jen u některých aktuálně používaných inhalátorů.", allowsFreeText: true, freeTextLabel: "Uveďte u jakých" },
          { key: "none", label: "Ne, u žádných aktuálně používaných inhalátorů." },
          { key: "unknown", label: "Nevím." }
        ]
      }
    ]
  },
  {
    id: "theory",
    title: "Teoretická část",
    questions: [
      {
        key: "sr_q11_exhale_before_inhalation",
        label: "11. Bezprostředně před inhalací by pacient měl:",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        visibleWhen: {
          questionKey: "inhalation_systems",
          operator: "containsAny",
          value: [
            "aerolizer",
            "pmdi",
            "breezhaler",
            "diskus",
            "easyhaler",
            "ellipta",
            "forspiro",
            "genuair",
            "handihaler",
            "nexthaler",
            "aerosphere",
            "respimat",
            "spiromax",
            "turbuhaler",
            "twisthaler"
          ]
        },
        options: [
          { key: "normal_outside", label: "vydechnout běžným způsobem mimo inhalátor." },
          { key: "max_into_device", label: "vydechnout pomalu a maximálně do inhalátoru." },
          { key: "max_outside", label: "vydechnout pomalu a maximálně mimo inhalátor." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q12_dpi_inhale",
        label: "12. Při inhalaci práškovými inhalátory (DPI) je vyžadován nádech:",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        visibleWhen: {
          questionKey: "inhalation_systems",
          operator: "containsAny",
          value: ["aerolizer", "breezhaler", "diskus", "easyhaler", "ellipta", "forspiro", "genuair", "handihaler", "nexthaler", "spiromax", "turbuhaler", "twisthaler"]
        },
        options: [
          { key: "slow_deep", label: "Pomalý a hluboký." },
          { key: "fast_intense", label: "Rychlý a intenzivní." },
          { key: "continuous_any", label: "Je to jedno, nádech musí být především plynulý." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q13_pmdi_inhale",
        label: "13. Při inhalaci aerosolovými inhalátory (pMDI) je vyžadován nádech:",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        visibleWhen: {
          questionKey: "inhalation_systems",
          operator: "containsAny",
          value: ["pmdi", "aerosphere"]
        },
        options: [
          { key: "slow_deep", label: "Pomalý a hluboký." },
          { key: "fast_intense", label: "Rychlý a intenzivní." },
          { key: "continuous_any", label: "Je to jedno, nádech musí být především plynulý." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q14_respimat_inhale",
        label: "14. Při inhalaci inhalátorem jemné mlžiny (Respimat) je vyžadován nádech:",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        visibleWhen: {
          questionKey: "inhalation_systems",
          operator: "containsAny",
          value: ["respimat"]
        },
        options: [
          { key: "slow_deep", label: "Pomalý a hluboký." },
          { key: "fast_intense", label: "Rychlý a intenzivní." },
          { key: "continuous_any", label: "Je to jedno, nádech musí být především plynulý." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q15_hold_breath",
        label: "15. Je třeba zadržet po inhalaci dech?",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        visibleWhen: {
          questionKey: "inhalation_systems",
          operator: "containsAny",
          value: [
            "aerolizer",
            "pmdi",
            "breezhaler",
            "diskus",
            "easyhaler",
            "ellipta",
            "forspiro",
            "genuair",
            "handihaler",
            "nexthaler",
            "aerosphere",
            "respimat",
            "spiromax",
            "turbuhaler",
            "twisthaler"
          ]
        },
        options: [
          { key: "yes_5", label: "Ano, dech by se měl zadržet po dobu alespoň 5 sekund." },
          { key: "no", label: "Ne, lze okamžitě dýchat normálně, nemá to vliv." },
          { key: "depends", label: "Záleží na typu inhalátoru." },
          { key: "unknown", label: "Nevím." }
        ]
      }
    ]
  },
  {
    id: "education_preferences",
    title: "Edukace v oblasti inhalační techniky",
    questions: [
      {
        key: "sr_q16_prior_training_sufficient",
        label: "16. Svoje proškolení ohledně správného zacházení s inhalátorem/inhalátory před vstupem do probíhající studie (např. u lékaře při kontrole, v lékárně při výdeji) považuji za dostatečné.",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        options: secondRoundAgreementOptions
      },
      {
        key: "sr_q17_preferred_training_form",
        label: "17. Jakou formu proškolení ohledně správného zacházení s inhalátorem/inhalátory preferujete?",
        helpText: "Vyberte 1 nebo více možností.",
        type: "multi_choice_nested",
        options: [
          {
            key: "self_study",
            label: "Samostudium.",
            nestedMultiChoice: {
              key: "self_study_formats",
              options: [
                { key: "educational_leaflets", label: "Tištěné materiály." },
                { key: "videos", label: "Vzdělávací videa." },
                { key: "elearning", label: "E-learning kombinující výukový text a předvedení správné inhalační techniky." },
                { key: "interactive_app", label: "Interaktivní mobilní/webová aplikace s předvedením správné inhalační techniky." }
              ]
            }
          },
          {
            key: "healthcare_worker",
            label: "Proškolení prováděné zdravotníkem.",
            nestedMultiChoice: {
              key: "healthcare_worker_formats",
              options: [
                { key: "practical_training", label: "Praktický nácvik správné inhalační techniky při návštěvě ambulance/výdeji inhalačního léčivého přípravku v lékárně." },
                { key: "online_demo", label: "Předvedení správné inhalační techniky (bez nácviku) osobně nebo s využitím videohovoru (např. WhatsApp, Skype, Teams)." }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "sociodemographic",
    title: "Sociodemografická data",
    questions: [
      {
        key: "sr_q18_lives_alone",
        label: "18. V současnosti žijete sám/sama?",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        options: [
          { key: "yes", label: "Ano." },
          { key: "no", label: "Ne." }
        ]
      },
      {
        key: "sr_q19_smoking",
        label: "19. Kouříte?",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        options: [
          { key: "daily", label: "Ano, kouřím každý den. (kuřák)" },
          { key: "occasional", label: "Ano, kouřím příležitostně, ale ne každý den. (příležitostný kuřák)" },
          { key: "former", label: "Ne, přestal jsem kouřit. (bývalý kuřák)", allowsFreeText: true, freeTextLabel: "Jak dlouho abstinujete?" },
          { key: "never", label: "Ne, nikdy jsem nevykouřil víc než 100 cigaret. (nekuřák)" }
        ]
      },
      {
        key: "sr_q20_smoking_types",
        label: "20. Uveďte způsob kouření:",
        helpText: "Vyberte 1 nebo více možností.",
        type: "multi_choice",
        visibleWhen: {
          questionKey: "sr_q19_smoking",
          operator: "in",
          value: ["daily", "occasional", "former"]
        },
        options: [
          { key: "classic_cigarette", label: "Klasická cigareta" },
          { key: "heated_tobacco", label: "Zahřívaný tabák (např. IQOS)" },
          { key: "ecigarette", label: "Elektronická cigareta s liquidem (např. Elf Bar)" },
          { key: "pipe", label: "Dýmka" },
          { key: "cigar", label: "Doutník" },
          { key: "marijuana", label: "Marihuana" },
          { key: "other", label: "Jiné:", allowsFreeText: true, freeTextLabel: "Uveďte" }
        ]
      },
      {
        key: "sr_q21_passive_smoking",
        label: "21. Jste pravidelně vystavován/a pasivnímu kouření (např. doma, v práci)?",
        helpText: "Vyberte 1 možnost.",
        type: "single_choice",
        options: [
          { key: "yes", label: "Ano, jsem pasivní kuřák." },
          { key: "no", label: "Ne." },
          { key: "unknown", label: "Nevím." }
        ]
      },
      {
        key: "sr_q22_passive_smoking_types",
        label: "22. Uveďte způsob kouření:",
        helpText: "Vyberte 1 nebo více možností.",
        type: "multi_choice",
        visibleWhen: {
          questionKey: "sr_q21_passive_smoking",
          operator: "equals",
          value: "yes"
        },
        options: [
          { key: "classic_cigarette", label: "Klasická cigareta" },
          { key: "heated_tobacco", label: "Zahřívaný tabák (např. IQOS)" },
          { key: "ecigarette", label: "Elektronická cigareta s liquidem (např. Elf Bar)" },
          { key: "pipe", label: "Dýmka" },
          { key: "cigar", label: "Doutník" },
          { key: "marijuana", label: "Marihuana" },
          { key: "other", label: "Jiné:", allowsFreeText: true, freeTextLabel: "Uveďte" }
        ]
      }
    ]
  }
];

const roundFormDefinitions = [
  {
    key: "inhalacni-technika",
    order: 1,
    title: "Dotazník o inhalační technice",
    description: "Podrobný formulář k práci s inhalátory.",
    buildSections: (_roundLabel, roundKey) =>
      roundKey === "kolo2"
        ? removeQuestionFromSections(cloneSections(secondRoundInhalationSections), "evaluation_number")
        : removeQuestionFromSections(cloneSections(legacyQuestionnaires[0].sections), "evaluation_number")
  },
  {
    key: "vitalograf",
    order: 2,
    title: "Vitalograf",
    description: "Nácvik inhalační techniky s Vitalografem AIM.",
    buildSections: (roundLabel) => [
      {
        id: "vitalograph",
        title: `${roundLabel} · Nácvik inhalační techniky s Vitalografem AIM`,
        questions: [
          {
            key: "vitalograph_inhaler_types",
            label: "Typ inhalátoru",
            helpText: "Vyberte 1 nebo více možností.",
            type: "multi_choice",
            required: true,
            options: [
              { key: "pmdi", label: "pMDI" },
              { key: "dpi", label: "DPI" }
            ]
          },
          {
            key: "vitalograph_pmdi_assessment",
            label: "pMDI",
            type: "vitalograph_assessment",
            visibleWhen: {
              questionKey: "vitalograph_inhaler_types",
              operator: "contains",
              value: "pmdi"
            },
            columns: [
              {
                key: "before",
                label: "Před edukací",
                statusOptions: [
                  { key: "filled", label: "Vyplněno" },
                  { key: "unfilled", label: "Nevyplněno" }
                ]
              },
              {
                key: "after",
                label: "Po edukaci",
                statusOptions: [
                  { key: "filled", label: "Vyplněno" },
                  { key: "unfilled", label: "Nevyplněno" },
                  { key: "not_needed", label: "Netřeba" }
                ]
              }
            ],
            metrics: vitalographMetricSets.pmdi
          },
          {
            key: "vitalograph_dpi_assessment",
            label: "DPI",
            type: "vitalograph_assessment",
            visibleWhen: {
              questionKey: "vitalograph_inhaler_types",
              operator: "contains",
              value: "dpi"
            },
            columns: [
              {
                key: "before",
                label: "Před edukací",
                statusOptions: [
                  { key: "filled", label: "Vyplněno" },
                  { key: "unfilled", label: "Nevyplněno" }
                ]
              },
              {
                key: "after",
                label: "Po edukaci",
                statusOptions: [
                  { key: "filled", label: "Vyplněno" },
                  { key: "unfilled", label: "Nevyplněno" },
                  { key: "not_needed", label: "Netřeba" }
                ]
              }
            ],
            metrics: vitalographMetricSets.dpi
          }
        ]
      }
    ]
  },
  {
    key: "fsi-1",
    order: 3,
    title: "FSI",
    description: "Dotazník pocitu spokojenosti s inhalátorem FSI-10.",
    allowPatientUnfilled: true,
    buildSections: (roundLabel) => [
      {
        id: "fsi_1",
        title: `${roundLabel} · FSI 1`,
        questions: [
          {
            key: "fsi10",
            label: "Dotazník pocitu spokojenosti s inhalátorem FSI-10",
            helpText:
              "Jak byste na základě následujících otázek ohodnotil/a inhalační systém, který jste v posledním týdnu používal/a? Vyberte pouze 1 možnost, která nejvíce odpovídá Vašemu názoru. Neexistují žádné správné nebo špatné odpovědi - pouze nás zajímá Váš názor na určité vlastnosti inhalátoru. Prosím, odpovídejte na otázky upřímně a žádnou nevynechejte. Kolonku Vámi vybrané odpovědi označte křížkem.",
            type: "fixed_matrix_single",
            required: true,
            options: fsi10Options,
            rows: fsi10Rows
          }
        ]
      }
    ]
  },
  {
    key: "fsi-2",
    order: 4,
    title: "FSI",
    description: "Dotazník pocitu spokojenosti s inhalátorem FSI-10.",
    allowPatientUnfilled: true,
    buildSections: (roundLabel) => [
      {
        id: "fsi_2",
        title: `${roundLabel} · FSI 2`,
        questions: [
          {
            key: "fsi10",
            label: "Dotazník pocitu spokojenosti s inhalátorem FSI-10",
            helpText:
              "Jak byste na základě následujících otázek ohodnotil/a inhalační systém, který jste v posledním týdnu používal/a? Vyberte pouze 1 možnost, která nejvíce odpovídá Vašemu názoru. Neexistují žádné správné nebo špatné odpovědi - pouze nás zajímá Váš názor na určité vlastnosti inhalátoru. Prosím, odpovídejte na otázky upřímně a žádnou nevynechejte. Kolonku Vámi vybrané odpovědi označte křížkem.",
            type: "fixed_matrix_single",
            required: true,
            options: fsi10Options,
            rows: fsi10Rows
          }
        ]
      }
    ]
  },
  {
    key: "fsi-3",
    order: 5,
    title: "FSI",
    description: "Dotazník pocitu spokojenosti s inhalátorem FSI-10.",
    allowPatientUnfilled: true,
    buildSections: (roundLabel) => [
      {
        id: "fsi_3",
        title: `${roundLabel} · FSI 3`,
        questions: [
          {
            key: "fsi10",
            label: "Dotazník pocitu spokojenosti s inhalátorem FSI-10",
            helpText:
              "Jak byste na základě následujících otázek ohodnotil/a inhalační systém, který jste v posledním týdnu používal/a? Vyberte pouze 1 možnost, která nejvíce odpovídá Vašemu názoru. Neexistují žádné správné nebo špatné odpovědi - pouze nás zajímá Váš názor na určité vlastnosti inhalátoru. Prosím, odpovídejte na otázky upřímně a žádnou nevynechejte. Kolonku Vámi vybrané odpovědi označte křížkem.",
            type: "fixed_matrix_single",
            required: true,
            options: fsi10Options,
            rows: fsi10Rows
          }
        ]
      }
    ]
  },
  {
    key: "mars-a",
    order: 6,
    title: "MARS",
    description: "Užívání inhalačních léků.",
    allowPatientUnfilled: true,
    buildSections: (roundLabel) => [
      {
        id: "marsa",
        title: `${roundLabel} · Užívání inhalačních léků`,
        questions: [
          {
            key: "mars_cz",
            label: "Způsob, jakým užíváte inhalační léky",
            helpText:
              "Mnoho lidí má svůj způsob, jakým léky užívá a který jim vyhovuje. Tento způsob může být odlišný od pokynů, které jsou uvedeny u léčivého přípravku, nebo od těch, které mají od svého lékaře nebo lékárníka. Rádi bychom se Vás zeptali, jak léky užíváte Vy. Nabízíme Vám odpovědi již dotázaných pacientů. Pro každou otázku prosím zaškrtněte okénko, které nejvíc vystihuje způsob, jakým léky užíváte vy.",
            type: "fixed_matrix_single",
            required: true,
            options: [
              { key: "always", label: "Vždy" },
              { key: "often", label: "Často" },
              { key: "sometimes", label: "Někdy" },
              { key: "rarely", label: "Zřídka" },
              { key: "never", label: "Nikdy" }
            ],
            rows: [
              { key: "forget", label: "Zapomínám užívat inhalační léky." },
              { key: "adjust", label: "Upravuji si dávku." },
              { key: "stop_temporarily", label: "Na nějaký čas inhalační léky vysazuji." },
              { key: "skip", label: "Rozhodl/a jsem se vynechat dávku." },
              { key: "less_than_prescribed", label: "Užívám méně, než mám předepsáno." }
            ]
          }
        ]
      }
    ]
  },
  {
    key: "dalsi-formular",
    order: 7,
    title: "Hodnocení",
    description: "Výběr až tří inhalátorů a samostatné checklisty správného zacházení.",
    buildSections: (roundLabel) => [
      {
        id: "evaluation_selector",
        title: `${roundLabel} · Hodnocení`,
        questions: [
          {
            key: "selected_inhalers",
            label: "Vyberte inhalátor 1 až 3",
            helpText: "Zvolte inhalátor 1 a případně přidejte inhalátor 2 a 3. U každého vybraného typu pak otevřete jeho samostatné hodnocení.",
            type: "inhaler_selector",
            required: true,
            options: cloneSections(legacyQuestionnaires[0].sections)[0].questions[2].options
          },
          {
            key: "device_assessments",
            label: "Samostatná hodnocení inhalátorů",
            type: "inhaler_evaluation_bundle",
            sourceQuestionKey: "selected_inhalers",
            templates: inhalerEvaluationTemplates
          }
        ]
      }
    ]
  }
];

const roundQuestionnaires = roundDefinitions.flatMap((round) =>
  roundFormDefinitions.map((form) => ({
    code: `${round.key}-${form.key}`,
    version:
      form.key === "inhalacni-technika"
        ? round.key === "kolo2"
          ? "2026-01-05"
          : legacyQuestionnaires[0].version
        : "2026-06-14",
    title: form.title,
    description: `${round.label} · ${form.description}`,
    roundKey: round.key,
    roundLabel: round.label,
    roundOrder: round.order,
    formKey: form.key,
    formOrder: form.order,
    allowPatientUnfilled: Boolean(form.allowPatientUnfilled),
    sections: form.buildSections(round.label, round.key)
  }))
);

const UNFILLED_OPTION = { key: "nevyplneno", label: "Nevyplněno" };

const questionnairesWithUnfilled = [...roundQuestionnaires, ...legacyQuestionnaires.map((item) => ({
  ...item,
  isLegacy: true
}))].map((item) => normalizeQuestionnaire(item));

export const questionnaires = questionnairesWithUnfilled;

export function getQuestionnaireCatalog() {
  return questionnaires.map(({ code, version, title, description, sections, roundKey, roundLabel, roundOrder, formKey, formOrder, isLegacy }) => ({
    code,
    version,
    title,
    description,
    sectionCount: sections.length,
    roundKey: roundKey ?? null,
    roundLabel: roundLabel ?? null,
    roundOrder: roundOrder ?? null,
    formKey: formKey ?? null,
    formOrder: formOrder ?? null,
    isLegacy: Boolean(isLegacy)
  }));
}

export function getQuestionnaireByCode(code) {
  return questionnaires.find((item) => item.code === code) ?? null;
}

function cloneSections(sections) {
  return JSON.parse(JSON.stringify(sections));
}

function removeQuestionFromSections(sections, questionKey) {
  return sections.map((section) => ({
    ...section,
    questions: (section.questions ?? []).filter((question) => question.key !== questionKey)
  }));
}

function normalizeQuestionnaire(questionnaire) {
  const normalized = {
    ...questionnaire,
    sections: questionnaire.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => normalizeQuestion(question, questionnaire.code))
    }))
  };

  return normalized;
}

function normalizeQuestion(question, questionnaireCode) {
  const normalized = { ...question };

  delete normalized.required;

  if (
    (normalized.type === "single_choice" || normalized.type === "multi_choice") &&
    normalized.key !== "evaluation_number" &&
    normalized.key !== "vitalograph_inhaler_types"
  ) {
    normalized.options = appendUnfilledOption(normalized.options);
  }

  if (normalized.type === "repeatable_matrix_single") {
    normalized.options = appendUnfilledOption(normalized.options);
  }

  if (normalized.type === "multi_choice_nested") {
    normalized.options = appendUnfilledToNestedOptions(normalized.options);
  }

  return normalized;
}

function appendUnfilledToNestedOptions(options = []) {
  const normalizedOptions = options.map((option) => {
    const normalizedOption = { ...option };

    if (normalizedOption.nestedSingleChoice) {
      normalizedOption.nestedSingleChoice = {
        ...normalizedOption.nestedSingleChoice,
        options: normalizedOption.nestedSingleChoice.options.map((nestedOption) => ({ ...nestedOption }))
      };
    }

    if (normalizedOption.nestedMultiChoice) {
      normalizedOption.nestedMultiChoice = {
        ...normalizedOption.nestedMultiChoice,
        options: normalizedOption.nestedMultiChoice.options.map((nestedOption) => ({ ...nestedOption }))
      };
    }

    return normalizedOption;
  });

  return appendUnfilledOption(normalizedOptions);
}

function appendUnfilledOption(options = []) {
  if (options.some((option) => String(option.key) === "0" || String(option.key) === UNFILLED_OPTION.key)) {
    return options.map((option) => ({ ...option }));
  }

  return [...options.map((option) => ({ ...option })), { ...UNFILLED_OPTION }];
}
