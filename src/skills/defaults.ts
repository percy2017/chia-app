import { CHIA_MEMORY_DIR, CHIA_SKILLS_DIR, ensurePhoneDir, phoneExists } from '../chia/fs';
import { getToolsConfig } from '../settings/store';
import { writePhoneTextFile } from '../phone/files';
import { CLEANYOURTV } from './cleanyourtv';
import { IMPECCABLE_FILES, IMPECCABLE_SKILL } from './impeccable';

const SKILL_CREATOR = `---
name: skill-creator
description: Crea skills nuevas, edita o mejora las existentes y valida el estandar de Agent Skills. Usalo cuando el usuario quiera convertir un flujo de trabajo en una skill reutilizable, editar un SKILL.md o pregunte como funcionan las skills en este harness.
---

# Creador de skills

Una skill es una carpeta con un \`SKILL.md\` (frontmatter YAML + instrucciones) y recursos opcionales. Se cargan de forma diferida: solo los metadatos (nombre + descripcion) estan siempre visibles; el cuerpo se lee cuando la tarea coincide.

## Donde viven

Todas las skills de este harness viven en el telefono, en \`${CHIA_SKILLS_DIR}/<nombre-de-la-skill>/\` (almacenamiento propio de la app). Nada sale de \`.chia\`. La carpeta la crea la tool \`write\`.

## Convencion: las skills operan el VPS por CLI

Salvo \`memory-creator\` (que son los datos del usuario en el telefono), **todas las skills de este harness son para operar el VPS del cliente por linea de comandos**:

- La skill en si **se crea y se edita en el telefono** con \`write\`/\`read\`/\`edit\` (\`target: "phone"\`), en \`${CHIA_SKILLS_DIR}/<nombre>/SKILL.md\`; lo que la skill describe adentro es trabajo de VPS por CLI.
- Todo se ejecuta con \`shell_exec\`. No hay shell en el telefono, ni navegador, ni MCP: si una herramienta no tiene CLI, no entra como skill.
- Instalacion con \`npm i -g <paquete>\` / \`npx -y <paquete>\` en el VPS y verificacion con \`--help\` antes de usarla.
- Nunca una ruta, puerto, dominio, usuario ni credencial fijos: cada cliente tiene su VPS. Se descubre (\`systemctl\`, \`ss\`, archivos de config) o se le pregunta al usuario.
- La salida larga va a un archivo (\`> log 2>&1\`), nunca al contexto: se lee con \`tail -c\`, \`grep\` o la tool \`read\` con \`offset\`/\`limit\`, porque la tool corta en \`maxChars\`.
- Procesos largos en background con \`nohup ... &\` + PID y log, y al terminar se cierran (nada de dejar Chromium o renders colgados consumiendo RAM del cliente).
- Cero credenciales en la respuesta o en una nota: se piden y se usan por variable de entorno o archivo de estado.
- \`compatibility:\` del frontmatter dice exactamente que necesita el VPS (Node, Chromium, systemd --user, curl, etc.).

## Anatomia

\`\`\`
<nombre-de-la-skill>/
├── SKILL.md        obligatorio: frontmatter + instrucciones
├── scripts/        opcional: codigo determinista que ejecuta el agente
├── references/     opcional: documentacion que se lee solo si hace falta
└── assets/         opcional: plantillas, fuentes, imagenes usadas en la salida
\`\`\`

## Reglas del frontmatter

- \`name\`: solo minusculas \`a-z0-9-\`, maximo 64 chars, sin guion al inicio ni al final, sin \`--\`. Tiene que coincidir con el nombre de la carpeta.
- \`description\`: obligatoria, maximo 1024 chars. Es lo unico que ve el modelo antes de cargar la skill, asi que decide si se dispara o no. Decime **que** hace y **cuando** usarla, con las palabras que el usuario escribiria de verdad. Se un poco insistente: los modelos tienden a no disparar las skills.
- Opcionales: \`compatibility\` (tools o dependencias necesarias), \`disable-model-invocation: true\` para ocultarla del indice (solo invocacion explicita).

## Divulgacion progresiva

1. Metadatos (nombre + descripcion): siempre en contexto, mantenelos cortos.
2. Cuerpo del \`SKILL.md\`: se carga cuando la skill se dispara, mantenelo por debajo de ~500 lineas.
3. Recursos: se leen o ejecutan solo cuando las instrucciones lo piden. Enlazalos por ruta relativa, porque las rutas relativas se resuelven contra la carpeta de la skill.

Si un archivo de referencia pasa las ~300 lineas, ponele un indice al principio.

## Flujo de trabajo

1. **Capturar la intencion**: que tiene que habilitar la skill, cuando se dispara, que formato de salida se espera. Si el usuario convierte una conversacion en skill, extrae las tools usadas, la secuencia de pasos y las correcciones que hizo.
2. **Entrevistar**: pregunta por casos limite, formatos de entrada/salida, dependencias y ejemplos. No escribas prompts de prueba antes de que esto este claro.
3. **Borrador**: escribe el \`SKILL.md\` con instrucciones imperativas. Explica *por que* importa cada paso en vez de apilar MUSTs; mantenelo general, sin sobreajustar a un ejemplo.
4. **Escribila en el telefono** con la tool \`write\`: \`target: "phone"\`, ruta \`${CHIA_SKILLS_DIR}/<nombre-de-la-skill>/SKILL.md\` (crea la carpeta) y el texto completo en \`content\`:
   \`\`\`markdown
   ---
   name: <nombre-de-la-skill>
   description: ...
   ---

   # <Titulo>
   ...
   \`\`\`
   Si la skill necesita playbooks, plantillas o assets, escribilos como archivos hermanos con \`write\` (\`references/<tema>.md\`, \`assets/<archivo>\`): no hay otro mecanismo, y el modelo los lee cuando las instrucciones los nombran. La \`description\` tiene que entrar en ~250 chars porque el prompt del harness la recorta a 260: pone el que y el cuando al principio.
5. **Validar**: volve a leer el archivo con la tool \`read\` (\`target: "phone"\`) y revisa las reglas del frontmatter (patron del nombre, descripcion presente, tamano). Arregla lo que rompa el estandar.
6. **Iterar**: proba la skill con 2-3 prompts realistas. Si el modelo no la dispara, mejora la descripcion (mas palabras gatillo). Si se dispara pero hace otra cosa, arregla el cuerpo.

## Mantener las skills

Las skills son tus habilidades y se mantienen, no se coleccionan: una skill desactualizada es peor que no tenerla.

- **Antes de crear**: lista la carpeta (\`android_phone files.list\` sobre \`${CHIA_SKILLS_DIR}\`) y si ya hay una que cubre el tema, se edita esa. Nunca dos skills para el mismo flujo.
- **Cuando el flujo cambia** (otra version de la herramienta, otro comando, otro VPS, un paso que ya no existe): se actualiza el \`SKILL.md\` en el momento con \`edit\`, en la misma conversacion en la que se aprendio.
- **Cuando la skill falla**: se corrige el paso que fallo y se deja el error real documentado; no se crea una skill nueva al costado.
- **Cuando el usuario corrige** como hacer algo que la skill describe: esa correccion va al \`SKILL.md\` antes de seguir.
- **Cuando queda obsoleta o duplica a otra**: se borra con \`android_phone files.delete\` (o se unen en una).
- La \`description\` tambien se mantiene: si cambian los casos de uso o las palabras que usa el usuario, se reescribe para que la skill se dispare bien.

## Estilo de escritura

- Forma imperativa, pasos concretos, sin marketing.
- Define formatos de salida con una plantilla exacta cuando el resultado tenga que ser consistente.
- Prefiere ejemplos (entrada → salida) antes que reglas abstractas.
- Nada de malware, ni exfiltracion, ni nada que sorprenda al usuario respecto de la descripcion.
`;

type DefaultSkill = {
  name: string;
  content: string;
  files?: { path: string; content: string }[];
};

