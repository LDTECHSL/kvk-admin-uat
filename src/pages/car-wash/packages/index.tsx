import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Clock,
  ImageOff,
  CheckCircle2,
  XCircle,
  ListChecks,
} from "lucide-react";
import { getCarWashPackages } from "@/services/car-wash-api";

type PackageService = {
  id: string;
  title: string;
  price: number;
};

type Package = {
  id: string;
  title: string;
  description: string;
  durationInMinutes: number;
  basPrice: number;
  pricesWithoutDiscounts: number;
  isActive: boolean;
  image: string | null;
  services: PackageService[];
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CarWashPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCarWashPackages();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Package[] = Array.isArray(rows)
        ? rows.map((pkg: any) => ({
            id: pkg.id,
            title: pkg.title ?? "",
            description: pkg.description ?? "",
            durationInMinutes: Number(pkg.durationInMinutes ?? 0),
            basPrice: Number(pkg.basPrice ?? 0),
            pricesWithoutDiscounts: Number(pkg.pricesWithoutDiscounts ?? 0),
            isActive: !!pkg.isActive,
            image: pkg.image || null,
            services: Array.isArray(pkg.services)
              ? pkg.services.map((service: any) => ({
                  id: service.id,
                  title: service.title ?? "",
                  price: Number(service.price ?? 0),
                }))
              : [],
          }))
        : [];

      setPackages(mapped);
    } catch {
      setPackages([]);
      setError("Failed to load packages.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPackages = packages.filter((pkg) => {
    if (statusFilter === "active" && !pkg.isActive) return false;
    if (statusFilter === "inactive" && pkg.isActive) return false;
    if (!normalizedSearchTerm) return true;

    return [pkg.title, pkg.description, ...pkg.services.map((s) => s.title)]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-heading">Packages</h1>
            <p className="text-sm text-gray-500 mt-1">View all car wash packages</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[240px] items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="field-control w-full outline-none text-sm"
                placeholder="Search by title, description, or service..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="field-control rounded-md border border-gray-200 px-2 py-2 text-sm text-gray-700"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading packages...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No packages found.
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="surface-panel group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 to-gray-50">
                  {pkg.image ? (
                    <img
                      src={`data:image/jpeg;base64,${pkg.image}`}
                      alt={pkg.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ImageOff size={28} className="text-gray-300" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{pkg.title}</h3>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        pkg.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {pkg.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-xl font-bold text-blue-900">{formatLkr(pkg.basPrice)}</p>
                    {pkg.pricesWithoutDiscounts > pkg.basPrice && (
                      <p className="text-sm text-gray-400 line-through">
                        {formatLkr(pkg.pricesWithoutDiscounts)}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock size={14} />
                    {pkg.durationInMinutes} min
                  </div>

                  {pkg.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                  )}

                  {pkg.services.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <ListChecks size={12} />
                        Included Services
                      </div>
                      {pkg.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between text-sm text-gray-700"
                        >
                          <span>{service.title}</span>
                          <span className="text-gray-400">{formatLkr(service.price)}</span>
                        </div>
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
