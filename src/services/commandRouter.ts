import {
  BuiltInAppModalType,
  DeviceState,
  MainTabId,
  QuickNote,
  AlarmItem,
} from '../types';
import { normalizeHindiToHinglish } from './offlineBrain';

export interface ApiMappingInfo {
  intent: string;
  mode: 'web-api' | 'android-bridge' | 'simulator-mock';
  webApi: string;
  state?: Record<string, any>;
}

export interface CommandUiAction {
  tab?: MainTabId;
  featuresSubTab?: 'apps' | 'device';
  settingsSection?: 'chat' | 'voice' | 'apps' | 'apk' | 'general';
  modal?: BuiltInAppModalType;
  scrollDelta?: number;
  timerSeconds?: number;
  timerLabel?: string;
}

export interface CommandExecutionResult {
  handled: boolean;
  reply: string;
  actionType?: string;
  apiMapping?: ApiMappingInfo;
  requiresConfirmation?: boolean;
  confirmationDetails?: {
    action: string;
    target: string;
    onConfirm: () => void;
  };
  deviceStateUpdate?: Partial<DeviceState>;
  noteCreated?: QuickNote;
  alarmCreated?: AlarmItem;
  externalUrl?: string;
  externalLabel?: string;
  uiAction?: CommandUiAction;
}

export interface KnownAppEntry {
  key: string;
  name: string;
  aliases: string[];
  packageName: string;
  webUrl: string;
  deepLink?: string;
  replyMsg: string;
}

export const PHONE_APPS_DIRECTORY: KnownAppEntry[] = [
  // User's 26 Phone Apps (vivo + Google + Daily Apps)
  {
    key: 'maps',
    name: 'Maps',
    aliases: ['maps', 'google maps', 'map', 'navigation', 'rasta'],
    packageName: 'com.google.android.apps.maps',
    webUrl: 'https://maps.google.com',
    deepLink: 'geo:0,0?q=',
    replyMsg: 'Google Maps open kar rahi hoon!',
  },
  {
    key: 'meet',
    name: 'Meet',
    aliases: ['meet', 'google meet', 'video meeting'],
    packageName: 'com.google.android.apps.meetings',
    webUrl: 'https://meet.google.com',
    replyMsg: 'Google Meet open kar rahi hoon!',
  },
  {
    key: 'messages',
    name: 'Messages',
    aliases: ['messages', 'message app', 'sms app', 'text messages'],
    packageName: 'com.google.android.apps.messaging',
    webUrl: 'sms:',
    replyMsg: 'Messages app open kar rahi hoon!',
  },
  {
    key: 'moviebox',
    name: 'MovieBox+',
    aliases: ['moviebox+', 'moviebox plus', 'moviebox', 'movie box'],
    packageName: 'com.movieboxpro.android',
    webUrl: 'https://www.google.com/search?q=MovieBox%2B+movies',
    replyMsg: 'MovieBox+ open kar rahi hoon! Aap kaunsi movie ya series dekhna chahenge?',
  },
  {
    key: 'music',
    name: 'Music',
    aliases: ['music', 'imusic', 'music player', 'songs app', 'gana app'],
    packageName: 'com.android.bbkmusic',
    webUrl: 'https://music.youtube.com',
    replyMsg: 'Music player open kar rahi hoon!',
  },
  {
    key: 'myjio',
    name: 'MyJio',
    aliases: ['myjio', 'my jio', 'jio app', 'jio'],
    packageName: 'com.jio.myjio',
    webUrl: 'https://www.jio.com/selfcare/login',
    deepLink: 'myjio://',
    replyMsg: 'MyJio app khol rahi hoon! Data balance ya recharge check kar sakte hain.',
  },
  {
    key: 'notes',
    name: 'Notes',
    aliases: ['notes', 'vivo notes', 'keep notes', 'note app', 'notepad'],
    packageName: 'com.vivo.notes',
    webUrl: 'https://keep.google.com',
    replyMsg: 'Notes app open kar rahi hoon!',
  },
  {
    key: 'phone',
    name: 'Phone',
    aliases: ['phone', 'dialer', 'phone app', 'call app', 'contacts'],
    packageName: 'com.android.dialer',
    webUrl: 'tel:',
    replyMsg: 'Phone dialer open kar rahi hoon!',
  },
  {
    key: 'photos',
    name: 'Photos',
    aliases: ['photos', 'google photos', 'gallery', 'albums', 'photo'],
    packageName: 'com.google.android.apps.photos',
    webUrl: 'https://photos.google.com',
    replyMsg: 'Photos & Gallery open kar rahi hoon!',
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    aliases: ['pinterest', 'pintrest'],
    packageName: 'com.pinterest',
    webUrl: 'https://www.pinterest.com',
    deepLink: 'pinterest://',
    replyMsg: 'Pinterest khol rahi hoon! Wallpapers ya ideas search karne ho to bolein.',
  },
  {
    key: 'playstore',
    name: 'Play Store',
    aliases: ['play store', 'playstore', 'google play'],
    packageName: 'com.android.vending',
    webUrl: 'https://play.google.com/store',
    deepLink: 'market://details?id=com.android.vending',
    replyMsg: 'Google Play Store open kar rahi hoon!',
  },
  {
    key: 'recorder',
    name: 'Recorder',
    aliases: ['recorder', 'voice recorder', 'sound recorder', 'audio recorder'],
    packageName: 'com.android.bbksoundrecorder',
    webUrl: '',
    replyMsg: 'Voice Recorder ready hai! Android app me direct recording start ho jayegi.',
  },
  {
    key: 'safety',
    name: 'Safety',
    aliases: ['safety', 'personal safety', 'emergency', 'sos'],
    packageName: 'com.google.android.apps.safetyhub',
    webUrl: '',
    replyMsg: 'Safety & Emergency dashboard open kar rahi hoon!',
  },
  {
    key: 'settings',
    name: 'Settings',
    aliases: ['settings', 'phone settings', 'device settings', 'setting'],
    packageName: 'com.android.settings',
    webUrl: '',
    replyMsg: 'Phone Settings open kar rahi hoon!',
  },
  {
    key: 'simpleview',
    name: 'Simple View',
    aliases: ['simple view', 'simple mode', 'easy mode', 'simple launcher'],
    packageName: 'com.vivo.simplelauncher',
    webUrl: '',
    replyMsg: 'vivo Simple View mode open kar rahi hoon!',
  },
  {
    key: 'snapchat',
    name: 'Snapchat',
    aliases: ['snapchat', 'snap'],
    packageName: 'com.snapchat.android',
    webUrl: 'https://www.snapchat.com',
    deepLink: 'snapchat://',
    replyMsg: 'Snapchat khol rahi hoon!',
  },
  {
    key: 'telegram',
    name: 'Telegram',
    aliases: ['telegram', 'tele'],
    packageName: 'org.telegram.messenger',
    webUrl: 'https://web.telegram.org',
    deepLink: 'tg://',
    replyMsg: 'Telegram open kar rahi hoon!',
  },
  {
    key: 'themes',
    name: 'Themes',
    aliases: ['themes', 'theme', 'itheme', 'wallpaper store'],
    packageName: 'com.bbk.theme',
    webUrl: '',
    replyMsg: 'vivo Themes & Wallpapers open kar rahi hoon!',
  },
  {
    key: 'tips',
    name: 'Tips',
    aliases: ['tips', 'vivo tips', 'phone tips'],
    packageName: 'com.vivo.tips',
    webUrl: 'https://www.vivo.com/in/support',
    replyMsg: 'vivo Tips & Tricks open kar rahi hoon!',
  },
  {
    key: 'vappstore',
    name: 'V-Appstore',
    aliases: ['v-appstore', 'v appstore', 'vappstore', 'vivo appstore', 'vivo app store'],
    packageName: 'com.vivo.appstore',
    webUrl: 'https://www.vivo.com/in',
    replyMsg: 'vivo V-Appstore open kar rahi hoon!',
  },
  {
    key: 'video',
    name: 'Video',
    aliases: ['video', 'video player', 'ivideo', 'videos'],
    packageName: 'com.vivo.videoeditor',
    webUrl: 'https://www.youtube.com',
    replyMsg: 'Video player open kar rahi hoon!',
  },
  {
    key: 'vivocloud',
    name: 'vivo Cloud',
    aliases: ['vivo cloud', 'vivocloud', 'cloud backup'],
    packageName: 'com.vivo.cloud',
    webUrl: 'https://cloud.vivo.com',
    replyMsg: 'vivo Cloud backup & sync open kar rahi hoon!',
  },
  {
    key: 'vivostore',
    name: 'vivo Store',
    aliases: ['vivo store', 'vivostore', 'vivo shop'],
    packageName: 'com.vivo.website',
    webUrl: 'https://shop.vivo.com/in',
    replyMsg: 'vivo Store open kar rahi hoon!',
  },
  {
    key: 'weather',
    name: 'Weather',
    aliases: ['weather', 'mausam app', 'vivo weather'],
    packageName: 'com.vivo.weather',
    webUrl: 'https://www.google.com/search?q=weather+today',
    replyMsg: 'Weather report open kar rahi hoon!',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    aliases: ['whatsapp', 'whats app', 'wa'],
    packageName: 'com.whatsapp',
    webUrl: 'https://web.whatsapp.com',
    deepLink: 'whatsapp://',
    replyMsg: 'WhatsApp open kar rahi hoon!',
  },
  {
    key: 'youtube',
    name: 'YouTube',
    aliases: ['youtube', 'yt', 'you tube'],
    packageName: 'com.google.android.youtube',
    webUrl: 'https://www.youtube.com',
    deepLink: 'vnd.youtube://',
    replyMsg: 'YouTube open kar rahi hoon!',
  },
  // Extra popular apps
  {
    key: 'instagram',
    name: 'Instagram',
    aliases: ['instagram', 'insta'],
    packageName: 'com.instagram.android',
    webUrl: 'https://www.instagram.com',
    deepLink: 'instagram://',
    replyMsg: 'Instagram khol rahi hoon!',
  },
  {
    key: 'chrome',
    name: 'Chrome',
    aliases: ['chrome', 'browser', 'google chrome'],
    packageName: 'com.android.chrome',
    webUrl: 'https://www.google.com',
    replyMsg: 'Chrome browser open ho raha hai.',
  },
  {
    key: 'phonepe',
    name: 'PhonePe',
    aliases: ['phonepe', 'phone pe'],
    packageName: 'com.phonepe.app',
    webUrl: 'https://www.phonepe.com',
    deepLink: 'phonepe://pay',
    replyMsg: 'PhonePe open kar rahi hoon!',
  },
  {
    key: 'gpay',
    name: 'Google Pay',
    aliases: ['gpay', 'google pay'],
    packageName: 'com.google.android.apps.nbu.paisa.user',
    webUrl: 'https://pay.google.com',
    deepLink: 'tez://upi/pay',
    replyMsg: 'Google Pay open kar rahi hoon!',
  },
  {
    key: 'paytm',
    name: 'Paytm',
    aliases: ['paytm'],
    packageName: 'net.one97.paytm',
    webUrl: 'https://paytm.com',
    deepLink: 'paytmmp://pay',
    replyMsg: 'Paytm open ho raha hai!',
  },
  {
    key: 'spotify',
    name: 'Spotify',
    aliases: ['spotify'],
    packageName: 'com.spotify.music',
    webUrl: 'https://open.spotify.com',
    deepLink: 'spotify://',
    replyMsg: 'Spotify music khol rahi hoon!',
  },
  {
    key: 'camera',
    name: 'Camera',
    aliases: ['camera', 'selfie camera'],
    packageName: 'com.android.camera',
    webUrl: '',
    replyMsg: 'Camera open ho gaya hai!',
  },
  {
    key: 'calculator',
    name: 'Calculator',
    aliases: ['calculator', 'calc'],
    packageName: 'com.google.android.calculator',
    webUrl: '',
    replyMsg: 'Calculator ready hai.',
  },
  {
    key: 'gmail',
    name: 'Gmail',
    aliases: ['gmail', 'email', 'mail'],
    packageName: 'com.google.android.gm',
    webUrl: 'https://mail.google.com',
    replyMsg: 'Gmail open kar rahi hoon!',
  },
];