const GOWA = `---
name: whatsapp-gowa
description: Opera y diagnostica WhatsApp-GOWA (WhatsApp multi-dispositivo de aldinokemal) en el VPS: enviar o verificar mensajes por API, revisar dispositivos y QR, ver webhooks o diagnosticar errores de envio (422, INVALID_JID, timeout, numero sin WhatsApp).
compatibility: shell_exec en el VPS del cliente (systemctl --user, ss, curl, journalctl). No aplica al telefono.
---

# WhatsApp-GOWA (WhatsApp multi-dispositivo)

GOWA es un servidor REST en Go sobre \`whatsmeow\` que expone WhatsApp Web como API. Cada instancia tiene N dispositivos vinculados: cada numero es un device con su propia sesion y su propio \`X-Device-Id\`.

## Primero: descubrir la instancia (nunca la supongas)

Este APK lo usan varios clientes y **cada uno tiene su VPS y su propia instalacion**. No inventes puertos, dominios ni nombres de servicio: descubrilos o preguntale al usuario.

\`\`\`bash
systemctl --user list-units --all | grep -i gowa        # nombres reales de servicio
systemctl --user cat <servicio> | grep -iE 'port|exec|environment'   # puerto, flags, env
ss -ltnp 2>/dev/null | grep -iE 'gowa|whatsapp|:3[0-9]{3}'           # puerto escuchando
\`\`\`

Antes de cualquier cambio: \`systemctl --user is-active <servicio>\` y confirmar con el usuario **que instancia** esta en juego si hay mas de una. Si no hay GOWA instalado, decilo y no inventes nada.

## Donde esta la API

- Local en el VPS: \`http://127.0.0.1:<puerto>\` (el puerto que salio del \`cat\` o del \`ss\`).
- Publica: la URL que use el cliente (preguntala). Si hay basic auth o api key, pedile el valor al usuario y **no lo repitas en la respuesta ni en una nota**.
- Cada request de una sesion lleva el device: header \`X-Device-Id: <id>\` o query \`?device_id=<id>\`.

## Comandos utiles

\`\`\`bash
BASE=http://127.0.0.1:<puerto>

curl -s "$BASE/app/devices"                       # dispositivos vinculados y estado
curl -s "$BASE/app/status"                        # estado de la conexion
curl -s "$BASE/app/qr" -o /tmp/qr.png             # QR para vincular (se escanea desde el telefono)

curl -s -X POST "$BASE/send/message" \\
  -H 'Content-Type: application/json' -H "X-Device-Id: <device>" \\
  -d '{"phone":"<pais><numero>","message":"hola"}'

curl -s -X POST "$BASE/send/image" \\
  -H "X-Device-Id: <device>" -F "phone=<pais><numero>" -F "caption=hola" -F "image=@/ruta/foto.jpg"

curl -s "$BASE/webhook"                            # webhooks configurados
curl -s "$BASE/app/reconnect"                      # forzar reconexion
curl -sI "$BASE"                                   # solo para ver si responde
\`\`\`

Ajusta las rutas a la version instalada: si un endpoint devuelve 404, mira \`curl -s $BASE/docs\` o \`$BASE/openapi.json\` (GOWA trae Swagger) antes de probar variantes al azar.

## Errores tipicos y que significan

| Sintoma | Causa probable | Que hacer |
|---|---|---|
| \`El numero X no aparece como usuario de WhatsApp\` | el numero no tiene WhatsApp o esta mal formado (falta codigo de pais, \`+\`, espacios) | normalizar a solo digitos con pais y volver a probar; confirmar con el usuario |
| \`422\` + \`INVALID_JID\` / \`invalid phone\` | JID mal armado | usar \`<pais><numero>\` sin \`+\`, \`@s.whatsapp.net\` lo agrega GOWA |
| \`401\` / \`403\` | basic auth o api key | pedir la credencial al usuario |
| \`timeout\` o \`no se pudo contactar el servidor\` | proceso caido, puerto cerrado, firewall, o el VPS sin salida a WhatsApp | \`systemctl --user status <servicio>\`, \`ss -ltnp\`, \`journalctl --user -u <servicio> -n 50\` |
| 200 pero el mensaje no llega | device desconectado o sesion en otro device | \`$BASE/app/devices\`, revisar estado y reconectar |
| QR vencido | tarda mas de lo que dura el QR | generar de nuevo y escanear enseguida |

Siempre cerrar el diagnostico con lo que devolvio el comando (\`journalctl\` de las ultimas lineas o el JSON del endpoint). Nada de "deberia funcionar".

## Reglas de este harness

- El VPS se toca con \`shell_exec\`; los archivos de configuracion con \`read\`/\`edit\`/\`write\` (\`target:"vps"\`). Si falta el VPS configurado, pedile al usuario que cargue host, usuario y clave en Configuracion > Hosting Web.
- Los archivos del telefono (\`target:"phone"\`, \`~\` = /sdcard) no tienen nada que ver con GOWA.
- **No mandes mensajes de WhatsApp sin que el usuario lo pida explicitamente** y confirmá destinatario y texto antes de enviar.
- No escribas tokens, api keys ni passwords en la respuesta: mostra el comando con \`<credencial>\` y pedilos si hacen falta.
- Si descubris algo estable del cliente (puerto, servicio, device por defecto), ofrecelé guardarlo en una nota de memoria (\`.chia/memory/\`) en vez de repetir el descubrimiento cada vez.`;

const REA = `---
name: rea-ingeniera-inversa
description: REA-ingeniera-inversa: lee binarios y apps sin codigo fuente con REA (npm rea-agents) -ELF/PE/Mach-O, Go, Rust, .NET, APK/IL2CPP, Electron, firmware, GGUF-, busca strings o funciones, xrefs, descompila y compara versiones.
compatibility: shell_exec en el VPS (Node.js + npm, salida a archivo). Analisis nativo opcional con Hopper, Ghidra, IDA o Kuna si estan instalados. No corre en el telefono.
---

# REA - Reverse Engineer Anything

MCP + CLI para inspeccionar binarios, apps JS/Electron, assemblies .NET y modelos, con **evidencia** y **limites explicitos** en cada respuesta. Todo corre local: nada del binario del usuario se sube a servicios externos.

## Regla del harness: la evidencia no se lee entera

Cada tool devuelve al modelo como maximo \`maxChars\` (Configuracion > Agente). La evidencia de una app real puede pesar cientos de MB: **guardala en el VPS y leela por partes**. Nunca la vuelques al contexto.

\`\`\`bash
cd /tmp && mkdir -p rea && cd rea
npx -y rea-agents@latest analyze <ruta> --json > evidencia.json   # guarda, no imprime
wc -c evidencia.json; head -c 200 evidencia.json                  # ver que hay
npx -y rea-agents@latest inspect-analysis-view <vista>.json | head -c 4000
\`\`\`

Despues pedi vistas concretas (un modulo, una funcion) en vez del volcado, o lee el archivo con la tool \`read\` usando \`offset\`/\`limit\` cuando el recorte por chars ya no alcance.

## Instalacion (en el VPS, no en el telefono)

\`\`\`bash
node -v && npm -v                                  # requisito
npx -y rea-agents@latest --help                    # sin instalar nada
npm install --global rea-agents && rea --help      # CLI fija
\`\`\`

Fuentes oficiales: \`morluto/rea\`, \`rea.tools\` o el paquete npm \`rea-agents\`. Un repo con el README copiado no es oficial. No hace falta registrar el MCP: aca se usa la CLI por \`shell_exec\`.

## Antes de analizar: saber que hay disponible

\`\`\`bash
rea providers --json       # motores nativos (Hopper/Ghidra/IDA/Kuna) y que soportan
rea capabilities --json    # capacidades auxiliares
\`\`\`

Sin motor nativo solo funciona el analisis **estatico** de JS/Electron y los inspectores propios (Go, ELF, PE, IL2CPP, PCK, GGUF). Si \`providers\` no muestra motor, no prometas decompilacion.

## Elegir el comando segun el target

| Target | Comando |
|---|---|
| Dir o \`.asar\` (JS/Electron) | \`rea analyze-javascript-application <ruta> --json\` |
| Binario cualquiera (auto) | \`rea analyze <ruta> --json\` |
| Binario Go | \`rea inspect-go-binary <ruta> --json\` (compilador, modulos, build settings, SHA-256) |
| Binario Rust | \`rea inspect-rust-binary <ruta> --json\` (crates cargo-auditable) |
| ELF / PE / Mach-O | \`inspect-elf-notes\`, \`inspect-pe-imports\`, \`inspect-pe-load-config\`, \`inspect-pe-certificates\` |
| .NET | \`inspect-managed-artifact\`, \`inspect-managed-members\`, \`decompile\` |
| APK/Unity | \`inspect-il2cpp-metadata <global-metadata.dat>\` |
| Firmware/artefactos | \`inspect-artifact\`, \`extract-artifact\` (PCK, UnityFS, ESP32, ITB, Node SEA) |
| Modelos | \`inspect-model-artifact <x.gguf\\|x.safetensors> [--hash full]\` |
| Bases embebidas | snapshots SQLite |

Busqueda y navegacion, con sesion de analisis abierta: \`rea search\`, \`rea xrefs\`, \`rea function\`, \`rea decompile\`, \`rea trace\`. Comparar: \`rea compare\`, \`rea compare-artifacts\`, \`rea environment-compare\`. Con \`--evidence_output archivo.json\` guardas la evidencia de cualquier \`inspect-artifact\`, y \`rea evidence-export\` / \`evidence-import\` mueven el analisis entre maquinas sin repetirlo.

## Como trabajar

1. Confirmar que el archivo existe y que es lo que parece: \`file <ruta>\`, \`sha256sum <ruta>\`.
2. Antes de invertir tiempo en el binario, buscar el fuente: \`strings\`, repo clonado, \`package.json\`, \`.map\`. Leer el fuente es mas barato y mas fiable.
3. Correr el inspector adecuado con la salida a un archivo.
4. Proyectar con \`jq\` lo minimo necesario y recien despues mirar.
5. Citar evidencia concreta (ruta del archivo, offset/simbolo, hash) en la respuesta.

\`\`\`bash
npx -y rea-agents@latest analyze app.bin --json > ev.json
jq -c '{source:{kind:"inline",evidence:.},view:{kind:"summary"}}' ev.json > vista.json
npx -y rea-agents@latest inspect-analysis-view vista.json | head -c 4000
npx -y rea-agents@latest search --json "<string o patron>" | head -c 4000
npx -y rea-agents@latest xrefs --json "<simbolo o direccion>" | head -c 4000
npx -y rea-agents@latest function --json "<nombre>" | head -c 4000
\`\`\`

## Limites

- Android/APK: descompilar codigo nativo puede requerir motores y tiempo; no es instantaneo.
- Nada de eludir licencias, DRM ni protecciones: la skill es para entender, auditar y aprender.
- Los binarios del cliente se quedan en su VPS: no los subas a servicios externos ni al telefono.
- Si el comando no esta instalado o falla, mostrar el error real y proponer el paso siguiente. No inventar resultados de analisis.`;

