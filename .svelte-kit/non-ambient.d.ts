
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/(embed)" | "/" | "/api" | "/api/graphql" | "/calendar" | "/reference" | "/reference/house" | "/(embed)/stats" | "/tasks";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/(embed)": Record<string, never>;
			"/": Record<string, never>;
			"/api": Record<string, never>;
			"/api/graphql": Record<string, never>;
			"/calendar": Record<string, never>;
			"/reference": Record<string, never>;
			"/reference/house": Record<string, never>;
			"/(embed)/stats": Record<string, never>;
			"/tasks": Record<string, never>
		};
		Pathname(): "/" | "/api/graphql" | "/calendar" | "/reference" | "/reference/house" | "/stats" | "/tasks";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}