export class CommandRouter {
  private torchTrack: MediaStreamTrack | null = null;

  public isAndroidDevice(): boolean {
    return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  }

  private hasNativeAndroidBridge(): boolean {
    try {
      const bridge = typeof window !== 'undefined' ? (window as any)?.JarvisAndroid : null;
      return Boolean(bridge && typeof bridge.executeCommand === 'function');
    } catch {
      return false;
    }
  }

  public buildAppLaunchUrl(app: {
    packageName?: string;
    webUrl?: string;
    deepLink?: string;
  }): string | undefined {
    const fallbackUrl = app.webUrl || undefined;
    if (!this.isAndroidDevice()) {
      return fallbackUrl || app.deepLink || undefined;
    }

    // Native phone URI schemes work directly from Android browsers & WebViews
    if (fallbackUrl && /^(tel:|sms:|market:|geo:)/i.test(fallbackUrl)) {
      return fallbackUrl;
    }
    if (app.deepLink && /^(tel:|sms:|market:)/i.test(app.deepLink)) {
      return app.deepLink;
    }

    const fallbackParam =
      fallbackUrl && /^https?:\/\//i.test(fallbackUrl)
        ? `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};`
        : '';

    // Prefer declared custom scheme on Android (opens real installed WhatsApp/Instagram/Telegram/MyJio/Snapchat/Spotify/Pinterest)
    if (app.deepLink && app.deepLink.includes('://') && app.packageName) {
      const idx = app.deepLink.indexOf('://');
      const scheme = app.deepLink.slice(0, idx);
      const hostPath = app.deepLink.slice(idx + 3);
      return `intent://${hostPath}#Intent;scheme=${scheme};package=${app.packageName};${fallbackParam}end`;
    }

    // Otherwise use HTTPS App Link with explicit target package (opens YouTube, Maps, Meet, Photos, Gmail directly in app)
    if (fallbackUrl && fallbackUrl.startsWith('https://') && app.packageName) {
      const hostPath = fallbackUrl.slice(8);
      return `intent://${hostPath}#Intent;scheme=https;package=${app.packageName};${fallbackParam}end`;
    }

    return fallbackUrl;
  }

