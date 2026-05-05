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
              <li><a href="#multi-account" className="hover:text-archival-accent transition-colors">Multi-Account Hub</a></li>
              <li><a href="#open-data" className="hover:text-archival-accent transition-colors">Virtual Feeds (Open Data)</a></li>
              <li><a href="#data-retention" className="hover:text-archival-accent transition-colors">Data Point Retention</a></li>
              <li><a href="#specimens" className="hover:text-archival-accent transition-colors">Specimen Types</a></li>
              <li><a href="#provisioning" className="hover:text-archival-accent transition-colors">Auto-Provisioning</a></li>
              <li><a href="#logic-matrix" className="hover:text-archival-accent transition-colors">Logic Matrix</a></li>
              <li><a href="#how-to" className="hover:text-archival-accent transition-colors">How-To Guide</a></li>
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

          <section id="multi-account" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Database className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Multi-Account Aggregation Hub</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p className="mb-6">
                The dashboard acts as an aggregation hub, allowing you to connect and manage multiple Adafruit IO accounts simultaneously. This architecture seamlessly bypasses free-tier limitations by pooling feeds from several accounts into a single, unified interface.
              </p>
              <p className="mb-6">
                <strong className="text-archival-accent">Multi-Broker MQTT Engine:</strong> The system maintains concurrent, real-time MQTT connections to all provisioned accounts, streaming data to a central Redis cache.
              </p>
              <p>
                <strong className="text-archival-accent">Cross-Account Automation:</strong> Because all data is aggregated locally, the Logic Matrix can bridge accounts. You can trigger an automation based on a sensor from Account A, evaluate conditions against a feed in Account B, and execute actions to control a relay on Account C—all seamlessly without manual routing.
              </p>
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="open-data" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Database className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Virtual Feeds (Open Data Integration)</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p className="mb-6">
                The dashboard can poll unauthenticated, external APIs (like weather APIs, cryptocurrency trackers, or public transport data) and integrate them natively as <strong className="text-archival-accent">Virtual Feeds</strong>.
              </p>
              <p className="mb-6">
                These sources are configured using a target URL and a JSON path extractor (e.g., <code className="bg-archival-bg px-1 border border-archival-muted">current.temperature_2m</code>). The system's background BullMQ worker periodically polls the API on a standard CRON schedule.
              </p>
              <div className="p-6 border border-archival-muted/50 rounded-[6px] bg-archival-surface mb-6">
                <h3 className="text-[0.875rem] font-bold tracking-[0.05em] uppercase text-archival-accent mb-4">Bundled Open Source Examples</h3>
                <ul className="space-y-3 text-[0.875rem] font-sans text-archival-muted-fg">
                  <li><strong className="text-archival-fg">Lamongan Temperature:</strong> Uses <code className="font-mono text-[0.75rem]">Open-Meteo</code> to fetch live local temperature tracking.</li>
                  <li><strong className="text-archival-fg">Current Time (Jakarta):</strong> Uses <code className="font-mono text-[0.75rem]">timeapi.io</code> to generate real-time timestamps bypassing NTP reliance.</li>
                  <li><strong className="text-archival-fg">Bitcoin Price (USD):</strong> Uses <code className="font-mono text-[0.75rem]">CoinGecko</code> API to natively graph cryptocurrency charts.</li>
                  <li><strong className="text-archival-fg">Ethereum Price (USD):</strong> Uses <code className="font-mono text-[0.75rem]">CoinGecko</code> API to track alternative crypto assets.</li>
                  <li><strong className="text-archival-fg">ISS Current Latitude:</strong> Uses <code className="font-mono text-[0.75rem]">Open-Notify</code> tracking the International Space Station.</li>
                  <li><strong className="text-archival-fg">Latest Earthquake Magnitude:</strong> Uses <code className="font-mono text-[0.75rem]">USGS</code> API to track recent global seismic activity.</li>
                  <li><strong className="text-archival-fg">Random Programming Joke:</strong> Uses <code className="font-mono text-[0.75rem]">JokeAPI</code> to fetch technical humor on an hourly schedule.</li>
                </ul>
              </div>
              <p>
                Virtual Feeds can either seamlessly bind directly to a widget on the dashboard via local Redis pub/sub—behaving identically to hardware data—or automatically route their parsed values upstream to an existing Adafruit IO feed for cloud logging.
              </p>
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="data-retention" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <Database className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">Data Point Retention</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg">
              <p className="mb-6">
                All incoming specimen values—whether from physical Adafruit IO hardware or Virtual Open Data Feeds—are automatically mirrored into a robust local <strong className="text-archival-accent">SQLite DataPoint Archive</strong>.
              </p>
              <p className="mb-6">
                This enables flawless historical chart rendering globally. By default, the system runs an automated background cleanup script to continuously prune data older than 7 days, preventing database bloat without sacrificing insight continuity.
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
                { name: "COLOR_PICKER (COLOR)", desc: "Hexadecimal color selection gate. Sends hex color codes to the attached feed." },
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-12">
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">1. LISTEN & MATCH</div>
                  <p className="text-[0.75rem]">Subscribes to multiple feeds or cron schedules. Combine conditions using "MATCH ALL" or "MATCH ANY" operators.</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">2. EVALUATE</div>
                  <p className="text-[0.75rem]">Performs mathematical (&gt;, &lt;, ==) or string comparisons locally with zero reliance on cloud computing.</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">3. IF/ELSE IF TRIGGERS</div>
                  <p className="text-[0.75rem]">Dispatches arrays of actions based on condition evaluation. Supports independent conditions for both IF (True) and ELSE IF (False) outcomes, allowing for multi-state logic routing.</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">4. WEBHOOK DISPATCH</div>
                  <p className="text-[0.75rem]">Trigger an external API via POST. Payloads support <code className="bg-archival-surface px-1">{"{{feedKey}}"}</code> interpolation to route live values dynamically.</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">5. INTER-WIRING</div>
                  <p className="text-[0.75rem]">Chain automations by allowing one automation to trigger another, creating complex multi-stage logic pipelines (Max depth of 5 to prevent loops).</p>
                </div>
                <div className="p-4 border border-archival-muted rounded bg-archival-bg/30">
                  <div className="text-[0.625rem] font-mono text-archival-muted-fg uppercase mb-2">6. MANUAL OVERRIDE (FORCE RUN)</div>
                  <p className="text-[0.75rem]">Instantly execute any automation rule's action chain directly from the dashboard UI for rapid testing and immediate feedback.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-archival-muted/20" />

          <section id="how-to" className="scroll-mt-12">
            <div className="flex items-center gap-4 mb-6">
              <BookOpen className="w-6 h-6 text-archival-accent" />
              <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] font-sans text-archival-fg">How-To Guide (Quick Procedures)</h2>
            </div>
            <div className="prose prose-archival max-w-none text-[1rem] leading-[1.6] text-archival-fg space-y-8">
              
              <div>
                <h3 className="text-[1.125rem] font-bold tracking-[-0.02em] font-sans mb-4">Adding a New Dashboard</h3>
                <ol className="list-decimal list-inside space-y-2 font-sans text-archival-muted-fg text-[0.875rem]">
                  <li>Navigate to the root page (Home).</li>
                  <li>Click <span className="font-mono text-[0.75rem] bg-archival-bg px-1">NEW_ARCHIVE_SECTOR</span>.</li>
                  <li>Provide a name for your dashboard and commit the record.</li>
                  <li>Click on the newly created dashboard block to enter it.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-[1.125rem] font-bold tracking-[-0.02em] font-sans mb-4">Placing a Widget (Specimen)</h3>
                <ol className="list-decimal list-inside space-y-2 font-sans text-archival-muted-fg text-[0.875rem]">
                  <li>Open your desired Dashboard.</li>
                  <li>Click <span className="font-mono text-[0.75rem] bg-archival-bg px-1">NEW_SPECIMEN</span> in the header.</li>
                  <li>Select the Widget Type (e.g. <span className="font-mono text-[0.75rem] bg-archival-bg px-1">MONITOR</span> or <span className="font-mono text-[0.75rem] bg-archival-bg px-1">SWITCH</span>).</li>
                  <li>Choose an existing feed from the dropdown, or select <span className="font-mono text-[0.75rem] bg-archival-bg px-1">CREATE_NEW_FEED</span> to Auto-Provision a new one.</li>
                  <li>Click <span className="font-mono text-[0.75rem] bg-archival-bg px-1">COMMIT_RECORD</span> to place the widget on your dashboard grid.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-[1.125rem] font-bold tracking-[-0.02em] font-sans mb-4">Creating an Automation Rule</h3>
                <ol className="list-decimal list-inside space-y-2 font-sans text-archival-muted-fg text-[0.875rem]">
                  <li>Navigate to <span className="font-mono text-[0.75rem] bg-archival-bg px-1">SYSTEM_LOGIC_MATRIX</span> (Automations) from the sidebar.</li>
                  <li>Click <span className="font-mono text-[0.75rem] bg-archival-bg px-1">NEW_AUTOMATION</span>.</li>
                  <li>Under CONDITIONS, select a trigger feed (e.g. <span className="font-mono text-[0.75rem] bg-archival-bg px-1">temperature</span>), an operator (<span className="font-mono text-[0.75rem] bg-archival-bg px-1">&gt;</span>), and a value (<span className="font-mono text-[0.75rem] bg-archival-bg px-1">30</span>).</li>
                  <li>Under ACTIONS, choose <span className="font-mono text-[0.75rem] bg-archival-bg px-1">PUBLISH TO FEED</span>, select your target feed (e.g. <span className="font-mono text-[0.75rem] bg-archival-bg px-1">fan_relay</span>), and set the payload to <span className="font-mono text-[0.75rem] bg-archival-bg px-1">1</span>.</li>
                  <li>Optionally add <span className="font-mono text-[0.75rem] bg-archival-bg px-1">ELSE ACTIONS</span> (e.g. Set <span className="font-mono text-[0.75rem] bg-archival-bg px-1">fan_relay</span> to <span className="font-mono text-[0.75rem] bg-archival-bg px-1">0</span>) to automatically turn the fan off when the temperature drops below 30.</li>
                  <li>Click <span className="font-mono text-[0.75rem] bg-archival-bg px-1">COMMIT_RULE_TO_MATRIX</span>.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-[1.125rem] font-bold tracking-[-0.02em] font-sans mb-4">Adding a Virtual Open Data Feed</h3>
                <ol className="list-decimal list-inside space-y-2 font-sans text-archival-muted-fg text-[0.875rem]">
                  <li>Navigate to <span className="font-mono text-[0.75rem] bg-archival-bg px-1">EXTERNAL_DATA_SOURCES</span> (Open Data) from the sidebar.</li>
                  <li>Click <span className="font-mono text-[0.75rem] bg-archival-bg px-1">ADD_DATA_SOURCE</span>.</li>
                  <li>Input the API endpoint (e.g. <span className="font-mono text-[0.75rem] bg-archival-bg px-1">https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd</span>).</li>
                  <li>Input the JSON Path to extract the value (e.g. <span className="font-mono text-[0.75rem] bg-archival-bg px-1">bitcoin.usd</span>).</li>
                  <li>Set the CRON schedule (e.g. <span className="font-mono text-[0.75rem] bg-archival-bg px-1">*/5 * * * *</span> for every 5 minutes).</li>
                  <li>Save the source. The feed will now appear in your widget binding dropdowns prefixed with <span className="font-mono text-[0.75rem] bg-archival-bg px-1">open_</span>.</li>
                </ol>
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
