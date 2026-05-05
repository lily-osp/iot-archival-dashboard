"use client";

import { useEffect, useState } from "react";
import { Shell, Button, MuseumLabel, Input, Modal, ConfirmationModal, toast } from "@/components/ui/archival";
import { ArrowLeft, Save, AlertCircle, Database, Shield, Plus, Trash2, Edit3, Key } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [openSources, setOpenSources] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountFormData, setAccountFormData] = useState({ name: "", username: "", key: "" });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Open Source Modal State
  const [isOpenSourceModalOpen, setIsOpenSourceModalOpen] = useState(false);
  const [editingOpenSource, setEditingOpenSource] = useState<any>(null);
  const [openSourceFormData, setOpenSourceFormData] = useState({ name: "", url: "", jsonPath: "", scheduleCron: "", targetFeedKey: "" });

  // Open Source Delete Modal State
  const [isOpenSourceDeleteModalOpen, setIsOpenSourceDeleteModalOpen] = useState(false);
  const [openSourceToDelete, setOpenSourceToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [userRes, settingsRes, accountsRes, openRes, feedRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/settings"),
        fetch("/api/accounts"),
        fetch("/api/open-data"),
        fetch("/api/feeds")
      ]);

      if (userRes.ok) {
        const data = await userRes.json();
        if (data.user?.role === "demo") setIsDemo(true);
      }
      
      if (settingsRes.ok) setConfigs((await settingsRes.json()).filter((c: any) => !["ADAFRUIT_IO_USERNAME", "ADAFRUIT_IO_KEY"].includes(c.key)));
      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (openRes.ok) setOpenSources(await openRes.json());
      if (feedRes.ok) setFeeds(await feedRes.json());
    } catch (err) {
      toast.error("FAILED_TO_SYNC_SETTINGS");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateConfig = async (key: string, value: string) => {
    if (isDemo) return;
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        toast.success("SETTING_COMMITTED_SUCCESSFULLY");
      } else {
        const data = await res.json();
        toast.error(`ERROR: ${data.error}`);
      }
    } catch (err) {
      toast.error("FAILED_TO_SYNC_SETTING");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountFormData({ name: "", username: "", key: "" });
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (account: any) => {
    setEditingAccount(account);
    setAccountFormData({ name: account.name, username: account.username, key: "" }); // Leave key blank unless changing
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return;

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
      const method = editingAccount ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(accountFormData),
      });

      if (res.ok) {
        toast.success(editingAccount ? "ACCOUNT_UPDATED" : "ACCOUNT_ADDED");
        setIsAccountModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(`ERROR: ${data.error}`);
      }
    } catch (err) {
      toast.error("FAILED_TO_SAVE_ACCOUNT");
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete || isDemo) return;
    
    try {
      const res = await fetch(`/api/accounts/${accountToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ACCOUNT_EXPUNGED");
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(`ERROR: ${data.error}`);
      }
    } catch (err) {
      toast.error("FAILED_TO_DELETE_ACCOUNT");
    }
  };

  const handleOpenAddOpenSource = () => {
    setEditingOpenSource(null);
    setOpenSourceFormData({ name: "", url: "", jsonPath: "", scheduleCron: "0 * * * *", targetFeedKey: "" });
    setIsOpenSourceModalOpen(true);
  };

  const handleOpenEditOpenSource = (source: any) => {
    setEditingOpenSource(source);
    setOpenSourceFormData({ 
      name: source.name, 
      url: source.url, 
      jsonPath: source.jsonPath, 
      scheduleCron: source.scheduleCron, 
      targetFeedKey: source.targetFeedKey || "" 
    });
    setIsOpenSourceModalOpen(true);
  };

  const handleSaveOpenSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return;

    try {
      const url = editingOpenSource ? `/api/open-data/${editingOpenSource.id}` : "/api/open-data";
      const method = editingOpenSource ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(openSourceFormData),
      });

      if (res.ok) {
        toast.success(editingOpenSource ? "SOURCE_UPDATED" : "SOURCE_ADDED");
        setIsOpenSourceModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(`ERROR: ${data.error}`);
      }
    } catch (err) {
      toast.error("FAILED_TO_SAVE_SOURCE");
    }
  };

  const handleDeleteOpenSource = async () => {
    if (!openSourceToDelete || isDemo) return;
    
    try {
      const res = await fetch(`/api/open-data/${openSourceToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("SOURCE_EXPUNGED");
        setIsOpenSourceDeleteModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(`ERROR: ${data.error}`);
      }
    } catch (err) {
      toast.error("FAILED_TO_DELETE_SOURCE");
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
        <div className="mb-16 p-8 border border-archival-accent bg-archival-accent/5 flex items-start gap-6 rounded-[6px]">
          <Shield className="w-8 h-8 text-archival-accent shrink-0" />
          <div className="space-y-1">
            <div className="text-[12px] font-mono font-bold text-archival-accent tracking-widest uppercase">DEMO_PERMISSIONS_ACTIVE</div>
            <p className="text-archival-muted-fg text-sm max-w-2xl leading-relaxed">
              You are currently operating under the <span className="font-bold text-archival-fg underline decoration-archival-accent">DEMO</span> specimen collector role. 
              Full write access is granted to all system parameters for this archival session.
            </p>
          </div>
        </div>
      )}

      <div className="mb-16 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-archival-fg" />
            <h2 className="text-[1.5rem] font-bold font-sans tracking-[-0.02em] uppercase text-archival-fg">Adafruit IO Accounts</h2>
          </div>
          <Button onClick={handleOpenAddAccount} disabled={isDemo}>
            <Plus className="w-4 h-4 mr-2" /> ADD_ACCOUNT
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className="border border-archival-muted p-6 bg-archival-surface rounded-[6px] relative group hover:border-archival-accent transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[1rem] font-bold tracking-[-0.02em] text-archival-fg">{acc.name}</div>
                  <div className="text-[0.625rem] font-mono tracking-widest uppercase text-archival-muted-fg">{acc.username}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditAccount(acc)} className="p-2 text-archival-muted-fg hover:text-archival-fg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setAccountToDelete(acc.id); setIsDeleteModalOpen(true); }} disabled={isDemo} className="p-2 text-archival-muted-fg hover:text-archival-accent transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-[0.625rem] font-mono tracking-widest uppercase text-archival-muted-fg/50 border-t border-archival-muted/20 pt-4 mt-4">
                ID: {acc.id}
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-archival-muted/50 bg-archival-surface rounded-[6px]">
              <div className="text-[0.75rem] font-mono tracking-widest uppercase text-archival-muted-fg">NO_ACCOUNTS_PROVISIONED</div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-16 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-archival-fg" />
            <h2 className="text-[1.5rem] font-bold font-sans tracking-[-0.02em] uppercase text-archival-fg">Open Data Sources</h2>
          </div>
          <Button onClick={handleOpenAddOpenSource} disabled={isDemo}>
            <Plus className="w-4 h-4 mr-2" /> ADD_SOURCE
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openSources.map(source => (
            <div key={source.id} className="border border-archival-muted p-6 bg-archival-surface rounded-[6px] relative group hover:border-archival-accent transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[1rem] font-bold tracking-[-0.02em] text-archival-fg">{source.name}</div>
                  <div className="text-[0.625rem] font-mono tracking-widest uppercase text-archival-accent mt-1 break-all">{source.url}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditOpenSource(source)} className="p-2 text-archival-muted-fg hover:text-archival-fg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setOpenSourceToDelete(source.id); setIsOpenSourceDeleteModalOpen(true); }} disabled={isDemo} className="p-2 text-archival-muted-fg hover:text-archival-accent transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[0.625rem] font-mono tracking-widest uppercase text-archival-muted-fg/80 border-t border-archival-muted/20 pt-4 mt-4">
                <div>CRON: <span className="text-archival-fg">{source.scheduleCron}</span></div>
                <div>PATH: <span className="text-archival-fg">{source.jsonPath || "ROOT"}</span></div>
                <div className="col-span-2">TARGET: <span className="text-archival-fg">{source.targetFeedKey || `VIRTUAL (open_${source.id})`}</span></div>
              </div>
            </div>
          ))}
          {openSources.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-archival-muted/50 bg-archival-surface rounded-[6px]">
              <div className="text-[0.75rem] font-mono tracking-widest uppercase text-archival-muted-fg">NO_DATA_SOURCES_PROVISIONED</div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-0 border-t border-l border-archival-muted/20">
        <h2 className="p-8 border-b border-r border-archival-muted/20 text-[1.5rem] font-bold font-sans tracking-[-0.02em] uppercase text-archival-fg bg-archival-surface">General Settings</h2>
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
                onBlur={(e) => handleUpdateConfig(config.key, e.target.value)}
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

      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title={editingAccount ? "EDIT_ACCOUNT_RECORD" : "PROVISION_ACCOUNT_RECORD"}>
        <form onSubmit={handleSaveAccount} className="space-y-6">
          <Input 
            label="Account Display Name" 
            value={accountFormData.name} 
            onChange={e => setAccountFormData({...accountFormData, name: e.target.value})} 
            placeholder="e.g. Primary Free Account" 
            required 
          />
          <Input 
            label="Adafruit IO Username" 
            value={accountFormData.username} 
            onChange={e => setAccountFormData({...accountFormData, username: e.target.value})} 
            placeholder="e.g. adafruit_user" 
            required 
          />
          <Input 
            label={editingAccount ? "Adafruit IO Key (Leave blank to keep unchanged)" : "Adafruit IO Key"} 
            type="password"
            value={accountFormData.key} 
            onChange={e => setAccountFormData({...accountFormData, key: e.target.value})} 
            placeholder={editingAccount ? "********" : "aio_..."} 
            required={!editingAccount}
          />
          <div className="pt-6">
            <Button type="submit" className="w-full">{editingAccount ? "UPDATE_RECORD" : "COMMIT_RECORD"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="EXPUNGE_ACCOUNT_RECORD"
        message="Are you sure you want to permanently delete this account? All associated widgets and feeds will lose their connection to Adafruit IO."
      />

      <Modal isOpen={isOpenSourceModalOpen} onClose={() => setIsOpenSourceModalOpen(false)} title={editingOpenSource ? "EDIT_DATA_SOURCE" : "PROVISION_DATA_SOURCE"}>
        <form onSubmit={handleSaveOpenSource} className="space-y-6">
          <Input 
            label="Source Name" 
            value={openSourceFormData.name} 
            onChange={e => setOpenSourceFormData({...openSourceFormData, name: e.target.value})} 
            placeholder="e.g. Jakarta Weather" 
            required 
          />
          <Input 
            label="Open API URL (No Auth Required)" 
            value={openSourceFormData.url} 
            onChange={e => setOpenSourceFormData({...openSourceFormData, url: e.target.value})} 
            placeholder="https://api.open-meteo.com/v1/forecast?..." 
            required 
          />
          <Input 
            label="JSONPath Extractor (Dot Notation)" 
            value={openSourceFormData.jsonPath} 
            onChange={e => setOpenSourceFormData({...openSourceFormData, jsonPath: e.target.value})} 
            placeholder="e.g. current.temperature_2m" 
          />
          <Input 
            label="Polling CRON Schedule" 
            value={openSourceFormData.scheduleCron} 
            onChange={e => setOpenSourceFormData({...openSourceFormData, scheduleCron: e.target.value})} 
            placeholder="e.g. 0 * * * *" 
            required 
          />
          <div className="space-y-2">
            <label className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-archival-fg">
              TARGET FEED (OPTIONAL)
            </label>
            <select
              value={openSourceFormData.targetFeedKey}
              onChange={e => setOpenSourceFormData({...openSourceFormData, targetFeedKey: e.target.value})}
              className="w-full bg-archival-bg border border-archival-muted p-3 text-sm font-mono text-archival-fg focus:outline-none focus:border-archival-accent focus:ring-1 focus:ring-archival-accent transition-all rounded-[6px]"
            >
              <option value="">Leave empty to create a Virtual Feed</option>
              {feeds.filter(f => !f.key.startsWith('open_')).map(feed => (
                <option key={feed.key} value={feed.key}>
                  {feed.name} ({feed.key})
                </option>
              ))}
            </select>
            <div className="text-[10px] font-mono text-archival-muted-fg mt-1">If empty, data lives only locally as virtual feed.</div>
          </div>
          <div className="pt-6">
            <Button type="submit" className="w-full">{editingOpenSource ? "UPDATE_RECORD" : "COMMIT_RECORD"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isOpenSourceDeleteModalOpen}
        onClose={() => setIsOpenSourceDeleteModalOpen(false)}
        onConfirm={handleDeleteOpenSource}
        title="EXPUNGE_DATA_SOURCE"
        message="Are you sure you want to permanently delete this open data source? Polling will cease immediately."
      />

      <div className="mt-auto p-8 opacity-20 font-mono text-[9px] tracking-[0.5em] uppercase text-center w-full border-t border-archival-muted/20">
        END_OF_PARAMETER_RECORDS
      </div>
    </Shell>
  );
}
