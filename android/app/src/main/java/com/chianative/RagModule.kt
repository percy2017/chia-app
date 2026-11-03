package com.chianative

import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

class RagModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "RagNative"

  private fun dir(): File = File(ctx.filesDir, "docs").apply { mkdirs() }

  private companion object {
    const val MAX_BYTES = 25L * 1024 * 1024
  }

  /**
   * Copia a filesDir/docs/<sha256>.<ext> (dedupe por contenido). Acepta
   * content:// del selector, una ruta del telefono o una URL http(s).
   */
  @ReactMethod
  fun store(uri: String, name: String, promise: Promise) {
    Thread {
      val temp = File(dir(), "tmp-${System.currentTimeMillis()}")
      try {
        val parsed = Uri.parse(uri)
        val scheme = parsed.scheme?.lowercase() ?: ""
        val stream = when {
          scheme == "content" -> ctx.contentResolver.openInputStream(parsed)
            ?: throw IllegalStateException("no se pudo abrir el archivo")
          scheme == "http" || scheme == "https" -> {
            val connection = (URL(uri).openConnection() as HttpURLConnection).apply {
              requestMethod = "GET"
              connectTimeout = 15000
              readTimeout = 120000
              instanceFollowRedirects = true
              setRequestProperty("User-Agent", "ChiaNative")
            }
            if (connection.responseCode !in 200..299) {
              val code = connection.responseCode
              connection.disconnect()
              throw IllegalStateException("la descarga respondio $code")
            }
            connection.inputStream
          }
          else -> File(parsed.path ?: uri).inputStream()
        }
        stream.use { input ->
          temp.outputStream().use { output -> input.copyTo(output) }
        }
        val digest = MessageDigest.getInstance("SHA-256")
        temp.inputStream().use { input ->
          val buffer = ByteArray(64 * 1024)
          while (true) {
            val read = input.read(buffer)
            if (read <= 0) {
              break
            }
            digest.update(buffer, 0, read)
          }
        }
        if (temp.length() > MAX_BYTES) {
          temp.delete()
          throw IllegalStateException("el archivo pasa de 25 MB")
        }
        val sha = digest.digest().joinToString("") { "%02x".format(it) }
        val ext = name.substringAfterLast('.', "").lowercase()
        val safeExt = if (ext.matches(Regex("[a-z0-9]{1,6}"))) ".$ext" else ""
        val target = File(dir(), "$sha$safeExt")
        if (target.exists()) {
          temp.delete()
        }
        else {
          if (!temp.renameTo(target)) {
            temp.copyTo(target, overwrite = true)
            temp.delete()
          }
        }
        promise.resolve(
          JSONObject()
            .put("path", target.absolutePath)
            .put("sha256", sha)
            .put("bytes", target.length())
            .put("name", name)
            .toString(),
        )
      }
      catch (error: Throwable) {
        runCatching { temp.delete() }
        promise.reject("rag_store", error.message ?: error.toString(), error)
      }
    }.start()
  }

  /** POST /embed multipart: vectoriza el documento (chunks + vectores). */
  @ReactMethod
  fun embed(baseUrl: String, token: String, path: String, promise: Promise) {
    Thread {
      try {
        val clean = baseUrl.trimEnd('/')
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          promise.reject("rag_url", "La url base del Studio API no es valida.")
          return@Thread
        }
        val file = File(path)
        if (!file.exists()) {
          promise.reject("rag_missing", "El archivo ya no existe.")
          return@Thread
        }
        val boundary = "chia${System.currentTimeMillis()}"
        val connection = (URL("$clean/embed").openConnection() as HttpURLConnection).apply {
          requestMethod = "POST"
          connectTimeout = 15000
          readTimeout = 180000
          doOutput = true
          setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
          if (token.isNotBlank()) {
            setRequestProperty("Authorization", "Bearer $token")
          }
        }
        connection.outputStream.use { output ->
          val mime = mimeFor(file.name)
          output.write(
            ("--$boundary\r\n"
              + "Content-Disposition: form-data; name=\"file\"; filename=\"${file.name}\"\r\n"
              + "Content-Type: $mime\r\n\r\n").toByteArray(Charsets.UTF_8),
          )
          file.inputStream().use { input -> input.copyTo(output) }
          output.write("\r\n--$boundary--\r\n".toByteArray(Charsets.UTF_8))
        }
        val code = connection.responseCode
        if (code !in 200..299) {
          val detail = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
          connection.disconnect()
          promise.reject("rag_embed", "El Studio API respondio $code. $detail".trim())
          return@Thread
        }
        val body = connection.inputStream.use { it.bufferedReader().readText() }
        connection.disconnect()
        promise.resolve(body)
      }
      catch (error: Throwable) {
        promise.reject("rag_embed", error.message ?: error.toString(), error)
      }
    }.start()
  }

  /** POST /embed JSON: vector de una consulta (tipo consulta) o de un texto. */
  @ReactMethod
  fun embedText(baseUrl: String, token: String, text: String, tipo: String, promise: Promise) {
    Thread {
      try {
        val clean = baseUrl.trimEnd('/')
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          promise.reject("rag_url", "La url base del Studio API no es valida.")
          return@Thread
        }
        val body = JSONObject()
          .put("texto", text)
          .put("tipo", if (tipo == "documento") "documento" else "consulta")
          .toString()
          .toByteArray(Charsets.UTF_8)
        val connection = (URL("$clean/embed").openConnection() as HttpURLConnection).apply {
          requestMethod = "POST"
          connectTimeout = 15000
          readTimeout = 60000
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
          promise.reject("rag_embed", "El Studio API respondio $code. $detail".trim())
          return@Thread
        }
        val raw = connection.inputStream.use { it.bufferedReader().readText() }
        connection.disconnect()
        promise.resolve(raw)
      }
      catch (error: Throwable) {
        promise.reject("rag_embed", error.message ?: error.toString(), error)
      }
    }.start()
  }

  /** Borra el archivo copiado en filesDir/docs (solo dentro de esa carpeta). */
  @ReactMethod
  fun remove(path: String, promise: Promise) {
    Thread {
      try {
        val file = File(path)
        val root = dir().canonicalPath
        if (!file.canonicalPath.startsWith(root)) {
          promise.reject("rag_path", "ruta fuera de la carpeta docs: $path")
          return@Thread
        }
        if (file.exists() && !file.delete()) {
          promise.reject("rag_remove", "no se pudo borrar el archivo")
          return@Thread
        }
        promise.resolve(true)
      }
      catch (error: Throwable) {
        promise.reject("rag_remove", error.message ?: error.toString(), error)
      }
    }.start()
  }

  private fun mimeFor(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
    "pdf" -> "application/pdf"
    "doc" -> "application/msword"
    "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    "xls" -> "application/vnd.ms-excel"
    "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    "ppt" -> "application/vnd.ms-powerpoint"
    "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    "odt" -> "application/vnd.oasis.opendocument.text"
    "ods" -> "application/vnd.oasis.opendocument.spreadsheet"
    "odp" -> "application/vnd.oasis.opendocument.presentation"
    "rtf" -> "application/rtf"
    "html", "htm" -> "text/html"
    "json" -> "application/json"
    "xml" -> "application/xml"
    "csv" -> "text/csv"
    "md" -> "text/markdown"
    "jpg", "jpeg" -> "image/jpeg"
    "png" -> "image/png"
    "tif", "tiff" -> "image/tiff"
    else -> "text/plain"
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Double) {
  }
}
