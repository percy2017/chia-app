package com.chianative

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import kotlin.math.max

/**
 * Selector de adjuntos. Devuelve la imagen ya en base64 (para vision) o la
 * referencia al archivo (uri) para subirlo por SFTP.
 */
class AttachModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  private var pending: Promise? = null
  private var pendingImage = false

  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_PICK) {
        return
      }
      val promise = pending
      pending = null
      if (promise == null) {
        return
      }
      if (resultCode != Activity.RESULT_OK) {
        promise.resolve(null)
        return
      }
      val uri = data?.data
      if (uri == null) {
        promise.resolve(null)
        return
      }
      try {
        promise.resolve(describe(uri, pendingImage))
      }
      catch (error: Throwable) {
        promise.reject("attach_read", error.message ?: error.toString(), error)
      }
    }
  }

  init {
    ctx.addActivityEventListener(listener)
  }

  override fun getName(): String = "AttachNative"

  @ReactMethod
  fun pickImage(promise: Promise) {
    open(promise, image = true)
  }

  @ReactMethod
  fun pickFile(promise: Promise) {
    open(promise, image = false)
  }

  @ReactMethod
  fun readText(uri: String, promise: Promise) {
    try {
      val text = ctx.contentResolver.openInputStream(Uri.parse(uri))?.use { input ->
        input.readBytes().toString(Charsets.UTF_8)
      } ?: ""
      promise.resolve(text)
    }
    catch (error: Throwable) {
      promise.reject("attach_read", error.message ?: error.toString(), error)
    }
  }

  private fun open(promise: Promise, image: Boolean) {
    if (pending != null) {
      promise.reject("attach_busy", "Ya hay un selector abierto.")
      return
    }
    val activity = ctx.currentActivity ?: run {
      promise.reject("attach_no_activity", "La app no esta en primer plano.")
      return
    }
    pending = promise
    pendingImage = image
    try {
      val intent = if (image) {
        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          type = "image/*"
          putExtra(Intent.EXTRA_MIME_TYPES, IMAGE_MIME_TYPES)
        }
      }
      else {
        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          type = "*/*"
        }
      }
      activity.startActivityForResult(intent, REQUEST_PICK)
    }
    catch (error: Throwable) {
      pending = null
      promise.reject("attach_open", error.message ?: error.toString(), error)
    }
  }

  private fun describe(uri: Uri, withData: Boolean) = Arguments.createMap().apply {
    var name = ""
    var size = 0L
    ctx.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (nameIndex >= 0) {
          name = cursor.getString(nameIndex) ?: ""
        }
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) {
          size = cursor.getLong(sizeIndex)
        }
      }
    }
    val mime = ctx.contentResolver.getType(uri) ?: "application/octet-stream"
    putString("uri", uri.toString())
    putString("name", name.ifEmpty { "adjunto" })
    putString("mimeType", mime)
    putDouble("size", size.toDouble())
    if (withData) {
      val encoded = encodeImage(uri)
      if (encoded != null) {
        putString("mimeType", "image/jpeg")
        putDouble("size", encoded.bytes.size.toDouble())
        putDouble("width", encoded.width.toDouble())
        putDouble("height", encoded.height.toDouble())
        putString("data", Base64.encodeToString(encoded.bytes, Base64.NO_WRAP))
        if (name.contains('.')) {
          putString("name", name.substringBeforeLast('.') + ".jpg")
        }
      }
      else {
        val bytes = readBytes(uri)
        if (size <= 0) {
          putDouble("size", bytes.size.toDouble())
        }
        putString("data", Base64.encodeToString(bytes, Base64.NO_WRAP))
      }
    }
  }

  private data class EncodedImage(val bytes: ByteArray, val width: Int, val height: Int)

  private fun readBytes(uri: Uri): ByteArray {
    return ctx.contentResolver.openInputStream(uri)?.use { input ->
      ByteArrayOutputStream().also { output -> input.copyTo(output) }.toByteArray()
    } ?: ByteArray(0)
  }

  private fun encodeImage(uri: Uri): EncodedImage? {
    try {
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      val boundsStream = ctx.contentResolver.openInputStream(uri) ?: return null
      boundsStream.use { input -> BitmapFactory.decodeStream(input, null, bounds) }
      if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
        return null
      }
      val options = BitmapFactory.Options().apply {
        inSampleSize = sampleSize(bounds.outWidth, bounds.outHeight)
      }
      val decoded = ctx.contentResolver.openInputStream(uri)?.use { input ->
        BitmapFactory.decodeStream(input, null, options)
      } ?: return null
      val upright = rotate(decoded, orientation(uri))
      val scaled = scale(upright)
      val width = scaled.width
      val height = scaled.height
      val output = ByteArrayOutputStream()
      val ok = scaled.compress(Bitmap.CompressFormat.JPEG, QUALITY, output)
      if (scaled !== upright && scaled !== decoded) {
        scaled.recycle()
      }
      if (upright !== decoded) {
        upright.recycle()
        decoded.recycle()
      }
      else if (decoded !== scaled) {
        decoded.recycle()
      }
      if (!ok) {
        return null
      }
      return EncodedImage(output.toByteArray(), width, height)
    }
    catch (error: Throwable) {
      return null
    }
  }

  private fun sampleSize(width: Int, height: Int): Int {
    var sample = 1
    while (max(width, height) / (sample * 2) >= DECODE_MIN) {
      sample *= 2
    }
    return sample
  }

  private fun scale(bitmap: Bitmap): Bitmap {
    val largest = max(bitmap.width, bitmap.height)
    if (largest <= MAX_SIDE) {
      return bitmap
    }
    val factor = MAX_SIDE.toFloat() / largest
    return Bitmap.createScaledBitmap(
      bitmap,
      max(1, (bitmap.width * factor).toInt()),
      max(1, (bitmap.height * factor).toInt()),
      true,
    )
  }

  @Suppress("DEPRECATION")
  private fun orientation(uri: Uri): Int {
    return try {
      ctx.contentResolver.openInputStream(uri)?.use { input ->
        ExifInterface(input).getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_NORMAL,
        )
      } ?: ExifInterface.ORIENTATION_NORMAL
    }
    catch (error: Throwable) {
      ExifInterface.ORIENTATION_NORMAL
    }
  }

  private fun rotate(bitmap: Bitmap, orientation: Int): Bitmap {
    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
      else -> return bitmap
    }
    return try {
      Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }
    catch (error: Throwable) {
      bitmap
    }
  }

  override fun invalidate() {
    ctx.removeActivityEventListener(listener)
    pending = null
    super.invalidate()
  }

  companion object {
    private const val REQUEST_PICK = 12001
    private const val MAX_SIDE = 1568
    private const val DECODE_MIN = MAX_SIDE * 3 / 4
    private const val QUALITY = 85

    private val IMAGE_MIME_TYPES = arrayOf(
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
      "image/bmp",
    )
  }
}
