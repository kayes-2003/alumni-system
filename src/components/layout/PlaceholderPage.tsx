import { motion } from "framer-motion";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="container py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-2xl mx-auto"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="mt-10 rounded-xl border bg-card p-10 text-sm text-muted-foreground">
          This section is under construction. Functionality for {title.toLowerCase()} will be
          built out in the next development phase.
        </div>
      </motion.div>
    </div>
  );
}
