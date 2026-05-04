"use client";

import { Shell, Button, cn } from "@/components/ui/archival";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, Zap, Database, Shield, Activity } from "lucide-react";

export default function DocsPage() {
  return (
    <Shell>
      <header className="mb-24 p-8 border-b border-archival-muted/50 relative overflow-hidden">
        <Link href="/" className="inline-flex items-center text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg hover:text-archival-fg transition-all mb-12 group">
          <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-2 transition-transform duration-[225ms]" />
          RETURN_TO_ARCHIVE_ROOT
        </Link>
        <div className="flex items-center gap-2 mb-3 text-archival-accent">
          <BookOpen className="w-4 h-4" />
          <span className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg">
            SYSTEM_DOCUMENTATION_M1
          </span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans leading-[1.05] text-archival-fg">
          Archival<br />Procedures
        </h1>
        <div className="absolute top-0 right-0 p-4 opacity-5 font-mono text-[10px] tracking-widest uppercase pointer-events-none">
          DOCS_VERSION_1.0
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 border-r border-archival-muted/30 pr-8 hidden lg:block">
          <nav className="sticky top-12 space-y-6">
            <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg opacity-60 mb-4">
              INDEX
            </div>
            <ul className="space-y-4 text-[0.875rem] font-sans font-medium text-archival-muted-fg">
              <li><a href="#concept" className="hover:text-archival-accent transition-colors">Core Concept</a></li>
              <li><a href="#specimens" className="hover:text-archival-accent transition-colors">Specimen Types</a></li>
              <li><a href="#provisioning" className="hover:text-archival-accent transition-colors">Auto-Provisioning</a></li>
              <li><a href="#logic-matrix" className="hover:text-archival-accent transition-colors">Logic Matrix</a></li>
              <li><a href="#security" className="hover:text-archival-accent transition-colors">Security Protocol</a></li>
            </ul>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-24 pb-24">
          
          <section id="concept" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Layers className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Core Concept</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p className="mb-6">
                The Swiss Archival IoT Dashboard treats raw hardware data as curated museum artifacts. Every sensor reading, toggle state, and text log is referred to as a <span className="font-semibold text-archival-accent">Specimen</span>. 
              </p>
              <p>
                By adopting a strict visual hierarchy—separating narrative content (Plus Jakarta Sans) from technical metadata (JetBrains Mono)—the system ensures that data is both beautiful to observe and rigorous to manage. The system automatically hydrates widgets with their <span className="font-semibold italic">Last Known State</span> from remote feeds upon initialization, ensuring data continuity across reloads.
              </p>
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="specimens" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Database className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Specimen Types</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "MONITOR (READ)", desc: "High-visibility numerical readouts for sensors like temperature, humidity, or power." },
                { name: "CHART (HISTORY)", desc: "Step-based historical visualizations of numeric data streams. Requires historical retention." },
                { name: "TEXT_LOG (READ)", desc: "Universal string data display. Used for status messages, logs, or non-numeric state." },
                { name: "INDICATOR (STATUS)", desc: "Boolean state visualizer. Lights up green for '1', 'ON', or 'true'." },
                { name: "SWITCH (TOGGLE)", desc: "Boolean control gate. Sends '1' or '0' commands to the attached feed." },
                { name: "BUTTON (TRIGGER)", desc: "Momentary pulse trigger. Sends a '1' signal followed by an automatic '0' reset after 200ms." },
                { name: "SLIDER (RANGE)", desc: "Analog control surface. Supports custom Low/High thresholds (e.g. 0-100% or -10 to 50°C)." },
                { name: "GAUGE (DIAL)", desc: "Semi-circular analog dial indicating a value's position between a configured minimum and maximum threshold." },
                { name: "STREAM (DATA_LOGS)", desc: "A live, scrolling terminal-like stream of historical and incoming string or numeric data events." },
                { name: "DATA_DUMP (WRITE)", desc: "Unlimited capacity buffer for sending large string configurations or manual logs." }
              ].map((type) => (
                <div key={type.name} className="p-6 border border-archival-muted rounded-[6px] bg-archival-surface">
                  <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] text-archival-accent uppercase mb-2">{type.name}</div>
                  <p className="text-[0.875rem] font-sans text-archival-muted-fg leading-relaxed">{type.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="provisioning" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Zap className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Auto-Provisioning</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p className="mb-6">
                The system features a zero-touch remote configuration pipeline. You do not need to log into Adafruit IO to prepare your data feeds.
              </p>
              <div className="p-6 border-l-4 border-archival-accent bg-archival-surface text-[0.875rem]">
                <strong className="block mb-2 font-sans">Procedure:</strong>
                <ol className="list-decimal list-inside space-y-2 font-sans text-archival-muted-fg">
                  <li>Open the <span className="font-mono text-[0.75rem] bg-archival-bg px-1">NEW_SPECIMEN</span> modal.</li>
                  <li>Select <span className="font-mono text-[0.75rem] bg-archival-bg px-1">CREATE_NEW_FEED (MANUAL_ENTRY)</span> from the Binding dropdown.</li>
                  <li>Enter a unique key (e.g., <span className="font-mono text-[0.75rem] bg-archival-bg px-1">living-room-temp</span>).</li>
                  <li>Commit the record. The system will automatically contact the remote server and initialize the feed.</li>
                </ol>
              </div>
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="logic-matrix" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Activity className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Logic Matrix (Advanced Automations)</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p className="mb-6">
                The <span className="font-semibold text-archival-accent uppercase tracking-wider">Logic Matrix</span> is the local automation engine. It handles complex pipelines, including 1-to-1, 1-to-many, and many-to-many logic. It features both real-time event-based evaluation and robust CRON-based scheduling.
              </p>
              
              <h3 className="text-[1.125rem] font-bold tracking-[-0.02em] font-sans mt-8 mb-4">Event-Based Protocol</h3>
              <p className="mb-6">
                Monitors MQTT data streams in real-time. When a feed is updated, the matrix immediately evaluates conditions to trigger configured actions.
              </p>
              
              <h3 className="text-[1.125rem] font-bold tracking-[-0.02em] font-sans mt-8 mb-4">Time-Based Protocol (Conditional Scheduling)</h3>
              <p className="mb-6">
                Leverages BullMQ backed by Redis for robust, timezone-aware scheduling. Time-based rules execute on a CRON schedule (e.g., Every Day at 8 AM). 
                <br /><br />
                <strong className="text-archival-accent">Advanced Capability:</strong> Time-based rules can optionally include Condition limits. Before the schedule executes its actions, it queries the local Redis cache for the latest feed states. If the conditions (e.g., <code>temperature &gt; 30</code>) are not met at the exact time of the schedule, the execution is gracefully skipped.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-12">
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">1. LISTEN & MATCH</div>
                  <p className="text-[0.75rem]">Subscribes to multiple feeds or cron schedules. Combine conditions using "MATCH ALL" or "MATCH ANY" operators.</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">2. EVALUATE</div>
                  <p className="text-[0.75rem]">Performs mathematical (&gt;, &lt;, ==) or string comparisons locally with zero reliance on cloud computing.</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">3. SEQUENTIAL TRIGGER</div>
                  <p className="text-[0.75rem]">Dispatches an array of actions. Actions can either publish a new payload or wait via configured delays.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="security" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Shield className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Security Protocol</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p>
                The system employs a JWT-based authentication layer. Every collector must register an account and authenticate before the archive allows specimen interaction.
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-[0.875rem] text-archival-muted-fg">
                <li><strong className="text-archival-fg">Local Isolation:</strong> Your Adafruit IO key never leaves the secure server environment.</li>
                <li><strong className="text-archival-fg">Session Guard:</strong> Authenticated sessions are tracked via secure-only HTTP cookies.</li>
                <li><strong className="text-archival-fg">Encryption:</strong> All remote communications use TLS/SSL for both MQTT and HTTP transports.</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
      
      <div className="mt-auto pt-8 border-t border-archival-muted/50 text-center opacity-40 hover:opacity-80 transition-opacity">
        <div className="text-[0.625rem] font-mono font-semibold tracking-[0.1em] uppercase text-archival-muted-fg">
          END_OF_DOCUMENTATION_FILE
        </div>
      </div>
    </Shell>
  );
}