  public buildDeepIntentUrl(
    httpsUrl: string,
    packageName: string,
    customSchemeUrl?: string
  ): string {
    if (!this.isAndroidDevice()) {
      return httpsUrl;
    }
    const fallbackParam = `S.browser_fallback_url=${encodeURIComponent(httpsUrl)};`;
    if (customSchemeUrl && customSchemeUrl.includes('://')) {
      const idx = customSchemeUrl.indexOf('://');
      const scheme = customSchemeUrl.slice(0, idx);
      const hostPath = customSchemeUrl.slice(idx + 3);
      return `intent://${hostPath}#Intent;scheme=${scheme};package=${packageName};${fallbackParam}end`;
    }
    if (httpsUrl.startsWith('https://')) {
      return `intent://${httpsUrl.slice(8)}#Intent;scheme=https;package=${packageName};${fallbackParam}end`;
    }
    return httpsUrl;
  }

  public async toggleFlashlight(on: boolean): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      if (on) {
        if (!this.torchTrack) {
          const tryEnableFromConstraints = async (
            constraints: MediaStreamConstraints
          ): Promise<MediaStreamTrack | null> => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia(constraints);
              const track = stream.getVideoTracks()[0];
              if (!track) return null;
              const caps = (track.getCapabilities && (track.getCapabilities() as any)) || {};
              if (caps.torch) {
                return track;
              }
              track.stop();
              return null;
            } catch {
              return null;
            }
          };

          // Try default rear camera first
          let foundTrack = await tryEnableFromConstraints({
            video: { facingMode: 'environment' } as any,
          });

          // Multi-camera Android phones (e.g. vivo/Samsung) may expose torch on a secondary rear camera ID
          if (!foundTrack && typeof navigator.mediaDevices.enumerateDevices === 'function') {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(
              (d) =>
                d.kind === 'videoinput' &&
                !/front|selfie|user/i.test(d.label || '')
            );
            for (const cam of [...cameras].reverse()) {
              foundTrack = await tryEnableFromConstraints({
                video: { deviceId: { exact: cam.deviceId } } as any,
              });
              if (foundTrack) break;
            }
          }

