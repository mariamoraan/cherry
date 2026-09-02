import { auth } from "@/auth";
import { UserMenu } from "@/core/components/user-menu";
import { redirect } from "next/navigation";

import styles from "./page.module.scss";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <UserMenu user={session.user} />
      </header>

      <main className={styles.main}>
        <p className={styles.welcome}>Welcome to the dashboard</p>
      </main>
    </div>
  );
}
