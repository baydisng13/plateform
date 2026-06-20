import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatETB = (n: number) =>
	`${new Intl.NumberFormat("en-US").format(Math.round(n))} ETB`;
