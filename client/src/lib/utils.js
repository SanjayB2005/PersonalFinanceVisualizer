// filepath: /C:/Users/ADMIN/Desktop/mernStack/PersonalFinanceVisualizer1/client/src/lib/utils.js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}