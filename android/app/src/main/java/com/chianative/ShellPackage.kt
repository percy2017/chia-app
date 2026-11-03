package com.chianative

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ShellPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(
      ShellModule(context),
      AttachModule(context),
      AudioModule(context),
      KeepAliveModule(context),
      RagModule(context),
      PhoneModule(context),
      BootModule(context),
      RecordModule(context),
      ShortcutModule(context),
      UpdateModule(context),
    )

  override fun createViewManagers(
    context: ReactApplicationContext,
  ): List<ViewManager<*, *>> = emptyList()
}
