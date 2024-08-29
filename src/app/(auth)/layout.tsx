import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

// This is a layout component that will redirect the user to the home page if they are already logged in.
// convienece function to check if the user is logged in
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();
  console.log("user", user);
  if (user) redirect("/");

  return <>{children}</>;
}