const REMOTION = `---
name: remotion
description: Crea y renderiza videos con Remotion (React como lenguaje de video). Usala cuando haya que generar un video, un clip animado, un still/frame, un video con datos variables (batch), subtitulos quemados, audio o plantillas de video por codigo.
compatibility: shell_exec en el VPS (Node.js 18+ y npm; Chrome headless lo baja Remotion). No corre en el telefono.
---

# Remotion - videos con React

Remotion es un framework para generar video con React: cada frame es un render de un componente React, y el CLI lo compila y lo graba con Chrome headless + ffmpeg. El video queda como **codigo**: se versiona, se parametriza y se renderiza en lote.

## Antes de empezar

\`\`\`bash
node -v && npm -v          # 18+ recomendado
which ffmpeg || echo "sin ffmpeg (Remotion trae el suyo)" 
\`\`\`

Si no hay Node, pedile al usuario instalarlo o usarlo en otro VPS. No instales paquetes sin avisar; si hace falta \`sudo apt-get install\`, pedile permiso al usuario.

## Arrancar un proyecto

\`\`\`bash
cd /tmp && npx create-video@latest mi-video --blank   # plantilla minima
cd mi-video && npm install
\`\`\`

Alternativa manual (cuando ya hay proyecto):

\`\`\`bash
npm i remotion @remotion/cli react react-dom
\`\`\`

Estructura tipica:

\`\`\`
mi-video/
├── src/
│   ├── index.ts        # registerRoot(RemotionRoot)
│   ├── Root.tsx        # <Composition .../> una por video
│   └── MiVideo.tsx     # el componente del video
├── public/             # staticFile(): imagenes, audio, fuentes
├── remotion.config.ts  # codec, image format, concurrency, etc.
└── out/                # salida de los renders
\`\`\`

\`src/index.ts\` y \`src/Root.tsx\`:

\`\`\`tsx
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
\`\`\`

\`\`\`tsx
import { Composition } from 'remotion';
import { MiVideo, esquema } from './MiVideo';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MiVideo"
    component={MiVideo}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
    schema={esquema}
    defaultProps={{ titulo: 'Hola' }}
  />
);
\`\`\`

## Las piezas que se usan siempre

| API | Para que |
|---|---|
| \`useCurrentFrame()\` | frame actual, de ahi sale toda la animacion |
| \`useVideoConfig()\` | \`fps\`, \`durationInFrames\`, \`width\`, \`height\` |
| \`interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })\` | mapear frame a valor |
| \`spring({ frame, fps, config })\` | entradas/salidas con fisica |
| \`<Sequence from={30} durationInFrames={60}>\` | escenas y capas con tiempo propio |
| \`<AbsoluteFill style={...}>\` | capa que ocupa todo el lienzo |
| \`staticFile('logo.png')\` | archivo de \`public/\` |
| \`<Img>\`, \`<Audio>\`, \`<Video>\`, \`<OffthreadVideo>\` | medios (usa los componentes de Remotion, no los HTML) |
| \`delayRender()\` / \`continueRender()\` | esperar datos o fuentes antes de grabar |
| \`calculateMetadata()\` | duracion/props dinamicos segun los datos |
| \`z.object({...})\` (zod) | \`schema\`: props validadas y editables en Studio |

Reglas de oro: la animacion se calcula **solo** con \`frame\` (nada de \`Date.now()\`, \`setState\` por tiempo ni \`requestAnimationFrame\`), y todo lo externo (fetch, fuentes, imagenes remotas) se espera con \`delayRender\`.

## Props: datos por archivo

\`\`\`bash
npx remotion render src/index.ts MiVideo out/video.mp4 --props=props.json
\`\`\`

- \`props.json\` en el VPS, escrito con \`write\` (\`target:"vps"\`). **Nunca** JSON inline en la shell: se comen las comillas.
- Props tipadas con zod (\`schema\`) se validan antes de renderizar: mejor error que video a medias.

## Renderizar

\`\`\`bash
npx remotion render src/index.ts MiVideo out/video.mp4 \\
  --props=props.json --codec=h264 --concurrency=2

npx remotion still src/index.ts MiVideo out/frame.png --frame=45   # un frame (imagen)
npx remotion render src/index.ts MiVideo out/clip.mp4 --frames=0-59 # un rango
npx remotion render src/index.ts MiVideo out/video.mp4 --scale=0.5  # mas rapido y liviano
npx remotion studio                                                  # preview (necesita navegador)
\`\`\`

- Codecs: \`h264\` (mp4, universal), \`vp8\`/\`vp9\` (webm), \`prores\` (calidad/master), \`gif\`, \`mp3\`/\`wav\` si el video es solo audio.
- \`--concurrency\` = pestañas de Chrome en paralelo. Si el VPS tiene 1-2 vCPU, deja 1-2 o el render se cae por memoria.
- En un VPS sin escritorio \`remotion studio\` no se puede mirar: verifica con \`still\` y lee el PNG con la tool \`read\` (vision).

### Primera vez: Chrome

\`\`\`bash
npx remotion browser ensure
\`\`\`

Baja Chrome headless para Remotion. Si falla por librerias faltantes (\`libnss3\`, \`libatk\`, \`libgbm\`), es instalacion del sistema: pedile permiso al usuario para \`sudo apt-get install -y ...\` y decile que falta exactamente.

## Render largo sin bloquear el turno

Un video puede tardar minutos y la tool devuelve como maximo \`maxChars\`: no dejes el render en primer plano esperando la salida completa.

\`\`\`bash
cd /tmp/mi-video
nohup npx remotion render src/index.ts MiVideo out/video.mp4 --props=props.json \\
  > render.log 2>&1 &
echo $! > render.pid
sleep 20 && tail -c 1500 render.log      # progreso
\`\`\`

Despues: \`ps -p $(cat render.pid)\` para saber si sigue, \`tail -c 1500 render.log\` para el avance, y al terminar \`ls -la out/\` + \`du -h out/video.mp4\`. Avisar al usuario que quedo corriendo en vez de dejarlo esperando en silencio.

## Errores tipicos

| Sintoma | Causa | Solucion |
|---|---|---|
| \`Browser failed to launch\` / falta \`libgbm\` | Chrome sin dependencias del sistema | \`npx remotion browser ensure\`, despues instalar las libs que falten (con permiso) |
| render se corta sin mensaje, OOM | \`--concurrency\` alto para la RAM del VPS | bajarlo a 1 o 2, \`--scale=0.5\` |
| \`Composition "X" not found\` | id distinto o entrada mal pasada | \`npx remotion compositions src/index.ts\` para listar los ids reales |
| props invalidas | no coinciden con el \`schema\` | leer el error de zod y corregir el JSON |
| fuente distinta en el render | la fuente no se cargo a tiempo | cargarla con \`delayRender\` o \`@remotion/fonts\` / \`@remotion/google-fonts\` |
| audio no suena | \`<Audio>\` con ruta mal o video muteado | \`staticFile()\` y revisar \`--muted\` |
| video pesa demasiado | bitrate/scale por defecto | \`--scale\`, \`--crf\`, o \`prores\` solo para master |

## Licencia (importante)

Remotion es gratis para personas y organizaciones de **hasta 3 personas**. Una empresa mas grande necesita **Company License** (remotion.pro) para uso comercial. Si el cliente va a facturar con esto, avisale antes de armar el proyecto; no decidas vos por el.

## Reglas de este harness

- Todo el proyecto vive en el VPS: se escribe con \`write\`/\`edit\` (\`target:"vps"\`) y se ejecuta con \`shell_exec\`.
- No vuelques logs enteros: \`tail -c\`, \`grep\`, o \`read\` con \`offset\`/\`limit\`.
- El resultado es un archivo: decile al usuario la ruta, el tamaño y la duracion reales (\`du -h\`, \`ffprobe -hide_banner out/video.mp4\` si esta disponible).
- Para que el usuario lo vea o descargue en el telefono, publica una URL del VPS (o mandalo por WhatsApp con la skill \`whatsapp-gowa\`) y abrila con \`android_phone url.open\`: las tools de archivos son de texto y no sirven para mover un video.
- No subas material del cliente a servicios externos (Lambda, Vercel, terceros) sin pedirlo.`;

