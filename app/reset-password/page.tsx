import { Suspense } from "react";
import ResetPassword from ".";

function SuspenseFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-8 w-8"></div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <ResetPassword />
    </Suspense>
  );
}
