import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail } from "lucide-react";
import api from "@/lib/axios";

const fetchCategories = async () => {
  const { data } = await api.get("/categories");
  return data;
};

export const Footer = () => {
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["footerCategories"],
    queryFn: fetchCategories,
  });

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">ʀ2ꜱ</span>
              </div>
              <span className="text-xl font-bold">Raise-to-Slove</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted platform for finding reliable local service providers.
              Quality services at your doorstep.
              dev by <a href="https://github.com/">@hariharan</a>
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <MapPin className="w-4 h-4" />
              <span>Tamil Nadu, India</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2">
              {isLoading && <li>Loading services...</li>}
              {isError && <li>Error loading services.</li>}
              {categories &&
                categories.slice(0, 5).map((category) => (
                  <li key={category._id}>
                    <Link
                      to={`/category/${category.slug}`}
                      className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/auth/register"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Register as Customer
                </Link>
              </li>
              <li>
                <Link
                  to="/auth/vendor-register"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Register Your Shop
                </Link>
              </li>
              <li>
                <Link
                  to="/auth/login"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Login
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Phone className="w-4 h-4" />
                <span>+91 98765 00000</span>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@serviconnect.in</span>
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-primary-foreground/50 text-xs">
                © 2024 ServiConnect. All rights reserved.
              </p>
              <p className="text-primary-foreground/40 text-xs mt-1">
                A college project demonstrating modern web development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
