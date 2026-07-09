"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_LOGO,
  clearStoredLogo,
  getStoredLogo,
  setStoredLogo,
} from "@/lib/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load any previously chosen picture once we're on the client.
  useEffect(() => {
    setLogoSrc(getStoredLogo());
  }, []);

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image is too large — please pick one under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setLogoSrc(dataUrl);
      setStoredLogo(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function resetImage() {
    clearStoredLogo();
    setLogoSrc(DEFAULT_LOGO);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const isCustom = logoSrc !== DEFAULT_LOGO;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {/* Click the picture to change it */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative mx-auto mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary"
            aria-label="Change login picture"
            title="Click to change picture"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Logo"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePickImage}
          />

          <div className="mb-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="underline-offset-2 hover:underline"
            >
              Change picture
            </button>
            {isCustom && (
              <>
                <span aria-hidden>·</span>
                <button
                  type="button"
                  onClick={resetImage}
                  className="underline-offset-2 hover:underline"
                >
                  Reset
                </button>
              </>
            )}
          </div>

          <CardTitle className="text-xl">PRU Consultant Dashboard</CardTitle>
          <CardDescription>Sign in to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
