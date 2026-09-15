"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/core/actions/auth";
import { cx } from "@/core/lib/cx";

import styles from "./user-menu.module.scss";

type UserMenuProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

type OverlayPhase = "closed" | "opening" | "open" | "closing";

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
  const [phase, setPhase] = useState<OverlayPhase>("closed");
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(user?.name, user?.email);

  const isMounted = phase !== "closed";
  const isOpen = phase === "open";
  const isExpanded = phase === "opening" || phase === "open";

  function openMenu() {
    setPhase((current) =>
      current === "closed" || current === "closing" ? "opening" : current,
    );
  }

  function closeMenu() {
    setPhase((current) =>
      current === "open" || current === "opening" ? "closing" : current,
    );
  }

  function toggleMenu() {
    if (isExpanded) closeMenu();
    else openMenu();
  }

  useEffect(() => {
    if (phase !== "opening") return;
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  useEffect(() => {
    if (!isExpanded) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExpanded]);

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
        aria-expanded={isExpanded}
        aria-haspopup="menu"
        onClick={toggleMenu}
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

      {isMounted && (
        <div
          role="menu"
          className={cx(
            styles.userMenu__dropdown,
            isOpen && styles["userMenu__dropdown--open"],
          )}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            if (phase === "closing") setPhase("closed");
          }}
        >
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
