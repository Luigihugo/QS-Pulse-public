/**
 * Aplica a migration 008_feedback no banco Supabase.
 * Requer DATABASE_URL no .env.local (Connection string do Supabase: Settings > Database).
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL não encontrado. Adicione no .env.local a connection string do Supabase:"
    );
    console.error(
      "  Settings > Database > Connection string (URI) > copie e cole como DATABASE_URL=..."
    );
    process.exit(1);
  }

  const sqlPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "008_feedback.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Migration 008_feedback aplicada com sucesso.");
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      console.log("Tabelas de feedback já existem. Nada a fazer.");
    } else {
      console.error("Erro ao aplicar migration:", err.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();