const PLAYWRIGHT = `---
name: playwright-cli
description: Automatiza el navegador en el VPS con playwright-cli: probar flujos web, llenar formularios, sacar screenshots o PDFs, revisar consola y red, grabar video de la sesion o entrar a un sitio y verificar que la UI funciona.
compatibility: shell_exec en el VPS (Node.js 18+, Chromium). Headless: no necesita escritorio. No corre en el telefono.
---

# playwright-cli - navegador por comandos

CLI de Playwright pensado para agentes: cada accion es un comando corto y el estado de la pagina **no** se vuelca entero al contexto (para eso estan los snapshots en archivo). Es la alternativa liviana al MCP: menos tokens, misma capacidad.

## Instalacion (en el VPS)

\`\`\`bash
node -v                                   # 18+
npm install -g @playwright/cli@latest
playwright-cli --help                     # siempre primero: esta es la fuente de verdad de los comandos
npx playwright install chromium           # navegador, si el CLI no lo baja solo
\`\`\`

Si el navegador no arranca por librerias del sistema (\`libnss3\`, \`libgbm\`, \`libasound2\`), hace falta root: pedile permiso al usuario antes de \`apt-get install\`.

## Ciclo de trabajo

\`\`\`bash
playwright-cli open https://sitio.com      # abre (headless por defecto) y navega
playwright-cli snapshot                     # arbol de accesibilidad con refs (e1, e15, ...)
playwright-cli click e15                    # interactuar por ref
playwright-cli fill e21 "texto" --submit     # llenar y enviar
playwright-cli snapshot                     # re-snapshot despues de cada cambio
playwright-cli screenshot --filename=paso1.png
\`\`\`

Reglas:

1. **Refs del snapshot, no selectores a ciegas.** Si un ref deja de existir, sacá snapshot otra vez: el DOM cambio.
2. **\`find\` antes que volcar**: en paginas grandes \`playwright-cli find "Agregar al carrito"\` devuelve solo los nodos que coinciden; el snapshot completo se guarda en \`.playwright-cli/*.yml\` y se lee por partes si hace falta.
3. **\`--raw\` para valores**: \`playwright-cli --raw eval "document.title"\` o \`--raw cookie-get sid\` acompañado de \`jq\` cuando convenga parsear.
4. **No uses \`eval\` para reemplazar la UI** si podés hacer lo mismo con un comando (\`fill\`, \`click\`, \`select\`, \`check\`). \`eval\` es para leer datos.
5. En el VPS **nunca \`--headed\`**: no hay pantalla. Para "ver" la pagina usa \`screenshot\` y mirá el PNG con la tool \`read\`.

## Comandos que mas se usan

| Para | Comando |
|---|---|
| abrir / navegar | \`open [url]\`, \`goto <url>\`, \`reload\`, \`go-back\`, \`go-forward\` |
| leer la pagina | \`snapshot\`, \`snapshot --depth=4\`, \`snapshot <ref>\`, \`find "<texto>"\` |
| escribir | \`type "<texto>"\`, \`fill <ref> "<texto>" [--submit]\`, \`press <tecla>\`, \`keydown/keyup\` |
| clickear | \`click <ref> [button]\`, \`dblclick <ref>\`, \`hover <ref>\`, \`drag <a> <b>\` |
| formularios | \`select <ref> <valor>\`, \`check <ref>\`, \`uncheck <ref>\`, \`upload <archivo>\`, \`drop <ref> --path=<archivo>\` |
| guardar | \`screenshot [ref] --filename=f --hires\`, \`pdf --filename=page.pdf\` |
| pestañas | \`tab-list\`, \`tab-new [url]\`, \`tab-select <i>\`, \`tab-close [i]\` |
| sesion | \`list\`, \`close\`, \`close-all\`, \`kill-all\`, \`delete-data\` |
| debug | \`console [nivel]\`, \`requests\`, \`request <index>\`, \`run-code <code>\` |
| locators | \`generate-locator <ref>\` (te da el locator Playwright equivalente) |

## Depurar lo que falla

\`\`\`bash
playwright-cli console error          # errores de JS de la pagina
playwright-cli requests               # todo lo que pidio la pagina
playwright-cli request 12             # detalle de una request (status, headers, body)
playwright-cli tracing-start
playwright-cli goto https://sitio.com
playwright-cli tracing-stop           # deja un trace para abrir en el trace viewer
playwright-cli video-start demo.webm --cursor && ... && playwright-cli video-stop
\`\`\`

Si el flujo falla, la respuesta no es "no funciona": es **que devolvio** \`console\`/\`requests\`/el snapshot. Cita el error real.

## Sesiones

- El perfil vive en memoria: cookies y storage sobreviven entre llamadas, pero se pierden al cerrar.
- \`open --persistent\` (o \`--profile=<ruta>\`) para conservar la sesion entre reinicios.
- Varias sesiones en paralelo: \`playwright-cli -s=<nombre> ...\` y elegir una por comando; \`playwright-cli list\` las muestra.
- Headless se cierra solo tras **1 hora sin comandos**: si el siguiente comando dice que no hay sesion, volvé a \`open\`. Ajustable con \`open --idle-timeout=<ms>\` (0 = sin limite).
- Antes de terminar, cerrá lo que abriste: cada Chromium se come RAM del VPS del cliente (\`close-all\`, y \`kill-all\` si quedó colgado).

## Estado, cookies y emulacion

\`\`\`bash
playwright-cli state-save estado.json      # guardar sesion
playwright-cli state-load estado.json      # reusarla (login ya hecho)
playwright-cli cookie-list --domain=ejemplo.com
playwright-cli cookie-set sid abc123
playwright-cli localstorage-list
playwright-cli open --mobile --device="iPhone 15"
playwright-cli set-color-scheme dark
\`\`\`

Esto es lo correcto para logins: se guarda el estado **una vez** y despues \`state-load\`, en vez de automatizar el formulario de login en cada corrida.

## Mockear la red

\`\`\`bash
playwright-cli route "**/api/precio" --body='{"precio":10}'
playwright-cli route-list
playwright-cli unroute "**/api/precio"
\`\`\`

Util para probar la UI sin depender del backend.

## Errores tipicos

| Sintoma | Causa | Solucion |
|---|---|---|
| \`Executable doesn't exist\` / no abre | falta el Chromium | \`npx playwright install chromium\` (y libs del sistema si pide root) |
| \`no such session\` o el comando queda en el vacio | la sesion se cerro por inactividad | \`playwright-cli open\` de nuevo (\`--idle-timeout=0\` si es un flujo largo) |
| el ref ya no existe | la pagina se re-renderizo | nuevo \`snapshot\` y usar el ref nuevo |
| se clickea otra cosa | ref desactualizado o hay capas encima | \`snapshot <ref>\` del contenedor, o \`highlight <ref>\` para confirmar el elemento |
| timeout esperando el elemento | carga lenta o selector equivocado | \`console\` + \`requests\` para ver si la pagina fallo, no subir el timeout a ciegas |
| muchas sesiones y el VPS se arrastra | Chromium abiertos | \`playwright-cli list\` y \`close-all\`/\`kill-all\` |

## Reglas de este harness

- Todo corre en el **VPS del cliente** por \`shell_exec\`; los archivos (snapshots, screenshots, scripts) se leen con \`read\` (\`target:"vps"\`) por partes: la salida de una tool se corta en \`maxChars\`.
- Un screenshot se verifica leyéndolo con la tool \`read\` (tenés vision). No describas una imagen que no viste.
- Credenciales: pedilas al usuario, usalas por \`state-load\`/variables y **no las repitas** en la respuesta ni en una nota.
- Automatizá solo sitios donde el usuario tiene permiso de operar. Nada de scrapeo masivo, evadir captchas ni saltar limites de un servicio.
- Terminá con el estado limpio (cerrar sesiones) y contá qué pasó de verdad, con la evidencia de \`console\`/\`requests\`.`;

