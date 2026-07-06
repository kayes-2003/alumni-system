import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Loader2, CreditCard, Star, Calendar, Shield, Zap, Users, MessageSquare, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const PLANS = [
  {
    id: "monthly", name: "Monthly", price: "$9", period: "/month",
    priceNum: 9, color: "border-border", highlight: false,
    badge: null,
    features: [
      "Full alumni directory access",
      "Community feed & messaging",
      "Event registration",
      "Job portal access",
      "Basic profile features",
      "News & announcements",
    ],
  },
  {
    id: "yearly", name: "Yearly", price: "$79", period: "/year",
    priceNum: 79, color: "border-primary", highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Monthly",
      "Priority mentorship matching",
      "Exclusive webinars & events",
      "Resume visibility boost",
      "Advanced analytics",
      "Save 27% vs monthly",
    ],
  },
  {
    id: "lifetime", name: "Lifetime", price: "$249", period: "one-time",
    priceNum: 249, color: "border-yellow-500", highlight: false,
    badge: "Best Value",
    features: [
      "Everything in Yearly",
      "Lifetime access — no renewals",
      "VIP event priority",
      "Advisory board eligibility",
      "Founding member badge",
      "Name in alumni honour roll",
    ],
  },
];

interface Membership { id: string; plan: string; status: string; started_at: string; expires_at: string | null; }
interface Payment { id: string; amount: number; currency: string; status: string; created_at: string; }

export default function MembershipPage() {
  const { user } = useAuth();
  const { toasts, toast, dismiss } = useToast();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [m, p] = await Promise.all([
      (supabase.from("memberships") as any).select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      (supabase.from("payments") as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setMembership(m.data ?? null);
    setPayments(p.data ?? []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const subscribe = async (plan: typeof PLANS[0]) => {
    if (!user) { toast("Please log in first", "error"); return; }
    if (membership) { toast("You already have an active membership", "info"); return; }
    setSubscribing(plan.id);
    const expires = plan.id === "lifetime" ? null
      : plan.id === "yearly"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: mem, error } = await (supabase.from("memberships") as any).insert({
      user_id: user.id, plan: plan.id, status: "active",
      started_at: new Date().toISOString(), expires_at: expires,
    }).select().single();

    if (!error && mem) {
      await (supabase.from("payments") as any).insert({
        user_id: user.id, membership_id: mem.id,
        amount: plan.priceNum, currency: "usd", status: "succeeded",
      });
      toast(`🎉 ${plan.name} membership activated!`, "success");
    } else {
      toast(error?.message ?? "Something went wrong", "error");
    }
    setSubscribing(null);
    fetchData();
  };

  const cancelMembership = async () => {
    if (!membership || !confirm("Cancel your membership? You'll keep access until the period ends.")) return;
    await (supabase.from("memberships") as any).update({ status: "cancelled" }).eq("id", membership.id);
    toast("Membership cancelled. Access continues until expiry.", "info");
    fetchData();
  };

  const PLAN_BADGE: Record<string, string> = { monthly: "secondary", yearly: "default", lifetime: "warning" };

  return (
    <div className="min-h-screen bg-muted/20">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {/* Hero */}
      <div className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-16 text-center max-w-2xl mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Alumni Membership</h1>
          <p className="text-muted-foreground text-lg">
            Unlock the full power of the alumni network — mentorship, exclusive events, career tools, and a lifetime of connections.
          </p>
          {!user && (
            <div className="mt-6 flex gap-3 justify-center">
              <Link to="/register"><Button size="lg">Create Account</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Log In</Button></Link>
            </div>
          )}
        </div>
      </div>

      <div className="container py-12 space-y-16">
        {/* Active membership banner */}
        {membership && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Crown className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg capitalize">{membership.plan} Member</p>
                      <Badge variant={(PLAN_BADGE[membership.plan] ?? "outline") as any} className="capitalize">{membership.plan}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Active since {new Date(membership.started_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {membership.expires_at
                        ? ` · Renews ${new Date(membership.expires_at).toLocaleDateString()}`
                        : " · Lifetime access — never expires"}
                    </p>
                  </div>
                </div>
                {membership.plan !== "lifetime" && (
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={cancelMembership}>
                    Cancel Membership
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-10">
            {membership ? "Your Membership Plan" : "Choose Your Plan"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, idx) => {
              const isActive = membership?.plan === plan.id && membership.status === "active";
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className={`relative h-full flex flex-col border-2 transition-all duration-200 ${plan.color} ${plan.highlight ? "shadow-xl shadow-primary/10 scale-[1.02]" : "hover:shadow-md"}`}>
                    {plan.badge && (
                      <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1.5 ${plan.highlight ? "bg-primary text-primary-foreground" : "bg-yellow-500 text-white"}`}>
                        <Star className="h-3 w-3" />{plan.badge}
                      </div>
                    )}
                    <CardHeader className="pb-4 pt-8">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-5">
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2.5 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      {isActive ? (
                        <Button disabled className="w-full" variant="outline">
                          <Check className="h-4 w-4 mr-2" />Current Plan
                        </Button>
                      ) : membership ? (
                        <Button disabled className="w-full" variant="outline">Already Subscribed</Button>
                      ) : (
                        <Button className="w-full" variant={plan.highlight ? "default" : "outline"}
                          onClick={() => subscribe(plan)} disabled={!!subscribing}>
                          {subscribing === plan.id
                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            : <CreditCard className="h-4 w-4 mr-2" />}
                          Get {plan.name}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            🔒 Secure payment · Cancel anytime · 30-day money-back guarantee
          </p>
        </div>

        {/* Benefits grid */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">Everything included with all plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Alumni directory access", desc: "Search 15,000+ members" },
              { icon: MessageSquare, label: "Direct messaging", desc: "Connect privately" },
              { icon: Calendar, label: "Event registration", desc: "QR check-in included" },
              { icon: Briefcase, label: "Job board access", desc: "200+ active listings" },
              { icon: Shield, label: "Verified community", desc: "Admin-verified profiles" },
              { icon: Zap, label: "Mentorship program", desc: "1-on-1 guidance" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment history */}
        {user && payments.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />Payment History
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold">${p.amount} {p.currency.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <Badge variant={p.status === "succeeded" ? "success" : "secondary"} className="capitalize">
                        {p.status === "succeeded" ? "✓ Paid" : p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}