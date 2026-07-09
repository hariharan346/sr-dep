import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VendorCard } from "@/components/cards/VendorCard";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";

// Fetch functions
const fetchAllServices = async (location) => {
    const params = location ? { location } : {};
    const { data } = await api.get("/services", { params });
    return data;
};

const fetchVendors = async ({ serviceId, location, sortBy }) => {
    const params = {};
    if (serviceId) params.serviceId = serviceId;
    if (location) params.location = location;
    if (sortBy) params.sortBy = sortBy;

    const { data } = await api.get("/vendors", { params });
    return data;
};

const SearchPage = () => {
    const { user, logout } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const query = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";

    const [sortBy, setSortBy] = useState("trustScore"); // Default sort

    // 1. Fetch Services (dependent on location for Case B)
    const { data: services, isLoading: isLoadingServices } = useQuery({
        queryKey: ["services", location], // Re-fetch if location changes
        queryFn: () => fetchAllServices(location),
    });

    // 2. Resolve 'query' to a Service ID
    const matchedService = useMemo(() => {
        if (!query || !services) return null;
        const qLower = query.toLowerCase().trim();
        // Try exact match first, then partial
        return (
            services.find((s) => s.name.toLowerCase() === qLower) ||
            services.find((s) => s.name.toLowerCase().includes(qLower))
        );
    }, [query, services]);

    // Determine Mode
    // Case B: Location ONLY (No query OR Query doesn't match a service but we want to show categories? 
    // Actually if Query is present but no match, it might be a Company Name search.
    // But per requirements "User enters ONLY Location... Display list of services".
    const isLocationOnly = location && !query;

    // 3. Fetch Vendors (Case A or C or Company Name search)
    // We fetch vendors if we have a matched Service OR if we are searching by text (company name fallback?)
    // For strict adherence to Case A/C:
    // Case A: Loc + Svc
    // Case C: Svc Only
    const shouldFetchVendors = !!matchedService || (!!query && !isLocationOnly);

    const {
        data: vendors,
        isLoading: isLoadingVendors,
        isError: isErrorVendors,
    } = useQuery({
        queryKey: ["searchVendors", matchedService?._id, location, sortBy, query],
        queryFn: () => fetchVendors({
            serviceId: matchedService?._id,
            location,
            sortBy
        }),
        enabled: shouldFetchVendors,
    });

    // Handle click on service in Case B
    const handleServiceClick = (serviceName) => {
        navigate(`/search?q=${encodeURIComponent(serviceName)}&location=${encodeURIComponent(location)}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar user={user} onLogout={logout} />

            <main className="flex-1">
                {/* Header */}
                <section className="py-10 bg-gradient-hero">
                    <div className="container mx-auto px-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                            {isLocationOnly ? `Services in ${location}` : "Search Results"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {isLocationOnly
                                ? "Select a service to find professionals near you."
                                : `${vendors?.length || 0} results found` + (matchedService ? ` for ${matchedService.name}` : "")
                            }
                        </p>
                    </div>
                </section>

                <section className="py-8">
                    <div className="container mx-auto px-4">

                        {/* Case B: Service Categories List */}
                        {isLocationOnly && (
                            <div>
                                {isLoadingServices ? (
                                    <p>Loading services...</p>
                                ) : services && services.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {services.map((service) => (
                                            <div
                                                key={service._id}
                                                onClick={() => handleServiceClick(service.name)}
                                                className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:shadow-lg transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {service.image && (
                                                        <img
                                                            src={`http://localhost:5000${service.image}`}
                                                            alt={service.name}
                                                            className="w-12 h-12 rounded-lg object-cover bg-muted"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.png"; }}
                                                        />
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                            {service.name}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {service.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">No services found in this location.</p>
                                        <Button variant="link" asChild className="mt-2">
                                            <Link to="/categories">Browse all categories</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Case A & C: Vendor List */}
                        {!isLocationOnly && (
                            <div>
                                {/* Sorting Controls */}
                                <div className="flex justify-end mb-6">
                                    <div className="flex items-center gap-2">
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
                                </div>

                                {isLoadingVendors ? (
                                    <p>Loading vendors...</p>
                                ) : isErrorVendors ? (
                                    <p>Error fetching results.</p>
                                ) : vendors && vendors.length > 0 ? (
                                    <div className="space-y-4">
                                        {vendors.map((vendor, index) => (
                                            <VendorCard
                                                key={vendor._id}
                                                vendor={vendor}
                                                serviceId={matchedService?._id}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <p className="text-muted-foreground text-lg">
                                            No service providers found matching your criteria.
                                        </p>
                                        <Link to="/categories" className="text-primary hover:underline mt-2 inline-block">
                                            Browse Categories
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default SearchPage;
