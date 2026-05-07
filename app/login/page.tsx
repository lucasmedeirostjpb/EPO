"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-bold uppercase text-[10px] tracking-widest text-black">
        Carregando...
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-20 p-4">
      <div className="mb-8 flex flex-col items-center">
        <img src="/logo-epo.png" alt="EPO Logo" className="h-64 w-auto object-contain" />
      </div>
      
      <div className="w-full max-w-sm border border-black p-8 bg-white">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-tight text-black">Acesso Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border border-red-600 text-sm text-red-600 bg-red-50">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-bold uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-black text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-bold uppercase">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-black text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white text-sm font-bold uppercase hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {loading ? "Carregando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-gray-500 uppercase tracking-widest">
          Acesso Restrito
        </p>
      </div>
    </div>
  );
}
