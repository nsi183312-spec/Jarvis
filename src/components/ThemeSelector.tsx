import React from 'react';
import { ThemeId } from '../types';
import { THEME_LIST } from '../theme';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  activeThemeId,
  onSelectTheme,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-slate-300" />
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Color Theme & UI Accents
            </h4>
            <p className="text-[11px] text-slate-400">
              Updates global background gradients, glowing rings, buttons, and chat accents
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {THEME_LIST.map((theme) => {
          const isSelected = activeThemeId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? 'bg-slate-800/90 border-white/50 shadow-md scale-[1.01]'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Gradient Swatch Preview */}
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${theme.swatchGradient} shrink-0 flex items-center justify-center shadow-inner relative`}
              >
                {isSelected ? (
                  <Check className="w-5 h-5 text-white drop-shadow" />
                ) : (
                  <span className={`w-2.5 h-2.5 rounded-full ${theme.swatchDot}`} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {theme.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-emerald-300 shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  {theme.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
