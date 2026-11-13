import assert from 'node:assert/strict';
import { CommandRouter } from '../src/services/commandRouter';
import { androidBridge } from '../src/services/androidBridge';
import { DeviceState } from '../src/types';

// Lightweight global mocks for Node test execution
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

  // 2. Native Companion Mode: Discovers real PackageManager apps
  await test('Installed app discovery parses real PackageManager apps from JarvisAndroid bridge', () => {
    const installedList = [
      { appName: 'WhatsApp', packageName: 'com.whatsapp', isAllowed: true },
      { appName: 'YouTube', packageName: 'com.google.android.youtube', isAllowed: true },
      { appName: 'Maps', packageName: 'com.google.android.apps.maps', isAllowed: true },
    ];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; vivo V29) JarvisCompanion/1.0',
      bridge: {
        executeCommand: () => JSON.stringify({ ok: true, status: 'executed', message: 'ok' }),
        getInstalledAppsJson: () => JSON.stringify(installedList),
        isAppAllowed: () => true,
        isAccessibilityEnabled: () => false,
      },
    });
    const res = androidBridge.getDiscoveredInstalledApps();
    assert.equal(res.nativeDiscovery, true);
    assert.equal(res.apps.length, 3);
    assert.equal(res.apps[0].packageName, 'com.whatsapp');
  });

  // 3. Real App Launching in Native Bridge Mode (Zero Browser Tabs)
  await test('Native Bridge launches WhatsApp, YouTube, Google Maps directly with zero browser URLs', async () => {
    const calls: Array<{ action: string; payload: string }> = [];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string, payload: string) => {
          calls.push({ action, payload });
          return JSON.stringify({ ok: true, status: 'executed', message: `${payload} opened` });
        },
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const wa = await router.executeLocalCommand('Open WhatsApp', defaultDeviceState);
    assert.equal(wa.handled, true);
    assert.equal(wa.actionType, 'open_whatsapp');
    assert.equal(wa.externalUrl, undefined);

    const yt = await router.executeLocalCommand('Open YouTube', defaultDeviceState);
    assert.equal(yt.handled, true);
    assert.equal(yt.actionType, 'open_youtube');
    assert.equal(yt.externalUrl, undefined);

    const maps = await router.executeLocalCommand('Open Google Maps', defaultDeviceState);
    assert.equal(maps.handled, true);
    assert.equal(maps.actionType, 'open_maps');
    assert.equal(maps.externalUrl, undefined);

    assert.deepEqual(
      calls.map((c) => `${c.action}:${c.payload}`),
      [
        'open_app:com.whatsapp',
        'open_app:com.google.android.youtube',
        'open_app:com.google.android.apps.maps',
      ]
    );
  });

  // 4. Android Browser Fallback uses package-targeted Intents (never fake Chrome tabs)
  await test('Android Browser fallback builds native package intents (no web URL tabs)', async () => {
    setupEnv({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125.0' });
    const router = new CommandRouter();

    const wa = await router.executeLocalCommand('Open WhatsApp', defaultDeviceState);
    assert.equal(wa.handled, true);
    assert.ok(wa.externalUrl?.startsWith('intent://'));
    assert.ok(wa.externalUrl?.includes('package=com.whatsapp'));

    const cam = await router.executeLocalCommand('Open Camera', defaultDeviceState);
    assert.equal(cam.handled, true);
    assert.ok(cam.externalUrl?.includes('STILL_IMAGE_CAMERA'));

    const phone = await router.executeLocalCommand('Open Phone', defaultDeviceState);
    assert.equal(phone.handled, true);
    assert.equal(phone.externalUrl, 'tel:');

    const settings = await router.executeLocalCommand('Open Settings', defaultDeviceState);
    assert.equal(settings.handled, true);
    assert.ok(settings.externalUrl?.includes('android.settings.SETTINGS'));
  });

  // 5. In-App Commands: YouTube Search, Maps Navigation, Chrome Website, Gmail Compose
  await test('In-app commands route accurately to YouTube search, Maps directions, and Chrome URL', async () => {
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

    const ytSearch = await router.executeLocalCommand(
      'Search for cricket videos on YouTube',
      defaultDeviceState
    );
    assert.equal(ytSearch.handled, true);
    assert.equal(ytSearch.actionType, 'youtube_play');
    assert.equal(calls[0].action, 'youtube_search');
    assert.equal(calls[0].payload, 'cricket videos');

    const mapsNav = await router.executeLocalCommand(
      'Navigate to Delhi Airport on Google Maps',
      defaultDeviceState
    );
    assert.equal(mapsNav.handled, true);
    assert.equal(mapsNav.actionType, 'maps_navigate');
    assert.equal(calls[1].action, 'maps_navigate');
    assert.ok(calls[1].payload.includes('delhi airport'));

    const chromeOpen = await router.executeLocalCommand(
      'Open wikipedia.org in Chrome',
      defaultDeviceState
    );
    assert.equal(chromeOpen.handled, true);
    assert.equal(chromeOpen.actionType, 'chrome_open_url');
    assert.equal(calls[2].action, 'chrome_open_url');
    assert.equal(calls[2].payload, 'https://wikipedia.org');
  });

  // 6. Sensitive Actions Require User Confirmation (WhatsApp send, Gmail compose, Call, SMS, UPI)
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

    const waSend = await router.executeLocalCommand(
      'Send WhatsApp message Hello Team',
      defaultDeviceState
    );
    assert.equal(waSend.requiresConfirmation, true);
    assert.equal(waSend.actionType, 'whatsapp_send');
    assert.equal(calls.length, 0); // Must NOT execute before confirm!
    waSend.confirmationDetails?.onConfirm();
    assert.equal(calls[0].action, 'whatsapp_send');

    const gmail = await router.executeLocalCommand(
      'Send email to luckylife@example.com in Gmail',
      defaultDeviceState
    );
    assert.equal(gmail.requiresConfirmation, true);
    assert.equal(gmail.actionType, 'gmail_compose');
    assert.equal(calls.length, 1);
    gmail.confirmationDetails?.onConfirm();
    assert.equal(calls[1].action, 'gmail_compose');
    assert.equal(calls[1].payload, 'luckylife@example.com');

    const callRes = await router.executeLocalCommand('call 9876543210', defaultDeviceState);
    assert.equal(callRes.requiresConfirmation, true);
    assert.equal(callRes.actionType, 'direct_call');

    const payRes = await router.executeLocalCommand(
      'pay 500 on phonepe',
      defaultDeviceState
    );
    assert.equal(payRes.requiresConfirmation, true);
    assert.equal(payRes.actionType, 'upi_confirmation');
  });

  // 7. Per-App Permission Handling + Explicit Accessibility Consent
  await test('Per-app permission block prevents app launch & Accessibility asks explicit consent', async () => {
    const bridgeCalls: string[] = [];
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (action: string) => {
          bridgeCalls.push(action);
          return JSON.stringify({ ok: true, status: 'executed', message: 'ok' });
        },
        isAccessibilityEnabled: () => false,
      },
    });

    androidBridge.setAppControlAllowed('com.whatsapp', false);
    const router = new CommandRouter();

    const blockedWa = await router.executeLocalCommand('Open WhatsApp', defaultDeviceState);
    assert.equal(blockedWa.handled, true);
    assert.equal(blockedWa.actionType, 'permission_denied');
    assert.equal(blockedWa.externalUrl, undefined);
    assert.equal(bridgeCalls.length, 0);

    // Accessibility without consent prompts confirmation dialog first
    const scrollPrompt = await router.executeLocalCommand('scroll down', defaultDeviceState);
    assert.equal(scrollPrompt.handled, true);
    assert.equal(scrollPrompt.actionType, 'accessibility_consent_required');
    assert.equal(scrollPrompt.requiresConfirmation, true);
    assert.equal(bridgeCalls.length, 0);
  });

  // 8. Unavailable Apps & Error Handling (Never opens Play Store/Google search tab)
  await test('Unavailable apps explain clearly without opening browser tabs & handle malformed bridge errors', async () => {
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: (_action: string, payload: string) => {
          if (payload === 'nonexistentapp99') {
            return JSON.stringify({
              ok: false,
              status: 'not_installed',
              installed: false,
              message: 'App not installed',
            });
          }
          return '{broken json';
        },
        isAppAllowed: () => true,
      },
    });
    const router = new CommandRouter();

    const missing = await router.executeLocalCommand('Open NonExistentApp99', defaultDeviceState);
    assert.equal(missing.handled, true);
    assert.equal(missing.actionType, 'app_not_installed');
    assert.equal(missing.externalUrl, undefined);
    assert.ok(missing.reply.toLowerCase().includes('installed nahi'));

    // Malformed bridge JSON is handled gracefully without crashing
    const errRes = androidBridge.executeNativeCommand('open_camera', '');
    assert.equal(errRes.ok, false);
    assert.equal(errRes.status, 'error');
  });

  // 9. Security Guardrails: OTP/Login bypass + Unlisted bridge action blocked
  await test('Security guardrails reject OTP/login bypasses and arbitrary unlisted bridge actions', async () => {
    setupEnv({
      userAgent: 'Mozilla/5.0 (Linux; Android 14) JarvisCompanion/1.0',
      bridge: {
        executeCommand: () => JSON.stringify({ ok: true, status: 'executed', message: 'should never run' }),
      },
    });
    const router = new CommandRouter();

    const bypassOtp = await router.executeLocalCommand('bypass otp screen please', defaultDeviceState);
    assert.equal(bypassOtp.handled, true);
    assert.equal(bypassOtp.actionType, 'security_blocked');

    const skipLogin = await router.executeLocalCommand('skip login verification', defaultDeviceState);
    assert.equal(skipLogin.handled, true);
    assert.equal(skipLogin.actionType, 'security_blocked');

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
