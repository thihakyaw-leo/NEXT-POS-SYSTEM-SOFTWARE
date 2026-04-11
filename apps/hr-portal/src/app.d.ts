/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

declare global {
	namespace App {
		// interface Error {}
		interface SessionUser {
			userId: string;
			username: string;
			role: string;
			employeeId: string | null;
		}

		interface Locals {
			auth(): Promise<SessionUser | null>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Shim for legacy svelteHTML namespace often accessed by IDEs
	declare namespace svelteHTML {
		interface HTMLAttributes<T> extends Record<string, any> {}
	}
}

// Explicit module declaration for Lucide to help IDE resolution
declare module '@lucide/svelte' {
	export const Users: any;
	export const Briefcase: any;
	export const CreditCard: any;
	export const Target: any;
	export const TrendingUp: any;
	export const Bell: any;
	export const Calendar: any;
	export const ArrowUpRight: any;
	export const Loader2: any;
	export const ShieldCheck: any;
	export const Award: any;
	export const Clock: any;
	export const Activity: any;
	export const Globe: any;
	export const Download: any;
	export const PieChart: any;
	export const BarChart3: any;
	export const AlertCircle: any;
	export const CheckCircle2: any;
}

export {};