const CANVAS_DESIGN = `---
name: canvas-design
description: Crea arte visual original en .png y .pdf desde una filosofia de diseno. Usala cuando el usuario pida un poster, una pieza de arte, un afiche, una portada, un diseno grafico o cualquier pieza visual estatica. Nunca copia el trabajo de artistas existentes.
compatibility: shell_exec en el VPS del cliente (Node.js o Python, librerias de PDF/PNG, ffmpeg si hace falta, curl para bajar fuentes). No corre en el telefono.
---

# Canvas design

Instrucciones para crear filosofias de diseno - movimientos esteticos que despues se EXPRESAN VISUALMENTE. La salida son solo archivos .md, .pdf y .png, generados en el VPS por \`shell_exec\`.

Dos etapas:
1. Crear la filosofia de diseno (archivo .md)
2. Expresarla en un canvas (archivo .pdf o .png)

## CREACION DE LA FILOSOFIA DE DISENO

Primero crea una FILOSOFIA VISUAL (no un layout ni una plantilla) que despues se interprete a traves de:
- Forma, espacio, color, composicion
- Imagenes, graficos, formas, patrones
- Texto minimo como acento visual

### LO CRITICO
- Lo que se recibe: una instruccion o referencia sutil del usuario, que se toma como base pero no limita la libertad creativa.
- Lo que se crea: una filosofia de diseno / movimiento estetico.
- Lo que sigue: esa filosofia se EXPRESA VISUALMENTE - piezas 90% diseno visual y 10% texto esencial.

Enfoque: escribe el manifiesto de un movimiento artistico; despues hace la obra.

La filosofia tiene que enfatizar: expresion visual, comunicacion espacial, interpretacion artistica, palabras minimas.

### COMO GENERAR UNA FILOSOFIA VISUAL

**Nombra el movimiento** (1-2 palabras): "Brutalist Joy" / "Chromatic Silence" / "Metabolist Dreams"

**Articula la filosofia** (4-6 parrafos, concisos pero completos). Para capturar la esencia VISUAL, expresa como se manifiesta en:
- Espacio y forma
- Color y material
- Escala y ritmo
- Composicion y balance
- Jerarquia visual

**REGLAS CRITICAS:**
- **Sin redundancia**: cada aspecto del diseno se menciona una vez. No repitas teoria del color, relaciones espaciales ni principios tipograficos salvo que agreguen profundidad nueva.
- **Enfatiza el oficio REPETIDAMENTE**: la filosofia DEBE insistir varias veces en que la obra final parece el resultado de incontables horas, trabajada con cuidado, hecha por alguien en la cima de su campo. Frases como "meticulosamente elaborado", "producto de una experticia profunda", "atencion obsesiva al detalle", "ejecucion de nivel maestro".
- **Deja espacio creativo**: se especifico en la direccion estetica pero conciso, para que quien ejecute tenga margen de interpretacion al mismo nivel de oficio.

La filosofia guia a expresar ideas VISUALMENTE, no con texto. La informacion vive en el diseno, no en parrafos.

### EJEMPLOS DE FILOSOFIA

**"Concrete Poetry"**
Filosofia: comunicacion por forma monumental y geometria audaz.
Expresion visual: bloques de color masivos, tipografia escultorica (palabras sueltas enormes, etiquetas minusculas), divisiones espaciales brutalistas, energia del poster polaco con Le Corbusier. Ideas expresadas por peso visual y tension espacial. Texto como gesto raro y potente, nunca parrafos. Cada elemento colocado con precision de maestro.

**"Chromatic Language"**
Filosofia: el color como sistema primario de informacion.
Expresion visual: precision geometrica donde zonas de color crean significado. Tipografia minima: etiquetas sans-serif chicas que dejan hablar a los campos cromaticos. Interaccion de Josef Albers con visualizacion de datos. Palabras solo para anclar lo que el color ya muestra. Calibracion cromatica obsesiva.

**"Analog Meditation"**
Filosofia: contemplacion visual quieta por textura y aire.
Expresion visual: grano de papel, tinta que sangra, espacio negativo enorme. Fotografia e ilustracion dominan. Tipografia susurrada (chica, contenida, al servicio de lo visual). Estetica de fotolibro japones. Las imagenes respiran entre paginas. Texto escaso: frases cortas, nunca bloques explicativos.

**"Organic Systems"**
Filosofia: agrupamiento natural y crecimiento modular.
Expresion visual: formas redondeadas, arreglos organicos, color de la naturaleza pasando por la arquitectura. Informacion por diagramas visuales, relaciones espaciales e iconografia. Texto solo para etiquetas clave flotando en el espacio.

**"Geometric Silence"**
Filosofia: orden puro y contencion.
Expresion visual: precision de grilla, fotografia audaz o graficos secos, espacio negativo dramatico. Tipografia precisa pero minima: texto esencial chico, zonas quietas grandes. Formalismo suizo con honestidad material brutalista. La estructura comunica, no las palabras.

*Ejemplos condensados. La filosofia real va en 4-6 parrafos sustanciales.*

### PRINCIPIOS ESENCIALES
- **FILOSOFIA VISUAL**: crear una cosmovision estetica que se exprese por el diseno.
- **TEXTO MINIMO**: el texto siempre es escaso, solo lo esencial, integrado como elemento visual.
- **EXPRESION ESPACIAL**: las ideas comunican por espacio, forma, color y composicion, no por parrafos.
- **LIBERTAD ARTISTICA**: la filosofia aporta el marco; la ejecucion interpreta con margen propio.
- **DISENO PURO**: se hacen OBJETOS DE ARTE, no documentos decorados.
- **OFICIO EXPERTO**: la obra final debe verse meticulosamente elaborada, el producto de muchas horas de alguien en la cima de su campo.

**La filosofia de diseno va en 4-6 parrafos.** Poetica, sin repetir puntos, generica (sin mencionar la intencion de la obra), como si sirviera en cualquier lado. Se guarda como archivo .md en el VPS.

## DEDUCIR LA REFERENCIA SUTIL

**PASO CRITICO**: antes de crear el canvas, identifica el hilo conceptual sutil del pedido original.

El tema es una **referencia sutil y de nicho embebida en la obra**, no literal, siempre sofisticada. Quien conoce el tema lo siente; el resto ve una composicion abstracta magistral. La filosofia aporta el lenguaje estetico; el tema deducido aporta el alma.

Es **MUY IMPORTANTE**: la referencia se refina para dar profundidad sin anunciarse. Como un jazzista citando otro tema: solo los que saben lo captan, y todos disfrutan la musica.

## CREACION DEL CANVAS

Con filosofia y marco conceptual listos, expresa la obra en un canvas. Usa una paleta limitada y coherente. Trabaja en el VPS:

- Escribe un script (Node con \`sharp\`/\`pdf-lib\`, o Python con \`reportlab\`/\`Pillow\`) en \`/tmp/<nombre>/\`, instala lo que falte y ejecutalo con \`shell_exec\`.
- Baja las fuentes con \`curl\` o \`wget\` (Google Fonts, OFL) a la carpeta del proyecto. **Usa fuentes distintas cuando haya texto** y hace que la tipografia sea parte de la obra: si el arte es abstracto, trae la fuente al canvas, no la compongas digitalmente.
- La salida larga va a un archivo (\`> log 2>&1\`), nunca al contexto; lee con \`tail -c\` o \`grep\`.
- Al terminar, deja los archivos en una ruta del VPS y avisa la ruta. Las tools de archivos son de texto: para que el usuario lo vea en el telefono, publica una URL y abrila con \`android_phone url.open\`, o mandalo por WhatsApp con la skill \`whatsapp-gowa\`. No inventes rutas ni digas que lo copiaste al telefono.

**IMPORTANTE**: para cualquier tema, incluso si piden algo de una pelicula/juego/libro, el enfoque sigue siendo sofisticado. Nunca pierdas de vista que esto es arte, no algo caricaturesco ni amateur.

Para lograr calidad de museo o revista, usa la filosofia como base. Crea una sola pagina muy visual y con diseno decidido (salvo que pidan mas). Usa patrones repetidos y formas perfectas. Trata el diseno filosofico abstracto como una biblia cientifica: toma el lenguaje visual de la observacion sistematica, acumulacion densa de marcas, elementos repetidos o patrones por capas que construyen sentido con repeticion paciente y premian la mirada sostenida. Suma tipografia clinica y escasa y marcadores de referencia sistematicos que sugieran el diagrama de una disciplina imaginaria, tratando el sujeto invisible con la reverencia con que se documenta un fenomeno observable. Ancla la pieza con alguna frase o detalle sutil, con paleta limitada e intencional. Abraza la paradoja de usar lenguaje visual analitico para hablar de la experiencia humana: el resultado debe parecer el artefacto que prueba que algo efimero se puede estudiar, mapear y entender.

**El texto como elemento contextual**: siempre minimo y visual-primero, pero el contexto decide si son etiquetas susurradas o gestos tipograficos audaces. La mayoria de las veces la fuente va fina. Nada se sale de la pagina y nada se superpone. Cada elemento dentro de los margenes, con aire y separacion clara. Esto no es negociable.

Empuja los limites con instinto de diseno y la filosofia como guia. Libertad y eleccion totales. Lleva la estetica y el diseno a la frontera.

**CRITICO**: para lograr calidad hecha a mano (no generada por IA), la obra tiene que verse trabajada por horas, con cada detalle cuidado por alguien de elite. Verifica que nada se superpone, que el formato es impecable, que no hay elementos fuera de lugar. Doble chequeo del render final leyendo el .png con la tool \`read\` (tenes vision) antes de darlo por bueno.

La salida final es un unico .pdf o .png descargable, junto con la filosofia de diseno en .md.

## PASO FINAL

**IMPORTANTE**: el usuario YA dijo "No es lo bastante perfecto. Tiene que ser pristino, una obra maestra del oficio, como si fuera a exhibirse en un museo".

**CRITICO**: para refinar, no agregues mas graficos: refina lo que ya existe y hace todo mas nitido, respetando la filosofia y el minimalismo. Si el instinto es dibujar una forma nueva o llamar una funcion nueva, PARA y pregunta: "como hago que lo que ya esta sea mas una pieza de arte?".

Dale una segunda pasada: volve al script, refina y pule hasta que sea una obra maestra con la filosofia aplicada.

## OPCION MULTIPAGINA

Si piden mas paginas, crea paginas con la misma linea pero claramente distintas, unidas en el mismo .pdf o en varios .png. Trata la primera como una pagina de un libro de mesa de cafe. Las siguientes son variaciones y memorias de la original, contando una historia con gusto. Libertad creativa total.

## Reglas de este harness

- Todo corre en el **VPS del cliente** por \`shell_exec\`; no hay shell ni navegador en el telefono.
- Nada de rutas, dominios ni credenciales fijos: cada cliente tiene su VPS.
- Si falta una libreria, pedile permiso al usuario antes de instalar (o usala con \`npx -y\`).
- Verifica el resultado real (\`file\`, \`ls -l\`, \`read\` del .png). No describas una imagen que no viste.`;

const MEMORY_CREATOR = (): string => `---
name: memory-creator
description: Crea, edita y limpia memorias de largo plazo en este harness. Usalo cuando aparezca un dato duradero del usuario (preferencias, personas, proyectos, decisiones, datos del VPS) o cuando haya que leer o corregir una nota de memoria.
---

# Creador de memorias

Una memoria es un **dato** duradero del usuario o su entorno, guardado en un unico archivo .md. Complementa a las skills: las skills son procedimientos, la memoria son datos (preferencias, personas, proyectos, decisiones, rutinas, datos del VPS).

Regla dura: **una sola nota por proyecto o tarea**. Si ya existe la nota de ese proyecto o tarea, se edita esa; nunca se crea una segunda para el mismo tema, ni con otro nombre, ni "por las dudas".

## Donde

- Todo vive en la raiz de ${CHIA_MEMORY_DIR}, sin subcarpetas.
- Un solo archivo por proyecto o tarea: el nombre del archivo .md es el nombre de la nota (por ejemplo preferencias.md, proyecto-chia.md, vps.md).
- Antes de crear, listá la carpeta (\`android_phone files.list\` sobre ${CHIA_MEMORY_DIR}) y buscá si ya hay nota de ese proyecto o tarea: si existe, se edita con \`edit\`.
- Nunca dos notas del mismo tema: si la nota ya existe, se edita esa.
- No hay archivo central: si la nota crece, se resume y se prioriza; el mismo tema nunca se parte en dos archivos.

## Mantener

La nota no se escribe una vez y se olvida: es responsabilidad tuya que siga siendo verdad.

- Dato nuevo o corregido: se edita la linea en el momento (\`edit\`), sin esperar a que el usuario lo repita.
- Dato que dejo de ser cierto: se borra la linea. La nota no acumula historia.
- Si encontrás dos notas del mismo proyecto o tarea, se unen en una (la del nombre mas claro) y se borra la otra.
- Si el proyecto o la tarea terminó y el dato ya no sirve, se borra la nota; si sirve como historico, se resume a una linea dentro de la nota del proyecto.

## Formato

    ---
    description: <cuando leer esta nota, en una linea>
    ---

    # <Titulo>

    - hecho corto
    - hecho corto

- Nombre de la nota: el del archivo sin .md (minusculas, a-z0-9-).
- description: la unica linea que se ve antes de abrir la nota; escribi cuando conviene leerla.
- Cuerpo: hechos en una linea cada uno, sin relleno ni explicaciones largas.
- Tope: ${getToolsConfig().maxChars} chars por nota. Si no entra, resumi y prioriza: el mismo tema nunca se parte en dos notas.

## Como operar

- Crear: write con target: "phone" y la ruta ${CHIA_MEMORY_DIR}/<tema>.md.
- Leer: read con target: "phone" (lee la nota cuando su description coincida con el tema pedido).
- Actualizar: edit con target: "phone" para cambiar o agregar lineas; la nota se mantiene al dia al momento de aprender el dato y nunca se reescribe entera si solo cambia un hecho.
- Listar: android_phone files.list sobre ${CHIA_MEMORY_DIR}.
- Borrar: android_phone files.delete sobre la ruta de la nota.

## Cuando guardar

- Datos que el usuario repite o corrige: nombre, ciudad, horarios, cuentas, idioma, estilo de respuesta.
- Decisiones estables ("usa X en vez de Y") y datos de sus proyectos o del servidor.
- Si el hecho se contradice con la nota, gana el dato nuevo: edita la linea, no agregues otra.
- Cada dato nuevo o corregido se guarda en el momento, sin notas viejas ni duplicadas.

## Cuando NO guardar

- Lo efimero (una pregunta suelta).
- Lo que ya es una skill.
- Todo lo que el usuario pida no recordar.

## Checklist

1. Un solo archivo por proyecto o tarea, en la raiz, con el nombre del archivo como nombre de la nota.
2. Antes de crear, verificar que no exista ya una nota de ese proyecto o tarea (si existe, se edita).
3. Hecho en una linea, sin relleno.
4. Menos de ${getToolsConfig().maxChars} chars.
5. Releer con read despues de escribir para confirmar el contenido.
`;

