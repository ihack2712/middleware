export type NextFn = ((discontinue?: boolean) => Promise<void>) & { called?: true };
export type CallbackBase = (...args: any[]) => any;

export type MiddlewareFn<Callback extends CallbackBase> =
	(...args: [...args: Parameters<Callback>, next: NextFn]) => Promise<any> | any
export interface CallbackObject<Callback extends CallbackBase> {
	run: MiddlewareFn<Callback>;
}
export type MiddlewareCallback<Callback extends CallbackBase> =
	| MiddlewareFn<Callback>
	| CallbackObject<Callback>
	;

interface DiagnosticsProps {
	ran: number;
	proxies: number;
	total: number;
	totalRan: number;
	discontinued: boolean;
	reachedLast: boolean;
	lastNextCalled: boolean;
}

interface DiagnosticsSuccess extends DiagnosticsProps {
	success: true;
}

interface DiagnosticsFailure<Callback extends CallbackBase> extends DiagnosticsProps {
	success: false;
	error: Error;
	middleware: MiddlewareCallback<Callback>;
	proxy?: CallbackObject<Callback>;
}

/** Diagnostics information returned by a middleware object. */
export type Diagnostics<Callback extends CallbackBase> = DiagnosticsSuccess | DiagnosticsFailure<Callback>;

/** An object to add or remove callbacks. */
export interface MiddlewareManager<Callback extends CallbackBase> {
	/** Add callbacks to manager. */
	use(...args: MiddlewareCallback<Callback>[]): unknown;
	/** Remove callback from the manager. */
	unuse(...args: MiddlewareCallback<Callback>[]): unknown;
	/** Run the middlewares on this manager. */
	run(...args: [...Parameters<Callback>, NextFn | undefined | void]): Promise<void | Diagnostics<Callback>>;
}
