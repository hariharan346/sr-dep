import { Link, useParams, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  Store,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const fetchRequestById = async (id) => {
  const { data } = await api.get(`/requests/${id}`);
  return data;
};

const ServiceRequestDetailsPage = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["request", id],
    queryFn: () => fetchRequestById(id),
  });

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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const updateRequestStatus = async ({ requestId, statusType }) => {
    const { data } = await api.put(`/requests/${requestId}/${statusType}`);
    return data;
  };

  const statusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: (data) => {
      toast({
        title: "Request Updated",
        description: `Request status changed to ${data.status}.`,
      });
      queryClient.invalidateQueries(["request", id]);
      queryClient.invalidateQueries(["userRequests"]); // Potentially invalidate user's list
      queryClient.invalidateQueries(["vendorRequests"]); // Potentially invalidate vendor's list
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Could not update request status.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading request details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold">Request not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const isCustomer = user?.role === "user" && request.user._id === user.id;
  const isVendor = user?.role === "vendor" && request.vendor?._id === user.id; // Adjusted for populated vendor object

  const getBackLink = () => {
    if (user?.role === "vendor") {
      return "/vendor/dashboard";
    }
    return "/customer/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to={getBackLink()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {request.service.name}
                </h1>
                <p className="text-muted-foreground">
                  Requested on {format(new Date(request.createdAt), 'PPP p')}
                </p>
              </div>
              {getStatusBadge(request.status)}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-muted-foreground">{request.description}</p>
              </div>
              <div>
                <h3 className="font-semibold">Appointment</h3>
                <p className="text-muted-foreground">
                  {format(new Date(request.date), 'PPP p')}
                </p>
              </div>
            </div>

            {request.vendor ? (
              <>
                <hr className="my-6 border-border" />
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Vendor Details
                  </h2>
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {request.vendor.companyName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {request.user.email} {/* This needs to be request.vendor.user.email, or populate user in vendor */}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {request.vendor.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
                <div className="mt-6 text-muted-foreground">
                    <p>This request is currently open and not assigned to a vendor.</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {isCustomer && request.status !== "completed" && request.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ requestId: request._id, statusType: "cancel" })}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Cancel Request
                </Button>
              )}

              {isVendor && request.status === "pending" && (
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ requestId: request._id, statusType: "accept" })}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Accept Request
                </Button>
              )}

              {isVendor && request.status === "accepted" && (
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ requestId: request._id, statusType: "complete" })}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Mark as Completed
                </Button>
              )}

              {isVendor && (request.status === "pending" || request.status === "accepted") && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ requestId: request._id, statusType: "reject" })}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceRequestDetailsPage;
