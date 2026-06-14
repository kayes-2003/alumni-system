import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Statistics } from "@/components/landing/Statistics";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <About />
      <Statistics />
      <Testimonials />
      <CTA />
    </>
  );
}
