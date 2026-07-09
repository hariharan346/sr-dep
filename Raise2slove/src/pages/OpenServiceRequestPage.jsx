import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { format } from "date-fns";

// Fetch open service requests for vendors
const fetchOpenRequests = async () => {
  const { data } = await api.get("/requests/open");
  return data;
};

// Accept a service request
const acceptRequest = async (requestId) => {
  const { data } = await api.put(`/requests/${requestId}/accept`);
  return data;
};

const OpenServiceRequestPage = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["openRequests"],
    queryFn: fetchOpenRequests,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptRequest,
    onSuccess: () => {
      toast({
        title: "Request Accepted!",
        description: "The service request has been assigned to you.",
      });
      queryClient.invalidateQueries(["openRequests"]); // Invalidate to refetch open requests
      queryClient.invalidateQueries(["vendorRequests"]); // Invalidate vendor's assigned requests
    },
    onError: (error) => {
      toast({
        title: "Acceptance Failed",
        description: error.response?.data?.message || "There was an error accepting the request.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading open requests...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Error Loading Requests
            </h1>
            <p className="text-muted-foreground">
              There was an error fetching open service requests.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/vendor/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-md">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Open Service Requests
            </h1>
            <p className="text-muted-foreground mb-6">
              Requests not yet assigned to any vendor. Accept a request to claim it.
            </p>

            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-muted/50 rounded-xl p-4 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {request.service.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.user.name} on {format(new Date(request.date), 'PPP p')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Description: {request.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{request.status}</Badge>
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(request._id)}
                        disabled={acceptMutation.isPending}
                      >
                        {acceptMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Accept Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No open service requests at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OpenServiceRequestPage;