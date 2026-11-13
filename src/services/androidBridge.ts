export interface DiscoveredAndroidApp {
  appName: string;
  packageName: string;
  activityName?: string;
  isAllowed: boolean;
  isSystemApp?: boolean;
}

export interface BridgeCommandResponse {
  ok: boolean;
  bridged: boolean;
  status: 'executed' | 'not_installed' | 'permission_denied' | 'blocked_action' | 'unavailable' | 'error';
  message: string;
  installed?: boolean;
  requiresPermission?: string;
  data?: any;
}

export interface JarvisNativeBridgeInterface {
  executeCommand: (action: string, payload?: string) => string | boolean | void;
  getInstalledAppsJson?: () => string;
  setAppAllowed?: (packageName: string, allowed: boolean) => boolean;
  isAppAllowed?: (packageName: string) => boolean;
  isAccessibilityEnabled?: () => boolean;
  openAccessibilitySettings?: () => boolean;
  getBridgeVersion?: () => string;
}

/**
 * Explicit allowlist of approved actions the Web UI is permitted to invoke on the
 * Native Android Companion bridge. Any action outside this list is rejected.
 */
export const APPROVED_BRIDGE_ACTIONS = new Set<string>([
  'open_app',
  'open_app_name',
  'youtube_play',
  'youtube_search',
  'maps_navigate',
  'chrome_open_url',
  'whatsapp_send',
  'gmail_compose',
  'pinterest_search',
  'store_search',
  'in_app_search',
  'open_url',
  'open_dialer',
  'open_camera',
  'open_gallery',
  'open_settings',
  'open_sub_settings',
  'open_wifi_settings',
  'open_bluetooth_settings',
  'open_data_settings',
  'call',
  'sms',
  'alarm',
  'flashlight',
  'mobile_data',
  'wifi',
  'bluetooth',
  'hotspot',
  'airplane_mode',
  'dnd',
  'volume',
  'brightness',
  'music_next',
  'music_prev',
  'music_pause',
  'scroll_down',
  'scroll_up',
  'click',
  'type',
  'screenshot',
  'go_home',
  'go_back',
  'recents',
]);

const ALLOWED_APPS_STORAGE_KEY = 'jarvis_allowed_apps_control_v1';
const ACCESSIBILITY_CONSENT_KEY = 'jarvis_accessibility_user_consent_v1';

class AndroidBridgeClient {
  private getRawBridge(): JarvisNativeBridgeInterface | null {
    if (typeof window === 'undefined') return null;
    try {
      const bridge = (window as any)?.JarvisAndroid;
      if (bridge && typeof bridge.executeCommand === 'function') {
        return bridge as JarvisNativeBridgeInterface;
      }
    } catch {
      // No native bridge available in standard browser
    }
    return null;
  }

  public isNativeCompanionConnected(): boolean {
    return this.getRawBridge() !== null;
  }

  public isAndroidBrowser(): boolean {
    return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  }

  public executeNativeCommand(action: string, payload?: any): BridgeCommandResponse {
    if (!APPROVED_BRIDGE_ACTIONS.has(action)) {
      return {
        ok: false,
        bridged: false,
        status: 'blocked_action',
        message: `Security Policy: Action "${action}" approved bridge allowlist me nahi hai.`,
      };
    }

    const bridge = this.getRawBridge();
    if (!bridge) {
      return {
        ok: false,
        bridged: false,
        status: 'unavailable',
        message: 'Native Android Companion bridge connected nahi hai.',
      };
    }

    try {
      const stringPayload =
        payload === undefined || payload === null
          ? ''
          : typeof payload === 'string'
          ? payload
          : JSON.stringify(payload);
      const rawResult = bridge.executeCommand(action, stringPayload);

      if (typeof rawResult === 'string' && rawResult.trim().startsWith('{')) {
        const parsed = JSON.parse(rawResult);
        return {
          ok: Boolean(parsed.ok),
          bridged: true,
          status: parsed.status || (parsed.ok ? 'executed' : 'error'),
          message: parsed.message || '',
          installed: parsed.installed,
          requiresPermission: parsed.requiresPermission,
          data: parsed.data,
        };
      }

      if (rawResult === false) {
        return {
          ok: false,
          bridged: true,
          status: 'error',
          message: 'Native Android command execute nahi ho saka.',
        };
      }

      return {
        ok: true,
        bridged: true,
        status: 'executed',
        message: 'Executed on native Android.',
      };
    } catch (err: any) {
      return {
        ok: false,
        bridged: true,
        status: 'error',
        message: err?.message || 'Android bridge invocation error.',
      };
    }
  }