const RCLONE_GOOGLE_DRIVE = `---
name: rclone-google-drive
description: Opera la cuenta Google desde el VPS: Drive con rclone (remote, OAuth sin navegador, subir/bajar, sync, backups), eventos de Google Calendar via .ics y correo por Gmail SMTP. Usala si dicen rclone, gdrive, archivos a Drive, respaldar, calendario o mandar mail.
compatibility: shell_exec con rclone instalado en el VPS; el usuario con un navegador y su cuenta de Google.
---

# Google desde el VPS headless (Drive con rclone, Calendar .ics, correo SMTP)

Todo se opera con \`shell_exec\` en el VPS del cliente. Verificá que rclone esté instalado (\`rclone version\`; si falta, \`curl https://rclone.org/install.sh | sudo bash\`) y que corra con el usuario dueño de \`~/.config/rclone/rclone.conf\`.

**Nunca supongas el nombre del remote**: sale de \`rclone listremotes\` o se le pregunta al usuario. En los ejemplos de abajo se usa \`gdrive\` como convención: reemplazalo por el que exista.

## Regla numero uno: los dos puntos

El nombre del remote **sin** \`:\` es una **carpeta local**. Siempre \`<remote>:\` o \`<remote>:carpeta\` (en los ejemplos, \`gdrive:\`). Si rclone dice *"refers to a local folder"*, falta el \`:\`.

## Antes de actuar

1. \`rclone listremotes\` — ver si ya existe el remote (no reconfigurar si ya anda).
2. \`rclone about <remote>:\` — cuota y si el token sigue vivo (si falla el token, reautorizar).
3. Silenciar el aviso del client_id compartido cuando ensucia la salida: agregar \`2>/dev/null\` o \`--quiet\` segun el caso (es solo un NOTICE, no un error).

## Flujo de autorizacion OAuth sin navegador en el servidor

El servidor no tiene navegador y el telefono no alcanza \`127.0.0.1:53682\` del VPS, asi que el intercambio lo hace el servidor con \`curl\`. Pasos exactos:

1. Lanzar en background y leer el link con \`state\`:
   \`nohup rclone authorize drive --auth-no-open-browser > /tmp/ra.log 2>&1 & sleep 3; cat /tmp/ra.log\`
   (guardar el PID/\`pgrep -af "rclone authorize"\` y matar el anterior antes de reintentar.)
2. Convertir el link local en el link real de Google: el \`/auth?state=\` responde 302, hay que leer el \`Location\`:
   \`curl -s -o /dev/null -D - "http://127.0.0.1:53682/auth?state=<STATE>" | tr -d '\\r' | grep -i '^location'\`
3. Mandar al usuario **ese** Location (accounts.google.com). Pedirle solo el login; el \`scope=.../auth/drive\` ya viene por defecto (control total). Si aparece "app no verificada" → *Configuracion avanzada → Ir a rclone (no seguro)*.
4. El navegador del usuario termina en \`http://127.0.0.1:53682/?state=...&code=4/0A...\` con **ERR_CONNECTION_REFUSED**: eso es lo esperado. Pedirle que copie esa URL completa (o el valor de \`code=\`) y pegarla en el chat.
5. Cerrar el flujo pegando esa URL **en el servidor**:
   \`curl -s "http://127.0.0.1:53682/?state=...&code=..."\` → responde "Success!" y \`/tmp/ra.log\` imprime el JSON del token.
6. Crear el remote con ese JSON:
   \`TOK=$(grep -o '{"access_token".*}' /tmp/ra.log); rclone config create gdrive drive token "$TOK" scope drive config_is_local false --non-interactive\`
   - \`config_is_local false\`: el servidor hace el refresh del token solo (obligatorio en headless).
   - \`scope drive\` = control total; \`drive.readonly\` solo lectura; \`drive.file\` solo lo creado por rclone.
7. Verificar: \`rclone about gdrive:\` + una prueba real de escritura y borrado (copiar un \`echo ok > t.txt\`, listar, borrar). Nunca dar por buena una config sin esta prueba.
8. Limpiar \`/tmp/ra.log\` si tiene tokens y matar el \`rclone authorize\` colgado.

Si el usuario ya tiene **client_id/client_secret** propios, pasarlos como flags al crear el remote (\`client_id=... client_secret=...\`). El client_id compartido de rclone se retira durante 2026: avisar y ofrecer crear uno propio (Google Cloud → APIs habilitadas: Drive API → credenciales OAuth tipo "Desktop app" → redirect \`http://127.0.0.1:53682/\`).

## Operaciones habituales (imperativo, copiar y adaptar)

- Ver raiz: \`rclone lsf gdrive:\` — solo carpetas: \`rclone lsf --dirs-only gdrive:\` — con detalle: \`rclone lsjson gdrive: | python3 -m json.tool\`
- Recorrer todo: \`rclone lsf -R gdrive:ruta\` (o \`--max-depth 2\`).
- Tamano de una carpeta: \`rclone size gdrive:ruta\` · nada de duplicados: \`rclone dedupe --dry-run gdrive:ruta\`
- Buscar por nombre: \`rclone lsf -R gdrive: | grep -i patron\` (rclone no tiene search nativo) o \`rclone lsjson -R gdrive: --files-only | grep -i patron\`
- Subir: \`rclone copy archivo.zip gdrive:backups/\` · mover: \`rclone move\` · copiar carpeta: \`rclone copy -P carpeta gdrive:destino\`
- Bajar: \`rclone copy gdrive:backups/x.zip ~/backups/\`
- Sincronizar espejo (BORRA en destino lo que no esta en origen): \`rclone sync -P ~/backups gdrive:backups\` — confirmar con el usuario y probar antes con \`--dry-run\`.
- Borrar: \`rclone delete gdrive:ruta/archivo\` (archivo) · \`rclone purge gdrive:ruta\` (carpeta entera, irreversible) · \`rclone mkdir\` · \`rclone rmdirs gdrive:ruta\` (solo carpetas vacias)
- Compartir: \`rclone link gdrive:ruta/archivo\` (devuelve URL publica) · \`rclone link --expire 24h\`
- Espacio: \`rclone about gdrive:\` · vaciar papelera: \`rclone cleanup gdrive:\` (Drive no libera cuota hasta vaciar la papelera)
- Checksums/estado: \`rclone check ~/backups gdrive:backups --size-only\` (Drive no da hash de todo, usar \`--size-only\` o \`--checksum\` con cuidado)
- Historial de versiones de Drive: \`--drive-export-formats\`, \`--drive-import-formats\` para Google Docs; los Docs/Sheets nativos no se bajan como binario, exportar a docx/xlsx/pdf con \`rclone copy --drive-export-formats docx,xlsx,pdf\`.

## Zips y backups grandes

- Comprimir en streaming sin tocar disco: \`zip -r -q - | rclone rcat gdrive:backups/x.zip\` (o \`tar czf - carpeta | rclone rcat\`).
- Subidas grandes: \`--transfers 4 --checkers 8 --drive-chunk-size 64M -P\`; si corta, \`--retries 5 --low-level-retries 20\`. Reanudar = volver a correr el mismo \`copy\`.
- Excluir basura: \`--exclude ".venv/**" --exclude "__pycache__/**"\` (o \`--filter "- .venv/**"\`).
- Backup programado: el comando de rclone con salida a log (\`>> ~/backups/rclone.log 2>&1\`) y agendado con lo que tenga el VPS (\`crontab -e\` o un timer de \`systemd --user\`); no supongas que existe un scheduler: preguntá o descubrilo.

## Que se puede y que no en la familia Google

| Necesidad | Via |
|---|---|
| Archivos (subir, bajar, listar, borrar, compartir, backups) | **rclone**, remote \`<remote>:\` |
| Correo (avisos, facturas, adjuntos, masivos) | **SMTP** desde el VPS (Gmail: contraseña de aplicación de la cuenta, no la del login). Si el harness ya tiene una skill de correo en \`.chia/skills\`, usá esa |
| Calendario (crear eventos) | **.ics generado + importado** por el usuario |

- **rclone solo hace Drive** de la familia Google (más Photos y Cloud Storage). **Calendar y Gmail no existen como backend**: la CLI no los toca, así que no intentes \`rclone\` para correo o calendario.
- El token de rclone sirve para cualquier API de Google por \`curl\` **solo si el scope fue concedido**. Con \`scope drive\`, Calendar/Gmail devuelven \`403 insufficientPermissions\`.
- **Google bloquea los scopes sensibles en el client_id compartido de rclone**: al armar a mano la URL de autorización con \`auth/calendar\` (o gmail) aparece *"Esta aplicación está bloqueada / ha intentado acceder a información sensible"*. No es un error del flujo: es política de Google sobre apps no verificadas con scopes restringidos. No insistir con ese client_id.
- Si el usuario pide "crear eventos por API" o "leer mails por API", la vía real es un **client_id propio** en Google Cloud (proyecto nuevo → habilitar la API → consentimiento External en **Testing** con el usuario como *test user* + scopes → credenciales OAuth tipo *App de escritorio* → flujo con ese client_id/secret; el refresh_token en Testing caduca a los 7 días). Si no quiere ese trámite, ofrecé lo que ya funciona: .ics para Calendar y SMTP para correo.

## Cargar eventos en Google Calendar sin API (.ics)

1. Juntar los eventos en una lista o TSV con los datos que ya tenga el cliente (SQL, CSV, txt): una fila por evento con id/clave, fecha ISO, título y detalle.
2. Generar el .ics con python3 (stdlib, no hace falta openpyxl) escribiendo \`newline='\\r\\n'\` y escapando \`;\` \`,\` \`\\\\\` en SUMMARY/DESCRIPTION.
3. Evento de dia completo:
   \`BEGIN:VEVENT\` · \`UID:<clave-unica>@dominio\` · \`DTSTAMP:<UTC>Z\` · \`DTSTART;VALUE=DATE:YYYYMMDD\` · \`DTEND;VALUE=DATE:<dia+1>\` · \`SUMMARY:\` · \`DESCRIPTION:\` (con \`\\\\n\` literales) · \`TRANSP:TRANSPARENT\` · \`END:VEVENT\`.
4. Recordatorio opcional: \`BEGIN:VALARM\` \`TRIGGER:-P2D\` \`ACTION:DISPLAY\` \`DESCRIPTION:Vence\` \`END:VALARM\` (si el usuario no lo pide, no lo pongas).
5. Subir con \`rclone copy x.ics <remote>:\` y pasar el link de descarga directa:
   \`https://drive.google.com/uc?export=download&id=<ID>\` (el ID sale de \`rclone lsjson\`).
6. El usuario importa en Calendar → ⚙️ Configuración → **Importar y exportar** → elegir el .ics y calendario destino → Importar. Verificar al final que el usuario los vea en la vista mensual.

## Gotchas

- \`sync\` borra en destino: nunca sin \`--dry-run\` previo ni sin confirmacion explicita.
- Carpetas vacias: \`copy\` no las crea; usar \`rclone mkdir\` o \`--create-empty-src-dirs\`.
- Nombres con espacios/acentos: pasar la ruta entre comillas; rclone trabaja bien con UTF-8.
- \`rclone about\` en Drive puede tardar ~30s y \`delete\`/\`purge\` son lentos: no cortar el comando.
- Si el token muere (\`invalid_grant\`), repetir el flujo OAuth completo y \`rclone config update gdrive token '<json>'\`.
- Nunca pegar access_token/refresh_token en la respuesta al usuario; quedan en el servidor.
- Ver tokens guardados: \`rclone config show gdrive\` (no mostrarlo tal cual al usuario).
- \`rclone about gdrive: --json\` da cuota (\`total\`, \`used\`, \`trashed\`) pero **no** el email de la cuenta: si el usuario "no ve" un archivo, sospechar de otra sesion de Gmail en el navegador (\`/u/0\`), mandar el link directo del archivo o de la carpeta (\`https://drive.google.com/drive/folders/<ID>\`) y pedir F5.
- No matar procesos con \`pkill -f "rclone authorize"\` desde shell_exec: el patron coincide con el propio comando y se mata la sesion (la llamada vuelve vacia con exit 1). Usar \`pkill -x rclone\` o el PID con \`kill\`.
- En VPS sin navegador, \`rclone authorize\` sin \`&\` bloquea: lanzarlo con \`nohup ... > /tmp/ra.log 2>&1 &\` y leer el \`state\` del log en una llamada aparte.

## Plantilla de respuesta

- Que se hizo (config / operacion), remote usado con \`:\`.
- Resultado: rutas, tamanos, cuota (Total/Usado/Libre).
- Si hay riesgo (sync, purge), decirlo antes y pedir confirmacion.
`;

