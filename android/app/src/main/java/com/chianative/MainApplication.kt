package com.chianative

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import java.net.Proxy
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(ShellPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Las redes móviles anuncian a veces un proxy HTTP inalcanzable: ignoramos
    // cualquier proxy del sistema para que las peticiones al LLM vayan directas.
    OkHttpClientProvider.setOkHttpClientFactory(
      object : OkHttpClientFactory {
        override fun createNewNetworkModuleClient(): OkHttpClient =
          OkHttpClientProvider.createClientBuilder(applicationContext)
            .proxy(Proxy.NO_PROXY)
            .connectTimeout(20, TimeUnit.SECONDS)
            .build()
      },
    )
    loadReactNative(this)
  }
}
