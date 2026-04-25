import { db, Lead } from 'astro:db';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export default async function() {
  // Ruta al CSV de leads
  const csvPath = resolve(process.cwd(), '../../data/leads.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'id') return parseInt(value, 10);
      if (context.column === 'fecha_contacto') return new Date(value);
      return value;
    }
  });

  console.log(`Migrando ${records.length} leads...`);
  
  // Insertar en la base de datos
  await db.insert(Lead).values(records);
  
  console.log('Migración completada.');
}