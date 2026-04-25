# Implementación de Sistemas Multi-Agente con OpenClaw

> **FLISOL 2026 — Taller Práctico**
> Construye un sistema de ventas multi-agente para PYMEs usando OpenClaw — un gateway de IA multi-canal de código abierto que corre en tu propio servidor, sin suscripciones, sin enviar tus datos a terceros.

---

## Introducción

Las **PYMEs** necesitan automatización inteligente pero no quieren pagar suscripciones costosas ni enviar sus datos a servicios externos desconocidos. Esto es **soberanía tecnológica**: la capacidad de una organización de controlar sus propias herramientas digitales.

**OpenClaw** es un gateway de IA multi-canal de código abierto (npm) que corre en tu propio servidor. En este taller construiremos una arquitectura **multi-agente real** donde cada agente tiene su propio workspace, identidad y canal de comunicación:

```
Telegram (admin/orquestación)  /  CLI (operación local)
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
- Definir tres agentes especializados: **Ventas**, **Admin** y **Técnico**.
- Usar el agente Técnico para generar un dashboard web real desde `leads.csv`.
- Ejecutar el sistema multi-agente completo desde Telegram y la terminal.

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

### Paso 1 (Opcional, para websearch) — Instalar SearXNG con Docker

Ejecuta SearXNG en Docker para habilitar capacidades de búsqueda web local sin depender de APIs externas:

```bash
docker run -d -p 8080:8080 searxng/searxng
```

Verifica que el contenedor está corriendo:

```bash
docker ps
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

Una vez completado el onboarding, verifica la instalación:

```bash
openclaw doctor
```

### Paso 3 — Acceder a la interfaz web en GitHub Codespaces

> Si estás ejecutando este taller en un **GitHub Codespace**, el gateway ya expone la Web UI en el puerto `18789`. Sigue estos pasos para acceder desde el navegador.

#### 1. Hacer público el puerto (necesario una sola vez)

GitHub Codespaces asigna visibilidad **privada** a los puertos por defecto, lo que obliga a autenticarse con GitHub antes de llegar al login de OpenClaw. Para evitar esa doble autenticación:

```bash
gh codespace ports visibility 18789:public -c "$CODESPACE_NAME"
```

> El archivo `.devcontainer/devcontainer.json` ya incluye `"visibility": "public"` para que el puerto quede abierto automáticamente en futuros reinicios del Codespace sin ejecutar el comando.

#### 2. Configurar el gateway para Codespaces

> **El proxy inverso de GitHub Codespaces** reescribe el `Origin` a `https://localhost:18789`, reenvía conexiones desde `::1`, y no permite que el browser complete el flujo de *device pairing* estándar. Hay que ajustar tres parámetros en `openclaw.json`.

Edita `~/.openclaw/openclaw.json` y ajusta la sección `gateway` así:

```json
"gateway": {
  "mode": "local",
  "bind": "loopback",
  "trustedProxies": ["::1", "127.0.0.1"],
  "controlUi": {
    "allowInsecureAuth": true,
    "dangerouslyDisableDeviceAuth": true,
    "allowedOrigins": [
      "https://<codespace-name>-18789.app.github.dev",
      "https://localhost:18789",
      "http://localhost:18789"
    ]
  }
}
```

O aplícalo directo con tres comandos:

```bash
openclaw config set gateway.trustedProxies '["::1","127.0.0.1"]' --strict-json
openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true --strict-json
openclaw config set gateway.controlUi.allowInsecureAuth true --strict-json
```

Luego reinicia el gateway:

```bash
pkill -f openclaw-gateway; openclaw gateway --force --bind loopback
```

#### 2. Abrir la interfaz web

Reemplaza `<codespace-name>` con el valor de `$CODESPACE_NAME` en tu terminal:

```
https://<codespace-name>-18789.app.github.dev/chat?session=main
```

Por ejemplo, si `echo $CODESPACE_NAME` devuelve `silver-zebra-vwpjppp553w6gg`, la URL sería:

