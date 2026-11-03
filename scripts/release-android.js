#!/usr/bin/env node
/**
 * Build de produccion + instalacion por USB en un solo paso.
 *
 *   npm run android:install
 *
 * 1) assembleRelease (arm64-v8a, build cache + configuration cache)
 * 2) instala el APK en el dispositivo conectado (adb)
 * 3) abre la app
 *
 * Variables opcionales:
 *   ANDROID_SERIAL=<serial>   elige dispositivo si hay varios
 *   SKIP_BUILD=1              solo instala el APK ya compilado
 *   NO_LAUNCH=1               no abre la app al terminar
 */
const { spawnSync } = require('node:child_process');
const { existsSync, statSync } = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const APK = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const PACKAGE = 'com.chianative';
const ABI = 'arm64-v8a';

const isWin = process.platform === 'win32';
const gradlew = isWin ? 'gradlew.bat' : './gradlew';

function run(cmd, args, options = {}) {
  const started = Date.now();
  process.stdout.write(`\n> ${cmd} ${args.join(' ')}\n`);
  const result = spawnSync(cmd, args, {
    cwd: options.cwd ?? ROOT,
    stdio: options.capture ? 'pipe' : 'inherit',
    shell: isWin,
    encoding: 'utf8',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stdout ?? ''}${result.stderr ?? ''}` : '';
    throw new Error(`"${cmd} ${args.join(' ')}" fallo con codigo ${result.status}${detail}`);
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (!options.silent) {
    console.log(`  ok (${seconds}s)`);
  }
  return result;
}

function pickDevice() {
  const { stdout } = run('adb', ['devices'], { capture: true, silent: true });
  const devices = stdout
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split(/\s+/))
    .filter(([, state]) => state === 'device')
    .map(([serial]) => serial);

  if (devices.length === 0) {
    throw new Error('No hay dispositivos USB conectados. Activa depuracion USB y acepta la huella RSA.');
  }

  const selected = process.env.ANDROID_SERIAL || devices[0];
  if (!devices.includes(selected)) {
    throw new Error(`ANDROID_SERIAL=${selected} no esta conectado. Disponibles: ${devices.join(', ')}`);
  }
  return selected;
}

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function main() {
  const started = Date.now();
  const serial = pickDevice();
  console.log(`\nDispositivo: ${serial}`);

  if (process.env.SKIP_BUILD !== '1') {
    run(gradlew, [
      'assembleRelease',
      `-PreactNativeArchitectures=${ABI}`,
      '--build-cache',
      '--configuration-cache',
      '--console=plain',
    ], { cwd: ANDROID });
  } else {
    console.log('\nSKIP_BUILD=1 -> se usa el APK existente');
  }

  if (!existsSync(APK)) {
    throw new Error(`No existe el APK: ${APK}`);
  }

  const apk = statSync(APK);
  console.log(`\nAPK: ${APK} (${formatSize(apk.size)}, ${new Date(apk.mtimeMs).toLocaleString()})`);

  run('adb', ['-s', serial, 'install', '-r', APK]);

  if (process.env.NO_LAUNCH !== '1') {
    run('adb', [
      '-s',
      serial,
      'shell',
      'monkey',
      '-p',
      PACKAGE,
      '-c',
      'android.intent.category.LAUNCHER',
      '1',
    ]);
  }

  const total = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\nListo: ${PACKAGE} instalado y actualizado en ${serial} (${total}s)`);
}

try {
  main();
} catch (error) {
  console.error(`\nERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