  /**
   * Returns ONLY real installed apps discovered on the phone via Android PackageManager
   * when connected to the Native Android Companion. Never invents installed apps in a browser.
   */
  public getDiscoveredInstalledApps(): {
    nativeDiscovery: boolean;
    apps: DiscoveredAndroidApp[];
  } {
    const bridge = this.getRawBridge();
    if (!bridge || typeof bridge.getInstalledAppsJson !== 'function') {
      return { nativeDiscovery: false, apps: [] };
    }

    try {
      const jsonStr = bridge.getInstalledAppsJson();
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return {
          nativeDiscovery: true,
          apps: parsed.filter((item) => item && item.packageName && item.appName),
        };
      }
    } catch {
      // parse error
    }
    return { nativeDiscovery: true, apps: [] };
  }

  /**
   * Dynamically matches ANY spoken/typed app name (English, Hindi/Hinglish, partial or slightly misspelled)
   * against the real launchable apps discovered on the phone via Android PackageManager.
   */
  public findBestInstalledApp(spokenQuery: string): DiscoveredAndroidApp | null {
    const { nativeDiscovery, apps } = this.getDiscoveredInstalledApps();
    if (!nativeDiscovery || apps.length === 0) return null;

    const clean = spokenQuery
      .toLowerCase()
      .replace(/\b(open|kholo|kholiye|khole|khol|launch|start|chalu|chalao|karo|do|app|application|please|jarvis|mein|me|par|pe)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return null;

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNorm = norm(clean);
    if (!cleanNorm) return null;

    let bestApp: DiscoveredAndroidApp | null = null;
    let bestScore = 0;

    for (const app of apps) {
      const labelLower = app.appName.toLowerCase().trim();
      const labelNorm = norm(labelLower);
      const pkgLower = app.packageName.toLowerCase();
      const pkgTokens = pkgLower.split('.').filter((t) => t && !['com', 'org', 'net', 'in', 'android', 'google', 'apps', 'app'].includes(t));

      let score = 0;
      if (labelLower === clean || labelNorm === cleanNorm || pkgLower === clean) {
        score = 1.0;
      } else if (labelLower.split(/\s+/).some((w) => norm(w) === cleanNorm)) {
        score = 0.94;
      } else if (pkgTokens.some((t) => t === cleanNorm)) {
        score = 0.92;
      } else if (labelNorm.startsWith(cleanNorm) || cleanNorm.startsWith(labelNorm)) {
        score = 0.88;
      } else if (labelNorm.includes(cleanNorm) || (labelNorm.length >= 3 && cleanNorm.includes(labelNorm))) {
        score = 0.84;
      } else {
        const sim = this.diceSimilarity(cleanNorm, labelNorm);
        if (sim >= 0.72) {
          score = sim * 0.82;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestApp = app;
      }
    }

    return bestScore >= 0.6 ? bestApp : null;
  }

  private diceSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const bigramsA = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
      const bg = a.slice(i, i + 2);
      bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
    }
    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
      const bg = b.slice(i, i + 2);
      const count = bigramsA.get(bg) || 0;
      if (count > 0) {
        bigramsA.set(bg, count - 1);
        intersection++;
      }
    }
    return (2 * intersection) / (a.length - 1 + (b.length - 1));
  }

  public isAppControlAllowed(packageName: string): boolean {
    if (!packageName) return true;
    const bridge = this.getRawBridge();
    if (bridge && typeof bridge.isAppAllowed === 'function') {
      try {
        return Boolean(bridge.isAppAllowed(packageName));
      } catch {
        // fallback to localStorage
      }
    }

    if (typeof localStorage === 'undefined') return true;
    try {
      const raw = localStorage.getItem(ALLOWED_APPS_STORAGE_KEY);
      if (!raw) return true;
      const map: Record<string, boolean> = JSON.parse(raw);
      return map[packageName] !== false;
    } catch {
      return true;
    }
  }

  public setAppControlAllowed(packageName: string, allowed: boolean): void {
    if (!packageName) return;
    const bridge = this.getRawBridge();
    if (bridge && typeof bridge.setAppAllowed === 'function') {
      try {
        bridge.setAppAllowed(packageName, allowed);
      } catch {
        // ignore
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(ALLOWED_APPS_STORAGE_KEY);
        const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
        map[packageName] = allowed;
        localStorage.setItem(ALLOWED_APPS_STORAGE_KEY, JSON.stringify(map));
      } catch {
        // ignore
      }
    }
  }

  public getAppPermissionsMap(): Record<string, boolean> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const raw = localStorage.getItem(ALLOWED_APPS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public hasAccessibilityUserConsent(): boolean {
    const bridge = this.getRawBridge();
    if (bridge && typeof bridge.isAccessibilityEnabled === 'function') {
      try {
        return Boolean(bridge.isAccessibilityEnabled());
      } catch {
        // ignore
      }
    }
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(ACCESSIBILITY_CONSENT_KEY) === 'granted';
  }

  public setAccessibilityUserConsent(granted: boolean): void {
    if (typeof localStorage !== 'undefined') {
      try {
        if (granted) {
          localStorage.setItem(ACCESSIBILITY_CONSENT_KEY, 'granted');
        } else {
          localStorage.removeItem(ACCESSIBILITY_CONSENT_KEY);
        }
      } catch {
        // ignore
      }
    }
    if (granted) {
      const bridge = this.getRawBridge();
      if (bridge && typeof bridge.openAccessibilitySettings === 'function') {
        try {
          if (typeof bridge.isAccessibilityEnabled === 'function' && !bridge.isAccessibilityEnabled()) {
            bridge.openAccessibilitySettings();
          }
        } catch {
          // ignore
        }
      }
    }
  }
}

export const androidBridge = new AndroidBridgeClient();
