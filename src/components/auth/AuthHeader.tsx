"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserMenu } from "@/components/auth/UserMenu";

export function AuthHeader() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-7 w-20 animate-pulse rounded-xl bg-muted" />
    );
  }

  return user ? <UserMenu user={user} /> : <LoginButton />;
}
