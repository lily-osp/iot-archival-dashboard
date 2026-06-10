"use client";

import { useSearchParams } from "next/navigation";
import { Shell, Button, Input } from "@/components/ui/archival";
import Link from "next/link";
import { Lock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Suspense, useState } from "react";

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!token) {
    return (
      <Shell>
        <div className="max-w-md mx-auto mt-24">
          <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
            <Lock className="w-3 h-3" />
            <span>Set Password Module</span>
          </div>
          <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans mb-12 leading-[1.05]">
            Invalid<br />Link
          </h1>
          <div className="border border-archival-fg p-10 bg-archival-surface rounded-[6px]">
            <div className="flex flex-col items-center text-center space-y-6">
              <XCircle className="w-16 h-16 text-archival-accent" />
              <p className="text-archival-muted-fg text-sm">No verification token provided. Please use the link from your email.</p>
              <Link href="/login">
                <Button variant="ghost" className="text-[10px] tracking-[0.2em]">RETURN_TO_LOGIN</Button>
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === "success") {
    return (
      <Shell>
        <div className="max-w-md mx-auto mt-24">
          <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
            <Lock className="w-3 h-3" />
            <span>Set Password Module</span>
          </div>
          <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans mb-12 leading-[1.05]">
            Password<br />Set
          </h1>
          <div className="border border-archival-fg p-10 bg-archival-surface rounded-[6px]">
            <div className="flex flex-col items-center text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-archival-success" />
              <p className="text-archival-muted-fg text-sm">Your password has been set. You can now log in.</p>
              <Link href="/login">
                <Button className="py-4 px-12 text-[11px] tracking-[0.4em] uppercase">PROCEED_TO_LOGIN</Button>
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("PASSWORDS_DO_NOT_MATCH");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("PASSWORD_TOO_SHORT");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMsg(data.error || "FAILED");
        setStatus("idle");
      }
    } catch {
      setErrorMsg("NETWORK_ERROR");
      setStatus("idle");
    }
  };

  return (
    <Shell>
      <div className="max-w-md mx-auto mt-24">
        <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
          <Lock className="w-3 h-3" />
          <span>Set Password Module</span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans mb-12 leading-[1.05]">
          Set Your<br />Password
        </h1>

        <div className="border border-archival-fg p-10 bg-archival-surface rounded-[6px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />

            {errorMsg && (
              <div className="p-4 border border-archival-accent/30 bg-archival-accent/5 rounded-[6px]">
                <div className="text-[10px] font-mono font-bold text-archival-accent tracking-widest uppercase">{errorMsg}</div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "SETTING_PASSWORD..." : "SET_PASSWORD"}
            </Button>
          </form>
        </div>
      </div>
    </Shell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="max-w-md mx-auto mt-24">
          <div className="museum-label p-24 text-center">LOADING_PASSWORD_MODULE...</div>
        </div>
      </Shell>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
