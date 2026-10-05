import { useEffect, useState } from "react";
import { Search, Loader2, Clock, Tag, ImageOff } from "lucide-react";
import { getCarWashServices } from "@/services/car-wash-api";

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  durationInMinutes: number;
  serviceCategory: number;
  features: string;
  image: string | null;
};

const serviceCategoryLabel = (category: number) => {
  switch (category) {
    case 1:
      return "Car Wash";
    case 2:
      return "Car";
    default:
      return "Other";
  }
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CarWashServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCarWashServices();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Service[] = Array.isArray(rows)
        ? rows.map((service: any) => ({
            id: service.id,
            title: service.title ?? "",
            description: service.description ?? "",
            price: Number(service.price ?? 0),
            durationInMinutes: Number(service.durationInMinutes ?? 0),
            serviceCategory: Number(service.serviceCategory ?? 1),
            features: service.features ?? "",
            image: service.image || null,
          }))
        : [];

      setServices(mapped);
    } catch {
      setServices([]);
      setError("Failed to load services.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredServices = services.filter((service) => {
    if (!normalizedSearchTerm) return true;

    return [service.title, service.description, service.features]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-heading">Services</h1>
            <p className="text-sm text-gray-500 mt-1">View all car wash services</p>
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="field-control w-full outline-none text-sm"
                placeholder="Search by title, description, or features..."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading services...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No services found.
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="surface-panel group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-gray-50">
                  {service.image ? (
                    <img
                      src={`data:image/jpeg;base64,${service.image}`}
                      alt={service.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ImageOff size={28} className="text-gray-300" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{service.title}</h3>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {serviceCategoryLabel(service.serviceCategory)}
                    </span>
                  </div>

                  <p className="mt-1 text-xl font-bold text-blue-900">
                    {formatLkr(service.price)}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock size={14} />
                    {service.durationInMinutes} min
                  </div>

                  {service.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {service.features && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {service.features
                        .split(",")
                        .map((feature) => feature.trim())
                        .filter(Boolean)
                        .map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                          >
                            <Tag size={10} />
                            {feature}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
