import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Users, Store, FileText, CheckCircle2, Clock } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Fetch overview statistics
const fetchOverviewStats = async () => {
  const { data } = await api.get("/admin/overview-stats");
  return data;
};

// Fetch all service requests for admin
const fetchAllServiceRequests = async () => {
  const { data } = await api.get("/admin/requests");
  return data;
};

// Fetch status summary analytics
const fetchStatusSummary = async () => {
  const { data } = await api.get("/admin/analytics/status-summary");
  return data;
};

// Fetch requests by service analytics
const fetchRequestsByService = async () => {
  const { data } = await api.get("/admin/analytics/requests-by-service");
  return data;
};

// Fetch request analytics over time
const fetchRequestAnalytics = async () => {
  const { data } = await api.get("/admin/analytics/requests?range=month");
  return data;
};

const AdminDashboardPage = () => {
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
  } = useQuery({
    queryKey: ["adminOverviewStats"],
    queryFn: fetchOverviewStats,
  });

  const {
    data: serviceRequests,
    isLoading: isLoadingRequests,
    isError: isErrorRequests,
  } = useQuery({
    queryKey: ["adminServiceRequests"],
    queryFn: fetchAllServiceRequests,
  });

  const {
    data: statusSummary,
    isLoading: isLoadingStatusSummary,
    isError: isErrorStatusSummary,
  } = useQuery({
    queryKey: ["statusSummary"],
    queryFn: fetchStatusSummary,
  });

  const {
    data: requestsByService,
    isLoading: isLoadingRequestsByService,
    isError: isErrorRequestsByService,
  } = useQuery({
    queryKey: ["requestsByService"],
    queryFn: fetchRequestsByService,
  });

  const {
    data: requestAnalytics,
    isLoading: isLoadingRequestAnalytics,
    isError: isErrorRequestAnalytics,
  } = useQuery({
    queryKey: ["requestAnalytics"],
    queryFn: fetchRequestAnalytics,
  });

  const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  if (isLoadingStats || isLoadingRequests || isLoadingStatusSummary || isLoadingRequestsByService || isLoadingRequestAnalytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-8 px-4">
          <p>Loading admin dashboard...</p>
        </main>
      </div>
    );
  }

  if (isErrorStats || isErrorRequests || isErrorStatusSummary || isErrorRequestsByService || isErrorRequestAnalytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-8 px-4">
          <p>Error fetching dashboard data.</p>
        </main>
      </div>
    );
  }

  // Format data for Pie Chart
  const pieChartData = statusSummary?.labels.map((label, index) => ({
    name: label,
    value: statusSummary.data[index],
  })) || [];

  // Format data for Bar Chart (requestsByService already in suitable format { name, count })
  const barChartData = requestsByService || [];

  // Format data for Line Chart
  const lineChartData = requestAnalytics?.labels.map((label, index) => ({
    name: label,
    requests: requestAnalytics.data[index],
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <Button asChild>
            <Link to="/admin/categories">Manage Categories</Link>
          </Button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Including customers and admins
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vendors
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVendors}</div>
              <p className="text-xs text-muted-foreground">
                Service Providers on platform
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalServiceRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                All time service requests
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalPendingRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Requests awaiting action
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Requests
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalCompletedRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully finished requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Service Request Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No status data available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requests by Service</CardTitle>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={barChartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No service request data available.</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2"> {/* Span full width on medium screens */}
            <CardHeader>
              <CardTitle>Monthly Service Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={lineChartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requests" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No monthly request data available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests Summary */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceRequests && serviceRequests.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {serviceRequests.slice(0, 5).map((req) => (
                    <li key={req._id}>
                      {req.service.name} by {req.user.name} (Status:{" "}
                      {req.status})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No requests found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;