package com.chianative

import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.jcraft.jsch.ChannelExec
import com.jcraft.jsch.ChannelSftp
import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import android.util.Base64
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.OutputStream
import java.io.File
import java.util.Properties
import java.util.concurrent.Executors

private class StreamSink(
  private val sink: ByteArrayOutputStream,
  private val onChunk: (String) -> Unit,
) : OutputStream() {
  override fun write(b: Int) {
    sink.write(b)
    onChunk(String(byteArrayOf(b.toByte()), Charsets.UTF_8))
  }

  override fun write(b: ByteArray, off: Int, len: Int) {
    sink.write(b, off, len)
    if (len > 0) {
      onChunk(String(b, off, len, Charsets.UTF_8))
    }
  }
}

/**
 * Cliente SSH minimo sobre JSch (fork mwiede). Una sesion por conexion y un
 * ChannelExec por comando, sin pooling ni estado compartido.
 */
class ShellModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  private val pool = Executors.newSingleThreadExecutor()
  private var session: Session? = null
  private var connectTimeoutMs = 20000

  override fun getName(): String = "ShellNative"

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Double) {
  }

  private fun emit(chunk: String) {
    if (chunk.isEmpty()) {
      return
    }
    val map = Arguments.createMap()
    map.putString("chunk", chunk)
    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("ShellChunk", map)
  }

  @ReactMethod
  fun connect(
    host: String,
    port: Double,
    username: String,
    password: String,
    timeoutSec: Double,
    promise: Promise,
  ) {
    pool.execute {
      try {
        closeInternal()
        val jsch = JSch()
        val newSession = jsch.getSession(username, host, port.toInt())
        newSession.setPassword(password)
        val config = Properties()
        config["StrictHostKeyChecking"] = "no"
        config["PreferredAuthentications"] = "password,keyboard-interactive"
        config["server_host_key"] = "ssh-ed25519,ecdsa-sha2-nistp256,rsa-sha2-512,ssh-rsa"
        newSession.setConfig(config)
        val limit = if (timeoutSec > 0) (timeoutSec * 1000).toInt() else 20000
        connectTimeoutMs = limit
        newSession.timeout = limit
        newSession.connect(limit)
        session = newSession
        promise.resolve(true)
      }
      catch (error: Throwable) {
        closeInternal()
        promise.reject("ssh_connect", error.message ?: error.toString(), error)
      }
    }
  }

  @ReactMethod
  fun exec(command: String, timeoutMs: Double, promise: Promise) {
    pool.execute {
      var channel: ChannelExec? = null
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }

        val stdout = ByteArrayOutputStream()
        val stderr = ByteArrayOutputStream()
        val execChannel = current.openChannel("exec") as ChannelExec
        channel = execChannel
        execChannel.setCommand(command)
        execChannel.setOutputStream(StreamSink(stdout) { emit(it) }, false)
        execChannel.setErrStream(StreamSink(stderr) { emit(it) }, false)
        execChannel.connect(minOf(15000, connectTimeoutMs))

        val limit = if (timeoutMs > 0) timeoutMs.toLong() else 120000L
        val deadline = System.currentTimeMillis() + limit
        var timedOut = false
        while (!execChannel.isClosed) {
          if (System.currentTimeMillis() > deadline) {
            timedOut = true
            break
          }
          Thread.sleep(15)
        }

        val errors = stderr.toString("UTF-8")
        var output = stdout.toString("UTF-8")
        if (errors.isNotEmpty()) {
          output += errors
        }

        val code = if (timedOut) 124 else execChannel.exitStatus.let { if (it < 0) 1 else it }
        val result = Arguments.createMap()
        result.putInt("exitCode", code)
        result.putString("output", output)
        result.putBoolean("timedOut", timedOut)
        promise.resolve(result)
      }
      catch (error: Throwable) {
        promise.reject("ssh_exec", error.message ?: error.toString(), error)
      }
      finally {
        try {
          channel?.disconnect()
        }
        catch (_: Throwable) {
        }
      }
    }
  }

  @ReactMethod
  fun saveText(fileName: String, content: String, mime: String?, promise: Promise) {
    try {
      val name = if (fileName.contains('.')) fileName else "$fileName.txt"
      val type = (mime?.takeIf { it.isNotBlank() } ?: guessMime(name))
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val values = ContentValues().apply {
          put(MediaStore.MediaColumns.DISPLAY_NAME, name)
          put(MediaStore.MediaColumns.MIME_TYPE, type)
          put(
            MediaStore.MediaColumns.RELATIVE_PATH,
            Environment.DIRECTORY_DOWNLOADS + "/ChiaNative",
          )
        }
        val resolver = ctx.contentResolver
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
          ?: throw IllegalStateException("No se pudo crear el archivo")
        resolver.openOutputStream(uri)?.use { it.write(content.toByteArray(Charsets.UTF_8)) }
          ?: throw IllegalStateException("No se pudo escribir el archivo")
        promise.resolve(
          Arguments.createMap().apply {
            putString("name", name)
            putString("path", "Descargas/ChiaNative/$name")
            putString("uri", uri.toString())
            putString("mime", type)
          },
        )
        return
      }

      val dir = File(ctx.getExternalFilesDir(null), "exports")
      dir.mkdirs()
      val file = File(dir, name)
      file.writeText(content, Charsets.UTF_8)
      promise.resolve(
        Arguments.createMap().apply {
          putString("name", name)
          putString("path", file.absolutePath)
          putString("uri", Uri.fromFile(file).toString())
          putString("mime", type)
        },
      )
    }
    catch (error: Throwable) {
      promise.reject("save_text", error.message ?: error.toString(), error)
    }
  }

  private fun guessMime(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
    "html", "htm" -> "text/html"
    "md" -> "text/markdown"
    "json" -> "application/json"
    "csv" -> "text/csv"
    else -> "text/plain"
  }

  /** ACTION_VIEW sobre el archivo exportado (content:// de MediaStore). */
  @ReactMethod
  fun openFile(uri: String, mime: String?, promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(uri), mime?.takeIf { it.isNotBlank() } ?: "text/html")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("open_file", error.message ?: error.toString(), error)
    }
  }

  @ReactMethod
  fun upload(uri: String, remotePath: String, promise: Promise) {
    pool.execute {
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }
        val input = ctx.contentResolver.openInputStream(Uri.parse(uri))
          ?: throw IllegalStateException("No se pudo leer el archivo.")
        val dir = remotePath.substringBeforeLast('/', ".")
        val mkdir = current.openChannel("exec") as ChannelExec
        mkdir.setCommand("mkdir -p '" + dir + "'")
        mkdir.connect(minOf(10000, connectTimeoutMs))
        while (!mkdir.isClosed) {
          Thread.sleep(20)
        }
        mkdir.disconnect()
        val sftp = current.openChannel("sftp") as ChannelSftp
        sftp.connect(minOf(15000, connectTimeoutMs))
        try {
          input.use { sftp.put(it, remotePath) }
        }
        finally {
          sftp.disconnect()
        }
        promise.resolve(remotePath)
      }
      catch (error: Throwable) {
        promise.reject("ssh_upload", error.message ?: error.toString(), error)
      }
    }
  }

  /**
   * Lee un archivo remoto y lo devuelve en base64 (imagenes para vision).
   * Solo lectura por SFTP: no ejecuta nada en el servidor.
   */
  @ReactMethod
  fun readFile(path: String, maxBytes: Double, promise: Promise) {
    pool.execute {
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }
        val limit = if (maxBytes > 0) maxBytes.toLong() else 4L * 1024 * 1024
        val sftp = current.openChannel("sftp") as ChannelSftp
        sftp.connect(minOf(15000, connectTimeoutMs))
        try {
          val size = sftp.stat(path).size
          if (size > limit) {
            throw IllegalStateException("El archivo pesa " + size + " bytes y el limite es " + limit + ".")
          }
          val out = ByteArrayOutputStream()
          sftp.get(path, out)
          val bytes = out.toByteArray()
          val result = Arguments.createMap()
          result.putString("data", Base64.encodeToString(bytes, Base64.NO_WRAP))
          result.putDouble("size", bytes.size.toDouble())
          result.putBoolean("truncated", false)
          promise.resolve(result)
        }
        finally {
          sftp.disconnect()
        }
      }
      catch (error: Throwable) {
        promise.reject("ssh_read", error.message ?: error.toString(), error)
      }
    }
  }

  /**
   * Escribe un archivo de texto remoto (SFTP), creando el directorio padre.
   * Base para dejar los SKILL.md y el bootstrap de ~/.chia.
   */
  @ReactMethod
  fun writeFile(path: String, content: String, promise: Promise) {
    pool.execute {
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }
        val dir = path.substringBeforeLast('/', ".")
        val mkdir = current.openChannel("exec") as ChannelExec
        mkdir.setCommand("mkdir -p '" + dir + "'")
        mkdir.connect(minOf(10000, connectTimeoutMs))
        while (!mkdir.isClosed) {
          Thread.sleep(20)
        }
        mkdir.disconnect()
        val bytes = content.toByteArray(Charsets.UTF_8)
        val sftp = current.openChannel("sftp") as ChannelSftp
        sftp.connect(minOf(15000, connectTimeoutMs))
        try {
          ByteArrayInputStream(bytes).use { sftp.put(it, path) }
          promise.resolve(path)
        }
        finally {
          sftp.disconnect()
        }
      }
      catch (error: Throwable) {
        promise.reject("ssh_write", error.message ?: error.toString(), error)
      }
    }
  }

  /**
   * Sube un archivo del telefono al VPS (SFTP), creando el directorio padre.
   * Contraparte de `sftpPut`: el modelo mueve archivos entre telefono y VPS.
   */
  @ReactMethod
  fun sftpPut(localPath: String, remotePath: String, promise: Promise) {
    pool.execute {
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }
        val file = File(localPath)
        if (!file.isFile) {
          throw IllegalArgumentException("no es un archivo del telefono: $localPath")
        }
        val dir = remotePath.substringBeforeLast('/', ".")
        val mkdir = current.openChannel("exec") as ChannelExec
        mkdir.setCommand("mkdir -p '" + dir.replace("'", "'\\''") + "'")
        mkdir.connect(minOf(10000, connectTimeoutMs))
        while (!mkdir.isClosed) {
          Thread.sleep(20)
        }
        mkdir.disconnect()
        val sftp = current.openChannel("sftp") as ChannelSftp
        sftp.connect(minOf(15000, connectTimeoutMs))
        try {
          file.inputStream().use { input -> sftp.put(input, remotePath) }
        }
        finally {
          sftp.disconnect()
        }
        val result = Arguments.createMap()
        result.putString("local", file.absolutePath)
        result.putString("remote", remotePath)
        result.putDouble("bytes", file.length().toDouble())
        promise.resolve(result)
      }
      catch (error: Throwable) {
        promise.reject("ssh_sftp_put", error.message ?: error.toString(), error)
      }
    }
  }

  /** Baja un archivo del VPS al telefono, creando el directorio local. */
  @ReactMethod
  fun sftpGet(remotePath: String, localPath: String, maxBytes: Double, promise: Promise) {
    pool.execute {
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }
        val sftp = current.openChannel("sftp") as ChannelSftp
        sftp.connect(minOf(15000, connectTimeoutMs))
        try {
          val attrs = sftp.stat(remotePath)
          if (attrs.isDir) {
            throw IllegalArgumentException("es una carpeta: $remotePath")
          }
          val limit = if (maxBytes > 0) maxBytes.toLong() else 64L * 1024 * 1024
          if (attrs.size > limit) {
            throw IllegalStateException(
              "el archivo pesa " + attrs.size + " bytes y el limite es " + limit,
            )
          }
          val file = File(localPath)
          file.parentFile?.mkdirs()
          file.outputStream().use { output -> sftp.get(remotePath, output) }
          val result = Arguments.createMap()
          result.putString("remote", remotePath)
          result.putString("local", file.absolutePath)
          result.putDouble("bytes", file.length().toDouble())
          promise.resolve(result)
        }
        finally {
          sftp.disconnect()
        }
      }
      catch (error: Throwable) {
        promise.reject("ssh_sftp_get", error.message ?: error.toString(), error)
      }
    }
  }

  /** Lista un directorio remoto (o stat de un archivo) por SFTP. */
  @ReactMethod
  fun sftpList(path: String, promise: Promise) {
    pool.execute {
      try {
        val current = session
        if (current == null || !current.isConnected) {
          throw IllegalStateException("SSH no conectado.")
        }
        val target = if (path.isBlank()) "." else path
        val sftp = current.openChannel("sftp") as ChannelSftp
        sftp.connect(minOf(15000, connectTimeoutMs))
        try {
          val attrs = sftp.stat(target)
          if (!attrs.isDir) {
            val single = Arguments.createMap()
            single.putString("path", target)
            single.putBoolean("dir", false)
            single.putDouble("size", attrs.size.toDouble())
            single.putDouble("mtime", attrs.getMTime().toLong() * 1000.0)
            promise.resolve(single)
          }
          else {
            val listing = sftp.ls(target) as java.util.Vector<*>
            val entries = ArrayList<ChannelSftp.LsEntry>()
            for (raw in listing) {
              val entry = raw as? ChannelSftp.LsEntry ?: continue
              if (entry.filename == "." || entry.filename == "..") {
                continue
              }
              entries.add(entry)
            }
            entries.sortWith(
              compareByDescending<ChannelSftp.LsEntry> { it.attrs.isDir }
                .thenBy { it.filename.lowercase() },
            )
            val typed = Arguments.createArray()
            for (entry in entries) {
              val item = Arguments.createMap()
              item.putString("name", entry.filename)
              item.putBoolean("dir", entry.attrs.isDir)
              item.putBoolean("link", entry.attrs.isLink)
              item.putDouble("size", entry.attrs.size.toDouble())
              item.putDouble("mtime", entry.attrs.getMTime().toLong() * 1000.0)
              item.putInt("perms", entry.attrs.permissions)
              typed.pushMap(item)
            }
            val result = Arguments.createMap()
            result.putString("path", target)
            result.putBoolean("dir", true)
            result.putInt("count", typed.size())
            result.putArray("entries", typed)
            promise.resolve(result)
          }
        }
        finally {
          sftp.disconnect()
        }
      }
      catch (error: Throwable) {
        promise.reject("ssh_sftp_list", error.message ?: error.toString(), error)
      }
    }
  }

  @ReactMethod
  fun disconnect(promise: Promise) {
    pool.execute {
      try {
        closeInternal()
        promise.resolve(true)
      }
      catch (error: Throwable) {
        promise.reject("ssh_disconnect", error.message ?: error.toString(), error)
      }
    }
  }

  private fun closeInternal() {
    try {
      session?.disconnect()
    }
    catch (_: Throwable) {
    }
    session = null
  }

  override fun invalidate() {
    closeInternal()
    pool.shutdownNow()
    super.invalidate()
  }
}
