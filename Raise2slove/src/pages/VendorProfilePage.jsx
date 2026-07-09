import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Store,
  Star,
} from "lucide-react";
import api from "@/lib/axios";

const fetchVendorById = async (vendorId) => {
  const { data } = await api.get(`/vendors/${vendorId}`);
  return data;
};

const VendorProfilePage = () => {
  const { vendorId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceSlug = searchParams.get("service"); // Now it's a slug
  const { user, logout } = useAuth();

  const {
    data: vendor,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: () => fetchVendorById(vendorId),
  });
  // const service = serviceId ? getServiceById(serviceId) : null; // Removed

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Vendor Not Found
            </h1>
            <Link to="/categories" className="text-primary hover:underline">
              Browse services
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1">
        {/* Header */}
        <section className="py-10 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <Link
              to={serviceSlug ? `/service/${serviceSlug}` : "/categories"}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              {serviceSlug ? `Back to Service` : "Browse Services"}
            </Link>

            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-md">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Vendor Avatar */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Store className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                </div>

                {/* Vendor Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                          {vendor.companyName}
                        </h1>
                        {vendor.isAvailable ? (
                          <Badge
                            variant="default"
                            className="bg-success text-success-foreground"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      {/* Rating Display */}
                      {vendor.ratingAverage > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center text-yellow-500">
                            <Star className="w-5 h-5 fill-current" />
                            <span className="font-bold text-lg ml-1">{vendor.ratingAverage.toFixed(1)}</span>
                          </div>
                          <span className="text-muted-foreground text-sm">
                            ({vendor.reviewCount || vendor.totalJobs} {vendor.reviewCount === 1 ? 'Review' : 'Reviews'})
                          </span>
                        </div>
                      )}
                      <p className="text-muted-foreground mt-2 max-w-2xl">
                        {vendor.user.name}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {vendor.isAvailable && (
                        <Button asChild variant="hero" size="lg">
                          <Link
                            to={`/request/vendor/${vendor._id}${serviceSlug ? `?service=${serviceSlug}` : ""
                              }`}
                          >
                            Request Service
                          </Link>
                        </Button>
                      )}
                      <a
                        href={`tel:${vendor.phone}`}
                        className="flex items-center justify-center gap-2 py-2 text-primary hover:text-primary-glow transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {vendor.phone}
                      </a>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 mt-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{vendor.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Services & Reviews */}
              <div className="lg:col-span-2 space-y-8">
                {/* Services Offered */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Services Offered
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vendor.services.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Quick Contact
                  </h3>
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary-light hover:bg-primary/10 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">
                      {vendor.phone}
                    </span>
                  </a>

                  {vendor.isAvailable && (
                    <Button
                      asChild
                      variant="hero"
                      size="lg"
                      className="w-full mt-6"
                    >
                      <Link
                        to={`/request/vendor/${vendor._id}${serviceSlug ? `?service=${serviceSlug}` : ""
                          }`}
                      >
                        Request Service Now
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VendorProfilePage;
