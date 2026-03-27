import { redirect } from "next/navigation";

export default function MockupPage() {
  redirect("/login");
}
