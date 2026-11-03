package com.chianative

import android.Manifest
import android.app.ActivityManager
import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.display.DisplayManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.media.AudioManager
import android.media.MediaDrm
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.Process
import android.os.StatFs
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.telephony.TelephonyManager
import android.util.Base64
import android.view.Display
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.ByteArrayOutputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.Socket
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import org.json.JSONArray
import org.json.JSONObject

/**
 * Tool `phone`: datos y control del telefono desde el agente.
 *
 * Solo APIs publicas de Android. Lo que el sistema no deja hacer en segundo
 * plano (camara, NFC, conectar WiFi, modo avion) o lo que exige dialogo del
 * usuario se devuelve como error para que el modelo lo explique. Las lecturas
 * devuelven JSON serializado; los comandos, un booleano.
 */
class PhoneModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "Phone"

  // ---------------------------------------------------------------- specs
  @ReactMethod
  fun specs(section: String, promise: Promise) {
    try {
      promise.resolve(sectionJson(section.lowercase()).toString())
    }
    catch (error: Throwable) {
      promise.reject("E_SPECS", error.message ?: "no se pudo leer la ficha", error)
    }
  }

  private fun sectionJson(section: String): JSONObject {
    val known = listOf(
      "device", "soc", "cpu", "memory", "storage", "display",
      "battery", "camera", "sensors", "features", "drm", "network",
    )
    val all = section.isEmpty() || section == "all"
    if (!all && section !in known) {
      return JSONObject().put(
        "error",
        "seccion desconocida: $section. Usa: all, ${known.joinToString(", ")}",
      )
    }
    val out = JSONObject()
    if (all || section == "device") out.put("device", deviceJson())
    if (all || section == "soc") out.put("soc", socJson())
    if (all || section == "cpu") out.put("cpu", cpuJson())
    if (all || section == "memory") out.put("memory", memoryJson())
    if (all || section == "storage") out.put("storage", storageJson())
    if (all || section == "display") out.put("display", displayJson())
    if (all || section == "battery") out.put("battery", batteryJson())
    if (all || section == "camera") out.put("camera", cameraJson())
    if (all || section == "sensors") out.put("sensors", sensorsJson())
    if (all || section == "features") out.put("features", featuresJson())
    if (all || section == "drm") out.put("drm", drmJson())
    if (all || section == "network") out.put("network", networkJson())
    return out
  }

  private fun deviceJson(): JSONObject = JSONObject().apply {
    put("manufacturer", Build.MANUFACTURER)
    put("brand", Build.BRAND)
    put("model", Build.MODEL)
    put("device", Build.DEVICE)
    put("product", Build.PRODUCT)
    put("hardware", Build.HARDWARE)
    put("board", Build.BOARD)
    put("bootloader", Build.BOOTLOADER)
    put("buildId", Build.ID)
    put("buildType", Build.TYPE)
    put("fingerprint", Build.FINGERPRINT)
    put("android", Build.VERSION.RELEASE)
    put("sdk", Build.VERSION.SDK_INT)
    put("codename", Build.VERSION.CODENAME)
    put("securityPatch", if (Build.VERSION.SDK_INT >= 23) Build.VERSION.SECURITY_PATCH else null)
    put("abis", JSONArray(Build.SUPPORTED_ABIS.toList()))
    put("kernel", System.getProperty("os.version") ?: "")
    put("uptimeSec", SystemClock.elapsedRealtime() / 1000)
    val locale = ctx.resources.configuration.locales.get(0)
    put("locale", locale.toString())
    put("timezone", java.util.TimeZone.getDefault().id)
  }

  private fun socJson(): JSONObject = JSONObject().apply {
    put("hardware", Build.HARDWARE)
    put("board", Build.BOARD)
    if (Build.VERSION.SDK_INT >= 31) {
      put("model", Build.SOC_MODEL)
      put("manufacturer", Build.SOC_MANUFACTURER)
    }
    readText("/proc/cpuinfo")?.lineSequence()?.forEach { line ->
      val parts = line.split(":", limit = 2)
      if (parts.size == 2) {
        val key = parts[0].trim().lowercase()
        if (key == "hardware" || key == "processor" || key == "model name") {
          putIfAbsent(key.replace(' ', '_'), parts[1].trim())
        }
      }
    }
  }

  private fun cpuJson(): JSONObject = JSONObject().apply {
    put("cores", Runtime.getRuntime().availableProcessors())
    val freqs = JSONArray()
    var index = 0
    while (index < 32) {
      val base = "/sys/devices/system/cpu/cpu$index"
      val max = readText("$base/cpufreq/cpuinfo_max_freq")?.toLongOrNull()
      if (!File(base).exists()) {
        break
      }
      if (max != null) {
        freqs.put(max / 1000)
      }
      index += 1
    }
    put("maxFreqMhz", freqs)
    put("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "")
  }

  private fun memoryJson(): JSONObject = JSONObject().apply {
    val manager = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val info = ActivityManager.MemoryInfo()
    manager.getMemoryInfo(info)
    put("totalMb", info.totalMem / (1024 * 1024))
    put("availMb", info.availMem / (1024 * 1024))
    put("thresholdMb", info.threshold / (1024 * 1024))
    put("lowMemory", info.lowMemory)
    put("lowRamDevice", manager.isLowRamDevice)
  }

  private fun storageJson(): JSONObject = JSONObject().apply {
    val data = StatFs(Environment.getDataDirectory().absolutePath)
    put("internalTotalMb", data.totalBytes / (1024 * 1024))
    put("internalFreeMb", data.availableBytes / (1024 * 1024))
    val ext = Environment.getExternalStorageDirectory()
    if (ext != null && ext.exists()) {
      val stat = StatFs(ext.absolutePath)
      put("externalTotalMb", stat.totalBytes / (1024 * 1024))
      put("externalFreeMb", stat.availableBytes / (1024 * 1024))
    }
    put("emulated", Environment.isExternalStorageEmulated())
  }

  private fun displayJson(): JSONObject = JSONObject().apply {
    val metrics = ctx.resources.displayMetrics
    put("widthPx", metrics.widthPixels)
    put("heightPx", metrics.heightPixels)
    put("densityDpi", metrics.densityDpi)
    put("density", metrics.density.toDouble())
    put("xdpi", metrics.xdpi.toDouble())
    put("ydpi", metrics.ydpi.toDouble())
    val manager = ctx.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
    val display: Display? = manager.getDisplay(Display.DEFAULT_DISPLAY)
    if (display != null) {
      val mode = display.mode
      put("realWidthPx", mode.physicalWidth)
      put("realHeightPx", mode.physicalHeight)
      put("refreshHz", mode.refreshRate.toDouble())
      put("modes", JSONArray(display.supportedModes.map {
        JSONObject()
          .put("width", it.physicalWidth)
          .put("height", it.physicalHeight)
          .put("refreshHz", it.refreshRate.toDouble())
      }))
      if (Build.VERSION.SDK_INT >= 24) {
        val caps = display.hdrCapabilities
        if (caps != null) {
          put(
            "hdr",
            JSONArray(caps.supportedHdrTypes.map { hdrName(it) }),
          )
          put("maxLuminance", caps.desiredMaxLuminance.toDouble())
        }
      }
    }
  }

  private fun hdrName(type: Int): String = when (type) {
    1 -> "DOLBY_VISION"
    2 -> "HDR10"
    3 -> "HLG"
    4 -> "HDR10_PLUS"
    else -> "TYPE_$type"
  }

  private fun batteryJson(): JSONObject = JSONObject().apply {
    val manager = ctx.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
    put("levelPct", manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY))
    put(
      "charging",
      manager.isCharging,
    )
    val status = ctx.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    if (status != null) {
      put("health", healthName(status.getIntExtra(BatteryManager.EXTRA_HEALTH, -1)))
      put("plugged", pluggedName(status.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1)))
      put("temperatureC", status.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) / 10.0)
      put("voltage", status.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1))
      put("technology", status.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY) ?: "")
      put("present", status.getBooleanExtra(BatteryManager.EXTRA_PRESENT, true))
    }
    batteryCapacityMah()?.let { put("designCapacityMah", it) }
  }

  private fun batteryCapacityMah(): Double? {
    try {
      val cls = Class.forName("com.android.internal.os.PowerProfile")
      val instance = cls.getConstructor(Context::class.java).newInstance(ctx)
      val value = cls.getMethod("getBatteryCapacity").invoke(instance) as Number
      if (value.toDouble() > 0) {
        return value.toDouble()
      }
    }
    catch (_: Throwable) {
    }
    val design = readText("/sys/class/power_supply/battery/charge_full_design")?.toDoubleOrNull()
    return design?.div(1000.0)
  }

  private fun healthName(value: Int): String = when (value) {
    BatteryManager.BATTERY_HEALTH_GOOD -> "good"
    BatteryManager.BATTERY_HEALTH_COLD -> "cold"
    BatteryManager.BATTERY_HEALTH_DEAD -> "dead"
    BatteryManager.BATTERY_HEALTH_OVERHEAT -> "overheat"
    BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "over_voltage"
    BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE -> "failure"
    else -> "unknown"
  }

  private fun pluggedName(value: Int): String = when (value) {
    BatteryManager.BATTERY_PLUGGED_AC -> "ac"
    BatteryManager.BATTERY_PLUGGED_USB -> "usb"
    BatteryManager.BATTERY_PLUGGED_WIRELESS -> "wireless"
    else -> "unplugged"
  }

  private fun cameraJson(): JSONObject = JSONObject().apply {
    val manager = ctx.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    val ids = try {
      manager.cameraIdList
    }
    catch (error: SecurityException) {
      put("error", "requiere permiso CAMERA: ${error.message}")
      return@apply
    }
    val list = JSONArray()
    for (id in ids) {
      val item = JSONObject().put("id", id)
      try {
        val c = manager.getCameraCharacteristics(id)
        val size = c.get(CameraCharacteristics.SENSOR_INFO_PIXEL_ARRAY_SIZE)
        item.put("megapixels", if (size != null) round1(size.width * size.height / 1_000_000.0) else 0.0)
        item.put("facing", facingName(c.get(CameraCharacteristics.LENS_FACING)))
        item.put("flash", c.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true)
        item.put(
          "apertures",
          JSONArray((c.get(CameraCharacteristics.LENS_INFO_AVAILABLE_APERTURES) ?: floatArrayOf()).map { it.toDouble() }),
        )
        item.put(
          "focalMm",
          JSONArray((c.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS) ?: floatArrayOf()).map { it.toDouble() }),
        )
        val config = c.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
        val video = config?.getOutputSizes(android.media.MediaRecorder::class.java)
        if (video != null && video.isNotEmpty()) {
          val max = video.maxByOrNull { it.width.toLong() * it.height }
          if (max != null) {
            item.put("maxVideo", "${max.width}x${max.height}")
          }
        }
      }
      catch (error: Throwable) {
        item.put("error", error.message ?: "sin acceso a caracteristicas")
      }
      list.put(item)
    }
    put("cameras", list)
  }

  private fun facingName(value: Int?): String = when (value) {
    CameraCharacteristics.LENS_FACING_FRONT -> "front"
    CameraCharacteristics.LENS_FACING_BACK -> "back"
    CameraCharacteristics.LENS_FACING_EXTERNAL -> "external"
    else -> "unknown"
  }

  private fun sensorsJson(): JSONObject = JSONObject().apply {
    val manager = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val list = JSONArray()
    for (sensor in manager.getSensorList(Sensor.TYPE_ALL)) {
      list.put(
        JSONObject()
          .put("name", sensor.name)
          .put("vendor", sensor.vendor)
          .put("type", sensorTypeName(sensor.type))
          .put("powerMa", sensor.power.toDouble())
          .put("maxRange", sensor.maximumRange.toDouble())
          .put("resolution", sensor.resolution.toDouble()),
      )
    }
    put("sensors", list)
  }

  private fun featuresJson(): JSONObject = JSONObject().apply {
    val names = ctx.packageManager.systemAvailableFeatures
      .mapNotNull { it.name }
      .sorted()
    put("features", JSONArray(names))
  }

  private fun drmJson(): JSONObject = JSONObject().apply {
    val uuid = UUID.fromString("edef8ba9-79d6-4ace-a3c8-27dcd51d21ed")
    var drm: MediaDrm? = null
    try {
      val instance = MediaDrm(uuid)
      drm = instance
      put("widevine", JSONObject().apply {
        put("vendor", instance.getPropertyString("vendor"))
        put("version", instance.getPropertyString("version"))
        put("securityLevel", tryProperty(instance, "securityLevel"))
        put("hdcpLevel", tryProperty(instance, "hdcpLevel"))
      })
    }
    catch (error: Throwable) {
      put("widevine", JSONObject().put("error", error.message ?: "no disponible"))
    }
    finally {
      try {
        drm?.release()
      }
      catch (_: Throwable) {
      }
    }
  }

  private fun tryProperty(drm: MediaDrm, name: String): String = try {
    drm.getPropertyString(name) ?: ""
  }
  catch (_: Throwable) {
    ""
  }

  private fun networkJson(): JSONObject = JSONObject().apply {
    val manager = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val caps = manager.getNetworkCapabilities(manager.activeNetwork)
    if (caps == null) {
      put("connected", false)
    }
    else {
      val transports = ArrayList<String>()
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) transports.add("wifi")
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) transports.add("cellular")
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) transports.add("ethernet")
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) transports.add("vpn")
      put("connected", caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET))
      put("validated", caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED))
      put("transports", JSONArray(transports))
      put("downKbps", caps.linkDownstreamBandwidthKbps)
      put("upKbps", caps.linkUpstreamBandwidthKbps)
      put("metered", !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED))
    }
    val telephony = ctx.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    runCatching { telephony.networkOperatorName }.onSuccess { put("operator", it ?: "") }
    runCatching { telephony.simOperatorName }.onSuccess { put("simOperator", it ?: "") }
    runCatching { telephony.networkType }.onSuccess { put("networkType", it) }
    val ips = JSONArray()
    runCatching {
      NetworkInterface.getNetworkInterfaces().toList()
        .filter { it.isUp && !it.isLoopback }
        .flatMap { it.inetAddresses.toList() }
        .filter { !it.isLoopbackAddress }
        .forEach { ips.put(it.hostAddress ?: "") }
    }
    put("addresses", ips)
  }

  // ---------------------------------------------------------- sensors.read
  @ReactMethod
  fun sensorsRead(sensor: String, seconds: Double, promise: Promise) {
    val manager = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val type = sensorType(sensor.lowercase())
    if (type == null) {
      promise.reject("E_SENSOR", "sensor desconocido: $sensor")
      return
    }
    val target = manager.getDefaultSensor(type)
    if (target == null) {
      promise.reject("E_SENSOR", "el telefono no tiene sensor $sensor")
      return
    }
    val window = seconds.coerceIn(1.0, 10.0)
    val samples = ArrayList<FloatArray>()
    val listener = object : SensorEventListener {
      override fun onSensorChanged(event: SensorEvent) {
        if (samples.size < MAX_SAMPLES) {
          samples.add(event.values.copyOf())
        }
      }

      override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
      }
    }
    val handler = Handler(Looper.getMainLooper())
    var finished = false
    val stop = {
      if (!finished) {
        finished = true
        manager.unregisterListener(listener)
        resolveSamples(promise, sensor, target, samples)
      }
    }
    try {
      manager.registerListener(listener, target, 20_000, handler)
    }
    catch (error: Throwable) {
      promise.reject("E_SENSOR", error.message ?: "no se pudo leer el sensor", error)
      return
    }
    handler.postDelayed(stop, (window * 1000).toLong())
  }

  private fun resolveSamples(
    promise: Promise,
    name: String,
    sensor: Sensor,
    samples: List<FloatArray>,
  ) {
    try {
      val axes = if (samples.isEmpty()) 0 else samples[0].size
      val axesJson = JSONArray()
      for (axis in 0 until axes) {
        var min = Float.MAX_VALUE
        var max = -Float.MAX_VALUE
        var sum = 0.0
        for (sample in samples) {
          val value = sample[axis]
          if (value < min) min = value
          if (value > max) max = value
          sum += value
        }
        axesJson.put(
          JSONObject()
            .put("min", round3(min.toDouble()))
            .put("max", round3(max.toDouble()))
            .put("mean", round3(if (samples.isEmpty()) 0.0 else sum / samples.size)),
        )
      }
      val last = JSONArray(samples.lastOrNull()?.map { round3(it.toDouble()) } ?: emptyList<Double>())
      promise.resolve(
        JSONObject()
          .put("sensor", name)
          .put("androidType", sensorTypeName(sensor.type))
          .put("samples", samples.size)
          .put("axes", axesJson)
          .put("last", last)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_SENSOR", error.message ?: "error leyendo el sensor", error)
    }
  }

  // --------------------------------------------------------- location.once
  @ReactMethod
  fun countryCode(promise: Promise) {
    try {
      val telephony = ctx.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
      val sim = listOfNotNull(telephony?.networkCountryIso, telephony?.simCountryIso)
        .firstOrNull { it.length == 2 }
      if (sim != null) {
        promise.resolve(JSONObject().put("iso", sim.uppercase()).put("source", "sim").toString())
        return
      }
      val locale = ctx.resources.configuration.locales.get(0).country
      if (locale.length == 2) {
        promise.resolve(JSONObject().put("iso", locale.uppercase()).put("source", "locale").toString())
        return
      }
      val fromLocation = geocodedCountry()
      if (fromLocation != null) {
        promise.resolve(JSONObject().put("iso", fromLocation).put("source", "location").toString())
        return
      }
      promise.resolve(JSONObject().put("iso", "").put("source", "none").toString())
    }
    catch (error: Throwable) {
      promise.reject("E_COUNTRY", error.message ?: "sin pais", error)
    }
  }

  /** ISO2 del ultimo fix conocido via Geocoder (necesita permiso de ubicacion). */
  private fun geocodedCountry(): String? {
    if (!granted(Manifest.permission.ACCESS_FINE_LOCATION)
      && !granted(Manifest.permission.ACCESS_COARSE_LOCATION)
    ) {
      return null
    }
    if (!Geocoder.isPresent()) {
      return null
    }
    val manager = ctx.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
    val last = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
      .mapNotNull { provider -> runCatching { manager.getLastKnownLocation(provider) }.getOrNull() }
      .maxByOrNull { it.time } ?: return null
    val address = runCatching {
      Geocoder(ctx, java.util.Locale.getDefault()).getFromLocation(last.latitude, last.longitude, 1)
    }.getOrNull()?.firstOrNull() ?: return null
    val iso = address.countryCode ?: return null
    return if (iso.length == 2) iso.uppercase() else null
  }

  @ReactMethod
  fun locationOnce(timeoutSec: Double, promise: Promise) {
    if (!granted(Manifest.permission.ACCESS_FINE_LOCATION)
      && !granted(Manifest.permission.ACCESS_COARSE_LOCATION)
    ) {
      requestPermissions(arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
      ))
      promise.reject(
        "E_PERM",
        "permiso de ubicacion no concedido: se abrio el dialogo del sistema; el usuario debe aceptar y hay que reintentar",
      )
      return
    }
    val manager = ctx.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val providers = listOf(
      LocationManager.GPS_PROVIDER,
      LocationManager.NETWORK_PROVIDER,
    ).filter { manager.isProviderEnabled(it) }
    if (providers.isEmpty()) {
      promise.reject("E_LOCATION", "ubicacion desactivada en el sistema")
      return
    }
    // Primero el ultimo fix conocido: instantaneo y suficiente casi siempre.
    val last = providers
      .mapNotNull { provider -> runCatching { manager.getLastKnownLocation(provider) }.getOrNull() }
      .maxByOrNull { it.time }
    if (last != null && System.currentTimeMillis() - last.time < 60_000) {
      promise.resolve(locationJson(last).toString())
      return
    }

    val timeoutMs = (timeoutSec.coerceIn(3.0, 30.0) * 1000).toLong()
    val handler = Handler(Looper.getMainLooper())
    var settled = false
    lateinit var listener: LocationListener

    fun finish(location: Location?, error: String?) {
      if (settled) {
        return
      }
      settled = true
      handler.removeCallbacksAndMessages(null)
      runCatching { manager.removeUpdates(listener) }
      if (location != null) {
        promise.resolve(locationJson(location).toString())
      }
      else {
        promise.reject("E_LOCATION", error ?: "sin fix de ubicacion")
      }
    }

    listener = object : LocationListener {
      override fun onLocationChanged(location: Location) {
        finish(location, null)
      }

      @Deprecated("Deprecated in Java")
      override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {
      }

      override fun onProviderEnabled(provider: String) {
      }

      override fun onProviderDisabled(provider: String) {
      }
    }

    try {
      for (provider in providers) {
        manager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
      }
    }
    catch (error: SecurityException) {
      finish(null, "sin permiso de ubicacion: ${error.message}")
      return
    }
    handler.postDelayed({ finish(null, "sin fix en ${timeoutSec.toInt()} s") }, timeoutMs)
  }

  private fun locationJson(location: Location): JSONObject = JSONObject()
    .put("provider", location.provider ?: "")
    .put("lat", round6(location.latitude))
    .put("lon", round6(location.longitude))
    .put("accuracyM", round1(location.accuracy.toDouble()))
    .put("altitudeM", round1(location.altitude))
    .put("speedMps", round1(location.speed.toDouble()))
    .put("bearing", round1(location.bearing.toDouble()))
    .put("ageSec", ((System.currentTimeMillis() - location.time) / 1000))

  // ----------------------------------------------------------- comandos
  @ReactMethod
  fun torch(on: Boolean, promise: Promise) {
    try {
      val manager = ctx.getSystemService(Context.CAMERA_SERVICE) as CameraManager
      val id = manager.cameraIdList.firstOrNull {
        manager.getCameraCharacteristics(it).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
      } ?: throw IllegalStateException("el telefono no tiene flash")
      manager.setTorchMode(id, on)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_TORCH", error.message ?: "no se pudo controlar la linterna", error)
    }
  }

  @ReactMethod
  fun vibrate(ms: Double, promise: Promise) {
    try {
      val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= 31) {
        (ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
      }
      else {
        @Suppress("DEPRECATION")
        ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      }
      vibrator.vibrate(VibrationEffect.createOneShot(ms.toLong().coerceIn(10, 2000), VibrationEffect.DEFAULT_AMPLITUDE))
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_VIBRATE", error.message ?: "no se pudo vibrar", error)
    }
  }

  @ReactMethod
  fun listApps(limit: Double, promise: Promise) {
    try {
      val pm = ctx.packageManager
      val max = limit.toInt().coerceIn(1, 500)
      val rows = ArrayList<JSONObject>()
      for (pkg in pm.getInstalledPackages(0)) {
        val info = pkg.applicationInfo ?: continue
        val label = runCatching { pm.getApplicationLabel(info).toString() }
          .getOrDefault(pkg.packageName)
        rows.add(
          JSONObject()
            .put("package", pkg.packageName)
            .put("label", label)
            .put("version", pkg.versionName ?: "")
            .put("system", (info.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0),
        )
      }
      rows.sortBy { it.optString("label").lowercase() }
      promise.resolve(
        JSONObject()
          .put("count", rows.size)
          .put("apps", JSONArray(rows.take(max)))
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_APPS", error.message ?: "no se pudo listar apps", error)
    }
  }

  @ReactMethod
  fun openApp(pkg: String, promise: Promise) {
    try {
      val intent = ctx.packageManager.getLaunchIntentForPackage(pkg)
        ?: throw IllegalArgumentException("app no instalada o sin activity de arranque: $pkg")
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_OPENAPP", error.message ?: "no se pudo abrir $pkg", error)
    }
  }

  /** Ficha completa de una app instalada. */
  @ReactMethod
  fun appInfo(pkg: String, promise: Promise) {
    try {
      val pm = ctx.packageManager
      val info = pm.getPackageInfo(pkg, PackageManager.GET_PERMISSIONS)
      val app = info.applicationInfo
        ?: throw IllegalArgumentException("sin datos de aplicacion: $pkg")
      val label = runCatching { pm.getApplicationLabel(app).toString() }.getOrDefault(pkg)
      val apk = File(app.sourceDir)
      val permissions = JSONArray()
      info.requestedPermissions?.forEach { permissions.put(it) }
      val installer = installerOf(pm, pkg)
      promise.resolve(
        JSONObject()
          .put("package", pkg)
          .put("label", label)
          .put("version", info.versionName ?: "")
          .put(
            "versionCode",
            if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong(),
          )
          .put("system", (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0)
          .put("enabled", app.enabled)
          .put("launchable", pm.getLaunchIntentForPackage(pkg) != null)
          .put("targetSdk", app.targetSdkVersion)
          .put("minSdk", app.minSdkVersion)
          .put("uid", app.uid)
          .put("apkPath", app.sourceDir)
          .put("apkKb", apk.length() / 1024)
          .put("installedAt", info.firstInstallTime)
          .put("updatedAt", info.lastUpdateTime)
          .put("installer", installer)
          .put("permissions", permissions)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_APPINFO", error.message ?: "no se pudo leer $pkg", error)
    }
  }

  private fun installerOf(pm: PackageManager, pkg: String): String {
    if (Build.VERSION.SDK_INT >= 30) {
      return runCatching { pm.getInstallSourceInfo(pkg).installingPackageName }
        .getOrNull() ?: ""
    }
    @Suppress("DEPRECATION")
    val legacy = pm.getInstallerPackageName(pkg)
    return legacy ?: ""
  }

  /** Pantalla de la app en Ajustes (forzar detencion, borrar datos, desinstalar). */
  @ReactMethod
  fun appSettings(pkg: String, promise: Promise) {
    try {
      val intent = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.parse("package:$pkg"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_APPSETTINGS", error.message ?: "no se pudo abrir $pkg en Ajustes", error)
    }
  }

  /** Dialogo de desinstalacion del sistema (el usuario confirma, no hay silencioso). */
  @ReactMethod
  fun uninstallApp(pkg: String, promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_DELETE, Uri.parse("package:$pkg"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject(
        "E_UNINSTALL",
        error.message ?: "no se pudo pedir la desinstalacion de $pkg (app de sistema o sin gestor)",
        error,
      )
    }
  }

  /** Play Store u otra tienda: market:// con fallback a la web. */
  @ReactMethod
  fun openStore(pkg: String, promise: Promise) {
    try {
      val market = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        ctx.startActivity(market)
        promise.resolve("market://details?id=$pkg")
      }
      catch (_: Throwable) {
        val web = Intent(
          Intent.ACTION_VIEW,
          Uri.parse("https://play.google.com/store/apps/details?id=$pkg"),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(web)
        promise.resolve("https://play.google.com/store/apps/details?id=$pkg")
      }
    }
    catch (error: Throwable) {
      promise.reject("E_STORE", error.message ?: "no se pudo abrir la tienda de $pkg", error)
    }
  }

  /**
   * Uso de apps (tiempo en primer plano y ultimo uso) via UsageStatsManager.
   * Requiere el acceso especial "Datos de uso", que se concede a mano.
   */
  @ReactMethod
  fun appsUsage(days: Double, limit: Double, promise: Promise) {
    try {
      if (!usageAccess()) {
        promise.resolve(
          JSONObject()
            .put("enabled", false)
            .put("count", 0)
            .put("apps", JSONArray())
            .put(
              "hint",
              "Falta el acceso a datos de uso: Ajustes > Acceso a datos de uso > ChiaNative " +
                "(o `adb shell appops set com.chianative GET_USAGE_STATS allow`). Abre esa " +
                "pantalla con apps.usageSettings y reintenta.",
            )
            .toString(),
        )
        return
      }
      val manager = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val end = System.currentTimeMillis()
      val window = days.toInt().coerceIn(1, 30)
      val begin = end - window * DAY_MS
      val stats = manager.queryAndAggregateUsageStats(begin, end)
      val rows = ArrayList<JSONObject>()
      val pm = ctx.packageManager
      val now = System.currentTimeMillis()
      for ((pkg, value) in stats) {
        if (value.totalTimeInForeground <= 0L && value.lastTimeUsed <= 0L) {
          continue
        }
        val label = runCatching {
          pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
        }.getOrDefault(pkg)
        rows.add(
          JSONObject()
            .put("package", pkg)
            .put("app", label)
            .put("foregroundMs", value.totalTimeInForeground)
            .put("foregroundMin", value.totalTimeInForeground / 60000L)
            .put("lastUsed", value.lastTimeUsed)
            .put("agoSec", ((now - value.lastTimeUsed) / 1000).coerceAtLeast(0)),
        )
      }
      rows.sortByDescending { it.optLong("foregroundMs") }
      val max = limit.toInt().coerceIn(1, 200)
      promise.resolve(
        JSONObject()
          .put("enabled", true)
          .put("days", window)
          .put("count", rows.size)
          .put("apps", JSONArray(rows.take(max)))
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_USAGE", error.message ?: "no se pudo leer el uso de apps", error)
    }
  }

  /** Ajustes > Acceso a datos de uso. */
  @ReactMethod
  fun usageSettings(promise: Promise) {
    try {
      ctx.startActivity(
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_USAGE_SETTINGS", error.message ?: "no se pudo abrir datos de uso", error)
    }
  }

  private fun usageAccess(): Boolean {
    val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= 29) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName,
      )
    }
    else {
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName,
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  @ReactMethod
  fun openUrl(url: String, promise: Promise) {
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        throw IllegalArgumentException("solo http(s): $url")
      }
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_OPENURL", error.message ?: "no se pudo abrir la URL", error)
    }
  }

  // ---------------------------------------------------- notificaciones
  /**
   * Lectura del historial que captura [ChiaNotifyListener]. Sin acceso a
   * notificaciones devuelve `enabled:false` (no es un error: el modelo tiene
   * que pedir `notifications.settings`).
   */
  @ReactMethod
  fun notificationsList(limit: Double, filter: String, includeRemoved: Boolean, promise: Promise) {
    try {
      if (!notificationsAccess()) {
        promise.resolve(
          JSONObject()
            .put("enabled", false)
            .put("connected", false)
            .put("count", 0)
            .put("notifications", JSONArray())
            .put(
              "hint",
              "Falta el acceso a notificaciones. Se concede a mano en Ajustes > " +
                "Acceso a notificaciones > ChiaNative (o `adb shell cmd notification " +
                "allow_listener com.chianative/com.chianative.ChiaNotifyListener`). " +
                "Abre esa pantalla con la accion notifications.settings y reintenta.",
            )
            .toString(),
        )
        return
      }
      val service = ChiaNotifyListener.instance
      if (service == null) {
        rebindListener()
      }
      val store = ChiaNotifStore.get(ctx)
      val max = limit.toInt().coerceIn(1, 200)
      val rows = store.list(max, filter, includeRemoved)
      val list = JSONArray()
      val now = System.currentTimeMillis()
      for (row in rows) {
        list.put(
          JSONObject()
            .put("package", row.pkg)
            .put("app", row.appLabel)
            .put("title", row.title)
            .put("text", row.body)
            .put("subText", row.subText)
            .put("category", row.category)
            .put("channel", row.channel)
            .put("time", row.postedAt)
            .put("agoSec", ((now - row.postedAt) / 1000).coerceAtLeast(0))
            .put("ongoing", row.isOngoing)
            .put("group", row.isGroup)
            .put("clearable", row.isClearable)
            .put("removed", row.removedAt != null),
        )
      }
      promise.resolve(
        JSONObject()
          .put("enabled", true)
          .put("connected", service != null)
          .put("total", store.count(includeRemoved))
          .put("count", list.length())
          .put("notifications", list)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_NOTIF", error.message ?: "no se pudo leer las notificaciones", error)
    }
  }

  /** Ajustes > Acceso a notificaciones (lo unico que puede hacer la app). */
  @ReactMethod
  fun notificationsSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject(
        "E_NOTIF_SETTINGS",
        error.message ?: "no se pudo abrir el acceso a notificaciones",
        error,
      )
    }
  }

  /**
   * Pantalla del interruptor de ESTA app en "Acceso a notificaciones".
   * En Android 11+ existe el detalle por componente; si el fabricante no lo
   * trae se cae a la lista completa, que es la de siempre.
   */
  @ReactMethod
  fun notificationsDetailSettings(promise: Promise) {
    val detail = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
      .putExtra(
        "android.provider.extra.NOTIFICATION_LISTENER_COMPONENT_NAME",
        ComponentName(ctx, ChiaNotifyListener::class.java).flattenToString(),
      )
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      if (Build.VERSION.SDK_INT >= 30) {
        ctx.startActivity(detail)
      }
      else {
        ctx.startActivity(
          Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
      }
      promise.resolve(true)
    }
    catch (error: Throwable) {
      try {
        ctx.startActivity(
          Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        promise.resolve(true)
      }
      catch (fallback: Throwable) {
        promise.reject(
          "E_NOTIF_DETAIL",
          fallback.message ?: error.message ?: "no se pudo abrir el acceso a notificaciones",
          fallback,
        )
      }
    }
  }

  /**
   * De donde salio esta instalacion. Android 13+ bloquea el acceso a
   * notificaciones de las apps que no vienen de Play ("configuracion
   * restringida"), asi que saber si es sideload explica el interruptor gris.
   */
  @ReactMethod
  fun installInfo(promise: Promise) {
    try {
      val pm = ctx.packageManager
      val installer = if (Build.VERSION.SDK_INT >= 30) {
        pm.getInstallSourceInfo(ctx.packageName).installingPackageName
      }
      else {
        @Suppress("DEPRECATION")
        pm.getInstallerPackageName(ctx.packageName)
      }
      val json = JSONObject()
      json.put("installer", installer ?: "")
      json.put("sideload", installer != "com.android.vending")
      json.put("detailSettings", Build.VERSION.SDK_INT >= 30)
      promise.resolve(json.toString())
    }
    catch (error: Throwable) {
      promise.reject("E_INSTALL_INFO", error.message ?: "no se pudo leer el instalador", error)
    }
  }

  /** Estado de todos los permisos que usan las tools y la captura. */
  @ReactMethod
  fun permStatus(promise: Promise) {
    try {
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager
      val json = JSONObject().apply {
        put("notifications", notificationsAccess())
        put("postNotifications", Build.VERSION.SDK_INT < 33 || granted(Manifest.permission.POST_NOTIFICATIONS))
        put("camera", granted(Manifest.permission.CAMERA))
        put("location", granted(Manifest.permission.ACCESS_FINE_LOCATION))
        put("wifi", Build.VERSION.SDK_INT < 33 || granted(Manifest.permission.NEARBY_WIFI_DEVICES))
        put("allFiles", Build.VERSION.SDK_INT < 30 || Environment.isExternalStorageManager())
        put("usageAccess", usageAccess())
        put("bluetooth", Build.VERSION.SDK_INT < 31 ||
          (granted(Manifest.permission.BLUETOOTH_SCAN) && granted(Manifest.permission.BLUETOOTH_CONNECT)))
        put("batteryUnrestricted", pm?.isIgnoringBatteryOptimizations(ctx.packageName) ?: false)
      }
      promise.resolve(json.toString())
    }
    catch (error: Throwable) {
      promise.reject("E_PERM_STATUS", error.message ?: "no se pudieron leer los permisos", error)
    }
  }

  private fun notificationsAccess(): Boolean {
    val flat = Settings.Secure.getString(
      ctx.contentResolver,
      "enabled_notification_listeners",
    ) ?: return false
    return flat.split(':').any { it.contains(ctx.packageName) }
  }

  private fun rebindListener() {
    try {
      NotificationListenerService.requestRebind(
        ComponentName(ctx, ChiaNotifyListener::class.java),
      )
    }
    catch (_: Throwable) {
    }
  }

  // ------------------------------------------------------------ medios
  @ReactMethod
  fun mediaSessions(promise: Promise) {
    try {
      if (!notificationsAccess()) {
        promise.resolve(notifAccessJson().toString())
        return
      }
      val controllers = mediaControllers()
      val list = JSONArray()
      for (controller in controllers) {
        list.put(mediaJson(controller))
      }
      promise.resolve(
        JSONObject()
          .put("enabled", true)
          .put("found", controllers.isNotEmpty())
          .put("count", controllers.size)
          .put("sessions", list)
          .put(
            "hint",
            if (controllers.isEmpty()) {
              "No hay sesion de medios: abre la app de musica y dale play una vez."
            }
            else {
              ""
            },
          )
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_MEDIA_SESSIONS", error.message ?: "no se pudieron leer las sesiones", error)
    }
  }

  @ReactMethod
  fun mediaState(pkg: String, promise: Promise) {
    try {
      if (!notificationsAccess()) {
        promise.resolve(notifAccessJson().toString())
        return
      }
      val controller = pickMedia(mediaControllers(), pkg)
        ?: return promise.resolve(noSessionJson(pkg).toString())
      promise.resolve(
        mediaJson(controller)
          .put("enabled", true)
          .put("found", true)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_MEDIA_STATE", error.message ?: "no se pudo leer el reproductor", error)
    }
  }

  @ReactMethod
  fun mediaControl(action: String, pkg: String, positionMs: Double, promise: Promise) {
    try {
      val controller = pickMedia(mediaControllers(), pkg)
        ?: throw IllegalStateException(noSessionJson(pkg).getString("hint"))
      val transport = controller.transportControls
      val playback = controller.playbackState
      val playing = playback?.state == PlaybackState.STATE_PLAYING
      val command = action.trim().lowercase()
      when (command) {
        "toggle", "playpause" -> if (playing) transport.pause() else transport.play()
        "play" -> transport.play()
        "pause" -> transport.pause()
        "next", "skip" -> transport.skipToNext()
        "prev", "previous" -> transport.skipToPrevious()
        "stop" -> transport.stop()
        "seek", "seekto" -> transport.seekTo(positionMs.toLong())
        else -> throw IllegalArgumentException("accion de medios desconocida: $action")
      }
      promise.resolve(
        JSONObject()
          .put("ok", true)
          .put("action", command)
          .put("package", controller.packageName)
          .put("app", appLabel(controller.packageName))
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_MEDIA_CONTROL", error.message ?: "no se pudo controlar el reproductor", error)
    }
  }

  @ReactMethod
  fun mediaVolume(action: String, percent: Double, promise: Promise) {
    try {
      val audio = ctx.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        ?: throw IllegalStateException("AudioManager no disponible")
      val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC).coerceAtLeast(1)
      when (val command = action.trim().lowercase()) {
        "up" -> audio.adjustStreamVolume(
          AudioManager.STREAM_MUSIC,
          AudioManager.ADJUST_RAISE,
          AudioManager.FLAG_SHOW_UI,
        )
        "down" -> audio.adjustStreamVolume(
          AudioManager.STREAM_MUSIC,
          AudioManager.ADJUST_LOWER,
          AudioManager.FLAG_SHOW_UI,
        )
        "mute" -> audio.adjustStreamVolume(
          AudioManager.STREAM_MUSIC,
          AudioManager.ADJUST_MUTE,
          AudioManager.FLAG_SHOW_UI,
        )
        "unmute" -> audio.adjustStreamVolume(
          AudioManager.STREAM_MUSIC,
          AudioManager.ADJUST_UNMUTE,
          AudioManager.FLAG_SHOW_UI,
        )
        "set" -> {
          val level = (percent.toInt().coerceIn(0, 100) * max / 100).coerceIn(0, max)
          audio.setStreamVolume(AudioManager.STREAM_MUSIC, level, AudioManager.FLAG_SHOW_UI)
        }
        else -> throw IllegalArgumentException("accion de volumen desconocida: $command")
      }
      val level = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
      promise.resolve(
        JSONObject()
          .put("ok", true)
          .put("action", action.trim().lowercase())
          .put("level", level)
          .put("max", max)
          .put("percent", level * 100 / max)
          .put("muted", audio.isStreamMute(AudioManager.STREAM_MUSIC))
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_MEDIA_VOLUME", error.message ?: "no se pudo cambiar el volumen", error)
    }
  }

  private fun notifAccessJson(): JSONObject = JSONObject()
    .put("enabled", false)
    .put("found", false)
    .put(
      "hint",
      "Falta el acceso a notificaciones: es el que abre las sesiones de medios. " +
        "Abrelo con notifications.settings y reintenta.",
    )

  private fun noSessionJson(pkg: String): JSONObject = JSONObject()
    .put("enabled", true)
    .put("found", false)
    .put("package", pkg)
    .put(
      "hint",
      "No hay sesion de medios activa (o esa app no expone MediaSession). " +
        "Abre la app de musica, dale play y reintenta; media.sessions lista las disponibles.",
    )

  private fun mediaControllers(): List<MediaController> {
    val manager = ctx.getSystemService(Context.MEDIA_SESSION_SERVICE) as? MediaSessionManager
      ?: return emptyList()
    return try {
      manager.getActiveSessions(ComponentName(ctx, ChiaNotifyListener::class.java))
    }
    catch (_: Throwable) {
      emptyList()
    }
  }

  private fun pickMedia(controllers: List<MediaController>, pkg: String): MediaController? {
    val wanted = pkg.trim().lowercase()
    if (wanted.isNotEmpty()) {
      val byPackage = controllers.firstOrNull { it.packageName.lowercase() == wanted }
        ?: controllers.firstOrNull {
          it.packageName.lowercase().contains(wanted)
            || appLabel(it.packageName).lowercase().contains(wanted)
        }
      return byPackage
    }
    return controllers.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING }
      ?: controllers.firstOrNull { it.playbackState?.state != PlaybackState.STATE_NONE }
      ?: controllers.firstOrNull()
  }

  private fun mediaJson(controller: MediaController): JSONObject {
    val metadata = controller.metadata
    val playback = controller.playbackState
    return JSONObject()
      .put("package", controller.packageName)
      .put("app", appLabel(controller.packageName))
      .put("title", metadata?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: "")
      .put("artist", metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: "")
      .put("album", metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: "")
      .put("state", stateName(playback?.state ?: PlaybackState.STATE_NONE))
      .put("playing", playback?.state == PlaybackState.STATE_PLAYING)
      .put("positionMs", playback?.position ?: 0L)
      .put("durationMs", metadata?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L)
      .put("canNext", hasAction(playback, PlaybackState.ACTION_SKIP_TO_NEXT))
      .put("canPrev", hasAction(playback, PlaybackState.ACTION_SKIP_TO_PREVIOUS))
      .put("canSeek", hasAction(playback, PlaybackState.ACTION_SEEK_TO))
      .put("canPlay", hasAction(playback, PlaybackState.ACTION_PLAY))
      .put("canPause", hasAction(playback, PlaybackState.ACTION_PAUSE))
  }

  private fun hasAction(playback: PlaybackState?, action: Long): Boolean =
    playback != null && (playback.actions and action) != 0L

  private fun stateName(state: Int): String = when (state) {
    PlaybackState.STATE_PLAYING -> "playing"
    PlaybackState.STATE_PAUSED -> "paused"
    PlaybackState.STATE_STOPPED -> "stopped"
    PlaybackState.STATE_BUFFERING -> "buffering"
    PlaybackState.STATE_ERROR -> "error"
    else -> "none"
  }

  private fun appLabel(pkg: String): String = runCatching {
    val pm = ctx.packageManager
    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
  }.getOrDefault(pkg)

  // ------------------------------------------------------------ archivos
  /**
   * Acceso al almacenamiento compartido. Android 11+ solo deja ver todo con
   * "Acceso a todos los archivos" (MANAGE_EXTERNAL_STORAGE), que se concede a
   * mano; sin el, las acciones devuelven `enabled:false` y `files.settings`
   * abre esa pantalla. Lo que queda fuera siempre: /data/data de otras apps,
   * /system y /root (root).
   */
  @ReactMethod
  fun filesList(path: String, limit: Double, showHidden: Boolean, promise: Promise) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val dir = resolvePath(path)
      if (!dir.exists()) {
        throw IllegalArgumentException("no existe: ${dir.absolutePath}")
      }
      if (!dir.isDirectory) {
        promise.resolve(entryJson(dir, detailed = true).toString())
        return
      }
      val children = dir.listFiles()
        ?: throw IllegalAccessException("sin permiso para listar ${dir.absolutePath}")
      val visible = children.filter { showHidden || !it.name.startsWith('.') }
      val ordered = visible.sortedWith(
        compareByDescending<File> { it.isDirectory }.thenBy { it.name.lowercase() },
      )
      val max = limit.toInt().coerceIn(1, 500)
      val rows = JSONArray()
      for (item in ordered.take(max)) {
        rows.put(entryJson(item, detailed = false))
      }
      promise.resolve(
        JSONObject()
          .put("enabled", true)
          .put("path", dir.absolutePath)
          .put("count", ordered.size)
          .put("dirs", ordered.count { it.isDirectory })
          .put("files", ordered.count { it.isFile })
          .put("entries", rows)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_LIST", error.message ?: "no se pudo listar $path", error)
    }
  }

  @ReactMethod
  fun filesStat(path: String, promise: Promise) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val file = resolvePath(path)
      if (!file.exists()) {
        throw IllegalArgumentException("no existe: ${file.absolutePath}")
      }
      promise.resolve(entryJson(file, detailed = true).toString())
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_STAT", error.message ?: "no se pudo leer $path", error)
    }
  }

  /** Texto con offset/limit de lineas (patron de `read`); binario en base64. */
  @ReactMethod
  fun filesRead(
    path: String,
    offset: Double,
    limit: Double,
    maxBytes: Double,
    encoding: String,
    promise: Promise,
  ) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val file = resolvePath(path)
      if (!file.exists() || file.isDirectory) {
        throw IllegalArgumentException("no es un archivo: ${file.absolutePath}")
      }
      val cap = maxBytes.toInt().coerceIn(1024, toolLimits().fileBytes)
      val bytes = readLimited(file, cap)
      val binary = encoding.lowercase() == "base64" || isBinary(bytes)
      val truncated = file.length() > bytes.size
      if (binary) {
        promise.resolve(
          JSONObject()
            .put("path", file.absolutePath)
            .put("bytes", file.length())
            .put("shownBytes", bytes.size)
            .put("binary", true)
            .put("truncated", truncated)
            .put("encoding", "base64")
            .put("content", Base64.encodeToString(bytes, Base64.NO_WRAP))
            .toString(),
        )
        return
      }
      val lines = String(bytes, Charsets.UTF_8).replace("\r\n", "\n").split('\n')
      val start = (offset.toInt().coerceAtLeast(1)) - 1
      if (start >= lines.size && lines.isNotEmpty()) {
        throw IllegalArgumentException("offset $offset fuera del archivo (${lines.size} lineas)")
      }
      val take = limit.toInt().coerceAtLeast(1)
      val slice = lines.drop(start).take(take)
      val more = start + slice.size < lines.size
      promise.resolve(
        JSONObject()
          .put("path", file.absolutePath)
          .put("bytes", file.length())
          .put("lines", lines.size)
          .put("offset", start + 1)
          .put("shownLines", slice.size)
          .put("binary", false)
          .put("truncated", truncated || more)
          .put("encoding", "utf8")
          .put("content", slice.joinToString("\n"))
          .put(
            "nota",
            if (more) "continua con offset=${start + slice.size + 1}" else "",
          )
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_READ", error.message ?: "no se pudo leer $path", error)
    }
  }

  @ReactMethod
  fun filesWrite(
    path: String,
    content: String,
    encoding: String,
    append: Boolean,
    promise: Promise,
  ) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val file = resolvePath(path)
      file.parentFile?.mkdirs()
      val bytes = if (encoding.lowercase() == "base64") {
        Base64.decode(content, Base64.DEFAULT)
      }
      else {
        content.toByteArray(Charsets.UTF_8)
      }
      java.io.FileOutputStream(file, append).use { it.write(bytes) }
      promise.resolve(
        JSONObject()
          .put("path", file.absolutePath)
          .put("bytes", bytes.size)
          .put("append", append)
          .put("total", file.length())
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_WRITE", error.message ?: "no se pudo escribir $path", error)
    }
  }

  @ReactMethod
  fun filesMkdir(path: String, promise: Promise) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val dir = resolvePath(path)
      if (dir.exists() && !dir.isDirectory) {
        throw IllegalArgumentException("existe y no es carpeta: ${dir.absolutePath}")
      }
      val created = dir.mkdirs() || dir.isDirectory
      promise.resolve(
        JSONObject().put("path", dir.absolutePath).put("ok", created).toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_MKDIR", error.message ?: "no se pudo crear $path", error)
    }
  }

  @ReactMethod
  fun filesDelete(path: String, recursive: Boolean, promise: Promise) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val file = resolvePath(path)
      if (!file.exists()) {
        throw IllegalArgumentException("no existe: ${file.absolutePath}")
      }
      val removed = if (file.isDirectory) {
        if (!recursive) {
          throw IllegalArgumentException(
            "es una carpeta; usa recursive:true para borrarla con su contenido",
          )
        }
        var total = 0
        file.walkBottomUp().forEach { item ->
          if (!item.delete()) {
            throw IllegalStateException("no se pudo borrar ${item.absolutePath}")
          }
          total += 1
        }
        total
      }
      else {
        if (!file.delete()) {
          throw IllegalStateException("no se pudo borrar ${file.absolutePath}")
        }
        1
      }
      promise.resolve(
        JSONObject().put("path", file.absolutePath).put("removed", removed).toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_DELETE", error.message ?: "no se pudo borrar $path", error)
    }
  }

  /** Mueve (o copia con `copy:true`) archivos y carpetas. */
  @ReactMethod
  fun filesMove(
    from: String,
    to: String,
    overwrite: Boolean,
    copy: Boolean,
    promise: Promise,
  ) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val source = resolvePath(from)
      val target = resolvePath(to)
      if (!source.exists()) {
        throw IllegalArgumentException("no existe: ${source.absolutePath}")
      }
      if (target.exists()) {
        if (!overwrite) {
          throw IllegalArgumentException("ya existe: ${target.absolutePath}")
        }
        if (!deleteRecursive(target)) {
          throw IllegalStateException("no se pudo reemplazar ${target.absolutePath}")
        }
      }
      target.parentFile?.mkdirs()
      val ok = if (copy) copyRecursive(source, target) else renameOrMove(source, target)
      if (!ok) {
        throw IllegalStateException("no se pudo ${if (copy) "copiar" else "mover"} a ${target.absolutePath}")
      }
      promise.resolve(
        JSONObject()
          .put("from", source.absolutePath)
          .put("to", target.absolutePath)
          .put("copy", copy)
          .put("ok", true)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_MOVE", error.message ?: "no se pudo mover $from", error)
    }
  }

  /** Busca por nombre: comodines (*, ?) o subcadena, con profundidad maxima. */
  @ReactMethod
  fun filesSearch(
    path: String,
    query: String,
    limit: Double,
    maxDepth: Double,
    showHidden: Boolean,
    promise: Promise,
  ) {
    try {
      if (!requireStorage(promise)) {
        return
      }
      val root = resolvePath(path)
      if (!root.exists() || !root.isDirectory) {
        throw IllegalArgumentException("no es una carpeta: ${root.absolutePath}")
      }
      val limits = toolLimits()
      val max = limit.toInt().coerceIn(1, MAX_SEARCH_RESULTS)
      val depth = maxDepth.toInt().coerceIn(1, MAX_SEARCH_DEPTH)
      val rows = JSONArray()
      var scanned = 0
      val pending = ArrayDeque<Pair<File, Int>>()
      pending.add(root to 0)
      while (pending.isNotEmpty() && rows.length() < max) {
        val (dir, level) = pending.removeFirst()
        val children = dir.listFiles() ?: continue
        for (item in children) {
          if (!showHidden && item.name.startsWith('.')) {
            continue
          }
          scanned += 1
          if (nameMatches(item.name, query)) {
            rows.put(entryJson(item, detailed = false))
            if (rows.length() >= max) {
              break
            }
          }
          if (item.isDirectory && level < depth) {
            pending.add(item to level + 1)
          }
        }
      }
      promise.resolve(
        JSONObject()
          .put("enabled", true)
          .put("root", root.absolutePath)
          .put("query", query)
          .put("count", rows.length())
          .put("scanned", scanned)
          .put("entries", rows)
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_SEARCH", error.message ?: "no se pudo buscar en $path", error)
    }
  }

  /** Ajustes > Acceso a todos los archivos (Android 11+). */
  @ReactMethod
  fun filesSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 30) {
        ctx.startActivity(
          Intent(
            Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
            Uri.parse("package:${ctx.packageName}"),
          ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
      }
      else {
        ctx.startActivity(
          Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:${ctx.packageName}"),
          ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
      }
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_FILES_SETTINGS", error.message ?: "no se pudo abrir el permiso", error)
    }
  }

  /** true si hay acceso (o se dejo la respuesta ya resuelta con el motivo). */
  private fun requireStorage(promise: Promise): Boolean {
    if (Build.VERSION.SDK_INT < 30 || Environment.isExternalStorageManager()) {
      return true
    }
    val readable = Environment.getExternalStorageDirectory()?.canRead() ?: false
    if (readable) {
      return true
    }
    promise.resolve(
      JSONObject()
        .put("enabled", false)
        .put(
          "hint",
          "Falta \"Acceso a todos los archivos\" (MANAGE_EXTERNAL_STORAGE). Se concede a " +
            "mano en Ajustes > ChiaNative > Permisos > Acceso a todos los archivos, o con " +
            "`adb shell appops set com.chianative MANAGE_EXTERNAL_STORAGE allow`. Abre esa " +
            "pantalla con files.settings y reintenta.",
        )
        .toString(),
    )
    return false
  }

  private fun resolvePath(path: String): File {
    val raw = path.trim().ifEmpty { "/sdcard" }
    val expanded = when {
      raw == "~" || raw == "home" -> "/sdcard"
      raw.startsWith("~/") -> "/sdcard/" + raw.removePrefix("~/")
      raw.startsWith("home/") -> "/sdcard/" + raw.removePrefix("home/")
      else -> raw
    }
    return File(expanded).absoluteFile
  }

  private fun entryJson(file: File, detailed: Boolean): JSONObject {
    val json = JSONObject()
      .put("name", file.name)
      .put("path", file.absolutePath)
      .put("dir", file.isDirectory)
      .put("size", if (file.isFile) file.length() else 0L)
      .put("modified", file.lastModified())
      .put("readable", file.canRead())
      .put("writable", file.canWrite())
    if (file.isFile) {
      json.put("ext", file.extension.lowercase())
    }
    if (detailed) {
      json.put("parent", file.parent ?: "")
      json.put("hidden", file.name.startsWith('.'))
    }
    return json
  }

  /**
   * Limites de la tool phone escritos por JS desde la tabla `settings`
   * (`tools.*`). Ningun valor de comportamiento vive hardcodeado aca: los
   * defaults del companion solo cubren el arranque antes del primer push.
   */
  @ReactMethod
  fun configureTools(json: String, promise: Promise) {
    try {
      val config = JSONObject(json)
      val prefs = reactApplicationContext
        .getSharedPreferences(TOOLS_PREFS, Context.MODE_PRIVATE)
        .edit()
      fun setInt(key: String, value: Int) {
        if (value > 0) {
          prefs.putInt(key, value)
        }
      }
      setInt("fileBytes", config.optInt("fileBytes", 0))
      setInt("httpBytes", config.optInt("httpBytes", 0))
      prefs.apply()
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_TOOLS_CONFIG", error.message ?: "config invalida", error)
    }
  }

  /** Limites efectivos (base de datos via prefs, con clamps de cordura). */
  private fun toolLimits(): ToolLimits {
    val prefs = reactApplicationContext
      .getSharedPreferences(TOOLS_PREFS, Context.MODE_PRIVATE)
    return ToolLimits(
      fileBytes = prefs.getInt("fileBytes", MAX_FILE_BYTES).coerceAtLeast(1024),
      httpBytes = prefs.getInt("httpBytes", MAX_HTTP_BYTES).coerceAtLeast(1024),
    )
  }

  private data class ToolLimits(
    val fileBytes: Int,
    val httpBytes: Int,
  )

  private fun readLimited(file: File, maxBytes: Int): ByteArray {
    val out = ByteArrayOutputStream()
    file.inputStream().use { input ->
      val buffer = ByteArray(16 * 1024)
      var total = 0
      while (total < maxBytes) {
        val read = input.read(buffer, 0, minOf(buffer.size, maxBytes - total))
        if (read <= 0) {
          break
        }
        out.write(buffer, 0, read)
        total += read
      }
    }
    return out.toByteArray()
  }

  private fun isBinary(bytes: ByteArray): Boolean {
    val probe = minOf(bytes.size, 8192)
    for (index in 0 until probe) {
      if (bytes[index] == 0.toByte()) {
        return true
      }
    }
    return false
  }

  private fun nameMatches(name: String, query: String): Boolean {
    if (query.isBlank()) {
      return false
    }
    if (!query.contains('*') && !query.contains('?')) {
      return name.contains(query, ignoreCase = true)
    }
    val pattern = query
      .replace(".", "\\.")
      .replace("*", ".*")
      .replace("?", ".")
    return Regex("^$pattern$", RegexOption.IGNORE_CASE).matches(name)
  }

  private fun deleteRecursive(file: File): Boolean {
    if (file.isDirectory) {
      file.listFiles()?.forEach { child -> deleteRecursive(child) }
    }
    return file.delete()
  }

  private fun copyRecursive(source: File, target: File): Boolean {
    if (source.isDirectory) {
      if (!target.mkdirs() && !target.isDirectory) {
        return false
      }
      return source.listFiles()?.all { child ->
        copyRecursive(child, File(target, child.name))
      } ?: true
    }
    return try {
      source.inputStream().use { input ->
        target.outputStream().use { output -> input.copyTo(output) }
      }
      true
    }
    catch (_: Throwable) {
      false
    }
  }

  private fun renameOrMove(source: File, target: File): Boolean {
    if (source.renameTo(target)) {
      return true
    }
    if (!copyRecursive(source, target)) {
      return false
    }
    return deleteRecursive(source)
  }

  @ReactMethod
  fun requestPermission(permission: String, promise: Promise) {
    val names = when (permission.lowercase()) {
      "location" -> arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
      )
      "camera" -> arrayOf(Manifest.permission.CAMERA)
      "wifi" -> if (Build.VERSION.SDK_INT >= 33) {
        arrayOf(Manifest.permission.NEARBY_WIFI_DEVICES)
      }
      else {
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
      }
      "bluetooth" -> if (Build.VERSION.SDK_INT >= 31) {
        arrayOf(
          Manifest.permission.BLUETOOTH_SCAN,
          Manifest.permission.BLUETOOTH_CONNECT,
        )
      }
      else {
        emptyArray()
      }
      else -> emptyArray()
    }
    if (names.isEmpty()) {
      promise.reject("E_PERM", "permiso desconocido: $permission")
      return
    }
    promise.resolve(requestPermissions(names))
  }

  // --------------------------------------------------------------- red
  /** Escaneo TCP de la LAN desde el telefono: hosts vivos y puertos abiertos. */
  @ReactMethod
  fun netScan(
    subnet: String,
    ports: String,
    timeoutMs: Double,
    seconds: Double,
    threads: Double,
    promise: Promise,
  ) {
    Thread {
      try {
        val timeout = timeoutMs.toInt().coerceIn(120, 3000)
        val (label, hosts) = scanTargets(subnet)
        val portList = parsePorts(ports)
        val found = java.util.concurrent.ConcurrentLinkedQueue<JSONObject>()
        val scanThreads = if (threads > 0) threads.toInt().coerceIn(1, 128) else SCAN_THREADS
        val scanMs = if (seconds > 0) (seconds * 1000).toLong().coerceIn(1000L, 300_000L) else SCAN_MS
        val pool = Executors.newFixedThreadPool(scanThreads)
        val deadline = System.currentTimeMillis() + scanMs
        for (host in hosts) {
          pool.execute {
            if (System.currentTimeMillis() > deadline) {
              return@execute
            }
            val open = ArrayList<Int>()
            var firstMs = 0L
            for (port in portList) {
              val started = System.currentTimeMillis()
              if (tryConnect(host, port, timeout)) {
                open.add(port)
                if (firstMs == 0L) {
                  firstMs = System.currentTimeMillis() - started
                }
              }
            }
            if (open.isNotEmpty()) {
              found.add(
                JSONObject()
                  .put("ip", host)
                  .put("ports", JSONArray(open))
                  .put("ms", firstMs),
              )
            }
          }
        }
        pool.shutdown()
        pool.awaitTermination(scanMs + 5_000L, TimeUnit.MILLISECONDS)
        val alive = found.toList().sortedBy { json ->
          json.optString("ip").split(".").lastOrNull()?.toIntOrNull() ?: 0
        }
        promise.resolve(
          JSONObject()
            .put("subnet", label)
            .put("scanned", hosts.size)
            .put("ports", JSONArray(portList))
            .put("alive", JSONArray(alive))
            .put("note", if (alive.isEmpty()) "ningun host respondio en los puertos probados" else "")
            .toString(),
        )
      }
      catch (error: Throwable) {
        promise.reject("E_NET_SCAN", error.message ?: "fallo el escaneo", error)
      }
    }.start()
  }

  /** Abre un TCP y devuelve el banner si el servicio lo manda. */
  @ReactMethod
  fun netProbe(host: String, port: Double, timeoutMs: Double, promise: Promise) {
    Thread {
      try {
        val target = host.trim()
        val p = port.toInt().coerceIn(1, 65535)
        val timeout = timeoutMs.toInt().coerceIn(200, 5000)
        val started = System.currentTimeMillis()
        var banner = ""
        Socket().use { socket ->
          socket.connect(InetSocketAddress(target, p), timeout)
          socket.soTimeout = 400
          val buffer = ByteArray(256)
          val read = try {
            socket.getInputStream().read(buffer)
          }
          catch (_: Throwable) {
            -1
          }
          if (read > 0) {
            banner = String(buffer, 0, read, Charsets.ISO_8859_1).trim()
          }
        }
        promise.resolve(
          JSONObject()
            .put("host", target)
            .put("port", p)
            .put("open", true)
            .put("ms", System.currentTimeMillis() - started)
            .put("banner", banner)
            .toString(),
        )
      }
      catch (error: Throwable) {
        promise.resolve(
          JSONObject()
            .put("host", host)
            .put("port", port.toInt())
            .put("open", false)
            .put("error", error.message ?: "sin respuesta")
            .toString(),
        )
      }
    }.start()
  }

  @ReactMethod
  fun netDns(host: String, promise: Promise) {
    Thread {
      try {
        val started = System.currentTimeMillis()
        val addresses = InetAddress.getAllByName(host.trim())
        promise.resolve(
          JSONObject()
            .put("host", host)
            .put("addresses", JSONArray(addresses.map { it.hostAddress ?: "" }))
            .put("ms", System.currentTimeMillis() - started)
            .toString(),
        )
      }
      catch (error: Throwable) {
        promise.reject("E_NET_DNS", error.message ?: "no resuelve $host", error)
      }
    }.start()
  }

  /** Peticion HTTP desde el telefono (usa su red, no la del servidor remoto). */
  @ReactMethod
  fun netHttp(
    url: String,
    method: String,
    headers: ReadableMap?,
    body: String,
    timeoutSec: Double,
    promise: Promise,
  ) {
    Thread {
      var connection: HttpURLConnection? = null
      try {
        val timeout = (timeoutSec.coerceIn(1.0, 60.0) * 1000).toInt()
        val started = System.currentTimeMillis()
        connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = method.ifEmpty { "GET" }.uppercase()
        connection.connectTimeout = timeout
        connection.readTimeout = timeout
        connection.instanceFollowRedirects = true
        connection.useCaches = false
        headers?.let { map ->
          val iterator = map.keySetIterator()
          while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            val value = runCatching { map.getString(key) }.getOrNull()
            if (value != null) {
              connection.setRequestProperty(key, value)
            }
          }
        }
        if (body.isNotEmpty() && connection.requestMethod != "GET" && connection.requestMethod != "HEAD") {
          connection.doOutput = true
          connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        val status = connection.responseCode
        val stream = if (status >= 400) connection.errorStream else connection.inputStream
        val raw = stream?.use { input ->
          val limit = toolLimits().httpBytes
          val buffer = ByteArray(4096)
          val out = java.io.ByteArrayOutputStream()
          while (out.size() < limit) {
            val read = input.read(buffer)
            if (read < 0) {
              break
            }
            out.write(buffer, 0, minOf(read, limit - out.size()))
          }
          out.toByteArray()
        } ?: ByteArray(0)
        val headerJson = JSONObject()
        connection.headerFields.forEach { (key, values) ->
          if (key != null && values.isNotEmpty() && headerJson.length() < 25) {
            headerJson.put(key, values.joinToString(", "))
          }
        }
        promise.resolve(
          JSONObject()
            .put("url", url)
            .put("status", status)
            .put("contentType", connection.contentType ?: "")
            .put("bytes", raw.size)
            .put("truncated", raw.size >= toolLimits().httpBytes)
            .put("ms", System.currentTimeMillis() - started)
            .put("headers", headerJson)
            .put("body", String(raw, Charsets.UTF_8))
            .toString(),
        )
      }
      catch (error: Throwable) {
        promise.reject("E_NET_HTTP", error.message ?: "fallo la peticion", error)
      }
      finally {
        try {
          connection?.disconnect()
        }
        catch (_: Throwable) {
        }
      }
    }.start()
  }

  /** Redes WiFi visibles (SSID/RSSI/seguridad). Requiere NEARBY_WIFI_DEVICES. */
  @ReactMethod
  fun netWifiScan(promise: Promise) {
    val needsNearby = Build.VERSION.SDK_INT >= 33
    val permission = if (needsNearby) {
      Manifest.permission.NEARBY_WIFI_DEVICES
    }
    else {
      Manifest.permission.ACCESS_FINE_LOCATION
    }
    if (!granted(permission)) {
      requestPermissions(arrayOf(permission))
      promise.reject(
        "E_PERM",
        "falta el permiso de WiFi ($permission): se abrio el dialogo del sistema, el usuario debe aceptar y hay que reintentar",
      )
      return
    }
    Thread {
      try {
        val manager = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        if (!manager.isWifiEnabled) {
          promise.resolve(JSONObject().put("enabled", false).put("networks", JSONArray()).toString())
          return@Thread
        }
        val fresh = manager.startScan()
        val results = manager.scanResults ?: emptyList()
        val list = results
          .sortedByDescending { it.level }
          .take(40)
          .map { result ->
            JSONObject()
              .put("ssid", result.SSID ?: "")
              .put("bssid", result.BSSID ?: "")
              .put("rssi", result.level)
              .put("frequencyMhz", result.frequency)
              .put("security", securityName(result.capabilities ?: ""))
              .put("channel", frequencyChannel(result.frequency))
          }
        promise.resolve(
          JSONObject()
            .put("enabled", true)
            .put("fresh", fresh)
            .put("networks", JSONArray(list))
            .put("note", if (!fresh) "el sistema limito el escaneo (throttling); son los ultimos resultados en cache" else "")
            .toString(),
        )
      }
      catch (error: Throwable) {
        promise.reject("E_NET_WIFI", error.message ?: "fallo el escaneo WiFi", error)
      }
    }.start()
  }

  private fun tryConnect(host: String, port: Int, timeout: Int): Boolean = try {
    Socket().use {
      it.connect(InetSocketAddress(host, port), timeout)
      true
    }
  }
  catch (_: Throwable) {
    false
  }

  private fun parsePorts(raw: String): List<Int> {
    val defaults = listOf(5555, 8009, 8080, 80, 443)
    if (raw.isBlank()) {
      return defaults
    }
    val parsed = raw.split(',', ' ')
      .mapNotNull { it.trim().toIntOrNull() }
      .filter { it in 1..65535 }
      .distinct()
    return if (parsed.isEmpty()) defaults else parsed.take(10)
  }

  /**
   * Devuelve "subred" y la lista de IPs a probar. Acepta "192.168.1",
   * "192.168.1.0/24" o vacio (usa la primera IPv4 privada del telefono).
   */
  private fun scanTargets(subnet: String): Pair<String, List<String>> {
    val base = if (subnet.isBlank()) {
      val local = localIpv4s().firstOrNull { it.startsWith("192.168.") || it.startsWith("10.") }
        ?: localIpv4s().firstOrNull()
        ?: throw IllegalStateException("el telefono no tiene IPv4 de red local")
      local.substringBeforeLast('.')
    }
    else {
      subnet.trim()
        .substringBefore('/')
        .trimEnd('.')
        .let { value ->
          if (value.count { it == '.' } >= 3) value.substringBeforeLast('.') else value
        }
    }
    val parts = base.split('.')
    if (parts.size != 3 || parts.any { it.toIntOrNull() == null }) {
      throw IllegalArgumentException("subred invalida: usa 192.168.1 o 192.168.1.0/24")
    }
    val prefix = parts.joinToString(".")
    val hosts = (1..254).map { "$prefix.$it" }
    return prefix to hosts
  }

  private fun localIpv4s(): List<String> {
    val out = ArrayList<String>()
    runCatching {
      NetworkInterface.getNetworkInterfaces().toList()
        .filter { it.isUp && !it.isLoopback }
        .flatMap { it.inetAddresses.toList() }
        .filter { it is java.net.Inet4Address && !it.isLoopbackAddress }
        .forEach { out.add(it.hostAddress ?: "") }
    }
    return out.filter { it.isNotEmpty() }
  }

  private fun securityName(capabilities: String): String = when {
    capabilities.contains("SAE") -> "wpa3"
    capabilities.contains("WPA2") || capabilities.contains("RSN") -> "wpa2"
    capabilities.contains("WPA") -> "wpa"
    capabilities.contains("WEP") -> "wep"
    capabilities.contains("EAP") -> "enterprise"
    else -> "open"
  }

  private fun frequencyChannel(frequency: Int): Int = when {
    frequency in 2412..2484 -> (frequency - 2412) / 5 + 1
    frequency in 5170..5825 -> (frequency - 5170) / 5 + 34
    frequency in 5955..7115 -> (frequency - 5955) / 5 + 1
    else -> 0
  }

  // ------------------------------------------------------------ bluetooth
  private fun btAdapter(): BluetoothAdapter? =
    (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

  private fun btGranted(): Boolean =
    Build.VERSION.SDK_INT < 31 ||
      (granted(Manifest.permission.BLUETOOTH_SCAN) && granted(Manifest.permission.BLUETOOTH_CONNECT))

  /** true si falta el permiso (y ya se pidio): el llamador debe abortar. */
  private fun btMissing(promise: Promise): Boolean {
    if (btGranted()) {
      return false
    }
    if (Build.VERSION.SDK_INT >= 31) {
      requestPermissions(
        arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT),
      )
    }
    promise.reject(
      "E_PERM",
      "permiso de bluetooth no concedido: se abrio el dialogo del sistema; el usuario debe aceptar y hay que reintentar",
    )
    return true
  }

  private fun btAdapterOrReject(promise: Promise): BluetoothAdapter? {
    val adapter = btAdapter()
    if (adapter == null) {
      promise.reject("E_BT", "este telefono no tiene bluetooth")
      return null
    }
    return adapter
  }

  private fun btTypeName(type: Int): String = when (type) {
    BluetoothDevice.DEVICE_TYPE_CLASSIC -> "classic"
    BluetoothDevice.DEVICE_TYPE_LE -> "le"
    BluetoothDevice.DEVICE_TYPE_DUAL -> "dual"
    else -> "unknown"
  }

  private fun btBondName(state: Int): String = when (state) {
    BluetoothDevice.BOND_BONDED -> "bonded"
    BluetoothDevice.BOND_BONDING -> "bonding"
    else -> "none"
  }

  private fun btDeviceJson(device: BluetoothDevice, rssi: Int? = null): JSONObject =
    JSONObject().apply {
      put("name", runCatching { device.name }.getOrNull() ?: "")
      put("address", device.address)
      put("type", btTypeName(runCatching { device.type }.getOrDefault(BluetoothDevice.DEVICE_TYPE_UNKNOWN)))
      put("bond", btBondName(runCatching { device.bondState }.getOrDefault(BluetoothDevice.BOND_NONE)))
      if (rssi != null) {
        put("rssi", rssi)
      }
    }

  @ReactMethod
  fun btStatus(promise: Promise) {
    try {
      val adapter = btAdapter()
      if (adapter == null) {
        promise.resolve(
          JSONObject().put("supported", false).put("enabled", false).put("permission", false).toString(),
        )
        return
      }
      val allowed = btGranted()
      val json = JSONObject().apply {
        put("supported", true)
        put("permission", allowed)
        put("enabled", allowed && adapter.isEnabled)
        put("name", if (allowed) adapter.name ?: "" else "")
        put("address", if (allowed) adapter.address ?: "" else "")
        put("discovering", allowed && adapter.isDiscovering)
      }
      promise.resolve(json.toString())
    }
    catch (error: Throwable) {
      promise.reject("E_BT", error.message ?: "no se pudo leer el estado del bluetooth", error)
    }
  }

  @ReactMethod
  fun btList(promise: Promise) {
    if (btMissing(promise)) {
      return
    }
    try {
      val adapter = btAdapterOrReject(promise) ?: return
      if (!adapter.isEnabled) {
        promise.reject("E_BT_OFF", "bluetooth apagado")
        return
      }
      val devices = JSONArray()
      adapter.bondedDevices?.forEach { devices.put(btDeviceJson(it)) }
      promise.resolve(JSONObject().put("count", devices.length()).put("devices", devices).toString())
    }
    catch (error: Throwable) {
      promise.reject("E_BT_LIST", error.message ?: "no se pudieron listar los dispositivos", error)
    }
  }

  @Suppress("MissingPermission")
  @ReactMethod
  fun btScan(seconds: Double, promise: Promise) {
    if (btMissing(promise)) {
      return
    }
    try {
      val adapter = btAdapterOrReject(promise) ?: return
      if (!adapter.isEnabled) {
        promise.reject("E_BT_OFF", "bluetooth apagado")
        return
      }
      val found = java.util.concurrent.ConcurrentHashMap<String, Pair<Int, BluetoothDevice>>()
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          if (intent?.action != BluetoothDevice.ACTION_FOUND) {
            return
          }
          val device = btDeviceFrom(intent) ?: return
          val rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, 0).toInt()
          found[device.address] = rssi to device
        }
      }
      ctx.registerReceiver(receiver, IntentFilter(BluetoothDevice.ACTION_FOUND))
      runCatching { adapter.startDiscovery() }
      Handler(Looper.getMainLooper()).postDelayed({
        runCatching { adapter.cancelDiscovery() }
        runCatching { ctx.unregisterReceiver(receiver) }
        val list = found.values
          .sortedByDescending { it.first }
          .map { pair -> btDeviceJson(pair.second, pair.first) }
        promise.resolve(
          JSONObject()
            .put("count", list.size)
            .put("seconds", seconds)
            .put("devices", JSONArray(list))
            .toString(),
        )
      }, (seconds.coerceIn(3.0, 30.0) * 1000).toLong())
    }
    catch (error: Throwable) {
      promise.reject("E_BT_SCAN", error.message ?: "no se pudo escanear", error)
    }
  }

  @Suppress("DEPRECATION")
  private fun btDeviceFrom(intent: Intent): BluetoothDevice? =
    try {
      if (Build.VERSION.SDK_INT >= 33) {
        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
      }
      else {
        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE) as? BluetoothDevice
      }
    }
    catch (_: Throwable) {
      null
    }

  /** Conecta/desconecta un perfil (A2DP o manos libres). API oculta por reflection. */
  @Suppress("MissingPermission")
  private fun btProfile(device: BluetoothDevice, profile: Int, connect: Boolean): Boolean {
    val adapter = btAdapter() ?: return false
    val latch = java.util.concurrent.CountDownLatch(1)
    var done = false
    val listener = object : BluetoothProfile.ServiceListener {
      override fun onServiceConnected(profileId: Int, proxy: BluetoothProfile) {
        try {
          val method = proxy.javaClass.getMethod(
            if (connect) "connect" else "disconnect",
            BluetoothDevice::class.java,
          )
          done = method.invoke(proxy, device) as? Boolean ?: false
        }
        catch (_: Throwable) {
          done = false
        }
        finally {
          runCatching { adapter.closeProfileProxy(profileId, proxy) }
          latch.countDown()
        }
      }

      override fun onServiceDisconnected(profileId: Int) {
        latch.countDown()
      }
    }
    return runCatching {
      adapter.getProfileProxy(ctx, listener, profile)
      latch.await(4, TimeUnit.SECONDS)
      done
    }.getOrDefault(false)
  }

  @Suppress("MissingPermission")
  private fun btRemote(address: String, promise: Promise): BluetoothDevice? {
    val adapter = btAdapterOrReject(promise) ?: return null
    if (!adapter.isEnabled) {
      promise.reject("E_BT_OFF", "bluetooth apagado")
      return null
    }
    val device = runCatching { adapter.getRemoteDevice(address) }.getOrNull()
    if (device == null) {
      promise.reject("E_BT_ADDR", "direccion MAC invalida: $address")
      return null
    }
    return device
  }

  @Suppress("MissingPermission")
  @ReactMethod
  fun btPair(address: String, promise: Promise) {
    if (btMissing(promise)) {
      return
    }
    try {
      val device = btRemote(address, promise) ?: return
      if (device.bondState == BluetoothDevice.BOND_BONDED) {
        promise.resolve(JSONObject().put("ok", true).put("bond", "bonded").toString())
        return
      }
      val started = runCatching { device.createBond() }.getOrDefault(false)
      promise.resolve(
        JSONObject()
          .put("ok", started)
          .put("bond", "bonding")
          .put("nota", if (started) "Android muestra el dialogo de vinculacion" else "no se pudo iniciar la vinculacion")
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_BT_PAIR", error.message ?: "no se pudo vincular", error)
    }
  }

  @Suppress("MissingPermission")
  @ReactMethod
  fun btConnect(address: String, connect: Boolean, promise: Promise) {
    if (btMissing(promise)) {
      return
    }
    try {
      val device = btRemote(address, promise) ?: return
      val a2dp = btProfile(device, BluetoothProfile.A2DP, connect)
      val headset = a2dp || btProfile(device, BluetoothProfile.HEADSET, connect)
      val ok = a2dp || headset
      if (!ok) {
        promise.reject(
          "E_BT_CONNECT",
          if (connect) {
            "Android no dejo conectar por codigo: abri Ajustes > Bluetooth y toca el dispositivo"
          }
          else {
            "no se pudo desconectar: proba desde Ajustes > Bluetooth"
          },
        )
        return
      }
      promise.resolve(
        JSONObject()
          .put("ok", true)
          .put("address", device.address)
          .put("profile", if (a2dp) "a2dp" else "headset")
          .toString(),
      )
    }
    catch (error: Throwable) {
      promise.reject("E_BT_CONNECT", error.message ?: "no se pudo cambiar la conexion", error)
    }
  }

  @Suppress("MissingPermission", "DEPRECATION")
  @ReactMethod
  fun btSetEnabled(enabled: Boolean, promise: Promise) {
    try {
      val adapter = btAdapterOrReject(promise) ?: return
      if (enabled) {
        if (btGranted() && adapter.isEnabled) {
          promise.resolve(JSONObject().put("ok", true).put("enabled", true).toString())
          return
        }
        val intent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(intent)
        promise.resolve(
          JSONObject()
            .put("ok", true)
            .put("enabled", false)
            .put("nota", "se abrio el dialogo del sistema; el usuario debe aceptar y hay que reintentar")
            .toString(),
        )
        return
      }
      if (Build.VERSION.SDK_INT >= 33) {
        ctx.startActivity(
          Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
        promise.resolve(
          JSONObject()
            .put("ok", false)
            .put("enabled", true)
            .put("nota", "Android 13+ no permite apagar el bluetooth por codigo: se abrieron los Ajustes")
            .toString(),
        )
        return
      }
      val off = runCatching { adapter.disable() }.getOrDefault(false)
      promise.resolve(JSONObject().put("ok", off).put("enabled", !off).toString())
    }
    catch (error: Throwable) {
      promise.reject("E_BT_ENABLE", error.message ?: "no se pudo cambiar el estado", error)
    }
  }

  @ReactMethod
  fun btSettings(promise: Promise) {
    try {
      ctx.startActivity(
        Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
      promise.resolve(true)
    }
    catch (error: Throwable) {
      promise.reject("E_BT_SETTINGS", error.message ?: "no se pudieron abrir los ajustes", error)
    }
  }

  // ------------------------------------------------------------- helpers
  private fun requestPermissions(names: Array<String>): Boolean {
    val activity = ctx.currentActivity ?: return false
    try {
      activity.requestPermissions(names, PERMISSION_REQUEST)
      return true
    }
    catch (_: Throwable) {
      return false
    }
  }

  private fun granted(permission: String): Boolean =
    ctx.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

  private fun readText(path: String): String? = try {
    val file = File(path)
    if (file.exists()) file.readText().trim() else null
  }
  catch (_: Throwable) {
    null
  }

  private fun JSONObject.putIfAbsent(key: String, value: Any?) {
    if (value != null && !has(key)) {
      put(key, value)
    }
  }

  private fun round1(value: Double): Double = Math.round(value * 10.0) / 10.0
  private fun round3(value: Double): Double = Math.round(value * 1000.0) / 1000.0
  private fun round6(value: Double): Double = Math.round(value * 1000000.0) / 1000000.0

  private fun sensorType(name: String): Int? = when (name) {
    "accelerometer", "acelerometro" -> Sensor.TYPE_ACCELEROMETER
    "gyroscope", "giroscopio" -> Sensor.TYPE_GYROSCOPE
    "magnetometer", "compass", "brujula" -> Sensor.TYPE_MAGNETIC_FIELD
    "light", "luz" -> Sensor.TYPE_LIGHT
    "proximity", "proximidad" -> Sensor.TYPE_PROXIMITY
    "pressure", "barometer", "presion" -> Sensor.TYPE_PRESSURE
    "step", "steps", "podometro" -> Sensor.TYPE_STEP_COUNTER
    "rotation", "rotation_vector" -> Sensor.TYPE_ROTATION_VECTOR
    "gravity", "gravedad" -> Sensor.TYPE_GRAVITY
    "linear", "linear_acceleration" -> Sensor.TYPE_LINEAR_ACCELERATION
    "humidity", "humedad" -> Sensor.TYPE_RELATIVE_HUMIDITY
    "temperature", "temperatura" -> Sensor.TYPE_AMBIENT_TEMPERATURE
    "heart", "heart_rate" -> Sensor.TYPE_HEART_RATE
    else -> null
  }

  private fun sensorTypeName(type: Int): String = when (type) {
    Sensor.TYPE_ACCELEROMETER -> "accelerometer"
    Sensor.TYPE_GYROSCOPE -> "gyroscope"
    Sensor.TYPE_MAGNETIC_FIELD -> "magnetometer"
    Sensor.TYPE_LIGHT -> "light"
    Sensor.TYPE_PROXIMITY -> "proximity"
    Sensor.TYPE_PRESSURE -> "pressure"
    Sensor.TYPE_STEP_COUNTER -> "step"
    Sensor.TYPE_STEP_DETECTOR -> "step_detector"
    Sensor.TYPE_ROTATION_VECTOR -> "rotation"
    Sensor.TYPE_GRAVITY -> "gravity"
    Sensor.TYPE_LINEAR_ACCELERATION -> "linear_acceleration"
    Sensor.TYPE_RELATIVE_HUMIDITY -> "humidity"
    Sensor.TYPE_AMBIENT_TEMPERATURE -> "temperature"
    Sensor.TYPE_HEART_RATE -> "heart_rate"
    else -> "type_$type"
  }

  private companion object {
    const val PERMISSION_REQUEST = 4712
    const val MAX_SAMPLES = 2000
    const val DAY_MS = 24L * 60 * 60 * 1000
    /** Prefs donde JS copia `tools.*` (config invalida del usuario al arrancar). */
    const val TOOLS_PREFS = "chia_tools"
    /** Defaults SOLO hasta el primer push desde la base de datos. */
    const val MAX_HTTP_BYTES = 64 * 1024
    const val MAX_FILE_BYTES = 4 * 1024 * 1024
    const val MAX_SEARCH_RESULTS = 500
    const val MAX_SEARCH_DEPTH = 12
    const val SCAN_THREADS = 48
    const val SCAN_MS = 20_000L
  }
}
