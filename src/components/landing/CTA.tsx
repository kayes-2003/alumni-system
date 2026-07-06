import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function CTA() {
  const { user, profile } = useAuth();
  return (
    <section className="py-20">
      <div className="container">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 px-8 py-16 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1),_transparent)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to reconnect?</h2>
            <p className="mb-8 max-w-xl mx-auto opacity-90">
              Join thousands of alumni building lifelong connections, advancing careers, and making a difference through mentorship.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {user ? (
                <>
                  <Link to={`/dashboard/${profile?.role ?? "student"}`}>
                    <Button size="lg" variant="secondary">
                      <GraduationCap className="mr-2 h-4 w-4" />Go to Dashboard
                    </Button>
                  </Link>
                  <Link to="/alumni">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <Users className="mr-2 h-4 w-4" />Browse Directory
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="secondary">
                      Create Your Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/alumni">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <Briefcase className="mr-2 h-4 w-4" />Browse Directory
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}