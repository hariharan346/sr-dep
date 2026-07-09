import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

const fetchAllServices = async () => {
  const { data } = await api.get("/services");
  return data;
};

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const { data: services, isLoading, isError } = useQuery({
    queryKey: ["allServices"],
    queryFn: fetchAllServices,
  });

  const filteredServices = services
    ? services.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    )
    : [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() || location.trim()) {
      const matchedService = services?.find(
        (s) => s.name.toLowerCase() === query.trim().toLowerCase()
      );

      if (matchedService && !location.trim()) {
        navigate(`/service/${matchedService.slug}`);
      } else {
        navigate(
          `/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(
            location
          )}`
        );
      }
    }
  };

  const handleSuggestionClick = (serviceName) => {
    setQuery(serviceName);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-2 flex flex-col sm:flex-row gap-2">
        {/* Service Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for services (e.g., Electrician, Plumber)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full h-12 pl-12 pr-4 bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && query && filteredServices.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50">
              {filteredServices.slice(0, 5).map((service) => (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => handleSuggestionClick(service.name)}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location Input */}
        <div className="relative flex-1 sm:border-l border-border">
          <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter your location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-12 pl-12 sm:pl-14 pr-4 bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Search Button */}
        <Button type="submit" variant="hero" size="lg" className="sm:w-auto">
          Search
        </Button>
      </div>
    </form>
  );
};
