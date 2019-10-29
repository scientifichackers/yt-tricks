function UTIL($) {
	Object.assign($, {
		print: function(...args) {
			console.log("[yt-magic]", ...args);
		},
		scalePx: function(str) {
			return parseInt(str.slice(0, -2)) * $.scaleFactor + "px";
		},
		prettyPercent: function(seek) {
			return (seek * 100).toFixed(2) + "%";
		},
		findNode: function(obj, testFn) {
			return findNode(obj, testFn, new Set(), []);
		}
	});

	function findNode(obj, testFn, visited, path) {
		if (!obj || visited.has(obj)) return;
		visited.add(obj);

		let entries;
		if (Array.isArray(obj)) {
			entries = arrayEntries(obj);
		} else if (typeof obj === "object") {
			entries = objectEntries(Object(obj));
		} else {
			return;
		}

		for (let [key, value] of entries) {
			let subPath = [...path, key];
			if (testFn(key, value)) {
				return { value, path: subPath };
			}
			let node = findNode(value, testFn, visited, subPath);
			if (node) {
				return node;
			}
		}
	}

	function* objectEntries(obj) {
		for (let prop in obj) {
			if (!Object.prototype.hasOwnProperty.call(obj, prop)) continue;
			yield [prop, obj[prop]];
		}
	}

	function* arrayEntries(arr) {
		for (let i = 0; i < arr.length; i++) {
			yield [i, arr[i]];
		}
	}

	return $;
}
