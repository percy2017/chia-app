package com.chianative

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.security.MessageDigest

data class ChiaNotifRow(
  val id: Long,
  val sbnKey: String,
  val pkg: String,
  val appLabel: String,
  val title: String,
  val body: String,
  val subText: String,
  val category: String,
  val channel: String,
  val postedAt: Long,
  val isOngoing: Boolean,
  val isGroup: Boolean,
  val isClearable: Boolean,
  val removedAt: Long?,
)

/**
 * Historial de notificaciones del telefono en SQLite propio (framework, sin
 * dependencias): `notifications.db`, tabla `notifications`.
 *
 * Mismo patron que NotiNative: `fingerprint` SHA-1 unico para dedupe y
 * `sbn_key` para quedarse con una sola fila visible por notificacion; al
 * descartarla desde el telefono se marca `removed_at` en vez de borrar, asi el
 * modelo sigue viendo lo que ya se descarto (marcado) si se pide historial.
 * Escribe el servicio del sistema aunque la app este cerrada.
 */
class ChiaNotifStore private constructor(context: Context) :
  SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

  init {
    setWriteAheadLoggingEnabled(true)
  }

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      """
      CREATE TABLE $TABLE (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint TEXT NOT NULL UNIQUE,
        sbn_key TEXT NOT NULL,
        pkg TEXT NOT NULL,
        app_label TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        sub_text TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        channel TEXT NOT NULL DEFAULT '',
        posted_at INTEGER NOT NULL,
        captured_at INTEGER NOT NULL,
        is_ongoing INTEGER NOT NULL DEFAULT 0,
        is_group INTEGER NOT NULL DEFAULT 0,
        is_clearable INTEGER NOT NULL DEFAULT 1,
        removed_at INTEGER
      )
      """.trimIndent(),
    )
    db.execSQL("CREATE INDEX ix_notif_posted ON $TABLE(posted_at DESC, id DESC)")
    db.execSQL("CREATE INDEX ix_notif_key ON $TABLE(sbn_key)")
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    // Migracion aditiva: no se pierde el historial ya capturado.
  }

  override fun onOpen(db: SQLiteDatabase) {
    super.onOpen(db)
    // Tabla de la version anterior de la bitacora de eventos.
    db.execSQL("DROP TABLE IF EXISTS notification_events")
    // Una sola fila visible por sbn_key: las copias viejas quedan como removidas.
    db.execSQL(
      "UPDATE $TABLE SET removed_at = ? WHERE removed_at IS NULL AND id NOT IN (" +
        "SELECT MAX(id) FROM $TABLE WHERE removed_at IS NULL GROUP BY sbn_key)",
      arrayOf<Any>(System.currentTimeMillis()),
    )
  }

  /** Inserta o actualiza la fila visible de esa notificacion. */
  @Synchronized
  fun insert(row: ChiaNotifRow): Boolean {
    val existing = visibleId(row.sbnKey)
    if (existing != null) {
      writableDatabase.update(
        TABLE,
        values(row, withFingerprint = false),
        "id = ?",
        arrayOf(existing.toString()),
      )
      return true
    }
    val id = writableDatabase.insertWithOnConflict(
      TABLE,
      null,
      values(row, withFingerprint = true),
      SQLiteDatabase.CONFLICT_IGNORE,
    )
    if (id == -1L) {
      return false
    }
    trim()
    return true
  }

  @Synchronized
  fun markRemoved(key: String?): Boolean {
    if (key.isNullOrEmpty()) {
      return false
    }
    val rows = writableDatabase.update(
      TABLE,
      ContentValues().apply { put("removed_at", System.currentTimeMillis()) },
      "sbn_key = ? AND removed_at IS NULL",
      arrayOf(key),
    )
    return rows > 0
  }

  /** Mas nuevas primero. `filter` busca en paquete, app, titulo y cuerpo. */  @Synchronized
  fun list(limit: Int, filter: String, includeRemoved: Boolean): List<ChiaNotifRow> {
    val rows = ArrayList<ChiaNotifRow>()
    val needle = filter.trim().lowercase()
    readableDatabase.rawQuery(
      "SELECT id, sbn_key, pkg, app_label, title, body, sub_text, category, channel, " +
        "posted_at, is_ongoing, is_group, is_clearable, removed_at FROM $TABLE " +
        (if (includeRemoved) "" else "WHERE removed_at IS NULL ") +
        "ORDER BY posted_at DESC, id DESC LIMIT $MAX_READ",
      null,
    ).use { cursor ->
      while (cursor.moveToNext() && rows.size < limit) {
        val row = ChiaNotifRow(
          id = cursor.getLong(0),
          sbnKey = cursor.getString(1),
          pkg = cursor.getString(2),
          appLabel = cursor.getString(3),
          title = cursor.getString(4),
          body = cursor.getString(5),
          subText = cursor.getString(6),
          category = cursor.getString(7),
          channel = cursor.getString(8),
          postedAt = cursor.getLong(9),
          isOngoing = cursor.getInt(10) != 0,
          isGroup = cursor.getInt(11) != 0,
          isClearable = cursor.getInt(12) != 0,
          removedAt = if (cursor.isNull(13)) null else cursor.getLong(13),
        )
        if (needle.isNotEmpty() && !matches(row, needle)) {
          continue
        }
        rows.add(row)
      }
    }
    return rows
  }

  @Synchronized
  fun count(includeRemoved: Boolean): Int = readableDatabase.rawQuery(
    "SELECT COUNT(*) FROM $TABLE" + (if (includeRemoved) "" else " WHERE removed_at IS NULL"),
    null,
  ).use { if (it.moveToFirst()) it.getInt(0) else 0 }

  @Synchronized
  fun clear() {
    writableDatabase.delete(TABLE, null, null)
  }

  private fun matches(row: ChiaNotifRow, needle: String): Boolean {
    fun hit(value: String): Boolean = value.lowercase().contains(needle)
    return hit(row.pkg) || hit(row.appLabel) || hit(row.title) || hit(row.body)
  }

  private fun visibleId(key: String): Long? = readableDatabase.rawQuery(
    "SELECT id FROM $TABLE WHERE sbn_key = ? AND removed_at IS NULL " +
      "ORDER BY posted_at DESC, id DESC LIMIT 1",
    arrayOf(key),
  ).use { if (it.moveToFirst()) it.getLong(0) else null }

  private fun values(row: ChiaNotifRow, withFingerprint: Boolean): ContentValues
  = ContentValues().apply {
    if (withFingerprint) {
      put("fingerprint", fingerprint(row))
    }
    put("sbn_key", row.sbnKey)
    put("pkg", row.pkg)
    put("app_label", row.appLabel)
    put("title", row.title)
    put("body", row.body)
    put("sub_text", row.subText)
    put("category", row.category)
    put("channel", row.channel)
    put("posted_at", row.postedAt)
    put("captured_at", System.currentTimeMillis())
    put("is_ongoing", if (row.isOngoing) 1 else 0)
    put("is_group", if (row.isGroup) 1 else 0)
    put("is_clearable", if (row.isClearable) 1 else 0)
  }

  /** Recorta el historial: las 500 mas nuevas (la herramienta no necesita mas). */
  private fun trim() {
    writableDatabase.execSQL(
      "DELETE FROM $TABLE WHERE id NOT IN (SELECT id FROM $TABLE ORDER BY posted_at DESC, id DESC LIMIT $MAX_ROWS)",
    )
  }

  companion object {
    private const val DB_NAME = "notifications.db"
    private const val DB_VERSION = 3
    private const val TABLE = "notifications"
    private const val MAX_ROWS = 500
    private const val MAX_READ = 400
    @Volatile
    private var instance: ChiaNotifStore? = null

    fun get(context: Context): ChiaNotifStore {
      val app = context.applicationContext
      return instance ?: synchronized(this) {
        instance ?: ChiaNotifStore(app).also { instance = it }
      }
    }

    private fun fingerprint(row: ChiaNotifRow): String = sha1(
      listOf(row.pkg, row.sbnKey, row.title, row.body, row.postedAt).joinToString("|"),
    )

    private fun sha1(value: String): String = MessageDigest.getInstance("SHA-1")
      .digest(value.toByteArray(Charsets.UTF_8))
      .joinToString("") { "%02x".format(it) }
  }
}
