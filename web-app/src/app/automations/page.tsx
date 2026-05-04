"use client";

import { useEffect, useState } from "react";
import { Shell, Button, Modal, Input, Select, Switch, ConfirmationModal, toast, cn } from "@/components/ui/archival";
import { Plus, RefreshCcw, ArrowLeft, Trash2, Activity, Zap, X, Clock } from "lucide-react";
import Link from "next/link";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    conditionMatch: "ALL",
    conditions: [{ feedKey: "", operator: "==", value: "" }],
    actions: [{ type: "publish", feedKey: "", value: "", delayMs: 0 }],
    isActive: true
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [autoRes, feedRes] = await Promise.all([
        fetch("/api/automations"),
        fetch("/api/feeds")
      ]);

      if (autoRes.ok) setAutomations(await autoRes.json());
      if (feedRes.ok) setDiscoveredFeeds(await feedRes.json());
    } catch (err) {
      console.error(err);
      toast.error("FAILED_TO_SYNC_AUTOMATIONS");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({ 
      name: "", 
      conditionMatch: "ALL",
      conditions: [{ feedKey: "", operator: "==", value: "" }],
      actions: [{ type: "publish", feedKey: "", value: "", delayMs: 0 }],
      isActive: true 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      conditionMatch: rule.conditionMatch || "ALL",
      conditions: rule.conditions?.length ? rule.conditions : [{ feedKey: "", operator: "==", value: "" }],
      actions: rule.actions?.length ? rule.actions : [{ type: "publish", feedKey: "", value: "", delayMs: 0 }],
      isActive: rule.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRule ? `/api/automations/${editingRule.id}` : "/api/automations";
      const method = editingRule ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        toast.success(editingRule ? "AUTOMATION_RECORD_UPDATED" : "NEW_AUTOMATION_COMMITTED");
      } else {
        const error = await res.json();
        toast.error(error.error || "COMMIT_FAILURE");
      }
    } catch (err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    }
  };

  const toggleStatus = async (rule: any) => {
    try {
      const res = await fetch(`/api/automations/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...rule, isActive: !rule.isActive })
      });
      if (res.ok) fetchData();
    } catch (err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    }
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      const res = await fetch(`/api/automations/${ruleToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setIsModalOpen(false);
        fetchData();
        toast.success("AUTOMATION_EXPUNGED");
      } else {
        const error = await res.json();
        toast.error(error.error || "EXPUNGE_FAILURE");
      }
    } catch (err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    }
  };

  const feedOptions = [
    { value: "", label: "SELECT_FEED..." },
    ...discoveredFeeds.map(feed => ({ 
      value: feed.key, 
      label: `${feed.name.toUpperCase()} (${feed.key})` 
    }))
  ];

  return (
    <Shell>
      <header className="mb-24 p-8 border-b border-archival-muted/50 relative overflow-hidden">
        <Link href="/" className="inline-flex items-center text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg hover:text-archival-fg transition-all mb-12 group">
          <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-2 transition-transform duration-[225ms]" />
          RETURN_TO_ARCHIVE_ROOT
        </Link>
        <div className="flex items-center gap-2 mb-3 text-archival-accent">
          <Activity className="w-4 h-4" />
          <span className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg">
            SYSTEM_LOGIC_MATRIX
          </span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans leading-[1.05] text-archival-fg">
          Automations<br />Protocol
        </h1>
        <div className="absolute top-0 right-0 p-4 opacity-5 font-mono text-[10px] tracking-widest uppercase pointer-events-none">
          LOGIC_MODULE_V2
        </div>
        
        <div className="flex gap-4 mt-8">
          <Button variant="ghost" onClick={fetchData} disabled={isLoading} className="border-archival-fg/20 hover:border-archival-fg">
            <RefreshCcw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            SYNC_MATRIX
          </Button>
          <Button onClick={handleOpenCreate} className="transition-all">
            <Plus className="w-4 h-4 mr-2" />
            NEW_AUTOMATION
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
        {automations.length > 0 ? (
          automations.map((rule) => (
            <div 
              key={rule.id} 
              className={cn(
                "border border-archival-muted p-6 bg-archival-surface rounded-[6px] relative transition-all duration-[225ms] ease-[cubic-bezier(0.65,0,0.35,1)] hover:border-archival-accent flex flex-col gap-6 cursor-pointer",
                !rule.isActive && "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
              )}
              onClick={() => handleOpenEdit(rule)}
            >
              <div className="flex justify-between items-start border-b border-archival-muted/50 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[1rem] font-bold font-sans tracking-[-0.02em] text-archival-fg leading-none">
                    {rule.name}
                  </span>
                  <span className="text-[0.625rem] font-mono text-archival-muted-fg tracking-[0.1em] uppercase">
                    RULE_ID: {rule.id.slice(0,8).toUpperCase()}
                  </span>
                </div>
                <div 
                  className="shrink-0 ml-4"
                  onClick={(e) => { e.stopPropagation(); toggleStatus(rule); }}
                >
                  <Switch checked={rule.isActive} onChange={() => {}} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-accent uppercase">
                  IF {rule.conditionMatch === "ALL" ? "ALL" : "ANY"} OF:
                </div>
                {rule.conditions?.map((cond: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-archival-muted-fg font-mono text-[0.75rem] uppercase tracking-[0.1em]">
                    <span className="shrink-0 bg-archival-bg px-2 py-1 rounded border border-archival-muted/50">COND {i + 1}</span>
                    <span className="font-bold text-archival-fg break-all">{cond.feedKey}</span>
                    <span className="text-archival-accent">{cond.operator}</span>
                    <span className="font-bold text-archival-fg">{cond.value}</span>
                  </div>
                ))}
                
                <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-accent uppercase mt-4">
                  THEN:
                </div>
                {rule.actions?.map((act: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-archival-muted-fg font-mono text-[0.75rem] uppercase tracking-[0.1em]">
                    <span className="shrink-0 bg-archival-bg px-2 py-1 rounded border border-archival-muted/50">STEP {i + 1}</span>
                    {act.type === "delay" ? (
                      <>
                        <Clock className="w-3 h-3 text-archival-accent" />
                        <span>WAIT</span>
                        <span className="font-bold text-archival-fg">{act.delayMs}ms</span>
                      </>
                    ) : (
                      <>
                        <span>SET</span>
                        <span className="font-bold text-archival-fg break-all">{act.feedKey}</span>
                        <span>TO</span>
                        <span className="font-bold text-archival-fg">{act.value}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-32 text-center border-4 border-dashed border-archival-muted/30 bg-[#F0EDE4] flex flex-col items-center justify-center gap-6">
            <Zap className="w-8 h-8 text-archival-muted-fg/40 mb-2" />
            <div className="text-[10px] font-mono font-bold tracking-[0.4em] uppercase text-archival-muted-fg/40 mb-2">
              LOGIC_MATRIX_EMPTY
            </div>
            <div className="text-[0.875rem] font-sans text-archival-muted-fg max-w-sm">
              {isLoading ? "Fetching automations..." : "No rules defined. Initialize an automation to map sensor inputs to outputs."}
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingRule ? "Modify Automation" : "New Automation Rule"}
      >
        <form onSubmit={handleSubmit} className="space-y-10">
          <Input 
            label="Rule Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Auto-Fan On High Temp"
            required
          />

          <div className="space-y-6 p-6 border border-archival-muted/50 rounded-[6px] bg-archival-bg/50">
            <div className="flex justify-between items-center">
              <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-accent uppercase">CONDITIONS (TRIGGERS)</div>
              <Select 
                label=""
                value={formData.conditionMatch}
                onChange={(val) => setFormData({ ...formData, conditionMatch: val })}
                options={[
                  { value: "ALL", label: "MATCH ALL" },
                  { value: "ANY", label: "MATCH ANY" }
                ]}
              />
            </div>
            
            {formData.conditions.map((cond, index) => (
              <div key={index} className="p-4 border border-archival-muted/30 bg-archival-surface rounded relative space-y-4">
                <div className="absolute top-2 right-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      const newConds = [...formData.conditions];
                      newConds.splice(index, 1);
                      setFormData({ ...formData, conditions: newConds });
                    }}
                    className="text-archival-muted-fg hover:text-archival-accent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Select 
                  label="Listen to Feed"
                  value={cond.feedKey}
                  onChange={(val) => {
                    const newConds = [...formData.conditions];
                    newConds[index].feedKey = val;
                    setFormData({ ...formData, conditions: newConds });
                  }}
                  options={feedOptions}
                  required
                />
                
                <div className="grid grid-cols-2 gap-6">
                  <Select 
                    label="Operator"
                    value={cond.operator}
                    onChange={(val) => {
                      const newConds = [...formData.conditions];
                      newConds[index].operator = val;
                      setFormData({ ...formData, conditions: newConds });
                    }}
                    options={[
                      { value: "==", label: "EQUALS (==)" },
                      { value: "!=", label: "NOT EQUALS (!=)" },
                      { value: ">", label: "GREATER THAN (>)" },
                      { value: "<", label: "LESS THAN (<)" },
                      { value: ">=", label: "GREATER OR EQUAL (>=)" },
                      { value: "<=", label: "LESS OR EQUAL (<=)" }
                    ]}
                    required
                  />
                  <Input 
                    label="Threshold Value"
                    value={cond.value}
                    onChange={(e) => {
                      const newConds = [...formData.conditions];
                      newConds[index].value = e.target.value;
                      setFormData({ ...formData, conditions: newConds });
                    }}
                    placeholder="e.g. 30"
                    required
                  />
                </div>
              </div>
            ))}
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setFormData({ 
                  ...formData, 
                  conditions: [...formData.conditions, { feedKey: "", operator: "==", value: "" }] 
                });
              }}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" /> ADD CONDITION
            </Button>
          </div>

          <div className="space-y-6 p-6 border border-archival-muted/50 rounded-[6px] bg-archival-bg/50">
            <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-accent uppercase">ACTIONS (RESULTS)</div>
            
            {formData.actions.map((act, index) => (
              <div key={index} className="p-4 border border-archival-muted/30 bg-archival-surface rounded relative space-y-4">
                <div className="absolute top-2 right-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      const newActs = [...formData.actions];
                      newActs.splice(index, 1);
                      setFormData({ ...formData, actions: newActs });
                    }}
                    className="text-archival-muted-fg hover:text-archival-accent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <Select 
                  label="Action Type"
                  value={act.type}
                  onChange={(val) => {
                    const newActs = [...formData.actions];
                    newActs[index].type = val;
                    setFormData({ ...formData, actions: newActs });
                  }}
                  options={[
                    { value: "publish", label: "PUBLISH TO FEED" },
                    { value: "delay", label: "WAIT (DELAY)" }
                  ]}
                  required
                />

                {act.type === "publish" ? (
                  <>
                    <Select 
                      label="Target Feed"
                      value={act.feedKey}
                      onChange={(val) => {
                        const newActs = [...formData.actions];
                        newActs[index].feedKey = val;
                        setFormData({ ...formData, actions: newActs });
                      }}
                      options={feedOptions}
                      required
                    />
                    
                    <Input 
                      label="Set Payload To"
                      value={act.value}
                      onChange={(e) => {
                        const newActs = [...formData.actions];
                        newActs[index].value = e.target.value;
                        setFormData({ ...formData, actions: newActs });
                      }}
                      placeholder="e.g. ON or 1"
                      required
                    />
                  </>
                ) : (
                  <Input 
                    label="Delay in Milliseconds"
                    type="number"
                    value={act.delayMs.toString()}
                    onChange={(e) => {
                      const newActs = [...formData.actions];
                      newActs[index].delayMs = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, actions: newActs });
                    }}
                    placeholder="e.g. 5000"
                    required
                  />
                )}
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setFormData({ 
                  ...formData, 
                  actions: [...formData.actions, { type: "publish", feedKey: "", value: "", delayMs: 0 }] 
                });
              }}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" /> ADD ACTION
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-archival-muted/50 rounded-[6px]">
            <span className="text-[0.75rem] font-mono font-semibold text-archival-muted-fg tracking-[0.1em] uppercase">RULE_ACTIVE_STATE</span>
            <Switch 
              checked={formData.isActive} 
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex gap-4 pt-10 border-t-2 border-archival-fg/10">
            <Button type="submit" className="flex-1 py-8 text-[11px] tracking-[0.5em] font-bold uppercase transition-all">
              {editingRule ? "UPDATE_RULE_RECORD" : "COMMIT_RULE_TO_MATRIX"}
            </Button>
            {editingRule && (
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => { setRuleToDelete(editingRule.id); setIsDeleteModalOpen(true); }}
                className="px-10 border-archival-accent text-archival-accent hover:bg-archival-accent hover:text-white transition-all duration-300"
                title="Expunge Record"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="EXPUNGE_RULE_RECORD"
        message="This action will permanently remove the logic rule. Associated feeds will remain intact."
        confirmText="EXPUNGE_RULE"
        cancelText="ABORT"
      />

      <div className="mt-auto pt-8 border-t border-archival-muted/50 text-center opacity-40 hover:opacity-80 transition-opacity">
        <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg">
          END_OF_AUTOMATION_RECORDS
        </div>
      </div>
    </Shell>
  );
}
