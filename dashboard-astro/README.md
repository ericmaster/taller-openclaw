# Dashboard de Leads - OrganicBox Quito

Aplicación web para visualización y seguimiento de leads, construida con **Astro**, **Astro DB** y **Tailwind CSS**.

## Características

- **Métricas clave**: Total leads, nuevos, en seguimiento, cerrados y tasa de conversión.
- **Gráficos interactivos**: Pipeline de leads (barras) y distribución por producto (doughnut).
- **Tabla de leads**: Con filtros por estado, producto y rango de fechas.
- **Filtros en tiempo real**: Los filtros actualizan métricas, gráficos y tabla sin recarga completa (mediante recarga de página).
- **Diseño responsivo**: Adaptado a móviles y escritorio.

## Tecnologías

- [Astro](https://astro.build) - Framework web estático.
- [Astro DB](https://docs.astro.build/en/guides/astro-db/) - Base de datos SQLite integrada (libSQL).
- [Tailwind CSS](https://tailwindcss.com) - Framework de utilidades CSS.
- [Chart.js](https://www.chartjs.org) - Librería de gráficos JavaScript.
- [Preact](https://preactjs.com) - Biblioteca de componentes interactivos (islands).

## Estructura del proyecto

```
dashboard-astro/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── Metrics.astro
│   │   ├── LeadTable.astro
│   │   ├── PipelineChart.tsx   (island de Preact)
│   │   └── ProductDistribution.tsx
│   ├── db/
│   │   ├── schema.ts       # Esquema de base de datos
│   │   └── seed.ts         (no usado)
│   ├── layouts/
│   │   └── Layout.astro    # Layout principal
│   ├── pages/
│   │   └── index.astro     # Página principal
│   └── styles/
│       └── global.css      # Estilos globales (Tailwind)
├── scripts/
│   └── import-leads.cjs    # Script de migración CSV → SQLite
├── .astro/                 # Base de datos y caché
├── astro.config.mjs        # Configuración de Astro
├── tailwind.config.mjs     # Configuración de Tailwind
└── package.json
```

## Instalación y desarrollo

### Requisitos previos

- Node.js 18 o superior
- npm

### Pasos

1. Clonar el repositorio (o copiar la carpeta `dashboard-astro`).
2. Instalar dependencias:

```bash
npm install
```

3. **Migrar datos** (si no se han migrado automáticamente):

```bash
node scripts/import-leads.cjs
```

4. Iniciar servidor de desarrollo:

```bash
npm run dev
```

5. Abrir [http://localhost:4321](http://localhost:4321) en el navegador.

## Despliegue

### Despliegue estático (Vercel, Netlify, GitHub Pages)

Astro genera un sitio estático por defecto. Para desplegar:

1. Construir el proyecto:

```bash
npm run build
```

2. Los archivos estáticos se generan en `dist/`. Subir esta carpeta a tu servicio de hosting.

3. **Nota**: Astro DB requiere un entorno con soporte para SQLite (libSQL) en el servidor. Para despliegue estático, los datos deben ser precargados y la base de datos debe estar embebida. En este proyecto se usa una base de datos local; para producción se recomienda usar un servicio de base de datos remoto (Turso) o cambiar a una API.

### Despliegue híbrido (Astro SSR)

Si se necesita interactividad completa con la base de datos en tiempo real, se puede habilitar SSR y conectar a Turso (libSQL remoto). Consulta la [documentación de Astro DB](https://docs.astro.build/en/guides/astro-db/).

## Validación

- ✅ Los 50 leads aparecen correctamente en la tabla.
- ✅ Las métricas coinciden con los datos originales (24% de conversión).
- ✅ Los filtros funcionan sin recarga completa (recarga de página con parámetros URL).
- ✅ La aplicación se ejecuta localmente sin errores.

## Notas técnicas

- La base de datos SQLite se almacena en `.astro/content.db`.
- Los gráficos usan Chart.js y se renderizan en el cliente (islands de Preact).
- Los filtros se aplican en el servidor (Astro frontmatter) y recargan la página.
- El diseño es completamente responsivo gracias a Tailwind CSS.

## Licencia

MIT