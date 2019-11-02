function SEEK($) {
	let progressBar, seekKey;

	$.seekLoop = {
		init: function() {
			progressBar = document.getElementsByClassName("ytp-progress-bar")[0];
			if (!progressBar) {
				throw Error("Progress bar not loaded yet!");
			}
		},
		main: function() {
			let videoId = getCurrentVideoId();
			if (!videoId) {
				seekKey = null;
				return null;
			}
			let newSeekKey = "yt-magic/" + videoId;

			if (newSeekKey === seekKey) {
				try {
					saveSeekPos();
				} catch (e) {
					$.print(e);
				}
				return;
			}

			let seekValue = localStorage.getItem(newSeekKey);
			if (seekValue) {
				try {
					showSeekDialogIfRequired(seekValue);
				} catch (e) {
					$.print(e);
					return;
				}
			}

			seekKey = newSeekKey;
		}
	};

	function showSeekDialogIfRequired(seekValue) {
		let curSec = getCurrentVideoPosSec();
		let savedSec = getCurrentVideoDurationSec() * seekValue;

		if (savedSec - 2.5 <= curSec && curSec <= savedSec + 2.5) {
			$.print(
				"Not showing seek dialog, because video is already at a good position:",
				curSec,
				"vs",
				savedSec
			);
			return;
		}

		let duration = Math.floor(savedSec / 60) + ":" + Math.floor(savedSec % 60);

		document.getElementById("movie_player").insertAdjacentHTML(
			"beforeend",
			`<style>
			#yt-magic-confirm-dialog {
				z-index: 999; 
				position: absolute;
				text-align: center;
				left: 50%;
				transform: translate(-50%, 20%); 
				padding: 10px;
				background: #424242;
				border-radius: 10px;
				box-shadow: 5px 10px;
				font-size: 20pt;
				font-family: sans-serif;
			}
			#yt-magic-confirm-dialog button {  
				font-size: 18pt;
				padding: 2px 10px;
				margin: 10px 5px 0 5px ;
				border-radius: 10px;
			}
		</style>
		<div data-layer=9 id=yt-magic-confirm-dialog>
			<div>Hey! Would you like resume @ ${duration}?</div>
			<div style='font-size: 10pt;'>(click elsewhere to hide me)</div>
			<button style="background-color: #ffab91;" id=yt-magic-confirm-seek-no>
				Nope
			</button>
			<button style="background-color: #80deea;" id=yt-magic-confirm-seek-yes>
				Sure
			</button>
		</div>`
		);

		$.print("Showed seek dialog @", $.prettyPercent(seekValue));

		let confirmDialog = document.getElementById("yt-magic-confirm-dialog");
		let confirmNo = document.getElementById("yt-magic-confirm-seek-no");
		let confirmYes = document.getElementById("yt-magic-confirm-seek-yes");

		let events = [
			[window, "popstate", no],
			[confirmNo, "click", no],
			[confirmYes, "click", yes],
			[window, "click", onClickOutside],
			[document, "keydown", anyKeyPress]
		];

		for (let event of events) {
			event[0].addEventListener(event[1], event[2]);
		}

		function no() {
			confirmDialog.remove();
			for (let event of events) {
				event[0].removeEventListener(event[1], event[2]);
			}
		}

		function yes() {
			doSeek(seekValue);
			no();
		}

		function onClickOutside(e) {
			if (confirmDialog.contains(e.target)) return;
			no();
		}

		function anyKeyPress(e) {
			if (e.code === "Enter" || e.code === "NumpadEnter") {
				yes();
			} else if (e.code === "Escape") {
				no();
			}
		}
	}

	function doSeek(seekValue) {
		let mouseEventInit;

		let rect = progressBar.getBoundingClientRect();
		mouseEventInit = {
			view: window,
			bubbles: true,
			cancelable: false,
			clientX: rect.x + seekValue * progressBar.offsetWidth,
			clientY: rect.y
		};

		for (let evtType of ["mousedown", "mouseup"]) {
			progressBar.dispatchEvent(new MouseEvent(evtType, mouseEventInit));
		}
		$.print("Did seek:", $.prettyPercent(seekValue));
	}

	function saveSeekPos() {
		let seekValue;
		try {
			seekValue = getCurrentSeekValue();
		} catch (e) {
			$.print(e);
		}
		if (!seekValue || seekValue <= 0 || seekValue >= 1) {
			return;
		}
		localStorage.setItem(seekKey, seekValue);
		// $.print("Save seek position:", $.prettyPercent(seekValue), "for", seekKey);
	}

	function getCurrentVideoId() {
		return new URLSearchParams(window.location.search).get("v");
	}

	function getCurrentSeekValue() {
		return getCurrentVideoPosSec() / getCurrentVideoDurationSec();
	}

	let _videoPosCache;

	function getCurrentVideoPosSec() {
		if (!_videoPosCache || Date.now() - _videoPosCache.timestamp > 2500) {
			_videoPosCache = $.findNode(
				$.ytPlayer,
				(k, v) => v && v.constructor && v.constructor.name === "Sea"
			).next().value;
			_videoPosCache.timestamp = Date.now();
		}
		let values = Object.values(_videoPosCache.value).filter(
			v => typeof v === "number"
		);
		let min = Math.min(...values);
		if (!min) {
			throw Error("Current video position not found!");
		}
		return min;
	}

	let _videoDurationCache;

	function getCurrentVideoDurationSec() {
		if (
			!_videoDurationCache ||
			Date.now() - _videoDurationCache.timestamp > 2500
		) {
			_videoDurationCache = $.findNode(
				$.ytPlayer,
				(k, v) => v && typeof v === "number" && k === "lengthSeconds"
			).next().value;
			_videoDurationCache.timestamp = Date.now();
		}
		return _videoDurationCache.value;
	}

	return $;
}
