import {greet, loadStyleSheet} from './util.js';

export function main() {
	loadStyleSheet("./main.css");
	document.body.appendChild(document.createTextNode(greet('hello', "Bruno")));
}

main();