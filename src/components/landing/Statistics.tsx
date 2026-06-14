import { motion } from "framer-motion";

const stats = [
  { value: "15,000+", label: "Active Alumni" },
  { value: "120+", label: "Countries Represented" },
  { value: "3,500+", label: "Mentorship Sessions" },
  { value: "1,200+", label: "Jobs Posted" },
];

export function Statistics() {
  return (
    <section className="bg-primary py-16">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-primary-foreground">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <p className="text-3xl sm:text-4xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
