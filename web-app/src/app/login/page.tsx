"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Button, Input, toast } from "@/components/ui/archival";
import Link from "next/link";
import { Lock, User, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUnverifiedEmail(null);

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
        if (data.error === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(data.email || username);
        } else {
          toast.error(data.error || "AUTHENTICATION_FAILED");
        }
      }
    } catch (err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      if (res.ok) {
        toast.success("VERIFICATION_EMAIL_SENT");
      } else {
        toast.error("FAILED_TO_SEND_VERIFICATION");
      }
    } catch {
      toast.error("NETWORK_TRANSPORT_ERROR");
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
              Initialize New Archive Organization
            </Link>
          </div>

          <div className="absolute bottom-0 right-0 p-2 opacity-5 font-mono text-[8px] tracking-widest uppercase pointer-events-none">
            AUTH_MODULE_V4.2
          </div>
          
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <User className="w-12 h-12 text-archival-fg" />
          </div>
        </form>

        {unverifiedEmail && (
          <div className="mt-8 p-8 border border-archival-warning bg-archival-warning/5 rounded-[6px]">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-archival-warning shrink-0 mt-1" />
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-mono font-bold text-archival-warning tracking-widest uppercase mb-2">
                    EMAIL_NOT_VERIFIED
                  </div>
                  <p className="text-archival-muted-fg text-sm leading-relaxed">
                    Your account exists but email verification is pending.
                    Check your inbox or request a new verification link.
                  </p>
                </div>
                <Button variant="ghost" onClick={handleResendVerification} className="text-[10px] tracking-[0.2em] border-archival-warning text-archival-warning hover:bg-archival-warning/10">
                  RESEND_VERIFICATION_EMAIL
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
