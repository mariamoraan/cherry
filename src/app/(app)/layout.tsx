import { MigrateOnLogin } from "@/core/components/migrate-on-login/migrate-on-login";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <MigrateOnLogin />
    </>
  );
}
