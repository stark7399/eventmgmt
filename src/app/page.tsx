// Initial creation: Root route - redirects to /dashboard (auth guard there sends to /login if needed).
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
