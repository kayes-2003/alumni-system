import { Link } from "react-router-dom";
import { GraduationCap, Mail, MapPin, Phone, Link as LinkIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>AlumniConnect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting generations of graduates, fostering mentorship, careers, and lifelong community.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><LinkIcon className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><LinkIcon className="h-5 w-5" /></a>
              <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><LinkIcon className="h-5 w-5" /></a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><LinkIcon className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/alumni" className="hover:text-primary">Alumni Directory</Link></li>
              <li><Link to="/events" className="hover:text-primary">Events</Link></li>
              <li><Link to="/careers" className="hover:text-primary">Career Portal</Link></li>
              <li><Link to="/news" className="hover:text-primary">News &amp; Blog</Link></li>
              <li><Link to="/mentorship" className="hover:text-primary">Mentorship</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Membership</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/membership" className="hover:text-primary">Plans &amp; Pricing</Link></li>
              <li><Link to="/register" className="hover:text-primary">Join Now</Link></li>
              <li><Link to="/login" className="hover:text-primary">Member Login</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> 123 University Ave, City, Country</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> alumni@university.edu</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +1 (555) 123-4567</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AlumniConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}