# Middleware

If you're gonna implement middlewares, you should do it right! ;)

```ts
import Middleware from "https://deno.land/x/middleware/mod.ts";

class Greeter extends Middleware<(person: string) => any> {
	public async greet (name: string) {
		await super.run(name);
	}
}

const myGreeter = new Greeter();

myGreeter.use(
	async (next, person) => {
		console.log("Hello", person);
		await next();
		console.log("Bye", person);
	},
	async (next, person) => {
		console.log(person, "walked into the room!");
	}
);

myGreeter.greet("John");
// Hello John
// John walked into the room!
// Bye John
```

You can also use an object that has a run function.

```ts
myGreeter.use({
	run: async (next, person) =>
		console.log("Hóla", person);
});
```

You can even unuse any middleware at any time!

```ts
const myMiddleware = async (next: NextFn, person: string) =>
	console.log("Hóla", person);

myGreeter.use(myMiddleware);

// Later on...
myGreeter.unuse(myMiddleware);
```

You can even get diagnostics information!

```ts
myGreeter.ondiagnostics.subscribe(console.log);
```
