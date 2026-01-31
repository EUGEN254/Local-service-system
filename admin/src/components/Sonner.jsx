import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
  return (
    <Sonner
      position="top-right"
      duration={1000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success: "!bg-green-600 !text-white border-green-700",
          error: "!bg-red-600 !text-white border-red-700",
          info: "!bg-blue-600 !text-white border-blue-700",
          warning: "!bg-yellow-600 !text-white border-yellow-700",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
