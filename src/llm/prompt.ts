import { getToolsConfig } from '../settings/store';
import { environmentSection } from '../device/environment';
import { composeSystemPrompt, harnessRules } from './harness';

export function shellToolDescription(): string {
  const tools = getToolsConfig();
  return `Ejecuta un comando POSIX en el servidor remoto (SSH). Devuelve stdout+stderr, exit_code e is_error.
- Proceso nuevo por llamada: no persisten cd, variables ni trabajos; usa rutas absolutas o encadena con &&.
- Sin TTY: nada de editores, paginadores ni confirmaciones (usa -y, -f o stdin desde /dev/null).
- Procesos largos: nohup/setsid/tmux con salida a archivo; revisa luego con ps, logs o tail.
- exit_code != 0 es fallo real: lee el error y corrigelo.
- Sin VPS configurado (host, usuario y password o clave) devuelve "falta configuracion del VPS": pedile al usuario que lo cargue en Configuracion > Hosting Web y seguí con las tools del telefono o web.
- Texto en archivos: read/edit/write. shell queda para lo demas (mover, permisos, paquetes, procesos).
Limites: ${tools.maxChars} chars de salida (inicio y final); el comando no tiene tope de tiempo. No supongas root, sudo, systemd ni gestor de paquetes.`;
}

export function readToolDescription(): string {
  const tools = getToolsConfig();
  return `Lee un archivo de texto o imagen (vision): VPS por SSH (defecto) o telefono con target:"phone" (/sdcard).
- Texto: hasta ${tools.maxBytesKb} KB por llamada (usa offset/limit para paginar). Si queda contenido lo avisa al final ("Use offset=N to continue"): repite con offset o acota con limit.
- Imagenes (jpg, png, gif, webp, bmp): llegan como adjunto; maximo ${Math.round(tools.maxBytes / 1024)} KB.
- No escribe: para cambiar usa edit (puntual) o write (completo).
- target: "vps" (defecto) o "phone" (mismos path, offset y limit).`;
}

export function editToolDescription(): string {
  const tools = getToolsConfig();

  return `Edita texto en el VPS (defecto) o en el telefono (target:"phone") con reemplazos exactos.
- edits[] busca en el archivo ORIGINAL, no en cadena: cada oldText unico y sin solapes; varios cambios = varios edits en una llamada.
- oldText literal de read (espacios y saltos incluidos). Si no coincide, el error lo dice: relee, no adivines.
- Archivo nuevo o reescritura completa: write. Mover, permisos, borrar: shell_exec o android_phone files.*.
- Devuelve resumen + hunk con lineas; no hace falta releer.
Limite: ${tools.maxBytesKb} KB, UTF-8.`;
}

export function writeToolDescription(): string {
  const tools = getToolsConfig();
  return `Crea o reescribe un archivo de texto completo: VPS por SSH (defecto) o telefono con target:"phone" (/sdcard).
- Crea el archivo y las carpetas que falten; si ya existe lo pisa entero.
- Solo para archivos nuevos o reescrituras completas. Cambios puntuales: edit.
- No agrega al final (read + edit).
Limites: ${Math.round(tools.maxBytes / 1024)} KB, solo texto UTF-8. target: "vps" (defecto) o "phone".`;
}

export function phoneToolDescription(): string {
  const tools = getToolsConfig();
  return `Tu Android, una accion por llamada:
- specs {device|soc|cpu|memory|storage|display|battery|camera|sensors|features|drm|network|all}, sensors.read {sensor: accelerometer|gyroscope|magnetometer|light|proximity|pressure|step|rotation|gravity|linear, seconds<=10}, location.once {timeoutSec}, torch {on}, vibrate {ms}, url.open {url}, clipboard.get|set {text} (app abierta), perm.request {permission: location|camera|wifi}.
- apps.list {limit}, apps.open|info|settings|uninstall|store {package} (info=ficha, settings=Ajustes), apps.usage {days<=30, limit}, apps.usageSettings (acceso Datos de uso).
- notifications: list {limit, filter, includeRemoved}, settings.
- medios: sessions (reproductores activos con titulo/artista), state {package} (que suena ahora), control {action: play|pause|toggle|next|prev|stop|seek, package, positionMs} (cambiar de cancion = next), volume {action: up|down|mute|unmute|set, percent}. package o app opcional (vacío = el reproductor en curso); usa el mismo acceso a notificaciones.
- files (~ = /sdcard): list {path, limit, showHidden}, stat, mkdir {path}, delete {path, recursive}, move {from, to, overwrite, copy}, search {path, query, maxDepth, limit, showHidden}, settings. TEXTO por read/edit/write target:"phone".
- net: scan {subnet, ports, seconds, threads} (ambos los decides tu), probe {host, port}, dns {host}, http {url, method, headers, body, timeoutSec} (respuesta hasta ${Math.round(tools.maxBytes / 1024)} KB), wifi.scan.
- bluetooth: status, list (vinculados), scan {seconds<=30} (cercanos con rssi), pair {address}, connect|disconnect {address} (A2DP/manos libres), enable {on} (abre el dialogo del sistema), settings. address = MAC AA:BB:CC:DD:EE:FF.
Reglas: enabled:false = falta permiso que solo da el usuario (abri *.settings y pedilo). Sin root: camara/NFC/wifi/avion en background ni /data/data ajeno. Tope ${tools.maxChars} chars.`;
}

export function ragToolDescription(): string {
  return `Memoria a largo plazo: indexa archivos en vectores (Studio API /embed) y busca en ellos.
- action index {url | path, name?}: descarga la URL o lee la ruta del telefono (/sdcard/...) y la indexa. Formatos: pdf, doc/docx, xls/xlsx, ppt/pptx, odt/ods/odp, rtf, txt/md/csv/html, json/xml e imagenes jpg/png/tiff (OCR). Max 25 MB. Si ya estaba (mismo contenido) no lo repite.
- action search {query, doc?, limit<=10}: fragmentos mas parecidos de todos los documentos o de uno (doc = nombre, parte del nombre o id).
- action list {}: documentos indexados (nombre, paginas, fragmentos, fecha).
- action read {doc, from?, limit?}: fragmentos consecutivos de un documento, para leerlo completo por partes.
- action forget {doc}: borra un documento del indice y su archivo.
Usala cuando la respuesta pueda estar en sus archivos, y para guardar un archivo que te pasen por URL (la descarga la hace la app en el telefono). Todo ocurre en el telefono: no hace falta el VPS ni shell_exec. Cita el documento y la pagina en la respuesta.`;
}

export function webFetchToolDescription(): string {
  const tools = getToolsConfig();
  return `Descarga una URL http(s) y devuelve el contenido como texto.
- HTML se convierte a texto; tambien JSON, XML y texto. PDF/binarios solo metadatos.
- Devuelve url, status, content_type, bytes, chars y truncated.
- Si truncated, repite con offset; find devuelve solo pasajes que contengan ese texto.
- mode: texto (defecto) o raw (cuerpo exacto).
- No guarda archivos: es lectura.
Limites: ${tools.maxChars} chars y ${Math.round(tools.maxBytes / 1024)} KB por descarga.`;
}

export function buildSystemPrompt(basePrompt: string): string {
  return composeSystemPrompt(basePrompt, harnessRules(), environmentSection());
}
