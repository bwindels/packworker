export function greet(greeting, name) {
	return `${greeting}, ${name} on ${Date.now()}!`;
}

export function loadStyleSheet(src) {;
	const link = document.createElement("link");
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("type", "text/css");
	link.setAttribute("href", src);
	document.head.appendChild(link);
}