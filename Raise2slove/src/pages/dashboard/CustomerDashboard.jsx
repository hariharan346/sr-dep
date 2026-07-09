import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Star,
  Loader2,
} from "lucide-react";
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
import { format } from "date-fns";

const fetchUserRequests = async () => {
  const { data } = await api.get("/requests/my");
  return data;
};

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ratingRequestId, setRatingRequestId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [cancelRequestId, setCancelRequestId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userRequests"],
    queryFn: fetchUserRequests,
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      const { data } = await api.patch(`/requests/${requestId}/user-cancel`, { cancelReason: reason });
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Request Cancelled",
        description: "Your service request has been cancelled.",
      });
      setCancelRequestId(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["userRequests"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel request.",
        variant: "destructive",
      });
    },
  });

  const handleCancelSubmit = () => {
    if (cancelRequestId) {
      cancelMutation.mutate({ requestId: cancelRequestId, reason: cancelReason });
    }
  };

  const rateMutation = useMutation({
    mutationFn: async ({ requestId, rating, comment }) => {
      const { data } = await api.post(`/requests/${requestId}/rate`, { rating, comment });
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor rated successfully!",
      });
      setRatingRequestId(null);
      setRating(5);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["userRequests"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit rating.",
        variant: "destructive",
      });
    },
  });

  const handleRateSubmit = () => {
    if (ratingRequestId) {
      rateMutation.mutate({ requestId: ratingRequestId, rating, comment });
    }
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
            Cancelled
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user?.name}
          </h1>
          <p className="text-muted-foreground mb-8">
            Manage your service requests
          </p>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Your Service Requests ({requests?.length || 0})
              </h2>
              <Button asChild>
                <Link to="/categories">Book New Services</Link>
              </Button>
            </div>
            {isLoading ? (
              <p>Loading your requests...</p>
            ) : isError ? (
              <p>Error fetching your requests.</p>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                    <Link to={`/request/${request._id}`} className="block">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{request.service.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.vendor?.companyName || "Pending Vendor"}
                          </p>
                          <p className="text-sm mt-2 line-clamp-2">{request.description}</p>
                          {request.status === "accepted" && request.otp && (
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md inline-block">
                              <p className="text-xs font-bold text-yellow-800 dark:text-yellow-100 uppercase tracking-widest">Job OTP</p>
                              <p className="text-2xl font-mono font-bold text-yellow-900 dark:text-white tracking-wider">{request.otp}</p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Share this with vendor only after work is done.</p>
                            </div>
                          )}
                          {request.status === "declined" && request.declineReason && (
                            <div className="mt-2 text-sm text-destructive">
                              Reason: {request.declineReason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(request.status)}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(request.createdAt), 'PPP p')}
                          </p>

                          {request.status === "completed" && !request.rating && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={(e) => {
                                e.preventDefault(); // Prevent Link navigation
                                setRatingRequestId(request._id);
                              }}
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Rate Vendor
                            </Button>
                          )}
                          {(request.status === "pending" || request.status === "accepted") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mt-2 inline-flex items-center gap-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setCancelRequestId(request._id);
                              }}
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </Button>
                          )}
                          {request.rating && (
                            <div className="mt-2 flex items-center justify-end text-yellow-500">
                              <Star className="w-3 h-3 fill-current mr-1" />
                              <span className="text-sm font-medium">{request.rating} Stars</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  You have not made any service requests yet.{" "}
                </p>
                <Link
                  to="/categories"
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Browse services
                </Link>
              </div>
            )}
          </div>
        </div>

        <Dialog open={!!ratingRequestId} onOpenChange={(open) => !open && setRatingRequestId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rate Service</DialogTitle>
              <DialogDescription>
                How was your experience with this vendor?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                      }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRateSubmit} disabled={rateMutation.isPending}>
                {rateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Rating
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!cancelRequestId} onOpenChange={(open) => !open && setCancelRequestId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cancel Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel? Please provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cancelReason">Reason for Cancellation</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Change of plans, found another vendor..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCancelRequestId(null)}>
                Keep Request
              </Button>
              <Button variant="destructive" onClick={handleCancelSubmit} disabled={cancelMutation.isPending || !cancelReason}>
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancel"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
      <Footer />
    </div>
  );
};

export default CustomerDashboard;
