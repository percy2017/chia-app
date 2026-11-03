package com.chianative

import android.media.MediaPlayer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest

/** Reproduce archivos de audio locales (grabaciones del telefono). */
class AudioModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  private var player: MediaPlayer? = null

  init {
    purgeOrphans()
  }

  private companion object {
    /** Audios de voz guardados en el telefono (uno por texto). */
    const val MAX_FILES = 200
  }

  override fun getName(): String = "AudioNative"

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Double) {
  }

  private fun emit(event: String) {
    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, null)
  }

  private fun start(file: File, promise: Promise) {
    stopInternal()
    val newPlayer = MediaPlayer()
    newPlayer.setDataSource(file.absolutePath)
    newPlayer.setOnCompletionListener { emit("AudioDone") }
    newPlayer.setOnErrorListener { _, _, _ ->
      emit("AudioDone")
      true
    }
    newPlayer.prepare()
    newPlayer.start()
    player = newPlayer
    promise.resolve(newPlayer.duration / 1000.0)
  }

  /** Reproduce un archivo local cualquiera (audio grabado por el usuario). */
  @ReactMethod
  fun playFile(path: String, promise: Promise) {
    try {
      val file = File(path)
      if (!file.exists() || file.length() < 512) {
        promise.reject("audio_missing", "El archivo de audio ya no existe.")
        return
      }
      start(file, promise)
    }
    catch (error: Throwable) {
      stopInternal()
      promise.reject("audio_play", error.message ?: error.toString(), error)
    }
  }

  /** Pide el audio al servidor de voz (/tts) y lo reproduce. */
  @ReactMethod
  fun speak(baseUrl: String, token: String, voz: String, idioma: String, text: String, promise: Promise) {
    Thread {
      try {
        val clean = baseUrl.trimEnd('/')
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          promise.reject("audio_url", "La url base del servidor de voz no es valida.")
          return@Thread
        }
        // Un MP3 por guion: si ya se genero, se reutiliza (no se vuelve a pedir).
        val dir = sayDir().apply { mkdirs() }
        val voice = if (voz == "hombre") "hombre" else "mujer"
        val lang = idioma.trim().lowercase().ifEmpty { "es" }
        val file = File(dir, "${cacheKey(clean, token, "$voice|$lang", text)}.mp3")
        if (file.exists() && file.length() >= 512) {
          file.setLastModified(System.currentTimeMillis())
          start(file, promise)
          return@Thread
        }
        val body = JSONObject()
          .put("texto", text)
          .put("voz", voice)
          .put("idioma", lang)
          .toString()
          .toByteArray(Charsets.UTF_8)
        val connection = (URL("$clean/tts").openConnection() as HttpURLConnection).apply {
          requestMethod = "POST"
          connectTimeout = 60000
          readTimeout = 600000
          doOutput = true
          setRequestProperty("Content-Type", "application/json")
          if (token.isNotBlank()) {
            setRequestProperty("Authorization", "Bearer $token")
          }
        }
        connection.outputStream.use { it.write(body) }
        val code = connection.responseCode
        if (code !in 200..299) {
          val detail = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
          connection.disconnect()
          promise.reject("audio_tts", "El servidor de voz respondio $code. $detail".trim())
          return@Thread
        }
        val bytes = connection.inputStream.use { it.readBytes() }
        connection.disconnect()
        if (bytes.size < 512) {
          promise.reject("audio_tts", "El servidor de voz devolvio un audio vacio.")
          return@Thread
        }
        file.writeBytes(bytes)
        prune(dir, file)
        start(file, promise)
      }
      catch (error: Throwable) {
        stopInternal()
        promise.reject("audio_tts", error.message ?: error.toString(), error)
      }
    }.start()
  }

  private fun sayDir(): File = File(File(ctx.filesDir, "say"), "v2")

  /**
   * Borra los audios del esquema viejo (texto crudo) que quedaron sueltos en
   * `filesDir/say`: ahora todo vive en `say/v2` y con clave por guion.
   */
  private fun purgeOrphans() {
    try {
      File(ctx.filesDir, "say").listFiles()?.forEach { file ->
        if (file.isFile) {
          file.delete()
        }
      }
    }
    catch (_: Throwable) {
    }
  }

  /** Clave estable por servidor + credencial + voz + texto (evita colisiones). */
  /** Clave estable por servidor + credencial + voz + texto (evita colisiones). */
  private fun cacheKey(baseUrl: String, token: String, voz: String, text: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
      .digest("$baseUrl|$token|$voz|$text".toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it.toInt() and 0xFF) }.take(32)
  }

  /** Tope de audios guardados: se borran los mas viejos. */
  private fun prune(dir: File, keep: File) {
    try {
      val files = dir.listFiles()?.filter { it.isFile && it != keep } ?: return
      if (files.size < MAX_FILES) {
        return
      }
      files.sortedBy { it.lastModified() }
        .take(files.size - MAX_FILES + 1)
        .forEach { it.delete() }
    }
    catch (_: Throwable) {
    }
  }

  /** Manda la grabacion al servidor de voz (/stt) y devuelve el texto. */
  @ReactMethod
  fun transcribe(baseUrl: String, token: String, path: String, idioma: String, promise: Promise) {
    Thread {
      try {
        val clean = baseUrl.trimEnd('/')
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          promise.reject("audio_url", "La url base del servidor de voz no es valida.")
          return@Thread
        }
        val file = File(path)
        if (!file.exists()) {
          promise.reject("audio_missing", "La grabacion ya no existe.")
          return@Thread
        }
        val boundary = "chia${System.currentTimeMillis()}"
        val lang = idioma.trim().lowercase().ifEmpty { "es" }
        val connection = (URL("$clean/stt?idioma=${URLEncoder.encode(lang, "UTF-8")}").openConnection() as HttpURLConnection).apply {
          requestMethod = "POST"
          connectTimeout = 60000
          readTimeout = 600000
          doOutput = true
          setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
          if (token.isNotBlank()) {
            setRequestProperty("Authorization", "Bearer $token")
          }
        }
        connection.outputStream.use { output ->
          val name = file.name
          val mime = if (name.endsWith(".wav")) "audio/wav" else "audio/mp4"
          output.write(
            ("--$boundary\r\n"
              + "Content-Disposition: form-data; name=\"audio\"; filename=\"$name\"\r\n"
              + "Content-Type: $mime\r\n\r\n").toByteArray(Charsets.UTF_8),
          )
          file.inputStream().use { it.copyTo(output) }
          output.write("\r\n--$boundary--\r\n".toByteArray(Charsets.UTF_8))
        }
        val code = connection.responseCode
        val body = if (code in 200..299) {
          connection.inputStream?.bufferedReader()?.use { it.readText() } ?: ""
        }
        else {
          connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
        }
        connection.disconnect()
        if (code !in 200..299) {
          promise.reject("audio_stt", "El servidor de voz respondio $code. $body".trim())
          return@Thread
        }
        promise.resolve(body)
      }
      catch (error: Throwable) {
        promise.reject("audio_stt", error.message ?: error.toString(), error)
      }
    }.start()
  }

  @ReactMethod
  fun stop(promise: Promise) {
    stopInternal()
    promise.resolve(true)
  }

  private fun stopInternal() {
    try {
      player?.let {
        if (it.isPlaying) {
          it.stop()
        }
        it.release()
      }
    }
    catch (_: Throwable) {
    }
    player = null
  }

  override fun invalidate() {
    stopInternal()
    super.invalidate()
  }
}