          if (!foundTrack) return false;
          this.torchTrack = foundTrack;
        }

        const capabilities =
          (this.torchTrack.getCapabilities && (this.torchTrack.getCapabilities() as any)) || {};
        if (capabilities.torch) {
          await (this.torchTrack as any).applyConstraints({
            advanced: [{ torch: true }],
          });
          return true;
        }
      } else {
        if (this.torchTrack) {
          try {
            await (this.torchTrack as any).applyConstraints({
              advanced: [{ torch: false }],
            });
          } catch {
            // ignore constraint error on teardown
          }
          this.torchTrack.stop();
          this.torchTrack = null;
        }
        return false;
      }
    } catch (e) {
      console.warn('Physical torch not supported on this device/browser:', e);
      return false;
    }
    return false;
  }

  public async getBatteryInfo(): Promise<{ level: number; charging: boolean } | null> {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: Boolean(battery.charging),
        };
      }
    } catch (err) {
      console.warn('Battery API unavailable:', err);
    }
    return null;
  }

  private extractQueryAfterKeywords(text: string, removePattern: RegExp): string {
    return text.replace(removePattern, ' ').replace(/\s+/g, ' ').trim();
  }

  private triggerAndroidBridge(action: string, value?: any): boolean {
    try {
      const bridge = typeof window !== 'undefined' ? (window as any)?.JarvisAndroid : null;
      if (bridge && typeof bridge.executeCommand === 'function') {
        bridge.executeCommand(action, value !== undefined ? String(value) : '');
        return true;
      }
    } catch {
      // web browser mode
    }
    return false;
  }

  public async executeLocalCommand(
    text: string,
    currentDeviceState: DeviceState
  ): Promise<CommandExecutionResult> {
    const query = normalizeHindiToHinglish(text);

    const isTurnOn =
      /\b(on|chalu|jala|jalao|start|enable)\b/.test(query) || query.includes('on kar');
    const isTurnOff =
      /\b(off|band|bujha|bujhao|stop|disable)\b/.test(query) || query.includes('off kar');

    // 1. FLASHLIGHT / TORCH (English + Hinglish + Devanagari normalized)
    const asksFlashlight =
      query.includes('flashlight') ||
      query.includes('torch') ||
      /\bflash\b/.test(query) ||
      /\blight\b/.test(query);
    if (asksFlashlight && isTurnOn) {
      const bridged = this.triggerAndroidBridge('flashlight', true);
      const hardwareOn = await this.toggleFlashlight(true);
      return {
        handled: true,
        reply:
          bridged || hardwareOn
            ? 'Ji! Flashlight on kar di hai.'
            : 'Flashlight mode ON kar diya hai! (Note: Real LED torch Android phone Chrome ya JARVIS APK me jalegi.)',
        actionType: 'flashlight_on',
        deviceStateUpdate: { flashlight: true },
      };
    }
    if (asksFlashlight && isTurnOff) {
      this.triggerAndroidBridge('flashlight', false);
      await this.toggleFlashlight(false);
      return {
        handled: true,
        reply: 'Flashlight band kar di gayi hai.',
        actionType: 'flashlight_off',
        deviceStateUpdate: { flashlight: false },
      };
    }

    // 1B. MOBILE DATA / INTERNET TOGGLE ("data on", "mobile data on", "data off", "net chalu karo")
    const asksMobileData =
      query.includes('mobile data') ||
      /\bdata\b/.test(query) ||
      query.includes('internet') ||
      query.includes('sim net') ||
      /\bnet\b/.test(query);
    if (asksMobileData && !query.includes('date')) {
      if (isTurnOn) {
        const bridged = this.triggerAndroidBridge('mobile_data', true);
        return {
          handled: true,
          reply: bridged
            ? 'Ji! Mobile Data on kar diya hai.'
            : 'Mobile Data ON kar diya hai! (Phone ke system SIM data toggle ke liye JARVIS Android APK me Quick Settings bridge active hota hai.)',
          actionType: 'mobile_data_on',
          deviceStateUpdate: { mobileDataEnabled: true },
        };
      }
      if (isTurnOff) {
        const bridged = this.triggerAndroidBridge('mobile_data', false);
        return {
          handled: true,
          reply: bridged
            ? 'Mobile Data band kar diya gaya hai.'
            : 'Mobile Data OFF kar diya hai.',
          actionType: 'mobile_data_off',
          deviceStateUpdate: { mobileDataEnabled: false },
        };
      }
      if (query.includes('setting') || query.includes('open')) {
        this.triggerAndroidBridge('open_data_settings');
        return {
          handled: true,
          reply: 'Mobile Data & Network Settings open kar rahi hoon!',
          actionType: 'open_data_settings',
        };
      }
    }

    // 1C. HOTSPOT & AIRPLANE MODE
    if (query.includes('hotspot') && (isTurnOn || isTurnOff)) {
      this.triggerAndroidBridge('hotspot', isTurnOn);
      return {
        handled: true,
        reply: isTurnOn ? 'Hotspot ON kar diya hai!' : 'Hotspot band kar diya hai.',
        actionType: isTurnOn ? 'hotspot_on' : 'hotspot_off',
        deviceStateUpdate: { hotspotEnabled: isTurnOn },
      };
    }

    if ((query.includes('airplane mode') || query.includes('flight mode')) && (isTurnOn || isTurnOff)) {
      this.triggerAndroidBridge('airplane_mode', isTurnOn);
      return {
        handled: true,
        reply: isTurnOn ? 'Airplane Mode ON kar diya hai.' : 'Airplane Mode OFF kar diya hai.',
        actionType: isTurnOn ? 'airplane_on' : 'airplane_off',
        deviceStateUpdate: { airplaneMode: isTurnOn },
      };
    }

    // 1D. DO NOT DISTURB (DND) / SILENT MODE
    if (
      query.includes('dnd') ||
      query.includes('do not disturb') ||
      query.includes('silent mode') ||
      query.includes('silent')
    ) {
      const targetDnd = /\btoggle\b/.test(query)
        ? !Boolean(currentDeviceState.dndEnabled)
        : isTurnOff
        ? false
        : true;
      this.triggerAndroidBridge('dnd', targetDnd);
      return {
        handled: true,
        reply: targetDnd
          ? 'Do Not Disturb (Silent Mode) ON kar diya hai!'
          : 'Do Not Disturb (Silent Mode) OFF kar diya hai.',
        actionType: targetDnd ? 'dnd_on' : 'dnd_off',
        deviceStateUpdate: { dndEnabled: targetDnd },
        apiMapping: {
          intent: 'android.app.NotificationManager.INTERRUPTION_FILTER_NONE',
          mode: 'simulator-mock',
          webApi: 'Device Notification Filter Simulator',
          state: { dndEnabled: targetDnd },
        },
      };
    }

    // 2. VOLUME & BRIGHTNESS
    if (query.includes('volume') || query.includes('awaaz')) {
      if (query.includes('up') || query.includes('badhao') || query.includes('tez') || query.includes('high')) {
        const newVol = Math.min(100, currentDeviceState.volume + 15);
        return {
          handled: true,
          reply: `Volume badha kar ${newVol}% kar diya hai.`,
          actionType: 'volume_up',
          deviceStateUpdate: { volume: newVol },
        };
      }
      if (query.includes('down') || query.includes('kam') || query.includes('dhime') || query.includes('mute')) {
        const newVol = query.includes('mute') ? 0 : Math.max(0, currentDeviceState.volume - 15);
        return {
          handled: true,
          reply: `Volume ${newVol}% kar diya hai.`,
          actionType: 'volume_down',
          deviceStateUpdate: { volume: newVol },
        };
      }
      const match = query.match(/(\d+)\s*%?/);
      if (match) {
        const vol = Math.min(100, Math.max(0, parseInt(match[1], 10)));
        return {
          handled: true,
          reply: `Volume ${vol}% par set kar diya hai.`,
          actionType: 'volume_set',
          deviceStateUpdate: { volume: vol },
        };
      }
    }

    const applyScreenBrightnessSimulation = (percent: number) => {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.style.setProperty('--jarvis-screen-brightness', `${percent}%`);
      }
      this.triggerAndroidBridge('brightness', percent);
    };

    if (
      query.includes('brightness') ||
      query.includes('roshni') ||
      query.includes('dim screen') ||
      query.includes('brighten screen')
    ) {
      let nextB: number | null = null;
      let actionType = 'brightness_set';

      const numMatch = query.match(/(\d+)\s*%?/);
      if (numMatch) {
        nextB = Math.min(100, Math.max(10, parseInt(numMatch[1], 10)));
      } else if (query.includes('full') || query.includes('max') || query.includes('100')) {
        nextB = 100;
        actionType = 'brightness_up';
      } else if (query.includes('half') || query.includes('medium') || query.includes('50')) {
        nextB = 50;
      } else if (query.includes('min') || query.includes('lowest')) {
        nextB = 15;
        actionType = 'brightness_down';
      } else if (
        query.includes('up') ||
        query.includes('badhao') ||
        query.includes('increase') ||
        query.includes('higher') ||
        query.includes('brighter')
      ) {
        nextB = Math.min(100, currentDeviceState.brightness + 20);
        actionType = 'brightness_up';
      } else if (
        query.includes('down') ||
        query.includes('kam') ||
        query.includes('decrease') ||
        query.includes('lower') ||
        query.includes('dim')
      ) {
        nextB = Math.max(10, currentDeviceState.brightness - 20);
        actionType = 'brightness_down';
      }

      if (nextB !== null) {
        applyScreenBrightnessSimulation(nextB);
        return {
          handled: true,
          reply: `Screen brightness ${nextB}% par set kar di hai.`,
          actionType,
          deviceStateUpdate: { brightness: nextB },
          apiMapping: {
            intent: 'android.settings.DISPLAY_BRIGHTNESS',
            mode: (typeof window !== 'undefined' && (window as any)?.JarvisAndroid)
              ? 'android-bridge'
              : 'simulator-mock',
            webApi: 'CSS Viewport Brightness Filter & --jarvis-screen-brightness',
            state: { brightness: nextB },
          },
        };
      }
    }

    // 3. BATTERY
    if (query.includes('battery') || query.includes('charge')) {
      const realBattery = await this.getBatteryInfo();
      const level = realBattery ? realBattery.level : currentDeviceState.batteryLevel;
      const charging = realBattery ? realBattery.charging : currentDeviceState.isCharging;
      const chargeText = charging ? 'aur phone charging par hai.' : 'hai.';
      return {
        handled: true,
        reply: `Aapke phone ki battery ${level}% ${chargeText}`,
        actionType: 'battery_check',
        deviceStateUpdate: realBattery ? { batteryLevel: level, isCharging: charging } : {},
        apiMapping: {
          intent: 'android.intent.action.BATTERY_CHANGED',
          mode: realBattery ? 'web-api' : 'simulator-mock',
          webApi: 'navigator.getBattery()',
          state: { batteryLevel: level, isCharging: charging },
        },
      };
    }

    // 4. WI-FI, BLUETOOTH & ADVANCED SETTINGS SUB-PAGES
    const isToggle = /\btoggle\b/.test(query);

    if (query.includes('wifi') || query.includes('wi-fi')) {
      const targetWifi = isToggle
        ? !currentDeviceState.wifiEnabled
        : isTurnOn
        ? true
        : isTurnOff
        ? false
        : null;

      if (targetWifi !== null) {
        const bridged = this.triggerAndroidBridge('wifi', targetWifi);
        const netInfo =
          typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;
        return {
          handled: true,
          reply: targetWifi ? 'Wi-Fi on kar diya gaya hai!' : 'Wi-Fi band kar diya hai.',
          actionType: targetWifi ? 'wifi_on' : 'wifi_off',
          deviceStateUpdate: { wifiEnabled: targetWifi },
          apiMapping: {
            intent: 'android.settings.panel.ACTION_WIFI',
            mode: bridged ? 'android-bridge' : netInfo ? 'web-api' : 'simulator-mock',
            webApi: 'navigator.connection (Network Information API) + Wi-Fi Simulator',
            state: {
              wifiEnabled: targetWifi,
              effectiveType: netInfo?.effectiveType || 'simulated',
            },
          },
        };
      }
      if (query.includes('setting') || query.includes('open') || query.includes('kholo')) {
        this.triggerAndroidBridge('open_wifi_settings');
        return {
          handled: true,
          reply: 'Wi-Fi Settings open kar rahi hoon!',
          actionType: 'open_wifi_settings',
        };
      }
    }

    if (query.includes('bluetooth')) {
      const targetBt = isToggle
        ? !currentDeviceState.bluetoothEnabled
        : isTurnOn
        ? true
        : isTurnOff
        ? false
        : null;

      if (targetBt !== null) {
        const bridged = this.triggerAndroidBridge('bluetooth', targetBt);
        let btAvailable: boolean | undefined;
        try {
          if (typeof navigator !== 'undefined' && (navigator as any).bluetooth?.getAvailability) {
            btAvailable = await (navigator as any).bluetooth.getAvailability();
          }
        } catch {
          btAvailable = undefined;
        }
        return {
          handled: true,
          reply: targetBt ? 'Bluetooth on ho gaya hai!' : 'Bluetooth band kar diya hai.',
          actionType: targetBt ? 'bluetooth_on' : 'bluetooth_off',
          deviceStateUpdate: { bluetoothEnabled: targetBt },
          apiMapping: {
            intent: 'android.bluetooth.adapter.action.REQUEST_ENABLE',
            mode: bridged
              ? 'android-bridge'
              : btAvailable !== undefined
              ? 'web-api'
              : 'simulator-mock',
            webApi: 'navigator.bluetooth.getAvailability() + Bluetooth Simulator',
            state: { bluetoothEnabled: targetBt, adapterAvailable: btAvailable ?? false },
          },
        };
      }
      if (query.includes('setting') || query.includes('open') || query.includes('kholo')) {
        this.triggerAndroidBridge('open_bluetooth_settings');
        return {
          handled: true,
          reply: 'Bluetooth Settings open kar rahi hoon!',
          actionType: 'open_bluetooth_settings',
        };
      }
    }

    if (
      query.includes('setting') &&
      (query.includes('display') ||
        query.includes('sound') ||
        query.includes('accessibility') ||
        query.includes('storage') ||
        query.includes('network') ||
        query.includes('app'))
    ) {
      this.triggerAndroidBridge('open_sub_settings', query);
      return {
        handled: true,
        reply: 'Phone & App Settings open kar rahi hoon!',
        actionType: 'open_sub_settings',
        uiAction: { tab: 'settings', settingsSection: 'general' },
      };
    }

    // 4B. IN-APP SCREEN NAVIGATION COMMANDS ("open history", "open features", "open device control", "open all apps", "open help", "open settings")
    if (
      (query.includes('history') || query.includes('chat history')) &&
      (query.includes('open') || query.includes('kholo') || query.includes('show') || query.includes('dikhao') || query === 'history')
    ) {
      return {
        handled: true,
        reply: 'AI Chat & Command History open kar rahi hoon!',
        actionType: 'open_history',
        uiAction: { tab: 'history' },
      };
    }
    if (
      (query.includes('device control') || query.includes('phone control') || query.includes('quick control')) &&
      (query.includes('open') || query.includes('kholo') || query.includes('show') || query.includes('dikhao') || query === 'device control')
    ) {
      return {
        handled: true,
        reply: 'Device Control panel open kar rahi hoon!',
        actionType: 'open_device_control',
        uiAction: { tab: 'features', featuresSubTab: 'device' },
      };
    }
    if (
      (query.includes('all apps') || query.includes('features') || query.includes('apps hub')) &&
      (query.includes('open') || query.includes('kholo') || query.includes('show') || query.includes('dikhao') || query === 'features')
    ) {
      return {
        handled: true,
        reply: 'Features & All Apps Hub open kar rahi hoon!',
        actionType: 'open_features',
        uiAction: { tab: 'features', featuresSubTab: 'apps' },
      };
    }
    if (
      (query.includes('apk') || query.includes('android code') || query.includes('export')) &&
      (query.includes('open') || query.includes('kholo') || query.includes('download') || query.includes('dikhao'))
    ) {
      return {
        handled: true,
        reply: 'APK Download & Android Project Exporter open kar rahi hoon!',
        actionType: 'open_apk',
        uiAction: { tab: 'settings', settingsSection: 'apk' },
      };
    }
    if (query === 'help' || query === 'open help' || query === 'help kholo' || query === 'commands list') {
      return {
        handled: true,
        reply: 'Help & Complete Commands Guide open kar rahi hoon!',
        actionType: 'open_help',
        uiAction: { tab: 'help' },
      };
    }

    // 5. ADVANCED IN-APP DEEP ACTIONS ACROSS USER'S APPS
    const isNativeBridge = this.hasNativeAndroidBridge();

    // YouTube Search / Play / Shorts
    if (
      query.includes('youtube') &&
      (query.includes('search') ||
        query.includes('play') ||
        query.includes('chalao') ||
        query.includes('dhundho') ||
        query.includes('song') ||
        query.includes('gaana') ||
        query.includes('video') ||
        query.includes('shorts'))
    ) {
      if (query.includes('shorts')) {
        const shortsWeb = 'https://www.youtube.com/shorts';
        this.triggerAndroidBridge('open_url', shortsWeb);
        return {
          handled: true,
          reply: 'YouTube Shorts app me open kar rahi hoon!',
          actionType: 'youtube_shorts',
          externalUrl: isNativeBridge
            ? undefined
            : this.buildDeepIntentUrl(shortsWeb, 'com.google.android.youtube'),
          externalLabel: 'Open YouTube Shorts',
        };
      }
      const targetQuery =
        this.extractQueryAfterKeywords(
          query,
          /\b(youtube|par|me|mein|search|play|chalao|dhundho|song|songs|gaane|gana|karo|open|kholo)\b/gi
        ) || 'trending songs';
      const ytWeb = `https://www.youtube.com/results?search_query=${encodeURIComponent(targetQuery)}`;
      const bridged = this.triggerAndroidBridge('youtube_play', targetQuery);
      return {
        handled: true,
        reply: `YouTube app me "${targetQuery}" search karke play kar rahi hoon!`,
        actionType: 'youtube_play',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(ytWeb, 'com.google.android.youtube'),
        externalLabel: 'Open in YouTube App',
      };
    }

    // Pinterest Search
    if (query.includes('pinterest') && (query.includes('search') || query.includes('dhundho') || query.includes('dikhao') || query.includes('wallpaper') || query.includes('idea'))) {
      const pinQuery =
        this.extractQueryAfterKeywords(
          query,
          /\b(pinterest|pintrest|par|me|search|dhundho|dikhao|karo|open|kholo)\b/gi
        ) || 'aesthetic wallpaper';
      const pinWeb = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(pinQuery)}`;
      const bridged = this.triggerAndroidBridge('pinterest_search', pinQuery);
      return {
        handled: true,
        reply: `Pinterest app par "${pinQuery}" search kar rahi hoon!`,
        actionType: 'pinterest_search',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(pinWeb, 'com.pinterest'),
        externalLabel: 'Open Pinterest App',
      };
    }

    // Play Store / V-Appstore Search or Download App
    if (
      (query.includes('play store') || query.includes('playstore') || query.includes('v-appstore') || query.includes('v appstore')) &&
      (query.includes('search') || query.includes('download') || query.includes('install') || query.includes('dhundho'))
    ) {
      const appToSearch =
        this.extractQueryAfterKeywords(
          query,
          /\b(play store|playstore|v-appstore|v appstore|par|me|search|download|install|dhundho|karo|app)\b/gi
        ) || 'popular apps';
      const storeWeb = `https://play.google.com/store/search?q=${encodeURIComponent(appToSearch)}&c=apps`;
      const bridged = this.triggerAndroidBridge('store_search', appToSearch);
      return {
        handled: true,
        reply: `Play Store app me "${appToSearch}" search kar rahi hoon!`,
        actionType: 'store_search',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(
              storeWeb,
              'com.android.vending',
              `market://search?q=${encodeURIComponent(appToSearch)}&c=apps`
            ),
        externalLabel: 'Open Play Store App',
      };
    }

    // Google Meet Join / Start Meeting
    if (query.includes('meet') && (query.includes('join') || query.includes('meeting') || query.includes('start') || query.includes('code'))) {
      const codeMatch = query.match(/[a-z]{3}-[a-z]{4}-[a-z]{3}/i);
      const meetUrl = codeMatch ? `https://meet.google.com/${codeMatch[0]}` : 'https://meet.google.com/new';
      const bridged = this.triggerAndroidBridge('open_url', meetUrl);
      return {
        handled: true,
        reply: codeMatch
          ? `Google Meet app me code ${codeMatch[0]} join kar rahi hoon!`
          : 'Google Meet app me new video meeting start kar rahi hoon!',
        actionType: 'meet_action',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(meetUrl, 'com.google.android.apps.meetings'),
        externalLabel: 'Open Google Meet App',
      };
    }

    // Google Maps Navigation / Nearby Search
    if (
      (query.includes('map') || query.includes('maps') || query.includes('nearest') || query.includes('nearby') || query.includes('rasta')) &&
      (query.includes('dhundho') ||
        query.includes('search') ||
        query.includes('rasta') ||
        query.includes('navigate') ||
        query.includes('nearest') ||
        query.includes('nearby') ||
        query.includes('le chalo') ||
        query.includes('dikhao'))
    ) {
      const place =
        this.extractQueryAfterKeywords(
          query,
          /\b(google|map|maps|par|me|ka|ke|liye|rasta|dhundho|search|navigate|dikhao|le chalo|jaana hai|karo)\b/gi
        ) || 'nearby petrol pump';
      const mapsWeb = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
      const bridged = this.triggerAndroidBridge('maps_navigate', place);
      return {
        handled: true,
        reply: `Google Maps app me "${place}" ke liye navigation khol rahi hoon!`,
        actionType: 'maps_navigate',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(
              mapsWeb,
              'com.google.android.apps.maps',
              `geo:0,0?q=${encodeURIComponent(place)}`
            ),
        externalLabel: 'Open Google Maps App',
      };
    }

    // Music Playback Controls (Play, Pause, Next, Previous, Search Song)
    if (
      query.includes('music') ||
      query.includes('song') ||
      query.includes('gana') ||
      query.includes('spotify')
    ) {
      if (query.includes('next') || query.includes('agla')) {
        this.triggerAndroidBridge('music_next');
        return {
          handled: true,
          reply: 'Agla gaana play kar rahi hoon!',
          actionType: 'music_next',
        };
      }
      if (query.includes('previous') || query.includes('pichla')) {
        this.triggerAndroidBridge('music_prev');
        return {
          handled: true,
          reply: 'Pichla gaana play kar rahi hoon!',
          actionType: 'music_prev',
        };
      }
      if (query.includes('pause') || query.includes('stop') || query.includes('roko') || query.includes('band')) {
        this.triggerAndroidBridge('music_pause');
        return {
          handled: true,
          reply: 'Music pause kar diya hai.',
          actionType: 'music_pause',
        };
      }
      if (query.includes('play') || query.includes('chalao') || query.includes('search') || query.includes('sunao')) {
        const song =
          this.extractQueryAfterKeywords(
            query,
            /\b(spotify|music|par|me|play|chalao|search|sunao|song|gaana|gana|karo)\b/gi
          ) || 'top hindi hits';
        const isSpotify = query.includes('spotify');
        const url = isSpotify
          ? `https://open.spotify.com/search/${encodeURIComponent(song)}`
          : `https://music.youtube.com/search?q=${encodeURIComponent(song)}`;
        const bridged = this.triggerAndroidBridge('open_url', url);
        return {
          handled: true,
          reply: `${isSpotify ? 'Spotify' : 'Music'} app me "${song}" play kar rahi hoon!`,
          actionType: 'music_play',
          externalUrl: bridged
            ? undefined
            : isSpotify
            ? this.buildDeepIntentUrl(url, 'com.spotify.music', `spotify://search/${encodeURIComponent(song)}`)
            : this.buildDeepIntentUrl(url, 'com.google.android.apps.youtube.music'),
          externalLabel: isSpotify ? 'Open Spotify App' : 'Open Music App',
        };
      }
    }

    // WhatsApp Send Message
    if (
      query.includes('whatsapp') &&
      (query.includes('message') || query.includes('send') || query.includes('bhejo') || query.includes('likho'))
    ) {
      const msgBody =
        this.extractQueryAfterKeywords(
          query,
          /\b(whatsapp|par|me|ko|message|send|bhejo|likho|karo)\b/gi
        ) || 'Hello!';
      const waWeb = `https://api.whatsapp.com/send?text=${encodeURIComponent(msgBody)}`;
      const bridged = this.triggerAndroidBridge('whatsapp_send', msgBody);
      return {
        handled: true,
        reply: `WhatsApp app me "${msgBody}" bhejne ke liye khol rahi hoon!`,
        actionType: 'whatsapp_send',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(
              waWeb,
              'com.whatsapp',
              `whatsapp://send?text=${encodeURIComponent(msgBody)}`
            ),
        externalLabel: 'Send in WhatsApp App',
      };
    }

    // Telegram Search / Channel
    if (query.includes('telegram') && (query.includes('search') || query.includes('channel') || query.includes('message'))) {
      const tgTarget = this.extractQueryAfterKeywords(
        query,
        /\b(telegram|par|me|search|channel|message|open|kholo)\b/gi
      );
      const tgWeb = tgTarget ? `https://t.me/s/${encodeURIComponent(tgTarget)}` : 'https://web.telegram.org';
      const bridged = this.triggerAndroidBridge('open_app', 'org.telegram.messenger');
      return {
        handled: true,
        reply: tgTarget ? `Telegram app me "${tgTarget}" open kar rahi hoon!` : 'Telegram app open kar rahi hoon!',
        actionType: 'telegram_action',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(
              tgWeb,
              'org.telegram.messenger',
              tgTarget ? `tg://resolve?domain=${encodeURIComponent(tgTarget)}` : 'tg://'
            ),
        externalLabel: 'Open Telegram App',
      };
    }

    // MovieBox+ Movie Search
    if ((query.includes('moviebox') || query.includes('movie box')) && (query.includes('search') || query.includes('play') || query.includes('dekho') || query.includes('movie'))) {
      const movieName =
        this.extractQueryAfterKeywords(
          query,
          /\b(moviebox\+|moviebox|movie box|par|me|search|play|dekho|chalao|open|kholo)\b/gi
        ) || 'latest movies';
      const bridged = this.triggerAndroidBridge('open_app', 'com.movieboxpro.android');
      return {
        handled: true,
        reply: `MovieBox+ me "${movieName}" search kar rahi hoon!`,
        actionType: 'moviebox_search',
        externalUrl: bridged
          ? undefined
          : `https://www.google.com/search?q=${encodeURIComponent(movieName + ' movie')}`,
        externalLabel: 'Open MovieBox Search',
      };
    }

    // MyJio Quick Actions (Recharge / Balance / Data)
    if (query.includes('myjio') || query.includes('jio balance') || query.includes('jio data') || query.includes('jio recharge')) {
      const jioWeb = 'https://www.jio.com/selfcare/login';
      const bridged = this.triggerAndroidBridge('open_app', 'com.jio.myjio');
      return {
        handled: true,
        reply: 'MyJio phone app open kar rahi hoon — aap apna Jio data balance aur recharge plan dekh sakte hain!',
        actionType: 'myjio_action',
        externalUrl: bridged
          ? undefined
          : this.buildDeepIntentUrl(jioWeb, 'com.jio.myjio', 'myjio://'),
        externalLabel: 'Open MyJio App',
      };
    }

    // Weather Quick Check (reads cached local WeatherWidget data if available + opens report)
    if (query.includes('weather') || query.includes('mausam')) {
      let localWeatherReply = 'Aaj ka live Weather report open kar rahi hoon!';
      try {
        const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('jarvis_weather_cache_v1') : null;
        if (cached) {
          const w = JSON.parse(cached);
          if (w && w.locationName && w.temperature !== undefined) {
            localWeatherReply = `${w.locationName} me abhi temperature ${w.temperature}°C aur mausam ${w.condition} hai (Humidity ${w.humidity}%).`;
          }
        }
      } catch {
        // ignore storage errors
      }
      return {
        handled: true,
        reply: localWeatherReply,
        actionType: 'weather_check',
        externalUrl: 'https://www.google.com/search?q=weather+today',
        externalLabel: 'Open Weather',
      };
    }

    // Google / Web Search ("search <query>", "google <query>", "<query> search karo")
    if (
      (query.startsWith('search ') || query.startsWith('google ') || query.includes('search karo')) &&
      !query.includes('youtube') &&
      !query.includes('pinterest') &&
      !query.includes('play store') &&
      !query.includes('maps')
    ) {
      const searchTerm = this.extractQueryAfterKeywords(
        query,
        /\b(google|search|karo|par|for|about|on)\b/gi
      );
      if (searchTerm) {
        return {
          handled: true,
          reply: `Google par "${searchTerm}" search kar rahi hoon!`,
          actionType: 'google_search',
          externalUrl: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`,
          externalLabel: `Search "${searchTerm}"`,
        };
      }
    }

    // 6. ACCESSIBILITY IN-APP AUTOMATIONS (Scroll, Click, Type, Screenshot, Navigation)
    if (query.includes('scroll down') || query.includes('niche scroll') || query.includes('niche jao')) {
      this.triggerAndroidBridge('scroll_down');
      return {
        handled: true,
        reply: 'Screen par niche scroll kar diya hai!',
        actionType: 'scroll_down',
        uiAction: { scrollDelta: 340 },
      };
    }
    if (query.includes('scroll up') || query.includes('upar scroll') || query.includes('upar jao')) {
      this.triggerAndroidBridge('scroll_up');
      return {
        handled: true,
        reply: 'Screen par upar scroll kar diya hai!',
        actionType: 'scroll_up',
        uiAction: { scrollDelta: -340 },
      };
    }
    if (query.startsWith('click ') || query.startsWith('dabao ') || query.includes('par click karo')) {
      const btnText = query.replace(/^(click|dabao)\s+/i, '').replace(/\s*par click karo/i, '').trim();
      this.triggerAndroidBridge('click', btnText);
      return {
        handled: true,
        reply: `Screen par "${btnText}" element click kar diya hai!`,
        actionType: 'accessibility_click',
      };
    }
    if (query.startsWith('type ') || query.startsWith('likho ')) {
      const typed = query.replace(/^(type|likho)\s+/i, '').trim();
      this.triggerAndroidBridge('type', typed);
      return {
        handled: true,
        reply: `Active input box me "${typed}" type kar diya hai!`,
        actionType: 'accessibility_type',
      };
    }
    if (query.includes('screenshot') || query.includes('screen capture')) {
      this.triggerAndroidBridge('screenshot');
      return {
        handled: true,
        reply: 'Screenshot capture command bhej diya hai!',
        actionType: 'take_screenshot',
      };
    }
    if (query === 'go home' || query === 'home screen' || query === 'ghar jao' || query === 'open home') {
      this.triggerAndroidBridge('go_home');
      return {
        handled: true,
        reply: 'Home screen par aa gaye hain!',
        actionType: 'go_home',
        uiAction: { tab: 'assistant' },
      };
    }
    if (query === 'go back' || query === 'back' || query === 'piche jao') {
      this.triggerAndroidBridge('go_back');
      return {
        handled: true,
        reply: 'Piche / Back kar diya hai.',
        actionType: 'go_back',
        uiAction: { tab: 'assistant' },
      };
    }
    if (query.includes('recent apps') || query === 'recents') {
      this.triggerAndroidBridge('recents');
      return {
        handled: true,
        reply: 'Recent & All Apps drawer open kar rahi hoon!',
        actionType: 'open_recents',
        uiAction: { tab: 'features', featuresSubTab: 'apps' },
      };
    }

    // 6B. LIVE TIMER ("set timer 5 minutes", "30 second ka timer lagao")
    if (query.includes('timer')) {
      const minMatch = query.match(/(\d+)\s*(min|minute|minutes|m)\b/i);
      const secMatch = query.match(/(\d+)\s*(sec|second|seconds|s)\b/i);
      const hrMatch = query.match(/(\d+)\s*(hr|hour|hours|h)\b/i);
      let totalSeconds = 0;
      if (hrMatch) totalSeconds += parseInt(hrMatch[1], 10) * 3600;
      if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
      if (secMatch) totalSeconds += parseInt(secMatch[1], 10);
      if (totalSeconds <= 0) totalSeconds = 60; // default 1 minute timer

      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const readable = mins > 0 ? `${mins} min${secs > 0 ? ` ${secs} sec` : ''}` : `${secs} sec`;
      return {
        handled: true,
        reply: `${readable} ka countdown timer start kar diya hai!`,
        actionType: 'set_timer',
        uiAction: { timerSeconds: totalSeconds, timerLabel: `${readable} Timer` },
      };
    }

    // 7. NOTES CREATION (Notes App & Quick Notes)
    if (
      query.startsWith('create note') ||
      query.startsWith('note likho') ||
      query.startsWith('make a note') ||
      query.startsWith('note banao') ||
      query.startsWith('save note')
    ) {
      const noteContent = query
        .replace(/^(create note|note likho|make a note|note banao|save note)\s*/i, '')
        .trim();
      const newNote: QuickNote = {
        id: 'note_' + Date.now(),
        title: noteContent.slice(0, 30) || 'Quick Voice Note',
        content: noteContent || 'Voice memo recorded by JARVIS',
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        handled: true,
        reply: `Note save kar liya hai: "${newNote.content}"`,
        actionType: 'create_note',
        noteCreated: newNote,
      };
    }

    // 8. ALARMS
    if (query.includes('alarm') || query.includes('alarm lagao')) {
      const match = query.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i);
      let timeLabel = '07:00 AM';
      if (match) {
        const hour = match[1];
        const min = match[3] || '00';
        const meridiem = (match[4] || 'AM').toUpperCase();
        timeLabel = `${hour.padStart(2, '0')}:${min} ${meridiem}`;
      }
      const newAlarm: AlarmItem = {
        id: 'alarm_' + Date.now(),
        time: timeLabel,
        label: 'JARVIS Voice Alarm',
        enabled: true,
        days: ['Daily'],
      };
      return {
        handled: true,
        reply: `Alarm ${timeLabel} ke liye set kar diya hai!`,
        actionType: 'set_alarm',
        alarmCreated: newAlarm,
      };
    }

    // 9. CALLS & SMS / MESSAGES (Safety confirmation dialog required)
    if (query.startsWith('call ') || query.startsWith('phone lagao ') || query.includes('ko call karo')) {
      const target = query
        .replace(/^(call|phone lagao)\s+/i, '')
        .replace(/\s*ko call karo$/i, '')
        .trim();
      const digitsOnly = target.replace(/[^\d+]/g, '');
      return {
        handled: true,
        reply: `Kya aap sachme ${target} ko phone lagana chahte hain? Confirm kijiye.`,
        actionType: 'request_call_confirmation',
        requiresConfirmation: true,
        confirmationDetails: {
          action: 'Call Phone Contact',
          target: target,
          onConfirm: () => {
            const bridged = this.triggerAndroidBridge('call', digitsOnly || target);
            if (!bridged && typeof window !== 'undefined') {
              window.location.href = `tel:${encodeURIComponent(digitsOnly || target)}`;
            }
          },
        },
      };
    }

    if (query.startsWith('sms ') || query.startsWith('message bhejo ') || query.includes('ko message bhejo')) {
      const target = query
        .replace(/^(sms|message bhejo)\s+/i, '')
        .replace(/\s*ko message bhejo$/i, '')
        .trim();
      return {
        handled: true,
        reply: `Kya aap ${target} ko SMS bhejna chahte hain? Kripya confirm karein.`,
        actionType: 'request_sms_confirmation',
        requiresConfirmation: true,
        confirmationDetails: {
          action: 'Send SMS Message',
          target: target,
          onConfirm: () => {
            const bridged = this.triggerAndroidBridge('sms', target);
            if (!bridged && typeof window !== 'undefined') {
              window.location.href = `sms:?body=${encodeURIComponent(`Hello ${target}`)}`;
            }
          },
        },
      };
    }

    // 10. UNIVERSAL PHONE APP LAUNCHER (Custom apps + all 34+ built-in apps + Android intent://)
    const isLaunchIntent =
      /\b(open|kholo|launch|start|khol|dikhao|chalu)\b/.test(query) ||
      query.includes('chalu karo') ||
      query.includes('khol do') ||
      query.includes('open karo');

    // Explicit JARVIS internal settings command vs Phone Settings
    if (
      query.includes('jarvis setting') ||
      query.includes('voice setting') ||
      query.includes('mic setting')
    ) {
      return {
        handled: true,
        reply: 'JARVIS Settings panel open kar rahi hoon!',
        actionType: 'open_jarvis_settings',
        uiAction: {
          tab: 'settings',
          settingsSection: query.includes('voice') || query.includes('mic') ? 'voice' : 'general',
        },
      };
    }

    // Check user-added custom apps stored in localStorage first
    try {
      const customRaw =
        typeof localStorage !== 'undefined' ? localStorage.getItem('jarvis_custom_apps') : null;
      if (customRaw) {
        const customApps: Array<{ name: string; packageName?: string; webUrl?: string }> =
          JSON.parse(customRaw);
        for (const cApp of customApps) {
          const cLower = (cApp.name || '').toLowerCase();
          if (cLower && (query === cLower || (isLaunchIntent && query.includes(cLower)))) {
            const bridged = this.triggerAndroidBridge('open_app', cApp.packageName || cApp.name);
            const launchUrl = bridged ? undefined : this.buildAppLaunchUrl(cApp);
            return {
              handled: true,
              reply: `${cApp.name} app phone me open kar rahi hoon!`,
              actionType: `open_custom_${cLower}`,
              externalUrl: launchUrl,
              externalLabel: launchUrl ? `Open ${cApp.name} App` : undefined,
            };
          }
        }
      }
    } catch {
      // ignore invalid localStorage data
    }

    for (const app of PHONE_APPS_DIRECTORY) {
      const matchedAlias = app.aliases.some(
        (alias) =>
          query === alias ||
          (isLaunchIntent && query.includes(alias))
      );
      if (matchedAlias) {
        const bridged = this.triggerAndroidBridge('open_app', app.packageName);
        const launchUrl = bridged ? undefined : this.buildAppLaunchUrl(app);

        // Inside native APK bridge, the real Android app opens directly;
        // in web/browser mode, provide interactive modals for Camera/Calculator/Recorder/Safety & Settings
        let uiAction: CommandUiAction | undefined;
        if (!bridged) {
          if (app.key === 'calculator') {
            uiAction = { modal: 'calculator' };
          } else if (app.key === 'camera') {
            uiAction = { modal: 'camera' };
          } else if (app.key === 'recorder') {
            uiAction = { modal: 'recorder' };
          } else if (app.key === 'safety') {
            uiAction = { modal: 'safety' };
          } else if (app.key === 'settings' || app.key === 'themes') {
            uiAction = { tab: 'settings', settingsSection: 'general' };
          } else if (app.key === 'simpleview') {
            uiAction = { tab: 'assistant' };
          }
        }

        return {
          handled: true,
          reply: app.replyMsg,
          actionType: `open_${app.key}`,
          externalUrl: launchUrl,
          externalLabel: launchUrl ? `Open ${app.name} on Phone` : undefined,
          uiAction,
        };
      }
    }

    // Generic fallback for any other app named by the user with "open/kholo"
    if (isLaunchIntent) {
      const appNameRaw = query
        .replace(/\b(open|kholo|launch|start|chalu|khol|dikhao|karo|do|app)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (appNameRaw) {
        const bridged = this.triggerAndroidBridge('open_app_name', appNameRaw);
        const storeSearch = `https://play.google.com/store/search?q=${encodeURIComponent(appNameRaw)}&c=apps`;
        return {
          handled: true,
          reply: `Aapke phone me ${appNameRaw} app open kar rahi hoon!`,
          actionType: 'open_generic_app',
          externalUrl: bridged
            ? undefined
            : this.isAndroidDevice()
            ? this.buildDeepIntentUrl(
                storeSearch,
                'com.android.vending',
                `market://search?q=${encodeURIComponent(appNameRaw)}&c=apps`
              )
            : `https://www.google.com/search?q=${encodeURIComponent(appNameRaw + ' app')}`,
          externalLabel: `Find ${appNameRaw} on Phone`,
        };
      }
    }

    // 11. TIME & DATE
    if (query.includes('time') || query.includes('samay') || query.includes('kitne baje')) {
      const timeStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return {
        handled: true,
        reply: `Abhi samay hai ${timeStr}.`,
        actionType: 'tell_time',
      };
    }
    if (query.includes('date') || query.includes('tarikh') || query.includes('today')) {
      const dateStr = new Date().toLocaleDateString('hi-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return {
        handled: true,
        reply: `Aaj ki date hai ${dateStr}.`,
        actionType: 'tell_date',
      };
    }

    // Pass to Gemini AI Brain
    return {
      handled: false,
      reply: '',
    };
  }
}

export const commandRouter = new CommandRouter();
