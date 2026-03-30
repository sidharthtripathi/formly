"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/builder/Sidebar";
import { motion } from "framer-motion";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        className="lg:pl-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.main>
    </div>
  );
}
