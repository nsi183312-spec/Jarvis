import React from 'react';
import { PhoneCall, MessageSquare, AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  action: string;
  target: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  action,
  target,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto border border-purple-400/40">
          <PhoneCall className="w-6 h-6 animate-pulse" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="font-bold text-base text-white">Voice Action Confirmation</h3>
          <p className="text-xs text-slate-300">
            Kya aap waqai me yeh action perform karna chahte hain?
          </p>
          <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Action Request</span>
            <span className="font-bold text-cyan-300 text-sm">{action}</span>
            <span className="text-slate-300 block mt-1">Recipient: <strong className="text-white">{target}</strong></span>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
