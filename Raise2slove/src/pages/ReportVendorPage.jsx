import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

const createReport = async (reportData) => {
  const { data } = await api.post("/reports", reportData);
  return data;
};

const ReportVendorPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your report has been submitted successfully.",
      });
      navigate("/"); // Redirect to home or another appropriate page
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for the report.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ vendor: vendorId, reason, description });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-10 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Report a Vendor</h1>
            <p className="text-muted-foreground mt-2">
              We are sorry you had a bad experience. Please let us know what happened.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Reason for reporting *</Label>
                <Select onValueChange={setReason} value={reason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendor did not show up">Vendor did not show up</SelectItem>
                    <SelectItem value="Vendor was unprofessional">Vendor was unprofessional</SelectItem>
                    <SelectItem value="Quality of service was poor">Quality of service was poor</SelectItem>
                    <SelectItem value="Pricing issue">Pricing issue</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more details about your experience..."
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                size="lg"
                className="w-full"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportVendorPage;