```
https://silver-zebra-vwpjppp553w6gg-18789.app.github.dev/chat?session=main
```

#### 3. Obtener el token de acceso

La Web UI pide un token de autenticación. Se encuentra en:

```bash
cat ~/.openclaw/openclaw.json | grep '"token"'
```

Copia el valor del campo `token` e ingrésalo cuando la interfaz lo solicite.

---

### Paso 4 (Opcional) — Reconfigurar OpenRouter

Si necesitas actualizar la API key después del onboarding:

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

Más información en la [documentación oficial de OpenRouter](https://docs.openclaw.ai/providers/openrouter)

---

## Fase 1 — El LLM Desnudo (Sin Configuración)

> **Objetivo:** Medir la capacidad base del modelo *antes* de configurar ningún agente. Este ejercicio nos enseña exactamente por qué la arquitectura multi-agente importa.

Antes de crear agentes, prueba el poder bruto del LLM directamente desde la CLI:

```bash
openclaw chat
```

### Prompt 1 — Investigación de mercado

```
Realiza una investigación de mercado sobre productos orgánicos en Quito, Ecuador. Incluye demanda estimada, principales competidores locales, canales de venta más usados y una oportunidad de nicho para una PYME nueva.
```

### Prompt 2 — Análisis de datos hipotético

```
Tengo 50 leads en CSV con campos: id, nombre, telefono, producto_interes, estado, fecha_contacto, notas. El estado puede ser "nuevo lead", "en seguimiento" o "cerrado". ¿Cuál sería la tasa de conversión esperada y qué métricas debo
monitorear para un negocio de distribución orgánica?
```

Obtuviste los resultados esperados?

---

## Fase 2 — Recorrido por el Workspace

Luego de la instalación, OpenClaw crea un directorio de configuración en `~/.openclaw/`. La estructura de tu **proyecto** del taller será:

```
~/.openclaw/
├── workspace/               # Workspace global compartido por todos los agentes
│   ├── SOUL.md              # Identidad y personalidad central del sistema
│   ├── MEMORY.md            # Memoria curada de largo plazo (opcional)
│   ├── HEARTBEAT.md         # Tareas periódicas y monitoreo automático
│   ├── AGENTS.md            # Instrucciones operativas y prioridades
│   ├── IDENTITY.md          # Nombre, estilo y presentación del sistema
│   ├── TOOLS.md             # Convenciones y notas sobre herramientas
│   ├── USER.md              # Contexto persistente entre sesiones
│   └── memory/              # Bitácora diaria memory/YYYY-MM-DD.md
│
└── agents/                  # Workspace aislado por agente ← NUEVO en multi-agente
    ├── ventas/
    │   ├── SOUL.md          # Identidad del AgenteVentas
    │   ├── MEMORY.md        # Memoria de ventas: leads, patrones, reglas
    │   └── HEARTBEAT.md     # Verificaciones periódicas de seguimiento
    ├── admin/
    │   ├── SOUL.md          # Identidad del AgenteAdmin
    │   ├── MEMORY.md        # Memoria de reportes: métricas, tendencias
    │   └── HEARTBEAT.md     # Alertas de KPIs y reportes automáticos
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

```markdown
# Sistema OrganicBox Quito

_No eres un chatbot. Te estás convirtiendo en alguien._

Eres el sistema de inteligencia operativa de OrganicBox Quito.

## Tono
- Directo. Sin rodeos, sin relleno.
- Profesional pero humano. Nada corporativo.
- Si la respuesta cabe en una oración, una oración es lo que das.
- Nunca abras con "Claro que sí", "Excelente pregunta" ni "Con gusto te ayudo". Ve al grano.

## Postura y Limites
- Tienes criterio propio. Si algo no tiene sentido, dilo antes de ejecutarlo.
- Si el usuario está a punto de cometer un error, adviértelo. Primero.
- No inventes datos. Si no sabes, di que no sabes.
- Los datos de la empresa son soberanos: nunca salen del sistema.

## Voz
- Español neutro, sin jerga regional ni tecnicismos innecesarios.
- Usa tablas y listas cuando clarifican. Usa prosa cuando fluye mejor.
- Sé el asistente con el que da gusto trabajar, no un manual de procedimientos.

## Continuidad
- Cada sesión, despiertas fresco. Estos archivos son tu memoria. Léelos. Actualízalos. Son cómo persistes. Si cambias este archivo, díselo al usuario.
```

---

#### `MEMORY.md` — Memoria Persistente

El archivo **MEMORY** almacena **contexto que debe sobrevivir entre sesiones**: decisiones tomadas, reglas de negocio descubiertas, patrones de clientes y estado actual.

---

#### `HEARTBEAT.md` — Latido del Sistema

El archivo **HEARTBEAT** define las **tareas periódicas y de monitoreo** que el agente ejecuta de forma autónoma: checks de salud, alertas y rutinas programadas.

**¿Cómo se usa?** `HEARTBEAT.md` vive en el workspace del agente y puede combinarse con un `crontab` para verificaciones periódicas reales.

---

## Fase 3 — Configuración Multi-Agente

> En esta fase dejamos de usar skills sueltos y creamos **agentes autónomos** con workspace, identidad y memoria propios. El comando central es `openclaw agents add`.

### El comando `openclaw agents add`

```bash
openclaw agents add <nombre> --soul "<descripción de identidad>"
```

Este comando:
1. Crea el directorio `~/.openclaw/agents/<nombre>/`.
2. Genera los archivos `SOUL.md`, `MEMORY.md` y `HEARTBEAT.md` pre-poblados.
3. Registra el agente en el índice central de OpenClaw.
4. El agente queda disponible para recibir mensajes vía CLI o Telegram.

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

### Paso 2 — Crear el AgenteVentas

```bash
openclaw agents add ventas \
  --soul "Eres AgenteVentas, un closer comercial empático para OrganicBox Quito. \
Tu especialidad es gestionar leads desde data/leads.csv, hacer seguimiento \
por Telegram y redactar mensajes de conversión efectivos. Nunca inventes datos. \
Confirma siempre antes de modificar un registro."
```

OpenClaw genera `~/.openclaw/agents/ventas/SOUL.md`. Reemplaza el contenido con la voz del agente:

```markdown
# AgenteVentas

Eres el closer comercial de OrganicBox Quito.

## Tono
- Empático, directo. Cero burocracia.
- Los mensajes de seguimiento son conversaciones, no formularios.
- Una llamada a la acción por mensaje. Una sola.
- Nunca abras con saludos corporativos. Entra al punto.

## Postura
- Antes de guardar cualquier dato, confírmalo con el usuario. Sin excepciones.
- Si un lead lleva más de 48h sin respuesta, lo mencionas sin que te lo pidan.
- No inventas teléfonos, productos ni nombres. Si no está en los datos, no existe.
- Si el cierre es inminente, lo ves antes que nadie y lo señalas.

## Voz
- Tres líneas máximo para mensajes a leads.
- Amigable, con calidez real, pero siempre con propósito claro.
```

> **Nota:** Las responsabilidades, reglas operativas y herramientas disponibles van en `~/.openclaw/agents/ventas/AGENTS.md`, no en `SOUL.md`.

### Paso 3 — Crear el AgenteAdmin

```bash
openclaw agents add admin \
  --soul "Eres AgenteAdmin, analista de operaciones para OrganicBox Quito. \
Tu trabajo es calcular KPIs, generar reportes ejecutivos en Markdown y detectar \
tendencias en datos de ventas. Basas tus análisis solo en datos reales. \
Recibes instrucciones por Telegram y entregas reportes claros y accionables."
```

Edita `~/.openclaw/agents/admin/SOUL.md`:

```markdown
# AgenteAdmin

Eres el analista de operaciones de OrganicBox Quito.

## Tono
- Analítico y preciso. Los números hablan; tú los contextualizas.
- No reportas datos: reportas lo que significan.
- Nunca presentes un número sin decir si es bueno, malo o esperado.
- Sin preambles corporativos. Directo al análisis.

## Postura
- Solo analizas lo que existe en los datos reales. Sin extrapolaciones vacías.
- Si los datos son insuficientes para una conclusión, lo dices explícitamente.
- Una recomendación sin acción concreta es decoración. Las tuyas son accionables.
- Si una métrica es preocupante, la señalas directamente, sin suavizarla.

## Voz
- Estructura fija en reportes: Resumen → Métricas → Tendencia → Recomendaciones.
- Markdown con tablas cuando los datos lo piden. Prosa cuando el contexto lo requiere.
```

> **Nota:** Las responsabilidades operativas y las herramientas van en `~/.openclaw/agents/admin/AGENTS.md`.

### Paso 4 — Crear el AgenteTecnico

```bash
openclaw agents add tecnico \
  --soul "Eres AgenteTecnico, ingeniero full-stack e infraestructura para OrganicBox Quito. \
Escribes scripts Python y Bash listos para ejecutar, migras datos entre formatos \
y construyes dashboards web interactivos. Tu código es limpio, comentado y funciona \
sin modificaciones adicionales."
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

> **Nota:** Las responsabilidades, restricciones operativas y herramientas van en `~/.openclaw/agents/tecnico/AGENTS.md`.

### Paso 5 — Verificar los agentes registrados

```bash
openclaw agents list
```

Deberías ver:

```
NAME      MODEL                                    STATUS   CHANNEL
ventas    openrouter/mistralai/mistral-small-3.2   active   cli
admin     openrouter/mistralai/mistral-small-3.2   active   telegram
tecnico   openrouter/mistralai/mistral-small-3.2   active   cli
```

---

## Fase 4 — Interacción Multi-Agente desde CLI y Telegram

### Sintaxis principal

Hablar con un agente específico:

```bash
openclaw chat --agent <nombre>
```

Enviar un mensaje puntual sin modo interactivo:

```bash
openclaw msg --agent <nombre> "<mensaje>"
```

---

### AgenteVentas — Gestión de leads

**Registrar un nuevo lead desde CLI:**

```bash
openclaw msg --agent ventas \
  "Registra un nuevo lead: Nombre: Valentina Ríos, Teléfono: 0994567890, \
Producto: Pack Orgánico Familiar, Notas: Llegó por recomendación de Ana Morales."
```

**Listar leads en seguimiento con acciones sugeridas:**

```bash
openclaw msg --agent ventas \
  "Muéstrame todos los leads en estado 'en seguimiento'. Para cada uno, \
sugiere una acción concreta basada en el tiempo sin respuesta."
```

**Redactar mensaje de seguimiento:**

```bash
openclaw msg --agent ventas \
  "Redacta un mensaje de seguimiento para Carlos Ruiz (id: 2). \
Pidió cotización de 'Caja Semanal Verduras' hace 2 días. \
Tono cordial. Máximo 3 líneas. Incluye una llamada a la acción."
```

**Actualizar el estado de un lead:**

```bash
openclaw msg --agent ventas \
  "Actualiza el lead id 5 (Luisa Vega): cambiar estado a 'cerrado', \
agregar nota 'Descuento del 10% aplicado, pago confirmado el 2026-04-25'."
```

---

### AgenteAdmin — Reportes y KPIs (desde Telegram)

El AgenteAdmin recibe instrucciones directamente en tu bot de Telegram. Abre el bot y envía:

**Analizar estado actual del pipeline:**

```
Analiza los datos de leads. Calcula: total por estado, tasa de conversión,
producto más solicitado y lead más antiguo sin cambio. Presenta en tabla Markdown.
```

**Reporte ejecutivo semanal:**

```
Genera el reporte ejecutivo de esta semana: resumen de ventas, métricas clave,
análisis de tendencias y 3 recomendaciones concretas para la próxima semana.
```

**Detectar oportunidades de venta cruzada:**

```
Con base en los datos de leads, identifica qué clientes podrían estar interesados
en productos adicionales. Lista priorizada con justificación basada en historial.
```

También puedes usar CLI directamente:

```bash
openclaw msg --agent admin \
  "Genera el reporte ejecutivo de esta semana con métricas clave y 3 recomendaciones."
```

---

### AgenteTecnico — Scripts, migraciones y operaciones técnicas

**Migrar leads de CSV a SQLite:**

```bash
openclaw msg --agent tecnico \
  "Genera un script Python que migre data/leads.csv a SQLite en data/pyme.db, \
tabla 'leads', conservando todas las columnas. Incluye verificación de existencia \
previa de la tabla y manejo de errores con try/except."
```

Ejecuta el script generado:

```bash
python migrate_leads.py
```

**Crear script de backup automático:**

```bash
openclaw msg --agent tecnico \
  "Escribe un script Bash que copie todo el directorio data/ a backups/YYYY-MM-DD/ \
usando la fecha actual. Crear la carpeta si no existe. Mostrar resumen de archivos \
copiados al finalizar. Usar set -e para salir en caso de error."
```

---

## Fase 5 — El Clímax: Dashboard Web con CRUD desde leads.csv

> **Objetivo:** El AgenteTecnico construye una aplicación web real — autocontenida, sin servidor, operativa desde el archivo — que lee `data/leads.csv`, lo migra a SQLite, y expone una interfaz con tabla, métricas y operaciones CRUD completas.

Esta es la demostración definitiva de soberanía tecnológica: **un dashboard de gestión comercial generado por IA, corriendo 100% en tu máquina, sin dependencias externas**.

### Paso 1 — Generar el dashboard con el AgenteTecnico

```bash
openclaw msg --agent tecnico \
  "Construye dashboard.html: una aplicación web autocontenida que use \
JavaScript vanilla para cargar data/leads.csv via fetch(), convertirlo \
a una tabla SQLite en memoria con sql.js (CDN), y mostrar: \
(1) contadores por estado con tarjetas de color, \
(2) tabla completa de leads con filtros por estado y búsqueda, \
(3) botones de edición inline para cambiar estado y agregar notas, \
(4) botón 'Exportar CSV' con el estado actual. \
CSS inline. Sin frameworks. Autocontenido en un solo archivo HTML."
```

### Paso 2 — Abrir el dashboard en el navegador

```bash
# Desde el directorio del proyecto:
python3 -m http.server 3000
```

Abre en tu navegador: `http://localhost:3000/dashboard.html`

### Paso 3 — Generar un reporte ejecutivo en HTML

```bash
openclaw msg --agent tecnico \
  "Lee data/leads.csv y genera reporte.html con: fecha de generación, \
total de leads, desglose por estado (tabla + porcentajes), \
producto más solicitado, lead más antiguo en seguimiento, \
y una recomendación de acción inmediata. CSS inline, autocontenido."
```

### Paso 4 — Script de backup automático

```bash
openclaw msg --agent tecnico \
  "Escribe backup.sh: copia data/ a backups/$(date +%Y-%m-%d)/, \
crea la carpeta si no existe, imprime resumen de archivos copiados \
y el tamaño total. Incluye set -e al inicio."
```

```bash
bash backup.sh
```

### Paso 5 — Verificar la arquitectura resultante

Al finalizar esta fase, el sistema completo tiene esta estructura:

```
proyecto-taller/
├── data/
│   ├── leads.csv          # Fuente de verdad original
│   └── pyme.db            # SQLite migrado por AgenteTecnico
├── dashboard.html         # Dashboard CRUD generado por IA
├── reporte.html           # Reporte ejecutivo generado por AgenteAdmin
├── migrate_leads.py       # Script de migración generado
└── backup.sh              # Script de backup generado

~/.openclaw/agents/
├── ventas/                # Workspace aislado del AgenteVentas
│   ├── SOUL.md
│   ├── MEMORY.md
│   └── HEARTBEAT.md
├── admin/                 # Workspace aislado del AgenteAdmin
│   ├── SOUL.md
│   ├── MEMORY.md
│   └── HEARTBEAT.md
└── tecnico/               # Workspace aislado del AgenteTecnico
    ├── SOUL.md
    ├── MEMORY.md
    └── HEARTBEAT.md
```

---

### Arquitectura final del sistema

```
 Telegram (Admin/Orquestación)
           │
           ▼
  ┌────────────────┐
  │  AgenteAdmin   │  ← recibe instrucciones por Telegram
  │  ~/.openclaw/  │    responde reportes por Telegram
  │  agents/admin/ │
  └────────────────┘

 CLI (Operación local)
           │
           ├──────────────────────────────┐
           ▼                              ▼
  ┌────────────────┐             ┌────────────────┐
  │  AgenteVentas  │             │  AgenteTecnico │
  │  agents/ventas/│             │  agents/tecnico│
  │                │             │                │
  │ Gestión leads  │             │ Scripts Python │
  │ leads.csv/db   │             │ Dashboard HTML │
  │ Seguimiento    │             │ Migraciones DB │
  └───────┬────────┘             └───────┬────────┘
          │                             │
          └─────────────┬───────────────┘
                        ▼
             ┌──────────────────┐
             │  data/leads.csv  │
             │  data/pyme.db    │
             │  dashboard.html  │
             └──────────────────┘
```

---

## Soberanía Tecnológica y Próximos Pasos

### ¿Por qué esto importa?

Al correr OpenClaw en tu propio servidor:

- **Tus datos nunca salen de tu máquina.** La conexión al LLM pasa por OpenRouter, pero tus conversaciones y datos de negocio se quedan en tu red.
- **Sin puertos abiertos.** El agente solo hace conexiones salientes. Sin VPN ni port forwarding.
- **Control total.** Puedes revocar acceso, cambiar el modelo, o desconectar cualquier agente en cualquier momento.
- **Sin suscripciones por uso.** El plan personal de OpenClaw es gratuito de forma permanente.

Esto es **soberanía tecnológica**: la capacidad de una organización de controlar, entender y modificar sus propias herramientas digitales.

---

### Próximos pasos para tu PYME

| Paso | Acción |
|------|--------|
| **1. Datos reales** | Reemplaza `leads.csv` por tu base de datos real (SQLite, PostgreSQL). |
| **2. Más agentes** | Añade `openclaw agents add soporte` para atención post-venta o `inventario` para stock. |
| **3. Telegram admin completo** | Conecta alertas automáticas de HEARTBEAT al bot de Telegram con `crontab`. |
| **4. Modelos locales** | Usa `openclaw config set agents.defaults.model ollama/llama3` para correr 100% offline. |
| **5. Dashboard en producción** | Sirve `dashboard.html` con Nginx o Caddy en tu mismo servidor para acceso desde el equipo. |
| **6. Bindings multi-canal** | Agrega WhatsApp al AgenteVentas cuando estés listo: `openclaw agents bind ventas --channel whatsapp`. |
| **7. Heartbeat automático** | Programa verificaciones periódicas con `crontab -e` usando `openclaw msg --agent admin`. |
| **8. Skills marketplace** | Publica los SOUL.md de tus agentes en el directorio de la comunidad OpenClaw. |

---

### Recursos

- **OpenClaw Docs:** [https://docs.openclaw.ai](https://docs.openclaw.ai)
- **OpenClaw en npm:** [https://www.npmjs.com/package/openclaw](https://www.npmjs.com/package/openclaw)
- **Multi-agent guide:** [https://docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent)
- **OpenRouter (modelos):** [https://openrouter.ai](https://openrouter.ai)
- **OpenRouter — keys:** [https://openrouter.ai/keys](https://openrouter.ai/keys)
- **OpenRouter — modelos disponibles:** [https://openrouter.ai/models](https://openrouter.ai/models)
- **FLISOL 2026:** [https://flisol.info](https://flisol.info)
- **Repositorio de este taller:** [https://github.com/ericmaster/taller-openclaw](https://github.com/ericmaster/taller-openclaw)

---

> _"La mejor tecnología es la que puedes entender, modificar y controlar."_
> **FLISOL 2026 — Festival Latinoamericano de Instalación de Software Libre**
