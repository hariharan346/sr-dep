import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Store, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext"; // ✅ ADD THIS

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth(); // ✅ FIX
  const isAuthPage = location.pathname.includes("/auth");

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">ʀ2ꜱ</span>
            </div>
            <span className="text-xl font-bold">
              Raise<span className="text-gradient">-to-Slove</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="font-medium">Home</Link>
            <Link to="/categories" className="font-medium">Services</Link>

            {!isAuthPage && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                          {user.role === "vendor" ? (
                            <Store className="w-4 h-4 text-primary" />
                          ) : user.role === "admin" ? (
                            <User className="w-4 h-4 text-primary" />
                          ) : (
                            <User className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span>{user.name}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          to={
                            user.role === "vendor"
                              ? "/vendor/dashboard"
                              : user.role === "admin"
                                ? "/admin/dashboard"
                                : "/customer/dashboard"
                          }
                        >
                          Dashboard
                        </Link>
                      </DropdownMenuItem>

                      {user.role === "admin" && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/users">Users</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/vendors">Vendors</Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/auth/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth/register">Register</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="absolute top-16 left-0 w-full h-screen bg-background/95 backdrop-blur-lg md:hidden flex flex-col items-center justify-center gap-8">
              <Link to="/" className="text-2xl font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/categories" className="text-2xl font-medium" onClick={() => setIsMenuOpen(false)}>Services</Link>
              {!isAuthPage && (
                <>
                  {user ? (
                    <>
                      <Link to={user.role === "vendor" ? "/vendor/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/customer/dashboard"} className="text-2xl font-medium" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                      {user.role === "admin" && (
                        <>
                          <Link to="/admin/users" className="text-2xl font-medium" onClick={() => setIsMenuOpen(false)}>Users</Link>
                          <Link to="/admin/vendors" className="text-2xl font-medium" onClick={() => setIsMenuOpen(false)}>Vendors</Link>
                        </>
                      )}
                      <Button variant="destructive" size="lg" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Logout</Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-8">
                      <Button variant="ghost" size="lg" asChild>
                        <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                      </Button>
                      <Button size="lg" asChild>
                        <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>Register</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
