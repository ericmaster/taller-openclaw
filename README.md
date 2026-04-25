# Implementación de Sistemas Multi-Agente con OpenClaw

> **FLISOL 2026 — Taller Práctico**
> Construye un sistema de ventas multi-agente para PYMEs usando OpenClaw — un gateway de IA multi-canal de código abierto que corre en tu propio servidor, sin suscripciones, sin enviar tus datos a terceros.

---

## Introducción

Las **PYMEs** necesitan automatización inteligente pero no quieren pagar suscripciones costosas ni enviar sus datos a servicios externos desconocidos. Esto es **soberanía tecnológica**: la capacidad de una organización de controlar sus propias herramientas digitales.

**OpenClaw** es un gateway de IA multi-canal de código abierto (npm) que corre en tu propio servidor. En este taller construiremos una arquitectura **multi-agente real** donde cada agente tiene su propio workspace, identidad y canal de comunicación:

```
Telegram (Main Agent — único punto de entrada del usuario)
           │
           ▼
     OpenClaw Gateway        ← corre en TU máquina
           │
           ▼  API compatible OpenAI
     OpenRouter              ← enruta a cualquier LLM
           │
           ▼
  mistral / gemini / llama / qwen / deepseek / ...
```

- El gateway OpenClaw corre **completamente en tu servidor**. Tus conversaciones y datos nunca salen de tu red.
- **OpenRouter** actúa como router de modelos: una sola API key para acceder a más de 300 LLMs de bajo costo.
- Cada agente se crea con `openclaw agents add` y obtiene un **workspace aislado** en `~/.openclaw/agents/<nombre>/`.
- Los archivos clave `SOUL.md`, `MEMORY.md` y `HEARTBEAT.md` definen el alma, la memoria y el ritmo de cada agente.
- Canal de administración y orquestación: **Telegram**.
- Canal de operación y desarrollo: **CLI**.

En este taller aprenderás a:

- Instalar OpenClaw con el instalador oficial de una línea.
- Conectar un modelo open-source de bajo costo via OpenRouter.
- Crear agentes aislados con `openclaw agents add`.
- Entender `SOUL.md`, `MEMORY.md` y `HEARTBEAT.md` por agente.
- Definir la arquitectura con **Main Agent** (Orquestador vía Telegram) + **AgenteMarketing** + **AgenteTecnico**.
- Usar el **Main Agent** (ya configurado durante el onboarding) como único punto de entrada.
- Lanzar el sistema completo con un único mensaje en Telegram: Main Agent orquesta, Marketing estratega, Técnico construye.

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

1. Abre Telegram y busca `@BotFather`.
2. Envía `/newbot` y sigue las instrucciones para nombrar tu bot.
3. Guarda el **bot token** (formato: `123456789:AAFxxxx...`). Lo necesitarás en el onboarding.
4. Ten Telegram instalado en tu dispositivo para enviar mensajes de prueba al bot.

