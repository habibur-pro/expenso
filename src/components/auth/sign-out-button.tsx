"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  const handleClick = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      Sign out
    </Button>
  );
}
