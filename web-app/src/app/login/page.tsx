"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Button, Input, toast, cn } from "@/components/ui/archival";
import Link from "next/link";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        toast.success("ACCESS_AUTHORIZED");
        router.push("/");
      } else {
        const data = await res.json();
        toast.error(data.error || "AUTHENTICATION_FAILED");
      }
    } catch (err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-md mx-auto mt-24">
        <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
          <Lock className="w-3 h-3" />
          <span>Secure Archive Access</span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans mb-12 leading-[1.05]">
          Identification<br />Required
        </h1>

        <form onSubmit={handleLogin} className="space-y-8 border border-archival-fg p-10 bg-archival-surface rounded-[6px] relative overflow-hidden">
          <Input 
            label="Collector Identifier"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="COLLECTOR_ID"
            required
          />

          <Input 
            label="Security Key"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full py-6 text-[11px] tracking-[0.4em] uppercase" disabled={isLoading}>
            {isLoading ? "AUTHENTICATING..." : "AUTHORIZE_ACCESS"}
          </Button>

          <div className="flex justify-center pt-4">
            <Link href="/register" className="text-[9px] font-mono font-bold tracking-[0.2em] text-archival-muted-fg hover:text-archival-accent transition-colors uppercase border-b border-transparent hover:border-archival-accent">
              Initialize New Collector Record
            </Link>
          </div>

          {/* Decorative Archive Metadata */}
          <div className="absolute bottom-0 right-0 p-2 opacity-5 font-mono text-[8px] tracking-widest uppercase pointer-events-none">
            AUTH_MODULE_V4.2
          </div>
          
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <User className="w-12 h-12 text-archival-fg" />
          </div>
        </form>
      </div>
    </Shell>
  );
}
