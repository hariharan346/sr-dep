import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Import Input component
import {
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  Loader2,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Fetch vendor's assigned requests
const fetchVendorRequests = async () => {
  const { data } = await api.get("/requests/vendor");
  return data;
};

// Fetch vendor's profile
const fetchVendorProfile = async () => {
  const { data } = await api.get("/auth/me"); // Assuming /auth/me populates vendor info for vendor users
  return data.vendor;
};

// Toggle vendor availability
const toggleAvailability = async (isAvailable) => {
  const { data } = await api.put("/vendors/availability", { isAvailable });
  return data;
};

// Update request status (accept, reject, complete)
const updateRequestStatus = async ({ requestId, statusType, reason, otp }) => {
  const { data } = await api.put(`/requests/${requestId}/${statusType}`, { declineReason: reason, otp });
  return data;
};

// Contact support
const contactSupport = async (supportData) => {
  const { data } = await api.post("/vendors/support", supportData);
  return data;
};

// Fetch vendor's provided services
const fetchVendorProvidedServices = async () => {
  const { data } = await api.get("/vendors/me/services");
  return data;
};

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: vendorProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["vendorProfile"],
    queryFn: fetchVendorProfile,
    enabled: user?.role === "vendor", // Only fetch if user is a vendor
  });

  const { data: vendorProvidedServices, isLoading: isLoadingVendorServices } = useQuery({
    queryKey: ["vendorProvidedServices"],
    queryFn: fetchVendorProvidedServices,
    enabled: user?.role === "vendor",
  });

  const [isAvailable, setIsAvailable] = useState(false);
  const [vendorServices, setVendorServices] = useState([]); // State to manage services offered by the vendor
  const [allAvailableServices, setAllAvailableServices] = useState([]); // State to manage all services from admin
  const [supportIssueType, setSupportIssueType] = useState("");
  const [supportDescription, setSupportDescription] = useState("");

  useEffect(() => {
    if (vendorProfile) {
      setIsAvailable(vendorProfile.isAvailable);
    }
  }, [vendorProfile]);

  useEffect(() => {
    if (vendorProvidedServices) {
      // Map the services to include all necessary fields for display
      setVendorServices(vendorProvidedServices.map(service => ({
        serviceId: service._id,
        name: service.name,
        description: service.description,
        image: service.image,
        minPrice: service.minPrice,
        maxPrice: service.maxPrice,
        isActive: service.isActive !== undefined ? service.isActive : true, // Default to true if missing
      })));
    }
  }, [vendorProvidedServices]);

  // Fetch all services to allow vendor to add new ones
  const { data: allServicesData, isLoading: isLoadingAllServices } = useQuery({
    queryKey: ["allServices"],
    queryFn: () => api.get("/services").then(res => res.data),
    enabled: user?.role === "vendor",
  });

  useEffect(() => {
    if (allServicesData) {
      setAllAvailableServices(allServicesData);
    }
  }, [allServicesData]);

  const { data: assignedRequests, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["vendorRequests"],
    queryFn: fetchVendorRequests,
    enabled: user?.role === "vendor",
  });

  const availabilityMutation = useMutation({
    mutationFn: toggleAvailability,
    onSuccess: (data) => {
      toast({
        title: "Availability Updated",
        description: `You are now ${data.isAvailable ? "available" : "unavailable"}.`,
      });
      queryClient.invalidateQueries(["vendorProfile"]); // Invalidate to refetch profile with new availability
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Could not update availability.",
        variant: "destructive",
      });
    },
  });

  const manageServicesMutation = useMutation({
    mutationFn: (services) => api.put("/vendors/me/services", {
      servicesProvided: services.map(s => ({
        serviceId: s.serviceId,
        minPrice: s.minPrice,
        maxPrice: s.maxPrice,
        isActive: s.isActive // Send isActive
      }))
    }),
    onSuccess: (data) => {
      toast({
        title: "Services Updated",
        description: "Your services have been updated successfully.",
      });
      queryClient.invalidateQueries(["vendorProfile"]);
      queryClient.invalidateQueries(["vendorServices"]); // Invalidate to refetch vendor's services
      queryClient.invalidateQueries(["vendors"]); // Invalidate user-facing vendor lists
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Could not update services.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId) => api.delete(`/vendors/me/services/${serviceId}`),
    onSuccess: () => {
      toast({
        title: "Service Removed",
        description: "Service has been removed from your offerings.",
      });
      queryClient.invalidateQueries(["vendorProfile"]);
      queryClient.invalidateQueries(["vendorServices"]); // Invalidate to refetch vendor's services
      queryClient.invalidateQueries(["vendors"]); // Invalidate user-facing vendor lists
    },
    onError: (error) => {
      toast({
        title: "Removal Failed",
        description: error.response?.data?.message || "Could not remove service.",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: (data) => {
      toast({
        title: "Request Updated",
        description: `Request status changed to ${data.status}.`,
      });
      queryClient.invalidateQueries(["vendorRequests"]); // Invalidate to refetch assigned requests
      queryClient.invalidateQueries(["openRequests"]); // Invalidate open requests as well
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Could not update request status.",
        variant: "destructive",
      });
    },
  });

  const supportMutation = useMutation({
    mutationFn: contactSupport,
    onSuccess: () => {
      toast({
        title: "Support Request Sent",
        description: "We have received your request and will get back to you shortly.",
      });
      setSupportIssueType("");
      setSupportDescription("");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Could not send support request.",
        variant: "destructive",
      });
    },
  });

  const handleAvailabilityToggle = () => {
    availabilityMutation.mutate(!isAvailable);
    setIsAvailable((prev) => !prev);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportIssueType) {
      toast({
        title: "Issue Type Required",
        description: "Please select an issue type.",
        variant: "destructive",
      });
      return;
    }
    supportMutation.mutate({ issueType: supportIssueType, description: supportDescription });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-primary">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {/* Check if cancelledBy is defined and compare (ignoring for now to keep simple or implementing check) */}
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const RequestCard = ({ request }) => (
    <Link to={`/request/${request._id}`} className="block">
      <div className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {request.service.name}
            </span>
            {getStatusBadge(request.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(request.date), "PPP p")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          Customer: {request.user.name} - {request.description}
        </p>

        {/* Show Cancellation Reason */}
        {request.status === "cancelled" && request.cancelReason && (
          <div className="mt-2 text-sm text-destructive border border-destructive/20 bg-destructive/10 p-2 rounded-md">
            <span className="font-semibold">Cancelled:</span> {request.cancelReason}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {request.status === "pending" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault(); // Prevent navigating
                statusMutation.mutate({ requestId: request._id, statusType: "accept" });
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Accept
            </Button>
          )}
          {(request.status === "pending" || request.status === "accepted") && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault(); // Prevent navigating
                const reason = window.prompt("Please enter a reason for declining this request:");
                if (reason) {
                  statusMutation.mutate({ requestId: request._id, statusType: "reject", reason });
                }
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </Button>
          )}
          {request.status === "accepted" && (
            <Button
              size="sm"
              variant="success"
              onClick={(e) => {
                e.preventDefault(); // Prevent navigating
                const otp = window.prompt("Enter the OTP provided by the customer to complete this job:");
                if (otp) {
                  statusMutation.mutate({ requestId: request._id, statusType: "complete", otp });
                }
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Complete
            </Button>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {isLoadingProfile ? (
            <p>Loading vendor profile...</p>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Store className="w-8 h-8 text-primary" />
                  {vendorProfile?.companyName || user?.name}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {vendorProfile?.location}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold text-lg">{vendorProfile?.ratingAverage?.toFixed(1) || "0.0"}</span>
                  <span className="text-muted-foreground">({vendorProfile?.reviewCount || 0} reviews)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <Switch
                  id="available"
                  checked={isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={availabilityMutation.isPending}
                />
                <Label htmlFor="available" className="cursor-pointer">
                  {isAvailable ? (
                    <span className="text-success font-medium">Available</span>
                  ) : (
                    <span className="text-muted-foreground">Unavailable</span>
                  )}
                </Label>
              </div>
            </div>
          )}

          {/* Vendor Services Section */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Services</h2>
            {isLoadingProfile ? (
              <p>Loading your services...</p>
            ) : vendorServices.length > 0 ? (
              <div className="space-y-4">
                {vendorServices.map((service) => (
                  <div
                    key={service.serviceId}
                    className="flex flex-col sm:flex-row items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
                      {service.image && (
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label htmlFor={`minPrice-${service.serviceId}`} className="sr-only">Min Price</Label>
                      <Input
                        id={`minPrice-${service.serviceId}`}
                        type="number"
                        placeholder="Min Price"
                        value={service.minPrice}
                        onChange={(e) => {
                          const updatedServices = vendorServices.map((s) =>
                            s.serviceId === service.serviceId
                              ? { ...s, minPrice: Number(e.target.value) }
                              : s
                          );
                          setVendorServices(updatedServices);
                        }}
                        min="0"
                        className="w-full sm:w-28"
                      />
                      <Label htmlFor={`maxPrice-${service.serviceId}`} className="sr-only">Max Price</Label>
                      <Input
                        id={`maxPrice-${service.serviceId}`}
                        type="number"
                        placeholder="Max Price"
                        value={service.maxPrice}
                        onChange={(e) => {
                          const updatedServices = vendorServices.map((s) =>
                            s.serviceId === service.serviceId
                              ? { ...s, maxPrice: Number(e.target.value) }
                              : s
                          );
                          setVendorServices(updatedServices);
                        }}
                        min="0"
                        className="w-full sm:w-28"
                      />
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={(checked) => {
                            const updatedServices = vendorServices.map((s) =>
                              s.serviceId === service.serviceId
                                ? { ...s, isActive: checked }
                                : s
                            );
                            setVendorServices(updatedServices);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{service.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteServiceMutation.mutate(service.serviceId)}
                        disabled={deleteServiceMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    manageServicesMutation.mutate(
                      vendorServices.map((s) => ({
                        serviceId: s.serviceId,
                        minPrice: s.minPrice,
                        maxPrice: s.maxPrice,
                      }))
                    )
                  }
                  disabled={manageServicesMutation.isPending}
                  className="w-full"
                >
                  {manageServicesMutation.isPending ? "Updating..." : "Update Services"}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">You are not offering any services yet.</p>
            )}

            {/* Add New Service */}
            <div className="mt-6 border-t pt-4 border-border">
              <h3 className="text-lg font-semibold mb-3">Add New Service</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const selectedServiceId = e.target.elements.newService.value;
                  const newMinPrice = Number(e.target.elements.newMinPrice.value);
                  const newMaxPrice = Number(e.target.elements.newMaxPrice.value);

                  if (!selectedServiceId || newMinPrice <= 0 || newMaxPrice <= 0 || newMinPrice >= newMaxPrice) {
                    toast({
                      title: "Invalid Input",
                      description: "Please select a service and provide valid min/max prices.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const serviceToAdd = allAvailableServices.find(s => s._id === selectedServiceId);
                  if (serviceToAdd && !vendorServices.some(s => s.serviceId === serviceToAdd._id)) {
                    const updatedServices = [
                      ...vendorServices,
                      {
                        serviceId: serviceToAdd._id,
                        name: serviceToAdd.name,
                        description: serviceToAdd.description,
                        image: serviceToAdd.image,
                        minPrice: newMinPrice,
                        maxPrice: newMaxPrice,
                      },
                    ];
                    // Immediately trigger mutation with the updated list
                    manageServicesMutation.mutate(
                      updatedServices.map((s) => ({
                        serviceId: s.serviceId,
                        minPrice: s.minPrice,
                        maxPrice: s.maxPrice,
                      }))
                    );
                    e.target.reset(); // Reset form fields
                  } else if (vendorServices.some(s => s.serviceId === serviceToAdd._id)) {
                    toast({
                      title: "Service Already Added",
                      description: "This service is already in your offerings. You can edit its prices above.",
                      variant: "info",
                    });
                  }
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Select name="newService" disabled={isLoadingAllServices}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAvailableServices.map((service) => (
                      <SelectItem key={service._id} value={service._id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" name="newMinPrice" placeholder="Min Price" min="0" className="w-full sm:w-32" />
                <Input type="number" name="newMaxPrice" placeholder="Max Price" min="0" className="w-full sm:w-32" />
                <Button type="submit" disabled={manageServicesMutation.isPending || isLoadingAllServices}>
                  Add Service
                </Button>
              </form>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Assigned Requests */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">Your Assigned Requests</h2>
              {isLoadingAssigned ? (
                <p>Loading your requests...</p>
              ) : assignedRequests && assignedRequests.length > 0 ? (
                <div className="space-y-4">
                  {assignedRequests.map((request) => (
                    <RequestCard key={request._id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p>You have no assigned service requests.</p>
                  <Link to="/open-request" className="text-primary hover:underline mt-2 inline-block">
                    View Open Requests
                  </Link>
                </div>
              )}
            </div>

            {/* Support Center */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">Support Center</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">For urgent issues, please call us at:</p>
                  <p className="text-lg font-semibold text-primary mt-1">+1 (800) 555-1234</p>
                </div>
                <hr className="border-border" />
                <div>
                  <h3 className="font-medium">Submit a Support Ticket</h3>
                  <p className="text-sm text-muted-foreground mb-4">For non-urgent issues, please use the form below.</p>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Issue Type *</Label>
                      <Select onValueChange={setSupportIssueType} value={supportIssueType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technical Glitch">Technical Glitch</SelectItem>
                          <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                          <SelectItem value="Account Problem">Account Problem</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={supportDescription}
                        onChange={(e) => setSupportDescription(e.target.value)}
                        placeholder="Please describe the issue in detail."
                        rows={4}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={supportMutation.isLoading}
                    >
                      {supportMutation.isLoading ? "Submitting..." : "Submit Ticket"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VendorDashboard;
