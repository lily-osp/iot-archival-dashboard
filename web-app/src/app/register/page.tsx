"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, Button, Input, toast } from "@/components/ui/archival";
import Link from "next/link";
import { UserPlus, ArrowLeft, Building } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    orgName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("PASSWORD_CONFIRMATION_MISMATCH");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("ORGANIZATION_CREATED_CHECK_EMAIL");
        router.push("/login");
      } else {
        toast.error(data.error || "REGISTRATION_FAILED");
      }
    } catch (err) {
      toast.error("NETWORK_TRANSPORT_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-md mx-auto mt-16">
        <Link href="/login" className="inline-flex items-center text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-archival-muted-fg hover:text-archival-fg transition-all mb-8 group">
          <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
          Abort Registration
        </Link>
        
        <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
          <Building className="w-3 h-3" />
          <span>Initialize New Archive Organization</span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans mb-12 leading-[1.05]">
          Archive<br />Initialization
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 border border-archival-fg p-10 bg-archival-surface rounded-[6px] relative overflow-hidden">
          <Input 
            label="Organization Name"
            value={formData.orgName}
            onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            placeholder="e.g. My IoT Lab"
            required
          />

          <div className="border-t border-archival-muted/30 pt-6">
            <div className="flex items-center gap-2 museum-label mb-4 text-archival-muted-fg">
              <UserPlus className="w-3 h-3" />
              <span>Admin Account</span>
            </div>
          </div>

          <Input 
            label="Admin Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="ADMIN_ID"
            required
          />

          <Input 
            label="Admin Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="admin@example.com"
            required
          />

          <Input 
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Input 
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full py-6 text-[11px] tracking-[0.4em] uppercase" disabled={isLoading}>
            {isLoading ? "COMMITTING RECORD..." : "INITIALIZE ARCHIVE ORG"}
          </Button>

          <div className="absolute bottom-0 right-0 p-2 opacity-5 font-mono text-[8px] tracking-widest uppercase pointer-events-none">
            REG_MODULE_V2.0
          </div>
        </form>
        
        <div className="mt-12 p-8 border-2 border-archival-muted/20 bg-archival-bg/10 flex flex-col gap-4">
          <div className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-archival-muted-fg opacity-60">Entry_Requirements_Log</div>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-archival-muted-fg">
              <span className="w-1 h-1 bg-archival-accent rounded-full" />
              Minimum Password Length: 06 Characters
            </li>
            <li className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-archival-muted-fg">
              <span className="w-1 h-1 bg-archival-accent rounded-full" />
              Valid Email Address Required
            </li>
            <li className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-archival-muted-fg">
              <span className="w-1 h-1 bg-archival-accent rounded-full" />
              Email Verification Required Before Access
            </li>
            <li className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-archival-muted-fg">
              <span className="w-1 h-1 bg-archival-accent rounded-full" />
              Admin Can Invite Up To 5 Users
            </li>
          </ul>
        </div>
      </div>
    </Shell>
  );
}
