"use client";

import { useSearchParams } from "next/navigation";
import { Shell, Button } from "@/components/ui/archival";
import Link from "next/link";
import { Mail, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const getStatus = () => {
    if (success === "true") {
      return {
        icon: <CheckCircle className="w-16 h-16 text-archival-success" />,
        title: "EMAIL_VERIFIED",
        subtitle: "Archive Access Authorized",
        message: "Your email has been verified. You can now log in to the IoT Archival Dashboard.",
        variant: "success" as const,
      };
    }

    if (error) {
      const errorMessages: Record<string, { title: string; message: string }> = {
        missing_token: {
          title: "MISSING_VERIFICATION_TOKEN",
          message: "The verification link is invalid or missing a required token parameter.",
        },
        invalid_token: {
          title: "INVALID_VERIFICATION_TOKEN",
          message: "The verification token does not exist or is malformed.",
        },
        token_used: {
          title: "TOKEN_ALREADY_CONSUMED",
          message: "This verification link has already been used. Check your email for a newer link.",
        },
        token_expired: {
          title: "TOKEN_EXPIRED",
          message: "This verification link has expired. Request a new one from your administrator.",
        },
        internal_error: {
          title: "SYSTEM_PROCESSING_ERROR",
          message: "An internal error occurred during verification. Please try again.",
        },
      };

      const err = errorMessages[error] || {
        title: "UNKNOWN_ERROR",
        message: "An unexpected error occurred during verification.",
      };

      return {
        icon: <XCircle className="w-16 h-16 text-archival-accent" />,
        title: err.title,
        subtitle: "Verification Failed",
        message: err.message,
        variant: "error" as const,
      };
    }

    return {
      icon: <AlertTriangle className="w-16 h-16 text-archival-warning" />,
      title: "NO_VERIFICATION_CONTEXT",
      message: "No verification token was provided. Please use the link from your email.",
      variant: "warning" as const,
    };
  };

  const status = getStatus();

  return (
    <Shell>
      <div className="max-w-md mx-auto mt-24">
        <div className="flex items-center gap-2 museum-label mb-2 text-archival-accent">
          <Mail className="w-3 h-3" />
          <span>Email Verification Module</span>
        </div>
        <h1 className="text-[3rem] font-bold tracking-[-0.03em] uppercase font-sans mb-12 leading-[1.05]">
          Verification<br />Status
        </h1>

        <div className="border border-archival-fg p-10 bg-archival-surface rounded-[6px] relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-8">
            {status.icon}
            
            <div className="space-y-2">
              <div className="text-[0.625rem] font-mono font-bold tracking-[0.2em] text-archival-muted-fg uppercase">
                {status.subtitle}
              </div>
              <h2 className="text-[1.5rem] font-bold font-sans tracking-[-0.02em] text-archival-fg">
                {status.title}
              </h2>
            </div>

            <p className="text-archival-muted-fg text-sm leading-relaxed max-w-sm">
              {status.message}
            </p>

            {status.variant === "success" && (
              <Link href="/login">
                <Button className="py-4 px-12 text-[11px] tracking-[0.4em] uppercase">
                  PROCEED_TO_LOGIN
                </Button>
              </Link>
            )}

            {status.variant !== "success" && (
              <div className="flex gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-[10px] tracking-[0.2em]">
                    RETURN_TO_LOGIN
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 right-0 p-2 opacity-5 font-mono text-[8px] tracking-widest uppercase pointer-events-none">
            VERIFY_MODULE_V2.0
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="max-w-md mx-auto mt-24">
          <div className="museum-label p-24 text-center">LOADING_VERIFICATION_MODULE...</div>
        </div>
      </Shell>
    }>
      <VerifyContent />
    </Suspense>
  );
}
