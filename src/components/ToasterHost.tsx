import React from "react";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";

export default function ToasterHost() {
  return (
    <Toaster position="top-center" richColors closeButton theme="system" />
  );
}