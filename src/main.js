function MAIN($) {
	const tasks = [
		{ createLoop: $.createSeekLoop, delayMs: 500 },
		{ createLoop: $.createResizeLoop, delayMs: 100 }
	];
	const minDelayMs = 100;

	let loops = [];
	let n = 1;
	let max = Math.floor(Math.max(...tasks.map(it => it.delayMs)) / minDelayMs);
	let href = window.location.href;

	init();
	main();

	function init() {
		loops = [];
		for (let { createLoop, delayMs } of tasks) {
			let { init, main } = createLoop();
			loops.push({
				init,
				main,
				initDone: false,
				execAt: Math.floor(delayMs / minDelayMs)
			});
		}
	}

	function main() {
		let newHref = window.location.href;
		if (newHref !== href) {
			init();
			href = newHref;
		}
		for (let loop of loops) {
			if (!loop.initDone) {
				try {
					loop.init();
				} catch (e) {
					$.print(e);
					continue;
				}
				loop.initDone = true;
				loop.main();
				continue;
			}
			if (n % loop.execAt) continue;
			loop.main();
		}
		n = n === max ? 1 : n + 1;
		setTimeout(main, minDelayMs);
	}
}
