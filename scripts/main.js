geotab.addin.oemAdd = function() {
    'use strict';
	
	let init = async function(api) {
		let oemList = await grabOEMProviders(api);
		let oemAddSelected = document.getElementById("oemAddSelected");
		let oemAddAll = document.getElementById("oemAddAll");
		let oemHelpBtn = document.getElementById("oemHelpButton");
		
		oemAddSelected.disabled = false;
		oemAddAll.disabled = false;
		oemAddSelected.addEventListener("click", async function() {
			let selectedProviders = getSelectedProviders();
			if (selectedProviders.length === 0) {
				errorHandler("Please select at least one OEM provider!");
			} else {
				let resultList = [];
				enableElement(document.getElementById("oemProgressBox"));
				await addCreds(selectedProviders, oemList, resultList, api, selectedProviders.length, 0); 
			}
		});
		oemAddAll.addEventListener("click", async function() {
			let allProviders = getAllProviders();
			if (allProviders.length === 0) {
				errorHandler("It seems there are no available OEM providers to add");
			} else {
				let resultList = [];
				enableElement(document.getElementById("oemProgressBox"));
				await addCreds(allProviders, oemList, resultList, api, allProviders.length, 0);
			}
		});
		oemHelpBtn.addEventListener("click", async function() {
			setDialog("open", {
				title: "Help",
				content: "This page allows administrators to add OEM credentials to the MyGeotab database."
			});
		});
		populateSelectBox((oemList));
	};
	
	let getSelectedProviders = function() {
		let oemList = document.getElementById("oemProviders");
		let selectedProviders = [];
		for (let oemOpt = 0; oemOpt < oemList.length; oemOpt++) {
			let curOpt = oemList[oemOpt];
			if (curOpt.selected) {
				selectedProviders.push(parseInt(curOpt.id));
			}
		}
		return selectedProviders;
	};
	
	let getAllProviders = function() {
		let oemList = document.getElementById("oemProviders");
		let allProviders = [];
		for (let oemOpt = 0; oemOpt < oemList.length; oemOpt++) {
			let curOpt = oemList[oemOpt];
			allProviders.push(parseInt(curOpt.id));
		}
		return allProviders;
	};
	
	let errorHandler = function(msg) {
		let errorMessageTimer;
		let errorBox = document.getElementById("oemErrorBox");
		let alertError = document.getElementById("oemErrorLabel");
		alertError.textContent = msg;
		errorBox.classList.remove("hidden");
		clearTimeout(errorMessageTimer);
		errorMessageTimer = setTimeout(function () {
			errorBox.classList.add("hidden");
		}, 6000);
	};
	
	let progressHandler = function(msg, progress) {
		let progressValue = document.getElementById("oemProgressBar");
		let progressText = document.getElementById("oemProgressLabel");
		progressText.textContent = msg;
		progressValue.value = Math.round(progress*100);
	};

    let grabOEMProviders = function(api) {
		return new Promise(function(resolve, reject) {
			api.call("GetOEMCredentialsSchema", {
				"oemUrl":"https://support19.geotab.com" 
			}, function(result) {
				resolve(result);
			}, function(e) {
				resolve(e);
			});
		});
    };
	
	let populateSelectBox = function(oemData) {
		let oemList = document.getElementById("oemProviders");
		oemList.options.length = 0;
		oemList.size = oemData.length+1;
		for (let providerIndex = 0; providerIndex < oemData.length; providerIndex++) {
			let providerOption = document.createElement("option");
			providerOption.text = oemData[providerIndex].dataSourceName;
			providerOption.id = oemData[providerIndex].dataSourceId;
			oemList.add(providerOption);
		}
	};
	
	let getArrayIndex = function(id, data) {
		for (let propIndex = 0; propIndex < data.length; propIndex++) {
			if (data[propIndex].dataSourceId === id) {
				return propIndex;
			}
		}
	};
	
	let addCreds = async function(selections, data, results, api, loadSize, previousProgress) {
		let curId = selections.pop();
		let arrInd = getArrayIndex(curId, data);
		progressHandler("Adding " + data[arrInd].dataSourceName + " to the database...", previousProgress);
		let curProgress = (loadSize - selections.length)/loadSize;
		let addResult = await addOEMProviders(api, data[arrInd]);
		if (addResult === "Exception: Exception with adding OEM Credentials: There is an internal server error with the OEM Registry.") {
			errorHandler("Credentials for " + data[arrInd].dataSourceName + " may already have been added to the database.");
			progressHandler("Failed to add " + data[arrInd].dataSourceName + " to the database.", curProgress);
		} else {
			progressHandler("Successfully added " + data[arrInd].dataSourceName + " to the database.", curProgress);
		}
		results.push(addResult);
		if (selections.length > 0) {
			addCreds(selections, data, results, api, loadSize, curProgress);
		} else {
			progressHandler("Finished adding credentials!", curProgress);
			setTimeout(function () {
				disableElement(document.getElementById("oemProgressLabel"));
				disableElement(document.getElementById("oemProgressBox"));
			}, 6000);
		}	
	};

    let addOEMProviders = function(api, providerObj) {
		return new Promise(function(resolve, reject) {
			let providerPayload = [
				{
					"datasourceid": providerObj.dataSourceId,
					"userinfo": providerObj.userInfoSchema
				}
			];
			api.call("AddOEMCredentials", {
				"oemCredentials": providerPayload,
				"oemUrl":"https://support19.geotab.com"
			}, function(result) {
				resolve(result);
			}, function(e) {
				resolve(e);
			});
		});
    };

    let enableElement = function(elem) {
		elem.classList.remove("hidden");
    };

    let disableElement = function(elem) {
		elem.classList.add("hidden");
    };

	(function(a, b) {

		var maximize = false,
			dialog = document.getElementById('dialogBoxOem'), // The HTML of dialog box
			dialog_title = dialog.children[0],
			dialog_minmax = dialog.children[1],
			dialog_close = dialog.children[2],
			dialog_content = dialog.children[3],
			dialog_action = dialog.children[4],
			dialog_overlay = document.getElementById('dialogOemOverlay');

		a.setDialog = function(set, config) {

			var selected = null, // Object of the element to be moved
				x_pos = 0,
				y_pos = 0, // Stores x & y coordinates of the mouse pointer
				x_elem = 0,
				y_elem = 0, // Stores top, left values (edge) of the element
				defaults = {
					title: dialog_title.innerHTML,
					content: dialog_content.innerHTML,
					top: false,
					left: false,
					buttons: {
						"Close": function() {
							setDialog('close');
						}
					},
					specialClass: "",
					fixed: false,
					overlay: true
				}; // Default options...

			for (var i in config) { defaults[i] = (typeof(config[i])) ? config[i] : defaults[i]; }

			// Will be called when user starts dragging an element
			function _drag_init(elem) {
				selected = elem; // Store the object of the element which needs to be moved
				x_elem = x_pos - selected.offsetLeft;
				y_elem = y_pos - selected.offsetTop;
			}

			// Will be called when user dragging an element
			function _move_elem(e) {
				x_pos = b.all ? a.event.clientX : e.pageX;
				y_pos = b.all ? a.event.clientY : e.pageY;
				if (selected !== null) {
					selected.style.left = !defaults.left ? ((x_pos - x_elem) + selected.offsetWidth/2) + 'px' : ((x_pos - x_elem) - defaults.left) + 'px';
					selected.style.top = !defaults.top ? ((y_pos - y_elem) + selected.offsetHeight/2) + 'px' : ((y_pos - y_elem) - defaults.top) + 'px';
				}
			}

			// Destroy the object when we are done
			function _destroy() {
				selected = null;
			}
			
			// Show dialog box and overlay when toggled
			dialog.className =  "dialog-box-oem " + (defaults.fixed ? 'fixed-dialog-box-oem ' : '') + defaults.specialClass;
			dialog.style.visibility = (set === "open") ? "visible" : "hidden";
			dialog.style.opacity = (set === "open") ? 1 : 0;
			// Reset position in case user drags the pop up off the screen
			dialog.style.top = (!defaults.top) ? "50%" : '0px';
			dialog.style.left = (!defaults.left) ? "50%" : '0px';
			dialog_title.innerHTML = defaults.title;
			dialog_content.innerHTML = defaults.content;
			dialog_action.innerHTML = "";
			dialog_overlay.style.display = (set === "open" && defaults.overlay) ? "block" : "none";

			if (defaults.buttons) {
				for (var j in defaults.buttons) {
					var btn = b.createElement('a');
						btn.className = 'oem-dlg-btn';
						btn.href = 'javascript:;';
						btn.innerHTML = j;
						btn.onclick = defaults.buttons[j];
					dialog_action.appendChild(btn);
				}
			} else {
				dialog_action.innerHTML = '&nbsp;';
			}

			// Bind the draggable function here...
			dialog_title.onmousedown = function() {
				_drag_init(this.parentNode);
				return false;
			};

			dialog_minmax.innerHTML = '&ndash;';
			dialog_minmax.title = 'Minimize';
			dialog_minmax.onclick = dialogMinMax;

			dialog_close.onclick = function() {
				setDialog("close", {content:""});
			};

			b.onmousemove = _move_elem;
			b.onmouseup = _destroy;

			maximize = (set === "open") ? true : false;

		};

		// Maximized or minimized dialog box
		function dialogMinMax() {
			if (maximize) {
				dialog.className += ' minimize';
				dialog_minmax.innerHTML = '+';
				dialog_minmax.title = dialog_title.innerHTML.replace(/<.*?>/g,"");
				maximize = false;
			} else {
				dialog.className = dialog.className.replace(/(^| )minimize($| )/g, "");
				dialog_minmax.innerHTML = '&ndash;';
				dialog_minmax.title = 'Minimize';
				maximize = true;
			}
		}

	})(window, document);

    return {
        initialize: function(api, state, initializeCallback) {
            init(api);
            initializeCallback();
        },

        focus: function(api, state) {

        },

        blur: function() {
        }
    };
};