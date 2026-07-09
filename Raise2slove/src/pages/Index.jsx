import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/search/SearchBar";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  Star,
  Users,
  Store,
  Sparkles,
} from "lucide-react";

const fetchCategories = async () => {
  const { data } = await api.get("/categories");
  return data;
};

const fetchVendors = async () => {
  const { data } = await api.get("/vendors"); // Assuming this endpoint exists and returns a list of vendors
  return data;
};

const Index = () => {
  const { user, logout } = useAuth();

  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const {
    data: vendors,
    isLoading: isLoadingVendors,
    isError: isErrorVendors,
  } = useQuery({
    queryKey: ["homepageVendors"],
    queryFn: fetchVendors,
  });

  const stats = [
    { value: "500+", label: "Service Providers", icon: Store },
    { value: "10K+", label: "Happy Customers", icon: Users },
    { value: "20+", label: "Service Categories", icon: Sparkles },
    { value: "4.8", label: "Average Rating", icon: Star },
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description:
        "All service providers are verified and background-checked for your safety.",
    },
    {
      icon: Clock,
      title: "Quick Response",
      description:
        "Get connected with available vendors within minutes of your request.",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description:
        "Read reviews and ratings to choose the best service provider.",
    },
    {
      icon: CheckCircle2,
      title: "Transparent Pricing",
      description:
        "Know the price range upfront. No hidden charges or surprises.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1">
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
            <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Your Trusted Local Service Partner
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-slide-up">
                Find Reliable{" "}
                <span className="text-gradient">Local Services</span>
                <br />
                at Your Doorstep
              </h1>

              <p
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up"
                style={{ animationDelay: "100ms" }}
              >
                Connect with verified professionals for home repairs, appliance
                services, vehicle care, and more. Quality service, guaranteed.
              </p>

              <div
                className="animate-slide-up"
                style={{ animationDelay: "200ms" }}
              >
                <SearchBar />
              </div>

              <div
                className="flex flex-wrap justify-center gap-4 mt-8 animate-slide-up"
                style={{ animationDelay: "300ms" }}
              >
                <Button asChild variant="soft" size="lg">
                  <Link to="/categories">
                    Browse All Services
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                {!user && (
                  <Button asChild variant="outline" size="lg">
                    <Link to="/auth/vendor-register">
                      <Store className="w-4 h-4 mr-2" />
                      Register Your Shop
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-light flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Explore Our Services
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                From home repairs to vehicle services, find the right
                professional for every need.
              </p>
            </div>

            {isLoadingCategories && <p>Loading categories...</p>}
            {isErrorCategories && <p>Error fetching categories.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {categories && categories.map((category, index) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  index={index}
                />
              ))}
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="default" size="lg">
                <Link to="/categories">
                  View All Categories
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose ServiConnect?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We make finding and booking local services simple, safe, and
                reliable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="bg-card rounded-2xl p-6 border border-border card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Top-Rated Service Providers
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Trusted professionals with excellent reviews from our
                community.
              </p>
            </div>

            {isLoadingVendors && <p>Loading vendors...</p>}
            {isErrorVendors && <p>Error fetching vendors.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors &&
                vendors
                  .filter((v) => v.rating >= 4.7) // Assuming vendors have a rating field
                  .slice(0, 6)
                  .map((vendor, index) => (
                    <Link
                      key={vendor._id}
                      to={`/vendor/${vendor._id}`} // Using _id for vendor links
                      className="bg-card rounded-2xl p-5 border border-border card-hover animate-fade-in block"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                          <Store className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {vendor.companyName || vendor.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            <span className="text-sm font-medium">
                              {vendor.rating || "N/A"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({vendor.reviewCount || 0})
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {vendor.location}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Are You a Service Provider?
            </h2>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
              Join ServiConnect and grow your business. Reach thousands of
              customers looking for your services.
            </p>
            <Button asChild variant="secondary" size="xl">
              <Link to="/auth/vendor-register">
                <Store className="w-5 h-5 mr-2" />
                Register Your Shop Today
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
