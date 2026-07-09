import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, CheckCircle2, XCircle, CalendarIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

import { useQueryClient } from "@tanstack/react-query";

export const VendorCard = ({ vendor, serviceId, index = 0, requestStatus }) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleBookService = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (!date || !description) {
      toast({
        title: "Error",
        description: "Please provide both date and description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/requests", {
        vendorId: vendor._id,
        serviceId: serviceId, // Ensure serviceId is passed!
        date,
        description,
      });

      toast({
        title: "Success",
        description: "Service request sent successfully!",
      });
      setIsBookingOpen(false);
      setDate("");
      setDescription("");
      // navigate("/customer/dashboard"); // Optional: Navigate user to dashboard
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to book service.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["userRequests"]);
    }
  };

  return (
    <div
      className="bg-card rounded-2xl p-6 border border-border card-hover animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Vendor Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground">
                  {vendor.user.name}
                </h3>
                {vendor.isAvailable ? (
                  <Badge
                    variant="default"
                    className="bg-success text-success-foreground text-xs"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Unavailable
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {vendor.companyName}
              </p>
              {vendor.minPrice && vendor.maxPrice && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-foreground">Price Range</p>
                  <p className="text-lg font-semibold text-primary">
                    ${vendor.minPrice} - ${vendor.maxPrice}
                  </p>
                </div>
              )}
              {/* Display Rating if available (New) */}
              {vendor.ratingAverage > 0 && (
                <div className="mt-2 flex items-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span className="font-medium text-sm">{vendor.ratingAverage.toFixed(1)}</span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({vendor.reviewCount} {vendor.reviewCount === 1 ? 'Review' : 'Reviews'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4" />
              <span>{vendor.location}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 lg:w-40">
          {/* Book Service Button (Replaces View Profile) */}
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              {requestStatus ? (
                <Button variant="secondary" className="w-full" disabled>
                  {requestStatus === 'pending' ? 'Request Pending' : 'Service Accepted'}
                </Button>
              ) : (
                <Button variant="default" className="w-full" disabled={!vendor.isAvailable}>
                  {vendor.isAvailable ? 'Book Service' : 'Unavailable'}
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book Service</DialogTitle>
                <DialogDescription>
                  Request a service from {vendor.companyName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Problem/Requirement)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you need..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBookService} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Confirm Request"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Call Now Button */}
          <a
            href={`tel:${vendor.phone}`}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 border rounded-md"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
};
