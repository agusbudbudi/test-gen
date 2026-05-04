import { useToastStore, Toast as ToastType } from "@/stores/toastStore";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const Toast = ({ toast }: { toast: ToastType }) => {
  const removeToast = useToastStore((state) => state.removeToast);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const styles = {
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800/50",
      text: "text-emerald-800 dark:text-emerald-300",
      icon: (
        <CheckCircle
          className="text-emerald-500 dark:text-emerald-400"
          size={20}
        />
      ),
      btn: "text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/40",
      border: "border-red-200 dark:border-red-800/50",
      text: "text-red-800 dark:text-red-300",
      icon: <XCircle className="text-red-500 dark:text-red-400" size={20} />,
      btn: "text-red-400 hover:text-red-600 dark:hover:text-red-200",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800/50",
      text: "text-amber-800 dark:text-amber-300",
      icon: (
        <AlertTriangle
          className="text-amber-500 dark:text-amber-400"
          size={20}
        />
      ),
      btn: "text-amber-400 hover:text-amber-600 dark:hover:text-amber-200",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800/50",
      text: "text-blue-800 dark:text-blue-300",
      icon: <Info className="text-blue-500 dark:text-blue-400" size={20} />,
      btn: "text-blue-400 hover:text-blue-600 dark:hover:text-blue-200",
    },
  };

  const currentStyle = styles[toast.type] || styles.info;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl shadow-xl border transition-all duration-300 transform backdrop-blur-sm",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
        currentStyle.bg,
        currentStyle.border,
        "min-w-[320px] max-w-md",
      )}
    >
      <div className="flex-shrink-0">{currentStyle.icon}</div>
      <p
        className={cn(
          "flex-1 text-sm font-medium tracking-tight",
          currentStyle.text,
        )}
      >
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className={cn("transition-colors", currentStyle.btn)}
      >
        <X size={18} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
