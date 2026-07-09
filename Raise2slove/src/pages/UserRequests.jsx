import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import UserRequestCard from "@/components/cards/UserRequestCard";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft } from "lucide-react";

const fetchUserRequests = async () => {
  const { data } = await api.get("/requests/my");
  return data;
};

function UserRequests() {
  const { user, logout } = useAuth();
  const {
    data: requests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userRequests"],
    queryFn: fetchUserRequests,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading your requests...</p>
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
              Error Fetching Requests
            </h1>
            <p className="text-muted-foreground">
              There was an error loading your service requests.
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
            to="/customer/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-6">My Requests</h1>

          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <UserRequestCard key={request._id} request={request} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                You have not made any service requests yet.
              </p>
              <Link to="/categories" className="text-primary hover:underline mt-2 inline-block">
                Explore Services
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default UserRequests;
