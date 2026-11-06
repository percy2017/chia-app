export const CLEANYOURTV = `---
name: cleanyourtv
description: Limpia (debloat) un Android TV o Google TV por ADB y le pone un launcher limpio tipo Apple TV. Usalo cuando la tele tenga anuncios, filas patrocinadas, apps preinstaladas de la marca, telemetria, o vaya lenta.
compatibility: VPS en la misma red que la TV (o Tailscale), git, python3, adb en el PATH, JDK 17-22 y Android SDK platform 34 + build-tools 34.x para compilar el launcher.
---

# CleanYourTV (debloat + launcher de Android TV / Google TV)

Repo oficial: \`https://github.com/Gathin23/cleanyourtv\` (sitio: cleanyour.tv). Es una coleccion de
scripts + un launcher Android nativo. **No se reescribe nada a mano**: se clona el repo y se usan sus
scripts, que ya traen el backup, el registro de restore y la proteccion de Home.

## Antes de tocar nada: ¿se puede?

1. Tiene que ser **Android TV o Google TV**. Si es Samsung (Tizen), LG (webOS), Roku, VIDAA o
   SmartCast: **no se puede**; avisa y ofrece apagar el seguimiento con el control (cleanyour.tv/not-android).
2. El VPS tiene que **llegar a la TV en su red local** (o por Tailscale). Si el VPS esta en un
   datacenter no ve la LAN del cliente: pregunta si el cliente puede exponer la TV por Tailscale
   (\`docs/REMOTE.md\`) o si prefiere hacerlo desde su PC (las mismas recetas en PowerShell).
3. En la TV: Ajustes → Sistema/Dispositivo → **Informacion** → OK 7 veces en *Compilar* → atras →
   **Opciones de desarrollador** → activar **Depuracion USB** (y *Depuracion de red/ADB* si aparece).
   Dejar la TV encendida. El dialogo *"¿Permitir depuracion USB?"* se acepta en la TV.
4. Avisa: en algunas cajas la depuracion USB **corta la alimentacion del puerto USB** (un disco o
   adaptador Ethernet USB puede morir hasta apagarla) → terminar todo en una sola sesion.

## Preparar el VPS

\`\`\`bash
git clone https://github.com/Gathin23/cleanyourtv && cd cleanyourtv
python3 -m venv tools/venv && tools/venv/bin/pip install -r tools/requirements.txt
export TV_HOST=<ip-de-la-tv>
tools/venv/bin/python -I tools/tv.py --probe        # modelo, version de Android, firmware
\`\`\`

- \`tools/tv.py\` es un cliente ADB en Python puro (shell, push, pull, screenshots); sirve cuando el
  \`adb\` del sistema no esta o esta bloqueado. Todo lo demas va por \`tools/venv/bin/python -I tools/tv.py '<comando>'\`.
- Puerto por defecto **5555**. Si esta cerrado y la TV solo ofrece *Depuracion inalambrica con codigo*
  (Chromecast con Google TV, Google TV Streamer): pedir el codigo y el puerto al usuario, \`adb pair\`,
  \`adb connect\` y \`adb tcpip 5555\`. Algun firmware usa otro puerto fijo (se vio 5877): probar los
  puertos abiertos de la TV con \`TV_PORT\`.
- Si lo que falla es *"No route to host"* con el \`adb\` del sistema (macOS), no depurar: usar el venv.
- Si el VPS es un sandbox sin salida a la LAN: el usuario corre \`tools/relay.py <ip-tv>\` en su PC y
  se usa \`TV_HOST=127.0.0.1 TV_PORT=15555\`.

## Paso 1: backup (obligatorio)

Antes de desactivar **nada**, guardar en una carpeta del VPS:

\`\`\`bash
mkdir -p ~/tv-backup-$(date +%F)
tools/venv/bin/python -I tools/tv.py 'pm list packages'          > ~/tv-backup-$(date +%F)/packages.txt
tools/venv/bin/python -I tools/tv.py 'pm list packages -d'       > ~/tv-backup-$(date +%F)/disabled.txt
tools/venv/bin/python -I tools/tv.py 'getprop'                   > ~/tv-backup-$(date +%F)/getprop.txt
tools/venv/bin/python -I tools/tv.py 'settings list global'      > ~/tv-backup-$(date +%F)/settings-global.txt
tools/venv/bin/python -I tools/tv.py 'settings list secure'      > ~/tv-backup-$(date +%F)/settings-secure.txt
\`\`\`

El undo real lo escribe \`tools/recovery.py\` dentro de \`tools/disable.sh\`: es el que registra el estado
previo. Aun asi, la carpeta de backup se queda: es lo que se restaura si el cliente cambia de TV.

## Paso 2: elegir la lista de debloat

- \`examples/\` tiene ~450 modelos. Buscar el modelo real de la TV (\`examples/<marca-modelo>/debloat.txt\`).
  \`tools/match.py packages.txt\` dice, para cada paquete instalado, **en cuantas listas** se desactiva y
  la nota mas comun; los paquetes nucleo de Android salen como \`never\` (no se tocan nunca).
- Sin modelo exacto: \`tools/privacy.py <ip>\` audita voz, ACR y telemetria y con \`--write\` genera una
  lista que \`disable.sh\` y \`restore.sh\` ya entienden.
- **Preguntar antes de desactivar** lo que el cliente pueda usar: asistente de voz, Chromecast,
  actualizaciones del sistema, tienda, apps de la marca, canales en vivo. Nada de desactivar a ciegas.

## Paso 3: aplicar y verificar

\`\`\`bash
TV_HOST=<ip> tools/disable.sh examples/<modelo>/debloat.txt
\`\`\`

- El script **no deja la TV sin Home**: solo desactiva un launcher de fabrica reconocido, y salta el
  Home de la lista hasta que otro launcher responda HOME. Nada se desinstala (\`pm disable-user\`), por
  eso \`tools/restore.sh\` deshace todo.
- Verificar con capturas, no de palabra:
  \`tools/venv/bin/python -I tools/tv.py --screenshot /tmp/tv1.png\` (y variantes con teclas del control,
  ver \`--help\`) y leer la imagen con \`read\`.

## Paso 4: launcher (opcional pero es el objetivo)

\`\`\`bash
TV_HOST=<ip> launcher/build-and-install.sh
\`\`\`

- Compila un release de ~572 KB, lo instala, pone Home y **hace rollback si Home no queda en el**.
- Necesita JDK 17-22 (JDK 23+ rompe Gradle 8.9) y Android SDK **platform 34** + build-tools 34.x.
  Sin SDK en el VPS: \`tools/docker-build.sh\` construye en Docker y se instala con \`SKIP_BUILD=1\`.
- Configuracion visual en \`launcher/app/src/main/res/values/config.xml\` (dock, columnas, saludo,
  \`show_stats\`, temas). Se edita **antes** de compilar; para cambiar solo colores/tema despues:
  \`tools/theme.sh themes/<tema>\` (\`--reset\` lo quita).
- Personalizar = preguntar: que apps usa a diario y en que orden, tamano del dock, si conserva el
  asistente de voz, Chromecast y actualizaciones.

## Despues

- **Actualizacion de firmware**: vuelve a activar bloat. \`tools/check.py <lista>\` dice que se reabrio;
  con \`--fix\` lo vuelve a desactivar.
- **Restaurar todo**: \`TV_HOST=<ip> tools/restore.sh examples/<modelo>/debloat.txt\` (en Google TV,
  agregar el launcher de fabrica con \`-Stock\`; el README trae el ejemplo \`com.google.android.apps.tv.launcherx\`).
- Al terminar, recordar apagar la depuracion USB en la TV y correr \`tools/adb-closed.py\` para
  confirmar que el puerto 5555 quedo cerrado.
- \`tools/bench.py\` mide latencia de teclas, jank, arranque en frio y CPU/PSS del launcher; sirve para
  demostrar la mejora antes/despues sin cambiar nada de la TV.

## Reglas

- Nunca inventar nombres de paquetes ni de archivos: el modelo manda, se busca en \`examples/\` y se
  confirma con \`pm list packages\` de esa TV.
- Nada de \`pm uninstall\` (el repo no desinstala) ni de \`pm disable-user --user 0\` a mano si el
  script ya lo hace: se pierden el registro y el undo.
- Salida larga a archivo (\`> log 2>&1\`) y se lee con \`tail -c\`/\`grep\`: la tool corta en \`maxChars\`.
- Cero credenciales o IPs fijas en la respuesta: la IP de la TV se descubre o se pregunta.
- El cliente ve su tele: cada cambio raro se confirma con captura antes de seguir.
`;
