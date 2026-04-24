# Implementación de Sistemas Multi-Agente con OpenClaw

> **FLISOL 2026 — Taller Práctico**
> Construye un sistema de ventas multi-agente para PYMEs usando OpenClaw — un gateway de IA multi-canal de código abierto que corre en tu propio servidor, conectado a modelos de bajo costo vía OpenRouter.

---

## Introducción

Las **PYMEs** necesitan automatización inteligente pero no quieren pagar suscripciones costosas ni enviar sus datos a servicios externos desconocidos.

**OpenClaw** es un gateway de IA multi-canal de código abierto (npm) que corre en tu propio servidor. En este taller usaremos una arquitectura operativa simple por canal:

```
Telegram (admin) / WhatsApp (leads) / CLI (operación)
           │
           ▼
     OpenClaw Gateway        ← corre en TU máquina
           │
           ▼  API compatible OpenAI
     OpenRouter              ← enruta a cualquier LLM
           │
           ▼
  mistral / gemini / llama / qwen / ...
```

- El gateway OpenClaw corre **completamente en tu servidor**. Tus conversaciones no salen de tu red.
- **OpenRouter** actúa como router de modelos: una sola API key para acceder a decenas de LLMs de bajo costo.
- Los **Skills** son archivos `.md` que definen personalidad, memoria y comportamiento del agente.
- Los archivos clave `SOUL.md`, `MEMORY.md` y `HEARTBEAT.md` son el núcleo de la identidad del sistema.
- Canal de administración: **Telegram** (instrucciones como usuario administrador).
- Canal comercial: **WhatsApp** (captación, seguimiento y cierre de leads).

En este taller aprenderás a:

- Instalar OpenClaw con el instalador oficial de una línea.
- Conectar un modelo open-source de bajo costo via OpenRouter.
- Definir el ruteo de canales: admin por Telegram y leads por WhatsApp.
- Entender `SOUL.md`, `MEMORY.md` y `HEARTBEAT.md`.
- Definir Skills para cuatro agentes especializados: **Ventas**, **Admin**, **Técnico** y **Orquestador**.
- Incluir una landing page para redirigir prospectos a la conversación por WhatsApp.
- Ejecutar el sistema multi-agente completo desde la terminal.

---

## Preparación de Claves y Canales (Haz Esto Primero)

Antes de ejecutar el quickstart, deja listas todas las credenciales para no frenar el taller a mitad de camino.

### 1) OpenRouter — obtener API key

