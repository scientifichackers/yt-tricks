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

	let _result;

	function getCurrentVideoPosSec() {
		if (!_result || Date.now() - _result.timestamp > 2500) {
			let appNode = $.getPubSubInstance();
			try {
				for (let key of _result._appPathCache) {
					appNode = appNode[key];
				}
			} catch {
				appNode = null;
			}
			if (appNode) {
				_result = $.findNode(appNode, k => k === "videoData");
			} else {
				_result = $.findNode($.getPubSubInstance(), k => k === "videoData");
				_result._appPathCache = _result.path.slice(
					0,
					_result.path.indexOf("app") + 1
				);
			}
			_result.timestamp = Date.now();
		}
		return _result.value.cg;
	}

	// A pesky hack
	// The total video duration seems to hide at a few known places
	// So try em' all
	function getCurrentVideoDurationSec() {
		try {
			return $.getPubSubInstance()["subscriptions_"]["24"]["da"]["0"]["target"][
				"app"
			]["w"]["w"]["Tb"]["o"]["30"]["S"]["lengthSeconds"];
		} catch {}

		try {
			return $.getPubSubInstance()["subscriptions_"]["24"]["da"]["0"]["target"][
				"app"
			]["u"]["G"]["Tb"]["o"]["3"]["Tb"]["o"]["12"]["context"]["videoData"][
				"Tb"
			]["o"]["3"]["w"]["B"]["duration"];
		} catch {}

		return $.getPubSubInstance()["o"]["3"]["da"]["0"]["target"]["app"]["w"][
			"w"
		]["Tb"]["o"]["30"]["S"]["ia"]["duration"];
	}

	return $;
}
