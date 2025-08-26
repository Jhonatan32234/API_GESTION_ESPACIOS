const fs = require("fs");
const path = require("path");
const AppDataSource = require("./ormconfig");

async function runProcedures() {
  try {
    console.log("➡ Migrando procedimientos...");

    const sqlPath = path.join(__dirname, "procedimientos.sql");
    const sqlFile = fs.readFileSync(sqlPath, "utf8");

    // Separar cada bloque de procedure
    const procedures = sqlFile
      .split(/END;/gi)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt + " END;");

    for (const proc of procedures) {
      console.log("➡ Ejecutando procedure...");
      const [drop, create] = proc.split(/CREATE PROCEDURE/i);

      if (drop && drop.toUpperCase().includes("DROP PROCEDURE")) {
        await AppDataSource.query(drop);
      }
      if (create) {
        await AppDataSource.query("CREATE PROCEDURE " + create);
      }
    }

    console.log("✅ Procedimientos migrados");
  } catch (err) {
    console.error("❌ Error migrando procedimientos:", err);
  }
}

module.exports = runProcedures;
