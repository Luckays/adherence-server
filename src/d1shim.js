export function createD1Database(db) {
  return {
    prepare(sql) {
      return new D1PreparedStatement(db, sql);
    }
  };
}

class D1PreparedStatement {
  constructor(db, sql, params = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }

  bind(...params) {
    return new D1PreparedStatement(this.db, this.sql, params);
  }

  async first() {
    const statement = this.db.prepare(this.sql);
    const row = statement.get(...this.params);
    return row ?? null;
  }

  async all() {
    const statement = this.db.prepare(this.sql);
    const results = statement.all(...this.params);
    return { results };
  }

  async run() {
    const statement = this.db.prepare(this.sql);
    const info = statement.run(...this.params);
    return {
      success: true,
      meta: {
        changes: Number(info.changes ?? 0),
        last_row_id: Number(info.lastInsertRowid ?? 0)
      }
    };
  }
}
