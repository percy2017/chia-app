package com.chianative

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

class UpdateModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "Update"

  private fun dir(): File = File(ctx.filesDir, "update").apply { mkdirs() }

  private fun emit(bytes: Long, total: Long) {
    val map = Arguments.createMap()
    map.putDouble("bytes", bytes.toDouble())
    map.putDouble("total", total.toDouble())
    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("UpdateProgress", map)
  }

  @ReactMethod
  fun current(promise: Promise) {
    try {
      val info = ctx.packageManager.getPackageInfo(ctx.packageName, 0)
      val code = if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong()
      promise.resolve(
        Arguments.createMap().apply {
          putDouble("versionCode", code.toDouble())
          putString("versionName", info.versionName ?: "")
          putString("package", ctx.packageName)
        },
      )
    }
    catch (error: Throwable) {
      promise.reject("update_current", error.message ?: error.toString(), error)
    }
  }

  @ReactMethod
  fun canInstall(promise: Promise) {
    try {
      val ok = Build.VERSION.SDK_INT < 26 || ctx.packageManager.canRequestPackageInstalls()
      promise.resolve(ok)
    }
    catch (error: Throwable) {
      promise.reject("update_can", error.message ?: error.toString(), error)
    }
  }

  @ReactMethod
  fun openInstallSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 26) {
        val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
          data = Uri.parse("package:${ctx.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        ctx.startActivity(intent)
      }
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("update_settings", error.message ?: error.toString(), error)
    }
  }

  @ReactMethod
  fun download(url: String, sha256: String, promise: Promise) {
    Thread {
      val target = File(dir(), "chianative.apk")
      val temp = File(dir(), "chianative.apk.part")
      try {
        runCatching { temp.delete() }
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
          requestMethod = "GET"
          connectTimeout = 20000
          readTimeout = 60000
          instanceFollowRedirects = true
          setRequestProperty("User-Agent", "ChiaNative")
          setRequestProperty("Accept", "application/vnd.android.package-archive")
        }
        val code = connection.responseCode
        if (code !in 200..299) {
          connection.disconnect()
          throw IllegalStateException("la descarga respondio $code")
        }
        val total = connection.contentLengthLong.coerceAtLeast(0L)
        val digest = MessageDigest.getInstance("SHA-256")
        var done = 0L
        var last = 0L
        connection.inputStream.use { input ->
          temp.outputStream().use { output ->
            val buffer = ByteArray(256 * 1024)
            while (true) {
              val read = input.read(buffer)
              if (read <= 0) {
                break
              }
              output.write(buffer, 0, read)
              digest.update(buffer, 0, read)
              done += read
              if (done - last >= 1024 * 1024) {
                last = done
                emit(done, total)
              }
            }
          }
        }
        emit(done, total)
        val sha = digest.digest().joinToString("") { "%02x".format(it) }
        if (sha256.isNotBlank() && !sha.equals(sha256.trim(), ignoreCase = true)) {
          temp.delete()
          throw IllegalStateException("el APK descargado no coincide con el publicado")
        }
        if (target.exists()) {
          target.delete()
        }
        if (!temp.renameTo(target)) {
          temp.copyTo(target, overwrite = true)
          temp.delete()
        }
        promise.resolve(
          Arguments.createMap().apply {
            putString("path", target.absolutePath)
            putDouble("bytes", target.length().toDouble())
            putString("sha256", sha)
          },
        )
      }
      catch (error: Throwable) {
        runCatching { temp.delete() }
        promise.reject("update_download", error.message ?: error.toString(), error)
      }
    }.start()
  }

  @ReactMethod
  fun install(path: String, promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 26 && !ctx.packageManager.canRequestPackageInstalls()) {
        promise.reject("update_permission", "Falta permitir instalar apps desconocidas.")
        return
      }
      val file = File(path)
      if (!file.exists()) {
        promise.reject("update_missing", "El APK descargado ya no existe.")
        return
      }
      val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.updates", file)
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("update_install", error.message ?: error.toString(), error)
    }
  }

  @ReactMethod
  fun clear(promise: Promise) {
    try {
      dir().listFiles()?.forEach { it.delete() }
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("update_clear", error.message ?: error.toString(), error)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Double) {
  }
}
