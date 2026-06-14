import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        You don&apos;t have permission to view this page. Contact an administrator if you
        believe this is a mistake.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
