import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Store, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

// Fetch a single vendor by ID
const fetchVendorById = async (vendorId) => {
  const { data } = await api.get(`/vendors/${vendorId}`);
  return data;
};

// Fetch a single service by slug
const fetchServiceBySlug = async (serviceSlug) => {
  const { data } = await api.get(`/services/${serviceSlug}`);
  return data;
};

// Fetch all categories populated with services
const fetchCategoriesWithServices = async () => {
  const { data } = await api.get("/categories");
  return data;
};

// Create a new service request
const createRequest = async (requestData) => {
  const { data } = await api.post("/requests", requestData);
  return data;
};

const ServiceRequestPage = () => {
  const { vendorId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceSlugFromUrl = searchParams.get("service"); // Now serviceSlug

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    data: vendor,
    isLoading: isVendorLoading,
    isError: isVendorError,
  } = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: () => fetchVendorById(vendorId),
  });

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ["categoriesWithServices"],
    queryFn: fetchCategoriesWithServices,
  });

  const [selectedCategory, setSelectedCategory] = useState(""); // Stores category _id
  const [selectedService, setSelectedService] = useState(""); // Stores service _id
  const [filteredServices, setFilteredServices] = useState([]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  // Pre-select service if coming from URL
  useEffect(() => {
    if (categories && serviceSlugFromUrl) {
      categories.forEach((cat) => {
        const matchingService = cat.services.find(
          (s) => s.slug === serviceSlugFromUrl
        );
        if (matchingService) {
          setSelectedCategory(cat._id);
          setSelectedService(matchingService._id);
        }
      });
    }
  }, [categories, serviceSlugFromUrl]);

  // Filter services based on selected category
  useEffect(() => {
    if (selectedCategory && categories) {
      const category = categories.find((cat) => cat._id === selectedCategory);
      if (category) {
        setFilteredServices(category.services);
        // If the pre-selected service is not in the new filtered list, clear selectedService
        if (!category.services.some(s => s._id === selectedService)) {
            setSelectedService("");
        }
      }
    } else {
      setFilteredServices([]);
      setSelectedService("");
    }
  }, [selectedCategory, categories, selectedService]);


  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      toast({
        title: "Request Submitted!",
        description: "Your service request has been sent.",
      });
      navigate("/customer/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "There was an error submitting your request.",
        variant: "destructive",
      });
    },
  });

  if (isVendorLoading || isCategoriesLoading) {
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

  if (isVendorError || isCategoriesError || !vendor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Error Loading Data
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to request a service.",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    if (!selectedCategory || !selectedService || !description.trim() || !date.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      vendorId: vendor._id, // Pass vendor _id
      serviceId: selectedService, // Pass service _id
      description,
      date,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            to={`/vendor/${vendor._id}${
              serviceSlugFromUrl ? `?service=${serviceSlugFromUrl}` : ""
            }`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {vendor.companyName}
          </Link>

          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-md">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Request Service
            </h1>
            <p className="text-muted-foreground mb-6">
              Fill in the details below to send a service request
            </p>

            {/* Vendor Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {vendor.companyName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vendor.location}
                </p>
              </div>
            </div>

            {!user && (
              <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl mb-6">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Login Required</p>
                  <p className="text-sm text-muted-foreground">
                    Please{" "}
                    <Link to="/auth/login" className="text-primary hover:underline">
                      login
                    </Link>{" "}
                    or{" "}
                    <Link
                      to="/auth/register"
                      className="text-primary hover:underline"
                    >
                      register
                    </Link>{" "}
                    to submit a service request.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Service Category *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories && categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service">Service Type *</Label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  disabled={!selectedCategory || filteredServices.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServices.map((service) => (
                      <SelectItem key={service._id} value={service._id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Problem Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Describe Your Problem *</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue or service you need in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label htmlFor="date">Appointment Date & Time *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceRequestPage;
