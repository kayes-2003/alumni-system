import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to reconnect?</h2>
          <p className="mb-8 max-w-xl mx-auto opacity-90">
            Create your free account today and start exploring the alumni directory, events,
            mentorship programs, and exclusive job opportunities.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
