import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar, CreditCard } from "lucide-react";

const stats = [
  { label: "Total Users", value: "15,234", icon: Users },
  { label: "Pending Verifications", value: "42", icon: Users },
  { label: "Active Job Posts", value: "318", icon: Briefcase },
  { label: "Upcoming Events", value: "12", icon: Calendar },
  { label: "Active Memberships", value: "4,820", icon: CreditCard },
];

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {profile?.full_name ?? "Admin"}.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
        Manage users, alumni verification, departments, batches, events, jobs, memberships,
        payments, and analytics from this dashboard.
      </div>
    </div>
  );
}
