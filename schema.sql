PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  login_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_portal_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_account_id INTEGER NOT NULL,
  session_token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_account_id) REFERENCES doctor_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  noveid TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questionnaire_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  questionnaire_code TEXT NOT NULL,
  questionnaire_title TEXT NOT NULL,
  questionnaire_version TEXT NOT NULL,
  round_key TEXT,
  round_label TEXT,
  round_order INTEGER,
  form_key TEXT,
  form_order INTEGER,
  inhaler_slot INTEGER,
  evaluation_slot TEXT,
  filled_by_user_id INTEGER,
  filled_by_doctor_account_id INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  answers_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (filled_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (filled_by_doctor_account_id) REFERENCES doctor_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patient_round_inhalers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  round_key TEXT NOT NULL,
  inhaler_slot INTEGER NOT NULL CHECK (inhaler_slot BETWEEN 1 AND 3),
  inhaler_code TEXT NOT NULL,
  source_submission_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (patient_id, round_key, inhaler_slot),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (source_submission_id) REFERENCES questionnaire_submissions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_doctor_accounts_login_id ON doctor_accounts(login_id);
CREATE INDEX IF NOT EXISTS idx_doctor_portal_sessions_doctor_account_id ON doctor_portal_sessions(doctor_account_id);
CREATE INDEX IF NOT EXISTS idx_doctor_portal_sessions_expires_at ON doctor_portal_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_patients_noveid ON patients(noveid);

CREATE INDEX IF NOT EXISTS idx_submissions_patient_id ON questionnaire_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON questionnaire_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_questionnaire_code ON questionnaire_submissions(questionnaire_code);
CREATE INDEX IF NOT EXISTS idx_submissions_updated_at ON questionnaire_submissions(updated_at);
CREATE INDEX IF NOT EXISTS idx_submissions_filled_by_user_id ON questionnaire_submissions(filled_by_user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_filled_by_doctor_account_id ON questionnaire_submissions(filled_by_doctor_account_id);
CREATE INDEX IF NOT EXISTS idx_submissions_round_form ON questionnaire_submissions(round_key, form_key);
CREATE INDEX IF NOT EXISTS idx_submissions_eval_slot ON questionnaire_submissions(patient_id, round_key, form_key, evaluation_slot);

CREATE INDEX IF NOT EXISTS idx_patient_round_inhalers_patient_round ON patient_round_inhalers(patient_id, round_key);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
