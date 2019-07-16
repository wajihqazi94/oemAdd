/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.oemAdd = function() {
    'use strict';
	
	let init = async function(api) {
		let oemList = await grabOEMProviders(api);
		let oemAddSelected = document.getElementById("oemAddSelected");
		let oemAddAll = document.getElementById("oemAddAll");
		let oemHelpBtn = document.getElementById("oemHelpButton");
		let currentUser;
		
		api.getSession(function(sessionInfo) {
			currentUser = sessionInfo.userName;
		});
		
		let userObj = await getUser(api, currentUser);
		if (userObj) {
			if (userObj[0].securityGroups[0].id === "GroupEverythingSecurityId") {
				enableElement(document.getElementById("oemPrimary"));
			}
		} else {
			disableElement(document.getElementById("oemPrimary"));
		}
		
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
			})
		})
		populateSelectBox((oemList));
	};
	
	let getUser = function(api, name) {
		return new Promise(function(resolve, reject) {
			api.call("Get", {"typeName": "User",
				"search": {
					"name": name
				}
			}, function(result) {
				resolve(result);
			}, function(e) {
				resolve(e);
			});
		});
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
		let progressLabelTimer;
		let oemProgressBox = document.getElementById("oemProgressBox");
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
		}	
	};

    let addOEMProviders = function(api, providerObj) {
		return new Promise(function(resolve, reject) {
			let providerPayload = [
				{
					"datasourceid": providerObj.dataSourceId,
					"userinfo": {
						"clientid": providerObj.userInfoSchema.clientId,
						"clientsecret": providerObj.userInfoSchema.clientSecret
					}
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
	// Simple Dialog Box Plugin by Taufik Nurrohman
	// URL: http://www.dte.web.id + https://plus.google.com/108949996304093815163/about
	// Licence: none

	(function(a, b) {

		var uniqueId = new Date().getTime();

		(function() { // Create the dialog box markup
			var div = b.createElement('div'),
				ovr = b.createElement('div');
				div.className = 'dialog-box-oem';
				div.id = 'dialog-box-oem-' + uniqueId;
				div.innerHTML = '<div class="dialog-title">&nbsp;</div><a href="javascript:;" class="dialog-minmax" title="Minimize">&ndash;</a><a href="javascript:;" class="dialog-close" title="Close">&times;</a><div class="dialog-content">&nbsp;</div><div class="dialog-action"></div>';
				ovr.className = 'dialog-box-oem-overlay';
			b.body.appendChild(div);
			b.body.appendChild(ovr);
		})();

		var maximize = false,
			dialog = b.getElementById('dialog-box-oem-' + uniqueId), // The HTML of dialog box
			dialog_title = dialog.children[0],
			dialog_minmax = dialog.children[1],
			dialog_close = dialog.children[2],
			dialog_content = dialog.children[3],
			dialog_action = dialog.children[4],
			dialog_overlay = dialog.nextSibling;

		a.setDialog = function(set, config) {

			var selected = null, // Object of the element to be moved
				x_pos = 0,
				y_pos = 0, // Stores x & y coordinates of the mouse pointer
				x_elem = 0,
				y_elem = 0, // Stores top, left values (edge) of the element
				defaults = {
					title: dialog_title.innerHTML,
					content: dialog_content.innerHTML,
					width: 300,
					height: 150,
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

			dialog.className =  "dialog-box-oem " + (defaults.fixed ? 'fixed-dialog-box-oem ' : '') + defaults.specialClass;
			dialog.style.visibility = (set === "open") ? "visible" : "hidden";
			dialog.style.opacity = (set === "open") ? 1 : 0;
			dialog.style.width = defaults.width + 'px';
			dialog.style.height = defaults.height + 'px';
			dialog.style.top = (!defaults.top) ? "50%" : '0px';
			dialog.style.left = (!defaults.left) ? "50%" : '0px';
			dialog.style.marginTop = (!defaults.top) ? '-' + defaults.height/2 + 'px' : defaults.top + 'px';
			dialog.style.marginLeft = (!defaults.left) ? '-' + defaults.width/2 + 'px' : defaults.left + 'px';
			dialog_title.innerHTML = defaults.title;
			dialog_content.innerHTML = defaults.content;
			dialog_action.innerHTML = "";
			dialog_overlay.style.display = (set === "open" && defaults.overlay) ? "block" : "none";

			if (defaults.buttons) {
				for (var j in defaults.buttons) {
					var btn = b.createElement('a');
						btn.className = 'btn';
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
        /**
         * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
         * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
         * is ready for the user.
         * @param {object} api - The GeotabApi object for making calls to MyGeotab.
         * @param {object} state - The page state object allows access to URL, page navigation and global group filter.
         * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
         *        might be doing asynchronous operations, you must call this method when the Add-In is ready
         *        for display to the user.
         */
        initialize: function(api, state, initializeCallback) {
            init(api);
            // MUST call initializeCallback when done any setup
            initializeCallback();
        },

        /**
         * focus() is called whenever the Add-In receives focus.
         *
         * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
         * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
         * the global state of the MyGeotab application changes, for example, if the user changes the global group
         * filter in the UI.
         *
         * @param {object} api - The GeotabApi object for making calls to MyGeotab.
         * @param {object} state - The page state object allows access to URL, page navigation and global group filter.
         */
        focus: function(api, state) {
            // example of setting url state
            state.setState({
                hello: 'world'
            });

            // getting the current user to display in the UI
            api.getSession(session => {

            });

        },

        /**
         * blur() is called whenever the user navigates away from the Add-In.
         *
         * Use this function to save the page state or commit changes to a data store or release memory.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        blur: function() {
            // hide main content
        }
    };
};