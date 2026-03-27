import { redirect } from "next/navigation";

// Signup is not available yet — redirect to waitlist
export default function SignupPage() {
  redirect("/reserve");
}
