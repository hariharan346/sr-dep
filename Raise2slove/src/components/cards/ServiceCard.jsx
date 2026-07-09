import { Link } from "react-router-dom";
import api from "@/lib/axios";

export const ServiceCard = ({ service, index = 0 }) => {


  return (
    <Link
      to={`/service/${service.slug}`}
      className="group block"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="bg-card rounded-xl p-5 border border-border card-hover h-full">
        <div className="flex items-start gap-4">
          <img
            src={service.image ? `http://localhost:5000${service.image}` : '/placeholder.png'}
            alt={service.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {service.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {service.category?.name ?? "General Service"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
