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
		getVideoDataNode: function() {
			let node = _yt_player;
			let path = $.findNode(node, (k, v) => k === "videoData").path;
			for (let key of path) {
				node = node[key];
			}
			return node;
		},
		findNode: function(obj, testFn, all = false) {
			let visited = new Set();
			let found = [];
			findNode(obj, testFn, visited, found, [], all);
			if (all) {
				return found;
			} else {
				return found[0] || null;
			}
		}
	});

	function findNode(obj, testFn, visited, found, path, all) {
		let key, value, entries, item, subPath;

		if (obj === null || obj === undefined || visited.has(obj)) return;
		visited.add(obj);

		if (Array.isArray(obj)) {
			entries = arrayEntries(obj);
		} else if (typeof obj === "object") {
			entries = objectEntries(Object(obj));
		} else {
			return;
		}

		for ([key, value] of entries) {
			key._isIndex = Array.isArray(obj);
			subPath = [...path, key];

			if (testFn(key, value)) {
				item = {
					value,
					path: subPath,
					access: subPath
						.map(k => {
							if (!k._isIndex) {
								k = `'${k}'`;
							}
							return `[${k}]`;
						})
						.join("")
				};
				found.push(item);
				if (!all) return;
			}

			findNode(value, testFn, visited, found, subPath, all);
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
