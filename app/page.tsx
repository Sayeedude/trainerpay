import { redirect } from "next/navigation";

// Middleware handles the signed-out case; this only needs to send a signed-in
// visitor from "/" somewhere useful.
export default function RootPage() {
  redirect("/dashboard");
}
