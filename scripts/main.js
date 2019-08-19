geotab.addin.oemAdd = function() {
    'use strict';	
	let deleteChildren = function(myNode) {
		while (myNode.firstChild) {
			myNode.removeChild(myNode.firstChild);
		}
	};
	
	let clearForm = function() {
		let oemFields = document.getElementsByClassName("oemInput");
		for (let fieldIndex = 0; fieldIndex < oemFields.length; fieldIndex++) {
			oemFields[fieldIndex].innerHTML = "";
			oemFields[fieldIndex].value = "";
		};
	};
	
	let buildForm = function(oemData) {
		let oemList = document.getElementById("oemProviders");
		let selectedProvider = oemList.value;
		let selectedSchema;
		let pDiv = document.getElementById("oemDynamicForm");
		deleteChildren(pDiv);
		for (let oemOpt = 0; oemOpt < oemData.length; oemOpt++) {
			let curOpt = oemData[oemOpt];
			if (curOpt.dataSourceName === selectedProvider) {
				selectedSchema = curOpt.userInfoSchema;
				console.log(selectedSchema);
				break;
			}
		}
		
		for (let schemaKey in selectedSchema) { 
			let div = document.createElement("div");
			let newLabel = document.createElement("label");
			let newInput = document.createElement("input");
			div.setAttribute("class", "oemField clearfix");
			newLabel.innerHTML = schemaKey;
			newInput.setAttribute("id", schemaKey);
			newInput.setAttribute("class", "oemInput");
			if (selectedSchema[schemaKey] === "text") {	
				newInput.setAttribute("type", "text");
			}
			div.appendChild(newLabel);
			div.appendChild(newInput);
			pDiv.appendChild(div);	
		}
		return selectedSchema;
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
	
	let addCreds = async function(api, id, name, payload) {
		progressHandler("Adding " + name + " to the database...", 0);
		enableElement(document.getElementById("oemProgressBox"));
		console.log(payload);
		let addResult = await addOEMProviders(api, id, payload);
		progressHandler("Successfully added " + name + " to the database.", 1);
		setTimeout(function () {
			disableElement(document.getElementById("oemProgressLabel"));
			disableElement(document.getElementById("oemProgressBox"));
			clearForm();
		}, 6000);
	};

    let addOEMProviders = function(api, id, providerObj) {
		return new Promise(function(resolve, reject) {
			let providerPayload = [
				{
					"datasourceid": id,
					"userinfo": providerObj
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
	
	let grabUserTimeZone = function(api) {
		return new Promise(function(resolve, reject) {
			api.getSession(function(credentials) {
				console.log(credentials);
				api.call("Get", {"typeName": "User",
					"search": {
						"name": credentials.userName	
					}
				}, function(userObj) {
					console.log(userObj);
					resolve(userObj);
				})
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
        initialize: async function(api, state, initializeCallback) {
			let oemList = await grabOEMProviders(api);
			let oemAddSelected = document.getElementById("oemAddSelected");
			let providerList = document.getElementById("oemProviders");
			let oemHelpBtn = document.getElementById("oemHelpButton");
			let oemSchema;
			grabUserTimeZone(api);
			
			oemAddSelected.disabled = false;
			providerList.addEventListener("change", function() {
				oemSchema = buildForm(oemList);
			});
			oemAddSelected.addEventListener("click", async function() {
				let oemFields = document.getElementsByClassName("oemInput");
				let tempObj = {};
				let userTimezone  = await oemAdd.timeZoneConversionModule.userTimeZoneOffset(api);
				let isValid = true;
				for (let fieldIndex = 0; fieldIndex < oemFields.length; fieldIndex++) {
					if (oemSchema[oemFields[fieldIndex].id] === "datetime") {
						let dateUTZ = new Date(oemFields[fieldIndex].value);
						if (dateUTZ instanceof Date && !isNaN(dateUTZ)) {
							dateUTZ.setHours(dateUTZ.getHours() + (-1*userTimezone["hours"]));
							dateUTZ.setMinutes(dateUTZ.getMinutes() + (-1*userTimezone["minutes"]));
							tempObj[oemFields[fieldIndex].id] = dateUTZ.toISOString();
						} else {
							errorHandler("Please enter a valid date!");
							isValid = false;
						}
						
					} else if (oemSchema[oemFields[fieldIndex].id].includes("[")) {
						// The string extraction is only to see what type of items the array will hold
						// At this point I don't know if any values other than text would be used
						// For the time being I will leave this code here in case it comes in handy
						/*
						let regExp = /\[([^)]+)\]/;
						let match = regExp.exec(oemSchema[oemFields[fieldIndex].id]);
						console.log(regExp.exec(oemSchema[oemFields[fieldIndex].id]));
						console.log(match[1]);
						*/
						let items = oemFields[fieldIndex].value.split(",");
						tempObj[oemFields[fieldIndex].id] = items;
					} else {
						tempObj[oemFields[fieldIndex].id] = oemFields[fieldIndex].value;
					}
				}
				console.log(tempObj);
				if (isValid) {
					await addCreds(api,providerList[providerList.selectedIndex].id, providerList.value, tempObj);
				}
				
			});
			oemHelpBtn.addEventListener("click", async function() {
				setDialog("open", {
					title: "Help",
					content: "This page allows administrators to add OEM credentials to the MyGeotab database."
				});
			});
			populateSelectBox((oemList));
			oemSchema = buildForm(oemList);
            initializeCallback();
        },

        focus: function(api, state) {

        },

        blur: function() {
        }
    };
};