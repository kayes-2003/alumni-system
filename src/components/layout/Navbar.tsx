import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap, Menu, X, Moon, Sun, LogOut,
  LayoutDashboard, MessageSquare, ChevronDown, User, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { name: "Alumni", path: "/alumni" },
  { name: "Events", path: "/events" },
  { name: "Careers", path: "/careers" },
  { name: "Mentorship", path: "/mentorship" },
  { name: "News", path: "/news" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    (supabase.from("notifications") as any)
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }: { count: number }) => setUnreadCount(count ?? 0));
  }, [user]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
      <div className="container flex h-16 items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:block">AlumniConnect</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
                isActive(link.path)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
          {user && (
            <Link
              to="/feed"
              className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive("/feed") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Feed
              {isActive("/feed") && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />}
            </Link>
          )}
        </nav>

        {/* Desktop Right */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              {/* Messages */}
              <Link to="/messages" className={`relative p-2 rounded-md transition-colors ${isActive("/messages") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <MessageSquare className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Dashboard */}
              <Link
                to={`/dashboard/${profile?.role ?? "student"}`}
                className={`p-2 rounded-md transition-colors ${location.pathname.startsWith("/dashboard") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? "?"} size="sm"
                    className="ring-2 ring-background shadow-sm" />
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border bg-card shadow-xl overflow-hidden z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b bg-muted/30">
                      <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to="/profile/edit" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                        <User className="h-4 w-4" />My Profile
                      </Link>
                      <Link to={`/dashboard/${profile?.role ?? "student"}`} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-4 w-4" />Dashboard
                      </Link>
                      <Link to="/messages" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                        <Bell className="h-4 w-4" />Notifications
                        {unreadCount > 0 && <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                      </Link>
                      <Link to="/membership" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                        <GraduationCap className="h-4 w-4" />Membership
                      </Link>
                      <div className="border-t my-1" />
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors">
                        <LogOut className="h-4 w-4" />Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
              <Link to="/register"><Button size="sm">Sign Up</Button></Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t bg-background/98 backdrop-blur-md">
          <div className="container py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path) ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                }`}>
                {isActive(link.path) && <span className="w-1 h-4 bg-primary rounded-full mr-2" />}
                {link.name}
              </Link>
            ))}
            {user && (
              <Link to="/feed" onClick={() => setIsOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive("/feed") ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                Feed
              </Link>
            )}
            <div className="border-t pt-3 mt-2 flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-muted transition-colors">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {user ? (
                <div className="flex-1 flex gap-2">
                  <Link to="/profile/edit" onClick={() => setIsOpen(false)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">My Profile</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-red-600">Sign Out</Button>
                </div>
              ) : (
                <div className="flex-1 flex gap-2">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1"><Button variant="ghost" size="sm" className="w-full">Log In</Button></Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1"><Button size="sm" className="w-full">Sign Up</Button></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}