// Initial creation: Shared layout for all authenticated routes - applies auth guard + app shell (nav) once.
import RequireAuth from "@/components/nav/RequireAuth";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
