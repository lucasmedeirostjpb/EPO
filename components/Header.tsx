"use client";

import React from "react";
import { ChevronRight, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Folder } from "@/lib/types";

interface HeaderProps {
  breadcrumbs: Folder[];
  flowTitle: string | null;
}

export default function Header({ breadcrumbs, flowTitle }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 text-slate-300 shrink-0">
      <div className="flex items-center gap-6">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent italic">
          EPO
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <nav className="flex items-center text-sm font-medium text-slate-400">
          <span>Início</span>
          {breadcrumbs.map((folder) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 mx-1.5 text-slate-600" />
              <span>{folder.name}</span>
            </React.Fragment>
          ))}
          {flowTitle && (
            <>
              <ChevronRight className="w-4 h-4 mx-1.5 text-slate-600" />
              <span className="text-slate-200 font-semibold tracking-tight">{flowTitle}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center">
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white border border-white/10 shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-slate-300 leading-none mb-0.5 max-w-[120px] truncate">
                  {user.email}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin</span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
