import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/server-utils";

type NavbarProps = React.ComponentPropsWithoutRef<"nav">;

export default async function Navbar({ className, ...props }: NavbarProps) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
        Home
      </Link>

      {user && (
        <>
          <Link href="/species" className="text-sm font-medium transition-colors hover:text-primary">
            Species
          </Link>
          <Link href="/species-speed" className="text-sm font-medium transition-colors hover:text-primary">
            Species Speed
          </Link>
          <Link href="/species-chatbot" className="text-sm font-medium transition-colors hover:text-primary">
            Species Chatbot
          </Link>
        </>
      )}
    </nav>
  );
}