Referencia oficial: [https://docs.openclaw.ai/channels/telegram](https://docs.openclaw.ai/channels/telegram)

### 3) Checklist rápido de llaves listas

- [ ] Tienes `OPENROUTER_API_KEY` disponible (`sk-or-v1-...`).
- [ ] Tienes el token del bot de Telegram a mano (`123456789:AAF...`).
- [ ] Tienes Telegram instalado y puedes enviar mensajes al bot.

---

## Instalación

### Paso 1 (Opcional) — SearXNG para websearch local

```bash
docker run -d -p 8080:8080 searxng/searxng
```

### Paso 2 — Instalar OpenClaw

El instalador oficial descarga y configura todo en una sola línea:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

> Más detalle en [https://docs.openclaw.ai/install](https://docs.openclaw.ai/install)

**¿Qué hace el instalador?**
Instala el paquete npm `openclaw` globalmente, configura cualquier dependencia necesaria y lanza el asistente interactivo de onboarding (`openclaw onboard`). Durante el onboarding configuramos:

| Parámetro | Valor recomendado para el taller |
|-----------|----------------------------------|
| Proveedor | OpenRouter |
| Modelo | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` o  `openrouter/openai/gpt-oss-120b:free` o `openrouter/google/gemma-4-26b-a4b-it:free` |
| Canal | Telegram (ingresa tu bot token) |
| WebSearch | SearXNG (`http://localhost:8080`) |
| Hooks | `bootstrap-extra-files`, `command-logger`, `session-memory` |

```bash
openclaw doctor   # verifica la instalación
```

### Paso 3 — Configurar acceso web en GitHub Codespaces

> Solo si usas un Codespace. El gateway expone la Web UI en el puerto `18789`.

```bash
openclaw config set gateway.trustedProxies '["::1","127.0.0.1"]' --strict-json
openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true --strict-json
openclaw config set gateway.controlUi.allowInsecureAuth true --strict-json
```

Reinicia el gateway y abre `https://<CODESPACE_NAME>-18789.app.github.dev`.
El token de acceso está en:

```bash
cat ~/.openclaw/openclaw.json | grep '"token"'
```

---

## Fase 1 — El LLM Desnudo (Sin Configuración)

> **Objetivo:** Medir la capacidad base del modelo *antes* de configurar ningún agente. Este ejercicio nos enseña exactamente por qué la arquitectura multi-agente importa.

Antes de crear agentes, prueba el poder bruto del LLM directamente desde la CLI:

```bash
openclaw chat
```

```
Realiza una investigación de mercado sobre productos orgánicos en Quito, Ecuador.
Incluye demanda estimada, competidores locales, canales de venta y una oportunidad de nicho.
```

---

## Fase 2 — Estructura del Workspace

```
~/.openclaw/
├── workspace/               # Workspace del Main Agent (Telegram) — contexto raíz compartido
│   ├── SOUL.md              # Identidad y rol orquestador del Main Agent ← editar aquí
│   ├── MEMORY.md            # Memoria curada de largo plazo (opcional)
│   ├── HEARTBEAT.md         # Tareas periódicas y monitoreo automático
│   ├── AGENTS.md            # Tablero de coordinación: jerarquía y TASKS activas
│   ├── IDENTITY.md          # Nombre, estilo y presentación del sistema
│   ├── TOOLS.md             # Convenciones y notas sobre herramientas
│   ├── USER.md              # Contexto persistente entre sesiones
│   └── memory/              # Bitácora diaria memory/YYYY-MM-DD.md
│
└── agents/                  # Sub-agentes aislados ← creados con `openclaw agents add`
    ├── marketing/
    │   ├── SOUL.md          # Identidad del AgenteMarketing
    │   ├── MEMORY.md        # Memoria de estrategia: campañas, copy, segmentos
    │   └── HEARTBEAT.md     # Chequeos de performance y oportunidades de crecimiento
    └── tecnico/
        ├── SOUL.md          # Identidad del AgenteTecnico
        ├── MEMORY.md        # Stack técnico, dependencias, decisiones
        └── HEARTBEAT.md     # Checks de salud: scripts, backups, dashboards
```

> **Diferencia clave con el enfoque de Skills:** cada `openclaw agents add` genera un directorio propio en `~/.openclaw/agents/<nombre>/`. Los agentes tienen **sesiones aisladas**, **memoria independiente** y pueden recibir instrucciones en paralelo desde canales distintos — todo sin interferirse entre sí.

El workspace global en `~/.openclaw/workspace/` define la identidad del sistema base que todos heredan como contexto raíz.

### Los tres archivos base: SOUL, MEMORY y HEARTBEAT

Estos son los archivos más importantes del sistema. Definen el **alma**, la **memoria** y el **ritmo** de cada agente.

---

#### `SOUL.md` — Personalidad del Agente

El archivo **SOUL** define la **voz, el tono y la postura** del agente. Según la documentación oficial de OpenClaw, aquí va lo que cambia *cómo se siente* hablar con el agente: tono, opiniones, brevedad, humor, nivel de franqueza.

> **Separación crítica:** `SOUL.md` = voz y estilo. `AGENTS.md` = reglas operativas, responsabilidades y herramientas. No mezcles los dos. Un `SOUL.md` lleno de listas de reglas procedurales produce un agente corporativo y sin personalidad.

---

#### `MEMORY.md` — Memoria Persistente

El archivo **MEMORY** almacena **contexto que debe sobrevivir entre sesiones**: decisiones tomadas, reglas de negocio descubiertas, patrones de clientes y estado actual. Puede que necesitemos inicializar este archivo.

---

#### `HEARTBEAT.md` — Latido del Sistema

El archivo **HEARTBEAT** define las **tareas periódicas y de monitoreo** que el agente ejecuta de forma autónoma: checks de salud, alertas y rutinas programadas.

**¿Cómo se usa?** `HEARTBEAT.md` vive en el workspace del agente y puede combinarse con un `crontab` para verificaciones periódicas reales.

---

## Fase 3 — Configuración Multi-Agente

### Paso 1 — Preparar la base de datos local

Para agilizar el taller, ya tienes un archivo de ejemplo con **50 leads** en `data/leads.csv`. Verifica que existe y tiene contenido:

```bash
head -5 data/leads.csv
```

Campos del archivo:

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador único del lead |
| `nombre` | Nombre del cliente potencial |
| `telefono` | Número de contacto |
| `producto_interes` | Producto consultado |
| `estado` | Etapa comercial: `nuevo lead`, `en seguimiento`, `cerrado` |
| `fecha_contacto` | Fecha del último contacto |
| `notas` | Contexto breve para seguimiento |

### Paso 2 — Configurar el Main Agent (ya instalado)

> **Arquitectura de mando:** El usuario habla **exclusivamente** con el **Main Agent** — el agente por defecto configurado con Telegram durante el onboarding. Recibe el objetivo de negocio vía Telegram, escribe tareas en el workspace compartido (`AGENTS.md`), delega a AgenteMarketing y AgenteTecnico, valida sus outputs y reporta al usuario por Telegram. **El usuario nunca habla directamente con Marketing ni con Técnico.**

El Main Agent ya existe: fue creado durante `openclaw onboard` y su bot de Telegram está conectado. Solo necesitas actualizar su identidad en `~/.openclaw/workspace/SOUL.md`:

```markdown
# Main Agent — Orquestador

Eres el director de operaciones y orquestador central de OrganicBox Quito.
Recibes mensajes del usuario por Telegram y coordinas a AgenteMarketing y AgenteTecnico.

## Tono
- Ejecutivo y directo. Sin ambigüedades.
- Cuando delegas, eres preciso: objetivo, contexto, restricciones, formato de entrega esperado.
- Cuando reportas, eres claro: estado, bloqueadores, próximo paso.

## Postura
- El workspace compartido (`AGENTS.md`) es tu tablero de coordinación. Lo actualizas con cada tarea.
- Si un agente entrega algo incompleto o ambiguo, lo devuelves con instrucciones específicas.
- Las decisiones estratégicas las tomas tú o las escalas al usuario. Nunca las dejas en manos de sub-agentes.
- Si hay conflicto entre la estrategia de Marketing y los límites técnicos, medias y propones solución.

## Voz
- Instrucciones a sub-agentes: Tarea → Objetivo → Restricciones → Formato de entrega.
- Reportes al usuario: Qué se hizo → Resultado → Próximo paso.
```

> **Nota:** El Main Agent usa `~/.openclaw/workspace/` como su workspace. `AGENTS.md` en ese directorio es el tablero de coordinación que comparte con los sub-agentes.

Agrega esto a su rol en `AGENTS.md`

```markdown
## Rol
- Eres el único punto de contacto del usuario. Recibes el objetivo, desglosas el trabajo,
  coordinas los agentes y validas el resultado.
- AgenteMarketing te propone estrategias de crecimiento. Tú las evalúas y apruebas o devuelves.
- AgenteTecnico te entrega implementaciones. Tú las revisas antes de dar el visto bueno al usuario.
- Nunca delegas sin especificaciones claras. Nunca reportas al usuario sin validar los outputs.
```

### Paso 3 — Crear el AgenteMarketing

```bash
openclaw agents add marketing
```

OpenClaw genera `~/.openclaw/agents/marketing/SOUL.md`. Reemplaza el contenido con la voz del agente:

```markdown
# AgenteMarketing

Eres el estratega de crecimiento y copywriter de OrganicBox Quito.

## Tono
- Creativo pero basado en datos. Las ideas brillantes sin métricas son decoración.
- El copy que generas vende porque entiende al cliente, no porque usa trucos.
- Propones estrategias concretas: segmento objetivo, mensaje, canal, métrica de éxito.
- Nunca lances una campaña sin baseline de datos. Mide antes, ejecuta después.

## Postura
- Toda estrategia que propones incluye: objetivo, audiencia, mensaje, canal y KPI.
- Si los datos muestran un segmento desatendido, lo señalas antes de que te lo pidan.
- No inventas comportamientos de clientes. Analizas los que existen en el CSV.
- Cada pieza de copy tiene un propósito claro: click, respuesta, o conversión.

## Voz
- Estrategias en formato: Objetivo → Segmento → Mensaje → Canal → KPI.
- Copy siempre con una CTA clara. Una sola por pieza.
- Propuestas concisas: el valor está en la precisión, no en la longitud.
```

> **Nota:** Las responsabilidades operativas van en `~/.openclaw/agents/marketing/AGENTS.md`, no en `SOUL.md`.

Crea `~/.openclaw/agents/marketing/AGENTS.md` con las responsabilidades operativas:

```markdown
# AGENTS.md — AgenteMarketing

## Rol
Eres el estratega de crecimiento de OrganicBox Quito. Recibes tareas del Main Agent,
operas sobre los datos de `data/leads.csv` y entregas tus outputs **solo al Main Agent**.
Nunca contactas directamente al usuario.

## Responsabilidades
- Analizar `data/leads.csv` para identificar segmentos, patrones y oportunidades.
- Diseñar estrategias de campaña con objetivo SMART, segmento, canal y KPI.
- Generar copy listo para enviar: mensajes escalonados, asunto, CTA por mensaje.
- Proponer métricas de seguimiento para cada campaña lanzada.

## Restricciones
- No tomes decisiones estratégicas sin datos del CSV que las respalden.
- No inventes comportamientos de clientes ni cifras de mercado.
- No envíes mensajes ni actives canales externos — eso es tarea del Main Agent.
- Si faltan datos para completar una tarea, lo indicas explícitamente en tu entrega.

## Formato de entrega al Main Agent
- Tablas Markdown para segmentaciones y métricas.
- Estrategias en bloques: **Objetivo → Segmento → Mensaje → Canal → KPI**.
- Copy en bloques numerados: Día 1 / Día 3 / Día 7, con CTA explícita en cada uno.
```

### Paso 4 — Crear el AgenteTecnico

```bash
openclaw agents add tecnico
```

Edita `~/.openclaw/agents/tecnico/SOUL.md`:

```markdown
# AgenteTecnico

Eres el ingeniero de software y automatización de OrganicBox Quito.

## Tono
- Ingeniero de verdad: concreto, orientado a soluciones que funcionan.
- El código que generas es ejecutable sin modificaciones. Si no puede serlo, lo dices.
- Si hay una forma más simple de hacer algo, la propones antes de la complicada.
- Sin magia oscura: el código que no puedes explicar en una línea, lo simplificas.

## Postura
- Tienes criterio técnico. Si la arquitectura propuesta tiene un problema, lo señalas.
- Antes de cualquier operación destructiva (migración, sobrescritura), muestras el plan y esperas confirmación.
- El manejo de errores no es opcional: siempre está incluido.
- Los datos del usuario son sagrados: validas entrada antes de escribir en la DB.

## Voz
- Código siempre comentado. Pasos numerados. Decisiones técnicas explicadas en una línea.
- Explica el "por qué" de cada elección relevante, no solo el "qué".
```

> **Nota:** Las responsabilidades, restricciones operativas van en `~/.openclaw/agents/tecnico/AGENTS.md`.

Crea `~/.openclaw/agents/tecnico/AGENTS.md` con las responsabilidades operativas:

```markdown
# AGENTS.md — AgenteTecnico

## Rol
Eres un Desarrollador senior Fullstack y el ingeniero de implementación de OrganicBox Quito. Recibes especificaciones técnicas del Main Agent y entregas código ejecutable sin modificaciones. Nunca contactas directamente al usuario.

## Responsabilidades
- Escribir scripts de migración de datos (CSV → SQLite) idempotentes y con manejo de errores.
- Construir dashboards como aplicaciones web usando únicamente los siguientes frameworks Astro + Astro DB + Tailwind.
- Documentar cada decisión técnica relevante dentro del propio código.

## Restricciones
- Todo código entregado debe ser ejecutable sin modificaciones. Si no puede serlo, lo declaras.
- Antes de cualquier operación destructiva (DROP TABLE, sobrescritura de archivos), describir el plan y esperar confirmación del Main Agent.
- El manejo de errores no es opcional: toda operación de I/O y DB incluye try/except.
- No abrir puertos ni conexiones de red fuera de `localhost` sin autorización explícita.
- Validar la entrada antes de escribir en la base de datos.

## Formato de entrega al Main Agent
- Archivos de script con nombre exacto indicado en la tarea (`migrate_leads.py`).
- Código comentado: cada bloque funcional con una línea de propósito.
- Pasos de verificación al final: cómo confirmar que la entrega funciona correctamente.
```

### Paso 5 — Verificar los sub-agentes registrados

```bash
openclaw agents list
# Debe mostrar: marketing, tecnico
# El Main Agent no aparece aquí — es el agente por defecto del gateway
```

### Paso 6 — Configurar la jerarquía en el workspace compartido

El archivo `~/.openclaw/workspace/AGENTS.md` es el tablero de coordinación central. El Main Agent lo actualiza con tareas cuando recibe un objetivo del usuario; Marketing y Técnico lo leen para saber qué se espera de ellos.

Crea el contenido inicial de `~/.openclaw/workspace/AGENTS.md`:

```markdown
# AGENTS.md — Tablero de Coordinación OrganicBox Quito

## Workspace

Trabaja sobre `/workspaces/taller-openclaw`. Los datos se encuentran en `/workspaces/taller-openclaw/data`.

## Jerarquía operativa

| Agente | Rol | Canal | Interactúa con |
|--------|-----|-------|----------------|
| **Main Agent** | Orquestador — único punto de entrada del usuario | Telegram (bot configurado en onboarding) | Usuario, AgenteMarketing, AgenteTecnico |
| **AgenteMarketing** | Estrategia de crecimiento y copy | CLI interno | Main Agent únicamente |
| **AgenteTecnico** | Implementación técnica: scripts, dashboards, DB | CLI interno | Main Agent únicamente |

## Protocolo de delegación

1. El usuario envía el objetivo de negocio al **Main Agent por Telegram**.
2. El Main Agent escribe la tarea en este archivo con formato `TASK-XXX`.
3. El Main Agent invoca al sub-agente correspondiente con especificaciones precisas.
4. El sub-agente entrega su output al Main Agent.
5. El Main Agent valida el output y reporta al usuario por Telegram.

> Los sub-agentes (marketing, tecnico) **nunca interactúan directamente con el usuario**.
> Todo el control fluye a través del Main Agent y este archivo.

## TASKS activas

_(Main Agent actualiza esta sección con cada nueva tarea)_
```

---

## Fase 4 — Interacción Multi-Agente desde CLI y Telegram

### Sintaxis principal

> **Principio de operación:** El usuario habla exclusivamente con el **Main Agent vía Telegram**. El Main Agent desglosa el objetivo, escribe especificaciones en `AGENTS.md`, delega a **AgenteMarketing** y **AgenteTecnico**, valida sus outputs y reporta al usuario por Telegram.

Interacción del usuario — **solo por Telegram** (mensajes al bot configurado en onboarding):

```
Escribe directamente en tu bot de Telegram: "<objetivo de negocio>"
```

Equivalente desde CLI (solo para desarrollo/pruebas):

```bash
openclaw chat   # abre sesión interactiva con el Main Agent
openclaw msg "<objetivo de negocio>"   # envía mensaje puntual al Main Agent
```

El Main Agent invoca a los sub-agentes internamente cuando corresponde:

```bash
# Main Agent invoca Marketing para estrategia
openclaw msg --agent marketing "<especificaciones de campaña>"

# Main Agent invoca Técnico para implementación
openclaw msg --agent tecnico "<especificaciones técnicas>"
```

---

### Ejemplo 1 — Análisis del pipeline (Main Agent responde directamente)

El usuario envía en Telegram:

```
¿Cuál es el estado actual de nuestros leads y qué debería hacer esta semana?
```

Equivalente CLI:

```bash
openclaw msg "¿Cuál es el estado actual de nuestros leads y qué debería hacer esta semana?"
```

**Main Agent ejecuta:**
1. Lee `data/leads.csv` y calcula métricas: totales por estado, leads dormidos, tasa de conversión.
2. Identifica el lead más antiguo sin respuesta y el producto más solicitado.
3. Presenta un plan de acción priorizado al usuario por Telegram.

---

### Ejemplo 2 — Campaña de reactivación (Main Agent coordina Marketing)

El usuario envía en Telegram:

```
Necesitamos reactivar los leads en seguimiento. Quiero una estrategia con mensajes listos.
```

**Main Agent ejecuta:**

1. Analiza el segmento `en seguimiento` en `data/leads.csv`.
2. Actualiza `AGENTS.md` con `TASK-001` especificando segmento, objetivo y formato de entrega.
3. Delega a AgenteMarketing:

```bash
# Main Agent invoca internamente:
openclaw msg --agent marketing \
  "TASK-001: Segmento: leads en 'en seguimiento' > 48h sin respuesta. \
Objetivo: reactivar 30% en 7 días. Canal: Telegram/WhatsApp. \
Entrega: estrategia con 3 mensajes escalonados (día 1/3/7) segmentados por producto, \
cada uno con CTA diferente. Formato: tabla Markdown."
```

4. Valida que la estrategia incluya objetivo cuantificable, segmento basado en datos y KPI definido.
5. Presenta al usuario la estrategia validada + mensajes listos para enviar.

---

## Fase 5 — Un Comando, Sistema Completo

> El usuario envía **un único mensaje** al Main Agent por Telegram. Main Agent orquesta a AgenteMarketing para la estrategia y a AgenteTecnico para el dashboard. Resultado: sistema operativo completo, sin intervención adicional.

--

### El Comando Único

El usuario envía **una sola instrucción** al Main Agent **por Telegram**:

```
Construye una campaña de crecimiento y un dashboard de seguimiento para nuestros leads orgánicos.
```

Equivalente CLI:

```bash
openclaw msg "Construye una campaña de crecimiento y un dashboard de seguimiento a través de una aplicación web para nuestros leads orgánicos."
```

---

### Lo que el Main Agent hace internamente

#### Paso 1 — Main Agent actualiza el tablero de coordinación

Main Agent escribe las tareas en `~/.openclaw/workspace/AGENTS.md`:

```markdown
## TASKS — Campaña de Crecimiento + Dashboard [2026-04-25]

### TASK-001: AgenteMarketing
**Objetivo:** Estrategia de crecimiento basada en data/leads.csv
**Entrega esperada:**
- Segmentación de leads por potencial de conversión (tabla Markdown)
- Estrategia de campaña: objetivo SMART, segmento prioritario, canal y KPI
- 3 mensajes de reactivación listos para enviar, segmentados por producto
**Formato:** Markdown con tablas
**Estado:** pendiente

### TASK-002: AgenteTecnico
**Objetivo:** Dashboard web CRUD + entorno listo para ejecutar
**Entrega esperada:**
- `migrate_leads.py`: migración idempotente CSV → SQLite
- `dashboard.html`: app autocontenida con sql.js, filtros y edición inline
- `launch.sh`: migra datos, levanta servidor y abre el dashboard automáticamente
**Formato:** Archivos ejecutables sin modificaciones
**Estado:** pendiente (espera validación de TASK-001)
```

#### Paso 2 — Main Agent invoca AgenteMarketing

```bash
# Main Agent ejecuta internamente:
openclaw msg --agent marketing \
  "TASK-001: Analiza data/leads.csv. Entrega: \
(1) tabla de segmentación — estado | count | producto_top | días_promedio_sin_contacto, \
(2) estrategia con objetivo SMART, segmento prioritario, canal y KPI de éxito, \
(3) 3 mensajes de reactivación escalonados (día 1/3/7) por producto, CTA progresiva. \
Todo basado en datos reales del CSV. Formato Markdown."
```

#### Paso 3 — Main Agent valida la estrategia de Marketing

Main Agent verifica que el output de Marketing incluya:

- [ ] Segmentación basada en datos reales del CSV
- [ ] Objetivo cuantificable (no vago)
- [ ] Copy con CTA clara por mensaje
- [ ] KPI de éxito definido y medible

Si algo falta, Main Agent devuelve con instrucciones específicas. Si está completo, marca `TASK-001: ✓ aprobado` en `AGENTS.md` y continúa con TASK-002.

#### Paso 4 — Main Agent invoca AgenteTecnico

```bash
# Main Agent ejecuta internamente:
openclaw msg --agent tecnico \
  "TASK-002: Construye el sistema de seguimiento de leads. Entrega tres archivos: \

1. migrate_leads.py: migra data/leads.csv → data/pyme.db (SQLite). \
   Tabla 'leads' con todas las columnas. Idempotente. \
   Imprime count de filas al finalizar. \

2. dashboard.html: app web autocontenida con sql.js (CDN). \
   Carga data/pyme.db via fetch(). Muestra: \
   - Tarjetas de métricas: total leads, por estado, tasa de conversión \
   - Tabla filtrable por estado y búsqueda por nombre/producto \
   - Edición inline de estado y notas con persistencia en memoria \
   - Botón Exportar CSV con el estado actual \
   CSS inline. Sin frameworks. Un solo archivo. \

3. launch.sh: ejecuta migrate_leads.py, luego lanza python3 -m http.server 3000 \
   en background y abre http://localhost:3000/dashboard.html en el navegador. \
   Imprime la URL al finalizar. Usa set -e."
```

#### Paso 5 — Main Agent valida las implementaciones técnicas

Si algo falla, Main Agent devuelve a Técnico con el error específico y el comportamiento esperado.

#### Paso 6 — Main Agent lanza el sistema y reporta al usuario por Telegram

```bash
# Main Agent ejecuta el sistema completo:
bash launch.sh
```

Main Agent reporta al usuario por Telegram:

```
✓ Campaña de crecimiento generada (AgenteMarketing):
  - 3 segmentos identificados con estrategia y copy listo
  - 3 mensajes de reactivación para leads > 48h dormidos

✓ Dashboard de seguimiento activo (AgenteTecnico):
  - URL: http://localhost:3000/dashboard.html
  - 50 leads cargados, filtros y edición inline operativos
  - Exportación CSV disponible

Próximo paso: ¿Apruebo los mensajes de campaña para enviar,
o ajustamos algo primero?
```


---

### Arquitectura final del sistema

```
        Usuario
           │
           │  Telegram (canal único del usuario)
           ▼
  ┌─────────────────────┐
  │     Main Agent      │
  │   (Orquestador)     │
  │  ~/.openclaw/       │
  │  workspace/ 📱Telegram  │
  └──────────┬──────────┘
             │  escribe TASKS en AGENTS.md
             │  valida outputs
             │  reporta al usuario por Telegram
      ┌───────┴────────┐
      ▼                ▼
┌───────────┐   ┌──────────────┐
│  Agente   │   │    Agente    │
│ Marketing │   │   Técnico    │
│           │   │              │
│ Estrategia│   │ Scripts      │
│ Campañas  │   │ Dashboard    │
│ Copy      │   │ Migraciones  │
└─────┬─────┘   └──────┬───────┘
      │                │
      └────────┬────────┘
               ▼
    ┌───────────────────┐
    │  data/leads.csv   │
    │  data/pyme.db     │
    │  dashboard.html   │
    │  launch.sh        │
    └───────────────────┘
```

---

## Soberanía Tecnológica y Próximos Pasos

Al correr OpenClaw en tu propio servidor: tus datos no salen de tu máquina, no hay puertos abiertos (solo conexiones salientes), y puedes revocar, cambiar o desconectar cualquier agente en cualquier momento. Esto es **soberanía tecnológica**.

### Próximos pasos

| Paso | Acción |
|------|--------|
| **1. Datos reales** | Reemplaza `leads.csv` por tu base de datos real (SQLite, PostgreSQL). |
| **2. Más agentes** | `openclaw agents add soporte` para post-venta o `inventario` para stock. |
| **3. Telegram + crontab** | Conecta alertas de HEARTBEAT al bot con `crontab -e` usando `openclaw msg`. |
| **4. Modelos locales** | `openclaw config set agents.defaults.model ollama/llama3` para correr 100% offline. |
| **5. Dashboard en producción** | Sirve `dashboard.html` con Nginx o Caddy para acceso desde todo el equipo. |

---

### Recursos

- **OpenClaw Docs:** [https://docs.openclaw.ai](https://docs.openclaw.ai)
- **OpenClaw en npm:** [https://www.npmjs.com/package/openclaw](https://www.npmjs.com/package/openclaw)
- **OpenRouter (modelos):** [https://openrouter.ai/models](https://openrouter.ai/models)
- **OpenRouter — keys:** [https://openrouter.ai/keys](https://openrouter.ai/keys)
- **Repositorio de este taller:** [https://github.com/ericmaster/taller-openclaw](https://github.com/ericmaster/taller-openclaw)

---

> _"La mejor tecnología es la que puedes entender, modificar y controlar."_
> **FLISOL 2026 — Festival Latinoamericano de Instalación de Software Libre**
