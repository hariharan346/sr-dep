import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { format } from "date-fns";

const fetchReports = async () => {
  const { data } = await api.get("/reports");
  return data;
};

const AdminReportsPage = () => {
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterVendor, setFilterVendor] = useState("");

  const {
    data: reports,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const processedReports = useMemo(() => {
    if (!reports) return [];

    // Aggregate reports by vendor
    const vendorReports = reports.reduce((acc, report) => {
      const vendorId = report.vendor._id;
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorName: report.vendor.companyName,
          reportCount: 0,
          reports: [],
        };
      }
      acc[vendorId].reportCount++;
      acc[vendorId].reports.push(report);
      return acc;
    }, {});

    let sorted = Object.values(vendorReports);

    // Filter
    if (filterVendor) {
      sorted = sorted.filter((v) =>
        v.vendorName.toLowerCase().includes(filterVendor.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "reports-desc":
        sorted.sort((a, b) => b.reportCount - a.reportCount);
        break;
      case "reports-asc":
        sorted.sort((a, b) => a.reportCount - b.reportCount);
        break;
      default: // date-desc
        sorted.sort((a, b) =>
          new Date(b.reports[0].createdAt) - new Date(a.reports[0].createdAt)
        );
        break;
    }

    return sorted;
  }, [reports, sortBy, filterVendor]);

  if (isLoading) return <p>Loading reports...</p>;
  if (isError) return <p>Error fetching reports.</p>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">User Reports</h1>

        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Filter by vendor name..."
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            className="max-w-sm"
          />
          <Select onValueChange={setSortBy} value={sortBy}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="reports-desc">Most Reports</SelectItem>
              <SelectItem value="reports-asc">Fewest Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-center">Total Reports</TableHead>
                <TableHead>Last Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedReports.map((vendorReport) => (
                <TableRow key={vendorReport.vendorName}>
                  <TableCell className="font-medium">
                    {vendorReport.vendorName}
                  </TableCell>
                  <TableCell className="text-center">
                    {vendorReport.reportCount}
                  </TableCell>
                  <TableCell>
                    {format(new Date(vendorReport.reports[0].createdAt), "PPP")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default AdminReportsPage;
