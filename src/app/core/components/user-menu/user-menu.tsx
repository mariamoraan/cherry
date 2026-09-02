"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/core/actions/auth";

import styles from "./user-menu.module.scss";

type UserMenuProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email[0]?.toUpperCase() ?? "?";
  }

  return "?";
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(user?.name, user?.email);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className={styles.userMenu__login}>
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div ref={menuRef} className={styles.userMenu}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className={styles.userMenu__avatar}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? user.email ?? "Avatar"}
            className={styles.userMenu__image}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </button>

      {open && (
        <div role="menu" className={styles.userMenu__dropdown}>
          <div className={styles.userMenu__meta}>
            {user.name && <p className={styles.userMenu__name}>{user.name}</p>}
            {user.email && (
              <p className={styles.userMenu__email}>{user.email}</p>
            )}
          </div>
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className={styles.userMenu__logout}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
