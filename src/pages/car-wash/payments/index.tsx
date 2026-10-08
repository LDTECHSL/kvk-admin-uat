import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCarWashPayments } from "@/services/car-wash-api";

const paymentMethodLabel = (method: number) => {
  switch (method) {
    case 1:
      return "Cash";
    case 2:
      return "Card";
    case 3:
      return "Bank Transfer";
    case 4:
      return "Online";
    default:
      return "Unknown";
  }
};

const vehicleTypeLabel = (type: number) => {
  switch (type) {
    case 1:
      return "Car";
    case 2:
      return "Truck";
    case 3:
      return "Van";
    case 4:
      return "Jeep";
    case 5:
      return "Lorry";
    case 6:
      return "Bike";
    default:
      return "Unknown";
  }
};

export default function CarWashPayments() {
  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useFeedbackState<string>("", "error");

  const formatLkr = (amount: number) =>
    `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    loadPayments();
  }, [selectedDate]);

  const loadPayments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCarWashPayments(selectedDate, selectedDate);

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped = Array.isArray(rows)
        ? rows
            .filter((order: any) => order.isPaid)
            .map((order: any) => ({
              id: order.carWashOrderId,
              orderNumber: order.orderNumber ?? "",
              customerName: order.customerName || "Walk-in",
              vehicleNumber: order.vehicleNumber || "-",
              vehicleType: vehicleTypeLabel(order.vehicleType),
              amount: Number(order.discountedTotalAmount ?? 0),
              date: order.orderDate,
              method: paymentMethodLabel(order.paymentMethod),
            }))
        : [];

      setPayments(mapped);
    } catch {
      setPayments([]);
      setError("Failed to load payments for the selected date.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPayments = payments.filter((payment) => {
    if (!normalizedSearchTerm) return true;

    return [payment.customerName, payment.vehicleNumber, payment.orderNumber, payment.method]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const total = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filteredPayments.slice(start, start + pageSize);

  const exportPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Car Wash Payment Report", 14, 20);

    doc.setFontSize(10);
    doc.text(`Date: ${selectedDate}`, 14, 28);

    autoTable(doc, {
      startY: 45,
      head: [["Order No", "Customer", "Vehicle", "Amount", "Method"]],
      body: filteredPayments.map((payment) => [
        payment.orderNumber,
        payment.customerName,
        payment.vehicleNumber,
        formatLkr(payment.amount),
        payment.method,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 107, 225] },
    });

    doc.save(`car-wash-payments-${selectedDate}.pdf`);
  };

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-heading">
                Payments
              </h1>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                Car Wash
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Search, review and export car wash payment records
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="field-control w-full outline-none text-sm"
                placeholder="Search by customer, vehicle, order no, or method..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportPdf}
              className="action-primary flex items-center gap-2 px-3 py-2.5 bg-blue-700 text-white rounded cursor-pointer transition-all duration-300 text-sm hover:shadow-lg hover:bg-blue-800"
            >
              <Download size={14} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="surface-panel bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div className="px-4 py-2 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-gray-600">
              Showing payments for{" "}
              <span className="font-medium text-gray-900">{selectedDate}</span>
            </div>

            <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <span className="text-gray-500">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setPage(1);
                }}
                className="field-control outline-none text-sm text-gray-900"
              />
            </label>
          </div>

          <div className="px-4 py-3">
            <div className="overflow-x-auto">
              <table className="data-table w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-600 border-b border-gray-100">
                    <th className="py-2 px-3">ORDER NO</th>
                    <th className="py-2 px-3">CUSTOMER</th>
                    <th className="py-2 px-3">VEHICLE</th>
                    <th className="py-2 px-3">AMOUNT</th>
                    <th className="py-2 px-3">METHOD</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        Loading payments...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        No payments found for this date.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-100 transition-colors duration-300 hover:bg-gray-50/80"
                      >
                        <td className="py-2 px-3 align-top text-gray-700">
                          {payment.orderNumber}
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.customerName}
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top text-gray-700">
                          {payment.vehicleNumber}
                          <span className="ml-1 text-xs text-gray-400">
                            ({payment.vehicleType})
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top font-medium text-gray-900">
                          {formatLkr(payment.amount)}
                        </td>
                        <td className="py-2 px-3 align-top">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {payment.method}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {total === 0 ? 0 : start + 1} to{" "}
              {Math.min(start + pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Rows:</label>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="field-control border rounded-md px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="action-secondary px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50 transition-all duration-300 hover:shadow-sm hover:bg-gray-50"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index + 1)}
                    className={`cursor-pointer px-2 py-1 text-sm rounded-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${page === index + 1 ? "bg-gray-900 text-white" : "bg-white border hover:bg-gray-50"}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="action-secondary px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50 transition-all duration-300 hover:shadow-sm hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
