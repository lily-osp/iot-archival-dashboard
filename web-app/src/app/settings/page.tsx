"use client";

import { useEffect, useState } from "react";
import { Shell, Button, MuseumLabel, Input } from "@/components/ui/archival";
import { ArrowLeft, Save, AlertCircle, Database, Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user?.role === "demo") setIsDemo(true);
      });

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setConfigs(data);
        setIsLoading(false);
      });
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    if (isDemo) return;
    
    setIsSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setMessage("SETTING_COMMITTED_SUCCESSFULLY");
      } else {
        const data = await res.json();
        setMessage(`ERROR: ${data.error}`);
      }
    } catch (err) {
      setMessage("FAILED_TO_SYNC_SETTING");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Shell><div className="museum-label p-24 text-center">ACCESSING_SECURE_ARCHIVE...</div></Shell>;

  return (
    <Shell>
      <header className="mb-24 p-8 border-b-2 border-archival-fg/10 relative overflow-hidden">
        <Link href="/" className="inline-flex items-center text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-archival-muted-fg hover:text-archival-fg transition-all mb-12 group">
          <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-2 transition-transform" />
          RETURN_TO_ARCHIVE_ROOT
        </Link>
        <div className="flex items-center gap-2 museum-label mb-3 text-archival-accent">
          <Database className="w-3 h-3" />
          <span className="text-[10px] font-mono tracking-widest uppercase">CORE_DATABASE_CONFIGURATION</span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans leading-[1.05] text-archival-fg">
        System<br />Parameters
        </h1>
        <div className="absolute top-0 right-0 p-4 opacity-5 font-mono text-[10px] tracking-widest uppercase pointer-events-none">
        SECURE_ACCESS_LAYER_7
        </div>
        </header>

        {isDemo && (
        <div className="mb-16 p-8 border border-archival-accent bg-archival-accent/5 flex items-start gap-6 rounded-[6px]">          <Shield className="w-8 h-8 text-archival-accent shrink-0" />
          <div className="space-y-1">
            <div className="text-[12px] font-mono font-bold text-archival-accent tracking-widest uppercase">DEMO_PERMISSIONS_ACTIVE</div>
            <p className="text-archival-muted-fg text-sm max-w-2xl leading-relaxed">
              You are currently operating under the <span className="font-bold text-archival-fg underline decoration-archival-accent">DEMO</span> specimen collector role. 
              Full write access is granted to all system parameters for this archival session.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-0 border-t border-l border-archival-muted/20">
        {configs.map((config) => (
          <div key={config.key} className="grid grid-cols-1 md:grid-cols-4 gap-0 border-b border-r border-archival-muted/20 group hover:bg-white transition-colors">
            <div className="md:col-span-1 p-8 border-r border-archival-muted/10 bg-archival-bg/5">
              <div className="text-[11px] font-mono font-bold text-archival-fg tracking-widest uppercase mb-4">{config.key}</div>
              <div className="text-[8px] font-mono text-archival-muted-fg tracking-[0.2em] uppercase opacity-40">PARM_ID: 0x{Math.random().toString(16).slice(2, 6).toUpperCase()}</div>
            </div>
            <div className="md:col-span-1 p-8 border-r border-archival-muted/10">
              <p className="text-archival-muted-fg text-xs leading-relaxed uppercase tracking-wider font-mono opacity-80">{config.description}</p>
            </div>
            <div className="md:col-span-2 p-8 flex items-center gap-6">
              <Input
                defaultValue={config.value}
                onBlur={(e) => handleUpdate(config.key, e.target.value)}
                disabled={isSaving}
                className="flex-1 bg-transparent border-none p-0 text-xl font-bold font-sans tracking-tight lowercase focus:bg-transparent"
              />
              <div className="w-12 h-12 flex items-center justify-center border-2 border-archival-muted/30 opacity-20 group-hover:opacity-100 transition-opacity">
                <Save className="w-5 h-5 text-archival-fg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className="fixed bottom-12 right-12 animate-entrance z-[200]">
          <MuseumLabel label="SYSTEM_LOG" value={message} className="shadow-2xl border-archival-accent min-w-[300px]" />
        </div>
      )}
      
      <div className="mt-auto p-8 opacity-20 font-mono text-[9px] tracking-[0.5em] uppercase text-center w-full border-t border-archival-muted/20">
        END_OF_PARAMETER_RECORDS
      </div>
    </Shell>
  );
}
