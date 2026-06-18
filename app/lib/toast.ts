// Small SweetAlert2 toast helpers for CRUD feedback (add / edit / delete).
// Theme-aware so it matches light/dark mode.

import Swal from "sweetalert2";

function colors() {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    background: dark ? "#18181b" : "#ffffff",
    color: dark ? "#fafafa" : "#18181b",
  };
}

function fire(icon: "success" | "error", title: string) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    ...colors(),
  });
}

export function toastSuccess(title: string) {
  fire("success", title);
}

export function toastError(title: string) {
  fire("error", title);
}
