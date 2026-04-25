const Database = require('better-sqlite3');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, '../../data/leads.csv');
const dbPath = path.resolve(__dirname, '../.astro/content.db');

console.log('Conectando a la base de datos:', dbPath);
const db = new Database(dbPath);

// Leer CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  cast: (value, context) => {
    if (context.column === 'id') return parseInt(value, 10);
    // fecha_contacto se guarda como texto YYYY-MM-DD
    return value;
  }
});

console.log(`Encontrados ${records.length} registros.`);

// Preparar inserción
const stmt = db.prepare(`
  INSERT OR IGNORE INTO Lead (id, nombre, telefono, producto_interes, estado, fecha_contacto, notas)
  VALUES (@id, @nombre, @telefono, @producto_interes, @estado, @fecha_contacto, @notas)
`);

let inserted = 0;
for (const record of records) {
  try {
    const result = stmt.run(record);
    if (result.changes > 0) inserted++;
  } catch (error) {
    console.error('Error insertando registro:', record.id, error.message);
  }
}

console.log(`Insertados ${inserted} nuevos leads.`);
db.close();