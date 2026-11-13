import React, { useEffect, useState } from 'react';
import { ThemeConfig } from '../theme';
import { Battery, BatteryCharging, BatteryLow, BatteryWarning, Zap } from 'lucide-react';

interface BatteryStatusProps {
  theme: ThemeConfig;
  fallbackLevel: number;
  fallbackCharging: boolean;
  onSyncBattery?: (level: number, isCharging: boolean) => void;
  onQuickCheck?: () => void;
}

export const BatteryStatus: React.FC<BatteryStatusProps> = ({
  theme,
  fallbackLevel,
  fallbackCharging,
  onSyncBattery,
  onQuickCheck,
}) => {
  const [level, setLevel] = useState<number>(fallbackLevel);
  const [isCharging, setIsCharging] = useState<boolean>(fallbackCharging);
  const [hasLiveApi, setHasLiveApi] = useState<boolean>(false);

  useEffect(() => {
    setLevel(fallbackLevel);
  }, [fallbackLevel]);

  useEffect(() => {
    setIsCharging(fallbackCharging);
  }, [fallbackCharging]);

  useEffect(() => {
    let batteryManager: any = null;
    let mounted = true;

    const handleUpdate = () => {
      if (!batteryManager || !mounted) return;
      const pct = Math.round(batteryManager.level * 100);
      const charging = Boolean(batteryManager.charging);
      setLevel(pct);
      setIsCharging(charging);
      if (onSyncBattery) {
        onSyncBattery(pct, charging);
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((bm: any) => {
          if (!mounted) return;
          batteryManager = bm;
          setHasLiveApi(true);
          handleUpdate();
          bm.addEventListener('levelchange', handleUpdate);
          bm.addEventListener('chargingchange', handleUpdate);
        })
        .catch(() => {
          setHasLiveApi(false);
        });
    }

    return () => {
      mounted = false;
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', handleUpdate);
        batteryManager.removeEventListener('chargingchange', handleUpdate);
      }
    };
  }, [onSyncBattery]);

  const clampedLevel = Math.max(0, Math.min(100, level));
  const isCritical = clampedLevel <= 15 && !isCharging;
  const isLow = clampedLevel <= 30 && !isCharging;

  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (clampedLevel / 100) * circumference;

  const ringStrokeClass = isCharging
    ? 'stroke-emerald-400'
    : isCritical
    ? 'stroke-rose-400'
    : isLow
    ? 'stroke-amber-400'
    : 'stroke-cyan-400';

  const barGradientClass = isCharging
    ? 'from-emerald-400 to-teal-300'
    : isCritical
    ? 'from-rose-500 to-amber-500'
    : isLow
    ? 'from-amber-400 to-yellow-300'
    : theme.swatchGradient;

  const statusText = isCharging
    ? 'Charging'
    : isCritical
    ? 'Critical Low'
    : isLow
    ? 'Low Power'
    : 'Optimal';

  return (
    <button
      type="button"
      onClick={onQuickCheck}
      className={`w-full text-left p-3.5 rounded-2xl bg-slate-900/75 backdrop-blur-xl border ${theme.statusCardBorder} ${theme.statusCardShadow} hover:bg-slate-900/90 transition-all duration-300 flex items-center gap-3.5 min-h-[72px]`}
      aria-label={`Battery status ${clampedLevel} percent, ${statusText}`}
    >
      {/* Animated Radial Ring */}
      <div className="relative w-13 h-13 shrink-0 flex items-center justify-center">
        <svg className="w-13 h-13 -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.16)"
            strokeWidth="4.5"
          />
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            className={`${ringStrokeClass} transition-all duration-700 ease-out`}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isCharging ? (
            <BatteryCharging className="w-4 h-4 text-emerald-300 animate-pulse" />
          ) : isCritical ? (
            <BatteryWarning className="w-4 h-4 text-rose-400 animate-pulse" />
          ) : isLow ? (
            <BatteryLow className="w-4 h-4 text-amber-300" />
          ) : (
            <Battery className={`w-4 h-4 ${theme.accentText}`} />
          )}
        </div>
      </div>

      {/* Percentage + Live Animated Bar */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-200">Battery</span>
            <span className="text-[11px] text-slate-400">· {statusText}</span>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-white flex items-center gap-1">
            {isCharging && <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
            {clampedLevel}%
          </span>
        </div>

        {/* Animated Power Meter */}
        <div className="w-full h-2 rounded-full bg-slate-950/90 border border-slate-800/80 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradientClass} transition-all duration-700 relative`}
            style={{ width: `${clampedLevel}%` }}
          >
            {isCharging && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{hasLiveApi ? 'Live device sensor' : 'System estimator'}</span>
          <span className={theme.accentTextSecondary}>Tap to announce</span>
        </div>
      </div>
    </button>
  );
};
