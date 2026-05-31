"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MentoradoPublico {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  description?: string | null;
  role?: "cliente" | "admin";
  product_name?: string | null;
}

interface MentoradoCardProps {
  mentorado: MentoradoPublico;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SocialLinks({
  linkedin_url,
  instagram_username,
  name,
}: {
  linkedin_url: string | null;
  instagram_username: string | null;
  name: string;
}) {
  if (!linkedin_url && !instagram_username) return null;
  return (
    <div className="flex items-center gap-2 pt-1 border-t border-border/50 w-full justify-center">
      {instagram_username && (
        <a
          href={`https://instagram.com/${instagram_username}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Instagram de ${name}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-[#E1306C] hover:bg-[#E1306C]/10 transition-colors"
        >
          <InstagramIcon className="size-4" />
        </a>
      )}
      {linkedin_url && (
        <a
          href={linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`LinkedIn de ${name}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
        >
          <LinkedInIcon className="size-4" />
        </a>
      )}
    </div>
  );
}

export function MentoradoCard({ mentorado }: MentoradoCardProps) {
  const [open, setOpen] = useState(false);
  const { name, photo_url, linkedin_url, instagram_username, description, role, product_name } = mentorado;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="solid-surface p-5 flex flex-col items-center gap-3 text-center shadow-sm w-full cursor-pointer hover:-translate-y-1 hover:[box-shadow:0_0_22px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative"
      >
        {product_name && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {product_name}
          </span>
        )}
        <Avatar className="size-20">
          {photo_url && <AvatarImage src={photo_url} alt={name} />}
          <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 min-h-[3rem] w-full">
          <div className="flex flex-col items-center gap-1">
            <p className="font-semibold text-sm leading-tight">{name}</p>
            {role === "admin" && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Equipe Atlaz
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-snug font-medium line-clamp-3 [overflow-wrap:anywhere]">
              {description}
            </p>
          )}
        </div>

        <SocialLinks
          linkedin_url={linkedin_url}
          instagram_username={instagram_username}
          name={name}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {product_name && (
            <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground z-10">
              {product_name}
            </span>
          )}
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="size-24">
                {photo_url && <AvatarImage src={photo_url} alt={name} />}
                <AvatarFallback className="text-2xl font-medium bg-primary/10 text-primary">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <DialogTitle className="text-base">{name}</DialogTitle>
              {role === "admin" && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Equipe Atlaz
                </span>
              )}
            </div>
          </DialogHeader>

          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed [overflow-wrap:anywhere]">
              {description}
            </p>
          )}

          <SocialLinks
            linkedin_url={linkedin_url}
            instagram_username={instagram_username}
            name={name}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
