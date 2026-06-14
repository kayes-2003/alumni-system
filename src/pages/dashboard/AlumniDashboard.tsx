import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, MessageSquare } from "lucide-react";

const cards = [
  { label: "My Connections", value: "128", icon: Users },
  { label: "Mentorship Requests", value: "5", icon: MessageSquare },
  { label: "Jobs Posted", value: "3", icon: Briefcase },
  { label: "Events Registered", value: "2", icon: Calendar },
];

export default function AlumniDashboard() {
  const { profile } = useAuth();

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-1">Alumni Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {profile?.full_name ?? "Alumni"}.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
        Manage your profile, post job opportunities, accept mentorship requests, and engage with
        the community feed.
      </div>
    </div>
  );
}