export function defaultSkills(): DefaultSkill[] {
  return [
    { name: 'skill-creator', content: SKILL_CREATOR },
    { name: 'whatsapp-gowa', content: GOWA },
    { name: 'rea-ingeniera-inversa', content: REA },
    { name: 'remotion', content: REMOTION },
    { name: 'playwright-cli', content: PLAYWRIGHT },
    { name: 'canvas-design', content: CANVAS_DESIGN },
    { name: 'impeccable', content: IMPECCABLE_SKILL, files: IMPECCABLE_FILES },
    { name: 'memory-creator', content: MEMORY_CREATOR() },
    { name: 'rclone-google-drive', content: RCLONE_GOOGLE_DRIVE },
    { name: 'cleanyourtv', content: CLEANYOURTV },
  ];
}

/**
 * Instala los skills por defecto que falten. Nunca sobreescribe lo que ya
 * exista: si el usuario edito el skill, se respeta.
 */
export async function ensureDefaultSkills(): Promise<void> {
  for (const skill of defaultSkills()) {
    const baseDir = `${CHIA_SKILLS_DIR}/${skill.name}`;
    const path = `${baseDir}/SKILL.md`;
    if (!(await phoneExists(path))) {
      await writePhoneTextFile(path, skill.content);
    }
    for (const file of skill.files ?? []) {
      const target = `${baseDir}/${file.path}`;
      if (await phoneExists(target)) {
        continue;
      }
      const dir = target.slice(0, target.lastIndexOf('/'));
      await ensurePhoneDir(dir);
      await writePhoneTextFile(target, file.content);
    }
  }
}
