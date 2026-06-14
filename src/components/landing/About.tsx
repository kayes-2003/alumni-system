import { motion } from "framer-motion";
import { Network, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: Network,
    title: "Build Your Network",
    description: "Reconnect with classmates, expand professional networks, and find opportunities across industries.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Community",
    description: "Every alumni profile is verified by our admin team, ensuring a trusted and secure community.",
  },
  {
    icon: Sparkles,
    title: "Exclusive Benefits",
    description: "Access mentorship programs, exclusive job postings, events, and member-only resources.",
  },
];

export function About() {
  return (
    <section className="py-20" id="about">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Join AlumniConnect?</h2>
          <p className="text-muted-foreground">
            A modern platform built to keep our community connected long after graduation —
            with tools for networking, career growth, and giving back.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="rounded-xl border bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
