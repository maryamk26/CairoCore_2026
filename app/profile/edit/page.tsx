"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

type FormState = {
  firstName: string;
  lastName: string;
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function stripAt(s: string) {
  return s.startsWith("@") ? s.slice(1) : s;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [initial, setInitial] = useState<FormState>(emptyForm);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }

    let cancelled = false;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const name = data.name || "";
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";
        const defaultUsername = (user.email || "").split("@")[0] || "";
        const state: FormState = {
          firstName,
          lastName,
          username: stripAt(data.username || "") || defaultUsername,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        };
        setInitial(state);
        setForm(state);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const handleReset = () => {
    setForm(initial);
    setShowPasswordFields(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const name = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      const username = form.username.trim();
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          username: username || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      if (form.newPassword || form.confirmPassword) {
        if (!form.currentPassword) throw new Error("Enter your current password to change it");
        if (form.newPassword !== form.confirmPassword)
          throw new Error("New passwords do not match");
        if (form.newPassword.length < 6)
          throw new Error("New password must be at least 6 characters");

        const pwRes = await fetch("/api/profile/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          }),
        });
        if (!pwRes.ok) {
          const data = await pwRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update password");
        }
      }

      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse text-[#5d4e37]/70">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse text-[#5d4e37]/70">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-[#5d4e37] hover:text-[#8b6f47] text-sm mb-8"
        >
          ← Back to profile
        </Link>

        <h1 className="text-2xl font-bold text-[#5d4e37] mb-1 font-cinzel">Edit profile</h1>
        <p className="text-[#5d4e37]/80 text-sm mb-8">
          Keep your personal details private. Information you add here is visible to anyone who can
          view your profile.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

          <div className="flex flex-col gap-1">
            <label htmlFor="firstName" className="text-sm font-medium text-[#5d4e37]">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-[#5d4e37]/30 rounded-lg text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="lastName" className="text-sm font-medium text-[#5d4e37]">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-[#5d4e37]/30 rounded-lg text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium text-[#5d4e37]">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value.replace(/^@/, "") }))
              }
              placeholder={(user?.email || "").split("@")[0] || "Username"}
              className="w-full px-3 py-2 border border-[#5d4e37]/30 rounded-lg text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
            />
          </div>

          <div className="border-t border-[#5d4e37]/20 pt-6 space-y-4">
            {!showPasswordFields ? (
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="px-4 py-2 rounded-lg bg-[#5d4e37]/10 text-[#5d4e37] hover:bg-[#5d4e37]/20 text-sm font-medium"
              >
                Change password
              </button>
            ) : (
              <>
                <p className="text-xs text-[#5d4e37]/70">
                  After changing your password, we will send an email to your account address to
                  confirm the change.
                </p>
                <div className="flex flex-col gap-1">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-[#5d4e37]">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-[#5d4e37]/30 rounded-lg text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="newPassword" className="text-sm font-medium text-[#5d4e37]">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-[#5d4e37]/30 rounded-lg text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-[#5d4e37]">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-[#5d4e37]/30 rounded-lg text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 pt-8">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg bg-[#5d4e37]/10 text-[#5d4e37] hover:bg-[#5d4e37]/20 font-medium"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[#8b6f47] text-white hover:bg-[#5d4e37] font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
