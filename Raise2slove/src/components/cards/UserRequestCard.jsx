import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle, Store } from "lucide-react";

function UserRequestCard({ request }) {
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

    return (
        <Link to={`/request/${request._id}`} className="block">
            <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-foreground">
                        {request.service.name}
                    </h3>
                    {getStatusBadge(request.status)}
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                    {request.description}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>
                        Requested on{" "}
                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </p>
                    {request.vendor && (
                        <div className="flex items-center gap-1">
                            <Store className="w-4 h-4" />
                            <span>{request.vendor.companyName}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default UserRequestCard;
