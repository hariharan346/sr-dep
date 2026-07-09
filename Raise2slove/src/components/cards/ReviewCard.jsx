import { Star } from "lucide-react";

export const ReviewCard = ({ review }) => {
  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-primary font-semibold">
              {review.customerName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{review.customerName}</p>
            <p className="text-xs text-muted-foreground">{review.createdAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.rating
                  ? "fill-warning text-warning"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
    </div>
  );
};