1. Crea una cuenta gratuita en [openrouter.ai/keys](https://openrouter.ai/keys).
2. Genera una nueva API key (formato: `sk-or-v1-xxxxxxxxxxxx`).
3. Si puedes, carga algunos créditos (desde $1 USD para el taller completo).

**¿Por qué OpenRouter?**
Una sola API key te da acceso a más de 300 modelos: `mistral`, `gemini-flash`, `llama`, `qwen`, `deepseek`, y más — la mayoría con costos de fracciones de centavo por request.

### 2) Telegram (admin) — crear bot y guardar token

1. Crea el bot en Telegram con `@BotFather`.
2. Guarda el bot token para usarlo en el onboarding de OpenClaw.
3. Ten Telegram instalado y listo para enviar un mensaje de prueba.

Referencia oficial: [https://docs.openclaw.ai/channels/telegram](https://docs.openclaw.ai/channels/telegram)

### 3) WhatsApp (leads) — preparar Cloud API

Para el taller, la opción recomendada es usar el número de prueba de Meta Cloud API. Así nadie bloquea su WhatsApp personal.

Plan recomendado para participantes:
1. Plan A: número de prueba de Cloud API (rápido, ideal para taller).
2. Plan B: número dedicado (SIM o eSIM) para pruebas más cercanas a producción.
3. Evitar durante el taller: migrar un número personal activo.

**A. Crear app y habilitar WhatsApp Cloud API**

1. Entra a Meta for Developers.
2. Crea una App.
3. Agrega el producto WhatsApp.
4. Ve al panel de WhatsApp Cloud API de la app.

**B. Usar número de prueba**

1. Activa el test setup de WhatsApp Cloud API.
2. Copia estos datos:
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - `WHATSAPP_ACCESS_TOKEN` (token temporal)
3. Registra en la lista de destinatarios permitidos los números de participantes que harán pruebas.

> **Nota:** el token temporal expira. Si expira durante el taller, genera uno nuevo y actualízalo.

Referencia oficial: [https://docs.openclaw.ai/channels/whatsapp](https://docs.openclaw.ai/channels/whatsapp)

### 4) Checklist rápido de llaves listas

- Tienes `OPENROUTER_API_KEY` disponible.
- Tienes el token del bot de Telegram a mano.
- Tienes `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` y `WHATSAPP_ACCESS_TOKEN`.
- Ya sabes qué canal se usa para cada flujo: admin por Telegram, leads por WhatsApp.

---

## Instalación

### Paso 1 — Pre-instalar Homebrew

Instala Homebrew antes de continuar con el resto del taller:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Verifica que quedó instalado:

```bash
brew --version
```

### Paso 2 — Instalar websearch con SearXNG

Ejecuta SearXNG en Docker para habilitar capacidades de búsqueda web local en tu entorno:

```bash
docker run -d -p 8888:8080 searxng/searxng
```

Verifica que el contenedor está corriendo:

```bash
docker ps
```

### Paso 3 — Instalar OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

> Más detalle en [https://docs.openclaw.ai/install](https://docs.openclaw.ai/install)

**¿Qué hace?**
Instala el paquete npm `openclaw` globalmente, instala y configura cualquier dependecia si hace falta, y lanza el asistente interactivo de onboarding (`openclaw onboard`) para configurar tu primer proveedor de IA y la conexión inicial de canales (incluyendo Telegram para administración).

Verifica la instalación:

```bash
openclaw --version
```

### Paso 4 — Configurar OpenRouter en OpenClaw (salta si ya lo configuraste en Quickstart)

Guarda la key que preparaste antes:

```bash
openclaw secrets set OPENROUTER_API_KEY sk-or-v1-TU_KEY_AQUI
```

Verifica que el secreto está guardado:

```bash
openclaw secrets list
# OPENROUTER_API_KEY  ✓ set
```

Selecciona el modelo predeterminado (recomendado para el taller — bajo costo, alta calidad):

```bash
openclaw setup
# Durante el setup, elige: openrouter/mistralai/mistral-small-3.2
```

O edita directamente el archivo de configuración:

```bash
openclaw config set agents.defaults.model "openrouter/mistralai/mistral-small-3.2"
```

**Modelos recomendados por costo/calidad:**

| Modelo | Ref en OpenClaw | Costo aprox. |
|--------|-----------------|---------------|
| Mistral Small 3.2 | `openrouter/mistralai/mistral-small-3.2` | ~$0.10/M tokens |
| Gemini 2.0 Flash | `openrouter/google/gemini-2.0-flash-001` | ~$0.10/M tokens |
| Qwen 3 235B (MoE) | `openrouter/qwen/qwen3-235b-a22b` | ~$0.14/M tokens |
| Llama 3.3 70B | `openrouter/meta-llama/llama-3.3-70b-instruct` | ~$0.13/M tokens |
| Auto (OpenRouter elige) | `openrouter/auto` | variable |

> **Tip:** Para el taller usaremos `openrouter/auto` si no sabes cuál elegir. OpenRouter seleccionará el mejor modelo disponible automáticamente.

### Paso 5 — Conectar canales (Telegram admin + WhatsApp leads)

En este taller la política es:
- **Telegram** para administración e instrucciones operativas.
- **WhatsApp** para conversación comercial, seguimiento y cierre de leads.

1. Ejecuta o reabre el wizard:

```bash
openclaw onboard
```

2. En la parte de canales, configura Telegram pegando el token del bot.
3. Configura WhatsApp pegando `PHONE_NUMBER_ID`, `BUSINESS_ACCOUNT_ID` y `ACCESS_TOKEN`.
4. Guarda y cierra el onboarding.

### Paso 6 — Validación rápida (antes de Fase 1)

- `openclaw --version` responde correctamente.
- `openclaw secrets list` muestra `OPENROUTER_API_KEY` como configurada.
- Telegram: el bot recibe al menos un mensaje de prueba del admin.
- WhatsApp: se validó envío y recepción usando número de prueba (Cloud API) o número dedicado de pruebas.

---

## Fase 1 — Vista Rápida del Poder (Sin Configuración)

> **Nivel 1:** el agente OpenClaw listo para usar, directo desde la terminal.

Antes de crear Skills ni tocar ningún archivo de configuración, comprueba lo que OpenClaw puede hacer de inmediato con el comando `run`:

### Prompt 1 — Investigación de mercado en Quito

```bash
openclaw run "Realiza una investigación de mercado sobre productos orgánicos en Quito, Ecuador. Incluye demanda estimada, principales competidores locales, canales de venta más usados y una oportunidad de nicho para una PYME nueva."
```

### Prompt 2 — Dashboard de negocio en Markdown

```bash
openclaw run "Genera un dashboard básico en formato Markdown para una pequeña empresa de alimentos. Incluye secciones para ventas del mes, gastos operativos, top 3 productos y próximas acciones recomendadas."
```

Observa la velocidad de respuesta y la calidad del resultado — todo procesado via OpenRouter con el modelo que configuraste. Esta es la capacidad base **sin ningún archivo de Skills personalizado**.

### Política de canales del taller (desde el inicio)

- El usuario administrador envía instrucciones operativas por **Telegram**.
- Los leads se atienden por **WhatsApp** (mensajes de seguimiento y cierre).
- La terminal/CLI se usa para pruebas, depuración y ejecución local de comandos.

---

## Fase 2 — Recorrido por el Workspace

Luego de la instalación, OpenClaw crea un directorio de configuración en `~/.openclaw/`. La estructura de tu **proyecto** del taller será:

```
mi-pyme/
├── skills/
│   ├── SOUL.md          # Identidad y personalidad central del agente
│   ├── MEMORY.md        # Contexto persistente entre sesiones
│   ├── HEARTBEAT.md     # Tareas periódicas y monitoreo automático
│   ├── ventas.md        # Skill: Agente de Ventas (Closer)
│   ├── admin.md         # Skill: Analista Administrativo
│   ├── tecnico.md       # Skill: Infraestructura y Dashboards
│   └── orquestador.md   # Skill: Coordinador central
└── data/
    ├── leads.csv        # Base de datos de leads (CSV inicial)
    └── pyme.db          # Base de datos SQLite (migración posterior)
```

OpenClaw busca los archivos `.md` de Skills en el directorio actual y en `~/.openclaw/skills/`. Al ejecutar `openclaw run --skill ventas`, carga `skills/ventas.md` como el system prompt del agente.

### Los tres archivos base: SOUL, MEMORY y HEARTBEAT

Estos son los archivos más importantes del sistema. Definen el **alma**, la **memoria** y el **ritmo** del agente.

---

#### `skills/SOUL.md` — Identidad del Agente

El archivo **SOUL** es la **identidad central** del agente: su nombre, propósito, valores, tono de comunicación y reglas de comportamiento. Es el equivalente al "system prompt" raíz que todos los agentes heredan.

```markdown
---
name: soul
description: Identidad central del sistema de agentes de la PYME
author: mi-pyme
version: 1.0.0
model: openrouter/mistralai/mistral-small-3.2
---

# Identidad del Sistema

Eres el sistema de inteligencia operativa de **OrganicBox Quito**, una PYME de
distribución de productos orgánicos en Ecuador.

## Propósito
Automatizar las operaciones comerciales, administrativas y técnicas de la empresa
para que el equipo humano se enfoque en lo que importa: crecer y servir bien.

## Valores
- **Honestidad**: nunca inventes datos. Si no tienes información, dilo.
- **Brevedad**: respuestas concretas y accionables, no paredes de texto.
- **Soberanía**: todos los datos quedan en los servidores de la empresa.

## Reglas
1. Responde siempre en español neutro y profesional.
2. Cuando registres un lead, confirma los datos antes de guardar.
3. Nunca compartas información de clientes en texto plano fuera del sistema.
```

**¿Cómo se usa?** Cuando ejecutas un agente, el contenido de `SOUL.md` se inyecta automáticamente como contexto base en cada prompt.

---

#### `skills/MEMORY.md` — Memoria Persistente

El archivo **MEMORY** almacena **contexto que debe sobrevivir entre sesiones**: decisiones tomadas, reglas de negocio descubiertas, patrones de clientes, recordatorios y estado actual del sistema.

```markdown
---
name: memory
description: Contexto persistente del negocio entre sesiones
author: mi-pyme
version: 1.0.0
---

# Memoria del Sistema

## Reglas de Negocio Activas
- Descuento del 10% para clientes con más de 3 compras confirmadas.
- Seguimiento máximo: 3 intentos antes de marcar lead como inactivo.
- Días de despacho: martes y viernes.

## Estado Actual
- Último reporte generado: 2026-04-24
- Leads activos: 12 (actualizar semanalmente)
- Producto más solicitado del mes: Pack Orgánico Familiar

## Decisiones Registradas
- 2026-04-20: Se migró la base de datos de CSV a SQLite (pyme.db).
- 2026-04-15: Se activó seguimiento automático para leads > 48h sin respuesta.

## Notas del Equipo
- Carlos (ventas): prefiere mensajes cortos en WhatsApp, máximo 3 líneas.
```

**¿Cómo se usa?** `MEMORY.md` es un skill personalizado que se incluye explícitamente en cada invocación con `--skill skills/MEMORY.md`. Su contenido se inyecta como contexto al inicio del prompt, evitando que el usuario re-explique el estado del negocio en cada sesión.

---

#### `skills/HEARTBEAT.md` — Latido del Sistema

El archivo **HEARTBEAT** define las **tareas periódicas y de monitoreo** que el agente ejecuta de forma autónoma: checks de salud, alertas, reportes automáticos y rutinas programadas.

```markdown
---
name: heartbeat
description: Tareas periódicas y monitoreo automático del sistema
author: mi-pyme
version: 1.0.0
---

# Heartbeat — Latido del Sistema

## Verificación de Salud (cada sesión)
Al iniciar, revisa:
1. ¿El archivo `data/leads.csv` o `data/pyme.db` existe y es legible?
2. ¿Hay leads con `fecha_contacto` mayor a 48h sin cambio de estado?
3. ¿El último reporte tiene más de 7 días? Si sí, notificar al usuario.

## Alertas Automáticas
- Si hay más de 5 leads nuevos sin asignar: avisar al AgenteVentas.
- Si el archivo de datos supera 500 registros: sugerir migración a SQLite.
- Si un script de backup lleva más de 3 días sin ejecutarse: recordar.

## Reporte Semanal (viernes)
Generar automáticamente:
- Resumen de leads nuevos, en seguimiento y cerrados
- Tasa de conversión de la semana
- Top 3 productos más consultados
```

**¿Cómo se usa?** `HEARTBEAT.md` es un skill personalizado con instrucciones condicionales. Al incluirlo con `--skill skills/HEARTBEAT.md`, el LLM interpreta y ejecuta las verificaciones descritas. No es un proceso del sistema operativo: las «tareas automáticas» son instrucciones que el modelo sigue cuando el skill está activo.

---

### Verificar la configuración de OpenRouter

```bash
openclaw secrets list
# OPENROUTER_API_KEY  ✓ set

openclaw doctor
# ✓ Node.js version OK
# ✓ Config file found
# ✓ OPENROUTER_API_KEY set
# ✓ Default model: openrouter/mistralai/mistral-small-3.2
```

---

> **Nota sobre arquitectura:** Este taller usa un **enfoque basado en skills** — un solo agente OpenClaw cargado con diferentes archivos `.md` como system prompt especializado. Es la forma más rápida de construir un sistema funcional en 45 minutos.
>
> La arquitectura multi-agente real de OpenClaw (`openclaw agents add ventas`, bindings, workspaces aislados por agente) requiere más configuración pero ofrece aislamiento completo de sesiones y credenciales por agente. Ver [docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent) para el paso siguiente.

---

## Fase 3 — Sistema de Ventas Multi-Agente (Paso a Paso)

### Paso 1 — Preparar la base de datos local

Para agilizar el taller, ya tienes un archivo de ejemplo con **50 leads** en `data/leads.csv`. Verifica que existe y tiene contenido.

Campos del archivo (resumen rápido):
- `id`: identificador único del lead.
- `nombre`: nombre del cliente potencial.
- `telefono`: número de contacto.
- `producto_interes`: producto consultado.
- `estado`: etapa comercial (`nuevo lead`, `en seguimiento`, `cerrado`).
- `fecha_contacto`: fecha del último contacto.
- `notas`: contexto breve para seguimiento.

### Paso 2 — Crear el Skill del Agente de Ventas

Crea `skills/ventas.md`:

```markdown
---
name: ventas
description: Agente closer de ventas y seguimiento de leads por WhatsApp
author: mi-pyme
version: 1.0.0
model: openrouter/mistralai/mistral-small-3.2
---

# AgenteVentas — Closer Comercial

Eres un asesor de ventas empático y persuasivo para OrganicBox Quito.

## Responsabilidades
- Registrar nuevos leads en el archivo de datos.
- Hacer seguimiento a clientes existentes según su estado.
- Redactar mensajes de WhatsApp efectivos para cerrar ventas.

## Reglas
- Siempre confirma los datos de un nuevo lead antes de registrarlos.
- Mensajes de WhatsApp: máximo 3 líneas, tono amigable, llamada a la acción clara.
- Si un lead lleva más de 48h sin respuesta, propón un mensaje de reactivación.
- Nunca inventes números de teléfono ni nombres de productos que no existan en los datos.
- Mantén la comunicación con leads exclusivamente en WhatsApp.

## Herramientas disponibles
- Leer y escribir en `data/leads.csv` o `data/pyme.db`
- Ejecutar queries SQL simples sobre la tabla `leads`
```

### Paso 3 — Crear el Skill del Agente Analista Administrativo

Crea `skills/admin.md`:

```markdown
---
name: admin
description: Analista de operaciones — reportes, métricas y dashboards ejecutivos
author: mi-pyme
version: 1.0.0
model: openrouter/mistralai/mistral-small-3.2
---

# AgenteAdmin — Analista Operativo

Eres un analista de operaciones para OrganicBox Quito.

## Responsabilidades
- Calcular métricas clave: tasa de conversión, ticket promedio, leads por estado.
- Generar reportes ejecutivos claros en formato Markdown o tabla.
- Identificar tendencias en los datos de ventas.
- Detectar oportunidades de mejora accionables.

## Reglas
- Basa tus análisis únicamente en los datos reales del archivo.
- Presenta siempre los resultados con contexto (¿es bueno o malo ese número?).
- Si los datos son insuficientes para una conclusión, dilo explícitamente.
- Un reporte ejecutivo debe tener: resumen, métricas, tendencia y recomendaciones.
- Todas las instrucciones y respuestas del AgenteAdmin se gestionan por Telegram.
```

### Paso 4 — Usar el Skill de Ventas desde la terminal

```bash
openclaw run --skill skills/ventas.md "Registra un nuevo lead: Pedro Lema, teléfono 0993456789, interesado en Caja Semanal Verduras. Llegó por recomendación de Ana Morales."
```

### Paso 5 — Usar el Skill Admin desde la terminal

```bash
openclaw run --skill skills/admin.md "Genera el reporte ejecutivo de esta semana con métricas clave, tendencia y 3 recomendaciones."
```

### Paso 6 — Verificar los Skills disponibles

```bash
ls skills/
# SOUL.md  MEMORY.md  HEARTBEAT.md  ventas.md  admin.md  tecnico.md  orquestador.md
```

---

## Fase 4 — Interacción con Cada Agente

Todos los agentes se invocan con `openclaw run --skill <archivo>` desde el directorio del proyecto:

### Prompts para el Agente de Ventas

**Registrar un nuevo lead:**

```bash
openclaw run --skill skills/ventas.md \
  "Registra: Nombre: Pedro Lema, Teléfono: 0993456789, Producto: Caja Semanal Verduras, Notas: Recomendación de Ana Morales."
```

**Redactar mensaje de seguimiento por WhatsApp:**

```bash
openclaw run --skill skills/ventas.md \
  "Redacta un mensaje de WhatsApp para Carlos Ruiz, quien pidió cotización de 'Caja Semanal Verduras' ayer. Debe ser cordial y motivarlo a confirmar hoy."
```

**Listar leads en seguimiento:**

```bash
openclaw run --skill skills/ventas.md \
  "Muéstrame todos los leads en estado 'en seguimiento' y sugiere una acción concreta para cada uno."
```

---

### Prompts para el Agente Analista Administrativo

**Analizar el rendimiento semanal:**

```bash
openclaw run --skill skills/admin.md \
  "Analiza los datos de leads de esta semana. Calcula: total de leads nuevos, tasa de conversión, producto más solicitado y lead más antiguo sin respuesta. Presenta en tabla Markdown."
```

**Generar reporte ejecutivo:**

```bash
openclaw run --skill skills/admin.md \
  "Genera un reporte ejecutivo en Markdown: resumen de ventas, métricas clave, análisis de tendencias y 3 recomendaciones para la próxima semana."
```

**Detectar oportunidades de venta cruzada:**

```bash
openclaw run --skill skills/admin.md \
  "Identifica qué clientes podrían estar interesados en productos adicionales y genera una lista priorizada con justificación."
```

---

## Fase 5 — Agente Técnico y Agente Orquestador

### Agente Técnico

El `AgenteTecnico` maneja infraestructura: scripts, migraciones de datos e implementación de dashboards.

Crea `skills/tecnico.md`:

```markdown
---
name: tecnico
description: Infraestructura técnica — scripts, migraciones, dashboards e integraciones
author: mi-pyme
version: 1.0.0
model: openrouter/mistralai/mistral-small-3.2
---

# AgenteTecnico — Ingeniero Interno

Eres un ingeniero de software especializado en automatización para PYMEs.

## Responsabilidades
- Escribir scripts funcionales en Python o Bash, listos para ejecutar.
- Migrar datos entre formatos: CSV → SQLite → JSON.
- Generar dashboards HTML autocontenidos (CSS inline) a partir de datos.
- Documentar cada proceso con pasos numerados y comentarios en el código.

## Reglas
- El código debe ser limpio, comentado y ejecutable sin modificaciones.
- Siempre incluye manejo de errores básico (try/except o set -e).
- Al generar HTML, usa solo CSS inline para que el archivo sea portable.
- Antes de sugerir una migración de datos, muestra el plan de pasos primero.

## Herramientas disponibles
- Leer/escribir archivos locales
- Ejecutar scripts Python y Bash
- Acceso a `data/leads.csv` y `data/pyme.db`
```

#### Prompts de ejemplo para el Agente Técnico

**Migrar leads de CSV a SQLite:**

```bash
openclaw run --skill skills/tecnico.md \
  "Genera un script Python que migre data/leads.csv a SQLite (data/pyme.db), tabla leads, conservando todas las columnas. Incluye manejo de errores."
```

**Implementar un dashboard HTML:**

```bash
openclaw run --skill skills/tecnico.md \
  "Con base en data/leads.csv, genera dashboard.html con tabla estilizada, contadores por estado y fecha de generación. CSS inline, autocontenido."
```

**Crear script de backup automático:**

```bash
openclaw run --skill skills/tecnico.md \
  "Escribe un script Bash que copie data/ a backups/YYYY-MM-DD/. Crear carpeta si no existe. Mostrar resumen de archivos copiados."
```

**Crear landing page con CTA a WhatsApp:**

```bash
openclaw run --skill skills/tecnico.md \
  "Genera landing.html para OrganicBox Quito con propuesta de valor, beneficios, testimonios y botón principal 'Hablar por WhatsApp' apuntando a https://wa.me/593999999999. Debe ser responsive y autocontenida."
```

---

### Agente Orquestador

El `AgenteOrquestador` es el **punto de entrada único**. Recibe tareas en lenguaje natural, las descompone y genera un plan de delegación explícito: para cada subtarea indica qué skill invocar y con qué prompt exacto. El usuario (o un script) ejecuta cada paso con `openclaw run --skill`.

Crea `skills/orquestador.md`:

```markdown
---
name: orquestador
description: Coordinador central — analiza, descompone y delega tareas al agente correcto
author: mi-pyme
version: 1.0.0
model: openrouter/mistralai/mistral-small-3.2
---

# AgenteOrquestador — Coordinador Central

Eres el coordinador del sistema multi-agente de OrganicBox Quito.

## Agentes disponibles
| Agente        | Skill     | Especialidad                                    |
|---------------|-----------|--------------------------------------------------|
| AgenteVentas  | ventas    | Leads por WhatsApp, seguimiento, cierre comercial |
| AgenteAdmin   | admin     | Reportes por Telegram, métricas, tendencias      |
| AgenteTecnico | tecnico   | Scripts, migraciones, dashboards, infraestructura|

## Proceso de delegación
1. Analiza la solicitud: ¿es comercial, analítica o técnica?
2. Si cubre varios tipos, divídela en subtareas ordenadas.
3. Para cada subtarea, indica: skill a usar + prompt exacto.
4. Consolida los resultados en una respuesta coherente.

## Reglas
- Nunca ejecutes tareas especializadas tú mismo: siempre delega explícitamente.
- Si la solicitud es ambigua, pide una aclaración antes de proceder.
- Siempre muestra el plan de delegación antes de ejecutar.
```

#### Cómo usar el Orquestador desde la terminal

El orquestador usa su propio skill (`skills/orquestador.md`) y tiene acceso al contenido de los demás skills como contexto. Simplemente describe la tarea completa:

#### Prompts de ejemplo para el Orquestador

**Tarea mixta — Captura, análisis y seguimiento:**

```bash
openclaw run --skill skills/orquestador.md \
  "Esta semana recibimos 5 leads nuevos por Instagram. Registrarlos, analizar cuáles tienen más potencial y redactar un WhatsApp personalizado para cada uno."
```

**Tarea mixta — Cierre de semana completo:**

```bash
openclaw run --skill skills/orquestador.md \
  "Genera el cierre de semana: reporte ejecutivo de ventas con métricas y dashboard HTML actualizado listo para compartir con el equipo."
```

**Tarea mixta — Captación web hacia WhatsApp:**

```bash
openclaw run --skill skills/orquestador.md \
  "Diseña e implementa una landing page para campaña de Instagram que capture interés y dirija cada lead a WhatsApp, luego define cómo medir conversiones semanales en el reporte de admin."
```

**Diagnóstico y migración de datos:**

```bash
openclaw run --skill skills/orquestador.md \
  "El archivo de leads tiene más de 200 registros y las consultas están lentas. Analiza el problema, migra a SQLite y documenta los cambios."
```

---

## Fase 6 — Landing Page para Captación a WhatsApp

En esta fase agregamos el canal web como entrada de leads, pero manteniendo WhatsApp como destino de conversación comercial.

### Objetivo

Construir una `landing.html` que:
- Presente la propuesta de valor de OrganicBox Quito.
- Explique beneficios concretos (precio, frescura, entregas).
- Incluya un CTA principal que abra WhatsApp (`https://wa.me/<numero>`).
- Permita medir resultados (clicks al CTA y leads convertidos por semana).

### Flujo recomendado

1. Tráfico (Instagram/Facebook/QR) llega a la landing.
2. El usuario hace clic en "Hablar por WhatsApp".
3. El AgenteVentas continúa el seguimiento y cierre en WhatsApp.
4. El AgenteAdmin reporta conversión landing → conversación → venta.

### Prompt sugerido para implementación técnica

```bash
openclaw run --skill skills/tecnico.md \
  "Crea una landing page responsive (landing.html) enfocada en conversión a WhatsApp para OrganicBox Quito. Incluye hero, beneficios, prueba social, FAQ corta y botón fijo de WhatsApp con URL wa.me. Entrega archivo autocontenido con CSS inline."
```

---

### Arquitectura final del sistema

```
                    ┌─────────────────────┐
 Admin (Telegram) ─►│  skill:orquestador  │  genera plan de delegación
                    └──────────┬──────────┘
                               │ delega
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │  skill:ventas  │  │  skill:admin   │  │ skill:tecnico  │
  │                │  │                │  │                │
  │ Leads, WhatsApp│  │ Reportes,      │  │ Scripts,       │
  │ Seguimiento    │  │ Métricas,      │  │ Dashboards,    │
  │ Cierre ventas  │  │ Dashboards MD  │  │ Migraciones    │
  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                               │
                    Landing web │ (CTA a WhatsApp)
                               ▼
                    ┌──────────▼──────────┐
                    │   data/leads.csv    │
                    │   data/pyme.db      │
                    │   skills/*.md       │
                    └─────────────────────┘
```

---

## Soberanía Tecnológica y Próximos Pasos

### ¿Por qué esto importa?

Al correr OpenClaw en tu propio servidor:

- **Tus datos nunca salen de tu máquina.** La conexión al LLM pasa por OpenRouter, pero tus conversaciones y datos de negocio se procesan localmente.
- **Sin open ports.** El agente solo hace conexiones salientes. Sin VPN, sin port forwarding.
- **Control total.** Puedes revocar acceso, cambiar el modelo de IA, o desconectar el agente en cualquier momento.
- **Sin suscripciones por uso.** El plan Personal es gratuito para siempre.

Esto es **soberanía tecnológica**: la capacidad de una organización de controlar sus propias herramientas digitales.

---

### Próximos pasos para tu PYME

| Paso | Acción |
|------|--------|
| **1. Datos reales** | Reemplaza el CSV por tu base de datos SQLite o PostgreSQL real. |
| **2. Más Skills** | Crea skills especializados: soporte al cliente, inventario, marketing. |
| **3. Telegram Admin Bot** | Conecta las instrucciones administrativas (reportes, comandos, alertas) a Telegram Bot API. |
| **4. Bot de WhatsApp** | Conecta el skill `ventas` con la API de WhatsApp Business vía webhook. |
| **5. Landing de Conversión** | Publica una landing con botón directo a WhatsApp y etiquetas UTM para medir campañas. |
| **6. Multi-agente real** | Usa `openclaw agents add ventas` para crear agentes aislados con workspace, sesiones y credenciales propias. Ver [docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent). |
| **7. Automatización** | Usa el skill `HEARTBEAT.md` junto a un cron job (`crontab`) para disparar verificaciones periódicas automáticamente. |
| **8. Modelos locales** | Usa `openclaw config set agents.defaults.model ollama/llama3` para correr 100% offline con Ollama. |
| **9. Skills marketplace** | Publica tus Skills en el directorio de la comunidad OpenClaw. |

---

### Recursos

- **OpenClaw Docs:** [https://docs.openclaw.ai](https://docs.openclaw.ai)
- **OpenClaw en npm:** [https://www.npmjs.com/package/openclaw](https://www.npmjs.com/package/openclaw)
- **OpenRouter (modelos):** [https://openrouter.ai](https://openrouter.ai)
- **OpenRouter — keys:** [https://openrouter.ai/keys](https://openrouter.ai/keys)
- **OpenRouter — modelos disponibles:** [https://openrouter.ai/models](https://openrouter.ai/models)
- **FLISOL 2026:** [https://flisol.info](https://flisol.info)
- **Repositorio de este taller:** [https://github.com/ericmaster/taller-openclaw](https://github.com/ericmaster/taller-openclaw)

---

> _"La mejor tecnología es la que puedes entender, modificar y controlar."_
> **FLISOL 2026 — Festival Latinoamericano de Instalación de Software Libre**
