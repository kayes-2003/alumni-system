import { motion } from "framer-motion";
import { Network, ShieldCheck, Sparkles, GraduationCap, Briefcase, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Network, title: "Build Your Network", description: "Reconnect with classmates, expand professional connections, and find opportunities across industries worldwide.", href: "/alumni" },
  { icon: ShieldCheck, title: "Verified Community", description: "Every alumni profile is admin-verified, ensuring a trusted and secure professional environment.", href: "/alumni" },
  { icon: Sparkles, title: "Exclusive Benefits", description: "Access mentorship, premium job postings, VIP events, and member-only resources and content.", href: "/membership" },
  { icon: GraduationCap, title: "Mentorship Program", description: "Students connect with experienced alumni mentors for guidance, career advice, and industry insights.", href: "/mentorship" },
  { icon: Briefcase, title: "Career Portal", description: "Alumni post jobs and internships. Students apply directly and grow their careers with insider opportunities.", href: "/careers" },
  { icon: MessageSquare, title: "Community Feed", description: "Share updates, achievements, and discussions. Stay connected with your batch and department peers.", href: "/feed" },
];

export function About() {
  return (
    <section className="py-20" id="about">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Join AlumniConnect?</h2>
          <p className="text-muted-foreground">A modern platform built to keep our community connected long after graduation — with tools for networking, career growth, and giving back.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.08 }}>
              <Link to={f.href}
                className="block rounded-xl border bg-card p-6 text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all group h-full">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}