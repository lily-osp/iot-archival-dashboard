"use client";

import React, { useEffect, useState, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Check, AlertTriangle, Info, X, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-archival-bg text-archival-fg relative archival-grain selection:bg-archival-accent selection:text-white font-sans font-normal leading-relaxed">
      {/* Blueprint Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none blueprint-grid z-0" />
      
      {/* Main Container */}
      <main className="relative z-10 max-w-[80rem] mx-auto min-h-screen border-x border-archival-muted px-6 py-12 md:px-12 md:py-24 flex flex-col">
        {children}
      </main>
      
      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
}

export function MuseumLabel({ 
  label, 
  value, 
  unit, 
  min = 0,
  max = 255,
  className,
  type = "monitor",
  onControlChange,
  onHeaderClick,
  history = []
}: { 
  label: string; 
  value?: string | number; 
  unit?: string;
  min?: number;
  max?: number;
  className?: string;
  type?: "monitor" | "switch" | "chart" | "slider" | "indicator" | "text" | "dump" | "button" | "gauge" | "stream" | "color";
  onControlChange?: (value: string) => void;
  onHeaderClick?: () => void;
  history?: any[];
}) {
  const chartData = history.map(d => ({
    time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    val: isNaN(parseFloat(d.value)) ? 0 : parseFloat(d.value)
  })).reverse();

  const [localSliderValue, setLocalSliderValue] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (type === "slider" && value !== undefined && value !== null) {
      setLocalSliderValue(value.toString());
    }
  }, [value, type]);

  return (
    <div className={cn(
      "border border-archival-muted p-6 bg-archival-surface rounded-[6px] animate-entrance relative group transition-all duration-[225ms] ease-[cubic-bezier(0.65,0,0.35,1)] hover:border-archival-accent hover:-translate-y-[2px] flex flex-col", 
      type === "chart" || type === "dump" ? "col-span-1 md:col-span-2 row-span-1 h-[350px]" : 
      type === "stream" ? "col-span-1 md:col-span-2 row-span-1 min-h-[220px]" : "h-full min-h-[220px]",
      className
    )}>
      {/* Component Header Metadata */}
      <div className="flex justify-between items-start mb-6 border-b border-archival-muted/50 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[0.75rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg leading-none">
            {label}
          </span>
          <span className="text-[0.625rem] font-mono text-archival-muted-fg/70 tracking-[0.1em] uppercase">
            SPECIMEN_ID: {label.slice(0,3).toUpperCase()}_{Math.floor(1000 + Math.random() * 9000)}
          </span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onHeaderClick?.();
          }}
          className="text-[0.625rem] font-mono font-semibold text-archival-fg uppercase tracking-[0.1em] px-2 py-1 border border-archival-muted rounded-[4px] hover:border-archival-accent hover:text-archival-accent transition-colors duration-[150ms] cursor-pointer bg-transparent"
          title="Archive Management"
        >
          {type}
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {type === "monitor" && (
          <div className="flex items-baseline gap-3">
            <span className="text-[3rem] font-bold font-sans tracking-[-0.03em] leading-[1.05] text-archival-fg">
              {value ?? "---"}
            </span>
            {unit && (
              <span className="text-[0.875rem] font-mono font-semibold text-archival-muted-fg uppercase tracking-[0.1em]">
                {unit}
              </span>
            )}
          </div>
        )}

        {type === "indicator" && (
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full border border-archival-muted transition-all duration-[225ms]",
              (value === "1" || value === "ON" || value === "true") 
                ? "bg-archival-success border-archival-success/50" 
                : "bg-archival-muted/20"
            )} />
            <div className="flex flex-col gap-1">
              <div className="text-[0.75rem] font-mono font-semibold tracking-[0.1em] text-archival-fg uppercase">
                {(value === "1" || value === "ON" || value === "true") ? "ACTIVE_SIGNAL" : "SIGNAL_DORMANT"}
              </div>
              <div className="text-[0.625rem] text-archival-muted-fg font-mono uppercase tracking-[0.1em]">REF_STATE: {value ?? "UNDEFINED"}</div>
            </div>
          </div>
        )}

        {type === "switch" && (
          <div className="flex items-center justify-between p-4 rounded-[6px] border border-archival-muted/50 bg-archival-bg/50">
            <span className="text-[0.75rem] font-mono font-semibold text-archival-muted-fg tracking-[0.1em] uppercase">CONTROL_GATE</span>
            <Switch 
              checked={value === "1" || value === "ON" || value === "true"} 
              onChange={(checked) => onControlChange?.(checked ? "1" : "0")}
            />
          </div>
        )}

        {type === "button" && (
          <div className="flex flex-col gap-4">
            <button
              onMouseDown={() => { setIsPressing(true); onControlChange?.("1"); }}
              onMouseUp={() => setIsPressing(false)}
              onMouseLeave={() => setIsPressing(false)}
              className={cn(
                "w-full py-8 rounded-[6px] border-2 font-mono text-[1rem] font-bold uppercase tracking-[0.2em] transition-all duration-[75ms] active:scale-[0.98] cursor-pointer",
                isPressing 
                  ? "bg-archival-accent text-white border-archival-accent shadow-inner translate-y-[2px]" 
                  : "bg-archival-surface text-archival-fg border-archival-fg hover:bg-archival-fg hover:text-archival-surface"
              )}
            >
              {isPressing ? "SIGNAL_SENT" : "EXECUTE_TRIGGER"}
            </button>
            <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase tracking-[0.1em] text-center">
              MOMENTARY_CONTACT_SYSTEM
            </div>
          </div>
        )}

        {type === "slider" && (
          <div className="space-y-4 p-4 rounded-[6px] border border-archival-muted/50 bg-archival-bg/50">
            <div className="flex justify-between items-end">
              <span className="text-[2.25rem] font-bold font-sans tracking-[-0.03em] leading-[1.1] text-archival-fg">{localSliderValue ?? value ?? min}</span>
              <span className="text-[0.625rem] font-mono font-semibold text-archival-muted-fg tracking-[0.1em] uppercase">{unit}</span>
            </div>
            <input 
              type="range" 
              min={min} 
              max={max} 
              value={parseFloat(localSliderValue || value as string || min.toString())} 
              onChange={(e) => {
                const val = e.target.value;
                setLocalSliderValue(val);
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = setTimeout(() => {
                  onControlChange?.(val);
                }, 500);
              }}
              className="w-full h-1 bg-archival-muted rounded-full appearance-none cursor-pointer accent-archival-accent hover:accent-[#A02020] transition-colors duration-[150ms]"
            />
          </div>
        )}

        {type === "chart" && (
          <div className="h-full w-full min-h-[220px] -ml-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(232, 224, 208, 0.85)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #DDD5C5',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '8px',
                    boxShadow: '0 4px 12px rgba(42, 37, 32, 0.12)'
                  }}
                  itemStyle={{ color: '#8B1A1A', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="val" 
                  stroke="#8B1A1A" 
                  strokeWidth={2} 
                  dot={false}
                  animationDuration={375}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {type === "text" && (
          <div className="flex flex-col gap-2">
            <div className="text-[1.5rem] font-bold font-sans tracking-[-0.02em] text-archival-fg break-all leading-[1.2]">
              {value ?? "NULL_RECORD"}
            </div>
            <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase tracking-[0.1em] mt-2">
              STRING_DATA_SPECIMEN
            </div>
          </div>
        )}

        {type === "dump" && (
          <div className="flex flex-col h-full gap-4">
            <textarea
              className="flex-1 w-full bg-archival-bg/50 border border-archival-muted rounded-[6px] p-4 font-mono text-[0.875rem] focus:outline-none focus:border-archival-accent transition-colors duration-[150ms] resize-none"
              placeholder="ENTER_DATA_DUMP_SPECIMEN..."
              defaultValue={value?.toString()}
              onBlur={(e) => onControlChange?.(e.target.value)}
            />
            <div className="flex justify-between items-center text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-muted-fg uppercase">
              <span>BUFFER_CAPACITY_UNLIMITED</span>
              <span>STATE: {value ? "RECORD_HELD" : "WAITING_FOR_DATA"}</span>
            </div>
          </div>
        )}

        {type === "gauge" && (
          <div className="flex flex-col items-center justify-center p-4 relative h-full">
            <svg className="w-full max-w-[200px] h-auto overflow-visible" viewBox="0 0 100 50">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-archival-muted/30" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-archival-accent transition-all duration-500 ease-out" 
                strokeDasharray={`${Math.max(0, Math.min(100, ((parseFloat(value as string || min.toString()) - min) / (max - min)) * 100)) * 1.2566}, 200`} />
            </svg>
            <div className="absolute bottom-4 flex items-baseline gap-1">
              <span className="text-[1.5rem] font-bold font-sans tracking-[-0.02em] leading-none text-archival-fg">{value ?? min}</span>
              {unit && <span className="text-[0.625rem] font-mono text-archival-muted-fg uppercase tracking-[0.1em]">{unit}</span>}
            </div>
            <div className="flex justify-between w-full max-w-[200px] mt-2 px-2 text-[0.5rem] font-mono text-archival-muted-fg">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        )}

        {type === "stream" && (
          <div className="flex flex-col h-full bg-[rgba(240,237,228,0.5)] border border-archival-muted rounded-[6px] overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[0.75rem] flex flex-col gap-2">
              {history.slice(0, 5).map((d, i) => (
                <div key={i} className="flex gap-4 text-archival-fg border-b border-archival-muted/20 pb-2 last:border-0 last:pb-0">
                  <span className="text-archival-muted-fg shrink-0 opacity-60 w-[60px]">
                    {new Date(d.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="break-all font-medium text-archival-accent/90">{d.value}</span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-archival-muted-fg italic opacity-50 flex h-full items-center justify-center pt-8 pb-8">
                  NO_DATA_STREAM_FOUND
                </div>
              )}
            </div>
          </div>
        )}

        {type === "color" && (
          <div className="flex items-center gap-4 p-4 rounded-[6px] border border-archival-muted/50 bg-archival-bg/50">
            <div className="flex-1 space-y-1">
              <span className="text-[0.75rem] font-mono font-semibold text-archival-muted-fg tracking-[0.1em] uppercase">COLOR_GATE</span>
              <div className="text-[0.625rem] font-mono text-archival-fg font-bold uppercase tracking-[0.1em]">{value ?? "#FFFFFF"}</div>
            </div>
            <div className="relative w-12 h-12 rounded-[6px] overflow-hidden border border-archival-muted shadow-sm">
              <input 
                type="color" 
                value={value && typeof value === 'string' && value.startsWith('#') ? value : "#FFFFFF"}
                onChange={(e) => {
                  const val = e.target.value;
                  // Immediately update UI optimisticly if possible, but we don't have local setValue here directly for color without onControlChange
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  debounceTimerRef.current = setTimeout(() => {
                    onControlChange?.(val);
                  }, 500);
                }}
                className="absolute inset-[-10px] w-[200%] h-[200%] p-0 border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Lower Metadata */}
      <div className="mt-6 flex justify-between items-center opacity-40 group-hover:opacity-80 transition-opacity duration-[225ms]">
        <div className="text-[0.625rem] font-mono tracking-[0.1em] uppercase text-archival-muted-fg">
          TIMESTAMP_SYNC_{new Date().getFullYear()}
        </div>
        <div className="text-[0.625rem] font-mono tracking-[0.1em] uppercase text-archival-muted-fg">
          CH_0{Math.floor(Math.random() * 9)}
        </div>
      </div>
    </div>
  );
}

export function Input({ 
  className,
  label,
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1 w-full">
      {label && <label className="text-[0.75rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg block">{label}</label>}
      <input
        className={cn(
          "w-full bg-archival-surface border border-archival-muted rounded-[6px] px-3 py-2 font-sans text-[0.875rem] text-archival-fg focus:outline-none focus:border-archival-accent focus:shadow-[0_0_0_2px_rgba(139,26,26,0.3)] transition-all duration-[150ms] placeholder:text-archival-muted-fg/60",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Select({ 
  label,
  options,
  value,
  onChange,
  placeholder = "SELECT_RECORD...",
  required
}: { 
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1 w-full relative" ref={containerRef}>
      {label && <label className="text-[0.75rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg block">{label}</label>}
      
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-archival-surface border rounded-[6px] px-3 py-2 font-sans text-[0.875rem] cursor-pointer transition-all duration-[150ms] flex justify-between items-center",
          isOpen ? "border-archival-accent shadow-[0_0_0_2px_rgba(139,26,26,0.3)]" : "border-archival-muted hover:border-archival-fg/30"
        )}
      >
        <span className={cn(selectedOption ? "text-archival-fg" : "text-archival-muted-fg/60")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-[225ms] text-archival-muted-fg", isOpen && "rotate-180")} />
      </div>

      {/* Options List */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[rgba(232,224,208,0.95)] backdrop-blur-[12px] border border-archival-muted rounded-[6px] z-[200] shadow-[0_4px_12px_rgba(42,37,32,0.12)] animate-entrance overflow-hidden">
          <div className="max-h-[250px] overflow-y-auto">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "px-3 py-2 font-sans text-[0.875rem] cursor-pointer transition-colors duration-[150ms] border-b border-archival-muted/30 last:border-none",
                  value === opt.value 
                    ? "bg-archival-accent/10 text-archival-accent font-semibold" 
                    : "hover:bg-archival-accent/5 hover:text-archival-accent text-archival-fg"
                )}
              >
                {opt.label}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 font-mono text-[0.75rem] uppercase tracking-[0.1em] text-archival-muted-fg italic">
                NO_RECORDS_AVAILABLE
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Switch({ 
  checked, 
  onChange,
  disabled 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-all duration-[225ms] ease-[cubic-bezier(0.65,0,0.35,1)] focus:outline-none focus:ring-2 focus:ring-archival-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-archival-accent border-archival-accent" : "bg-archival-muted/30 border-archival-muted"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-[225ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-archival-fg/20 backdrop-blur-[4px] animate-entrance">
      <div className="bg-[rgba(239,233,220,0.95)] backdrop-blur-[12px] border border-archival-muted rounded-[12px] w-full max-w-2xl shadow-[0_8px_24px_rgba(42,37,32,0.16)] relative flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-archival-muted flex justify-between items-center">
          <div>
            <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-muted-fg uppercase mb-1">SYSTEM_ARCHIVE_OVERRIDE</div>
            <h2 className="text-[1.5rem] font-bold font-sans tracking-[-0.02em] leading-[1.2] text-archival-fg">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-archival-muted-fg hover:text-archival-fg hover:bg-archival-muted/20 transition-colors duration-[150ms]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Button({ 
  className, 
  variant = "primary", 
  size = "md",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: "primary" | "ghost" | "minimal";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-archival-accent text-archival-bg border border-archival-accent hover:bg-[#A02020] hover:border-[#A02020] active:bg-[#6B1212] active:border-[#6B1212]",
    ghost: "bg-transparent text-archival-fg border border-archival-muted hover:border-archival-accent hover:text-archival-accent",
    minimal: "bg-transparent text-archival-muted-fg border-transparent hover:text-archival-accent hover:bg-archival-accent/5",
  };

  const sizes = {
    sm: "px-2 py-1 text-[10px] tracking-[0.05em]",
    md: "px-4 py-2 text-[0.75rem] tracking-[0.1em]",
    lg: "px-8 py-4 text-[0.875rem] tracking-[0.2em]",
  };

  return (
    <button
      className={cn(
        "font-mono font-semibold uppercase rounded-[4px] transition-all duration-[150ms] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "CONFIRM_ACTION",
  message = "Are you sure you want to proceed with this archive modification?",
  confirmText = "COMMIT_ACTION",
  cancelText = "ABORT_ACTION"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-archival-warning/10 flex items-center justify-center border border-archival-warning shrink-0">
            <AlertTriangle className="w-5 h-5 text-archival-warning" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-[1rem] font-sans text-archival-fg leading-[1.6]">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-archival-muted">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm} className="bg-archival-warning border-archival-warning hover:bg-[#A07A20] hover:border-[#A07A20]">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * GLOBAL NOTIFICATION SYSTEM (TOAST)
 */
type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

export const toast = {
  push: (type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    currentToasts = [...currentToasts, { id, type, message }];
    toastListeners.forEach(listener => listener(currentToasts));
    
    setTimeout(() => {
      currentToasts = currentToasts.filter(t => t.id !== id);
      toastListeners.forEach(listener => listener(currentToasts));
    }, 5000);
  },
  success: (msg: string) => toast.push("success", msg),
  error: (msg: string) => toast.push("error", msg),
  warning: (msg: string) => toast.push("warning", msg),
  info: (msg: string) => toast.push("success", msg), // Fallback
};

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id}
          className={cn(
            "pointer-events-auto bg-archival-fg text-archival-bg px-4 py-2 rounded-[6px] shadow-[0_4px_12px_rgba(42,37,32,0.12)] flex gap-3 items-center animate-entrance font-mono text-[0.75rem] font-semibold uppercase tracking-[0.1em]",
            t.type === "success" ? "border-l-[3px] border-l-archival-success" : 
            t.type === "error" ? "border-l-[3px] border-l-archival-accent" : 
            "border-l-[3px] border-l-archival-warning"
          )}
        >
          <div className="flex-1">
            {t.message}
          </div>
          <button 
            onClick={() => {
              currentToasts = currentToasts.filter(toast => toast.id !== t.id);
              toastListeners.forEach(l => l(currentToasts));
            }}
            className="opacity-50 hover:opacity-100 p-1 transition-opacity duration-[150ms]"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}