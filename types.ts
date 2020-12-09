export type NextFn = ((discontinue?: boolean) => Promise<void>) & { called?: true };
export type CallbackBase = (...args: any[]) => any;
export interface CallbackObject<Callback extends CallbackBase> {
	run(...args: Parameters<Callback>): Promise<Diagnostics<Callback>>;
}
export type MiddlewareCallback<Callback extends CallbackBase> =
	((next: NextFn, ...args: Parameters<Callback>) =>
		Promise<unknown> | unknown) | CallbackObject<Callback>;

interface DiagnosticsProps {
	ran: number;
	proxies: number;
	total: number;
	totalRan: number;
	discontinued: boolean;
	reachedLast: boolean;
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
export interface MiddlewareManager<Callback extends CallbackBase> extends CallbackObject<Callback> {
	/** Add callbacks to manager. */
	use(...args: MiddlewareCallback<Callback>[]): unknown;
	/** Remove callback from the manager. */
	unuse(...args: MiddlewareCallback<Callback>[]): unknown;
}
