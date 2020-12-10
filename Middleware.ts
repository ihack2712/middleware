// Imports
import type {
	CallbackBase,
	MiddlewareManager,
	MiddlewareCallback,
	Diagnostics,
	NextFn
} from "./types.ts";
import { Event } from "./deps.ts";

/** An object that allows for adding and running middleware. */
export class Middleware<Callback extends CallbackBase> implements MiddlewareManager<Callback> {

	/**
	 * Check if a value is a valid middleware.
	 * @param value The value to check.
	 */
	public static isMiddleware(value: unknown): boolean {
		if (typeof value === "function") return true;
		if (typeof value === "object" && value !== null && typeof (value as any).run === "function") return true;
		return false;
	}

	/** A set of middlewares. */
	#middlewares = new Set<MiddlewareCallback<Callback>>();

	/** An event that is fired after all middlewares of this this object has been ran. */
	public readonly ondiagnostics = new Event<[diagnostics: Diagnostics<Callback>]>();

	/**
	 * Add middlewares.
	 * @param args The middlewares to add.
	 */
	public use(...args: MiddlewareCallback<Callback>[]): this {
		for (const arg of args)
			if (Middleware.isMiddleware(arg))
				this.#middlewares.add(arg);
		return this;
	}

	/**
	 * Add middlewares.
	 * @param args The middlewares to add.
	 */
	public unuse(...args: MiddlewareCallback<Callback>[]): this {
		for (const arg of args)
			this.#middlewares.delete(arg);
		return this;
	}

	/**
	 * Run the middlewares stored on this object.
	 * @param args The arguments to pass to each middleware.
	 */
	public async run(...args: Parameters<Callback>): Promise<Diagnostics<Callback>> {
		const middleware = [...this.#middlewares];
		const diagnostics: Diagnostics<Callback> = {
			success: true,
			proxies: 0,
			ran: 0,
			total: middleware.length,
			totalRan: 0,
			discontinued: false,
			reachedLast: false,
			lastNextCalled: false
		};
		if (middleware.length < 1) {
			diagnostics.reachedLast = true;
			return diagnostics;
		}

		let position = 0;

		function createNextFunction(): NextFn {
			const mw = middleware[position];
			position++;
			const deadFn: NextFn = async d => {
				diagnostics.lastNextCalled = true;
				if (d !== true)
					deadFn.called = true
			};
			if (!mw) {
				diagnostics.reachedLast = true;
				return deadFn;
			}
			if (diagnostics.discontinued)
				return deadFn;
			if (typeof mw === "object" && mw !== null && typeof mw === "object") {
				const me: NextFn = async discontinue => {
					if (me.called) return;
					if (discontinue === true) {
						diagnostics.discontinued = true;
						return;
					}
					me.called = true;
					try {
						const next = createNextFunction();
						const d = await mw.run(...args, next);
						if (
							typeof d === "object" && d !== null
							&& typeof d.success === "boolean"
							&& typeof d.proxies === "number"
							&& typeof d.ran === "number"
							&& typeof d.total === "number"
							&& typeof d.totalRan === "number"
							&& typeof d.discontinued === "boolean"
							&& typeof d.reachedLast === "boolean"
							&& typeof d.lastNextCalled === "boolean"
						) {
							diagnostics.proxies++;
							diagnostics.total += d.total - 1;
							diagnostics.totalRan += d.totalRan;
							diagnostics.proxies += d.proxies;
							if (d.discontinued === true || d.reachedLast === false)
								diagnostics.discontinued = true;
							if (d.success === false) {
								const d2 = (d as unknown as Diagnostics<Callback> & { success: false });
								const d1 = (diagnostics as unknown as Diagnostics<Callback> & { success: false });
								d1.success = false;
								d1.error = d2.error;
								d1.middleware = d2.middleware;
								d1.proxy = d2.proxy || mw;
							}
							if (!diagnostics.discontinued && diagnostics.success)
								await next();
						} else {
							diagnostics.ran++;
						}
					} catch (error) {
						const d = (diagnostics as Diagnostics<Callback> & { success: false });
						if (d.success === false) return;
						d.success = false;
						d.error = error;
						d.middleware = mw;
						throw error;
					}
				};
				return me;
			}
			if (typeof mw === "function") {
				const me: NextFn = async discontinue => {
					if (me.called) return;
					if (discontinue === true) {
						diagnostics.discontinued = true;
						return;
					}
					me.called = true;
					try {
						diagnostics.ran++;
						diagnostics.totalRan++;
						await mw(...args, createNextFunction());
					} catch (error) {
						const d = (diagnostics as Diagnostics<Callback> & { success: false });
						d.success = false;
						d.error = error;
						d.middleware = mw;
						throw error;
					}
				};
				return me;
			}
			return deadFn;
		}

		const next = createNextFunction();

		try {
			await next();
		} catch (error) { }
		await this.ondiagnostics.dispatch(diagnostics);
		return diagnostics;
	}

}
