import assert from 'node:assert/strict';
import { CommandRouter } from '../src/services/commandRouter';
import { androidBridge } from '../src/services/androidBridge';
import { DeviceState } from '../src/types';

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
}

const defaultDeviceState: DeviceState = {
  flashlight: false,
  wifiEnabled: true,
  mobileDataEnabled: true,
  bluetoothEnabled: false,
  brightness: 70,
  volume: 80,
  batteryLevel: 85,
  isCharging: false,
};

function setupEnv({
  userAgent,
  bridge,
}: {
  userAgent: string;
  bridge?: Record<string, any> | null;
}) {
  const storage = createMockStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent }, configurable: true });
  Object.defineProperty(globalThis, 'window', {
    value: bridge ? { JarvisAndroid: bridge } : {},
    configurable: true,
  });
}

async function runTests() {
  let passed = 0;
  const test = async (name: string, fn: () => Promise<void> | void) => {
    await fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  };

  // 1. Browser Mode: Never invents installed apps
  await test('Installed app discovery returns empty list in standard browser (never invents apps)', () => {
    setupEnv({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125.0' });
    const res = androidBridge.getDiscoveredInstalledApps();
    assert.equal(res.nativeDiscovery, false);
    assert.deepEqual(res.apps, []);
  });

  // 2. Native Companion Mode: Dynamically discovers ALL installed apps (arbitrary 3rd-party + OEM)
  await test('Dynamic discovery detects ALL arbitrary third-party and OEM apps from PackageManager', () => {
    const installedList = [
      { appName: 'WhatsApp', packageName: 'com.whatsapp', isAllowed: true },
      { appName: 'YouTube', packageName: 'com.google.android.youtube', isAllowed: true },
      { appName: 'Instagram', packageName: 'com.instagram.android', isAllowed: true },
      { appName: 'Facebook Lite', packageName: 'com.facebook.lite', isAllowed: true },
      { appName: 'Chrome', packageName: 'com.android.chrome', isAllowed: true },
      { appName: 'Flipkart', packageName: 'com.flipkart.android', isAllowed: true },
      { appName: 'Amazon Shopping', packageName: 'in.amazon.mShop.android.shopping', isAllowed: true },
      { appName: 'Zomato', packageName: 'com.application.zomato', isAllowed: true },
      { appName: 'Canva', packageName: 'com.canva.editor', isAllowed: true },
      { appName: 'Samsung Music', packageName: 'com.sec.android.app.music', isAllowed: true },
    ];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Galaxy S24) JarvisCompanion/1.0',
      bridge: {
        executeCommand: () => JSON.stringify({ ok: true, status: 'executed', message: 'ok' }),
        getInstalledAppsJson: () => JSON.stringify(installedList),
        isAppAllowed: () => true,
      },
    });
    const res = androidBridge.getDiscoveredInstalledApps();
    assert.equal(res.nativeDiscovery, true);
    assert.equal(res.apps.length, 10);
    assert.equal(androidBridge.findBestInstalledApp('canva')?.packageName, 'com.canva.editor');
    assert.equal(androidBridge.findBestInstalledApp('facebook')?.packageName, 'com.facebook.lite');
    assert.equal(androidBridge.findBestInstalledApp('samsung music')?.packageName, 'com.sec.android.app.music');
  });

  // 3. Exact Prompt Commands in Native Companion Mode (English + Hinglish + Hindi Devanagari)
  await test('Exact prompt commands work natively with zero browser tabs (English, Hinglish & Hindi)', async () => {
    const calls: Array<{ action: string; payload: string }> = [];
    const installedList = [
      { appName: 'YouTube', packageName: 'com.google.android.youtube', isAllowed: true },
      { appName: 'WhatsApp', packageName: 'com.whatsapp', isAllowed: true },
      { appName: 'Instagram', packageName: 'com.instagram.android', isAllowed: true },
      { appName: 'Facebook', packageName: 'com.facebook.katana', isAllowed: true },
      { appName: 'Chrome', packageName: 'com.android.chrome', isAllowed: true },
      { appName: 'Flipkart', packageName: 'com.flipkart.android', isAllowed: true },
      { appName: 'Canva', packageName: 'com.canva.editor', isAllowed: true },
      { appName: 'Blinkit', packageName: 'com.grofers.customerapp', isAllowed: true },
    ];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string, payload: string) => {
          calls.push({ action, payload });
          return JSON.stringify({ ok: true, status: 'executed', message: `${payload} opened` });
        },
        getInstalledAppsJson: () => JSON.stringify(installedList),
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const yt = await router.executeLocalCommand('Open YouTube.', defaultDeviceState);
    assert.equal(yt.handled, true);
    assert.equal(yt.externalUrl, undefined);

    const wa = await router.executeLocalCommand('WhatsApp kholo.', defaultDeviceState);
    assert.equal(wa.handled, true);
    assert.equal(wa.externalUrl, undefined);

    const ig = await router.executeLocalCommand('Instagram open karo.', defaultDeviceState);
    assert.equal(ig.handled, true);
    assert.equal(ig.externalUrl, undefined);

    const fb = await router.executeLocalCommand('Facebook kholo.', defaultDeviceState);
    assert.equal(fb.handled, true);
    assert.equal(fb.externalUrl, undefined);

    const ytSearch = await router.executeLocalCommand('YouTube par Hindi song search karo.', defaultDeviceState);
    assert.equal(ytSearch.handled, true);
    assert.equal(ytSearch.externalUrl, undefined);

    const chromeSite = await router.executeLocalCommand('Chrome mein website kholo.', defaultDeviceState);
    assert.equal(chromeSite.handled, true);
    assert.equal(chromeSite.externalUrl, undefined);

    // Arbitrary non-hardcoded installed apps in Hindi Devanagari and English!
    const hindiFlipkart = await router.executeLocalCommand('फ्लिपकार्ट खोलो', defaultDeviceState);
    assert.equal(hindiFlipkart.handled, true);
    assert.equal(hindiFlipkart.externalUrl, undefined);

    const canva = await router.executeLocalCommand('Canva open karo', defaultDeviceState);
    assert.equal(canva.handled, true);
    assert.equal(canva.externalUrl, undefined);

    const hindiFb = await router.executeLocalCommand('फेसबुक खोलो', defaultDeviceState);
    assert.equal(hindiFb.handled, true);
    assert.equal(hindiFb.externalUrl, undefined);

    assert.deepEqual(
      calls.map((c) => `${c.action}:${c.payload}`),
      [
        'open_app:com.google.android.youtube',
        'open_app:com.whatsapp',
        'open_app:com.instagram.android',
        'open_app:com.facebook.katana',
        'youtube_search:hindi song',
        'chrome_open_url:',
        'open_app:com.flipkart.android',
        'open_app:com.canva.editor',
        'open_app:com.facebook.katana',
      ]
    );
  });

  // 4. OEM Fallback Never Falsely Reports Installed App Unavailable
  await test('Never falsely reports installed OEM/variant app unavailable when hardcoded package differs', async () => {
    const calls: Array<{ action: string; payload: string }> = [];
    const installedList = [
      { appName: 'Music', packageName: 'com.sec.android.app.music', isAllowed: true },
      { appName: 'WhatsApp Business', packageName: 'com.whatsapp.w4b', isAllowed: true },
    ];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string, payload: string) => {
          calls.push({ action, payload });
          if (payload === 'com.android.bbkmusic' || payload === 'com.whatsapp') {
            return JSON.stringify({ ok: false, status: 'not_installed', message: 'not installed' });
          }
          return JSON.stringify({ ok: true, status: 'executed', message: `${payload} opened` });
        },
        getInstalledAppsJson: () => JSON.stringify(installedList),
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const music = await router.executeLocalCommand('Music kholo', defaultDeviceState);
    assert.equal(music.handled, true);
    assert.notEqual(music.actionType, 'app_not_installed');
    assert.equal(calls[0].payload, 'com.sec.android.app.music');

    const waBiz = await router.executeLocalCommand('WhatsApp kholo', defaultDeviceState);
    assert.equal(waBiz.handled, true);
    assert.notEqual(waBiz.actionType, 'app_not_installed');
    assert.equal(calls[1].payload, 'com.whatsapp.w4b');
  });

  // 5. Dynamic Universal In-App Search for ANY Installed App
  await test('Dynamic universal in-app search dispatches in_app_search for discovered apps', async () => {
    const calls: Array<{ action: string; payload: string }> = [];
    const installedList = [
      { appName: 'Amazon Shopping', packageName: 'in.amazon.mShop.android.shopping', isAllowed: true },
      { appName: 'Google Maps', packageName: 'com.google.android.apps.maps', isAllowed: true },
    ];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string, payload: string) => {
          calls.push({ action, payload });
          return JSON.stringify({ ok: true, status: 'executed', message: 'Executed' });
        },
        getInstalledAppsJson: () => JSON.stringify(installedList),
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const amz = await router.executeLocalCommand('Amazon mein running shoes search karo', defaultDeviceState);
    assert.equal(amz.handled, true);
    assert.equal(amz.actionType, 'in_app_search');
    assert.equal(calls[0].action, 'in_app_search');
    assert.equal(calls[0].payload, 'Amazon Shopping|running shoes');

    const mapsNav = await router.executeLocalCommand('Navigate to Delhi Airport on Google Maps', defaultDeviceState);
    assert.equal(mapsNav.handled, true);
    assert.equal(calls[1].action, 'maps_navigate');
  });

  // 6. Android Browser fallback builds native package intents (no web URL tabs) & explains limitation cleanly
  await test('Android Browser fallback builds native package intents & explains browser sandbox limitation honestly', async () => {
    setupEnv({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125.0' });
    const router = new CommandRouter();

    const fb = await router.executeLocalCommand('Facebook kholo.', defaultDeviceState);
    assert.equal(fb.handled, true);
    assert.ok(fb.externalUrl?.startsWith('intent://'));
    assert.ok(fb.externalUrl?.includes('package=com.facebook.katana'));

    const ytSong = await router.executeLocalCommand('YouTube par Hindi song search karo.', defaultDeviceState);
    assert.equal(ytSong.handled, true);
    assert.ok(ytSong.externalUrl?.startsWith('intent://'));
    assert.ok(ytSong.externalUrl?.includes('hindi%20song'));
    assert.ok(ytSong.externalUrl?.includes('package=com.google.android.youtube'));

    const chromeSite = await router.executeLocalCommand('Chrome mein wikipedia.org kholo', defaultDeviceState);
    assert.equal(chromeSite.handled, true);
    assert.ok(chromeSite.externalUrl?.startsWith('intent://wikipedia.org'));
    assert.ok(chromeSite.externalUrl?.includes('package=com.android.chrome'));

    // Arbitrary app in plain browser does NOT falsely say app isn't installed—explains companion requirement!
    const customInBrowser = await router.executeLocalCommand('Open Canva', defaultDeviceState);
    assert.equal(customInBrowser.handled, true);
    assert.equal(customInBrowser.actionType, 'native_companion_required');
    assert.equal(customInBrowser.externalUrl, undefined);
  });

  // 7. Sensitive Actions Require User Confirmation (WhatsApp send, Gmail compose, Call, SMS, UPI)
  await test('Sensitive actions always require explicit user confirmation', async () => {
    const calls: Array<{ action: string; payload: string }> = [];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string, payload: string) => {
          calls.push({ action, payload });
          return JSON.stringify({ ok: true, status: 'executed', message: 'Executed' });
        },
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const waSend = await router.executeLocalCommand('Send WhatsApp message Hello Team', defaultDeviceState);
    assert.equal(waSend.requiresConfirmation, true);
    assert.equal(calls.length, 0);
    waSend.confirmationDetails?.onConfirm();
    assert.equal(calls[0].action, 'whatsapp_send');

    const gmail = await router.executeLocalCommand('Send email to luckylife@example.com in Gmail', defaultDeviceState);
    assert.equal(gmail.requiresConfirmation, true);
    gmail.confirmationDetails?.onConfirm();
    assert.equal(calls[1].action, 'gmail_compose');

    const callRes = await router.executeLocalCommand('call 9876543210', defaultDeviceState);
    assert.equal(callRes.requiresConfirmation, true);
  });

  // 8. Per-App Permission Block + Explicit Accessibility Consent
  await test('Per-app permission block prevents app launch & Accessibility asks explicit consent', async () => {
    const bridgeCalls: string[] = [];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string) => {
          bridgeCalls.push(action);
          return JSON.stringify({ ok: true, status: 'executed', message: 'ok' });
        },
        getInstalledAppsJson: () => JSON.stringify([{ appName: 'WhatsApp', packageName: 'com.whatsapp', isAllowed: false }]),
        isAccessibilityEnabled: () => false,
      },
    });

    androidBridge.setAppControlAllowed('com.whatsapp', false);
    const router = new CommandRouter();

    const blockedWa = await router.executeLocalCommand('WhatsApp kholo', defaultDeviceState);
    assert.equal(blockedWa.handled, true);
    assert.equal(blockedWa.actionType, 'permission_denied');
    assert.equal(bridgeCalls.length, 0);

    const scrollPrompt = await router.executeLocalCommand('scroll down', defaultDeviceState);
    assert.equal(scrollPrompt.actionType, 'accessibility_consent_required');
    assert.equal(scrollPrompt.requiresConfirmation, true);
  });

  // 9. Unavailable Apps & Security Guardrails
  await test('Unavailable apps in native mode report app_not_installed with zero tabs & guardrails block bypasses', async () => {
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (_action: string, payload: string) => {
          if (payload === 'nonexistentapp99') {
            return JSON.stringify({ ok: false, status: 'not_installed', installed: false, message: 'not installed' });
          }
          return '{broken json';
        },
        getInstalledAppsJson: () => '[]',
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const missing = await router.executeLocalCommand('Open NonExistentApp99', defaultDeviceState);
    assert.equal(missing.handled, true);
    assert.equal(missing.actionType, 'app_not_installed');
    assert.equal(missing.externalUrl, undefined);

    const bypassOtp = await router.executeLocalCommand('bypass otp screen please', defaultDeviceState);
    assert.equal(bypassOtp.actionType, 'security_blocked');

    const blockedBridge = androidBridge.executeNativeCommand('arbitrary_shell_exec', 'rm -rf');
    assert.equal(blockedBridge.ok, false);
    assert.equal(blockedBridge.status, 'blocked_action');
  });

  console.log(`\nALL ${passed} TESTS PASSED SUCCESSFULLY.`);
}

runTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
