import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Briefcase, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-primary bg-primary/10 mb-6">
              Welcome to the Alumni Network
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Stay Connected. <br />
              <span className="text-primary">Grow Together.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Join thousands of alumni and students building lifelong connections, finding career
              opportunities, mentorship, and reuniting at exclusive events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Join the Network <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/alumni">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Browse Alumni Directory
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-bold text-lg">15K+</p>
                  <p className="text-xs text-muted-foreground">Alumni</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2"><Briefcase className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-bold text-lg">1.2K+</p>
                  <p className="text-xs text-muted-foreground">Job Posts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2"><Calendar className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-bold text-lg">300+</p>
                  <p className="text-xs text-muted-foreground">Events/yr</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl border bg-card shadow-2xl p-6 lg:p-10">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl bg-muted aspect-square flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl border bg-card shadow-lg p-4 hidden sm:block">
              <p className="text-sm font-semibold">🎓 Class of 2024</p>
              <p className="text-xs text-muted-foreground">450 new alumni joined</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
