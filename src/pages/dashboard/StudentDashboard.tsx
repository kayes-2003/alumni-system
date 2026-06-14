import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, GraduationCap } from "lucide-react";

const cards = [
  { label: "Mentors Connected", value: "2", icon: GraduationCap },
  { label: "Job Applications", value: "7", icon: Briefcase },
  { label: "Events Registered", value: "4", icon: Calendar },
  { label: "Network Size", value: "34", icon: Users },
];

export default function StudentDashboard() {
  const { profile } = useAuth();

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-1">Student Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {profile?.full_name ?? "Student"}.</p>

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
        Browse the alumni directory, request mentorship sessions, and apply to internships and
        jobs posted by alumni.
      </div>
    </div>
  );
}
