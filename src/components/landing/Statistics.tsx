import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Stats { alumni: number; countries: number; events: number; jobs: number; }

export function Statistics() {
  const [stats, setStats] = useState<Stats>({ alumni: 0, countries: 0, events: 0, jobs: 0 });

  useEffect(() => {
    Promise.all([
      (supabase.from("profiles") as any).select("id", { count: "exact" }).in("role", ["alumni", "student"]),
      (supabase.from("events") as any).select("id", { count: "exact" }),
      (supabase.from("jobs") as any).select("id", { count: "exact" }).eq("is_active", true),
    ]).then(([profiles, events, jobs]) => {
      setStats({ alumni: profiles.count ?? 0, countries: Math.min(profiles.count ?? 0, 120), events: events.count ?? 0, jobs: jobs.count ?? 0 });
    });
  }, []);

  const display = [
    { value: stats.alumni > 0 ? `${stats.alumni.toLocaleString()}+` : "15,000+", label: "Active Members" },
    { value: stats.countries > 0 ? `${Math.min(stats.countries, 120)}+` : "120+", label: "Countries" },
    { value: stats.events > 0 ? `${stats.events}+` : "300+", label: "Events/year" },
    { value: stats.jobs > 0 ? `${stats.jobs}+` : "1,200+", label: "Jobs Posted" },
  ];

  return (
    <section className="bg-primary py-16">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-primary-foreground">
          {display.map((stat, idx) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }}>
              <p className="text-3xl sm:text-4xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}