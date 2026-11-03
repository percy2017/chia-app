package com.chianative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Puente para [BootReceiver]: guarda en SharedPreferences si la app se abre al
 * arrancar Android (src/boot/native.ts).
 */
class BootModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "Boot"

  @ReactMethod
  fun setEnabled(enabled: Boolean, promise: Promise) {
    try {
      BootPrefs.setEnabled(ctx, enabled)
      promise.resolve(true)
    }
    catch (t: Throwable) {
      promise.reject("boot_set", t.message, t)
    }
  }

  @ReactMethod
  fun enabled(promise: Promise) {
    try {
      promise.resolve(BootPrefs.isEnabled(ctx))
    }
    catch (t: Throwable) {
      promise.reject("boot_get", t.message, t)
    }
  }
}
