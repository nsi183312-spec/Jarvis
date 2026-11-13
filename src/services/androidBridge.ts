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
