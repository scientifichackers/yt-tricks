function RESIZE($) {
	let origTooltip, customTooltip, container, bg;

	$.resizeLoop = {
		init: function() {
			if (origTooltip) return;
			origTooltip = document.getElementsByClassName("ytp-tooltip-bg")[0];

			customTooltip = origTooltip.cloneNode();
			origTooltip.classList.add("display-none");

			container = origTooltip.parentNode;
			container.insertBefore(customTooltip, origTooltip.nextSibling);
		},
		main: function() {
			if (origTooltip.style.display === "none") return;

			let nextBg = origTooltip.style.background;
			if (!nextBg || bg === nextBg) return;

			let parts = nextBg.split(" ");
			for (let i of [1, 2, 4, 5]) {
				parts[i] = $.scalePx(parts[i]);
			}

			container.style.height = $.scalePx(origTooltip.style.height);
			container.style.width = $.scalePx(origTooltip.style.width);
			customTooltip.style.background = parts.join(" ");
			// $.print(`Made preview ${$.scaleFactor}x larger`);

			bg = nextBg;
		}
	};

	return $;
}
