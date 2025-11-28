"use client";

// Re-export Sonner toast function
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

// For compatibility, export a useToast hook that returns toast
// Note: Sonner doesn't have useToast, but we provide this for any components that might use it
export function useToast() {
  return {
    toast: sonnerToast,
  };
}
