import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Class of 2018, Software Engineer at Google",
    quote:
      "AlumniConnect helped me find a mentor who guided my career transition into tech. The community here is incredibly supportive.",
  },
  {
    name: "Michael Chen",
    role: "Class of 2015, Founder & CEO",
    quote:
      "I hired three of my current team members through the career portal. It's become my go-to platform for recruiting talented graduates.",
  },
  {
    name: "Priya Patel",
    role: "Class of 2021, Product Manager",
    quote:
      "The events and reunions organized through the platform let me reconnect with old friends and build new professional relationships.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Our Alumni Say</h2>
          <p className="text-muted-foreground">
            Hear from members of our community about how AlumniConnect made an impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-sm text-muted-foreground mb-6">{t.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
