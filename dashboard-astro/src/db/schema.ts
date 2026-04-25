import { defineDb, defineTable, column } from 'astro:db';

export const Lead = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    nombre: column.text(),
    telefono: column.text(),
    producto_interes: column.text(),
    estado: column.text({ default: 'nuevo lead' }),
    fecha_contacto: column.date(),
    notas: column.text({ optional: true }),
  },
});

export default defineDb({
  tables: { Lead },
});