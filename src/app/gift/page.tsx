import { redirect } from "next/navigation";

export default function GiftPage() {
  redirect("/reserve?gift=true");
}
