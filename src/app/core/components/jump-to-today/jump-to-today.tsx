"use client";

import { cx } from "@/core/lib/cx";

import styles from "./jump-to-today.module.scss";

type JumpToTodayProps = {
  visible: boolean;
  onClick: () => void;
};

export function JumpToToday({ visible, onClick }: JumpToTodayProps) {
  return (
    <button
      type="button"
      className={cx(
        styles.jumpToToday,
        visible && styles["jumpToToday--visible"],
      )}
      onClick={onClick}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      Hoy
    </button>
  );
}
