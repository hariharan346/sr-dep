import { Navbar } from "@/components/layout/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Fetch all vendors
const fetchVendors = async () => {
  const { data } = await api.get("/admin/vendors");
  return data;
};

// Delete a vendor
const deleteVendor = async (vendorId) => {
  await api.delete(`/admin/vendors/${vendorId}`);
};

const AdminVendorsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: vendors,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminVendors"],
    queryFn: fetchVendors,
  });

  const deleteVendorMutation = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries(["adminVendors"]);
      toast({
        title: "Vendor Deleted",
        description: "The vendor and associated user have been successfully deleted.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to delete vendor.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-8 px-4">
          <p>Loading vendors...</p>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-8 px-4">
          <p>Error: {error?.message}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Manage Vendors
        </h1>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
          {vendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor._id}>
                    <TableCell>{vendor.companyName}</TableCell>
                    <TableCell>{vendor.user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {vendor.servicesProvided.map((serviceEntry) => (
                          <Badge key={serviceEntry._id} variant="secondary">
                            {serviceEntry.serviceId?.name || "Unknown"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{vendor.location}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteVendorMutation.mutate(vendor._id)}
                        disabled={deleteVendorMutation.isPending}
                      >
                        {deleteVendorMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No vendors found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminVendorsPage;