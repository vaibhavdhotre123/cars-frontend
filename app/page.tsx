import { redirect } from "next/navigation";

export default function Home() {
  // The app entry point sends visitors to the sign-in page.
  redirect("/login");
}
