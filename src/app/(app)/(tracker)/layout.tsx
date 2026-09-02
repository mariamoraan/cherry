import { TrackerProvider } from "@/core/components/tracker/tracker-provider";

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrackerProvider>{children}</TrackerProvider>;
}
