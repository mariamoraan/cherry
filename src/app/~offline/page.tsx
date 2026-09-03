import type { Metadata } from "next";
import Link from "next/link";

import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <p className={styles.brand}>Cherry</p>
      <h1 className={styles.title}>Sin conexión</h1>
      <p className={styles.copy}>
        No hay red ahora mismo. Cuando vuelvas a estar online, recarga para
        seguir con tu ciclo.
      </p>
      <Link className={styles.link} href="/dashboard">
        Reintentar
      </Link>
    </main>
  );
}
