package com.chianative

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

/**
 * Graba la voz del usuario en el telefono.
 *
 * Formato: MPEG_4 / AAC 16 kHz mono 32 kbps (~1,2 MB cada 5 min).
 * Archivo: filesDir/rec/<id>.m4a.
 * Emite `RecordLevel` {rms} cada 100 ms para las barras de nivel.
 */
class RecordModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  private var recorder: MediaRecorder? = null
  private var current: File? = null
  private var startedAt = 0L
  private val handler = Handler(Looper.getMainLooper())
  private var ticker: Runnable? = null

  override fun getName(): String = "RecordNative"

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Double) {
  }

  private fun dir(): File = File(ctx.filesDir, "rec").apply { mkdirs() }

  private fun granted(): Boolean =
    ctx.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

  @ReactMethod
  fun hasPermission(promise: Promise) {
    promise.resolve(granted())
  }

  /** Abre el dialogo del sistema; hay que reintentar cuando el usuario acepte. */
  @ReactMethod
  fun requestPermission(promise: Promise) {
    val activity: Activity? = ctx.currentActivity
    if (activity == null) {
      promise.reject("E_PERM_UI", "Abre la app y reintenta: no hay actividad para el dialogo.")
      return
    }
    if (granted()) {
      promise.resolve(true)
      return
    }
    activity.requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST)
    promise.resolve(false)
  }

  @ReactMethod
  fun start(promise: Promise) {
    if (!granted()) {
      promise.reject("E_PERM", "Falta el permiso de microfono: concedelo y reintenta.")
      return
    }
    try {
      stopInternal(delete = true)
      val file = File(dir(), "rec-${System.currentTimeMillis()}.m4a")
      val rec = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        MediaRecorder(ctx)
      }
      else {
        @Suppress("DEPRECATION")
        MediaRecorder()
      }
      rec.setAudioSource(MediaRecorder.AudioSource.MIC)
      rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
      rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
      rec.setAudioChannels(1)
      rec.setAudioSamplingRate(16000)
      rec.setAudioEncodingBitRate(32000)
      rec.setOutputFile(file.absolutePath)
      rec.prepare()
      rec.start()
      recorder = rec
      current = file
      startedAt = System.currentTimeMillis()
      startTicker()
      val result = Arguments.createMap()
      result.putString("path", file.absolutePath)
      promise.resolve(result)
    }
    catch (t: Throwable) {
      stopInternal(delete = true)
      promise.reject("E_RECORD", t.message ?: "no se pudo iniciar la grabacion", t)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    val file = current
    if (recorder == null || file == null) {
      promise.reject("E_RECORD", "No hay grabacion en curso.")
      return
    }
    val duration = System.currentTimeMillis() - startedAt
    try {
      stopInternal(delete = false)
      val result = Arguments.createMap()
      result.putString("path", file.absolutePath)
      result.putDouble("durationMs", duration.toDouble())
      result.putDouble("bytes", file.length().toDouble())
      result.putString("mime", "audio/mp4")
      promise.resolve(result)
    }
    catch (t: Throwable) {
      stopInternal(delete = true)
      promise.reject("E_RECORD", t.message ?: "no se pudo cerrar la grabacion", t)
    }
  }

  /** Cancela y borra el archivo: el usuario se arrepintio. */
  @ReactMethod
  fun cancel(promise: Promise) {
    stopInternal(delete = true)
    promise.resolve(true)
  }

  private fun startTicker() {
    stopTicker()
    val runnable = object : Runnable {
      override fun run() {
        val rec = recorder ?: return
        val amplitude = try {
          rec.maxAmplitude
        }
        catch (_: Throwable) {
          0
        }
        val map = Arguments.createMap()
        // 0..1: maxAmplitude va de 0 a 32767.
        map.putDouble("rms", (amplitude / 32767.0).coerceIn(0.0, 1.0))
        map.putDouble("elapsedMs", (System.currentTimeMillis() - startedAt).toDouble())
        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("RecordLevel", map)
        handler.postDelayed(this, 100)
      }
    }
    ticker = runnable
    handler.postDelayed(runnable, 100)
  }

  private fun stopTicker() {
    ticker?.let { handler.removeCallbacks(it) }
    ticker = null
  }

  private fun stopInternal(delete: Boolean) {
    stopTicker()
    try {
      recorder?.stop()
    }
    catch (_: Throwable) {
      // stop() sin datos suficientes (grabacion de 0 s) lanza: se ignora.
    }
    try {
      recorder?.release()
    }
    catch (_: Throwable) {
    }
    recorder = null
    val file = current
    current = null
    startedAt = 0L
    if (delete) {
      runCatching { file?.delete() }
    }
  }

  /** Cierra la grabacion si React Native se destruye a mitad. */
  override fun invalidate() {
    stopInternal(delete = true)
    super.invalidate()
  }

  private companion object {
    const val REQUEST = 4712
  }
}
