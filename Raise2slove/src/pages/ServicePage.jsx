import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VendorCard } from "@/components/cards/VendorCard";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
// Helper to fetch user requests (should technically be in a hook/api file but declaring here for now or importing)
const fetchUserRequests = async () => {
  const { data } = await api.get("/requests/my");
  return data;
};

const fetchServiceBySlug = async (slug) => {
  const { data } = await api.get(`/services/${slug}`);
  return data;
};

const fetchVendorsByServiceSlug = async (slug, sortBy) => {
  const params = sortBy ? { sortBy } : {};
  const { data } = await api.get(`/services/${slug}/vendors`, { params });
  return data;
};

const ServicePage = () => {
  const { serviceSlug } = useParams();
  const { user, logout } = useAuth();

  // Removed showAvailableOnly state and its related filtering logic
  // const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("rating_desc"); // Default sort

  const {
    data: service,
    isLoading: isLoadingService,
    isError: isErrorService,
  } = useQuery({
    queryKey: ["service", serviceSlug],
    queryFn: () => fetchServiceBySlug(serviceSlug),
    enabled: !!serviceSlug,
  });

  // Fetch user requests to determine status per vendor
  const { data: userRequests } = useQuery({
    queryKey: ["userRequests"],
    queryFn: fetchUserRequests,
    enabled: !!user, // Only fetch if user is logged in
  });



  const {
    data: vendors,
    isLoading: isLoadingVendors,
    isError: isErrorVendors,
  } = useQuery({
    queryKey: ["vendors", serviceSlug, sortBy],
    queryFn: () => fetchVendorsByServiceSlug(serviceSlug, sortBy),
    enabled: !!serviceSlug,
  });


  // The filteredVendors useMemo is simplified as frontend should not re-filter
  const displayVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors; // Directly use vendors from API, no further client-side filtering by service is needed
  }, [vendors]);

  if (isLoadingService || isLoadingVendors) {
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

  if (isErrorService || isErrorVendors || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Service Not Found
            </h1>
            <Link to="/categories" className="text-primary hover:underline">
              Browse all services
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
              to="/categories" // Link to general categories page
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              All Categories
            </Link>

            <div className="flex items-center gap-4">
              {/* Ensure service.image is correctly prefixed if it's a relative path */}
              {service.image && (
                <img
                  src={`${api.defaults.baseURL}${service.image.startsWith('/') ? '' : '/'}${service.image}`}
                  alt={service.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {service.name}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {service.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vendors List */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {displayVendors.length}
                </span>{" "}
                service providers found
              </p>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trustScore">Recommended</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                      <SelectItem value="rating_desc">Rating: High to Low</SelectItem>
                      <SelectItem value="name_asc">Name: A - Z</SelectItem>
                      <SelectItem value="name_desc">Name: Z - A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>

                {/* Removed Available Only Switch */}
                <div
                  className={`${showFilters ? "flex" : "hidden"
                    } sm:flex items-center gap-4`}
                >
                  {/* <div className="flex items-center gap-2">
                    <Switch
                      id="available"
                      checked={showAvailableOnly}
                      onCheckedChange={setShowAvailableOnly}
                    />
                    <Label htmlFor="available" className="text-sm cursor-pointer">
                      Available Only
                    </Label>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Vendor Cards */}
            {displayVendors.length > 0 ? (
              <div className="space-y-4">
                {displayVendors.map((vendor, index) => (
                  <VendorCard
                    key={vendor._id}
                    vendor={vendor}
                    serviceId={service._id} // Pass the actual service._id
                    index={index}
                    // Determine status: Find request for this vendor that is NOT completed/cancelled
                    // Determine status: Find request for this vendor that is NOT completed/cancelled
                    requestStatus={userRequests?.find(r => {
                      const getVendorId = (v) => v?._id ? v._id.toString() : v?.toString();
                      const rVendorId = getVendorId(r.vendor) || getVendorId(r.targetedVendor);
                      const currentVendorId = vendor._id?.toString();

                      const getServiceId = (s) => s?._id ? s._id.toString() : s?.toString();
                      const rServiceId = getServiceId(r.service);
                      const currentServiceId = service._id?.toString();

                      return (rVendorId === currentVendorId) &&
                        (rServiceId === currentServiceId) &&
                        (r.status === 'pending' || r.status === 'accepted' || r.status === 'under_process');
                    })?.status}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No service providers found for this service.
                </p>
                {/* Removed "Show all providers" button */}
                {/* {showAvailableOnly && (
                  <Button
                    variant="link"
                    onClick={() => setShowAvailableOnly(false)}
                    className="mt-2"
                  >
                    Show all providers
                  </Button>
                )} */}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePage;
