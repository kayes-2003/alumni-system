import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: string;
  href?: string;
  sub?: string;
}

export function StatCard({ icon: Icon, label, value, color = "text-primary", href, sub }: StatCardProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold group-hover:text-primary transition-colors">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}