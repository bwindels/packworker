const BUNDLE_URL = "./bundle.zip";

self.onfetch = function(event) {
	event.respondWith(caches.open("bundle-v1").then(cache => {
		console.log(event.request.url);
		return cache.match(event.request) || fetch(event.request);
	}));
}

self.onactivate = function(event) {
	event.waitUntil(clients.claim());
}

self.oninstall = function(event) {
	event.waitUntil(fetch(BUNDLE_URL).then(response => {
		if (response.status !== 200) {
			throw new Error(`got ${response.status}`);
		}
		return response;
	}).then(zipToCache));
}

async function zipToCache(response) {
	const buffer = await response.arrayBuffer();
	const entries = readZIP(buffer);
	const cache = await caches.open("bundle-v1");
	await Promise.all(entries.map(e => {
		const compressedData = getData(e, buffer);
		console.log("filling cache for " + e.filename);
		return cache.put(e.filename, new Response(compressedData, {
			"Content-Encoding": "deflate",
			"Content-Type": getContentType(e.filename)
		}));
	}));
}

const mimeTypes = {
	"png": "image/png",
	"svg": "image/svg",
	"css": "text/css",
	"js": "application/javascript",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"htm": "text/html",
	"html": "text/html",
}

function getContentType(filename) {
	const parts = filename.split(".");
	const ext = parts[parts.length - 1].toLowerCase();
	return mimeTypes[ext];
}

function readZIP(buffer) {
	const cd = readEOCD(buffer);
	let cdBuffer = buffer.slice(cd.offset);
	const entries = [];
	for (let i = 0; i < cd.numFiles; ++i) {
		const entry = readCDEntry(cdBuffer);
		entries.push(entry);
		cdBuffer = cdBuffer.slice(entry.len);
	}
	return entries;
}

function getData(entry, buffer) {
	const view = new DataView(buffer.slice(entry.offset));
	const header = view.getUint32(0, true);
	if (header !== 0x4034b50) {
		throw new Error("invalid file header");
	}
	const nameLen = view.getUint16(26, true);
	const extraLen = view.getUint16(28, true);
	const dataOffset = 30 + nameLen + extraLen;
	const data = buffer.slice(entry.offset + dataOffset,
		entry.offset + dataOffset + entry.compressedSize);
	return data;
}

function readEOCD(buffer) {
	const size = buffer.byteLength;
	const slice = buffer.slice(size - 22, size);
	const view = new DataView(slice);
	const eocd = view.getUint32(0, true);
	if (eocd !== 0x06054B50) {
		throw new Error("invalid eocd header");
	}
	const commentLen = view.getUint16(20, true);
	const numFiles = view.getUint16(10, true);
	const offset = view.getUint32(16, true);
	return {offset, commentLen, numFiles};
}

function readCDEntry(slice) {
	const view = new DataView(slice);
	const header = view.getUint32(0, true);
	if (header !== 0x02014b50) {
		throw new Error("invalid cd entry header");
	}

	const filenameLength = view.getUint16(28, true);
	const extraLength = view.getUint16(30, true);
	const commentLength = view.getUint16(32, true);
	const len = filenameLength + commentLength + extraLength + 46;
	const decoder = new TextDecoder("utf-8");
	const filename = decoder.decode(slice.slice(46, 46 + filenameLength));
	const compressedSize = view.getUint32(20, true);
	const uncompressedSize = view.getUint32(24, true);
	const compression = view.getUint16(10, true);
	const offset = view.getUint32(42, true);
	return {
		len,
		filename,
		compressedSize,
		uncompressedSize,
		compression,
		offset
	};
}