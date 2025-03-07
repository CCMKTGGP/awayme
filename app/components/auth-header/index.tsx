import Link from "next/link";
import React from "react";

export default function AuthHeader({
  hasLinks = false,
}: {
  hasLinks?: boolean;
}) {
  return (
    <div className="w-full px-6 py-3 border border-b border-stroke/20 flex items-center">
      <Link href={"/"}>
        <img src="/logo.png" alt="Awayme Logo" className="h-12" />
      </Link>
      {hasLinks && (
        <div className="ml-auto flex items-center gap-8">
          <Link
            href={"https://awayme.cc/awayme-privacy-policy/"}
            target="_blank"
            className="text-heading font-medium text-md leading-md px-1"
          >
            Privacy Policy
          </Link>
          <Link
            href={"https://awayme.cc/awayme-terms-and-conditions/"}
            target="_blank"
            className="text-heading font-medium text-md leading-md px-1"
          >
            Terms & Conditions
          </Link>
          <Link
            href="/login"
            className="px-8 py-2 rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
}
