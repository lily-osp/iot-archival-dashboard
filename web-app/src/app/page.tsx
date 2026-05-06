"use client";

import { useEffect, useState } from "react";
import { Shell, MuseumLabel, Button, Modal, Input, Select, ConfirmationModal, toast, cn } from "@/components/ui/archival";
import { Plus, Settings, RefreshCcw, LogOut, User, Trash2, Zap, Move, Check, X as XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Home() {
  const [widgets, setWidgets] = useState<any[]>([]);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dashboardTitle, setDashboardTitle] = useState("IoT Archival Dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = async () => {
    if (isRearrangeMode) return;
    setIsLoading(true);
    try {
      const [userRes, widgetRes, settingsRes, feedRes, accountsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/widgets"),
        fetch("/api/settings"),
        fetch("/api/feeds"),
        fetch("/api/accounts")
      ]);

      if (userRes.ok) setUser((await userRes.json()).user);
      if (widgetRes.ok) setWidgets(await widgetRes.json());
      if (feedRes.ok) setDiscoveredFeeds(await feedRes.json());
      if (accountsRes.ok) setAccounts(await accountsRes.json());
      
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        const title = settings.find((s: any) => s.key === "DASHBOARD_TITLE")?.value;
        if (title) setDashboardTitle(title);
      }
    } catch (_err) {
      console.error(_err);
      toast.error("FAILED_TO_SYNC_ARCHIVE_DATA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveNewOrder = async () => {
    setIsLoading(true);
    try {
      const orders = widgets.map((w, index) => ({ id: w.id, order: index }));
      const res = await fetch("/api/widgets/reorder", {
        method: "PUT",
        body: JSON.stringify({ orders })
      });
      if (res.ok) {
        toast.success("LAYOUT_COMMITTED_TO_ARCHIVE");
        setIsRearrangeMode(false);
      } else {
        toast.error("FAILED_TO_COMMIT_LAYOUT");
      }
    } catch (_err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRearrange = () => {
    setIsRearrangeMode(false);
    fetchData(); // Reset to saved order
  };

  const handleOpenCreate = () => {
    setEditingWidget(null);
    setFormData({ label: "", feedKey: "", type: "monitor", unit: "", min: "0", max: "255", accountId: accounts.length > 0 ? accounts[0].id : "" });
    setIsManualFeed(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (widget: any) => {
    if (isRearrangeMode) return;
    setEditingWidget(widget);
    setIsManualFeed(false);
    const settings = JSON.parse(widget.settings || "{}");
    const feed = discoveredFeeds.find(f => f.key === widget.feedKey);
    setFormData({
      label: widget.label,
      feedKey: widget.feedKey,
      type: widget.type as any,
      unit: settings.unit || "",
      min: settings.min?.toString() || "0",
      max: settings.max?.toString() || "255",
      accountId: feed?.accountId || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const feed = discoveredFeeds.find(f => f.key === formData.feedKey);
    const payload = {
      ...formData,
      feedName: feed?.name || formData.label,
      settings: { 
        unit: formData.unit,
        min: parseFloat(formData.min || "0"),
        max: parseFloat(formData.max || "255")
      }
    };

    try {
      const url = editingWidget ? `/api/widgets/${editingWidget.id}` : "/api/widgets";
      const method = editingWidget ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        toast.success(editingWidget ? "SPECIMEN_RECORD_UPDATED" : "NEW_SPECIMEN_COMMITTED");
      } else {
        const error = await res.json();
        toast.error(error.error || "COMMIT_FAILURE");
      }
    } catch (_err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    }
  };

  const handleDeleteWidget = async (id: string) => {
    setWidgetToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!widgetToDelete) return;
    try {
      const res = await fetch(`/api/widgets/${widgetToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setIsModalOpen(false);
        fetchData();
        toast.success("SPECIMEN_EXPUNGED_FROM_ARCHIVE");
      } else {
        const error = await res.json();
        toast.error(error.error || "EXPUNGE_FAILURE");
      }
    } catch (_err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.info("SESSION_TERMINATED");
    router.push("/login");
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    label: "",
    feedKey: "",
    type: "monitor" as "monitor" | "switch" | "chart" | "slider" | "indicator" | "button" | "dump" | "text" | "gauge" | "stream" | "color",
    unit: "",
    min: "0",
    max: "255",
    accountId: ""
  });
  const [isManualFeed, setIsManualFeed] = useState(false);

  return (
    <Shell>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24 relative overflow-hidden p-8 border-b-2 border-archival-fg/10">
        <div>
          <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
            <User className="w-3 h-3" />
            <span className="text-[10px] font-mono tracking-widest uppercase">AUTHENTICATED_SPECIMEN_COLLECTOR: {user?.username}</span>
          </div>
          <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans whitespace-pre-line leading-[1.05] text-archival-fg">
            {dashboardTitle.replace(" ", "\n")}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-archival-surface/50 p-2 rounded-[8px] border border-archival-muted/30 backdrop-blur-sm">
          {!isRearrangeMode ? (
            <>
              <div className="flex items-center gap-1 border-r border-archival-muted/30 pr-2 mr-1">
                <Button size="sm" variant="ghost" onClick={fetchData} disabled={isLoading} title="Sync Archive">
                  <RefreshCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  <span className="hidden lg:inline">SYNC</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsRearrangeMode(true)} title="Rearrange Layout">
                  <Move className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">REARRANGE</span>
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Link href="/automations">
                  <Button size="sm" variant="ghost" title="Logic Matrix">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">MATRIX</span>
                  </Button>
                </Link>
                <Button size="sm" onClick={handleOpenCreate} className="bg-archival-fg text-archival-bg border-archival-fg hover:bg-archival-accent hover:border-archival-accent">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">NEW_SPECIMEN</span>
                </Button>
              </div>

              <div className="ml-2 pl-2 border-l border-archival-muted/30">
                <Button size="sm" variant="minimal" onClick={handleLogout} className="text-archival-accent hover:bg-archival-accent/10">
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-2">
                <div className="text-[10px] font-mono font-bold text-archival-accent animate-pulse mr-2">REARRANGE_MODE_ACTIVE</div>
                <Button size="sm" onClick={saveNewOrder} disabled={isLoading} className="bg-archival-success border-archival-success hover:bg-green-700">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  SAVE
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelRearrange} className="border-archival-accent text-archival-accent hover:bg-archival-accent hover:text-white">
                  <XIcon className="w-3.5 h-3.5 mr-1" />
                  CANCEL
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="absolute top-0 right-0 p-2 opacity-10 font-mono text-[8px] tracking-widest uppercase pointer-events-none">
          SYSTEM_VERSION: 1.0.6-STABLE
        </div>
      </header>

      <div className="bg-archival-bg/10 p-8 rounded-[8px]">
        {widgets.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map(w => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {widgets.map((widget) => (
                  <SortableWidgetWrapper 
                    key={widget.id} 
                    widget={widget} 
                    isRearrangeMode={isRearrangeMode}
                    discoveredFeeds={discoveredFeeds}
                    onEdit={() => handleOpenEdit(widget)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="opacity-80 scale-105 pointer-events-none">
                  <RealtimeWidget 
                    widget={widgets.find(w => w.id === activeId)} 
                    initialValue={discoveredFeeds.find(f => f.key === widgets.find(w => w.id === activeId)?.feedKey)?.last_value}
                    onEdit={() => {}}
                    isRearrangeMode={true}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="p-32 text-center border-4 border-dashed border-archival-muted/30 bg-[#F0EDE4] flex flex-col items-center justify-center gap-6">
            <div className="text-[10px] font-mono font-bold tracking-[0.4em] uppercase text-archival-muted-fg/40 mb-2">
              ARCHIVE_EMPTY_REFERENCE_00
            </div>
            <div className="museum-label text-archival-muted-fg max-w-sm">
              {isLoading ? "Fetching records from remote data nodes..." : "No specimens found in this archive partition. Initialize to begin tracking."}
            </div>
            {!isLoading && (
              <Button variant="ghost" className="mt-8 border-archival-fg/20 px-12 py-6 font-bold" onClick={handleOpenCreate}>
                INITIALIZE_ARCHIVE
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingWidget ? "Modify Specimen" : "Add Specimen Widget"}
      >
        <form onSubmit={handleSubmit} className="space-y-10">
          <Input 
            label="Display Label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="e.g. LIVING ROOM TEMP"
            required
          />

          <div className="grid grid-cols-2 gap-10">
              <Select 
              label="Widget Type"
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val as any })}
              options={[
                { value: "monitor", label: "MONITOR (READ)" },
                { value: "chart", label: "CHART (HISTORY)" },
                { value: "text", label: "TEXT_LOG (READ)" },
                { value: "indicator", label: "INDICATOR (STATUS)" },
                { value: "switch", label: "SWITCH (TOGGLE)" },
                { value: "button", label: "BUTTON (TRIGGER)" },
                { value: "slider", label: "SLIDER (RANGE)" },
                { value: "gauge", label: "GAUGE (DIAL)" },
                { value: "stream", label: "STREAM (DATA_LOGS)" },
                { value: "dump", label: "DATA_DUMP (WRITE)" },
                { value: "color", label: "COLOR_PICKER (COLOR)" },
              ]}
              required
            />
            <Input 
              label="Unit (Suffix)"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g. °C, %, W"
            />
          </div>

          {(formData.type === "slider" || formData.type === "gauge") && (
            <div className="grid grid-cols-2 gap-10 p-6 border border-archival-muted/50 rounded-[6px] bg-archival-bg/50">
              <Input 
                label="Low Threshold (Min)"
                type="number"
                value={formData.min}
                onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                placeholder="0"
                required
              />
              <Input 
                label="High Threshold (Max)"
                type="number"
                value={formData.max}
                onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                placeholder="255"
                required
              />
              <div className="col-span-2 text-[0.625rem] font-mono text-archival-muted-fg uppercase tracking-[0.1em]">
                {formData.type.toUpperCase()}_RANGE_SPECIFICATION
              </div>
            </div>
          )}

          <div className="space-y-6">
            <Select 
              label="Data Feed Binding"
              value={isManualFeed ? "__MANUAL__" : formData.feedKey}
              onChange={(val) => {
                if (val === "__MANUAL__") {
                  setIsManualFeed(true);
                  setFormData({ ...formData, feedKey: "" });
                } else {
                  setIsManualFeed(false);
                  setFormData({ ...formData, feedKey: val });
                }
              }}
              options={[
                { value: "", label: "SELECT_DISCOVERED_FEED..." },
                { value: "__MANUAL__", label: "CREATE_NEW_FEED (MANUAL_ENTRY)" },
                ...discoveredFeeds.map(feed => ({ 
                  value: feed.key, 
                  label: `${feed.accountName ? `[${feed.accountName}] ` : ''}${feed.name.toUpperCase()} (${feed.key})` 
                }))
              ]}
              required
            />

            {isManualFeed && (
              <div className="animate-entrance space-y-6">
                <Input 
                  label="New Feed Key Identifier"
                  value={formData.feedKey}
                  onChange={(e) => setFormData({ ...formData, feedKey: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="e.g. living-room-light"
                  required
                />
                
                {accounts.length > 0 && (
                  <Select
                    label="Target Adafruit IO Account"
                    value={formData.accountId}
                    onChange={(val) => setFormData({ ...formData, accountId: val })}
                    options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                    required
                  />
                )}
                <div className="mt-2 text-[8px] font-mono text-archival-muted-fg tracking-widest uppercase opacity-40">
                  SYSTEM_NOTE: THIS_FEED_WILL_BE_AUTOMATICALLY_PROVISIONED_ON_COMMIT
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-10 border-t-2 border-archival-fg/10">
            <Button type="submit" className="flex-1 py-8 text-[11px] tracking-[0.5em] font-bold uppercase transition-all">
              {editingWidget ? "UPDATE_ARCHIVE_RECORD" : "COMMIT_SPECIMEN_TO_DATABASE"}
            </Button>
            {editingWidget && (
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => handleDeleteWidget(editingWidget.id)}
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
        title="EXPUNGE_SPECIMEN_RECORD"
        message="This action will permanently remove the selected specimen from the archival ledger. This process is irreversible."
        confirmText="EXPUNGE_RECORD"
        cancelText="ABORT_EXPUNGE"
      />

      <footer className="mt-auto pt-12 border-t border-archival-muted/50 flex flex-col md:flex-row justify-end items-center gap-8 opacity-60 hover:opacity-100 transition-opacity duration-[225ms]">
        <div className="flex gap-8 items-center">
          <Link href="/docs" className="flex items-center gap-2 group text-archival-muted-fg hover:text-archival-accent transition-colors duration-[150ms]">
            <span className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase">DOCUMENTATION</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-2 group text-archival-muted-fg hover:text-archival-accent transition-colors duration-[150ms]">
            <Settings className="w-3 h-3 group-hover:rotate-90 transition-transform duration-[375ms]" />
            <span className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase">SYSTEM_CONFIGURATION</span>
          </Link>
        </div>
      </footer>
    </Shell>
  );
}

function SortableWidgetWrapper({ widget, isRearrangeMode, discoveredFeeds, onEdit }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isRearrangeMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(isRearrangeMode ? listeners : {})}>
      <RealtimeWidget 
        widget={widget} 
        initialValue={discoveredFeeds.find((f: any) => f.key === widget.feedKey)?.last_value} 
        onEdit={onEdit} 
        isRearrangeMode={isRearrangeMode}
      />
    </div>
  );
}

function RealtimeWidget({ widget, initialValue, onEdit, isRearrangeMode }: { widget: any; initialValue?: string; onEdit: () => void; isRearrangeMode?: boolean }) {
  const [value, setValue] = useState<string | null>(initialValue || null);
  const [history, setHistory] = useState<any[]>([]);
  const settings = JSON.parse(widget.settings || "{}");

  useEffect(() => {
    if (initialValue !== undefined && value === null) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const fetchHistory = async () => {
    if (widget.type !== "chart" && widget.type !== "stream") return;
    try {
      const res = await fetch(`/api/feeds/${widget.feedKey}/history`);
      if (res.ok) setHistory(await res.json());
    } catch (_err) {
      console.error(_err);
    }
  };

  useEffect(() => {
    fetchHistory();
    const eventSource = new EventSource(`/api/stream/${widget.feedKey}`);
    
    eventSource.onmessage = (event) => {
      if (!event.data.includes("Connected to")) {
        setValue(event.data);
        if (widget.type === "chart" || widget.type === "stream") {
          setHistory(prev => [{ value: event.data, created_at: new Date().toISOString() }, ...prev].slice(0, widget.type === "stream" ? 50 : 20));
        }
      }
    };

    return () => eventSource.close();
  }, [widget.feedKey, widget.type]);

  const handleControlChange = async (newValue: string) => {
    if (isRearrangeMode) return;
    if (widget.type !== "button") {
      setValue(newValue); 
    }
    
    try {
      const res = await fetch(`/api/feeds/${widget.feedKey}/send`, {
        method: "POST",
        body: JSON.stringify({ value: newValue })
      });
      if (res.ok) {
        toast.info(`CONTROL_SIGNAL_SENT: ${newValue}`);
        
        // If it's a button, send a '0' after a short delay to reset the pulse
        if (widget.type === "button") {
          setTimeout(async () => {
            await fetch(`/api/feeds/${widget.feedKey}/send`, {
              method: "POST",
              body: JSON.stringify({ value: "0" })
            });
          }, 200);
        }
      } else {
        toast.error("SIGNAL_TRANSMISSION_FAILED");
      }
    } catch (_err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    }
  };

  return (
    <MuseumLabel 
      label={widget.label} 
      value={value ?? undefined} 
      unit={settings.unit}
      min={settings.min}
      max={settings.max}
      type={widget.type as any}
      onControlChange={handleControlChange}
      onHeaderClick={onEdit}
      history={history}
      className={cn("h-full", isRearrangeMode && "cursor-move border-archival-accent/50 shadow-lg")}
    />
  );
}
