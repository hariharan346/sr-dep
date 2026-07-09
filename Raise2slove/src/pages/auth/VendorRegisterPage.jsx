import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const fetchCategoriesWithServices = async () => {
  const { data } = await api.get("/categories"); // Assuming this endpoint returns categories populated with services
  return data;
};

const VendorRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    companyName: "",
    location: "",
  });
  const [selectedServicesWithPrices, setSelectedServicesWithPrices] = useState([]); // Stores array of {serviceId, minPrice, maxPrice}
  const [isLoading, setIsLoading] = useState(false); // Reintroduce isLoading state
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast hook

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesWithServices,
  });

  const handlePriceChange = (serviceId, field, value) => {
    setSelectedServicesWithPrices((prev) =>
      prev.map((service) =>
        service.serviceId === serviceId ? { ...service, [field]: Number(value) } : service
      )
    );
  };

  const toggleService = (serviceId) => {
    setSelectedServicesWithPrices((prev) => {
      if (prev.some((service) => service.serviceId === serviceId)) {
        return prev.filter((service) => service.serviceId !== serviceId);
      } else {
        // Initialize with default prices, or leave blank for user input
        return [...prev, { serviceId, minPrice: 0, maxPrice: 0 }];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServicesWithPrices.length === 0) {
      toast({
        title: "Select Services",
        description: "Please select at least one service.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation for minPrice and maxPrice
    for (const service of selectedServicesWithPrices) {
      if (service.minPrice <= 0 || service.maxPrice <= 0) {
        toast({
          title: "Invalid Price",
          description: "Min and Max prices must be greater than 0.",
          variant: "destructive",
        });
        return;
      }
      if (service.minPrice >= service.maxPrice) {
        toast({
          title: "Invalid Price Range",
          description: "Min price must be less than Max price.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await register({
        ...formData,
        role: "vendor",
        servicesProvided: selectedServicesWithPrices, // Send array of service objects with prices
      });
      setIsLoading(false);

      toast({
        title: "Welcome!",
        description: "Your shop has been registered.",
      });
      navigate("/vendor/dashboard");
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Email already exists or invalid data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-10 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Register Your Shop
            </h1>
            <p className="text-muted-foreground mt-2">
              Join ServiConnect as a service provider
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <hr className="border-border" />

              <div className="space-y-2">
                <Label>Shop / Business Name</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Services Offered *</Label>
                {isLoadingCategories ? (
                  <p>Loading services...</p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {categories && categories.map((category) => (
                      <AccordionItem value={category._id} key={category._id}>
                        <AccordionTrigger>{category.name}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                            {category.services.map((service) => (
                              <div
                                key={service._id}
                                className="flex flex-col gap-2 p-2 border rounded-md"
                              >
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <Checkbox
                                    checked={selectedServicesWithPrices.some(
                                      (s) => s.serviceId === service._id
                                    )}
                                    onCheckedChange={() => toggleService(service._id)}
                                  />
                                  {service.name}
                                </label>
                                {selectedServicesWithPrices.some(
                                  (s) => s.serviceId === service._id
                                ) && (
                                  <div className="flex gap-2 ml-6">
                                    <Input
                                      type="number"
                                      placeholder="Min Price"
                                      value={
                                        selectedServicesWithPrices.find(
                                          (s) => s.serviceId === service._id
                                        )?.minPrice || ""
                                      }
                                      onChange={(e) =>
                                        handlePriceChange(
                                          service._id,
                                          "minPrice",
                                          e.target.value
                                        )
                                      }
                                      min="0"
                                      className="w-1/2"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Max Price"
                                      value={
                                        selectedServicesWithPrices.find(
                                          (s) => s.serviceId === service._id
                                        )?.maxPrice || ""
                                      }
                                      onChange={(e) =>
                                        handlePriceChange(
                                          service._id,
                                          "maxPrice",
                                          e.target.value
                                        )
                                      }
                                      min="0"
                                      className="w-1/2"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register Shop"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already registered?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorRegisterPage;
