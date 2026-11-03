import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { flushHistory, hydrate } from './src/agent/controller';
import { ensurePermissions } from './src/boot/permissions';
import { ensureHomeShortcut } from './src/boot/shortcut';
import { clearAuth, hasSession, hydrateSettings } from './src/settings/store';
import { checkUpdate, shouldCheck, skipVersion } from './src/update/check';
import type { UpdateInfo } from './src/update/check';
import { ChatScreen } from './src/ui/ChatScreen';
import { LoginScreen } from './src/ui/LoginScreen';
import { ProfileScreen } from './src/ui/ProfileScreen';
import { RecoverScreen } from './src/ui/RecoverScreen';
import { RegisterScreen } from './src/ui/RegisterScreen';
import { SettingsScreen } from './src/ui/SettingsScreen';
import { UpdateModal } from './src/ui/UpdateModal';
import { useTheme } from './src/ui/theme';

type Route = 'chat' | 'settings' | 'login' | 'register' | 'recover' | 'profile';

function startRoute(): Route {
  return hasSession() ? 'chat' : 'login';
}

export default function App() {
  const { dark, c } = useTheme();
  const [route, setRoute] = useState<Route | null>(null);
  const [fromSettings, setFromSettings] = useState(false);
  const [profileFrom, setProfileFrom] = useState<'chat' | 'settings'>('chat');
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let alive = true;
    const look = () => {
      try {
        if (!shouldCheck()) {
          return;
        }
      }
      catch (error) {
        return;
      }
      void checkUpdate()
        .then(info => {
          if (alive && info) {
            setUpdate(info);
          }
        })
        .catch(() => {});
    };
    const timer = setTimeout(look, 2000);
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') {
        look();
      }
    });
    return () => {
      alive = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    hydrateSettings();
    setRoute(startRoute());
    void hydrate();
    void ensurePermissions();
    void ensureHomeShortcut();
    const subscription = AppState.addEventListener('change', status => {
      if (status !== 'active') {
        flushHistory();
      }
    });
    return () => {
      subscription.remove();
      flushHistory();
    };
  }, []);

  const onLogout = useCallback(() => {
    clearAuth();
    setFromSettings(false);
    setRoute('login');
  }, []);

  const back = fromSettings ? () => setRoute('settings') : undefined;

  if (!route) {
    return <View style={[styles.root, { backgroundColor: c.bg }]} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        {route === 'settings' ? (
          <SettingsScreen onClose={() => setRoute('chat')} />
        ) : route === 'profile' ? (
          <ProfileScreen
            onClose={() => setRoute(profileFrom)}
            onChangeSession={() => {
              setFromSettings(true);
              setRoute('login');
            }}
            onLoggedOut={onLogout}
          />
        ) : route === 'login' ? (
          <LoginScreen
            onCancel={back}
            onDone={() => {
              setFromSettings(false);
              setRoute('chat');
            }}
            onRegister={() => setRoute('register')}
            onRecover={() => setRoute('recover')}
          />
        ) : route === 'register' ? (
          <RegisterScreen
            onCancel={back}
            onLogin={() => setRoute('login')}
            onDone={() => {
              setFromSettings(false);
              setRoute('chat');
            }}
          />
        ) : route === 'recover' ? (
          <RecoverScreen
            onCancel={() => setRoute('login')}
            onLogin={() => setRoute('login')}
            onDone={() => {
              setFromSettings(false);
              setRoute('chat');
            }}
          />
        ) : (
          <ChatScreen
            onOpenSettings={() => setRoute('settings')}
            onOpenProfile={() => {
              setProfileFrom('chat');
              setRoute('profile');
            }}
          />
        )}
      </View>
      <UpdateModal
        info={update}
        onLater={() => setUpdate(null)}
        onSkip={() => {
          if (update) {
            skipVersion(update.versionCode);
          }
          setUpdate(null);
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
