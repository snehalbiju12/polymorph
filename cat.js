function capacitor(t, limit, send, settings = {}, checkInterval = 100) {
    let options = {
        fireFirst: false,
        afterLast: true,
    };
    if (typeof (settings) == "boolean") {
        options.fireFirst = settings;
    } else {
        Object.assign(options, settings);
    }
    let me = this;
    let lastUID;
    let lastData;
    let tcount = 0;
    let rqcount = 0;
    let pid = undefined;
    let prefire = false;
    this.forceSend = function () {
        send(lastUID, lastData);
        rqcount = 0;
        clearTimeout(pid);
        pid = undefined;
    }
    this.checkAndUpdate = function () {
        tcount -= checkInterval;
        if (tcount <= 0) {
            if (!prefire) {
                me.forceSend();
            }
        } else {
            pid = setTimeout(me.checkAndUpdate, checkInterval);
        }
    }
    this.submit = function (UID, data) {
        if (options.presubmit) options.presubmit();
        if (lastUID != UID && lastUID) {
            me.forceSend();
        } else {
            if (rqcount == 0 && options.fireFirst) {
                lastUID = UID;
                me.forceSend();
                prefire = true;
            } else {
                prefire = false;
            }
            rqcount++;
            if (rqcount > limit) {
                me.forceSend();
                rqcount = 1;
            }
            if (options.afterLast && pid) {
                clearTimeout(pid);
                pid = undefined;
            }
            if (!pid) {
                tcount = t;
                pid = setTimeout(me.checkAndUpdate, checkInterval);
            }
        }
        lastUID = UID;
        lastData = data;
    }
}

function htmlwrap(html, el) {
    let d = document.createElement(el || 'div');
    d.innerHTML = html;
    if (d.children.length == 1) {
        let dd=d.children[0];
        dd.remove();
        return dd;
    }
    else return d;
}

function waitForFn(property) {
    let me = this;
    if (!this[property]) this[property] = function (args) {
        setTimeout(() => me[property].apply(me, arguments), 1000);
    }
}
;

// Items are just native objects now 
function _polymorph_core() {
    //Event API. pretty important, it turns out.

    this.guid = (count = 6, priorkeys) => {
        let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
        let newGuid = "";
        do {
            newGuid = "";
            for (i = 0; i < count; i++) newGuid += pool[Math.floor(Math.random() * pool.length)];
        } while (priorkeys && (priorkeys[i] ||
            (priorkeys.length != undefined && priorkeys.includes(i))
        ));
        return newGuid;
    }

    this.addEventAPI = (itm, errf = console.error) => {
        itm.events = {};
        itm.fire = function (e, args) {
            let _e = e.split(",");
            let _oe = e.split(",");//original elevents
            _e.push("*"); // a wildcard event listener
            _e.forEach((i) => {
                if (!itm.events[i]) return;
                //prime the ketching function with a starter object to prime it.
                let cnt = true;
                if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => {
                    if (cnt != false) cnt = f(args, true, e)
                });
                //fire each event
                if (itm.events[i].events) {
                    itm.events[i].events.forEach((f) => {
                        if (cnt == false) return;
                        try {
                            result = f(args, _oe);
                            if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => {
                                if (cnt != false) cnt = f(result, undefined, i)
                            });
                        } catch (er) {
                            errf(er);
                        }

                    });
                }
                if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => (f(args, false, e)));
            })
        };
        itm.on = function (e, f) {
            let _e = e.split(',');
            _e.forEach((i) => {
                if (!itm.events[i]) itm.events[i] = {};
                if (!itm.events[i].events) itm.events[i].events = [];
                itm.events[i].events.push(f);
            })
        };
        itm.cetch = function (i, f) {
            if (!itm.events[i]) itm.events[i] = {};
            if (!itm.events[i].cetches) itm.events[i].cetches = [];
            itm.events[i].cetches.push(f);
        }
    }

    this.addEventAPI(this);

    this._option = (function () {
        //snippet that pre-evaluates functions, so that we can quickly load dynmaics
        function iff(it) {
            if (typeof it == "function") {
                return it();
            } else return it;
        }

        function _option(settings) {
            let appendedElement;
            ///////////////////////////////////////////////////////////////////////////////////////
            //Create the input and register an event handler
            switch (settings.type) {
                case "bool":
                    appendedElement = document.createElement("input");
                    appendedElement.type = "checkbox";
                    appendedElement.addEventListener("input", (e) => {
                        let actualObject = iff(settings.object);
                        if (typeof actualObject != "object") actualObject = {};// this doesnt always work :///
                        if (settings.beforeInput) settings.beforeInput(e);
                        actualObject[settings["property"]] = appendedElement.checked;
                        if (settings.afterInput) settings.afterInput(e);
                    })
                    break;
                case "textarea":
                case "text":
                case "number":
                    appendedElement = document.createElement(settings.type == "textarea" ? "textarea" : "input");
                    appendedElement.style.display = "block";
                    appendedElement.addEventListener("input", (e) => {
                        let actualObject = iff(settings.object);
                        if (typeof actualObject != "object") actualObject = {};
                        if (settings.beforeInput) settings.beforeInput(e);
                        actualObject[settings["property"]] = appendedElement.value;
                        if (settings.afterInput) settings.afterInput(e);
                    })
                    break;
                case "select":
                    appendedElement = document.createElement("select");
                    appendedElement.addEventListener("click", (e) => {//apparently click is better than change or select
                        let actualObject = iff(settings.object);
                        if (typeof actualObject != "object") actualObject = {};
                        if (settings.beforeInput) settings.beforeInput(e);
                        actualObject[settings["property"]] = appendedElement.value;
                        if (settings.afterInput) settings.afterInput(e);
                    })
                    break;
                case "array":
                    appendedElement = document.createElement("div");
                    appendedElement.style.display = "flex";
                    appendedElement.style.flexDirection = "column";
                    appendedElement.addEventListener("input", (e) => {
                        let actualObject = iff(settings.object);
                        if (!actualObject[settings["property"]]) actualObject[settings["property"]] = [];
                        let te = e.target.parentElement;
                        let index = 0;
                        while (te.previousElementSibling) {
                            te = te.previousElementSibling;
                            index++;
                        }
                        actualObject[settings['property']][index] = e.target.value;
                    });
                    appendedElement.addEventListener("click", (e) => {
                        let actualObject = iff(settings.object);
                        if (e.target.tagName != "BUTTON") return;
                        if (!actualObject[settings["property"]]) actualObject[settings["property"]] = [];
                        if (e.target.innerText == "+") {
                            let s = document.createElement("span");
                            s.innerHTML = `<input><button>x</button>`;
                            s.style.width = "100%";
                            appendedElement.insertBefore(s, appendedElement.children[appendedElement.children.length - 1]);
                            actualObject[settings['property']].push("");
                        } else {
                            let index = 0;
                            let te = e.target.parentElement;
                            while (te.previousElementSibling) {
                                te = te.previousElementSibling;
                                index++;
                            }
                            actualObject[settings['property']].splice(index, 1);
                            e.target.parentElement.remove();
                        }
                    });
                    break;
                case 'button':
                    appendedElement = document.createElement("button");
                    appendedElement.innerText = settings.label;
                    appendedElement.addEventListener("click", (e) => {
                        settings.fn();
                    })
                    break;
            }
            appendedElement.style.float = "right";
            if (settings.placeholder)appendedElement.placeholder=settings.placeholder;
            if (settings.label && settings.type != "button") {
                let lb = document.createElement("label");
                lb.innerHTML = settings.label;
                lb.appendChild(appendedElement);
                lb.style.display = "block";
                lb.style.margin = "3px";
                settings.div.appendChild(lb);
            } else {
                settings.div.appendChild(appendedElement);
            }
            //initially load the property value.
            this.load = function () {
                let actualObject = iff(settings.object);
                if (!actualObject) console.log("Warning: attempt to reference an undefined object");
                else {
                    switch (settings.type) {
                        case "bool":
                            if (actualObject[settings["property"]]) appendedElement.checked = actualObject[settings["property"]];
                            else appendedElement.checked = false;
                            break;
                        case "text":
                        case "textarea":
                        case "number":
                            if (actualObject[settings["property"]]) appendedElement.value = actualObject[settings["property"]] || "";
                            else appendedElement.value = "";
                            break;
                        case "select":
                            //clear my div
                            appendedElement.innerHTML = "";
                            let _source = iff(settings.source);
                            //if source is an array
                            if (_source.length) {
                                //differentiate between array of objects and array of string
                                _source.forEach(i => {
                                    let op = document.createElement("option");
                                    op.innerText = i;
                                    op.value = i;
                                    appendedElement.appendChild(op);
                                })
                            } else
                                for (let i in _source) {
                                    let op = document.createElement("option");
                                    op.innerText = _source[i];
                                    op.value = i;
                                    appendedElement.appendChild(op);
                                }
                            if (actualObject[settings["property"]]) appendedElement.value = actualObject[settings["property"]];
                            break;
                        case "array": //array of text
                            while (appendedElement.children.length) appendedElement.children[0].remove();
                            if (actualObject[settings["property"]]) for (let i = 0; i < actualObject[settings['property']].length; i++) {
                                let s = document.createElement("span");
                                s.innerHTML = `<input value="${actualObject[settings['property']][i]}"><button>x</button>`;
                                s.style.width = "100%";
                                appendedElement.appendChild(s);
                            }
                            let b = document.createElement("button");
                            b.innerHTML = "+";
                            b.style.width = "100%";
                            appendedElement.appendChild(b);
                            break;
                    }
                }
            }
            this.appendedElement = appendedElement;
        }

        return _option;
    })();


    //Reallly low level user identification, etc.
    //#region
    this.saveUserData = () => {
        localStorage.setItem("pm_userData", JSON.stringify(this.userData));
    };

    this.userData = {
        documents: {},
        uniqueID: this.guid(7),
        itemsCreatedCount: 0,
    }

    Object.assign(this.userData, JSON.parse(localStorage.getItem("pm_userData")));
    //#endregion

    //we need to update userdata  to the latest version as necessary... 

    // Starting function: this is only called once
    this.start = () => {
        this.fire("UIsetup");
        this.fire("UIstart");
        this.resetDocument();
        this.handleURL();
    }

    Object.defineProperty(this, "currentDoc", {
        get: () => {
            return this.items._meta;
        }
    })

    //Document level functions
    this.updateSettings = (isLoading) => {
        this.documentTitleElement.innerText = this.items._meta.displayName;
        document.querySelector("title").innerHTML =
            this.items._meta.displayName + " - Polymorph";
        if (!isLoading) this.filescreen.saveRecentDocument(this.currentDocID, undefined, this.items._meta.displayName);
        this.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
        polymorph_core.fire("updateDoc");
    })
    //title updates
    this.on("UIstart", () => {
        if (!this.documentTitleElement) {
            this.documentTitleElement = document.createElement("a");
            this.documentTitleElement.contentEditable = true;
            this.topbar.add("titleElement", this.documentTitleElement);
        }
        this.documentTitleElement.addEventListener("keyup", () => {
            this.items._meta.displayName = this.documentTitleElement.innerText;
            tc.submit();
            document.querySelector("title").innerHTML =
                this.items._meta.displayName + " - Polymorph";
        });
    })

    //Operator registration
    //#region
    this.operators = {};
    this.registerOperator = (type, options, _constructor) => {
        if (_constructor) {
            this.operators[type] = {
                constructor: _constructor,
                options: options
            };
        } else {
            this.operators[type] = {
                constructor: options,
                options: {}
            };
        }
        this.fire("operatorAdded", {
            type: type
        });
        for (let i = 0; i < this.operatorLoadCallbacks[type]; i++) {
            this.operatorLoadCallbacks[type][i].op.fromSaveData(
                this.operatorLoadCallbacks[type][i].data
            );
        }
    };
    //#endregion

    //Item management
    //#region
    this.items = {};

    this.oldCache = {}; // literally a copy of polymorph_core.items.
    this.on("updateItem", (d) => {
        if (!d.loadProcess && !d.unedit) {
            if (JSON.stringify(this.items[d.id]) != this.oldCache[d.id]) this.items[d.id]._lu_ = Date.now();
        }
        this.oldCache[d.id] = JSON.stringify(this.items[d.id]);
    })

    let _Rixits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";

    function b64(n) {
        var rixit; // like 'digit', only in some non-decimal radix 
        var residual = n;
        var result = '';
        while (true) {
            rixit = residual % 64
            result = _Rixits.charAt(rixit) + result;
            residual = Math.floor(residual / 64);
            if (residual == 0)
                break;
        }
        return result;
    }

    //insert an item.
    this.insertItem = (itm) => {
        let UID = `${this.userData.uniqueID}_${b64(Date.now())}_${this.userData.itemsCreatedCount}`;
        this.userData.itemsCreatedCount++;
        this.items[UID] = itm;
        return UID;
    }
    //#endregion

    this.operatorLoadCallbacks = {};
    this.rectLoadCallbacks = {};

    //A shared space for operators to access
    this.shared = {};



    //garbage collection
    this.tryGarbageCollect = (id) => {
        if (polymorph_core.items[id]._od || polymorph_core.items[id]._rd) return;//never delete rects and operators? this wont end well
        if (id == "_meta") return;//dont delete the metaitem
        let toDelete = true;
        for (let i in this.containers) {
            if (this.containers[i].operator && this.containers[i].operator.itemRelevant && this.containers[i].operator.itemRelevant(id)) {
                toDelete = false;
            }
        }
        if (toDelete) {
            delete polymorph_core.items[id];
        }
    }
    this.runGarbageCollector = () => {
        for (let i in polymorph_core.items) {
            polymorph_core.tryGarbageCollect(i);
        }
    }
}

var polymorph_core = new _polymorph_core();



// http://www.w3.org/TR/AERT#color-contrast
function matchContrast(col) {
    var colours = {
        "aliceblue": "#f0f8ff", "antiquewhite": "#faebd7", "aqua": "#00ffff", "aquamarine": "#7fffd4", "azure": "#f0ffff",
        "beige": "#f5f5dc", "bisque": "#ffe4c4", "black": "#000000", "blanchedalmond": "#ffebcd", "blue": "#0000ff", "blueviolet": "#8a2be2", "brown": "#a52a2a", "burlywood": "#deb887",
        "cadetblue": "#5f9ea0", "chartreuse": "#7fff00", "chocolate": "#d2691e", "coral": "#ff7f50", "cornflowerblue": "#6495ed", "cornsilk": "#fff8dc", "crimson": "#dc143c", "cyan": "#00ffff",
        "darkblue": "#00008b", "darkcyan": "#008b8b", "darkgoldenrod": "#b8860b", "darkgray": "#a9a9a9", "darkgreen": "#006400", "darkkhaki": "#bdb76b", "darkmagenta": "#8b008b", "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00", "darkorchid": "#9932cc", "darkred": "#8b0000", "darksalmon": "#e9967a", "darkseagreen": "#8fbc8f", "darkslateblue": "#483d8b", "darkslategray": "#2f4f4f", "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3", "deeppink": "#ff1493", "deepskyblue": "#00bfff", "dimgray": "#696969", "dodgerblue": "#1e90ff",
        "firebrick": "#b22222", "floralwhite": "#fffaf0", "forestgreen": "#228b22", "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc", "ghostwhite": "#f8f8ff", "gold": "#ffd700", "goldenrod": "#daa520", "gray": "#808080", "green": "#008000", "greenyellow": "#adff2f",
        "honeydew": "#f0fff0", "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c", "indigo": "#4b0082", "ivory": "#fffff0", "khaki": "#f0e68c",
        "lavender": "#e6e6fa", "lavenderblush": "#fff0f5", "lawngreen": "#7cfc00", "lemonchiffon": "#fffacd", "lightblue": "#add8e6", "lightcoral": "#f08080", "lightcyan": "#e0ffff", "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3", "lightgreen": "#90ee90", "lightpink": "#ffb6c1", "lightsalmon": "#ffa07a", "lightseagreen": "#20b2aa", "lightskyblue": "#87cefa", "lightslategray": "#778899", "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0", "lime": "#00ff00", "limegreen": "#32cd32", "linen": "#faf0e6",
        "magenta": "#ff00ff", "maroon": "#800000", "mediumaquamarine": "#66cdaa", "mediumblue": "#0000cd", "mediumorchid": "#ba55d3", "mediumpurple": "#9370d8", "mediumseagreen": "#3cb371", "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a", "mediumturquoise": "#48d1cc", "mediumvioletred": "#c71585", "midnightblue": "#191970", "mintcream": "#f5fffa", "mistyrose": "#ffe4e1", "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead", "navy": "#000080",
        "oldlace": "#fdf5e6", "olive": "#808000", "olivedrab": "#6b8e23", "orange": "#ffa500", "orangered": "#ff4500", "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa", "palegreen": "#98fb98", "paleturquoise": "#afeeee", "palevioletred": "#d87093", "papayawhip": "#ffefd5", "peachpuff": "#ffdab9", "peru": "#cd853f", "pink": "#ffc0cb", "plum": "#dda0dd", "powderblue": "#b0e0e6", "purple": "#800080",
        "rebeccapurple": "#663399", "red": "#ff0000", "rosybrown": "#bc8f8f", "royalblue": "#4169e1",
        "saddlebrown": "#8b4513", "salmon": "#fa8072", "sandybrown": "#f4a460", "seagreen": "#2e8b57", "seashell": "#fff5ee", "sienna": "#a0522d", "silver": "#c0c0c0", "skyblue": "#87ceeb", "slateblue": "#6a5acd", "slategray": "#708090", "snow": "#fffafa", "springgreen": "#00ff7f", "steelblue": "#4682b4",
        "tan": "#d2b48c", "teal": "#008080", "thistle": "#d8bfd8", "tomato": "#ff6347", "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3", "white": "#ffffff", "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00", "yellowgreen": "#9acd32"
    };
    //returns either black or white from either a #COLOR or a rgb(color) or a name.
    cols = /\#(..)(..)(..)/i.exec(col)
    if (!cols) {
        cols = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(col);
        if (!cols) {
            //its probably a name color
            col = col.toLowerCase();
            if (colours[col]) {
                return matchContrast(colours[col]);
            } else return "black";//no idea
        }
    } else {
        cols = [cols[0], cols[1], cols[2], cols[3]];
        cols[1] = parseInt(cols[1], 16);
        cols[2] = parseInt(cols[2], 16);
        cols[3] = parseInt(cols[3], 16);
    }
    if (!cols) throw "Invalid color: " + col;
    let value = Math.round(((parseInt(cols[1]) * 299) +
        (parseInt(cols[2]) * 587) +
        (parseInt(cols[3]) * 114)) / 1000);
    return (value > 125) ? 'black' : 'white';
};

if (!polymorph_core.userData.tutorialData) {
    polymorph_core.userData.tutorialData = { main: {} };
}


var _tutorial = (function () {
    function evalGet(itm) {
        if (typeof (itm) == "function") return itm();
        else return itm;
    }

    let types = {
        shader: {
            render: function (itm, callback) {
                let data = {};
                data.div = document.createElement("div");
                data.div.style.cssText = `position:absolute; 
              height:100%; 
              width:100%; 
              display:flex;
              flex-direction:column;
              background: rgba(0,0,0,0.7);
              z-index:300;
              top:0;
              left:0;`;
                data.innerdiv = document.createElement("div");
                data.div.appendChild(data.innerdiv);
                data.innerdiv.innerHTML = itm.contents;
                data.innerdiv.style.cssText = `flex: 0 1 auto;
              margin: auto;
              text-align: center;
              color: white;
              padding: 1em;
              `;
                if (itm.to) {
                    for (let i = 0; i < itm.to.length; i++) {
                        let btn = document.createElement("button");
                        btn.innerHTML = itm.to[i][0];
                        btn.addEventListener("click", () => {
                            callback(itm.to[i][1]);
                        })
                        data.innerdiv.appendChild(btn);
                    }
                } else {
                    data.button = document.createElement("button");
                    data.button.innerHTML = "Next";
                    data.button.addEventListener("click", function () {
                        callback();
                    })
                    data.innerdiv.appendChild(data.button);
                }
                evalGet(itm.target).appendChild(data.div);
                return data;
            },
            unrender: function (data) {
                data.div.remove();
            }
        },
        internal: {
            render: function (itm, callback) {
                let data = {};
                data.div = document.createElement("div");
                data.div.classList.add("tutorial");
                data.div.style.cssText = `position: absolute;
              height: fit-content;
              width: fit-content;
              display: block;
              background: rgba(0, 0, 0, 0.7);
              z-index: 300;`;
                switch (itm.location) {
                    default:
                    case 'left':
                        data.div.style.cssText += `top: 50%;
                      transform: translateY(-50%);`;
                        break;
                    case 'bottom':
                        data.div.style.cssText += `bottom: 0%;
                      left: 50%;
                      transform: translateX(-50%);`;
                        break;
                    case 'top':
                        data.div.style.cssText += `
                      left: 50%;
                      top: 0%;
                      transform: translateX(-50%);`;
                        break;
                    case 'center':
                        data.div.style.cssText += `
                      left: 50%;
                      top: 50%;
                      transform: translate(-50%,-50%);`;
                        break;
                }
                data.innerdiv = document.createElement("div");
                data.div.appendChild(data.innerdiv);
                data.innerdiv.innerHTML = itm.contents;
                data.innerdiv.style.cssText = `flex: 0 1 auto;
              margin: auto;
              text-align: center;
              color: white;
              padding: 1em;
              `;
                if (itm.to) {
                    for (let i = 0; i < itm.to.length; i++) {
                        let btn = document.createElement("button");
                        btn.innerHTML = itm.to[i][0];
                        btn.addEventListener("click", () => {
                            callback(itm.to[i][1]);
                        })
                        data.innerdiv.appendChild(btn);
                    }
                } else {
                    data.button = document.createElement("button");
                    data.button.innerHTML = "Next";
                    data.button.addEventListener("click", function () {
                        callback();
                    })
                    data.innerdiv.appendChild(data.button);
                }
                evalGet(itm.target).appendChild(data.div);

                return data;
            },
            unrender: function (data) {
                data.div.remove();
            }
        }
    }

    //snippet that pre-evaluates functions, so that we can quickly load dynmaics
    function iff(it) {
        if (typeof it == "function") {
            return it();
        } else return it;
    }

    function mkhash(obj) {
        let str;
        if (typeof obj == "object") str = JSON.stringify(obj);
        else str = obj.toString();
        var hash = 0, i, chr;
        if (str.length === 0) return hash.toString();
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    };

    function _tutorial(options) {
        this.firstItem = false;
        this.items = {};
        let lastData;
        let lastType;
        let me = this;
        this.present = function (id, onErr) {
            //hide the previous slide
            if (lastData) {
                types[lastType].unrender(lastData);
            }
            if (id) {
                //present the current item
                let data = iff(options.data);
                data.step = id;
                if (options.saveData) options.saveData();
                if (!me.items[id]) {
                    if (onErr) onErr();
                    return;
                }
                lastType = me.items[id].type;
                lastData = types[me.items[id].type].render(me.items[id], me.present);
            } else {
                me.end();
            }
            //otherwise finish
        }
        this.addSteps = function (steps) {
            steps.forEach((v) => { this.addStep(v) });
        }
        this.addStep = function (item) {
            //if no id then generate a uuid? 
            //needs to be deterministic
            if (!item.id) {
                item.id = mkhash(item);
            }
            if (!this.firstItem) {
                this.firstItem = item.id;
            }
            this.items[item.id] = item;
            return item.id
        }
        this.start = function (id, onErr) {
            if (!id) {
                id = this.firstItem;
            }
            this.present(id, onErr);
            return {
                end: (f) => { me._end = f; }
            }
        }
        this.continueStart = function (onErr) {
            let data = iff(options.data);
            if (!data.concluded) this.start(data.step, onErr);
            //continue based on saved tutorial data
        }
        this.end = function () {
            let data = iff(options.data);
            data.concluded = true;
            if (options.saveData) options.saveData();
            me._end;
        }
    }
    return _tutorial;
})();


polymorph_core.tutorial = new _tutorial({
    data: () => { return polymorph_core.userData.tutorialData.main },
    saveData: () => { polymorph_core.saveUserData() }
});
polymorph_core.resetTutorial = function () {
    polymorph_core.userData.tutorialData = { main: {} };
    polymorph_core.tutorial.start();
}
polymorph_core.on("UIstart", () => {
    polymorph_core.tutorial.addSteps([
        {
            target: document.body,
            type: "shader",
            contents: `<h1>Welcome to Polymorph!</h1><h2>Productivity, your way.</h2> `,
            to: [["Next", "cnd"], ["Skip"]]
        },
        {
            id: "cnd",
            target: () => { return polymorph_core.baseRect.outerDiv },
            type: "internal",
            location: 'left',
            contents: `<p>&lt;---Shift-Click and drag this border to split the item! (Then, just click and drag to resize)</p>`,
            to: [["Next", "clickop"], ["Skip"]]
        }, {
            id: "clickop",
            target: () => { return polymorph_core.baseRect.outerDiv },
            type: "internal",
            location: 'center',
            contents: `<p>These boxes contain operators. Click an operator type to get started!</p>`,
            to: [["Next", "save"], ["Skip"]]
        }, {
            id: "save",
            target: document.body,
            type: "shader",
            contents: `<p>To save your work, simply press Ctrl-S. Your work will be saved in your browser.</p>`,
            to: [["Done"]]
        }, {
            id: "ideas",
            target: () => { return document.body },
            type: "shader",
            contents: `<h1>Ideas with Polymorph</h1><h2>A whole new space for ideas to grow!</h2> `,
            to: [["Next", "idlist"], ["Skip"]]
        }, {
            id: "idlist",
            target: () => { return polymorph_core.getOperator("nvd5b4").topdiv },
            type: "internal",
            location: 'center',
            contents: `<p>Here's a list of ideas! Click an idea to view more detail about it.</p>`,
            to: [["Next", "idfs"], ["Skip"]]
        }, {
            id: "idfs",
            target: () => { return polymorph_core.baseRect.children[1].outerDiv },
            type: "internal",
            location: 'top',
            contents: `<p>This frame contains various aspects of a project. You can click any of the purple tabs to switch between frames!</p>`,
            to: [["Next", "idsv"], ["Skip"]]
        }, {
            id: "idsv",
            target: document.body,
            type: "shader",
            contents: `<h1>Sharing</h1>
      <p>This document is saved in realtime, so you can collaborate with your friends. Just share the link up the top!</p>`,
            to: [["Done"]]
        }
    ]);
    //wait for a baserect to show before continuing the tutorial
    polymorph_core.on("viewReady", () => {
        polymorph_core.tutorial.continueStart(() => { polymorph_core.tutorial.start(); });
    })
})



///////////////////////////////////////////////////////////////////////////////////////
//Also handle individual tutorials.
/* TODO: change this to topbar format.
polymorph_core.on("titleButtonsReady", () => {
  document.querySelector("li.hleptute").addEventListener("click", () => {
    polymorph_core.target().then((id) => {
      if (polymorph_core.getOperator(id).operator.startTutorial) polymorph_core.getOperator(id).operator.startTutorial();
    })
  })
  document.querySelector("li.hlepdocs").addEventListener("click", () => {
    //navigate to another help file.
    window.open(window.location.pathname + "docs", "_blank");
  })
  document.querySelector("li.hlepreport").addEventListener("click", () => {
    window.open("mailto:steeven.liu2@gmail.com?subject=Polymorph - Issue");
  })
})
*/;

(() => {

    //navigator.serviceWorker.controller.postMessage("not even ready yet");


    /*let checkForURLConflict=()=>{}
    navigator.serviceWorker.register('core_modules/core/core.workersync.js', {scope: './'}).then(function(registration) {
        if (registration.active){
            console.log("yay im active");
            //navigator.serviceWorker.controller.postMessage("hello world!");
        }
    });*/
    let instance_uuid = polymorph_core.guid();
    const broadcast = new BroadcastChannel('channel1');
    let is_challenger = false;
    let alt_alive_warning = document.createElement("div");
    alt_alive_warning.innerHTML = `
        <div style="padding:10vw">
            <h1>Warning! This document is already open in another window. Please use the other window instead.</h1>
        </div>
    `;
    alt_alive_warning.style.cssText = `
    display:none;
    place-items: center center;
    position:absolute;
    height:100%;
    width:100%;
    z-index:2;
    background: rgba(0,0,0,0.5);
    color:white;
    text-align:center;
    `;
    document.body.appendChild(alt_alive_warning);
    broadcast.onmessage = (event) => {
        if (event.data.url == window.location.href && event.data.uuid != instance_uuid) {
            if (is_challenger) {
                alt_alive_warning.style.display = "grid";
                // seppuku
            } else {
                broadcast.postMessage({
                    url: window.location.href,
                    uuid: instance_uuid
                })
            }
        }
    };
    function checkForURLConflict() {
        broadcast.postMessage({
            url: window.location.href,
            uuid: instance_uuid
        })
        is_challenger = true;
        setTimeout(() => is_challenger = false, 500);
    }
    checkForURLConflict();
    Object.defineProperty(polymorph_core, "saveSourceData", {
        get: () => {
            return polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources;
        }
    })

    let handleSrc = (params, userdata) => {
        if (params.has('src')) {
            //check if there is an instance of this save source, and that it is being pulled from.
            //otherwise do nothing
            let srcFine = false;
            for (let i of userdata) {
                if (i.type == params.get('src')) {
                    if (i.load == true) {
                        srcFine = true;
                        break;
                    }
                }
            }
            if (!srcFine) {
                for (let i of userdata) {
                    if (i.type == params.get('src')) {
                        i.load = true;
                        srcFine = true;
                        break;
                    }
                }
            }
            if (!srcFine) {
                userdata.push({
                    type: params.get('src'),
                    load: true,
                    save: true,
                    data: { id: polymorph_core.currentDocID }
                });
            }
            polymorph_core.saveUserData();
            return true;
        } else return false;
    }

    polymorph_core.handleURL = async function () {
        let params = new URLSearchParams(window.location.search);
        polymorph_core.resetDocument();
        let sourcesToAdd = [];
        if (params.has('doc')) {
            polymorph_core.currentDocID = params.get("doc");
        } else {
            for (let i in polymorph_core.saveSources) {
                if (polymorph_core.saveSourceOptions[i].canHandle) {
                    let result = await polymorph_core.saveSourceOptions[i].canHandle(params);
                    if (result) {
                        polymorph_core.currentDocID = result.id;
                        sourcesToAdd.push({
                            load: true,
                            save: true,
                            type: i,
                            data: result.source
                        });
                    }
                }
            }
        }

        if (params.has("o")) {
            //trim the open flag
            let loc = window.location.href
            loc = loc.replace(/\?o/, "");
            history.pushState({}, "", loc);
            // this is antiquated behaviour and will be deprecated in future.
        }
        if (!polymorph_core.currentDocID) {
            //Looks like we're not trying to load any new documents [TODO: catch when we CANT load a document but are trying]
            polymorph_core.currentDocID = polymorph_core.guid(6, polymorph_core.userData.documents);
            //add a local save source automatically; and then the user can add more save sources if they'd like
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);
            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push(
                {
                    load: true,
                    save: true,
                    type: 'lf',
                    data: {
                        id: polymorph_core.currentDocID
                    }
                }
            );
            if (isPhone()) polymorph_core.userData.documents[polymorph_core.currentDocID].autosave = true;
            polymorph_core.saveUserData();
            //Don't attempt to load, since there is nothing to load in the first place
            //Show the loading operator
            polymorph_core.templates.blankNewDoc._meta.id = polymorph_core.currentDocID;
            polymorph_core.integrateData(polymorph_core.templates.blankNewDoc, "CORE_FAULT");
            //set the url to this document's url
            history.pushState({}, "", window.location.href + "?doc=" + polymorph_core.currentDocID);
            checkForURLConflict();

            let newInstance = new polymorph_core.saveSources['lf'](polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[0]);
            polymorph_core.saveSourceInstances.push(newInstance);
        } else {
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);

            let result = handleSrc(params, polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources);
            if (result) sourcesToAdd.push(result);

            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push.apply(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources, sourcesToAdd);

            if (polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.length == 0) {
                if (confirm("Warning! This document doesn't have any save sources attached to it, so all your work will be lost. Would you like to add a local storage source? [OK] Otherwise, please go to file>preferences to manually add a save source.")) {
                    polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push(
                        {
                            load: true,
                            save: true,
                            type: 'lf',
                            data: {
                                id: polymorph_core.currentDocID
                            }
                        }
                    )
                };
            }
            polymorph_core.saveUserData();

            let successfulLoads = 0;
            for (let u = 0; u < polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.length; u++) {
                let i = polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[u];
                if (!polymorph_core.saveSources[i.type]) {
                    if (confirm(`Ack! Looks like the ${i.type} save source is not working right now. Remove it?`)) {
                        polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.splice(u, 1);
                        polymorph_core.saveUserData();
                        u--;
                    };
                    continue;
                } else {
                    let newInstance = new polymorph_core.saveSources[i.type](i);
                    polymorph_core.saveSourceInstances.push(newInstance);
                    if (i.load) {
                        (async () => {
                            try {

                                d = await newInstance.pullAll();
                                polymorph_core.integrateData(d, i.type);
                            } catch (e) {
                                alert("Something went wrong with the save source: " + e);
                                throw (e);
                            }

                        })();
                    }
                }
            }
            //try and catch when there is no data at all
            for (let i of polymorph_core.saveSourceInstances) {
                if (i.unhook) i.unhook();
                if (i.settings.save) {
                    if (i.hook) i.hook();
                }
            }

            //clear out url elements
            window.history.pushState("", "", window.location.origin + window.location.pathname + `?doc=${polymorph_core.currentDocID}`);
            //templates have been moved to their own module [todo]
        }
        document.querySelector(".wall").style.display = "none";
    }

    //This is called by polymorph_core.handleURL and the filescreen.
    polymorph_core.sanityCheckDoc = function (data) {
        //if none then create new
        if (!data) {
            data = polymorph_core.templates.blankNewDoc;
            data._meta.id = polymorph_core.currentDocID;
            polymorph_core.fire("documentCreated", { id: polymorph_core.currentDocID, data: data });
            //do anything else e.g. phone autosave
        }

        //Decompress
        data = polymorph_core.datautils.decompress(data);

        //Upgrade if necessary
        if (!data._meta) {
            data = polymorph_core.datautils.viewToItems(data);
        }

        //Do some sanity checks 
        if (!(data._meta.currentView && data[data._meta.currentView] && data[data._meta.currentView]._rd)) {
            for (let i in data) {
                //choose a view to assign as default
                if (data[i]._rd && !(data[i]._rd.p)) {
                    data._meta.currentView = i;
                    break;
                }
            }
            //if still not good, then add a new views
            if (!(data._meta.currentView && data[data._meta.currentView]._rd)) {
                //Add our first rect
                let newRectID = polymorph_core.guid(6, data);
                data[newRectID] = {
                    _rd: { //we need some initial data otherwise rect deletion gets weird
                        x: 0,
                        f: 0,
                        ps: 1
                    }
                };
                data._meta.currentView = newRectID;

                //Also add an operator
                let newOperatorID = polymorph_core.guid(6, data);
                data[newOperatorID] = {
                    _od: { t: "opSelect", p: newRectID }
                }
                data[newRectID]._rd.s = newOperatorID;
            }
        }

        //make sure all items have an _lu_s property.
        for (let i in data) {
            if (!data[i]._lu_) {
                data[i]._lu_ = 0; // so as to not overwrite other stuff if initially it was null
            }
        }

        return data;
    }

    polymorph_core.resetDocument = function () {
        polymorph_core.items = {};
        polymorph_core.containers = {};
        for (let i in polymorph_core.rects) {
            polymorph_core.rects[i].outerDiv.remove();
            delete polymorph_core.rects[i];
        }
        polymorph_core.unsaved = false;
        if (polymorph_core.saveSourceInstances) {
            for (let i of polymorph_core.saveSourceInstances) {
                if (i.unhook) i.unhook();
            }
        }
        polymorph_core.saveSourceInstances = [];
    }

    polymorph_core.saveSources = {};
    polymorph_core.saveSourceOptions = {};

    polymorph_core.registerSaveSource = function (id, f, ops) {
        polymorph_core.saveSources[id] = f;
        polymorph_core.saveSourceOptions[id] = ops || {};
        //create a wrapper for it in the loading dialog
        //THIS IS A CROSSOVER WITH loadsavedialog.js. Please formalise
        if (ops.createable) polymorph_core.loadInnerDialog.querySelector('.nss select').appendChild(htmlwrap(`<option value='${id}'>${ops.prettyName || id}</option>`));

    }

    polymorph_core.switchView = function (view) {
        polymorph_core.items._meta.currentView = view;
        while (document.body.querySelector(".rectspace").children.length) document.body.querySelector(".rectspace").children[0].remove();
        document.body.querySelector(".rectspace").appendChild(polymorph_core.rects[polymorph_core.items._meta.currentView].outerDiv);
        //reset and present a view
        polymorph_core.rects[polymorph_core.items._meta.currentView].refresh();
    };


    polymorph_core.integrateData = function (data, source) { // source: string
        //sanity check, decompress etc the data
        data = polymorph_core.sanityCheckDoc(data);
        //ensure the data id is matching; if not then @ the user
        if (data._meta.id != polymorph_core.currentDocID) {
            if (confirm(`A source (${source}) seems to be storing a different document (${data._meta.id}) to the one you requested (${polymorph_core.currentDocID}). Continue loading?`)) {
                if (confirm(`Overwrite the incoming data ID to ${polymorph_core.currentDocID}? [OK] Or load the imported data in a separate window [cancel]?`)) {
                    data._meta.id = polymorph_core.currentDocID;
                } else {
                    polymorph_core.datautils.upgradeSaveData(data._meta.id, source);
                    polymorph_core.userData.documents[data._meta.id].saveSources[source] = polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[source];
                    polymorph_core.saveUserData();
                    window.location.href = `?doc=${data._meta.id}`;
                }
            } else {
                return;
            }
        }
        for (let i in data) {
            if (!polymorph_core.items[i] || data[i]._lu_ > polymorph_core.items[i]._lu_) {
                polymorph_core.items[i] = data[i];
            }
        }
        if (!polymorph_core.rects) polymorph_core.rects = {};
        //rects need each other to exist so they can attach appropriately, so do this separately to item adoption
        for (let i in data) {
            if (polymorph_core.items[i]._rd && !polymorph_core.rects[i]) {
                //overwriting rects? for future
                polymorph_core.rects[i] = new polymorph_core.rect(i);
            }
        }

        if (!polymorph_core.containers) polymorph_core.containers = {};
        for (let i in data) {
            if (polymorph_core.items[i]._od && !polymorph_core.containers[i]) {
                polymorph_core.containers[i] = new polymorph_core.container(i);
            }
        }

        for (let i in data) {
            //shouldnt hurt to fire update on other items
            polymorph_core.fire('updateItem', { id: i, loadProcess: true });
        }
        //show the prevailing rect
        polymorph_core.switchView(polymorph_core.items._meta.currentView);
        polymorph_core.datautils.linkSanitize();
        polymorph_core.updateSettings(true);

    }

})();


polymorph_core.saveSourceTemplate = function saveSourceTemplate(save_source_record) {
    this.settings = save_source_record;
}

//your run of the mill templates
polymorph_core.templates = {
    brainstorm: JSON.parse(`{"displayName":"New Workspace","currentView":"default","id":"itemcluster","views":{"default":{"o":[{"name":"Itemcluster 2","opdata":{"type":"itemcluster2","uuid":"i33lyy","tabbarName":"Itemcluster 2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"currentViewName":"7hj0","viewpath":["7hj0"]}}}],"s":0,"x":0,"f":1,"p":0}},"items":{"7hj0":{"itemcluster":{"viewName":"New Itemcluster"}}}}`),
    blankNewDoc: {
        "_meta": {
            "displayName": "New Polymorph Document",
            "id": "blank",
            "contextMenuItems": ["Delete::polymorph_core.deleteItem", "Background::item.edit(style.background)", "Foreground::item.edit(style.color)"],
            "_lu_": 0,
            "currentView": "default_container",
            "globalContextMenuOptions": ["Style::Item Background::item.edit(item.style.background)", "Style::Text color::item.edit(item.style.color)"]
        }, "default_container": {
            "_rd": { "x": 0, "f": 0, "ps": 1, "s": "default_operator" },
            "_lu_": 0
        },
        "default_operator": {
            "_od": {
                "t": "welcome", "data": {}, "inputRemaps": {}, "outputRemaps": {},
                "tabbarName": "Home",
                "p": "default_container"
            },
            "_lu_": 0
        }
    }
};

/*
To implement a dialog:


see reference lol


*/


function _dialogManager(userSettings) {
    let me = this;
    this.settings = {
        //set to true to allow the dialog manager to automatically detect new dialogs. May result in diminished performance.
        autoDialogUpgrade: false,

        //if true, will add a close button (a big X) next to the innermost level
        addCloseButton: true,
        //Items with this class will not add a close button, even if addClosebutton is true.
        noCloseClass: "noClose",
        //class of the close button. A close handler is included but like don't include this elsewhere? Modify if you want
        closeButtonClass: 'cb',
        //////////////////The below is mostly styling, modify if you want.//////////////////
        closeButtonStyle: `
            position: absolute;
            top: 0px;
            right: 0px;
            font-size:2em;
            margin: 26px;
            padding: 3px;
            border-radius:20px;
            background: #ad2222;
            width: 1em;
            height: 1em;
            text-align: center;
            color: white;
            font-family: sans-serif;
        `,

        dialogLayers: [ // Layers of wrapping for the dialog. The outermost layer will be scanned for.
            {
                className: "dialog",
                styling: `
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width:100%;
                height:100%;
                background-color: rgba(0,0,0,0.5);
                z-index:1000;
            `
            },
            {
                className: "midmid",
                styling: `
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
            `
            },
            {
                className: "mid",
                styling: `
                height:90%;
                margin-top:5%;
            `
            },
            {
                className: "innerDialog",
                styling: `
                position:relative;
                display: flex;
                flex-direction: column;
                margin: auto;
                min-height: 60%;
                max-width: 80%;
                max-height: 80%;
                overflow-y: auto;
                max-width: 80%;
                background-color: white;
                border-radius: 5px;
                padding: 30px;
            `
            }
        ]
    }

    if (userSettings) Object.assign(this.settings, userSettings);
    this.checkDialogs = (root) => {
        let returns = [];
        if (!root) root = document.body;
        let _toCheckDialogs = root.querySelectorAll("." + me.settings.dialogLayers[0].className);
        let toCheckDialogs = [];
        for (let i = 0; i < _toCheckDialogs.length; i++) {
            toCheckDialogs.push(_toCheckDialogs[i]);
        }
        if (root.matches("." + me.settings.dialogLayers[0].className)) toCheckDialogs.push(root);
        for (let i = 0; i < toCheckDialogs.length; i++) {
            let e = toCheckDialogs[i];
            if (!(e.children.length && e.children[0].classList.contains(me.settings.dialogLayers[1].className))) {
                //create the new dialog!
                let parent = e.parentElement;
                let prediv = e;
                for (let i = me.settings.dialogLayers.length - 1; i >= 0; i--) {
                    let thisdiv = document.createElement("div");
                    //chuck the relevant css in.
                    thisdiv.style.cssText = me.settings.dialogLayers[i].styling;
                    thisdiv.classList.add(me.settings.dialogLayers[i].className);
                    thisdiv.appendChild(prediv);
                    prediv = thisdiv;
                }
                //copy classes up to top level div
                e.classList.forEach((v, i) => {
                    prediv.classList.add(v);
                });
                //add the close button
                if (!e.classList.contains(me.settings.noCloseClass)) {
                    let closeButton = document.createElement("div");
                    closeButton.innerText = "X";
                    closeButton.style.cssText = me.settings.closeButtonStyle;
                    closeButton.classList.add(me.settings.closeButtonClass);
                    let closeDialogHandler = () => {
                        prediv.style.display = "none";
                        //act as if close button was clicked   
                    }
                    closeButton.addEventListener("click", closeDialogHandler);
                    e.parentElement.appendChild(closeButton);
                    //only bind escape close to dialogs that have a closeButton
                    window.addEventListener("keydown", (e) => {
                        if (e.key == "Escape" && prediv.style.display!="none") {
                            closeButton.click();
                        }
                    });
                }
                while (e.classList.length) e.classList.remove(e.classList[e.classList.length - 1]);

                if (parent) {
                    //add the stack to the parent
                    parent.appendChild(prediv);
                }
                //Block events to lower levels from dialogs: mostly doubleclick and click
                //This should not be delegated because we want to catch it as early up the dom tree as possible.
                prediv.addEventListener("click", (e) => {
                    e.stopImmediatePropagation()
                });
                prediv.addEventListener("dblclick", (e) => {
                    e.stopImmediatePropagation()
                });
                returns.push(prediv);
            }
        }
        return returns;
    }


    //css for the close button
    //let s=document.createElement("style");
    //s.innerHTML=`.` + me.settings.closeButtonClass + me.settings.closeButtonStyle;
    //document.head.appendChild(s);
    me.mo = new MutationObserver(me.checkDialogs);
    //document.addEventListener("DOMContentLoaded", () => {
    if (me.settings.autoDialogUpgrade) {
        let config = {
            childList: true,
            subtree: true
        };
        if (document.readyState != "loading") me.mo.observe(document.body, config);
        else document.addEventListener("DOMContentLoaded", () => me.mo.observe(document.body, config));
    }
}

var dialogManager = new _dialogManager();

polymorph_core.dialog = {};
polymorph_core.dialog.div = document.createElement("div");
polymorph_core.dialog.div.classList.add("dialog");
polymorph_core.dialog.div = dialogManager.checkDialogs(polymorph_core.dialog.div)[0];
polymorph_core.dialog.innerDialog = polymorph_core.dialog.div.querySelector(".innerDialog");
document.body.appendChild(polymorph_core.dialog.div)
//polymorph_core.dialog.currentBaseOperator

//Register a dialog to a calling rect. Rect calls this when the settings cog is clicked.
polymorph_core.dialog.prompt = function (dialog, closeCB) {
    //instantly show a dialog with contents 'dialog'.
    //use HTMLwrap to create a dom element or otherwise.
    while (polymorph_core.dialog.innerDialog.children.length > 2) polymorph_core.dialog.innerDialog.children[2].remove();
    polymorph_core.dialog.innerDialog.appendChild(dialog);
    polymorph_core.dialog.div.style.display = "block";
    polymorph_core.dialog.closeCB = closeCB;
}
polymorph_core.dialog.div.querySelector(".cb").addEventListener("click", function () {
    if (polymorph_core.dialog.closeCB) {
        try {
            polymorph_core.dialog.closeCB(polymorph_core.dialog.innerDialog);
        } catch (e) {
            console.log(e);
        }
        polymorph_core.dialog.closeCB = undefined;
    }

});

if (!polymorph_core.userData.tutorialData) {
    polymorph_core.userData.tutorialData = { main: {} };
}


var _tutorial = (function () {
    function evalGet(itm) {
        if (typeof (itm) == "function") return itm();
        else return itm;
    }

    let types = {
        shader: {
            render: function (itm, callback) {
                let data = {};
                data.div = document.createElement("div");
                data.div.style.cssText = `position:absolute; 
              height:100%; 
              width:100%; 
              display:flex;
              flex-direction:column;
              background: rgba(0,0,0,0.7);
              z-index:300;
              top:0;
              left:0;`;
                data.innerdiv = document.createElement("div");
                data.div.appendChild(data.innerdiv);
                data.innerdiv.innerHTML = itm.contents;
                data.innerdiv.style.cssText = `flex: 0 1 auto;
              margin: auto;
              text-align: center;
              color: white;
              padding: 1em;
              `;
                if (itm.to) {
                    for (let i = 0; i < itm.to.length; i++) {
                        let btn = document.createElement("button");
                        btn.innerHTML = itm.to[i][0];
                        btn.addEventListener("click", () => {
                            callback(itm.to[i][1]);
                        })
                        data.innerdiv.appendChild(btn);
                    }
                } else {
                    data.button = document.createElement("button");
                    data.button.innerHTML = "Next";
                    data.button.addEventListener("click", function () {
                        callback();
                    })
                    data.innerdiv.appendChild(data.button);
                }
                evalGet(itm.target).appendChild(data.div);
                return data;
            },
            unrender: function (data) {
                data.div.remove();
            }
        },
        internal: {
            render: function (itm, callback) {
                let data = {};
                data.div = document.createElement("div");
                data.div.classList.add("tutorial");
                data.div.style.cssText = `position: absolute;
              height: fit-content;
              width: fit-content;
              display: block;
              background: rgba(0, 0, 0, 0.7);
              z-index: 300;`;
                switch (itm.location) {
                    default:
                    case 'left':
                        data.div.style.cssText += `top: 50%;
                      transform: translateY(-50%);`;
                        break;
                    case 'bottom':
                        data.div.style.cssText += `bottom: 0%;
                      left: 50%;
                      transform: translateX(-50%);`;
                        break;
                    case 'top':
                        data.div.style.cssText += `
                      left: 50%;
                      top: 0%;
                      transform: translateX(-50%);`;
                        break;
                    case 'center':
                        data.div.style.cssText += `
                      left: 50%;
                      top: 50%;
                      transform: translate(-50%,-50%);`;
                        break;
                }
                data.innerdiv = document.createElement("div");
                data.div.appendChild(data.innerdiv);
                data.innerdiv.innerHTML = itm.contents;
                data.innerdiv.style.cssText = `flex: 0 1 auto;
              margin: auto;
              text-align: center;
              color: white;
              padding: 1em;
              `;
                if (itm.to) {
                    for (let i = 0; i < itm.to.length; i++) {
                        let btn = document.createElement("button");
                        btn.innerHTML = itm.to[i][0];
                        btn.addEventListener("click", () => {
                            callback(itm.to[i][1]);
                        })
                        data.innerdiv.appendChild(btn);
                    }
                } else {
                    data.button = document.createElement("button");
                    data.button.innerHTML = "Next";
                    data.button.addEventListener("click", function () {
                        callback();
                    })
                    data.innerdiv.appendChild(data.button);
                }
                evalGet(itm.target).appendChild(data.div);

                return data;
            },
            unrender: function (data) {
                data.div.remove();
            }
        }
    }

    //snippet that pre-evaluates functions, so that we can quickly load dynmaics
    function iff(it) {
        if (typeof it == "function") {
            return it();
        } else return it;
    }

    function mkhash(obj) {
        let str;
        if (typeof obj == "object") str = JSON.stringify(obj);
        else str = obj.toString();
        var hash = 0, i, chr;
        if (str.length === 0) return hash.toString();
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    };

    function _tutorial(options) {
        this.firstItem = false;
        this.items = {};
        let lastData;
        let lastType;
        let me = this;
        this.present = function (id, onErr) {
            //hide the previous slide
            if (lastData) {
                types[lastType].unrender(lastData);
            }
            if (id) {
                //present the current item
                let data = iff(options.data);
                data.step = id;
                if (options.saveData) options.saveData();
                if (!me.items[id]) {
                    if (onErr) onErr();
                    return;
                }
                lastType = me.items[id].type;
                lastData = types[me.items[id].type].render(me.items[id], me.present);
            } else {
                me.end();
            }
            //otherwise finish
        }
        this.addSteps = function (steps) {
            steps.forEach((v) => { this.addStep(v) });
        }
        this.addStep = function (item) {
            //if no id then generate a uuid? 
            //needs to be deterministic
            if (!item.id) {
                item.id = mkhash(item);
            }
            if (!this.firstItem) {
                this.firstItem = item.id;
            }
            this.items[item.id] = item;
            return item.id
        }
        this.start = function (id, onErr) {
            if (!id) {
                id = this.firstItem;
            }
            this.present(id, onErr);
            return {
                end: (f) => { me._end = f; }
            }
        }
        this.continueStart = function (onErr) {
            let data = iff(options.data);
            if (!data.concluded) this.start(data.step, onErr);
            //continue based on saved tutorial data
        }
        this.end = function () {
            let data = iff(options.data);
            data.concluded = true;
            if (options.saveData) options.saveData();
            me._end;
        }
    }
    return _tutorial;
})();


polymorph_core.tutorial = new _tutorial({
    data: () => { return polymorph_core.userData.tutorialData.main },
    saveData: () => { polymorph_core.saveUserData() }
});
polymorph_core.resetTutorial = function () {
    polymorph_core.userData.tutorialData = { main: {} };
    polymorph_core.tutorial.start();
}
polymorph_core.on("UIstart", () => {
    polymorph_core.tutorial.addSteps([
        {
            target: document.body,
            type: "shader",
            contents: `<h1>Welcome to Polymorph!</h1><h2>Productivity, your way.</h2> `,
            to: [["Next", "cnd"], ["Skip"]]
        },
        {
            id: "cnd",
            target: () => { return polymorph_core.baseRect.outerDiv },
            type: "internal",
            location: 'left',
            contents: `<p>&lt;---Shift-Click and drag this border to split the item! (Then, just click and drag to resize)</p>`,
            to: [["Next", "clickop"], ["Skip"]]
        }, {
            id: "clickop",
            target: () => { return polymorph_core.baseRect.outerDiv },
            type: "internal",
            location: 'center',
            contents: `<p>These boxes contain operators. Click an operator type to get started!</p>`,
            to: [["Next", "save"], ["Skip"]]
        }, {
            id: "save",
            target: document.body,
            type: "shader",
            contents: `<p>To save your work, simply press Ctrl-S. Your work will be saved in your browser.</p>`,
            to: [["Done"]]
        }, {
            id: "ideas",
            target: () => { return document.body },
            type: "shader",
            contents: `<h1>Ideas with Polymorph</h1><h2>A whole new space for ideas to grow!</h2> `,
            to: [["Next", "idlist"], ["Skip"]]
        }, {
            id: "idlist",
            target: () => { return polymorph_core.getOperator("nvd5b4").topdiv },
            type: "internal",
            location: 'center',
            contents: `<p>Here's a list of ideas! Click an idea to view more detail about it.</p>`,
            to: [["Next", "idfs"], ["Skip"]]
        }, {
            id: "idfs",
            target: () => { return polymorph_core.baseRect.children[1].outerDiv },
            type: "internal",
            location: 'top',
            contents: `<p>This frame contains various aspects of a project. You can click any of the purple tabs to switch between frames!</p>`,
            to: [["Next", "idsv"], ["Skip"]]
        }, {
            id: "idsv",
            target: document.body,
            type: "shader",
            contents: `<h1>Sharing</h1>
      <p>This document is saved in realtime, so you can collaborate with your friends. Just share the link up the top!</p>`,
            to: [["Done"]]
        }
    ]);
    //wait for a baserect to show before continuing the tutorial
    polymorph_core.on("viewReady", () => {
        polymorph_core.tutorial.continueStart(() => { polymorph_core.tutorial.start(); });
    })
})



///////////////////////////////////////////////////////////////////////////////////////
//Also handle individual tutorials.
/* TODO: change this to topbar format.
polymorph_core.on("titleButtonsReady", () => {
  document.querySelector("li.hleptute").addEventListener("click", () => {
    polymorph_core.target().then((id) => {
      if (polymorph_core.getOperator(id).operator.startTutorial) polymorph_core.getOperator(id).operator.startTutorial();
    })
  })
  document.querySelector("li.hlepdocs").addEventListener("click", () => {
    //navigate to another help file.
    window.open(window.location.pathname + "docs", "_blank");
  })
  document.querySelector("li.hlepreport").addEventListener("click", () => {
    window.open("mailto:steeven.liu2@gmail.com?subject=Polymorph - Issue");
  })
})
*/;

(() => {

    polymorph_core.userSave = function () {
        //save to all sources
        //upgrade older save systems
        let d = polymorph_core.items;
        polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);
        //trigger saving on all save sources
        polymorph_core.fire("userSave", d);
        polymorph_core.unsaved = false;
        let recents = JSON.parse(localStorage.getItem("__polymorph_recent_docs"));
        recents[polymorph_core.currentDocID] = { url: window.location.href, displayName: polymorph_core.currentDoc.displayName };
        localStorage.setItem("__polymorph_recent_docs", JSON.stringify(recents));
    };

    document.body.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key == "s") {
            e.preventDefault();
            polymorph_core.userSave();
            //also do the server save
            // success for green notification box, alert for red box. If second parameter is left out, the box is black
            try {
                //try catch because mobile mode. TODO: Fix this.
                polymorph_core.showNotification('Saved', 'success');
            } catch (e) {
            }
        }
    });

    (() => {
        //////////////////////////////////////////////////////////////////
        //Loading dialogs
        let loadDialog = document.createElement("div");
        loadDialog.classList.add("dialog");
        loadDialog = dialogManager.checkDialogs(loadDialog)[0];

        polymorph_core.loadInnerDialog = document.createElement("div");
        loadDialog.querySelector(".innerDialog").appendChild(polymorph_core.loadInnerDialog);
        polymorph_core.loadInnerDialog.classList.add("loadInnerDialog")
        polymorph_core.loadInnerDialog.innerHTML = `
    <style>
    .loadInnerDialog>div{
        border: 1px solid;
        position:relative;
    }
    .loadInnerDialog>div>h2{
        margin:0;
    }
    </style>
          <h1>Load/Save settings</h1>
          `;


        let autosaveOp = new polymorph_core._option({
            div: polymorph_core.loadInnerDialog,
            type: "bool",
            object: () => {
                return polymorph_core.userData.documents[polymorph_core.currentDocID]
            },
            property: "autosave",
            label: "Autosave all changes"
        });
        polymorph_core.autosaveCapacitor = new capacitor(200, 20, polymorph_core.userSave);
        polymorph_core.on("updateItem", function (d) {
            if (polymorph_core.userData.documents[polymorph_core.currentDocID].autosave && !polymorph_core.isSaving) {
                polymorph_core.autosaveCapacitor.submit();
            }
        });

        //adding additional savesources
        polymorph_core.loadInnerDialog.appendChild(htmlwrap(`
        <label class="nss">Add new savesource<select></select><button>Add</button></label>`))
        let nss = polymorph_core.loadInnerDialog.querySelector('.nss');
        nss.querySelector("button").addEventListener("click", () => {
            let newSaveSource = {
                load: false,
                save: false,
                type: nss.querySelector('select').value,
                data: {
                    id: polymorph_core.currentDocID
                }
            };
            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push(newSaveSource)
            polymorph_core.saveSourceInstances.push(new polymorph_core.saveSources[nss.querySelector("select").value](newSaveSource));
            //reshow the dialog cos i cbs
        });

        //store the savedialogs so that we can toggle their save/load checkboxes down the line
        let saveDialogInstances = [];

        polymorph_core.addToSaveDialog = function (save_source_instance) {
            //called by instance on load.
            let wrapperText = `
        <div>
            <h2>${polymorph_core.saveSourceOptions[save_source_instance.settings.type].prettyName || save_source_instance.settings.type}</h2>
            <span>`;
            wrapperText += `<label>Save to this source<input data-role="tsync" type="checkbox"></input></label>`;
            wrapperText += `<label>Load from this source<input data-role="lsync" type="checkbox"></input></label>`;
            if (save_source_instance.pullAll) wrapperText += `<button data-role="dlg_hardLoad">Load from this source</button>`;
            if (save_source_instance.pullAll) wrapperText += `<button data-role="dlg_softLoad">Merge from this source</button>`;
            if (save_source_instance.pushAll) wrapperText += `<button data-role="dlg_save">Save to this source</button>`;
            wrapperText += `</span>
        </div>
        `;
            let wrapper = htmlwrap(wrapperText);

            let hookIfExists = (sel, e, f) => {
                if (wrapper.querySelector(sel)) {
                    wrapper.querySelector(sel).addEventListener(e, f);
                }
            }
            hookIfExists("[data-role='tsync']", 'input', (e) => {
                save_source_instance.settings.save = e.target.checked;
                polymorph_core.saveUserData();
            })
            hookIfExists("[data-role='lsync']", 'input', (e) => {
                save_source_instance.settings.load = e.target.checked;
                polymorph_core.saveUserData();
            })
            hookIfExists("[data-role='dlg_save']", "click", () => {
                save_source_instance.pushAll(polymorph_core.items);
            });
            hookIfExists("[data-role='dlg_hardLoad']", "click", async () => {
                if (confirm("Overwrite existing data? You will lose any unsaved work.")) {
                    polymorph_core.resetDocument();
                    try {
                        d = await save_source_instance.pullAll();
                        polymorph_core.integrateData(d, i.type);
                    } catch (e) {
                        alert("Something went wrong with the save source: " + e);
                        throw (e);
                        //todo: restore document
                    }
                }
            });
            //Load from the save source
            hookIfExists("[data-role='dlg_softLoad']", "click", async () => {
                try {
                    d = await save_source_instance.pullAll();
                    polymorph_core.integrateData(d, i.type);
                } catch (e) {
                    alert("Something went wrong with the save source: " + e);
                    throw (e);
                    //todo: restore document
                }
            });
            //also register its settings in the save dialog
            if (save_source_instance.dialog) wrapper.appendChild(save_source_instance.dialog);
            polymorph_core.loadInnerDialog.appendChild(wrapper);
            saveDialogInstances.push({
                div: wrapper,
                instance: save_source_instance
            });
        }

        document.body.appendChild(loadDialog);

        //make it a function so that phone can use it
        polymorph_core.showSavePreferencesDialog = () => {
            for (let i of saveDialogInstances) {
                if (i.instance.showDialog) i.instance.showDialog();
                if (i.instance.settings.save) {
                    i.div.querySelector(`[data-role='tsync']`).checked = true;
                }
                if (i.instance.settings.load) {
                    i.div.querySelector(`[data-role='lsync']`).checked = true;
                }
            }
            autosaveOp.load();
            loadDialog.style.display = "block";
        }

        polymorph_core.on("UIstart", () => {
            polymorph_core.topbar.add("File/Preferences").addEventListener("click", () => {
                polymorph_core.showSavePreferencesDialog();
            });
        });
        loadDialog.querySelector(".cb").addEventListener("click", polymorph_core.saveUserData);
    })();

    //a little nicety to warn user of unsaved items.
    polymorph_core.unsaved = false;
    polymorph_core.on("updateItem", (e) => {
        if (!e || !e.loadProcess) {//if event was not triggered by a loading action
            polymorph_core.unsaved = true;
        }
    })
    window.addEventListener("beforeunload", (e) => {
        if (polymorph_core.unsaved) {
            e.preventDefault();
            e.returnValue = "Hold up, you seem to have some unsaved changes. Are you sure you want to close this window?";
        }
    })

})();;

polymorph_core.datautils = {};
//detect and perform all decompression operations.
//compressions should be an array of object with type = the type of compression used.
polymorph_core.datautils.decompress = function (data) {
    if (data.compressions) {
        for (let i = 0; i < data.compressions.length; i++) {
            data = polymorph_core.datautils[data.compressions[i].type].decompress(data, i);
        }
        return data.items;
    }
    else return data;
}

polymorph_core.datautils.precompress = function (data, type) {
    //Deep copy it, just in case
    data = JSON.parse(JSON.stringify(data));

    if (!data.compressions) {
        data = {
            compressions: [],
            items: data
        }
    }
    data.compressions.push({ type: type });
    return data;
}

polymorph_core.datautils.IDCompress = {
    compress: function (data) {
        data = polymorph_core.datautils.precompress(data, "IDCompress");
        let propDict = {};
        for (let i in data.items) {
            for (let j in data.items[i]) {
                if (!propDict[j]) propDict[j] = 0;
                propDict[j]++;
            }
        }
        let encodingIndex = 1;
        function numberToEncodable(n) {
            let base = "qwertyuiopasdfghjklzxcvbnm";
            if (n == 0) return base[0];
            let output = "";
            let max = Math.floor(Math.log(n) / Math.log(base.length));
            for (let i = 0; i <= max; i++) {
                output = base[n % base.length] + output;
                n = Math.floor(n / base.length);
            }
            return output;
        }
        data.compressions[data.compressions.length - 1].keymap = {};
        let km = data.compressions[data.compressions.length - 1].keymap;
        for (let i in propDict) {
            //it will instead be stored in something like xyz:v, v:... so v*(propdict+1)+3 or something.
            if (i.length * propDict[i] > 3 * (propDict[i] + 1) + i.length) {
                //compress this
                while (propDict[numberToEncodable(encodingIndex)]) {
                    encodingIndex++;
                }
                let newkey = numberToEncodable(encodingIndex);
                km[newkey] = i;
                for (let it in data.items) {
                    if (data.items[it][i]) {
                        data.items[it][newkey] = data.items[it][i];
                        delete data.items[it][i];
                    }
                }
                //increment so we dont use the same keys
                encodingIndex++;
            }
        }
        return data;
    },
    decompress: function (data, cid) {
        for (let it in data.items) {
            for (let k in data.compressions[cid].keymap) {
                if (data.items[it][k]) {
                    data.items[it][data.compressions[cid].keymap[k]] = data.items[it][k];
                    delete data.items[it][k];
                }
            }
        }
        return data;
    }
}

polymorph_core.datautils.linkSanitize = () => {
    //clean out all links which point to invalid things.
    for (let i in polymorph_core.items) {
        if (polymorph_core.items[i].to) {
            for (let j in polymorph_core.items[i].to) {
                if (!polymorph_core.items[j]) {
                    delete polymorph_core.items[i].to[j];
                }
            }
        }
    }
}

polymorph_core.datautils.viewToItems = (obj) => {
    //_meta is special. Just a little safeguard so it doesnt get overwritten or anything.
    let newObj = {};
    for (let i in obj.items) {
        newObj[i] = obj.items[i];
    }
    //metadata
    let meta = {};
    for (let m in obj) {
        if (m != "items" && m != "views") {
            meta[m] = obj[m];
            meta[m].lastChanged = Date.now();
        }
    }
    newObj._meta = meta;
    //views
    function createObjectFromOperator(o, parent) {
        let obj = { _od: {} };
        Object.assign(obj._od, o.opdata);
        obj._od.t = obj._od.type;
        delete obj._od.type;
        if (parent) {
            obj._od.p = parent;
        }
        //ID is needed before subframe processing
        let newID = polymorph_core.guid(6, newObj);
        newObj[newID] = obj;
        //you need to deal with subrects here as well ://)
        if (obj._od.t == "subframe") {
            createObjectFromRect(obj._od.data.rectUnderData, newID);
        }
        return newID;
    }

    function createObjectFromRect(r, parent, isView) {
        let obj = { _rd: {} };
        Object.assign(obj._rd, r);
        obj._rd.ps = obj._rd.p;
        delete obj._rd.p;
        if (isView) {
            obj._rd.vn = parent;
        } else if (parent) {
            obj._rd.p = parent;
        }
        let newID = polymorph_core.guid(6, newObj);
        newObj[newID] = {};//stake claim to the newID
        if (r.c) {
            createObjectFromRect(r.c[0], newID);
            createObjectFromRect(r.c[1], newID);
        } else if (r.o) {
            let oids = r.o.map((o) => {
                return createObjectFromOperator(o, newID);
            })
            obj._rd.s = oids[r.s];
        }
        delete obj._rd.c;
        delete obj._rd.o;
        newObj[newID] = obj;
        return newID;
    }
    for (let i in obj.views) {
        let newRectID = createObjectFromRect(obj.views[i], i, true);
        if (i == newObj._meta.currentView) newObj._meta.currentView = newRectID;
    }
    return newObj;
}

//called by docloading, and called when the preferences dialog is closed.

polymorph_core.datautils.upgradeSaveData = function (id) {
    if (!polymorph_core.userData.documents[id])polymorph_core.userData.documents[id]={};
    if (!polymorph_core.userData.documents[id].saveSources)polymorph_core.userData.documents[id].saveSources=[];
    if (!polymorph_core.userData.documents[id].saveSources.length){
        //old save source, we need to upgrade
        let newSaveSources=[];
        for (let i in polymorph_core.userData.documents[id].saveSources){
            let new_save_source_record = {
                load: (polymorph_core.userData.documents[id].loadHooks[i])?true:false,
                save: (polymorph_core.userData.documents[id].saveHooks[i])?true:false,
                data: polymorph_core.userData.documents[id].saveSources[i],
                type: i
            }
            if (typeof new_save_source_record.data=='string'){
                new_save_source_record.data={
                    id:new_save_source_record.data
                };
            }
            newSaveSources.push(new_save_source_record);
        }
        polymorph_core.userData.documents[id].saveSources=newSaveSources;
    }
};

//container. Wrapper around an operator.
polymorph_core.newContainer = function (parent, ID) {
    if (!ID) ID = polymorph_core.insertItem({
        _od: {
            p: parent
        }
    })
    else {
        polymorph_core.items[ID]._od = {
            p: parent,
        }
    }
    polymorph_core.containers[ID] = new polymorph_core.container(ID);
    return ID;
}
//child is this.operator.
polymorph_core.container = function container(containerID) {
    this.id = containerID;// necessary when rect passes container down to chilren.
    polymorph_core.containers[containerID] = this;
    //settings and data management
    //#region
    //regions are a vscode thing that allow you to hide stuff without putting it in blocks. It's great. Get vscode.

    Object.defineProperty(this, "settings", {
        get: () => {
            return polymorph_core.items[containerID]._od;
        }
    })

    Object.defineProperty(this, "rect", {
        get: () => {
            return polymorph_core.rects[this.settings.p];
        }
    })

    Object.defineProperty(this, "parent", {
        get: () => {
            return polymorph_core.rects[this.settings.p];
        }
    })

    Object.defineProperty(this, "path", {
        get: () => {
            let i = this;
            let pathArr = [];
            while (i.parent) {
                pathArr.push(i.id);
                i = i.parent;
            }
            return pathArr;
        }
    })

    let defaultSettings = {
        t: "opSelect",
        data: {},
        inputRemaps: {
        },
        outputRemaps: {
            createItem: ["createItem_" + containerID],
            deleteItem: ["deleteItem_" + containerID],
            focusItem: ["focusItem_" + containerID],

        },
        tabbarName: "New Operator"
    };
    /*
    this.path.forEach(i => {
        if (polymorph_core.rects[i] && polymorph_core.rects[i].parent instanceof polymorph_core.rect) {
            let _i = polymorph_core.rects[i].parent.id;
            //if we have a rect in a rect, then that's a split view. Otherwise it's tabs and should act independently.
            let commonOutputs = Object.keys(defaultSettings.outputRemaps);
            commonOutputs.forEach(o => {
                defaultSettings.outputRemaps[o].push(o + "_" + _i);
                defaultSettings.inputRemaps[o + "_" + _i] = o;
            });
        }
    })sounds good, doesnt work (operators are created in order, etc)*/

    Object.assign(defaultSettings, this.settings);
    polymorph_core.items[containerID]._od = defaultSettings;

    //topmost 'root' div.
    this.outerDiv = htmlwrap(`<div style="width:100%;height:100%; background:rgba(230, 204, 255,0.1)"></div>`);

    //inner div. for non shadow divs. has a uuid for an id so that it can be referred to uniquely by the operator. (this is pretty redundant imo)
    this.innerdiv = document.createElement("div");
    this.outerDiv.appendChild(this.innerdiv);
    this.innerdiv.id = polymorph_core.guid(12);

    //shadow root.
    this.shader = document.createElement("div");
    this.shader.style.width = "100%";
    this.shader.style.height = "100%";
    this.outerDiv.appendChild(this.shader);
    this.shadow = this.shader.attachShadow({
        mode: "open"
    });
    //#endregion

    //bulkhead for item selection.
    this.bulkhead = document.createElement("div");
    this.bulkhead.style.cssText = `display: none; background: rgba(0,0,0,0.5); width: 100%; height: 100%; position: absolute; zIndex: 100`
    //bulkhead styling
    this.bulkhead.innerHTML = `<div style="display: flex; width:100%; height: 100%;"><p style="margin:auto; color:white"></p></div>`
    this.outerDiv.appendChild(this.bulkhead);
    this.bulkhead.addEventListener("click", (e) => {
        this.bulkhead.style.display = "none";
        polymorph_core.submitTarget(containerID);
        e.stopPropagation();
    })

    //Interfacing with the underlying operator
    this.visible = () => {
        return this.parent.containerVisible(containerID);
    }

    this.refresh = function () {
        if (!this.operator) this.loadOperator();
        if (this.operator && this.operator.refresh) this.operator.refresh();
    }

    //event remapping
    polymorph_core.addEventAPI(this);
    this._fire = this.fire;

    this.fire = (e, args) => {
        e = e.split(",");
        if (e.includes("createItem") || e.includes("deleteItem")) {
            e.push("updateItem");
        }
        if (e.includes("deleteItem")) {
            e.push("__polymorph_core_deleteItem");
        }
        //deal with remappings
        e.forEach((e) => {
            if (this.settings.outputRemaps[e]) e = this.settings.outputRemaps[e];
            else {
                if (e == "updateItem") e = [e, e + "_" + containerID];
                else e = [e + "_" + containerID];
            }
            e.forEach((v) => {
                polymorph_core.fire(v, args);
            })
        })
    }

    polymorph_core.on("*", (args, e) => {
        if (e == "documentCreated") return;
        if (this.settings) {
            //occasionally when containers are deleted this will throw errors. so dont();
            e.forEach(e => {
                if (this.settings.inputRemaps[e] != undefined) e = this.settings.inputRemaps[e];
                this._fire(e, args);
            })
        }
    })

    //Input event remapping
    //#region
    this.remappingDiv = document.createElement("div");
    this.remappingDiv.innerHTML = /*html*/`
    <h3>Input Remaps</h3>
    <p>Remap calls from the polymorph_core to internal calls, to change operator behaviour.</p>
    <p>This operator's ID: ${containerID}</p>
    <div>
    </div>
    <button>Add another input remap...</button>
    <h3>Output Remaps</h3>
    <div>
    </div>
    <button>Add another output remap...</button>
    <h3>Mass import</h3>
    <p>Type in an operator ID to import all items from that operator to this one.</p>
    <input class="massImportOperatorID"><button class="importEverythingNow">Import now</button>
    <datalist id="${containerID}_firelist"></datalist>
    `;
    let newRow = (io) => {
        let elem;
        if (io) {
            elem = htmlwrap(`<p>we fire <input>, send out <input><button>x</button></p>`);
        } else {
            elem = htmlwrap(`<p>polymorph_core fires <input>, we process<input list="${containerID}_firelist"></input><button>x</button></p>`);
        }
        return elem;
    }

    //delegated cross handler

    this.remappingDiv.addEventListener("click", (e) => {
        if (e.target.tagName == "BUTTON" && e.target.innerText == "x") {
            e.target.parentElement.remove();
        }

    })
    for (let i = 0; i < 2; i++) {
        //the two add buttons
        this.remappingDiv.querySelectorAll("button")[i].addEventListener("click", (e) => {
            let i;
            if (e.currentTarget.innerText.includes("output")) i = 1;
            else i = 0;
            let row = newRow(i);
            let insertDiv = this.remappingDiv.querySelectorAll("div")[i];
            insertDiv.appendChild(row);
        })
    }

    this.readyRemappingDiv = () => {
        this.remappingDiv.children[2].innerText = `This operator's ID: ${containerID}`;
        this.remappingDiv.querySelector("datalist").innerHTML = "";
        for (let i in this.events) {
            if (i == "*") continue;//dont do all
            this.remappingDiv.querySelector("datalist").appendChild(htmlwrap(`<option>${i}</option>`));
        }

        for (let i = 0; i < 2; i++) {
            let div = this.remappingDiv.querySelectorAll("div")[i];
            while (div.children.length) div.children[0].remove();
        }
        let div = this.remappingDiv.querySelectorAll("div")[0];
        for (let i in this.settings.inputRemaps) {
            let row = newRow(0);
            row.children[0].value = i;
            row.children[1].value = this.settings.inputRemaps[i];
            div.appendChild(row);
        }
        div = this.remappingDiv.querySelectorAll("div")[1];
        for (let i in this.settings.outputRemaps) {
            if (this.settings.outputRemaps[i].length && typeof (this.settings.outputRemaps[i]) != "string") this.settings.outputRemaps[i].forEach((v) => {
                let row = newRow(1);
                row.children[0].value = i;
                row.children[1].value = v;
                div.appendChild(row);
            })
        }
    }

    this.processRemappingDiv = () => {
        this.settings.inputRemaps = {};
        let div = this.remappingDiv.querySelectorAll("div")[0];
        for (let i = 0; i < div.children.length; i++) {
            let row = div.children[i];
            this.settings.inputRemaps[row.children[0].value] = row.children[1].value;
        }
        this.settings.outputRemaps = {};
        div = this.remappingDiv.querySelectorAll("div")[1];
        for (let i = 0; i < div.children.length; i++) {
            let row = div.children[i];
            if (!this.settings.outputRemaps[row.children[0].value]) this.settings.outputRemaps[row.children[0].value] = [];
            this.settings.outputRemaps[row.children[0].value].push(row.children[1].value);
        }
    }

    this.remappingDiv.querySelector(".importEverythingNow").addEventListener("click", () => {
        let otherOperatorID = this.remappingDiv.querySelector(".massImportOperatorID").value;
        let otherContainer = polymorph_core.containers[otherOperatorID];
        if (otherContainer) {
            for (let i in polymorph_core.items) {
                if (otherContainer.operator.itemRelevant(i)) {
                    this._fire("createItem", { id: i, sender: this });
                    this._fire("updateItem", { id: i, sender: this });
                }
            }
        }
    })

    //#endregion

    //saving and loading
    //#region
    this.toSaveData = () => {
        //sometimes the operator breaks -- we dont want to disrupt the entire save process.
        if (this.operator && this.operator.toSaveData) this.operator.toSaveData();
        return this.settings;// doesn't hurt, helps with subframing too
    };

    this.waitOperatorReady = (type, data) => {
        if (this.innerdiv.children.length == 0) {
            let h1 = document.createElement("h1");
            h1.innerHTML = "Loading operator...";
            this.innerdiv.appendChild(h1);
        }
        this.shader.style.display = "none";
        if (!polymorph_core.operatorLoadCallbacks[type]) polymorph_core.operatorLoadCallbacks[type] = [];
        polymorph_core.operatorLoadCallbacks[type].push({
            op: this,
            data: data
        });
    };

    this.loadOperator = () => {
        if (this.operator) return;
        //parse options and decide what to do re: a div
        if (polymorph_core.operators[this.settings.t]) {
            let options = polymorph_core.operators[this.settings.t].options;
            //clear the shadow and the div
            if (options.noShadow) {
                this.div = this.innerdiv;
            } else {
                this.div = this.shadow;
            }
            if (options.outerScroll) {
                this.outerDiv.style.overflowY = "auto";
            } else {
                this.outerDiv.style.overflowY = "hidden";
            }
            try {
                this.operator = new polymorph_core.operators[this.settings.t].constructor(this, this.settings.data);
                this.operator.container = this;
            } catch (e) {
                console.log(e);
            }
        } else {
            // the operator doesnt exist yet
            this.waitOperatorReady(this.settings.t, this.settings._data);
        }
    }

    //Attach myself to a rect
    //do this early so that subframe-eseque operators in phone version have something to hook onto
    if (this.settings.p && polymorph_core.items[this.settings.p] && polymorph_core.items[this.settings.p]._rd) {
        //there is or will be a rect for it.
        if (polymorph_core.rects[this.settings.p]) {
            polymorph_core.rects[this.settings.p].tieContainer(containerID);
        } else {
            if (!polymorph_core.rectLoadCallbacks[this.settings.p]) polymorph_core.rectLoadCallbacks[this.settings.p] = [];
            polymorph_core.rectLoadCallbacks[this.settings.p].push(rectID);
            // also don't yet load the operator?
        }
    } else {
        console.log("Could not find rect for container " + containerID);
        return;
    }

    //#endregion

    this.remove = () => {
        if (this.operator.remove) this.operator.remove();
        delete polymorph_core.items[containerID]._od;
        delete polymorph_core.containers[containerID];//seppuku
    }

};;

function _contextMenuManager(root) {
    this.registerContextMenu = function (menu, element, delegate, contextmenuEventPassThrough) {
        let thisCTXM = document.createElement("div");
        thisCTXM.innerHTML = menu;
        thisCTXM.style.cssText = "display:none;"
        thisCTXM.classList.add("contextMenu");
        let re = element;
        while (re.parentElement) re = re.parentElement;
        re.appendChild(thisCTXM);

        function intellishow(e) {
            let pbr = thisCTXM.parentElement.getClientRects()[0];
            let _left = e.pageX - pbr.x;
            let _top = e.pageY - pbr.y;
            //adjust for out of the page scenarios.
            /*if (((pbr.x+pbr.w)-(mbr.x+mbr.w))>0)_left =_left-((pbr.x+pbr.w)-(mbr.x+mbr.w));
            if (((pbr.y+pbr.h)-(mbr.y+mbr.h))>0)_top =_top-((pbr.y+pbr.h)-(mbr.y+mbr.h));
            if (mbr.x-pbr.x>0)_left =_left-(mbr.x-pbr.x);
            if (mbr.y-pbr.y>0)_left =_left-(mbr.y-pbr.y);
            */
            //set
            thisCTXM.style.top = _top;
            thisCTXM.style.left = _left;
            thisCTXM.style.display = "block";
        }
        let f = function (e) {
            //show the context menu
            e.preventDefault();
            if (contextmenuEventPassThrough) {
                if (contextmenuEventPassThrough(e)) {
                    intellishow(e);
                }
            } else {
                intellishow(e);
            }
        };
        element.addEventListener("contextmenu", function (e) {
            if (delegate) {
                if (e.target.matches(delegate) || e.target.matches(delegate + " *")) f(e);
            } else f(e);
        })

        function hidemenu(e) {
            let rt = thisCTXM.getRootNode();
            try {
                let el = rt.elementFromPoint(e.clientX, e.clientY);
                if (!thisCTXM.contains(el)) thisCTXM.style.display = "none";
            } catch (e) {
                console.log(e);
                document.removeEventListener("click", hidemenu);
            }
        }

        document.addEventListener("mousedown", hidemenu);

        //add styling along with element for safety 
        let s = document.createElement("style");
        s.innerHTML = `.contextMenu {
            list-style: none;
            background: white;
            box-shadow: 0px 0px 5px black;
            user-select: none;
            position: absolute;
            z-index:1000;
        }
        .contextMenu li {
            position:relative;
            padding: 2px;
            display: block;
        }
        .contextMenu li:hover {
            background:pink;
        }
        .contextMenu li>ul {
            display:none;
        }
        .contextMenu li:hover>ul {
            display: block;
            position: absolute;
            left: 100%;
            margin: 0;
            top: 0;
            padding: 0;
            background: white;
            width: max-content;
        }
        `;
        thisCTXM.appendChild(s);
        return thisCTXM;
    }
}

//deps: core.container.js
//add a context menu configuration button to the container menu
polymorph_core.showContextMenu = (container, settings, options) => {
    container._tempCtxSettings = settings;//do this otherwise contextmenu will always point to first item contextmenu'ed... but what is this?
    /*
    settings = {
        x:int
        y:int
        id: id
    }
    */
    //This should be configurable in future.
    let commandStrings = polymorph_core.currentDoc.globalContextMenuOptions.map(i => i) || [];
    //add operator recommends
    commandStrings.push.apply(commandStrings, options);
    //add users' stuff
    let currentContainer = container;
    do {
        if (currentContainer instanceof polymorph_core.container) {
            commandStrings.push.apply(commandStrings, container.settings.commandStrings);
        }
        currentContainer = currentContainer.parent;
    } while (currentContainer && currentContainer != polymorph_core);
    // format: 
    /*
        polymorph_core, operator, item = or just dot.
        "callables::polymorph_core.deleteItem(for example)",
        "Open subview::operator.openSubview",
        "Custom function::item.prop=value OR item.prop=()=>{eval}",
        "Custom editable::item.edit(item.style.background)",
        "Custom global setter::polymorph_core.prop=value or ()=>{eval} or (item)=>{fn}"
        "Menu::submenu::action"
    */

    let setItemProp = (prop, val, assignment, LHS = polymorph_core.items[container._tempCtxSettings.id]) => {
        //expect either item.potato.tomato from assignment or potato.tomato.
        if (assignment) {
            prop = prop.slice(prop.indexOf(".") + 1);//nerf the first item
        }
        let props = prop.split(".");
        let itm = LHS;
        for (let i = 0; i < props.length - 1; i++) {
            if (!itm[props[i]]) itm[props[i]] = {};
            itm = itm[props[i]];
        }
        itm[props[props.length - 1]] = val;
        polymorph_core.fire("updateItem", { id: container._tempCtxSettings.id });
    }
    let getItemProp = (propStr) => {
        //only really used for edit; so getItemProp only.
        let props = propStr.split(".");
        let itm = polymorph_core.items[container._tempCtxSettings.id];
        if (propStr.startsWith("item")) {
            props.shift();
        }
        for (let i = 0; i < props.length; i++) {
            if (!itm[props[i]]) {
                itm = "";
                break;
            }
            itm = itm[props[i]];
        }
        return itm;
    }

    let ctxMenu;
    if (container.cacheCTXMenuStrings == JSON.stringify(commandStrings)) {
        ctxMenu = container.ctxMenuCache;
    } else {
        //rebuild ctxMenu including handlers
        ctxMenu = htmlwrap(`<div class="_ctxbox_">
        <style>
        div._ctxbox_{
            background:white
        }
        div._sctxbox_{
            position:absolute;
            left: 100%;
            top:0;
            display:none;
            background:white;
        }
        div._ictxbox_:hover{
            background:pink;
            user-select:none;
        }
        div:hover>div._sctxbox_{
            display:block;
        }
        </style>
        </div>`);
        commandStrings.map((v, ii) => {
            let cctx = ctxMenu;
            let parts = v.split("::");
            let _cctx;
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].indexOf(".") == -1) {
                    _cctx = cctx.querySelector(`[data-name="${parts[i]}"]`);
                    if (_cctx) {
                        cctx = _cctx.children[1];
                    } else {
                        _cctx = htmlwrap(`<div class="_ctxbox_ _ictxbox_" data-name="${parts[i]}"><span>${parts[i]}</span><div class="_sctxbox_"></div></div>`);
                        cctx.appendChild(_cctx);
                        cctx = _cctx.children[1];
                    }
                } else {
                    if (/^item.edit\(.+\)$/.exec(parts[i]) != null) {
                        //its an editable, so also put in an input
                        //remove the text inside first
                        cctx = cctx.parentElement;
                        cctx.children[0].remove();
                        _cctx = htmlwrap(`<input style="display:block;" data-property="${/item.edit\((.+)\)/.exec(parts[i])[1]}" placeholder="${parts[i - 1]}"></input>`)
                        cctx.insertBefore(_cctx, cctx.children[0]);

                    }
                    break;
                }
            }
            _cctx.dataset.index = ii; // assign its function
        })
        ctxMenu.addEventListener("click", (e) => {
            if (e.target.parentElement.dataset.index) {
                let thisCSTR = commandStrings[e.target.parentElement.dataset.index].split("::");
                for (let i = 0; i < thisCSTR.length; i++) {
                    if (thisCSTR[i].indexOf(".") != -1) {
                        thisCSTR.splice(0, i);
                        thisCSTR = thisCSTR.join("::");
                        break;
                    }
                }
                let _LHS = thisCSTR.split(".")[0];
                let internalVariable = thisCSTR.split(".")[1];
                switch (_LHS) {
                    case "polymorph_core":
                        LHS = polymorph_core;
                        break;
                    case "item":
                        LHS = polymorph_core.items[container._tempCtxSettings.id];
                        break;
                    case "operator":
                        LHS = container.operator;
                        break;
                    default:
                        return;
                }
                if (thisCSTR.slice(thisCSTR.indexOf(".") + 1).indexOf("=") != -1) {
                    //assignment
                    var RHS = thisCSTR.slice(thisCSTR.indexOf("=") + 1);
                    let internalVariable = thisCSTR.slice(thisCSTR.indexOf(".") + 1, thisCSTR.indexOf("="));
                    if (RHS.indexOf("(") != -1) {
                        setItemProp(internalVariable, eval(`function __CTX_evaluator(e,container){` + RHS + `}`)(container._tempCtxSettings, container), false, LHS)
                    } else {
                        setItemProp(internalVariable, RHS, false, LHS);
                    }
                } else {
                    if (_LHS != "item") {
                        LHS.ctxCommands[internalVariable](container._tempCtxSettings, container);
                    }
                }
            }
            if (e.target.tagName != "INPUT") ctxMenu.style.display = "none";
        });
        ctxMenu.addEventListener("input", (e) => {
            let assign = false;
            if (e.target.dataset.property.startsWith("item")) {
                assign = true;
            }
            setItemProp(e.target.dataset.property, e.target.value, assign);
        })
        container.ctxMenuCache = ctxMenu;
        container.cacheCTXMenuStrings = JSON.stringify(commandStrings);
        document.body.addEventListener("mousedown", (e) => {
            if (!e.path.includes(ctxMenu)) ctxMenu.style.display = "none";
        })
    }
    //actually show it
    document.body.appendChild(container.ctxMenuCache);
    //update item props
    container.ctxMenuCache.style.display = "block";
    container.ctxMenuCache.style.position = "absolute";
    container.ctxMenuCache.style.top = polymorph_core._contextMenuData.mouseY;
    container.ctxMenuCache.style.left = polymorph_core._contextMenuData.mouseX;
    //load all the inputs
    Array.from(container.ctxMenuCache.querySelectorAll("input")).forEach(i => {
        i.value = getItemProp(i.dataset.property);
    })

}

polymorph_core.ctxCommands = {
    "deleteItem": (e, container) => {
        container._fire("deleteItem", { id: e.id });
    }
}

polymorph_core.container.prototype.registerContextMenu = function (el, delegateFilter) {
    el.addEventListener("contextmenu", (e) => {
        let itm = delegateFilter(e.target);
        if (itm) {
            e.preventDefault();
            let pbr = el.getRootNode().host.getBoundingClientRect();
            itm.e.x = e.clientX - pbr.x;
            itm.e.y = e.clientY - pbr.y;
            polymorph_core.showContextMenu(this, itm.e, itm.ls);
        }
    })
}

polymorph_core._contextMenuData = {};

document.addEventListener("mousemove", (e) => {
    polymorph_core._contextMenuData.mouseX = e.clientX;
    polymorph_core._contextMenuData.mouseY = e.clientY;
});


// add a topbar element that does it.
polymorph_core.on("UIstart", () => {
    let contextMenuDialog = htmlwrap(/*html*/`
    <div>
        <h2>Context menu settings</h2>
        <textarea></textarea>
    </div>
    `);
    polymorph_core.on("updateSettings", () => {
        if (!polymorph_core.currentDoc.globalContextMenuOptions) polymorph_core.currentDoc.globalContextMenuOptions = [
            "Style::Item Background::item.edit(item.style.background)",
            "Style::Text color::item.edit(item.style.color)"
        ];
        contextMenuDialog.querySelector("textarea").value = polymorph_core.currentDoc.globalContextMenuOptions.join("\n");
    })
    contextMenuDialog.querySelector("textarea").addEventListener("input", () => {
        polymorph_core.currentDoc.globalContextMenuOptions = contextMenuDialog.querySelector("textarea").value.split("\n");
    });
    polymorph_core.topbar.add("File");//add it so that it comes first before settings.
    /*polymorph_core.topbar.add("Settings/Context menu").addEventListener("click", () => {
        polymorph_core.dialog.prompt(contextMenuDialog);
    })*/
})
;

//Do we even need these?  Probably not....
polymorph_core.isLinked = function (A, B) {
    let ret = 0; //unlinked
    if (polymorph_core.items[A].to && polymorph_core.items[A].to[B]) {
        ret = ret + 1;// 1: there is a link FROM A to B
    }
    if (polymorph_core.items[B].to && polymorph_core.items[B].to[A]) {
        ret = ret + 2;// 2: there is a link FROM B to A
    }
    return ret;
}

polymorph_core.link = function (A, B, settings = {}) {
    if (settings == true) {
        settings = { undirected: true };
    }
    let toProp = settings.toProp || "to";
    let fromProp = settings.fromProp;
    let undirected = settings.undirected;
    polymorph_core.items[A][toProp] = polymorph_core.items[A][toProp] || {};
    polymorph_core.items[A][toProp][B] = polymorph_core.items[A][toProp][B] || true;
    if (fromProp) {
        polymorph_core.items[B][fromProp] = polymorph_core.items[B][fromProp] || {};
        polymorph_core.items[B][fromProp][A] = polymorph_core.items[B][fromProp][A] || true;
    }
    if (undirected) {
        polymorph_core.link(B, A, settings);
    }
}
polymorph_core.unlink = function (A, B, settings = {}) {
    if (settings == true) {
        settings = { undirected: true };
    }
    let toProp = settings.toProp || "to";
    let fromProp = settings.fromProp;
    let undirected = settings.undirected;
    polymorph_core.items[A][toProp] = polymorph_core.items[A][toProp] || {};
    delete polymorph_core.items[A][toProp][B];
    if (fromProp) {
        polymorph_core.items[B][fromProp] = polymorph_core.items[B][fromProp] || {};
        delete polymorph_core.items[B][fromProp][A];
    }
    if (undirected) {
        polymorph_core.unlink(B, A);
    }
}
;

polymorph_core.operatorTemplate = function (container, defaultSettings) {
    this.container = container;
    Object.defineProperty(this, "settings", {
        get: () => {
            return container.settings.data;
        }
    });
    //facilitate creation of this.settings if it doesnt exist.
    Object.assign(defaultSettings, this.settings);
    this.settings = {};
    Object.assign(this.settings, defaultSettings);
    this.rootdiv = document.createElement("div");
    this.rootdiv.style.height = "100%";
    this.rootdiv.style.overflow = "auto";
    container.div.appendChild(this.rootdiv);
    this.createItem = (id) => {
        let itm = {};
        if (!id) {
            id = polymorph_core.insertItem(itm);
        }
        if (this.settings.filter) {
            polymorph_core.items[id][this.settings.filter] = true;
        }
        return id;
    }

    this.deleteItem = (id) => {
        delete polymorph_core.items[id][this.settings.filter];
        //container.fire("updateItem", { id: id });
        //container.fire("focusItem", { id: undefined });
    }

    this.itemRelevant = (id) => {
        if (this.settings.filter == "") {
            return true;//if filter doesnt exist it should be undefined
        } else {
            if (polymorph_core.items[id][this.settings.filter] != undefined) {
                return true;
            } else {
                return false;
            }
        }
    }

    this.intervalsToClear = [];
    this.remove = () => {
        if (this.intervalsToClear) this.intervalsToClear.forEach(i => clearInterval(i));
    }
}
;

polymorph_core.initiateDragDrop = function (itemID, _settings) {
    if (polymorph_core._dragdropdata.tempItemDiv) return;
    let settings = {
        x: polymorph_core._dragdropdata.mouseX,
        y: polymorph_core._dragdropdata.mouseY,
        property: "title",
        displayText: undefined, //define to overwrite the property
        sender: undefined
    };
    Object.assign(settings, _settings);
    let tempItemDiv = htmlwrap(`<div style="position:absolute; top:${settings.y}px; left: ${settings.x}px;"></div>`);
    tempItemDiv.innerText = polymorph_core.items[itemID][settings.property];
    document.body.appendChild(tempItemDiv);
    polymorph_core._dragdropdata.tempItemDiv = tempItemDiv;
    settings.itemID = itemID;
    polymorph_core._dragdropdata.settings = settings;
    //when mouseup, fire a createItem on the new operator. If not ctrl, fire a deleteItem on the old operator.
}

polymorph_core._dragdropdata = {};

document.addEventListener("mousemove", (e) => {
    polymorph_core._dragdropdata.mouseX = e.clientX;
    polymorph_core._dragdropdata.mouseY = e.clientY;
    if (polymorph_core._dragdropdata.tempItemDiv) {
        polymorph_core._dragdropdata.tempItemDiv.style.top = e.clientY;
        polymorph_core._dragdropdata.tempItemDiv.style.left = e.clientX;
    }
})

document.addEventListener("mouseup", (e) => {
    if (polymorph_core._dragdropdata.tempItemDiv) {
        polymorph_core._dragdropdata.tempItemDiv.remove();
        let elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
        while (elementUnderMouse.shadowRoot) {
            elementUnderMouse = elementUnderMouse.shadowRoot.elementFromPoint(e.clientX, e.clientY);
        }
        console.log(elementUnderMouse);
        //Figure out which container this belongs to...
        //todo: make this work for non shadow roots.
        let rootNode = elementUnderMouse.getRootNode();
        let container_id = rootNode.host.parentElement.parentElement.dataset.containerid; //actually the rect's container for it. This will need to change if we remove rects.
        console.log(container_id);
        let settings = polymorph_core._dragdropdata.settings;
        if (container_id != settings.sender) {
            polymorph_core.containers[container_id]._fire("createItem", { id: settings.itemID, sender: "dragdrop" });
            let targetContainerOptions = polymorph_core.operators[polymorph_core.containers[container_id].settings.t].options
            if (!targetContainerOptions.single_store) polymorph_core.containers[settings.sender]._fire("deleteItem", { id: settings.itemID, sender: "dragdrop" });
            delete polymorph_core._dragdropdata.tempItemDiv;
        }
    }
})

//edge case: drop onto not a container;

function isPhone() {
    var mobiles = [
        "Android",
        "iPhone",
        "Linux armv8l",
        "Linux armv7l",
        "Linux aarch64"
    ];
    if (mobiles.includes(navigator.platform) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}
if (isPhone()) {
    polymorph_core.newRect = function (parent) {
        let ID = polymorph_core.insertItem({
            _rd: {
                p: parent,
                f: RECT_FIRST_SIBLING,
                x: RECT_ORIENTATION_X,
                ps: 1
            }
        });
        polymorph_core.rects[ID] = new polymorph_core.rect(ID);
        return ID;
    }

    polymorph_core.rect = function (rectID) {
        this.id = rectID;//might be helpful
        polymorph_core.rects[rectID] = this;
        Object.defineProperty(this, "settings", {
            get: () => {
                return polymorph_core.items[rectID]._rd;
            }
        })


        Object.defineProperty(this, "childrenIDs", {
            get: () => {
                if (!this._childrenIDs) {
                    this._childrenIDs = [];
                }
                //if i dont have two good children, return none
                if (this._childrenIDs.length == 2 &&
                    polymorph_core.items[this._childrenIDs[0]] && polymorph_core.items[this._childrenIDs[0]]._rd &&
                    polymorph_core.items[this._childrenIDs[1]] && polymorph_core.items[this._childrenIDs[1]]._rd) {
                    return this._childrenIDs;
                } else {
                    this._childrenIDs = [];
                    for (let i in polymorph_core.items) {
                        if (polymorph_core.items[i]._rd && polymorph_core.items[i]._rd.p == rectID) {
                            this._childrenIDs.push(i);
                        }
                    }
                    if (this._childrenIDs.length == 2) return this._childrenIDs;
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "children", {
            get: () => {
                if (this.childrenIDs) {
                    if (polymorph_core.rects[this.childrenIDs[0]] && polymorph_core.rects[this.childrenIDs[1]])
                        return [polymorph_core.rects[this.childrenIDs[0]], polymorph_core.rects[this.childrenIDs[1]]];
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "containerids", {
            get: () => {
                this._containerids = [];
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._od && polymorph_core.items[i]._od.p == rectID) {
                        this._containerids.push(i);
                    }
                }
                return this._containerids;
            }
        })

        Object.defineProperty(this, "containers", {
            get: () => {
                if (this.containerids) {
                    return this.containerids.map((v) => polymorph_core.containers[v]);
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "parent", {
            get: () => {
                if (this.settings.p) return polymorph_core.rects[this.settings.p];
                else return polymorph_core;
            }
        })
        this.listContainer = htmlwrap(`<div><div class="newcontainer">New container...</div></div>`);
        //when resetting document it expects an outerdiv. remove this instead.
        this.outerDiv = this.listContainer;
        this.newContainerBtn = this.listContainer.querySelector("div.newcontainer");
        this.tieRect = function (id) {
            polymorph_core.rects[id].listContainer = this.listContainer;
        }
        this.containerVisible = (containerID) => polymorph_core.currentOperator == containerID;

        this.switchOperator = (id) => {
            polymorph_core.toggleMenu(false);
            Array.from(document.querySelectorAll("#body>*")).forEach(e => e.style.display = "none");
            document.querySelector(`#body>[data-container='${id}']`).style.display = "block";
            polymorph_core.currentOperator = id;
        }

        this.tieContainer = (id) => {
            if (this.listContainer.querySelector(`[data-containerid='${id}']`)) {
                this.listContainer.querySelector(`[data-containerid='${id}']`).innerText = polymorph_core.containers[id].settings.tabbarName;
            } else {
                let ts = document.createElement('div');
                ts.innerText = polymorph_core.containers[id].settings.tabbarName;
                this.listContainer.insertBefore(ts, this.listContainer.children[0]);
                ts.dataset.containerid = id;
                ts.addEventListener("click", (e) => {
                    this.switchOperator(id);
                    e.stopPropagation();//so that the lower level divs dont get triggered
                })
                polymorph_core.containers[id].outerDiv.dataset.container = id;
                polymorph_core.containers[id].outerDiv.style.display = "none";
                document.querySelector("#body").appendChild(polymorph_core.containers[id].outerDiv);
                this.switchOperator(id);
            }
        }

        //connect to my parent
        if (this.settings.p && polymorph_core.items[this.settings.p]) {
            //there is or will be a rect / subframe for it.
            if (polymorph_core.rects[this.settings.p]) {
                polymorph_core.rects[this.settings.p].tieRect(rectID);
            } else {
                if (!polymorph_core.rectLoadCallbacks[this.settings.p]) polymorph_core.rectLoadCallbacks[this.settings.p] = [];
                polymorph_core.rectLoadCallbacks[this.settings.p].push(rectID);
            }
        }
        if (polymorph_core.items._meta.currentView == rectID) {
            //attach myself to the rectlist
            document.querySelector("#rectList").appendChild(this.listContainer);
        }

        //Signal all children waiting for this that they can connect to this now.
        if (polymorph_core.rectLoadCallbacks[rectID]) polymorph_core.rectLoadCallbacks[rectID].forEach((v) => {
            if (polymorph_core.items[v]._od) {
                //v is container
                this.tieContainer(v);
            } else {
                //v is rect
                this.tieRect(v);
            }
        })

        this.refresh = () => {
            //pick an arbitrary operator and focus it.. for now.
            let oneToFocus = Object.keys(polymorph_core.containers)[0];
            if (oneToFocus) {
                //if refresh called before container load, this happens :(
                polymorph_core.containers[oneToFocus].outerDiv.style.display = "block";
                polymorph_core.currentOperator = oneToFocus;
            }
            if (this.children)this.children.forEach(i => i.refresh());
            if (this.containers)this.containers.forEach(i => i.refresh());
        };


        //operator creation
        this.newContainerBtn.addEventListener("click", (e) => {
            let newContainer = { _od: { t: "opSelect", p: rectID } };
            let newContainerID = polymorph_core.insertItem(newContainer);
            polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
            //containers tie themselves.
            //this.tieContainer(newContainerID);
            this.switchOperator(newContainerID);
        })

        this.toSaveData = () => { };
    };

    polymorph_core.switchView = (id) => {
        polymorph_core.currentDoc.currentView = id;
        document.querySelector("#rectList").children[0].remove();
        document.querySelector("#rectList").appendChild(polymorph_core.rects[id].listContainer);
        polymorph_core.rects[id].refresh();
        return;
    }
    polymorph_core.rects = {};
};

// the UI is composed of RECTS. 
// a RECT can have another RECT or an OPERATOR in it.
if (!isPhone()) {

    /// PASS OPERATORS INSTEAD OF CONTENT DIVS

    const RECT_ORIENTATION_X = 0;
    const RECT_ORIENTATION_Y = 1;
    const RECT_FIRST_SIBLING = 0;
    const RECT_SECOND_SIBLING = 1;
    const RECT_BORDER_WIDTH = 5;
    const RECT_OUTER_DIV_COLOR = "rgba(230, 204, 255,0.1)";
    const RECT_BORDER_COLOR = "rgba(230, 204, 255,0.1)";//"transparent";

    //parent is either undefined or another rect-like object
    //pseudo parents should implement following methods:
    //.polymorph_core property
    //

    polymorph_core.newRect = function (parent, ID) {
        if (!ID) ID = polymorph_core.insertItem({
            _rd: {
                p: parent,
                f: RECT_FIRST_SIBLING,
                x: RECT_ORIENTATION_X,
                ps: 1
            }
        })
        else {
            polymorph_core.items[ID]._rd = {
                p: parent,
                f: RECT_FIRST_SIBLING,
                x: RECT_ORIENTATION_X,
                ps: 1
            }
        }
        polymorph_core.rects[ID] = new polymorph_core.rect(ID);
        return ID;
    }

    polymorph_core.rect = function (rectID) {
        this.id = rectID;//might be helpful
        polymorph_core.rects[rectID] = this;
        Object.defineProperty(this, "settings", {
            get: () => {
                return polymorph_core.items[rectID]._rd;
            }
        })


        Object.defineProperty(this, "childrenIDs", {
            get: () => {
                if (!this._childrenIDs) {
                    this._childrenIDs = [];
                }
                //if i dont have two good children, return none
                if (this._childrenIDs.length == 2 &&
                    polymorph_core.items[this._childrenIDs[0]] && polymorph_core.items[this._childrenIDs[0]]._rd &&
                    polymorph_core.items[this._childrenIDs[1]] && polymorph_core.items[this._childrenIDs[1]]._rd) {
                    return this._childrenIDs;
                } else {
                    this._childrenIDs = [];
                    for (let i in polymorph_core.items) {
                        if (polymorph_core.items[i]._rd && polymorph_core.items[i]._rd.p == rectID) {
                            this._childrenIDs.push(i);
                        }
                    }
                    if (this._childrenIDs.length == 2) return this._childrenIDs;
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "children", {
            get: () => {
                if (this.childrenIDs) {
                    if (polymorph_core.rects[this.childrenIDs[0]] && polymorph_core.rects[this.childrenIDs[1]])
                        return [polymorph_core.rects[this.childrenIDs[0]], polymorph_core.rects[this.childrenIDs[1]]];
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "containerids", {
            get: () => {
                this._containerids = [];
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._od && polymorph_core.items[i]._od.p == rectID) {
                        this._containerids.push(i);
                    }
                }
                return this._containerids;
            }
        })

        Object.defineProperty(this, "containers", {
            get: () => {
                if (this.containerids) {
                    return this.containerids.map((v) => polymorph_core.containers[v]);
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "parent", {
            get: () => {
                if (this.settings.p) {
                    if (polymorph_core.rects[this.settings.p]) return polymorph_core.rects[this.settings.p];
                    else if (polymorph_core.containers[this.settings.p]) return polymorph_core.containers[this.settings.p];
                }
                else return polymorph_core;
            }
        })

        Object.defineProperty(this, "otherSiblingID", {
            get: () => {
                if (this._otherSiblingID &&
                    polymorph_core.items[this._otherSiblingID]._rd &&
                    polymorph_core.items[this._otherSiblingID]._rd.p == this.settings.p &&
                    this._otherSiblingID != rectID
                ) return this._otherSiblingID;
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._rd && polymorph_core.items[i]._rd.p == this.settings.p && i != rectID) {
                        this._otherSiblingID = i;
                        return this._otherSiblingID;
                    }
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "otherSiblingSettings", {
            get: () => {
                return polymorph_core.items[this.otherSiblingID]._rd;
            }
        })

        Object.defineProperty(this, "otherSibling", {
            get: () => {
                return polymorph_core.rects[this.otherSiblingID];
            }
        })

        this.split = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will be split into 2 smaller boxes. 
        this.resizing = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will resize. 

        // Create the outerDiv: the one with the active borders.
        this.outerDiv = document.createElement("div");
        this.outerDiv.style.cssText = `
        box-sizing: border-box;
        height: 100%; width:100%;
        overflow: hidden;
        display:flex;
        flex-direction:column;
        flex: 0 1 auto;
        background: ${RECT_OUTER_DIV_COLOR}
    `;

        this.createTabSpan = (containerid) => {
            let tabSpan = document.createElement("span");
            let tabName = document.createElement("button");
            let tabDelete = document.createElement("button");
            let tabGear = document.createElement("img");
            tabName.style.cssText = tabDelete.style.cssText = `
        background: unset;
        color:unset;
        border:unset;
        cursor:pointer;
        padding: 5px;
        `;
            tabDelete.style.cssText += `color:red;font-weight:bold; font-style:normal`;
            tabDelete.innerText = 'x';
            tabDelete.style.display = "none";
            tabGear.src = "assets/gear.png";
            tabGear.style.cssText = "width: 1em; height:1em;"
            tabGear.style.display = "none";

            tabSpan.style.cssText = `
        border: 1px solid black;
        background: #C074E8;
        color: white;
        align-items: center;
        display: inline-flex;
        margin-right: 0.1em;
        border-radius: 3px;
        `;
            tabSpan.appendChild(tabName);
            tabSpan.appendChild(tabDelete);
            tabSpan.appendChild(tabGear);
            tabSpan.dataset.containerid = containerid;

            return tabSpan;
        }

        // The actual tabbar.
        this.tabbar = document.createElement("p");
        this.tabbar.style.cssText = `display:block;margin:0; width:100%;background:${RECT_OUTER_DIV_COLOR}`
        this.plus = document.createElement("button");
        this.plus.style.cssText = `color:blue;font-weight:bold; font-style:normal`;
        this.plus.innerText = "+";
        this.tabbar.appendChild(this.plus);
        this.outerDiv.appendChild(this.tabbar);

        // For handling operators. Each operator has its own innerDiv, and a tabSpan (with the name, and a cross) in the tabspan bar.
        // Create the innerDivs and generator for innerDivs..
        this.createInnerDiv = (containerid) => {
            let indiv = document.createElement("div");
            indiv.style.cursor = "default";
            indiv.style.height = "100%";
            indiv.style.width = "100%";
            indiv.style.overflow = "hidden";
            indiv.style.background = RECT_OUTER_DIV_COLOR;
            indiv.style.display = "none";
            indiv.dataset.containerid = containerid;
            return indiv;
        }


        this.innerDivContainer = htmlwrap(`<div style="flex:1 1 auto; overflow-y:auto; width:100%; height: 100%; "></div>`);
        this.outerDiv.appendChild(this.innerDivContainer);



        //Function for adding an operator to this rect. Operator must already exist.
        //This function is called: on operator create by operator; OR inernally by rearranging tabspans (later).
        this.tieContainer = (containerid, index) => {
            let container = polymorph_core.containers[containerid];
            if (!container) {
                console.log("Ack!");
                return;
            }

            if (index == undefined) {
                index = this.tabbar.children.length - 1;
            }

            // Just move the tabbar around, and attach some information to the tabbar so 
            // we know what to do when a button is clicked.
            let currentTabSpan = this.tabbar.querySelector(`span[data-containerid="${containerid}"]`);
            if (currentTabSpan) {
                currentTabSpan.remove();// clear and reapply since tiecontainer should be overwrite
                index--;
            }
            currentTabSpan = this.createTabSpan(containerid);

            currentTabSpan.children[0].innerText = container.settings.tabbarName;
            this.tabbar.insertBefore(currentTabSpan, this.tabbar.children[index]);

            let currentInnerDiv = this.innerDivContainer.querySelector(`div[data-containerid="${containerid}"]`);
            if (currentInnerDiv) currentInnerDiv.remove();
            currentInnerDiv = this.createInnerDiv(containerid);
            currentInnerDiv.appendChild(container.outerDiv);
            this.innerDivContainer.insertBefore(currentInnerDiv, this.innerDivContainer.children[index]);

            //dont refresh on start unless im the root rect, then let it propagate
            //if (container.operator && container.operator.refresh) container.operator.refresh();


            // because during initial load, this needs to be called to actually show anything.
            if (containerid == this.settings.s) this.switchOperator(this.settings.s);
        }

        //Callback for tab clicks to switch between operators.
        this.switchOperator = (containerid) => {
            if (!this.innerDivContainer.querySelector(`div[data-containerid="${containerid}"]`)) return false;//we cant do that
            this.settings.s = containerid;
            for (let i = 0; i < this.innerDivContainer.children.length; i++) {
                this.innerDivContainer.children[i].style.display = "none";
            }
            this.innerDivContainer.querySelector(`div[data-containerid="${containerid}"]`).style.display = "block";
            // hide buttons on previous operator
            for (let i = 0; i < this.tabbar.children.length - 1; i++) {
                this.tabbar.children[i].children[1].style.display = "none";
                this.tabbar.children[i].children[2].style.display = "none";
                this.tabbar.children[i].style.background = "#C074E8";
            }
            //show buttons on this operator
            let currentTab = this.tabbar.querySelector(`span[data-containerid="${containerid}"]`);
            currentTab.children[1].style.display = "inline";
            currentTab.children[2].style.display = "inline";
            currentTab.style.background = "#8093FF";
            polymorph_core.containers[containerid].refresh();
            //Overall refresh because borders are dodgy
            polymorph_core.containers[this.settings.s].refresh();
            return true;
        }

        //operator creation
        this.plus.addEventListener("click", (e) => {
            if (e.getModifierState("Shift") && this.parent instanceof polymorph_core.rect) {
                if (confirm("WARNING: You are about to delete this rect and all its containers. THIS CAN HAVE SERIOUS CONSEQUENCES. Are you sure you want to do this?")) {
                    let myIndex = this.parent.children.indexOf(this);
                    let mySibling = this.parent.children[!myIndex + 0];
                    this.parent.outerDiv.parentElement.insertBefore(mySibling.outerDiv, this.parent.outerDiv);
                    Object.assign(mySibling.settings, this.parent.settings);
                    mySibling.settings.p = this.parent.settings.p;//If parent is undefined.
                    if (polymorph_core.items._meta.currentView == this.parent.id) {
                        // fix root level rect deletion
                        polymorph_core.items._meta.currentView = mySibling.id;
                    }
                    this.parent.outerDiv.remove();
                    mySibling.refresh();
                    let pid = this.parent.id;//deleting things messes with the parent getter
                    //delete parent rect
                    delete polymorph_core.rects[pid];
                    delete polymorph_core.items[pid]._rd;
                    //delete this rect
                    delete polymorph_core.rects[rectID];
                    delete polymorph_core.items[rectID]._rd;
                }
            } else {
                let newContainer = { _od: { t: "opSelect", p: rectID } };
                let newContainerID = polymorph_core.insertItem(newContainer);
                polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
                this.switchOperator(newContainerID);
            }

        })

        //Delegated operator switching
        this.tabbar.addEventListener("click", (e) => {
            //pass direct clicks so we don't switch to blank operators
            let el = e.target;
            while (el != this.tabbar) {
                if (el.dataset.containerid) {
                    this.switchOperator(el.dataset.containerid);
                    return;
                }
                el = el.parentElement;
            }
        })

        //Delegated cross button handler
        this.tabbar.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() == 'button' && e.target.innerText == "x" && e.target.parentElement.tagName == "SPAN" && confirm("Warning: closing operators is irreversible and may lead to data loss. Continue?")) {
                let containerid = e.target.parentElement.dataset.containerid;
                e.target.parentElement.remove();
                let currentInnerDiv = this.innerDivContainer.querySelector(`[data-containerid="${containerid}"]`);
                let switchToID;
                if (currentInnerDiv.previousElementSibling) switchToID = currentInnerDiv.previousElementSibling.dataset.containerid;
                else if (currentInnerDiv.nextElementSibling) switchToID = currentInnerDiv.nextElementSibling.dataset.containerid;
                currentInnerDiv.remove();
                this.switchOperator(switchToID);
                //nerf the item
                polymorph_core.containers[containerid].remove();
                delete polymorph_core.containers[containerid];
                delete polymorph_core.items[containerid]._od;
            }
        })

        // Click and drag tabs to rearrange
        this.tabbar.addEventListener("mousedown", (e) => {
            //pass direct clicks so we don't switch to blank operators
            let el = e.target;
            while (el != this.tabbar) {
                if (el.dataset.containerid) {
                    this.pulledDiv = el;
                    this.startPulling = false;
                }
                el = el.parentElement;
            }
        })

        document.addEventListener("mousemove", (e) => {
            if (this.pulledDiv) {
                if (this.startPulling) {
                    //lift the item, by setting its display to position absolute
                    this.pulledDiv.style.position = "absolute";
                    this.pulledDiv.style.display = "flex";//instead of inline flex
                    let rect = this.tabbar.getBoundingClientRect();
                    this.pulledDiv.style.left = (e.clientX - rect.left) + "px"; //x position within the element.
                    this.pulledDiv.style.top = 0;
                } else {
                    for (let i = 0; i < e.path.length; i++) {
                        if (e.path[i] == this.pulledDiv) {
                            break;
                        } else if (e.path[i] == this.pulledDiv.parentElement) {
                            this.startPulling = true;
                        }
                    }
                }
            }
        })
        document.addEventListener("mouseup", (e) => {
            if (this.pulledDiv) {
                let rect = this.tabbar.getBoundingClientRect();
                let elementsAtPoint = this.tabbar.getRootNode().elementsFromPoint(e.clientX, rect.top);
                this.pulledDiv.style.display = "inline-flex";
                this.pulledDiv.style.position = "static";
                if (elementsAtPoint[1].tagName == "SPAN") {
                    let childs = Array.from(this.tabbar.children)
                    let pulledIndex = childs.indexOf(this.pulledDiv);
                    let otherIndex = childs.indexOf(elementsAtPoint[1])
                    if (otherIndex < pulledIndex) {
                        this.tabbar.insertBefore(this.pulledDiv, elementsAtPoint[1]);
                    } else {
                        this.tabbar.insertBefore(this.pulledDiv, elementsAtPoint[1].nextElementSibling);
                    }
                }
                //save the order of my containers in settings
                this.settings.containerOrder = Array.from(this.tabbar.children).map(i => i.dataset.containerid);
                this.settings.containerOrder.pop();//remove button with undefined id
                this.pulledDiv = undefined;
            }
        })

        document.addEventListener("keydown", (e) => {
            if (e.getModifierState("Shift")) {
                this.plus.innerText = "x";
                this.plus.style.color = "red";
            }
        })

        document.addEventListener("keyup", (e) => {
            if (!e.getModifierState("Shift")) {
                this.plus.innerText = "+";
                this.plus.style.color = "blue";
            }
        })

        let tabmenu;
        //Delegated context menu click on tabs
        let c = new _contextMenuManager(this.outerDiv);
        this.outerDiv.style.position = "relative"; // needs to be here for context menus to work
        let contextedOperatorIndex = undefined;
        let tabfilter = (e) => {
            let t = e.target;
            while (t != this.tabbar) {
                if (t.tagName == "SPAN") {
                    break;
                } else {
                    t = t.parentElement;
                }
            }
            contextedOperatorIndex = t.dataset.containerid;
            let tp = t.parentElement;
            if (this.parent instanceof polymorph_core.rect) {
                //i have a prent, show subframe parent button
                tabmenu.querySelector(".subframePR").style.display = "block";
            } else {
                tabmenu.querySelector(".subframePR").style.display = "none";
            }
            return true;
        }
        tabmenu = c.registerContextMenu(`
    <li>Subframing
        <ul class="submenu">
            <li class="subframe">Subframe Contents</li>
            <li class="subframePR">Subframe Parent Rect</li>
        </ul>
    </li>
    <li>Export/Import
    <ul class="submenu">
        <li class="cpfr">Copy frame settings</li>
        <li class="psfr">Paste frame settings</li>
        <!--
        <li class="xpfr">Export frame to text...</li>
        <li class="mpfr">Import frame from text...</li>
        <li class="xdoc">Export frame as document...</li>
        -->
    </ul>
    </li>
    `, this.tabbar, undefined, tabfilter);
        tabmenu.querySelector(".subframePR").addEventListener("click", () => {
            // at the tab, create a new subframe operator
            let newContainerID = polymorph_core.insertItem({
                _od: {
                    t: "subframe",
                    p: rectID,
                    data: {},
                    outputRemaps: {},
                    inputRemaps: {},
                    tabbarName: polymorph_core.containers[contextedOperatorIndex].settings.tabbarName
                }
            });
            let sf = (new polymorph_core.container(newContainerID));
            let seenNewContainer = false;
            while (this.innerDivContainer.children.length > 1) {
                //the container ties itself, so we need to make sure it does not eat itself
                let containerid = this.innerDivContainer.children[0].dataset.containerid;
                if (containerid == newContainerID) {
                    seenNewContainer = true;
                }
                if (seenNewContainer) {
                    containerid = this.innerDivContainer.children[1].dataset.containerid;
                }
                this.tabbar.querySelector(`[data-containerid="${containerid}"]`).remove();
                this.innerDivContainer.querySelector(`[data-containerid="${containerid}"]`).remove();
                sf.operator.rect.tieContainer(containerid);
                polymorph_core.containers[containerid].settings.p = sf.operator.rect.id;
            }
            this.tieContainer(sf, contextedOperatorIndex);
            this.switchOperator(newContainerID);
            sf.operator.rect.switchOperator(contextedOperatorIndex);
            polymorph_core.fire("updateItem", { id: rectID, sender: this });
            tabmenu.style.display = "none";
        })
        tabmenu.querySelector(".subframe").addEventListener("click", () => {
            // at the tab, create a new subframe operator
            let newContainerID = polymorph_core.insertItem({
                _od: {
                    t: "subframe",
                    p: rectID,
                    data: {},
                    outputRemaps: {},
                    inputRemaps: {},
                    tabbarName: polymorph_core.containers[contextedOperatorIndex].settings.tabbarName
                }
            });
            let sf = (new polymorph_core.container(newContainerID));
            sf.loadOperator(); // dont lazy intitalise, we want it now
            this.tabbar.querySelector(`[data-containerid="${contextedOperatorIndex}"]`).remove();
            this.innerDivContainer.querySelector(`[data-containerid="${contextedOperatorIndex}"]`).remove();
            this.tieContainer(sf, contextedOperatorIndex);
            let oop = polymorph_core.containers[contextedOperatorIndex];
            sf.operator.rect.tieContainer(contextedOperatorIndex, 0);
            oop.settings.p = sf.operator.rect.id;
            polymorph_core.fire("updateItem", { id: rectID, sender: this });
            this.switchOperator(newContainerID);
            sf.operator.rect.switchOperator(contextedOperatorIndex);
            tabmenu.style.display = "none";
            this.refresh();
        })

        tabmenu.querySelector(".cpfr").addEventListener("click", () => {
            // at the tab, create a new subframe operator
            polymorph_core.copiedFrameID = contextedOperatorIndex;
            tabmenu.style.display = "none";
        })
        /*tabmenu.querySelector(".xdoc").addEventListener("click", () => {
            //export as a whole doc! how generous
            let tta = htmlwrap("<h1>Operator export:</h1><br><textarea style='height:30vh'></textarea>");
            tabmenu.style.display = "none";
            polymorph_core.dialog.prompt(tta);
            //how about this - export all the items, then the importer can just run the garbage cleaner on it when it starts?
            //or even better for future security: create a separate polymorph_core instance, and get it to GC itself. TODO!
            let collatedItems = polymorph_core.items;
            tta.querySelector("textarea").value = `{"displayName":"export-${new Date().toDateString()}","currentView":"default","id":"${polymorph_core.guid(5)}","views":{"default":{
            "o":[${JSON.stringify(this.containers[contextedOperatorIndex].toSaveData())}],"s":0,"x":0,"f":1,"p":0}},"items":${JSON.stringify(collatedItems)}}`;
        })*/

        tabmenu.querySelector(".psfr").addEventListener("click", () => {
            // Ditch the old container
            let containerid = contextedOperatorIndex;
            this.tabbar.querySelector(`[data-containerid="${containerid}"]`).remove();
            this.innerDivContainer.querySelector(`[data-containerid="${containerid}"]`).remove();
            delete polymorph_core.containers[containerid];
            delete polymorph_core.items[containerid]._od;
            let newID = polymorph_core.insertItem(JSON.parse(JSON.stringify(polymorph_core.items[polymorph_core.copiedFrameID])));
            polymorph_core.items[newID]._od.p = rectID;
            polymorph_core.items[newID]._od.data.operatorClonedFrom = polymorph_core.copiedFrameID;//facilitate subframe deep copy
            polymorph_core.containers[contextedOperatorIndex] = new polymorph_core.container(newID);
            polymorph_core.fire("updateItem", { id: rectID, sender: this });
            this.switchOperator(newID);
            tabmenu.style.display = "none";
        })
        /*
            tabmenu.querySelector(".xpfr").addEventListener("click", () => {
                let tta = htmlwrap("<h1>Operator export:</h1><br><textarea style='height:30vh'></textarea>");
                tabmenu.style.display = "none";
                polymorph_core.dialog.prompt(tta);
                tta.querySelector("textarea").value = JSON.stringify(this.containers[contextedOperatorIndex].toSaveData());
            })
        
            tabmenu.querySelector(".mpfr").addEventListener("click", () => {
                let tta = htmlwrap("<h1>Operator import:</h1><br><textarea style='height:30vh'></textarea><br><button>Import</button>");
                polymorph_core.dialog.prompt(tta);
                tta.querySelector("button").addEventListener("click", () => {
                    if (tta.querySelector("textarea").value) {
                        let importObject = JSON.parse(tta.querySelector("textarea").value);
                        this.containers[contextedOperatorIndex].fromSaveData(importObject);
                        this.tieContainer(this.containers[contextedOperatorIndex], contextedOperatorIndex);
                        polymorph_core.fire("updateItem", { id: rectID, sender: this });
                        //force update all items to reload the view
                        for (let i in polymorph_core.items) {
                            polymorph_core.fire('updateItem', { id: i });
                        }
                    }
                })
                tabmenu.style.display = "none";
            })
        */
        //And a delegated settings button handler
        this.tabbar.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() == "img") {
                //dont show settings - instead, copy the settings div onto the polymorph_core settings div.
                if (polymorph_core.containers[this.settings.s].operator.dialogDiv) {
                    this.settingsOperator = polymorph_core.containers[this.settings.s].operator;
                    this.settingsOperator.showDialog();
                    this.settingsDiv = document.createElement("div");
                    this.settingsDiv.innerHTML = `<h1>Settings</h1>
                <h3> General settings </h3>
                <input class="tabDisplayName" placeholder="Tab display name:"/>
                <h3>Operator settings</h3>`;
                    this.settingsOperator.dialogDiv.style.maxWidth = "50vw";
                    this.settingsDiv.appendChild(this.settingsOperator.dialogDiv);
                    this.settingsDiv.querySelector(".tabDisplayName").value = this.tabbar.querySelector(`[data-containerid="${this.settings.s}"]`).children[0].innerText;
                    //add remapping by the operator
                    polymorph_core.containers[this.settings.s].readyRemappingDiv();
                    this.settingsDiv.appendChild(polymorph_core.containers[this.settings.s].remappingDiv);

                    polymorph_core.dialog.prompt(this.settingsDiv, (d) => {
                        polymorph_core.containers[this.settings.s].settings.tabbarName = d.querySelector("input.tabDisplayName").value;
                        this.tabbar.querySelector(`[data-containerid="${this.settings.s}"]`).children[0].innerText = polymorph_core.containers[this.settings.s].settings.tabbarName;
                        if (this.settingsOperator.dialogUpdateSettings) this.settingsOperator.dialogUpdateSettings();
                        polymorph_core.containers[this.settings.s].processRemappingDiv();
                        polymorph_core.fire("updateItem", { id: rectID });
                    })
                } else {
                    //old version
                    if (polymorph_core.containers[this.settings.s].operator.showSettings) {
                        polymorph_core.containers[this.settings.s].operator.showSettings();
                    }
                }
                //also render the datastreams if necessary.
                //this.renderDataStreams(this.containers[this.settings.s].operator);
            }
        })

        //handle a resize event.
        this.refresh = () => {
            //perform some sanity checks; if these fail, do nothing (in worse case that we accidentally manually delete sth)
            if (this.settings.f != RECT_FIRST_SIBLING && !(this.otherSiblingID)) {
                console.log(`refresh assert failed for ${rectID}`);
                return;
            }
            if (this.settings.x == RECT_ORIENTATION_X) {
                this.outerDiv.parentElement.style.flexDirection = "row";
                this.outerDiv.style.order = this.settings.f;
                if (this.settings.f == RECT_FIRST_SIBLING) {
                    //this.outerDiv.style.left = 0;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetWidth * this.settings.ps + "px";
                } else {
                    //dont use this.settings.ps, use my sibling's ps.
                    //this.outerDiv.style.left = this.outerDiv.parentElement.offsetWidth * this.otherSiblingSettings.ps;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetWidth * (1 - this.otherSiblingSettings.ps) + "px";
                }
                this.outerDiv.style.height = "100%"; //this.outerDiv.parentElement.offsetHeight;
                this.outerDiv.style.top = 0;
            } else {
                this.outerDiv.parentElement.style.flexDirection = "column";
                this.outerDiv.style.order = this.settings.f;
                if (this.settings.f == RECT_FIRST_SIBLING) {
                    //this.outerDiv.style.top = 0;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetHeight * this.settings.ps + "px";
                } else {
                    //this.outerDiv.style.top = this.outerDiv.parentElement.offsetHeight * this.otherSiblingSettings.ps;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetHeight * (1 - this.otherSiblingSettings.ps) + "px";
                }
                this.outerDiv.style.width = "100%";//this.outerDiv.parentElement.offsetWidth;
                //this.outerDiv.style.left = 0;
            }
            //also refresh any of my children
            if (this.children) {
                //when tieing doubly-nested rects, sometimes a refresh is called on a child before it is tied, resulting in parentElement error.
                //so check parentElement before refreshing
                this.children.forEach((c) => {
                    if (c.outerDiv.parentElement) c.refresh()
                });
            } else {
                //show my container
                this.switchOperator(this.settings.s);
                //order the tabbars
                if (this.settings.containerOrder) {
                    this.settings.containerOrder.forEach(i => {
                        let currentTab = this.tabbar.querySelector(`[data-containerid='${i}']`);
                        if (currentTab) this.tabbar.appendChild(currentTab);
                    })
                    this.tabbar.appendChild(this.plus);
                }
                for (let i in this.tabbar.length) {

                }
            }
            if (this.containers) this.containers.forEach((c) => {
                //containers may not exist on fromSaveData
                if (c) c.refresh()
            });
        }
        let rectChanged = false;

        this.rectsTied = [];
        this.tieRect = (rectID) => {
            this.innerDivContainer.remove();
            this.tabbar.remove();
            this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
            this.rectsTied.push(rectID);
            if (this.rectsTied.length > 2) {
                console.log("multiple rect ties BAD; arbitration in progress");
                //likely due to some split going wrong
                //first group rects
                let contenders = {};
                let side1 = [];
                let side0 = [];
                for (let r of this.rectsTied) {
                    console.log(r);
                    console.log(polymorph_core.items[r]._rd);
                    contenders[r] = {
                        //id:r,
                        operatorCount: Object.values(polymorph_core.containers).filter(i => i.settings.p == r).length,
                        nonZeroPS: polymorph_core.items[r]._rd.ps != 0
                    };
                    //cluster 
                    if (polymorph_core.items[r]._rd.f) {
                        side1.push(r);
                    } else {
                        side0.push(r);
                    };
                    side0.sort((a, b) => {
                        if (contenders[b].operatorCount != contenders[a].operatorCount) {
                            return contenders[b].operatorCount - contenders[a].operatorCount;
                        } else return contenders[b].nonZeroPS - contenders[a].nonZeroPS;
                    })
                    side1.sort((a, b) => {
                        if (contenders[b].operatorCount != contenders[a].operatorCount) {
                            return contenders[b].operatorCount - contenders[a].operatorCount;
                        } else return contenders[b].nonZeroPS - contenders[a].nonZeroPS;
                    })
                    side0.slice(1).forEach(i => {
                        polymorph_core.rects[i].outerDiv.remove();
                        delete polymorph_core.items[i]._rd.p;
                        console.log("arbitration nerfed " + i);
                    });
                    side1.slice(1).forEach(i => {
                        polymorph_core.rects[i].outerDiv.remove();
                        delete polymorph_core.items[i]._rd.p;
                        console.log("arbitration nerfed " + i);
                    });
                }
                // case 1: two rects conflicting
                // case 2: one pair and one lone rect conflicting
                // case 3: two pairs of rects conflicting
            }
        }

        this.containerVisible = (id) => {
            if (this.parent) return this.settings.s == id && (this.parent == polymorph_core || this.parent.visible());
            else return false;
        }

        this.visible = () => {
            if (this.parent == polymorph_core) return true;
            else if (this.parent) return (this.parent.visible());
            else return false; // not attached yet
        }

        let shiftPressed = false;
        let highlightDirn = -1;
        let borders = ['left', 'right', 'top', 'bottom'];

        this.redrawBorders = () => {
            if (shiftPressed) {
                if (!this.children) {
                    this.outerDiv.style.border = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;
                    if (this.parent instanceof polymorph_core.rect) {
                        /*if (this.settings.x) {
                            this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth - 2 * RECT_BORDER_WIDTH;
                        } else {
                            this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight - 2 * RECT_BORDER_WIDTH;
                        }*/
                    }
                    if (highlightDirn != -1) {
                        this.outerDiv.style["border-" + borders[highlightDirn]] = RECT_BORDER_WIDTH + "px red solid";
                    }
                } else {
                    this.outerDiv.style.border = "";
                }
            } else if (this.parent instanceof polymorph_core.rect) {
                this.outerDiv.style.border = "";
                if (this.settings.f) {
                    this.outerDiv.style["border-" + (this.settings.x ? "top" : "left")] = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;
                }
                if ((this.settings.f && ((highlightDirn == 2 && this.settings.x == 1) || (highlightDirn == 0 && this.settings.x == 0)))) {
                    this.outerDiv.style["border-" + borders[highlightDirn]] = RECT_BORDER_WIDTH + "px red solid";
                }
                if (this.outerDiv.parentElement) {
                    // on load parentElement doesnt exist
                    /*if (this.settings.x) {
                        this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth;
                    } else {
                        this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight;
                    }*/
                }
            } else {
                this.outerDiv.style.border = "";
            }

        }
        //Make draggable borders.
        this.redrawBorders();
        //events
        //this is called by both actual mouse moves and delegations, so don't put it directly as the handler.
        this.mouseMoveHandler = (e) => {
            if (this.children) {
                //forward events to children
                this.children[0].mouseMoveHandler(e);
                this.children[1].mouseMoveHandler(e);
            }
            if (this.parent instanceof polymorph_core.rect || (e.shiftKey && (e.ctrlKey || e.metaKey) && !this.children)) {
                highlightDirn = -1;
                let cr = this.outerDiv.getClientRects()[0];
                if (e.clientX - cr.left >= 0 && cr.left + cr.width - e.clientX >= 0 && e.clientY - cr.top >= 0 && cr.top + cr.height - e.clientY >= 0) {
                    if (e.clientX - cr.left <= RECT_BORDER_WIDTH && e.clientX - cr.left >= 0) {
                        highlightDirn = 0;
                    } else if (cr.left + cr.width - e.clientX <= RECT_BORDER_WIDTH && cr.left + cr.width - e.clientX >= 0) {
                        highlightDirn = 1;
                    } else if (e.clientY - cr.top <= RECT_BORDER_WIDTH && e.clientY - cr.top >= 0) {
                        highlightDirn = 2;
                    } else if (cr.top + cr.height - e.clientY <= RECT_BORDER_WIDTH && cr.top + cr.height - e.clientY >= 0) {
                        highlightDirn = 3;
                    }
                }

                if (this.split != -1 && this.split != highlightDirn && !this.children) {
                    if (!(e.buttons % 2)) {
                        this.split = -1;
                        e.preventDefault();
                        //reset and return
                        return;
                    }
                    e.preventDefault();
                    // a split has been called. Initialise the split!
                    this.outerDiv.style.border = "none";
                    //remove all my children
                    //except the tutorial div
                    let tmp;
                    if (this.outerDiv.querySelector(".tutorial")) tmp = this.outerDiv.querySelector(".tutorial");
                    while (this.outerDiv.children.length) this.outerDiv.children[0].remove();
                    if (tmp) this.outerDiv.appendChild(tmp);

                    //Create new rects
                    let _XorY = (this.split > 1) * 1;
                    let _firstOrSecond = this.split % 2;
                    let newRectIDs = [
                        polymorph_core.insertItem({ _rd: { p: rectID, x: _XorY, f: 0, ps: _firstOrSecond } }),
                        polymorph_core.insertItem({ _rd: { p: rectID, x: _XorY, f: 1, ps: _firstOrSecond } })
                    ];
                    //instantiate the rects
                    newRectIDs.forEach((v) => {
                        polymorph_core.rects[v] = new polymorph_core.rect(v);
                    })
                    //copy in operators
                    this.containers.forEach((v, i) => {
                        v.settings.p = newRectIDs[!_firstOrSecond * 1];
                        polymorph_core.rects[newRectIDs[!_firstOrSecond * 1]].tieContainer(v.id);
                        polymorph_core.rects[newRectIDs[!_firstOrSecond * 1]].settings.s = v.id;
                    });

                    //force a refresh
                    this.children.forEach((v) => { v.refresh(); v.resizing = this.split ^ 1 });
                }
                //for resizing
                if (this.resizing != -1) {
                    //cancel on mouseup
                    if (!(e.buttons % 2) || this.resizing != this.settings.x * 2 + !(this.settings.f)) {
                        this.resizing = -1;
                        e.preventDefault();
                        //reset and return
                        return;
                    }
                    //don't resize if not appropriate border


                    e.preventDefault();
                    //calculate the pos parameter (it can be fed to both siblings)
                    if (this.settings.x) this.settings.ps = (e.clientY - this.outerDiv.parentElement.getClientRects()[0].top) / this.outerDiv.parentElement.getClientRects()[0].height;
                    else this.settings.ps = (e.clientX - this.outerDiv.parentElement.getClientRects()[0].left) / this.outerDiv.parentElement.getClientRects()[0].width;
                    if (this.settings.ps < 0) {
                        this.settings.ps = 0;
                        this.resizing = -1;
                    }
                    if (this.settings.ps > 1) {
                        this.settings.ps = 1;
                        this.resizing = -1;
                    }
                    if (this.parent instanceof polymorph_core.rect) {
                        this.otherSiblingSettings.ps = this.settings.ps;
                        this.refresh();
                        if (this.otherSibling) this.otherSibling.refresh();
                    }
                    e.preventDefault();
                    rectChanged = true;
                }
                //reset all border colors

                this.redrawBorders();
            }
        };
        this.outerDiv.addEventListener("mousemove", this.mouseMoveHandler);

        document.addEventListener("keydown", (e) => {
            if (e.key == "Shift" || e.key == "Control" || e.key == "Meta") {
                shiftPressed = e.shiftKey && (e.ctrlKey || e.metaKey);
                this.redrawBorders();
            }
        })
        document.addEventListener("keyup", (e) => {
            if (e.key == "Shift" || e.key == "Control" || e.key == "Meta") {
                shiftPressed = e.shiftKey && (e.ctrlKey || e.metaKey);
                this.redrawBorders();
            }
        })
        this.mouseUpHandler = (e) => {
            //push the new view, if anything interesting happened
            this.resizing = -1;
            if (this.children) {
                this.children[0].mouseUpHandler(e);
                this.children[1].mouseUpHandler(e);
            }
            if (rectChanged) {
                polymorph_core.fire("updateItem", {
                    id: rectID,
                    sender: this
                });
                rectChanged = false;
            }
        }
        this.outerDiv.addEventListener("mouseup", this.mouseUpHandler);

        this.outerDiv.addEventListener("mouseleave", () => {
            this.redrawBorders();
            this.split = -1;
        })
        this.outerDiv.addEventListener("mousedown", (e) => {
            let dirn = -1;
            let cr = this.outerDiv.getClientRects()[0];
            if (e.clientX - cr.left <= RECT_BORDER_WIDTH && e.clientX - cr.left >= 0) {
                dirn = 0;
            } else if (cr.left + cr.width - e.clientX <= RECT_BORDER_WIDTH && cr.left + cr.width - e.clientX >= 0) {
                dirn = 1;
            } else if (e.clientY - cr.top <= RECT_BORDER_WIDTH && e.clientY - cr.top >= 0) {
                dirn = 2;
            } else if (cr.top + cr.height - e.clientY <= RECT_BORDER_WIDTH && cr.top + cr.height - e.clientY >= 0) {
                dirn = 3;
            }
            if (e.shiftKey) {
                this.split = dirn;
            } else {
                this.resizing = dirn;
            }

        })
        ///Saving
        this.toSaveData = () => {
            //just ensure your item data is accurate.
            return this.settings;
        }

        //connect to my parent
        if (this.settings.p && polymorph_core.items[this.settings.p]) {
            //there is or will be a rect / subframe for it.
            if (polymorph_core.rects[this.settings.p]) {
                polymorph_core.rects[this.settings.p].tieRect(rectID);
            } else {
                if (!polymorph_core.rectLoadCallbacks[this.settings.p]) polymorph_core.rectLoadCallbacks[this.settings.p] = [];
                polymorph_core.rectLoadCallbacks[this.settings.p].push(rectID);
            }
        }

        //Signal all children waiting for this that they can connect to this now.
        if (polymorph_core.rectLoadCallbacks[rectID]) polymorph_core.rectLoadCallbacks[rectID].forEach((v) => {
            if (polymorph_core.items[v]._od) {
                //v is container
                this.tieContainer(v);
            } else {
                //v is rect
                this.tieRect(v);
            }
        });
        this.remove = () => {
            // nerf all containers
            this.containers.forEach(i => i.remove());
            this.containerids.forEach(i => {
                delete polymorph_core.items[i]._od;
            });
            delete polymorph_core.items[rectID]._rd;
            delete polymorph_core.rects[rectID];//seppuku
        }
    }

    Object.defineProperty(polymorph_core, "baseRect", {
        get: () => {
            try {
                if (polymorph_core.rects[polymorph_core.items._meta.currentView]) {
                    return polymorph_core.rects[polymorph_core.items._meta.currentView];
                } else {
                    polymorph_core.items._meta.currentView = Object.keys(polymorph_core.rects)[0];//if the base rect is deleted
                    return polymorph_core.rects[polymorph_core.items._meta.currentView];
                }
            } catch (e) {
                return undefined;
            }
        }
    })

    polymorph_core.rects = {};

};

/*
Data storage reference
polymorph_core.currentDoc={
    views:{rect:rectData},
    items:[],
    displayName: "whatever"
}

polymorph_core.userData={
    uniqueStyle=some style
}

*/
if (isPhone()) {
    polymorph_core.on("UIsetup", () => {
        document.body.appendChild(htmlwrap(`
        <style>
            #oplists button.remove{
                float: right;
                margin-right: 20%;
                font-style: normal;
                font-weight: bold;
                color: darkred;
            }
        </style>`));
        document.body.appendChild(htmlwrap(`<div id="topbar" style="flex: 0 0 2em">
            <button id="menu" style="font-size: 1.5em;width: 1.5em;height: 1.5em;text-align:center; overflow:hidden;">=</button>
            <span class="docName" contentEditable>Polymorph</span>
            <button id="opop" style="position: absolute; right:0; top: 0; z-index:5;font-size: 1.5em;width: 1.5em;height: 1.5em;text-align:center; overflow:hidden;">*</button>
        </div>`));

        //oplists
        document.body.appendChild(htmlwrap(/*html*/`
        <div style="width:100%; flex: 1 1 100%; position:relative; overflow: hidden">
        <style>
        [data-containerid]{
            padding: 10px 10px;
            border: 1px black solid;   
        }
        </style>
            <div style="position: absolute;top:0;bottom:0; left:-100%; background:rgba(0,0,0,0.5); width:100%; z-index:100;">
                <div id="menulist" style="position: absolute;top:0;bottom:0; background:blueviolet; width:70%">    
                    <p><button class="saveSources">save</button>
                        <button class="viewdialog">view</button>
                        <button class="open">open</button></p>
                    <div id="rectList" style="position: absolute;
                    top: 3em;
                    bottom: 0;
                    overflow: auto;
                    width: 100%;">
                    </div>
                </div>
            </div>
            <div id="body" style="position: absolute;top:0;bottom:0; width: 100%; background: url('assets/nightsky.jpg'); background-size: cover; background-position: center center;">
            </div>
        </div>`));
        document.body.appendChild(htmlwrap(`<div class="wall"
            style="z-index: 100;position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: none">
            <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
                <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
        </div>`));

        let tc = new capacitor(1000, 10, () => {
            polymorph_core.fire("updateDoc");
        });

        polymorph_core.on("UIstart", () => {
            polymorph_core.documentTitleElement = document.querySelector(".docName");
            polymorph_core.documentTitleElement.addEventListener("keyup", () => {
                polymorph_core.items._meta.displayName = polymorph_core.documentTitleElement.innerText;
                tc.submit();
                document.querySelector("title").innerHTML =
                    polymorph_core.items._meta.displayName + " - Polymorph";
                polymorph_core.userSave();
            });
        })


        document.body.style.display = "flex";
        document.body.style.height = "100%";
        document.body.style.flexDirection = "column";
        polymorph_core.toggleMenu = function (visible) {
            if (visible == undefined) {
                visible = (document.body.querySelector("#menulist").parentElement.style.left != "0px"); //because we are toggling
            }
            if (visible) {
                document.body.querySelector("#menulist").parentElement.style.left = "0px";
            } else {
                document.body.querySelector("#menulist").parentElement.style.left = "-100%";
            }
        }
        document.body.querySelector("#menu").addEventListener("click", () => {
            polymorph_core.toggleMenu(true);
        });
        document.body.querySelector("#menu").addEventListener("click", () => {
            polymorph_core.toggleMenu(true);
        });
        document.body.querySelector("#menulist").parentElement.addEventListener("click", (e) => {
            if (e.currentTarget == e.target) {
                polymorph_core.toggleMenu(false);//hide on direct taps
            }
        });

        document.querySelector(".viewdialog").addEventListener("click", () => {
            let v = prompt("Switch to another view:");
            if (v) polymorph_core.switchView(v);
        });

        document.querySelector(".savesources").addEventListener("click", () => {
            polymorph_core.showSavePreferencesDialog();
        });

        document.querySelector(".open").addEventListener("click", () => {
            window.location.href = window.location.pathname + "?o", "_blank";
        });
        document.querySelector("#opop").addEventListener("click", () => {
            //dont show settings - instead, copy the settings div onto the polymorph_core settings div.
            if (polymorph_core.containers[polymorph_core.currentOperator].operator.dialogDiv) {
                polymorph_core.settingsOperator = polymorph_core.containers[polymorph_core.currentOperator].operator;
                polymorph_core.settingsOperator.showDialog();
                polymorph_core.settingsDiv = document.createElement("div");
                polymorph_core.settingsDiv.innerHTML = `<h1>Settings</h1>
                <h3> General settings </h3>
                <input class="tabDisplayName" placeholder="Tab display name:"/>
                <h3>Operator settings</h3>`;
                polymorph_core.settingsOperator.dialogDiv.style.maxWidth = "50vw";
                polymorph_core.settingsDiv.appendChild(polymorph_core.settingsOperator.dialogDiv);
                polymorph_core.settingsDiv.querySelector(".tabDisplayName").value = polymorph_core.settingsOperator.settings.tabbarName;
                //add remapping by the operator
                polymorph_core.containers[polymorph_core.currentOperator].readyRemappingDiv();
                polymorph_core.settingsDiv.appendChild(polymorph_core.containers[polymorph_core.currentOperator].remappingDiv);

                polymorph_core.dialog.prompt(polymorph_core.settingsDiv, (d) => {
                    polymorph_core.containers[polymorph_core.currentOperator].settings.tabbarName = d.querySelector("input.tabDisplayName").value;
                    document.querySelector("#oplists").querySelector(`[data-containerid="${polymorph_core.currentOperator}"]`).innerText = polymorph_core.containers[polymorph_core.currentOperator].settings.tabbarName;
                    if (polymorph_core.settingsOperator.dialogUpdateSettings) polymorph_core.settingsOperator.dialogUpdateSettings();
                    polymorph_core.containers[polymorph_core.currentOperator].processRemappingDiv();
                    polymorph_core.fire("updateItem", { id: rectID });
                })
                polymorph_core.dialog.register(polymorph_core.currentOperator);
            }
        });
    });
    polymorph_core.on("documentCreated", (id) => {
        if (!polymorph_core.userData.documents[id]) polymorph_core.userData.documents[id] = { saveSources: {} };
        polymorph_core.userData.documents[id].autosave = true;// by default make autosave true, so user does not have to save
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Operator conveinence functions
    //Add showOperator

    polymorph_core.showOperator = function (op) {
        if (document.body.querySelector("#body").children.length) document.body.querySelector("#body").children[0].remove();
        document.body.querySelector("#body").appendChild(op.topdiv);
        if (op.operator && op.operator.refresh) op.operator.refresh();
        polymorph_core.currentOperator = op;
        polymorph_core.fire("operatorChanged");
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //UI handling


    /*this.filescreen.baseDiv.querySelector("button.gstd").addEventListener("click", () => {
        // create a new workspace, then load it
        window.location.href += "?doc=" + polymorph_core.guid(7) + "&src=lf";
    })*/


    polymorph_core.resetView = function () {
        if (document.body.querySelector("#body").children.length) document.body.querySelector("#body").children[0].remove();
        polymorph_core.baseRect = new _rect(polymorph_core,
            undefined, {});
        polymorph_core.baseRect.refresh();
    }

    polymorph_core.on("operatorChanged", function (d) {
        if (polymorph_core.userData.documents[polymorph_core.currentDocID] && polymorph_core.userData.documents[polymorph_core.currentDocID].autosave && !polymorph_core.isSaving) {
            polymorph_core.autosaveCapacitor.submit();
        }
    });

    polymorph_core.topbar = {
        add: () => {
            return document.createElement("div");
        }
    }
}

;

if (!isPhone()){

    function _topbar(parent, options) {
        this.node = document.createElement("ul");
        this.node.classList.add("topbar");
        //check if we need to inject style
        if (!document.querySelector("style.topbar")) {
            let s = document.createElement("style");
            s.classList.add("topbar");
            s.innerHTML = `
            /*General styling*/
            ul.topbar, ul.topbar ul {
                list-style-type: none;
                margin: 0;
                padding: 0;
                background: black;
                overflow: auto;
                font-size: 1em;
                z-index: 1000;
            }
            
            ul.topbar li>a {
                user-select: none;
                cursor: pointer;
                display: inline-block;
                z-index: 1000;
            }
    
            ul.topbar li{
                background:black;
            }
    
            ul.topbar li:hover{
                background-color: lightskyblue;
                z-index: 1000;
            }
    
            /*Top level specific styling*/
            ul.topbar>li>a{
                color: white;
                text-align: center;
                text-decoration: none;
                padding: 0.5em 16px;
                z-index: 1000;
            }
            
            ul.topbar>li{
                float:left;
                background:black;
                z-index: 1000;
            }
    
            ul.topbar>li>ul {
                font-size: 1em;
                z-index: 1000;
            }
            /*sublist specific styling*/
            ul.topbar ul {
                display: none;
                color:black;
                text-align:left;
                position: absolute;
                background-color: #f9f9f9;
                z-index: 1;
                list-style: none;
                z-index: 1000;
            }
            
            ul.topbar>li:hover>ul {
                display: block;
                z-index: 1000;
            }
    
            ul.topbar ul>li>a{
                display:block;
                color:white;
                padding: 0.5em;
                z-index: 1000;
            }
            `;
            this.node.appendChild(s);
        }
        if (parent) parent.appendChild(this.node);
    
        let addToList = (el, base, pathName) => {
            let a = document.createElement("a");
            let li = document.createElement("li");
            li.dataset.topbarname = pathName;
            a.appendChild(el);
            li.appendChild(a);
            base.appendChild(li);
            return li;
        }
        this.add = this.appendChild = (string, domEl) => {
            // string is domel; string is one string, string is path, string is path and domel is domel
            if (typeof (string) != "string") {
                domEl = string;
                string = "";
            }
            let bits = string.split("/");
            if (!domEl) {
                domEl = document.createElement("a");
                domEl.innerText = bits[bits.length - 1];
            }
            let base = this.node;
            while (bits.length > 1) {
                let nextBit = bits.shift();
                if (nextBit) {
                    let newBase = base.querySelector(`[data-topbarname="${nextBit}"]>ul`);
                    if (!newBase) {
                        let newBaseLi = base.querySelector(`[data-topbarname="${nextBit}"]`);
                        if (!newBaseLi) {
                            let tempA = document.createElement("a");
                            tempA.innerText = nextBit;
                            newBaseLi = addToList(tempA, base, nextBit);
                        }
                        base = document.createElement("ul");
                        newBaseLi.appendChild(base);
                    } else {
                        base = newBase;
                    }
                }
            }
            //check if the domelement already exists; it might
            if (!base.querySelector(`[data-topbarname="${bits[0]}"]`)) {
                return addToList(domEl, base, bits[0]);
            }
        }
    }
    
    polymorph_core.on("UIsetup", () => {
        document.body.appendChild(htmlwrap(/*html*/`
        <style>
        #popup-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            font-size: 18px;
            line-height: 1;
            background: #000;
            color: white;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }
        #popup-notification.success {
            background: green;
        }
        #popup-notification.alert {
            background: red;
        }
    
        .showAndFadeOut {
            transition: opacity visibility 3s;
            animation: showAndFadeOut 3s;
        }
    
        @keyframes showAndFadeOut {
            0% {opacity: 1; visibility: visible;}
            80% {opacity: 1; visibility: visible;}
            100% {opacity: 0; visibility: hidden;}
        }
    
        @keyframes precessBackground {
            0% {background-position-x: 0%}
            100% {background-position-x: 100%}
        }
        </style>`));
        document.body.appendChild(htmlwrap(/*html*/`
        <div style="display:flex; flex-direction:column; height:100vh">
            <div class="banner" style="z-index:100">
                <div class="installPrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Install our desktop app! It's free!</button></div>
                <div class="gdrivePrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Try our Google Drive app for quick access to your files!</button></div>
                <!--<button class="sharer" style="background:blueviolet; border-radius:3px; border:none; padding:3px; color:white; position:absolute; top: 10px; right: 10px;">Share</button>-->
            </div>
            <div class="rectspace" style="width:100%; background: url('assets/purplestars.jpeg'); flex:0 1 100vh; max-height: calc(100% - 2.1em); position:relative">
            </div>
        </div>
        `));
        document.body.appendChild(htmlwrap(`
        <div class="wall"
            style="position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: block">
            <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
                <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
            </div>
        </div>`));
        ///////////////////////////////////////////////////////////////////////////////////////
        //Top bar
        polymorph_core.topbar = new _topbar(document.querySelector(".banner"));
    })
    
    polymorph_core.on("UIstart", () => {
        polymorph_core.topbar.add("File/Open").addEventListener("click", () => {
            window.open(window.location.pathname + "?o", "_blank");
        })
        polymorph_core.topbar.add("File/New").addEventListener("click", () => {
            window.open(window.location.pathname + "?o", "_blank");
        })
        polymorph_core.topbar.add("File/Clean up").addEventListener("click", () => {
            alert("Warning: this operation may reduce filesize but is irreversible. We recommend saving to a file before you run this operation.");
            if (confirm("PRESS OK TO PROCEED")) {
                polymorph_core.runGarbageCollector();
            }
        })
        polymorph_core.topbar.add("Tutorial").addEventListener("click", () => {
            polymorph_core.resetTutorial();
        })
        polymorph_core.topbar.add("Feedback").addEventListener("click", () => {
            let emaila = htmlwrap(`<a target="_blank" href="mailto:steeven.liu2@gmail.com?body=Hey%20there,%20I'm%20using%20polymorph%20and..." style="display:none"></a>`);
            document.body.appendChild(emaila);
            emaila.click();
        });
        window.addEventListener("resize", () => {
            polymorph_core.baseRect.refresh();
        })
    });
    
    polymorph_core.showNotification = function (notificationMessage, notificationType = 'default') {
    
        if (!document.getElementById("popup-notification")) {
            const popupNotification = document.createElement("div");
            popupNotification.setAttribute("id", "popup-notification");
            document.body.appendChild(popupNotification);
        }
    
        const popupNotificationBox = document.getElementById("popup-notification");
        popupNotificationBox.innerHTML = notificationMessage;
        popupNotificationBox.classList.add(notificationType);
        popupNotificationBox.classList.add('showAndFadeOut');
        const hideNotificationBox = setTimeout(() => {
            popupNotificationBox.classList = '';
        }, 2800)
    }
    
}
;

(function () {
    polymorph_core.registerOperator("opSelect", { displayName: "New Operator", hidden: true }, function (container) {
        let me = this;
        me.container = container;
        this.settings = {};
        this.style = document.createElement("style");
        this.style.innerHTML = `
    div.views>div{
        background:lightgrey;
        border: black 3px solid;
    }
    div.views>div:hover{
        background:white;
    }
    *{
        color:white;
    }
    button>*{
        color:black;
    }
    `;
        container.div.appendChild(this.style);

        this.rootdiv = document.createElement("div");
        this.rootdiv.style.height = "100%";
        this.rootdiv.style.overflowY = "auto";
        //Add div HTML here
        this.rootdiv.innerHTML = `
    <div class="views">
    </div>
    <h1 style="color:white">New Operator</h1>
    <p style="color:white">Choose an operator for this space! <a href="ethos.html" target="_blank">What's going on?</a></p>
    <div class="operators" style="display:flex; flex-direction:column">
    </div>`;
        this.reloadContents = () => {
            for (let i in polymorph_core.operators) {
                if (polymorph_core.operators[i].options.hidden) continue;
                if (this.rootdiv.querySelector(`[data-under-operator-name="${i}"]`)) return;
                //create the title block under operators if it needs creating
                let sectionContainer = this.rootdiv.querySelector(`[data-section="${polymorph_core.operators[i].options.section || "other"}"]`);
                if (!sectionContainer) {
                    sectionContainer = htmlwrap(`<div data-section="${polymorph_core.operators[i].options.section || "other"}">
                        <h2>${polymorph_core.operators[i].options.section || "Other"}</h2>
                        <div style="display:flex; flex-direction: row; flex-direction: row; flex-wrap:wrap; align-content: flex-start;">
                        </div>
                    </div>`);
                    this.rootdiv.querySelector(".operators").appendChild(sectionContainer);
                }
                sectionContainer = sectionContainer.children[1];

                let b = htmlwrap(`<button data-under-operator-name="${i}" style="flex: 0 0 15em; display:flex; flex-direction:column">
                <img src="${polymorph_core.operators[i].options.imageurl || ""}" style="flex: 0 0 14em; max-width:14em" ></img>
                <h3>${polymorph_core.operators[i].options.displayName || i}</h3>
                <span>${polymorph_core.operators[i].options.description || ""}</span>
                </button>`);
                b.addEventListener("click", () => {
                    //get out of the way
                    while (container.div.children.length) container.div.children[0].remove();
                    container.settings.t = b.dataset.underOperatorName;
                    container.operator = new polymorph_core.operators[b.dataset.underOperatorName].constructor(container);
                    //change the operator potato.
                    //change name if user has not already modified name
                    if (container.settings.tabbarName == "New Operator") container.settings.tabbarName = polymorph_core.operators[b.dataset.underOperatorName].options.displayName || b.dataset.underOperatorName;
                    //force the parent rect to update my name
                    polymorph_core.rects[container.settings.p].tieContainer(container.id);
                    container.fire("updateItem", {
                        id: this.container.id,
                        sender: this
                    });
                })
                sectionContainer.appendChild(b);
            }
        }
        this.reloadContents();
        container.div.appendChild(this.rootdiv);
        container.on("operatorAdded", me.reloadContents);
        this.refresh = this.reloadContents;
        //////////////////Handle polymorph_core item updates//////////////////

        //these are optional but can be used as a reference.

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = ``;
        this.showDialog = function () {
            // update your dialog elements with your settings
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////

        //Saving and loading
        this.toSaveData = function () {
            return this.settings;
        }


        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function () {

        }


    });
})();;

//V4.1: Now with how to use
//V4.0: now with repetition and calendar item generator

/*HOW TO USE:

let d = new _dateParser();
Date dt = d.extractTime(string data,Date reference);


-- todo lol

*/

function _dateParser() {
    let me = this;
    this.dateParserRegexes = [{
        name: "repetition",
        regex: /\((\d+)*\)/ig,
        operate: function (regres, data) {
            if (regres[1]) {
                data.repetition = Number(regres[1]);
            } else data.repetition = -1;
        }
    },
    {
        name: "pmtime",
        regex: /(?:^|\s)(?!:)(\d+)(am|pm)/g,
        operate: function (regres, data) {
            data.d.setMinutes(0);
            data.d.setSeconds(0);
            data.d.setHours(Number(regres[1]));
            if (regres[2] == 'pm') data.d.setHours(Number(regres[1]) + 12);
        }
    },
    {
        name: "time",
        regex: /(?:(?:(\d+)\/(\d+)(?:\/(\d+))?)|(?:(\d+):(\d+)(?::(\d+))?))/g,
        operate: function (regres, data) {
            data.d.setMinutes(0);
            data.d.setSeconds(0);
            //data.noDateSpecific = true;
            if (regres[1]) {
                data.d.setDate(Number(regres[1]))
                data.noDateSpecific = false;
            }
            if (regres[2]) data.d.setMonth(Number(regres[2]) - 1)
            if (regres[3]) {
                data.yr = Number(regres[3]);
                if (data.yr < 100) data.yr += 2000;
                data.d.setFullYear(data.yr)
            }
            if (regres[4]) {
                data.hr = Number(regres[4]);
                if (data.hr < 6) data.hr += 12;
            }
            data.d.setHours(data.hr);
            if (regres[5]) data.d.setMinutes(Number(regres[5]))
            if (regres[6]) data.d.setSeconds(Number(regres[6]))
        }
    },
    {
        name: "ampm",
        regex: /(am|pm)/gi,
        operate: function (regres, data) {
            if (regres[1] == "am") {
                if (data.d.getHours() > 12) {
                    data.d.setHours(data.d.getHours() - 12);
                }
            } else {
                if (data.d.getHours() < 12) {
                    data.d.setHours(data.d.getHours() + 12);
                }
            }
        }
    },
    {
        name: "dayofweek",
        regex: /(?:(mon)|(tue)s*|(?:(wed)(?:nes)*)|(?:(thu)r*s*)|(fri)|(sat)(?:ur)*|(sun))(?:day)*/ig,
        operate: function (regres, data, refdate) {
            data.nextDay = 0;
            for (i = 0; i < regres.length; i++) {
                if (regres[i] != undefined) {
                    data.nextDay = i;
                }
            }
            if (data.d.getDay() == data.nextDay % 7 && refdate.getTime() - data.d.getTime() > 0) {
                data.d.setDate(data.d.getDate() + 7);
            } else {
                data.d.setDate(data.d.getDate() + (data.nextDay + 7 - data.d.getDay()) % 7);
            }
        }
    },
    {
        name: "weekday",
        regex: /weekday/ig,
        operate: function (regres, data, refdate) {
            data.nextDay = 0;
            let tomorrow = data.d.getDay();
            if (refdate.getTime() - data.d.getTime() <= 0) tomorrow++;//respect past pure days.
            if (!(tomorrow > 0 && tomorrow < 5)) {
                data.d.setDate(data.d.getDate() + (8 - data.d.getDay()) % 7);
            }
        }
    },
    {
        name: "auto",
        regex: /auto/ig,
        operate: function (regres, data) {
            data.auto = true;
        }
    },
    //setters
    {
        name: "today",
        regex: /today/g,
        operate: function (regres, data) {
            today = new Date();
            data.d.setDate(today.getDate());
            data.d.setMonth(today.getMonth());
            data.noDateSpecific = false;
        }
    },
    {
        name: "now",
        regex: /now/g,
        operate: function (regres, data) {
            data.d = new Date();
            data.noDateSpecific = false;
        }
    },
    {
        name: "delTime",
        regex: /(\+|-)(\d+)(?:(m)(?:in)*|(h)(?:ou)*(?:r)*|(d)(?:ay)*|(w)(?:ee)*(?:k)*|(M)(?:o)*(?:nth)*|(y(?:ea)*(?:r)*))/g,
        operate: function (regres, data) {
            data.freeamt = 1;
            for (i = 3; i < regres.length; i++) {
                if (regres[i] != undefined) {
                    factor = i;
                }
            }
            switch (factor) { /// this can be improved.
                case 3:
                    data.freeamt = 1000 * 60;
                    break;
                case 4:
                    data.freeamt = 1000 * 60 * 60;
                    break;
                case 5:
                    data.freeamt = 1000 * 60 * 60 * 24;
                    break;
                case 6:
                    data.freeamt = 1000 * 60 * 60 * 24 * 7;
                    break;
                case 7:
                    data.freeamt = 1000 * 60 * 60 * 24 * 30;
                    break;
                case 8:
                    data.freeamt = 1000 * 60 * 60 * 24 * 365;
                    break;
            }
            data.freeamt *= Number(regres[2]);
            if (regres[1] == "-") {
                data.freeamt *= -1;
                data.noDateSpecific=false;
            }
            data.d.setTime(data.d.getTime() + data.freeamt);
        }
    }
    ];
    this.reverse = false;
    this.extractTime = function (str, refdate) {
        let d;
        if (!refdate) {
            d = new Date();
            refdate = new Date();
        } else {
            d = new Date(refdate.getTime());
        }
        me.tempdata = {
            hr: 9,
            noDateSpecific: true,
            d: d
        };
        let seen = false;
        let regres;
        for (let z = 0; z < this.dateParserRegexes.length; z++) {
            this.dateParserRegexes[z].regex.lastIndex = 0; //force reset regexes
            while ((regres = this.dateParserRegexes[z].regex.exec(str)) != null) {
                this.dateParserRegexes[z].operate(regres, me.tempdata, refdate);
                seen = true;
            }
        }
        while (me.tempdata.noDateSpecific && refdate.getTime() - me.tempdata.d.getTime() > 0) me.tempdata.d.setDate(me.tempdata.d.getDate() + 1);
        if (seen) return me.tempdata.d;
        else return undefined;
        //returns a Date() object, or undefined.
    }

    this.richExtractTime = function (str, refdate) {
        //returns an array of the form:
        /*
        refdate is a Date().

        {date:beginning date (integer)
        part: substring that resulted in this date
        endDate: end date (integer)}
        */
        let orefdate = refdate;// Honour orefdate first - this is passed externally
        //otherwise honour the first part of the repetition.
        let dvchain = str.split("&");
        let result = []; //see below.
        for (let k = 0; k < dvchain.length; k++) {
            //Check for repetition structure.
            let rsplit = /\((?:([^\)\|]+)\|\|)?([^\)\|]+)(?:\|([^\)\|]+))?\)/ig.exec(dvchain[k]);
            let toParse;
            let reps = undefined;
            let part = dvchain[k];
            refdate = undefined;
            if (rsplit) {
                if (rsplit[1] && !orefdate) {
                    refdate = this.extractTime(rsplit[1]);
                } else refdate = orefdate || new Date();
                toParse = rsplit[2];
                if (rsplit[3]) {
                    reps = Number(rsplit[3]);
                }
                if (isNaN(reps)) reps = -1;
                part = "(" + refdate.toLocaleString() + "||" + rsplit[2] + "|" + reps + ")";
            } else {
                toParse = dvchain[k]; //the whole thing
            }
            if (!orefdate && !refdate) refdate = new Date();
            else if (orefdate && !refdate) refdate = orefdate;
            let db = toParse.split(">");
            let subj = undefined;
            let begin = this.extractTime(db[0], refdate);
            if (begin) {
                subj = {
                    date: begin.getTime(),
                    part: part,
                    opart: dvchain[k],
                    refdate: refdate.getTime(),
                    reps: reps
                };
                if (db[1]) {
                    let endDate = me.extractTime(db[1], begin);
                    if (endDate) subj.endDate = endDate.getTime();
                    else subj.endDate = begin.getTime() + 1000 * 60 * 60; // add one hour (will change to some standard time parameter in the future)
                } else subj.endDate = begin.getTime() + 1000 * 60 * 60;
                result.push(subj);
            }
        }
        result.sort((a, b) => {
            return a.date - b.date
        });
        return result;
        //returns an array of objects of the form:
        /*
            [{
                refdate: date.getTime() representing the reference date (typically when the item was last updated).
                date: date.getTime() representing the next occurence of the event after the refdate.
                endDate: date.getTime() representing the end of the next occurence of the event, if specified.
                opart: string: the original string that created this chunk.
                part: string: a string that would create this same chunk (some references may have been updated.).
                reps: integer representing number of times the recurrence should occur. -1 if forever.
            }]

        */
    }

    //Create calendar items for fullcalendar.io and other similar things.
    this.getCalendarTimes = function (dateArray, start, end) {
        // Param: dateArray: as specified above. start: date.getTime() of the starting date. end: date.getTime() of the ending date.
        //Get the date once
        let output;
        let results = [];
        for (let i = 0; i < dateArray.length; i++) {
            let refstart = new Date(dateArray[i].refdate);
            let recurCount = dateArray[i].reps;
            if (!isNaN(recurCount)) {
                if (recurCount < 0 || recurCount > 100) recurCount = 100;
            } else {
                recurCount = 1;
            }
            do {
                output = this.richExtractTime(dateArray[i].part, refstart)[0];
                if (!output) break;
                results.push(output); //um it's an array?
                recurCount--;
                refstart = new Date(output.endDate);
            } while (output.date < end && recurCount != 0);
        }
        return results;
        //Return an array of objects like the ones above.
        /*
         */
    }

    this.stringToTimeObject = (str) => {
        let obj = {
            datestring: str,
            date: dateParser.richExtractTime(str)
        }
        return obj;
    }

    this.humanReadableRelativeDate=(datenum)=>{
        let d=new Date(datenum);
        let now=new Date();
        //if same day, just report time
        //otherwise report day only
        if (d.getDate()==now.getDate() && d.getFullYear()==now.getFullYear() && d.getMonth()==now.getMonth()){
            return d.toTimeString().split(" ")[0]
        }else{
            return d.toLocaleDateString().split(" ")[0]
        }
    }

    // quarterMaster.itemComparer = function (a, b) {end
    //     let result;
    //     if (a.done != b.done) result = b.done - a.done;
    //     else if (a.done * b.done) {
    //         result = -(b.date - a.date);
    //     } else {
    //         result = (b.date - a.date);
    //     }
    //     if (!quarterMaster.isDateSortReversed) {
    //         result = -result;
    //     }
    //     return result;
    // };
    // quarterMaster.sort = function () {
    //     let itemsToSort = [];
    //     for (let i in quarterMaster.items) {
    //         let ti = {
    //             id: i
    //         }
    //         if (quarterMaster.items[i].auto) quarterMaster.dateParse(quarterMaster.items[i]);
    //         if (quarterMaster.items[i].dates && quarterMaster.items[i].dates.length > 0) {
    //             ti.date = quarterMaster.items[i].dates[0].date;
    //         } else {
    //             ti.date = 9e15;
    //         }
    //         itemsToSort.push(ti);
    //     }
    //     itemsToSort.sort(quarterMaster.itemComparer);
    //     for (let i = 0; i < itemsToSort.length; i++) {
    //         quarterMaster.taskList.appendChild(quarterMaster.items[itemsToSort[i].id].span);
    //     }
    //     $("#calendarView").fullCalendar('refetchEvents');
    // }
    // //CONTEXT MENU OPTION FOR DATE
    // document.addEventListener("DOMContentLoaded", () => {
    //     let dateContextedTarget;
    //     contextMenuManager.registerContextMenu(`
    // <div>
    //     <li id="rectify">Convert to fixed date</li>
    // </div>
    // `, document.body, "input[data-role='date']", (e) => {
    //         dateContextedTarget = quarterMaster.items[e.target.parentElement.querySelector("[data-role='id']").innerText];
    //         //find currentTarget
    //     });
    //     document.getElementById("rectify").addEventListener("click", () => {
    //         dateContextedTarget.dateString = (new Date(dateContextedTarget.dates[0].date)).toLocaleString();
    //         document.getElementById("rectify").parentElement.style.display = "none";
    //     });
    // });
}

var dateParser = new _dateParser();;

function __itemlist_searchsort() {
    //search
    this.searchtemplate = htmlwrap(`<span style="display:block; width:100%;">
    <span></span>
    <button disabled>&#128269;</button>
    </span>`);
    this._searchtemplate = this.searchtemplate.querySelector("span");
    this.taskListBar.insertBefore(this.searchtemplate, this.template.nextElementSibling);

    //Managing the search
    let searchCapacitor = new capacitor(1000, 300, () => {
        //filter the items
        let searchboxes = Array.from(this.searchtemplate.querySelectorAll("input"));
        if (this.settings.entrySearch) {
            searchboxes = Array.from(this.template.querySelectorAll("input"));
        }
        let amSearching = false;
        for (let i = 0; i < searchboxes.length; i++) {
            if (searchboxes[i].value != "") {
                amSearching = true;
            }
        }
        if (amSearching) {
            this.searchtemplate.querySelector("button").innerHTML = "&#9003;";
            this.searchtemplate.querySelector("button").disabled = false;
        } else {
            this.searchtemplate.querySelector("button").innerHTML = "&#128269;";
            this.searchtemplate.querySelector("button").disabled = true;
            //dont return yet, we have to reset everything

        }

        let items = this.renderedItems;
        let toShowItems = [];
        items.forEach((v) => {
            let it = polymorph_core.items[v];
            if (amSearching) {
                let el = this.taskList.querySelector(`[data-id="${v}"]`);
                el.style.display = "none";
                for (let i = 0; i < searchboxes.length; i++) {
                    //only search by text for now
                    if (searchboxes[i].value) {
                        switch (this.settings.properties[searchboxes[i].dataset.role]) {
                            case "text":
                                if (it[searchboxes[i].dataset.role] && it[searchboxes[i].dataset.role].toLowerCase().indexOf(searchboxes[i].value.toLowerCase()) > -1) {
                                    toShowItems.push(el);
                                }
                                break;
                        }
                    }
                }
            } else {
                let el = this.taskList.querySelector(`[data-id="${v}"]`);
                toShowItems.push(el);
            }
        });
        toShowItems.forEach((v) => {
            let e = v;
            while (e != this.taskList) {
                e.style.display = "block";
                e = e.parentElement;
            }
        });
    });
    this.searchtemplate.addEventListener("keyup", searchCapacitor.submit);
    this.searchtemplate.querySelector("button").addEventListener("click", () => {
        let searchboxes = Array.from(this.searchtemplate.querySelectorAll("input"));
        searchboxes.forEach(v => { v.value = ""; });
        searchCapacitor.submit();
    })

    this.template.addEventListener("keyup", searchCapacitor.submit);


    ///sorting
    this.indexOf = (id) => {
        let childs = this.taskList.children;
        for (let i = 0; i < childs.length; i++) {
            if (childs[i].dataset.id == id) return i;
        }
        return -1;
    }

    this._sortItems = () => {
        this.isSorting = true; // alert focusout so that it doesnt display prettydate
        let sortingProp = this.settings.sortby;
        let sortType=this.settings.properties[sortingProp];
        if (!this.container.visible()) return;
        if (this.settings.implicitOrder) {
            sortingProp = this.settings.filter;
            sortType="number";
        }
        if (sortingProp) {
            //collect all items
            let itms = this.taskList.querySelectorAll(`[data-id]`);
            let its = [];
            for (let i = 0; i < itms.length; i++) {
                cpp = {
                    id: itms[i].dataset.id,
                    dt: polymorph_core.items[itms[i].dataset.id][sortingProp]
                };
                its.push(cpp);
            }
            //sort everything based on the filtered property.
            switch (sortType) {
                case "date":
                    let dateprop = sortingProp;
                    for (let i = 0; i < its.length; i++) {
                        //we are going to upgrade all dates that don't match protocol)
                        if (its[i].dt && its[i].dt.date) {
                            if (typeof its[i].dt.date == "number") {
                                polymorph_core.items[its[i].id][dateprop].date = [{
                                    date: polymorph_core.items[its[i].id][dateprop].date
                                }];
                            }
                            if (polymorph_core.items[its[i].id][dateprop].date[0]) {
                                its[i].date = polymorph_core.items[its[i].id][dateprop].date[0].date;
                                //check for repetition structure
                                if (its[i].dt.datestring.indexOf("(") != -1) {
                                    //evaluate the repetition
                                    its[i].date = dateParser.richExtractTime(its[i].dt.datestring)[0].date;
                                }
                            }
                            else its[i].date = Date.now() * 10000;
                        } else its[i].date = Date.now() * 10000;
                    }
                    its.sort((a, b) => {
                        return a.date - b.date;
                    });
                    break;
                case "text":
                    for (let i = 0; i < its.length; i++) {
                        if (!its[i].dt) its[i].dt = "";
                    }
                    its.sort((a, b) => {
                        return a.dt.toString().localeCompare(b.dt.toString());
                    });
                    break;
                default: // probably implicit ordering
                    its.sort((a, b) => {
                        return a.dt - b.dt;
                    });
            }
            //remember focused item
            let fi = this.taskList.querySelector(":focus");
            //also remember cursor position
            let cp;
            if (fi) cp = fi.selectionStart || 0;
            //rearrange items
            //dont do this if subitem
            for (let i = 0; i < its.length; i++) {
                let span = this.taskList.querySelector("[data-id='" + its[i].id + "']")
                if (span.parentElement == this.taskList) this.taskList.appendChild(span);
            }
            //return focused item
            if (fi) {
                fi.focus();
                try {
                    fi.selectionStart = cp;
                } catch (e) {
                }
            }
        }
        this.isSorting = false;
    }

    this.sortcap = new capacitor(500, 1000, this._sortItems);

    this.sortItems = () => {
        this.sortcap.submit();
    }

    this.setSearchTemplate = (htmlstring) => {
        if (this.settings.entrySearch) {
            this.searchtemplate.style.display = "none";
        } else {
            this.searchtemplate.style.display = "block";
        }
        this._searchtemplate.innerHTML = htmlstring;
        for (let i in this.settings.propertyWidths) {
            if (this._searchtemplate.querySelector(`[data-contains-role="${i}"]`)) {
                this._searchtemplate.querySelector(`[data-contains-role="${i}"]`).style.width = this.settings.propertyWidths[i];
            } else {
                delete this.settings.propertyWidths[i];
            }
        }
    }

};

if (!isPhone()) {
    polymorph_core.registerOperator("itemList", {
        section: "Standard",
        description: "Arrange your items in a list.",
        displayName: "List",
        imageurl: "assets/operators/list.png"
    }
        , function (container) {
            //initialisation
            let defaultSettings = {
                properties: {
                    title: "text"
                },
                propertyWidths: {},
                filter: polymorph_core.guid(),
                enableEntry: true,
                implicitOrder: true,
                linkProperty: "to",
                entrySearch: false,
                propOrder: []
            };
            polymorph_core.operatorTemplate.call(this, container, defaultSettings);
            this.rootdiv.remove(); //we dont want this
            //upgrade older ones
            if (this.settings.filterProp) {
                this.settings.filter = this.settings.filterProp;
                delete this.settings.filterProp;
            }
            if (Object.keys(this.settings.properties).length != this.settings.propOrder.length) this.settings.propOrder = Object.keys(this.settings.properties);
            this.taskListBar = document.createElement("div");
            this.taskListBar.style.cssText = "flex: 1 0 auto; display: flex;height:100%; flex-direction:column;";
            //top / insert 
            this.template = htmlwrap(`<span style="display:block; width:fit-content;">
    <span></span>
    <button>&gt;</button>
    <div class="subItemBox"></div>
    </span>`);
            this._template = this.template.querySelector("span");
            this.taskListBar.appendChild(this.template);



            this.taskListBar.appendChild(document.createElement("hr"));
            this.taskListBar.style.whiteSpace = "nowrap";
            this.taskList = document.createElement("div");
            this.taskList.style.cssText = "height:100%; overflow-y:auto; min-width:fit-content;";
            this.taskListBar.appendChild(this.taskList);
            container.div.appendChild(htmlwrap(
                `<style>
        input{
            background: inherit;
            color:inherit;
        }
        div>span{
            background:white;
        }
        span[data-id]{
            background:white;
        }
        div.subItemBox>span{
            margin-left: 10px;
        }
        .ffocus{
            border-top:solid 3px purple;
            border-bottom:solid 3px purple;
        }

        .resizable-input {
            /* make resizable */
            overflow-x: hidden;
            resize: horizontal;
            display: inline-block;
        
            /* no extra spaces */
            padding: 0;
            margin: 0;
            white-space: nowrap;
          
            /* default widths */
            width: 10em;
            min-width: 2em;
            max-width: 30em;
        }
        
        /* let <input> assume the size of the wrapper */
        .resizable-input > input {
            width: 100%;
            box-sizing: border-box;
            margin: 0;
        }
        
        </style>`
            ));

            container.div.appendChild(this.taskListBar);

            this.renderedItems = {};

            this.renderItem = (id) => {
                let it = polymorph_core.items[id];
                let currentItemSpan = this.renderedItems[id];
                //First check if we should show the item
                if (!this.itemRelevant(id)) {
                    //if existent, remove
                    if (currentItemSpan) currentItemSpan.remove();
                    delete this.renderedItems[id];
                    return false;
                }
                //Then check if the item already exists; if so then update it
                if (!currentItemSpan) {
                    currentItemSpan = this.template.cloneNode(true);
                    currentItemSpan.style.display = "block";
                    currentItemSpan.dataset.id = id;
                    currentItemSpan.children[1].innerText = "X";
                    this.taskList.appendChild(currentItemSpan);
                    this.renderedItems[id] = currentItemSpan;
                }
                for (let i = 0; i < this.settings.propOrder.length; i++) {
                    let p = this.settings.propOrder[i];
                    switch (this.settings.properties[p]) {
                        case "text":
                            currentItemSpan.children[0].children[i + 1].children[0].value = (it[p] != undefined) ? it[p] : "";
                            break;
                        case "number":
                            currentItemSpan.children[0].children[i + 1].children[1].value = (it[p] != undefined) ? it[p] : "";
                            break;
                        case "object":
                            currentItemSpan.querySelector("[data-role='" + p + "']").value = (it[p] != undefined) ? JSON.stringify(it[p]) : "";
                            break;
                        case "date":
                            if (!currentItemSpan.querySelector("[data-role='" + p + "']").matches(":focus")) {
                                if (it[p]) {
                                    if (!it[p].datestring && typeof it[p] == "string") {
                                        it[p] = {
                                            datestring: it[p]
                                        };
                                        if (this.datereparse) this.datereparse(id);
                                    }
                                    if (it[p].date && it[p].date.length && !it[p].prettyDateString) {
                                        it[p].prettyDateString = dateParser.humanReadableRelativeDate(it[p].date[0].date);
                                    }
                                    currentItemSpan.querySelector("[data-role='" + p + "']").value = it[p].prettyDateString || it[p].datestring;
                                } else {
                                    currentItemSpan.querySelector("[data-role='" + p + "']").value = "";

                                }
                            } else {
                                currentItemSpan.querySelector("[data-role='" + p + "']").value = it[p].datestring;
                            }
                            break;
                    }
                }
                if (it.style) {
                    currentItemSpan.style.background = it.style.background;
                    currentItemSpan.style.color = it.style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(currentItemSpan).background) || ['#ffffff'])[0]); //stuff error handling
                } else {
                    //enforce white, in case its parent is not white
                    currentItemSpan.style.background = "white";
                    currentItemSpan.style.color = "black";
                }
                //then check if i have a direct and unique parent that is in the current set.
                let uniqueParent = undefined;
                if (this.settings.linkProperty) {
                    let ri = Object.keys(this.renderedItems);
                    for (let _i = 0; _i < ri.length; _i++) {
                        let i = ri[_i];
                        if (polymorph_core.items[i][this.settings.linkProperty] && polymorph_core.items[i][this.settings.linkProperty][id] && id != i) {
                            if (uniqueParent == undefined) {
                                uniqueParent = i;
                            } else {
                                uniqueParent = undefined;
                                break;
                            }
                        }
                    }
                }
                if (uniqueParent != undefined && !(currentItemSpan.parentElement && currentItemSpan.parentElement.parentElement.dataset.id == uniqueParent)) {
                    try {
                        Array.from(this.renderedItems[uniqueParent].children).filter(i => i.classList.contains("subItemBox"))[0].appendChild(currentItemSpan);
                    } catch (error) {
                        if (error instanceof DOMException) {
                            //just an infinite loop, all chill
                        } else {
                            throw error;
                        }
                    }
                }
            }



            //Item creation
            //#region
            this.createItem = () => {
                let it = {};
                //clone the template and parse it
                //get data and register item
                for (let i of this.settings.propOrder) {
                    switch (this.settings.properties[i]) {
                        case "text":
                        case "number":
                            if (this.template.querySelector("[data-role='" + i + "']").value) it[i] = this.template.querySelector("[data-role='" + i + "']").value;
                            break;
                        case "object":
                            try {
                                it[i] = JSON.parse(this.template.querySelector("[data-role='" + i + "']").value);
                            } catch (e) {

                            }
                            break;
                        case "date":
                            if (this.template.querySelector("[data-role='" + i + "']").value) {
                                if (!it[i]) it[i] = {};
                                if (typeof it[i] == "string") it[i] = {
                                    datestring: it[i]
                                };
                                it[i].datestring = this.template.querySelector("[data-role='" + i + "']").value;
                            } else if (i == this.settings.filter) {
                                it[i] = {
                                    datestring: "now" // is this useful to have as a default? sure
                                };
                            }
                            break;
                    }
                    //clear the template
                    this.template.querySelector("[data-role='" + i + "']").value = "";
                }
                //ensure the filter property exists
                if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
                //if (this.settings.implicitOrder) { it[this.settings.filter] = polymorph_core.items[this.taskList.children[this.taskList.children.length].datset.id][this.settings.filter] + 1 };
                let id = polymorph_core.insertItem(it);

                if (this.shiftDown && this.settings.linkProperty) {
                    let fi = this.taskList.querySelector(".ffocus");
                    if (fi) {
                        //we are creating a subitem
                        let fiid = fi.dataset.id;
                        fi = polymorph_core.items[fiid];
                        if (!fi[this.settings.linkProperty]) fi[this.settings.linkProperty] = {};
                        fi[this.settings.linkProperty][id] = true;
                        container.fire("updateItem", {
                            id: fiid,
                            sender: this
                        });
                    }
                }
                container.fire("createItem", {
                    id: id,
                    sender: this
                });
                this.renderItem(id);
                this.datereparse(id);
                //also fire a focus event for the item, but don't actually focus (in case of multiple entry)
                container.fire("focusItem", {
                    id: id,
                    sender: this
                })
                return id;
            }

            container.on("createItem", (d) => {
                let it = polymorph_core.items[d.id];
                if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
                this.renderItem(d.id);
            })

            document.body.addEventListener("keydown", (e) => {
                //this is a global listener across operators, but will abstract away target; so don't use it for normal stuff.
                if (e.getModifierState("Shift")) {
                    this.shiftDown = true;
                    this.template.children[1].innerHTML = "&#x21a9;";
                }
            });
            container.div.addEventListener("keydown", (e) => {
                if (e.key == "Enter" && (e.getModifierState("Control") || e.getModifierState("Meta")) && e.target.dataset.role) {
                    let id = this.createItem();
                    this.renderedItems[id].querySelector(`[data-role='${e.target.dataset.role}']`).focus();
                }
            })

            document.body.addEventListener("keyup", (e) => {
                if (!e.getModifierState("Shift")) {
                    this.shiftDown = false;
                    this.template.children[1].innerHTML = "&gt;";
                }
            });
            this.template.querySelector("button").addEventListener("click", this.createItem);
            this.template.addEventListener("keydown", (e) => {
                if (e.key == "Enter") {
                    this.createItem();
                }
            });

            container.on("updateItem", (d) => {
                let id = d.id;
                if (!this.itemRelevant(id)) {
                    if (this.renderedItems[id]) {
                        this.renderedItems[id].remove();
                        delete this.renderedItems[id];
                    }
                    return;
                }
                if (d.sender == this) return;//dont rerender self
                this.settings.currentID = id;
                //sortcap may not have been declared yet
                if (d.sender != "GARBAGE_COLLECTOR" && this.sortcap) this.sortcap.submit();
                return this.renderItem(id);
            });

            //#endregion

            //auto
            this.intervalsToClear.push(setInterval(() => {
                if (!this.container.visible()) return; //if not shown then dont worryy
                //its every 10s, we can afford for it to be detailed

                //Create an auto list - formed by checking every date property of every tiem we care about

                for (let i in this.settings.properties) {
                    if (this.settings.properties[i] == 'date') {
                        let listofitems = this.taskList.querySelectorAll("[data-role='" + i + "']");
                        for (let i = 0; i < listofitems.length; i++) {
                            if (listofitems[i].value.indexOf("auto") != -1) {
                                if (this.datereparse) this.datereparse(listofitems[i].parentElement.parentElement.parentElement.dataset.id);
                            }
                        }
                    }
                }
                this.sortItems();
            }, 10000));

            //Item deletion
            //Handle item deletion
            this.taskList.addEventListener("click", (e) => {
                if (e.target.tagName.toLowerCase() == "button") {
                    container.fire("deleteItem", {
                        id: e.target.parentElement.dataset.id,
                        sender: this
                    });
                    delete polymorph_core.items[e.target.parentElement.dataset.id][this.settings.filter];
                    container.fire("deleteItem", {
                        id: e.target.parentElement.dataset.id,
                        sender: this
                    });
                }
            })

            container.on("deleteItem", (d) => {
                this.deleteItem(d.id);
                this.renderItem(d.id);
            })

            this.reRenderEverything = () => {
                this.taskList.innerHTML = "";
                for (let i in polymorph_core.items) {
                    this.renderItem(i, true);
                }
                //and again for links
                for (let i in polymorph_core.items) {
                    this.renderItem(i);
                }
            }

            let resizingRole = "";
            let resizingEl = undefined;
            //resizing
            container.div.addEventListener("mousedown", (e) => {
                for (let i = 0; i < e.path.length; i++) {
                    if (e.path[i].dataset && e.path[i].dataset.containsRole) {
                        resizingRole = e.path[i].dataset.containsRole;
                        resizingEl = e.path[i];
                    } else if (e.path[i] == this.taskList) break;
                }
            })
            container.div.addEventListener("mousemove", (e) => {
                if (e.buttons && resizingRole && resizingEl) {
                    let els = container.div.querySelectorAll(`[data-contains-role='${resizingRole}']`);
                    let desiredW = resizingEl.clientWidth;
                    for (let j = 0; j < els.length; j++)els[j].style.width = desiredW;
                    this.settings.propertyWidths[resizingRole] = desiredW;
                }
            })

            function clearOut() {
                resizingRole = undefined;
                resizingEl = undefined;
            }

            container.div.addEventListener("mouseup", clearOut);
            container.div.addEventListener("mouseleave", clearOut);


            __itemlist_searchsort.apply(this);

            this.updateSettings = () => {
                //Look at the settings and apply any relevant changes
                this.settings.propOrder = Object.keys(this.settings.properties);
                let htmlstring = `<span class="draghandle">&#10247;</span>`;
                for (i of this.settings.propOrder) {
                    switch (this.settings.properties[i]) {
                        case "text":
                        case "date":
                        case "object":
                            htmlstring += `<span class="resizable-input" data-contains-role="${i}"><input data-role='${i}' placeholder='${i}'></span>`;
                            break;
                        case "number":
                            htmlstring += "<span><span>" + i + ":</span><input data-role='" + i + "' type='number'></span>";
                            break;
                    }
                }
                this._template.innerHTML = htmlstring;
                this.setSearchTemplate(htmlstring);
                //resize stuff
                for (let i in this.settings.propertyWidths) {
                    if (this.settings.properties[i]) this._template.querySelector(`[data-contains-role='${i}']`).style.width = this.settings.propertyWidths[i];
                    else delete this.settings.propertyWidths[i];
                }
                //Recreate everything
                this.reRenderEverything();
                //hide or show based on entry enabled
                if (this.settings.enableEntry == false) {
                    this.template.style.display = "none";
                }
                this.container.fire("updateItem", { id: this.container.id })
            }

            //First time load
            this.updateSettings();
            //Saving and loading

            this.taskList.addEventListener("input", (e) => {
                currentItem = polymorph_core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
                switch (this.settings.properties[e.target.dataset.role]) {
                    case "text":
                    case "number":
                        currentItem[e.target.dataset.role] = e.target.value;
                        break;
                    case "object":
                        try {
                            currentItem[e.target.dataset.role] = JSON.parse(e.target.value);
                            e.target.style.background = "white";
                            e.target.style.color = "black";
                        } catch (e) {
                            e.target.style.background = "red";
                            e.target.style.color = "white";
                            return;
                        }
                        break;
                    case "date":
                        if (!currentItem[e.target.dataset.role]) currentItem[e.target.dataset.role] = {};
                        if (!currentItem[e.target.dataset.role].datestring) currentItem[e.target.dataset.role] = {
                            "datestring": ""
                        };
                        currentItem[e.target.dataset.role].datestring = e.target.value;
                        currentItem[e.target.dataset.role].date = dateParser.richExtractTime(currentItem[e.target.dataset.role].datestring);
                        break;
                }

                //match all the item data and currentItem data
                container.fire("updateItem", {
                    id: e.target.parentElement.parentElement.parentElement.dataset.id,
                    sender: this
                });
            })

            this.taskList.addEventListener("focusout", (e) => {
                if (!this.isSorting) {
                    currentItem = polymorph_core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
                    switch (this.settings.properties[e.target.dataset.role]) {
                        case "date":
                            if (currentItem[e.target.dataset.role] && currentItem[e.target.dataset.role].date) {
                                currentItem[e.target.dataset.role].prettyDateString = dateParser.humanReadableRelativeDate(currentItem[e.target.dataset.role].date[0].date);
                                e.target.value = currentItem[e.target.dataset.role].prettyDateString;
                            }
                            break;
                    }
                }
            })


            this.taskList.addEventListener("focusin", (e) => {
                currentItem = polymorph_core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
                switch (this.settings.properties[e.target.dataset.role]) {
                    case "date":
                        if (currentItem[e.target.dataset.role]) {
                            e.target.value = currentItem[e.target.dataset.role].datestring;
                        }
                        break;
                }
            })
            this.taskList.addEventListener("keyup", (e) => {
                if (e.target.tagName.toLowerCase() == "input" && this.settings.properties[e.target.dataset.role] == 'date' && e.key == "Enter") {
                    this.datereparse(e.target.parentElement.parentElement.parentElement.dataset.id);
                    this.renderItem(e.target.parentElement.parentElement.parentElement.dataset.id);
                    container.fire("dateUpdate")
                }
            })

            this.focusItem = (id) => {
                //Highlight in purple
                let _target = this.renderedItems[id];
                if (_target) {
                    let spans = Object.values(this.renderedItems);
                    for (let i = 0; i < spans.length; i++) {
                        spans[i].classList.remove("ffocus");
                    }
                    _target.classList.add("ffocus");
                    let bcr = _target.parentElement.getBoundingClientRect();
                    let tcr = _target.getBoundingClientRect();
                    if (tcr.y < bcr.y || tcr.y + tcr.height > bcr.y + bcr.height) _target.scrollIntoView({
                        behavior: "smooth"
                    });
                }
            }

            this.taskList.addEventListener("focusin", (e) => {
                if (e.target.matches("input")) {
                    container.fire("focusItem", {
                        id: e.target.parentElement.parentElement.parentElement.dataset.id,
                        sender: this
                    });
                    this.focusItem(e.target.parentElement.parentElement.parentElement.dataset.id);
                }
            })
            container.on("focusItem", (data) => {
                if (this.settings.operationMode == "focus") {
                    if (data.sender.container.container.uuid == this.settings.focusOperatorID) {
                        this.settings.filter = data.id;
                    }
                }
                this.focusItem(data.id);
            });


            this.datereparse = (it) => {
                let dateprop = "";
                for (let i in this.settings.properties) {
                    if (this.settings.properties[i] == 'date') {
                        dateprop = i;
                        //specifically reparse the date on it;
                        if (it) {
                            if (polymorph_core.items[it][dateprop]) {
                                polymorph_core.items[it][dateprop].date = dateParser.richExtractTime(polymorph_core.items[it][dateprop].datestring);
                                if (!polymorph_core.items[it][dateprop].date.length) polymorph_core.items[it][dateprop].date = undefined;
                                //ds=this.taskList.querySelector('span[data-id="'+it+'"] input[data-role="'+dateprop+'"]').value;
                            }
                        }
                        // get a list of Items
                        let its = [];
                        Object.values(this.renderedItems).forEach(e => {
                            let itm = {
                                id: e.dataset.id
                            };
                            if (!polymorph_core.items[itm.id]) {
                                //nerf the e that spawned this, then break
                                //idek how this happens :(
                                e.remove();
                                return;
                            }
                            //we are going to upgrade all dates that don't match protocol)
                            if (polymorph_core.items[itm.id][dateprop] && polymorph_core.items[itm.id][dateprop].date) {
                                if (typeof polymorph_core.items[itm.id][dateprop].date == "number") {
                                    polymorph_core.items[itm.id][dateprop].date = [{
                                        date: polymorph_core.items[itm.id][dateprop].date
                                    }];
                                }
                                if (polymorph_core.items[itm.id][dateprop].date[0]) itm.date = polymorph_core.items[itm.id][dateprop].date[0].date;
                                else itm.date = Date.now() * 10000;
                            } else itm.date = Date.now() * 10000;
                            its.push(itm);
                        });
                    }
                }
                //sort everything
                this.sortItems();
                container.fire("dateUpdate");
            }
            this.datereparse();

            this.container.registerContextMenu(this.taskList, (el) => {
                let id = el;
                while (!id.dataset.id && id != this.taskList) {
                    id = id.parentElement;
                }
                if (id.dataset.id) {
                    let obj = { id: id.dataset.id };
                    if (el.dataset.role) obj.role = el.dataset.role;
                    let ls = [];
                    if (this.settings.properties[el.dataset.role] == "date") ls.push("Convert to fixed date::operator.toFixedDate")
                    return { e: obj, ls: ls };
                }
            });

            this.ctxCommands = {
                "toFixedDate": (e, ctr) => {
                    let id = e.id;
                    let contextedProp = e.role;
                    polymorph_core.items[id][contextedProp].datestring = new Date(polymorph_core.items[id][contextedProp].date[0].date).toLocaleString() + ">" + new Date(polymorph_core.items[id][contextedProp].date[0].endDate).toLocaleString();
                    this.datereparse(id);
                }
            }



            //settings dialog
            //#region
            //Handle the settings dialog click!
            this.dialogDiv = document.createElement("div");
            this.dialogDiv.innerHTML = `
    <p>Columns to show</p>
    <div class="proplist"></div>
    <p>You can pick more from the list below, or add a new property! </p>
    <span>Choose existing property:</span><select class="_prop">
    </select><br>
    <input class="adpt" placeholder="Or type a new property..."><br>
    <button class="adbt">Add</button>
    <p>Options</p>
    <p><input type="checkbox"><span>Sort by date</span></p>
    <p><input type="checkbox"><span>Delete items (instead of hiding)</span></p>
    <h1>Role</h1>
    <select data-role="operationMode">
    <option value="static">Display static list</option>
    <option value="focus">Display focused list</option>
    <option value="iface">Link to another container...</option>
    </select>
    <p>View items with the following property:</p> 
    <input data-role='filter' placeholder = 'Property name'></input>
    <p>container to focus on:</p> 
    <input data-role="focusOperatorID" placeholder="container UID (use the button)">
    <button class="targeter">Select container</button>
    `;
            let options = {
                entryok: new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "enableEntry",
                    label: "Enable adding new items"
                }),
                implicitOrder: new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "implicitOrder",
                    label: "Implicit ordering (Enables drag and drop, disables existing ordering)",
                    afterInput: () => {
                        this.settings.sortby = undefined;
                        Array.from(this.proplist.querySelectorAll("input[type='radio']")).forEach(i => i.checked = false);
                    }
                }),
                linkProperty: new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "text",
                    object: this.settings,
                    property: "linkProperty",
                    label: "Property for links (leave blank to ignore links)"
                }),
                entrySearch: new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "entrySearch",
                    label: "Use Entry as Search"
                })
            }
            let d = this.dialogDiv;
            this.showDialog = () => {
                // update your dialog elements with your settings
                //Fill in dialog information
                //set all property settings.
                for (i in this.settings) {
                    let it = this.dialogDiv.querySelector("[data-role='" + i + "']");
                    if (it) it.value = this.settings[i];
                }
                //Get all available properties, by looping through all elements (?)
                this.opList.innerHTML = "";
                let props = {};
                for (let i in polymorph_core.items) {
                    for (let j in polymorph_core.items[i]) {
                        if (typeof polymorph_core.items[i][j] != "function") props[j] = true;
                    }
                }
                for (let prop in props) {
                    if (!this.settings.properties[prop]) {
                        let opt = document.createElement("option");
                        opt.innerText = prop;
                        opt.value = prop;
                        this.opList.appendChild(opt);
                    }
                }
                //enable adding new items checkbox
                for (i in options) {
                    options[i].load();
                }
                // Now fill in the ones which we're currently monitoring.
                this.proplist.innerHTML = "";
                for (let prop in this.settings.properties) {
                    let pspan = document.createElement("p");
                    pspan.innerHTML = `<span>` + prop + `</span>
            <select data-role=` + prop + `>
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="object">Object</option>
                <option value="number">Number</option>
            </select><label>Sort <input type="radio" name="sortie" data-ssrole=${prop}></label>` + `<button data-krole="` + prop + `">X</button>`
                    pspan.querySelector("select").value = this.settings.properties[prop];
                    pspan.querySelector("input[type='radio']").checked = (this.settings.sortby == prop);
                    this.proplist.appendChild(pspan);
                }
            }

            //when clicking a sort radio button, turn off implict ordering
            this.proplist = this.dialogDiv.querySelector(".proplist");
            this.proplist.addEventListener("input", (e) => {
                if (e.target.matches("[name='sortie']")) {
                    this.settings.implicitOrder = false;
                    options.implicitOrder.load();
                }
            })

            let checkImplicitOrdering = () => {
                if (this.settings.implicitOrder) {
                    Object.values(this.renderedItems).map((i, ii) => i[this.settings.filter] = ii);
                }
            }

            this.dialogUpdateSettings = () => {
                // pull settings and update when your dialog is closed.
                this.updateSettings();
                this.sortItems();
                checkImplicitOrdering();
                container.fire("updateItem", { id: this.container.id });
            }
            checkImplicitOrdering();
            //adding new buttons
            d.querySelector(".adbt").addEventListener("click",
                () => {
                    if (d.querySelector(".adpt").value != "") {
                        this.settings.properties[d.querySelector(".adpt").value] = 'text';
                        d.querySelector(".adpt").value = "";
                    } else {
                        this.settings.properties[d.querySelector("select._prop").value] = 'text';
                    }
                    this.showDialog();
                }
            )

            //the filter property.
            d.querySelector("input[data-role='filter']").addEventListener("input", (e) => {
                this.settings.filter = e.target.value;
            })

            //Handle select's in proplist
            this.proplist.addEventListener('change', (e) => {
                if (e.target.matches("select")) this.settings.properties[e.target.dataset.role] = e.target.value;
            })
            this.proplist.addEventListener('click', (e) => {
                if (e.target.matches("[data-krole]")) {
                    delete this.settings.properties[e.target.dataset.krole];
                    this.showDialog();
                }
            })
            this.proplist.addEventListener("input", (e) => {
                if (e.target.matches("input[type='radio']")) {
                    this.settings.sortby = e.target.dataset.ssrole;
                }
            })

            this.opList = this.dialogDiv.querySelector("select._prop");
            //retrieve stuff
            //sort by date checkbox
            //Style tags button
            //#endregion

            // alt click and drag for drag and drop
            let dragDropID = undefined;
            container.div.addEventListener("mousedown", (e) => {
                //figure out which element this is
                dragDropID = undefined;
                for (let i = 0; i < e.path.length; i++) {
                    if (!e.path[i].dataset) break; //shadow root
                    if (e.path[i].dataset.id) {
                        dragDropID = e.path[i].dataset.id;
                        break;
                    }
                }
            })

            // normal click and drag on element to drag and drop
            container.div.addEventListener("mousedown", (e) => {
                //figure out which element this is
                if (e.target.matches(".dragHandle")) {
                    let liRow = e.target.parentElement.parentElement;
                    this.relrect = e.target.getRootNode().host.getBoundingClientRect();
                    liRow.style.position = "absolute";
                    liRow.style.left = e.clientX - this.relrect.x;
                    liRow.style.top = e.clientY - this.relrect.y;
                    this.worryRow = liRow;
                    //temporarily disable user select on everything else
                    Array.from(e.target.getRootNode().children).forEach(i => i.style.userSelect = "none");
                }
            })

            let lastBlued;
            container.div.addEventListener("mousemove", (e) => {
                //if alt, fire UDD
                /*
                //this is a bit fiddly and i dont like it
                if (e.altKey && dragDropID) {
                    //fire UDD
                    polymorph_core.initiateDragDrop(dragDropID, { x: e.clientX, y: e.clientY, sender: container.id });
                    //prevent spamming
                    dragDropID = undefined;
                }
                */
                if (this.worryRow) {
                    for (let i = 0; i < e.path.length - 2; i++) {
                        try {
                            if (e.path[i].matches("[data-id]")) {
                                if (e.path[i] == this.worryRow) break;
                                if (lastBlued) lastBlued.style.borderTop = "";
                                lastBlued = e.path[i];
                                lastBlued.style.borderTop = "3px solid blue";
                                break;
                            }
                        } catch (err) {
                            if (lastBlued) lastBlued.style.borderTop = "";
                            lastBlued = undefined;
                            break;
                        }
                    }
                    this.worryRow.style.left = e.clientX - this.relrect.x;
                    this.worryRow.style.top = e.clientY - this.relrect.y;
                }
            })
            let ddmouseExitHandler = (e) => {
                if (this.worryRow) {
                    //rearrange stuff
                    if (lastBlued) {
                        lastBlued.style.borderTop = "";
                        if (lastBlued.previousElementSibling) polymorph_core.items[this.worryRow.dataset.id][this.settings.filter] = (polymorph_core.items[lastBlued.previousElementSibling.dataset.id][this.settings.filter] + polymorph_core.items[lastBlued.dataset.id][this.settings.filter]) / 2;
                        else polymorph_core.items[this.worryRow.dataset.id][this.settings.filter] = polymorph_core.items[lastBlued.dataset.id][this.settings.filter] - 1;
                        lastBlued.parentElement.insertBefore(this.worryRow, lastBlued);
                        lastBlued = undefined;
                    }
                    //check if implict ordering
                    this.worryRow.style.position = "static";
                    Array.from(e.target.getRootNode().children).forEach(i => i.style.userSelect = "unset");
                    delete this.worryRow;
                }
            }
            container.div.addEventListener("mouseup", ddmouseExitHandler);
            container.div.addEventListener("mouseleave", ddmouseExitHandler);
        });
};

if (isPhone()) {
    polymorph_core.registerOperator("itemList", {
        section: "Standard",
        description: "View a list of items.",
        displayName: "List",
        imageurl: "assets/operators/list.png"
    }
        , function (container) {
            //initialisation
            let defaultSettings = {
                properties: {
                    title: "text"
                },
                propertyWidths: {},
                filter: polymorph_core.guid(),
                enableEntry: true,
                implicitOrder: true,
                linkProperty: "to",
                entrySearch: false,
                propOrder: [],
                phoneProperties: {
                    title: "text",
                    description: "text"
                },
                phonePrimeProperty: "title" // properties for phone
            };
            polymorph_core.operatorTemplate.call(this, container, defaultSettings);
            //copy default settings properties to phone
            Object.assign(this.settings.phoneProperties, this.settings.properties);
            // render items as blobs

            //Add content-independent HTML here.
            this.rootdiv.innerHTML = `
            <style>
                *{
                    color:white;
                }

                .frontDiv{
                    display: flex;
                    flex-wrap:wrap;
                }
                .frontDiv p{
                    margin: 10px;
                    background: purple;
                    padding: 10px;
                }
                
                .frontDiv .plusButton{
                    background: purple;
                    color:white;
                    width: 50px;
                    height: 50px;
                    position:absolute;
                    bottom: 25px;
                    right: 25px;
                    line-height:50px;
                    text-align:center;
                    font-size: 2em;
                    border-radius:50%;
                }
                .backDiv{
                    position:relative;
                    padding: 10px;
                }
                .backDiv .doneButton{
                    text-align:center;
                    width: 100%;
                    padding: 20px 0;
                    background: purple;
                    position:sticky;
                    top:0;
                }
            </style>
            <div class="frontDiv">
                <div class="plusButton"> + </div>
                <div class="itemsContainer">
                    <!--
                    <p data-id="item_id">some property</p>
                    -->
                </div>
            </div>
            <div class="backDiv" style="display:none">
            <div class="donebutton">Done</div>
                <!--
                    <div data-prop="property">
                        <p>property_title</p>
                        <input></input> or <textarea></textarea>
                    </div>
                -->
            </div>
            `;
            let frontDiv = this.rootdiv.querySelector(".frontDiv");
            let backDiv = this.rootdiv.querySelector(".backDiv");
            this.rootdiv.querySelector(".donebutton").addEventListener("click", () => {
                frontDiv.style.display = "flex";
                backDiv.style.display = "none";
            });
            //this is called when an item is updated (e.g. by another container)
            container.on("updateItem", (d) => {
                let id = d.id;
                if (this.itemRelevant(id)) {
                    let obj = frontDiv.querySelector(`[data-id='${id}']`);
                    if (!obj) {
                        obj = htmlwrap(`<p data-id="${id}"></p>`);
                        frontDiv.appendChild(obj);
                    }
                    obj.innerText = polymorph_core.items[id][this.settings.phonePrimeProperty];
                    //render the item, if we care about it.
                }
            });
            let editingID=undefined;
            let showBackDiv = (id) => {
                editingID=id;
                frontDiv.style.display = "none";
                let props = Array.from(backDiv.querySelectorAll("[data-prop]")).reduce((p, i) => { p[i.dataset.prop] = { div: i }; return p }, {});
                for (let i in this.settings.phoneProperties) {
                    if (props[i]) {
                        props[i].keep = true;
                    } else {
                        props[i] = {
                            div: htmlwrap(`<p>${i}</p><p contenteditable></p>`),
                            keep: true
                        }
                        props[i].div.dataset.prop = i;
                        backDiv.appendChild(props[i].div);
                    }
                    props[i].div.children[1].innerText = polymorph_core.items[id][i] || "";
                }
                for (let i in props) {
                    if (!props[i].keep) {
                        props[i].div.remove();
                    }
                }
                backDiv.style.display = "block";
            }

            backDiv.addEventListener("input", (e) => {
                polymorph_core.items[editingID][e.target.parentElement.dataset.prop]=e.target.innerText;
                container.fire("updateItem", { id: editingID });
            })

            frontDiv.querySelector(".plusButton").addEventListener("click", () => {
                //pseudo create a new item
                let pseudoItem = {};
                pseudoItem[this.settings.filter] = true;
                let show_id = polymorph_core.insertItem(pseudoItem);
                showBackDiv(show_id);
                container.fire("updateItem", { id: show_id });
            })

            frontDiv.addEventListener("click", (e) => {
                if (e.target.dataset.id) {
                    showBackDiv(e.target.dataset.id);
                }
            })

            let stillHoldingTimer = 0;
            frontDiv.addEventListener("touchstart", (e) => {
                if (e.target.dataset.id) {
                    let targ = e.target;
                    stillHoldingTimer = setTimeout(() => {
                        if (confirm(`Delete item ${targ.dataset.id}?`)) {
                            delete polymorph_core.items[targ.dataset.id][this.settings.filter];
                            targ.remove();
                            container.fire("updateItem", { id: targ.dataset.id });
                        }
                    },1000);
                }
            })

            frontDiv.addEventListener("touchend", (e) => {
                clearTimeout(stillHoldingTimer);
            })

            this.refresh = function () {
                // This is called when the parent container is resized.
            }



            //Handle the settings dialog click!
            this.dialogDiv = document.createElement("div");
            this.dialogDiv.innerHTML = ``;

            let options = {
                filter: new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "text",
                    object: this.settings,
                    property: "filter",
                    label: "Filter for items to be shown"
                })
            }
            this.showDialog = () => {
                //enable adding new items checkbox
                for (i in options) {
                    options[i].load();
                }
            }

            this.dialogUpdateSettings = function () {
                // This is called when your dialog is closed. Use it to update your container!
            }

        });
};

polymorph_core.registerOperator("descbox", {
    description: "Space for free text entry to a single item; or display detail on a selected item.",
    displayName: "Textbox",
    imageurl: "assets/operators/descbox.png",
    section: "Standard",
    single_store: true // does it only store one thing? If so, drag and drop will not delete from containers storing multiple things.
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        property: "description",
        auxProperty: "title",
        showTags: false
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add div HTML here
    this.rootdiv.innerHTML = `<p class="auxProp" style="margin: 1px;"></p><p class="parsedTags" style="margin: 1px;"></p><p style="margin: 1px;"></p><textarea style="width:100%; flex: 1 0 auto; resize:none;"></textarea>`;
    this.rootdiv.style.cssText = "height:100%; display:flex; flex-direction: column;"
    this.textarea = this.rootdiv.querySelector("textarea");
    this.currentIDNode = this.rootdiv.querySelector(".auxProp");
    this.parsedTagsNode = this.rootdiv.querySelector(".parsedTags");

    container.div.appendChild(this.rootdiv);

    let parseTags = (id) => {
        let text = polymorph_core.items[id][this.settings.property];
        let regexes = [/@(tag)=([\w_]+)/g, /@(from)=([\w_]+)/g, /@(to)=([\w_])+/g];
        //undo older tags
        if (polymorph_core.items[id]["_tags_" + this.settings.property] && polymorph_core.items[id]["_tags_" + this.settings.property]['tag']) {
            polymorph_core.items[id]["_tags_" + this.settings.property]['tag'].forEach(i => {
                delete polymorph_core.items[id]["_tag_" + i];
            })

        }
        let tagObj = polymorph_core.items[id]["_tags_" + this.settings.property] = {
        };

        polymorph_core.items[id]["_displayTags_" + this.settings.property] = "";

        regexes.forEach((i) => {
            while (matches = i.exec(text)) {
                if (!tagObj[matches[1]]) tagObj[matches[1]] = [];
                tagObj[matches[1]].push(matches[2]);
                switch (matches[1]) {
                    case "tag":
                        if (!polymorph_core.items["_tag_" + matches[2]]) polymorph_core.items["_tag_" + matches[2]] = {};
                        polymorph_core.items["_tag_" + matches[2]][id] = true;
                        polymorph_core.items[id]["_tag_" + matches[2]] = true;
                        break;
                    case "from":
                        if (!polymorph_core.items[matches[2]].to) {
                            polymorph_core.items[matches[2]].to = {};
                        }
                        polymorph_core.items[matches[2]].to[id] = true;
                        break;
                    case "to":
                        if (!polymorph_core.items[id].to) polymorph_core.items[id].to = {};
                        polymorph_core.items[id].to[matches[2]] = true;
                        break;
                }
                polymorph_core.items[id]["_displayTags_" + this.settings.property] += matches[0] + "  ";
            }
        });
    }

    this.updateMeta = (id) => {
        if (id) {
            if (this.settings.auxProperty == "id") {
                this.currentIDNode.style.display = "block";
                this.currentIDNode.innerText = id;
            } else if (this.settings.auxProperty) {
                this.currentIDNode.style.display = "block";
                this.currentIDNode.innerText = polymorph_core.items[id][this.settings.auxProperty];
            } else {
                this.currentIDNode.style.display = "none";
            }
            if (this.settings.showTags) {
                parseTags(id);
                this.parsedTagsNode.innerHTML = polymorph_core.items[id]["_displayTags_" + this.settings.property];
                this.parsedTagsNode.style.display = "block";
            } else {
                this.parsedTagsNode.style.display = "none";
            }
        }
    }

    //Handle item updates
    this.updateItem = (id) => {
        this.updateMeta(id);

        //if focused, ignore
        if (id == this.settings.currentID && id && polymorph_core.items[id]) {
            if (this.textarea.matches(":focus")) {
                setTimeout(() => this.updateItem(id), 500);
            } else {
                if (this.changed) {
                    //someone else just called this so i'll have to save my modifications discreetly.
                    polymorph_core.items[id][this.settings.property] = this.textarea.value;
                } else {
                    if (polymorph_core.items[id] && polymorph_core.items[id][this.settings.property]) this.textarea.value = polymorph_core.items[id][this.settings.property];
                    else this.textarea.value = "";
                }
                this.textarea.disabled = false;
                if (polymorph_core.items[id].style) {
                    this.textarea.style.background = polymorph_core.items[id].style.background;
                    this.textarea.style.color = polymorph_core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(this.textarea).background) || ['#ffffff'])[0]); //stuff error handling; 
                } else {
                    this.textarea.style.background = "";
                    this.textarea.style.color = "";
                }
            }
        } else {
            if (!this.settings.currentID) {
                this.textarea.disabled = true;
                this.textarea.value = "Select an item to view its description.";
            }
        }
    }

    container.on("updateItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        if (sender == this) return;
        if (id == this.settings.currentID) {
            this.updateItem(id);
            return true;
        }
    });

    //First time load

    this.updateItem(this.settings.currentID);

    this.updateSettings = () => {
        if (!this.settings.currentID) {
            this.settings.currentID = polymorph_core.insertItem({});
            container.fire("updateItem", {
                sender: this,
                id: this.settings.currentID
            });
        }
        if (!polymorph_core.items[this.settings.currentID]) {
            polymorph_core.items[this.settings.currentID] = {};
            container.fire("updateItem", {
                sender: this,
                id: this.settings.currentID
            });
        }
        if (!polymorph_core.items[this.settings.currentID][this.settings.property]) {
            polymorph_core.items[this.settings.currentID][this.settings.property] = "";
            container.fire("updateItem", {
                sender: this,
                id: this.settings.currentID
            });
        }
        this.textarea.placeholder = this.settings.placeholder || "";
        this.updateItem(this.settings.currentID);
    }

    this.updateSettings();
    this.updateItem(this.settings.currentID);

    let upc = new capacitor(100, 40, (id, data) => {
        if (id && polymorph_core.items[id] && this.changed) {
            polymorph_core.items[id][this.settings.property] = data;
            this.updateMeta(id);
            container.fire("updateItem", {
                id: id,
                sender: this
            });
            this.changed = false;
        }
    }, {
        presubmit: () => {
            this.changed = true;
        }
    })
    //Register changes with polymorph_core
    this.somethingwaschanged = (e) => {
        //Check ctrl-S so that we dont save then
        if (e.key == "Control" || e.key == "Meta" || ((e.ctrlKey || e.metaKey) && e.key == "s")) return;
        upc.submit(this.settings.currentID, this.textarea.value);
    }

    this.textarea.addEventListener("blur", () => { upc.forceSend() });

    this.textarea.addEventListener("input", this.somethingwaschanged);
    this.textarea.addEventListener("keyup", this.somethingwaschanged);
    document.addEventListener('keydown', (e) => {
        if (this.textarea == this.rootdiv.getRootNode().activeElement) {
            var keycode1 = (e.keyCode ? e.keyCode : e.which);
            if (keycode1 == 0 || keycode1 == 9) {
                e.preventDefault();
                e.stopPropagation();
                document.execCommand('insertText', false, "    ");
            }
        }
    })

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    let options = {
        currentItem: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "currentItem",
            label: "Item to display:"
        }),
        property: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "property",
            label: "Property of item to display:"
        }),
        auxProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "auxProperty",
            label: "Auxillary property to display:"
        }),
        /*showWordCount: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showWordCount",
            label: "Show wordcount?"
        }),*/
        showTags: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showTags",
            label: "Show and parse tags?"
        })
    };
    this.showDialog = () => {
        // update your dialog elements with your settings
        //fill out some details
        for (i in options) {
            options[i].load();
        }
    }
    this.dialogUpdateSettings = this.updateSettings;
    this.dialogDiv.addEventListener("input", (e) => {
        if (e.target.dataset.role) {
            this.settings[e.target.dataset.role] = e.target.value;
        }
    })

    //polymorph_core will call this when an object is focused on from somewhere
    container.on("focusItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        let switchTo = (id) => {
            upc.forceSend();
            this.settings.currentID = id;
            this.updateItem(id);
            container.fire("updateItem", { id: this.container.id });
        }
        switchTo(id);
    });

    this.itemRelevant = (id) => {
        if (id == this.settings.currentID) return true;
    }

    container.on("createItem", (d) => {
        if (d.sender == "dragdrop") {
            container._fire("focusItem", d);
        }
    })
});;

//V4.1: Now with how to use
//V4.0: now with repetition and calendar item generator

/*HOW TO USE:

let d = new _dateParser();
Date dt = d.extractTime(string data,Date reference);


-- todo lol

*/

function _intervalParser() {
    this.regexes = [
        {
            name: "hh?mmss",
            regex: /(?:(\d+)\:)?(\d+):(\d+)/g,
            operate: function (regres, data) {
                if (regres[1]) {
                    data.len = 60 * 60 * 1000 * Number(regres[1]);
                }
                data.len += 60 * 1000 * Number(regres[2]);
                data.len += 1000 * Number(regres[3]);
            }
        },
        {
            name: "sOnly",
            regex: /(\d+)s/g,
            operate: function (regres, data) {
                data.len += 1000 * Number(regres[1]);
            }
        },
        {
            name: "ms",
            regex: /^\s*(\d+)\s*$/g,
            operate: function (regres, data) {
                data.len += Number(regres[1]);
            }
        },
    ];
    this.reverse = false;
    this.extractTime = (str) => {
        this.tempdata = {
            len: 0
        };
        let seen = false;
        let regres;
        for (let z = 0; z < this.regexes.length; z++) {
            this.regexes[z].regex.lastIndex = 0; //force reset regexes
            while ((regres = this.regexes[z].regex.exec(str)) != null) {
                this.regexes[z].operate(regres, this.tempdata);
                seen = true;
            }
        }
        if (seen) return { string: str, t: this.tempdata.len };
        else return undefined;
    }
}

var intervalParser = new _intervalParser();;

polymorph_core.registerOperator("terminal", {
    displayName: "Terminal",
    description: "A command-line way of interacting with polymorph. Designed to facilitate integrations with other clients!",
    section: "Advanced"
}, function (container) {
    let defaultSettings = {
        opmode: "console",
    };

    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <textarea style="flex: 1 0 auto"></textarea>
    <div>
    <input type="text"></input><button>Send</button>
    </div>
    `;
    this.rootdiv.style.cssText = `display: flex;
    flex-direction: column;
    height: 100%;`;
    function getPath(id) {
        let cit = id;
        let pathstr;
        if (cit) {
            pathstr = cit;
            while (polymorph_core.items[cit].links && polymorph_core.items[cit].links.parent) {
                cit = polymorph_core.items[cit].links.parent
                pathstr = cit + ">" + pathstr;
            }
        } else pathstr = "";
        pathstr = pathstr + ">";
    }
    function getParentPath(id) {
        if (polymorph_core.items[id].links && polymorph_core.items[id].links.parent) {
            return getPath(polymorph_core.items[id].links.parent);
        }
        else return ">";
    }
    let operatorRegexes = {
        echo: {
            help: "Type echo $1 to echo something.",
            regex: /^echo (.+)$/ig,
            operate: function (regres, state) {
                state.output(regres[1]);
            }
        },
        wsecho: {
            regex: /^wsecho (.+)$/ig,
            help: "Send data over the websocket to a command interpreter.",
            operate: function (regres, state) {
                state.outputToWS(regres[1]);
            }
        },
        intlecho: {
            regex: /^intlecho (.+)$/ig,
            help: "Send information to the Polymorph interpreter, when on websocket passthrough mode.",
            operate: function (regres, state) {
                state.process(regres[1]);
            }
        },
        userEcho: {
            help: "Type userecho $1 to echo specifically to the user.",
            regex: /^userecho (.+)$/ig,
            operate: function (regres, state) {
                state.outputToUser(regres[1]);
            }
        },
        co: {
            regex: /^co(?: (.+))*$/ig,
            help: "This command can be thought of an equivalent to cd, for operators. Type co $1 to focus on an container, or simply co to output the current container.",
            operate: function (regres, state) {
                if (regres[1]) {
                    state.container = polymorph_core.getOperator(regres[1]);
                }
                if (state.container.uuid) {
                    state.output(JSON.stringify(state.container.uuid));
                } else {
                    state.output("No container selected.");
                }

            }
        },
        lo: {
            regex: /^lo$/ig,
            help: "This command can be thought of as an equivalent to ls, for operators. Type lo to list all available operators and their types.",
            operate: function (regres, state) {
                state.output(JSON.stringify(polymorph_core.listOperators()));
            }
        },
        lai: {
            regex: /^lai$/ig,
            help: "This command can be thought of as an equivalent to ls, for items. Type lo to list all available items, in full detail.",
            operate: function (regres, state) {
                state.output(JSON.stringify(polymorph_core.getItems()));
            }
        },
        mki: {
            regex: /^mki (.+)$/ig,
            help: "This command can be thought of as an equivalent to mkdir, for items. Type mkitm $1 $2 to make an item called $1 in the current path, with title $2.",
            operate: function (regres, state) {
                let it = {};
                it.links = {};
                if (state.state.path) it.links.parent = state.state.path;
                it.title = regres[1];
                let safetitle = it.title.replace(/ /ig, "_");
                polymorph_core.items[safetitle] = it;
                state.output(safetitle + ":" + JSON.stringify(it));
            }
        },
        li: {
            regex: /^li$/ig,
            help: "This command can be thought of as an equivalent to ls, for items in the current path. Type lo to list all available items in the current path.",
            operate: function (regres, state) {
                if (state.state.path) {
                    for (let i in polymorph_core.items) {
                        if (polymorph_core.items[i].links && polymorph_core.items[i].links.parent == state.state.path) {
                            state.output(polymorph_core.items[i]);
                        }
                    }
                } else {
                    state.output(JSON.stringify(polymorph_core.getItems()));
                }
            }
        },
        ci: {
            regex: /^ci(?: (.+))*$/ig,
            help: "This command can be thought of as an equivalent to cd, for the current path. Type ci by itself to list the current path; or type cd $1 to navigate to $1.",
            operate: function (regres, state) {
                if (regres[1]) {
                    if (polymorph_core.items[regres[1]]) {
                        state.state.path = regres[1];
                    }
                    state.output("Switched to " + regres[1]);
                } else {
                    state.output(getPath(state.state.path));
                }
            }
        },
        ni: {
            regex: /^ni (.+?)(?: \"(.+?)\")?(?: \"(.+?)\")?$/ig,
            help: "This command can be thought of as an equivalent to nano, for items. Type ni $1 to display item i, or ni $1 \"$2\" to set the title of $1 to $2, and ni $1 \"$2\" \"$3\" to set property $2 on item $1 to $3.",
            operate: function (regres, state) {
                let cit = polymorph_core.items[regres[1]];
                if (!cit) {
                    state.output("No such item " + regres[1] + " found. Use mki $1 to create an item.");
                    return;
                }
                if (getPath(state.state.path) != getParentPath(state.state.path)) {
                    state.output("Item " + regres[1] + " found, but not at current path. Navigate to " + getParentPath(state.state.path) + " to edit this item, [or use nd with the same arguments.]");
                    return
                }
                if (regres[3]) {
                    cit[regres[2]] = regres[3];
                } else if (regres[2]) {
                    cit.title = regres[2];
                }
                state.output(cit);
            }
        },
        no: {
            regex: /^no (.+?) \"(.+?)\"$/ig,
            help: "This command can be thought of as an equivalent to nano, for items. Type no $1 \"$2\" to set property $1 on the current container to $2.",
            operate: function (regres, state) {
                let cit = polymorph_core.items[regres[1]];
                if (!cit) {
                    state.output("No such item " + regres[1] + " found. Use mki $1 to create an item.");
                    return;
                }
                if (getPath(state.state.path) != getParentPath(state.state.path)) {
                    state.output("Item " + regres[1] + " found, but not at current path. Navigate to " + getParentPath(state.state.path) + " to edit this item, [or use nd with the same arguments.]");
                    return
                }
                if (regres[3]) {
                    cit[regres[2]] = regres[3];
                } else if (regres[2]) {
                    cit.title = regres[2];
                }
                state.output(cit);
            }
        },
        help: {
            regex: /^help(?: (.+))*$/ig,
            help: "For more help, type help $1 for more information on command $1.",
            operate: function (regres, state) {
                if (regres[1]) {
                    for (let i in operatorRegexes) {
                        if (regres[1] == i) {
                            state.output(i);
                            state.output(operatorRegexes[i].help);
                        }
                    }
                } else {
                    state.output("For more help, type help + the name of the command.");
                    state.output("Commands available:");
                    for (let i in operatorRegexes) {
                        state.output(i);
                    }
                }
            }
        },
        cls: {
            regex: /^cls$/ig,
            name: "cls",
            help: "Clears the screen.",
            operate: (regres, state) => {
                state.clearScreen();
                this.settings.record = "";
            }
        },
        mkii: {
            regex: /^mkii (.+?)$/ig,
            name: "mkii",
            help: "Make an item from JSON. Usage: mkii [JSON]",
            operate: function (regres, state) {
                let itm = {};
                let _itm = JSON.parse(regres[1]);
                if (typeof _itm == "string") {
                    itm.title = _itm;
                } else {
                    Object.assign(itm, _itm);
                }
                id = polymorph_core.insertItem(itm);
                state.output("Item created with id " + id);
                //query "https://www.ycombinator.com/companies/" "tr"
                container.fire("createItem", { id: id });
                container.fire("updateItem", { id: id });
            }
        },
        upii: {
            regex: /^upii (\w+) (.+?)$/ig,
            name: "upii",
            help: "Update an item from JSON.",
            operate: function (regres, state) {
                let itm = {};
                let _itm = JSON.parse(regres[2]);
                if (!polymorph_core.items[regres[1]]) polymorph_core.items[regres[1]] = {};
                Object.assign(polymorph_core.items[regres[1]], _itm);
                state.output("Item updated with id " + regres[1]);
                //query "https://www.ycombinator.com/companies/" "tr"
                container.fire("updateItem", { id: regres[1] });
            }
        },
        cron: {
            regex: /^cron "(.+?)" (.+?)$/ig,
            name: "cron",
            help: "Schedule a command to run.",
            operate: function (regres, state) {
                let dp = new _dateParser();
                let tm = dp.extractTime(regres[2]);
                state.future(() => {
                    state.process(regres[1]);
                }, tm.getTime());
            }
        },
        call: {
            name: "call",
            help: "Call a callable function on the current container.",
            regex: /^call (.+?)\((.+)\)$/ig,
            operate: function (regres, state) {
                if (!state.container) {
                    state.output("No container selected!");
                    return;
                }
                if (state.container.container.callables[regres[1]]) {
                    try {
                        state.output(state.container.container.callables[regres[1]](JSON.parse(regres[2])));
                    } catch (e) {
                        state.output(e);
                    }
                } else {
                    state.output("This container does not have a function called " + regres[1] + " :/");
                }
            }
        },
        fx: {
            regex: /^fx$/ig,
            help: "List callable functions on the currently selected container.",
            operate: function (regres, state) {
                if (!state.container) {
                    state.output("No container selected!");
                    return;
                }
                if (state.container.container.callables) {
                    state.output(Object.keys(state.container.container.callables));
                } else {
                    state.output("This container does not have callable functions :/ Contact the dev and make some suggestions!");
                }
            }
        }
    };
    container.div.appendChild(this.rootdiv);
    this.state = {
        respondent: 'user',
        output: (data) => {
            if (this.state.respondent == "user") {
                this.state.outputToUser(data);
            } else {
                this.state.outputToWS(data);
            }
        },
        outputToUser: (data) => {
            if (typeof data != "string") {
                data = JSON.stringify(data);
            }
            this.textarea.value += data + "\n";

        },
        outputToWS: (data) => {
            if (typeof data != "string") {
                data = JSON.stringify(data);
            }
            if (this.ws && this.ws.readyState == WebSocket.OPEN) {//closed
                this.ws.send(data);
            } else if (this.ws.readyState >= WebSocket.CLOSING) {
                this.state.outputToUser("Websocket not connected - operation aborted.");
                if (this.settings.wsautocon) {
                    this.state.outputToUser("Autorestart enabled - attempting to connect...");
                    this.storedCommand = data;
                    this.tryEstablishWS();
                }
            }
        },
        clearScreen: () => {
            this.textarea.value = "";
        },
        future: function (f, t) {
            setTimeout(f, t - Date.now());
        },
        process: function (command) {
            processQuery(command, "internal");
        }
    }

    this.state.state = this.settings.state;

    let processQuery = (q, forcedMode) => {
        //check if intlecho first
        operatorRegexes.intlecho.regex.lastIndex = 0; //force reset regex
        if ((regres = operatorRegexes.intlecho.regex.exec(q))) {
            operatorRegexes.intlecho.operate(regres, this.state);
            return;
        }
        if (forcedMode == "internal" || !this.settings.wsthru) {

            for (let i in operatorRegexes) {
                operatorRegexes[i].regex.lastIndex = 0; //force reset regex
                if ((regres = operatorRegexes[i].regex.exec(q))) {
                    operatorRegexes[i].operate(regres, this.state);
                }
            }
        } else {
            this.state.outputToWS(q);
        }
    }
    this.textarea = this.rootdiv.querySelector("textarea");
    this.querybox = this.rootdiv.querySelector("input");
    this.querybox.addEventListener("keyup", (e) => {
        if (this.settings.opmode == "console") {
            let lines = this.textarea.value.split("\n");
            switch (e.key) {
                case "Enter":
                    if (this.settings.echoOn) {
                        this.state.outputToUser(this.querybox.value);
                    }
                    this.state.respondent = "user";
                    processQuery(this.querybox.value);
                    this.querybox.value = "";
                    this.cline = 0;
                    break;
                case "ArrowUp":
                    if (!this.cline) {
                        this.cline = lines.length - 2;
                    } else {
                        this.cline--;
                    }
                    this.querybox.value = lines[this.cline];//last return
                    break;
                case "ArrowDown":
                    if (this.cline == lines.length - 1) {
                        this.cline = 0;
                    } else {
                        this.cline++;
                    }
                    this.querybox.value = lines[this.cline];//last return
                    break;
            }
        }
    })
    this.button = this.rootdiv.querySelector("button");
    this.button.addEventListener("click", () => {
        if (this.settings.opmode == "console") {
            this.state.respondent = "user";
            processQuery(this.querybox.value);
            this.querybox.value = "";
            this.cline = 0;
        } else {
            this.settings.scriptEnabled = !this.settings.scriptEnabled;
            if (this.settings.scriptEnabled) {
                if (this.timerID) clearTimeout(this.timerID);
                evalSelf();
            }

        }
    })
    //////////////////Handle polymorph_core item updates//////////////////
    let evalSelf = () => {
        if (this.settings.scriptEnabled) {
            try {
                eval(this.textarea.value);
            } catch (e) {
                console.log(e);
            }
        }
        try {
            this.timerID = setTimeout(evalSelf, this.querybox.value || 1000);
        } catch (err) {
            this.querybox.value = "Please enter a number!";
        }
    }

    //Saving and loading
    this.textarea.addEventListener("input", () => {
        if (this.settings.opmode == "console") {
            this.settings.record = this.textarea.value;
        } else {
            this.settings.script = this.textarea.value;
        }
    })

    this.updateSettings = () => {
        if (this.settings.opmode == "console") {
            if (this.settings.record) this.textarea.value = this.settings.record;
            this.tryEstablishWS();
            this.state.state = this.settings.state;
            if (!this.state.state) this.state.state = {};
        } else {
            this.textarea.value = this.settings.script || "";
            this.querybox.value = this.settings.interval || "";
        }
    }

    this.fromSaveData = (d) => {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
        this.textarea.value = this.settings.record;
        if (this.settings.wsthru || this.settings.wsautocon) this.tryEstablishWS();
    }

    this.tryEstablishWS = () => {
        //close previous ws if open
        if (this.ws) this.ws.close();
        else if (this.settings.wsurl) {
            try {
                this.ws = new WebSocket(this.settings.wsurl);
                this.ws.onerror = (e) => {
                    this.state.outputToUser('Failed to connect.');
                    console.log(e);
                }
                this.ws.onmessage = (e) => {
                    if (this.settings.echoOn) {
                        this.state.outputToUser("ws:" + e.data);
                    }
                    this.state.respondent = "WS";
                    processQuery(e.data);
                }
                this.ws.onopen = (e) => {
                    this.state.outputToUser('Connnection established!');
                    if (this.storedCommand && this.ws.readyState == WebSocket.OPEN) {
                        this.ws.send(this.storedCommand);
                        this.storedCommand = undefined;
                    }
                }
                this.ws.onclose = (e) => {
                    if (this.settings.wsautocon) {
                        this.state.outputToUser("Connection closed.");
                        this.state.outputToUser("Retrying in 5...");
                        delete this.ws;
                        setTimeout(this.tryEstablishWS, 5000);
                    }
                }
            } catch (e) {
                if (this.settings.wsautocon) setTimeout(this.tryEstablishWS, 1000);
                this.state.outputToUser('Failed to connect.');
                console.log(e);
            }
        }
    }


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `
        <h2>Operation mode</h2>
        <label><input type="radio" name="opmode" value="console" checked>Console</label>
        <label><input type="radio" name="opmode" value="script">Script</label>
        <h2>Websocket hook</h2>
        <p>Type an address for a websocket below for I/O to this terminal. </p>
        <input class="wshook" placeholder="Websocket URL (include prefix) - empty for none"></input>
        <button class="wsset">Set websocket</button>
    `;
    let ops = [
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "echoOn",
            label: "Echo commands"
        }), new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "wsautocon",
            label: "Autoconnect websocket on disconnect"
        }), new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "wsthru",
            label: "Pass typed messages to websocket"
        })
    ];
    this.dialogDiv.addEventListener("click", () => {
        this.settings.opmode = document.querySelector("[name='opmode']:checked").value;
    })

    this.dialogDiv.querySelector(".wsset").addEventListener("click", () => {
        this.settings.wsurl = this.dialogDiv.querySelector(".wshook").value;
        this.tryEstablishWS();
    })
    this.showDialog = () => {
        this.settings.record = this.textarea.value;
        ops.forEach((op) => { op.load(); });
        if (this.settings.wsurl) this.dialogDiv.querySelector(".wshook").value = this.settings.wsurl;
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = () => {
        this.updateSettings();
        // pull settings and update when your dialog is closed.
    }

});;

//todo: putter mode for inspector
(() => {


    //render an item on focus or on settings update.
    //must be able to handle null and "" in id
    //also should be able to update instead of just rendering
    function recursiveRender(obj, div, path) {
        if (typeof obj == "object" && obj) {
            for (let j = 0; j < div.children.length; j++) div.children[j].dataset.used = "false";
            for (let i in obj) {
                let d;
                for (let j = 0; j < div.children.length; j++) {
                    if (div.children[j].matches(`[data-prop="${i}"]`)) {
                        d = div.children[j];
                    }
                }
                if (!d) d = htmlwrap(`<div style="border-top: 1px solid black"><span>${i}</span><div></div></div>`);
                d.dataset.prop = i;
                d.dataset.used = "true";
                d.style.marginLeft = "5px";
                recursiveRender(obj[i], d.children[1], path + "/" + i);
                div.appendChild(d);
            }
            for (let j = 0; j < div.children.length; j++) {
                if (div.children[j].dataset.used == "false" && (div.children[j].tagName == "DIV" || div.children[j].tagName == "BUTTON")) {
                    div.children[j].remove();
                }
            }
            div.appendChild(htmlwrap(`<button>Add property...</button>`));
        } else {
            let i;
            if (div.children[0] && div.children[0].tagName == "INPUT") {
                i = div.children[0];
            } else {
                while (div.children.length) div.children[0].remove();
            }
            if (!i) i = document.createElement("input");
            i.value = obj;
            div.dataset.role = path;
            div.dataset.type = "Auto";
            div.appendChild(i);
        }
    }


    let datatypes = {
        'Text': {
            onInput: (e, it, i) => {
                it[i] = e.target.value;
            },
            generate: (id) => {
                return `<input>`;
            },
            updateValue: (obj, div) => {
                if (obj != undefined) div.querySelector("input").value = obj;
                else div.querySelector("input").value = "";
            }
        },
        'Large Text': {
            onInput: (e, it, i) => {
                it[i] = e.target.value;
                e.target.style.height = e.target.scrollHeight;
            },
            generate: (id) => {
                return `<textarea style="width:100%"></textarea>`;
            },
            updateValue: (obj, div) => {
                if (obj != undefined) div.querySelector("textarea").value = obj;
                else div.querySelector("textarea").value = "";
                //tiny nudge so the scroll bar doesnt show up
                div.querySelector("textarea").style.height = div.querySelector("textarea").scrollHeight;
            }
        },
        'Date': {
            onInput: (e, it, i) => {
                if (!it[i]) it[i] = {};
                if (typeof it[i] == "string") it[i] = {
                    datestring: it[i]
                };
                it[i].datestring = e.target.value;
                if (this.datereparse) this.datereparse(it, i);
            },
            generate: (id) => {
                return `<input>`;
            },
            updateValue: (obj, div) => {
                if (obj) div.querySelector("input").value = obj.datestring || "";
                else div.querySelector("input").value = "";
            }
        },
        'Auto': {
            onInput: (e, it, i) => {
                // i is a path variable, decode it
                let decodedPath = i.split("/");
                let obj = it;
                for (let pr=0;pr<decodedPath.length-1;pr++){
                    obj=obj[decodedPath[pr]];
                }
                obj[decodedPath[decodedPath.length-1]]=e.target.value;
            },
            updateValue: (obj, div, i) => {
                if (typeof (obj) == "object") {
                    recursiveRender(obj, div, i);
                } else {
                    div.innerHTML = `<p>${i}:</p><input>`;
                    if (obj != undefined) div.querySelector("input").value = obj;
                    else div.querySelector("input").value = "";
                    //fall through
                }
            }
        }
    };
    polymorph_core.registerOperator("inspector", {
        displayName: "Inspector",
        description: "Inspect all properties of a given element.",
        section: "Advanced",
        imageurl: "assets/operators/inspector.png"
    }, function (container) {

        let upc = new capacitor(300, 40, (id) => {
            container.fire("updateItem", {
                id: id,
                sender: this
            });
        })










        let defaultSettings = {
            operationMode: "focus",
            currentItem: "",
            globalEnabled: false,// whether or not it's enabled globally
        };
        polymorph_core.operatorTemplate.call(this, container, defaultSettings);
        this.rootdiv.style.cssText = `
    overflow:auto;
    height: 100%;
    color: white;
    `
        let ttypes = `<select data-role="nttype">
    ${(() => {
                let output = "";
                for (i in datatypes) {
                    output += `<option value='${i}'>${i}</option>`;
                }
                return output;
            })()
            }
    </select>`;
        this.rootdiv.appendChild(htmlwrap(`
    <h3>Item: <span class="itemID"></span></h3>
    <div></div>
        <h4>Add a property:</h4>
        <input type="text" placeholder="Name">
        <label>Type:${ttypes}</label>
        <button class="ap">Add property</button>
    `));
        this.internal = this.rootdiv.children[0].children[1];


        let insertbtn = htmlwrap(`
    <button>Add new item</button>`);
        this.rootdiv.appendChild(insertbtn);
        insertbtn.style.display = "none";
        insertbtn.addEventListener("click", () => {
            //create a new element with the stated specs
            let item = {};
            for (let i = 0; i < this.internal.children.length; i++) {
                item[this.internal.children[i].dataset.role] = this.internal.children[i].querySelector("input").value;
            }
            let id = polymorph_core.insertItem(item)
            container.fire("updateItem", { id: id });
            this.settings.currentItem = undefined;
            //clear modified class on item
            for (let i = 0; i < this.internal.children.length; i++) {
                this.internal.children[i].classList.remove("modified");
            }
        })


        let commitbtn = htmlwrap(`
    <button>Commit changes</button>`);
        this.rootdiv.appendChild(commitbtn);
        commitbtn.style.display = "none";
        commitbtn.addEventListener("click", () => {
            //commit changes
            if (this.settings.currentItem) {
                let item = polymorph_core.items[this.settings.currentItem];
                for (let i = 0; i < this.internal.children.length; i++) {
                    item[this.internal.children[i].dataset.role] = this.internal.children[i].querySelector("input").value;
                }
                container.fire("updateItem", { id: this.settings.currentItem });
                //clear modified class on item
                for (let i = 0; i < this.internal.children.length; i++) {
                    this.internal.children[i].classList.remove("modified");
                }
            }
        })
        /*let clearBtn=htmlwrap(`
        <button>Clear fields</button>`);
        this.rootdiv.appendChild(clearBtn);
        insertbtn.addEventListener("click",()=>{
            //create a new element with the stated specs
        })*/
        let newProp = (prop) => {
            if (this.settings.currentItem) polymorph_core.items[this.settings.currentItem][prop] = " ";
            if (this.settings.propsOn) this.settings.propsOn[prop] = this.rootdiv.querySelector("[data-role='nttype']").value;
            this.renderItem(this.settings.currentItem);
            container.fire("updateItem", {
                sender: this,
                id: this.settings.currentItem
            });
        }
        this.rootdiv.querySelector("input[placeholder='Name']").addEventListener("keyup", (e) => {
            if (e.key == "Enter") {
                newProp(e.target.value);
                e.target.value = "";
            }
        })
        this.rootdiv.querySelector(".ap").addEventListener("click", (e) => {
            newProp(this.rootdiv.querySelector("input[placeholder='Name']").value);
            this.rootdiv.querySelector("input[placeholder='Name']").value = "";
        })

        container.div.appendChild(htmlwrap(
            `
        <style>
        h4{
            margin:0;
        }
        .modified input{
            background: lightblue;
        }
        </style>
    `
        ));
        container.div.appendChild(this.rootdiv);

        ///////////////////////////////////////////////////////////////////////////////////////
        //Actual editing the item

        this.internal.addEventListener("input", (e) => {
            //change this to invalidate instead of directly edit?
            if (this.settings.commitChanges) {
                e.target.parentElement.classList.add("modified");
            } else if (this.settings.currentItem) {
                let it = polymorph_core.items[this.settings.currentItem];
                let i = e.target.parentElement.dataset.role;
                if (datatypes[e.target.parentElement.dataset.type]) {
                    datatypes[e.target.parentElement.dataset.type].onInput(e, it, i);
                    upc.submit(this.settings.currentItem);
                }
            }
        })

        this.datereparse = (it, i) => {
            it[i].date = dateParser.richExtractTime(it[i].datestring);
            if (!it[i].date.length) it[i].date = undefined;
            container.fire("dateUpdate");
        }

        let ctm = new _contextMenuManager(container.div);
        let contextedItem;
        let menu;

        function filter(e) {
            contextedItem = e.target;
            return true;
        }
        menu = ctm.registerContextMenu(`<li class="fixed">Convert to fixed date</li>`, this.rootdiv, "[data-type='Date'] input", filter)
        menu.querySelector(".fixed").addEventListener("click", (e) => {
            if (!polymorph_core.items[this.settings.currentItem][contextedItem.parentElement.dataset.role].date) this.datereparse(polymorph_core.items[this.settings.currentItem], contextedItem.parentElement.dataset.role);
            contextedItem.value = new Date(polymorph_core.items[this.settings.currentItem][contextedItem.parentElement.dataset.role].date[0].date).toLocaleString();
            polymorph_core.items[this.settings.currentItem][contextedItem.parentElement.dataset.role].datestring = contextedItem.value;
            this.datereparse(polymorph_core.items[this.settings.currentItem], contextedItem.parentElement.dataset.role);
            menu.style.display = "none";
        })



        this.renderItem = function (id, soft = false) {
            this.rootdiv.querySelector(".itemID").innerText = id;
            if (!soft) this.internal.innerHTML = "";
            //create a bunch of textareas for each different field.
            //invalidate old ones
            for (let i = 0; i < this.internal.children.length; i++) {
                this.internal.children[i].dataset.invalid = 1;
            }
            let clean_obj = {};
            if (polymorph_core.items[id]) {
                //clean the object
                clean_obj = JSON.parse(JSON.stringify(polymorph_core.items[id]));
            }
            for (let i in this.settings.propsOn) {
                if (this.settings.propsOn[i] && (clean_obj[i] != undefined || this.settings.showNonexistent)) {
                    let pdiv = this.internal.querySelector("[data-role='" + i + "']");
                    //create or change type if necessary
                    if (!pdiv || pdiv.dataset.type != this.settings.propsOn[i]) {
                        //regenerate it 
                        if (pdiv) pdiv.remove();
                        pdiv = document.createElement("div");
                        pdiv.dataset.role = i;
                        pdiv.dataset.type = this.settings.propsOn[i];
                        let ihtml = `<h4>` + i + `</h4>`;
                        if (datatypes[this.settings.propsOn[i]].generate) {
                            ihtml += datatypes[this.settings.propsOn[i]].generate(i);
                        }
                        pdiv.innerHTML = ihtml;
                        this.internal.appendChild(pdiv);
                    }
                    pdiv.dataset.invalid = 0;
                    //display value
                    if (datatypes[this.settings.propsOn[i]].updateValue) {
                        datatypes[this.settings.propsOn[i]].updateValue(clean_obj[i], pdiv, i);
                    }
                }
            }
            //remove invalidated items
            its = this.internal.querySelectorAll("[data-invalid='1']");
            for (let i = 0; i < its.length; i++) {
                its[i].remove();
            }
            //(each has a dropdown for datatype)
            //rendering should not destroy ofject data
            //little 'new property' item
            //delete properties
        }
        ///////////////////////////////////////////////////////////////////////////////////////
        //First time load
        this.renderItem(this.settings.currentItem);

        container.on("updateItem", (d) => {
            let id = d.id;
            let sender = d.sender;
            if (sender == this) return;
            //Check if item is shown
            //Update item if relevant
            if (id == this.settings.currentItem) {
                this.renderItem(id, true); //update for any new properties.
                return true;
            } else return false;
        });


        //loading and saving
        this.updateSettings = () => {
            /*
            //this is broken because staticitem does not exist???
            if (this.settings.operationMode == 'static') {
                //create if it does not exist
                if (!polymorph_core.items[staticItem]) {
                    let it = {};
                    polymorph_core.items[staticItem] = it;
                    container.fire("updateItem", {
                        sender: this,
                        id: staticItem
                    });
                }
            }*/
            if (this.settings.dataEntry) {
                insertbtn.style.display = "block";
            } else {
                insertbtn.style.display = "none";
            }
            if (this.settings.commitChanges) {
                commitbtn.style.display = "block";
            } else {
                commitbtn.style.display = "none";
            }
            //render the item
            this.renderItem(this.settings.currentItem);
        }

        if (!this.settings.propsOn) {
            this.settings.propsOn = {};
            for (let i in polymorph_core.items) {
                for (let j in polymorph_core.items[i]) {
                    this.settings.propsOn[j] = "Auto";
                }
            }
        }
        this.updateSettings();

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.optionsDiv = document.createElement("div");
        this.dialogDiv.appendChild(this.optionsDiv);
        this.optionsDiv.style.width = "30vw";
        let options = {
            operationMode: new polymorph_core._option({
                div: this.optionsDiv,
                type: "select",
                object: this.settings,
                property: "operationMode",
                source: {
                    static: "Display static item",
                    focus: "Display focused element"
                },
                label: "Select operation mode:"
            }),
            currentItem: new polymorph_core._option({
                div: this.optionsDiv,
                type: "text",
                object: this.settings,
                property: "currentItem",
                label: "Set item to display:"
            }),
            orientation: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "orientation",
                label: "Horizontal orientation"
            }),
            showNonexistent: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "showNonexistent",
                label: "Show enabled but not currently filled fields"
            }),
            commitChanges: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "commitChanges",
                label: "Manually commit changes",
            }),
            dataEntry: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "dataEntry",
                label: "Enable data entry",
                afterInput: (e) => {
                    let i = e.currentTarget;
                    if (i.checked) {
                        this.settings.showNonexistent = true;
                        options.showNonexistent.load();
                        this.settings.commitChanges = true;
                        options.commitChanges.load();
                    }
                }
            }),
            globalEnabled: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "globalEnabled",
                label: "Focus: listen for every container (regardless of origin)",
            })
        }
        let fields = document.createElement('div');
        fields.innerHTML = `
    <h4> Select visible fields: </h4>
    <div class="apropos"></div>
    `;
        this.dialogDiv.appendChild(fields);

        this.showDialog = () => {
            // update your dialog elements with your settings
            //get all available properties.
            let app = fields.querySelector(".apropos");
            app.innerHTML = "";
            let props = {};
            for (let i in polymorph_core.items) {
                for (let j in polymorph_core.items[i]) props[j] = true;
            }
            if (!this.settings.propsOn) this.settings.propsOn = props;
            for (let j in props) {
                let thisPropLine = htmlwrap(`<p data-pname="${j}">${j}<span style="display: block; float: right;"><input type="checkbox" ${(this.settings.propsOn[j]) ? "checked" : ""}> ${ttypes}</span></p>`);
                thisPropLine.querySelector("[data-role='nttype']").value = this.settings.propsOn[j] || "Text";
                app.appendChild(thisPropLine);

            }
            //fill out some details
            for (i in options) {
                options[i].load();
            }
        }
        this.dialogUpdateSettings = () => {
            // pull settings and update when your dialog is closed.
            let its = this.dialogDiv.querySelectorAll("[data-role]");
            for (let i = 0; i < its.length; i++) {
                this.settings[its[i].dataset.role] = its[i].value;
            }
            //also update all properties
            let ipns = this.dialogDiv.querySelectorAll("[data-pname]");
            this.settings.propsOn = {};
            for (let i = 0; i < ipns.length; i++) {
                if (ipns[i].querySelector("input").checked) {
                    this.settings.propsOn[ipns[i].dataset.pname] = ipns[i].querySelector("select").value;
                }
            }
            this.updateSettings();
            this.renderItem(this.settings.currentItem);
        }
        this.dialogDiv.addEventListener("input", (e) => {
            if (e.target.dataset.role) {
                this.settings[e.target.dataset.role] = e.target.value;
            }
        })

        //polymorph_core will call this when an object is focused on from somewhere
        container.on("focusItem", (d) => {
            let id = d.id;
            let sender = d.sender;
            if (this.settings.operationMode == "focus") {
                this.settings.currentItem = id;
                this.renderItem(id);
                //using new focus paradigm we can skip this step, hopefully
                /*
                if (this.settings['focusOperatorID']) {
                    if (this.settings['focusOperatorID'] == sender.container.uuid) {
    
                    }
                } else {
                    //calculate the base rect of the sender
                    let baserectSender = sender.container.rect;
                    while (baserectSender.parent) baserectSender = baserectSender.parent;
                    //calculate my base rect
                    let myBaseRect = this.container.rect;
                    while (myBaseRect.parent) myBaseRect = myBaseRect.parent;
                    //if they're the same, then update.
                    if (myBaseRect == baserectSender || this.settings.globalEnabled) {
                        if (this.settings.operationMode == 'focus') {
                            this.settings.currentItem = id;
                            this.renderItem(id);
                        }
                    }
                }
                */
            }
        });
        container.on("deleteItem", (d) => {
            let id = d.id;
            let s = d.sender;
            if (this.settings.currentItem == id) {
                this.settings.currentItem = undefined;
            };
            this.updateItem(undefined);
        });
    });

})();;

//todo: putter mode for inspector
polymorph_core.registerOperator("inspectolist", {
    displayName: "Inspectolist",
    description: "Combination between inspector and list. Gives detailed information about specific items.",
    hidden:true
}, function (container) {
    let defaultSettings = {
        dumpProp: "description",
        headerCopyProp: "title",
        currentItem: polymorph_core.guid(4),
        filter: polymorph_core.guid(4),
        permafilter: "",
        tagColors: {},
        scomCommands: []
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    this.rootdiv.style.color = "white";
    this.rootdiv.appendChild(htmlwrap(`
    <style>
        h3{
            margin:0;
        }
        h2{
            margin:0;
        }
        [data-role="topbar"]{
            padding: 3px;
            margin: 1px;
            background: black;
            border-radius: 3px;
        }
        [data-role='subItemBox']{
            padding-left: 10px;
        }
    </style>
    `));
    this.rootdiv.style.overflow = "auto";
    this.rootdiv.style.height = "100%";
    // Add the search/entry box
    let searchEntryBox = document.createElement("div");
    searchEntryBox.contentEditable = true;
    this.rootdiv.appendChild(searchEntryBox);

    this.matchbox = htmlwrap(`
    <div>
        <h2>Matched items</h2>
        <div>
    </div>
    `);
    this.rootdiv.appendChild(this.matchbox);
    this.matchbox = this.matchbox.querySelector("div");

    this.unmatchbox = htmlwrap(`
    <div>
        <h2>Unmatched items</h2>
        <div>
    </div>
    `);
    this.rootdiv.appendChild(this.unmatchbox);
    this.unmatchbox = this.unmatchbox.querySelector("div");

    this.currentFilters = {};
    let similarish = (filterA, filterB) => {
        let indexA = indexB = 0;
        let simscore = 0;
        while (indexA < filterA.words.length && indexB < filterB.words.length) {
            if (filterA.words[indexA][0] > filterB.words[indexB][0]) {
                indexB++;
            } else if (filterA.words[indexA][0] < filterB.words[indexB][0]) {
                indexA++;
            } else {
                //they are the same
                return true;
            }
        }
        return false;
    }
    let generateFilter = (currentText) => {
        let currentFilter = {
            words: undefined,
            parent: undefined
        };
        let wrds = {};
        let re = /[#\w]+/g;
        let wrd = undefined;
        while (wrd = re.exec(currentText)) {
            let cwd = wrd[0].toLowerCase();
            wrds[cwd] = wrds[cwd] | 0;
            wrds[cwd]++;
        }
        currentFilter.words = Object.entries(wrds);
        currentFilter.words = currentFilter.words.sort((a, b) => a[0] > b[0] ? 1 : -1);

        //find parent
        if (wrd = />p:([\d\w]+)/.exec(currentText)) {
            currentFilter.parent = wrd[1];
        }
        return currentFilter;
    }
    let scombox = document.createElement("div");
    this.rootdiv.insertBefore(scombox, searchEntryBox);

    //slash command processing
    let scomprocess = (command) => {
        command = command.split(":");
        switch (command[0]) {
            case "filter":
                //apply a global filter: change settings filter and fire update on all items.
                for (let i in polymorph_core.items) {
                    container.fire("updateItem", { id: i, unedit: true });
                }
                //add the command to the command list.
                scombox.appendChild(htmlwrap(`<span>${command.join(":")}&nbsp;</span>`));
                this.settings.scomCommands.push(command);
                break;
        }
    }

    let scommod = (item) => {
        for (let i of this.settings.scomCommands) {
            switch (i[0]) {
                case "filter":
                    if (!item[this.settings.dumpProp].includes(i[1])) {
                        item[this.settings.dumpProp] += i[1];
                    }
            }
        }
    }

    searchEntryBox.addEventListener("keyup", (e) => {
        if (e.key == "Enter" && e.getModifierState("Shift") == false) {
            //create a new item
            let it = {};
            it[this.settings.dumpProp] = e.target.innerText;
            // perform scom modifications
            scommod(it);
            it[this.settings.filter] = true;
            let id = polymorph_core.insertItem(it);
            container.fire("createItem", { id: id, sender: this });
            updateRenderedItem(id, true);
            e.target.innerHTML = "";
            expand(id);
            this.rootdiv.querySelector(`[data-item="${id}"] [data-role="richtext"]`).focus();
            e.preventDefault();
        } else {
            //check slash commands
            let it = e.target.innerText;
            let slashcomm = /\\(.+?)\\/g.exec(e.target.innerText);
            if (slashcomm) {
                scomprocess(slashcomm[1]);
                it = it.replace(slashcomm[0], "");
                e.target.innerText = it;
            }
            //perform searchfilter
            currentFilter = generateFilter(it);
            for (let i in this.currentFilters) {
                if (similarish(this.currentFilters[i], currentFilter)) {
                    updateRenderedItem(i, true);
                } else {
                    updateRenderedItem(i, false);
                }
            }
        }
    })

    /*updateRenderedItem called when:
    updateItem: dont care about matched or not (persist)
    key press: dont care about matched or not (persist)
    */
    let updateRenderedItem = (id, matched) => {
        let addIfNotAdded = (p, c) => {
            if (!Array.from(p.children).includes(c)) p.appendChild(c);
        }


        this.currentFilters[id] = generateFilter(polymorph_core.items[id][this.settings.dumpProp]);
        renderTopbar(id);
        let cnt = getContainer(id);
        let userFocused = cnt.contains(this.rootdiv.getRootNode().getSelection().anchorNode);
        if (!userFocused) renderRichText(id);
        //figure out where it is
        if (matched == undefined) {//dont relocate
            matched = this.matchbox.contains(cnt);
        }
        if (matched) {
            addIfNotAdded(this.matchbox, cnt);
        } else {
            if (this.currentFilters[id].parent) {
                if (this.rootdiv.querySelector(`[data-item="${this.currentFilters[id].parent}"]`)) {
                    //append it to that div
                    addIfNotAdded(this.rootdiv.querySelector(`[data-item="${this.currentFilters[id].parent}"]>[data-role='subItemBox']`), cnt);
                } else {
                    addIfNotAdded(this.unmatchbox, cnt);
                }
            } else {
                addIfNotAdded(this.unmatchbox, cnt);
            }
        }
    }

    let getContainer = (id) => {
        let thisItemContainer = this.rootdiv.querySelector(`[data-item="${id}"]`);
        if (!thisItemContainer) {
            thisItemContainer = document.createElement('div');
            thisItemContainer.dataset.item = id;
            thisItemContainer.appendChild(htmlwrap('<div data-role="subItemBox"></div>'));
            this.matchbox.appendChild(thisItemContainer);
        }
        //also put it in the right place
        return thisItemContainer;
    }

    let renderTopbar = (id) => {
        let itemContainer = getContainer(id);
        let topbar = itemContainer.querySelector(`[data-role='topbar']`);
        if (!topbar) {
            topbar = htmlwrap(`<h3 data-role="topbar"></h3>`);
            itemContainer.insertBefore(topbar, itemContainer.children[0]);
        }
        if (polymorph_core.items[id][this.settings.dumpProp]) {
            let innerText = polymorph_core.items[id][this.settings.dumpProp];
            let toptext = `<span style="color:pink">#id:${id}; </span>`;
            toptext += innerText.split("\n")[0];
            
            polymorph_core.items[id][this.settings.headerCopyProp] = innerText.split("\n")[0];
            container.fire('updateItem', { sender: this, id: id });

            let tagfilter = /#(\w+)(:[\w\d]+)?/g;
            let seenTags = {};
            while (result = tagfilter.exec(innerText)) {
                if (!seenTags[result[0]]) {
                    toptext = toptext.replaceAll(result[0], "");
                    if (!this.settings.tagColors[result[1]]) {
                        this.settings.tagColors[result[1]] = randBriteCol();
                    }
                    toptext += `<span style="color:${this.settings.tagColors[result[1]]}">${result[0]}</span>`;
                    seenTags[result[0]] = true;
                }
            }
            //add the ID property
            topbar.innerHTML = toptext;
        }
    }
    let renderRichText = (id) => {
        let itemContainer = getContainer(id);
        let richtext = itemContainer.querySelector(`[data-role='richtext']`);
        if (!richtext) {
            richtext = htmlwrap(`<div data-role="richtext" contenteditable></div>`);
            itemContainer.insertBefore(richtext, itemContainer.children[1]);
            richtext.style.display = "none";
        }
        richtext.innerText = polymorph_core.items[id][this.settings.dumpProp];
    }

    container.on("updateItem", (d) => {
        if (d.sender == this) return;
        if (this.itemRelevant(d.id)) {
            updateRenderedItem(d.id);
        }
    })

    let expand = (id, focus = true) => {
        //hide all others
        Array.from(this.rootdiv.querySelectorAll("[data-role='richtext']")).forEach(i => {
            //i.style.height = "0px";
            i.style.display = "none";
        });
        let richtext = this.rootdiv.querySelector(`[data-item='${id}'] [data-role='richtext']`);
        richtext.style.display = "block";
        if (focus) richtext.focus();
    }

    this.rootdiv.addEventListener("click", (e) => {
        if (e.target.matches("[data-role='topbar']")) {
            let cid = e.target.parentElement.dataset.item;
            container.fire('focusItem', { id: cid, sender: this });
            expand(cid);
        }
    })

    let upc = new capacitor(300, 40, (id) => {
        container.fire("updateItem", {
            id: id,
            sender: this
        });
    })

    let deleteItem = (id) => {
        delete polymorph_core.items[id][this.settings.filter];
        delete this.currentFilters[id];
        if (this.rootdiv.querySelector(`[data-item='${id}']`)) this.rootdiv.querySelector(`[data-item='${id}']`).remove();
    }

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches("[data-role='richtext']")) {
            if ((e.key == "ArrowDown" || e.key == "ArrowUp") && !e.getModifierState("Shift")) {
                let ckey = e.key;
                let ctarget = e.target;
                let baseElement = e.target.getRootNode();
                range = baseElement.getSelection().getRangeAt(0);
                let preRange = range.startOffset;
                let preEl = range.startContainer;
                setTimeout(() => {
                    range = baseElement.getSelection().getRangeAt(0);
                    if (preRange == range.startOffset && preEl == range.startContainer) {
                        if (ckey == "ArrowDown") {
                            if (ctarget.parentElement.nextElementSibling) {
                                expand(ctarget.parentElement.nextElementSibling.dataset.item);
                            } else if (ctarget.parentElement.parentElement.dataset.role == 'subItemBox') {
                                if (ctarget.parentElement.parentElement.parentElement.nextElementSibling) {
                                    expand(ctarget.parentElement.parentElement.parentElement.nextElementSibling.dataset.item);
                                }
                            }
                        } else {
                            if (ctarget.parentElement.previousElementSibling) {
                                expand(ctarget.parentElement.previousElementSibling.dataset.item);
                            } else if (ctarget.parentElement.parentElement.dataset.role == 'subItemBox') {
                                expand(ctarget.parentElement.parentElement.parentElement.dataset.item);
                            }
                        }
                    }
                }, 100);
            }
        }
    });

    this.rootdiv.addEventListener("keyup", (e) => {
        if (e.target.matches("[data-role='richtext']")) {
            if (e.key == "Tab") e.preventDefault();
            else {
                let cid = e.target.parentElement.dataset.item;
                upc.submit(cid);
                if (e.target.innerText == "") {
                    //delete the item
                    deleteItem(cid);
                    container.fire("deleteItem", { id: cid, sender: this });
                } else {
                    polymorph_core.items[cid][this.settings.dumpProp] = e.target.innerText;
                    container.fire("updateItem", { id: cid, sender: this });
                    updateRenderedItem(cid);
                }
            }
        }
    })

    container.on("deleteItem", (d) => {
        if (d.sender == this) return;
        deleteItem(d.id);
    });

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        polymorph_core.items[d.id][this.settings.filter] = true;
    });

    //polymorph_core will call this when an object is focused on from somewhere
    container.on("focusItem", (d) => {
        let id = d.id;
        if (d.sender == this) return;
        if (this.rootdiv.querySelector(`[data-item='${id}'] [data-role='richtext']`)) {
            expand(id, false);
        }
    });

    this.dialogDiv = document.createElement("div");
    this.importSys = {
        importTitle: "title",
        importDesc: "description",
        importFilter: "",
        import: () => {
            for (let i in polymorph_core.items) {
                if (this.importSys.importFilter && !polymorph_core.items[i][this.importSys.importFilter]) continue;
                if (polymorph_core.items[i][this.importSys.importTitle]) {
                    let data = polymorph_core.items[i][this.importSys.importTitle];
                    let importDescs = this.importSys.importDesc.split(",");
                    for (let d of importDescs) {
                        if (polymorph_core.items[i][d]) {
                            data += "\n";
                            data += polymorph_core.items[i][d];
                        }
                    }
                    polymorph_core.items[i][this.settings.dumpProp] = data;
                    polymorph_core.items[i][this.settings.filter] = true;
                    container.fire('updateItem', { id: i });
                }
            }
        }
    }
    let options = {
        filter: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "filter",
            label: "Filter:"
        }),
        dumpProp: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "dumpProp",
            label: "Property:"
        }),
        permafilter: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "permafilter",
            label: "Additional filter string:"
        }),
        importTitle: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.importSys,
            property: "importTitle",
            label: "Import title property:"
        }),
        importDesc: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.importSys,
            property: "importDesc",
            label: "Import description properties (csv):"
        }),
        importFilter: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.importSys,
            property: "importFilter",
            label: "Import filter property:"
        }),
        importNow: new polymorph_core._option({
            div: this.dialogDiv,
            type: "button",
            label: "Import now",
            fn: this.importSys.import
        }),
    }
    this.showDialog = () => {
        for (i in options) options[i].load();
    }
    this.dialogUpdateSettings = () => {
        for (let i in polymorph_core.items) {
            if (this.itemRelevant(i)) updateRenderedItem(i);
        }
        container.fire("updateItem", { id: this.container.id });
        // pull settings and update when your dialog is closed.
    }
    this.dialogUpdateSettings();
});;

//check if phone
if (isPhone()) {
    //// PHONE VERSION HERE
    polymorph_core.registerOperator("subframe", {
        displayName: "Subframe",
        description: "Place a new frame, with its own tabs, in this current frame.",
        section: "Layout"
    }, function (container) {
        polymorph_core.operatorTemplate.call(this, container, {});
        this.rootdiv.remove();//nerf the standard rootdiv because of differring naming conventions between rects and operators.
        this.outerDiv = document.createElement("div");
        //Add div HTML here
        this.outerDiv.innerHTML = ``;
        this.outerDiv.style.cssText = `width:100%; position:relative`;
        //////////////////Handle polymorph_core item updates//////////////////

        this.refresh = function () {
            container.rect.listContainer.querySelector(`[data-containerid='${container.id}']`).appendChild(this.outerDiv);
            polymorph_core.rects[this.rectID].refresh();
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////
        Object.defineProperty(this, "rect", {
            get: () => {
                return polymorph_core.rects[this.rectID];
            }
        })

        this.tieRect = function (rectID) {
            this.rectID = rectID;
            this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
            polymorph_core.rects[rectID].refresh();
        }

        //Check if i have any rects waiting for pickup
        if (polymorph_core.rectLoadCallbacks[container.id]) {
            this.tieRect(polymorph_core.rectLoadCallbacks[container.id][0]);
            delete polymorph_core.rectLoadCallbacks[container.id];
        } else if (!this.settings.operatorClonedFrom) {
            let rectID = polymorph_core.newRect(container.id);
            this.tieRect(rectID);
        }

        if (this.settings.operatorClonedFrom) {
            for (let ri in polymorph_core.rects) {
                if (polymorph_core.rects[ri].settings.p == this.settings.operatorClonedFrom) {
                    //make a clone of it
                    let copyRect = JSON.parse(JSON.stringify(polymorph_core.items[ri]));
                    copyRect._rd.p = container.id;
                    let newRectID = polymorph_core.insertItem(copyRect);
                    polymorph_core.rects[newRectID] = new polymorph_core.rect(newRectID);
                    this.tieRect(newRectID);
                    //also make a clone of all its operators
                    for (let i in polymorph_core.containers) {
                        if (polymorph_core.containers[i].settings.p == ri) {
                            //clone it
                            let copyOp = JSON.parse(JSON.stringify(polymorph_core.items[i]));
                            copyOp._od.p = newRectID;
                            copyOp._od.data.operatorClonedFrom = i;
                            let newContainerID = polymorph_core.insertItem(copyOp);
                            polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
                        }
                    }
                }
            }
            polymorph_core.items[this.settings.operatorClonedFrom]
            delete this.settings.operatorClonedFrom;
        }

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = `Nothing to show yet :3`;
        this.showDialog = function () {
            // update your dialog elements with your settings
        }
        this.dialogUpdateSettings = function () {
            // pull settings and update when your dialog is closed.
        }

        this.remove = () => {
            polymorph_core.rects[this.rectID].remove();
        }
    });
} else {
    polymorph_core.registerOperator("subframe", {
        displayName: "Subframe",
        description: "Place a new frame, with its own tabs, in this current frame.",
        section: "Layout"
    }, function (container) {
        polymorph_core.operatorTemplate.call(this, container, {});
        this.rootdiv.remove();//nerf the standard rootdiv because of differring naming conventions between rects and operators.
        this.outerDiv = document.createElement("div");
        //Add div HTML here
        this.outerDiv.innerHTML = ``;
        this.outerDiv.style.cssText = `width:100%; height: 100%; position:relative`;
        container.div.appendChild(this.outerDiv);

        //////////////////Handle polymorph_core item updates//////////////////

        this.refresh = function () {
            polymorph_core.rects[this.rectID].refresh();
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////
        Object.defineProperty(this, "rect", {
            get: () => {
                return polymorph_core.rects[this.rectID];
            }
        })

        this.tieRect = function (rectID) {
            this.rectID = rectID;
            this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
            polymorph_core.rects[rectID].refresh();
        }

        //Check if i have any rects waiting for pickup
        if (polymorph_core.rectLoadCallbacks[container.id]) {
            this.tieRect(polymorph_core.rectLoadCallbacks[container.id][0]);
            delete polymorph_core.rectLoadCallbacks[container.id];
        } else if (!this.settings.operatorClonedFrom) {
            let rectID = polymorph_core.newRect(container.id);
            this.tieRect(rectID);
        }

        if (this.settings.operatorClonedFrom) {
            for (let ri in polymorph_core.rects) {
                if (polymorph_core.rects[ri].settings.p == this.settings.operatorClonedFrom) {
                    //make a clone of it
                    let copyRect = JSON.parse(JSON.stringify(polymorph_core.items[ri]));
                    copyRect._rd.p = container.id;
                    let newRectID = polymorph_core.insertItem(copyRect);
                    polymorph_core.rects[newRectID] = new polymorph_core.rect(newRectID);
                    this.tieRect(newRectID);
                    //also make a clone of all its operators
                    for (let i in polymorph_core.containers) {
                        if (polymorph_core.containers[i].settings.p == ri) {
                            //clone it
                            let copyOp = JSON.parse(JSON.stringify(polymorph_core.items[i]));
                            copyOp._od.p = newRectID;
                            copyOp._od.data.operatorClonedFrom = i;
                            let newContainerID = polymorph_core.insertItem(copyOp);
                            polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
                        }
                    }
                }
            }
            polymorph_core.items[this.settings.operatorClonedFrom]
            delete this.settings.operatorClonedFrom;
        }

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = `Nothing to show yet :3`;
        this.showDialog = function () {
            // update your dialog elements with your settings
        }
        this.dialogUpdateSettings = function () {
            // pull settings and update when your dialog is closed.
        }

        this.remove = () => {
            polymorph_core.rects[this.rectID].remove();
        }
    });
}


;

polymorph_core.registerOperator("deltaLogger", {
    displayName: "Delta Logger",
    section: "Advanced",
    description: "A system for logging a document's changes."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        submissionTransmitter: "(changes)=>console.log(changes);"
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>*{color:white;}</style>
    <h2>Changelog</h2>
    <div class="changelog">
        <p class="nochanges">No changes made so far...</p>
    </div>
    <button style="color:black">Submit changes</button>
    `;

    container.on("updateItem", (d) => {
        //add a change
        let id = d.id;
        if (d.loadProcess) return;
        if (this.rootdiv.querySelector(".nochanges")) this.rootdiv.querySelector(".nochanges").remove();
        if (!this.rootdiv.querySelector(`[data-id="${id}"]`)) {
            this.rootdiv.querySelector(".changelog").appendChild(htmlwrap(`
            <p data-id="${id}">"${id}":${JSON.stringify(polymorph_core.items[id])}</p>`))
        } else {
            this.rootdiv.querySelector(`[data-id="${id}"]`).innerText = `"${id}":${JSON.stringify(polymorph_core.items[id])}`;
        }
    })

    container.on("deleteItem", (d) => {
        let id = d.id;
        //something was deleted. we are logging this deletion with just the word "DELETE"
        if (this.rootdiv.querySelector(".nochanges")) this.rootdiv.querySelector(".nochanges").remove();
        if (!this.rootdiv.querySelector(`[data-id="${id}"]`)) {
            this.rootdiv.querySelector(".changelog").appendChild(htmlwrap(`
            <p>"${id}":{}</p>`))
        } else {
            this.rootdiv.querySelector(`[data-id="${id}"]`).innerText = `"${id}":{}`;
        }
    })
    this.rootdiv.querySelector("button").addEventListener("click", (e) => {
        eval(this.settings.submissionTransmitter)(`{${Array.from(this.rootdiv.querySelector(".changelog").children).map(i => i.innerText).join(",")}}`);
    })

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        submissionTransmitter: new polymorph_core._option({
            div: this.dialogDiv,
            type: "textarea",
            object: this.settings,
            property: "submissionTransmitter",
            label: "Submission function"
        })
    }
    this.showDialog = function () {
        // update your dialog elements with your settings
        for (let i in options) options[i].load();
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});;

/*! jQuery v3.1.0 | (c) jQuery Foundation | jquery.org/license */
!function(a,b){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){"use strict";var c=[],d=a.document,e=Object.getPrototypeOf,f=c.slice,g=c.concat,h=c.push,i=c.indexOf,j={},k=j.toString,l=j.hasOwnProperty,m=l.toString,n=m.call(Object),o={};function p(a,b){b=b||d;var c=b.createElement("script");c.text=a,b.head.appendChild(c).parentNode.removeChild(c)}var q="3.1.0",r=function(a,b){return new r.fn.init(a,b)},s=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,t=/^-ms-/,u=/-([a-z])/g,v=function(a,b){return b.toUpperCase()};r.fn=r.prototype={jquery:q,constructor:r,length:0,toArray:function(){return f.call(this)},get:function(a){return null!=a?a<0?this[a+this.length]:this[a]:f.call(this)},pushStack:function(a){var b=r.merge(this.constructor(),a);return b.prevObject=this,b},each:function(a){return r.each(this,a)},map:function(a){return this.pushStack(r.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(f.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(a<0?b:0);return this.pushStack(c>=0&&c<b?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:h,sort:c.sort,splice:c.splice},r.extend=r.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||r.isFunction(g)||(g={}),h===i&&(g=this,h--);h<i;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(r.isPlainObject(d)||(e=r.isArray(d)))?(e?(e=!1,f=c&&r.isArray(c)?c:[]):f=c&&r.isPlainObject(c)?c:{},g[b]=r.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},r.extend({expando:"jQuery"+(q+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===r.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){var b=r.type(a);return("number"===b||"string"===b)&&!isNaN(a-parseFloat(a))},isPlainObject:function(a){var b,c;return!(!a||"[object Object]"!==k.call(a))&&(!(b=e(a))||(c=l.call(b,"constructor")&&b.constructor,"function"==typeof c&&m.call(c)===n))},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?j[k.call(a)]||"object":typeof a},globalEval:function(a){p(a)},camelCase:function(a){return a.replace(t,"ms-").replace(u,v)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(w(a)){for(c=a.length;d<c;d++)if(b.call(a[d],d,a[d])===!1)break}else for(d in a)if(b.call(a[d],d,a[d])===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(s,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(w(Object(a))?r.merge(c,"string"==typeof a?[a]:a):h.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:i.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;d<c;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;f<g;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,f=0,h=[];if(w(a))for(d=a.length;f<d;f++)e=b(a[f],f,c),null!=e&&h.push(e);else for(f in a)e=b(a[f],f,c),null!=e&&h.push(e);return g.apply([],h)},guid:1,proxy:function(a,b){var c,d,e;if("string"==typeof b&&(c=a[b],b=a,a=c),r.isFunction(a))return d=f.call(arguments,2),e=function(){return a.apply(b||this,d.concat(f.call(arguments)))},e.guid=a.guid=a.guid||r.guid++,e},now:Date.now,support:o}),"function"==typeof Symbol&&(r.fn[Symbol.iterator]=c[Symbol.iterator]),r.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){j["[object "+b+"]"]=b.toLowerCase()});function w(a){var b=!!a&&"length"in a&&a.length,c=r.type(a);return"function"!==c&&!r.isWindow(a)&&("array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a)}var x=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C={}.hasOwnProperty,D=[],E=D.pop,F=D.push,G=D.push,H=D.slice,I=function(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},J="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",K="[\\x20\\t\\r\\n\\f]",L="(?:\\\\.|[\\w-]|[^\0-\\xa0])+",M="\\["+K+"*("+L+")(?:"+K+"*([*^$|!~]?=)"+K+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+L+"))|)"+K+"*\\]",N=":("+L+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+M+")*)|.*)\\)|)",O=new RegExp(K+"+","g"),P=new RegExp("^"+K+"+|((?:^|[^\\\\])(?:\\\\.)*)"+K+"+$","g"),Q=new RegExp("^"+K+"*,"+K+"*"),R=new RegExp("^"+K+"*([>+~]|"+K+")"+K+"*"),S=new RegExp("="+K+"*([^\\]'\"]*?)"+K+"*\\]","g"),T=new RegExp(N),U=new RegExp("^"+L+"$"),V={ID:new RegExp("^#("+L+")"),CLASS:new RegExp("^\\.("+L+")"),TAG:new RegExp("^("+L+"|[*])"),ATTR:new RegExp("^"+M),PSEUDO:new RegExp("^"+N),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+K+"*(even|odd|(([+-]|)(\\d*)n|)"+K+"*(?:([+-]|)"+K+"*(\\d+)|))"+K+"*\\)|)","i"),bool:new RegExp("^(?:"+J+")$","i"),needsContext:new RegExp("^"+K+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+K+"*((?:-\\d)?\\d*)"+K+"*\\)|)(?=[^-]|$)","i")},W=/^(?:input|select|textarea|button)$/i,X=/^h\d$/i,Y=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,$=/[+~]/,_=new RegExp("\\\\([\\da-f]{1,6}"+K+"?|("+K+")|.)","ig"),aa=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:d<0?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ba=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g,ca=function(a,b){return b?"\0"===a?"\ufffd":a.slice(0,-1)+"\\"+a.charCodeAt(a.length-1).toString(16)+" ":"\\"+a},da=function(){m()},ea=ta(function(a){return a.disabled===!0},{dir:"parentNode",next:"legend"});try{G.apply(D=H.call(v.childNodes),v.childNodes),D[v.childNodes.length].nodeType}catch(fa){G={apply:D.length?function(a,b){F.apply(a,H.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s=b&&b.ownerDocument,w=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==w&&9!==w&&11!==w)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==w&&(l=Z.exec(a)))if(f=l[1]){if(9===w){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(s&&(j=s.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(l[2])return G.apply(d,b.getElementsByTagName(a)),d;if((f=l[3])&&c.getElementsByClassName&&b.getElementsByClassName)return G.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==w)s=b,r=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(ba,ca):b.setAttribute("id",k=u),o=g(a),h=o.length;while(h--)o[h]="#"+k+" "+sa(o[h]);r=o.join(","),s=$.test(a)&&qa(b.parentNode)||b}if(r)try{return G.apply(d,s.querySelectorAll(r)),d}catch(x){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(P,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("fieldset");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&a.sourceIndex-b.sourceIndex;if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return function(b){return"label"in b&&b.disabled===a||"form"in b&&b.disabled===a||"form"in b&&b.disabled===!1&&(b.isDisabled===a||b.isDisabled!==!a&&("label"in b||!ea(b))!==a)}}function pa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function qa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return!!b&&"HTML"!==b.nodeName},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),v!==n&&(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Y.test(n.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(_,aa);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(_,aa);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){if("undefined"!=typeof b.getElementsByClassName&&p)return b.getElementsByClassName(a)},r=[],q=[],(c.qsa=Y.test(n.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+K+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+K+"*(?:value|"+J+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){a.innerHTML="<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+K+"*[*^$|!~]?="),2!==a.querySelectorAll(":enabled").length&&q.push(":enabled",":disabled"),o.appendChild(a).disabled=!0,2!==a.querySelectorAll(":disabled").length&&q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Y.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"*"),s.call(a,"[s!='']:x"),r.push("!=",N)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Y.test(o.compareDocumentPosition),t=b||Y.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?I(k,a)-I(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?I(k,a)-I(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?la(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(S,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&C.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.escape=function(a){return(a+"").replace(ba,ca)},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:V,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(_,aa),a[3]=(a[3]||a[4]||a[5]||"").replace(_,aa),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return V.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&T.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(_,aa).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+K+")"+a+"("+K+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:!b||(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(O," ")+" ").indexOf(c)>-1:"|="===b&&(e===c||e.slice(0,c.length+1)===c+"-"))}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=I(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(P,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(_,aa),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return U.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(_,aa).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:oa(!1),disabled:oa(!0),checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return X.test(a.nodeName)},input:function(a){return W.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:pa(function(){return[0]}),last:pa(function(a,b){return[b-1]}),eq:pa(function(a,b,c){return[c<0?c+b:c]}),even:pa(function(a,b){for(var c=0;c<b;c+=2)a.push(c);return a}),odd:pa(function(a,b){for(var c=1;c<b;c+=2)a.push(c);return a}),lt:pa(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;)a.push(d);return a}),gt:pa(function(a,b,c){for(var d=c<0?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function ra(){}ra.prototype=d.filters=d.pseudos,d.setFilters=new ra,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){c&&!(e=Q.exec(h))||(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=R.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(P," ")}),h=h.slice(c.length));for(g in d.filter)!(e=V[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function sa(a){for(var b=0,c=a.length,d="";b<c;b++)d+=a[b].value;return d}function ta(a,b,c){var d=b.dir,e=b.next,f=e||d,g=c&&"parentNode"===f,h=x++;return b.first?function(b,c,e){while(b=b[d])if(1===b.nodeType||g)return a(b,c,e)}:function(b,c,i){var j,k,l,m=[w,h];if(i){while(b=b[d])if((1===b.nodeType||g)&&a(b,c,i))return!0}else while(b=b[d])if(1===b.nodeType||g)if(l=b[u]||(b[u]={}),k=l[b.uniqueID]||(l[b.uniqueID]={}),e&&e===b.nodeName.toLowerCase())b=b[d]||b;else{if((j=k[f])&&j[0]===w&&j[1]===h)return m[2]=j[2];if(k[f]=m,m[2]=a(b,c,i))return!0}}}function ua(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function va(a,b,c){for(var d=0,e=b.length;d<e;d++)ga(a,b[d],c);return c}function wa(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;h<i;h++)(f=a[h])&&(c&&!c(f,d,e)||(g.push(f),j&&b.push(h)));return g}function xa(a,b,c,d,e,f){return d&&!d[u]&&(d=xa(d)),e&&!e[u]&&(e=xa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||va(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:wa(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=wa(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?I(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=wa(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):G.apply(g,r)})}function ya(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ta(function(a){return a===b},h,!0),l=ta(function(a){return I(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];i<f;i++)if(c=d.relative[a[i].type])m=[ta(ua(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;e<f;e++)if(d.relative[a[e].type])break;return xa(i>1&&ua(m),i>1&&sa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(P,"$1"),c,i<e&&ya(a.slice(i,e)),e<f&&ya(a=a.slice(e)),e<f&&sa(a))}m.push(c)}return ua(m)}function za(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=E.call(i));u=wa(u)}G.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&ga.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=ya(b[c]),f[u]?d.push(f):e.push(f);f=A(a,za(e,d)),f.selector=a}return f},i=ga.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(_,aa),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=V.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(_,aa),$.test(j[0].type)&&qa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&sa(j),!a)return G.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,!b||$.test(a)&&qa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("fieldset"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){if(!c)return a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){if(!c&&"input"===a.nodeName.toLowerCase())return a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(J,function(a,b,c){var d;if(!c)return a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);r.find=x,r.expr=x.selectors,r.expr[":"]=r.expr.pseudos,r.uniqueSort=r.unique=x.uniqueSort,r.text=x.getText,r.isXMLDoc=x.isXML,r.contains=x.contains,r.escapeSelector=x.escape;var y=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&r(a).is(c))break;d.push(a)}return d},z=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},A=r.expr.match.needsContext,B=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i,C=/^.[^:#\[\.,]*$/;function D(a,b,c){if(r.isFunction(b))return r.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return r.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(C.test(b))return r.filter(b,a,c);b=r.filter(b,a)}return r.grep(a,function(a){return i.call(b,a)>-1!==c&&1===a.nodeType})}r.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?r.find.matchesSelector(d,a)?[d]:[]:r.find.matches(a,r.grep(b,function(a){return 1===a.nodeType}))},r.fn.extend({find:function(a){var b,c,d=this.length,e=this;if("string"!=typeof a)return this.pushStack(r(a).filter(function(){for(b=0;b<d;b++)if(r.contains(e[b],this))return!0}));for(c=this.pushStack([]),b=0;b<d;b++)r.find(a,e[b],c);return d>1?r.uniqueSort(c):c},filter:function(a){return this.pushStack(D(this,a||[],!1))},not:function(a){return this.pushStack(D(this,a||[],!0))},is:function(a){return!!D(this,"string"==typeof a&&A.test(a)?r(a):a||[],!1).length}});var E,F=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,G=r.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||E,"string"==typeof a){if(e="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:F.exec(a),!e||!e[1]&&b)return!b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof r?b[0]:b,r.merge(this,r.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),B.test(e[1])&&r.isPlainObject(b))for(e in b)r.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}return f=d.getElementById(e[2]),f&&(this[0]=f,this.length=1),this}return a.nodeType?(this[0]=a,this.length=1,this):r.isFunction(a)?void 0!==c.ready?c.ready(a):a(r):r.makeArray(a,this)};G.prototype=r.fn,E=r(d);var H=/^(?:parents|prev(?:Until|All))/,I={children:!0,contents:!0,next:!0,prev:!0};r.fn.extend({has:function(a){var b=r(a,this),c=b.length;return this.filter(function(){for(var a=0;a<c;a++)if(r.contains(this,b[a]))return!0})},closest:function(a,b){var c,d=0,e=this.length,f=[],g="string"!=typeof a&&r(a);if(!A.test(a))for(;d<e;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&r.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?r.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?i.call(r(a),this[0]):i.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(r.uniqueSort(r.merge(this.get(),r(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function J(a,b){while((a=a[b])&&1!==a.nodeType);return a}r.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return y(a,"parentNode")},parentsUntil:function(a,b,c){return y(a,"parentNode",c)},next:function(a){return J(a,"nextSibling")},prev:function(a){return J(a,"previousSibling")},nextAll:function(a){return y(a,"nextSibling")},prevAll:function(a){return y(a,"previousSibling")},nextUntil:function(a,b,c){return y(a,"nextSibling",c)},prevUntil:function(a,b,c){return y(a,"previousSibling",c)},siblings:function(a){return z((a.parentNode||{}).firstChild,a)},children:function(a){return z(a.firstChild)},contents:function(a){return a.contentDocument||r.merge([],a.childNodes)}},function(a,b){r.fn[a]=function(c,d){var e=r.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=r.filter(d,e)),this.length>1&&(I[a]||r.uniqueSort(e),H.test(a)&&e.reverse()),this.pushStack(e)}});var K=/\S+/g;function L(a){var b={};return r.each(a.match(K)||[],function(a,c){b[c]=!0}),b}r.Callbacks=function(a){a="string"==typeof a?L(a):r.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)f[h].apply(c[0],c[1])===!1&&a.stopOnFalse&&(h=f.length,c=!1)}a.memory||(c=!1),b=!1,e&&(f=c?[]:"")},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function d(b){r.each(b,function(b,c){r.isFunction(c)?a.unique&&j.has(c)||f.push(c):c&&c.length&&"string"!==r.type(c)&&d(c)})}(arguments),c&&!b&&i()),this},remove:function(){return r.each(arguments,function(a,b){var c;while((c=r.inArray(b,f,c))>-1)f.splice(c,1),c<=h&&h--}),this},has:function(a){return a?r.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return!f},lock:function(){return e=g=[],c||b||(f=c=""),this},locked:function(){return!!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return!!d}};return j};function M(a){return a}function N(a){throw a}function O(a,b,c){var d;try{a&&r.isFunction(d=a.promise)?d.call(a).done(b).fail(c):a&&r.isFunction(d=a.then)?d.call(a,b,c):b.call(void 0,a)}catch(a){c.call(void 0,a)}}r.extend({Deferred:function(b){var c=[["notify","progress",r.Callbacks("memory"),r.Callbacks("memory"),2],["resolve","done",r.Callbacks("once memory"),r.Callbacks("once memory"),0,"resolved"],["reject","fail",r.Callbacks("once memory"),r.Callbacks("once memory"),1,"rejected"]],d="pending",e={state:function(){return d},always:function(){return f.done(arguments).fail(arguments),this},"catch":function(a){return e.then(null,a)},pipe:function(){var a=arguments;return r.Deferred(function(b){r.each(c,function(c,d){var e=r.isFunction(a[d[4]])&&a[d[4]];f[d[1]](function(){var a=e&&e.apply(this,arguments);a&&r.isFunction(a.promise)?a.promise().progress(b.notify).done(b.resolve).fail(b.reject):b[d[0]+"With"](this,e?[a]:arguments)})}),a=null}).promise()},then:function(b,d,e){var f=0;function g(b,c,d,e){return function(){var h=this,i=arguments,j=function(){var a,j;if(!(b<f)){if(a=d.apply(h,i),a===c.promise())throw new TypeError("Thenable self-resolution");j=a&&("object"==typeof a||"function"==typeof a)&&a.then,r.isFunction(j)?e?j.call(a,g(f,c,M,e),g(f,c,N,e)):(f++,j.call(a,g(f,c,M,e),g(f,c,N,e),g(f,c,M,c.notifyWith))):(d!==M&&(h=void 0,i=[a]),(e||c.resolveWith)(h,i))}},k=e?j:function(){try{j()}catch(a){r.Deferred.exceptionHook&&r.Deferred.exceptionHook(a,k.stackTrace),b+1>=f&&(d!==N&&(h=void 0,i=[a]),c.rejectWith(h,i))}};b?k():(r.Deferred.getStackHook&&(k.stackTrace=r.Deferred.getStackHook()),a.setTimeout(k))}}return r.Deferred(function(a){c[0][3].add(g(0,a,r.isFunction(e)?e:M,a.notifyWith)),c[1][3].add(g(0,a,r.isFunction(b)?b:M)),c[2][3].add(g(0,a,r.isFunction(d)?d:N))}).promise()},promise:function(a){return null!=a?r.extend(a,e):e}},f={};return r.each(c,function(a,b){var g=b[2],h=b[5];e[b[1]]=g.add,h&&g.add(function(){d=h},c[3-a][2].disable,c[0][2].lock),g.add(b[3].fire),f[b[0]]=function(){return f[b[0]+"With"](this===f?void 0:this,arguments),this},f[b[0]+"With"]=g.fireWith}),e.promise(f),b&&b.call(f,f),f},when:function(a){var b=arguments.length,c=b,d=Array(c),e=f.call(arguments),g=r.Deferred(),h=function(a){return function(c){d[a]=this,e[a]=arguments.length>1?f.call(arguments):c,--b||g.resolveWith(d,e)}};if(b<=1&&(O(a,g.done(h(c)).resolve,g.reject),"pending"===g.state()||r.isFunction(e[c]&&e[c].then)))return g.then();while(c--)O(e[c],h(c),g.reject);return g.promise()}});var P=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;r.Deferred.exceptionHook=function(b,c){a.console&&a.console.warn&&b&&P.test(b.name)&&a.console.warn("jQuery.Deferred exception: "+b.message,b.stack,c)},r.readyException=function(b){a.setTimeout(function(){throw b})};var Q=r.Deferred();r.fn.ready=function(a){return Q.then(a)["catch"](function(a){r.readyException(a)}),this},r.extend({isReady:!1,readyWait:1,holdReady:function(a){a?r.readyWait++:r.ready(!0)},ready:function(a){(a===!0?--r.readyWait:r.isReady)||(r.isReady=!0,a!==!0&&--r.readyWait>0||Q.resolveWith(d,[r]))}}),r.ready.then=Q.then;function R(){d.removeEventListener("DOMContentLoaded",R),a.removeEventListener("load",R),r.ready()}"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll?a.setTimeout(r.ready):(d.addEventListener("DOMContentLoaded",R),a.addEventListener("load",R));var S=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===r.type(c)){e=!0;for(h in c)S(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,
r.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(r(a),c)})),b))for(;h<i;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},T=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function U(){this.expando=r.expando+U.uid++}U.uid=1,U.prototype={cache:function(a){var b=a[this.expando];return b||(b={},T(a)&&(a.nodeType?a[this.expando]=b:Object.defineProperty(a,this.expando,{value:b,configurable:!0}))),b},set:function(a,b,c){var d,e=this.cache(a);if("string"==typeof b)e[r.camelCase(b)]=c;else for(d in b)e[r.camelCase(d)]=b[d];return e},get:function(a,b){return void 0===b?this.cache(a):a[this.expando]&&a[this.expando][r.camelCase(b)]},access:function(a,b,c){return void 0===b||b&&"string"==typeof b&&void 0===c?this.get(a,b):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d=a[this.expando];if(void 0!==d){if(void 0!==b){r.isArray(b)?b=b.map(r.camelCase):(b=r.camelCase(b),b=b in d?[b]:b.match(K)||[]),c=b.length;while(c--)delete d[b[c]]}(void 0===b||r.isEmptyObject(d))&&(a.nodeType?a[this.expando]=void 0:delete a[this.expando])}},hasData:function(a){var b=a[this.expando];return void 0!==b&&!r.isEmptyObject(b)}};var V=new U,W=new U,X=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,Y=/[A-Z]/g;function Z(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(Y,"-$&").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c||"false"!==c&&("null"===c?null:+c+""===c?+c:X.test(c)?JSON.parse(c):c)}catch(e){}W.set(a,b,c)}else c=void 0;return c}r.extend({hasData:function(a){return W.hasData(a)||V.hasData(a)},data:function(a,b,c){return W.access(a,b,c)},removeData:function(a,b){W.remove(a,b)},_data:function(a,b,c){return V.access(a,b,c)},_removeData:function(a,b){V.remove(a,b)}}),r.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=W.get(f),1===f.nodeType&&!V.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=r.camelCase(d.slice(5)),Z(f,d,e[d])));V.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){W.set(this,a)}):S(this,function(b){var c;if(f&&void 0===b){if(c=W.get(f,a),void 0!==c)return c;if(c=Z(f,a),void 0!==c)return c}else this.each(function(){W.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){W.remove(this,a)})}}),r.extend({queue:function(a,b,c){var d;if(a)return b=(b||"fx")+"queue",d=V.get(a,b),c&&(!d||r.isArray(c)?d=V.access(a,b,r.makeArray(c)):d.push(c)),d||[]},dequeue:function(a,b){b=b||"fx";var c=r.queue(a,b),d=c.length,e=c.shift(),f=r._queueHooks(a,b),g=function(){r.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return V.get(a,c)||V.access(a,c,{empty:r.Callbacks("once memory").add(function(){V.remove(a,[b+"queue",c])})})}}),r.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?r.queue(this[0],a):void 0===b?this:this.each(function(){var c=r.queue(this,a,b);r._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&r.dequeue(this,a)})},dequeue:function(a){return this.each(function(){r.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=r.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=V.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var $=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,_=new RegExp("^(?:([+-])=|)("+$+")([a-z%]*)$","i"),aa=["Top","Right","Bottom","Left"],ba=function(a,b){return a=b||a,"none"===a.style.display||""===a.style.display&&r.contains(a.ownerDocument,a)&&"none"===r.css(a,"display")},ca=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};function da(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return r.css(a,b,"")},i=h(),j=c&&c[3]||(r.cssNumber[b]?"":"px"),k=(r.cssNumber[b]||"px"!==j&&+i)&&_.exec(r.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do f=f||".5",k/=f,r.style(a,b,k+j);while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var ea={};function fa(a){var b,c=a.ownerDocument,d=a.nodeName,e=ea[d];return e?e:(b=c.body.appendChild(c.createElement(d)),e=r.css(b,"display"),b.parentNode.removeChild(b),"none"===e&&(e="block"),ea[d]=e,e)}function ga(a,b){for(var c,d,e=[],f=0,g=a.length;f<g;f++)d=a[f],d.style&&(c=d.style.display,b?("none"===c&&(e[f]=V.get(d,"display")||null,e[f]||(d.style.display="")),""===d.style.display&&ba(d)&&(e[f]=fa(d))):"none"!==c&&(e[f]="none",V.set(d,"display",c)));for(f=0;f<g;f++)null!=e[f]&&(a[f].style.display=e[f]);return a}r.fn.extend({show:function(){return ga(this,!0)},hide:function(){return ga(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){ba(this)?r(this).show():r(this).hide()})}});var ha=/^(?:checkbox|radio)$/i,ia=/<([a-z][^\/\0>\x20\t\r\n\f]+)/i,ja=/^$|\/(?:java|ecma)script/i,ka={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ka.optgroup=ka.option,ka.tbody=ka.tfoot=ka.colgroup=ka.caption=ka.thead,ka.th=ka.td;function la(a,b){var c="undefined"!=typeof a.getElementsByTagName?a.getElementsByTagName(b||"*"):"undefined"!=typeof a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&r.nodeName(a,b)?r.merge([a],c):c}function ma(a,b){for(var c=0,d=a.length;c<d;c++)V.set(a[c],"globalEval",!b||V.get(b[c],"globalEval"))}var na=/<|&#?\w+;/;function oa(a,b,c,d,e){for(var f,g,h,i,j,k,l=b.createDocumentFragment(),m=[],n=0,o=a.length;n<o;n++)if(f=a[n],f||0===f)if("object"===r.type(f))r.merge(m,f.nodeType?[f]:f);else if(na.test(f)){g=g||l.appendChild(b.createElement("div")),h=(ia.exec(f)||["",""])[1].toLowerCase(),i=ka[h]||ka._default,g.innerHTML=i[1]+r.htmlPrefilter(f)+i[2],k=i[0];while(k--)g=g.lastChild;r.merge(m,g.childNodes),g=l.firstChild,g.textContent=""}else m.push(b.createTextNode(f));l.textContent="",n=0;while(f=m[n++])if(d&&r.inArray(f,d)>-1)e&&e.push(f);else if(j=r.contains(f.ownerDocument,f),g=la(l.appendChild(f),"script"),j&&ma(g),c){k=0;while(f=g[k++])ja.test(f.type||"")&&c.push(f)}return l}!function(){var a=d.createDocumentFragment(),b=a.appendChild(d.createElement("div")),c=d.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),o.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",o.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var pa=d.documentElement,qa=/^key/,ra=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,sa=/^([^.]*)(?:\.(.+)|)/;function ta(){return!0}function ua(){return!1}function va(){try{return d.activeElement}catch(a){}}function wa(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)wa(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),e===!1)e=ua;else if(!e)return a;return 1===f&&(g=e,e=function(a){return r().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=r.guid++)),a.each(function(){r.event.add(this,b,e,d,c)})}r.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=V.get(a);if(q){c.handler&&(f=c,c=f.handler,e=f.selector),e&&r.find.matchesSelector(pa,e),c.guid||(c.guid=r.guid++),(i=q.events)||(i=q.events={}),(g=q.handle)||(g=q.handle=function(b){return"undefined"!=typeof r&&r.event.triggered!==b.type?r.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(K)||[""],j=b.length;while(j--)h=sa.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n&&(l=r.event.special[n]||{},n=(e?l.delegateType:l.bindType)||n,l=r.event.special[n]||{},k=r.extend({type:n,origType:p,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&r.expr.match.needsContext.test(e),namespace:o.join(".")},f),(m=i[n])||(m=i[n]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,o,g)!==!1||a.addEventListener&&a.addEventListener(n,g)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),r.event.global[n]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q=V.hasData(a)&&V.get(a);if(q&&(i=q.events)){b=(b||"").match(K)||[""],j=b.length;while(j--)if(h=sa.exec(b[j])||[],n=p=h[1],o=(h[2]||"").split(".").sort(),n){l=r.event.special[n]||{},n=(d?l.delegateType:l.bindType)||n,m=i[n]||[],h=h[2]&&new RegExp("(^|\\.)"+o.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&p!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,o,q.handle)!==!1||r.removeEvent(a,n,q.handle),delete i[n])}else for(n in i)r.event.remove(a,n+b[j],c,d,!0);r.isEmptyObject(i)&&V.remove(a,"handle events")}},dispatch:function(a){var b=r.event.fix(a),c,d,e,f,g,h,i=new Array(arguments.length),j=(V.get(this,"events")||{})[b.type]||[],k=r.event.special[b.type]||{};for(i[0]=b,c=1;c<arguments.length;c++)i[c]=arguments[c];if(b.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,b)!==!1){h=r.event.handlers.call(this,b,j),c=0;while((f=h[c++])&&!b.isPropagationStopped()){b.currentTarget=f.elem,d=0;while((g=f.handlers[d++])&&!b.isImmediatePropagationStopped())b.rnamespace&&!b.rnamespace.test(g.namespace)||(b.handleObj=g,b.data=g.data,e=((r.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(b.result=e)===!1&&(b.preventDefault(),b.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,b),b.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&("click"!==a.type||isNaN(a.button)||a.button<1))for(;i!==this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(d=[],c=0;c<h;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?r(e,this).index(i)>-1:r.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},addProp:function(a,b){Object.defineProperty(r.Event.prototype,a,{enumerable:!0,configurable:!0,get:r.isFunction(b)?function(){if(this.originalEvent)return b(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[a]},set:function(b){Object.defineProperty(this,a,{enumerable:!0,configurable:!0,writable:!0,value:b})}})},fix:function(a){return a[r.expando]?a:new r.Event(a)},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==va()&&this.focus)return this.focus(),!1},delegateType:"focusin"},blur:{trigger:function(){if(this===va()&&this.blur)return this.blur(),!1},delegateType:"focusout"},click:{trigger:function(){if("checkbox"===this.type&&this.click&&r.nodeName(this,"input"))return this.click(),!1},_default:function(a){return r.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}}},r.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c)},r.Event=function(a,b){return this instanceof r.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ta:ua,this.target=a.target&&3===a.target.nodeType?a.target.parentNode:a.target,this.currentTarget=a.currentTarget,this.relatedTarget=a.relatedTarget):this.type=a,b&&r.extend(this,b),this.timeStamp=a&&a.timeStamp||r.now(),void(this[r.expando]=!0)):new r.Event(a,b)},r.Event.prototype={constructor:r.Event,isDefaultPrevented:ua,isPropagationStopped:ua,isImmediatePropagationStopped:ua,isSimulated:!1,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ta,a&&!this.isSimulated&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ta,a&&!this.isSimulated&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ta,a&&!this.isSimulated&&a.stopImmediatePropagation(),this.stopPropagation()}},r.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:function(a){var b=a.button;return null==a.which&&qa.test(a.type)?null!=a.charCode?a.charCode:a.keyCode:!a.which&&void 0!==b&&ra.test(a.type)?1&b?1:2&b?3:4&b?2:0:a.which}},r.event.addProp),r.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){r.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return e&&(e===d||r.contains(d,e))||(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),r.fn.extend({on:function(a,b,c,d){return wa(this,a,b,c,d)},one:function(a,b,c,d){return wa(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,r(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return b!==!1&&"function"!=typeof b||(c=b,b=void 0),c===!1&&(c=ua),this.each(function(){r.event.remove(this,a,c,b)})}});var xa=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,ya=/<script|<style|<link/i,za=/checked\s*(?:[^=]|=\s*.checked.)/i,Aa=/^true\/(.*)/,Ba=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function Ca(a,b){return r.nodeName(a,"table")&&r.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a:a}function Da(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function Ea(a){var b=Aa.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Fa(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(V.hasData(a)&&(f=V.access(a),g=V.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;c<d;c++)r.event.add(b,e,j[e][c])}W.hasData(a)&&(h=W.access(a),i=r.extend({},h),W.set(b,i))}}function Ga(a,b){var c=b.nodeName.toLowerCase();"input"===c&&ha.test(a.type)?b.checked=a.checked:"input"!==c&&"textarea"!==c||(b.defaultValue=a.defaultValue)}function Ha(a,b,c,d){b=g.apply([],b);var e,f,h,i,j,k,l=0,m=a.length,n=m-1,q=b[0],s=r.isFunction(q);if(s||m>1&&"string"==typeof q&&!o.checkClone&&za.test(q))return a.each(function(e){var f=a.eq(e);s&&(b[0]=q.call(this,e,f.html())),Ha(f,b,c,d)});if(m&&(e=oa(b,a[0].ownerDocument,!1,a,d),f=e.firstChild,1===e.childNodes.length&&(e=f),f||d)){for(h=r.map(la(e,"script"),Da),i=h.length;l<m;l++)j=e,l!==n&&(j=r.clone(j,!0,!0),i&&r.merge(h,la(j,"script"))),c.call(a[l],j,l);if(i)for(k=h[h.length-1].ownerDocument,r.map(h,Ea),l=0;l<i;l++)j=h[l],ja.test(j.type||"")&&!V.access(j,"globalEval")&&r.contains(k,j)&&(j.src?r._evalUrl&&r._evalUrl(j.src):p(j.textContent.replace(Ba,""),k))}return a}function Ia(a,b,c){for(var d,e=b?r.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||r.cleanData(la(d)),d.parentNode&&(c&&r.contains(d.ownerDocument,d)&&ma(la(d,"script")),d.parentNode.removeChild(d));return a}r.extend({htmlPrefilter:function(a){return a.replace(xa,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=r.contains(a.ownerDocument,a);if(!(o.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||r.isXMLDoc(a)))for(g=la(h),f=la(a),d=0,e=f.length;d<e;d++)Ga(f[d],g[d]);if(b)if(c)for(f=f||la(a),g=g||la(h),d=0,e=f.length;d<e;d++)Fa(f[d],g[d]);else Fa(a,h);return g=la(h,"script"),g.length>0&&ma(g,!i&&la(a,"script")),h},cleanData:function(a){for(var b,c,d,e=r.event.special,f=0;void 0!==(c=a[f]);f++)if(T(c)){if(b=c[V.expando]){if(b.events)for(d in b.events)e[d]?r.event.remove(c,d):r.removeEvent(c,d,b.handle);c[V.expando]=void 0}c[W.expando]&&(c[W.expando]=void 0)}}}),r.fn.extend({detach:function(a){return Ia(this,a,!0)},remove:function(a){return Ia(this,a)},text:function(a){return S(this,function(a){return void 0===a?r.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=a)})},null,a,arguments.length)},append:function(){return Ha(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ca(this,a);b.appendChild(a)}})},prepend:function(){return Ha(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ca(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return Ha(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return Ha(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(r.cleanData(la(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null!=a&&a,b=null==b?a:b,this.map(function(){return r.clone(this,a,b)})},html:function(a){return S(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!ya.test(a)&&!ka[(ia.exec(a)||["",""])[1].toLowerCase()]){a=r.htmlPrefilter(a);try{for(;c<d;c++)b=this[c]||{},1===b.nodeType&&(r.cleanData(la(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=[];return Ha(this,arguments,function(b){var c=this.parentNode;r.inArray(this,a)<0&&(r.cleanData(la(this)),c&&c.replaceChild(b,this))},a)}}),r.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){r.fn[a]=function(a){for(var c,d=[],e=r(a),f=e.length-1,g=0;g<=f;g++)c=g===f?this:this.clone(!0),r(e[g])[b](c),h.apply(d,c.get());return this.pushStack(d)}});var Ja=/^margin/,Ka=new RegExp("^("+$+")(?!px)[a-z%]+$","i"),La=function(b){var c=b.ownerDocument.defaultView;return c&&c.opener||(c=a),c.getComputedStyle(b)};!function(){function b(){if(i){i.style.cssText="box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",i.innerHTML="",pa.appendChild(h);var b=a.getComputedStyle(i);c="1%"!==b.top,g="2px"===b.marginLeft,e="4px"===b.width,i.style.marginRight="50%",f="4px"===b.marginRight,pa.removeChild(h),i=null}}var c,e,f,g,h=d.createElement("div"),i=d.createElement("div");i.style&&(i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",o.clearCloneStyle="content-box"===i.style.backgroundClip,h.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",h.appendChild(i),r.extend(o,{pixelPosition:function(){return b(),c},boxSizingReliable:function(){return b(),e},pixelMarginRight:function(){return b(),f},reliableMarginLeft:function(){return b(),g}}))}();function Ma(a,b,c){var d,e,f,g,h=a.style;return c=c||La(a),c&&(g=c.getPropertyValue(b)||c[b],""!==g||r.contains(a.ownerDocument,a)||(g=r.style(a,b)),!o.pixelMarginRight()&&Ka.test(g)&&Ja.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function Na(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Oa=/^(none|table(?!-c[ea]).+)/,Pa={position:"absolute",visibility:"hidden",display:"block"},Qa={letterSpacing:"0",fontWeight:"400"},Ra=["Webkit","Moz","ms"],Sa=d.createElement("div").style;function Ta(a){if(a in Sa)return a;var b=a[0].toUpperCase()+a.slice(1),c=Ra.length;while(c--)if(a=Ra[c]+b,a in Sa)return a}function Ua(a,b,c){var d=_.exec(b);return d?Math.max(0,d[2]-(c||0))+(d[3]||"px"):b}function Va(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;f<4;f+=2)"margin"===c&&(g+=r.css(a,c+aa[f],!0,e)),d?("content"===c&&(g-=r.css(a,"padding"+aa[f],!0,e)),"margin"!==c&&(g-=r.css(a,"border"+aa[f]+"Width",!0,e))):(g+=r.css(a,"padding"+aa[f],!0,e),"padding"!==c&&(g+=r.css(a,"border"+aa[f]+"Width",!0,e)));return g}function Wa(a,b,c){var d,e=!0,f=La(a),g="border-box"===r.css(a,"boxSizing",!1,f);if(a.getClientRects().length&&(d=a.getBoundingClientRect()[b]),d<=0||null==d){if(d=Ma(a,b,f),(d<0||null==d)&&(d=a.style[b]),Ka.test(d))return d;e=g&&(o.boxSizingReliable()||d===a.style[b]),d=parseFloat(d)||0}return d+Va(a,b,c||(g?"border":"content"),e,f)+"px"}r.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Ma(a,"opacity");return""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=r.camelCase(b),i=a.style;return b=r.cssProps[h]||(r.cssProps[h]=Ta(h)||h),g=r.cssHooks[b]||r.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=_.exec(c))&&e[1]&&(c=da(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(r.cssNumber[h]?"":"px")),o.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=r.camelCase(b);return b=r.cssProps[h]||(r.cssProps[h]=Ta(h)||h),g=r.cssHooks[b]||r.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=Ma(a,b,d)),"normal"===e&&b in Qa&&(e=Qa[b]),""===c||c?(f=parseFloat(e),c===!0||isFinite(f)?f||0:e):e}}),r.each(["height","width"],function(a,b){r.cssHooks[b]={get:function(a,c,d){if(c)return!Oa.test(r.css(a,"display"))||a.getClientRects().length&&a.getBoundingClientRect().width?Wa(a,b,d):ca(a,Pa,function(){return Wa(a,b,d)})},set:function(a,c,d){var e,f=d&&La(a),g=d&&Va(a,b,d,"border-box"===r.css(a,"boxSizing",!1,f),f);return g&&(e=_.exec(c))&&"px"!==(e[3]||"px")&&(a.style[b]=c,c=r.css(a,b)),Ua(a,c,g)}}}),r.cssHooks.marginLeft=Na(o.reliableMarginLeft,function(a,b){if(b)return(parseFloat(Ma(a,"marginLeft"))||a.getBoundingClientRect().left-ca(a,{marginLeft:0},function(){return a.getBoundingClientRect().left}))+"px"}),r.each({margin:"",padding:"",border:"Width"},function(a,b){r.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];d<4;d++)e[a+aa[d]+b]=f[d]||f[d-2]||f[0];return e}},Ja.test(a)||(r.cssHooks[a+b].set=Ua)}),r.fn.extend({css:function(a,b){return S(this,function(a,b,c){var d,e,f={},g=0;if(r.isArray(b)){for(d=La(a),e=b.length;g<e;g++)f[b[g]]=r.css(a,b[g],!1,d);return f}return void 0!==c?r.style(a,b,c):r.css(a,b)},a,b,arguments.length>1)}});function Xa(a,b,c,d,e){return new Xa.prototype.init(a,b,c,d,e)}r.Tween=Xa,Xa.prototype={constructor:Xa,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||r.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(r.cssNumber[c]?"":"px")},cur:function(){var a=Xa.propHooks[this.prop];return a&&a.get?a.get(this):Xa.propHooks._default.get(this)},run:function(a){var b,c=Xa.propHooks[this.prop];return this.options.duration?this.pos=b=r.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Xa.propHooks._default.set(this),this}},Xa.prototype.init.prototype=Xa.prototype,Xa.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=r.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){r.fx.step[a.prop]?r.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[r.cssProps[a.prop]]&&!r.cssHooks[a.prop]?a.elem[a.prop]=a.now:r.style(a.elem,a.prop,a.now+a.unit)}}},Xa.propHooks.scrollTop=Xa.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},r.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},_default:"swing"},r.fx=Xa.prototype.init,r.fx.step={};var Ya,Za,$a=/^(?:toggle|show|hide)$/,_a=/queueHooks$/;function ab(){Za&&(a.requestAnimationFrame(ab),r.fx.tick())}function bb(){return a.setTimeout(function(){Ya=void 0}),Ya=r.now()}function cb(a,b){var c,d=0,e={height:a};for(b=b?1:0;d<4;d+=2-b)c=aa[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function db(a,b,c){for(var d,e=(gb.tweeners[b]||[]).concat(gb.tweeners["*"]),f=0,g=e.length;f<g;f++)if(d=e[f].call(c,b,a))return d}function eb(a,b,c){var d,e,f,g,h,i,j,k,l="width"in b||"height"in b,m=this,n={},o=a.style,p=a.nodeType&&ba(a),q=V.get(a,"fxshow");c.queue||(g=r._queueHooks(a,"fx"),null==g.unqueued&&(g.unqueued=0,h=g.empty.fire,g.empty.fire=function(){g.unqueued||h()}),g.unqueued++,m.always(function(){m.always(function(){g.unqueued--,r.queue(a,"fx").length||g.empty.fire()})}));for(d in b)if(e=b[d],$a.test(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}n[d]=q&&q[d]||r.style(a,d)}if(i=!r.isEmptyObject(b),i||!r.isEmptyObject(n)){l&&1===a.nodeType&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=q&&q.display,null==j&&(j=V.get(a,"display")),k=r.css(a,"display"),"none"===k&&(j?k=j:(ga([a],!0),j=a.style.display||j,k=r.css(a,"display"),ga([a]))),("inline"===k||"inline-block"===k&&null!=j)&&"none"===r.css(a,"float")&&(i||(m.done(function(){o.display=j}),null==j&&(k=o.display,j="none"===k?"":k)),o.display="inline-block")),c.overflow&&(o.overflow="hidden",m.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]})),i=!1;for(d in n)i||(q?"hidden"in q&&(p=q.hidden):q=V.access(a,"fxshow",{display:j}),f&&(q.hidden=!p),p&&ga([a],!0),m.done(function(){p||ga([a]),V.remove(a,"fxshow");for(d in n)r.style(a,d,n[d])})),i=db(p?q[d]:0,d,m),d in q||(q[d]=i.start,p&&(i.end=i.start,i.start=0))}}function fb(a,b){var c,d,e,f,g;for(c in a)if(d=r.camelCase(c),e=b[d],f=a[c],r.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=r.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function gb(a,b,c){var d,e,f=0,g=gb.prefilters.length,h=r.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Ya||bb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;g<i;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),f<1&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:r.extend({},b),opts:r.extend(!0,{specialEasing:{},easing:r.easing._default},c),originalProperties:b,originalOptions:c,startTime:Ya||bb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=r.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;c<d;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for(fb(k,j.opts.specialEasing);f<g;f++)if(d=gb.prefilters[f].call(j,a,k,j.opts))return r.isFunction(d.stop)&&(r._queueHooks(j.elem,j.opts.queue).stop=r.proxy(d.stop,d)),d;return r.map(k,db,j),r.isFunction(j.opts.start)&&j.opts.start.call(a,j),r.fx.timer(r.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}r.Animation=r.extend(gb,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return da(c.elem,a,_.exec(b),c),c}]},tweener:function(a,b){r.isFunction(a)?(b=a,a=["*"]):a=a.match(K);for(var c,d=0,e=a.length;d<e;d++)c=a[d],gb.tweeners[c]=gb.tweeners[c]||[],gb.tweeners[c].unshift(b)},prefilters:[eb],prefilter:function(a,b){b?gb.prefilters.unshift(a):gb.prefilters.push(a)}}),r.speed=function(a,b,c){var e=a&&"object"==typeof a?r.extend({},a):{complete:c||!c&&b||r.isFunction(a)&&a,duration:a,easing:c&&b||b&&!r.isFunction(b)&&b};return r.fx.off||d.hidden?e.duration=0:e.duration="number"==typeof e.duration?e.duration:e.duration in r.fx.speeds?r.fx.speeds[e.duration]:r.fx.speeds._default,null!=e.queue&&e.queue!==!0||(e.queue="fx"),e.old=e.complete,e.complete=function(){r.isFunction(e.old)&&e.old.call(this),e.queue&&r.dequeue(this,e.queue)},e},r.fn.extend({fadeTo:function(a,b,c,d){return this.filter(ba).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=r.isEmptyObject(a),f=r.speed(b,c,d),g=function(){var b=gb(this,r.extend({},a),f);(e||V.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=r.timers,g=V.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&_a.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));!b&&c||r.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=V.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=r.timers,g=d?d.length:0;for(c.finish=!0,r.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;b<g;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),r.each(["toggle","show","hide"],function(a,b){var c=r.fn[b];r.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(cb(b,!0),a,d,e)}}),r.each({slideDown:cb("show"),slideUp:cb("hide"),slideToggle:cb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){r.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),r.timers=[],r.fx.tick=function(){var a,b=0,c=r.timers;for(Ya=r.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||r.fx.stop(),Ya=void 0},r.fx.timer=function(a){r.timers.push(a),a()?r.fx.start():r.timers.pop()},r.fx.interval=13,r.fx.start=function(){Za||(Za=a.requestAnimationFrame?a.requestAnimationFrame(ab):a.setInterval(r.fx.tick,r.fx.interval))},r.fx.stop=function(){a.cancelAnimationFrame?a.cancelAnimationFrame(Za):a.clearInterval(Za),Za=null},r.fx.speeds={slow:600,fast:200,_default:400},r.fn.delay=function(b,c){return b=r.fx?r.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e)}})},function(){var a=d.createElement("input"),b=d.createElement("select"),c=b.appendChild(d.createElement("option"));a.type="checkbox",o.checkOn=""!==a.value,o.optSelected=c.selected,a=d.createElement("input"),a.value="t",a.type="radio",o.radioValue="t"===a.value}();var hb,ib=r.expr.attrHandle;r.fn.extend({attr:function(a,b){return S(this,r.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){r.removeAttr(this,a)})}}),r.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return"undefined"==typeof a.getAttribute?r.prop(a,b,c):(1===f&&r.isXMLDoc(a)||(e=r.attrHooks[b.toLowerCase()]||(r.expr.match.bool.test(b)?hb:void 0)),void 0!==c?null===c?void r.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=r.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!o.radioValue&&"radio"===b&&r.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d=0,e=b&&b.match(K);
if(e&&1===a.nodeType)while(c=e[d++])a.removeAttribute(c)}}),hb={set:function(a,b,c){return b===!1?r.removeAttr(a,c):a.setAttribute(c,c),c}},r.each(r.expr.match.bool.source.match(/\w+/g),function(a,b){var c=ib[b]||r.find.attr;ib[b]=function(a,b,d){var e,f,g=b.toLowerCase();return d||(f=ib[g],ib[g]=e,e=null!=c(a,b,d)?g:null,ib[g]=f),e}});var jb=/^(?:input|select|textarea|button)$/i,kb=/^(?:a|area)$/i;r.fn.extend({prop:function(a,b){return S(this,r.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[r.propFix[a]||a]})}}),r.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&r.isXMLDoc(a)||(b=r.propFix[b]||b,e=r.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=r.find.attr(a,"tabindex");return b?parseInt(b,10):jb.test(a.nodeName)||kb.test(a.nodeName)&&a.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),o.optSelected||(r.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null},set:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex)}}),r.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){r.propFix[this.toLowerCase()]=this});var lb=/[\t\r\n\f]/g;function mb(a){return a.getAttribute&&a.getAttribute("class")||""}r.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(r.isFunction(a))return this.each(function(b){r(this).addClass(a.call(this,b,mb(this)))});if("string"==typeof a&&a){b=a.match(K)||[];while(c=this[i++])if(e=mb(c),d=1===c.nodeType&&(" "+e+" ").replace(lb," ")){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=r.trim(d),e!==h&&c.setAttribute("class",h)}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(r.isFunction(a))return this.each(function(b){r(this).removeClass(a.call(this,b,mb(this)))});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(K)||[];while(c=this[i++])if(e=mb(c),d=1===c.nodeType&&(" "+e+" ").replace(lb," ")){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=r.trim(d),e!==h&&c.setAttribute("class",h)}}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):r.isFunction(a)?this.each(function(c){r(this).toggleClass(a.call(this,c,mb(this),b),b)}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=r(this),f=a.match(K)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else void 0!==a&&"boolean"!==c||(b=mb(this),b&&V.set(this,"__className__",b),this.setAttribute&&this.setAttribute("class",b||a===!1?"":V.get(this,"__className__")||""))})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+mb(c)+" ").replace(lb," ").indexOf(b)>-1)return!0;return!1}});var nb=/\r/g,ob=/[\x20\t\r\n\f]+/g;r.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=r.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,r(this).val()):a,null==e?e="":"number"==typeof e?e+="":r.isArray(e)&&(e=r.map(e,function(a){return null==a?"":a+""})),b=r.valHooks[this.type]||r.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=r.valHooks[e.type]||r.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(nb,""):null==c?"":c)}}}),r.extend({valHooks:{option:{get:function(a){var b=r.find.attr(a,"value");return null!=b?b:r.trim(r.text(a)).replace(ob," ")}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type,g=f?null:[],h=f?e+1:d.length,i=e<0?h:f?e:0;i<h;i++)if(c=d[i],(c.selected||i===e)&&!c.disabled&&(!c.parentNode.disabled||!r.nodeName(c.parentNode,"optgroup"))){if(b=r(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=r.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=r.inArray(r.valHooks.option.get(d),f)>-1)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),r.each(["radio","checkbox"],function(){r.valHooks[this]={set:function(a,b){if(r.isArray(b))return a.checked=r.inArray(r(a).val(),b)>-1}},o.checkOn||(r.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var pb=/^(?:focusinfocus|focusoutblur)$/;r.extend(r.event,{trigger:function(b,c,e,f){var g,h,i,j,k,m,n,o=[e||d],p=l.call(b,"type")?b.type:b,q=l.call(b,"namespace")?b.namespace.split("."):[];if(h=i=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!pb.test(p+r.event.triggered)&&(p.indexOf(".")>-1&&(q=p.split("."),p=q.shift(),q.sort()),k=p.indexOf(":")<0&&"on"+p,b=b[r.expando]?b:new r.Event(p,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=q.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:r.makeArray(c,[b]),n=r.event.special[p]||{},f||!n.trigger||n.trigger.apply(e,c)!==!1)){if(!f&&!n.noBubble&&!r.isWindow(e)){for(j=n.delegateType||p,pb.test(j+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),i=h;i===(e.ownerDocument||d)&&o.push(i.defaultView||i.parentWindow||a)}g=0;while((h=o[g++])&&!b.isPropagationStopped())b.type=g>1?j:n.bindType||p,m=(V.get(h,"events")||{})[b.type]&&V.get(h,"handle"),m&&m.apply(h,c),m=k&&h[k],m&&m.apply&&T(h)&&(b.result=m.apply(h,c),b.result===!1&&b.preventDefault());return b.type=p,f||b.isDefaultPrevented()||n._default&&n._default.apply(o.pop(),c)!==!1||!T(e)||k&&r.isFunction(e[p])&&!r.isWindow(e)&&(i=e[k],i&&(e[k]=null),r.event.triggered=p,e[p](),r.event.triggered=void 0,i&&(e[k]=i)),b.result}},simulate:function(a,b,c){var d=r.extend(new r.Event,c,{type:a,isSimulated:!0});r.event.trigger(d,null,b)}}),r.fn.extend({trigger:function(a,b){return this.each(function(){r.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];if(c)return r.event.trigger(a,b,c,!0)}}),r.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(a,b){r.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),r.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),o.focusin="onfocusin"in a,o.focusin||r.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){r.event.simulate(b,a.target,r.event.fix(a))};r.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=V.access(d,b);e||d.addEventListener(a,c,!0),V.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=V.access(d,b)-1;e?V.access(d,b,e):(d.removeEventListener(a,c,!0),V.remove(d,b))}}});var qb=a.location,rb=r.now(),sb=/\?/;r.parseXML=function(b){var c;if(!b||"string"!=typeof b)return null;try{c=(new a.DOMParser).parseFromString(b,"text/xml")}catch(d){c=void 0}return c&&!c.getElementsByTagName("parsererror").length||r.error("Invalid XML: "+b),c};var tb=/\[\]$/,ub=/\r?\n/g,vb=/^(?:submit|button|image|reset|file)$/i,wb=/^(?:input|select|textarea|keygen)/i;function xb(a,b,c,d){var e;if(r.isArray(b))r.each(b,function(b,e){c||tb.test(a)?d(a,e):xb(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d)});else if(c||"object"!==r.type(b))d(a,b);else for(e in b)xb(a+"["+e+"]",b[e],c,d)}r.param=function(a,b){var c,d=[],e=function(a,b){var c=r.isFunction(b)?b():b;d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(null==c?"":c)};if(r.isArray(a)||a.jquery&&!r.isPlainObject(a))r.each(a,function(){e(this.name,this.value)});else for(c in a)xb(c,a[c],b,e);return d.join("&")},r.fn.extend({serialize:function(){return r.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=r.prop(this,"elements");return a?r.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!r(this).is(":disabled")&&wb.test(this.nodeName)&&!vb.test(a)&&(this.checked||!ha.test(a))}).map(function(a,b){var c=r(this).val();return null==c?null:r.isArray(c)?r.map(c,function(a){return{name:b.name,value:a.replace(ub,"\r\n")}}):{name:b.name,value:c.replace(ub,"\r\n")}}).get()}});var yb=/%20/g,zb=/#.*$/,Ab=/([?&])_=[^&]*/,Bb=/^(.*?):[ \t]*([^\r\n]*)$/gm,Cb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Db=/^(?:GET|HEAD)$/,Eb=/^\/\//,Fb={},Gb={},Hb="*/".concat("*"),Ib=d.createElement("a");Ib.href=qb.href;function Jb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(K)||[];if(r.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Kb(a,b,c,d){var e={},f=a===Gb;function g(h){var i;return e[h]=!0,r.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Lb(a,b){var c,d,e=r.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&r.extend(!0,a,d),a}function Mb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}if(f)return f!==i[0]&&i.unshift(f),c[f]}function Nb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}r.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:qb.href,type:"GET",isLocal:Cb.test(qb.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Hb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":r.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Lb(Lb(a,r.ajaxSettings),b):Lb(r.ajaxSettings,a)},ajaxPrefilter:Jb(Fb),ajaxTransport:Jb(Gb),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var e,f,g,h,i,j,k,l,m,n,o=r.ajaxSetup({},c),p=o.context||o,q=o.context&&(p.nodeType||p.jquery)?r(p):r.event,s=r.Deferred(),t=r.Callbacks("once memory"),u=o.statusCode||{},v={},w={},x="canceled",y={readyState:0,getResponseHeader:function(a){var b;if(k){if(!h){h={};while(b=Bb.exec(g))h[b[1].toLowerCase()]=b[2]}b=h[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return k?g:null},setRequestHeader:function(a,b){return null==k&&(a=w[a.toLowerCase()]=w[a.toLowerCase()]||a,v[a]=b),this},overrideMimeType:function(a){return null==k&&(o.mimeType=a),this},statusCode:function(a){var b;if(a)if(k)y.always(a[y.status]);else for(b in a)u[b]=[u[b],a[b]];return this},abort:function(a){var b=a||x;return e&&e.abort(b),A(0,b),this}};if(s.promise(y),o.url=((b||o.url||qb.href)+"").replace(Eb,qb.protocol+"//"),o.type=c.method||c.type||o.method||o.type,o.dataTypes=(o.dataType||"*").toLowerCase().match(K)||[""],null==o.crossDomain){j=d.createElement("a");try{j.href=o.url,j.href=j.href,o.crossDomain=Ib.protocol+"//"+Ib.host!=j.protocol+"//"+j.host}catch(z){o.crossDomain=!0}}if(o.data&&o.processData&&"string"!=typeof o.data&&(o.data=r.param(o.data,o.traditional)),Kb(Fb,o,c,y),k)return y;l=r.event&&o.global,l&&0===r.active++&&r.event.trigger("ajaxStart"),o.type=o.type.toUpperCase(),o.hasContent=!Db.test(o.type),f=o.url.replace(zb,""),o.hasContent?o.data&&o.processData&&0===(o.contentType||"").indexOf("application/x-www-form-urlencoded")&&(o.data=o.data.replace(yb,"+")):(n=o.url.slice(f.length),o.data&&(f+=(sb.test(f)?"&":"?")+o.data,delete o.data),o.cache===!1&&(f=f.replace(Ab,""),n=(sb.test(f)?"&":"?")+"_="+rb++ +n),o.url=f+n),o.ifModified&&(r.lastModified[f]&&y.setRequestHeader("If-Modified-Since",r.lastModified[f]),r.etag[f]&&y.setRequestHeader("If-None-Match",r.etag[f])),(o.data&&o.hasContent&&o.contentType!==!1||c.contentType)&&y.setRequestHeader("Content-Type",o.contentType),y.setRequestHeader("Accept",o.dataTypes[0]&&o.accepts[o.dataTypes[0]]?o.accepts[o.dataTypes[0]]+("*"!==o.dataTypes[0]?", "+Hb+"; q=0.01":""):o.accepts["*"]);for(m in o.headers)y.setRequestHeader(m,o.headers[m]);if(o.beforeSend&&(o.beforeSend.call(p,y,o)===!1||k))return y.abort();if(x="abort",t.add(o.complete),y.done(o.success),y.fail(o.error),e=Kb(Gb,o,c,y)){if(y.readyState=1,l&&q.trigger("ajaxSend",[y,o]),k)return y;o.async&&o.timeout>0&&(i=a.setTimeout(function(){y.abort("timeout")},o.timeout));try{k=!1,e.send(v,A)}catch(z){if(k)throw z;A(-1,z)}}else A(-1,"No Transport");function A(b,c,d,h){var j,m,n,v,w,x=c;k||(k=!0,i&&a.clearTimeout(i),e=void 0,g=h||"",y.readyState=b>0?4:0,j=b>=200&&b<300||304===b,d&&(v=Mb(o,y,d)),v=Nb(o,v,y,j),j?(o.ifModified&&(w=y.getResponseHeader("Last-Modified"),w&&(r.lastModified[f]=w),w=y.getResponseHeader("etag"),w&&(r.etag[f]=w)),204===b||"HEAD"===o.type?x="nocontent":304===b?x="notmodified":(x=v.state,m=v.data,n=v.error,j=!n)):(n=x,!b&&x||(x="error",b<0&&(b=0))),y.status=b,y.statusText=(c||x)+"",j?s.resolveWith(p,[m,x,y]):s.rejectWith(p,[y,x,n]),y.statusCode(u),u=void 0,l&&q.trigger(j?"ajaxSuccess":"ajaxError",[y,o,j?m:n]),t.fireWith(p,[y,x]),l&&(q.trigger("ajaxComplete",[y,o]),--r.active||r.event.trigger("ajaxStop")))}return y},getJSON:function(a,b,c){return r.get(a,b,c,"json")},getScript:function(a,b){return r.get(a,void 0,b,"script")}}),r.each(["get","post"],function(a,b){r[b]=function(a,c,d,e){return r.isFunction(c)&&(e=e||d,d=c,c=void 0),r.ajax(r.extend({url:a,type:b,dataType:e,data:c,success:d},r.isPlainObject(a)&&a))}}),r._evalUrl=function(a){return r.ajax({url:a,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,"throws":!0})},r.fn.extend({wrapAll:function(a){var b;return this[0]&&(r.isFunction(a)&&(a=a.call(this[0])),b=r(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this},wrapInner:function(a){return r.isFunction(a)?this.each(function(b){r(this).wrapInner(a.call(this,b))}):this.each(function(){var b=r(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=r.isFunction(a);return this.each(function(c){r(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(a){return this.parent(a).not("body").each(function(){r(this).replaceWith(this.childNodes)}),this}}),r.expr.pseudos.hidden=function(a){return!r.expr.pseudos.visible(a)},r.expr.pseudos.visible=function(a){return!!(a.offsetWidth||a.offsetHeight||a.getClientRects().length)},r.ajaxSettings.xhr=function(){try{return new a.XMLHttpRequest}catch(b){}};var Ob={0:200,1223:204},Pb=r.ajaxSettings.xhr();o.cors=!!Pb&&"withCredentials"in Pb,o.ajax=Pb=!!Pb,r.ajaxTransport(function(b){var c,d;if(o.cors||Pb&&!b.crossDomain)return{send:function(e,f){var g,h=b.xhr();if(h.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(g in b.xhrFields)h[g]=b.xhrFields[g];b.mimeType&&h.overrideMimeType&&h.overrideMimeType(b.mimeType),b.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest");for(g in e)h.setRequestHeader(g,e[g]);c=function(a){return function(){c&&(c=d=h.onload=h.onerror=h.onabort=h.onreadystatechange=null,"abort"===a?h.abort():"error"===a?"number"!=typeof h.status?f(0,"error"):f(h.status,h.statusText):f(Ob[h.status]||h.status,h.statusText,"text"!==(h.responseType||"text")||"string"!=typeof h.responseText?{binary:h.response}:{text:h.responseText},h.getAllResponseHeaders()))}},h.onload=c(),d=h.onerror=c("error"),void 0!==h.onabort?h.onabort=d:h.onreadystatechange=function(){4===h.readyState&&a.setTimeout(function(){c&&d()})},c=c("abort");try{h.send(b.hasContent&&b.data||null)}catch(i){if(c)throw i}},abort:function(){c&&c()}}}),r.ajaxPrefilter(function(a){a.crossDomain&&(a.contents.script=!1)}),r.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return r.globalEval(a),a}}}),r.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),r.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(e,f){b=r("<script>").prop({charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&f("error"===a.type?404:200,a.type)}),d.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Qb=[],Rb=/(=)\?(?=&|$)|\?\?/;r.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Qb.pop()||r.expando+"_"+rb++;return this[a]=!0,a}}),r.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Rb.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Rb.test(b.data)&&"data");if(h||"jsonp"===b.dataTypes[0])return e=b.jsonpCallback=r.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Rb,"$1"+e):b.jsonp!==!1&&(b.url+=(sb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||r.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){void 0===f?r(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Qb.push(e)),g&&r.isFunction(f)&&f(g[0]),g=f=void 0}),"script"}),o.createHTMLDocument=function(){var a=d.implementation.createHTMLDocument("").body;return a.innerHTML="<form></form><form></form>",2===a.childNodes.length}(),r.parseHTML=function(a,b,c){if("string"!=typeof a)return[];"boolean"==typeof b&&(c=b,b=!1);var e,f,g;return b||(o.createHTMLDocument?(b=d.implementation.createHTMLDocument(""),e=b.createElement("base"),e.href=d.location.href,b.head.appendChild(e)):b=d),f=B.exec(a),g=!c&&[],f?[b.createElement(f[1])]:(f=oa([a],b,g),g&&g.length&&r(g).remove(),r.merge([],f.childNodes))},r.fn.load=function(a,b,c){var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=r.trim(a.slice(h)),a=a.slice(0,h)),r.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&r.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?r("<div>").append(r.parseHTML(a)).find(d):a)}).always(c&&function(a,b){g.each(function(){c.apply(this,f||[a.responseText,b,a])})}),this},r.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){r.fn[b]=function(a){return this.on(b,a)}}),r.expr.pseudos.animated=function(a){return r.grep(r.timers,function(b){return a===b.elem}).length};function Sb(a){return r.isWindow(a)?a:9===a.nodeType&&a.defaultView}r.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=r.css(a,"position"),l=r(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=r.css(a,"top"),i=r.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),r.isFunction(b)&&(b=b.call(a,c,r.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},r.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){r.offset.setOffset(this,a,b)});var b,c,d,e,f=this[0];if(f)return f.getClientRects().length?(d=f.getBoundingClientRect(),d.width||d.height?(e=f.ownerDocument,c=Sb(e),b=e.documentElement,{top:d.top+c.pageYOffset-b.clientTop,left:d.left+c.pageXOffset-b.clientLeft}):d):{top:0,left:0}},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===r.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),r.nodeName(a[0],"html")||(d=a.offset()),d={top:d.top+r.css(a[0],"borderTopWidth",!0),left:d.left+r.css(a[0],"borderLeftWidth",!0)}),{top:b.top-d.top-r.css(c,"marginTop",!0),left:b.left-d.left-r.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&"static"===r.css(a,"position"))a=a.offsetParent;return a||pa})}}),r.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c="pageYOffset"===b;r.fn[a]=function(d){return S(this,function(a,d,e){var f=Sb(a);return void 0===e?f?f[b]:a[d]:void(f?f.scrollTo(c?f.pageXOffset:e,c?e:f.pageYOffset):a[d]=e)},a,d,arguments.length)}}),r.each(["top","left"],function(a,b){r.cssHooks[b]=Na(o.pixelPosition,function(a,c){if(c)return c=Ma(a,b),Ka.test(c)?r(a).position()[b]+"px":c})}),r.each({Height:"height",Width:"width"},function(a,b){r.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){r.fn[d]=function(e,f){var g=arguments.length&&(c||"boolean"!=typeof e),h=c||(e===!0||f===!0?"margin":"border");return S(this,function(b,c,e){var f;return r.isWindow(b)?0===d.indexOf("outer")?b["inner"+a]:b.document.documentElement["client"+a]:9===b.nodeType?(f=b.documentElement,Math.max(b.body["scroll"+a],f["scroll"+a],b.body["offset"+a],f["offset"+a],f["client"+a])):void 0===e?r.css(b,c,h):r.style(b,c,e,h)},b,g?e:void 0,g)}})}),r.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}}),r.parseJSON=JSON.parse,"function"==typeof define&&define.amd&&define("jquery",[],function(){return r});var Tb=a.jQuery,Ub=a.$;return r.noConflict=function(b){return a.$===r&&(a.$=Ub),b&&a.jQuery===r&&(a.jQuery=Tb),r},b||(a.jQuery=a.$=r),r});
;

!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.moment=t()}(this,function(){"use strict";var e,i;function c(){return e.apply(null,arguments)}function o(e){return e instanceof Array||"[object Array]"===Object.prototype.toString.call(e)}function u(e){return null!=e&&"[object Object]"===Object.prototype.toString.call(e)}function l(e){return void 0===e}function d(e){return"number"==typeof e||"[object Number]"===Object.prototype.toString.call(e)}function h(e){return e instanceof Date||"[object Date]"===Object.prototype.toString.call(e)}function f(e,t){var n,s=[];for(n=0;n<e.length;++n)s.push(t(e[n],n));return s}function m(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function _(e,t){for(var n in t)m(t,n)&&(e[n]=t[n]);return m(t,"toString")&&(e.toString=t.toString),m(t,"valueOf")&&(e.valueOf=t.valueOf),e}function y(e,t,n,s){return Ot(e,t,n,s,!0).utc()}function g(e){return null==e._pf&&(e._pf={empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}),e._pf}function p(e){if(null==e._isValid){var t=g(e),n=i.call(t.parsedDateParts,function(e){return null!=e}),s=!isNaN(e._d.getTime())&&t.overflow<0&&!t.empty&&!t.invalidMonth&&!t.invalidWeekday&&!t.weekdayMismatch&&!t.nullInput&&!t.invalidFormat&&!t.userInvalidated&&(!t.meridiem||t.meridiem&&n);if(e._strict&&(s=s&&0===t.charsLeftOver&&0===t.unusedTokens.length&&void 0===t.bigHour),null!=Object.isFrozen&&Object.isFrozen(e))return s;e._isValid=s}return e._isValid}function v(e){var t=y(NaN);return null!=e?_(g(t),e):g(t).userInvalidated=!0,t}i=Array.prototype.some?Array.prototype.some:function(e){for(var t=Object(this),n=t.length>>>0,s=0;s<n;s++)if(s in t&&e.call(this,t[s],s,t))return!0;return!1};var r=c.momentProperties=[];function w(e,t){var n,s,i;if(l(t._isAMomentObject)||(e._isAMomentObject=t._isAMomentObject),l(t._i)||(e._i=t._i),l(t._f)||(e._f=t._f),l(t._l)||(e._l=t._l),l(t._strict)||(e._strict=t._strict),l(t._tzm)||(e._tzm=t._tzm),l(t._isUTC)||(e._isUTC=t._isUTC),l(t._offset)||(e._offset=t._offset),l(t._pf)||(e._pf=g(t)),l(t._locale)||(e._locale=t._locale),0<r.length)for(n=0;n<r.length;n++)l(i=t[s=r[n]])||(e[s]=i);return e}var t=!1;function M(e){w(this,e),this._d=new Date(null!=e._d?e._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),!1===t&&(t=!0,c.updateOffset(this),t=!1)}function S(e){return e instanceof M||null!=e&&null!=e._isAMomentObject}function D(e){return e<0?Math.ceil(e)||0:Math.floor(e)}function k(e){var t=+e,n=0;return 0!==t&&isFinite(t)&&(n=D(t)),n}function a(e,t,n){var s,i=Math.min(e.length,t.length),r=Math.abs(e.length-t.length),a=0;for(s=0;s<i;s++)(n&&e[s]!==t[s]||!n&&k(e[s])!==k(t[s]))&&a++;return a+r}function Y(e){!1===c.suppressDeprecationWarnings&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+e)}function n(i,r){var a=!0;return _(function(){if(null!=c.deprecationHandler&&c.deprecationHandler(null,i),a){for(var e,t=[],n=0;n<arguments.length;n++){if(e="","object"==typeof arguments[n]){for(var s in e+="\n["+n+"] ",arguments[0])e+=s+": "+arguments[0][s]+", ";e=e.slice(0,-2)}else e=arguments[n];t.push(e)}Y(i+"\nArguments: "+Array.prototype.slice.call(t).join("")+"\n"+(new Error).stack),a=!1}return r.apply(this,arguments)},r)}var s,O={};function T(e,t){null!=c.deprecationHandler&&c.deprecationHandler(e,t),O[e]||(Y(t),O[e]=!0)}function x(e){return e instanceof Function||"[object Function]"===Object.prototype.toString.call(e)}function b(e,t){var n,s=_({},e);for(n in t)m(t,n)&&(u(e[n])&&u(t[n])?(s[n]={},_(s[n],e[n]),_(s[n],t[n])):null!=t[n]?s[n]=t[n]:delete s[n]);for(n in e)m(e,n)&&!m(t,n)&&u(e[n])&&(s[n]=_({},s[n]));return s}function P(e){null!=e&&this.set(e)}c.suppressDeprecationWarnings=!1,c.deprecationHandler=null,s=Object.keys?Object.keys:function(e){var t,n=[];for(t in e)m(e,t)&&n.push(t);return n};var W={};function H(e,t){var n=e.toLowerCase();W[n]=W[n+"s"]=W[t]=e}function R(e){return"string"==typeof e?W[e]||W[e.toLowerCase()]:void 0}function C(e){var t,n,s={};for(n in e)m(e,n)&&(t=R(n))&&(s[t]=e[n]);return s}var F={};function L(e,t){F[e]=t}function U(e,t,n){var s=""+Math.abs(e),i=t-s.length;return(0<=e?n?"+":"":"-")+Math.pow(10,Math.max(0,i)).toString().substr(1)+s}var N=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,G=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,V={},E={};function I(e,t,n,s){var i=s;"string"==typeof s&&(i=function(){return this[s]()}),e&&(E[e]=i),t&&(E[t[0]]=function(){return U(i.apply(this,arguments),t[1],t[2])}),n&&(E[n]=function(){return this.localeData().ordinal(i.apply(this,arguments),e)})}function A(e,t){return e.isValid()?(t=j(t,e.localeData()),V[t]=V[t]||function(s){var e,i,t,r=s.match(N);for(e=0,i=r.length;e<i;e++)E[r[e]]?r[e]=E[r[e]]:r[e]=(t=r[e]).match(/\[[\s\S]/)?t.replace(/^\[|\]$/g,""):t.replace(/\\/g,"");return function(e){var t,n="";for(t=0;t<i;t++)n+=x(r[t])?r[t].call(e,s):r[t];return n}}(t),V[t](e)):e.localeData().invalidDate()}function j(e,t){var n=5;function s(e){return t.longDateFormat(e)||e}for(G.lastIndex=0;0<=n&&G.test(e);)e=e.replace(G,s),G.lastIndex=0,n-=1;return e}var Z=/\d/,z=/\d\d/,$=/\d{3}/,q=/\d{4}/,J=/[+-]?\d{6}/,B=/\d\d?/,Q=/\d\d\d\d?/,X=/\d\d\d\d\d\d?/,K=/\d{1,3}/,ee=/\d{1,4}/,te=/[+-]?\d{1,6}/,ne=/\d+/,se=/[+-]?\d+/,ie=/Z|[+-]\d\d:?\d\d/gi,re=/Z|[+-]\d\d(?::?\d\d)?/gi,ae=/[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,oe={};function ue(e,n,s){oe[e]=x(n)?n:function(e,t){return e&&s?s:n}}function le(e,t){return m(oe,e)?oe[e](t._strict,t._locale):new RegExp(de(e.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(e,t,n,s,i){return t||n||s||i})))}function de(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}var he={};function ce(e,n){var t,s=n;for("string"==typeof e&&(e=[e]),d(n)&&(s=function(e,t){t[n]=k(e)}),t=0;t<e.length;t++)he[e[t]]=s}function fe(e,i){ce(e,function(e,t,n,s){n._w=n._w||{},i(e,n._w,n,s)})}var me=0,_e=1,ye=2,ge=3,pe=4,ve=5,we=6,Me=7,Se=8;function De(e){return ke(e)?366:365}function ke(e){return e%4==0&&e%100!=0||e%400==0}I("Y",0,0,function(){var e=this.year();return e<=9999?""+e:"+"+e}),I(0,["YY",2],0,function(){return this.year()%100}),I(0,["YYYY",4],0,"year"),I(0,["YYYYY",5],0,"year"),I(0,["YYYYYY",6,!0],0,"year"),H("year","y"),L("year",1),ue("Y",se),ue("YY",B,z),ue("YYYY",ee,q),ue("YYYYY",te,J),ue("YYYYYY",te,J),ce(["YYYYY","YYYYYY"],me),ce("YYYY",function(e,t){t[me]=2===e.length?c.parseTwoDigitYear(e):k(e)}),ce("YY",function(e,t){t[me]=c.parseTwoDigitYear(e)}),ce("Y",function(e,t){t[me]=parseInt(e,10)}),c.parseTwoDigitYear=function(e){return k(e)+(68<k(e)?1900:2e3)};var Ye,Oe=Te("FullYear",!0);function Te(t,n){return function(e){return null!=e?(be(this,t,e),c.updateOffset(this,n),this):xe(this,t)}}function xe(e,t){return e.isValid()?e._d["get"+(e._isUTC?"UTC":"")+t]():NaN}function be(e,t,n){e.isValid()&&!isNaN(n)&&("FullYear"===t&&ke(e.year())&&1===e.month()&&29===e.date()?e._d["set"+(e._isUTC?"UTC":"")+t](n,e.month(),Pe(n,e.month())):e._d["set"+(e._isUTC?"UTC":"")+t](n))}function Pe(e,t){if(isNaN(e)||isNaN(t))return NaN;var n,s=(t%(n=12)+n)%n;return e+=(t-s)/12,1===s?ke(e)?29:28:31-s%7%2}Ye=Array.prototype.indexOf?Array.prototype.indexOf:function(e){var t;for(t=0;t<this.length;++t)if(this[t]===e)return t;return-1},I("M",["MM",2],"Mo",function(){return this.month()+1}),I("MMM",0,0,function(e){return this.localeData().monthsShort(this,e)}),I("MMMM",0,0,function(e){return this.localeData().months(this,e)}),H("month","M"),L("month",8),ue("M",B),ue("MM",B,z),ue("MMM",function(e,t){return t.monthsShortRegex(e)}),ue("MMMM",function(e,t){return t.monthsRegex(e)}),ce(["M","MM"],function(e,t){t[_e]=k(e)-1}),ce(["MMM","MMMM"],function(e,t,n,s){var i=n._locale.monthsParse(e,s,n._strict);null!=i?t[_e]=i:g(n).invalidMonth=e});var We=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,He="January_February_March_April_May_June_July_August_September_October_November_December".split("_");var Re="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");function Ce(e,t){var n;if(!e.isValid())return e;if("string"==typeof t)if(/^\d+$/.test(t))t=k(t);else if(!d(t=e.localeData().monthsParse(t)))return e;return n=Math.min(e.date(),Pe(e.year(),t)),e._d["set"+(e._isUTC?"UTC":"")+"Month"](t,n),e}function Fe(e){return null!=e?(Ce(this,e),c.updateOffset(this,!0),this):xe(this,"Month")}var Le=ae;var Ue=ae;function Ne(){function e(e,t){return t.length-e.length}var t,n,s=[],i=[],r=[];for(t=0;t<12;t++)n=y([2e3,t]),s.push(this.monthsShort(n,"")),i.push(this.months(n,"")),r.push(this.months(n,"")),r.push(this.monthsShort(n,""));for(s.sort(e),i.sort(e),r.sort(e),t=0;t<12;t++)s[t]=de(s[t]),i[t]=de(i[t]);for(t=0;t<24;t++)r[t]=de(r[t]);this._monthsRegex=new RegExp("^("+r.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+s.join("|")+")","i")}function Ge(e){var t=new Date(Date.UTC.apply(null,arguments));return e<100&&0<=e&&isFinite(t.getUTCFullYear())&&t.setUTCFullYear(e),t}function Ve(e,t,n){var s=7+t-n;return-((7+Ge(e,0,s).getUTCDay()-t)%7)+s-1}function Ee(e,t,n,s,i){var r,a,o=1+7*(t-1)+(7+n-s)%7+Ve(e,s,i);return a=o<=0?De(r=e-1)+o:o>De(e)?(r=e+1,o-De(e)):(r=e,o),{year:r,dayOfYear:a}}function Ie(e,t,n){var s,i,r=Ve(e.year(),t,n),a=Math.floor((e.dayOfYear()-r-1)/7)+1;return a<1?s=a+Ae(i=e.year()-1,t,n):a>Ae(e.year(),t,n)?(s=a-Ae(e.year(),t,n),i=e.year()+1):(i=e.year(),s=a),{week:s,year:i}}function Ae(e,t,n){var s=Ve(e,t,n),i=Ve(e+1,t,n);return(De(e)-s+i)/7}I("w",["ww",2],"wo","week"),I("W",["WW",2],"Wo","isoWeek"),H("week","w"),H("isoWeek","W"),L("week",5),L("isoWeek",5),ue("w",B),ue("ww",B,z),ue("W",B),ue("WW",B,z),fe(["w","ww","W","WW"],function(e,t,n,s){t[s.substr(0,1)]=k(e)});I("d",0,"do","day"),I("dd",0,0,function(e){return this.localeData().weekdaysMin(this,e)}),I("ddd",0,0,function(e){return this.localeData().weekdaysShort(this,e)}),I("dddd",0,0,function(e){return this.localeData().weekdays(this,e)}),I("e",0,0,"weekday"),I("E",0,0,"isoWeekday"),H("day","d"),H("weekday","e"),H("isoWeekday","E"),L("day",11),L("weekday",11),L("isoWeekday",11),ue("d",B),ue("e",B),ue("E",B),ue("dd",function(e,t){return t.weekdaysMinRegex(e)}),ue("ddd",function(e,t){return t.weekdaysShortRegex(e)}),ue("dddd",function(e,t){return t.weekdaysRegex(e)}),fe(["dd","ddd","dddd"],function(e,t,n,s){var i=n._locale.weekdaysParse(e,s,n._strict);null!=i?t.d=i:g(n).invalidWeekday=e}),fe(["d","e","E"],function(e,t,n,s){t[s]=k(e)});var je="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_");var Ze="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_");var ze="Su_Mo_Tu_We_Th_Fr_Sa".split("_");var $e=ae;var qe=ae;var Je=ae;function Be(){function e(e,t){return t.length-e.length}var t,n,s,i,r,a=[],o=[],u=[],l=[];for(t=0;t<7;t++)n=y([2e3,1]).day(t),s=this.weekdaysMin(n,""),i=this.weekdaysShort(n,""),r=this.weekdays(n,""),a.push(s),o.push(i),u.push(r),l.push(s),l.push(i),l.push(r);for(a.sort(e),o.sort(e),u.sort(e),l.sort(e),t=0;t<7;t++)o[t]=de(o[t]),u[t]=de(u[t]),l[t]=de(l[t]);this._weekdaysRegex=new RegExp("^("+l.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+u.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+o.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+a.join("|")+")","i")}function Qe(){return this.hours()%12||12}function Xe(e,t){I(e,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),t)})}function Ke(e,t){return t._meridiemParse}I("H",["HH",2],0,"hour"),I("h",["hh",2],0,Qe),I("k",["kk",2],0,function(){return this.hours()||24}),I("hmm",0,0,function(){return""+Qe.apply(this)+U(this.minutes(),2)}),I("hmmss",0,0,function(){return""+Qe.apply(this)+U(this.minutes(),2)+U(this.seconds(),2)}),I("Hmm",0,0,function(){return""+this.hours()+U(this.minutes(),2)}),I("Hmmss",0,0,function(){return""+this.hours()+U(this.minutes(),2)+U(this.seconds(),2)}),Xe("a",!0),Xe("A",!1),H("hour","h"),L("hour",13),ue("a",Ke),ue("A",Ke),ue("H",B),ue("h",B),ue("k",B),ue("HH",B,z),ue("hh",B,z),ue("kk",B,z),ue("hmm",Q),ue("hmmss",X),ue("Hmm",Q),ue("Hmmss",X),ce(["H","HH"],ge),ce(["k","kk"],function(e,t,n){var s=k(e);t[ge]=24===s?0:s}),ce(["a","A"],function(e,t,n){n._isPm=n._locale.isPM(e),n._meridiem=e}),ce(["h","hh"],function(e,t,n){t[ge]=k(e),g(n).bigHour=!0}),ce("hmm",function(e,t,n){var s=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s)),g(n).bigHour=!0}),ce("hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s,2)),t[ve]=k(e.substr(i)),g(n).bigHour=!0}),ce("Hmm",function(e,t,n){var s=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s))}),ce("Hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s,2)),t[ve]=k(e.substr(i))});var et,tt=Te("Hours",!0),nt={calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},longDateFormat:{LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},invalidDate:"Invalid date",ordinal:"%d",dayOfMonthOrdinalParse:/\d{1,2}/,relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},months:He,monthsShort:Re,week:{dow:0,doy:6},weekdays:je,weekdaysMin:ze,weekdaysShort:Ze,meridiemParse:/[ap]\.?m?\.?/i},st={},it={};function rt(e){return e?e.toLowerCase().replace("_","-"):e}function at(e){var t=null;if(!st[e]&&"undefined"!=typeof module&&module&&module.exports)try{t=et._abbr,require("./locale/"+e),ot(t)}catch(e){}return st[e]}function ot(e,t){var n;return e&&((n=l(t)?lt(e):ut(e,t))?et=n:"undefined"!=typeof console&&console.warn&&console.warn("Locale "+e+" not found. Did you forget to load it?")),et._abbr}function ut(e,t){if(null===t)return delete st[e],null;var n,s=nt;if(t.abbr=e,null!=st[e])T("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),s=st[e]._config;else if(null!=t.parentLocale)if(null!=st[t.parentLocale])s=st[t.parentLocale]._config;else{if(null==(n=at(t.parentLocale)))return it[t.parentLocale]||(it[t.parentLocale]=[]),it[t.parentLocale].push({name:e,config:t}),null;s=n._config}return st[e]=new P(b(s,t)),it[e]&&it[e].forEach(function(e){ut(e.name,e.config)}),ot(e),st[e]}function lt(e){var t;if(e&&e._locale&&e._locale._abbr&&(e=e._locale._abbr),!e)return et;if(!o(e)){if(t=at(e))return t;e=[e]}return function(e){for(var t,n,s,i,r=0;r<e.length;){for(t=(i=rt(e[r]).split("-")).length,n=(n=rt(e[r+1]))?n.split("-"):null;0<t;){if(s=at(i.slice(0,t).join("-")))return s;if(n&&n.length>=t&&a(i,n,!0)>=t-1)break;t--}r++}return et}(e)}function dt(e){var t,n=e._a;return n&&-2===g(e).overflow&&(t=n[_e]<0||11<n[_e]?_e:n[ye]<1||n[ye]>Pe(n[me],n[_e])?ye:n[ge]<0||24<n[ge]||24===n[ge]&&(0!==n[pe]||0!==n[ve]||0!==n[we])?ge:n[pe]<0||59<n[pe]?pe:n[ve]<0||59<n[ve]?ve:n[we]<0||999<n[we]?we:-1,g(e)._overflowDayOfYear&&(t<me||ye<t)&&(t=ye),g(e)._overflowWeeks&&-1===t&&(t=Me),g(e)._overflowWeekday&&-1===t&&(t=Se),g(e).overflow=t),e}function ht(e,t,n){return null!=e?e:null!=t?t:n}function ct(e){var t,n,s,i,r,a=[];if(!e._d){var o,u;for(o=e,u=new Date(c.now()),s=o._useUTC?[u.getUTCFullYear(),u.getUTCMonth(),u.getUTCDate()]:[u.getFullYear(),u.getMonth(),u.getDate()],e._w&&null==e._a[ye]&&null==e._a[_e]&&function(e){var t,n,s,i,r,a,o,u;if(null!=(t=e._w).GG||null!=t.W||null!=t.E)r=1,a=4,n=ht(t.GG,e._a[me],Ie(Tt(),1,4).year),s=ht(t.W,1),((i=ht(t.E,1))<1||7<i)&&(u=!0);else{r=e._locale._week.dow,a=e._locale._week.doy;var l=Ie(Tt(),r,a);n=ht(t.gg,e._a[me],l.year),s=ht(t.w,l.week),null!=t.d?((i=t.d)<0||6<i)&&(u=!0):null!=t.e?(i=t.e+r,(t.e<0||6<t.e)&&(u=!0)):i=r}s<1||s>Ae(n,r,a)?g(e)._overflowWeeks=!0:null!=u?g(e)._overflowWeekday=!0:(o=Ee(n,s,i,r,a),e._a[me]=o.year,e._dayOfYear=o.dayOfYear)}(e),null!=e._dayOfYear&&(r=ht(e._a[me],s[me]),(e._dayOfYear>De(r)||0===e._dayOfYear)&&(g(e)._overflowDayOfYear=!0),n=Ge(r,0,e._dayOfYear),e._a[_e]=n.getUTCMonth(),e._a[ye]=n.getUTCDate()),t=0;t<3&&null==e._a[t];++t)e._a[t]=a[t]=s[t];for(;t<7;t++)e._a[t]=a[t]=null==e._a[t]?2===t?1:0:e._a[t];24===e._a[ge]&&0===e._a[pe]&&0===e._a[ve]&&0===e._a[we]&&(e._nextDay=!0,e._a[ge]=0),e._d=(e._useUTC?Ge:function(e,t,n,s,i,r,a){var o=new Date(e,t,n,s,i,r,a);return e<100&&0<=e&&isFinite(o.getFullYear())&&o.setFullYear(e),o}).apply(null,a),i=e._useUTC?e._d.getUTCDay():e._d.getDay(),null!=e._tzm&&e._d.setUTCMinutes(e._d.getUTCMinutes()-e._tzm),e._nextDay&&(e._a[ge]=24),e._w&&void 0!==e._w.d&&e._w.d!==i&&(g(e).weekdayMismatch=!0)}}var ft=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,mt=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,_t=/Z|[+-]\d\d(?::?\d\d)?/,yt=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],gt=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],pt=/^\/?Date\((\-?\d+)/i;function vt(e){var t,n,s,i,r,a,o=e._i,u=ft.exec(o)||mt.exec(o);if(u){for(g(e).iso=!0,t=0,n=yt.length;t<n;t++)if(yt[t][1].exec(u[1])){i=yt[t][0],s=!1!==yt[t][2];break}if(null==i)return void(e._isValid=!1);if(u[3]){for(t=0,n=gt.length;t<n;t++)if(gt[t][1].exec(u[3])){r=(u[2]||" ")+gt[t][0];break}if(null==r)return void(e._isValid=!1)}if(!s&&null!=r)return void(e._isValid=!1);if(u[4]){if(!_t.exec(u[4]))return void(e._isValid=!1);a="Z"}e._f=i+(r||"")+(a||""),kt(e)}else e._isValid=!1}var wt=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;function Mt(e,t,n,s,i,r){var a=[function(e){var t=parseInt(e,10);{if(t<=49)return 2e3+t;if(t<=999)return 1900+t}return t}(e),Re.indexOf(t),parseInt(n,10),parseInt(s,10),parseInt(i,10)];return r&&a.push(parseInt(r,10)),a}var St={UT:0,GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function Dt(e){var t,n,s,i=wt.exec(e._i.replace(/\([^)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s\s*/,"").replace(/\s\s*$/,""));if(i){var r=Mt(i[4],i[3],i[2],i[5],i[6],i[7]);if(t=i[1],n=r,s=e,t&&Ze.indexOf(t)!==new Date(n[0],n[1],n[2]).getDay()&&(g(s).weekdayMismatch=!0,!(s._isValid=!1)))return;e._a=r,e._tzm=function(e,t,n){if(e)return St[e];if(t)return 0;var s=parseInt(n,10),i=s%100;return(s-i)/100*60+i}(i[8],i[9],i[10]),e._d=Ge.apply(null,e._a),e._d.setUTCMinutes(e._d.getUTCMinutes()-e._tzm),g(e).rfc2822=!0}else e._isValid=!1}function kt(e){if(e._f!==c.ISO_8601)if(e._f!==c.RFC_2822){e._a=[],g(e).empty=!0;var t,n,s,i,r,a,o,u,l=""+e._i,d=l.length,h=0;for(s=j(e._f,e._locale).match(N)||[],t=0;t<s.length;t++)i=s[t],(n=(l.match(le(i,e))||[])[0])&&(0<(r=l.substr(0,l.indexOf(n))).length&&g(e).unusedInput.push(r),l=l.slice(l.indexOf(n)+n.length),h+=n.length),E[i]?(n?g(e).empty=!1:g(e).unusedTokens.push(i),a=i,u=e,null!=(o=n)&&m(he,a)&&he[a](o,u._a,u,a)):e._strict&&!n&&g(e).unusedTokens.push(i);g(e).charsLeftOver=d-h,0<l.length&&g(e).unusedInput.push(l),e._a[ge]<=12&&!0===g(e).bigHour&&0<e._a[ge]&&(g(e).bigHour=void 0),g(e).parsedDateParts=e._a.slice(0),g(e).meridiem=e._meridiem,e._a[ge]=function(e,t,n){var s;if(null==n)return t;return null!=e.meridiemHour?e.meridiemHour(t,n):(null!=e.isPM&&((s=e.isPM(n))&&t<12&&(t+=12),s||12!==t||(t=0)),t)}(e._locale,e._a[ge],e._meridiem),ct(e),dt(e)}else Dt(e);else vt(e)}function Yt(e){var t,n,s,i,r=e._i,a=e._f;return e._locale=e._locale||lt(e._l),null===r||void 0===a&&""===r?v({nullInput:!0}):("string"==typeof r&&(e._i=r=e._locale.preparse(r)),S(r)?new M(dt(r)):(h(r)?e._d=r:o(a)?function(e){var t,n,s,i,r;if(0===e._f.length)return g(e).invalidFormat=!0,e._d=new Date(NaN);for(i=0;i<e._f.length;i++)r=0,t=w({},e),null!=e._useUTC&&(t._useUTC=e._useUTC),t._f=e._f[i],kt(t),p(t)&&(r+=g(t).charsLeftOver,r+=10*g(t).unusedTokens.length,g(t).score=r,(null==s||r<s)&&(s=r,n=t));_(e,n||t)}(e):a?kt(e):l(n=(t=e)._i)?t._d=new Date(c.now()):h(n)?t._d=new Date(n.valueOf()):"string"==typeof n?(s=t,null===(i=pt.exec(s._i))?(vt(s),!1===s._isValid&&(delete s._isValid,Dt(s),!1===s._isValid&&(delete s._isValid,c.createFromInputFallback(s)))):s._d=new Date(+i[1])):o(n)?(t._a=f(n.slice(0),function(e){return parseInt(e,10)}),ct(t)):u(n)?function(e){if(!e._d){var t=C(e._i);e._a=f([t.year,t.month,t.day||t.date,t.hour,t.minute,t.second,t.millisecond],function(e){return e&&parseInt(e,10)}),ct(e)}}(t):d(n)?t._d=new Date(n):c.createFromInputFallback(t),p(e)||(e._d=null),e))}function Ot(e,t,n,s,i){var r,a={};return!0!==n&&!1!==n||(s=n,n=void 0),(u(e)&&function(e){if(Object.getOwnPropertyNames)return 0===Object.getOwnPropertyNames(e).length;var t;for(t in e)if(e.hasOwnProperty(t))return!1;return!0}(e)||o(e)&&0===e.length)&&(e=void 0),a._isAMomentObject=!0,a._useUTC=a._isUTC=i,a._l=n,a._i=e,a._f=t,a._strict=s,(r=new M(dt(Yt(a))))._nextDay&&(r.add(1,"d"),r._nextDay=void 0),r}function Tt(e,t,n,s){return Ot(e,t,n,s,!1)}c.createFromInputFallback=n("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",function(e){e._d=new Date(e._i+(e._useUTC?" UTC":""))}),c.ISO_8601=function(){},c.RFC_2822=function(){};var xt=n("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var e=Tt.apply(null,arguments);return this.isValid()&&e.isValid()?e<this?this:e:v()}),bt=n("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var e=Tt.apply(null,arguments);return this.isValid()&&e.isValid()?this<e?this:e:v()});function Pt(e,t){var n,s;if(1===t.length&&o(t[0])&&(t=t[0]),!t.length)return Tt();for(n=t[0],s=1;s<t.length;++s)t[s].isValid()&&!t[s][e](n)||(n=t[s]);return n}var Wt=["year","quarter","month","week","day","hour","minute","second","millisecond"];function Ht(e){var t=C(e),n=t.year||0,s=t.quarter||0,i=t.month||0,r=t.week||t.isoWeek||0,a=t.day||0,o=t.hour||0,u=t.minute||0,l=t.second||0,d=t.millisecond||0;this._isValid=function(e){for(var t in e)if(-1===Ye.call(Wt,t)||null!=e[t]&&isNaN(e[t]))return!1;for(var n=!1,s=0;s<Wt.length;++s)if(e[Wt[s]]){if(n)return!1;parseFloat(e[Wt[s]])!==k(e[Wt[s]])&&(n=!0)}return!0}(t),this._milliseconds=+d+1e3*l+6e4*u+1e3*o*60*60,this._days=+a+7*r,this._months=+i+3*s+12*n,this._data={},this._locale=lt(),this._bubble()}function Rt(e){return e instanceof Ht}function Ct(e){return e<0?-1*Math.round(-1*e):Math.round(e)}function Ft(e,n){I(e,0,0,function(){var e=this.utcOffset(),t="+";return e<0&&(e=-e,t="-"),t+U(~~(e/60),2)+n+U(~~e%60,2)})}Ft("Z",":"),Ft("ZZ",""),ue("Z",re),ue("ZZ",re),ce(["Z","ZZ"],function(e,t,n){n._useUTC=!0,n._tzm=Ut(re,e)});var Lt=/([\+\-]|\d\d)/gi;function Ut(e,t){var n=(t||"").match(e);if(null===n)return null;var s=((n[n.length-1]||[])+"").match(Lt)||["-",0,0],i=60*s[1]+k(s[2]);return 0===i?0:"+"===s[0]?i:-i}function Nt(e,t){var n,s;return t._isUTC?(n=t.clone(),s=(S(e)||h(e)?e.valueOf():Tt(e).valueOf())-n.valueOf(),n._d.setTime(n._d.valueOf()+s),c.updateOffset(n,!1),n):Tt(e).local()}function Gt(e){return 15*-Math.round(e._d.getTimezoneOffset()/15)}function Vt(){return!!this.isValid()&&(this._isUTC&&0===this._offset)}c.updateOffset=function(){};var Et=/^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,It=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;function At(e,t){var n,s,i,r=e,a=null;return Rt(e)?r={ms:e._milliseconds,d:e._days,M:e._months}:d(e)?(r={},t?r[t]=e:r.milliseconds=e):(a=Et.exec(e))?(n="-"===a[1]?-1:1,r={y:0,d:k(a[ye])*n,h:k(a[ge])*n,m:k(a[pe])*n,s:k(a[ve])*n,ms:k(Ct(1e3*a[we]))*n}):(a=It.exec(e))?(n="-"===a[1]?-1:1,r={y:jt(a[2],n),M:jt(a[3],n),w:jt(a[4],n),d:jt(a[5],n),h:jt(a[6],n),m:jt(a[7],n),s:jt(a[8],n)}):null==r?r={}:"object"==typeof r&&("from"in r||"to"in r)&&(i=function(e,t){var n;if(!e.isValid()||!t.isValid())return{milliseconds:0,months:0};t=Nt(t,e),e.isBefore(t)?n=Zt(e,t):((n=Zt(t,e)).milliseconds=-n.milliseconds,n.months=-n.months);return n}(Tt(r.from),Tt(r.to)),(r={}).ms=i.milliseconds,r.M=i.months),s=new Ht(r),Rt(e)&&m(e,"_locale")&&(s._locale=e._locale),s}function jt(e,t){var n=e&&parseFloat(e.replace(",","."));return(isNaN(n)?0:n)*t}function Zt(e,t){var n={milliseconds:0,months:0};return n.months=t.month()-e.month()+12*(t.year()-e.year()),e.clone().add(n.months,"M").isAfter(t)&&--n.months,n.milliseconds=+t-+e.clone().add(n.months,"M"),n}function zt(s,i){return function(e,t){var n;return null===t||isNaN(+t)||(T(i,"moment()."+i+"(period, number) is deprecated. Please use moment()."+i+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),n=e,e=t,t=n),$t(this,At(e="string"==typeof e?+e:e,t),s),this}}function $t(e,t,n,s){var i=t._milliseconds,r=Ct(t._days),a=Ct(t._months);e.isValid()&&(s=null==s||s,a&&Ce(e,xe(e,"Month")+a*n),r&&be(e,"Date",xe(e,"Date")+r*n),i&&e._d.setTime(e._d.valueOf()+i*n),s&&c.updateOffset(e,r||a))}At.fn=Ht.prototype,At.invalid=function(){return At(NaN)};var qt=zt(1,"add"),Jt=zt(-1,"subtract");function Bt(e,t){var n=12*(t.year()-e.year())+(t.month()-e.month()),s=e.clone().add(n,"months");return-(n+(t-s<0?(t-s)/(s-e.clone().add(n-1,"months")):(t-s)/(e.clone().add(n+1,"months")-s)))||0}function Qt(e){var t;return void 0===e?this._locale._abbr:(null!=(t=lt(e))&&(this._locale=t),this)}c.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",c.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var Xt=n("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(e){return void 0===e?this.localeData():this.locale(e)});function Kt(){return this._locale}function en(e,t){I(0,[e,e.length],0,t)}function tn(e,t,n,s,i){var r;return null==e?Ie(this,s,i).year:((r=Ae(e,s,i))<t&&(t=r),function(e,t,n,s,i){var r=Ee(e,t,n,s,i),a=Ge(r.year,0,r.dayOfYear);return this.year(a.getUTCFullYear()),this.month(a.getUTCMonth()),this.date(a.getUTCDate()),this}.call(this,e,t,n,s,i))}I(0,["gg",2],0,function(){return this.weekYear()%100}),I(0,["GG",2],0,function(){return this.isoWeekYear()%100}),en("gggg","weekYear"),en("ggggg","weekYear"),en("GGGG","isoWeekYear"),en("GGGGG","isoWeekYear"),H("weekYear","gg"),H("isoWeekYear","GG"),L("weekYear",1),L("isoWeekYear",1),ue("G",se),ue("g",se),ue("GG",B,z),ue("gg",B,z),ue("GGGG",ee,q),ue("gggg",ee,q),ue("GGGGG",te,J),ue("ggggg",te,J),fe(["gggg","ggggg","GGGG","GGGGG"],function(e,t,n,s){t[s.substr(0,2)]=k(e)}),fe(["gg","GG"],function(e,t,n,s){t[s]=c.parseTwoDigitYear(e)}),I("Q",0,"Qo","quarter"),H("quarter","Q"),L("quarter",7),ue("Q",Z),ce("Q",function(e,t){t[_e]=3*(k(e)-1)}),I("D",["DD",2],"Do","date"),H("date","D"),L("date",9),ue("D",B),ue("DD",B,z),ue("Do",function(e,t){return e?t._dayOfMonthOrdinalParse||t._ordinalParse:t._dayOfMonthOrdinalParseLenient}),ce(["D","DD"],ye),ce("Do",function(e,t){t[ye]=k(e.match(B)[0])});var nn=Te("Date",!0);I("DDD",["DDDD",3],"DDDo","dayOfYear"),H("dayOfYear","DDD"),L("dayOfYear",4),ue("DDD",K),ue("DDDD",$),ce(["DDD","DDDD"],function(e,t,n){n._dayOfYear=k(e)}),I("m",["mm",2],0,"minute"),H("minute","m"),L("minute",14),ue("m",B),ue("mm",B,z),ce(["m","mm"],pe);var sn=Te("Minutes",!1);I("s",["ss",2],0,"second"),H("second","s"),L("second",15),ue("s",B),ue("ss",B,z),ce(["s","ss"],ve);var rn,an=Te("Seconds",!1);for(I("S",0,0,function(){return~~(this.millisecond()/100)}),I(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),I(0,["SSS",3],0,"millisecond"),I(0,["SSSS",4],0,function(){return 10*this.millisecond()}),I(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),I(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),I(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),I(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),I(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),H("millisecond","ms"),L("millisecond",16),ue("S",K,Z),ue("SS",K,z),ue("SSS",K,$),rn="SSSS";rn.length<=9;rn+="S")ue(rn,ne);function on(e,t){t[we]=k(1e3*("0."+e))}for(rn="S";rn.length<=9;rn+="S")ce(rn,on);var un=Te("Milliseconds",!1);I("z",0,0,"zoneAbbr"),I("zz",0,0,"zoneName");var ln=M.prototype;function dn(e){return e}ln.add=qt,ln.calendar=function(e,t){var n=e||Tt(),s=Nt(n,this).startOf("day"),i=c.calendarFormat(this,s)||"sameElse",r=t&&(x(t[i])?t[i].call(this,n):t[i]);return this.format(r||this.localeData().calendar(i,this,Tt(n)))},ln.clone=function(){return new M(this)},ln.diff=function(e,t,n){var s,i,r;if(!this.isValid())return NaN;if(!(s=Nt(e,this)).isValid())return NaN;switch(i=6e4*(s.utcOffset()-this.utcOffset()),t=R(t)){case"year":r=Bt(this,s)/12;break;case"month":r=Bt(this,s);break;case"quarter":r=Bt(this,s)/3;break;case"second":r=(this-s)/1e3;break;case"minute":r=(this-s)/6e4;break;case"hour":r=(this-s)/36e5;break;case"day":r=(this-s-i)/864e5;break;case"week":r=(this-s-i)/6048e5;break;default:r=this-s}return n?r:D(r)},ln.endOf=function(e){return void 0===(e=R(e))||"millisecond"===e?this:("date"===e&&(e="day"),this.startOf(e).add(1,"isoWeek"===e?"week":e).subtract(1,"ms"))},ln.format=function(e){e||(e=this.isUtc()?c.defaultFormatUtc:c.defaultFormat);var t=A(this,e);return this.localeData().postformat(t)},ln.from=function(e,t){return this.isValid()&&(S(e)&&e.isValid()||Tt(e).isValid())?At({to:this,from:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()},ln.fromNow=function(e){return this.from(Tt(),e)},ln.to=function(e,t){return this.isValid()&&(S(e)&&e.isValid()||Tt(e).isValid())?At({from:this,to:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()},ln.toNow=function(e){return this.to(Tt(),e)},ln.get=function(e){return x(this[e=R(e)])?this[e]():this},ln.invalidAt=function(){return g(this).overflow},ln.isAfter=function(e,t){var n=S(e)?e:Tt(e);return!(!this.isValid()||!n.isValid())&&("millisecond"===(t=R(t)||"millisecond")?this.valueOf()>n.valueOf():n.valueOf()<this.clone().startOf(t).valueOf())},ln.isBefore=function(e,t){var n=S(e)?e:Tt(e);return!(!this.isValid()||!n.isValid())&&("millisecond"===(t=R(t)||"millisecond")?this.valueOf()<n.valueOf():this.clone().endOf(t).valueOf()<n.valueOf())},ln.isBetween=function(e,t,n,s){var i=S(e)?e:Tt(e),r=S(t)?t:Tt(t);return!!(this.isValid()&&i.isValid()&&r.isValid())&&("("===(s=s||"()")[0]?this.isAfter(i,n):!this.isBefore(i,n))&&(")"===s[1]?this.isBefore(r,n):!this.isAfter(r,n))},ln.isSame=function(e,t){var n,s=S(e)?e:Tt(e);return!(!this.isValid()||!s.isValid())&&("millisecond"===(t=R(t)||"millisecond")?this.valueOf()===s.valueOf():(n=s.valueOf(),this.clone().startOf(t).valueOf()<=n&&n<=this.clone().endOf(t).valueOf()))},ln.isSameOrAfter=function(e,t){return this.isSame(e,t)||this.isAfter(e,t)},ln.isSameOrBefore=function(e,t){return this.isSame(e,t)||this.isBefore(e,t)},ln.isValid=function(){return p(this)},ln.lang=Xt,ln.locale=Qt,ln.localeData=Kt,ln.max=bt,ln.min=xt,ln.parsingFlags=function(){return _({},g(this))},ln.set=function(e,t){if("object"==typeof e)for(var n=function(e){var t=[];for(var n in e)t.push({unit:n,priority:F[n]});return t.sort(function(e,t){return e.priority-t.priority}),t}(e=C(e)),s=0;s<n.length;s++)this[n[s].unit](e[n[s].unit]);else if(x(this[e=R(e)]))return this[e](t);return this},ln.startOf=function(e){switch(e=R(e)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":case"date":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===e&&this.weekday(0),"isoWeek"===e&&this.isoWeekday(1),"quarter"===e&&this.month(3*Math.floor(this.month()/3)),this},ln.subtract=Jt,ln.toArray=function(){var e=this;return[e.year(),e.month(),e.date(),e.hour(),e.minute(),e.second(),e.millisecond()]},ln.toObject=function(){var e=this;return{years:e.year(),months:e.month(),date:e.date(),hours:e.hours(),minutes:e.minutes(),seconds:e.seconds(),milliseconds:e.milliseconds()}},ln.toDate=function(){return new Date(this.valueOf())},ln.toISOString=function(e){if(!this.isValid())return null;var t=!0!==e,n=t?this.clone().utc():this;return n.year()<0||9999<n.year()?A(n,t?"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"):x(Date.prototype.toISOString)?t?this.toDate().toISOString():new Date(this.valueOf()+60*this.utcOffset()*1e3).toISOString().replace("Z",A(n,"Z")):A(n,t?"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYY-MM-DD[T]HH:mm:ss.SSSZ")},ln.inspect=function(){if(!this.isValid())return"moment.invalid(/* "+this._i+" */)";var e="moment",t="";this.isLocal()||(e=0===this.utcOffset()?"moment.utc":"moment.parseZone",t="Z");var n="["+e+'("]',s=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",i=t+'[")]';return this.format(n+s+"-MM-DD[T]HH:mm:ss.SSS"+i)},ln.toJSON=function(){return this.isValid()?this.toISOString():null},ln.toString=function(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},ln.unix=function(){return Math.floor(this.valueOf()/1e3)},ln.valueOf=function(){return this._d.valueOf()-6e4*(this._offset||0)},ln.creationData=function(){return{input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}},ln.year=Oe,ln.isLeapYear=function(){return ke(this.year())},ln.weekYear=function(e){return tn.call(this,e,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)},ln.isoWeekYear=function(e){return tn.call(this,e,this.isoWeek(),this.isoWeekday(),1,4)},ln.quarter=ln.quarters=function(e){return null==e?Math.ceil((this.month()+1)/3):this.month(3*(e-1)+this.month()%3)},ln.month=Fe,ln.daysInMonth=function(){return Pe(this.year(),this.month())},ln.week=ln.weeks=function(e){var t=this.localeData().week(this);return null==e?t:this.add(7*(e-t),"d")},ln.isoWeek=ln.isoWeeks=function(e){var t=Ie(this,1,4).week;return null==e?t:this.add(7*(e-t),"d")},ln.weeksInYear=function(){var e=this.localeData()._week;return Ae(this.year(),e.dow,e.doy)},ln.isoWeeksInYear=function(){return Ae(this.year(),1,4)},ln.date=nn,ln.day=ln.days=function(e){if(!this.isValid())return null!=e?this:NaN;var t,n,s=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=e?(t=e,n=this.localeData(),e="string"!=typeof t?t:isNaN(t)?"number"==typeof(t=n.weekdaysParse(t))?t:null:parseInt(t,10),this.add(e-s,"d")):s},ln.weekday=function(e){if(!this.isValid())return null!=e?this:NaN;var t=(this.day()+7-this.localeData()._week.dow)%7;return null==e?t:this.add(e-t,"d")},ln.isoWeekday=function(e){if(!this.isValid())return null!=e?this:NaN;if(null==e)return this.day()||7;var t,n,s=(t=e,n=this.localeData(),"string"==typeof t?n.weekdaysParse(t)%7||7:isNaN(t)?null:t);return this.day(this.day()%7?s:s-7)},ln.dayOfYear=function(e){var t=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==e?t:this.add(e-t,"d")},ln.hour=ln.hours=tt,ln.minute=ln.minutes=sn,ln.second=ln.seconds=an,ln.millisecond=ln.milliseconds=un,ln.utcOffset=function(e,t,n){var s,i=this._offset||0;if(!this.isValid())return null!=e?this:NaN;if(null==e)return this._isUTC?i:Gt(this);if("string"==typeof e){if(null===(e=Ut(re,e)))return this}else Math.abs(e)<16&&!n&&(e*=60);return!this._isUTC&&t&&(s=Gt(this)),this._offset=e,this._isUTC=!0,null!=s&&this.add(s,"m"),i!==e&&(!t||this._changeInProgress?$t(this,At(e-i,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,c.updateOffset(this,!0),this._changeInProgress=null)),this},ln.utc=function(e){return this.utcOffset(0,e)},ln.local=function(e){return this._isUTC&&(this.utcOffset(0,e),this._isUTC=!1,e&&this.subtract(Gt(this),"m")),this},ln.parseZone=function(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var e=Ut(ie,this._i);null!=e?this.utcOffset(e):this.utcOffset(0,!0)}return this},ln.hasAlignedHourOffset=function(e){return!!this.isValid()&&(e=e?Tt(e).utcOffset():0,(this.utcOffset()-e)%60==0)},ln.isDST=function(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()},ln.isLocal=function(){return!!this.isValid()&&!this._isUTC},ln.isUtcOffset=function(){return!!this.isValid()&&this._isUTC},ln.isUtc=Vt,ln.isUTC=Vt,ln.zoneAbbr=function(){return this._isUTC?"UTC":""},ln.zoneName=function(){return this._isUTC?"Coordinated Universal Time":""},ln.dates=n("dates accessor is deprecated. Use date instead.",nn),ln.months=n("months accessor is deprecated. Use month instead",Fe),ln.years=n("years accessor is deprecated. Use year instead",Oe),ln.zone=n("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",function(e,t){return null!=e?("string"!=typeof e&&(e=-e),this.utcOffset(e,t),this):-this.utcOffset()}),ln.isDSTShifted=n("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",function(){if(!l(this._isDSTShifted))return this._isDSTShifted;var e={};if(w(e,this),(e=Yt(e))._a){var t=e._isUTC?y(e._a):Tt(e._a);this._isDSTShifted=this.isValid()&&0<a(e._a,t.toArray())}else this._isDSTShifted=!1;return this._isDSTShifted});var hn=P.prototype;function cn(e,t,n,s){var i=lt(),r=y().set(s,t);return i[n](r,e)}function fn(e,t,n){if(d(e)&&(t=e,e=void 0),e=e||"",null!=t)return cn(e,t,n,"month");var s,i=[];for(s=0;s<12;s++)i[s]=cn(e,s,n,"month");return i}function mn(e,t,n,s){t=("boolean"==typeof e?d(t)&&(n=t,t=void 0):(t=e,e=!1,d(n=t)&&(n=t,t=void 0)),t||"");var i,r=lt(),a=e?r._week.dow:0;if(null!=n)return cn(t,(n+a)%7,s,"day");var o=[];for(i=0;i<7;i++)o[i]=cn(t,(i+a)%7,s,"day");return o}hn.calendar=function(e,t,n){var s=this._calendar[e]||this._calendar.sameElse;return x(s)?s.call(t,n):s},hn.longDateFormat=function(e){var t=this._longDateFormat[e],n=this._longDateFormat[e.toUpperCase()];return t||!n?t:(this._longDateFormat[e]=n.replace(/MMMM|MM|DD|dddd/g,function(e){return e.slice(1)}),this._longDateFormat[e])},hn.invalidDate=function(){return this._invalidDate},hn.ordinal=function(e){return this._ordinal.replace("%d",e)},hn.preparse=dn,hn.postformat=dn,hn.relativeTime=function(e,t,n,s){var i=this._relativeTime[n];return x(i)?i(e,t,n,s):i.replace(/%d/i,e)},hn.pastFuture=function(e,t){var n=this._relativeTime[0<e?"future":"past"];return x(n)?n(t):n.replace(/%s/i,t)},hn.set=function(e){var t,n;for(n in e)x(t=e[n])?this[n]=t:this["_"+n]=t;this._config=e,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source)},hn.months=function(e,t){return e?o(this._months)?this._months[e.month()]:this._months[(this._months.isFormat||We).test(t)?"format":"standalone"][e.month()]:o(this._months)?this._months:this._months.standalone},hn.monthsShort=function(e,t){return e?o(this._monthsShort)?this._monthsShort[e.month()]:this._monthsShort[We.test(t)?"format":"standalone"][e.month()]:o(this._monthsShort)?this._monthsShort:this._monthsShort.standalone},hn.monthsParse=function(e,t,n){var s,i,r;if(this._monthsParseExact)return function(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],s=0;s<12;++s)r=y([2e3,s]),this._shortMonthsParse[s]=this.monthsShort(r,"").toLocaleLowerCase(),this._longMonthsParse[s]=this.months(r,"").toLocaleLowerCase();return n?"MMM"===t?-1!==(i=Ye.call(this._shortMonthsParse,a))?i:null:-1!==(i=Ye.call(this._longMonthsParse,a))?i:null:"MMM"===t?-1!==(i=Ye.call(this._shortMonthsParse,a))?i:-1!==(i=Ye.call(this._longMonthsParse,a))?i:null:-1!==(i=Ye.call(this._longMonthsParse,a))?i:-1!==(i=Ye.call(this._shortMonthsParse,a))?i:null}.call(this,e,t,n);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),s=0;s<12;s++){if(i=y([2e3,s]),n&&!this._longMonthsParse[s]&&(this._longMonthsParse[s]=new RegExp("^"+this.months(i,"").replace(".","")+"$","i"),this._shortMonthsParse[s]=new RegExp("^"+this.monthsShort(i,"").replace(".","")+"$","i")),n||this._monthsParse[s]||(r="^"+this.months(i,"")+"|^"+this.monthsShort(i,""),this._monthsParse[s]=new RegExp(r.replace(".",""),"i")),n&&"MMMM"===t&&this._longMonthsParse[s].test(e))return s;if(n&&"MMM"===t&&this._shortMonthsParse[s].test(e))return s;if(!n&&this._monthsParse[s].test(e))return s}},hn.monthsRegex=function(e){return this._monthsParseExact?(m(this,"_monthsRegex")||Ne.call(this),e?this._monthsStrictRegex:this._monthsRegex):(m(this,"_monthsRegex")||(this._monthsRegex=Ue),this._monthsStrictRegex&&e?this._monthsStrictRegex:this._monthsRegex)},hn.monthsShortRegex=function(e){return this._monthsParseExact?(m(this,"_monthsRegex")||Ne.call(this),e?this._monthsShortStrictRegex:this._monthsShortRegex):(m(this,"_monthsShortRegex")||(this._monthsShortRegex=Le),this._monthsShortStrictRegex&&e?this._monthsShortStrictRegex:this._monthsShortRegex)},hn.week=function(e){return Ie(e,this._week.dow,this._week.doy).week},hn.firstDayOfYear=function(){return this._week.doy},hn.firstDayOfWeek=function(){return this._week.dow},hn.weekdays=function(e,t){return e?o(this._weekdays)?this._weekdays[e.day()]:this._weekdays[this._weekdays.isFormat.test(t)?"format":"standalone"][e.day()]:o(this._weekdays)?this._weekdays:this._weekdays.standalone},hn.weekdaysMin=function(e){return e?this._weekdaysMin[e.day()]:this._weekdaysMin},hn.weekdaysShort=function(e){return e?this._weekdaysShort[e.day()]:this._weekdaysShort},hn.weekdaysParse=function(e,t,n){var s,i,r;if(this._weekdaysParseExact)return function(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],s=0;s<7;++s)r=y([2e3,1]).day(s),this._minWeekdaysParse[s]=this.weekdaysMin(r,"").toLocaleLowerCase(),this._shortWeekdaysParse[s]=this.weekdaysShort(r,"").toLocaleLowerCase(),this._weekdaysParse[s]=this.weekdays(r,"").toLocaleLowerCase();return n?"dddd"===t?-1!==(i=Ye.call(this._weekdaysParse,a))?i:null:"ddd"===t?-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:null:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:null:"dddd"===t?-1!==(i=Ye.call(this._weekdaysParse,a))?i:-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:null:"ddd"===t?-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:-1!==(i=Ye.call(this._weekdaysParse,a))?i:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:null:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:-1!==(i=Ye.call(this._weekdaysParse,a))?i:-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:null}.call(this,e,t,n);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),s=0;s<7;s++){if(i=y([2e3,1]).day(s),n&&!this._fullWeekdaysParse[s]&&(this._fullWeekdaysParse[s]=new RegExp("^"+this.weekdays(i,"").replace(".","\\.?")+"$","i"),this._shortWeekdaysParse[s]=new RegExp("^"+this.weekdaysShort(i,"").replace(".","\\.?")+"$","i"),this._minWeekdaysParse[s]=new RegExp("^"+this.weekdaysMin(i,"").replace(".","\\.?")+"$","i")),this._weekdaysParse[s]||(r="^"+this.weekdays(i,"")+"|^"+this.weekdaysShort(i,"")+"|^"+this.weekdaysMin(i,""),this._weekdaysParse[s]=new RegExp(r.replace(".",""),"i")),n&&"dddd"===t&&this._fullWeekdaysParse[s].test(e))return s;if(n&&"ddd"===t&&this._shortWeekdaysParse[s].test(e))return s;if(n&&"dd"===t&&this._minWeekdaysParse[s].test(e))return s;if(!n&&this._weekdaysParse[s].test(e))return s}},hn.weekdaysRegex=function(e){return this._weekdaysParseExact?(m(this,"_weekdaysRegex")||Be.call(this),e?this._weekdaysStrictRegex:this._weekdaysRegex):(m(this,"_weekdaysRegex")||(this._weekdaysRegex=$e),this._weekdaysStrictRegex&&e?this._weekdaysStrictRegex:this._weekdaysRegex)},hn.weekdaysShortRegex=function(e){return this._weekdaysParseExact?(m(this,"_weekdaysRegex")||Be.call(this),e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(m(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=qe),this._weekdaysShortStrictRegex&&e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)},hn.weekdaysMinRegex=function(e){return this._weekdaysParseExact?(m(this,"_weekdaysRegex")||Be.call(this),e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(m(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=Je),this._weekdaysMinStrictRegex&&e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)},hn.isPM=function(e){return"p"===(e+"").toLowerCase().charAt(0)},hn.meridiem=function(e,t,n){return 11<e?n?"pm":"PM":n?"am":"AM"},ot("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(e){var t=e%10;return e+(1===k(e%100/10)?"th":1===t?"st":2===t?"nd":3===t?"rd":"th")}}),c.lang=n("moment.lang is deprecated. Use moment.locale instead.",ot),c.langData=n("moment.langData is deprecated. Use moment.localeData instead.",lt);var _n=Math.abs;function yn(e,t,n,s){var i=At(t,n);return e._milliseconds+=s*i._milliseconds,e._days+=s*i._days,e._months+=s*i._months,e._bubble()}function gn(e){return e<0?Math.floor(e):Math.ceil(e)}function pn(e){return 4800*e/146097}function vn(e){return 146097*e/4800}function wn(e){return function(){return this.as(e)}}var Mn=wn("ms"),Sn=wn("s"),Dn=wn("m"),kn=wn("h"),Yn=wn("d"),On=wn("w"),Tn=wn("M"),xn=wn("y");function bn(e){return function(){return this.isValid()?this._data[e]:NaN}}var Pn=bn("milliseconds"),Wn=bn("seconds"),Hn=bn("minutes"),Rn=bn("hours"),Cn=bn("days"),Fn=bn("months"),Ln=bn("years");var Un=Math.round,Nn={ss:44,s:45,m:45,h:22,d:26,M:11};var Gn=Math.abs;function Vn(e){return(0<e)-(e<0)||+e}function En(){if(!this.isValid())return this.localeData().invalidDate();var e,t,n=Gn(this._milliseconds)/1e3,s=Gn(this._days),i=Gn(this._months);t=D((e=D(n/60))/60),n%=60,e%=60;var r=D(i/12),a=i%=12,o=s,u=t,l=e,d=n?n.toFixed(3).replace(/\.?0+$/,""):"",h=this.asSeconds();if(!h)return"P0D";var c=h<0?"-":"",f=Vn(this._months)!==Vn(h)?"-":"",m=Vn(this._days)!==Vn(h)?"-":"",_=Vn(this._milliseconds)!==Vn(h)?"-":"";return c+"P"+(r?f+r+"Y":"")+(a?f+a+"M":"")+(o?m+o+"D":"")+(u||l||d?"T":"")+(u?_+u+"H":"")+(l?_+l+"M":"")+(d?_+d+"S":"")}var In=Ht.prototype;return In.isValid=function(){return this._isValid},In.abs=function(){var e=this._data;return this._milliseconds=_n(this._milliseconds),this._days=_n(this._days),this._months=_n(this._months),e.milliseconds=_n(e.milliseconds),e.seconds=_n(e.seconds),e.minutes=_n(e.minutes),e.hours=_n(e.hours),e.months=_n(e.months),e.years=_n(e.years),this},In.add=function(e,t){return yn(this,e,t,1)},In.subtract=function(e,t){return yn(this,e,t,-1)},In.as=function(e){if(!this.isValid())return NaN;var t,n,s=this._milliseconds;if("month"===(e=R(e))||"year"===e)return t=this._days+s/864e5,n=this._months+pn(t),"month"===e?n:n/12;switch(t=this._days+Math.round(vn(this._months)),e){case"week":return t/7+s/6048e5;case"day":return t+s/864e5;case"hour":return 24*t+s/36e5;case"minute":return 1440*t+s/6e4;case"second":return 86400*t+s/1e3;case"millisecond":return Math.floor(864e5*t)+s;default:throw new Error("Unknown unit "+e)}},In.asMilliseconds=Mn,In.asSeconds=Sn,In.asMinutes=Dn,In.asHours=kn,In.asDays=Yn,In.asWeeks=On,In.asMonths=Tn,In.asYears=xn,In.valueOf=function(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*k(this._months/12):NaN},In._bubble=function(){var e,t,n,s,i,r=this._milliseconds,a=this._days,o=this._months,u=this._data;return 0<=r&&0<=a&&0<=o||r<=0&&a<=0&&o<=0||(r+=864e5*gn(vn(o)+a),o=a=0),u.milliseconds=r%1e3,e=D(r/1e3),u.seconds=e%60,t=D(e/60),u.minutes=t%60,n=D(t/60),u.hours=n%24,o+=i=D(pn(a+=D(n/24))),a-=gn(vn(i)),s=D(o/12),o%=12,u.days=a,u.months=o,u.years=s,this},In.clone=function(){return At(this)},In.get=function(e){return e=R(e),this.isValid()?this[e+"s"]():NaN},In.milliseconds=Pn,In.seconds=Wn,In.minutes=Hn,In.hours=Rn,In.days=Cn,In.weeks=function(){return D(this.days()/7)},In.months=Fn,In.years=Ln,In.humanize=function(e){if(!this.isValid())return this.localeData().invalidDate();var t,n,s,i,r,a,o,u,l,d,h,c=this.localeData(),f=(n=!e,s=c,i=At(t=this).abs(),r=Un(i.as("s")),a=Un(i.as("m")),o=Un(i.as("h")),u=Un(i.as("d")),l=Un(i.as("M")),d=Un(i.as("y")),(h=r<=Nn.ss&&["s",r]||r<Nn.s&&["ss",r]||a<=1&&["m"]||a<Nn.m&&["mm",a]||o<=1&&["h"]||o<Nn.h&&["hh",o]||u<=1&&["d"]||u<Nn.d&&["dd",u]||l<=1&&["M"]||l<Nn.M&&["MM",l]||d<=1&&["y"]||["yy",d])[2]=n,h[3]=0<+t,h[4]=s,function(e,t,n,s,i){return i.relativeTime(t||1,!!n,e,s)}.apply(null,h));return e&&(f=c.pastFuture(+this,f)),c.postformat(f)},In.toISOString=En,In.toString=En,In.toJSON=En,In.locale=Qt,In.localeData=Kt,In.toIsoString=n("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",En),In.lang=Xt,I("X",0,0,"unix"),I("x",0,0,"valueOf"),ue("x",se),ue("X",/[+-]?\d+(\.\d{1,3})?/),ce("X",function(e,t,n){n._d=new Date(1e3*parseFloat(e,10))}),ce("x",function(e,t,n){n._d=new Date(k(e))}),c.version="2.23.0",e=Tt,c.fn=ln,c.min=function(){return Pt("isBefore",[].slice.call(arguments,0))},c.max=function(){return Pt("isAfter",[].slice.call(arguments,0))},c.now=function(){return Date.now?Date.now():+new Date},c.utc=y,c.unix=function(e){return Tt(1e3*e)},c.months=function(e,t){return fn(e,t,"months")},c.isDate=h,c.locale=ot,c.invalid=v,c.duration=At,c.isMoment=S,c.weekdays=function(e,t,n){return mn(e,t,n,"weekdays")},c.parseZone=function(){return Tt.apply(null,arguments).parseZone()},c.localeData=lt,c.isDuration=Rt,c.monthsShort=function(e,t){return fn(e,t,"monthsShort")},c.weekdaysMin=function(e,t,n){return mn(e,t,n,"weekdaysMin")},c.defineLocale=ut,c.updateLocale=function(e,t){if(null!=t){var n,s,i=nt;null!=(s=at(e))&&(i=s._config),(n=new P(t=b(i,t))).parentLocale=st[e],st[e]=n,ot(e)}else null!=st[e]&&(null!=st[e].parentLocale?st[e]=st[e].parentLocale:null!=st[e]&&delete st[e]);return st[e]},c.locales=function(){return s(st)},c.weekdaysShort=function(e,t,n){return mn(e,t,n,"weekdaysShort")},c.normalizeUnits=R,c.relativeTimeRounding=function(e){return void 0===e?Un:"function"==typeof e&&(Un=e,!0)},c.relativeTimeThreshold=function(e,t){return void 0!==Nn[e]&&(void 0===t?Nn[e]:(Nn[e]=t,"s"===e&&(Nn.ss=t-1),!0))},c.calendarFormat=function(e,t){var n=e.diff(t,"days",!0);return n<-6?"sameElse":n<-1?"lastWeek":n<0?"lastDay":n<1?"sameDay":n<2?"nextDay":n<7?"nextWeek":"sameElse"},c.prototype=ln,c.HTML5_FMT={DATETIME_LOCAL:"YYYY-MM-DDTHH:mm",DATETIME_LOCAL_SECONDS:"YYYY-MM-DDTHH:mm:ss",DATETIME_LOCAL_MS:"YYYY-MM-DDTHH:mm:ss.SSS",DATE:"YYYY-MM-DD",TIME:"HH:mm",TIME_SECONDS:"HH:mm:ss",TIME_MS:"HH:mm:ss.SSS",WEEK:"GGGG-[W]WW",MONTH:"YYYY-MM"},c});;

/*!
 * FullCalendar v3.10.0
 * Docs & License: https://fullcalendar.io/
 * (c) 2018 Adam Shaw
 */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(require("moment"),require("jquery")):"function"==typeof define&&define.amd?define(["moment","jquery"],e):"object"==typeof exports?exports.FullCalendar=e(require("moment"),require("jquery")):t.FullCalendar=e(t.moment,t.jQuery)}("undefined"!=typeof self?self:this,function(t,e){return function(t){function e(r){if(n[r])return n[r].exports;var i=n[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,e),i.l=!0,i.exports}var n={};return e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:r})},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=256)}([function(e,n){e.exports=t},,function(t,e){var n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])};e.__extends=function(t,e){function r(){this.constructor=t}n(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}},function(t,n){t.exports=e},function(t,e,n){function r(t,e){e.left&&t.css({"border-left-width":1,"margin-left":e.left-1}),e.right&&t.css({"border-right-width":1,"margin-right":e.right-1})}function i(t){t.css({"margin-left":"","margin-right":"","border-left-width":"","border-right-width":""})}function o(){ht("body").addClass("fc-not-allowed")}function s(){ht("body").removeClass("fc-not-allowed")}function a(t,e,n){var r=Math.floor(e/t.length),i=Math.floor(e-r*(t.length-1)),o=[],s=[],a=[],u=0;l(t),t.each(function(e,n){var l=e===t.length-1?i:r,d=ht(n).outerHeight(!0);d<l?(o.push(n),s.push(d),a.push(ht(n).height())):u+=d}),n&&(e-=u,r=Math.floor(e/o.length),i=Math.floor(e-r*(o.length-1))),ht(o).each(function(t,e){var n=t===o.length-1?i:r,l=s[t],u=a[t],d=n-(l-u);l<n&&ht(e).height(d)})}function l(t){t.height("")}function u(t){var e=0;return t.find("> *").each(function(t,n){var r=ht(n).outerWidth();r>e&&(e=r)}),e++,t.width(e),e}function d(t,e){var n,r=t.add(e);return r.css({position:"relative",left:-1}),n=t.outerHeight()-e.outerHeight(),r.css({position:"",left:""}),n}function c(t){var e=t.css("position"),n=t.parents().filter(function(){var t=ht(this);return/(auto|scroll)/.test(t.css("overflow")+t.css("overflow-y")+t.css("overflow-x"))}).eq(0);return"fixed"!==e&&n.length?n:ht(t[0].ownerDocument||document)}function p(t,e){var n=t.offset(),r=n.left-(e?e.left:0),i=n.top-(e?e.top:0);return{left:r,right:r+t.outerWidth(),top:i,bottom:i+t.outerHeight()}}function h(t,e){var n=t.offset(),r=g(t),i=n.left+b(t,"border-left-width")+r.left-(e?e.left:0),o=n.top+b(t,"border-top-width")+r.top-(e?e.top:0);return{left:i,right:i+t[0].clientWidth,top:o,bottom:o+t[0].clientHeight}}function f(t,e){var n=t.offset(),r=n.left+b(t,"border-left-width")+b(t,"padding-left")-(e?e.left:0),i=n.top+b(t,"border-top-width")+b(t,"padding-top")-(e?e.top:0);return{left:r,right:r+t.width(),top:i,bottom:i+t.height()}}function g(t){var e,n=t[0].offsetWidth-t[0].clientWidth,r=t[0].offsetHeight-t[0].clientHeight;return n=v(n),r=v(r),e={left:0,right:0,top:0,bottom:r},y()&&"rtl"===t.css("direction")?e.left=n:e.right=n,e}function v(t){return t=Math.max(0,t),t=Math.round(t)}function y(){return null===ft&&(ft=m()),ft}function m(){var t=ht("<div><div/></div>").css({position:"absolute",top:-1e3,left:0,border:0,padding:0,overflow:"scroll",direction:"rtl"}).appendTo("body"),e=t.children(),n=e.offset().left>t.offset().left;return t.remove(),n}function b(t,e){return parseFloat(t.css(e))||0}function w(t){return 1===t.which&&!t.ctrlKey}function D(t){var e=t.originalEvent.touches;return e&&e.length?e[0].pageX:t.pageX}function E(t){var e=t.originalEvent.touches;return e&&e.length?e[0].pageY:t.pageY}function S(t){return/^touch/.test(t.type)}function C(t){t.addClass("fc-unselectable").on("selectstart",T)}function R(t){t.removeClass("fc-unselectable").off("selectstart",T)}function T(t){t.preventDefault()}function M(t,e){var n={left:Math.max(t.left,e.left),right:Math.min(t.right,e.right),top:Math.max(t.top,e.top),bottom:Math.min(t.bottom,e.bottom)};return n.left<n.right&&n.top<n.bottom&&n}function I(t,e){return{left:Math.min(Math.max(t.left,e.left),e.right),top:Math.min(Math.max(t.top,e.top),e.bottom)}}function H(t){return{left:(t.left+t.right)/2,top:(t.top+t.bottom)/2}}function P(t,e){return{left:t.left-e.left,top:t.top-e.top}}function _(t){var e,n,r=[],i=[];for("string"==typeof t?i=t.split(/\s*,\s*/):"function"==typeof t?i=[t]:ht.isArray(t)&&(i=t),e=0;e<i.length;e++)n=i[e],"string"==typeof n?r.push("-"===n.charAt(0)?{field:n.substring(1),order:-1}:{field:n,order:1}):"function"==typeof n&&r.push({func:n});return r}function x(t,e,n,r,i){var o,s;for(o=0;o<n.length;o++)if(s=O(t,e,n[o],r,i))return s;return 0}function O(t,e,n,r,i){if(n.func)return n.func(t,e);var o=t[n.field],s=e[n.field];return null==o&&r&&(o=r[n.field]),null==s&&i&&(s=i[n.field]),F(o,s)*(n.order||1)}function F(t,e){return t||e?null==e?-1:null==t?1:"string"===ht.type(t)||"string"===ht.type(e)?String(t).localeCompare(String(e)):t-e:0}function z(t,e){return pt.duration({days:t.clone().stripTime().diff(e.clone().stripTime(),"days"),ms:t.time()-e.time()})}function B(t,e){return pt.duration({days:t.clone().stripTime().diff(e.clone().stripTime(),"days")})}function A(t,e,n){return pt.duration(Math.round(t.diff(e,n,!0)),n)}function k(t,n){var r,i,o;for(r=0;r<e.unitsDesc.length&&(i=e.unitsDesc[r],!((o=V(i,t,n))>=1&&ut(o)));r++);return i}function L(t,e){var n=k(t);return"week"===n&&"object"==typeof e&&e.days&&(n="day"),n}function V(t,e,n){return null!=n?n.diff(e,t,!0):pt.isDuration(e)?e.as(t):e.end.diff(e.start,t,!0)}function G(t,e,n){var r;return U(n)?(e-t)/n:(r=n.asMonths(),Math.abs(r)>=1&&ut(r)?e.diff(t,"months",!0)/r:e.diff(t,"days",!0)/n.asDays())}function N(t,e){var n,r;return U(t)||U(e)?t/e:(n=t.asMonths(),r=e.asMonths(),Math.abs(n)>=1&&ut(n)&&Math.abs(r)>=1&&ut(r)?n/r:t.asDays()/e.asDays())}function j(t,e){var n;return U(t)?pt.duration(t*e):(n=t.asMonths(),Math.abs(n)>=1&&ut(n)?pt.duration({months:n*e}):pt.duration({days:t.asDays()*e}))}function U(t){return Boolean(t.hours()||t.minutes()||t.seconds()||t.milliseconds())}function W(t){return"[object Date]"===Object.prototype.toString.call(t)||t instanceof Date}function q(t){return"string"==typeof t&&/^\d+\:\d+(?:\:\d+\.?(?:\d{3})?)?$/.test(t)}function Y(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n=window.console;if(n&&n.log)return n.log.apply(n,t)}function Z(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n=window.console;return n&&n.warn?n.warn.apply(n,t):Y.apply(null,t)}function X(t,e){var n,r,i,o,s,a,l={};if(e)for(n=0;n<e.length;n++){for(r=e[n],i=[],o=t.length-1;o>=0;o--)if("object"==typeof(s=t[o][r]))i.unshift(s);else if(void 0!==s){l[r]=s;break}i.length&&(l[r]=X(i))}for(n=t.length-1;n>=0;n--){a=t[n];for(r in a)r in l||(l[r]=a[r])}return l}function Q(t,e){for(var n in t)$(t,n)&&(e[n]=t[n])}function $(t,e){return gt.call(t,e)}function K(t,e,n){if(ht.isFunction(t)&&(t=[t]),t){var r=void 0,i=void 0;for(r=0;r<t.length;r++)i=t[r].apply(e,n)||i;return i}}function J(t,e){for(var n=0,r=0;r<t.length;)e(t[r])?(t.splice(r,1),n++):r++;return n}function tt(t,e){for(var n=0,r=0;r<t.length;)t[r]===e?(t.splice(r,1),n++):r++;return n}function et(t,e){var n,r=t.length;if(null==r||r!==e.length)return!1;for(n=0;n<r;n++)if(t[n]!==e[n])return!1;return!0}function nt(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];for(var n=0;n<t.length;n++)if(void 0!==t[n])return t[n]}function rt(t){return(t+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&#039;").replace(/"/g,"&quot;").replace(/\n/g,"<br />")}function it(t){return t.replace(/&.*?;/g,"")}function ot(t){var e=[];return ht.each(t,function(t,n){null!=n&&e.push(t+":"+n)}),e.join(";")}function st(t){var e=[];return ht.each(t,function(t,n){null!=n&&e.push(t+'="'+rt(n)+'"')}),e.join(" ")}function at(t){return t.charAt(0).toUpperCase()+t.slice(1)}function lt(t,e){return t-e}function ut(t){return t%1==0}function dt(t,e){var n=t[e];return function(){return n.apply(t,arguments)}}function ct(t,e,n){void 0===n&&(n=!1);var r,i,o,s,a,l=function(){var u=+new Date-s;u<e?r=setTimeout(l,e-u):(r=null,n||(a=t.apply(o,i),o=i=null))};return function(){o=this,i=arguments,s=+new Date;var u=n&&!r;return r||(r=setTimeout(l,e)),u&&(a=t.apply(o,i),o=i=null),a}}Object.defineProperty(e,"__esModule",{value:!0});var pt=n(0),ht=n(3);e.compensateScroll=r,e.uncompensateScroll=i,e.disableCursor=o,e.enableCursor=s,e.distributeHeight=a,e.undistributeHeight=l,e.matchCellWidths=u,e.subtractInnerElHeight=d,e.getScrollParent=c,e.getOuterRect=p,e.getClientRect=h,e.getContentRect=f,e.getScrollbarWidths=g;var ft=null;e.isPrimaryMouseButton=w,e.getEvX=D,e.getEvY=E,e.getEvIsTouch=S,e.preventSelection=C,e.allowSelection=R,e.preventDefault=T,e.intersectRects=M,e.constrainPoint=I,e.getRectCenter=H,e.diffPoints=P,e.parseFieldSpecs=_,e.compareByFieldSpecs=x,e.compareByFieldSpec=O,e.flexibleCompare=F,e.dayIDs=["sun","mon","tue","wed","thu","fri","sat"],e.unitsDesc=["year","month","week","day","hour","minute","second","millisecond"],e.diffDayTime=z,e.diffDay=B,e.diffByUnit=A,e.computeGreatestUnit=k,e.computeDurationGreatestUnit=L,e.divideRangeByDuration=G,e.divideDurationByDuration=N,e.multiplyDuration=j,e.durationHasTime=U,e.isNativeDate=W,e.isTimeString=q,e.log=Y,e.warn=Z;var gt={}.hasOwnProperty;e.mergeProps=X,e.copyOwnProps=Q,e.hasOwnProp=$,e.applyAll=K,e.removeMatching=J,e.removeExact=tt,e.isArraysEqual=et,e.firstDefined=nt,e.htmlEscape=rt,e.stripHtmlEntities=it,e.cssToStr=ot,e.attrsToStr=st,e.capitaliseFirstLetter=at,e.compareNumbers=lt,e.isInt=ut,e.proxy=dt,e.debounce=ct},function(t,e,n){function r(t,e){return t.startMs-e.startMs}Object.defineProperty(e,"__esModule",{value:!0});var i=n(0),o=n(11),s=function(){function t(t,e){this.isStart=!0,this.isEnd=!0,i.isMoment(t)&&(t=t.clone().stripZone()),i.isMoment(e)&&(e=e.clone().stripZone()),t&&(this.startMs=t.valueOf()),e&&(this.endMs=e.valueOf())}return t.invertRanges=function(e,n){var i,o,s=[],a=n.startMs;for(e.sort(r),i=0;i<e.length;i++)o=e[i],o.startMs>a&&s.push(new t(a,o.startMs)),o.endMs>a&&(a=o.endMs);return a<n.endMs&&s.push(new t(a,n.endMs)),s},t.prototype.intersect=function(e){var n=this.startMs,r=this.endMs,i=null;return null!=e.startMs&&(n=null==n?e.startMs:Math.max(n,e.startMs)),null!=e.endMs&&(r=null==r?e.endMs:Math.min(r,e.endMs)),(null==n||null==r||n<r)&&(i=new t(n,r),i.isStart=this.isStart&&n===this.startMs,i.isEnd=this.isEnd&&r===this.endMs),i},t.prototype.intersectsWith=function(t){return(null==this.endMs||null==t.startMs||this.endMs>t.startMs)&&(null==this.startMs||null==t.endMs||this.startMs<t.endMs)},t.prototype.containsRange=function(t){return(null==this.startMs||null!=t.startMs&&t.startMs>=this.startMs)&&(null==this.endMs||null!=t.endMs&&t.endMs<=this.endMs)},t.prototype.containsDate=function(t){var e=t.valueOf();return(null==this.startMs||e>=this.startMs)&&(null==this.endMs||e<this.endMs)},t.prototype.constrainDate=function(t){var e=t.valueOf();return null!=this.startMs&&e<this.startMs&&(e=this.startMs),null!=this.endMs&&e>=this.endMs&&(e=this.endMs-1),e},t.prototype.equals=function(t){return this.startMs===t.startMs&&this.endMs===t.endMs},t.prototype.clone=function(){var e=new t(this.startMs,this.endMs);return e.isStart=this.isStart,e.isEnd=this.isEnd,e},t.prototype.getStart=function(){return null!=this.startMs?o.default.utc(this.startMs).stripZone():null},t.prototype.getEnd=function(){return null!=this.endMs?o.default.utc(this.endMs).stripZone():null},t.prototype.as=function(t){return i.utc(this.endMs).diff(i.utc(this.startMs),t,!0)},t}();e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(52),s=n(35),a=n(36),l=function(t){function e(n){var r=t.call(this)||this;return r.calendar=n,r.className=[],r.uid=String(e.uuid++),r}return r.__extends(e,t),e.parse=function(t,e){var n=new this(e);return!("object"!=typeof t||!n.applyProps(t))&&n},e.normalizeId=function(t){return t?String(t):null},e.prototype.fetch=function(t,e,n){},e.prototype.removeEventDefsById=function(t){},e.prototype.removeAllEventDefs=function(){},e.prototype.getPrimitive=function(t){},e.prototype.parseEventDefs=function(t){var e,n,r=[];for(e=0;e<t.length;e++)(n=this.parseEventDef(t[e]))&&r.push(n);return r},e.prototype.parseEventDef=function(t){var e=this.calendar.opt("eventDataTransform"),n=this.eventDataTransform;return e&&(t=e(t,this.calendar)),n&&(t=n(t,this.calendar)),a.default.parse(t,this)},e.prototype.applyManualStandardProps=function(t){return null!=t.id&&(this.id=e.normalizeId(t.id)),i.isArray(t.className)?this.className=t.className:"string"==typeof t.className&&(this.className=t.className.split(/\s+/)),!0},e.uuid=0,e.defineStandardProps=o.default.defineStandardProps,e.copyVerbatimStandardProps=o.default.copyVerbatimStandardProps,e}(s.default);e.default=l,o.default.mixInto(l),l.defineStandardProps({id:!1,className:!1,color:!0,backgroundColor:!0,borderColor:!0,textColor:!0,editable:!0,startEditable:!0,durationEditable:!0,rendering:!0,overlap:!0,constraint:!0,allDayDefault:!0,eventDataTransform:!0})},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(15),s=0,a=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.listenTo=function(t,e,n){if("object"==typeof e)for(var r in e)e.hasOwnProperty(r)&&this.listenTo(t,r,e[r]);else"string"==typeof e&&t.on(e+"."+this.getListenerNamespace(),i.proxy(n,this))},e.prototype.stopListeningTo=function(t,e){t.off((e||"")+"."+this.getListenerNamespace())},e.prototype.getListenerNamespace=function(){return null==this.listenerId&&(this.listenerId=s++),"_listener"+this.listenerId},e}(o.default);e.default=a},,function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(37),o=n(53),s=n(16),a=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.buildInstances=function(){return[this.buildInstance()]},e.prototype.buildInstance=function(){return new o.default(this,this.dateProfile)},e.prototype.isAllDay=function(){return this.dateProfile.isAllDay()},e.prototype.clone=function(){var e=t.prototype.clone.call(this);return e.dateProfile=this.dateProfile,e},e.prototype.rezone=function(){var t=this.source.calendar,e=this.dateProfile;this.dateProfile=new s.default(t.moment(e.start),e.end?t.moment(e.end):null,t)},e.prototype.applyManualStandardProps=function(e){var n=t.prototype.applyManualStandardProps.call(this,e),r=s.default.parse(e,this.source);return!!r&&(this.dateProfile=r,null!=e.date&&(this.miscProps.date=e.date),n)},e}(i.default);e.default=a,a.defineStandardProps({start:!1,date:!1,end:!1,allDay:!1})},,function(t,e,n){function r(t,e){return c.format.call(t,e)}function i(t,e,n){void 0===e&&(e=!1),void 0===n&&(n=!1);var r,i,d,c,p=t[0],h=1===t.length&&"string"==typeof p;return o.isMoment(p)||a.isNativeDate(p)||void 0===p?c=o.apply(null,t):(r=!1,i=!1,h?l.test(p)?(p+="-01",t=[p],r=!0,i=!0):(d=u.exec(p))&&(r=!d[5],i=!0):s.isArray(p)&&(i=!0),c=e||r?o.utc.apply(o,t):o.apply(null,t),r?(c._ambigTime=!0,c._ambigZone=!0):n&&(i?c._ambigZone=!0:h&&c.utcOffset(p))),c._fullCalendar=!0,c}Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),s=n(3),a=n(4),l=/^\s*\d{4}-\d\d$/,u=/^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?)?$/,d=o.fn;e.newMomentProto=d;var c=s.extend({},d);e.oldMomentProto=c;var p=o.momentProperties;p.push("_fullCalendar"),p.push("_ambigTime"),p.push("_ambigZone"),e.oldMomentFormat=r;var h=function(){return i(arguments)};e.default=h,h.utc=function(){var t=i(arguments,!0);return t.hasTime()&&t.utc(),t},h.parseZone=function(){return i(arguments,!0,!0)},d.week=d.weeks=function(t){var e=this._locale._fullCalendar_weekCalc;return null==t&&"function"==typeof e?e(this):"ISO"===e?c.isoWeek.apply(this,arguments):c.week.apply(this,arguments)},d.time=function(t){if(!this._fullCalendar)return c.time.apply(this,arguments);if(null==t)return o.duration({hours:this.hours(),minutes:this.minutes(),seconds:this.seconds(),milliseconds:this.milliseconds()});this._ambigTime=!1,o.isDuration(t)||o.isMoment(t)||(t=o.duration(t));var e=0;return o.isDuration(t)&&(e=24*Math.floor(t.asDays())),this.hours(e+t.hours()).minutes(t.minutes()).seconds(t.seconds()).milliseconds(t.milliseconds())},d.stripTime=function(){return this._ambigTime||(this.utc(!0),this.set({hours:0,minutes:0,seconds:0,ms:0}),this._ambigTime=!0,this._ambigZone=!0),this},d.hasTime=function(){return!this._ambigTime},d.stripZone=function(){var t;return this._ambigZone||(t=this._ambigTime,this.utc(!0),this._ambigTime=t||!1,this._ambigZone=!0),this},d.hasZone=function(){return!this._ambigZone},d.local=function(t){return c.local.call(this,this._ambigZone||t),this._ambigTime=!1,this._ambigZone=!1,this},d.utc=function(t){return c.utc.call(this,t),this._ambigTime=!1,this._ambigZone=!1,this},d.utcOffset=function(t){return null!=t&&(this._ambigTime=!1,this._ambigZone=!1),c.utcOffset.apply(this,arguments)}},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){this.isAllDay=!1,this.unzonedRange=t,this.isAllDay=e}return t.prototype.toLegacy=function(t){return{start:t.msToMoment(this.unzonedRange.startMs,this.isAllDay),end:t.msToMoment(this.unzonedRange.endMs,this.isAllDay)}},t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(15),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.on=function(t,e){return i(this).on(t,this._prepareIntercept(e)),this},e.prototype.one=function(t,e){return i(this).one(t,this._prepareIntercept(e)),this},e.prototype._prepareIntercept=function(t){var e=function(e,n){return t.apply(n.context||this,n.args||[])};return t.guid||(t.guid=i.guid++),e.guid=t.guid,e},e.prototype.off=function(t,e){return i(this).off(t,e),this},e.prototype.trigger=function(t){for(var e=[],n=1;n<arguments.length;n++)e[n-1]=arguments[n];return i(this).triggerHandler(t,{args:e}),this},e.prototype.triggerWith=function(t,e,n){return i(this).triggerHandler(t,{context:e,args:n}),this},e.prototype.hasHandlers=function(t){var e=i._data(this,"events");return e&&e[t]&&e[t].length>0},e}(o.default);e.default=s},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t){this.view=t._getView(),this.component=t}return t.prototype.opt=function(t){return this.view.opt(t)},t.prototype.end=function(){},t}();e.default=n},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(){}return t.mixInto=function(t){var e=this;Object.getOwnPropertyNames(this.prototype).forEach(function(n){t.prototype[n]||(t.prototype[n]=e.prototype[n])})},t.mixOver=function(t){var e=this;Object.getOwnPropertyNames(this.prototype).forEach(function(n){t.prototype[n]=e.prototype[n]})},t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),i=function(){function t(t,e,n){this.start=t,this.end=e||null,this.unzonedRange=this.buildUnzonedRange(n)}return t.parse=function(e,n){var r=e.start||e.date,i=e.end;if(!r)return!1;var o=n.calendar,s=o.moment(r),a=i?o.moment(i):null,l=e.allDay,u=o.opt("forceEventDuration");return!!s.isValid()&&(null==l&&null==(l=n.allDayDefault)&&(l=o.opt("allDayDefault")),!0===l?(s.stripTime(),a&&a.stripTime()):!1===l&&(s.hasTime()||s.time(0),a&&!a.hasTime()&&a.time(0)),!a||a.isValid()&&a.isAfter(s)||(a=null),!a&&u&&(a=o.getDefaultEventEnd(!s.hasTime(),s)),new t(s,a,o))},t.isStandardProp=function(t){return"start"===t||"date"===t||"end"===t||"allDay"===t},t.prototype.isAllDay=function(){return!(this.start.hasTime()||this.end&&this.end.hasTime())},t.prototype.buildUnzonedRange=function(t){var e=this.start.clone().stripZone().valueOf(),n=this.getEnd(t).stripZone().valueOf();return new r.default(e,n)},t.prototype.getEnd=function(t){return this.end?this.end.clone():t.getDefaultEventEnd(this.isAllDay(),this.start)},t}();e.default=i},function(t,e,n){function r(t,e){return!t&&!e||!(!t||!e)&&(t.component===e.component&&i(t,e)&&i(e,t))}function i(t,e){for(var n in t)if(!/^(component|left|right|top|bottom)$/.test(n)&&t[n]!==e[n])return!1;return!0}Object.defineProperty(e,"__esModule",{value:!0});var o=n(2),s=n(4),a=n(59),l=function(t){function e(e,n){var r=t.call(this,n)||this;return r.component=e,r}return o.__extends(e,t),e.prototype.handleInteractionStart=function(e){var n,r,i,o=this.subjectEl;this.component.hitsNeeded(),this.computeScrollBounds(),e?(r={left:s.getEvX(e),top:s.getEvY(e)},i=r,o&&(n=s.getOuterRect(o),i=s.constrainPoint(i,n)),this.origHit=this.queryHit(i.left,i.top),o&&this.options.subjectCenter&&(this.origHit&&(n=s.intersectRects(this.origHit,n)||n),i=s.getRectCenter(n)),this.coordAdjust=s.diffPoints(i,r)):(this.origHit=null,this.coordAdjust=null),t.prototype.handleInteractionStart.call(this,e)},e.prototype.handleDragStart=function(e){var n;t.prototype.handleDragStart.call(this,e),(n=this.queryHit(s.getEvX(e),s.getEvY(e)))&&this.handleHitOver(n)},e.prototype.handleDrag=function(e,n,i){var o;t.prototype.handleDrag.call(this,e,n,i),o=this.queryHit(s.getEvX(i),s.getEvY(i)),r(o,this.hit)||(this.hit&&this.handleHitOut(),o&&this.handleHitOver(o))},e.prototype.handleDragEnd=function(e){this.handleHitDone(),t.prototype.handleDragEnd.call(this,e)},e.prototype.handleHitOver=function(t){var e=r(t,this.origHit);this.hit=t,this.trigger("hitOver",this.hit,e,this.origHit)},e.prototype.handleHitOut=function(){this.hit&&(this.trigger("hitOut",this.hit),this.handleHitDone(),this.hit=null)},e.prototype.handleHitDone=function(){this.hit&&this.trigger("hitDone",this.hit)},e.prototype.handleInteractionEnd=function(e,n){t.prototype.handleInteractionEnd.call(this,e,n),this.origHit=null,this.hit=null,this.component.hitsNotNeeded()},e.prototype.handleScrollEnd=function(){t.prototype.handleScrollEnd.call(this),this.isDragging&&(this.component.releaseHits(),this.component.prepareHits())},e.prototype.queryHit=function(t,e){return this.coordAdjust&&(t+=this.coordAdjust.left,e+=this.coordAdjust.top),this.component.queryHit(t,e)},e}(a.default);e.default=l},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0}),e.version="3.10.0",e.internalApiVersion=12;var r=n(4);e.applyAll=r.applyAll,e.debounce=r.debounce,e.isInt=r.isInt,e.htmlEscape=r.htmlEscape,e.cssToStr=r.cssToStr,e.proxy=r.proxy,e.capitaliseFirstLetter=r.capitaliseFirstLetter,e.getOuterRect=r.getOuterRect,e.getClientRect=r.getClientRect,e.getContentRect=r.getContentRect,e.getScrollbarWidths=r.getScrollbarWidths,e.preventDefault=r.preventDefault,e.parseFieldSpecs=r.parseFieldSpecs,e.compareByFieldSpecs=r.compareByFieldSpecs,e.compareByFieldSpec=r.compareByFieldSpec,e.flexibleCompare=r.flexibleCompare,e.computeGreatestUnit=r.computeGreatestUnit,e.divideRangeByDuration=r.divideRangeByDuration,e.divideDurationByDuration=r.divideDurationByDuration,e.multiplyDuration=r.multiplyDuration,e.durationHasTime=r.durationHasTime,e.log=r.log,e.warn=r.warn,e.removeExact=r.removeExact,e.intersectRects=r.intersectRects,e.allowSelection=r.allowSelection,e.attrsToStr=r.attrsToStr,e.compareNumbers=r.compareNumbers,e.compensateScroll=r.compensateScroll,e.computeDurationGreatestUnit=r.computeDurationGreatestUnit,e.constrainPoint=r.constrainPoint,e.copyOwnProps=r.copyOwnProps,e.diffByUnit=r.diffByUnit,e.diffDay=r.diffDay,e.diffDayTime=r.diffDayTime,e.diffPoints=r.diffPoints,e.disableCursor=r.disableCursor,e.distributeHeight=r.distributeHeight,e.enableCursor=r.enableCursor,e.firstDefined=r.firstDefined,e.getEvIsTouch=r.getEvIsTouch,e.getEvX=r.getEvX,e.getEvY=r.getEvY,e.getRectCenter=r.getRectCenter,e.getScrollParent=r.getScrollParent,e.hasOwnProp=r.hasOwnProp,e.isArraysEqual=r.isArraysEqual,e.isNativeDate=r.isNativeDate,e.isPrimaryMouseButton=r.isPrimaryMouseButton,e.isTimeString=r.isTimeString,e.matchCellWidths=r.matchCellWidths,e.mergeProps=r.mergeProps,e.preventSelection=r.preventSelection,e.removeMatching=r.removeMatching,e.stripHtmlEntities=r.stripHtmlEntities,e.subtractInnerElHeight=r.subtractInnerElHeight,e.uncompensateScroll=r.uncompensateScroll,e.undistributeHeight=r.undistributeHeight,e.dayIDs=r.dayIDs,e.unitsDesc=r.unitsDesc;var i=n(49);e.formatDate=i.formatDate,e.formatRange=i.formatRange,e.queryMostGranularFormatUnit=i.queryMostGranularFormatUnit;var o=n(32);e.datepickerLocale=o.datepickerLocale,e.locale=o.locale,e.getMomentLocaleData=o.getMomentLocaleData,e.populateInstanceComputableOptions=o.populateInstanceComputableOptions;var s=n(19);e.eventDefsToEventInstances=s.eventDefsToEventInstances,e.eventFootprintToComponentFootprint=s.eventFootprintToComponentFootprint,e.eventInstanceToEventRange=s.eventInstanceToEventRange,e.eventInstanceToUnzonedRange=s.eventInstanceToUnzonedRange,e.eventRangeToEventFootprint=s.eventRangeToEventFootprint;var a=n(11);e.moment=a.default;var l=n(13);e.EmitterMixin=l.default;var u=n(7);e.ListenerMixin=u.default;var d=n(51);e.Model=d.default;var c=n(217);e.Constraints=c.default;var p=n(55);e.DateProfileGenerator=p.default;var h=n(5);e.UnzonedRange=h.default;var f=n(12);e.ComponentFootprint=f.default;var g=n(218);e.BusinessHourGenerator=g.default;var v=n(219);e.EventPeriod=v.default;var y=n(220);e.EventManager=y.default;var m=n(37);e.EventDef=m.default;var b=n(39);e.EventDefMutation=b.default;var w=n(36);e.EventDefParser=w.default;var D=n(53);e.EventInstance=D.default;var E=n(50);e.EventRange=E.default;var S=n(54);e.RecurringEventDef=S.default;var C=n(9);e.SingleEventDef=C.default;var R=n(40);e.EventDefDateMutation=R.default;var T=n(16);e.EventDateProfile=T.default;var M=n(38);e.EventSourceParser=M.default;var I=n(6);e.EventSource=I.default;var H=n(57);e.defineThemeSystem=H.defineThemeSystem,e.getThemeSystemClass=H.getThemeSystemClass;var P=n(20);e.EventInstanceGroup=P.default;var _=n(56);e.ArrayEventSource=_.default;var x=n(223);e.FuncEventSource=x.default;var O=n(224);e.JsonFeedEventSource=O.default;var F=n(34);e.EventFootprint=F.default;var z=n(35);e.Class=z.default;var B=n(15);e.Mixin=B.default;var A=n(58);e.CoordCache=A.default;var k=n(225);e.Iterator=k.default;var L=n(59);e.DragListener=L.default;var V=n(17);e.HitDragListener=V.default;var G=n(226);e.MouseFollower=G.default;var N=n(52);e.ParsableModelMixin=N.default;var j=n(227);e.Popover=j.default;var U=n(21);e.Promise=U.default;var W=n(228);e.TaskQueue=W.default;var q=n(229);e.RenderQueue=q.default;var Y=n(41);e.Scroller=Y.default;var Z=n(22);e.Theme=Z.default;var X=n(230);e.Component=X.default;var Q=n(231);e.DateComponent=Q.default;var $=n(42);e.InteractiveDateComponent=$.default;var K=n(232);e.Calendar=K.default;var J=n(43);e.View=J.default;var tt=n(24);e.defineView=tt.defineView,e.getViewConfig=tt.getViewConfig;var et=n(60);e.DayTableMixin=et.default;var nt=n(61);e.BusinessHourRenderer=nt.default;var rt=n(44);e.EventRenderer=rt.default;var it=n(62);e.FillRenderer=it.default;var ot=n(63);e.HelperRenderer=ot.default;var st=n(233);e.ExternalDropping=st.default;var at=n(234);e.EventResizing=at.default;var lt=n(64);e.EventPointing=lt.default;var ut=n(235);e.EventDragging=ut.default;var dt=n(236);e.DateSelecting=dt.default;var ct=n(237);e.DateClicking=ct.default;var pt=n(14);e.Interaction=pt.default;var ht=n(65);e.StandardInteractionsMixin=ht.default;var ft=n(238);e.AgendaView=ft.default;var gt=n(239);e.TimeGrid=gt.default;var vt=n(240);e.TimeGridEventRenderer=vt.default;var yt=n(242);e.TimeGridFillRenderer=yt.default;var mt=n(241);e.TimeGridHelperRenderer=mt.default;var bt=n(66);e.DayGrid=bt.default;var wt=n(243);e.DayGridEventRenderer=wt.default;var Dt=n(245);e.DayGridFillRenderer=Dt.default;var Et=n(244);e.DayGridHelperRenderer=Et.default;var St=n(67);e.BasicView=St.default;var Ct=n(68);e.BasicViewDateProfileGenerator=Ct.default;var Rt=n(246);e.MonthView=Rt.default;var Tt=n(247);e.MonthViewDateProfileGenerator=Tt.default;var Mt=n(248);e.ListView=Mt.default;var It=n(250);e.ListEventPointing=It.default;var Ht=n(249);e.ListEventRenderer=Ht.default},function(t,e,n){function r(t,e){var n,r=[];for(n=0;n<t.length;n++)r.push.apply(r,t[n].buildInstances(e));return r}function i(t){return new l.default(t.dateProfile.unzonedRange,t.def,t)}function o(t){return new u.default(new d.default(t.unzonedRange,t.eventDef.isAllDay()),t.eventDef,t.eventInstance)}function s(t){return t.dateProfile.unzonedRange}function a(t){return t.componentFootprint}Object.defineProperty(e,"__esModule",{value:!0});var l=n(50),u=n(34),d=n(12);e.eventDefsToEventInstances=r,e.eventInstanceToEventRange=i,e.eventRangeToEventFootprint=o,e.eventInstanceToUnzonedRange=s,e.eventFootprintToComponentFootprint=a},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),i=n(19),o=n(50),s=function(){function t(t){this.eventInstances=t||[]}return t.prototype.getAllEventRanges=function(t){return t?this.sliceNormalRenderRanges(t):this.eventInstances.map(i.eventInstanceToEventRange)},t.prototype.sliceRenderRanges=function(t){return this.isInverse()?this.sliceInverseRenderRanges(t):this.sliceNormalRenderRanges(t)},t.prototype.sliceNormalRenderRanges=function(t){var e,n,r,i=this.eventInstances,s=[];for(e=0;e<i.length;e++)n=i[e],(r=n.dateProfile.unzonedRange.intersect(t))&&s.push(new o.default(r,n.def,n));return s},t.prototype.sliceInverseRenderRanges=function(t){var e=this.eventInstances.map(i.eventInstanceToUnzonedRange),n=this.getEventDef();return e=r.default.invertRanges(e,t),e.map(function(t){return new o.default(t,n)})},t.prototype.isInverse=function(){return this.getEventDef().hasInverseRendering()},t.prototype.getEventDef=function(){return this.explicitEventDef||this.eventInstances[0].def},t}();e.default=s},function(t,e,n){function r(t,e){t.then=function(n){return"function"==typeof n?s.resolve(n(e)):t}}function i(t){t.then=function(e,n){return"function"==typeof n&&n(),t}}Object.defineProperty(e,"__esModule",{value:!0});var o=n(3),s={construct:function(t){var e=o.Deferred(),n=e.promise();return"function"==typeof t&&t(function(t){e.resolve(t),r(n,t)},function(){e.reject(),i(n)}),n},resolve:function(t){var e=o.Deferred().resolve(t),n=e.promise();return r(n,t),n},reject:function(){var t=o.Deferred().reject(),e=t.promise();return i(e),e}};e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=function(){function t(t){this.optionsManager=t,this.processIconOverride()}return t.prototype.processIconOverride=function(){this.iconOverrideOption&&this.setIconOverride(this.optionsManager.get(this.iconOverrideOption))},t.prototype.setIconOverride=function(t){var e,n;if(r.isPlainObject(t)){e=r.extend({},this.iconClasses);for(n in t)e[n]=this.applyIconOverridePrefix(t[n]);this.iconClasses=e}else!1===t&&(this.iconClasses={})},t.prototype.applyIconOverridePrefix=function(t){var e=this.iconOverridePrefix;return e&&0!==t.indexOf(e)&&(t=e+t),t},t.prototype.getClass=function(t){return this.classes[t]||""},t.prototype.getIconClass=function(t){var e=this.iconClasses[t];return e?this.baseIconClass+" "+e:""},t.prototype.getCustomButtonIconClass=function(t){var e;return this.iconOverrideCustomButtonOption&&(e=t[this.iconOverrideCustomButtonOption])?this.baseIconClass+" "+this.applyIconOverridePrefix(e):""},t}();e.default=i,i.prototype.classes={},i.prototype.iconClasses={},i.prototype.baseIconClass="",i.prototype.iconOverridePrefix=""},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(18),o=n(13),s=n(7);i.touchMouseIgnoreWait=500;var a=null,l=0,u=function(){function t(){this.isTouching=!1,this.mouseIgnoreDepth=0}return t.get=function(){return a||(a=new t,a.bind()),a},t.needed=function(){t.get(),l++},t.unneeded=function(){--l||(a.unbind(),a=null)},t.prototype.bind=function(){var t=this;this.listenTo(r(document),{touchstart:this.handleTouchStart,
touchcancel:this.handleTouchCancel,touchend:this.handleTouchEnd,mousedown:this.handleMouseDown,mousemove:this.handleMouseMove,mouseup:this.handleMouseUp,click:this.handleClick,selectstart:this.handleSelectStart,contextmenu:this.handleContextMenu}),window.addEventListener("touchmove",this.handleTouchMoveProxy=function(e){t.handleTouchMove(r.Event(e))},{passive:!1}),window.addEventListener("scroll",this.handleScrollProxy=function(e){t.handleScroll(r.Event(e))},!0)},t.prototype.unbind=function(){this.stopListeningTo(r(document)),window.removeEventListener("touchmove",this.handleTouchMoveProxy,{passive:!1}),window.removeEventListener("scroll",this.handleScrollProxy,!0)},t.prototype.handleTouchStart=function(t){this.stopTouch(t,!0),this.isTouching=!0,this.trigger("touchstart",t)},t.prototype.handleTouchMove=function(t){this.isTouching&&this.trigger("touchmove",t)},t.prototype.handleTouchCancel=function(t){this.isTouching&&(this.trigger("touchcancel",t),this.stopTouch(t))},t.prototype.handleTouchEnd=function(t){this.stopTouch(t)},t.prototype.handleMouseDown=function(t){this.shouldIgnoreMouse()||this.trigger("mousedown",t)},t.prototype.handleMouseMove=function(t){this.shouldIgnoreMouse()||this.trigger("mousemove",t)},t.prototype.handleMouseUp=function(t){this.shouldIgnoreMouse()||this.trigger("mouseup",t)},t.prototype.handleClick=function(t){this.shouldIgnoreMouse()||this.trigger("click",t)},t.prototype.handleSelectStart=function(t){this.trigger("selectstart",t)},t.prototype.handleContextMenu=function(t){this.trigger("contextmenu",t)},t.prototype.handleScroll=function(t){this.trigger("scroll",t)},t.prototype.stopTouch=function(t,e){void 0===e&&(e=!1),this.isTouching&&(this.isTouching=!1,this.trigger("touchend",t),e||this.startTouchMouseIgnore())},t.prototype.startTouchMouseIgnore=function(){var t=this,e=i.touchMouseIgnoreWait;e&&(this.mouseIgnoreDepth++,setTimeout(function(){t.mouseIgnoreDepth--},e))},t.prototype.shouldIgnoreMouse=function(){return this.isTouching||Boolean(this.mouseIgnoreDepth)},t}();e.default=u,s.default.mixInto(u),o.default.mixInto(u)},function(t,e,n){function r(t,n){e.viewHash[t]=n}function i(t){return e.viewHash[t]}Object.defineProperty(e,"__esModule",{value:!0});var o=n(18);e.viewHash={},o.views=e.viewHash,e.defineView=r,e.getViewConfig=i},,,,,,,,function(t,e,n){function r(t){a.each(f,function(e,n){null==t[e]&&(t[e]=n(t))})}function i(t,n,r){var i=e.localeOptionHash[t]||(e.localeOptionHash[t]={});i.isRTL=r.isRTL,i.weekNumberTitle=r.weekHeader,a.each(p,function(t,e){i[t]=e(r)});var o=a.datepicker;o&&(o.regional[n]=o.regional[t]=r,o.regional.en=o.regional[""],o.setDefaults(r))}function o(t,n){var r,i;r=e.localeOptionHash[t]||(e.localeOptionHash[t]={}),n&&(r=e.localeOptionHash[t]=d.mergeOptions([r,n])),i=s(t),a.each(h,function(t,e){null==r[t]&&(r[t]=e(i,r))}),d.globalDefaults.locale=t}function s(t){return l.localeData(t)||l.localeData("en")}Object.defineProperty(e,"__esModule",{value:!0});var a=n(3),l=n(0),u=n(18),d=n(33),c=n(4);e.localeOptionHash={},u.locales=e.localeOptionHash;var p={buttonText:function(t){return{prev:c.stripHtmlEntities(t.prevText),next:c.stripHtmlEntities(t.nextText),today:c.stripHtmlEntities(t.currentText)}},monthYearFormat:function(t){return t.showMonthAfterYear?"YYYY["+t.yearSuffix+"] MMMM":"MMMM YYYY["+t.yearSuffix+"]"}},h={dayOfMonthFormat:function(t,e){var n=t.longDateFormat("l");return n=n.replace(/^Y+[^\w\s]*|[^\w\s]*Y+$/g,""),e.isRTL?n+=" ddd":n="ddd "+n,n},mediumTimeFormat:function(t){return t.longDateFormat("LT").replace(/\s*a$/i,"a")},smallTimeFormat:function(t){return t.longDateFormat("LT").replace(":mm","(:mm)").replace(/(\Wmm)$/,"($1)").replace(/\s*a$/i,"a")},extraSmallTimeFormat:function(t){return t.longDateFormat("LT").replace(":mm","(:mm)").replace(/(\Wmm)$/,"($1)").replace(/\s*a$/i,"t")},hourFormat:function(t){return t.longDateFormat("LT").replace(":mm","").replace(/(\Wmm)$/,"").replace(/\s*a$/i,"a")},noMeridiemTimeFormat:function(t){return t.longDateFormat("LT").replace(/\s*a$/i,"")}},f={smallDayDateFormat:function(t){return t.isRTL?"D dd":"dd D"},weekFormat:function(t){return t.isRTL?"w[ "+t.weekNumberTitle+"]":"["+t.weekNumberTitle+" ]w"},smallWeekFormat:function(t){return t.isRTL?"w["+t.weekNumberTitle+"]":"["+t.weekNumberTitle+"]w"}};e.populateInstanceComputableOptions=r,e.datepickerLocale=i,e.locale=o,e.getMomentLocaleData=s,o("en",d.englishDefaults)},function(t,e,n){function r(t){return i.mergeProps(t,o)}Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.globalDefaults={titleRangeSeparator:" – ",monthYearFormat:"MMMM YYYY",defaultTimedEventDuration:"02:00:00",defaultAllDayEventDuration:{days:1},forceEventDuration:!1,nextDayThreshold:"09:00:00",columnHeader:!0,defaultView:"month",aspectRatio:1.35,header:{left:"title",center:"",right:"today prev,next"},weekends:!0,weekNumbers:!1,weekNumberTitle:"W",weekNumberCalculation:"local",scrollTime:"06:00:00",minTime:"00:00:00",maxTime:"24:00:00",showNonCurrentDates:!0,lazyFetching:!0,startParam:"start",endParam:"end",timezoneParam:"timezone",timezone:!1,locale:null,isRTL:!1,buttonText:{prev:"prev",next:"next",prevYear:"prev year",nextYear:"next year",year:"year",today:"today",month:"month",week:"week",day:"day"},allDayText:"all-day",agendaEventMinHeight:0,theme:!1,dragOpacity:.75,dragRevertDuration:500,dragScroll:!0,unselectAuto:!0,dropAccept:"*",eventOrder:"title",eventLimit:!1,eventLimitText:"more",eventLimitClick:"popover",dayPopoverFormat:"LL",handleWindowResize:!0,windowResizeDelay:100,longPressDelay:1e3},e.englishDefaults={dayPopoverFormat:"dddd, MMMM D"},e.rtlDefaults={header:{left:"next,prev today",center:"",right:"title"},buttonIcons:{prev:"right-single-arrow",next:"left-single-arrow",prevYear:"right-double-arrow",nextYear:"left-double-arrow"},themeButtonIcons:{prev:"circle-triangle-e",next:"circle-triangle-w",nextYear:"seek-prev",prevYear:"seek-next"}};var o=["header","footer","buttonText","buttonIcons","themeButtonIcons"];e.mergeOptions=r},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e,n){this.componentFootprint=t,this.eventDef=e,n&&(this.eventInstance=n)}return t.prototype.getEventLegacy=function(){return(this.eventInstance||this.eventDef).toLegacy()},t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(4),o=function(){function t(){}return t.extend=function(t){var e=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e}(this);return i.copyOwnProps(t,e.prototype),e},t.mixin=function(t){i.copyOwnProps(t,this.prototype)},t}();e.default=o},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),i=n(4),o=n(9),s=n(54);e.default={parse:function(t,e){return i.isTimeString(t.start)||r.isDuration(t.start)||i.isTimeString(t.end)||r.isDuration(t.end)?s.default.parse(t,e):o.default.parse(t,e)}}},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(52),o=function(){function t(t){this.source=t,this.className=[],this.miscProps={}}return t.parse=function(t,e){var n=new this(e);return!!n.applyProps(t)&&n},t.normalizeId=function(t){return String(t)},t.generateId=function(){return"_fc"+t.uuid++},t.prototype.clone=function(){var e=new this.constructor(this.source);return e.id=this.id,e.rawId=this.rawId,e.uid=this.uid,t.copyVerbatimStandardProps(this,e),e.className=this.className.slice(),e.miscProps=r.extend({},this.miscProps),e},t.prototype.hasInverseRendering=function(){return"inverse-background"===this.getRendering()},t.prototype.hasBgRendering=function(){var t=this.getRendering();return"inverse-background"===t||"background"===t},t.prototype.getRendering=function(){return null!=this.rendering?this.rendering:this.source.rendering},t.prototype.getConstraint=function(){return null!=this.constraint?this.constraint:null!=this.source.constraint?this.source.constraint:this.source.calendar.opt("eventConstraint")},t.prototype.getOverlap=function(){return null!=this.overlap?this.overlap:null!=this.source.overlap?this.source.overlap:this.source.calendar.opt("eventOverlap")},t.prototype.isStartExplicitlyEditable=function(){return null!=this.startEditable?this.startEditable:this.source.startEditable},t.prototype.isDurationExplicitlyEditable=function(){return null!=this.durationEditable?this.durationEditable:this.source.durationEditable},t.prototype.isExplicitlyEditable=function(){return null!=this.editable?this.editable:this.source.editable},t.prototype.toLegacy=function(){var e=r.extend({},this.miscProps);return e._id=this.uid,e.source=this.source,e.className=this.className.slice(),e.allDay=this.isAllDay(),null!=this.rawId&&(e.id=this.rawId),t.copyVerbatimStandardProps(this,e),e},t.prototype.applyManualStandardProps=function(e){return null!=e.id?this.id=t.normalizeId(this.rawId=e.id):this.id=t.generateId(),null!=e._id?this.uid=String(e._id):this.uid=t.generateId(),r.isArray(e.className)&&(this.className=e.className),"string"==typeof e.className&&(this.className=e.className.split(/\s+/)),!0},t.prototype.applyMiscProps=function(t){r.extend(this.miscProps,t)},t.uuid=0,t.defineStandardProps=i.default.defineStandardProps,t.copyVerbatimStandardProps=i.default.copyVerbatimStandardProps,t}();e.default=o,i.default.mixInto(o),o.defineStandardProps({_id:!1,id:!1,className:!1,source:!1,title:!0,url:!0,rendering:!0,constraint:!0,overlap:!0,editable:!0,startEditable:!0,durationEditable:!0,color:!0,backgroundColor:!0,borderColor:!0,textColor:!0})},function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.default={sourceClasses:[],registerClass:function(t){this.sourceClasses.unshift(t)},parse:function(t,e){var n,r,i=this.sourceClasses;for(n=0;n<i.length;n++)if(r=i[n].parse(t,e))return r}}},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),i=n(16),o=n(37),s=n(40),a=n(9),l=function(){function t(){}return t.createFromRawProps=function(e,n,a){var l,u,d,c,p=e.def,h={},f={},g={},v={},y=null,m=null;for(l in n)i.default.isStandardProp(l)?h[l]=n[l]:p.isStandardProp(l)?f[l]=n[l]:p.miscProps[l]!==n[l]&&(g[l]=n[l]);return u=i.default.parse(h,p.source),u&&(d=s.default.createFromDiff(e.dateProfile,u,a)),f.id!==p.id&&(y=f.id),r.isArraysEqual(f.className,p.className)||(m=f.className),o.default.copyVerbatimStandardProps(f,v),c=new t,c.eventDefId=y,c.className=m,c.verbatimStandardProps=v,c.miscProps=g,d&&(c.dateMutation=d),c},t.prototype.mutateSingle=function(t){var e;return this.dateMutation&&(e=t.dateProfile,t.dateProfile=this.dateMutation.buildNewDateProfile(e,t.source.calendar)),null!=this.eventDefId&&(t.id=o.default.normalizeId(t.rawId=this.eventDefId)),this.className&&(t.className=this.className),this.verbatimStandardProps&&a.default.copyVerbatimStandardProps(this.verbatimStandardProps,t),this.miscProps&&t.applyMiscProps(this.miscProps),e?function(){t.dateProfile=e}:function(){}},t.prototype.setDateMutation=function(t){t&&!t.isEmpty()?this.dateMutation=t:this.dateMutation=null},t.prototype.isEmpty=function(){return!this.dateMutation},t}();e.default=l},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),i=n(16),o=function(){function t(){this.clearEnd=!1,this.forceTimed=!1,this.forceAllDay=!1}return t.createFromDiff=function(e,n,i){function o(t,e){return i?r.diffByUnit(t,e,i):n.isAllDay()?r.diffDay(t,e):r.diffDayTime(t,e)}var s,a,l,u,d=e.end&&!n.end,c=e.isAllDay()&&!n.isAllDay(),p=!e.isAllDay()&&n.isAllDay();return s=o(n.start,e.start),n.end&&(a=o(n.unzonedRange.getEnd(),e.unzonedRange.getEnd()),l=a.subtract(s)),u=new t,u.clearEnd=d,u.forceTimed=c,u.forceAllDay=p,u.setDateDelta(s),u.setEndDelta(l),u},t.prototype.buildNewDateProfile=function(t,e){var n=t.start.clone(),r=null,o=!1;return t.end&&!this.clearEnd?r=t.end.clone():this.endDelta&&!r&&(r=e.getDefaultEventEnd(t.isAllDay(),n)),this.forceTimed?(o=!0,n.hasTime()||n.time(0),r&&!r.hasTime()&&r.time(0)):this.forceAllDay&&(n.hasTime()&&n.stripTime(),r&&r.hasTime()&&r.stripTime()),this.dateDelta&&(o=!0,n.add(this.dateDelta),r&&r.add(this.dateDelta)),this.endDelta&&(o=!0,r.add(this.endDelta)),this.startDelta&&(o=!0,n.add(this.startDelta)),o&&(n=e.applyTimezone(n),r&&(r=e.applyTimezone(r))),!r&&e.opt("forceEventDuration")&&(r=e.getDefaultEventEnd(t.isAllDay(),n)),new i.default(n,r,e)},t.prototype.setDateDelta=function(t){t&&t.valueOf()?this.dateDelta=t:this.dateDelta=null},t.prototype.setStartDelta=function(t){t&&t.valueOf()?this.startDelta=t:this.startDelta=null},t.prototype.setEndDelta=function(t){t&&t.valueOf()?this.endDelta=t:this.endDelta=null},t.prototype.isEmpty=function(){return!(this.clearEnd||this.forceTimed||this.forceAllDay||this.dateDelta||this.startDelta||this.endDelta)},t}();e.default=o},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(35),a=function(t){function e(e){var n=t.call(this)||this;return e=e||{},n.overflowX=e.overflowX||e.overflow||"auto",n.overflowY=e.overflowY||e.overflow||"auto",n}return r.__extends(e,t),e.prototype.render=function(){this.el=this.renderEl(),this.applyOverflow()},e.prototype.renderEl=function(){return this.scrollEl=i('<div class="fc-scroller"></div>')},e.prototype.clear=function(){this.setHeight("auto"),this.applyOverflow()},e.prototype.destroy=function(){this.el.remove()},e.prototype.applyOverflow=function(){this.scrollEl.css({"overflow-x":this.overflowX,"overflow-y":this.overflowY})},e.prototype.lockOverflow=function(t){var e=this.overflowX,n=this.overflowY;t=t||this.getScrollbarWidths(),"auto"===e&&(e=t.top||t.bottom||this.scrollEl[0].scrollWidth-1>this.scrollEl[0].clientWidth?"scroll":"hidden"),"auto"===n&&(n=t.left||t.right||this.scrollEl[0].scrollHeight-1>this.scrollEl[0].clientHeight?"scroll":"hidden"),this.scrollEl.css({"overflow-x":e,"overflow-y":n})},e.prototype.setHeight=function(t){this.scrollEl.height(t)},e.prototype.getScrollTop=function(){return this.scrollEl.scrollTop()},e.prototype.setScrollTop=function(t){this.scrollEl.scrollTop(t)},e.prototype.getClientWidth=function(){return this.scrollEl[0].clientWidth},e.prototype.getClientHeight=function(){return this.scrollEl[0].clientHeight},e.prototype.getScrollbarWidths=function(){return o.getScrollbarWidths(this.scrollEl)},e}(s.default);e.default=a},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(231),a=n(23),l=function(t){function e(e,n){var r=t.call(this,e,n)||this;return r.segSelector=".fc-event-container > *",r.dateSelectingClass&&(r.dateClicking=new r.dateClickingClass(r)),r.dateSelectingClass&&(r.dateSelecting=new r.dateSelectingClass(r)),r.eventPointingClass&&(r.eventPointing=new r.eventPointingClass(r)),r.eventDraggingClass&&r.eventPointing&&(r.eventDragging=new r.eventDraggingClass(r,r.eventPointing)),r.eventResizingClass&&r.eventPointing&&(r.eventResizing=new r.eventResizingClass(r,r.eventPointing)),r.externalDroppingClass&&(r.externalDropping=new r.externalDroppingClass(r)),r}return r.__extends(e,t),e.prototype.setElement=function(e){t.prototype.setElement.call(this,e),this.dateClicking&&this.dateClicking.bindToEl(e),this.dateSelecting&&this.dateSelecting.bindToEl(e),this.bindAllSegHandlersToEl(e)},e.prototype.removeElement=function(){this.endInteractions(),t.prototype.removeElement.call(this)},e.prototype.executeEventUnrender=function(){this.endInteractions(),t.prototype.executeEventUnrender.call(this)},e.prototype.bindGlobalHandlers=function(){t.prototype.bindGlobalHandlers.call(this),this.externalDropping&&this.externalDropping.bindToDocument()},e.prototype.unbindGlobalHandlers=function(){t.prototype.unbindGlobalHandlers.call(this),this.externalDropping&&this.externalDropping.unbindFromDocument()},e.prototype.bindDateHandlerToEl=function(t,e,n){var r=this;this.el.on(e,function(t){if(!i(t.target).is(r.segSelector+":not(.fc-helper),"+r.segSelector+":not(.fc-helper) *,.fc-more,a[data-goto]"))return n.call(r,t)})},e.prototype.bindAllSegHandlersToEl=function(t){[this.eventPointing,this.eventDragging,this.eventResizing].forEach(function(e){e&&e.bindToEl(t)})},e.prototype.bindSegHandlerToEl=function(t,e,n){var r=this;t.on(e,this.segSelector,function(t){var e=i(t.currentTarget);if(!e.is(".fc-helper")){var o=e.data("fc-seg");if(o&&!r.shouldIgnoreEventPointing())return n.call(r,o,t)}})},e.prototype.shouldIgnoreMouse=function(){return a.default.get().shouldIgnoreMouse()},e.prototype.shouldIgnoreTouch=function(){var t=this._getView();return t.isSelected||t.selectedEvent},e.prototype.shouldIgnoreEventPointing=function(){return this.eventDragging&&this.eventDragging.isDragging||this.eventResizing&&this.eventResizing.isResizing},e.prototype.canStartSelection=function(t,e){return o.getEvIsTouch(e)&&!this.canStartResize(t,e)&&(this.isEventDefDraggable(t.footprint.eventDef)||this.isEventDefResizable(t.footprint.eventDef))},e.prototype.canStartDrag=function(t,e){return!this.canStartResize(t,e)&&this.isEventDefDraggable(t.footprint.eventDef)},e.prototype.canStartResize=function(t,e){var n=this._getView(),r=t.footprint.eventDef;return(!o.getEvIsTouch(e)||n.isEventDefSelected(r))&&this.isEventDefResizable(r)&&i(e.target).is(".fc-resizer")},e.prototype.endInteractions=function(){[this.dateClicking,this.dateSelecting,this.eventPointing,this.eventDragging,this.eventResizing].forEach(function(t){t&&t.end()})},e.prototype.isEventDefDraggable=function(t){return this.isEventDefStartEditable(t)},e.prototype.isEventDefStartEditable=function(t){var e=t.isStartExplicitlyEditable();return null==e&&null==(e=this.opt("eventStartEditable"))&&(e=this.isEventDefGenerallyEditable(t)),e},e.prototype.isEventDefGenerallyEditable=function(t){var e=t.isExplicitlyEditable();return null==e&&(e=this.opt("editable")),e},e.prototype.isEventDefResizableFromStart=function(t){return this.opt("eventResizableFromStart")&&this.isEventDefResizable(t)},e.prototype.isEventDefResizableFromEnd=function(t){return this.isEventDefResizable(t)},e.prototype.isEventDefResizable=function(t){var e=t.isDurationExplicitlyEditable();return null==e&&null==(e=this.opt("eventDurationEditable"))&&(e=this.isEventDefGenerallyEditable(t)),e},e.prototype.diffDates=function(t,e){return this.largeUnit?o.diffByUnit(t,e,this.largeUnit):o.diffDayTime(t,e)},e.prototype.isEventInstanceGroupAllowed=function(t){var e,n=this._getView(),r=this.dateProfile,i=this.eventRangesToEventFootprints(t.getAllEventRanges());for(e=0;e<i.length;e++)if(!r.validUnzonedRange.containsRange(i[e].componentFootprint.unzonedRange))return!1;return n.calendar.constraints.isEventInstanceGroupAllowed(t)},e.prototype.isExternalInstanceGroupAllowed=function(t){var e,n=this._getView(),r=this.dateProfile,i=this.eventRangesToEventFootprints(t.getAllEventRanges());for(e=0;e<i.length;e++)if(!r.validUnzonedRange.containsRange(i[e].componentFootprint.unzonedRange))return!1;for(e=0;e<i.length;e++)if(!n.calendar.constraints.isSelectionFootprintAllowed(i[e].componentFootprint))return!1;return!0},e}(s.default);e.default=l},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(0),s=n(4),a=n(229),l=n(55),u=n(42),d=n(23),c=n(5),p=function(t){function e(e,n){var r=t.call(this,null,n.options)||this;return r.batchRenderDepth=0,r.isSelected=!1,r.calendar=e,r.viewSpec=n,r.type=n.type,r.name=r.type,r.initRenderQueue(),r.initHiddenDays(),r.dateProfileGenerator=new r.dateProfileGeneratorClass(r),r.bindBaseRenderHandlers(),r.eventOrderSpecs=s.parseFieldSpecs(r.opt("eventOrder")),r.initialize&&r.initialize(),r}return r.__extends(e,t),e.prototype._getView=function(){return this},e.prototype.opt=function(t){return this.options[t]},e.prototype.initRenderQueue=function(){this.renderQueue=new a.default({event:this.opt("eventRenderWait")}),this.renderQueue.on("start",this.onRenderQueueStart.bind(this)),this.renderQueue.on("stop",this.onRenderQueueStop.bind(this)),this.on("before:change",this.startBatchRender),this.on("change",this.stopBatchRender)},e.prototype.onRenderQueueStart=function(){this.calendar.freezeContentHeight(),this.addScroll(this.queryScroll())},e.prototype.onRenderQueueStop=function(){this.calendar.updateViewSize()&&this.popScroll(),this.calendar.thawContentHeight()},e.prototype.startBatchRender=function(){this.batchRenderDepth++||this.renderQueue.pause()},e.prototype.stopBatchRender=function(){--this.batchRenderDepth||this.renderQueue.resume()},e.prototype.requestRender=function(t,e,n){this.renderQueue.queue(t,e,n)},e.prototype.whenSizeUpdated=function(t){this.renderQueue.isRunning?this.renderQueue.one("stop",t.bind(this)):t.call(this)},e.prototype.computeTitle=function(t){var e;return e=/^(year|month)$/.test(t.currentRangeUnit)?t.currentUnzonedRange:t.activeUnzonedRange,this.formatRange({start:this.calendar.msToMoment(e.startMs,t.isRangeAllDay),end:this.calendar.msToMoment(e.endMs,t.isRangeAllDay)},t.isRangeAllDay,this.opt("titleFormat")||this.computeTitleFormat(t),this.opt("titleRangeSeparator"))},e.prototype.computeTitleFormat=function(t){var e=t.currentRangeUnit;return"year"===e?"YYYY":"month"===e?this.opt("monthYearFormat"):t.currentUnzonedRange.as("days")>1?"ll":"LL"},e.prototype.setDate=function(t){var e=this.get("dateProfile"),n=this.dateProfileGenerator.build(t,void 0,!0);e&&e.activeUnzonedRange.equals(n.activeUnzonedRange)||this.set("dateProfile",n)},e.prototype.unsetDate=function(){this.unset("dateProfile")},e.prototype.fetchInitialEvents=function(t){var e=this.calendar,n=t.isRangeAllDay&&!this.usesMinMaxTime;return e.requestEvents(e.msToMoment(t.activeUnzonedRange.startMs,n),e.msToMoment(t.activeUnzonedRange.endMs,n))},e.prototype.bindEventChanges=function(){this.listenTo(this.calendar,"eventsReset",this.resetEvents)},e.prototype.unbindEventChanges=function(){this.stopListeningTo(this.calendar,"eventsReset")},e.prototype.setEvents=function(t){this.set("currentEvents",t),this.set("hasEvents",!0)},e.prototype.unsetEvents=function(){this.unset("currentEvents"),this.unset("hasEvents")},e.prototype.resetEvents=function(t){this.startBatchRender(),this.unsetEvents(),this.setEvents(t),this.stopBatchRender()},e.prototype.requestDateRender=function(t){var e=this;this.requestRender(function(){e.executeDateRender(t)},"date","init")},e.prototype.requestDateUnrender=function(){var t=this;this.requestRender(function(){t.executeDateUnrender()},"date","destroy")},e.prototype.executeDateRender=function(e){t.prototype.executeDateRender.call(this,e),this.render&&this.render(),this.trigger("datesRendered"),this.addScroll({isDateInit:!0}),this.startNowIndicator()},e.prototype.executeDateUnrender=function(){this.unselect(),this.stopNowIndicator(),this.trigger("before:datesUnrendered"),this.destroy&&this.destroy(),t.prototype.executeDateUnrender.call(this)},e.prototype.bindBaseRenderHandlers=function(){var t=this;this.on("datesRendered",function(){t.whenSizeUpdated(t.triggerViewRender)}),this.on("before:datesUnrendered",function(){t.triggerViewDestroy()})},e.prototype.triggerViewRender=function(){this.publiclyTrigger("viewRender",{context:this,args:[this,this.el]})},e.prototype.triggerViewDestroy=function(){this.publiclyTrigger("viewDestroy",{context:this,args:[this,this.el]})},e.prototype.requestEventsRender=function(t){var e=this;this.requestRender(function(){e.executeEventRender(t),e.whenSizeUpdated(e.triggerAfterEventsRendered)},"event","init")},e.prototype.requestEventsUnrender=function(){var t=this;this.requestRender(function(){t.triggerBeforeEventsDestroyed(),t.executeEventUnrender()},"event","destroy")},e.prototype.requestBusinessHoursRender=function(t){var e=this;this.requestRender(function(){e.renderBusinessHours(t)},"businessHours","init")},e.prototype.requestBusinessHoursUnrender=function(){var t=this;this.requestRender(function(){t.unrenderBusinessHours()},"businessHours","destroy")},e.prototype.bindGlobalHandlers=function(){t.prototype.bindGlobalHandlers.call(this),this.listenTo(d.default.get(),{touchstart:this.processUnselect,mousedown:this.handleDocumentMousedown})},e.prototype.unbindGlobalHandlers=function(){t.prototype.unbindGlobalHandlers.call(this),this.stopListeningTo(d.default.get())},e.prototype.startNowIndicator=function(){var t,e,n,r=this;this.opt("nowIndicator")&&(t=this.getNowIndicatorUnit())&&(e=s.proxy(this,"updateNowIndicator"),this.initialNowDate=this.calendar.getNow(),this.initialNowQueriedMs=(new Date).valueOf(),n=this.initialNowDate.clone().startOf(t).add(1,t).valueOf()-this.initialNowDate.valueOf(),this.nowIndicatorTimeoutID=setTimeout(function(){r.nowIndicatorTimeoutID=null,e(),n=+o.duration(1,t),n=Math.max(100,n),r.nowIndicatorIntervalID=setInterval(e,n)},n))},e.prototype.updateNowIndicator=function(){this.isDatesRendered&&this.initialNowDate&&(this.unrenderNowIndicator(),this.renderNowIndicator(this.initialNowDate.clone().add((new Date).valueOf()-this.initialNowQueriedMs)),this.isNowIndicatorRendered=!0)},e.prototype.stopNowIndicator=function(){this.isNowIndicatorRendered&&(this.nowIndicatorTimeoutID&&(clearTimeout(this.nowIndicatorTimeoutID),this.nowIndicatorTimeoutID=null),this.nowIndicatorIntervalID&&(clearInterval(this.nowIndicatorIntervalID),this.nowIndicatorIntervalID=null),this.unrenderNowIndicator(),this.isNowIndicatorRendered=!1)},e.prototype.updateSize=function(e,n,r){this.setHeight?this.setHeight(e,n):t.prototype.updateSize.call(this,e,n,r),this.updateNowIndicator()},e.prototype.addScroll=function(t){var e=this.queuedScroll||(this.queuedScroll={});i.extend(e,t)},e.prototype.popScroll=function(){this.applyQueuedScroll(),this.queuedScroll=null},e.prototype.applyQueuedScroll=function(){this.queuedScroll&&this.applyScroll(this.queuedScroll)},e.prototype.queryScroll=function(){var t={};return this.isDatesRendered&&i.extend(t,this.queryDateScroll()),t},e.prototype.applyScroll=function(t){t.isDateInit&&this.isDatesRendered&&i.extend(t,this.computeInitialDateScroll()),this.isDatesRendered&&this.applyDateScroll(t)},e.prototype.computeInitialDateScroll=function(){return{}},e.prototype.queryDateScroll=function(){return{}},e.prototype.applyDateScroll=function(t){},e.prototype.reportEventDrop=function(t,e,n,r){var i=this.calendar.eventManager,s=i.mutateEventsWithId(t.def.id,e),a=e.dateMutation;a&&(t.dateProfile=a.buildNewDateProfile(t.dateProfile,this.calendar)),this.triggerEventDrop(t,a&&a.dateDelta||o.duration(),s,n,r)},e.prototype.triggerEventDrop=function(t,e,n,r,i){this.publiclyTrigger("eventDrop",{context:r[0],args:[t.toLegacy(),e,n,i,{},this]})},e.prototype.reportExternalDrop=function(t,e,n,r,i,o){e&&this.calendar.eventManager.addEventDef(t,n),this.triggerExternalDrop(t,e,r,i,o)},e.prototype.triggerExternalDrop=function(t,e,n,r,i){this.publiclyTrigger("drop",{context:n[0],args:[t.dateProfile.start.clone(),r,i,this]}),e&&this.publiclyTrigger("eventReceive",{context:this,args:[t.buildInstance().toLegacy(),this]})},e.prototype.reportEventResize=function(t,e,n,r){var i=this.calendar.eventManager,o=i.mutateEventsWithId(t.def.id,e);t.dateProfile=e.dateMutation.buildNewDateProfile(t.dateProfile,this.calendar);var s=e.dateMutation.endDelta||e.dateMutation.startDelta;this.triggerEventResize(t,s,o,n,r)},e.prototype.triggerEventResize=function(t,e,n,r,i){this.publiclyTrigger("eventResize",{context:r[0],args:[t.toLegacy(),e,n,i,{},this]})},e.prototype.select=function(t,e){this.unselect(e),this.renderSelectionFootprint(t),this.reportSelection(t,e)},e.prototype.renderSelectionFootprint=function(e){this.renderSelection?this.renderSelection(e.toLegacy(this.calendar)):t.prototype.renderSelectionFootprint.call(this,e)},e.prototype.reportSelection=function(t,e){this.isSelected=!0,this.triggerSelect(t,e)},e.prototype.triggerSelect=function(t,e){var n=this.calendar.footprintToDateProfile(t);this.publiclyTrigger("select",{context:this,args:[n.start,n.end,e,this]})},e.prototype.unselect=function(t){this.isSelected&&(this.isSelected=!1,this.destroySelection&&this.destroySelection(),this.unrenderSelection(),this.publiclyTrigger("unselect",{context:this,args:[t,this]}))},e.prototype.selectEventInstance=function(t){this.selectedEventInstance&&this.selectedEventInstance===t||(this.unselectEventInstance(),this.getEventSegs().forEach(function(e){e.footprint.eventInstance===t&&e.el&&e.el.addClass("fc-selected")}),this.selectedEventInstance=t)},e.prototype.unselectEventInstance=function(){this.selectedEventInstance&&(this.getEventSegs().forEach(function(t){t.el&&t.el.removeClass("fc-selected")}),this.selectedEventInstance=null)},e.prototype.isEventDefSelected=function(t){return this.selectedEventInstance&&this.selectedEventInstance.def.id===t.id},e.prototype.handleDocumentMousedown=function(t){s.isPrimaryMouseButton(t)&&this.processUnselect(t)},e.prototype.processUnselect=function(t){this.processRangeUnselect(t),this.processEventUnselect(t)},e.prototype.processRangeUnselect=function(t){var e;this.isSelected&&this.opt("unselectAuto")&&((e=this.opt("unselectCancel"))&&i(t.target).closest(e).length||this.unselect(t))},e.prototype.processEventUnselect=function(t){this.selectedEventInstance&&(i(t.target).closest(".fc-selected").length||this.unselectEventInstance())},e.prototype.triggerBaseRendered=function(){this.publiclyTrigger("viewRender",{context:this,args:[this,this.el]})},e.prototype.triggerBaseUnrendered=function(){this.publiclyTrigger("viewDestroy",{context:this,args:[this,this.el]})},e.prototype.triggerDayClick=function(t,e,n){var r=this.calendar.footprintToDateProfile(t);this.publiclyTrigger("dayClick",{context:e,args:[r.start,n,this]})},e.prototype.isDateInOtherMonth=function(t,e){return!1},e.prototype.getUnzonedRangeOption=function(t){var e=this.opt(t);if("function"==typeof e&&(e=e.apply(null,Array.prototype.slice.call(arguments,1))),e)return this.calendar.parseUnzonedRange(e)},e.prototype.initHiddenDays=function(){var t,e=this.opt("hiddenDays")||[],n=[],r=0;for(!1===this.opt("weekends")&&e.push(0,6),t=0;t<7;t++)(n[t]=-1!==i.inArray(t,e))||r++;if(!r)throw new Error("invalid hiddenDays");this.isHiddenDayHash=n},e.prototype.trimHiddenDays=function(t){var e=t.getStart(),n=t.getEnd();return e&&(e=this.skipHiddenDays(e)),n&&(n=this.skipHiddenDays(n,-1,!0)),null===e||null===n||e<n?new c.default(e,n):null},e.prototype.isHiddenDay=function(t){return o.isMoment(t)&&(t=t.day()),this.isHiddenDayHash[t]},e.prototype.skipHiddenDays=function(t,e,n){void 0===e&&(e=1),void 0===n&&(n=!1);for(var r=t.clone();this.isHiddenDayHash[(r.day()+(n?e:0)+7)%7];)r.add(e,"days");return r},e}(u.default);e.default=p,p.prototype.usesMinMaxTime=!1,p.prototype.dateProfileGeneratorClass=l.default,p.watch("displayingDates",["isInDom","dateProfile"],function(t){this.requestDateRender(t.dateProfile)},function(){this.requestDateUnrender()}),p.watch("displayingBusinessHours",["displayingDates","businessHourGenerator"],function(t){this.requestBusinessHoursRender(t.businessHourGenerator)},function(){this.requestBusinessHoursUnrender()}),p.watch("initialEvents",["dateProfile"],function(t){return this.fetchInitialEvents(t.dateProfile)}),p.watch("bindingEvents",["initialEvents"],function(t){this.setEvents(t.initialEvents),this.bindEventChanges()},function(){this.unbindEventChanges(),this.unsetEvents()}),p.watch("displayingEvents",["displayingDates","hasEvents"],function(){this.requestEventsRender(this.get("currentEvents"))},function(){this.requestEventsUnrender()}),p.watch("title",["dateProfile"],function(t){return this.title=this.computeTitle(t.dateProfile)}),p.watch("legacyDateProps",["dateProfile"],function(t){var e=this.calendar,n=t.dateProfile;this.start=e.msToMoment(n.activeUnzonedRange.startMs,n.isRangeAllDay),this.end=e.msToMoment(n.activeUnzonedRange.endMs,n.isRangeAllDay),this.intervalStart=e.msToMoment(n.currentUnzonedRange.startMs,n.isRangeAllDay),this.intervalEnd=e.msToMoment(n.currentUnzonedRange.endMs,n.isRangeAllDay)})},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=function(){function t(t,e){this.view=t._getView(),this.component=t,this.fillRenderer=e}return t.prototype.opt=function(t){return this.view.opt(t)},t.prototype.rangeUpdated=function(){var t,e
;this.eventTimeFormat=this.opt("eventTimeFormat")||this.opt("timeFormat")||this.computeEventTimeFormat(),t=this.opt("displayEventTime"),null==t&&(t=this.computeDisplayEventTime()),e=this.opt("displayEventEnd"),null==e&&(e=this.computeDisplayEventEnd()),this.displayEventTime=t,this.displayEventEnd=e},t.prototype.render=function(t){var e,n,r,i=this.component._getDateProfile(),o=[],s=[];for(e in t)n=t[e],r=n.sliceRenderRanges(i.activeUnzonedRange),n.getEventDef().hasBgRendering()?o.push.apply(o,r):s.push.apply(s,r);this.renderBgRanges(o),this.renderFgRanges(s)},t.prototype.unrender=function(){this.unrenderBgRanges(),this.unrenderFgRanges()},t.prototype.renderFgRanges=function(t){var e=this.component.eventRangesToEventFootprints(t),n=this.component.eventFootprintsToSegs(e);n=this.renderFgSegEls(n),!1!==this.renderFgSegs(n)&&(this.fgSegs=n)},t.prototype.unrenderFgRanges=function(){this.unrenderFgSegs(this.fgSegs||[]),this.fgSegs=null},t.prototype.renderBgRanges=function(t){var e=this.component.eventRangesToEventFootprints(t),n=this.component.eventFootprintsToSegs(e);!1!==this.renderBgSegs(n)&&(this.bgSegs=n)},t.prototype.unrenderBgRanges=function(){this.unrenderBgSegs(),this.bgSegs=null},t.prototype.getSegs=function(){return(this.bgSegs||[]).concat(this.fgSegs||[])},t.prototype.renderFgSegs=function(t){return!1},t.prototype.unrenderFgSegs=function(t){},t.prototype.renderBgSegs=function(t){var e=this;if(!this.fillRenderer)return!1;this.fillRenderer.renderSegs("bgEvent",t,{getClasses:function(t){return e.getBgClasses(t.footprint.eventDef)},getCss:function(t){return{"background-color":e.getBgColor(t.footprint.eventDef)}},filterEl:function(t,n){return e.filterEventRenderEl(t.footprint,n)}})},t.prototype.unrenderBgSegs=function(){this.fillRenderer&&this.fillRenderer.unrender("bgEvent")},t.prototype.renderFgSegEls=function(t,e){var n=this;void 0===e&&(e=!1);var i,o=this.view.hasPublicHandlers("eventRender"),s="",a=[];if(t.length){for(i=0;i<t.length;i++)this.beforeFgSegHtml(t[i]),s+=this.fgSegHtml(t[i],e);r(s).each(function(e,i){var s=t[e],l=r(i);o&&(l=n.filterEventRenderEl(s.footprint,l)),l&&(l.data("fc-seg",s),s.el=l,a.push(s))})}return a},t.prototype.beforeFgSegHtml=function(t){},t.prototype.fgSegHtml=function(t,e){},t.prototype.getSegClasses=function(t,e,n){var r=["fc-event",t.isStart?"fc-start":"fc-not-start",t.isEnd?"fc-end":"fc-not-end"].concat(this.getClasses(t.footprint.eventDef));return e&&r.push("fc-draggable"),n&&r.push("fc-resizable"),this.view.isEventDefSelected(t.footprint.eventDef)&&r.push("fc-selected"),r},t.prototype.filterEventRenderEl=function(t,e){var n=t.getEventLegacy(),i=this.view.publiclyTrigger("eventRender",{context:n,args:[n,e,this.view]});return!1===i?e=null:i&&!0!==i&&(e=r(i)),e},t.prototype.getTimeText=function(t,e,n){return this._getTimeText(t.eventInstance.dateProfile.start,t.eventInstance.dateProfile.end,t.componentFootprint.isAllDay,e,n)},t.prototype._getTimeText=function(t,e,n,r,i){return null==r&&(r=this.eventTimeFormat),null==i&&(i=this.displayEventEnd),this.displayEventTime&&!n?i&&e?this.view.formatRange({start:t,end:e},!1,r):t.format(r):""},t.prototype.computeEventTimeFormat=function(){return this.opt("smallTimeFormat")},t.prototype.computeDisplayEventTime=function(){return!0},t.prototype.computeDisplayEventEnd=function(){return!0},t.prototype.getBgClasses=function(t){var e=this.getClasses(t);return e.push("fc-bgevent"),e},t.prototype.getClasses=function(t){var e,n=this.getStylingObjs(t),r=[];for(e=0;e<n.length;e++)r.push.apply(r,n[e].eventClassName||n[e].className||[]);return r},t.prototype.getSkinCss=function(t){return{"background-color":this.getBgColor(t),"border-color":this.getBorderColor(t),color:this.getTextColor(t)}},t.prototype.getBgColor=function(t){var e,n,r=this.getStylingObjs(t);for(e=0;e<r.length&&!n;e++)n=r[e].eventBackgroundColor||r[e].eventColor||r[e].backgroundColor||r[e].color;return n||(n=this.opt("eventBackgroundColor")||this.opt("eventColor")),n},t.prototype.getBorderColor=function(t){var e,n,r=this.getStylingObjs(t);for(e=0;e<r.length&&!n;e++)n=r[e].eventBorderColor||r[e].eventColor||r[e].borderColor||r[e].color;return n||(n=this.opt("eventBorderColor")||this.opt("eventColor")),n},t.prototype.getTextColor=function(t){var e,n,r=this.getStylingObjs(t);for(e=0;e<r.length&&!n;e++)n=r[e].eventTextColor||r[e].textColor;return n||(n=this.opt("eventTextColor")),n},t.prototype.getStylingObjs=function(t){var e=this.getFallbackStylingObjs(t);return e.unshift(t),e},t.prototype.getFallbackStylingObjs=function(t){return[t.source]},t.prototype.sortEventSegs=function(t){t.sort(i.proxy(this,"compareEventSegs"))},t.prototype.compareEventSegs=function(t,e){var n=t.footprint,r=e.footprint,o=n.componentFootprint,s=r.componentFootprint,a=o.unzonedRange,l=s.unzonedRange;return a.startMs-l.startMs||l.endMs-l.startMs-(a.endMs-a.startMs)||s.isAllDay-o.isAllDay||i.compareByFieldSpecs(n.eventDef,r.eventDef,this.view.eventOrderSpecs,n.eventDef.miscProps,r.eventDef.miscProps)},t}();e.default=o},,,,,function(t,e,n){function r(t){return"en"!==t.locale()?t.clone().locale("en"):t}function i(t,e){return h(a(e).fakeFormatString,t)}function o(t,e,n,r,i){var o;return t=y.default.parseZone(t),e=y.default.parseZone(e),o=t.localeData(),n=o.longDateFormat(n)||n,s(a(n),t,e,r||" - ",i)}function s(t,e,n,r,i){var o,s,a,l=t.sameUnits,u=e.clone().stripZone(),d=n.clone().stripZone(),c=f(t.fakeFormatString,e),p=f(t.fakeFormatString,n),h="",v="",y="",m="",b="";for(o=0;o<l.length&&(!l[o]||u.isSame(d,l[o]));o++)h+=c[o];for(s=l.length-1;s>o&&(!l[s]||u.isSame(d,l[s]))&&(s-1!==o||"."!==c[s]);s--)v=c[s]+v;for(a=o;a<=s;a++)y+=c[a],m+=p[a];return(y||m)&&(b=i?m+r+y:y+r+m),g(h+b+v)}function a(t){return C[t]||(C[t]=l(t))}function l(t){var e=u(t);return{fakeFormatString:c(e),sameUnits:p(e)}}function u(t){for(var e,n=[],r=/\[([^\]]*)\]|\(([^\)]*)\)|(LTS|LT|(\w)\4*o?)|([^\w\[\(]+)/g;e=r.exec(t);)e[1]?n.push.apply(n,d(e[1])):e[2]?n.push({maybe:u(e[2])}):e[3]?n.push({token:e[3]}):e[5]&&n.push.apply(n,d(e[5]));return n}function d(t){return". "===t?["."," "]:[t]}function c(t){var e,n,r=[];for(e=0;e<t.length;e++)n=t[e],"string"==typeof n?r.push("["+n+"]"):n.token?n.token in E?r.push(b+"["+n.token+"]"):r.push(n.token):n.maybe&&r.push(w+c(n.maybe)+w);return r.join(m)}function p(t){var e,n,r,i=[];for(e=0;e<t.length;e++)n=t[e],n.token?(r=S[n.token.charAt(0)],i.push(r?r.unit:"second")):n.maybe?i.push.apply(i,p(n.maybe)):i.push(null);return i}function h(t,e){return g(f(t,e).join(""))}function f(t,e){var n,r,i=[],o=y.oldMomentFormat(e,t),s=o.split(m);for(n=0;n<s.length;n++)r=s[n],r.charAt(0)===b?i.push(E[r.substring(1)](e)):i.push(r);return i}function g(t){return t.replace(D,function(t,e){return e.match(/[1-9]/)?e:""})}function v(t){var e,n,r,i,o=u(t);for(e=0;e<o.length;e++)n=o[e],n.token&&(r=S[n.token.charAt(0)])&&(!i||r.value>i.value)&&(i=r);return i?i.unit:null}Object.defineProperty(e,"__esModule",{value:!0});var y=n(11);y.newMomentProto.format=function(){return this._fullCalendar&&arguments[0]?i(this,arguments[0]):this._ambigTime?y.oldMomentFormat(r(this),"YYYY-MM-DD"):this._ambigZone?y.oldMomentFormat(r(this),"YYYY-MM-DD[T]HH:mm:ss"):this._fullCalendar?y.oldMomentFormat(r(this)):y.oldMomentProto.format.apply(this,arguments)},y.newMomentProto.toISOString=function(){return this._ambigTime?y.oldMomentFormat(r(this),"YYYY-MM-DD"):this._ambigZone?y.oldMomentFormat(r(this),"YYYY-MM-DD[T]HH:mm:ss"):this._fullCalendar?y.oldMomentProto.toISOString.apply(r(this),arguments):y.oldMomentProto.toISOString.apply(this,arguments)};var m="\v",b="",w="",D=new RegExp(w+"([^"+w+"]*)"+w,"g"),E={t:function(t){return y.oldMomentFormat(t,"a").charAt(0)},T:function(t){return y.oldMomentFormat(t,"A").charAt(0)}},S={Y:{value:1,unit:"year"},M:{value:2,unit:"month"},W:{value:3,unit:"week"},w:{value:3,unit:"week"},D:{value:4,unit:"day"},d:{value:4,unit:"day"}};e.formatDate=i,e.formatRange=o;var C={};e.queryMostGranularFormatUnit=v},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e,n){this.unzonedRange=t,this.eventDef=e,n&&(this.eventInstance=n)}return t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(35),o=n(13),s=n(7),a=function(t){function e(){var e=t.call(this)||this;return e._watchers={},e._props={},e.applyGlobalWatchers(),e.constructed(),e}return r.__extends(e,t),e.watch=function(t){for(var e=[],n=1;n<arguments.length;n++)e[n-1]=arguments[n];this.prototype.hasOwnProperty("_globalWatchArgs")||(this.prototype._globalWatchArgs=Object.create(this.prototype._globalWatchArgs)),this.prototype._globalWatchArgs[t]=e},e.prototype.constructed=function(){},e.prototype.applyGlobalWatchers=function(){var t,e=this._globalWatchArgs;for(t in e)this.watch.apply(this,[t].concat(e[t]))},e.prototype.has=function(t){return t in this._props},e.prototype.get=function(t){return void 0===t?this._props:this._props[t]},e.prototype.set=function(t,e){var n;"string"==typeof t?(n={},n[t]=void 0===e?null:e):n=t,this.setProps(n)},e.prototype.reset=function(t){var e,n=this._props,r={};for(e in n)r[e]=void 0;for(e in t)r[e]=t[e];this.setProps(r)},e.prototype.unset=function(t){var e,n,r={};for(e="string"==typeof t?[t]:t,n=0;n<e.length;n++)r[e[n]]=void 0;this.setProps(r)},e.prototype.setProps=function(t){var e,n,r={},i=0;for(e in t)"object"!=typeof(n=t[e])&&n===this._props[e]||(r[e]=n,i++);if(i){this.trigger("before:batchChange",r);for(e in r)n=r[e],this.trigger("before:change",e,n),this.trigger("before:change:"+e,n);for(e in r)n=r[e],void 0===n?delete this._props[e]:this._props[e]=n,this.trigger("change:"+e,n),this.trigger("change",e,n);this.trigger("batchChange",r)}},e.prototype.watch=function(t,e,n,r){var i=this;this.unwatch(t),this._watchers[t]=this._watchDeps(e,function(e){var r=n.call(i,e);r&&r.then?(i.unset(t),r.then(function(e){i.set(t,e)})):i.set(t,r)},function(e){i.unset(t),r&&r.call(i,e)})},e.prototype.unwatch=function(t){var e=this._watchers[t];e&&(delete this._watchers[t],e.teardown())},e.prototype._watchDeps=function(t,e,n){var r=this,i=0,o=t.length,s=0,a={},l=[],u=!1,d=function(t,e,r){1===++i&&s===o&&(u=!0,n(a),u=!1)},c=function(t,n,r){void 0===n?(r||void 0===a[t]||s--,delete a[t]):(r||void 0!==a[t]||s++,a[t]=n),--i||s===o&&(u||e(a))},p=function(t,e){r.on(t,e),l.push([t,e])};return t.forEach(function(t){var e=!1;"?"===t.charAt(0)&&(t=t.substring(1),e=!0),p("before:change:"+t,function(t){d()}),p("change:"+t,function(n){c(t,n,e)})}),t.forEach(function(t){var e=!1;"?"===t.charAt(0)&&(t=t.substring(1),e=!0),r.has(t)?(a[t]=r.get(t),s++):e&&s++}),s===o&&e(a),{teardown:function(){for(var t=0;t<l.length;t++)r.off(l[t][0],l[t][1]);l=null,s===o&&n()},flash:function(){s===o&&(n(),e(a))}}},e.prototype.flash=function(t){var e=this._watchers[t];e&&e.flash()},e}(i.default);e.default=a,a.prototype._globalWatchArgs={},o.default.mixInto(a),s.default.mixInto(a)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(4),o=n(15),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.defineStandardProps=function(t){var e=this.prototype;e.hasOwnProperty("standardPropMap")||(e.standardPropMap=Object.create(e.standardPropMap)),i.copyOwnProps(t,e.standardPropMap)},e.copyVerbatimStandardProps=function(t,e){var n,r=this.prototype.standardPropMap;for(n in r)null!=t[n]&&!0===r[n]&&(e[n]=t[n])},e.prototype.applyProps=function(t){var e,n=this.standardPropMap,r={},i={};for(e in t)!0===n[e]?this[e]=t[e]:!1===n[e]?r[e]=t[e]:i[e]=t[e];return this.applyMiscProps(i),this.applyManualStandardProps(r)},e.prototype.applyManualStandardProps=function(t){return!0},e.prototype.applyMiscProps=function(t){},e.prototype.isStandardProp=function(t){return t in this.standardPropMap},e}(o.default);e.default=s,s.prototype.standardPropMap={}},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){this.def=t,this.dateProfile=e}return t.prototype.toLegacy=function(){var t=this.dateProfile,e=this.def.toLegacy();return e.start=t.start.clone(),e.end=t.end?t.end.clone():null,e},t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(0),s=n(37),a=n(53),l=n(16),u=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.isAllDay=function(){return!this.startTime&&!this.endTime},e.prototype.buildInstances=function(t){for(var e,n,r,i=this.source.calendar,o=t.getStart(),s=t.getEnd(),u=[];o.isBefore(s);)this.dowHash&&!this.dowHash[o.day()]||(e=i.applyTimezone(o),n=e.clone(),r=null,this.startTime?n.time(this.startTime):n.stripTime(),this.endTime&&(r=e.clone().time(this.endTime)),u.push(new a.default(this,new l.default(n,r,i)))),o.add(1,"days");return u},e.prototype.setDow=function(t){this.dowHash||(this.dowHash={});for(var e=0;e<t.length;e++)this.dowHash[t[e]]=!0},e.prototype.clone=function(){var e=t.prototype.clone.call(this);return e.startTime&&(e.startTime=o.duration(this.startTime)),e.endTime&&(e.endTime=o.duration(this.endTime)),this.dowHash&&(e.dowHash=i.extend({},this.dowHash)),e},e}(s.default);e.default=u,u.prototype.applyProps=function(t){var e=s.default.prototype.applyProps.call(this,t);return t.start&&(this.startTime=o.duration(t.start)),t.end&&(this.endTime=o.duration(t.end)),t.dow&&this.setDow(t.dow),e},u.defineStandardProps({start:!1,end:!1,dow:!1})},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),i=n(4),o=n(5),s=function(){function t(t){this._view=t}return t.prototype.opt=function(t){return this._view.opt(t)},t.prototype.trimHiddenDays=function(t){return this._view.trimHiddenDays(t)},t.prototype.msToUtcMoment=function(t,e){return this._view.calendar.msToUtcMoment(t,e)},t.prototype.buildPrev=function(t){var e=t.date.clone().startOf(t.currentRangeUnit).subtract(t.dateIncrement);return this.build(e,-1)},t.prototype.buildNext=function(t){var e=t.date.clone().startOf(t.currentRangeUnit).add(t.dateIncrement);return this.build(e,1)},t.prototype.build=function(t,e,n){void 0===n&&(n=!1);var i,o,s,a,l,u,d=!t.hasTime(),c=null,p=null;return i=this.buildValidRange(),i=this.trimHiddenDays(i),n&&(t=this.msToUtcMoment(i.constrainDate(t),d)),o=this.buildCurrentRangeInfo(t,e),s=/^(year|month|week|day)$/.test(o.unit),a=this.buildRenderRange(this.trimHiddenDays(o.unzonedRange),o.unit,s),a=this.trimHiddenDays(a),l=a.clone(),this.opt("showNonCurrentDates")||(l=l.intersect(o.unzonedRange)),c=r.duration(this.opt("minTime")),p=r.duration(this.opt("maxTime")),l=this.adjustActiveRange(l,c,p),l=l.intersect(i),l&&(t=this.msToUtcMoment(l.constrainDate(t),d)),u=o.unzonedRange.intersectsWith(i),{validUnzonedRange:i,currentUnzonedRange:o.unzonedRange,currentRangeUnit:o.unit,isRangeAllDay:s,activeUnzonedRange:l,renderUnzonedRange:a,minTime:c,maxTime:p,isValid:u,date:t,dateIncrement:this.buildDateIncrement(o.duration)}},t.prototype.buildValidRange=function(){return this._view.getUnzonedRangeOption("validRange",this._view.calendar.getNow())||new o.default},t.prototype.buildCurrentRangeInfo=function(t,e){var n,r=this._view.viewSpec,o=null,s=null,a=null;return r.duration?(o=r.duration,s=r.durationUnit,a=this.buildRangeFromDuration(t,e,o,s)):(n=this.opt("dayCount"))?(s="day",a=this.buildRangeFromDayCount(t,e,n)):(a=this.buildCustomVisibleRange(t))?s=i.computeGreatestUnit(a.getStart(),a.getEnd()):(o=this.getFallbackDuration(),s=i.computeGreatestUnit(o),a=this.buildRangeFromDuration(t,e,o,s)),{duration:o,unit:s,unzonedRange:a}},t.prototype.getFallbackDuration=function(){return r.duration({days:1})},t.prototype.adjustActiveRange=function(t,e,n){var r=t.getStart(),i=t.getEnd();return this._view.usesMinMaxTime&&(e<0&&r.time(0).add(e),n>864e5&&i.time(n-864e5)),new o.default(r,i)},t.prototype.buildRangeFromDuration=function(t,e,n,s){function a(){d=t.clone().startOf(h),c=d.clone().add(n),p=new o.default(d,c)}var l,u,d,c,p,h=this.opt("dateAlignment");return h||(l=this.opt("dateIncrement"),l?(u=r.duration(l),h=u<n?i.computeDurationGreatestUnit(u,l):s):h=s),n.as("days")<=1&&this._view.isHiddenDay(d)&&(d=this._view.skipHiddenDays(d,e),d.startOf("day")),a(),this.trimHiddenDays(p)||(t=this._view.skipHiddenDays(t,e),a()),p},t.prototype.buildRangeFromDayCount=function(t,e,n){var r,i,s=this.opt("dateAlignment"),a=0;if(s||-1!==e){r=t.clone(),s&&r.startOf(s),r.startOf("day"),r=this._view.skipHiddenDays(r),i=r.clone();do{i.add(1,"day"),this._view.isHiddenDay(i)||a++}while(a<n)}else{i=t.clone().startOf("day").add(1,"day"),i=this._view.skipHiddenDays(i,-1,!0),r=i.clone();do{r.add(-1,"day"),this._view.isHiddenDay(r)||a++}while(a<n)}return new o.default(r,i)},t.prototype.buildCustomVisibleRange=function(t){var e=this._view.getUnzonedRangeOption("visibleRange",this._view.calendar.applyTimezone(t));return!e||null!=e.startMs&&null!=e.endMs?e:null},t.prototype.buildRenderRange=function(t,e,n){return t.clone()},t.prototype.buildDateIncrement=function(t){var e,n=this.opt("dateIncrement");return n?r.duration(n):(e=this.opt("dateAlignment"))?r.duration(1,e):t||r.duration({days:1})},t}();e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(21),a=n(6),l=n(9),u=function(t){function e(e){var n=t.call(this,e)||this;return n.eventDefs=[],n}return r.__extends(e,t),e.parse=function(t,e){var n;return i.isArray(t.events)?n=t:i.isArray(t)&&(n={events:t}),!!n&&a.default.parse.call(this,n,e)},e.prototype.setRawEventDefs=function(t){this.rawEventDefs=t,this.eventDefs=this.parseEventDefs(t)},e.prototype.fetch=function(t,e,n){var r,i=this.eventDefs;if(null!=this.currentTimezone&&this.currentTimezone!==n)for(r=0;r<i.length;r++)i[r]instanceof l.default&&i[r].rezone();return this.currentTimezone=n,s.default.resolve(i)},e.prototype.addEventDef=function(t){this.eventDefs.push(t)},e.prototype.removeEventDefsById=function(t){return o.removeMatching(this.eventDefs,function(e){return e.id===t})},e.prototype.removeAllEventDefs=function(){this.eventDefs=[]},e.prototype.getPrimitive=function(){return this.rawEventDefs},e.prototype.applyManualStandardProps=function(e){var n=t.prototype.applyManualStandardProps.call(this,e);return this.setRawEventDefs(e.events),n},e}(a.default);e.default=u,u.defineStandardProps({events:!1})},function(t,e,n){function r(t,e){a[t]=e}function i(t){return t?!0===t?s.default:a[t]:o.default}Object.defineProperty(e,"__esModule",{value:!0});var o=n(221),s=n(222),a={};e.defineThemeSystem=r,e.getThemeSystemClass=i},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=function(){function t(t){this.isHorizontal=!1,this.isVertical=!1,this.els=r(t.els),this.isHorizontal=t.isHorizontal,this.isVertical=t.isVertical,this.forcedOffsetParentEl=t.offsetParent?r(t.offsetParent):null}return t.prototype.build=function(){var t=this.forcedOffsetParentEl;!t&&this.els.length>0&&(t=this.els.eq(0).offsetParent()),this.origin=t?t.offset():null,this.boundingRect=this.queryBoundingRect(),this.isHorizontal&&this.buildElHorizontals(),this.isVertical&&this.buildElVerticals()},t.prototype.clear=function(){this.origin=null,this.boundingRect=null,this.lefts=null,this.rights=null,this.tops=null,this.bottoms=null},t.prototype.ensureBuilt=function(){this.origin||this.build()},t.prototype.buildElHorizontals=function(){var t=[],e=[];this.els.each(function(n,i){var o=r(i),s=o.offset().left,a=o.outerWidth();t.push(s),e.push(s+a)}),this.lefts=t,this.rights=e},t.prototype.buildElVerticals=function(){var t=[],e=[];this.els.each(function(n,i){var o=r(i),s=o.offset().top,a=o.outerHeight();t.push(s),e.push(s+a)}),this.tops=t,this.bottoms=e},t.prototype.getHorizontalIndex=function(t){this.ensureBuilt();var e,n=this.lefts,r=this.rights,i=n.length;for(e=0;e<i;e++)if(t>=n[e]&&t<r[e])return e},t.prototype.getVerticalIndex=function(t){this.ensureBuilt();var e,n=this.tops,r=this.bottoms,i=n.length;for(e=0;e<i;e++)if(t>=n[e]&&t<r[e])return e},t.prototype.getLeftOffset=function(t){return this.ensureBuilt(),this.lefts[t]},t.prototype.getLeftPosition=function(t){return this.ensureBuilt(),this.lefts[t]-this.origin.left},t.prototype.getRightOffset=function(t){return this.ensureBuilt(),this.rights[t]},t.prototype.getRightPosition=function(t){return this.ensureBuilt(),this.rights[t]-this.origin.left},t.prototype.getWidth=function(t){return this.ensureBuilt(),this.rights[t]-this.lefts[t]},t.prototype.getTopOffset=function(t){return this.ensureBuilt(),this.tops[t]},t.prototype.getTopPosition=function(t){return this.ensureBuilt(),this.tops[t]-this.origin.top},t.prototype.getBottomOffset=function(t){return this.ensureBuilt(),this.bottoms[t]},t.prototype.getBottomPosition=function(t){return this.ensureBuilt(),this.bottoms[t]-this.origin.top},t.prototype.getHeight=function(t){return this.ensureBuilt(),this.bottoms[t]-this.tops[t]},t.prototype.queryBoundingRect=function(){var t;return this.els.length>0&&(t=i.getScrollParent(this.els.eq(0)),!t.is(document)&&!t.is("html,body"))?i.getClientRect(t):null},t.prototype.isPointInBounds=function(t,e){return this.isLeftInBounds(t)&&this.isTopInBounds(e)},t.prototype.isLeftInBounds=function(t){return!this.boundingRect||t>=this.boundingRect.left&&t<this.boundingRect.right},t.prototype.isTopInBounds=function(t){return!this.boundingRect||t>=this.boundingRect.top&&t<this.boundingRect.bottom},t}();e.default=o},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=n(7),s=n(23),a=function(){function t(t){this.isInteracting=!1,this.isDistanceSurpassed=!1,this.isDelayEnded=!1,this.isDragging=!1,this.isTouch=!1,this.isGeneric=!1,this.shouldCancelTouchScroll=!0,this.scrollAlwaysKills=!1,this.isAutoScroll=!1,this.scrollSensitivity=30,this.scrollSpeed=200,this.scrollIntervalMs=50,this.options=t||{}}return t.prototype.startInteraction=function(t,e){if(void 0===e&&(e={}),"mousedown"===t.type){if(s.default.get().shouldIgnoreMouse())return;if(!i.isPrimaryMouseButton(t))return;t.preventDefault()}this.isInteracting||(this.delay=i.firstDefined(e.delay,this.options.delay,0),this.minDistance=i.firstDefined(e.distance,this.options.distance,0),this.subjectEl=this.options.subjectEl,i.preventSelection(r("body")),this.isInteracting=!0,this.isTouch=i.getEvIsTouch(t),this.isGeneric="dragstart"===t.type,this.isDelayEnded=!1,this.isDistanceSurpassed=!1,this.originX=i.getEvX(t),this.originY=i.getEvY(t),this.scrollEl=i.getScrollParent(r(t.target)),this.bindHandlers(),this.initAutoScroll(),this.handleInteractionStart(t),this.startDelay(t),this.minDistance||this.handleDistanceSurpassed(t))},t.prototype.handleInteractionStart=function(t){this.trigger("interactionStart",t)},t.prototype.endInteraction=function(t,e){this.isInteracting&&(this.endDrag(t),this.delayTimeoutId&&(clearTimeout(this.delayTimeoutId),this.delayTimeoutId=null),this.destroyAutoScroll(),this.unbindHandlers(),this.isInteracting=!1,this.handleInteractionEnd(t,e),i.allowSelection(r("body")))},t.prototype.handleInteractionEnd=function(t,e){this.trigger("interactionEnd",t,e||!1)},t.prototype.bindHandlers=function(){var t=s.default.get();this.isGeneric?this.listenTo(r(document),{drag:this.handleMove,dragstop:this.endInteraction}):this.isTouch?this.listenTo(t,{touchmove:this.handleTouchMove,touchend:this.endInteraction,scroll:this.handleTouchScroll}):this.listenTo(t,{mousemove:this.handleMouseMove,mouseup:this.endInteraction}),this.listenTo(t,{selectstart:i.preventDefault,contextmenu:i.preventDefault})},t.prototype.unbindHandlers=function(){this.stopListeningTo(s.default.get()),this.stopListeningTo(r(document))},t.prototype.startDrag=function(t,e){this.startInteraction(t,e),this.isDragging||(this.isDragging=!0,this.handleDragStart(t))},t.prototype.handleDragStart=function(t){this.trigger("dragStart",t)},t.prototype.handleMove=function(t){var e=i.getEvX(t)-this.originX,n=i.getEvY(t)-this.originY,r=this.minDistance;this.isDistanceSurpassed||e*e+n*n>=r*r&&this.handleDistanceSurpassed(t),this.isDragging&&this.handleDrag(e,n,t)},t.prototype.handleDrag=function(t,e,n){this.trigger("drag",t,e,n),this.updateAutoScroll(n)},t.prototype.endDrag=function(t){this.isDragging&&(this.isDragging=!1,this.handleDragEnd(t))},t.prototype.handleDragEnd=function(t){this.trigger("dragEnd",t)},t.prototype.startDelay=function(t){var e=this;this.delay?this.delayTimeoutId=setTimeout(function(){e.handleDelayEnd(t)},this.delay):this.handleDelayEnd(t)},t.prototype.handleDelayEnd=function(t){this.isDelayEnded=!0,this.isDistanceSurpassed&&this.startDrag(t)},t.prototype.handleDistanceSurpassed=function(t){this.isDistanceSurpassed=!0,this.isDelayEnded&&this.startDrag(t)},t.prototype.handleTouchMove=function(t){this.isDragging&&this.shouldCancelTouchScroll&&t.preventDefault(),this.handleMove(t)},t.prototype.handleMouseMove=function(t){this.handleMove(t)},t.prototype.handleTouchScroll=function(t){this.isDragging&&!this.scrollAlwaysKills||this.endInteraction(t,!0)},t.prototype.trigger=function(t){for(var e=[],n=1;n<arguments.length;n++)e[n-1]=arguments[n];this.options[t]&&this.options[t].apply(this,e),this["_"+t]&&this["_"+t].apply(this,e)},t.prototype.initAutoScroll=function(){var t=this.scrollEl;this.isAutoScroll=this.options.scroll&&t&&!t.is(window)&&!t.is(document),this.isAutoScroll&&this.listenTo(t,"scroll",i.debounce(this.handleDebouncedScroll,100))},t.prototype.destroyAutoScroll=function(){this.endAutoScroll(),this.isAutoScroll&&this.stopListeningTo(this.scrollEl,"scroll")},t.prototype.computeScrollBounds=function(){this.isAutoScroll&&(this.scrollBounds=i.getOuterRect(this.scrollEl))},t.prototype.updateAutoScroll=function(t){var e,n,r,o,s=this.scrollSensitivity,a=this.scrollBounds,l=0,u=0;a&&(e=(s-(i.getEvY(t)-a.top))/s,n=(s-(a.bottom-i.getEvY(t)))/s,r=(s-(i.getEvX(t)-a.left))/s,o=(s-(a.right-i.getEvX(t)))/s,e>=0&&e<=1?l=e*this.scrollSpeed*-1:n>=0&&n<=1&&(l=n*this.scrollSpeed),r>=0&&r<=1?u=r*this.scrollSpeed*-1:o>=0&&o<=1&&(u=o*this.scrollSpeed)),this.setScrollVel(l,u)},t.prototype.setScrollVel=function(t,e){this.scrollTopVel=t,this.scrollLeftVel=e,this.constrainScrollVel(),!this.scrollTopVel&&!this.scrollLeftVel||this.scrollIntervalId||(this.scrollIntervalId=setInterval(i.proxy(this,"scrollIntervalFunc"),this.scrollIntervalMs))},t.prototype.constrainScrollVel=function(){var t=this.scrollEl;this.scrollTopVel<0?t.scrollTop()<=0&&(this.scrollTopVel=0):this.scrollTopVel>0&&t.scrollTop()+t[0].clientHeight>=t[0].scrollHeight&&(this.scrollTopVel=0),this.scrollLeftVel<0?t.scrollLeft()<=0&&(this.scrollLeftVel=0):this.scrollLeftVel>0&&t.scrollLeft()+t[0].clientWidth>=t[0].scrollWidth&&(this.scrollLeftVel=0)},t.prototype.scrollIntervalFunc=function(){var t=this.scrollEl,e=this.scrollIntervalMs/1e3;this.scrollTopVel&&t.scrollTop(t.scrollTop()+this.scrollTopVel*e),this.scrollLeftVel&&t.scrollLeft(t.scrollLeft()+this.scrollLeftVel*e),this.constrainScrollVel(),this.scrollTopVel||this.scrollLeftVel||this.endAutoScroll()},t.prototype.endAutoScroll=function(){this.scrollIntervalId&&(clearInterval(this.scrollIntervalId),this.scrollIntervalId=null,this.handleScrollEnd())},t.prototype.handleDebouncedScroll=function(){this.scrollIntervalId||this.handleScrollEnd()},t.prototype.handleScrollEnd=function(){},t}();e.default=a,o.default.mixInto(a)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(4),o=n(15),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.updateDayTable=function(){for(var t,e,n,r=this,i=r.view,o=i.calendar,s=o.msToUtcMoment(r.dateProfile.renderUnzonedRange.startMs,!0),a=o.msToUtcMoment(r.dateProfile.renderUnzonedRange.endMs,!0),l=-1,u=[],d=[];s.isBefore(a);)i.isHiddenDay(s)?u.push(l+.5):(l++,u.push(l),d.push(s.clone())),s.add(1,"days");if(this.breakOnWeeks){for(e=d[0].day(),t=1;t<d.length&&d[t].day()!==e;t++);n=Math.ceil(d.length/t)}else n=1,t=d.length;this.dayDates=d,this.dayIndices=u,this.daysPerRow=t,this.rowCnt=n,this.updateDayTableCols()},e.prototype.updateDayTableCols=function(){this.colCnt=this.computeColCnt(),this.colHeadFormat=this.opt("columnHeaderFormat")||this.opt("columnFormat")||this.computeColHeadFormat()},e.prototype.computeColCnt=function(){return this.daysPerRow},e.prototype.getCellDate=function(t,e){return this.dayDates[this.getCellDayIndex(t,e)].clone()},e.prototype.getCellRange=function(t,e){var n=this.getCellDate(t,e);return{start:n,end:n.clone().add(1,"days")}},e.prototype.getCellDayIndex=function(t,e){return t*this.daysPerRow+this.getColDayIndex(e)},e.prototype.getColDayIndex=function(t){return this.isRTL?this.colCnt-1-t:t},e.prototype.getDateDayIndex=function(t){var e=this.dayIndices,n=t.diff(this.dayDates[0],"days");return n<0?e[0]-1:n>=e.length?e[e.length-1]+1:e[n]},e.prototype.computeColHeadFormat=function(){return this.rowCnt>1||this.colCnt>10?"ddd":this.colCnt>1?this.opt("dayOfMonthFormat"):"dddd"},e.prototype.sliceRangeByRow=function(t){var e,n,r,i,o,s=this.daysPerRow,a=this.view.computeDayRange(t),l=this.getDateDayIndex(a.start),u=this.getDateDayIndex(a.end.clone().subtract(1,"days")),d=[];for(e=0;e<this.rowCnt;e++)n=e*s,r=n+s-1,i=Math.max(l,n),o=Math.min(u,r),i=Math.ceil(i),o=Math.floor(o),i<=o&&d.push({row:e,firstRowDayIndex:i-n,lastRowDayIndex:o-n,isStart:i===l,isEnd:o===u});return d},e.prototype.sliceRangeByDay=function(t){var e,n,r,i,o,s,a=this.daysPerRow,l=this.view.computeDayRange(t),u=this.getDateDayIndex(l.start),d=this.getDateDayIndex(l.end.clone().subtract(1,"days")),c=[];for(e=0;e<this.rowCnt;e++)for(n=e*a,r=n+a-1,i=n;i<=r;i++)o=Math.max(u,i),s=Math.min(d,i),o=Math.ceil(o),s=Math.floor(s),o<=s&&c.push({row:e,firstRowDayIndex:o-n,lastRowDayIndex:s-n,isStart:o===u,isEnd:s===d});return c},e.prototype.renderHeadHtml=function(){var t=this.view.calendar.theme;return'<div class="fc-row '+t.getClass("headerRow")+'"><table class="'+t.getClass("tableGrid")+'"><thead>'+this.renderHeadTrHtml()+"</thead></table></div>"},e.prototype.renderHeadIntroHtml=function(){return this.renderIntroHtml()},e.prototype.renderHeadTrHtml=function(){return"<tr>"+(this.isRTL?"":this.renderHeadIntroHtml())+this.renderHeadDateCellsHtml()+(this.isRTL?this.renderHeadIntroHtml():"")+"</tr>"},e.prototype.renderHeadDateCellsHtml=function(){var t,e,n=[];for(t=0;t<this.colCnt;t++)e=this.getCellDate(0,t),n.push(this.renderHeadDateCellHtml(e));return n.join("")},e.prototype.renderHeadDateCellHtml=function(t,e,n){var r,o=this,s=o.view,a=o.dateProfile.activeUnzonedRange.containsDate(t),l=["fc-day-header",s.calendar.theme.getClass("widgetHeader")];return r="function"==typeof o.opt("columnHeaderHtml")?o.opt("columnHeaderHtml")(t):"function"==typeof o.opt("columnHeaderText")?i.htmlEscape(o.opt("columnHeaderText")(t)):i.htmlEscape(t.format(o.colHeadFormat)),1===o.rowCnt?l=l.concat(o.getDayClasses(t,!0)):l.push("fc-"+i.dayIDs[t.day()]),'<th class="'+l.join(" ")+'"'+(1===(a&&o.rowCnt)?' data-date="'+t.format("YYYY-MM-DD")+'"':"")+(e>1?' colspan="'+e+'"':"")+(n?" "+n:"")+">"+(a?s.buildGotoAnchorHtml({date:t,forceOff:o.rowCnt>1||1===o.colCnt},r):r)+"</th>"},e.prototype.renderBgTrHtml=function(t){return"<tr>"+(this.isRTL?"":this.renderBgIntroHtml(t))+this.renderBgCellsHtml(t)+(this.isRTL?this.renderBgIntroHtml(t):"")+"</tr>"},e.prototype.renderBgIntroHtml=function(t){return this.renderIntroHtml()},e.prototype.renderBgCellsHtml=function(t){var e,n,r=[];for(e=0;e<this.colCnt;e++)n=this.getCellDate(t,e),r.push(this.renderBgCellHtml(n));return r.join("")},e.prototype.renderBgCellHtml=function(t,e){var n=this,r=n.view,i=n.dateProfile.activeUnzonedRange.containsDate(t),o=n.getDayClasses(t);return o.unshift("fc-day",r.calendar.theme.getClass("widgetContent")),'<td class="'+o.join(" ")+'"'+(i?' data-date="'+t.format("YYYY-MM-DD")+'"':"")+(e?" "+e:"")+"></td>"},e.prototype.renderIntroHtml=function(){},e.prototype.bookendCells=function(t){var e=this.renderIntroHtml();e&&(this.isRTL?t.append(e):t.prepend(e))},e}(o.default);e.default=s},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){this.component=t,this.fillRenderer=e}
return t.prototype.render=function(t){var e=this.component,n=e._getDateProfile().activeUnzonedRange,r=t.buildEventInstanceGroup(e.hasAllDayBusinessHours,n),i=r?e.eventRangesToEventFootprints(r.sliceRenderRanges(n)):[];this.renderEventFootprints(i)},t.prototype.renderEventFootprints=function(t){var e=this.component.eventFootprintsToSegs(t);this.renderSegs(e),this.segs=e},t.prototype.renderSegs=function(t){this.fillRenderer&&this.fillRenderer.renderSegs("businessHours",t,{getClasses:function(t){return["fc-nonbusiness","fc-bgevent"]}})},t.prototype.unrender=function(){this.fillRenderer&&this.fillRenderer.unrender("businessHours"),this.segs=null},t.prototype.getSegs=function(){return this.segs||[]},t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=function(){function t(t){this.fillSegTag="div",this.component=t,this.elsByFill={}}return t.prototype.renderFootprint=function(t,e,n){this.renderSegs(t,this.component.componentFootprintToSegs(e),n)},t.prototype.renderSegs=function(t,e,n){var r;return e=this.buildSegEls(t,e,n),r=this.attachSegEls(t,e),r&&this.reportEls(t,r),e},t.prototype.unrender=function(t){var e=this.elsByFill[t];e&&(e.remove(),delete this.elsByFill[t])},t.prototype.buildSegEls=function(t,e,n){var i,o=this,s="",a=[];if(e.length){for(i=0;i<e.length;i++)s+=this.buildSegHtml(t,e[i],n);r(s).each(function(t,i){var s=e[t],l=r(i);n.filterEl&&(l=n.filterEl(s,l)),l&&(l=r(l),l.is(o.fillSegTag)&&(s.el=l,a.push(s)))})}return a},t.prototype.buildSegHtml=function(t,e,n){var r=n.getClasses?n.getClasses(e):[],o=i.cssToStr(n.getCss?n.getCss(e):{});return"<"+this.fillSegTag+(r.length?' class="'+r.join(" ")+'"':"")+(o?' style="'+o+'"':"")+" />"},t.prototype.attachSegEls=function(t,e){},t.prototype.reportEls=function(t,e){this.elsByFill[t]?this.elsByFill[t]=this.elsByFill[t].add(e):this.elsByFill[t]=r(e)},t}();e.default=o},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(9),i=n(34),o=n(6),s=function(){function t(t,e){this.view=t._getView(),this.component=t,this.eventRenderer=e}return t.prototype.renderComponentFootprint=function(t){this.renderEventFootprints([this.fabricateEventFootprint(t)])},t.prototype.renderEventDraggingFootprints=function(t,e,n){this.renderEventFootprints(t,e,"fc-dragging",n?null:this.view.opt("dragOpacity"))},t.prototype.renderEventResizingFootprints=function(t,e,n){this.renderEventFootprints(t,e,"fc-resizing")},t.prototype.renderEventFootprints=function(t,e,n,r){var i,o=this.component.eventFootprintsToSegs(t),s="fc-helper "+(n||"");for(o=this.eventRenderer.renderFgSegEls(o),i=0;i<o.length;i++)o[i].el.addClass(s);if(null!=r)for(i=0;i<o.length;i++)o[i].el.css("opacity",r);this.helperEls=this.renderSegs(o,e)},t.prototype.renderSegs=function(t,e){},t.prototype.unrender=function(){this.helperEls&&(this.helperEls.remove(),this.helperEls=null)},t.prototype.fabricateEventFootprint=function(t){var e,n=this.view.calendar,s=n.footprintToDateProfile(t),a=new r.default(new o.default(n));return a.dateProfile=s,e=a.buildInstance(),new i.default(t,a,e)},t}();e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(23),o=n(14),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.bindToEl=function(t){var e=this.component;e.bindSegHandlerToEl(t,"click",this.handleClick.bind(this)),e.bindSegHandlerToEl(t,"mouseenter",this.handleMouseover.bind(this)),e.bindSegHandlerToEl(t,"mouseleave",this.handleMouseout.bind(this))},e.prototype.handleClick=function(t,e){!1===this.component.publiclyTrigger("eventClick",{context:t.el[0],args:[t.footprint.getEventLegacy(),e,this.view]})&&e.preventDefault()},e.prototype.handleMouseover=function(t,e){i.default.get().shouldIgnoreMouse()||this.mousedOverSeg||(this.mousedOverSeg=t,this.view.isEventDefResizable(t.footprint.eventDef)&&t.el.addClass("fc-allow-mouse-resize"),this.component.publiclyTrigger("eventMouseover",{context:t.el[0],args:[t.footprint.getEventLegacy(),e,this.view]}))},e.prototype.handleMouseout=function(t,e){this.mousedOverSeg&&(this.mousedOverSeg=null,this.view.isEventDefResizable(t.footprint.eventDef)&&t.el.removeClass("fc-allow-mouse-resize"),this.component.publiclyTrigger("eventMouseout",{context:t.el[0],args:[t.footprint.getEventLegacy(),e||{},this.view]}))},e.prototype.end=function(){this.mousedOverSeg&&this.handleMouseout(this.mousedOverSeg)},e}(o.default);e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(15),o=n(237),s=n(236),a=n(64),l=n(235),u=n(234),d=n(233),c=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e}(i.default);e.default=c,c.prototype.dateClickingClass=o.default,c.prototype.dateSelectingClass=s.default,c.prototype.eventPointingClass=a.default,c.prototype.eventDraggingClass=l.default,c.prototype.eventResizingClass=u.default,c.prototype.externalDroppingClass=d.default},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(58),a=n(227),l=n(5),u=n(12),d=n(34),c=n(61),p=n(65),h=n(42),f=n(60),g=n(243),v=n(244),y=n(245),m=function(t){function e(e){var n=t.call(this,e)||this;return n.cellWeekNumbersVisible=!1,n.bottomCoordPadding=0,n.isRigid=!1,n.hasAllDayBusinessHours=!0,n}return r.__extends(e,t),e.prototype.componentFootprintToSegs=function(t){var e,n,r=this.sliceRangeByRow(t.unzonedRange);for(e=0;e<r.length;e++)n=r[e],this.isRTL?(n.leftCol=this.daysPerRow-1-n.lastRowDayIndex,n.rightCol=this.daysPerRow-1-n.firstRowDayIndex):(n.leftCol=n.firstRowDayIndex,n.rightCol=n.lastRowDayIndex);return r},e.prototype.renderDates=function(t){this.dateProfile=t,this.updateDayTable(),this.renderGrid()},e.prototype.unrenderDates=function(){this.removeSegPopover()},e.prototype.renderGrid=function(){var t,e,n=this.view,r=this.rowCnt,i=this.colCnt,o="";for(this.headContainerEl&&this.headContainerEl.html(this.renderHeadHtml()),t=0;t<r;t++)o+=this.renderDayRowHtml(t,this.isRigid);for(this.el.html(o),this.rowEls=this.el.find(".fc-row"),this.cellEls=this.el.find(".fc-day, .fc-disabled-day"),this.rowCoordCache=new s.default({els:this.rowEls,isVertical:!0}),this.colCoordCache=new s.default({els:this.cellEls.slice(0,this.colCnt),isHorizontal:!0}),t=0;t<r;t++)for(e=0;e<i;e++)this.publiclyTrigger("dayRender",{context:n,args:[this.getCellDate(t,e),this.getCellEl(t,e),n]})},e.prototype.renderDayRowHtml=function(t,e){var n=this.view.calendar.theme,r=["fc-row","fc-week",n.getClass("dayRow")];return e&&r.push("fc-rigid"),'<div class="'+r.join(" ")+'"><div class="fc-bg"><table class="'+n.getClass("tableGrid")+'">'+this.renderBgTrHtml(t)+'</table></div><div class="fc-content-skeleton"><table>'+(this.getIsNumbersVisible()?"<thead>"+this.renderNumberTrHtml(t)+"</thead>":"")+"</table></div></div>"},e.prototype.getIsNumbersVisible=function(){return this.getIsDayNumbersVisible()||this.cellWeekNumbersVisible},e.prototype.getIsDayNumbersVisible=function(){return this.rowCnt>1},e.prototype.renderNumberTrHtml=function(t){return"<tr>"+(this.isRTL?"":this.renderNumberIntroHtml(t))+this.renderNumberCellsHtml(t)+(this.isRTL?this.renderNumberIntroHtml(t):"")+"</tr>"},e.prototype.renderNumberIntroHtml=function(t){return this.renderIntroHtml()},e.prototype.renderNumberCellsHtml=function(t){var e,n,r=[];for(e=0;e<this.colCnt;e++)n=this.getCellDate(t,e),r.push(this.renderNumberCellHtml(n));return r.join("")},e.prototype.renderNumberCellHtml=function(t){var e,n,r=this.view,i="",o=this.dateProfile.activeUnzonedRange.containsDate(t),s=this.getIsDayNumbersVisible()&&o;return s||this.cellWeekNumbersVisible?(e=this.getDayClasses(t),e.unshift("fc-day-top"),this.cellWeekNumbersVisible&&(n="ISO"===t._locale._fullCalendar_weekCalc?1:t._locale.firstDayOfWeek()),i+='<td class="'+e.join(" ")+'"'+(o?' data-date="'+t.format()+'"':"")+">",this.cellWeekNumbersVisible&&t.day()===n&&(i+=r.buildGotoAnchorHtml({date:t,type:"week"},{class:"fc-week-number"},t.format("w"))),s&&(i+=r.buildGotoAnchorHtml(t,{class:"fc-day-number"},t.format("D"))),i+="</td>"):"<td/>"},e.prototype.prepareHits=function(){this.colCoordCache.build(),this.rowCoordCache.build(),this.rowCoordCache.bottoms[this.rowCnt-1]+=this.bottomCoordPadding},e.prototype.releaseHits=function(){this.colCoordCache.clear(),this.rowCoordCache.clear()},e.prototype.queryHit=function(t,e){if(this.colCoordCache.isLeftInBounds(t)&&this.rowCoordCache.isTopInBounds(e)){var n=this.colCoordCache.getHorizontalIndex(t),r=this.rowCoordCache.getVerticalIndex(e);if(null!=r&&null!=n)return this.getCellHit(r,n)}},e.prototype.getHitFootprint=function(t){var e=this.getCellRange(t.row,t.col);return new u.default(new l.default(e.start,e.end),!0)},e.prototype.getHitEl=function(t){return this.getCellEl(t.row,t.col)},e.prototype.getCellHit=function(t,e){return{row:t,col:e,component:this,left:this.colCoordCache.getLeftOffset(e),right:this.colCoordCache.getRightOffset(e),top:this.rowCoordCache.getTopOffset(t),bottom:this.rowCoordCache.getBottomOffset(t)}},e.prototype.getCellEl=function(t,e){return this.cellEls.eq(t*this.colCnt+e)},e.prototype.executeEventUnrender=function(){this.removeSegPopover(),t.prototype.executeEventUnrender.call(this)},e.prototype.getOwnEventSegs=function(){return t.prototype.getOwnEventSegs.call(this).concat(this.popoverSegs||[])},e.prototype.renderDrag=function(t,e,n){var r;for(r=0;r<t.length;r++)this.renderHighlight(t[r].componentFootprint);if(t.length&&e&&e.component!==this)return this.helperRenderer.renderEventDraggingFootprints(t,e,n),!0},e.prototype.unrenderDrag=function(){this.unrenderHighlight(),this.helperRenderer.unrender()},e.prototype.renderEventResize=function(t,e,n){var r;for(r=0;r<t.length;r++)this.renderHighlight(t[r].componentFootprint);this.helperRenderer.renderEventResizingFootprints(t,e,n)},e.prototype.unrenderEventResize=function(){this.unrenderHighlight(),this.helperRenderer.unrender()},e.prototype.removeSegPopover=function(){this.segPopover&&this.segPopover.hide()},e.prototype.limitRows=function(t){var e,n,r=this.eventRenderer.rowStructs||[];for(e=0;e<r.length;e++)this.unlimitRow(e),!1!==(n=!!t&&("number"==typeof t?t:this.computeRowLevelLimit(e)))&&this.limitRow(e,n)},e.prototype.computeRowLevelLimit=function(t){function e(t,e){o=Math.max(o,i(e).outerHeight())}var n,r,o,s=this.rowEls.eq(t),a=s.height(),l=this.eventRenderer.rowStructs[t].tbodyEl.children();for(n=0;n<l.length;n++)if(r=l.eq(n).removeClass("fc-limited"),o=0,r.find("> td > :first-child").each(e),r.position().top+o>a)return n;return!1},e.prototype.limitRow=function(t,e){var n,r,o,s,a,l,u,d,c,p,h,f,g,v,y,m=this,b=this.eventRenderer.rowStructs[t],w=[],D=0,E=function(n){for(;D<n;)l=m.getCellSegs(t,D,e),l.length&&(c=r[e-1][D],y=m.renderMoreLink(t,D,l),v=i("<div/>").append(y),c.append(v),w.push(v[0])),D++};if(e&&e<b.segLevels.length){for(n=b.segLevels[e-1],r=b.cellMatrix,o=b.tbodyEl.children().slice(e).addClass("fc-limited").get(),s=0;s<n.length;s++){for(a=n[s],E(a.leftCol),d=[],u=0;D<=a.rightCol;)l=this.getCellSegs(t,D,e),d.push(l),u+=l.length,D++;if(u){for(c=r[e-1][a.leftCol],p=c.attr("rowspan")||1,h=[],f=0;f<d.length;f++)g=i('<td class="fc-more-cell"/>').attr("rowspan",p),l=d[f],y=this.renderMoreLink(t,a.leftCol+f,[a].concat(l)),v=i("<div/>").append(y),g.append(v),h.push(g[0]),w.push(g[0]);c.addClass("fc-limited").after(i(h)),o.push(c[0])}}E(this.colCnt),b.moreEls=i(w),b.limitedEls=i(o)}},e.prototype.unlimitRow=function(t){var e=this.eventRenderer.rowStructs[t];e.moreEls&&(e.moreEls.remove(),e.moreEls=null),e.limitedEls&&(e.limitedEls.removeClass("fc-limited"),e.limitedEls=null)},e.prototype.renderMoreLink=function(t,e,n){var r=this,o=this.view;return i('<a class="fc-more"/>').text(this.getMoreLinkText(n.length)).on("click",function(s){var a=r.opt("eventLimitClick"),l=r.getCellDate(t,e),u=i(s.currentTarget),d=r.getCellEl(t,e),c=r.getCellSegs(t,e),p=r.resliceDaySegs(c,l),h=r.resliceDaySegs(n,l);"function"==typeof a&&(a=r.publiclyTrigger("eventLimitClick",{context:o,args:[{date:l.clone(),dayEl:d,moreEl:u,segs:p,hiddenSegs:h},s,o]})),"popover"===a?r.showSegPopover(t,e,u,p):"string"==typeof a&&o.calendar.zoomTo(l,a)})},e.prototype.showSegPopover=function(t,e,n,r){var i,o,s=this,l=this.view,u=n.parent();i=1===this.rowCnt?l.el:this.rowEls.eq(t),o={className:"fc-more-popover "+l.calendar.theme.getClass("popover"),content:this.renderSegPopoverContent(t,e,r),parentEl:l.el,top:i.offset().top,autoHide:!0,viewportConstrain:this.opt("popoverViewportConstrain"),hide:function(){s.popoverSegs&&s.triggerBeforeEventSegsDestroyed(s.popoverSegs),s.segPopover.removeElement(),s.segPopover=null,s.popoverSegs=null}},this.isRTL?o.right=u.offset().left+u.outerWidth()+1:o.left=u.offset().left-1,this.segPopover=new a.default(o),this.segPopover.show(),this.bindAllSegHandlersToEl(this.segPopover.el),this.triggerAfterEventSegsRendered(r)},e.prototype.renderSegPopoverContent=function(t,e,n){var r,s=this.view,a=s.calendar.theme,l=this.getCellDate(t,e).format(this.opt("dayPopoverFormat")),u=i('<div class="fc-header '+a.getClass("popoverHeader")+'"><span class="fc-close '+a.getIconClass("close")+'"></span><span class="fc-title">'+o.htmlEscape(l)+'</span><div class="fc-clear"/></div><div class="fc-body '+a.getClass("popoverContent")+'"><div class="fc-event-container"></div></div>'),d=u.find(".fc-event-container");for(n=this.eventRenderer.renderFgSegEls(n,!0),this.popoverSegs=n,r=0;r<n.length;r++)this.hitsNeeded(),n[r].hit=this.getCellHit(t,e),this.hitsNotNeeded(),d.append(n[r].el);return u},e.prototype.resliceDaySegs=function(t,e){var n,r,o,s=e.clone(),a=s.clone().add(1,"days"),c=new l.default(s,a),p=[];for(n=0;n<t.length;n++)r=t[n],(o=r.footprint.componentFootprint.unzonedRange.intersect(c))&&p.push(i.extend({},r,{footprint:new d.default(new u.default(o,r.footprint.componentFootprint.isAllDay),r.footprint.eventDef,r.footprint.eventInstance),isStart:r.isStart&&o.isStart,isEnd:r.isEnd&&o.isEnd}));return this.eventRenderer.sortEventSegs(p),p},e.prototype.getMoreLinkText=function(t){var e=this.opt("eventLimitText");return"function"==typeof e?e(t):"+"+t+" "+e},e.prototype.getCellSegs=function(t,e,n){for(var r,i=this.eventRenderer.rowStructs[t].segMatrix,o=n||0,s=[];o<i.length;)r=i[o][e],r&&s.push(r),o++;return s},e}(h.default);e.default=m,m.prototype.eventRendererClass=g.default,m.prototype.businessHourRendererClass=c.default,m.prototype.helperRendererClass=v.default,m.prototype.fillRendererClass=y.default,p.default.mixInto(m),f.default.mixInto(m)},function(t,e,n){function r(t){return function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e.colWeekNumbersVisible=!1,e}return i.__extends(e,t),e.prototype.renderHeadIntroHtml=function(){var t=this.view;return this.colWeekNumbersVisible?'<th class="fc-week-number '+t.calendar.theme.getClass("widgetHeader")+'" '+t.weekNumberStyleAttr()+"><span>"+s.htmlEscape(this.opt("weekNumberTitle"))+"</span></th>":""},e.prototype.renderNumberIntroHtml=function(t){var e=this.view,n=this.getCellDate(t,0);return this.colWeekNumbersVisible?'<td class="fc-week-number" '+e.weekNumberStyleAttr()+">"+e.buildGotoAnchorHtml({date:n,type:"week",forceOff:1===this.colCnt},n.format("w"))+"</td>":""},e.prototype.renderBgIntroHtml=function(){var t=this.view;return this.colWeekNumbersVisible?'<td class="fc-week-number '+t.calendar.theme.getClass("widgetContent")+'" '+t.weekNumberStyleAttr()+"></td>":""},e.prototype.renderIntroHtml=function(){var t=this.view;return this.colWeekNumbersVisible?'<td class="fc-week-number" '+t.weekNumberStyleAttr()+"></td>":""},e.prototype.getIsNumbersVisible=function(){return d.default.prototype.getIsNumbersVisible.apply(this,arguments)||this.colWeekNumbersVisible},e}(t)}Object.defineProperty(e,"__esModule",{value:!0});var i=n(2),o=n(3),s=n(4),a=n(41),l=n(43),u=n(68),d=n(66),c=function(t){function e(e,n){var r=t.call(this,e,n)||this;return r.dayGrid=r.instantiateDayGrid(),r.dayGrid.isRigid=r.hasRigidRows(),r.opt("weekNumbers")&&(r.opt("weekNumbersWithinDays")?(r.dayGrid.cellWeekNumbersVisible=!0,r.dayGrid.colWeekNumbersVisible=!1):(r.dayGrid.cellWeekNumbersVisible=!1,r.dayGrid.colWeekNumbersVisible=!0)),r.addChild(r.dayGrid),r.scroller=new a.default({overflowX:"hidden",overflowY:"auto"}),r}return i.__extends(e,t),e.prototype.instantiateDayGrid=function(){return new(r(this.dayGridClass))(this)},e.prototype.executeDateRender=function(e){this.dayGrid.breakOnWeeks=/year|month|week/.test(e.currentRangeUnit),t.prototype.executeDateRender.call(this,e)},e.prototype.renderSkeleton=function(){var t,e;this.el.addClass("fc-basic-view").html(this.renderSkeletonHtml()),this.scroller.render(),t=this.scroller.el.addClass("fc-day-grid-container"),e=o('<div class="fc-day-grid" />').appendTo(t),this.el.find(".fc-body > tr > td").append(t),this.dayGrid.headContainerEl=this.el.find(".fc-head-container"),this.dayGrid.setElement(e)},e.prototype.unrenderSkeleton=function(){this.dayGrid.removeElement(),this.scroller.destroy()},e.prototype.renderSkeletonHtml=function(){var t=this.calendar.theme;return'<table class="'+t.getClass("tableGrid")+'">'+(this.opt("columnHeader")?'<thead class="fc-head"><tr><td class="fc-head-container '+t.getClass("widgetHeader")+'">&nbsp;</td></tr></thead>':"")+'<tbody class="fc-body"><tr><td class="'+t.getClass("widgetContent")+'"></td></tr></tbody></table>'},e.prototype.weekNumberStyleAttr=function(){return null!=this.weekNumberWidth?'style="width:'+this.weekNumberWidth+'px"':""},e.prototype.hasRigidRows=function(){var t=this.opt("eventLimit");return t&&"number"!=typeof t},e.prototype.updateSize=function(e,n,r){var i,o,a=this.opt("eventLimit"),l=this.dayGrid.headContainerEl.find(".fc-row");if(!this.dayGrid.rowEls)return void(n||(i=this.computeScrollerHeight(e),this.scroller.setHeight(i)));t.prototype.updateSize.call(this,e,n,r),this.dayGrid.colWeekNumbersVisible&&(this.weekNumberWidth=s.matchCellWidths(this.el.find(".fc-week-number"))),this.scroller.clear(),s.uncompensateScroll(l),this.dayGrid.removeSegPopover(),a&&"number"==typeof a&&this.dayGrid.limitRows(a),i=this.computeScrollerHeight(e),this.setGridHeight(i,n),a&&"number"!=typeof a&&this.dayGrid.limitRows(a),n||(this.scroller.setHeight(i),o=this.scroller.getScrollbarWidths(),(o.left||o.right)&&(s.compensateScroll(l,o),i=this.computeScrollerHeight(e),this.scroller.setHeight(i)),this.scroller.lockOverflow(o))},e.prototype.computeScrollerHeight=function(t){return t-s.subtractInnerElHeight(this.el,this.scroller.el)},e.prototype.setGridHeight=function(t,e){e?s.undistributeHeight(this.dayGrid.rowEls):s.distributeHeight(this.dayGrid.rowEls,t,!0)},e.prototype.computeInitialDateScroll=function(){return{top:0}},e.prototype.queryDateScroll=function(){return{top:this.scroller.getScrollTop()}},e.prototype.applyDateScroll=function(t){void 0!==t.top&&this.scroller.setScrollTop(t.top)},e}(l.default);e.default=c,c.prototype.dateProfileGeneratorClass=u.default,c.prototype.dayGridClass=d.default},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(5),o=n(55),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.buildRenderRange=function(e,n,r){var o=t.prototype.buildRenderRange.call(this,e,n,r),s=this.msToUtcMoment(o.startMs,r),a=this.msToUtcMoment(o.endMs,r);return/^(year|month)$/.test(n)&&(s.startOf("week"),a.weekday()&&a.add(1,"week").startOf("week")),new i.default(s,a)},e}(o.default);e.default=s},,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,function(t,e,n){function r(t,e,n){var r;for(r=0;r<t.length;r++)if(!e(t[r].eventInstance.toLegacy(),n?n.toLegacy():null))return!1;return!0}function i(t,e){var n,r,i,o,s=e.toLegacy();for(n=0;n<t.length;n++){if(r=t[n].eventInstance,i=r.def,!1===(o=i.getOverlap()))return!1;if("function"==typeof o&&!o(r.toLegacy(),s))return!1}return!0}Object.defineProperty(e,"__esModule",{value:!0});var o=n(5),s=n(12),a=n(36),l=n(6),u=n(19),d=function(){function t(t,e){this.eventManager=t,this._calendar=e}return t.prototype.opt=function(t){return this._calendar.opt(t)},t.prototype.isEventInstanceGroupAllowed=function(t){var e,n=t.getEventDef(),r=this.eventRangesToEventFootprints(t.getAllEventRanges()),i=this.getPeerEventInstances(n),o=i.map(u.eventInstanceToEventRange),s=this.eventRangesToEventFootprints(o),a=n.getConstraint(),l=n.getOverlap(),d=this.opt("eventAllow");for(e=0;e<r.length;e++)if(!this.isFootprintAllowed(r[e].componentFootprint,s,a,l,r[e].eventInstance))return!1;if(d)for(e=0;e<r.length;e++)if(!1===d(r[e].componentFootprint.toLegacy(this._calendar),r[e].getEventLegacy()))return!1;return!0},t.prototype.getPeerEventInstances=function(t){return this.eventManager.getEventInstancesWithoutId(t.id)},t.prototype.isSelectionFootprintAllowed=function(t){var e,n=this.eventManager.getEventInstances(),r=n.map(u.eventInstanceToEventRange),i=this.eventRangesToEventFootprints(r);return!!this.isFootprintAllowed(t,i,this.opt("selectConstraint"),this.opt("selectOverlap"))&&(!(e=this.opt("selectAllow"))||!1!==e(t.toLegacy(this._calendar)))},t.prototype.isFootprintAllowed=function(t,e,n,o,s){var a,l;if(null!=n&&(a=this.constraintValToFootprints(n,t.isAllDay),!this.isFootprintWithinConstraints(t,a)))return!1;if(l=this.collectOverlapEventFootprints(e,t),!1===o){if(l.length)return!1}else if("function"==typeof o&&!r(l,o,s))return!1;return!(s&&!i(l,s))},t.prototype.isFootprintWithinConstraints=function(t,e){var n;for(n=0;n<e.length;n++)if(this.footprintContainsFootprint(e[n],t))return!0;return!1},t.prototype.constraintValToFootprints=function(t,e){var n;return"businessHours"===t?this.buildCurrentBusinessFootprints(e):"object"==typeof t?(n=this.parseEventDefToInstances(t),n?this.eventInstancesToFootprints(n):this.parseFootprints(t)):null!=t?(n=this.eventManager.getEventInstancesWithId(t),this.eventInstancesToFootprints(n)):void 0},t.prototype.buildCurrentBusinessFootprints=function(t){var e=this._calendar.view,n=e.get("businessHourGenerator"),r=e.dateProfile.activeUnzonedRange,i=n.buildEventInstanceGroup(t,r);return i?this.eventInstancesToFootprints(i.eventInstances):[]},t.prototype.eventInstancesToFootprints=function(t){var e=t.map(u.eventInstanceToEventRange);return this.eventRangesToEventFootprints(e).map(u.eventFootprintToComponentFootprint)},t.prototype.collectOverlapEventFootprints=function(t,e){var n,r=[];for(n=0;n<t.length;n++)this.footprintsIntersect(e,t[n].componentFootprint)&&r.push(t[n]);return r},t.prototype.parseEventDefToInstances=function(t){var e=this.eventManager,n=a.default.parse(t,new l.default(this._calendar));return!!n&&n.buildInstances(e.currentPeriod.unzonedRange)},t.prototype.eventRangesToEventFootprints=function(t){var e,n=[];for(e=0;e<t.length;e++)n.push.apply(n,this.eventRangeToEventFootprints(t[e]));return n},t.prototype.eventRangeToEventFootprints=function(t){return[u.eventRangeToEventFootprint(t)]},t.prototype.parseFootprints=function(t){var e,n;return t.start&&(e=this._calendar.moment(t.start),e.isValid()||(e=null)),t.end&&(n=this._calendar.moment(t.end),n.isValid()||(n=null)),[new s.default(new o.default(e,n),e&&!e.hasTime()||n&&!n.hasTime())]},t.prototype.footprintContainsFootprint=function(t,e){return t.unzonedRange.containsRange(e.unzonedRange)},t.prototype.footprintsIntersect=function(t,e){return t.unzonedRange.intersectsWith(e.unzonedRange)},t}();e.default=d},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(19),o=n(20),s=n(54),a=n(6),l={start:"09:00",end:"17:00",dow:[1,2,3,4,5],rendering:"inverse-background"},u=function(){function t(t,e){this.rawComplexDef=t,this.calendar=e}return t.prototype.buildEventInstanceGroup=function(t,e){var n,r=this.buildEventDefs(t);if(r.length)return n=new o.default(i.eventDefsToEventInstances(r,e)),n.explicitEventDef=r[0],n},t.prototype.buildEventDefs=function(t){var e,n=this.rawComplexDef,i=[],o=!1,s=[];for(!0===n?i=[{}]:r.isPlainObject(n)?i=[n]:r.isArray(n)&&(i=n,o=!0),e=0;e<i.length;e++)o&&!i[e].dow||s.push(this.buildEventDef(t,i[e]));return s},t.prototype.buildEventDef=function(t,e){var n=r.extend({},l,e);return t&&(n.start=null,n.end=null),s.default.parse(n,new a.default(this.calendar))},t}();e.default=u},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=n(21),s=n(13),a=n(5),l=n(20),u=function(){function t(t,e,n){this.pendingCnt=0,this.freezeDepth=0,this.stuntedReleaseCnt=0,this.releaseCnt=0,this.start=t,this.end=e,this.timezone=n,this.unzonedRange=new a.default(t.clone().stripZone(),e.clone().stripZone()),this.requestsByUid={},this.eventDefsByUid={},this.eventDefsById={},this.eventInstanceGroupsById={}}return t.prototype.isWithinRange=function(t,e){return!t.isBefore(this.start)&&!e.isAfter(this.end)},t.prototype.requestSources=function(t){this.freeze();for(var e=0;e<t.length;e++)this.requestSource(t[e]);this.thaw()},t.prototype.requestSource=function(t){var e=this,n={source:t,status:"pending",eventDefs:null};this.requestsByUid[t.uid]=n,this.pendingCnt+=1,t.fetch(this.start,this.end,this.timezone).then(function(t){"cancelled"!==n.status&&(n.status="completed",n.eventDefs=t,e.addEventDefs(t),e.pendingCnt--,e.tryRelease())},function(){"cancelled"!==n.status&&(n.status="failed",e.pendingCnt--,e.tryRelease())})},t.prototype.purgeSource=function(t){var e=this.requestsByUid[t.uid];e&&(delete this.requestsByUid[t.uid],"pending"===e.status?(e.status="cancelled",this.pendingCnt--,this.tryRelease()):"completed"===e.status&&e.eventDefs.forEach(this.removeEventDef.bind(this)))},t.prototype.purgeAllSources=function(){var t,e,n=this.requestsByUid,r=0;for(t in n)e=n[t],"pending"===e.status?e.status="cancelled":"completed"===e.status&&r++;this.requestsByUid={},this.pendingCnt=0,r&&this.removeAllEventDefs()},t.prototype.getEventDefByUid=function(t){return this.eventDefsByUid[t]},t.prototype.getEventDefsById=function(t){var e=this.eventDefsById[t];return e?e.slice():[]},t.prototype.addEventDefs=function(t){for(var e=0;e<t.length;e++)this.addEventDef(t[e])},t.prototype.addEventDef=function(t){var e,n=this.eventDefsById,r=t.id,i=n[r]||(n[r]=[]),o=t.buildInstances(this.unzonedRange);for(i.push(t),this.eventDefsByUid[t.uid]=t,e=0;e<o.length;e++)this.addEventInstance(o[e],r)},t.prototype.removeEventDefsById=function(t){var e=this;this.getEventDefsById(t).forEach(function(t){e.removeEventDef(t)})},t.prototype.removeAllEventDefs=function(){var t=r.isEmptyObject(this.eventDefsByUid);this.eventDefsByUid={},this.eventDefsById={},this.eventInstanceGroupsById={},t||this.tryRelease()},t.prototype.removeEventDef=function(t){var e=this.eventDefsById,n=e[t.id];delete this.eventDefsByUid[t.uid],n&&(i.removeExact(n,t),n.length||delete e[t.id],this.removeEventInstancesForDef(t))},t.prototype.getEventInstances=function(){var t,e=this.eventInstanceGroupsById,n=[];for(t in e)n.push.apply(n,e[t].eventInstances);return n},t.prototype.getEventInstancesWithId=function(t){var e=this.eventInstanceGroupsById[t];return e?e.eventInstances.slice():[]},t.prototype.getEventInstancesWithoutId=function(t){var e,n=this.eventInstanceGroupsById,r=[];for(e in n)e!==t&&r.push.apply(r,n[e].eventInstances);return r},t.prototype.addEventInstance=function(t,e){var n=this.eventInstanceGroupsById;(n[e]||(n[e]=new l.default)).eventInstances.push(t),this.tryRelease()},t.prototype.removeEventInstancesForDef=function(t){var e,n=this.eventInstanceGroupsById,r=n[t.id];r&&(e=i.removeMatching(r.eventInstances,function(e){return e.def===t}),r.eventInstances.length||delete n[t.id],e&&this.tryRelease())},t.prototype.tryRelease=function(){this.pendingCnt||(this.freezeDepth?this.stuntedReleaseCnt++:this.release())},t.prototype.release=function(){this.releaseCnt++,this.trigger("release",this.eventInstanceGroupsById)},t.prototype.whenReleased=function(){var t=this;return this.releaseCnt?o.default.resolve(this.eventInstanceGroupsById):o.default.construct(function(e){t.one("release",e)})},t.prototype.freeze=function(){this.freezeDepth++||(this.stuntedReleaseCnt=0)},t.prototype.thaw=function(){--this.freezeDepth||!this.stuntedReleaseCnt||this.pendingCnt||this.release()},t}();e.default=u,s.default.mixInto(u)},function(t,e,n){function r(t,e){return t.getPrimitive()===e.getPrimitive()}Object.defineProperty(e,"__esModule",{value:!0});var i=n(3),o=n(4),s=n(219),a=n(56),l=n(6),u=n(38),d=n(9),c=n(20),p=n(13),h=n(7),f=function(){function t(t){this.calendar=t,this.stickySource=new a.default(t),this.otherSources=[]}return t.prototype.requestEvents=function(t,e,n,r){return!r&&this.currentPeriod&&this.currentPeriod.isWithinRange(t,e)&&n===this.currentPeriod.timezone||this.setPeriod(new s.default(t,e,n)),this.currentPeriod.whenReleased()},t.prototype.addSource=function(t){this.otherSources.push(t),this.currentPeriod&&this.currentPeriod.requestSource(t)},t.prototype.removeSource=function(t){o.removeExact(this.otherSources,t),this.currentPeriod&&this.currentPeriod.purgeSource(t)},t.prototype.removeAllSources=function(){this.otherSources=[],this.currentPeriod&&this.currentPeriod.purgeAllSources()},t.prototype.refetchSource=function(t){var e=this.currentPeriod;e&&(e.freeze(),e.purgeSource(t),e.requestSource(t),e.thaw())},t.prototype.refetchAllSources=function(){var t=this.currentPeriod;t&&(t.freeze(),t.purgeAllSources(),t.requestSources(this.getSources()),t.thaw())},t.prototype.getSources=function(){return[this.stickySource].concat(this.otherSources)},t.prototype.multiQuerySources=function(t){t?i.isArray(t)||(t=[t]):t=[];var e,n=[];for(e=0;e<t.length;e++)n.push.apply(n,this.querySources(t[e]));return n},t.prototype.querySources=function(t){var e,n,o=this.otherSources;for(e=0;e<o.length;e++)if((n=o[e])===t)return[n];return(n=this.getSourceById(l.default.normalizeId(t)))?[n]:(t=u.default.parse(t,this.calendar),t?i.grep(o,function(e){return r(t,e)}):void 0)},t.prototype.getSourceById=function(t){return i.grep(this.otherSources,function(e){return e.id&&e.id===t})[0]},t.prototype.setPeriod=function(t){this.currentPeriod&&(this.unbindPeriod(this.currentPeriod),this.currentPeriod=null),this.currentPeriod=t,this.bindPeriod(t),t.requestSources(this.getSources())},t.prototype.bindPeriod=function(t){this.listenTo(t,"release",function(t){this.trigger("release",t)})},t.prototype.unbindPeriod=function(t){this.stopListeningTo(t)},t.prototype.getEventDefByUid=function(t){if(this.currentPeriod)return this.currentPeriod.getEventDefByUid(t)},t.prototype.addEventDef=function(t,e){e&&this.stickySource.addEventDef(t),this.currentPeriod&&this.currentPeriod.addEventDef(t)},t.prototype.removeEventDefsById=function(t){this.getSources().forEach(function(e){e.removeEventDefsById(t)}),this.currentPeriod&&this.currentPeriod.removeEventDefsById(t)},t.prototype.removeAllEventDefs=function(){this.getSources().forEach(function(t){t.removeAllEventDefs()}),this.currentPeriod&&this.currentPeriod.removeAllEventDefs()},t.prototype.mutateEventsWithId=function(t,e){var n,r=this.currentPeriod,i=[];return r?(r.freeze(),n=r.getEventDefsById(t),n.forEach(function(t){r.removeEventDef(t),i.push(e.mutateSingle(t)),r.addEventDef(t)}),r.thaw(),function(){r.freeze();for(var t=0;t<n.length;t++)r.removeEventDef(n[t]),i[t](),r.addEventDef(n[t]);r.thaw()}):function(){}},t.prototype.buildMutatedEventInstanceGroup=function(t,e){var n,r,i=this.getEventDefsById(t),o=[];for(n=0;n<i.length;n++)(r=i[n].clone())instanceof d.default&&(e.mutateSingle(r),o.push.apply(o,r.buildInstances()));return new c.default(o)},t.prototype.freeze=function(){this.currentPeriod&&this.currentPeriod.freeze()},t.prototype.thaw=function(){this.currentPeriod&&this.currentPeriod.thaw()},t.prototype.getEventDefsById=function(t){return this.currentPeriod.getEventDefsById(t)},t.prototype.getEventInstances=function(){return this.currentPeriod.getEventInstances()},t.prototype.getEventInstancesWithId=function(t){return this.currentPeriod.getEventInstancesWithId(t)},t.prototype.getEventInstancesWithoutId=function(t){return this.currentPeriod.getEventInstancesWithoutId(t)},t
}();e.default=f,p.default.mixInto(f),h.default.mixInto(f)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(22),o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e}(i.default);e.default=o,o.prototype.classes={widget:"fc-unthemed",widgetHeader:"fc-widget-header",widgetContent:"fc-widget-content",buttonGroup:"fc-button-group",button:"fc-button",cornerLeft:"fc-corner-left",cornerRight:"fc-corner-right",stateDefault:"fc-state-default",stateActive:"fc-state-active",stateDisabled:"fc-state-disabled",stateHover:"fc-state-hover",stateDown:"fc-state-down",popoverHeader:"fc-widget-header",popoverContent:"fc-widget-content",headerRow:"fc-widget-header",dayRow:"fc-widget-content",listView:"fc-widget-content"},o.prototype.baseIconClass="fc-icon",o.prototype.iconClasses={close:"fc-icon-x",prev:"fc-icon-left-single-arrow",next:"fc-icon-right-single-arrow",prevYear:"fc-icon-left-double-arrow",nextYear:"fc-icon-right-double-arrow"},o.prototype.iconOverrideOption="buttonIcons",o.prototype.iconOverrideCustomButtonOption="icon",o.prototype.iconOverridePrefix="fc-icon-"},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(22),o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e}(i.default);e.default=o,o.prototype.classes={widget:"ui-widget",widgetHeader:"ui-widget-header",widgetContent:"ui-widget-content",buttonGroup:"fc-button-group",button:"ui-button",cornerLeft:"ui-corner-left",cornerRight:"ui-corner-right",stateDefault:"ui-state-default",stateActive:"ui-state-active",stateDisabled:"ui-state-disabled",stateHover:"ui-state-hover",stateDown:"ui-state-down",today:"ui-state-highlight",popoverHeader:"ui-widget-header",popoverContent:"ui-widget-content",headerRow:"ui-widget-header",dayRow:"ui-widget-content",listView:"ui-widget-content"},o.prototype.baseIconClass="ui-icon",o.prototype.iconClasses={close:"ui-icon-closethick",prev:"ui-icon-circle-triangle-w",next:"ui-icon-circle-triangle-e",prevYear:"ui-icon-seek-prev",nextYear:"ui-icon-seek-next"},o.prototype.iconOverrideOption="themeButtonIcons",o.prototype.iconOverrideCustomButtonOption="themeIcon",o.prototype.iconOverridePrefix="ui-icon-"},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(21),s=n(6),a=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.parse=function(t,e){var n;return i.isFunction(t.events)?n=t:i.isFunction(t)&&(n={events:t}),!!n&&s.default.parse.call(this,n,e)},e.prototype.fetch=function(t,e,n){var r=this;return this.calendar.pushLoading(),o.default.construct(function(i){r.func.call(r.calendar,t.clone(),e.clone(),n,function(t){r.calendar.popLoading(),i(r.parseEventDefs(t))})})},e.prototype.getPrimitive=function(){return this.func},e.prototype.applyManualStandardProps=function(e){var n=t.prototype.applyManualStandardProps.call(this,e);return this.func=e.events,n},e}(s.default);e.default=a,a.defineStandardProps({events:!1})},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(21),a=n(6),l=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.parse=function(t,e){var n;return"string"==typeof t.url?n=t:"string"==typeof t&&(n={url:t}),!!n&&a.default.parse.call(this,n,e)},e.prototype.fetch=function(t,n,r){var a=this,l=this.ajaxSettings,u=l.success,d=l.error,c=this.buildRequestParams(t,n,r);return this.calendar.pushLoading(),s.default.construct(function(t,n){i.ajax(i.extend({},e.AJAX_DEFAULTS,l,{url:a.url,data:c,success:function(e,r,s){var l;a.calendar.popLoading(),e?(l=o.applyAll(u,a,[e,r,s]),i.isArray(l)&&(e=l),t(a.parseEventDefs(e))):n()},error:function(t,e,r){a.calendar.popLoading(),o.applyAll(d,a,[t,e,r]),n()}}))})},e.prototype.buildRequestParams=function(t,e,n){var r,o,s,a,l=this.calendar,u=this.ajaxSettings,d={};return r=this.startParam,null==r&&(r=l.opt("startParam")),o=this.endParam,null==o&&(o=l.opt("endParam")),s=this.timezoneParam,null==s&&(s=l.opt("timezoneParam")),a=i.isFunction(u.data)?u.data():u.data||{},i.extend(d,a),d[r]=t.format(),d[o]=e.format(),n&&"local"!==n&&(d[s]=n),d},e.prototype.getPrimitive=function(){return this.url},e.prototype.applyMiscProps=function(t){this.ajaxSettings=t},e.AJAX_DEFAULTS={dataType:"json",cache:!1},e}(a.default);e.default=l,l.defineStandardProps({url:!0,startParam:!0,endParam:!0,timezoneParam:!0})},function(t,e){Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t){this.items=t||[]}return t.prototype.proxyCall=function(t){for(var e=[],n=1;n<arguments.length;n++)e[n-1]=arguments[n];var r=[];return this.items.forEach(function(n){r.push(n[t].apply(n,e))}),r},t}();e.default=n},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=n(7),s=function(){function t(t,e){this.isFollowing=!1,this.isHidden=!1,this.isAnimating=!1,this.options=e=e||{},this.sourceEl=t,this.parentEl=e.parentEl?r(e.parentEl):t.parent()}return t.prototype.start=function(t){this.isFollowing||(this.isFollowing=!0,this.y0=i.getEvY(t),this.x0=i.getEvX(t),this.topDelta=0,this.leftDelta=0,this.isHidden||this.updatePosition(),i.getEvIsTouch(t)?this.listenTo(r(document),"touchmove",this.handleMove):this.listenTo(r(document),"mousemove",this.handleMove))},t.prototype.stop=function(t,e){var n=this,i=this.options.revertDuration,o=function(){n.isAnimating=!1,n.removeElement(),n.top0=n.left0=null,e&&e()};this.isFollowing&&!this.isAnimating&&(this.isFollowing=!1,this.stopListeningTo(r(document)),t&&i&&!this.isHidden?(this.isAnimating=!0,this.el.animate({top:this.top0,left:this.left0},{duration:i,complete:o})):o())},t.prototype.getEl=function(){var t=this.el;return t||(t=this.el=this.sourceEl.clone().addClass(this.options.additionalClass||"").css({position:"absolute",visibility:"",display:this.isHidden?"none":"",margin:0,right:"auto",bottom:"auto",width:this.sourceEl.width(),height:this.sourceEl.height(),opacity:this.options.opacity||"",zIndex:this.options.zIndex}),t.addClass("fc-unselectable"),t.appendTo(this.parentEl)),t},t.prototype.removeElement=function(){this.el&&(this.el.remove(),this.el=null)},t.prototype.updatePosition=function(){var t,e;this.getEl(),null==this.top0&&(t=this.sourceEl.offset(),e=this.el.offsetParent().offset(),this.top0=t.top-e.top,this.left0=t.left-e.left),this.el.css({top:this.top0+this.topDelta,left:this.left0+this.leftDelta})},t.prototype.handleMove=function(t){this.topDelta=i.getEvY(t)-this.y0,this.leftDelta=i.getEvX(t)-this.x0,this.isHidden||this.updatePosition()},t.prototype.hide=function(){this.isHidden||(this.isHidden=!0,this.el&&this.el.hide())},t.prototype.show=function(){this.isHidden&&(this.isHidden=!1,this.updatePosition(),this.getEl().show())},t}();e.default=s,o.default.mixInto(s)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=n(7),s=function(){function t(t){this.isHidden=!0,this.margin=10,this.options=t||{}}return t.prototype.show=function(){this.isHidden&&(this.el||this.render(),this.el.show(),this.position(),this.isHidden=!1,this.trigger("show"))},t.prototype.hide=function(){this.isHidden||(this.el.hide(),this.isHidden=!0,this.trigger("hide"))},t.prototype.render=function(){var t=this,e=this.options;this.el=r('<div class="fc-popover"/>').addClass(e.className||"").css({top:0,left:0}).append(e.content).appendTo(e.parentEl),this.el.on("click",".fc-close",function(){t.hide()}),e.autoHide&&this.listenTo(r(document),"mousedown",this.documentMousedown)},t.prototype.documentMousedown=function(t){this.el&&!r(t.target).closest(this.el).length&&this.hide()},t.prototype.removeElement=function(){this.hide(),this.el&&(this.el.remove(),this.el=null),this.stopListeningTo(r(document),"mousedown")},t.prototype.position=function(){var t,e,n,o,s,a=this.options,l=this.el.offsetParent().offset(),u=this.el.outerWidth(),d=this.el.outerHeight(),c=r(window),p=i.getScrollParent(this.el);o=a.top||0,s=void 0!==a.left?a.left:void 0!==a.right?a.right-u:0,p.is(window)||p.is(document)?(p=c,t=0,e=0):(n=p.offset(),t=n.top,e=n.left),t+=c.scrollTop(),e+=c.scrollLeft(),!1!==a.viewportConstrain&&(o=Math.min(o,t+p.outerHeight()-d-this.margin),o=Math.max(o,t+this.margin),s=Math.min(s,e+p.outerWidth()-u-this.margin),s=Math.max(s,e+this.margin)),this.el.css({top:o-l.top,left:s-l.left})},t.prototype.trigger=function(t){this.options[t]&&this.options[t].apply(this,Array.prototype.slice.call(arguments,1))},t}();e.default=s,o.default.mixInto(s)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(13),i=function(){function t(){this.q=[],this.isPaused=!1,this.isRunning=!1}return t.prototype.queue=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];this.q.push.apply(this.q,t),this.tryStart()},t.prototype.pause=function(){this.isPaused=!0},t.prototype.resume=function(){this.isPaused=!1,this.tryStart()},t.prototype.getIsIdle=function(){return!this.isRunning&&!this.isPaused},t.prototype.tryStart=function(){!this.isRunning&&this.canRunNext()&&(this.isRunning=!0,this.trigger("start"),this.runRemaining())},t.prototype.canRunNext=function(){return!this.isPaused&&this.q.length},t.prototype.runRemaining=function(){var t,e,n=this;do{if(t=this.q.shift(),(e=this.runTask(t))&&e.then)return void e.then(function(){n.canRunNext()&&n.runRemaining()})}while(this.canRunNext());this.trigger("stop"),this.isRunning=!1,this.tryStart()},t.prototype.runTask=function(t){return t()},t}();e.default=i,r.default.mixInto(i)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(228),o=function(t){function e(e){var n=t.call(this)||this;return n.waitsByNamespace=e||{},n}return r.__extends(e,t),e.prototype.queue=function(t,e,n){var r,i={func:t,namespace:e,type:n};e&&(r=this.waitsByNamespace[e]),this.waitNamespace&&(e===this.waitNamespace&&null!=r?this.delayWait(r):(this.clearWait(),this.tryStart())),this.compoundTask(i)&&(this.waitNamespace||null==r?this.tryStart():this.startWait(e,r))},e.prototype.startWait=function(t,e){this.waitNamespace=t,this.spawnWait(e)},e.prototype.delayWait=function(t){clearTimeout(this.waitId),this.spawnWait(t)},e.prototype.spawnWait=function(t){var e=this;this.waitId=setTimeout(function(){e.waitNamespace=null,e.tryStart()},t)},e.prototype.clearWait=function(){this.waitNamespace&&(clearTimeout(this.waitId),this.waitId=null,this.waitNamespace=null)},e.prototype.canRunNext=function(){if(!t.prototype.canRunNext.call(this))return!1;if(this.waitNamespace){for(var e=this.q,n=0;n<e.length;n++)if(e[n].namespace!==this.waitNamespace)return!0;return!1}return!0},e.prototype.runTask=function(t){t.func()},e.prototype.compoundTask=function(t){var e,n,r=this.q,i=!0;if(t.namespace&&"destroy"===t.type)for(e=r.length-1;e>=0;e--)if(n=r[e],n.namespace===t.namespace)switch(n.type){case"init":i=!1;case"add":case"remove":r.splice(e,1)}return i&&r.push(t),i},e}(i.default);e.default=o},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(51),o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.setElement=function(t){this.el=t,this.bindGlobalHandlers(),this.renderSkeleton(),this.set("isInDom",!0)},e.prototype.removeElement=function(){this.unset("isInDom"),this.unrenderSkeleton(),this.unbindGlobalHandlers(),this.el.remove()},e.prototype.bindGlobalHandlers=function(){},e.prototype.unbindGlobalHandlers=function(){},e.prototype.renderSkeleton=function(){},e.prototype.unrenderSkeleton=function(){},e}(i.default);e.default=o},function(t,e,n){function r(t){var e,n,r,i=[];for(e in t)for(n=t[e].eventInstances,r=0;r<n.length;r++)i.push(n[r].toLegacy());return i}Object.defineProperty(e,"__esModule",{value:!0});var i=n(2),o=n(3),s=n(0),a=n(4),l=n(11),u=n(49),d=n(230),c=n(19),p=function(t){function e(n,r){var i=t.call(this)||this;return i.isRTL=!1,i.hitsNeededDepth=0,i.hasAllDayBusinessHours=!1,i.isDatesRendered=!1,n&&(i.view=n),r&&(i.options=r),i.uid=String(e.guid++),i.childrenByUid={},i.nextDayThreshold=s.duration(i.opt("nextDayThreshold")),i.isRTL=i.opt("isRTL"),i.fillRendererClass&&(i.fillRenderer=new i.fillRendererClass(i)),i.eventRendererClass&&(i.eventRenderer=new i.eventRendererClass(i,i.fillRenderer)),i.helperRendererClass&&i.eventRenderer&&(i.helperRenderer=new i.helperRendererClass(i,i.eventRenderer)),i.businessHourRendererClass&&i.fillRenderer&&(i.businessHourRenderer=new i.businessHourRendererClass(i,i.fillRenderer)),i}return i.__extends(e,t),e.prototype.addChild=function(t){return!this.childrenByUid[t.uid]&&(this.childrenByUid[t.uid]=t,!0)},e.prototype.removeChild=function(t){return!!this.childrenByUid[t.uid]&&(delete this.childrenByUid[t.uid],!0)},e.prototype.updateSize=function(t,e,n){this.callChildren("updateSize",arguments)},e.prototype.opt=function(t){return this._getView().opt(t)},e.prototype.publiclyTrigger=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n=this._getCalendar();return n.publiclyTrigger.apply(n,t)},e.prototype.hasPublicHandlers=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n=this._getCalendar();return n.hasPublicHandlers.apply(n,t)},e.prototype.executeDateRender=function(t){this.dateProfile=t,this.renderDates(t),this.isDatesRendered=!0,this.callChildren("executeDateRender",arguments)},e.prototype.executeDateUnrender=function(){this.callChildren("executeDateUnrender",arguments),this.dateProfile=null,this.unrenderDates(),this.isDatesRendered=!1},e.prototype.renderDates=function(t){},e.prototype.unrenderDates=function(){},e.prototype.getNowIndicatorUnit=function(){},e.prototype.renderNowIndicator=function(t){this.callChildren("renderNowIndicator",arguments)},e.prototype.unrenderNowIndicator=function(){this.callChildren("unrenderNowIndicator",arguments)},e.prototype.renderBusinessHours=function(t){this.businessHourRenderer&&this.businessHourRenderer.render(t),this.callChildren("renderBusinessHours",arguments)},e.prototype.unrenderBusinessHours=function(){this.callChildren("unrenderBusinessHours",arguments),this.businessHourRenderer&&this.businessHourRenderer.unrender()},e.prototype.executeEventRender=function(t){this.eventRenderer?(this.eventRenderer.rangeUpdated(),this.eventRenderer.render(t)):this.renderEvents&&this.renderEvents(r(t)),this.callChildren("executeEventRender",arguments)},e.prototype.executeEventUnrender=function(){this.callChildren("executeEventUnrender",arguments),this.eventRenderer?this.eventRenderer.unrender():this.destroyEvents&&this.destroyEvents()},e.prototype.getBusinessHourSegs=function(){var t=this.getOwnBusinessHourSegs();return this.iterChildren(function(e){t.push.apply(t,e.getBusinessHourSegs())}),t},e.prototype.getOwnBusinessHourSegs=function(){return this.businessHourRenderer?this.businessHourRenderer.getSegs():[]},e.prototype.getEventSegs=function(){var t=this.getOwnEventSegs();return this.iterChildren(function(e){t.push.apply(t,e.getEventSegs())}),t},e.prototype.getOwnEventSegs=function(){return this.eventRenderer?this.eventRenderer.getSegs():[]},e.prototype.triggerAfterEventsRendered=function(){this.triggerAfterEventSegsRendered(this.getEventSegs()),this.publiclyTrigger("eventAfterAllRender",{context:this,args:[this]})},e.prototype.triggerAfterEventSegsRendered=function(t){var e=this;this.hasPublicHandlers("eventAfterRender")&&t.forEach(function(t){var n;t.el&&(n=t.footprint.getEventLegacy(),e.publiclyTrigger("eventAfterRender",{context:n,args:[n,t.el,e]}))})},e.prototype.triggerBeforeEventsDestroyed=function(){this.triggerBeforeEventSegsDestroyed(this.getEventSegs())},e.prototype.triggerBeforeEventSegsDestroyed=function(t){var e=this;this.hasPublicHandlers("eventDestroy")&&t.forEach(function(t){var n;t.el&&(n=t.footprint.getEventLegacy(),e.publiclyTrigger("eventDestroy",{context:n,args:[n,t.el,e]}))})},e.prototype.showEventsWithId=function(t){this.getEventSegs().forEach(function(e){e.footprint.eventDef.id===t&&e.el&&e.el.css("visibility","")}),this.callChildren("showEventsWithId",arguments)},e.prototype.hideEventsWithId=function(t){this.getEventSegs().forEach(function(e){e.footprint.eventDef.id===t&&e.el&&e.el.css("visibility","hidden")}),this.callChildren("hideEventsWithId",arguments)},e.prototype.renderDrag=function(t,e,n){var r=!1;return this.iterChildren(function(i){i.renderDrag(t,e,n)&&(r=!0)}),r},e.prototype.unrenderDrag=function(){this.callChildren("unrenderDrag",arguments)},e.prototype.renderEventResize=function(t,e,n){this.callChildren("renderEventResize",arguments)},e.prototype.unrenderEventResize=function(){this.callChildren("unrenderEventResize",arguments)},e.prototype.renderSelectionFootprint=function(t){this.renderHighlight(t),this.callChildren("renderSelectionFootprint",arguments)},e.prototype.unrenderSelection=function(){this.unrenderHighlight(),this.callChildren("unrenderSelection",arguments)},e.prototype.renderHighlight=function(t){this.fillRenderer&&this.fillRenderer.renderFootprint("highlight",t,{getClasses:function(){return["fc-highlight"]}}),this.callChildren("renderHighlight",arguments)},e.prototype.unrenderHighlight=function(){this.fillRenderer&&this.fillRenderer.unrender("highlight"),this.callChildren("unrenderHighlight",arguments)},e.prototype.hitsNeeded=function(){this.hitsNeededDepth++||this.prepareHits(),this.callChildren("hitsNeeded",arguments)},e.prototype.hitsNotNeeded=function(){this.hitsNeededDepth&&!--this.hitsNeededDepth&&this.releaseHits(),this.callChildren("hitsNotNeeded",arguments)},e.prototype.prepareHits=function(){},e.prototype.releaseHits=function(){},e.prototype.queryHit=function(t,e){var n,r,i=this.childrenByUid;for(n in i)if(r=i[n].queryHit(t,e))break;return r},e.prototype.getSafeHitFootprint=function(t){var e=this.getHitFootprint(t);return this.dateProfile.activeUnzonedRange.containsRange(e.unzonedRange)?e:null},e.prototype.getHitFootprint=function(t){},e.prototype.getHitEl=function(t){},e.prototype.eventRangesToEventFootprints=function(t){var e,n=[];for(e=0;e<t.length;e++)n.push.apply(n,this.eventRangeToEventFootprints(t[e]));return n},e.prototype.eventRangeToEventFootprints=function(t){return[c.eventRangeToEventFootprint(t)]},e.prototype.eventFootprintsToSegs=function(t){var e,n=[];for(e=0;e<t.length;e++)n.push.apply(n,this.eventFootprintToSegs(t[e]));return n},e.prototype.eventFootprintToSegs=function(t){var e,n,r,i=t.componentFootprint.unzonedRange;for(e=this.componentFootprintToSegs(t.componentFootprint),n=0;n<e.length;n++)r=e[n],i.isStart||(r.isStart=!1),i.isEnd||(r.isEnd=!1),r.footprint=t;return e},e.prototype.componentFootprintToSegs=function(t){return[]},e.prototype.callChildren=function(t,e){this.iterChildren(function(n){n[t].apply(n,e)})},e.prototype.iterChildren=function(t){var e,n=this.childrenByUid;for(e in n)t(n[e])},e.prototype._getCalendar=function(){var t=this;return t.calendar||t.view.calendar},e.prototype._getView=function(){return this.view},e.prototype._getDateProfile=function(){return this._getView().get("dateProfile")},e.prototype.buildGotoAnchorHtml=function(t,e,n){var r,i,s,u;return o.isPlainObject(t)?(r=t.date,i=t.type,s=t.forceOff):r=t,r=l.default(r),u={date:r.format("YYYY-MM-DD"),type:i||"day"},"string"==typeof e&&(n=e,e=null),e=e?" "+a.attrsToStr(e):"",n=n||"",!s&&this.opt("navLinks")?"<a"+e+' data-goto="'+a.htmlEscape(JSON.stringify(u))+'">'+n+"</a>":"<span"+e+">"+n+"</span>"},e.prototype.getAllDayHtml=function(){return this.opt("allDayHtml")||a.htmlEscape(this.opt("allDayText"))},e.prototype.getDayClasses=function(t,e){var n,r=this._getView(),i=[];return this.dateProfile.activeUnzonedRange.containsDate(t)?(i.push("fc-"+a.dayIDs[t.day()]),r.isDateInOtherMonth(t,this.dateProfile)&&i.push("fc-other-month"),n=r.calendar.getNow(),t.isSame(n,"day")?(i.push("fc-today"),!0!==e&&i.push(r.calendar.theme.getClass("today"))):t<n?i.push("fc-past"):i.push("fc-future")):i.push("fc-disabled-day"),i},e.prototype.formatRange=function(t,e,n,r){var i=t.end;return e&&(i=i.clone().subtract(1)),u.formatRange(t.start,i,n,r,this.isRTL)},e.prototype.currentRangeAs=function(t){return this._getDateProfile().currentUnzonedRange.as(t)},e.prototype.computeDayRange=function(t){var e=this._getCalendar(),n=e.msToUtcMoment(t.startMs,!0),r=e.msToUtcMoment(t.endMs),i=+r.time(),o=r.clone().stripTime();return i&&i>=this.nextDayThreshold&&o.add(1,"days"),o<=n&&(o=n.clone().add(1,"days")),{start:n,end:o}},e.prototype.isMultiDayRange=function(t){var e=this.computeDayRange(t);return e.end.diff(e.start,"days")>1},e.guid=0,e}(d.default);e.default=p},function(t,e,n){function r(t,e){return null==e?t:i.isFunction(e)?t.filter(e):(e+="",t.filter(function(t){return t.id==e||t._id===e}))}Object.defineProperty(e,"__esModule",{value:!0});var i=n(3),o=n(0),s=n(4),a=n(33),l=n(225),u=n(23),d=n(13),c=n(7),p=n(257),h=n(258),f=n(259),g=n(217),v=n(32),y=n(11),m=n(5),b=n(12),w=n(16),D=n(220),E=n(218),S=n(38),C=n(36),R=n(9),T=n(39),M=n(6),I=n(57),H=function(){function t(t,e){this.loadingLevel=0,this.ignoreUpdateViewSize=0,this.freezeContentHeightDepth=0,u.default.needed(),this.el=t,this.viewsByType={},this.optionsManager=new h.default(this,e),this.viewSpecManager=new f.default(this.optionsManager,this),this.initMomentInternals(),this.initCurrentDate(),this.initEventManager(),this.constraints=new g.default(this.eventManager,this),this.constructed()}return t.prototype.constructed=function(){},t.prototype.getView=function(){return this.view},t.prototype.publiclyTrigger=function(t,e){var n,r,o=this.opt(t);if(i.isPlainObject(e)?(n=e.context,r=e.args):i.isArray(e)&&(r=e),null==n&&(n=this.el[0]),r||(r=[]),this.triggerWith(t,n,r),o)return o.apply(n,r)},t.prototype.hasPublicHandlers=function(t){return this.hasHandlers(t)||this.opt(t)},t.prototype.option=function(t,e){var n;if("string"==typeof t){if(void 0===e)return this.optionsManager.get(t);n={},n[t]=e,this.optionsManager.add(n)}else"object"==typeof t&&this.optionsManager.add(t)},t.prototype.opt=function(t){return this.optionsManager.get(t)},t.prototype.instantiateView=function(t){var e=this.viewSpecManager.getViewSpec(t);if(!e)throw new Error('View type "'+t+'" is not valid');return new e.class(this,e)},t.prototype.isValidViewType=function(t){return Boolean(this.viewSpecManager.getViewSpec(t))},t.prototype.changeView=function(t,e){e&&(e.start&&e.end?this.optionsManager.recordOverrides({visibleRange:e}):this.currentDate=this.moment(e).stripZone()),this.renderView(t)},t.prototype.zoomTo=function(t,e){var n;e=e||"day",n=this.viewSpecManager.getViewSpec(e)||this.viewSpecManager.getUnitViewSpec(e),this.currentDate=t.clone(),this.renderView(n?n.type:null)},t.prototype.initCurrentDate=function(){var t=this.opt("defaultDate");this.currentDate=null!=t?this.moment(t).stripZone():this.getNow()},t.prototype.prev=function(){var t=this.view,e=t.dateProfileGenerator.buildPrev(t.get("dateProfile"));e.isValid&&(this.currentDate=e.date,this.renderView())},t.prototype.next=function(){var t=this.view,e=t.dateProfileGenerator.buildNext(t.get("dateProfile"));e.isValid&&(this.currentDate=e.date,this.renderView())},t.prototype.prevYear=function(){this.currentDate.add(-1,"years"),this.renderView()},t.prototype.nextYear=function(){this.currentDate.add(1,"years"),this.renderView()},t.prototype.today=function(){this.currentDate=this.getNow(),this.renderView()},t.prototype.gotoDate=function(t){this.currentDate=this.moment(t).stripZone(),this.renderView()},t.prototype.incrementDate=function(t){this.currentDate.add(o.duration(t)),this.renderView()},t.prototype.getDate=function(){return this.applyTimezone(this.currentDate)},t.prototype.pushLoading=function(){this.loadingLevel++||this.publiclyTrigger("loading",[!0,this.view])},t.prototype.popLoading=function(){--this.loadingLevel||this.publiclyTrigger("loading",[!1,this.view])},t.prototype.render=function(){this.contentEl?this.elementVisible()&&(this.calcSize(),this.updateViewSize()):this.initialRender()},t.prototype.initialRender=function(){var t=this,e=this.el;e.addClass("fc"),e.on("click.fc","a[data-goto]",function(e){var n=i(e.currentTarget),r=n.data("goto"),o=t.moment(r.date),a=r.type,l=t.view.opt("navLink"+s.capitaliseFirstLetter(a)+"Click");"function"==typeof l?l(o,e):("string"==typeof l&&(a=l),t.zoomTo(o,a))}),this.optionsManager.watch("settingTheme",["?theme","?themeSystem"],function(n){var r=I.getThemeSystemClass(n.themeSystem||n.theme),i=new r(t.optionsManager),o=i.getClass("widget");t.theme=i,o&&e.addClass(o)},function(){var n=t.theme.getClass("widget");t.theme=null,n&&e.removeClass(n)}),this.optionsManager.watch("settingBusinessHourGenerator",["?businessHours"],function(e){t.businessHourGenerator=new E.default(e.businessHours,t),t.view&&t.view.set("businessHourGenerator",t.businessHourGenerator)},function(){t.businessHourGenerator=null}),this.optionsManager.watch("applyingDirClasses",["?isRTL","?locale"],function(t){e.toggleClass("fc-ltr",!t.isRTL),e.toggleClass("fc-rtl",t.isRTL)}),this.contentEl=i("<div class='fc-view-container'/>").prependTo(e),this.initToolbars(),this.renderHeader(),this.renderFooter(),this.renderView(this.opt("defaultView")),this.opt("handleWindowResize")&&i(window).resize(this.windowResizeProxy=s.debounce(this.windowResize.bind(this),this.opt("windowResizeDelay")))},t.prototype.destroy=function(){this.view&&this.clearView(),this.toolbarsManager.proxyCall("removeElement"),this.contentEl.remove(),this.el.removeClass("fc fc-ltr fc-rtl"),this.optionsManager.unwatch("settingTheme"),this.optionsManager.unwatch("settingBusinessHourGenerator"),this.el.off(".fc"),this.windowResizeProxy&&(i(window).unbind("resize",this.windowResizeProxy),this.windowResizeProxy=null),u.default.unneeded()},t.prototype.elementVisible=function(){return this.el.is(":visible")},t.prototype.bindViewHandlers=function(t){var e=this;t.watch("titleForCalendar",["title"],function(n){t===e.view&&e.setToolbarsTitle(n.title)}),t.watch("dateProfileForCalendar",["dateProfile"],function(n){t===e.view&&(e.currentDate=n.dateProfile.date,e.updateToolbarButtons(n.dateProfile))})},t.prototype.unbindViewHandlers=function(t){t.unwatch("titleForCalendar"),t.unwatch("dateProfileForCalendar")},t.prototype.renderView=function(t){var e,n=this.view;this.freezeContentHeight(),n&&t&&n.type!==t&&this.clearView(),!this.view&&t&&(e=this.view=this.viewsByType[t]||(this.viewsByType[t]=this.instantiateView(t)),this.bindViewHandlers(e),e.startBatchRender(),e.setElement(i("<div class='fc-view fc-"+t+"-view' />").appendTo(this.contentEl)),this.toolbarsManager.proxyCall("activateButton",t)),this.view&&(this.view.get("businessHourGenerator")!==this.businessHourGenerator&&this.view.set("businessHourGenerator",this.businessHourGenerator),this.view.setDate(this.currentDate),e&&e.stopBatchRender()),this.thawContentHeight()},t.prototype.clearView=function(){var t=this.view;this.toolbarsManager.proxyCall("deactivateButton",t.type),this.unbindViewHandlers(t),t.removeElement(),t.unsetDate(),this.view=null},t.prototype.reinitView=function(){var t=this.view,e=t.queryScroll();this.freezeContentHeight(),this.clearView(),this.calcSize(),this.renderView(t.type),this.view.applyScroll(e),this.thawContentHeight()},t.prototype.getSuggestedViewHeight=function(){return null==this.suggestedViewHeight&&this.calcSize(),this.suggestedViewHeight},t.prototype.isHeightAuto=function(){return"auto"===this.opt("contentHeight")||"auto"===this.opt("height")},t.prototype.updateViewSize=function(t){void 0===t&&(t=!1);var e,n=this.view;if(!this.ignoreUpdateViewSize&&n)return t&&(this.calcSize(),e=n.queryScroll()),this.ignoreUpdateViewSize++,n.updateSize(this.getSuggestedViewHeight(),this.isHeightAuto(),t),this.ignoreUpdateViewSize--,t&&n.applyScroll(e),!0},t.prototype.calcSize=function(){this.elementVisible()&&this._calcSize()},t.prototype._calcSize=function(){var t=this.opt("contentHeight"),e=this.opt("height");this.suggestedViewHeight="number"==typeof t?t:"function"==typeof t?t():"number"==typeof e?e-this.queryToolbarsHeight():"function"==typeof e?e()-this.queryToolbarsHeight():"parent"===e?this.el.parent().height()-this.queryToolbarsHeight():Math.round(this.contentEl.width()/Math.max(this.opt("aspectRatio"),.5))},t.prototype.windowResize=function(t){t.target===window&&this.view&&this.view.isDatesRendered&&this.updateViewSize(!0)&&this.publiclyTrigger("windowResize",[this.view])},t.prototype.freezeContentHeight=function(){this.freezeContentHeightDepth++||this.forceFreezeContentHeight()},t.prototype.forceFreezeContentHeight=function(){this.contentEl.css({width:"100%",height:this.contentEl.height(),overflow:"hidden"})},t.prototype.thawContentHeight=function(){this.freezeContentHeightDepth--,this.contentEl.css({width:"",height:"",overflow:""}),this.freezeContentHeightDepth&&this.forceFreezeContentHeight()},t.prototype.initToolbars=function(){this.header=new p.default(this,this.computeHeaderOptions()),this.footer=new p.default(this,this.computeFooterOptions()),this.toolbarsManager=new l.default([this.header,this.footer])},t.prototype.computeHeaderOptions=function(){return{extraClasses:"fc-header-toolbar",layout:this.opt("header")}},t.prototype.computeFooterOptions=function(){return{extraClasses:"fc-footer-toolbar",layout:this.opt("footer")}},t.prototype.renderHeader=function(){var t=this.header;t.setToolbarOptions(this.computeHeaderOptions()),t.render(),t.el&&this.el.prepend(t.el)},t.prototype.renderFooter=function(){var t=this.footer;t.setToolbarOptions(this.computeFooterOptions()),t.render(),t.el&&this.el.append(t.el)},t.prototype.setToolbarsTitle=function(t){this.toolbarsManager.proxyCall("updateTitle",t)},t.prototype.updateToolbarButtons=function(t){var e=this.getNow(),n=this.view,r=n.dateProfileGenerator.build(e),i=n.dateProfileGenerator.buildPrev(n.get("dateProfile")),o=n.dateProfileGenerator.buildNext(n.get("dateProfile"));this.toolbarsManager.proxyCall(r.isValid&&!t.currentUnzonedRange.containsDate(e)?"enableButton":"disableButton","today"),this.toolbarsManager.proxyCall(i.isValid?"enableButton":"disableButton","prev"),this.toolbarsManager.proxyCall(o.isValid?"enableButton":"disableButton","next")},t.prototype.queryToolbarsHeight=function(){return this.toolbarsManager.items.reduce(function(t,e){return t+(e.el?e.el.outerHeight(!0):0)},0)},t.prototype.select=function(t,e){this.view.select(this.buildSelectFootprint.apply(this,arguments))},t.prototype.unselect=function(){this.view&&this.view.unselect()},t.prototype.buildSelectFootprint=function(t,e){var n,r=this.moment(t).stripZone();return n=e?this.moment(e).stripZone():r.hasTime()?r.clone().add(this.defaultTimedEventDuration):r.clone().add(this.defaultAllDayEventDuration),new b.default(new m.default(r,n),!r.hasTime())},t.prototype.initMomentInternals=function(){var t=this;this.defaultAllDayEventDuration=o.duration(this.opt("defaultAllDayEventDuration")),this.defaultTimedEventDuration=o.duration(this.opt("defaultTimedEventDuration")),this.optionsManager.watch("buildingMomentLocale",["?locale","?monthNames","?monthNamesShort","?dayNames","?dayNamesShort","?firstDay","?weekNumberCalculation"],function(e){var n,r=e.weekNumberCalculation,i=e.firstDay;"iso"===r&&(r="ISO");var o=Object.create(v.getMomentLocaleData(e.locale));e.monthNames&&(o._months=e.monthNames),e.monthNamesShort&&(o._monthsShort=e.monthNamesShort),e.dayNames&&(o._weekdays=e.dayNames),e.dayNamesShort&&(o._weekdaysShort=e.dayNamesShort),null==i&&"ISO"===r&&(i=1),null!=i&&(n=Object.create(o._week),n.dow=i,o._week=n),"ISO"!==r&&"local"!==r&&"function"!=typeof r||(o._fullCalendar_weekCalc=r),t.localeData=o,t.currentDate&&t.localizeMoment(t.currentDate)})},t.prototype.moment=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n;return"local"===this.opt("timezone")?(n=y.default.apply(null,t),n.hasTime()&&n.local()):n="UTC"===this.opt("timezone")?y.default.utc.apply(null,t):y.default.parseZone.apply(null,t),this.localizeMoment(n),n},t.prototype.msToMoment=function(t,e){var n=y.default.utc(t);return e?n.stripTime():n=this.applyTimezone(n),this.localizeMoment(n),n},
t.prototype.msToUtcMoment=function(t,e){var n=y.default.utc(t);return e&&n.stripTime(),this.localizeMoment(n),n},t.prototype.localizeMoment=function(t){t._locale=this.localeData},t.prototype.getIsAmbigTimezone=function(){return"local"!==this.opt("timezone")&&"UTC"!==this.opt("timezone")},t.prototype.applyTimezone=function(t){if(!t.hasTime())return t.clone();var e,n=this.moment(t.toArray()),r=t.time().asMilliseconds()-n.time().asMilliseconds();return r&&(e=n.clone().add(r),t.time().asMilliseconds()-e.time().asMilliseconds()==0&&(n=e)),n},t.prototype.footprintToDateProfile=function(t,e){void 0===e&&(e=!1);var n,r=y.default.utc(t.unzonedRange.startMs);return e||(n=y.default.utc(t.unzonedRange.endMs)),t.isAllDay?(r.stripTime(),n&&n.stripTime()):(r=this.applyTimezone(r),n&&(n=this.applyTimezone(n))),this.localizeMoment(r),n&&this.localizeMoment(n),new w.default(r,n,this)},t.prototype.getNow=function(){var t=this.opt("now");return"function"==typeof t&&(t=t()),this.moment(t).stripZone()},t.prototype.humanizeDuration=function(t){return t.locale(this.opt("locale")).humanize()},t.prototype.parseUnzonedRange=function(t){var e=null,n=null;return t.start&&(e=this.moment(t.start).stripZone()),t.end&&(n=this.moment(t.end).stripZone()),e||n?e&&n&&n.isBefore(e)?null:new m.default(e,n):null},t.prototype.initEventManager=function(){var t=this,e=new D.default(this),n=this.opt("eventSources")||[],r=this.opt("events");this.eventManager=e,r&&n.unshift(r),e.on("release",function(e){t.trigger("eventsReset",e)}),e.freeze(),n.forEach(function(n){var r=S.default.parse(n,t);r&&e.addSource(r)}),e.thaw()},t.prototype.requestEvents=function(t,e){return this.eventManager.requestEvents(t,e,this.opt("timezone"),!this.opt("lazyFetching"))},t.prototype.getEventEnd=function(t){return t.end?t.end.clone():this.getDefaultEventEnd(t.allDay,t.start)},t.prototype.getDefaultEventEnd=function(t,e){var n=e.clone();return t?n.stripTime().add(this.defaultAllDayEventDuration):n.add(this.defaultTimedEventDuration),this.getIsAmbigTimezone()&&n.stripZone(),n},t.prototype.rerenderEvents=function(){this.view.flash("displayingEvents")},t.prototype.refetchEvents=function(){this.eventManager.refetchAllSources()},t.prototype.renderEvents=function(t,e){this.eventManager.freeze();for(var n=0;n<t.length;n++)this.renderEvent(t[n],e);this.eventManager.thaw()},t.prototype.renderEvent=function(t,e){void 0===e&&(e=!1);var n=this.eventManager,r=C.default.parse(t,t.source||n.stickySource);r&&n.addEventDef(r,e)},t.prototype.removeEvents=function(t){var e,n,i=this.eventManager,o=[],s={};if(null==t)i.removeAllEventDefs();else{for(i.getEventInstances().forEach(function(t){o.push(t.toLegacy())}),o=r(o,t),n=0;n<o.length;n++)e=this.eventManager.getEventDefByUid(o[n]._id),s[e.id]=!0;i.freeze();for(n in s)i.removeEventDefsById(n);i.thaw()}},t.prototype.clientEvents=function(t){var e=[];return this.eventManager.getEventInstances().forEach(function(t){e.push(t.toLegacy())}),r(e,t)},t.prototype.updateEvents=function(t){this.eventManager.freeze();for(var e=0;e<t.length;e++)this.updateEvent(t[e]);this.eventManager.thaw()},t.prototype.updateEvent=function(t){var e,n,r=this.eventManager.getEventDefByUid(t._id);r instanceof R.default&&(e=r.buildInstance(),n=T.default.createFromRawProps(e,t,null),this.eventManager.mutateEventsWithId(r.id,n))},t.prototype.getEventSources=function(){return this.eventManager.otherSources.slice()},t.prototype.getEventSourceById=function(t){return this.eventManager.getSourceById(M.default.normalizeId(t))},t.prototype.addEventSource=function(t){var e=S.default.parse(t,this);e&&this.eventManager.addSource(e)},t.prototype.removeEventSources=function(t){var e,n,r=this.eventManager;if(null==t)this.eventManager.removeAllSources();else{for(e=r.multiQuerySources(t),r.freeze(),n=0;n<e.length;n++)r.removeSource(e[n]);r.thaw()}},t.prototype.removeEventSource=function(t){var e,n=this.eventManager,r=n.querySources(t);for(n.freeze(),e=0;e<r.length;e++)n.removeSource(r[e]);n.thaw()},t.prototype.refetchEventSources=function(t){var e,n=this.eventManager,r=n.multiQuerySources(t);for(n.freeze(),e=0;e<r.length;e++)n.refetchSource(r[e]);n.thaw()},t.defaults=a.globalDefaults,t.englishDefaults=a.englishDefaults,t.rtlDefaults=a.rtlDefaults,t}();e.default=H,d.default.mixInto(H),c.default.mixInto(H)},function(t,e,n){function r(t){var e,n,r,i,l=a.dataAttrPrefix;return l&&(l+="-"),e=t.data(l+"event")||null,e&&(e="object"==typeof e?o.extend({},e):{},n=e.start,null==n&&(n=e.time),r=e.duration,i=e.stick,delete e.start,delete e.time,delete e.duration,delete e.stick),null==n&&(n=t.data(l+"start")),null==n&&(n=t.data(l+"time")),null==r&&(r=t.data(l+"duration")),null==i&&(i=t.data(l+"stick")),n=null!=n?s.duration(n):null,r=null!=r?s.duration(r):null,i=Boolean(i),{eventProps:e,startTime:n,duration:r,stick:i}}Object.defineProperty(e,"__esModule",{value:!0});var i=n(2),o=n(3),s=n(0),a=n(18),l=n(4),u=n(11),d=n(7),c=n(17),p=n(9),h=n(20),f=n(6),g=n(14),v=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e.isDragging=!1,e}return i.__extends(e,t),e.prototype.end=function(){this.dragListener&&this.dragListener.endInteraction()},e.prototype.bindToDocument=function(){this.listenTo(o(document),{dragstart:this.handleDragStart,sortstart:this.handleDragStart})},e.prototype.unbindFromDocument=function(){this.stopListeningTo(o(document))},e.prototype.handleDragStart=function(t,e){var n,r;this.opt("droppable")&&(n=o((e?e.item:null)||t.target),r=this.opt("dropAccept"),(o.isFunction(r)?r.call(n[0],n):n.is(r))&&(this.isDragging||this.listenToExternalDrag(n,t,e)))},e.prototype.listenToExternalDrag=function(t,e,n){var i,o=this,s=this.component,a=this.view,u=r(t);(this.dragListener=new c.default(s,{interactionStart:function(){o.isDragging=!0},hitOver:function(t){var e,n=!0,r=t.component.getSafeHitFootprint(t);r?(i=o.computeExternalDrop(r,u),i?(e=new h.default(i.buildInstances()),n=u.eventProps?s.isEventInstanceGroupAllowed(e):s.isExternalInstanceGroupAllowed(e)):n=!1):n=!1,n||(i=null,l.disableCursor()),i&&s.renderDrag(s.eventRangesToEventFootprints(e.sliceRenderRanges(s.dateProfile.renderUnzonedRange,a.calendar)))},hitOut:function(){i=null},hitDone:function(){l.enableCursor(),s.unrenderDrag()},interactionEnd:function(e){i&&a.reportExternalDrop(i,Boolean(u.eventProps),Boolean(u.stick),t,e,n),o.isDragging=!1,o.dragListener=null}})).startDrag(e)},e.prototype.computeExternalDrop=function(t,e){var n,r=this.view.calendar,i=u.default.utc(t.unzonedRange.startMs).stripZone();return t.isAllDay&&(e.startTime?i.time(e.startTime):i.stripTime()),e.duration&&(n=i.clone().add(e.duration)),i=r.applyTimezone(i),n&&(n=r.applyTimezone(n)),p.default.parse(o.extend({},e.eventProps,{start:i,end:n}),new f.default(r))},e}(g.default);e.default=v,d.default.mixInto(v),a.dataAttrPrefix=""},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(39),a=n(40),l=n(17),u=n(14),d=function(t){function e(e,n){var r=t.call(this,e)||this;return r.isResizing=!1,r.eventPointing=n,r}return r.__extends(e,t),e.prototype.end=function(){this.dragListener&&this.dragListener.endInteraction()},e.prototype.bindToEl=function(t){var e=this.component;e.bindSegHandlerToEl(t,"mousedown",this.handleMouseDown.bind(this)),e.bindSegHandlerToEl(t,"touchstart",this.handleTouchStart.bind(this))},e.prototype.handleMouseDown=function(t,e){this.component.canStartResize(t,e)&&this.buildDragListener(t,i(e.target).is(".fc-start-resizer")).startInteraction(e,{distance:5})},e.prototype.handleTouchStart=function(t,e){this.component.canStartResize(t,e)&&this.buildDragListener(t,i(e.target).is(".fc-start-resizer")).startInteraction(e)},e.prototype.buildDragListener=function(t,e){var n,r,i=this,s=this.component,a=this.view,u=a.calendar,d=u.eventManager,c=t.el,p=t.footprint.eventDef,h=t.footprint.eventInstance;return this.dragListener=new l.default(s,{scroll:this.opt("dragScroll"),subjectEl:c,interactionStart:function(){n=!1},dragStart:function(e){n=!0,i.eventPointing.handleMouseout(t,e),i.segResizeStart(t,e)},hitOver:function(n,l,c){var h,f=!0,g=s.getSafeHitFootprint(c),v=s.getSafeHitFootprint(n);g&&v?(r=e?i.computeEventStartResizeMutation(g,v,t.footprint):i.computeEventEndResizeMutation(g,v,t.footprint),r?(h=d.buildMutatedEventInstanceGroup(p.id,r),f=s.isEventInstanceGroupAllowed(h)):f=!1):f=!1,f?r.isEmpty()&&(r=null):(r=null,o.disableCursor()),r&&(a.hideEventsWithId(t.footprint.eventDef.id),a.renderEventResize(s.eventRangesToEventFootprints(h.sliceRenderRanges(s.dateProfile.renderUnzonedRange,u)),t))},hitOut:function(){r=null},hitDone:function(){a.unrenderEventResize(t),a.showEventsWithId(t.footprint.eventDef.id),o.enableCursor()},interactionEnd:function(e){n&&i.segResizeStop(t,e),r&&a.reportEventResize(h,r,c,e),i.dragListener=null}})},e.prototype.segResizeStart=function(t,e){this.isResizing=!0,this.component.publiclyTrigger("eventResizeStart",{context:t.el[0],args:[t.footprint.getEventLegacy(),e,{},this.view]})},e.prototype.segResizeStop=function(t,e){this.isResizing=!1,this.component.publiclyTrigger("eventResizeStop",{context:t.el[0],args:[t.footprint.getEventLegacy(),e,{},this.view]})},e.prototype.computeEventStartResizeMutation=function(t,e,n){var r,i,o=n.componentFootprint.unzonedRange,l=this.component.diffDates(e.unzonedRange.getStart(),t.unzonedRange.getStart());return o.getStart().add(l)<o.getEnd()&&(r=new a.default,r.setStartDelta(l),i=new s.default,i.setDateMutation(r),i)},e.prototype.computeEventEndResizeMutation=function(t,e,n){var r,i,o=n.componentFootprint.unzonedRange,l=this.component.diffDates(e.unzonedRange.getEnd(),t.unzonedRange.getEnd());return o.getEnd().add(l)>o.getStart()&&(r=new a.default,r.setEndDelta(l),i=new s.default,i.setDateMutation(r),i)},e}(u.default);e.default=d},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(4),o=n(39),s=n(40),a=n(59),l=n(17),u=n(226),d=n(14),c=function(t){function e(e,n){var r=t.call(this,e)||this;return r.isDragging=!1,r.eventPointing=n,r}return r.__extends(e,t),e.prototype.end=function(){this.dragListener&&this.dragListener.endInteraction()},e.prototype.getSelectionDelay=function(){var t=this.opt("eventLongPressDelay");return null==t&&(t=this.opt("longPressDelay")),t},e.prototype.bindToEl=function(t){var e=this.component;e.bindSegHandlerToEl(t,"mousedown",this.handleMousedown.bind(this)),e.bindSegHandlerToEl(t,"touchstart",this.handleTouchStart.bind(this))},e.prototype.handleMousedown=function(t,e){!this.component.shouldIgnoreMouse()&&this.component.canStartDrag(t,e)&&this.buildDragListener(t).startInteraction(e,{distance:5})},e.prototype.handleTouchStart=function(t,e){var n=this.component,r={delay:this.view.isEventDefSelected(t.footprint.eventDef)?0:this.getSelectionDelay()};n.canStartDrag(t,e)?this.buildDragListener(t).startInteraction(e,r):n.canStartSelection(t,e)&&this.buildSelectListener(t).startInteraction(e,r)},e.prototype.buildSelectListener=function(t){var e=this,n=this.view,r=t.footprint.eventDef,i=t.footprint.eventInstance;if(this.dragListener)return this.dragListener;var o=this.dragListener=new a.default({dragStart:function(t){o.isTouch&&!n.isEventDefSelected(r)&&i&&n.selectEventInstance(i)},interactionEnd:function(t){e.dragListener=null}});return o},e.prototype.buildDragListener=function(t){var e,n,r,o=this,s=this.component,a=this.view,d=a.calendar,c=d.eventManager,p=t.el,h=t.footprint.eventDef,f=t.footprint.eventInstance;if(this.dragListener)return this.dragListener;var g=this.dragListener=new l.default(a,{scroll:this.opt("dragScroll"),subjectEl:p,subjectCenter:!0,interactionStart:function(r){t.component=s,e=!1,n=new u.default(t.el,{additionalClass:"fc-dragging",parentEl:a.el,opacity:g.isTouch?null:o.opt("dragOpacity"),revertDuration:o.opt("dragRevertDuration"),zIndex:2}),n.hide(),n.start(r)},dragStart:function(n){g.isTouch&&!a.isEventDefSelected(h)&&f&&a.selectEventInstance(f),e=!0,o.eventPointing.handleMouseout(t,n),o.segDragStart(t,n),a.hideEventsWithId(t.footprint.eventDef.id)},hitOver:function(e,l,u){var p,f,v,y=!0;t.hit&&(u=t.hit),p=u.component.getSafeHitFootprint(u),f=e.component.getSafeHitFootprint(e),p&&f?(r=o.computeEventDropMutation(p,f,h),r?(v=c.buildMutatedEventInstanceGroup(h.id,r),y=s.isEventInstanceGroupAllowed(v)):y=!1):y=!1,y||(r=null,i.disableCursor()),r&&a.renderDrag(s.eventRangesToEventFootprints(v.sliceRenderRanges(s.dateProfile.renderUnzonedRange,d)),t,g.isTouch)?n.hide():n.show(),l&&(r=null)},hitOut:function(){a.unrenderDrag(t),n.show(),r=null},hitDone:function(){i.enableCursor()},interactionEnd:function(i){delete t.component,n.stop(!r,function(){e&&(a.unrenderDrag(t),o.segDragStop(t,i)),a.showEventsWithId(t.footprint.eventDef.id),r&&a.reportEventDrop(f,r,p,i)}),o.dragListener=null}});return g},e.prototype.segDragStart=function(t,e){this.isDragging=!0,this.component.publiclyTrigger("eventDragStart",{context:t.el[0],args:[t.footprint.getEventLegacy(),e,{},this.view]})},e.prototype.segDragStop=function(t,e){this.isDragging=!1,this.component.publiclyTrigger("eventDragStop",{context:t.el[0],args:[t.footprint.getEventLegacy(),e,{},this.view]})},e.prototype.computeEventDropMutation=function(t,e,n){var r=new o.default;return r.setDateMutation(this.computeEventDateMutation(t,e)),r},e.prototype.computeEventDateMutation=function(t,e){var n,r,i=t.unzonedRange.getStart(),o=e.unzonedRange.getStart(),a=!1,l=!1,u=!1;return t.isAllDay!==e.isAllDay&&(a=!0,e.isAllDay?(u=!0,i.stripTime()):l=!0),n=this.component.diffDates(o,i),r=new s.default,r.clearEnd=a,r.forceTimed=l,r.forceAllDay=u,r.setDateDelta(n),r},e}(d.default);e.default=c},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(4),o=n(17),s=n(12),a=n(5),l=n(14),u=function(t){function e(e){var n=t.call(this,e)||this;return n.dragListener=n.buildDragListener(),n}return r.__extends(e,t),e.prototype.end=function(){this.dragListener.endInteraction()},e.prototype.getDelay=function(){var t=this.opt("selectLongPressDelay");return null==t&&(t=this.opt("longPressDelay")),t},e.prototype.bindToEl=function(t){var e=this,n=this.component,r=this.dragListener;n.bindDateHandlerToEl(t,"mousedown",function(t){e.opt("selectable")&&!n.shouldIgnoreMouse()&&r.startInteraction(t,{distance:e.opt("selectMinDistance")})}),n.bindDateHandlerToEl(t,"touchstart",function(t){e.opt("selectable")&&!n.shouldIgnoreTouch()&&r.startInteraction(t,{delay:e.getDelay()})}),i.preventSelection(t)},e.prototype.buildDragListener=function(){var t,e=this,n=this.component;return new o.default(n,{scroll:this.opt("dragScroll"),interactionStart:function(){t=null},dragStart:function(t){e.view.unselect(t)},hitOver:function(r,o,s){var a,l;s&&(a=n.getSafeHitFootprint(s),l=n.getSafeHitFootprint(r),t=a&&l?e.computeSelection(a,l):null,t?n.renderSelectionFootprint(t):!1===t&&i.disableCursor())},hitOut:function(){t=null,n.unrenderSelection()},hitDone:function(){i.enableCursor()},interactionEnd:function(n,r){!r&&t&&e.view.reportSelection(t,n)}})},e.prototype.computeSelection=function(t,e){var n=this.computeSelectionFootprint(t,e);return!(n&&!this.isSelectionFootprintAllowed(n))&&n},e.prototype.computeSelectionFootprint=function(t,e){var n=[t.unzonedRange.startMs,t.unzonedRange.endMs,e.unzonedRange.startMs,e.unzonedRange.endMs];return n.sort(i.compareNumbers),new s.default(new a.default(n[0],n[3]),t.isAllDay)},e.prototype.isSelectionFootprintAllowed=function(t){return this.component.dateProfile.validUnzonedRange.containsRange(t.unzonedRange)&&this.view.calendar.constraints.isSelectionFootprintAllowed(t)},e}(l.default);e.default=u},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(17),o=n(14),s=function(t){function e(e){var n=t.call(this,e)||this;return n.dragListener=n.buildDragListener(),n}return r.__extends(e,t),e.prototype.end=function(){this.dragListener.endInteraction()},e.prototype.bindToEl=function(t){var e=this.component,n=this.dragListener;e.bindDateHandlerToEl(t,"mousedown",function(t){e.shouldIgnoreMouse()||n.startInteraction(t)}),e.bindDateHandlerToEl(t,"touchstart",function(t){e.shouldIgnoreTouch()||n.startInteraction(t)})},e.prototype.buildDragListener=function(){var t,e=this,n=this.component,r=new i.default(n,{scroll:this.opt("dragScroll"),interactionStart:function(){t=r.origHit},hitOver:function(e,n,r){n||(t=null)},hitOut:function(){t=null},interactionEnd:function(r,i){var o;!i&&t&&(o=n.getSafeHitFootprint(t))&&e.view.triggerDayClick(o,n.getHitEl(t),r)}});return r.shouldCancelTouchScroll=!1,r.scrollAlwaysKills=!0,r},e}(o.default);e.default=s},function(t,e,n){function r(t){var e,n=[],r=[];for(e=0;e<t.length;e++)t[e].componentFootprint.isAllDay?n.push(t[e]):r.push(t[e]);return{allDay:n,timed:r}}Object.defineProperty(e,"__esModule",{value:!0});var i,o,s=n(2),a=n(0),l=n(3),u=n(4),d=n(41),c=n(43),p=n(239),h=n(66),f=function(t){function e(e,n){var r=t.call(this,e,n)||this;return r.usesMinMaxTime=!0,r.timeGrid=r.instantiateTimeGrid(),r.addChild(r.timeGrid),r.opt("allDaySlot")&&(r.dayGrid=r.instantiateDayGrid(),r.addChild(r.dayGrid)),r.scroller=new d.default({overflowX:"hidden",overflowY:"auto"}),r}return s.__extends(e,t),e.prototype.instantiateTimeGrid=function(){var t=new this.timeGridClass(this);return u.copyOwnProps(i,t),t},e.prototype.instantiateDayGrid=function(){var t=new this.dayGridClass(this);return u.copyOwnProps(o,t),t},e.prototype.renderSkeleton=function(){var t,e;this.el.addClass("fc-agenda-view").html(this.renderSkeletonHtml()),this.scroller.render(),t=this.scroller.el.addClass("fc-time-grid-container"),e=l('<div class="fc-time-grid" />').appendTo(t),this.el.find(".fc-body > tr > td").append(t),this.timeGrid.headContainerEl=this.el.find(".fc-head-container"),this.timeGrid.setElement(e),this.dayGrid&&(this.dayGrid.setElement(this.el.find(".fc-day-grid")),this.dayGrid.bottomCoordPadding=this.dayGrid.el.next("hr").outerHeight())},e.prototype.unrenderSkeleton=function(){this.timeGrid.removeElement(),this.dayGrid&&this.dayGrid.removeElement(),this.scroller.destroy()},e.prototype.renderSkeletonHtml=function(){var t=this.calendar.theme;return'<table class="'+t.getClass("tableGrid")+'">'+(this.opt("columnHeader")?'<thead class="fc-head"><tr><td class="fc-head-container '+t.getClass("widgetHeader")+'">&nbsp;</td></tr></thead>':"")+'<tbody class="fc-body"><tr><td class="'+t.getClass("widgetContent")+'">'+(this.dayGrid?'<div class="fc-day-grid"/><hr class="fc-divider '+t.getClass("widgetHeader")+'"/>':"")+"</td></tr></tbody></table>"},e.prototype.axisStyleAttr=function(){return null!=this.axisWidth?'style="width:'+this.axisWidth+'px"':""},e.prototype.getNowIndicatorUnit=function(){return this.timeGrid.getNowIndicatorUnit()},e.prototype.updateSize=function(e,n,r){var i,o,s;if(t.prototype.updateSize.call(this,e,n,r),this.axisWidth=u.matchCellWidths(this.el.find(".fc-axis")),!this.timeGrid.colEls)return void(n||(o=this.computeScrollerHeight(e),this.scroller.setHeight(o)));var a=this.el.find(".fc-row:not(.fc-scroller *)");this.timeGrid.bottomRuleEl.hide(),this.scroller.clear(),u.uncompensateScroll(a),this.dayGrid&&(this.dayGrid.removeSegPopover(),i=this.opt("eventLimit"),i&&"number"!=typeof i&&(i=5),i&&this.dayGrid.limitRows(i)),n||(o=this.computeScrollerHeight(e),this.scroller.setHeight(o),s=this.scroller.getScrollbarWidths(),(s.left||s.right)&&(u.compensateScroll(a,s),o=this.computeScrollerHeight(e),this.scroller.setHeight(o)),this.scroller.lockOverflow(s),this.timeGrid.getTotalSlatHeight()<o&&this.timeGrid.bottomRuleEl.show())},e.prototype.computeScrollerHeight=function(t){return t-u.subtractInnerElHeight(this.el,this.scroller.el)},e.prototype.computeInitialDateScroll=function(){var t=a.duration(this.opt("scrollTime")),e=this.timeGrid.computeTimeTop(t);return e=Math.ceil(e),e&&e++,{top:e}},e.prototype.queryDateScroll=function(){return{top:this.scroller.getScrollTop()}},e.prototype.applyDateScroll=function(t){void 0!==t.top&&this.scroller.setScrollTop(t.top)},e.prototype.getHitFootprint=function(t){return t.component.getHitFootprint(t)},e.prototype.getHitEl=function(t){return t.component.getHitEl(t)},e.prototype.executeEventRender=function(t){var e,n,r={},i={};for(e in t)n=t[e],n.getEventDef().isAllDay()?r[e]=n:i[e]=n;this.timeGrid.executeEventRender(i),this.dayGrid&&this.dayGrid.executeEventRender(r)},e.prototype.renderDrag=function(t,e,n){var i=r(t),o=!1;return o=this.timeGrid.renderDrag(i.timed,e,n),this.dayGrid&&(o=this.dayGrid.renderDrag(i.allDay,e,n)||o),o},e.prototype.renderEventResize=function(t,e,n){var i=r(t);this.timeGrid.renderEventResize(i.timed,e,n),this.dayGrid&&this.dayGrid.renderEventResize(i.allDay,e,n)},e.prototype.renderSelectionFootprint=function(t){t.isAllDay?this.dayGrid&&this.dayGrid.renderSelectionFootprint(t):this.timeGrid.renderSelectionFootprint(t)},e}(c.default);e.default=f,f.prototype.timeGridClass=p.default,f.prototype.dayGridClass=h.default,i={renderHeadIntroHtml:function(){var t,e=this.view,n=e.calendar,r=n.msToUtcMoment(this.dateProfile.renderUnzonedRange.startMs,!0);return this.opt("weekNumbers")?(t=r.format(this.opt("smallWeekFormat")),'<th class="fc-axis fc-week-number '+n.theme.getClass("widgetHeader")+'" '+e.axisStyleAttr()+">"+e.buildGotoAnchorHtml({date:r,type:"week",forceOff:this.colCnt>1},u.htmlEscape(t))+"</th>"):'<th class="fc-axis '+n.theme.getClass("widgetHeader")+'" '+e.axisStyleAttr()+"></th>"},renderBgIntroHtml:function(){var t=this.view;return'<td class="fc-axis '+t.calendar.theme.getClass("widgetContent")+'" '+t.axisStyleAttr()+"></td>"},renderIntroHtml:function(){return'<td class="fc-axis" '+this.view.axisStyleAttr()+"></td>"}},o={renderBgIntroHtml:function(){var t=this.view;return'<td class="fc-axis '+t.calendar.theme.getClass("widgetContent")+'" '+t.axisStyleAttr()+"><span>"+t.getAllDayHtml()+"</span></td>"},renderIntroHtml:function(){return'<td class="fc-axis" '+this.view.axisStyleAttr()+"></td>"}}},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(0),s=n(4),a=n(42),l=n(61),u=n(65),d=n(60),c=n(58),p=n(5),h=n(12),f=n(240),g=n(241),v=n(242),y=[{hours:1},{minutes:30},{minutes:15},{seconds:30},{seconds:15}],m=function(t){function e(e){var n=t.call(this,e)||this;return n.processOptions(),n}return r.__extends(e,t),e.prototype.componentFootprintToSegs=function(t){var e,n=this.sliceRangeByTimes(t.unzonedRange);for(e=0;e<n.length;e++)this.isRTL?n[e].col=this.daysPerRow-1-n[e].dayIndex:n[e].col=n[e].dayIndex;return n},e.prototype.sliceRangeByTimes=function(t){var e,n,r=[];for(n=0;n<this.daysPerRow;n++)(e=t.intersect(this.dayRanges[n]))&&r.push({startMs:e.startMs,endMs:e.endMs,isStart:e.isStart,isEnd:e.isEnd,dayIndex:n});return r},e.prototype.processOptions=function(){var t,e=this.opt("slotDuration"),n=this.opt("snapDuration");e=o.duration(e),n=n?o.duration(n):e,this.slotDuration=e,this.snapDuration=n,this.snapsPerSlot=e/n,t=this.opt("slotLabelFormat"),i.isArray(t)&&(t=t[t.length-1]),this.labelFormat=t||this.opt("smallTimeFormat"),t=this.opt("slotLabelInterval"),this.labelInterval=t?o.duration(t):this.computeLabelInterval(e)},e.prototype.computeLabelInterval=function(t){var e,n,r;for(e=y.length-1;e>=0;e--)if(n=o.duration(y[e]),r=s.divideDurationByDuration(n,t),s.isInt(r)&&r>1)return n;return o.duration(t)},e.prototype.renderDates=function(t){this.dateProfile=t,this.updateDayTable(),this.renderSlats(),this.renderColumns()},e.prototype.unrenderDates=function(){this.unrenderColumns()},e.prototype.renderSkeleton=function(){var t=this.view.calendar.theme;this.el.html('<div class="fc-bg"></div><div class="fc-slats"></div><hr class="fc-divider '+t.getClass("widgetHeader")+'" style="display:none" />'),this.bottomRuleEl=this.el.find("hr")},e.prototype.renderSlats=function(){var t=this.view.calendar.theme;this.slatContainerEl=this.el.find("> .fc-slats").html('<table class="'+t.getClass("tableGrid")+'">'+this.renderSlatRowHtml()+"</table>"),this.slatEls=this.slatContainerEl.find("tr"),this.slatCoordCache=new c.default({els:this.slatEls,isVertical:!0})},e.prototype.renderSlatRowHtml=function(){for(var t,e,n,r=this.view,i=r.calendar,a=i.theme,l=this.isRTL,u=this.dateProfile,d="",c=o.duration(+u.minTime),p=o.duration(0);c<u.maxTime;)t=i.msToUtcMoment(u.renderUnzonedRange.startMs).time(c),e=s.isInt(s.divideDurationByDuration(p,this.labelInterval)),n='<td class="fc-axis fc-time '+a.getClass("widgetContent")+'" '+r.axisStyleAttr()+">"+(e?"<span>"+s.htmlEscape(t.format(this.labelFormat))+"</span>":"")+"</td>",d+='<tr data-time="'+t.format("HH:mm:ss")+'"'+(e?"":' class="fc-minor"')+">"+(l?"":n)+'<td class="'+a.getClass("widgetContent")+'"/>'+(l?n:"")+"</tr>",c.add(this.slotDuration),p.add(this.slotDuration);return d},e.prototype.renderColumns=function(){var t=this.dateProfile,e=this.view.calendar.theme;this.dayRanges=this.dayDates.map(function(e){return new p.default(e.clone().add(t.minTime),e.clone().add(t.maxTime))}),this.headContainerEl&&this.headContainerEl.html(this.renderHeadHtml()),this.el.find("> .fc-bg").html('<table class="'+e.getClass("tableGrid")+'">'+this.renderBgTrHtml(0)+"</table>"),this.colEls=this.el.find(".fc-day, .fc-disabled-day"),this.colCoordCache=new c.default({els:this.colEls,isHorizontal:!0}),this.renderContentSkeleton()},e.prototype.unrenderColumns=function(){this.unrenderContentSkeleton()},e.prototype.renderContentSkeleton=function(){var t,e,n="";for(t=0;t<this.colCnt;t++)n+='<td><div class="fc-content-col"><div class="fc-event-container fc-helper-container"></div><div class="fc-event-container"></div><div class="fc-highlight-container"></div><div class="fc-bgevent-container"></div><div class="fc-business-container"></div></div></td>';e=this.contentSkeletonEl=i('<div class="fc-content-skeleton"><table><tr>'+n+"</tr></table></div>"),this.colContainerEls=e.find(".fc-content-col"),this.helperContainerEls=e.find(".fc-helper-container"),this.fgContainerEls=e.find(".fc-event-container:not(.fc-helper-container)"),this.bgContainerEls=e.find(".fc-bgevent-container"),this.highlightContainerEls=e.find(".fc-highlight-container"),this.businessContainerEls=e.find(".fc-business-container"),this.bookendCells(e.find("tr")),this.el.append(e)},e.prototype.unrenderContentSkeleton=function(){this.contentSkeletonEl&&(this.contentSkeletonEl.remove(),this.contentSkeletonEl=null,this.colContainerEls=null,this.helperContainerEls=null,this.fgContainerEls=null,this.bgContainerEls=null,this.highlightContainerEls=null,this.businessContainerEls=null)},e.prototype.groupSegsByCol=function(t){var e,n=[];for(e=0;e<this.colCnt;e++)n.push([]);for(e=0;e<t.length;e++)n[t[e].col].push(t[e]);return n},e.prototype.attachSegsByCol=function(t,e){var n,r,i;for(n=0;n<this.colCnt;n++)for(r=t[n],i=0;i<r.length;i++)e.eq(n).append(r[i].el)},e.prototype.getNowIndicatorUnit=function(){return"minute"},e.prototype.renderNowIndicator=function(t){if(this.colContainerEls){var e,n=this.componentFootprintToSegs(new h.default(new p.default(t,t.valueOf()+1),!1)),r=this.computeDateTop(t,t),o=[];for(e=0;e<n.length;e++)o.push(i('<div class="fc-now-indicator fc-now-indicator-line"></div>').css("top",r).appendTo(this.colContainerEls.eq(n[e].col))[0]);n.length>0&&o.push(i('<div class="fc-now-indicator fc-now-indicator-arrow"></div>').css("top",r).appendTo(this.el.find(".fc-content-skeleton"))[0]),this.nowIndicatorEls=i(o)}},e.prototype.unrenderNowIndicator=function(){this.nowIndicatorEls&&(this.nowIndicatorEls.remove(),this.nowIndicatorEls=null)},e.prototype.updateSize=function(e,n,r){t.prototype.updateSize.call(this,e,n,r),this.slatCoordCache.build(),r&&this.updateSegVerticals([].concat(this.eventRenderer.getSegs(),this.businessSegs||[]))},e.prototype.getTotalSlatHeight=function(){return this.slatContainerEl.outerHeight()},e.prototype.computeDateTop=function(t,e){return this.computeTimeTop(o.duration(t-e.clone().stripTime()))},e.prototype.computeTimeTop=function(t){var e,n,r=this.slatEls.length,i=this.dateProfile,o=(t-i.minTime)/this.slotDuration;return o=Math.max(0,o),o=Math.min(r,o),e=Math.floor(o),e=Math.min(e,r-1),n=o-e,this.slatCoordCache.getTopPosition(e)+this.slatCoordCache.getHeight(e)*n},e.prototype.updateSegVerticals=function(t){this.computeSegVerticals(t),this.assignSegVerticals(t)},e.prototype.computeSegVerticals=function(t){var e,n,r,i=this.opt("agendaEventMinHeight");for(e=0;e<t.length;e++)n=t[e],r=this.dayDates[n.dayIndex],n.top=this.computeDateTop(n.startMs,r),n.bottom=Math.max(n.top+i,this.computeDateTop(n.endMs,r))},e.prototype.assignSegVerticals=function(t){var e,n;for(e=0;e<t.length;e++)n=t[e],n.el.css(this.generateSegVerticalCss(n))},e.prototype.generateSegVerticalCss=function(t){return{top:t.top,bottom:-t.bottom}},e.prototype.prepareHits=function(){this.colCoordCache.build(),this.slatCoordCache.build()},e.prototype.releaseHits=function(){this.colCoordCache.clear()},e.prototype.queryHit=function(t,e){var n=this.snapsPerSlot,r=this.colCoordCache,i=this.slatCoordCache;if(r.isLeftInBounds(t)&&i.isTopInBounds(e)){var o=r.getHorizontalIndex(t),s=i.getVerticalIndex(e);if(null!=o&&null!=s){var a=i.getTopOffset(s),l=i.getHeight(s),u=(e-a)/l,d=Math.floor(u*n),c=s*n+d,p=a+d/n*l,h=a+(d+1)/n*l;return{col:o,snap:c,component:this,left:r.getLeftOffset(o),right:r.getRightOffset(o),top:p,bottom:h}}}},e.prototype.getHitFootprint=function(t){var e,n=this.getCellDate(0,t.col),r=this.computeSnapTime(t.snap);return n.time(r),e=n.clone().add(this.snapDuration),new h.default(new p.default(n,e),!1)},e.prototype.computeSnapTime=function(t){return o.duration(this.dateProfile.minTime+this.snapDuration*t)},e.prototype.getHitEl=function(t){return this.colEls.eq(t.col)},e.prototype.renderDrag=function(t,e,n){var r;if(e){if(t.length)return this.helperRenderer.renderEventDraggingFootprints(t,e,n),!0}else for(r=0;r<t.length;r++)this.renderHighlight(t[r].componentFootprint)},e.prototype.unrenderDrag=function(){this.unrenderHighlight(),this.helperRenderer.unrender()},e.prototype.renderEventResize=function(t,e,n){this.helperRenderer.renderEventResizingFootprints(t,e,n)},e.prototype.unrenderEventResize=function(){this.helperRenderer.unrender()},e.prototype.renderSelectionFootprint=function(t){this.opt("selectHelper")?this.helperRenderer.renderComponentFootprint(t):this.renderHighlight(t)},e.prototype.unrenderSelection=function(){this.helperRenderer.unrender(),this.unrenderHighlight()},e}(a.default);e.default=m,m.prototype.eventRendererClass=f.default,m.prototype.businessHourRendererClass=l.default,m.prototype.helperRendererClass=g.default,m.prototype.fillRendererClass=v.default,u.default.mixInto(m),d.default.mixInto(m)},function(t,e,n){function r(t){var e,n,r,i=[];for(e=0;e<t.length;e++){for(n=t[e],r=0;r<i.length&&s(n,i[r]).length;r++);n.level=r,(i[r]||(i[r]=[])).push(n)}return i}function i(t){var e,n,r,i,o;for(e=0;e<t.length;e++)for(n=t[e],r=0;r<n.length;r++)for(i=n[r],i.forwardSegs=[],o=e+1;o<t.length;o++)s(i,t[o],i.forwardSegs)}function o(t){var e,n,r=t.forwardSegs,i=0;if(void 0===t.forwardPressure){for(e=0;e<r.length;e++)n=r[e],o(n),i=Math.max(i,1+n.forwardPressure);t.forwardPressure=i}}function s(t,e,n){void 0===n&&(n=[]);for(var r=0;r<e.length;r++)a(t,e[r])&&n.push(e[r]);return n}function a(t,e){return t.bottom>e.top&&t.top<e.bottom}Object.defineProperty(e,"__esModule",{value:!0});var l=n(2),u=n(4),d=n(44),c=function(t){function e(e,n){var r=t.call(this,e,n)||this;return r.timeGrid=e,r}return l.__extends(e,t),e.prototype.renderFgSegs=function(t){this.renderFgSegsIntoContainers(t,this.timeGrid.fgContainerEls)},e.prototype.renderFgSegsIntoContainers=function(t,e){var n,r;for(n=this.timeGrid.groupSegsByCol(t),r=0;r<this.timeGrid.colCnt;r++)this.updateFgSegCoords(n[r]);this.timeGrid.attachSegsByCol(n,e)},e.prototype.unrenderFgSegs=function(){this.fgSegs&&this.fgSegs.forEach(function(t){t.el.remove()})},e.prototype.computeEventTimeFormat=function(){return this.opt("noMeridiemTimeFormat")},e.prototype.computeDisplayEventEnd=function(){return!0},e.prototype.fgSegHtml=function(t,e){
var n,r,i,o=this.view,s=o.calendar,a=t.footprint.componentFootprint,l=a.isAllDay,d=t.footprint.eventDef,c=o.isEventDefDraggable(d),p=!e&&t.isStart&&o.isEventDefResizableFromStart(d),h=!e&&t.isEnd&&o.isEventDefResizableFromEnd(d),f=this.getSegClasses(t,c,p||h),g=u.cssToStr(this.getSkinCss(d));if(f.unshift("fc-time-grid-event","fc-v-event"),o.isMultiDayRange(a.unzonedRange)){if(t.isStart||t.isEnd){var v=s.msToMoment(t.startMs),y=s.msToMoment(t.endMs);n=this._getTimeText(v,y,l),r=this._getTimeText(v,y,l,"LT"),i=this._getTimeText(v,y,l,null,!1)}}else n=this.getTimeText(t.footprint),r=this.getTimeText(t.footprint,"LT"),i=this.getTimeText(t.footprint,null,!1);return'<a class="'+f.join(" ")+'"'+(d.url?' href="'+u.htmlEscape(d.url)+'"':"")+(g?' style="'+g+'"':"")+'><div class="fc-content">'+(n?'<div class="fc-time" data-start="'+u.htmlEscape(i)+'" data-full="'+u.htmlEscape(r)+'"><span>'+u.htmlEscape(n)+"</span></div>":"")+(d.title?'<div class="fc-title">'+u.htmlEscape(d.title)+"</div>":"")+'</div><div class="fc-bg"/>'+(h?'<div class="fc-resizer fc-end-resizer" />':"")+"</a>"},e.prototype.updateFgSegCoords=function(t){this.timeGrid.computeSegVerticals(t),this.computeFgSegHorizontals(t),this.timeGrid.assignSegVerticals(t),this.assignFgSegHorizontals(t)},e.prototype.computeFgSegHorizontals=function(t){var e,n,s;if(this.sortEventSegs(t),e=r(t),i(e),n=e[0]){for(s=0;s<n.length;s++)o(n[s]);for(s=0;s<n.length;s++)this.computeFgSegForwardBack(n[s],0,0)}},e.prototype.computeFgSegForwardBack=function(t,e,n){var r,i=t.forwardSegs;if(void 0===t.forwardCoord)for(i.length?(this.sortForwardSegs(i),this.computeFgSegForwardBack(i[0],e+1,n),t.forwardCoord=i[0].backwardCoord):t.forwardCoord=1,t.backwardCoord=t.forwardCoord-(t.forwardCoord-n)/(e+1),r=0;r<i.length;r++)this.computeFgSegForwardBack(i[r],0,t.forwardCoord)},e.prototype.sortForwardSegs=function(t){t.sort(u.proxy(this,"compareForwardSegs"))},e.prototype.compareForwardSegs=function(t,e){return e.forwardPressure-t.forwardPressure||(t.backwardCoord||0)-(e.backwardCoord||0)||this.compareEventSegs(t,e)},e.prototype.assignFgSegHorizontals=function(t){var e,n;for(e=0;e<t.length;e++)n=t[e],n.el.css(this.generateFgSegHorizontalCss(n)),n.footprint.eventDef.title&&n.bottom-n.top<30&&n.el.addClass("fc-short")},e.prototype.generateFgSegHorizontalCss=function(t){var e,n,r=this.opt("slotEventOverlap"),i=t.backwardCoord,o=t.forwardCoord,s=this.timeGrid.generateSegVerticalCss(t),a=this.timeGrid.isRTL;return r&&(o=Math.min(1,i+2*(o-i))),a?(e=1-o,n=i):(e=i,n=1-o),s.zIndex=t.level+1,s.left=100*e+"%",s.right=100*n+"%",r&&t.forwardPressure&&(s[a?"marginLeft":"marginRight"]=20),s},e}(d.default);e.default=c},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(63),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.renderSegs=function(t,e){var n,r,o,s=[];for(this.eventRenderer.renderFgSegsIntoContainers(t,this.component.helperContainerEls),n=0;n<t.length;n++)r=t[n],e&&e.col===r.col&&(o=e.el,r.el.css({left:o.css("left"),right:o.css("right"),"margin-left":o.css("margin-left"),"margin-right":o.css("margin-right")})),s.push(r.el[0]);return i(s)},e}(o.default);e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(62),o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.attachSegEls=function(t,e){var n,r=this.component;return"bgEvent"===t?n=r.bgContainerEls:"businessHours"===t?n=r.businessContainerEls:"highlight"===t&&(n=r.highlightContainerEls),r.updateSegVerticals(e),r.attachSegsByCol(r.groupSegsByCol(e),n),e.map(function(t){return t.el[0]})},e}(i.default);e.default=o},function(t,e,n){function r(t,e){var n,r;for(n=0;n<e.length;n++)if(r=e[n],r.leftCol<=t.rightCol&&r.rightCol>=t.leftCol)return!0;return!1}function i(t,e){return t.leftCol-e.leftCol}Object.defineProperty(e,"__esModule",{value:!0});var o=n(2),s=n(3),a=n(4),l=n(44),u=function(t){function e(e,n){var r=t.call(this,e,n)||this;return r.dayGrid=e,r}return o.__extends(e,t),e.prototype.renderBgRanges=function(e){e=s.grep(e,function(t){return t.eventDef.isAllDay()}),t.prototype.renderBgRanges.call(this,e)},e.prototype.renderFgSegs=function(t){var e=this.rowStructs=this.renderSegRows(t);this.dayGrid.rowEls.each(function(t,n){s(n).find(".fc-content-skeleton > table").append(e[t].tbodyEl)})},e.prototype.unrenderFgSegs=function(){for(var t,e=this.rowStructs||[];t=e.pop();)t.tbodyEl.remove();this.rowStructs=null},e.prototype.renderSegRows=function(t){var e,n,r=[];for(e=this.groupSegRows(t),n=0;n<e.length;n++)r.push(this.renderSegRow(n,e[n]));return r},e.prototype.renderSegRow=function(t,e){function n(t){for(;o<t;)d=(y[r-1]||[])[o],d?d.attr("rowspan",parseInt(d.attr("rowspan")||1,10)+1):(d=s("<td/>"),a.append(d)),v[r][o]=d,y[r][o]=d,o++}var r,i,o,a,l,u,d,c=this.dayGrid.colCnt,p=this.buildSegLevels(e),h=Math.max(1,p.length),f=s("<tbody/>"),g=[],v=[],y=[];for(r=0;r<h;r++){if(i=p[r],o=0,a=s("<tr/>"),g.push([]),v.push([]),y.push([]),i)for(l=0;l<i.length;l++){for(u=i[l],n(u.leftCol),d=s('<td class="fc-event-container"/>').append(u.el),u.leftCol!==u.rightCol?d.attr("colspan",u.rightCol-u.leftCol+1):y[r][o]=d;o<=u.rightCol;)v[r][o]=d,g[r][o]=u,o++;a.append(d)}n(c),this.dayGrid.bookendCells(a),f.append(a)}return{row:t,tbodyEl:f,cellMatrix:v,segMatrix:g,segLevels:p,segs:e}},e.prototype.buildSegLevels=function(t){var e,n,o,s=[];for(this.sortEventSegs(t),e=0;e<t.length;e++){for(n=t[e],o=0;o<s.length&&r(n,s[o]);o++);n.level=o,(s[o]||(s[o]=[])).push(n)}for(o=0;o<s.length;o++)s[o].sort(i);return s},e.prototype.groupSegRows=function(t){var e,n=[];for(e=0;e<this.dayGrid.rowCnt;e++)n.push([]);for(e=0;e<t.length;e++)n[t[e].row].push(t[e]);return n},e.prototype.computeEventTimeFormat=function(){return this.opt("extraSmallTimeFormat")},e.prototype.computeDisplayEventEnd=function(){return 1===this.dayGrid.colCnt},e.prototype.fgSegHtml=function(t,e){var n,r,i=this.view,o=t.footprint.eventDef,s=t.footprint.componentFootprint.isAllDay,l=i.isEventDefDraggable(o),u=!e&&s&&t.isStart&&i.isEventDefResizableFromStart(o),d=!e&&s&&t.isEnd&&i.isEventDefResizableFromEnd(o),c=this.getSegClasses(t,l,u||d),p=a.cssToStr(this.getSkinCss(o)),h="";return c.unshift("fc-day-grid-event","fc-h-event"),t.isStart&&(n=this.getTimeText(t.footprint))&&(h='<span class="fc-time">'+a.htmlEscape(n)+"</span>"),r='<span class="fc-title">'+(a.htmlEscape(o.title||"")||"&nbsp;")+"</span>",'<a class="'+c.join(" ")+'"'+(o.url?' href="'+a.htmlEscape(o.url)+'"':"")+(p?' style="'+p+'"':"")+'><div class="fc-content">'+(this.dayGrid.isRTL?r+" "+h:h+" "+r)+"</div>"+(u?'<div class="fc-resizer fc-start-resizer" />':"")+(d?'<div class="fc-resizer fc-end-resizer" />':"")+"</a>"},e}(l.default);e.default=u},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(63),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.renderSegs=function(t,e){var n,r=[];return n=this.eventRenderer.renderSegRows(t),this.component.rowEls.each(function(t,o){var s,a,l=i(o),u=i('<div class="fc-helper-skeleton"><table/></div>');e&&e.row===t?a=e.el.position().top:(s=l.find(".fc-content-skeleton tbody"),s.length||(s=l.find(".fc-content-skeleton table")),a=s.position().top),u.css("top",a).find("table").append(n[t].tbodyEl),l.append(u),r.push(u[0])}),i(r)},e}(o.default);e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(62),s=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e.fillSegTag="td",e}return r.__extends(e,t),e.prototype.attachSegEls=function(t,e){var n,r,i,o=[];for(n=0;n<e.length;n++)r=e[n],i=this.renderFillRow(t,r),this.component.rowEls.eq(r.row).append(i),o.push(i[0]);return o},e.prototype.renderFillRow=function(t,e){var n,r,o,s=this.component.colCnt,a=e.leftCol,l=e.rightCol+1;return n="businessHours"===t?"bgevent":t.toLowerCase(),r=i('<div class="fc-'+n+'-skeleton"><table><tr/></table></div>'),o=r.find("tr"),a>0&&o.append(new Array(a+1).join("<td/>")),o.append(e.el.attr("colspan",l-a)),l<s&&o.append(new Array(s-l+1).join("<td/>")),this.component.bookendCells(o),r},e}(o.default);e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(0),o=n(4),s=n(67),a=n(247),l=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.setGridHeight=function(t,e){e&&(t*=this.dayGrid.rowCnt/6),o.distributeHeight(this.dayGrid.rowEls,t,!e)},e.prototype.isDateInOtherMonth=function(t,e){return t.month()!==i.utc(e.currentUnzonedRange.startMs).month()},e}(s.default);e.default=l,l.prototype.dateProfileGeneratorClass=a.default},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(68),o=n(5),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.buildRenderRange=function(e,n,r){var i,s=t.prototype.buildRenderRange.call(this,e,n,r),a=this.msToUtcMoment(s.startMs,r),l=this.msToUtcMoment(s.endMs,r);return this.opt("fixedWeekCount")&&(i=Math.ceil(l.diff(a,"weeks",!0)),l.add(6-i,"weeks")),new o.default(a,l)},e}(i.default);e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(5),a=n(43),l=n(41),u=n(249),d=n(250),c=function(t){function e(e,n){var r=t.call(this,e,n)||this;return r.segSelector=".fc-list-item",r.scroller=new l.default({overflowX:"hidden",overflowY:"auto"}),r}return r.__extends(e,t),e.prototype.renderSkeleton=function(){this.el.addClass("fc-list-view "+this.calendar.theme.getClass("listView")),this.scroller.render(),this.scroller.el.appendTo(this.el),this.contentEl=this.scroller.scrollEl},e.prototype.unrenderSkeleton=function(){this.scroller.destroy()},e.prototype.updateSize=function(e,n,r){t.prototype.updateSize.call(this,e,n,r),this.scroller.clear(),n||this.scroller.setHeight(this.computeScrollerHeight(e))},e.prototype.computeScrollerHeight=function(t){return t-o.subtractInnerElHeight(this.el,this.scroller.el)},e.prototype.renderDates=function(t){for(var e=this.calendar,n=e.msToUtcMoment(t.renderUnzonedRange.startMs,!0),r=e.msToUtcMoment(t.renderUnzonedRange.endMs,!0),i=[],o=[];n<r;)i.push(n.clone()),o.push(new s.default(n,n.clone().add(1,"day"))),n.add(1,"day");this.dayDates=i,this.dayRanges=o},e.prototype.componentFootprintToSegs=function(t){var e,n,r,i=this.dayRanges,o=[];for(e=0;e<i.length;e++)if((n=t.unzonedRange.intersect(i[e]))&&(r={startMs:n.startMs,endMs:n.endMs,isStart:n.isStart,isEnd:n.isEnd,dayIndex:e},o.push(r),!r.isEnd&&!t.isAllDay&&e+1<i.length&&t.unzonedRange.endMs<i[e+1].startMs+this.nextDayThreshold)){r.endMs=t.unzonedRange.endMs,r.isEnd=!0;break}return o},e.prototype.renderEmptyMessage=function(){this.contentEl.html('<div class="fc-list-empty-wrap2"><div class="fc-list-empty-wrap1"><div class="fc-list-empty">'+o.htmlEscape(this.opt("noEventsMessage"))+"</div></div></div>")},e.prototype.renderSegList=function(t){var e,n,r,o=this.groupSegsByDay(t),s=i('<table class="fc-list-table '+this.calendar.theme.getClass("tableList")+'"><tbody/></table>'),a=s.find("tbody");for(e=0;e<o.length;e++)if(n=o[e])for(a.append(this.dayHeaderHtml(this.dayDates[e])),this.eventRenderer.sortEventSegs(n),r=0;r<n.length;r++)a.append(n[r].el);this.contentEl.empty().append(s)},e.prototype.groupSegsByDay=function(t){var e,n,r=[];for(e=0;e<t.length;e++)n=t[e],(r[n.dayIndex]||(r[n.dayIndex]=[])).push(n);return r},e.prototype.dayHeaderHtml=function(t){var e=this.opt("listDayFormat"),n=this.opt("listDayAltFormat");return'<tr class="fc-list-heading" data-date="'+t.format("YYYY-MM-DD")+'"><td class="'+(this.calendar.theme.getClass("tableListHeading")||this.calendar.theme.getClass("widgetHeader"))+'" colspan="3">'+(e?this.buildGotoAnchorHtml(t,{class:"fc-list-heading-main"},o.htmlEscape(t.format(e))):"")+(n?this.buildGotoAnchorHtml(t,{class:"fc-list-heading-alt"},o.htmlEscape(t.format(n))):"")+"</td></tr>"},e}(a.default);e.default=c,c.prototype.eventRendererClass=u.default,c.prototype.eventPointingClass=d.default},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(4),o=n(44),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.renderFgSegs=function(t){t.length?this.component.renderSegList(t):this.component.renderEmptyMessage()},e.prototype.fgSegHtml=function(t){var e,n=this.view,r=n.calendar,o=r.theme,s=t.footprint,a=s.eventDef,l=s.componentFootprint,u=a.url,d=["fc-list-item"].concat(this.getClasses(a)),c=this.getBgColor(a);return e=l.isAllDay?n.getAllDayHtml():n.isMultiDayRange(l.unzonedRange)?t.isStart||t.isEnd?i.htmlEscape(this._getTimeText(r.msToMoment(t.startMs),r.msToMoment(t.endMs),l.isAllDay)):n.getAllDayHtml():i.htmlEscape(this.getTimeText(s)),u&&d.push("fc-has-url"),'<tr class="'+d.join(" ")+'">'+(this.displayEventTime?'<td class="fc-list-item-time '+o.getClass("widgetContent")+'">'+(e||"")+"</td>":"")+'<td class="fc-list-item-marker '+o.getClass("widgetContent")+'"><span class="fc-event-dot"'+(c?' style="background-color:'+c+'"':"")+'></span></td><td class="fc-list-item-title '+o.getClass("widgetContent")+'"><a'+(u?' href="'+i.htmlEscape(u)+'"':"")+">"+i.htmlEscape(a.title||"")+"</a></td></tr>"},e.prototype.computeEventTimeFormat=function(){return this.opt("mediumTimeFormat")},e}(o.default);e.default=s},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(64),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e.prototype.handleClick=function(e,n){var r;t.prototype.handleClick.call(this,e,n),i(n.target).closest("a[href]").length||(r=e.footprint.eventDef.url)&&!n.isDefaultPrevented()&&(window.location.href=r)},e}(o.default);e.default=s},,,,,,function(t,e,n){var r=n(3),i=n(18),o=n(4),s=n(232);n(11),n(49),n(260),n(261),n(264),n(265),n(266),n(267),r.fullCalendar=i,r.fn.fullCalendar=function(t){var e=Array.prototype.slice.call(arguments,1),n=this;return this.each(function(i,a){var l,u=r(a),d=u.data("fullCalendar");"string"==typeof t?"getCalendar"===t?i||(n=d):"destroy"===t?d&&(d.destroy(),u.removeData("fullCalendar")):d?r.isFunction(d[t])?(l=d[t].apply(d,e),i||(n=l),"destroy"===t&&u.removeData("fullCalendar")):o.warn("'"+t+"' is an unknown FullCalendar method."):o.warn("Attempting to call a FullCalendar method on an element with no calendar."):d||(d=new s.default(u,t),u.data("fullCalendar",d),d.render())}),n},t.exports=i},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=function(){function t(t,e){this.el=null,this.viewsWithButtons=[],this.calendar=t,this.toolbarOptions=e}return t.prototype.setToolbarOptions=function(t){this.toolbarOptions=t},t.prototype.render=function(){var t=this.toolbarOptions.layout,e=this.el;t?(e?e.empty():e=this.el=r("<div class='fc-toolbar "+this.toolbarOptions.extraClasses+"'/>"),e.append(this.renderSection("left")).append(this.renderSection("right")).append(this.renderSection("center")).append('<div class="fc-clear"/>')):this.removeElement()},t.prototype.removeElement=function(){this.el&&(this.el.remove(),this.el=null)},t.prototype.renderSection=function(t){var e=this,n=this.calendar,o=n.theme,s=n.optionsManager,a=n.viewSpecManager,l=r('<div class="fc-'+t+'"/>'),u=this.toolbarOptions.layout[t],d=s.get("customButtons")||{},c=s.overrides.buttonText||{},p=s.get("buttonText")||{};return u&&r.each(u.split(" "),function(t,s){var u,h=r(),f=!0;r.each(s.split(","),function(t,s){var l,u,g,v,y,m,b,w,D;"title"===s?(h=h.add(r("<h2>&nbsp;</h2>")),f=!1):((l=d[s])?(g=function(t){l.click&&l.click.call(w[0],t)},(v=o.getCustomButtonIconClass(l))||(v=o.getIconClass(s))||(y=l.text)):(u=a.getViewSpec(s))?(e.viewsWithButtons.push(s),g=function(){n.changeView(s)},(y=u.buttonTextOverride)||(v=o.getIconClass(s))||(y=u.buttonTextDefault)):n[s]&&(g=function(){n[s]()},(y=c[s])||(v=o.getIconClass(s))||(y=p[s])),g&&(b=["fc-"+s+"-button",o.getClass("button"),o.getClass("stateDefault")],y?(m=i.htmlEscape(y),D=""):v&&(m="<span class='"+v+"'></span>",D=' aria-label="'+s+'"'),w=r('<button type="button" class="'+b.join(" ")+'"'+D+">"+m+"</button>").click(function(t){w.hasClass(o.getClass("stateDisabled"))||(g(t),(w.hasClass(o.getClass("stateActive"))||w.hasClass(o.getClass("stateDisabled")))&&w.removeClass(o.getClass("stateHover")))}).mousedown(function(){w.not("."+o.getClass("stateActive")).not("."+o.getClass("stateDisabled")).addClass(o.getClass("stateDown"))}).mouseup(function(){w.removeClass(o.getClass("stateDown"))}).hover(function(){w.not("."+o.getClass("stateActive")).not("."+o.getClass("stateDisabled")).addClass(o.getClass("stateHover"))},function(){w.removeClass(o.getClass("stateHover")).removeClass(o.getClass("stateDown"))}),h=h.add(w)))}),f&&h.first().addClass(o.getClass("cornerLeft")).end().last().addClass(o.getClass("cornerRight")).end(),h.length>1?(u=r("<div/>"),f&&u.addClass(o.getClass("buttonGroup")),u.append(h),l.append(u)):l.append(h)}),l},t.prototype.updateTitle=function(t){this.el&&this.el.find("h2").text(t)},t.prototype.activateButton=function(t){this.el&&this.el.find(".fc-"+t+"-button").addClass(this.calendar.theme.getClass("stateActive"))},t.prototype.deactivateButton=function(t){this.el&&this.el.find(".fc-"+t+"-button").removeClass(this.calendar.theme.getClass("stateActive"))},t.prototype.disableButton=function(t){this.el&&this.el.find(".fc-"+t+"-button").prop("disabled",!0).addClass(this.calendar.theme.getClass("stateDisabled"))},t.prototype.enableButton=function(t){this.el&&this.el.find(".fc-"+t+"-button").prop("disabled",!1).removeClass(this.calendar.theme.getClass("stateDisabled"))},t.prototype.getViewsWithButtons=function(){return this.viewsWithButtons},t}();e.default=o},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(4),s=n(33),a=n(32),l=n(51),u=function(t){function e(e,n){var r=t.call(this)||this;return r._calendar=e,r.overrides=i.extend({},n),r.dynamicOverrides={},r.compute(),r}return r.__extends(e,t),e.prototype.add=function(t){var e,n=0;this.recordOverrides(t);for(e in t)n++;if(1===n){if("height"===e||"contentHeight"===e||"aspectRatio"===e)return void this._calendar.updateViewSize(!0);if("defaultDate"===e)return;if("businessHours"===e)return;if(/^(event|select)(Overlap|Constraint|Allow)$/.test(e))return;if("timezone"===e)return void this._calendar.view.flash("initialEvents")}this._calendar.renderHeader(),this._calendar.renderFooter(),this._calendar.viewsByType={},this._calendar.reinitView()},e.prototype.compute=function(){var t,e,n,r,i;t=o.firstDefined(this.dynamicOverrides.locale,this.overrides.locale),e=a.localeOptionHash[t],e||(t=s.globalDefaults.locale,e=a.localeOptionHash[t]||{}),n=o.firstDefined(this.dynamicOverrides.isRTL,this.overrides.isRTL,e.isRTL,s.globalDefaults.isRTL),r=n?s.rtlDefaults:{},this.dirDefaults=r,this.localeDefaults=e,i=s.mergeOptions([s.globalDefaults,r,e,this.overrides,this.dynamicOverrides]),a.populateInstanceComputableOptions(i),this.reset(i)},e.prototype.recordOverrides=function(t){var e;for(e in t)this.dynamicOverrides[e]=t[e];this._calendar.viewSpecManager.clearCache(),this.compute()},e}(l.default);e.default=u},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),i=n(3),o=n(24),s=n(4),a=n(33),l=n(32),u=function(){function t(t,e){this.optionsManager=t,this._calendar=e,this.clearCache()}return t.prototype.clearCache=function(){this.viewSpecCache={}},t.prototype.getViewSpec=function(t){var e=this.viewSpecCache;return e[t]||(e[t]=this.buildViewSpec(t))},t.prototype.getUnitViewSpec=function(t){var e,n,r;if(-1!==i.inArray(t,s.unitsDesc))for(e=this._calendar.header.getViewsWithButtons(),i.each(o.viewHash,function(t){e.push(t)}),n=0;n<e.length;n++)if((r=this.getViewSpec(e[n]))&&r.singleUnit===t)return r},t.prototype.buildViewSpec=function(t){for(var e,n,i,l,u,d=this.optionsManager.overrides.views||{},c=[],p=[],h=[],f=t;f;)e=o.viewHash[f],n=d[f],f=null,"function"==typeof e&&(e={class:e}),e&&(c.unshift(e),p.unshift(e.defaults||{}),i=i||e.duration,f=f||e.type),n&&(h.unshift(n),i=i||n.duration,f=f||n.type);return e=s.mergeProps(c),e.type=t,!!e.class&&(i=i||this.optionsManager.dynamicOverrides.duration||this.optionsManager.overrides.duration,i&&(l=r.duration(i),l.valueOf()&&(u=s.computeDurationGreatestUnit(l,i),e.duration=l,e.durationUnit=u,1===l.as(u)&&(e.singleUnit=u,h.unshift(d[u]||{})))),e.defaults=a.mergeOptions(p),e.overrides=a.mergeOptions(h),this.buildViewSpecOptions(e),this.buildViewSpecButtonText(e,t),e)},t.prototype.buildViewSpecOptions=function(t){var e=this.optionsManager;t.options=a.mergeOptions([a.globalDefaults,t.defaults,e.dirDefaults,e.localeDefaults,e.overrides,t.overrides,e.dynamicOverrides]),l.populateInstanceComputableOptions(t.options)},t.prototype.buildViewSpecButtonText=function(t,e){function n(n){var r=n.buttonText||{};return r[e]||(t.buttonTextKey?r[t.buttonTextKey]:null)||(t.singleUnit?r[t.singleUnit]:null)}var r=this.optionsManager;t.buttonTextOverride=n(r.dynamicOverrides)||n(r.overrides)||t.overrides.buttonText,t.buttonTextDefault=n(r.localeDefaults)||n(r.dirDefaults)||t.defaults.buttonText||n(a.globalDefaults)||(t.duration?this._calendar.humanizeDuration(t.duration):null)||e},t}();e.default=u},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(38),i=n(56),o=n(223),s=n(224);r.default.registerClass(i.default),r.default.registerClass(o.default),r.default.registerClass(s.default)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(57),i=n(221),o=n(222),s=n(262),a=n(263);r.defineThemeSystem("standard",i.default),r.defineThemeSystem("jquery-ui",o.default),r.defineThemeSystem("bootstrap3",s.default),r.defineThemeSystem("bootstrap4",a.default)},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(22),o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e}(i.default);e.default=o,o.prototype.classes={widget:"fc-bootstrap3",tableGrid:"table-bordered",tableList:"table",tableListHeading:"active",buttonGroup:"btn-group",button:"btn btn-default",stateActive:"active",stateDisabled:"disabled",today:"alert alert-info",popover:"panel panel-default",popoverHeader:"panel-heading",popoverContent:"panel-body",headerRow:"panel-default",dayRow:"panel-default",listView:"panel panel-default"},o.prototype.baseIconClass="glyphicon",o.prototype.iconClasses={close:"glyphicon-remove",prev:"glyphicon-chevron-left",next:"glyphicon-chevron-right",prevYear:"glyphicon-backward",nextYear:"glyphicon-forward"},o.prototype.iconOverrideOption="bootstrapGlyphicons",o.prototype.iconOverrideCustomButtonOption="bootstrapGlyphicon",o.prototype.iconOverridePrefix="glyphicon-"},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),i=n(22),o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r.__extends(e,t),e}(i.default);e.default=o,o.prototype.classes={widget:"fc-bootstrap4",tableGrid:"table-bordered",tableList:"table",tableListHeading:"table-active",buttonGroup:"btn-group",button:"btn btn-primary",stateActive:"active",stateDisabled:"disabled",today:"alert alert-info",popover:"card card-primary",popoverHeader:"card-header",popoverContent:"card-body",headerRow:"table-bordered",dayRow:"table-bordered",listView:"card card-primary"},o.prototype.baseIconClass="fa",o.prototype.iconClasses={close:"fa-times",prev:"fa-chevron-left",next:"fa-chevron-right",prevYear:"fa-angle-double-left",nextYear:"fa-angle-double-right"},o.prototype.iconOverrideOption="bootstrapFontAwesome",o.prototype.iconOverrideCustomButtonOption="bootstrapFontAwesome",o.prototype.iconOverridePrefix="fa-"},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(24),i=n(67),o=n(246);r.defineView("basic",{class:i.default}),r.defineView("basicDay",{type:"basic",duration:{days:1}}),r.defineView("basicWeek",{type:"basic",duration:{weeks:1}}),r.defineView("month",{class:o.default,duration:{months:1},defaults:{fixedWeekCount:!0}})},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(24),i=n(238);r.defineView("agenda",{class:i.default,defaults:{allDaySlot:!0,slotDuration:"00:30:00",slotEventOverlap:!0}}),r.defineView("agendaDay",{type:"agenda",duration:{days:1}}),r.defineView("agendaWeek",{type:"agenda",duration:{weeks:1}})},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(24),i=n(248);r.defineView("list",{class:i.default,buttonTextKey:"list",defaults:{buttonText:"list",listDayFormat:"LL",noEventsMessage:"No events to display"}}),r.defineView("listDay",{type:"list",duration:{days:1},defaults:{listDayFormat:"dddd"}}),r.defineView("listWeek",{type:"list",duration:{weeks:1},defaults:{listDayFormat:"dddd",listDayAltFormat:"LL"}}),r.defineView("listMonth",{type:"list",duration:{month:1},defaults:{listDayAltFormat:"dddd"}}),r.defineView("listYear",{type:"list",duration:{year:1},defaults:{listDayAltFormat:"dddd"}})},function(t,e){Object.defineProperty(e,"__esModule",{value:!0})}])});;

function quickNotify(txt, ask, denyFn) {
    try {
        // Let's check whether notification permissions have already been granted
        if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            var notification = new Notification(txt);
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== "denied" || ask == true) {
            Notification.requestPermission().then(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    var notification = new Notification(txt);
                } else {
                    console.log("The browser does not support notifications, or notifications were denied. Notifications disabled!");
                    denyFn();
                }
            });
        }
    } catch (e) {
        console.log("The browser does not support notifications, or notifications were denied. Notifications disabled!");
        denyFn();
    }
};

(() => {
    polymorph_core.registerOperator("calendar", {
        displayName: "Calendar",
        description: "A simple calendar. Click on items to select them. (Does not yet support click-to-add but we'll get there one day.)",
        section: "Display"
    },
        function (container) {
            let defaultSettings = {
                dateproperties: ["datestring"],
                titleproperty: 'title',
                defaultView: "agendaWeek",
            };
            polymorph_core.operatorTemplate.call(this, container, defaultSettings);

            this.rootdiv.style.cssText = 'height:100%; overflow-y: scroll';
            this.cstyle = htmlwrap(`<link rel="stylesheet" type="text/css" href="3pt/fullcalendar.min.css"></link>`)
            // this.cstyle = document.createElement("link");
            // this.cstyle.rel = "stylesheet";
            // this.cstyle.type = "text/css";
            // this.cstyle.href = "3pt/fullcalendar.min.css";
            this.rootdiv.appendChild(this.cstyle);

            $(this.rootdiv).fullCalendar({
                events: (start, end, timezone, callback) => {
                    let allList = [];
                    if (this.settings.pushnotifs) {
                        this.notifstack = [];
                    }
                    let tzd = new Date();
                    for (let i in polymorph_core.items) {
                        let tzd = new Date();
                        try {
                            for (let dp = 0; dp < this.settings.dateproperties.length; dp++) {
                                let currentDP = this.settings.dateproperties[dp];
                                let isNumerical = false;
                                if (this.settings.dateproperties[dp][0] == '*') {
                                    isNumerical = true;
                                    currentDP = this.settings.dateproperties[dp].slice(1);
                                }
                                if (polymorph_core.items[i][currentDP]) {
                                    let result;
                                    if (isNumerical) {
                                        result = [{ date: Number(polymorph_core.items[i][currentDP]) }];
                                        if (!result) continue;
                                    } else {
                                        if (polymorph_core.items[i][currentDP].date) {
                                            result = dateParser.getCalendarTimes(polymorph_core.items[i][currentDP].date, start, end);
                                        } else {
                                            continue;
                                        }
                                    }
                                    for (let j = 0; j < result.length; j++) {
                                        if (polymorph_core.items[i][currentDP].datestring != "auto now") {
                                            //prevent auto now spam
                                            this.notifstack.push({
                                                txt: polymorph_core.items[i][this.settings.titleproperty],
                                                time: result[j].date
                                            });
                                        }
                                        let isostring = new Date(result[j].date - tzd.getTimezoneOffset() * 60 * 1000 + 1000);
                                        let eisostring;
                                        if (result[j].endDate) eisostring = new Date(result[j].endDate - tzd.getTimezoneOffset() * 60 * 1000 - 1000);
                                        else eisostring = new Date(isostring.getTime() + 60 * 60 * 1000 - 1000);

                                        isostring = isostring.toISOString();
                                        eisostring = eisostring.toISOString();
                                        let col = "";
                                        let bak = "";
                                        if (polymorph_core.items[i].style) {
                                            bak = polymorph_core.items[i].style.background;
                                            col = polymorph_core.items[i].style.color || matchContrast(polymorph_core.items[i].style.background);
                                        }
                                        allList.push({
                                            id: i,
                                            title: polymorph_core.items[i][this.settings.titleproperty],
                                            backgroundColor: bak,
                                            textColor: col,
                                            start: isostring,
                                            end: eisostring
                                        });
                                    }
                                }
                            }
                        } catch (e) {

                        }
                    }
                    callback(allList);
                },
                eventClick: (calEvent, jsEvent, view) => {
                    container.fire("focusItem", {
                        id: calEvent.id,
                        sender: this
                    })
                },
                header: {
                    left: 'title',
                    center: '',
                    right: 'month agendaWeek listWeek basicWeek agendaDay  today prev,next'
                },
                defaultView: this.settings.defaultView,
                height: "parent"
            });

            //Handle item updates
            let updateItemCapacitor = new capacitor(1000, 1000, () => {
                try {
                    if (this.container.visible()) $(this.rootdiv).fullCalendar('refetchEvents');
                } catch (e) {
                    console.log("JQUERY not ready yet :/");
                }
            }, true);

            container.on("dateUpdate", () => {
                try {
                    if (this.container.visible()) $(this.rootdiv).fullCalendar('refetchEvents');
                } catch (e) {
                    console.log("JQUERY not ready yet :/");
                }
            });

            container.on("updateItem", (d) => {
                if (d.sender == this) return;
                if (!polymorph_core.items[d.id][this.settings.dateproperty]) return;
                updateItemCapacitor.submit();
            });

            //Handle a change in settings (either from load or from the settings dialog or somewhere else)
            this.processSettings = () => {
                try {
                    $(this.rootdiv).fullCalendar('refetchEvents');
                    container.fire("updateItem", { id: this.container.id });
                } catch (e) {
                    console.log("JQUERY not ready yet :/");
                }
                // pull settings and update when your dialog is closed.
                if (this.settings.pushnotifs) {
                    this.notify("Notifications enabled!", true);
                }
                if (this.settings.wsOn) {
                    this.tryEstablishWS();
                }
                //create window if window option is open.
                if (this.settings.notifWindow) {
                    if (!this.notifWindow) {
                        this.notifWindow = window.open("", "__blank", "dependent:on");
                    }
                } else {
                    //this.notifWindow.close();
                    //delete this.notifWindow;
                }
            }
            //every 10 s, check for new notifs!
            this.notifstack = [];
            setInterval(() => {
                let ihtml = "";
                for (let i = 0; i < this.notifstack.length; i++) {
                    if (Date.now() - this.notifstack[i].time > 0 && Date.now() - this.notifstack[i].time < 20000 && !this.notifstack[i].notified) {
                        if (this.settings.pushnotifs) {
                            this.notify(this.notifstack[i].txt);
                            this.wsnotify(this.notifstack[i].txt);
                            this.notifstack[i].notified = true;
                        }
                    }
                    if (Date.now() - this.notifstack[i].time > 0 && Date.now() - this.notifstack[i].time < 20000 && !this.notifstack[i].notified) {
                        ihtml += `<p>${this.notifstack[i].txt}</p>`;//within 20 s
                    }
                }
                if (this.notifWindow) {
                    this.notifWindow.document.body.innerHTML = ihtml;
                }
            }, 10000);


            this.tryEstablishWS = () => {
                //close previous ws if open
                if (this.ws) this.ws.close();
                if (this.settings.wsurl) {
                    try {
                        this.ws = new WebSocket(this.settings.wsurl);
                        this.ws.onmessage = function (e) {
                            if (this.settings.echoOn) {
                                this.state.output(e.data);
                            }
                            processQuery(e.data);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            }

            this.wsnotify = function (data) {
                if (this.ws) this.ws.send(data);
            }

            this.notify = (txt, ask) => {
                quickNotify(txt, ask, () => {
                    this.settings.pushnotifs = false;
                })
            }

            //Saving and loading
            this.toSaveData = function () {
                this.settings.defaultView = $(this.rootdiv).fullCalendar('getView').name;
            }


            //Handle the settings dialog click!
            this.dialogDiv = document.createElement("div");

            let ops = [
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "text",
                    object: this.settings,
                    property: "titleproperty",
                    label: "Enter the title property:"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "array",
                    object: this.settings,
                    property: "dateproperties",
                    label: "Enter the date properties (begin with * for numerical dates instead of smart dates):"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "pushnotifs",
                    label: "Show push notifications?"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "wsOn",
                    label: "Send events to a websocket?"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "text",
                    object: this.settings,
                    property: "wsurl",
                    label: "Websocket address"
                }),
                new polymorph_core._option({
                    div: this.dialogDiv,
                    type: "bool",
                    object: this.settings,
                    property: "notifWindow",
                    label: "Show Notification window"
                })
            ];

            this.showDialog = function () {
                // update your dialog elements with your settings
                ops.forEach((i) => i.load());
            }
            this.dialogUpdateSettings = function () {
                this.processSettings();
            }
            let calRefreshTimer = 0;
            this.refresh = () => {
                clearTimeout(calRefreshTimer);
                calRefreshTimer = setTimeout(() => {
                    try {
                        $(this.rootdiv).fullCalendar('render');
                        $(this.rootdiv).fullCalendar('refetchEvents');
                    } catch (err) {
                        console.log("jquery not ready yet :/");
                    }
                }, 1000);
            }

            this.processSettings();

        });
})();;

/*! svg.js v2.6.4 MIT*/;!function(t,e){"function"==typeof define&&define.amd?define(function(){return e(t,t.document)}):"object"==typeof exports?module.exports=t.document?e(t,t.document):function(t){return e(t,t.document)}:t.SVG=e(t,t.document)}("undefined"!=typeof window?window:this,function(t,e){function i(t,e,i,n){return i+n.replace(g.regex.dots," .")}function n(t){for(var e=t.slice(0),i=e.length;i--;)Array.isArray(e[i])&&(e[i]=n(e[i]));return e}function r(t,e){return t instanceof e}function s(t,e){return(t.matches||t.matchesSelector||t.msMatchesSelector||t.mozMatchesSelector||t.webkitMatchesSelector||t.oMatchesSelector).call(t,e)}function o(t){return t.toLowerCase().replace(/-(.)/g,function(t,e){return e.toUpperCase()})}function a(t){return t.charAt(0).toUpperCase()+t.slice(1)}function h(t){return 4==t.length?["#",t.substring(1,2),t.substring(1,2),t.substring(2,3),t.substring(2,3),t.substring(3,4),t.substring(3,4)].join(""):t}function u(t){var e=t.toString(16);return 1==e.length?"0"+e:e}function l(t,e,i){if(null==e||null==i){var n=t.bbox();null==e?e=n.width/n.height*i:null==i&&(i=n.height/n.width*e)}return{width:e,height:i}}function c(t,e,i){return{x:e*t.a+i*t.c+0,y:e*t.b+i*t.d+0}}function f(t){return{a:t[0],b:t[1],c:t[2],d:t[3],e:t[4],f:t[5]}}function d(t){return t instanceof g.Matrix||(t=new g.Matrix(t)),t}function p(t,e){t.cx=null==t.cx?e.bbox().cx:t.cx,t.cy=null==t.cy?e.bbox().cy:t.cy}function m(t){for(var e=0,i=t.length,n="";e<i;e++)n+=t[e][0],null!=t[e][1]&&(n+=t[e][1],null!=t[e][2]&&(n+=" ",n+=t[e][2],null!=t[e][3]&&(n+=" ",n+=t[e][3],n+=" ",n+=t[e][4],null!=t[e][5]&&(n+=" ",n+=t[e][5],n+=" ",n+=t[e][6],null!=t[e][7]&&(n+=" ",n+=t[e][7])))));return n+" "}function x(e){for(var i=e.childNodes.length-1;i>=0;i--)e.childNodes[i]instanceof t.SVGElement&&x(e.childNodes[i]);return g.adopt(e).id(g.eid(e.nodeName))}function y(t){return null==t.x&&(t.x=0,t.y=0,t.width=0,t.height=0),t.w=t.width,t.h=t.height,t.x2=t.x+t.width,t.y2=t.y+t.height,t.cx=t.x+t.width/2,t.cy=t.y+t.height/2,t}function v(t){var e=t.toString().match(g.regex.reference);if(e)return e[1]}var g=this.SVG=function(t){if(g.supported)return t=new g.Doc(t),g.parser.draw||g.prepare(),t};if(g.ns="http://www.w3.org/2000/svg",g.xmlns="http://www.w3.org/2000/xmlns/",g.xlink="http://www.w3.org/1999/xlink",g.svgjs="http://svgjs.com/svgjs",g.supported=function(){return!!e.createElementNS&&!!e.createElementNS(g.ns,"svg").createSVGRect}(),!g.supported)return!1;g.did=1e3,g.eid=function(t){return"Svgjs"+a(t)+g.did++},g.create=function(t){var i=e.createElementNS(this.ns,t);return i.setAttribute("id",this.eid(t)),i},g.extend=function(){var t,e,i,n;for(t=[].slice.call(arguments),e=t.pop(),n=t.length-1;n>=0;n--)if(t[n])for(i in e)t[n].prototype[i]=e[i];g.Set&&g.Set.inherit&&g.Set.inherit()},g.invent=function(t){var e="function"==typeof t.create?t.create:function(){this.constructor.call(this,g.create(t.create))};return t.inherit&&(e.prototype=new t.inherit),t.extend&&g.extend(e,t.extend),t.construct&&g.extend(t.parent||g.Container,t.construct),e},g.adopt=function(e){if(!e)return null;if(e.instance)return e.instance;var i;return i="svg"==e.nodeName?e.parentNode instanceof t.SVGElement?new g.Nested:new g.Doc:"linearGradient"==e.nodeName?new g.Gradient("linear"):"radialGradient"==e.nodeName?new g.Gradient("radial"):g[a(e.nodeName)]?new(g[a(e.nodeName)]):new g.Element(e),i.type=e.nodeName,i.node=e,e.instance=i,i instanceof g.Doc&&i.namespace().defs(),i.setData(JSON.parse(e.getAttribute("svgjs:data"))||{}),i},g.prepare=function(){var t=e.getElementsByTagName("body")[0],i=(t?new g.Doc(t):g.adopt(e.documentElement).nested()).size(2,0);g.parser={body:t||e.documentElement,draw:i.style("opacity:0;position:absolute;left:-100%;top:-100%;overflow:hidden").node,poly:i.polyline().node,path:i.path().node,native:g.create("svg")}},g.parser={native:g.create("svg")},e.addEventListener("DOMContentLoaded",function(){g.parser.draw||g.prepare()},!1),g.regex={numberAndUnit:/^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i,hex:/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,rgb:/rgb\((\d+),(\d+),(\d+)\)/,reference:/#([a-z0-9\-_]+)/i,transforms:/\)\s*,?\s*/,whitespace:/\s/g,isHex:/^#[a-f0-9]{3,6}$/i,isRgb:/^rgb\(/,isCss:/[^:]+:[^;]+;?/,isBlank:/^(\s+)?$/,isNumber:/^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,isPercent:/^-?[\d\.]+%$/,isImage:/\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i,delimiter:/[\s,]+/,hyphen:/([^e])\-/gi,pathLetters:/[MLHVCSQTAZ]/gi,isPathLetter:/[MLHVCSQTAZ]/i,numbersWithDots:/((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi,dots:/\./g},g.utils={map:function(t,e){var i,n=t.length,r=[];for(i=0;i<n;i++)r.push(e(t[i]));return r},filter:function(t,e){var i,n=t.length,r=[];for(i=0;i<n;i++)e(t[i])&&r.push(t[i]);return r},radians:function(t){return t%360*Math.PI/180},degrees:function(t){return 180*t/Math.PI%360},filterSVGElements:function(e){return this.filter(e,function(e){return e instanceof t.SVGElement})}},g.defaults={attrs:{"fill-opacity":1,"stroke-opacity":1,"stroke-width":0,"stroke-linejoin":"miter","stroke-linecap":"butt",fill:"#000000",stroke:"#000000",opacity:1,x:0,y:0,cx:0,cy:0,width:0,height:0,r:0,rx:0,ry:0,offset:0,"stop-opacity":1,"stop-color":"#000000","font-size":16,"font-family":"Helvetica, Arial, sans-serif","text-anchor":"start"}},g.Color=function(t){var e;this.r=0,this.g=0,this.b=0,t&&("string"==typeof t?g.regex.isRgb.test(t)?(e=g.regex.rgb.exec(t.replace(g.regex.whitespace,"")),this.r=parseInt(e[1]),this.g=parseInt(e[2]),this.b=parseInt(e[3])):g.regex.isHex.test(t)&&(e=g.regex.hex.exec(h(t)),this.r=parseInt(e[1],16),this.g=parseInt(e[2],16),this.b=parseInt(e[3],16)):"object"==typeof t&&(this.r=t.r,this.g=t.g,this.b=t.b))},g.extend(g.Color,{toString:function(){return this.toHex()},toHex:function(){return"#"+u(this.r)+u(this.g)+u(this.b)},toRgb:function(){return"rgb("+[this.r,this.g,this.b].join()+")"},brightness:function(){return this.r/255*.3+this.g/255*.59+this.b/255*.11},morph:function(t){return this.destination=new g.Color(t),this},at:function(t){return this.destination?(t=t<0?0:t>1?1:t,new g.Color({r:~~(this.r+(this.destination.r-this.r)*t),g:~~(this.g+(this.destination.g-this.g)*t),b:~~(this.b+(this.destination.b-this.b)*t)})):this}}),g.Color.test=function(t){return t+="",g.regex.isHex.test(t)||g.regex.isRgb.test(t)},g.Color.isRgb=function(t){return t&&"number"==typeof t.r&&"number"==typeof t.g&&"number"==typeof t.b},g.Color.isColor=function(t){return g.Color.isRgb(t)||g.Color.test(t)},g.Array=function(t,e){t=(t||[]).valueOf(),0==t.length&&e&&(t=e.valueOf()),this.value=this.parse(t)},g.extend(g.Array,{morph:function(t){if(this.destination=this.parse(t),this.value.length!=this.destination.length){for(var e=this.value[this.value.length-1],i=this.destination[this.destination.length-1];this.value.length>this.destination.length;)this.destination.push(i);for(;this.value.length<this.destination.length;)this.value.push(e)}return this},settle:function(){for(var t=0,e=this.value.length,i=[];t<e;t++)-1==i.indexOf(this.value[t])&&i.push(this.value[t]);return this.value=i},at:function(t){if(!this.destination)return this;for(var e=0,i=this.value.length,n=[];e<i;e++)n.push(this.value[e]+(this.destination[e]-this.value[e])*t);return new g.Array(n)},toString:function(){return this.value.join(" ")},valueOf:function(){return this.value},parse:function(t){return t=t.valueOf(),Array.isArray(t)?t:this.split(t)},split:function(t){return t.trim().split(g.regex.delimiter).map(parseFloat)},reverse:function(){return this.value.reverse(),this},clone:function(){var t=new this.constructor;return t.value=n(this.value),t}}),g.PointArray=function(t,e){g.Array.call(this,t,e||[[0,0]])},g.PointArray.prototype=new g.Array,g.PointArray.prototype.constructor=g.PointArray,g.extend(g.PointArray,{toString:function(){for(var t=0,e=this.value.length,i=[];t<e;t++)i.push(this.value[t].join(","));return i.join(" ")},toLine:function(){return{x1:this.value[0][0],y1:this.value[0][1],x2:this.value[1][0],y2:this.value[1][1]}},at:function(t){if(!this.destination)return this;for(var e=0,i=this.value.length,n=[];e<i;e++)n.push([this.value[e][0]+(this.destination[e][0]-this.value[e][0])*t,this.value[e][1]+(this.destination[e][1]-this.value[e][1])*t]);return new g.PointArray(n)},parse:function(t){var e=[];if(t=t.valueOf(),Array.isArray(t)){if(Array.isArray(t[0]))return t}else t=t.trim().split(g.regex.delimiter).map(parseFloat);t.length%2!=0&&t.pop();for(var i=0,n=t.length;i<n;i+=2)e.push([t[i],t[i+1]]);return e},move:function(t,e){var i=this.bbox();if(t-=i.x,e-=i.y,!isNaN(t)&&!isNaN(e))for(var n=this.value.length-1;n>=0;n--)this.value[n]=[this.value[n][0]+t,this.value[n][1]+e];return this},size:function(t,e){var i,n=this.bbox();for(i=this.value.length-1;i>=0;i--)n.width&&(this.value[i][0]=(this.value[i][0]-n.x)*t/n.width+n.x),n.height&&(this.value[i][1]=(this.value[i][1]-n.y)*e/n.height+n.y);return this},bbox:function(){return g.parser.poly.setAttribute("points",this.toString()),g.parser.poly.getBBox()}});for(var w={M:function(t,e,i){return e.x=i.x=t[0],e.y=i.y=t[1],["M",e.x,e.y]},L:function(t,e){return e.x=t[0],e.y=t[1],["L",t[0],t[1]]},H:function(t,e){return e.x=t[0],["H",t[0]]},V:function(t,e){return e.y=t[0],["V",t[0]]},C:function(t,e){return e.x=t[4],e.y=t[5],["C",t[0],t[1],t[2],t[3],t[4],t[5]]},S:function(t,e){return e.x=t[2],e.y=t[3],["S",t[0],t[1],t[2],t[3]]},Q:function(t,e){return e.x=t[2],e.y=t[3],["Q",t[0],t[1],t[2],t[3]]},T:function(t,e){return e.x=t[0],e.y=t[1],["T",t[0],t[1]]},Z:function(t,e,i){return e.x=i.x,e.y=i.y,["Z"]},A:function(t,e){return e.x=t[5],e.y=t[6],["A",t[0],t[1],t[2],t[3],t[4],t[5],t[6]]}},b="mlhvqtcsaz".split(""),C=0,N=b.length;C<N;++C)w[b[C]]=function(t){return function(e,i,n){if("H"==t)e[0]=e[0]+i.x;else if("V"==t)e[0]=e[0]+i.y;else if("A"==t)e[5]=e[5]+i.x,e[6]=e[6]+i.y;else for(var r=0,s=e.length;r<s;++r)e[r]=e[r]+(r%2?i.y:i.x);return w[t](e,i,n)}}(b[C].toUpperCase());g.PathArray=function(t,e){g.Array.call(this,t,e||[["M",0,0]])},g.PathArray.prototype=new g.Array,g.PathArray.prototype.constructor=g.PathArray,g.extend(g.PathArray,{toString:function(){return m(this.value)},move:function(t,e){var i=this.bbox();if(t-=i.x,e-=i.y,!isNaN(t)&&!isNaN(e))for(var n,r=this.value.length-1;r>=0;r--)n=this.value[r][0],"M"==n||"L"==n||"T"==n?(this.value[r][1]+=t,this.value[r][2]+=e):"H"==n?this.value[r][1]+=t:"V"==n?this.value[r][1]+=e:"C"==n||"S"==n||"Q"==n?(this.value[r][1]+=t,this.value[r][2]+=e,this.value[r][3]+=t,this.value[r][4]+=e,"C"==n&&(this.value[r][5]+=t,this.value[r][6]+=e)):"A"==n&&(this.value[r][6]+=t,this.value[r][7]+=e);return this},size:function(t,e){var i,n,r=this.bbox();for(i=this.value.length-1;i>=0;i--)n=this.value[i][0],"M"==n||"L"==n||"T"==n?(this.value[i][1]=(this.value[i][1]-r.x)*t/r.width+r.x,this.value[i][2]=(this.value[i][2]-r.y)*e/r.height+r.y):"H"==n?this.value[i][1]=(this.value[i][1]-r.x)*t/r.width+r.x:"V"==n?this.value[i][1]=(this.value[i][1]-r.y)*e/r.height+r.y:"C"==n||"S"==n||"Q"==n?(this.value[i][1]=(this.value[i][1]-r.x)*t/r.width+r.x,this.value[i][2]=(this.value[i][2]-r.y)*e/r.height+r.y,this.value[i][3]=(this.value[i][3]-r.x)*t/r.width+r.x,this.value[i][4]=(this.value[i][4]-r.y)*e/r.height+r.y,"C"==n&&(this.value[i][5]=(this.value[i][5]-r.x)*t/r.width+r.x,this.value[i][6]=(this.value[i][6]-r.y)*e/r.height+r.y)):"A"==n&&(this.value[i][1]=this.value[i][1]*t/r.width,this.value[i][2]=this.value[i][2]*e/r.height,this.value[i][6]=(this.value[i][6]-r.x)*t/r.width+r.x,this.value[i][7]=(this.value[i][7]-r.y)*e/r.height+r.y);return this},equalCommands:function(t){var e,i,n;for(t=new g.PathArray(t),n=this.value.length===t.value.length,e=0,i=this.value.length;n&&e<i;e++)n=this.value[e][0]===t.value[e][0];return n},morph:function(t){return t=new g.PathArray(t),this.equalCommands(t)?this.destination=t:this.destination=null,this},at:function(t){if(!this.destination)return this;var e,i,n,r,s=this.value,o=this.destination.value,a=[],h=new g.PathArray;for(e=0,i=s.length;e<i;e++){for(a[e]=[s[e][0]],n=1,r=s[e].length;n<r;n++)a[e][n]=s[e][n]+(o[e][n]-s[e][n])*t;"A"===a[e][0]&&(a[e][4]=+(0!=a[e][4]),a[e][5]=+(0!=a[e][5]))}return h.value=a,h},parse:function(t){if(t instanceof g.PathArray)return t.valueOf();var e,n,r={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};t="string"==typeof t?t.replace(g.regex.numbersWithDots,i).replace(g.regex.pathLetters," $& ").replace(g.regex.hyphen,"$1 -").trim().split(g.regex.delimiter):t.reduce(function(t,e){return[].concat.call(t,e)},[]);var n=[],s=new g.Point,o=new g.Point,a=0,h=t.length;do{g.regex.isPathLetter.test(t[a])?(e=t[a],++a):"M"==e?e="L":"m"==e&&(e="l"),n.push(w[e].call(null,t.slice(a,a+=r[e.toUpperCase()]).map(parseFloat),s,o))}while(h>a);return n},bbox:function(){return g.parser.path.setAttribute("d",this.toString()),g.parser.path.getBBox()}}),g.Number=g.invent({create:function(t,e){this.value=0,this.unit=e||"","number"==typeof t?this.value=isNaN(t)?0:isFinite(t)?t:t<0?-3.4e38:3.4e38:"string"==typeof t?(e=t.match(g.regex.numberAndUnit))&&(this.value=parseFloat(e[1]),"%"==e[5]?this.value/=100:"s"==e[5]&&(this.value*=1e3),this.unit=e[5]):t instanceof g.Number&&(this.value=t.valueOf(),this.unit=t.unit)},extend:{toString:function(){return("%"==this.unit?~~(1e8*this.value)/1e6:"s"==this.unit?this.value/1e3:this.value)+this.unit},toJSON:function(){return this.toString()},valueOf:function(){return this.value},plus:function(t){return t=new g.Number(t),new g.Number(this+t,this.unit||t.unit)},minus:function(t){return t=new g.Number(t),new g.Number(this-t,this.unit||t.unit)},times:function(t){return t=new g.Number(t),new g.Number(this*t,this.unit||t.unit)},divide:function(t){return t=new g.Number(t),new g.Number(this/t,this.unit||t.unit)},to:function(t){var e=new g.Number(this);return"string"==typeof t&&(e.unit=t),e},morph:function(t){return this.destination=new g.Number(t),t.relative&&(this.destination.value+=this.value),this},at:function(t){return this.destination?new g.Number(this.destination).minus(this).times(t).plus(this):this}}}),g.Element=g.invent({create:function(t){this._stroke=g.defaults.attrs.stroke,this._event=null,this.dom={},(this.node=t)&&(this.type=t.nodeName,this.node.instance=this,this._stroke=t.getAttribute("stroke")||this._stroke)},extend:{x:function(t){return this.attr("x",t)},y:function(t){return this.attr("y",t)},cx:function(t){return null==t?this.x()+this.width()/2:this.x(t-this.width()/2)},cy:function(t){return null==t?this.y()+this.height()/2:this.y(t-this.height()/2)},move:function(t,e){return this.x(t).y(e)},center:function(t,e){return this.cx(t).cy(e)},width:function(t){return this.attr("width",t)},height:function(t){return this.attr("height",t)},size:function(t,e){var i=l(this,t,e);return this.width(new g.Number(i.width)).height(new g.Number(i.height))},clone:function(t,e){this.writeDataToDom();var i=x(this.node.cloneNode(!0));return t?t.add(i):this.after(i),i},remove:function(){return this.parent()&&this.parent().removeElement(this),this},replace:function(t){return this.after(t).remove(),t},addTo:function(t){return t.put(this)},putIn:function(t){return t.add(this)},id:function(t){return this.attr("id",t)},inside:function(t,e){var i=this.bbox();return t>i.x&&e>i.y&&t<i.x+i.width&&e<i.y+i.height},show:function(){return this.style("display","")},hide:function(){return this.style("display","none")},visible:function(){return"none"!=this.style("display")},toString:function(){return this.attr("id")},classes:function(){var t=this.attr("class");return null==t?[]:t.trim().split(g.regex.delimiter)},hasClass:function(t){return-1!=this.classes().indexOf(t)},addClass:function(t){if(!this.hasClass(t)){var e=this.classes();e.push(t),this.attr("class",e.join(" "))}return this},removeClass:function(t){return this.hasClass(t)&&this.attr("class",this.classes().filter(function(e){return e!=t}).join(" ")),this},toggleClass:function(t){return this.hasClass(t)?this.removeClass(t):this.addClass(t)},reference:function(t){return g.get(this.attr(t))},parent:function(e){var i=this;if(!i.node.parentNode)return null;if(i=g.adopt(i.node.parentNode),!e)return i;for(;i&&i.node instanceof t.SVGElement;){if("string"==typeof e?i.matches(e):i instanceof e)return i;if("#document"==i.node.parentNode.nodeName)return null;i=g.adopt(i.node.parentNode)}},doc:function(){return this instanceof g.Doc?this:this.parent(g.Doc)},parents:function(t){var e=[],i=this;do{if(!(i=i.parent(t))||!i.node)break;e.push(i)}while(i.parent);return e},matches:function(t){return s(this.node,t)},native:function(){return this.node},svg:function(t){var i=e.createElement("svg");if(!(t&&this instanceof g.Parent))return i.appendChild(t=e.createElement("svg")),this.writeDataToDom(),t.appendChild(this.node.cloneNode(!0)),i.innerHTML.replace(/^<svg>/,"").replace(/<\/svg>$/,"");i.innerHTML="<svg>"+t.replace(/\n/,"").replace(/<(\w+)([^<]+?)\/>/g,"<$1$2></$1>")+"</svg>";for(var n=0,r=i.firstChild.childNodes.length;n<r;n++)this.node.appendChild(i.firstChild.firstChild);return this},writeDataToDom:function(){if(this.each||this.lines){(this.each?this:this.lines()).each(function(){this.writeDataToDom()})}return this.node.removeAttribute("svgjs:data"),Object.keys(this.dom).length&&this.node.setAttribute("svgjs:data",JSON.stringify(this.dom)),this},setData:function(t){return this.dom=t,this},is:function(t){return r(this,t)}}}),g.easing={"-":function(t){return t},"<>":function(t){return-Math.cos(t*Math.PI)/2+.5},">":function(t){return Math.sin(t*Math.PI/2)},"<":function(t){return 1-Math.cos(t*Math.PI/2)}},g.morph=function(t){return function(e,i){return new g.MorphObj(e,i).at(t)}},g.Situation=g.invent({create:function(t){this.init=!1,this.reversed=!1,this.reversing=!1,this.duration=new g.Number(t.duration).valueOf(),this.delay=new g.Number(t.delay).valueOf(),this.start=+new Date+this.delay,this.finish=this.start+this.duration,this.ease=t.ease,this.loop=0,this.loops=!1,this.animations={},this.attrs={},this.styles={},this.transforms=[],this.once={}}}),g.FX=g.invent({create:function(t){this._target=t,this.situations=[],this.active=!1,this.situation=null,this.paused=!1,this.lastPos=0,this.pos=0,this.absPos=0,this._speed=1},extend:{animate:function(t,e,i){"object"==typeof t&&(e=t.ease,i=t.delay,t=t.duration);var n=new g.Situation({duration:t||1e3,delay:i||0,ease:g.easing[e||"-"]||e});return this.queue(n),this},delay:function(t){var e=new g.Situation({duration:t,delay:0,ease:g.easing["-"]});return this.queue(e)},target:function(t){return t&&t instanceof g.Element?(this._target=t,this):this._target},timeToAbsPos:function(t){return(t-this.situation.start)/(this.situation.duration/this._speed)},absPosToTime:function(t){return this.situation.duration/this._speed*t+this.situation.start},startAnimFrame:function(){this.stopAnimFrame(),this.animationFrame=t.requestAnimationFrame(function(){this.step()}.bind(this))},stopAnimFrame:function(){t.cancelAnimationFrame(this.animationFrame)},start:function(){return!this.active&&this.situation&&(this.active=!0,this.startCurrent()),this},startCurrent:function(){return this.situation.start=+new Date+this.situation.delay/this._speed,this.situation.finish=this.situation.start+this.situation.duration/this._speed,this.initAnimations().step()},queue:function(t){return("function"==typeof t||t instanceof g.Situation)&&this.situations.push(t),this.situation||(this.situation=this.situations.shift()),this},dequeue:function(){return this.stop(),this.situation=this.situations.shift(),this.situation&&(this.situation instanceof g.Situation?this.start():this.situation.call(this)),this},initAnimations:function(){var t,e,i,n=this.situation;if(n.init)return this;for(t in n.animations)for(i=this.target()[t](),Array.isArray(i)||(i=[i]),Array.isArray(n.animations[t])||(n.animations[t]=[n.animations[t]]),e=i.length;e--;)n.animations[t][e]instanceof g.Number&&(i[e]=new g.Number(i[e])),n.animations[t][e]=i[e].morph(n.animations[t][e]);for(t in n.attrs)n.attrs[t]=new g.MorphObj(this.target().attr(t),n.attrs[t]);for(t in n.styles)n.styles[t]=new g.MorphObj(this.target().style(t),n.styles[t]);return n.initialTransformation=this.target().matrixify(),n.init=!0,this},clearQueue:function(){return this.situations=[],this},clearCurrent:function(){return this.situation=null,this},stop:function(t,e){var i=this.active;return this.active=!1,e&&this.clearQueue(),t&&this.situation&&(!i&&this.startCurrent(),this.atEnd()),this.stopAnimFrame(),this.clearCurrent()},reset:function(){if(this.situation){var t=this.situation;this.stop(),this.situation=t,this.atStart()}return this},finish:function(){for(this.stop(!0,!1);this.dequeue().situation&&this.stop(!0,!1););return this.clearQueue().clearCurrent(),this},atStart:function(){return this.at(0,!0)},atEnd:function(){return!0===this.situation.loops&&(this.situation.loops=this.situation.loop+1),"number"==typeof this.situation.loops?this.at(this.situation.loops,!0):this.at(1,!0)},at:function(t,e){var i=this.situation.duration/this._speed;return this.absPos=t,e||(this.situation.reversed&&(this.absPos=1-this.absPos),this.absPos+=this.situation.loop),this.situation.start=+new Date-this.absPos*i,this.situation.finish=this.situation.start+i,this.step(!0)},speed:function(t){return 0===t?this.pause():t?(this._speed=t,this.at(this.absPos,!0)):this._speed},loop:function(t,e){var i=this.last();return i.loops=null==t||t,i.loop=0,e&&(i.reversing=!0),this},pause:function(){return this.paused=!0,this.stopAnimFrame(),this},play:function(){return this.paused?(this.paused=!1,this.at(this.absPos,!0)):this},reverse:function(t){var e=this.last();return e.reversed=void 0===t?!e.reversed:t,this},progress:function(t){return t?this.situation.ease(this.pos):this.pos},after:function(t){var e=this.last(),i=function i(n){n.detail.situation==e&&(t.call(this,e),this.off("finished.fx",i))};return this.target().on("finished.fx",i),this._callStart()},during:function(t){var e=this.last(),i=function(i){i.detail.situation==e&&t.call(this,i.detail.pos,g.morph(i.detail.pos),i.detail.eased,e)};return this.target().off("during.fx",i).on("during.fx",i),this.after(function(){this.off("during.fx",i)}),this._callStart()},afterAll:function(t){var e=function e(i){t.call(this),this.off("allfinished.fx",e)};return this.target().off("allfinished.fx",e).on("allfinished.fx",e),this._callStart()},duringAll:function(t){var e=function(e){t.call(this,e.detail.pos,g.morph(e.detail.pos),e.detail.eased,e.detail.situation)};return this.target().off("during.fx",e).on("during.fx",e),this.afterAll(function(){this.off("during.fx",e)}),this._callStart()},last:function(){return this.situations.length?this.situations[this.situations.length-1]:this.situation},add:function(t,e,i){return this.last()[i||"animations"][t]=e,this._callStart()},step:function(t){if(t||(this.absPos=this.timeToAbsPos(+new Date)),!1!==this.situation.loops){var e,i,n;e=Math.max(this.absPos,0),i=Math.floor(e),!0===this.situation.loops||i<this.situation.loops?(this.pos=e-i,n=this.situation.loop,this.situation.loop=i):(this.absPos=this.situation.loops,this.pos=1,n=this.situation.loop-1,this.situation.loop=this.situation.loops),this.situation.reversing&&(this.situation.reversed=this.situation.reversed!=Boolean((this.situation.loop-n)%2))}else this.absPos=Math.min(this.absPos,1),this.pos=this.absPos;this.pos<0&&(this.pos=0),this.situation.reversed&&(this.pos=1-this.pos);var r=this.situation.ease(this.pos);for(var s in this.situation.once)s>this.lastPos&&s<=r&&(this.situation.once[s].call(this.target(),this.pos,r),delete this.situation.once[s]);return this.active&&this.target().fire("during",{pos:this.pos,eased:r,fx:this,situation:this.situation}),this.situation?(this.eachAt(),1==this.pos&&!this.situation.reversed||this.situation.reversed&&0==this.pos?(this.stopAnimFrame(),this.target().fire("finished",{fx:this,situation:this.situation}),this.situations.length||(this.target().fire("allfinished"),this.situations.length||(this.target().off(".fx"),this.active=!1)),this.active?this.dequeue():this.clearCurrent()):!this.paused&&this.active&&this.startAnimFrame(),this.lastPos=r,this):this},eachAt:function(){var t,e,i,n=this,r=this.target(),s=this.situation;for(t in s.animations)i=[].concat(s.animations[t]).map(function(t){return"string"!=typeof t&&t.at?t.at(s.ease(n.pos),n.pos):t}),r[t].apply(r,i);for(t in s.attrs)i=[t].concat(s.attrs[t]).map(function(t){return"string"!=typeof t&&t.at?t.at(s.ease(n.pos),n.pos):t}),r.attr.apply(r,i);for(t in s.styles)i=[t].concat(s.styles[t]).map(function(t){return"string"!=typeof t&&t.at?t.at(s.ease(n.pos),n.pos):t}),r.style.apply(r,i);if(s.transforms.length){for(i=s.initialTransformation,t=0,e=s.transforms.length;t<e;t++){var o=s.transforms[t];o instanceof g.Matrix?i=o.relative?i.multiply((new g.Matrix).morph(o).at(s.ease(this.pos))):i.morph(o).at(s.ease(this.pos)):(o.relative||o.undo(i.extract()),i=i.multiply(o.at(s.ease(this.pos))))}r.matrix(i)}return this},once:function(t,e,i){var n=this.last();return i||(t=n.ease(t)),n.once[t]=e,this},_callStart:function(){return setTimeout(function(){this.start()}.bind(this),0),this}},parent:g.Element,construct:{animate:function(t,e,i){return(this.fx||(this.fx=new g.FX(this))).animate(t,e,i)},delay:function(t){return(this.fx||(this.fx=new g.FX(this))).delay(t)},stop:function(t,e){return this.fx&&this.fx.stop(t,e),this},finish:function(){return this.fx&&this.fx.finish(),this},pause:function(){return this.fx&&this.fx.pause(),this},play:function(){return this.fx&&this.fx.play(),this},speed:function(t){if(this.fx){if(null==t)return this.fx.speed();this.fx.speed(t)}return this}}}),g.MorphObj=g.invent({create:function(t,e){return g.Color.isColor(e)?new g.Color(t).morph(e):g.regex.delimiter.test(t)?new g.Array(t).morph(e):g.regex.numberAndUnit.test(e)?new g.Number(t).morph(e):(this.value=t,void(this.destination=e))},extend:{at:function(t,e){return e<1?this.value:this.destination},valueOf:function(){return this.value}}}),g.extend(g.FX,{attr:function(t,e,i){if("object"==typeof t)for(var n in t)this.attr(n,t[n]);else this.add(t,e,"attrs");return this},style:function(t,e){if("object"==typeof t)for(var i in t)this.style(i,t[i]);else this.add(t,e,"styles");return this},x:function(t,e){if(this.target()instanceof g.G)return this.transform({x:t},e),this;var i=new g.Number(t);return i.relative=e,this.add("x",i)},y:function(t,e){if(this.target()instanceof g.G)return this.transform({y:t},e),this;var i=new g.Number(t);return i.relative=e,this.add("y",i)},cx:function(t){return this.add("cx",new g.Number(t))},cy:function(t){return this.add("cy",new g.Number(t))},move:function(t,e){return this.x(t).y(e)},center:function(t,e){return this.cx(t).cy(e)},size:function(t,e){if(this.target()instanceof g.Text)this.attr("font-size",t);else{var i;t&&e||(i=this.target().bbox()),t||(t=i.width/i.height*e),e||(e=i.height/i.width*t),this.add("width",new g.Number(t)).add("height",new g.Number(e))}return this},width:function(t){return this.add("width",new g.Number(t))},height:function(t){return this.add("height",new g.Number(t))},plot:function(t,e,i,n){return 4==arguments.length?this.plot([t,e,i,n]):this.add("plot",new(this.target().morphArray)(t))},leading:function(t){return this.target().leading?this.add("leading",new g.Number(t)):this},viewbox:function(t,e,i,n){return this.target()instanceof g.Container&&this.add("viewbox",new g.ViewBox(t,e,i,n)),this},update:function(t){if(this.target()instanceof g.Stop){if("number"==typeof t||t instanceof g.Number)return this.update({offset:arguments[0],color:arguments[1],opacity:arguments[2]});null!=t.opacity&&this.attr("stop-opacity",t.opacity),null!=t.color&&this.attr("stop-color",t.color),null!=t.offset&&this.attr("offset",t.offset)}return this}}),g.Box=g.invent({create:function(t,e,i,n){if(!("object"!=typeof t||t instanceof g.Element))return g.Box.call(this,null!=t.left?t.left:t.x,null!=t.top?t.top:t.y,t.width,t.height);4==arguments.length&&(this.x=t,this.y=e,this.width=i,this.height=n),y(this)},extend:{merge:function(t){var e=new this.constructor;return e.x=Math.min(this.x,t.x),e.y=Math.min(this.y,t.y),e.width=Math.max(this.x+this.width,t.x+t.width)-e.x,e.height=Math.max(this.y+this.height,t.y+t.height)-e.y,y(e)},transform:function(t){var e,i=1/0,n=-1/0,r=1/0,s=-1/0;return[new g.Point(this.x,this.y),new g.Point(this.x2,this.y),new g.Point(this.x,this.y2),new g.Point(this.x2,this.y2)].forEach(function(e){e=e.transform(t),i=Math.min(i,e.x),n=Math.max(n,e.x),r=Math.min(r,e.y),s=Math.max(s,e.y)}),e=new this.constructor,e.x=i,e.width=n-i,e.y=r,e.height=s-r,y(e),e}}}),g.BBox=g.invent({create:function(t){if(g.Box.apply(this,[].slice.call(arguments)),t instanceof g.Element){var i;try{if(e.documentElement.contains){if(!e.documentElement.contains(t.node))throw new Exception("Element not in the dom")}else{for(var n=t.node;n.parentNode;)n=n.parentNode;if(n!=e)throw new Exception("Element not in the dom")}i=t.node.getBBox()}catch(e){if(t instanceof g.Shape){var r=t.clone(g.parser.draw.instance).show();i=r.node.getBBox(),r.remove()}else i={x:t.node.clientLeft,y:t.node.clientTop,width:t.node.clientWidth,height:t.node.clientHeight}}g.Box.call(this,i)}},inherit:g.Box,parent:g.Element,construct:{bbox:function(){return new g.BBox(this)}}}),g.BBox.prototype.constructor=g.BBox,g.extend(g.Element,{tbox:function(){return console.warn("Use of TBox is deprecated and mapped to RBox. Use .rbox() instead."),this.rbox(this.doc())}}),g.RBox=g.invent({create:function(t){g.Box.apply(this,[].slice.call(arguments)),t instanceof g.Element&&g.Box.call(this,t.node.getBoundingClientRect())},inherit:g.Box,parent:g.Element,extend:{addOffset:function(){return this.x+=t.pageXOffset,this.y+=t.pageYOffset,this}},construct:{rbox:function(t){return t?new g.RBox(this).transform(t.screenCTM().inverse()):new g.RBox(this).addOffset()}}}),g.RBox.prototype.constructor=g.RBox,g.Matrix=g.invent({create:function(t){var e,i=f([1,0,0,1,0,0]);for(t=t instanceof g.Element?t.matrixify():"string"==typeof t?f(t.split(g.regex.delimiter).map(parseFloat)):6==arguments.length?f([].slice.call(arguments)):Array.isArray(t)?f(t):"object"==typeof t?t:i,e=M.length-1;e>=0;--e)this[M[e]]=null!=t[M[e]]?t[M[e]]:i[M[e]]},extend:{extract:function(){var t=c(this,0,1),e=c(this,1,0),i=180/Math.PI*Math.atan2(t.y,t.x)-90;return{x:this.e,y:this.f,transformedX:(this.e*Math.cos(i*Math.PI/180)+this.f*Math.sin(i*Math.PI/180))/Math.sqrt(this.a*this.a+this.b*this.b),transformedY:(this.f*Math.cos(i*Math.PI/180)+this.e*Math.sin(-i*Math.PI/180))/Math.sqrt(this.c*this.c+this.d*this.d),skewX:-i,skewY:180/Math.PI*Math.atan2(e.y,e.x),scaleX:Math.sqrt(this.a*this.a+this.b*this.b),scaleY:Math.sqrt(this.c*this.c+this.d*this.d),rotation:i,a:this.a,b:this.b,c:this.c,d:this.d,e:this.e,f:this.f,matrix:new g.Matrix(this)}},clone:function(){return new g.Matrix(this)},morph:function(t){return this.destination=new g.Matrix(t),this},at:function(t){return this.destination?new g.Matrix({a:this.a+(this.destination.a-this.a)*t,b:this.b+(this.destination.b-this.b)*t,c:this.c+(this.destination.c-this.c)*t,d:this.d+(this.destination.d-this.d)*t,e:this.e+(this.destination.e-this.e)*t,f:this.f+(this.destination.f-this.f)*t}):this},multiply:function(t){return new g.Matrix(this.native().multiply(d(t).native()))},inverse:function(){return new g.Matrix(this.native().inverse())},translate:function(t,e){return new g.Matrix(this.native().translate(t||0,e||0))},scale:function(t,e,i,n){return 1==arguments.length?e=t:3==arguments.length&&(n=i,i=e,e=t),this.around(i,n,new g.Matrix(t,0,0,e,0,0))},rotate:function(t,e,i){return t=g.utils.radians(t),this.around(e,i,new g.Matrix(Math.cos(t),Math.sin(t),-Math.sin(t),Math.cos(t),0,0))},flip:function(t,e){return"x"==t?this.scale(-1,1,e,0):"y"==t?this.scale(1,-1,0,e):this.scale(-1,-1,t,null!=e?e:t)},skew:function(t,e,i,n){return 1==arguments.length?e=t:3==arguments.length&&(n=i,i=e,e=t),t=g.utils.radians(t),e=g.utils.radians(e),this.around(i,n,new g.Matrix(1,Math.tan(e),Math.tan(t),1,0,0))},skewX:function(t,e,i){return this.skew(t,0,e,i)},skewY:function(t,e,i){return this.skew(0,t,e,i)},around:function(t,e,i){
return this.multiply(new g.Matrix(1,0,0,1,t||0,e||0)).multiply(i).multiply(new g.Matrix(1,0,0,1,-t||0,-e||0))},native:function(){for(var t=g.parser.native.createSVGMatrix(),e=M.length-1;e>=0;e--)t[M[e]]=this[M[e]];return t},toString:function(){return"matrix("+this.a+","+this.b+","+this.c+","+this.d+","+this.e+","+this.f+")"}},parent:g.Element,construct:{ctm:function(){return new g.Matrix(this.node.getCTM())},screenCTM:function(){if(this instanceof g.Nested){var t=this.rect(1,1),e=t.node.getScreenCTM();return t.remove(),new g.Matrix(e)}return new g.Matrix(this.node.getScreenCTM())}}}),g.Point=g.invent({create:function(t,e){var i,n={x:0,y:0};i=Array.isArray(t)?{x:t[0],y:t[1]}:"object"==typeof t?{x:t.x,y:t.y}:null!=t?{x:t,y:null!=e?e:t}:n,this.x=i.x,this.y=i.y},extend:{clone:function(){return new g.Point(this)},morph:function(t,e){return this.destination=new g.Point(t,e),this},at:function(t){return this.destination?new g.Point({x:this.x+(this.destination.x-this.x)*t,y:this.y+(this.destination.y-this.y)*t}):this},native:function(){var t=g.parser.native.createSVGPoint();return t.x=this.x,t.y=this.y,t},transform:function(t){return new g.Point(this.native().matrixTransform(t.native()))}}}),g.extend(g.Element,{point:function(t,e){return new g.Point(t,e).transform(this.screenCTM().inverse())}}),g.extend(g.Element,{attr:function(t,e,i){if(null==t){for(t={},e=this.node.attributes,i=e.length-1;i>=0;i--)t[e[i].nodeName]=g.regex.isNumber.test(e[i].nodeValue)?parseFloat(e[i].nodeValue):e[i].nodeValue;return t}if("object"==typeof t)for(e in t)this.attr(e,t[e]);else if(null===e)this.node.removeAttribute(t);else{if(null==e)return e=this.node.getAttribute(t),null==e?g.defaults.attrs[t]:g.regex.isNumber.test(e)?parseFloat(e):e;"stroke-width"==t?this.attr("stroke",parseFloat(e)>0?this._stroke:null):"stroke"==t&&(this._stroke=e),"fill"!=t&&"stroke"!=t||(g.regex.isImage.test(e)&&(e=this.doc().defs().image(e,0,0)),e instanceof g.Image&&(e=this.doc().defs().pattern(0,0,function(){this.add(e)}))),"number"==typeof e?e=new g.Number(e):g.Color.isColor(e)?e=new g.Color(e):Array.isArray(e)&&(e=new g.Array(e)),"leading"==t?this.leading&&this.leading(e):"string"==typeof i?this.node.setAttributeNS(i,t,e.toString()):this.node.setAttribute(t,e.toString()),!this.rebuild||"font-size"!=t&&"x"!=t||this.rebuild(t,e)}return this}}),g.extend(g.Element,{transform:function(t,e){var i,n,r=this;if("object"!=typeof t)return i=new g.Matrix(r).extract(),"string"==typeof t?i[t]:i;if(i=new g.Matrix(r),e=!!e||!!t.relative,null!=t.a)i=e?i.multiply(new g.Matrix(t)):new g.Matrix(t);else if(null!=t.rotation)p(t,r),i=e?i.rotate(t.rotation,t.cx,t.cy):i.rotate(t.rotation-i.extract().rotation,t.cx,t.cy);else if(null!=t.scale||null!=t.scaleX||null!=t.scaleY){if(p(t,r),t.scaleX=null!=t.scale?t.scale:null!=t.scaleX?t.scaleX:1,t.scaleY=null!=t.scale?t.scale:null!=t.scaleY?t.scaleY:1,!e){var s=i.extract();t.scaleX=1*t.scaleX/s.scaleX,t.scaleY=1*t.scaleY/s.scaleY}i=i.scale(t.scaleX,t.scaleY,t.cx,t.cy)}else if(null!=t.skew||null!=t.skewX||null!=t.skewY){if(p(t,r),t.skewX=null!=t.skew?t.skew:null!=t.skewX?t.skewX:0,t.skewY=null!=t.skew?t.skew:null!=t.skewY?t.skewY:0,!e){var s=i.extract();i=i.multiply((new g.Matrix).skew(s.skewX,s.skewY,t.cx,t.cy).inverse())}i=i.skew(t.skewX,t.skewY,t.cx,t.cy)}else t.flip?("x"==t.flip||"y"==t.flip?t.offset=null==t.offset?r.bbox()["c"+t.flip]:t.offset:null==t.offset?(n=r.bbox(),t.flip=n.cx,t.offset=n.cy):t.flip=t.offset,i=(new g.Matrix).flip(t.flip,t.offset)):null==t.x&&null==t.y||(e?i=i.translate(t.x,t.y):(null!=t.x&&(i.e=t.x),null!=t.y&&(i.f=t.y)));return this.attr("transform",i)}}),g.extend(g.FX,{transform:function(t,e){var i,n,r=this.target();return"object"!=typeof t?(i=new g.Matrix(r).extract(),"string"==typeof t?i[t]:i):(e=!!e||!!t.relative,null!=t.a?i=new g.Matrix(t):null!=t.rotation?(p(t,r),i=new g.Rotate(t.rotation,t.cx,t.cy)):null!=t.scale||null!=t.scaleX||null!=t.scaleY?(p(t,r),t.scaleX=null!=t.scale?t.scale:null!=t.scaleX?t.scaleX:1,t.scaleY=null!=t.scale?t.scale:null!=t.scaleY?t.scaleY:1,i=new g.Scale(t.scaleX,t.scaleY,t.cx,t.cy)):null!=t.skewX||null!=t.skewY?(p(t,r),t.skewX=null!=t.skewX?t.skewX:0,t.skewY=null!=t.skewY?t.skewY:0,i=new g.Skew(t.skewX,t.skewY,t.cx,t.cy)):t.flip?("x"==t.flip||"y"==t.flip?t.offset=null==t.offset?r.bbox()["c"+t.flip]:t.offset:null==t.offset?(n=r.bbox(),t.flip=n.cx,t.offset=n.cy):t.flip=t.offset,i=(new g.Matrix).flip(t.flip,t.offset)):null==t.x&&null==t.y||(i=new g.Translate(t.x,t.y)),i?(i.relative=e,this.last().transforms.push(i),this._callStart()):this)}}),g.extend(g.Element,{untransform:function(){return this.attr("transform",null)},matrixify:function(){return(this.attr("transform")||"").split(g.regex.transforms).slice(0,-1).map(function(t){var e=t.trim().split("(");return[e[0],e[1].split(g.regex.delimiter).map(function(t){return parseFloat(t)})]}).reduce(function(t,e){return"matrix"==e[0]?t.multiply(f(e[1])):t[e[0]].apply(t,e[1])},new g.Matrix)},toParent:function(t){if(this==t)return this;var e=this.screenCTM(),i=t.screenCTM().inverse();return this.addTo(t).untransform().transform(i.multiply(e)),this},toDoc:function(){return this.toParent(this.doc())}}),g.Transformation=g.invent({create:function(t,e){if(arguments.length>1&&"boolean"!=typeof e)return this.constructor.call(this,[].slice.call(arguments));if(Array.isArray(t))for(var i=0,n=this.arguments.length;i<n;++i)this[this.arguments[i]]=t[i];else if("object"==typeof t)for(var i=0,n=this.arguments.length;i<n;++i)this[this.arguments[i]]=t[this.arguments[i]];this.inversed=!1,!0===e&&(this.inversed=!0)},extend:{arguments:[],method:"",at:function(t){for(var e=[],i=0,n=this.arguments.length;i<n;++i)e.push(this[this.arguments[i]]);var r=this._undo||new g.Matrix;return r=(new g.Matrix).morph(g.Matrix.prototype[this.method].apply(r,e)).at(t),this.inversed?r.inverse():r},undo:function(t){for(var e=0,i=this.arguments.length;e<i;++e)t[this.arguments[e]]=void 0===this[this.arguments[e]]?0:t[this.arguments[e]];return t.cx=this.cx,t.cy=this.cy,this._undo=new(g[a(this.method)])(t,!0).at(1),this}}}),g.Translate=g.invent({parent:g.Matrix,inherit:g.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["transformedX","transformedY"],method:"translate"}}),g.Rotate=g.invent({parent:g.Matrix,inherit:g.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["rotation","cx","cy"],method:"rotate",at:function(t){var e=(new g.Matrix).rotate((new g.Number).morph(this.rotation-(this._undo?this._undo.rotation:0)).at(t),this.cx,this.cy);return this.inversed?e.inverse():e},undo:function(t){return this._undo=t,this}}}),g.Scale=g.invent({parent:g.Matrix,inherit:g.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["scaleX","scaleY","cx","cy"],method:"scale"}}),g.Skew=g.invent({parent:g.Matrix,inherit:g.Transformation,create:function(t,e){this.constructor.apply(this,[].slice.call(arguments))},extend:{arguments:["skewX","skewY","cx","cy"],method:"skew"}}),g.extend(g.Element,{style:function(t,e){if(0==arguments.length)return this.node.style.cssText||"";if(arguments.length<2)if("object"==typeof t)for(e in t)this.style(e,t[e]);else{if(!g.regex.isCss.test(t))return this.node.style[o(t)];for(t=t.split(/\s*;\s*/).filter(function(t){return!!t}).map(function(t){return t.split(/\s*:\s*/)});e=t.pop();)this.style(e[0],e[1])}else this.node.style[o(t)]=null===e||g.regex.isBlank.test(e)?"":e;return this}}),g.Parent=g.invent({create:function(t){this.constructor.call(this,t)},inherit:g.Element,extend:{children:function(){return g.utils.map(g.utils.filterSVGElements(this.node.childNodes),function(t){return g.adopt(t)})},add:function(t,e){return null==e?this.node.appendChild(t.node):t.node!=this.node.childNodes[e]&&this.node.insertBefore(t.node,this.node.childNodes[e]),this},put:function(t,e){return this.add(t,e),t},has:function(t){return this.index(t)>=0},index:function(t){return[].slice.call(this.node.childNodes).indexOf(t.node)},get:function(t){return g.adopt(this.node.childNodes[t])},first:function(){return this.get(0)},last:function(){return this.get(this.node.childNodes.length-1)},each:function(t,e){var i,n,r=this.children();for(i=0,n=r.length;i<n;i++)r[i]instanceof g.Element&&t.apply(r[i],[i,r]),e&&r[i]instanceof g.Container&&r[i].each(t,e);return this},removeElement:function(t){return this.node.removeChild(t.node),this},clear:function(){for(;this.node.hasChildNodes();)this.node.removeChild(this.node.lastChild);return delete this._defs,this},defs:function(){return this.doc().defs()}}}),g.extend(g.Parent,{ungroup:function(t,e){return 0===e||this instanceof g.Defs||this.node==g.parser.draw?this:(t=t||(this instanceof g.Doc?this:this.parent(g.Parent)),e=e||1/0,this.each(function(){return this instanceof g.Defs?this:this instanceof g.Parent?this.ungroup(t,e-1):this.toParent(t)}),this.node.firstChild||this.remove(),this)},flatten:function(t,e){return this.ungroup(t,e)}}),g.Container=g.invent({create:function(t){this.constructor.call(this,t)},inherit:g.Parent}),g.ViewBox=g.invent({create:function(t){var e,i,n,r,s,o,a,h=[0,0,0,0],u=1,l=1,c=/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi;if(t instanceof g.Element){for(o=t,a=t,s=(t.attr("viewBox")||"").match(c),t.bbox,n=new g.Number(t.width()),r=new g.Number(t.height());"%"==n.unit;)u*=n.value,n=new g.Number(o instanceof g.Doc?o.parent().offsetWidth:o.parent().width()),o=o.parent();for(;"%"==r.unit;)l*=r.value,r=new g.Number(a instanceof g.Doc?a.parent().offsetHeight:a.parent().height()),a=a.parent();this.x=0,this.y=0,this.width=n*u,this.height=r*l,this.zoom=1,s&&(e=parseFloat(s[0]),i=parseFloat(s[1]),n=parseFloat(s[2]),r=parseFloat(s[3]),this.zoom=this.width/this.height>n/r?this.height/r:this.width/n,this.x=e,this.y=i,this.width=n,this.height=r)}else t="string"==typeof t?t.match(c).map(function(t){return parseFloat(t)}):Array.isArray(t)?t:"object"==typeof t?[t.x,t.y,t.width,t.height]:4==arguments.length?[].slice.call(arguments):h,this.x=t[0],this.y=t[1],this.width=t[2],this.height=t[3]},extend:{toString:function(){return this.x+" "+this.y+" "+this.width+" "+this.height},morph:function(t,e,i,n){return this.destination=new g.ViewBox(t,e,i,n),this},at:function(t){return this.destination?new g.ViewBox([this.x+(this.destination.x-this.x)*t,this.y+(this.destination.y-this.y)*t,this.width+(this.destination.width-this.width)*t,this.height+(this.destination.height-this.height)*t]):this}},parent:g.Container,construct:{viewbox:function(t,e,i,n){return 0==arguments.length?new g.ViewBox(this):this.attr("viewBox",new g.ViewBox(t,e,i,n))}}}),["click","dblclick","mousedown","mouseup","mouseover","mouseout","mousemove","touchstart","touchmove","touchleave","touchend","touchcancel"].forEach(function(t){g.Element.prototype[t]=function(e){return g.on(this.node,t,e),this}}),g.listeners=[],g.handlerMap=[],g.listenerId=0,g.on=function(t,e,i,n,r){var s=i.bind(n||t.instance||t),o=(g.handlerMap.indexOf(t)+1||g.handlerMap.push(t))-1,a=e.split(".")[0],h=e.split(".")[1]||"*";g.listeners[o]=g.listeners[o]||{},g.listeners[o][a]=g.listeners[o][a]||{},g.listeners[o][a][h]=g.listeners[o][a][h]||{},i._svgjsListenerId||(i._svgjsListenerId=++g.listenerId),g.listeners[o][a][h][i._svgjsListenerId]=s,t.addEventListener(a,s,r||!1)},g.off=function(t,e,i){var n=g.handlerMap.indexOf(t),r=e&&e.split(".")[0],s=e&&e.split(".")[1],o="";if(-1!=n)if(i){if("function"==typeof i&&(i=i._svgjsListenerId),!i)return;g.listeners[n][r]&&g.listeners[n][r][s||"*"]&&(t.removeEventListener(r,g.listeners[n][r][s||"*"][i],!1),delete g.listeners[n][r][s||"*"][i])}else if(s&&r){if(g.listeners[n][r]&&g.listeners[n][r][s]){for(i in g.listeners[n][r][s])g.off(t,[r,s].join("."),i);delete g.listeners[n][r][s]}}else if(s)for(e in g.listeners[n])for(o in g.listeners[n][e])s===o&&g.off(t,[e,s].join("."));else if(r){if(g.listeners[n][r]){for(o in g.listeners[n][r])g.off(t,[r,o].join("."));delete g.listeners[n][r]}}else{for(e in g.listeners[n])g.off(t,e);delete g.listeners[n],delete g.handlerMap[n]}},g.extend(g.Element,{on:function(t,e,i,n){return g.on(this.node,t,e,i,n),this},off:function(t,e){return g.off(this.node,t,e),this},fire:function(e,i){return e instanceof t.Event?this.node.dispatchEvent(e):this.node.dispatchEvent(e=new t.CustomEvent(e,{detail:i,cancelable:!0})),this._event=e,this},event:function(){return this._event}}),g.Defs=g.invent({create:"defs",inherit:g.Container}),g.G=g.invent({create:"g",inherit:g.Container,extend:{x:function(t){return null==t?this.transform("x"):this.transform({x:t-this.x()},!0)},y:function(t){return null==t?this.transform("y"):this.transform({y:t-this.y()},!0)},cx:function(t){return null==t?this.gbox().cx:this.x(t-this.gbox().width/2)},cy:function(t){return null==t?this.gbox().cy:this.y(t-this.gbox().height/2)},gbox:function(){var t=this.bbox(),e=this.transform();return t.x+=e.x,t.x2+=e.x,t.cx+=e.x,t.y+=e.y,t.y2+=e.y,t.cy+=e.y,t}},construct:{group:function(){return this.put(new g.G)}}}),g.extend(g.Element,{siblings:function(){return this.parent().children()},position:function(){return this.parent().index(this)},next:function(){return this.siblings()[this.position()+1]},previous:function(){return this.siblings()[this.position()-1]},forward:function(){var t=this.position()+1,e=this.parent();return e.removeElement(this).add(this,t),e instanceof g.Doc&&e.node.appendChild(e.defs().node),this},backward:function(){var t=this.position();return t>0&&this.parent().removeElement(this).add(this,t-1),this},front:function(){var t=this.parent();return t.node.appendChild(this.node),t instanceof g.Doc&&t.node.appendChild(t.defs().node),this},back:function(){return this.position()>0&&this.parent().removeElement(this).add(this,0),this},before:function(t){t.remove();var e=this.position();return this.parent().add(t,e),this},after:function(t){t.remove();var e=this.position();return this.parent().add(t,e+1),this}}),g.Mask=g.invent({create:function(){this.constructor.call(this,g.create("mask")),this.targets=[]},inherit:g.Container,extend:{remove:function(){for(var t=this.targets.length-1;t>=0;t--)this.targets[t]&&this.targets[t].unmask();return this.targets=[],this.parent().removeElement(this),this}},construct:{mask:function(){return this.defs().put(new g.Mask)}}}),g.extend(g.Element,{maskWith:function(t){return this.masker=t instanceof g.Mask?t:this.parent().mask().add(t),this.masker.targets.push(this),this.attr("mask",'url("#'+this.masker.attr("id")+'")')},unmask:function(){return delete this.masker,this.attr("mask",null)}}),g.ClipPath=g.invent({create:function(){this.constructor.call(this,g.create("clipPath")),this.targets=[]},inherit:g.Container,extend:{remove:function(){for(var t=this.targets.length-1;t>=0;t--)this.targets[t]&&this.targets[t].unclip();return this.targets=[],this.parent().removeElement(this),this}},construct:{clip:function(){return this.defs().put(new g.ClipPath)}}}),g.extend(g.Element,{clipWith:function(t){return this.clipper=t instanceof g.ClipPath?t:this.parent().clip().add(t),this.clipper.targets.push(this),this.attr("clip-path",'url("#'+this.clipper.attr("id")+'")')},unclip:function(){return delete this.clipper,this.attr("clip-path",null)}}),g.Gradient=g.invent({create:function(t){this.constructor.call(this,g.create(t+"Gradient")),this.type=t},inherit:g.Container,extend:{at:function(t,e,i){return this.put(new g.Stop).update(t,e,i)},update:function(t){return this.clear(),"function"==typeof t&&t.call(this,this),this},fill:function(){return"url(#"+this.id()+")"},toString:function(){return this.fill()},attr:function(t,e,i){return"transform"==t&&(t="gradientTransform"),g.Container.prototype.attr.call(this,t,e,i)}},construct:{gradient:function(t,e){return this.defs().gradient(t,e)}}}),g.extend(g.Gradient,g.FX,{from:function(t,e){return"radial"==(this._target||this).type?this.attr({fx:new g.Number(t),fy:new g.Number(e)}):this.attr({x1:new g.Number(t),y1:new g.Number(e)})},to:function(t,e){return"radial"==(this._target||this).type?this.attr({cx:new g.Number(t),cy:new g.Number(e)}):this.attr({x2:new g.Number(t),y2:new g.Number(e)})}}),g.extend(g.Defs,{gradient:function(t,e){return this.put(new g.Gradient(t)).update(e)}}),g.Stop=g.invent({create:"stop",inherit:g.Element,extend:{update:function(t){return("number"==typeof t||t instanceof g.Number)&&(t={offset:arguments[0],color:arguments[1],opacity:arguments[2]}),null!=t.opacity&&this.attr("stop-opacity",t.opacity),null!=t.color&&this.attr("stop-color",t.color),null!=t.offset&&this.attr("offset",new g.Number(t.offset)),this}}}),g.Pattern=g.invent({create:"pattern",inherit:g.Container,extend:{fill:function(){return"url(#"+this.id()+")"},update:function(t){return this.clear(),"function"==typeof t&&t.call(this,this),this},toString:function(){return this.fill()},attr:function(t,e,i){return"transform"==t&&(t="patternTransform"),g.Container.prototype.attr.call(this,t,e,i)}},construct:{pattern:function(t,e,i){return this.defs().pattern(t,e,i)}}}),g.extend(g.Defs,{pattern:function(t,e,i){return this.put(new g.Pattern).update(i).attr({x:0,y:0,width:t,height:e,patternUnits:"userSpaceOnUse"})}}),g.Doc=g.invent({create:function(t){t&&(t="string"==typeof t?e.getElementById(t):t,"svg"==t.nodeName?this.constructor.call(this,t):(this.constructor.call(this,g.create("svg")),t.appendChild(this.node),this.size("100%","100%")),this.namespace().defs())},inherit:g.Container,extend:{namespace:function(){return this.attr({xmlns:g.ns,version:"1.1"}).attr("xmlns:xlink",g.xlink,g.xmlns).attr("xmlns:svgjs",g.svgjs,g.xmlns)},defs:function(){if(!this._defs){var t;(t=this.node.getElementsByTagName("defs")[0])?this._defs=g.adopt(t):this._defs=new g.Defs,this.node.appendChild(this._defs.node)}return this._defs},parent:function(){return"#document"==this.node.parentNode.nodeName?null:this.node.parentNode},spof:function(){var t=this.node.getScreenCTM();return t&&this.style("left",-t.e%1+"px").style("top",-t.f%1+"px"),this},remove:function(){return this.parent()&&this.parent().removeChild(this.node),this},clear:function(){for(;this.node.hasChildNodes();)this.node.removeChild(this.node.lastChild);return delete this._defs,g.parser.draw.parentNode||this.node.appendChild(g.parser.draw),this}}}),g.Shape=g.invent({create:function(t){this.constructor.call(this,t)},inherit:g.Element}),g.Bare=g.invent({create:function(t,e){if(this.constructor.call(this,g.create(t)),e)for(var i in e.prototype)"function"==typeof e.prototype[i]&&(this[i]=e.prototype[i])},inherit:g.Element,extend:{words:function(t){for(;this.node.hasChildNodes();)this.node.removeChild(this.node.lastChild);return this.node.appendChild(e.createTextNode(t)),this}}}),g.extend(g.Parent,{element:function(t,e){return this.put(new g.Bare(t,e))}}),g.Symbol=g.invent({create:"symbol",inherit:g.Container,construct:{symbol:function(){return this.put(new g.Symbol)}}}),g.Use=g.invent({create:"use",inherit:g.Shape,extend:{element:function(t,e){return this.attr("href",(e||"")+"#"+t,g.xlink)}},construct:{use:function(t,e){return this.put(new g.Use).element(t,e)}}}),g.Rect=g.invent({create:"rect",inherit:g.Shape,construct:{rect:function(t,e){return this.put(new g.Rect).size(t,e)}}}),g.Circle=g.invent({create:"circle",inherit:g.Shape,construct:{circle:function(t){return this.put(new g.Circle).rx(new g.Number(t).divide(2)).move(0,0)}}}),g.extend(g.Circle,g.FX,{rx:function(t){return this.attr("r",t)},ry:function(t){return this.rx(t)}}),g.Ellipse=g.invent({create:"ellipse",inherit:g.Shape,construct:{ellipse:function(t,e){return this.put(new g.Ellipse).size(t,e).move(0,0)}}}),g.extend(g.Ellipse,g.Rect,g.FX,{rx:function(t){return this.attr("rx",t)},ry:function(t){return this.attr("ry",t)}}),g.extend(g.Circle,g.Ellipse,{x:function(t){return null==t?this.cx()-this.rx():this.cx(t+this.rx())},y:function(t){return null==t?this.cy()-this.ry():this.cy(t+this.ry())},cx:function(t){return null==t?this.attr("cx"):this.attr("cx",t)},cy:function(t){return null==t?this.attr("cy"):this.attr("cy",t)},width:function(t){return null==t?2*this.rx():this.rx(new g.Number(t).divide(2))},height:function(t){return null==t?2*this.ry():this.ry(new g.Number(t).divide(2))},size:function(t,e){var i=l(this,t,e);return this.rx(new g.Number(i.width).divide(2)).ry(new g.Number(i.height).divide(2))}}),g.Line=g.invent({create:"line",inherit:g.Shape,extend:{array:function(){return new g.PointArray([[this.attr("x1"),this.attr("y1")],[this.attr("x2"),this.attr("y2")]])},plot:function(t,e,i,n){return null==t?this.array():(t=void 0!==e?{x1:t,y1:e,x2:i,y2:n}:new g.PointArray(t).toLine(),this.attr(t))},move:function(t,e){return this.attr(this.array().move(t,e).toLine())},size:function(t,e){var i=l(this,t,e);return this.attr(this.array().size(i.width,i.height).toLine())}},construct:{line:function(t,e,i,n){return g.Line.prototype.plot.apply(this.put(new g.Line),null!=t?[t,e,i,n]:[0,0,0,0])}}}),g.Polyline=g.invent({create:"polyline",inherit:g.Shape,construct:{polyline:function(t){return this.put(new g.Polyline).plot(t||new g.PointArray)}}}),g.Polygon=g.invent({create:"polygon",inherit:g.Shape,construct:{polygon:function(t){return this.put(new g.Polygon).plot(t||new g.PointArray)}}}),g.extend(g.Polyline,g.Polygon,{array:function(){return this._array||(this._array=new g.PointArray(this.attr("points")))},plot:function(t){return null==t?this.array():this.clear().attr("points","string"==typeof t?t:this._array=new g.PointArray(t))},clear:function(){return delete this._array,this},move:function(t,e){return this.attr("points",this.array().move(t,e))},size:function(t,e){var i=l(this,t,e);return this.attr("points",this.array().size(i.width,i.height))}}),g.extend(g.Line,g.Polyline,g.Polygon,{morphArray:g.PointArray,x:function(t){return null==t?this.bbox().x:this.move(t,this.bbox().y)},y:function(t){return null==t?this.bbox().y:this.move(this.bbox().x,t)},width:function(t){var e=this.bbox();return null==t?e.width:this.size(t,e.height)},height:function(t){var e=this.bbox();return null==t?e.height:this.size(e.width,t)}}),g.Path=g.invent({create:"path",inherit:g.Shape,extend:{morphArray:g.PathArray,array:function(){return this._array||(this._array=new g.PathArray(this.attr("d")))},plot:function(t){return null==t?this.array():this.clear().attr("d","string"==typeof t?t:this._array=new g.PathArray(t))},clear:function(){return delete this._array,this},move:function(t,e){return this.attr("d",this.array().move(t,e))},x:function(t){return null==t?this.bbox().x:this.move(t,this.bbox().y)},y:function(t){return null==t?this.bbox().y:this.move(this.bbox().x,t)},size:function(t,e){var i=l(this,t,e);return this.attr("d",this.array().size(i.width,i.height))},width:function(t){return null==t?this.bbox().width:this.size(t,this.bbox().height)},height:function(t){return null==t?this.bbox().height:this.size(this.bbox().width,t)}},construct:{path:function(t){return this.put(new g.Path).plot(t||new g.PathArray)}}}),g.Image=g.invent({create:"image",inherit:g.Shape,extend:{load:function(e){if(!e)return this;var i=this,n=new t.Image;return g.on(n,"load",function(){g.off(n);var t=i.parent(g.Pattern);null!==t&&(0==i.width()&&0==i.height()&&i.size(n.width,n.height),t&&0==t.width()&&0==t.height()&&t.size(i.width(),i.height()),"function"==typeof i._loaded&&i._loaded.call(i,{width:n.width,height:n.height,ratio:n.width/n.height,url:e}))}),g.on(n,"error",function(t){g.off(n),"function"==typeof i._error&&i._error.call(i,t)}),this.attr("href",n.src=this.src=e,g.xlink)},loaded:function(t){return this._loaded=t,this},error:function(t){return this._error=t,this}},construct:{image:function(t,e,i){return this.put(new g.Image).load(t).size(e||0,i||e||0)}}}),g.Text=g.invent({create:function(){this.constructor.call(this,g.create("text")),this.dom.leading=new g.Number(1.3),this._rebuild=!0,this._build=!1,this.attr("font-family",g.defaults.attrs["font-family"])},inherit:g.Shape,extend:{x:function(t){return null==t?this.attr("x"):this.attr("x",t)},y:function(t){var e=this.attr("y"),i="number"==typeof e?e-this.bbox().y:0;return null==t?"number"==typeof e?e-i:e:this.attr("y","number"==typeof t?t+i:t)},cx:function(t){return null==t?this.bbox().cx:this.x(t-this.bbox().width/2)},cy:function(t){return null==t?this.bbox().cy:this.y(t-this.bbox().height/2)},text:function(t){if(void 0===t){for(var t="",e=this.node.childNodes,i=0,n=e.length;i<n;++i)0!=i&&3!=e[i].nodeType&&1==g.adopt(e[i]).dom.newLined&&(t+="\n"),t+=e[i].textContent;return t}if(this.clear().build(!0),"function"==typeof t)t.call(this,this);else{t=t.split("\n");for(var i=0,r=t.length;i<r;i++)this.tspan(t[i]).newLine()}return this.build(!1).rebuild()},size:function(t){return this.attr("font-size",t).rebuild()},leading:function(t){return null==t?this.dom.leading:(this.dom.leading=new g.Number(t),this.rebuild())},lines:function(){var t=(this.textPath&&this.textPath()||this).node,e=g.utils.map(g.utils.filterSVGElements(t.childNodes),function(t){return g.adopt(t)});return new g.Set(e)},rebuild:function(t){if("boolean"==typeof t&&(this._rebuild=t),this._rebuild){var e=this,i=0,n=this.dom.leading*new g.Number(this.attr("font-size"));this.lines().each(function(){this.dom.newLined&&(e.textPath()||this.attr("x",e.attr("x")),"\n"==this.text()?i+=n:(this.attr("dy",n+i),i=0))}),this.fire("rebuild")}return this},build:function(t){return this._build=!!t,this},setData:function(t){return this.dom=t,this.dom.leading=new g.Number(t.leading||1.3),this}},construct:{text:function(t){return this.put(new g.Text).text(t)},plain:function(t){return this.put(new g.Text).plain(t)}}}),g.Tspan=g.invent({create:"tspan",inherit:g.Shape,extend:{text:function(t){return null==t?this.node.textContent+(this.dom.newLined?"\n":""):("function"==typeof t?t.call(this,this):this.plain(t),this)},dx:function(t){return this.attr("dx",t)},dy:function(t){return this.attr("dy",t)},newLine:function(){var t=this.parent(g.Text);return this.dom.newLined=!0,this.dy(t.dom.leading*t.attr("font-size")).attr("x",t.x())}}}),g.extend(g.Text,g.Tspan,{plain:function(t){return!1===this._build&&this.clear(),this.node.appendChild(e.createTextNode(t)),this},tspan:function(t){var e=(this.textPath&&this.textPath()||this).node,i=new g.Tspan;return!1===this._build&&this.clear(),e.appendChild(i.node),i.text(t)},clear:function(){for(var t=(this.textPath&&this.textPath()||this).node;t.hasChildNodes();)t.removeChild(t.lastChild);return this},length:function(){return this.node.getComputedTextLength()}}),g.TextPath=g.invent({create:"textPath",inherit:g.Parent,parent:g.Text,construct:{morphArray:g.PathArray,path:function(t){for(var e=new g.TextPath,i=this.doc().defs().path(t);this.node.hasChildNodes();)e.node.appendChild(this.node.firstChild);return this.node.appendChild(e.node),e.attr("href","#"+i,g.xlink),this},array:function(){var t=this.track();return t?t.array():null},plot:function(t){var e=this.track(),i=null;return e&&(i=e.plot(t)),null==t?i:this},track:function(){var t=this.textPath();if(t)return t.reference("href")},textPath:function(){if(this.node.firstChild&&"textPath"==this.node.firstChild.nodeName)return g.adopt(this.node.firstChild)}}}),g.Nested=g.invent({create:function(){this.constructor.call(this,g.create("svg")),this.style("overflow","visible")},inherit:g.Container,construct:{nested:function(){return this.put(new g.Nested)}}}),g.A=g.invent({create:"a",inherit:g.Container,extend:{to:function(t){return this.attr("href",t,g.xlink)},show:function(t){return this.attr("show",t,g.xlink)},target:function(t){return this.attr("target",t)}},construct:{link:function(t){return this.put(new g.A).to(t)}}}),g.extend(g.Element,{linkTo:function(t){var e=new g.A;return"function"==typeof t?t.call(e,e):e.to(t),this.parent().put(e).put(this)}}),g.Marker=g.invent({create:"marker",inherit:g.Container,extend:{width:function(t){return this.attr("markerWidth",t)},height:function(t){return this.attr("markerHeight",t)},ref:function(t,e){return this.attr("refX",t).attr("refY",e)},update:function(t){return this.clear(),"function"==typeof t&&t.call(this,this),this},toString:function(){return"url(#"+this.id()+")"}},construct:{marker:function(t,e,i){return this.defs().marker(t,e,i)}}}),g.extend(g.Defs,{marker:function(t,e,i){return this.put(new g.Marker).size(t,e).ref(t/2,e/2).viewbox(0,0,t,e).attr("orient","auto").update(i)}}),g.extend(g.Line,g.Polyline,g.Polygon,g.Path,{marker:function(t,e,i,n){var r=["marker"];return"all"!=t&&r.push(t),r=r.join("-"),t=arguments[1]instanceof g.Marker?arguments[1]:this.doc().marker(e,i,n),this.attr(r,t)}});var A={stroke:["color","width","opacity","linecap","linejoin","miterlimit","dasharray","dashoffset"],fill:["color","opacity","rule"],prefix:function(t,e){return"color"==e?t:t+"-"+e}};["fill","stroke"].forEach(function(t){var e,i={};i[t]=function(i){if(void 0===i)return this;if("string"==typeof i||g.Color.isRgb(i)||i&&"function"==typeof i.fill)this.attr(t,i);else for(e=A[t].length-1;e>=0;e--)null!=i[A[t][e]]&&this.attr(A.prefix(t,A[t][e]),i[A[t][e]]);return this},g.extend(g.Element,g.FX,i)}),g.extend(g.Element,g.FX,{rotate:function(t,e,i){return this.transform({rotation:t,cx:e,cy:i})},skew:function(t,e,i,n){return 1==arguments.length||3==arguments.length?this.transform({skew:t,cx:e,cy:i}):this.transform({skewX:t,skewY:e,cx:i,cy:n})},scale:function(t,e,i,n){return 1==arguments.length||3==arguments.length?this.transform({scale:t,cx:e,cy:i}):this.transform({scaleX:t,scaleY:e,cx:i,cy:n})},translate:function(t,e){return this.transform({x:t,y:e})},flip:function(t,e){return e="number"==typeof t?t:e,this.transform({flip:t||"both",offset:e})},matrix:function(t){return this.attr("transform",new g.Matrix(6==arguments.length?[].slice.call(arguments):t))},opacity:function(t){return this.attr("opacity",t)},dx:function(t){return this.x(new g.Number(t).plus(this instanceof g.FX?0:this.x()),!0)},dy:function(t){return this.y(new g.Number(t).plus(this instanceof g.FX?0:this.y()),!0)},dmove:function(t,e){return this.dx(t).dy(e)}}),g.extend(g.Rect,g.Ellipse,g.Circle,g.Gradient,g.FX,{radius:function(t,e){var i=(this._target||this).type;return"radial"==i||"circle"==i?this.attr("r",new g.Number(t)):this.rx(t).ry(null==e?t:e)}}),g.extend(g.Path,{length:function(){return this.node.getTotalLength()},pointAt:function(t){return this.node.getPointAtLength(t)}}),g.extend(g.Parent,g.Text,g.Tspan,g.FX,{font:function(t,e){if("object"==typeof t)for(e in t)this.font(e,t[e]);return"leading"==t?this.leading(e):"anchor"==t?this.attr("text-anchor",e):"size"==t||"family"==t||"weight"==t||"stretch"==t||"variant"==t||"style"==t?this.attr("font-"+t,e):this.attr(t,e)}}),g.Set=g.invent({create:function(t){Array.isArray(t)?this.members=t:this.clear()},extend:{add:function(){var t,e,i=[].slice.call(arguments);for(t=0,e=i.length;t<e;t++)this.members.push(i[t]);return this},remove:function(t){var e=this.index(t);return e>-1&&this.members.splice(e,1),this},each:function(t){for(var e=0,i=this.members.length;e<i;e++)t.apply(this.members[e],[e,this.members]);return this},clear:function(){return this.members=[],this},length:function(){return this.members.length},has:function(t){return this.index(t)>=0},index:function(t){return this.members.indexOf(t)},get:function(t){return this.members[t]},first:function(){return this.get(0)},last:function(){return this.get(this.members.length-1)},valueOf:function(){return this.members},bbox:function(){if(0==this.members.length)return new g.RBox;var t=this.members[0].rbox(this.members[0].doc());return this.each(function(){t=t.merge(this.rbox(this.doc()))}),t}},construct:{set:function(t){return new g.Set(t)}}}),g.FX.Set=g.invent({create:function(t){this.set=t}}),g.Set.inherit=function(){var t,e=[];for(var t in g.Shape.prototype)"function"==typeof g.Shape.prototype[t]&&"function"!=typeof g.Set.prototype[t]&&e.push(t);e.forEach(function(t){g.Set.prototype[t]=function(){for(var e=0,i=this.members.length;e<i;e++)this.members[e]&&"function"==typeof this.members[e][t]&&this.members[e][t].apply(this.members[e],arguments);return"animate"==t?this.fx||(this.fx=new g.FX.Set(this)):this}}),e=[]
;for(var t in g.FX.prototype)"function"==typeof g.FX.prototype[t]&&"function"!=typeof g.FX.Set.prototype[t]&&e.push(t);e.forEach(function(t){g.FX.Set.prototype[t]=function(){for(var e=0,i=this.set.members.length;e<i;e++)this.set.members[e].fx[t].apply(this.set.members[e].fx,arguments);return this}})},g.extend(g.Element,{data:function(t,e,i){if("object"==typeof t)for(e in t)this.data(e,t[e]);else if(arguments.length<2)try{return JSON.parse(this.attr("data-"+t))}catch(e){return this.attr("data-"+t)}else this.attr("data-"+t,null===e?null:!0===i||"string"==typeof e||"number"==typeof e?e:JSON.stringify(e));return this}}),g.extend(g.Element,{remember:function(t,e){if("object"==typeof arguments[0])for(var e in t)this.remember(e,t[e]);else{if(1==arguments.length)return this.memory()[t];this.memory()[t]=e}return this},forget:function(){if(0==arguments.length)this._memory={};else for(var t=arguments.length-1;t>=0;t--)delete this.memory()[arguments[t]];return this},memory:function(){return this._memory||(this._memory={})}}),g.get=function(t){var i=e.getElementById(v(t)||t);return g.adopt(i)},g.select=function(t,i){return new g.Set(g.utils.map((i||e).querySelectorAll(t),function(t){return g.adopt(t)}))},g.extend(g.Parent,{select:function(t){return g.select(t,this.node)}});var M="abcdef".split("");if("function"!=typeof t.CustomEvent){var P=function(t,i){i=i||{bubbles:!1,cancelable:!1,detail:void 0};var n=e.createEvent("CustomEvent");return n.initCustomEvent(t,i.bubbles,i.cancelable,i.detail),n};P.prototype=t.Event.prototype,t.CustomEvent=P}return function(e){for(var i=0,n=["moz","webkit"],r=0;r<n.length&&!t.requestAnimationFrame;++r)e.requestAnimationFrame=e[n[r]+"RequestAnimationFrame"],e.cancelAnimationFrame=e[n[r]+"CancelAnimationFrame"]||e[n[r]+"CancelRequestAnimationFrame"];e.requestAnimationFrame=e.requestAnimationFrame||function(t){var n=(new Date).getTime(),r=Math.max(0,16-(n-i)),s=e.setTimeout(function(){t(n+r)},r);return i=n+r,s},e.cancelAnimationFrame=e.cancelAnimationFrame||e.clearTimeout}(t),g});;


SVG.ForeignObject = SVG.invent({
  // Initialize node
  create: 'foreignObject'

  // Inherit from
, inherit: SVG.Shape
    
  // Add parent method
, construct: {
    // Create a rect element
    foreignObject: function(width, height) {
      return this.put(new SVG.ForeignObject()).size(width, height)
    }
  }
, extend: {
  appendChild: function (child, attrs) {
    var newChild = typeof(child)=='string' ? document.createElement(child) : child
    if (typeof(attrs)=='object'){
      for(a in attrs) newChild[a] = attrs[a]
    }
    this.node.appendChild(newChild)
    return this  
  },
  getChild: function (index) {
    return this.node.childNodes[index]
  }
}
});;



function _itemcluster_extend_svg(me) { // very polymorph_core functions! 
    me.svg = SVG(me.rootdiv.querySelector(".itemcluster"));
    me.mapPageToSvgCoords = function (pageX, pageY, vb) {
        let rels = me.svg.node.getBoundingClientRect();
        if (!vb) vb = me.svg.viewbox();
        let ret = {};
        ret.x = (pageX - rels.x) / rels.width * vb.width + vb.x;
        ret.y = (pageY - rels.y) / rels.height * vb.height + vb.y;
        return ret;
    }
    let linePerformanceCache = {};// in start+end, cache [[x,y],[x,y]]
    me.fromcache = {};

    let whileNotVisibleCache = [];
    let visChecker = 0;

    me.arrangeItem = function (id) {
        if (!me.container.visible()) {
            whileNotVisibleCache.push(id);
            if (!visChecker) visChecker = setInterval(() => {
                if (me.container.visible()) {
                    for (let i of whileNotVisibleCache) {
                        me.arrangeItem(i);
                    }
                    whileNotVisibleCache = [];
                    clearInterval(visChecker);
                    visChecker = 0;
                }
            }, 500);
            return;
        }
        let sel = me.rootdiv.getRootNode().getSelection();
        let prerange = null;
        if (sel.rangeCount && me.rootdiv.getRootNode().activeElement && me.rootdiv.getRootNode().activeElement.matches(`[data-id="${id}"] *`)) {
            //return immediately, delay the fn call
            //setTimeout(() => me.arrangeItem(id), 1000);
            //return;
            let _prerange = sel.getRangeAt(0);
            prerange = {}
            let props = ["collapsed"
                , "commonAncestorContainer"
                , "endContainer"
                , "endOffset"
                , "startContainer"
                , "startOffset"];
            props.forEach(i => {
                prerange[i] = _prerange[i];
            })
            prerange["node"] = _prerange.startContainer.parentElement;
        }
        //first, get the element(s)
        let previousHandle = me.itemPointerCache[id];
        //check if item relevant
        let willShow = true;
        if (!me.itemRelevant(id)) willShow = false;
        else if (!polymorph_core.items[id].itemcluster.viewData || !polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName]) willShow = false;

        //remove the elements if not
        if (!willShow) {
            if (previousHandle) {
                previousHandle.remove();
                delete me.itemPointerCache[id];
            }
            return;
        } else {
            if (!previousHandle) {
                previousHandle = me.svg.group().attr({ "data-id": id, class: "floatingItem" });
                previousHandle.add(me.svg.circle(10).fill("transparent").stroke({ width: 2, color: "red" }).cx(0).cy(0));
                let fob = me.svg.foreignObject(50, 20).x(10).y(-10);
                previousHandle.add(fob);
                me.itemPointerCache[id] = previousHandle;
                fob.node.appendChild(htmlwrap(`<div style='position:absolute; margin:0; color: white; background:rgba(10,10,10,0.2)'><p contenteditable class="tta"></p><p style="background:white; color:black" contenteditable class="ttb"></p></div>`));
                //we will need to force link in from all existing items, because.
                for (let i in me.itemPointerCache) {
                    if (polymorph_core.items[i].to && polymorph_core.items[i].to[id]) {
                        // render the link
                        if (i == me.prevFocusID || id == me.prevFocusID) {
                            me.enforceLine(i, id, "red");
                        } else {
                            me.enforceLine(i, id);
                        }
                    }
                }
            }
            //actually update, only if necessary, to save processor time.
            let positionChanged = Math.abs(previousHandle.x() - polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].x * polymorph_core.items[me.settings.currentViewName].itemcluster.XZoomFactor) > 0.01 || Math.abs(previousHandle.y() - polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].y) > 0.01;
            if (positionChanged) {
                previousHandle.move(polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].x * polymorph_core.items[me.settings.currentViewName].itemcluster.XZoomFactor, polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].y);
                //draw its lines
            }

            //fill in the textarea inside
            let tta = me.itemPointerCache[id].node.querySelector("p.tta");
            let ttb = me.itemPointerCache[id].node.querySelector("p.ttb");
            let dvd = me.itemPointerCache[id].node.querySelector("div");

            if (polymorph_core.items[id].style) { // dont update this if it hasn't changed.
                if (JSON.stringify(polymorph_core.items[id].style) != JSON.stringify(me.cachedStyle[id])) {
                    dvd.style.background = polymorph_core.items[id].style.background || "";
                    previousHandle.first().style("color", polymorph_core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(tta).background) || ['#000000'])[0]));
                    me.cachedStyle[id] = JSON.parse(JSON.stringify(polymorph_core.items[id].style));
                }
            }
            if (!(polymorph_core.items[id][this.settings.textProp])) {
                polymorph_core.items[id][this.settings.textProp] = "_";
            }
            if (!polymorph_core.items[id][this.settings.focusExtendProp]) {
                polymorph_core.items[id][this.settings.focusExtendProp] = "_";
            }
            let widthInvalidated = false;
            if (tta.innerText != polymorph_core.items[id][this.settings.textProp]) {
                tta.innerText = polymorph_core.items[id][this.settings.textProp];
                widthInvalidated = true;
            }
            if (ttb.innerText != polymorph_core.items[id][this.settings.focusExtendProp]) {
                ttb.innerText = polymorph_core.items[id][this.settings.focusExtendProp];
                widthInvalidated = true;
            }
            if (widthInvalidated) {
                dvd.style.width = (Math.sqrt(tta.innerText.length + ttb.innerText.length) + 1) * 23;
                dvd.parentElement.setAttribute("width", dvd.scrollWidth);
                if (me.prevFocusID == id) {
                    setTimeout(() => {
                        dvd.parentElement.setAttribute("height", dvd.scrollHeight);
                    })
                } else {
                    setTimeout(() => {
                        dvd.parentElement.setAttribute("height", tta.scrollHeight);
                    })
                }
            }
            let fob = me.itemPointerCache[id].children()[1];
            if (fob.width() == 0) {// when container starts invisible, fob does not show.
                fob.size(dvd.scrollWidth, tta.scrollHeight);
            }

            //add icons if necessary
            /*if (polymorph_core.items[id].itemcluster.viewName) {
                //this has a subview, make it known!.
                let subviewItemCount;
                if (rect.node.querySelector(".subviewItemCount")) {
                    subviewItemCount = rect.node.querySelector(".subviewItemCount");
                } else {
                    subviewItemCount = document.createElement("p");
                    subviewItemCount.style.cssText = `
                    display: block;
                    width: 1em;
                    height: 1em;
                    font-size: 0.7em;
                    margin: 0px;
                    text-align: center;
                    background: orange;
                    `;
                    subviewItemCount.classList.add("subviewItemCount");
                    rect.node.children[0].appendChild(subviewItemCount);
                    //also count all the items in my subview and report.
                }
                let count = 0;
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[id]) count++;
                }
                subviewItemCount.innerText = count;
            } else {
                if (rect.node.children[0].querySelector(".subviewItemCount")) {
                    rect.node.children[0].querySelector(".subviewItemCount").remove();
                }
            }*/

            if (polymorph_core.items[id].to) {
                for (let i in polymorph_core.items[id].to) {
                    if (polymorph_core.items[i] && polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                        if (i == me.prevFocusID || id == me.prevFocusID) {
                            me.enforceLine(id, i, "red");
                        } else {
                            me.enforceLine(id, i);
                        }
                    }
                    if (!me.fromcache[i]) me.fromcache[i] = {};
                    me.fromcache[i][id] = true;
                }
            }
            // also enforce lines to this element without using the doubleupdatecapacitor, by looking at the from cache.
            if (me.fromcache[id]) {
                for (let i in me.fromcache[id]) {
                    if (!polymorph_core.items[i].to[id]) delete me.fromcache[id][i];
                    else if (i == me.prevFocusID || id == me.prevFocusID) {
                        me.enforceLine(i, id, "red");
                    } else {
                        me.enforceLine(i, id);
                    }
                }
            }

            if (prerange) {
                let newRange = new Range();
                newRange.setStart(prerange.startContainer, prerange.startOffset);
                newRange.setEnd(prerange.startContainer, prerange.endOffset);
                let props = ["collapsed"
                    , "commonAncestorContainer"
                    , "endContainer"
                    , "endOffset"
                    , "startContainer"
                    , "startOffset"];
                props.forEach(i => {
                    newRange[i] = prerange[i];
                })
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //Lines


    me.linkingLine = me.svg.line(0, 0, 0, 0).stroke({
        width: 3
    }).back();
    me.activeLines = {};
    me.toggleLine = function (start, end) {
        //start and end is now directional. 
        //check if linked; if linked, remove link
        if (polymorph_core.isLinked(start, end) % 2) {
            polymorph_core.unlink(start, end);
            if (me.activeLines[start] && me.activeLines[start][end]) me.activeLines[start][end].remove();
            delete me.activeLines[start][end];
            delete me.fromcache[end][start];
        } else {
            polymorph_core.link(start, end);
            me.enforceLine(start, end);
        }
    };

    me.redrawLines = function (ci, style = "black") {
        for (let j in me.activeLines[ci]) {
            me.enforceLine(ci, j, style);
        }
        for (let j in me.fromcache[ci]) {
            me.enforceLine(j, ci, style);
        }
    }


    me.enforceLine = function (start, end, style = "black") {
        let sd = me.itemPointerCache[start];
        let ed = me.itemPointerCache[end];
        if (!sd || !ed) {
            return;
        }

        //check if line already exists
        let cp;
        if (me.activeLines[start] && me.activeLines[start][end]) {
            //if so, edit instead of create
            cp = me.activeLines[start][end];
        } else {
            if (!me.activeLines[start]) me.activeLines[start] = {};
            cp = me.svg.path().stroke({ width: 2, color: style });
            cp.marker('mid', 9, 6, function (add) {
                add.path("M0,0 L0,6 L9,3 z").fill("black");
            })
            me.activeLines[start][end] = cp;
            if (!me.fromcache[end]) me.fromcache[end] = {};
            me.fromcache[end][start] = true;
            //problem: when lines are cleared, lines do not redraw because lineperformancecache is not clear.
            if (linePerformanceCache[start]) delete linePerformanceCache[start][end];
        }

        //if either is not visible, then dont draw
        if (sd.style.display == "none" || ed.style.display == "none") {
            cp.hide();
            return;
        } else {
            if (!(!(linePerformanceCache[start])
                || !(linePerformanceCache[start][end])
                || !(Math.abs(linePerformanceCache[start][end][0][0] - sd.x()) < 0.01)
                || !(Math.abs(linePerformanceCache[start][end][0][1] - sd.y()) < 0.01)
                || !(Math.abs(linePerformanceCache[start][end][1][0] - ed.x()) < 0.01)
                || !(Math.abs(linePerformanceCache[start][end][1][1] - ed.y()) < 0.01)
                || !(linePerformanceCache[start][end][2] == style)
            )) return;
            let x = [sd.cx(), 0, ed.cx()];
            let y = [sd.cy(), 0, ed.cy()];
            x[1] = (x[0] + x[2]) / 2;
            y[1] = (y[0] + y[2]) / 2;
            cp.plot(`M ${x[0]} ${y[0]} L ${x[1]} ${y[1]} L ${x[2]} ${y[2]}`);
            cp.stroke({ width: 2, color: style });
            cp.back();
            if (!linePerformanceCache[start]) linePerformanceCache[start] = {};
            linePerformanceCache[start][end] = [[sd.x(), sd.y()], [ed.x(), ed.y()], style];
        }
    };


    //arrange items 
    for (let i in polymorph_core.items) {
        me.arrangeItem(i);
    }
    //twice for lines, as some items may not have loaded yets
    for (let i in polymorph_core.items) {
        me.arrangeItem(i);
    }
    if (me.viewGrid) {
        me.viewGrid();
    }
}
;



function _itemcluster_extend_contextmenu() {
    ///////////////////////////////////////////////////////////////////////////////////////
    //Various context menus
    let contextMenuManager = new _contextMenuManager(this.rootdiv);
    let centreXY = {};
    let chk = (e) => {
        if (!e.target.matches("g[data-id] *")) {
            //if (e.target.tagNathis.toLowerCase() == "svg" || e.target == this.tempTR.node) {
            centerXY = this.mapPageToSvgCoords(e.pageX, e.pageY);
            return true;//only activate on clicks to the background.  
        }
    }
    this.rootcontextMenu = contextMenuManager.registerContextMenu(`
        <li class="pastebtn">Paste</li>
        <li class="collect">Collect items here</li>
        <li class="hierarchy">Arrange in hierarchy</li>
        <li class="hierarchy radial">Arrange in radial hierarchy</li>
        <li class="hierarchy biradial">Arrange in biradial hierarchy</li>
        <li class="search">Search
        <ul class="submenu">
        <li><input class="searchbox"></li>
        <li class="searchNextResult">Next result</li>
        </ul>
        </li>
        <!--<li class="hierarchy radial stepped">Stepped radial hierarchy</li>-->
        `, this.rootdiv, undefined, chk);
    this.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", (e) => {
        if (polymorph_core.shared.itemclusterCopyElement) {
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            polymorph_core.shared.itemclusterCopyElement.forEach((v) => {
                polymorph_core.items[v.id].itemcluster.viewData[this.settings.currentViewName] = {
                    x: coords.x + v.x,
                    y: coords.y + v.y,
                }
                if (this.settings.filter) polymorph_core.items[v.id][this.settings.filter] = true;
                this.arrangeItem(v.id);
                this.container.fire("updateItem", {
                    id: v.id,
                    sender: this
                });
            });
            //arrange everything again for new links to show up
            for (let i in polymorph_core.items) {
                this.arrangeItem(i);
            }
            this.rootcontextMenu.style.display = "none";
        }
    })
    this.rootcontextMenu.querySelector(".collect").addEventListener("click", (e) => {
        let rect = this.itemSpace.getBoundingClientRect();
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].x = e.clientX - rect.left;
                polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].y = e.clientY - rect.top;
                this.arrangeItem(i);
            }
        }
        for (let i in polymorph_core.items) {
            //second update to fix lines; also alert everyone of changes.
            this.container.fire("updateItem", {
                id: i
            });
        }
    })
    //hierarchy buttons

    let generateHierarchy = () => {
        //get position of items, and the links to other items
        let visibleItems = [];
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                visibleItems.push({
                    id: i,
                    x: polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].x,
                    y: polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].y,
                    children: Object.keys(polymorph_core.items[i].to || {}),
                    parents: []
                });
            }
        }

        let visibleItemIds = visibleItems.map((v) => v.id);

        //make sure links are relevant (point to items we care about) and directed (not bidirectional)
        visibleItems.forEach((v, _i) => {
            if (v.children) {
                for (let i = 0; i < v.children.length; i++) {
                    let pos = visibleItemIds.indexOf(v.children[i]);
                    if (pos == -1) {
                        v.children.splice(i, 1);
                        i--;
                    } else if (polymorph_core.items[visibleItems[pos].id].to && Object.keys(polymorph_core.items[visibleItems[pos].id].to).indexOf(v.id) != -1) {//bidirectional links
                        v.children.splice(i, 1);
                        i--;
                    } else {
                        //assign the to item a parent
                        visibleItems[pos].parents.push(_i);
                    }
                }
            }
        })
        //figure out the level of the item (its level in the hierarchy)
        let queue = [];
        let roots = [];
        for (let i = 0; i < visibleItems.length; i++) {
            //identify root nodes, add them to the queue
            if (visibleItems[i].parents.length == 0) {
                queue.push.apply(queue, visibleItems[i].children);
                visibleItems[i].level = 0;
                visibleItems[i].parent = undefined;
                roots.push(visibleItems[i]);
            }
        }
        if (roots.length > 1) {
            roots.forEach(i => {
                i.level = 1;
                i.parent = "0";
            })
            visibleItems.push({ id: '0', level: 0, x: 0, y: 0, children: roots.map(i => i.id) });
            roots = [{ id: '0' }];
            visibleItemIds.push('0');
        };
        let cycleNodes = [];
        let pretop = undefined;
        while (queue.length) {
            let top = queue.shift();
            if (top == pretop) {
                cycleNodes.push(top);
                continue;
            }
            pretop = top;
            top = visibleItemIds.indexOf(top);
            if (visibleItems[top].parents.reduce((p, i) => p & visibleItems[i].level != undefined, true)) {
                //if all my parents have a defined level
                let maxmax = visibleItems[top].parents.reduce((p, i) => {
                    if (p[0] < visibleItems[i].level) {
                        p[0] = visibleItems[i].level;
                        p[1] = i;
                    }
                    return p;
                }, [0, visibleItems[top].parents[0]]);
                visibleItems[top].level = maxmax[0] + 1;
                visibleItems[top].parent = visibleItems[maxmax[1]].id;
                queue.push.apply(queue, visibleItems[top].children);
            } else {
                queue.push(visibleItems[top].id);
            }
        }
        //clean up the orphans
        visibleItems.filter(i => i.level == undefined).forEach(i => {
            i.level = 1;
            i.parent = roots[0].id;
            visibleItems[visibleItemIds.indexOf(roots[0].id)].children.push(i.id);
            i.children = [];
        });
        //visibleItems = visibleItems.filter(i => cycleNodes.indexOf(i.id) == -1);
        return visibleItems;
    }

    let cartesianHierarchy = (e, visibleItems) => {
        //sort for rendering
        visibleItems.sort((a, b) => {
            return (a.level - b.level) + (a.level == b.level) * (a.x - b.x);
        });
        //sort children as well
        let indexedOrder = visibleItems.map((v) => v.id);
        visibleItems.forEach((v) => {
            if (v.children) {
                v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
            }
        })
        //calculate widths
        let getWidth = (id) => {
            if (id == '0') return 0;
            let c = visibleItems[indexedOrder.indexOf(id)].children;
            if (!c || !c.length) {
                return Number(/\d+/.exec(this.itemPointerCache[id].children()[1].width())) + 10;
            } else {
                let sum = 0;
                for (let i = 0; i < c.length; i++) {
                    if (visibleItems[indexedOrder.indexOf(c[i])].parent == id) sum = sum + getWidth(c[i]);
                }
                let alt = Number(/\d+/.exec(this.itemPointerCache[id].children()[1].width())) + 10;
                if (sum < alt) sum = alt;
                return sum;
            }
        }
        for (let i = 0; i < visibleItems.length; i++) {
            //this needs to be optimised with caching.
            visibleItems[i].width = getWidth(visibleItems[i].id);
        }

        // calculate total width
        let tw = 0;
        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) tw += visibleItems[i].width;
            else break;
        }
        let rect = this.itemSpace.getBoundingClientRect();
        let currentx = e.clientX - rect.left - tw / 2;
        let currenty = e.clientY - rect.top;

        let render = (itm, tx, ty) => { // itm is a visibleItem
            if (itm.id != '0') {
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].x = tx + (itm.width - Number(/\d+/ig.exec(this.itemPointerCache[itm.id].first().width))) / 2;
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].y = ty;
            }
            let ctx = tx;
            for (let i = 0; i < itm.children.length; i++) {
                if (visibleItems[indexedOrder.indexOf(itm.children[i])].parent == itm.id) ctx += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctx, ty + 200);
            }
            return itm.width;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) currentx += render(visibleItems[i], currentx, currenty);
        }
    }
    let rings = [];
    let radialHierarchy = (e, visibleItems) => {
        //nerf all the rings
        rings.forEach(i => i.remove());
        rings = [];
        //sort for rendering
        if (e.target.classList.contains('stepped')) {
            //stepping
            //count levels
            let levelCount = [0];
            let lastLevel = 0;
            for (let i = 0; i < visibleItems.length; i++) {
                if (lastLevel != visibleItems[i].level) {
                    levelCount.push(0);
                    lastLevel = visibleItems[i].level;
                }
                levelCount[visibleItems[i].level]++;
            }
            //if tiers are too thicc, segregate them
            levelCount = levelCount.map((v, i) => { return Math.ceil(v / (2 * Math.PI * 300 * i / 200)) });
            let staggerCount = 0;
            for (let i = 0; i < visibleItems.length; i++) {
                if (levelCount[visibleItems[i].level] != 0) {
                    visibleItems[i].level += ((staggerCount % levelCount[visibleItems[i].level]) / levelCount[visibleItems[i].level]);
                    staggerCount++;
                }
            }
        }
        //resort visibleItems angularly
        visibleItems.sort((a, b) => {
            let aa = Math.atan2(a.y, a.x);
            if (aa < 0) aa += Math.PI * 2;
            let bb = Math.atan2(b.y, b.x);
            if (bb < 0) bb += Math.PI * 2;
            return (a.level - b.level) + (a.level == b.level) * (aa - bb);
        });
        //sort children as well
        let indexedOrder = visibleItems.map((v) => v.id);
        visibleItems.forEach((v) => {
            if (v.children) {
                v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
            }
        })

        //start rendering
        //calculate angles
        let existing = {};
        let getAngle = (id) => {
            if (existing[id]) {
                if (existing[id] < 0) return 1;
                else return existing[id];
            }
            existing[id] = 1;
            let c = visibleItems[indexedOrder.indexOf(id)].children;
            if (!c || !c.length) {
                existing[id] = 1 / (visibleItems[indexedOrder.indexOf(id)].level + 1);
            } else {
                let sum = 0;
                for (let i = 0; i < c.length; i++) {
                    if (visibleItems[indexedOrder.indexOf(c[i])].parent == id) sum = sum + getAngle(c[i]);
                }
                if (sum < 1 / (visibleItems[indexedOrder.indexOf(id)].level + 1)) sum = 1 / (visibleItems[indexedOrder.indexOf(id)].level + 1);
                existing[id] = sum;
            }
            return existing[id];

        }
        for (let i = 0; i < visibleItems.length; i++) {
            //this needs to be optimised with caching.
            visibleItems[i].angle = getAngle(visibleItems[i].id);
        }

        // calculate total width
        let totalAngle = 0;
        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) totalAngle += visibleItems[i].angle;
            else break;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            visibleItems[i].angle *= Math.PI * 2 / totalAngle;
        }


        //calculate the minimum angle deviation per level and adjust radius accordingly
        let radii = {};
        radii[-1] = 0; // to make the algorithm work. yay js hacks
        let lastLevel = 0;
        let minTheta = visibleItems[0].angle;
        let lastLevelZero = 0;
        let previous = -1;
        for (let i = 1; i < visibleItems.length; i++) {
            if (lastLevel != visibleItems[i].level) {
                let tdeviation = (visibleItems[i - 1].angle + visibleItems[lastLevelZero].angle) / 2;
                if (tdeviation < minTheta) minTheta = tdeviation;
                radii[lastLevel] = Math.max(radii[previous] + 200, 200 / minTheta);
                previous = lastLevel;
                lastLevel = visibleItems[i].level;
                minTheta = Math.PI * 3;//reset
                lastLevelZero = i;
            } else {
                let tdeviation = (visibleItems[i - 1].angle + visibleItems[i].angle) / 2;
                if (tdeviation < minTheta) minTheta = tdeviation;
            }
        }

        //final one
        let tdeviation = (visibleItems[visibleItems.length - 1] + visibleItems[lastLevelZero]) / 2;
        if (tdeviation < minTheta) minTheta = tdeviation;
        radii[lastLevel] = Math.max(radii[lastLevel - 1] + 300, 200 / minTheta);
        //first one
        radii[0] = 0;
        //Start rendering!
        let currentT = 0;
        let triedRendering = [];
        let render = (itm, tT, dp) => { // itm is a visibleItem
            if (triedRendering.indexOf(itm.id) != -1) return itm.angle;
            else triedRendering.push(itm.id);
            let r = radii[itm.level];
            if (itm.id != '0') {
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].x = r * Math.cos(tT + itm.angle / 2);
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].y = r * Math.sin(tT + itm.angle / 2);
                //polymorph_core.items[itm.id].title += "rn1";
            }
            let ctT = tT;
            for (let i = 0; i < itm.children.length; i++) {
                if (visibleItems[indexedOrder.indexOf(itm.children[i])].parent == itm.id) ctT += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctT, dp + 1);
            }
            //this.arrangeItem(itm.id);
            return itm.angle;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) currentT += render(visibleItems[i], currentT, 0);
        }
        radii = Object.entries(radii).filter(i => i[0] > 0).sort((a, b) => a[0] - b[0]).map(i => i[1]);
        // now add the rings
        rings = radii.map(i => this.svg.circle(2 * i).cx(0).cy(0).stroke('red').fill('transparent').back());
    }

    let biradialHierarchy = (e, visibleItems) => {
        //sort for rendering
        //set parents, get children to calculate their angle relative to parent, and sort by that
        let indexedOrder = visibleItems.map(v => v.id);
        visibleItems.forEach(v => {
            v.children.forEach(c => {
                visibleItems[indexedOrder.indexOf(c)].parent = v.id;
            });
        });
        visibleItems.forEach(v => {
            if (v.parent) {
                let vp = visibleItems[indexedOrder.indexOf(v.parent)];
                v.angle = Math.atan2(v.y - vp.y, v.x - vp.x);
            }
            else {
                v.angle = Math.atan2(v.y, v.x);
            }
            if (v.angle < 0) v.angle += Math.PI * 2;
        })
        visibleItems.sort((a, b) => {
            return (a.level - b.level) + !(a.level - b.level) * (a.angle - b.angle);
        })
        indexedOrder = visibleItems.map(v => v.id);
        //render

        let binarySolve = (start, end, f, epsilon = 0.1) => {
            let pme, me;
            let cycleCount = 0;
            me = 2 * epsilon;
            pme = 0;
            while (Math.abs(me) > epsilon && cycleCount < 100) { //ack
                pme = me;
                me = f((start + end) / 2);
                if (me < 0) {
                    start = (start + end) / 2;
                } else {
                    end = (start + end) / 2
                }//there's another case where both are negative and that should throw a phat exception...
                if (isNaN(me)) return NaN;//error...
                cycleCount++;
            }
            if (cycleCount == 100) {
                return start - 1;
            }
            return (start + end) / 2;
        }
        //calculate radii - from the bottom up
        //let maxLvl = visibleItems[visibleItems.length - 1].level;
        const itemRadius = 100;
        for (let i = visibleItems.length - 1; i >= 0; i--) {

            if (visibleItems[i].children.length == 0) {
                visibleItems[i].r = 0;
                visibleItems[i].rr = itemRadius / 2;
            } else {
                let radii = visibleItems[i].children.filter(c => visibleItems[indexedOrder.indexOf(c)].parent == visibleItems[i].id).map(v => visibleItems[indexedOrder.indexOf(v)].rr);
                let maxRadius = Math.max.apply(undefined, radii);
                let sum = 0;
                radii.forEach(v => sum += v);
                if (sum > maxRadius * 2) {
                    radii = radii.map(v => (v + itemRadius) * 2);
                    visibleItems[i].r = binarySolve(0, visibleItems[i].children.length * maxRadius + itemRadius, (r) => {
                        let totalAngle = 0;
                        radii.forEach(v => { totalAngle += 2 * Math.asin(((v / 2)) / r) });
                        //console.log(totalAngle);
                        if (isNaN(totalAngle)) return -1;
                        return Math.PI * 2 - totalAngle;
                    })
                } else {
                    //sometimes you get radii=[100,200,800] so the two 100 and 200 aren't big enough to cover the remaining space from the 800
                    //so just set radius = 800 and be done with it
                    visibleItems[i].r = maxRadius + itemRadius;
                }
                //Sometimes the asin in the lower line returns a NaN - prevent this by making the operand 1.
                if (visibleItems[i].r < maxRadius + itemRadius) visibleItems[i].r = maxRadius + itemRadius;
                //reported radius - includes child radii as well.
                visibleItems[i].rr = visibleItems[i].r + maxRadius;
            }
            //if ((maxLvl - visibleItems[i].level)==0)visibleItems[i].r=0;
            //else visibleItems[i].r = 100 * 4 ** (maxLvl - visibleItems[i].level-1);
            //also calculate angle of my children while we're here
            visibleItems[i].children.forEach(v => {
                visibleItems[indexedOrder.indexOf(v)].angle = 2 * Math.asin((visibleItems[indexedOrder.indexOf(v)].rr + itemRadius - 1) / visibleItems[i].r);
                if (isNaN(visibleItems[indexedOrder.indexOf(v)].angle)) visibleItems[indexedOrder.indexOf(v)].angle = 0;
            })
        }
        //render, top down
        for (let i = 0; i < visibleItems.length; i++) {
            visibleItems[i].cumulativeAngle = 0;
            if (visibleItems[i].level == 0) {
                if (visibleItems[i].id != '0') {
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].x = 0;
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].y = 0;
                }
            } else {
                visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle += visibleItems[i].angle / 2;
                if (visibleItems[i].parent != '0') {
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].x = polymorph_core.items[visibleItems[i].parent].itemcluster.viewData[this.settings.currentViewName].x +
                        Math.cos(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].y = polymorph_core.items[visibleItems[i].parent].itemcluster.viewData[this.settings.currentViewName].y +
                        Math.sin(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                } else {
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].x = Math.cos(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].y = Math.sin(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                }
                visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle += visibleItems[i].angle / 2;
            }
        }
    }

    this.rootcontextMenu.addEventListener("click", (e) => {
        if (!e.target.classList.contains("hierarchy")) return;
        let visibleItems = generateHierarchy();
        //visible items looks like this:
        /*
        [{children: ["i78f1k"],
        id: "buwnq5",
        level: 0,
        width: 210,
        x: -2544.984375,
        y: 278}]
        */
        if (e.target.classList.contains('radial')) {
            radialHierarchy(e, visibleItems);
        } else if (e.target.classList.contains('biradial')) {
            biradialHierarchy(e, visibleItems);
        } else {
            cartesianHierarchy(e, visibleItems);
        }

        for (let i in polymorph_core.items) {
            this.container.fire("updateItem", {
                id: i
            });
        }

    })
    this.searchArray = [];
    let searchArrayIndex = 0;
    let focusSearchItem = (index) => {
        let id = this.searchArray[index];
        if (!id) {
            this.rootcontextMenu.querySelector(".searchNextResult").style.background = "palevioletred";
        } else {
            this.rootcontextMenu.querySelector(".searchNextResult").style.background = "white";
            let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
            ic.scale = 1;
            ic.cx = polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].x * ic.XZoomFactor;
            ic.cy = polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].y;
            this.viewAdjust();
            this.viewGrid();
        }
    }
    this.rootcontextMenu.querySelector(".search input").addEventListener("input", () => {
        //create the search array
        this.searchArray = [];
        for (let id in polymorph_core.items) {
            if (this.itemIsOurs(id)) {
                if (polymorph_core.items[id][this.settings.textProp] && polymorph_core.items[id][this.settings.textProp].includes(this.rootcontextMenu.querySelector(".search input").value)) {
                    this.searchArray.push(id);
                }
            }
        }
        if (searchArrayIndex > this.searchArray.length) searchArrayIndex = 0;
        focusSearchItem(searchArrayIndex);
    });
    this.rootcontextMenu.querySelector(".searchNextResult").addEventListener("click", () => {
        searchArrayIndex++;
        if (searchArrayIndex > this.searchArray.length) {
            searchArrayIndex = 0;
        }
        focusSearchItem(searchArrayIndex);
    })
    this.viewContextMenu = contextMenuManager.registerContextMenu(
        `<li class="viewDeleteButton">Delete</li>
            <li class="viewCloneButton">Clone view</li>
            <li class="viewAsItemButton">Copy view as item</li>`,
        this.viewDropdownContainer
    );
    this.viewContextMenu.querySelector(".viewAsItemButton").addEventListener("click", e => {
        polymorph_core.shared.itemclusterCopyElement = [{ id: this.settings.currentViewName, x: 0, y: 0 }];
        polymorph_core.items[this.settings.currentViewName].itemcluster.viewData = {};
        this.viewContextMenu.style.display = "none";
    });

    this.viewContextMenu.querySelector(".viewDeleteButton").addEventListener("click", e => {
        this.destroyView(this.settings.currentViewName);
        this.viewContextMenu.style.display = "none";
    });

    this.viewCloneButton = this.viewContextMenu.querySelector(".viewCloneButton");
    this.viewCloneButton.addEventListener("click", e => {
        this.cloneView(this.settings.currentViewName);
        this.viewContextMenu.style.display = "none";
    });
    this.itemContextMenu = contextMenuManager.registerContextMenu(
        `<li class="deleteButton">Delete</li>
        <li class="cascadebtn">Cascade by punctuation</li>
        <li class="hierarchybtn">Hierarchy by punctuation</li>
        <li class="scramble">Scramble</li>
        <li class="collcon">Collect connected items</li>
        <li class="cpybtn">Copy (between views)</li>
        <li class="subview">Open Subview</li>
        <li>Edit style
        <ul class="submenu">
            <li class="cstyl">Copy style</li>
            <li class="pstyl">Paste style</li>
            <li><input class="background" placeholder="Background"></li>
            <li><input class="color" placeholder="Color"></li>
        </ul>
        </li>
        <!--<li class="orientation">Reorient subitems</li>-->
          `,
        this.rootdiv,
        ".floatingItem",
        e => {
            let cte = e.target;
            while (!cte.matches(".floatingItem")) cte = cte.parentElement;
            this.contextedElement = cte;
            if (polymorph_core.items[cte.dataset.id].style) {
                this.itemContextMenu.querySelector(".background").value = polymorph_core.items[cte.dataset.id].style.background || "";
                this.itemContextMenu.querySelector(".color").value = polymorph_core.items[cte.dataset.id].style.color || "";
            } else {
                this.itemContextMenu.querySelector(".background").value = "";
                this.itemContextMenu.querySelector(".color").value = "";
            }
            return true;
        }
    );

    let updateStyle = (e) => {
        let cids = [this.contextedElement.dataset.id];
        let applyToAll = false;
        this.movingDivs.forEach((v) => {
            if (v.el.node.dataset.id == cids[0]) {
                //apply to all moving divs.
                applyToAll = true;
            }
        });
        if (applyToAll) {
            cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
        }
        cids.forEach((cid) => {
            if (!polymorph_core.items[cid].style) polymorph_core.items[cid].style = {};
            polymorph_core.items[cid].style[e.target.className] = e.target.value;
            this.container.fire("updateItem", {
                sender: this,
                id: cid
            });
            this.arrangeItem(cid);
        })
    }
    this.itemContextMenu
        .querySelector(".cstyl")
        .addEventListener("click", () => {
            let cid = this.contextedElement.dataset.id;
            this.copiedStyle = Object.assign({}, polymorph_core.items[cid].style);
            this.itemContextMenu.style.display = "none";
        });
    this.itemContextMenu
        .querySelector(".pstyl")
        .addEventListener("click", () => {
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
            }
            cids.forEach((cid) => {
                polymorph_core.items[cid].style = Object.assign({}, this.copiedStyle);
                this.arrangeItem(cid);
                this.container.fire("updateItem", {
                    sender: this,
                    id: cid
                });
            })
            this.itemContextMenu.style.display = "none";
        });
    this.itemContextMenu
        .querySelector(".background")
        .addEventListener("input", updateStyle);
    this.itemContextMenu
        .querySelector(".color")
        .addEventListener("input", updateStyle);

    this.itemContextMenu
        .querySelector(".deleteButton")
        .addEventListener("click", e => {
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
                this.clearOutMovingDivs();
            }
            cids.forEach((cid) => {
                //delete the div and delete its corresponding item
                this.removeItem(cid);
            })
            this.itemContextMenu.style.display = "none";
        });

    this.itemContextMenu
        .querySelector(".scramble")
        .addEventListener("click", e => {
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
            }
            cids.forEach((cid) => {
                polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName].x = Math.random() * 500 / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor + polymorph_core.items[cids[0]].itemcluster.viewData[this.settings.currentViewName].x
                polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName].y = Math.random() * 500 + polymorph_core.items[cids[0]].itemcluster.viewData[this.settings.currentViewName].y
            })
            this.itemContextMenu.style.display = "none";
        });

    this.itemContextMenu
        .querySelector(".collcon")
        .addEventListener("click", e => {
            let thisit = polymorph_core.items[this.contextedElement.dataset.id];
            let toCollect = Object.keys(thisit.to || {});
            toCollect.push.apply(toCollect, Object.keys(this.fromcache[this.contextedElement.dataset.id] || {}));
            toCollect = toCollect.filter(i => polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]);
            toCollect.forEach((v, i) => {
                polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].x = thisit.itemcluster.viewData[this.settings.currentViewName].x + 250 * Math.cos(0.2 + 2 * Math.PI * i / toCollect.length) / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor;
                polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].y = thisit.itemcluster.viewData[this.settings.currentViewName].y + 250 * Math.sin(0.2 + 2 * Math.PI * i / toCollect.length);
                this.container.fire("updateItem", { id: v, sender: this });
                this.arrangeItem(v);
            })
        });

    function segment(innerText) {
        innerText = innerText.replace(/(\d+?)\./g, "*$* $1\\.");
        innerText = innerText.replace(/(((?<!\\)\.|\?|\n)+)/g, "$1*$*");
        innerText = innerText.replace(/\n/g, "");
        innerText = innerText.split(/\*\$\*/g);
        innerText = innerText.filter(i => i.length);
        return innerText;
    }
    this.itemContextMenu
        .querySelector(".cascadebtn")
        .addEventListener("click", e => {
            let innerText = polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp];
            innerText = segment(innerText);

            //filter out newlinefullstops; todo filter out numbered lists?
            //quick adjustement since lookbehinds are not a thing yet
            /*for (let i = 0; i < innerText.length; i++) {
                if (innerText[i][0] == '.' || innerText[i][0] == '?') {
                    if (i > 0) {
                        innerText[i - 1] += innerText[i][0];
                    }
                }
            }
            for (let i = 0; i < innerText.length; i++)if (innerText[i][0] == '\n') innerText[i] = innerText[i].slice(1);// also slices newline chars
            */
            //first
            polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp] = innerText.shift();
            this.container.fire("updateItem", { id: this.contextedElement.dataset.id, sender: this });
            //create a bunch of items
            let VDT = polymorph_core.items[this.contextedElement.dataset.id].itemcluster.viewData[this.settings.currentViewName];
            let lasty = VDT.y;
            let lastItem = polymorph_core.items[this.contextedElement.dataset.id];
            if (!lastItem.to) lastItem.to = {};
            let newIDs = innerText.map(i => {
                let newItem = {
                    itemcluster: {
                        viewData: {
                        }
                    },
                    to: {}
                };
                newItem[this.settings.textProp] = i;
                newItem[this.settings.filter] = true;
                newItem.itemcluster.viewData[this.settings.currentViewName] = { x: VDT.x, y: lasty += 50 };
                newID = polymorph_core.insertItem(newItem);
                lastItem.to[newID] = true;
                lastItem = polymorph_core.items[newID];
                this.container.fire("updateItem", { id: newID, sender: this });
                return newID;
            });
            this.arrangeItem(this.contextedElement.dataset.id);
            newIDs.forEach(i => {
                this.arrangeItem(i);
            })
            this.itemContextMenu.style.display = "none";
        });


    this.itemContextMenu
        .querySelector(".hierarchybtn")
        .addEventListener("click", e => {
            let innerText = polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp];
            innerText = segment(innerText)
            //filter out newlinefullstops; todo filter out numbered lists?
            //quick adjustement since lookbehinds are not a thing yet
            /*for (let i = 0; i < innerText.length; i++) {
                if (innerText[i][0] == '.' || innerText[i][0] == '?') {
                    if (i > 0) {
                        innerText[i - 1] += innerText[i][0];
                    }
                }
            }
            for (let i = 0; i < innerText.length; i++)if (innerText[i][0] == '\n') innerText[i] = innerText[i].slice(1);// also slices newline chars
            */
            //first
            polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp] = innerText.shift();
            //create a bunch of items
            let VDT = polymorph_core.items[this.contextedElement.dataset.id].itemcluster.viewData[this.settings.currentViewName];
            let lastItem = polymorph_core.items[this.contextedElement.dataset.id];
            if (!lastItem.to) lastItem.to = {};
            let newIDs = innerText.map((i, ii) => {
                let newItem = {
                    itemcluster: {
                        viewData: {
                        }
                    },
                    to: {}
                };
                newItem[this.settings.textProp] = i;
                newItem[this.settings.filter] = true;
                newItem.itemcluster.viewData[this.settings.currentViewName] = { x: VDT.x + Math.cos(ii / innerText.length * Math.PI * 2) * 200, y: VDT.y + Math.sin(ii / innerText.length * Math.PI * 2) * 200 };
                newID = polymorph_core.insertItem(newItem);
                polymorph_core.items[this.contextedElement.dataset.id].to[newID] = true;
                this.container.fire("updateItem", { id: newID, sender: this });
                return newID;
            });
            this.container.fire("updateItem", { id: this.contextedElement.dataset.id, sender: this });
            this.arrangeItem(this.contextedElement.dataset.id);
            newIDs.forEach(i => {
                this.arrangeItem(i);
            })
            this.itemContextMenu.style.display = "none";
        });
    this.itemContextMenu
        .querySelector(".cpybtn")
        .addEventListener("click", e => {
            //may be multiple
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => v.el.node.dataset.id);
                this.clearOutMovingDivs();
            }
            let els = cids.map((v) => {
                return {
                    id: v,
                    x: polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].x - coords.x,
                    y: polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].y - coords.y
                };
            })
            polymorph_core.shared.itemclusterCopyElement = els;
            this.itemContextMenu.style.display = "none";
        });
    /*this.itemContextMenu
        .querySelector(".orientation")
        .addEventListener("click", e => {
            //toggle the itemcluster orientation
            polymorph_core.items[this.contextedElement.dataset.id].itemcluster.subitemOrientation = !polymorph_core.items[this.contextedElement.dataset.id].itemcluster.subitemOrientation;
            //reupdate
            this.arrangeItem(this.contextedElement.dataset.id);
            this.itemContextMenu.style.display = "none";
        });*/

    this.itemContextMenu
        .querySelector(".subView")
        .addEventListener("click", e => {
            polymorph_core.items[
                this.contextedElement.dataset.id
            ].itemcluster.viewName = polymorph_core.items[
            this.contextedElement.dataset.id
            ][this.settings.textProp];
            this.switchView(this.contextedElement.dataset.id, true, true);
            this.itemContextMenu.style.display = "none";
        });
    this.trayContextMenu = contextMenuManager.registerContextMenu(`
        <li class="delete">Delete</li>
        `, this.tray, "textarea", (e) => {
        this.trayContextedElement = e.target.parentElement.dataset.id;
        return true;
    });
    this.trayContextMenu.querySelector(".delete").addEventListener("click", (e) => {
        if (this.settings.filter) delete polymorph_core.items[this.trayContextedElement][this.settings.filter];
        else {
            polymorph_core.items[this.trayContextedElement].itemcluster.viewData = {};//nerf it completely
        }
        this.container.fire("updateItem", { id: this.trayContextedElement });
        this.trayContextMenu.style.display = "none";
    })
};

function _itemcluster_extend_scalegrid(me) {
    ///////////////////////////////////////////////////////////////////////////////////////
    //When moving objects, if there is a grid, snap to the grid
    me.alignGrid = (it) => {
        if (polymorph_core.items[me.settings.currentViewName].itemcluster.grid) {
            let g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;
            if (it.x() > 0) {
                if (it.x() % g > g / 2) it.x(it.x() + (g - it.x() % g));
                else it.x(it.x() - it.x() % g);
            } else {
                if (it.x() % g < -g / 2) it.x(it.x() - (g + it.x() % g));
                else it.x(it.x() - it.x() % g);
            }
            if (it.y() > 0) {
                if (it.y() % g > g / 2) it.y(it.y() + (g - it.y() % g));
                else it.y(it.y() - it.y() % g);
            } else {
                if (it.y() % g < -g / 2) it.y(it.y() - (g + it.y() % g));
                else it.y(it.y() - it.y() % g);
            }
        }
    }

    //When pressing G and scrolling, show the grid menu. The grid should grow as 1,2,5,10,20,50 etc.
    window.addEventListener("keydown", (e) => {
        if (me.container.visible()) {
            if (e.key == "g") {
                me.gridScroll = true;
                me.viewGrid();
            }
            if (me.gridScroll) {
                if (e.key == "ArrowDown") {
                    me.handleGridScroll({ deltaY: 1 });
                } else if (e.key == "ArrowUp") {
                    me.handleGridScroll({ deltaY: -11 });

                }
            }
        }
    })
    window.addEventListener("keyup", (e) => {
        if (e.key == "g") {
            me.gridScroll = false;
            //me.hideGrid();
        }
    })
    me.handleGridScroll = (e) => {
        if (!polymorph_core.items[me.settings.currentViewName].itemcluster.grid) {
            polymorph_core.items[me.settings.currentViewName].itemcluster.grid = 0;
        }
        let g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;
        let dg = 1;
        if (e.deltaY > 0) {
            switch (g / 10 ** Math.floor(Math.log10(g))) {
                case 0:
                    dg = 1;
                    break;
                case 1:
                    dg = 2;
                    break;
                case 2:
                    dg = 5;
                    break;
                case 5:
                    dg = 10;
                    break;
            }
        } else {
            switch (g / 10 ** Math.floor(Math.log10(g))) {
                case 0:
                    dg = 0;
                    break;
                case 1:
                    if (g == 1) dg = 0;
                    else dg = 0.5;
                    break;
                case 2:
                    dg = 1;
                    break;
                case 5:
                    dg = 2;
                    break;
                default:
                    // nan if g =0
                    dg = 0;
                    break;
            }
        }

        if (g == 0 && dg != 0) g = 1;
        else g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;

        polymorph_core.items[me.settings.currentViewName].itemcluster.grid = dg * 10 ** Math.floor(Math.log10(g));

        me.viewGrid();
    }
    me.hideGrid = () => {

        if (me.tempGridPattern) {
            me.tempGridPattern.remove();
            me.tempGridPattern = undefined;
            me.tempTR.remove();
            me.tempTR = undefined;
        }
    }
    me.tempTR = undefined;
    me.tempGridPattern = undefined;
    me.gcache = [0, ""];
    me.viewGrid = () => {
        let g = polymorph_core.items[me.settings.currentViewName].itemcluster.grid;
        let vb = me.svg.viewbox();
        if (me.gcache[0] != g || JSON.stringify(me.gcache[1]) != JSON.stringify(vb)) {
            setTimeout(() => {
                //also draw on the grid - and hide it later
                me.hideGrid();
                me.tempGridPattern = me.svg.pattern(g, g, function (add) {
                    add.line(0, 0, 0, g).stroke({ color: '#f06', width: 2 / vb.zoom });
                    add.line(0, 0, g, 0).stroke({ color: '#f06', width: 2 / vb.zoom });
                });
                me.tempTR = me.svg.rect(0, 0).back();
                me.tempTR.size(vb.width, vb.height).move(vb.x, vb.y).fill(me.tempGridPattern);
            });
            me.gcache = [g, vb];
        }
    }
};

function _itemcluster_rapid_entry() {
    // in the options menu, show the rapidentry checkbox
    this.dialogOptions['rapidEntryOn'] = new polymorph_core._option({
        div: this.dialogDiv,
        type: "bool",
        object: this.settings,
        property: "rapidEntryOn",
        label: "Search and command box",
    });
    this.rapidEntryDiv = document.createElement("div");
    this.rapidEntryDiv.innerHTML = `
    <div class="suggestionsbox" style="position:absolute; top: -10px; width:100%; height: 0px; background: white"></div>
    <p style="background:white; margin:0; width:100%; display:flex;"><span class="cmd">Search</span>: <input type="text" style="flex: 0 1 100%"></input></p>
    `;
    let cmdspan = this.rapidEntryDiv.querySelector("span.cmd");
    let sugbox = this.rapidEntryDiv.querySelector(".suggestionsbox");
    let tray = this.rootdiv.querySelector(".tray");
    tray.parentElement.appendChild(this.rapidEntryDiv);
    this.rapidEntryDiv.style.cssText = `
    position:absolute;
    bottom:0px;
    width: 100%;
    display:none;
    `;
    // hook to settings change, since we can't hook onto close
    this.dialogOptions['rapidEntryOn'].appendedElement.addEventListener("input", (e) => {
        if (e.target.checked) {
            //show the thing
            this.rapidEntryDiv.style.display = "block";
        } else {
            this.rapidEntryDiv.style.display = "none";
        }
    })

    if (this.settings.rapidEntryOn == false) { // not undefined
    } else {
        this.settings.rapidEntryOn = true;// on by default
        // if rapidentry on, show the rapidentry interface
        this.rapidEntryDiv.style.display = "block";
    }

    // create the cache of all items that we care about
    let REcache = {};
    for (let i in polymorph_core.items) {
        if (this.itemRelevant(i) && polymorph_core.items[i][this.settings.textProp]) {
            //add it to the cache
            REcache[i] = polymorph_core.items[i][this.settings.textProp];
        }
    }
    //update the REcache in... keydown? yikes... strapping a capacitor to it stat

    let recacheCapacitor = new capacitor(500, 100, (id, tt) => {
        REcache[id] = tt; // there's one more case which is external updates but we'll get to it .....
    });

    this.rootdiv.addEventListener("input", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (!e.path[i].dataset) return;// not an item, probably the rapid entry bar
            if (e.path[i].dataset.id) {
                let id = e.path[i].dataset.id;
                recacheCapacitor.submit(id, e.target.innerText);
            }
        }
    })
    // nonshift enter is exit edit mode 
    let specialOptions = ["NEW", "CNT", "CNF", "DIS"];
    let RIE = this.rapidEntryDiv.querySelector("input");
    let rIndex = 0;
    let tmpItems = [];
    let opmode = "NEW";
    let updateCMDText = () => {
        switch (opmode) {
            case 'NEW':
                cmdspan.innerText = "Search";
                break;
            case 'CNT':
                cmdspan.innerText = "CNT";
                break;
            case 'CNF':
                cmdspan.innerText = "CNF";
                break;
            case 'DIS':
                cmdspan.innerText = "DIS";
                break;
        }
    }

    let RIESRadical = undefined;
    this.focusOnRIES = () => {
        if (!RIESRadical) RIESRadical = this.svg.rect(30, 30).fill('transparent').stroke('blue').back();
        RIESRadical.cx(polymorph_core.items[this.rapidEntrySelection].itemcluster.viewData[this.settings.currentViewName].x
            * polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor).cy(polymorph_core.items[this.rapidEntrySelection].itemcluster.viewData[this.settings.currentViewName].y);
    }

    let tryFocusOnEvent = (e) => {
        if (e.target.matches(".floatingItem") || e.target.matches(".floatingItem *")) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            this.rapidEntrySelection = it.dataset.id;
            this.focusOnRIES();
        }
    }

    this.itemSpace.addEventListener("mousedown", (e) => {
        tryFocusOnEvent(e);
    });

    this.itemSpace.addEventListener("mouseup", (e) => {
        //not mousemove bc then hovering over items activates, and bc x y only updated after move complete
        tryFocusOnEvent(e);
    });

    // enter in general is process command
    RIE.addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            //create a new item at a random location within viewport
            if (e.target.value[0] == '\\' && specialOptions.includes(e.target.value.slice(1))) {
                opmode = e.target.value.slice(1);
                updateCMDText();
            } else {
                if (opmode == "NEW") {
                    if (rIndex == tmpItems.length - 1) {
                        let vb = this.svg.viewbox();
                        id = this.createItem(
                            (vb.x + vb.width / 2) / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor,
                            vb.y + vb.height / 2
                        );
                        polymorph_core.items[id][this.settings.textProp] = RIE.value;
                        polymorph_core.items[id]._prg = true;
                        this.container.fire("updateItem", { id: id, sender: this });
                        this.arrangeItem(id);
                        this.rapidEntrySelection = id;
                        this.focusOnRIES();
                    } else {
                        //find and focus the selected item
                        this.centreAndFocus(tmpItems[rIndex].id);
                        this.rapidEntrySelection = tmpItems[rIndex].id;
                        this.focusOnRIES();
                    }
                } else if (opmode == "CNT" || opmode == "CNF") {
                    if (this.rapidEntrySelection) {
                        if (this.opmode == "CNT") {
                            polymorph_core.link(this.rapidEntrySelection, tmpItems[rIndex].id);
                            this.container.fire("updateItem", { id: this.rapidEntrySelection, sender: this });
                            this.arrangeItem(this.rapidEntrySelection);
                        } else {
                            polymorph_core.link(tmpItems[rIndex].id, this.rapidEntrySelection);
                            this.container.fire("updateItem", { id: tmpItems[rIndex].id, sender: this });
                            this.arrangeItem(tmpItems[rIndex].id);
                        }
                    } else {
                        this.rapidEntrySelection = tmpItems[rIndex].id;
                        this.focusOnRIES();
                    }
                    console.log(this.rapidEntrySelection);
                }
            }
            while (sugbox.children.length) sugbox.children[0].remove();
            sugbox.style.height = 0;
            RIE.value = "";
        }
        else {
            if (e.key == "ArrowUp") {
                if (rIndex > 0) rIndex--;
                e.preventDefault();
            } else if (e.key == "ArrowDown") {
                rIndex++;
                e.preventDefault();
            }
            //look thru the cache, and find matches (this will be v time consuming - how to speed up?)
            //also when to update the cache? container.onupdateitem? or something else, like global input listener? I'm happy with the global input listener.
            while (sugbox.children.length) sugbox.children[0].remove();
            tmpItems = [];
            if (e.target.value == "\\HELP") {
                tmpItems = specialOptions;

                tmpItems.forEach((i, ind) => {
                    let p = document.createElement('p');
                    p.style.height = "1em";
                    p.style.margin = 0;
                    if (ind == rIndex) p.style.background = "lavender";
                    p.innerText = i;
                    sugbox.appendChild(p);
                })
                sugbox.style.height = tmpItems.length + "em";
                sugbox.style.top = -tmpItems.length + "em";
            }
            if (e.target.value.length) {
                for (let i in REcache) {
                    if (REcache[i].toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase())) {
                        tmpItems.push({ id: i, txt: REcache[i] });
                    }
                }
                tmpItems = tmpItems.filter((v, i) => i < 10);
                if (opmode == "NEW") tmpItems.push({ txt: "Create new..." });

                tmpItems.forEach((i, ind) => {
                    let p = document.createElement('p');
                    p.style.height = "1em";
                    p.style.margin = 0;
                    if (ind == rIndex) p.style.background = "lavender";
                    p.innerText = i.txt.replace(/\n/g, " ").slice(0, 100);
                    sugbox.appendChild(p);
                })
                sugbox.style.height = tmpItems.length + "em";
                sugbox.style.top = -tmpItems.length + "em";
            } else {
                sugbox.style.height = 0;
            }
        }
    })

    this.rootdiv.addEventListener("input", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (!e.path[i].dataset) return;// not an item, probably the rapid entry bar
            if (e.path[i].dataset.id) {
                let id = e.path[i].dataset.id;
                if (e.target.classList.contains("tta")) REcache[i] = e.target.innerText;
            }
        }
    })

    //commands:
    /*
    type anything to navigate; up and down are select the item, enter is goto - autocomplete. 
        - default is make new. if make new is not accepted then it is goto.
    \e is edit this item. show EDIT mode.
    \E is edit this item's description
    \lf is link from - begin autocomplete 
    \lt is link to - begin autocomplete
    \org is organise - entire organisation menu. can be x, y, r, th or combination of all.
    \filt is filter - create a new view with only the selected items? split things along some axis (x,y,r,th) based on yes or no to a certain condition
    
    */

};

polymorph_core.registerOperator("itemcluster2", {
    displayName: "Mind map",
    description: "A brainstorming / mind mapping board. Add items, arrange them, and connect them with lines.",
    section: "Standard",
    imageurl: "assets/operators/itemcluster.png"
}, function (container) {
    polymorph_core.addEventAPI(this);

    let defaultSettings = {
        itemcluster: {
            cx: 0,
            cy: 0,
            scale: 1
        },
        filter: polymorph_core.guid(6),
        tray: false,
        createAcrossViews: true,
        showNewViewButton: false,
        textProp: "title",
        focusExtendProp: "description"// when we focus, show this in a separate div
    };


    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    this.rootdiv.style.cssText = `
    overflow:hidden;
    `;
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <style>
    .viewNameDrop{
        position: absolute;
        background-color: #f9f9f9;
        z-index: 1;
        list-style: none;
    }

    .viewNameDrop>a{
        display:block;
    }

    .viewNameDrop>a:hover{
        display:block;
        background:lavender;
    }
    .itemcluster-container{
        height:100%;
    }

    .anchored>div>textarea{
        border: 3px dashed blue;
    }

    .floatingItem>div>textarea{
        resize:none;
        width: 100%;
        height: calc(100% - 15px);
    }

    .floatingItem>div{
        resize:both;
        overflow: auto;
        border: 1px solid black;
        box-sizing: border-box;
    }
    .itemcluster{
        position:relative;
    }
    .tray{
        position:absolute;
        transform: translateY(80px);
        height: 120px;
        width: 100%;
        bottom: 0;
        background: lightgrey;
        transition: all 0.5s ease;
        flex-direction:row;
        overflow-x:auto;
    }
    .tray:hover{
        transform: translateY(0);
    }
    .tray textarea{
        height:100%;
        resize: none;
    }

    .tta, .ttb{
        margin:0;
    }

    </style>
<div style="height:100%">
    <div class="itemcluster-container" style="height:100%; display:flex; flex-direction:column;">
        <div class="itemcluster-banner">
            <span class="topbar" style="user-select: none; color:white; background:rgb(113, 28, 156);">
                <a>View:</a>
                <span>
                    <a class="viewNameContainer" style="user-select:text"><span><span contenteditable class="viewName" data-listname='main' style="cursor:text"></span><span
                                class="listDrop">&#x25BC</span>
                        </span><!--<img class="gears" src="assets/gear.png" style="height:1em">--></a>
                    <div class="viewNameDrop" style="display:none; color: black">
                    </div>
                </span>
            </span>
        </div>
        <div class="itemcluster"  style="flex: 1 1 100%;position: relative; background:transparent;  overflow:hidden">
        <div class="tray">
        </div>
        </div>
    </div>
</div>`;
    this.viewName = this.rootdiv.querySelector(".viewName");
    this.viewDropdown = this.rootdiv.querySelector(".viewNameDrop");
    this.viewDropdownButton = this.rootdiv.querySelector(".listDrop");
    this.viewDropdownContainer = this.rootdiv.querySelector(
        ".viewNameContainer"
    );
    this.itemSpace = this.rootdiv.querySelector(".itemcluster");
    container.div.appendChild(this.rootdiv);
    this.tray = this.rootdiv.querySelector(".tray");

    this.tray.addEventListener("wheel", (e) => {
        this.tray.scrollLeft += e.deltaY;
    })

    this.tray.addEventListener("input", (e) => {
        polymorph_core.items[e.target.parentElement.dataset.id][this.settings.textProp] = e.target.value;
        container.fire('updateItem', { sender: this, id: e.target.parentElement.dataset.id });
    })

    this.viewDropdownContainer.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            e.preventDefault();
            e.target.blur();
        }
    })

    this.centreAndFocus = (id) => {
        polymorph_core.items[this.settings.currentViewName].itemcluster.cx = this.itemPointerCache[id].cx();
        polymorph_core.items[this.settings.currentViewName].itemcluster.cy = this.itemPointerCache[id].cy();
        this.viewAdjust();
        if (this.preselected) {
            this.preselected.classList.remove("selected");
            this.preselected.classList.remove("anchored");
        }
        this.preselected = this.itemPointerCache[id].node;
        this.preselected.classList.add("anchored");
        this.tryFocus(id, true);
    };

    //////////////////////////// Focusing an item////////////////////
    container.on("focusItem", (d) => {
        if (d.sender == this) return;
        if (this.itemPointerCache[d.id] && polymorph_core.items[d.id].itemcluster.viewData[this.settings.currentViewName]) {
            this.centreAndFocus(d.id);

        }
    })


    ////////////////////////////////////////Handle polymorph_core item updates//////////////////

    this.itemRelevant = (id) => {
        // I will be shown at some point by this container
        let isFiltered = (polymorph_core.items[id][this.settings.filter] != undefined);
        let hasView = polymorph_core.items[id].itemcluster != undefined && polymorph_core.items[id].itemcluster.viewName != undefined;
        if (polymorph_core.items[id].itemcluster && polymorph_core.items[id].itemcluster.viewData) {
            for (let i in polymorph_core.items[id].itemcluster.viewData) {
                if (polymorph_core.items[i] && ((!this.settings.filter) || (polymorph_core.items[i][this.settings.filter] != undefined))) {
                    hasView = true;
                }
            }
        }
        return (hasView || this.settings.tray) && (!(this.settings.filter) || isFiltered);

    }
    container.on("updateItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        if (sender == this) return;

        if (this.container.visible()) {
            if (polymorph_core.items[id].itemcluster) {
                if (polymorph_core.items[id].itemcluster.viewData) {
                    if (polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName]) {
                        if (this.arrangeItem) {
                            this.arrangeItem(id);
                        }
                    } else {
                        if (!(this.settings.filter) || polymorph_core.items[id][this.settings.filter]) this.addToTray(id);
                        else {
                            this.removeFromTray(id);
                        }
                    }
                }
            }
        }
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
    });



    ///////////////////////////////////////////////////////////////////////////////////////
    //Views

    Object.defineProperty(this, "views", {
        get: () => {
            let results = [];
            for (i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewName) {
                    if (this.settings.filter && !(polymorph_core.items[i][this.settings.filter])) continue;//apply filter to views
                    results.push(i);
                }
                //v = itemcluster.views[i].name;
            }
            return results;
        }
    })

    //Editing the name of a view
    this.viewName.addEventListener("keyup", (e) => {
        polymorph_core.items[this.settings.currentViewName].itemcluster.viewName =
            e.currentTarget.innerText;
        container.fire("updateItem", {
            id: this.settings.currentViewName,
            sender: this
        });
    });

    this.viewDropdown.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "a") {
            if (e.target.dataset.isnew) {
                //make a new view
                let nv = this.makeNewView();
                this.switchView(nv);
            } else {
                let id = e.target.dataset.listname;
                this.switchView(id);
            }
        } else {
            if (e.target.tagName.toLowerCase() == "em") {
                nv = Date.now().toString();
                nv = this.makeNewView();
                this.switchView(nv);
            }
        }
        this.viewDropdown.style.display = "none";
        e.stopPropagation();
    });

    this.viewDropdownButton.addEventListener("click", () => {
        this.viewDropdown.innerHTML = "";
        this.currentView
        this.views.forEach(i => {
            let aa = document.createElement("a");
            aa.dataset.listname = i;
            aa.innerHTML = polymorph_core.items[i].itemcluster.viewName;
            this.viewDropdown.appendChild(aa);
        })
        if (this.settings.showNewViewButton) this.viewDropdown.appendChild(htmlwrap(`<a data-isnew="yes"><em>Add another view</em></a>`));
        this.viewDropdown.style.display = "block";
    });

    //hide the view dropdown button, if necessary.
    this.rootdiv.addEventListener("mousedown", (e) => {
        let p = e.target;
        while (p != this.rootdiv && p) {
            if (p == this.viewDropdown) return;
            p = p.parentElement;
        }
        this.viewDropdown.style.display = "none";
    });
    waitForFn.apply(this, ["viewGrid"]);
    this.wasPreviouslyVisible = undefined;
    this.switchView = (id, assert, subview) => {
        let previousView = this.settings.currentViewName;
        if (container.visible() != this.wasPreviouslyVisible) {
            this.wasPreviouslyVisible = container.visible();
            previousView = undefined;
        }
        this.settings.currentViewName = id;
        if (!this.settings.currentViewName) {
            //if not switching to any particular view, switch to first available view.
            let switched = false;
            for (let i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewName) {
                    if (this.settings.filter && !(polymorph_core.items[i][this.settings.filter])) {
                        continue;
                    }
                    this.switchView(i);
                    switched = true;
                    break;
                }
            }
            //If no views, make a new view to switch to.
            if (!switched) {
                this.switchView(polymorph_core.guid(4), true);
            }
            //Show blank
        } else {
            if (!polymorph_core.items[this.settings.currentViewName] ||
                !polymorph_core.items[this.settings.currentViewName].itemcluster ||
                !polymorph_core.items[this.settings.currentViewName].itemcluster.viewName) {
                if (assert) {
                    this.switchView(this.makeNewView(this.settings.currentViewName));
                } else {
                    //view doesnt exist, switch to any view
                    this.switchView();
                    return;
                }
            }
            //buttons
            this.viewName.innerText =
                polymorph_core.items[this.settings.currentViewName].itemcluster.viewName.replace(/\n/ig, "");
            //if this is a subview, add a button on the back; otherwise remove all buttons
            if (previousView != id && previousView) {
                if (subview) {
                    let b = document.createElement("button");
                    b.dataset.ref = previousView;
                    b.innerText = polymorph_core.items[previousView].itemcluster.viewName;
                    b.addEventListener("click", () => {
                        this.switchView(b.dataset.ref, true, false);
                        while (b.nextElementSibling.tagName == "BUTTON") b.nextElementSibling.remove();
                        b.remove();
                    })
                    this.viewName.parentElement.insertBefore(b, this.viewName);
                } else if (subview != false) {
                    //subview is undefined; hard switch (killall buttons)
                    let bs = this.viewName.parentElement.querySelectorAll("button");
                    for (let i = 0; i < bs.length; i++) {
                        bs[i].remove();
                    }
                }
            }
            polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor = polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor || 1;//enforce xzoomfactor
            //kill all lines, if geuninely switching and not using this as part of refresh
            if (previousView != id) {
                for (let i in this.activeLines) {
                    for (let j in this.activeLines[i]) {
                        this.activeLines[i][j].remove();
                        delete this.activeLines[i][j];
                    }
                }

                //reposition all items, also updating viewbox
                for (i in polymorph_core.items) {
                    if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData) {
                        //invalidate cached style so it recolours them.
                        this.cachedStyle[i] = undefined;
                        if (this.arrangeItem) this.arrangeItem(i);
                        //position the item appropriately.
                    }
                }/*
                for (i in polymorph_core.items) {
                    if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData) {
                        if (this.arrangeItem) this.arrangeItem(i);
                        //twice so that all lines show up. How efficient.
                    }
                }*/
            }

            this.viewAdjust();
        }
    };

    this.makeNewView = (id) => {
        //register it with the polymorph_core
        let itm;
        if (!id) {
            itm = {};
            id = polymorph_core.insertItem(itm);
        } else {
            itm = polymorph_core.items[id] || {};
        }
        if (!itm.itemcluster) itm.itemcluster = {};
        itm.itemcluster.viewName = "New View"
        if (this.settings.filter) {
            if (!itm[this.settings.filter]) itm[this.settings.filter] = true;
        }
        polymorph_core.items[id] = itm;//in case we are creating from scratch
        //register a change
        container.fire("updateItem", {
            sender: this,
            id: id
        });
        return id;
    };

    this.cloneView = () => {
        //register it with the polymorph_core
        let newName = "Copy of " + polymorph_core.items[this.settings.currentViewName].itemcluster.viewName;
        let id = this.makeNewView();
        polymorph_core.items[id].itemcluster.viewName = newName;
        container.fire("updateItem", {
            sender: this,
            id: id
        });
        //clone positions as well
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                polymorph_core.items[i].itemcluster.viewData[id] = JSON.parse(JSON.stringify(polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]));
            }
        }
        this.switchView(id);
    };
    this.destroyView = (viewName, auto) => {
        // Destroy the itemcluster property of the item but otherwise leave it alone
        if (this.settings.filter) {
            delete polymorph_core.items[viewName][this.settings.filter];
        } else {
            delete polymorph_core.items[viewName].itemcluster.viewName;
        }
        this.switchView();
    };

    container.on("metaFocusItem", (e) => {
        if (e.sender == this) return;
        if (this.settings.operationMode == "focus") {
            if (e.sender.container.uuid == this.settings.focusOperatorID) {
                this.switchView(e.id, true);
            }
        }
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Items
    this.itemPointerCache = {};
    this.cachedStyle = {};

    _itemcluster_extend_svg(this);

    //More items shenanigans

    this.itemSpace.addEventListener("click", (e) => {
        //click: anchor and deanchor.
        if (!e.target.matches(".anchored,.anchored *")) {
            Array.from(this.itemSpace.querySelectorAll(".anchored")).forEach(i => i.classList.remove("anchored"));
        }
        if (this.preselected) {
            this.preselected.classList.remove("selected");
            this.preselected.classList.remove("anchored");
        }
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            if (this.preselected == it) {
                //keep it anchored
                it.classList.add("anchored");
            } else {
                this.preselected = it;
                it.classList.add("selected");
            }
            container.fire("focusItem", { id: it.dataset.id, sender: this })
        } else {
            this.preselected = undefined;
        }
    });

    this.itemSpace.addEventListener("dblclick", (e) => {
        if (this.preselected) {
            this.preselected.classList.remove("selected");
            this.preselected.classList.remove("anchored");
        }
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;

            this.preselected = it;
            it.classList.add("anchored");
        } else {
            this.preselected = undefined;
        }
    });

    this.dragging = false;
    this.movingDivs = [];
    this.alreadyMoving = -1;//for deselecting nodes
    this.clearOutMovingDivs = () => {
        this.movingDivs.forEach((v) => { v.el.node.children[0].style.border = "1px solid black" });
        this.movingDivs = [];//empty them
    }
    this.itemSpace.addEventListener("mousedown", (e) => {
        if (e.target.matches(".floatingItem") || e.target.matches(".floatingItem *")) {
            // If we are clicking on an item:
            if (e.which != 1) return;
            if (e.getModifierState("Shift")) {
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;
                this.linkingDiv = it;
                this.linking = true;
            } else {
                //if not lineing
                //clear the movingDivs if they need to be cleared
                this.shouldHighlightMovingDivs++;
                if (this.movingDivs.length && !(e.getModifierState("Control") || e.getModifierState("Meta"))) {
                    //also reset the borders
                    this.clearOutMovingDivs();
                }
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;
                if (it.classList.contains("anchored")) return;
                if (this.dragging) return;
                //check to see if we are already in movingDivs...
                this.alreadyMoving = -1;
                this.movingDivs.forEach((v, i) => {
                    if (v.el == this.itemPointerCache[it.dataset.id]) {
                        //remove the red border
                        v.el.node.children[0].style.border = "1px solid black"
                        this.alreadyMoving = i;
                    }
                })
                if (this.alreadyMoving == -1) {
                    this.movingDivs.push({
                        el: this.itemPointerCache[it.dataset.id]
                    });
                }
                this.lastMovingDiv = this.itemPointerCache[it.dataset.id];
                //style it so we can see it
                this.itemPointerCache[it.dataset.id].node.children[0].style.border = "1px solid red";
                //adjust x indexes, if not focused
                if (this.prevFocusID != it.dataset.id) this.itemPointerCache[it.dataset.id].front();
                this.tryFocus(it.dataset.id);
                //it.style.border = "3px solid #ffa2fc";
                this.dragging = true;
                //set relative drag coordinates
                let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
                for (let i = 0; i < this.movingDivs.length; i++) {
                    this.movingDivs[i].dx = coords.x - this.movingDivs[i].el.x();
                    this.movingDivs[i].dy = coords.y - this.movingDivs[i].el.y();
                }
                //return false;
            }
        } else if (e.target.matches(".tray textarea") && e.buttons % 2) {
            this.fromTray = e.target.parentElement.dataset.id;
        } else if (e.getModifierState("Control") || e.getModifierState("Meta")) {
            //start a rectangleDrag!
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.rectangleDragging = {
                rect: this.svg.rect(0, 0).stroke({ width: 1, color: "red" }).fill({ opacity: 0 }),
                sx: coords.x,
                sy: coords.y
            }
        } else {
            //deselect
            if (this.movingDivs.length && !(e.getModifierState("Control") || e.getModifierState("Meta"))) {
                //also reset the borders
                this.clearOutMovingDivs();
            }
            //Pan
            //if (e.getModifierState("Shift") || e.which == 2) {
            this.globalDrag = true;
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.originalViewBox = this.svg.viewbox();
            this.dragDX = coords.x;
            this.dragDY = coords.y;
            this.ocx = polymorph_core.items[this.settings.currentViewName].itemcluster.cx || 0;
            this.ocy = polymorph_core.items[this.settings.currentViewName].itemcluster.cy || 0;
            //}
        }
    });

    this.itemSpace.addEventListener("mousemove", (e) => {
        //stop from creating an item if we are resizing another item
        if (Math.abs(e.offsetX - this.mouseStoredX) > 5 || Math.abs(e.offsetY - this.mouseStoredY) > 5) {
            this.possibleResize = true;
        }
        if (this.fromTray) {
            let cid = this.fromTray;
            //make us drag the item
            this.removeFromTray(cid);
            this.cachedStyle[cid] = undefined;
            if (!polymorph_core.items[cid].itemcluster) polymorph_core.items[cid].itemcluster = {};
            if (!polymorph_core.items[cid].itemcluster.viewData) polymorph_core.items[cid].itemcluster.viewData = {};
            polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName] = { x: 0, y: 0 };
            this.arrangeItem(cid);
            //this is probably broken now
            let divrep = {
                el: this.itemPointerCache[cid],
                dx: 30,
                dy: 30
            };
            this.clearOutMovingDivs();
            this.movingDivs = [divrep];//overwrite the thing in the array
            this.lastMovingDiv = this.itemPointerCache[cid];
            // force a mousemove
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.lastMovingDiv.x(coords.x - divrep.dx);
            this.lastMovingDiv.y(coords.y - divrep.dy);

            this.updatePosition(cid);
            this.dragging = true;
            //set a flag so we dont instantly return it to the tray
            this.stillInTray = true;
            this.fromTray = false;
        }
        if (this.rectangleDragging) {
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            let dx = coords.x - this.rectangleDragging.sx;
            if (dx > 0) {
                this.rectangleDragging.rect.x(this.rectangleDragging.sx).width(dx);
            } else {
                this.rectangleDragging.rect.x(coords.x).width(-dx);
            }
            let dy = coords.y - this.rectangleDragging.sy;
            if (dy > 0) {
                this.rectangleDragging.rect.y(this.rectangleDragging.sy).height(dy);
            } else {
                this.rectangleDragging.rect.y(coords.y).height(-dy);
            }
            this.clearOutMovingDivs();
            for (let i in this.itemPointerCache) {
                if (((this.itemPointerCache[i].cx() > coords.x && this.itemPointerCache[i].cx() < this.rectangleDragging.sx) ||
                    (this.itemPointerCache[i].cx() < coords.x && this.itemPointerCache[i].cx() > this.rectangleDragging.sx)) &&
                    ((this.itemPointerCache[i].cy() > coords.y && this.itemPointerCache[i].cy() < this.rectangleDragging.sy) ||
                        (this.itemPointerCache[i].cy() < coords.y && this.itemPointerCache[i].cy() > this.rectangleDragging.sy))) {
                    this.movingDivs.push({
                        el: this.itemPointerCache[i]
                    });
                    this.itemPointerCache[i].node.children[0].style.border = "1px solid red";
                    //add to movingdivs
                }
            }
        }
        if (this.dragging) {
            this.dragged = true;
            //dragging an item
            //translate position of mouse to position of rectangle
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            for (let i = 0; i < this.movingDivs.length; i++) {
                this.movingDivs[i].el.x(coords.x - this.movingDivs[i].dx);
                this.movingDivs[i].el.y(coords.y - this.movingDivs[i].dy);
            }
            let elements = this.rootdiv.getRootNode().elementsFromPoint(e.clientX, e.clientY);
            //borders for the drag item in item
            if (this.hoverOver) {
                this.hoverOver.style.border = "";
            }
            let stillInTray = false;

            //if we send the items to tray
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].matches(".tray")) {
                    if (this.stillInTray) {
                        stillInTray = true;
                        break;
                    }
                    //send to tray, and end interaction
                    // delete the item from this view
                    this.movingDivs.forEach((v) => {
                        let cid = v.el.attr("data-id");
                        delete polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName];
                        delete polymorph_core.items[cid][`__itemcluster_${this.settings.currentViewName}`];
                        this.arrangeItem(cid);
                        this.addToTray(cid);
                        container.fire("updateItem", { sender: this, id: cid });
                    });
                    this.clearOutMovingDivs();
                    this.dragging = false;
                }
                if (elements[i].matches(".floatingItem") && elements[i].dataset.id != this.lastMovingDiv.attr("data-id")) {
                    this.hoverOver = elements[i];
                    elements[i].style.border = "3px dotted red";
                    break;
                }
            }
            if (!stillInTray) this.stillInTray = false;
            //if we are moving something ensure it wont be twice-click selected.
            this.preselected = undefined;
            //redraw all ITS lines
            for (let i = 0; i < this.movingDivs.length; i++) {
                this.redrawLines(this.movingDivs[i].el.node.dataset.id, "red");
            }
        } else if (this.linking) {
            // draw a line from the object to the mouse cursor
            let rect = this.itemPointerCache[this.linkingDiv.dataset.id];
            let p = this.mapPageToSvgCoords(e.pageX, e.pageY)
            this.linkingLine.plot(
                rect.x() + rect.width() / 2,
                rect.y() + rect.height() / 2,
                p.x,
                p.y
            ).stroke({
                width: 3
            }).marker('end', 9, 6, (add) => {
                add.path("M0,0 L0,6 L9,3 z").fill("#000");
            });
        } else if (this.globalDrag) {
            this.actualMotion = true;
            // shift the view by delta
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY, this.originalViewBox);

            polymorph_core.items[this.settings.currentViewName].itemcluster.cx =
                this.ocx - (coords.x - this.dragDX);
            polymorph_core.items[this.settings.currentViewName].itemcluster.cy =
                this.ocy - (coords.y - this.dragDY);
            //arrange all items
            this.viewAdjust();
        }
    });

    this.viewAdjust = () => {
        let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
        let ww = this.itemSpace.clientWidth * (ic.scale || 1);
        let hh = this.itemSpace.clientHeight * (ic.scale || 1);
        if (this.svg) {
            this.svg.viewbox((ic.cx || 0) - ww / 2, (ic.cy || 0) - hh / 2, ww, hh);
            this.viewGrid();
        } else {
            setTimeout(this.viewAdjust, 200);
        }
    }



    this.itemSpace.addEventListener("wheel", (e) => {
        /*if (e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *") || this.tray.contains(e.target)) {
            return;
        }*/
        if (this.gridScroll) {
            this.handleGridScroll(e);
        } else if (e.shiftKey) {
            let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
            if (!ic.XZoomFactor) ic.XZoomFactor = 1;
            let oldXZoomFactor = ic.XZoomFactor;
            if (e.deltaY > 0) {
                ic.XZoomFactor *= 1.1;
            } else {
                ic.XZoomFactor *= 0.9;
            }
            // adjust all relevant items, and rearrange
            for (let i in this.itemPointerCache) {
                this.arrangeItem(i);// henceforth zoomfactor will only be a renderer thing. i hope this works
            }

            //also change the view box so that the mouse position remains the same
            let dxs = this.mapPageToSvgCoords(e.pageX, e.pageY);
            dxs.dx = dxs.x - ic.cx
            dxs.x = dxs.x / oldXZoomFactor * ic.XZoomFactor;
            ic.cx = dxs.x - dxs.dx;
            this.viewAdjust();
        } else {
            //calculate old width constant
            let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
            let br = this.itemSpace.getBoundingClientRect();
            ic.scale = ic.scale || 1;
            let vw = this.itemSpace.clientWidth * ic.scale;
            let vh = this.itemSpace.clientHeight * ic.scale;
            let wc = ic.cx - vw / 2 + (e.clientX - br.x) / br.width * vw;
            let hc = ic.cy - vh / 2 + (e.clientY - br.y) / br.height * vh;
            if (e.deltaY > 0) {
                ic.scale *= 1.1;
            } else {
                ic.scale *= 0.9;
            }
            //correct the new view centre
            vw = this.itemSpace.clientWidth * ic.scale;
            vh = this.itemSpace.clientHeight * ic.scale;
            ic.cx = wc - (e.clientX - br.x) / br.width * vw + vw / 2;
            ic.cy = hc - (e.clientY - br.y) / br.height * vh + vh / 2;
            this.viewAdjust();
            this.viewGrid();
        }
    })

    this.itemSpace.addEventListener("mouseup", e => {
        this.handleMoveEnd(e);
    });
    this.itemSpace.addEventListener("mouseleave", e => {
        this.handleMoveEnd(e);
    });

    this.handleMoveEnd = (e, touch) => {
        this.fromTray = false;
        if (this.globalDrag) {
            //setTimeout(this.viewAdjust, 500);
            this.globalDrag = false;
            if (this.viewGrid && this.actualMotion) this.viewGrid();
            this.actualMotion = false;
        }
        if (this.rectangleDragging) {
            this.rectangleDragging.rect.remove();
            this.rectangleDragging = undefined;
        }
        if (this.dragging) {
            //disengage drag
            this.dragging = false;
            if (!this.dragged) {
                if (this.alreadyMoving != -1) {
                    this.movingDivs[this.alreadyMoving].el.node.children[0].style.border = "1px solid black";
                    this.movingDivs.splice(this.alreadyMoving, 1);
                }
            }
            this.dragged = false;
            //this.movingDiv.classList.remove("moving");
            if (this.hoverOver) this.hoverOver.style.border = "";

            //define some stuff
            let cid = this.lastMovingDiv.attr("data-id");

            let elements = this.rootdiv
                .getRootNode()
                .elementsFromPoint(e.clientX, e.clientY);
            /*
                      case 1: hidden
                      case 2: dragged into another object
                      case 3: dragged to a position
            */
            //adding to another view
            for (let i = 0; i < elements.length; i++) {
                if (
                    elements[i].parentElement &&
                    elements[i].parentElement.matches(".floatingItem") &&
                    elements[i].parentElement.dataset.id != cid && (e.ctrlKey || e.metaKey)
                ) {
                    let otherID = elements[i].parentElement.dataset.id;
                    polymorph_core.items[otherID].itemcluster.viewName = polymorph_core.items[otherID].itemcluster.viewName || polymorph_core.items[otherID][this.settings.textProp] || otherID; //yay implicit ors
                    polymorph_core.items[cid].itemcluster.viewData[otherID] = {
                        x: 0,
                        y: 0
                    };
                    if (!e.altKey) {//push drag in.
                        delete polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName];
                        this.arrangeItem(cid);
                        this.movingDivs = [];//clear movingdivs so it doesnt come back
                    }
                    this.arrangeItem(otherID);
                    //this.switchView(elements[i].dataset.id, true, true);
                    break;
                }
            }
            this.movingDivs.forEach((v) => {
                this.updatePosition(v.el.node.dataset.id);
            })
            container.fire("updateItem", {
                sender: this,
                id: cid
            });
        } else if (this.linking) {
            //reset linking line
            this.linkingLine.plot(0, 0, 0, 0).stroke({ width: 0 });
            this.linking = false;
            //change the data
            let linkedTo;
            let elements = container.div.elementsFromPoint(e.clientX, e.clientY);
            for (let i = 0; i < elements.length; i++) {
                if (
                    elements[i].matches("foreignObject") &&
                    //p              fob        group
                    elements[i].parentElement.dataset.id != this.linkingDiv.dataset.id
                ) {
                    linkedTo = elements[i].parentElement;
                    break;
                }
            }
            if (linkedTo) {
                //add a new line connecting the items
                this.toggleLine(this.linkingDiv.dataset.id, linkedTo.dataset.id);
                //push the change
                container.fire("updateItem", {
                    sender: this,
                    id: this.linkingDiv.dataset.id
                });
                container.fire("updateItem", {
                    sender: this,
                    id: linkedTo.dataset.id
                });
            }
        } else if (this.preselected) {
            /*resizes don't exist anymore, dont do anything pls
            if (!polymorph_core.items[this.preselected.dataset.id].boxsize) polymorph_core.items[this.preselected.dataset.id].boxsize = {};
            bs = polymorph_core.items[this.preselected.dataset.id].boxsize;
            bs.w = this.preselected.children[0].style.width;
            bs.h = this.preselected.children[0].style.height;
            this.arrangeItem(this.preselected.dataset.id); // handle resizes
            */
        }
    };
    this.itemSpace.addEventListener("mousedown", (e) => {
        this.possibleResize = false;
        this.mouseStoredX = e.offsetX;
        this.mouseStoredY = e.offsetY;
    });

    this.itemSpace.addEventListener("dblclick", (e) => {
        if ((e.target.matches("svg *") || e.target.matches("svg")) && (!e.target.matches("g[data-id] *"))) {
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.createItem(
                coords.x / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor,
                coords.y
            );
            // Make a new item
        }
    })

    //----------item functions----------//
    this.updatePosition = (id) => {
        let it = this.itemPointerCache[id];
        if (!polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName]) polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName] = {};
        //if there is a grid, then deal with it
        this.alignGrid(it);
        polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].x = it.x() / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor;
        polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].y = it.y();
        container.fire("updateItem", {
            id: id
        });
        this.arrangeItem(id);
    };

    this.createItem = (x, y) => {
        let itm = {};
        //register it with the polymorph_core
        let id = polymorph_core.insertItem(itm);
        itm[this.settings.textProp] = "";
        itm.itemcluster = {
            viewData: {},
        };
        if (this.settings.createAcrossViews) {
            //find parents of the current view
            let thisparents = [];
            if (polymorph_core.items[this.settings.currentViewName].itemcluster.viewData) thisparents = Object.keys(polymorph_core.items[this.settings.currentViewName].itemcluster.viewData);
            if (this.settings.filter) thisparents = thisparents.filter(i => polymorph_core.items[i][this.settings.filter]);
            let otherViews = [];
            if (thisparents.length) {
                otherViews = this.views.filter(i => {
                    for (let j = 0; j < thisparents.length; j++) {
                        if (polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[thisparents[j]]) return true;
                    }
                    return false;
                });
            } else {
                otherViews = this.views.filter(i => !(polymorph_core.items[i].itemcluster.viewData) || !(Object.keys(polymorph_core.items[i].itemcluster.viewData)));
            }
            otherViews.forEach(i => {
                itm.itemcluster.viewData[i] = {
                    x: 0,
                    y: 0
                };
            });
        }
        itm.itemcluster.viewData[this.settings.currentViewName] = {
            x: x,
            y: y
        };
        if (this.settings.filter) {
            itm[this.settings.filter] = true;
        }
        //register a change
        container.fire("createItem", {
            sender: this,
            id: id
        });
        this.arrangeItem(id);
        return id;
    };

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        let it = polymorph_core.items[d.id];
        //create the item for every view I care about?
        if (!it.itemcluster) it.itemcluster = {};
        if (!it.itemcluster.viewData) it.itemcluster.viewData = {};
        for (i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewName) {
                if (this.settings.filter && !(polymorph_core.items[i][this.settings.filter])) continue;//apply filter to views
                //dont recreate viewdata if it exists already.
                if (!it.itemcluster.viewData[i]) it.itemcluster.viewData[i] = { x: 0, y: 0 };
                if (this.settings.filter) {
                    it[this.settings.filter] = true;
                }
            }
            //v = itemcluster.views[i].name;
        }

    })

    this.removeItem = (id) => {
        delete polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName];
        //hide all the lines
        for (let i in this.activeLines) {
            for (let j in this.activeLines[i]) {
                if (i == id || j == id) {// this could STILL be done better
                    this.toggleLine(i, j);
                }
            }
        }
        this.arrangeItem(id);
        container.fire("deleteItem", {
            id: id
        });
    };

    container.on("deleteItem", (d) => {
        if (d.sender == this) return;
        let id = d.id;
        delete polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName];
        //hide all the lines
        for (let i in this.activeLines) {
            for (let j in this.activeLines[i]) {
                if (i == id || j == id) {// this could STILL be done better
                    this.toggleLine(i, j);
                }
            }
        }
        this.arrangeItem(id);
    })

    this.tryFocus = function (id, fromContainer) {
        if (this.prevFocusID != id) {
            this.redrawLines(id, "red");
            if (!fromContainer) container.fire("focusItem", {
                id: id,
                sender: this
            });
            this.redrawLines(this.prevFocusID); //clear old lines to black
            //also show the rich property of the item
            if (this.itemPointerCache[id]) {
                let dvd = this.itemPointerCache[id].node.querySelector("div");
                dvd.parentElement.setAttribute("height", dvd.scrollHeight);
            }
            //and unshow the rich property of the previously focused item
            if (this.itemPointerCache[this.prevFocusID]) {
                let dvd = this.itemPointerCache[this.prevFocusID].node.querySelector("div");
                let tta = this.itemPointerCache[this.prevFocusID].node.querySelector("p.tta");
                dvd.parentElement.setAttribute("height", tta.scrollHeight);
            }

            this.prevFocusID = id;
        }
    }


    this.rootdiv.addEventListener("focus", (e) => {
        if (e.target.parentElement.parentElement.matches("[data-id]")) {
            let id = e.target.parentElement.parentElement.dataset.id;
            this.tryFocus(id);
        }
    })

    let resizeCapacitor = new capacitor(500, 100, (id, pp) => {

        container.fire("updateItem", {
            id: id,
            sender: this
        });
    })

    this.rootdiv.addEventListener("input", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (!e.path[i].dataset) return;// not an item, probably the rapid entry bar
            if (e.path[i].dataset.id) {
                let id = e.path[i].dataset.id;
                if (e.target.classList.contains("tta")) polymorph_core.items[id][this.settings.textProp] = e.target.innerText;
                else polymorph_core.items[id][this.settings.focusExtendProp] = e.target.innerText;
                let pp = e.target.parentElement;
                pp.style.width = (Math.sqrt(pp.innerText.length) + 1) * 23;
                pp.parentElement.setAttribute("width", pp.scrollWidth);
                pp.parentElement.setAttribute("height", pp.scrollHeight);
                resizeCapacitor.submit(id, pp);
                break;
            }
        }
    })

    ////////////////////////////////////////////////////////////
    //The tray
    this.addToTray = (id) => {
        let cti = this.tray.querySelector(`div[data-id='${id}']`);
        if (!cti) {
            cti = htmlwrap(`
                <div data-id=${id}>
                <textarea></textarea>
                </div>
            `);
            this.tray.appendChild(cti);
        }
        cti.querySelector("textarea").value = polymorph_core.items[id][this.settings.textProp];
    }

    this.removeFromTray = (id) => {
        let cti = this.tray.querySelector(`div[data-id='${id}']`);
        if (cti) cti.remove();
    }
    this.emptyTray = () => {
        while (this.tray.children.length) {
            this.tray.children[0].remove();
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //polymorph_core interactions

    this.updateSettings = () => {
        if (this.settings.tray) {
            //show the tray
            this.emptyTray();
            this.tray.style.display = "flex";
            if (this.settings.filter && polymorph_core.items[this.settings.currentViewName] && !polymorph_core.items[this.settings.currentViewName][this.settings.filter]) {
                polymorph_core.items[this.settings.currentViewName][this.settings.filter] = true; // quick upgrade - to remove in future once things have settled
            }
            //also populate the tray
            for (let i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData) {
                    if (!polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {//not in this view
                        if (!(this.settings.filter) || polymorph_core.items[i][this.settings.filter]) {
                            this.addToTray(i);
                        }
                    }
                }
            }
        } else {
            this.emptyTray();
            this.tray.style.display = "none";
        }
        if (this.svg && this.viewGrid) {
            this.viewGrid();
        }


        //reupdate every item
        for (let i in this.itemPointerCache) {
            this.arrangeItem(i);
        }
    }
    this.refresh = () => {
        if (this.svg) this.svg.size(this.rootdiv.clientWidth, this.rootdiv.clientHeight);
        this.switchView(this.settings.currentViewName, true);
    };
    //Saving and loading
    this.toSaveData = () => {
        //compile the current view path
        this.settings.viewpath = [];
        let bs = this.viewName.parentElement.querySelectorAll("button");
        for (let i = 0; i < bs.length; i++) {
            this.settings.viewpath.push(bs[i].dataset.ref);
        }
        this.settings.viewpath.push(this.settings.currentViewName);
        return this.settings;
    }
    setTimeout(() => {
        if (this.settings.viewpath) {
            this.settings.currentViewName = undefined;//clear preview buffer to prevent a>b>a
            for (let i = 0; i < this.settings.viewpath.length; i++) {
                this.switchView(this.settings.viewpath[i], true, true);
            }
        } else {//for older versions
            this.switchView(this.settings.currentViewName, true, true);
        }
    }); // wait until all other containers are intitalised otherwise we will check visibility in switchview before subframe parent exists which will break things.

    this.updateSettings();


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `<h1>Mode</h1>
      <select data-role="operationMode">
      <option value="standalone">Standalone</option>
      <option value="focus">Display view from focused item</option>
      </select>
      `;
    this.dialogOptions = {
        tray: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "tray",
            label: "Show item tray"
        }),
        filter: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "filter",
            label: "Filter items by string:"
        }),
        createAcrossViews: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "createAcrossViews",
            label: "Create items across all views, always"
        }),
        showNewViewButton: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showNewViewButton",
            label: "Show the 'Add new view button'."
        }),
        textProp: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "textProp",
            label: "Text property to display..."
        }),
        focusExtendProp: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "focusExtendProp",
            label: "Extened property to display..."
        })
    }
    this.showDialog = () => {
        for (i in this.settings) {
            let it = this.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = this.settings[i];
        }
        for (i in this.dialogOptions) {
            this.dialogOptions[i].load();
        }
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = () => {
        let its = this.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            this.settings[its[i].dataset.role] = its[i].value;
        }
        this.updateSettings();
        container.fire("updateItem", { id: this.container.id });
        // pull settings and update when your dialog is closed.
    }
    //extension API
    this.callables = {
        placeItem: (data) => {
            let item = data.item;
            let x = data.x;
            let y = data.y;
            if (x == undefined) {
                //they want us to decide where to place the item
                x = Math.random() * 1000;
                y = Math.random() * 1000;
            }
            let id = polymorph_core.insertItem(item);
            polymorph_core.items[id].itemcluster = { viewData: {} };
            polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName] = {};
            polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].x = x;
            polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].y = y;
            this.arrangeItem(id);
            container.fire("updateItem", { id: id, sender: this });
            return id;
        }
    }
    _itemcluster_extend_contextmenu.apply(this);
    _itemcluster_extend_scalegrid(this);
    _itemcluster_rapid_entry.apply(this);
});;

polymorph_core.registerOperator("welcome", {
    displayName: "Welcome",
    description: "The Welcome Operator. If you're reading this, thanks for messing around with my code, adventurer.",
    hidden: true
}, function (container) {
    let templates={
        brainstorming: `{"default_operator":{"_od":{"t":"itemcluster2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"filter":"ltkar5","tray":false,"createAcrossViews":true,"showNewViewButton":false,"textProp":"title","focusExtendProp":"description","currentViewName":"1l3u"},"inputRemaps":{},"outputRemaps":{},"tabbarName":"Itemcluster 2","p":"default_container"}},"1l3u":{"itemcluster":{"viewName":"New View","cx":1030,"cy":961,"scale":1,"XZoomFactor":1,"grid":0},"ltkar5":true},"drbeqvh_N6l6l1x_0":{"title":"Double click to add new items!","itemcluster":{"viewData":{"1l3u":{"x":943,"y":556}}},"ltkar5":true,"to":{"drbeqvh_N6l6nBA_1":true,"drbeqvh_N6l6uOp_3":true}},"drbeqvh_N6l6nBA_1":{"title":"Shift-click on an item and drag to connect items.","itemcluster":{"viewData":{"1l3u":{"x":1416.6589578662847,"y":671.7387220367473}}},"ltkar5":true,"to":{"drbeqvh_N6l6xv3_4":true}},"drbeqvh_N6l6qP3_2":{"title":"Right-click on an item to remove it. ","itemcluster":{"viewData":{"1l3u":{"x":520.1611849165822,"y":981.2783833785711}}},"ltkar5":true,"to":{"drbeqvh_N6l79/f_5":true}},"drbeqvh_N6l6uOp_3":{"title":"Click and drag the background to pan around.","itemcluster":{"viewData":{"1l3u":{"x":516.7613141248236,"y":729.517884079592}}},"ltkar5":true,"to":{"drbeqvh_N6l6qP3_2":true}},"drbeqvh_N6l6xv3_4":{"title":"Click an item and drag to move it around. ","itemcluster":{"viewData":{"1l3u":{"x":1426.8761410281654,"y":981.278383432773}}},"ltkar5":true,"to":{"drbeqvh_N6l79/f_5":true}},"drbeqvh_N6l79/f_5":{"title":"To edit an item, click and type.","itemcluster":{"viewData":{"1l3u":{"x":953.0792405689535,"y":1153.2980189590594}}},"ltkar5":true,"to":{"drbeqvh_N6l7Gaq_6":true,"drbeqvh_N6l7UWI_7":true,"drbeqvh_N6l7b4h_8":true,"drbeqvh_N6l7eg+_9":true}},"drbeqvh_N6l7Gaq_6":{"title":"Right click on the background for auto-arrangement options.","itemcluster":{"viewData":{"1l3u":{"x":763.4382906893444,"y":871.9076775296288}}},"ltkar5":true},"drbeqvh_N6l7UWI_7":{"title":"Control click-and-drag to select multiple items.","itemcluster":{"viewData":{"1l3u":{"x":1060.8296831010819,"y":903.4111007452011}}},"ltkar5":true},"drbeqvh_N6l7b4h_8":{"title":"Scroll to zoom in and out.","itemcluster":{"viewData":{"1l3u":{"x":612.4554171500922,"y":1256.4920671495831}}},"ltkar5":true},"drbeqvh_N6l7eg+_9":{"title":"Press G and scroll to activate a grid to snap to. ","itemcluster":{"viewData":{"1l3u":{"x":1242.7876903306637,"y":1254.9513507410031}}},"ltkar5":true}}`,
        tasklist:`{"_meta":{"displayName":"New Polymorph Document","id":"fmufz3","contextMenuItems":["Delete::polymorph_core.deleteItem","Background::item.edit(style.background)","Foreground::item.edit(style.color)"],"currentView":"default_container","globalContextMenuOptions":["Style::Item Background::item.edit(item.style.background)","Style::Text color::item.edit(item.style.color)"]},"default_operator":{"_od":{"t":"itemList","data":{"properties":{"title":"text","Importance":"text","date":"date"},"propertyWidths":{"title":263,"Importance":160},"filter":"ecacp4","enableEntry":true,"implicitOrder":false,"linkProperty":"to","currentID":"drbeqvh_N6lhZeN_5","sortby":"date"},"inputRemaps":{},"outputRemaps":{"focusItem":["listFocusItem"]},"tabbarName":"itemList","p":"drbeqvh_N6lhYyb_3"}},"drbeqvh_N6lhAQx_0":{"title":"Adding new items","ecacp4":1587790259898,"description":"Type the things you want to do in the first row to the left; then press Enter to add.","Importance":"Very","date":{"datestring":"+1d","date":[{"date":1587877251008,"part":"+1d","opart":"+1d","refdate":1587790851008,"endDate":1587880851008}],"prettyDateString":"26/04/2020"}},"drbeqvh_N6lhFfL_1":{"title":"Adding more columns","ecacp4":1587790281301,"description":"You can change the columns that are displayed using the cog next to 'Itemlist'.","Importance":"Moderate","date":{"datestring":"now","date":[{"date":1587790892068,"part":"now","opart":"now","refdate":1587790892068,"endDate":1587794492068}],"prettyDateString":"15:01:32"}},"drbeqvh_N6lhX4+_2":{"title":"Searching","ecacp4":1587790352702,"description":"You can also search for items using the box with the little magnifying glass.","date":{"datestring":"+2h","date":[{"date":1587798097727,"part":"+2h","opart":"+2h","refdate":1587790897727,"endDate":1587801697727}],"prettyDateString":"17:01:37"}},"drbeqvh_N6lhYyb_3":{"_rd":{"p":"default_container","x":0,"f":0,"ps":0.4276351720371382,"s":"default_operator","containerOrder":["default_operator"]}},"drbeqvh_N6lhYyb_4":{"_rd":{"p":"default_container","x":0,"f":1,"ps":0.4276351720371382,"s":"drbeqvh_N6lhZeN_5","containerOrder":["drbeqvh_N6lhZeN_5"]}},"drbeqvh_N6lhZeN_5":{"_od":{"t":"descbox","data":{"property":"description","operationMode":"focus","staticItem":"","auxProperty":"title","showTags":false,"currentID":"drbeqvh_N6li9SN_7"},"inputRemaps":{"listFocusItem":"focusItem"},"outputRemaps":{"createItem":["createItem_drbeqvh_N6lhZeN_5"],"deleteItem":["deleteItem_drbeqvh_N6lhZeN_5"],"focusItem":["focusItem_drbeqvh_N6lhZeN_5"]},"tabbarName":"descbox","p":"drbeqvh_N6ljJEG_0"}},"drbeqvh_N6lhsLS_6":{"title":"Resizing the UI","ecacp4":1587790439772,"description":"You can resize the UI by dragging on the borders of the UI.\\n\\nIf you want more lists, descriptions or otherwise, hold Shift and drag the borders "},"drbeqvh_N6li9SN_7":{"title":"Saving","Importance":"","ecacp4":1587790518039,"description":"Press CTRL-S to save."},"drbeqvh_N6ljJEG_0":{"_rd":{"p":"drbeqvh_N6lhYyb_4","x":1,"f":0,"ps":0.3828207847295864,"s":"drbeqvh_N6lhZeN_5"}},"drbeqvh_N6ljJEG_1":{"_rd":{"p":"drbeqvh_N6lhYyb_4","x":1,"f":1,"ps":0.3828207847295864,"s":"drbeqvh_N6ljK08_2","containerOrder":["drbeqvh_N6ljK08_2"]}},"drbeqvh_N6ljK08_2":{"_od":{"t":"calendar","data":{"dateproperties":["date"],"titleproperty":"title","defaultView":"agendaWeek"},"inputRemaps":{},"outputRemaps":{"createItem":["createItem_drbeqvh_N6ljK08_2"],"deleteItem":["deleteItem_drbeqvh_N6ljK08_2"],"focusItem":["focusItem_drbeqvh_N6ljK08_2"]},"tabbarName":"Calendar","p":"drbeqvh_N6ljJEG_1"}}}`,
        
    };
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {};

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>
        a{
            color:lightblue;
        }
        em{
            padding: 5px;
        }
    </style>
    <div style="display: flex; flex-direction: row; padding: 30px;">
        <div style="display: flex; flex-direction:column; flex: 1 1 50%">
            <div>
                <h2>Start</h2>
                <a class="newDocButton" href="#">New document</a>
                <br>
                <h3>Recent documents:</h3>
                <div class="recentDocuments">
                </div>
            </div>
            <div>
                <h2>Help</h2>
                <p>Tutorial [TODO]</p>
                <p>User Docs [TODO]</p>
                <p><a href="mailto:steeven.liu2@gmail.com">Contact the developer</a></p>
            </div>
        </div>
        <div style="flex: 1 1 50%">
            <div>
                <h2>About</h2>
                <span>Polymorph is Steven's personal Web-based OS/document processing tool/brainstorming tool/UI testbed. To date, it has a number of use cases:</span>
                <ul class="templateList">
                    <li><a href="#" data-template="brainstorming">A brainstorming tool</a></li>
                    <li><a href="#" data-template="tasklist">A todo-list with calendar</a></li>
                    <!--<li><a>A quick websocket front-end</a></li>
                    <li><a>A personal knowledge base</a></li>
                    <li><a>A reconfigurable UI</a></li>
                    <li><a>A collaboration tool</a></li>-->
                </ul>
                <h2>Examples</h2>
                <span>Want to see what polymorph is capable of? Check out some examples:</span>
                <ul class="templateList">
                    <li><a href="permalink/techtree">A technology tree of the human race</a></li>
                    <li><a href="permalink/thesell">A comparison of polymorph against a bunch of other productivity and note taking tools</a></li>
                </ul>
            </div>
            <div>
                <h2>Customise</h2>
                <a>Nothing to see here, yet!</a>
            </div>
        </div>
    </div>
    `;
    this.rootdiv.style.color = "white";

    this.rootdiv.querySelector(".templateList").addEventListener("click", (e) => {
        if (e.target.matches("[data-template]")){
            // load a template, by loading in all of the data
            let RTP = JSON.parse(templates[e.target.dataset.template]);
            RTP._meta=polymorph_core.items._meta;
            RTP.default_container=polymorph_core.items.default_container; // this probably hasn't changed
            for (let i in RTP){
                RTP[i]._lu_=Date.now();
            }
            delete polymorph_core.items.default_operator;
            delete polymorph_core.containers.default_operator;
            // remove this operator
            polymorph_core.integrateData(RTP, "TEMPLATER");
            polymorph_core.switchView("default_container");
        }
    })

    this.rootdiv.querySelector(".newDocButton").addEventListener("click", () => {
        //get out of the way
        while (container.div.children.length) container.div.children[0].remove();
        container.settings.t = "opSelect";
        container.operator = new polymorph_core.operators["opSelect"].constructor(container);
        //change name if user has not already modified name
        container.settings.tabbarName = "New Operator";
        //force the parent rect to update my name
        polymorph_core.rects[container.settings.p].tieContainer(container.id);
        container.fire("updateItem", {
            id: this.container.id,
            sender: this
        });
    })

    let recentDocDiv = this.rootdiv.querySelector(".recentDocuments");
    // Enumerate old documents
    let recents = JSON.parse(localStorage.getItem("__polymorph_recent_docs"));
    let newInnerHTML = "";
    if (recents) {
        for (let i in recents) {
            newInnerHTML += `<p><a href=` + recents[i].url + ` data-id="${i}">` + recents[i].displayName + `</a><em>x</em></p>`;
        }
        recentDocDiv.innerHTML = newInnerHTML;
    }


    recentDocDiv.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "em") {
            let toRemove = e.target.parentElement.children[0].dataset.id;
            delete recents[toRemove];
            localStorage.setItem("__polymorph_recent_docs", JSON.stringify(recents));
            e.target.parentElement.remove();
        }
    });

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `Nothing to see here!`;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});;

//line as item operator
// it has a focused state and a defocus state. focusability?
// gotta deal with the cursor too great
// um use a bunch of spans. constant width font, get up and down arrows working (hmm, sounds familiar)


polymorph_core.registerOperator("lynerlist", {
    displayName: "Lynerlist",
    description: "An advanced item listing tool.",
    hidden:true
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        filter: polymorph_core.guid(),
        rowsOrder: ["----"]
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    this.itemRelevant = (id) => this.settings.rowsOrder.indexOf(id) != -1;
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `<style>
    span{
        font-family:monospace;
        color:white;
    }
    [data-id]{
        width:100%;
        display:inline-flex;
    }
    [contenteditable]{
        flex: 1 0 10%;
    }
    </style>
    <span data-id="----"><span>----</span>&nbsp;&nbsp;<span contenteditable></span></span> <!--this is always final line-->
    `;
    Object.defineProperty(this, 'currentFocusedLine', {
        get: () => {
            let r = this.rootdiv.getRootNode();
            if (!r.activeElement) return undefined;
            else {
                //construct an object
                let obj = {};
                obj.id = r.activeElement.parentElement.dataset.id;
                obj.contents = r.activeElement.innerText;
                obj.editableSpan = r.activeElement;
                obj.backTag = r.activeElement.parentElement.children[0];
                obj.root = r.activeElement.parentElement;
                return obj;
            }
        }
    }
    )

    this.updateRowsOrder = () => {
        this.settings.rowsOrder = [];
        Array.from(this.rootdiv.children).forEach(i => {
            if (i.dataset.id) this.settings.rowsOrder.push(i.dataset.id);
        })
        if (this.settings.rowsOrder.length == 0) this.settings.rowsOrder = ["----"];
    }

    let renderise = (id, prevItem) => {
        let copydiv = this.rootdiv.querySelector(`[data-id="----"]`).cloneNode(true);
        if (typeof (id) != 'string') {
            copydiv = id;
            id = id.dataset.id;
        }
        else if (id != "----") {
            if (this.rootdiv.querySelector(`[data-id="${id}"]`)) {
                copydiv = this.rootdiv.querySelector(`[data-id="${id}"]`);
            }
            copydiv.children[0].innerText = " " + id.slice(id.length - 4);
            copydiv.dataset.id = id;
            copydiv.children[1].innerText = polymorph_core.items[id].contents;
        }
        this.rootdiv.insertBefore(copydiv, prevItem);
        if (id != "----" && polymorph_core.items[id].to) {
            for (let i in polymorph_core.items[id].to) {
                if (this.settings.rowsOrder.indexOf(i) != -1) {
                    copydiv = renderise(i, copydiv.nextElementSibling);
                }
            }
        }
        return copydiv;
    }

    //initial render
    let baseItem = this.rootdiv.querySelector(`[data-id="----"]`);
    this.settings.rowsOrder.forEach(i => {
        baseItem = renderise(i, baseItem.nextElementSibling);
        this.rootdiv.appendChild(baseItem);
    })
    //there may be an extra ---- so we can just remove it.
    if (this.rootdiv.querySelector(`[data-id="----"]:last-child`)) {
        this.rootdiv.children[1].remove();
    } else {
        this.rootdiv.appendChild(this.rootdiv.children[1]);
    }


    let processCommands = (c) => {
        c = c.split("\\")[1];
        c = c.split(" ");
        switch (c[0]) {
            case "sort":
                let sortables = [];
                if (!c[1]) c[1] = 'contents';
                this.updateRowsOrder();
                for (let i of this.settings.rowsOrder) {
                    if (i == "----") continue;
                    if (polymorph_core.items[i].contents[0] != " " && polymorph_core.items[i][c[1]]) {
                        sortables.push({
                            id: i,
                            d: polymorph_core.items[i][c[1]]
                        });
                    }
                }
                if (c[2] == "date") {
                    sortables.forEach(i => {
                        let dt = dateParser.extractTime(i.d, new Date());
                        if (dt) i.d = dt.getTime();
                        else i.d = 0;
                    })
                }
                if (c.includes("reverse")) {
                    sortables.sort((a, b) => (a.d > b.d) ? 1 : -1);
                } else {
                    sortables.sort((a, b) => (a.d > b.d) ? -1 : 1);
                }
                let cd = this.rootdiv.children[2];
                for (let i of sortables) {
                    renderise(i.id, cd);
                    //arrange
                }
                break;
            case "depsort":
                //sort based on some abstract dependency chain. deps and id property. \depsort [dependency prop] [id prop]\
                let allItems = this.settings.rowsOrder.map(i => i);
                let toSort = {};
                let nextToAnchor = undefined;
                allItems.forEach(i => {
                    if (i == "----") return;
                    if (polymorph_core.items[i][c[2]]) {
                        toSort[polymorph_core.items[i][c[2]]] = {
                            id: i
                        }
                        if (polymorph_core.items[i][c[1]]) {
                            toSort[polymorph_core.items[i][c[2]]].deps = polymorph_core.items[i][c[1]].split(",");
                        } else {
                            toSort[polymorph_core.items[i][c[2]]].deps = [];
                        }
                    } else {
                        nextToAnchor = renderise(i, nextToAnchor).nextElementSibling;
                    }
                })
                let tsk = Object.keys(toSort);
                let emplaced = {};
                while (tsk.length) {
                    console.log(tsk);
                    let top = tsk.shift();
                    if (toSort[top]) {
                        //items will be deleted once they have been seen
                        if (emplaced[top]) {
                            //there is a loop, abort
                            //render now
                            nextToAnchor = renderise(toSort[top].id, nextToAnchor).nextElementSibling;
                            console.log("got " + top);
                            delete toSort[top];
                        } else {
                            emplaced[top] = true;
                            toSort[top].deps = toSort[top].deps.filter(i => !emplaced[i]);
                            toSort[top].deps.forEach(i => tsk.push(i));
                            tsk.push(top);
                        }
                    }
                }
                Array.from(this.rootdiv.querySelectorAll("[data-id='----']")).forEach(i => this.rootdiv.appendChild(i));
                //move all newlines to bottom
                break;
            case 'nowtd':
                //literally spew a current formatted datestring here.
                return (new Date()).toLocaleTimeString() + " " + (new Date()).toLocaleDateString();
            case 'nowdt':
                //literally spew a current formatted datestring here.
                return (new Date()).toLocaleDateString() + " " + (new Date()).toLocaleTimeString();
        }
    }

    this.parseLine = (id) => {
        if (id == "----") return;
        let itm = this.rootdiv.querySelector(`[data-id="${id}"]`);
        let itmt = itm.children[1].innerText;

        let precedingSpaceCount = 0;
        while (/\s/.exec(itmt[precedingSpaceCount])) precedingSpaceCount++;
        if (precedingSpaceCount > 0) {
            let prepointer = itm.previousElementSibling;
            while (prepointer.tagName == "SPAN" && prepointer.dataset.id != "----") {
                let pre_precedingSpaceCount = 0;
                let itmpt = prepointer.children[1].innerText;
                while (/\s/.exec(itmpt[pre_precedingSpaceCount])) pre_precedingSpaceCount++;
                if (pre_precedingSpaceCount < precedingSpaceCount) {
                    //anchor the to
                    if (!polymorph_core.items[prepointer.dataset.id].to) polymorph_core.items[prepointer.dataset.id].to = {};
                    polymorph_core.items[prepointer.dataset.id].to[id] = true;
                    break;
                } else {
                    prepointer = prepointer.previousElementSibling;
                }
            }
        }
        polymorph_core.items[id].contents = itmt;
        let str = itmt;
        let parser = /\[(.+?):(.+?)\]/g;
        let res;
        while (res = parser.exec(str)) {
            polymorph_core.items[id][res[1]] = res[2];
        }
        container.fire('updateItem', { id: id, sender: this });
    }

    this.hardReparseAll = () => { //debugging function. not called by user, unless in devtools.
        for (let i of this.settings.rowsOrder) {
            this.parseLine(i);
        }
    }

    let candidateDie = false;

    let smartfocus = (root, range, offset) => {
        if (root.children[1].firstChild) {
            if (offset > root.children[1].firstChild.length) offset = root.children[1].firstChild.length;
            range.setStart(root.children[1].firstChild, offset);
        } else {
            range.setStart(root.children[1], 0);
        }
    }

    this.rootdiv.addEventListener('keydown', (e) => {
        if (e.key == 'Alt') {
            e.preventDefault();
        }
        if (e.key == "Enter") {
            e.preventDefault();
            //create a new line
            let prevstr = this.currentFocusedLine.contents;
            let pretab = /^(\s+)/.exec(prevstr);
            if (!pretab) pretab = "";
            else pretab = pretab[0];
            pretab = Array.from(pretab).map(i => "&nbsp;").join("");
            let copydiv = this.rootdiv.querySelector(`[data-id="----"]`).cloneNode(true);
            copydiv.children[1].innerHTML = pretab;
            this.rootdiv.insertBefore(copydiv, this.currentFocusedLine.root.nextElementSibling);
            //go up a line
            var selection = this.rootdiv.getRootNode().getSelection();
            var range = document.createRange();
            if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, this.currentFocusedLine.root.nextElementSibling.children[1].firstChild.length);
            else range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
            //range.setEnd(copydiv.children[1].firstChild, 0);
            selection.removeAllRanges();
            selection.addRange(range);
            e.preventDefault();
            //check the tab state of the previous line and match it.
            this.updateRowsOrder();
        } else if (e.key == "ArrowUp") {
            if (this.currentFocusedLine && this.currentFocusedLine.root.previousElementSibling && this.currentFocusedLine.root.previousElementSibling.tagName == "SPAN") {
                if (e.getModifierState("Alt")) {
                    //move up
                    var selection = this.rootdiv.getRootNode().getSelection();
                    let oldRange = selection.getRangeAt(0);
                    var range = document.createRange();
                    let oldso = oldRange.startOffset;
                    let newroot = renderise(this.currentFocusedLine.root, this.currentFocusedLine.root.previousElementSibling);
                    this.updateRowsOrder();
                    smartfocus(newroot, range, oldso);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                } else {
                    var selection = this.rootdiv.getRootNode().getSelection();
                    let oldRange = selection.getRangeAt(0);
                    var range = document.createRange();
                    let newStartOffset = oldRange.startOffset;
                    if (this.currentFocusedLine.root.previousElementSibling.children[1].firstChild) {
                        if (newStartOffset > this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length) newStartOffset = this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length;
                        range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1].firstChild, newStartOffset);
                    } else {
                        range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1], 0);
                    }
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                }
            }
        } else if (e.key == "ArrowDown") {
            if (this.currentFocusedLine && this.currentFocusedLine.root.nextElementSibling) {
                if (e.getModifierState("Alt")) {
                    //move down
                    var selection = this.rootdiv.getRootNode().getSelection();
                    let oldRange = selection.getRangeAt(0);
                    var range = document.createRange();
                    let oldso = oldRange.startOffset;
                    let newroot = renderise(this.currentFocusedLine.root, this.currentFocusedLine.root.nextElementSibling.nextElementSibling);
                    this.updateRowsOrder();
                    smartfocus(newroot, range, oldso);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                } else {
                    var selection = this.rootdiv.getRootNode().getSelection();
                    let oldRange = selection.getRangeAt(0);
                    var range = document.createRange();
                    let newStartOffset = oldRange.startOffset;
                    if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) {
                        if (newStartOffset > this.currentFocusedLine.root.nextElementSibling.children[1].firstChild.length) newStartOffset = this.currentFocusedLine.root.nextElementSibling.children[1].firstChild.length;
                        range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, newStartOffset);
                    } else {
                        range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
                    }
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                }
            }
        } else if (e.key == "ArrowLeft") {
            var selection = this.rootdiv.getRootNode().getSelection();
            let oldRange = selection.getRangeAt(0);
            if (oldRange.startOffset == 0 && this.currentFocusedLine.root.previousElementSibling && this.currentFocusedLine.root.previousElementSibling.tagName == "SPAN") {
                //go up a line
                var selection = this.rootdiv.getRootNode().getSelection();
                var range = document.createRange();
                if (this.currentFocusedLine.root.previousElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1].firstChild, this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length);
                else range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1], 0);
                //range.setEnd(copydiv.children[1].firstChild, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
        } else if (e.key == "ArrowRight") {
            var selection = this.rootdiv.getRootNode().getSelection();
            let oldRange = selection.getRangeAt(0);
            if ((!(oldRange.startContainer.length) || oldRange.startOffset == oldRange.startContainer.length) && this.currentFocusedLine.root.nextElementSibling) {
                //go up a line
                var selection = this.rootdiv.getRootNode().getSelection();
                var range = document.createRange();
                if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, 0);
                else range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
                //range.setEnd(copydiv.children[1].firstChild, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
        } else if (e.key == "Backspace") {
            if (this.currentFocusedLine && this.currentFocusedLine.contents.length == 0) {
                candidateDie = true;
            }
        } else if (e.key == "Tab") {
            e.preventDefault();
            e.stopPropagation();
            document.execCommand('insertText', false /*no UI*/, "    ");
        }
    });
    this.rootdiv.addEventListener('keyup', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key == "s") {
            return; //so that saving works
        }
        //create new items when a --- line is touched
        if (this.currentFocusedLine) {
            if (this.currentFocusedLine.id == "----") {
                if (/\S/.exec(this.currentFocusedLine.contents)) {
                    //create a new item
                    let oldContents = this.currentFocusedLine.contents;
                    let newID = polymorph_core.insertItem({ contents: oldContents });
                    let copydiv = renderise(newID, this.currentFocusedLine.root);

                    this.currentFocusedLine.editableSpan.innerText = "";

                    if (this.currentFocusedLine.root.nextElementSibling) {
                        this.currentFocusedLine.root.remove();
                    }
                    this.updateRowsOrder();
                    copydiv.children[1].focus();
                    var selection = window.getSelection();
                    var range = document.createRange();
                    range.setStart(copydiv.children[1].firstChild, copydiv.children[1].firstChild.length);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    container.fire('updateItem', { id: this.currentFocusedLine.id, sender: this });
                }
            } else {
                let cid = this.currentFocusedLine.id;
                this.parseLine(cid);
                //also parse commands
                let str = this.currentFocusedLine.contents;
                parser = /\\.+\\/g;
                if (res = parser.exec(str)) {
                    let bits = str.split(res[0]);
                    let cojoin = processCommands(res[0]);
                    if (cojoin) bits.splice(1, 0, cojoin);
                    else cojoin = "";//for length calcs laters
                    bits = bits.join("");


                    var selection = this.rootdiv.getRootNode().getSelection();
                    var crange = selection.getRangeAt(0).startOffset;
                    this.currentFocusedLine.root.children[1].innerText = bits || " ";


                    var range = document.createRange();
                    range.setStart(this.currentFocusedLine.root.children[1].firstChild, crange - res[0].length + cojoin.length);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    polymorph_core.items[cid].contents = bits;

                    //process last, as processing may reshuffle rows                    
                    container.fire('updateItem', { id: cid, sender: this });
                }

            }
        }
        //catch enter keys
        if (e.key == "Backspace") {
            if (candidateDie) {
                // go up a line
                let prevLine = { id: this.currentFocusedLine.id, root: this.currentFocusedLine.root };
                if (this.currentFocusedLine.root.previousElementSibling && this.currentFocusedLine.root.previousElementSibling.tagName != "STYLE") {
                    var selection = this.rootdiv.getRootNode().getSelection();
                    var range = document.createRange();
                    if (this.currentFocusedLine.root.previousElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1].firstChild, this.currentFocusedLine.root.previousElementSibling.children[1].firstChild.length);
                    else range.setStart(this.currentFocusedLine.root.previousElementSibling.children[1], 0);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else if (this.currentFocusedLine.root.nextElementSibling) {
                    var selection = this.rootdiv.getRootNode().getSelection();
                    var range = document.createRange();
                    if (this.currentFocusedLine.root.nextElementSibling.children[1].firstChild) range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1].firstChild, 0);
                    else range.setStart(this.currentFocusedLine.root.nextElementSibling.children[1], 0);
                    //range.setEnd(copydiv.children[1].firstChild, 0);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                } else {
                    //no spare lines; return
                    return;
                }


                if (prevLine.id == "----") {

                } else {
                    polymorph_core.items[prevLine.id] = {};
                    container.fire('updateItem', { id: prevLine.id, sender: this });
                }
                prevLine.root.remove();
                this.updateRowsOrder();
                candidateDie = false;
            }
        }
    })
    // for each line, you can define a linestructure. You can change the linestructure by using hyper>changeLineStructure.
    // There is also the default LHS, which unobtrusively shows item id's (just cos).
    //for each line: there is the LHS, which is unobtrusive item ids(used for debugging); the tabspace [literally used for tabs]; the middlespace (used for anything); the orgspac

    //return true if we care about an item and dont want it garbage-cleaned :(


    container.on("createItem", (d) => {
        this.settings.rowsOrder.push(d.id);
        renderise(d.id, this.rootdiv.querySelector(`[data-id="----"]`));
    })

    container.on("deleteItem", (id) => {

    })

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        let id = d.id;
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
        }
        //do stuff with the item.
    });

    this.refresh = function () {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});;

polymorph_core.registerOperator("scriptrunner", {
    displayName: "Script Runner",
    description: "Runs scripts.",
    section: "Advanced",
    imageurl: "assets/operators/scriptrunner.png"
}, function (container) {
    let defaultSettings = {
        autorun: false,
        reallyAutorun: false,
        forceCareAbout: "",
        processDuringLoad: false
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.style.color = "white";
    this.rootdiv.innerHTML = `
        <h1>WARNING: THIS SCRIPT IS POTENTIALLY INSECURE. ONLY RUN TRUSTED SCRIPTS.</h1>
        <p>Press 'Update' to execute this script.</p>
        <textarea style="width: 100%; height: 50%; tab-size:4" placeholder="Enter script here:"></textarea>
        <br>
        <button class="updatebtn">Update</button>
        <button class="stopbtn">Stop script</button>
        <button class="clogs">Clear logs</button>
        <div id="output" style="overflow-y: auto; height: 30%;"></div>
    `;

    //Allow tab to work
    let textarea = this.rootdiv.querySelector('textarea');
    textarea.addEventListener("keydown", (e) => {
        textarea.style.background = "lightgreen";
        if (e.keyCode == 9 || e.which == 9) {
            e.preventDefault();
            var s = e.target.selectionStart;
            e.target.value = e.target.value.substring(0, e.target.selectionStart) + "\t" + e.target.value.substring(e.target.selectionEnd);
            e.target.selectionEnd = s + 1;
        }
        this.settings.script = this.rootdiv.querySelector("textarea").value;
    });


    /*Example script:*/
    /*
    instance.on("updateItem",(d)=>{
        instance.log(polymorph_core.items[d.id]);
    })
    */

    container.div.appendChild(this.rootdiv);

    //////////////////Handle polymorph_core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    let selfLooping = false;
    container.on("*", (d, e) => {
        if (!d) return; // documentCreated &c
        if ((!d.sender || d.sender != "GARBAGE_COLLECTOR") && !selfLooping && (!d.loadProcess || this.settings.processDuringLoad)) {
            selfLooping = true;
            e.forEach(e => {
                if (this.currentInstance) this.currentInstance._fire(e, d);
            })
            selfLooping = false;// not sure if this is helping or hindering but we'll see
        }
        return false;
    });

    let me = this;
    function instance() {
        this.log = function (data) {
            let p = document.createElement("p");
            p.style.whiteSpace = "pre-wrap";
            p.innerHTML = JSON.stringify(data, null, 4);
            me.rootdiv.querySelector("#output").appendChild(p);
        }
        this.logEx = (data) => {
            this.log(String(data))
        }
        this.intervals = [];
        this.setInterval = (f, t) => {
            this.intervals.push({ f: f, t: t, t0: t });
            return this.intervals.length;
        }
        this.clearInterval = (n) => {
            if (this.intervals[n]) this.intervals[n].f = undefined;
        }
        polymorph_core.addEventAPI(this, this.logEx);
        this._fire = this.fire;
        this.fire = (e, d) => {
            //overwrite the fire fn for internal use (firing updateitems)
            container.fire(e, d);
        }
    }
    setInterval(() => {
        if (this.currentInstance) this.currentInstance.intervals.forEach(i => {
            if (i.f && i.t < 0) {
                try {
                    i.f();
                } catch (e) {
                    this.currentInstance.logEx(e);
                }
                i.t = i.t0;
            }
            i.t -= 100;
        })
    }, 100)
    this.stop = () => {
        delete this.currentInstance;
    }
    this.execute = () => {
        this.currentInstance = new instance();
        let wrapped = `(function factory(instance, setInterval, clearInterval){
            ${this.settings.script}
        })`;
        try {
            eval(wrapped)(this.currentInstance, this.currentInstance.setInterval, this.currentInstance.clearInterval);
        } catch (e) {
            this.currentInstance.log(e.toString());
        }

    }

    //this is called when your container is started OR your container loads for the first time
    this.rootdiv.querySelector("textarea").value = this.settings.script || "";
    if (this.settings.autorun && this.settings.reallyAutorun) {
        this.execute();
    } else {
        //don't execute, just flag this as needing attention
        textarea.style.background = "green";
    }

    this.rootdiv.querySelector(".clogs").addEventListener("click", () => {
        let op = this.rootdiv.querySelector("#output");
        while (op.children.length) op.children[0].remove();
    });


    this.rootdiv.querySelector(".updatebtn").addEventListener("click", () => {
        textarea.style.background = "white";
        this.settings.script = this.rootdiv.querySelector("textarea").value;
        this.execute();
    })

    this.rootdiv.querySelector(".stopbtn").addEventListener("click", () => {
        this.stop();
        textarea.style.background = "green";
    })


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `WARNING: DO NOT ACCEPT OTHERS' SCRIPTS YOU DONT UNDERSTAND!`;
    let ops = [
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "autorun",
            label: "Autorun on start"
        }), new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "reallyAutorun",
            label: "Confirm autorun on start"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "processDuringLoad",
            label: "Process events during loading (reduces load performance)"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "forceCareAbout",
            label: "Items to keep safe from garbage collector (csv)"
        })
    ];

    this.itemRelevant = (id) => this.settings.forceCareAbout.split(",").includes(id);

    this.showDialog = function () {
        ops.forEach((op) => { op.load(); });
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});;

//v0. works. full credits to Yair Levy on S/O.

function saveJSON(data, filename) {
    if ((typeof data).toLowerCase() != "string") data = JSON.stringify(data);
    let bl = new Blob([data], {
        type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
}

polymorph_core.registerSaveSource("toText", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);

    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <textarea placeholder="Output"></textarea>
    <br>
    <button class="sfile">Save text to file</button>
    <button class="loitem">Load as item JSON array</button>
    <button class="lo_obj">Load as item JSON object</button>
    </span>
    `;
    function saveToFile() {
        saveJSON(polymorph_core.items, polymorph_core.currentDoc.displayName + "_" + Date.now() + ".json");
    }

    this.dialog.querySelector(".sfile").addEventListener("click", () => {
        saveToFile();
    });

    this.dialog.querySelector(".loitem").addEventListener("click", () => {
        let newItems = JSON.parse(this.dialog.querySelector("textarea").value);
        newItems = newItems.map(i => polymorph_core.insertItem(i));
        newItems.forEach(e => {
            polymorph_core.fire('updateItem', { id: e });
        });
    });

    this.dialog.querySelector(".lo_obj").addEventListener("click", () => {
        let newItems = JSON.parse(this.dialog.querySelector("textarea").value);
        for (let i in newItems){
            polymorph_core.items[i]=newItems[i];
            polymorph_core.fire('updateItem',{id:i});
        }
    });

    this.pushAll = async function (data) {
        this.dialog.querySelector("textarea").value = JSON.stringify(data);
    }
    this.pullAll = async function () {
        let obj = JSON.parse(this.dialog.querySelector("textarea").value);
        obj = polymorph_core.datautils.decompress(obj);
        return obj;
    }
    this.hook = async () => {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async () => {
        //unhook previous hooks.
        this.toSave = false;
    }
    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            saveToFile();
            return true; //return true if we save
        } else {
            return false;
        }
    })

    polymorph_core.addToSaveDialog(this);
}, {
    createable: true,
    prettyName: "Output to text"
})


;

polymorph_core.registerSaveSource("lf", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);

    this.pushAll = async function (data) {
        //used by user to force push. 
    }
    this.pullAll = async function () {
        let d = await localforage.getItem("__polymorph_" + save_source_data.data.id);
        return d;
    }

    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <input class="svid" placeholder="Save ID">
    </span>
    `;
    this.showDialog = () => {
        if (!save_source_data.data.id) save_source_data.data.id = polymorph_core.currentDocID;
        this.dialog.querySelector(".svid").value = save_source_data.data.id;
    }

    this.dialog.querySelector(".svid").addEventListener("input", (e) => {
        save_source_data.data.id = e.target.value;
    })

    polymorph_core.addToSaveDialog(this);

    this.hook = async () => {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    polymorph_core.on("userSave", (d) => {
        if (save_source_data.save) {
            this.pushAll(d);
            polymorph_core.savedOK = false;
            localforage.setItem("__polymorph_" + polymorph_core.currentDocID, d).then(() => {
                polymorph_core.savedOK = true; /// SUPER HACKY PLS FORMALISE
            });
            return true; //return true if we save
        } else {
            return false;
        }
    })

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async () => {
        //unhook previous hooks.
        this.toSave = false;
    }
}, {
    createable: true,
    prettyName: "Localforage (offline storage)"
});

polymorph_core.registerSaveSource("permalink", function (save_source_data) {
    //special permalink operator: for when i want to create a permalink to a doc. 

    //fetches JSON from an XHR that is embedded in the url in base64 format. 

    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    //id, source

    this.pullAll = async function () {
        let d = save_source_data.data;
        return d;
    }

}, {
    prettyName: "Permalink",
    createable: false,
    canHandle: async (params) => {
        return new Promise((res, rej) => {
            if (params.has("pml")) {
                var xmlhttp = new XMLHttpRequest();
                let url = atob(params.get("pml"));
                xmlhttp.open('GET', url, true);
                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState == 4) {
                        if (xmlhttp.status == 200) {
                            try {
                                var obj = JSON.parse(xmlhttp.responseText);
                                let tempID = polymorph_core.guid(6, polymorph_core.userData.documents);
                                obj = polymorph_core.datautils.decompress(obj);
                                obj._meta.id = tempID;
                                res({ id: tempID, source: obj });
                            } catch (e) {
                                res(false);
                            }
                        } else {
                            res(false);
                        }
                    }
                };
                xmlhttp.send(null);
            } else {
                res(false);
            }
        })
    }
});

polymorph_core.registerSaveSource("srv", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    this.pushAll = async function (data) {
        //push to the source (force save)
        let compressedData = polymorph_core.datautils.IDCompress.compress(data);
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", this.settings.data.saveTo, true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(compressedData));
    }

    this.pullAll = async function () {
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise((resolve, reject) => {
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    try {
                        let obj = JSON.parse(this.responseText);
                        obj = polymorph_core.datautils.decompress(obj);
                        console.log(obj);
                        resolve(obj);
                    } catch (e) {
                        reject("data invalid :(");
                    }

                } else if (this.readyState == 4) {
                    //failure; direct load or backup!
                    reject("server was unavailable :/");
                    //if (fail) fail();
                }
            };
            xmlhttp.onerror = function () {
                reject("An error occured...");
            }
        });
        xmlhttp.open("GET", this.settings.data.loadFrom, true);
        xmlhttp.send();
        return p;
    }

    polymorph_core.on("userSave", (d) => {
        if (this.settings.save) {
            if (this.settings.data.throttle && this.settings.data.throttle != "") {
                if (!this.settings.tmpthrottle) {
                    this.settings.tmpthrottle = 0;
                }
                if (this.settings.tmpthrottle > Number(this.settings.data.throttle)) {
                    this.settings.tmpthrottle = 0;
                    this.pushAll(d);
                } else {
                    this.settings.tmpthrottle++;
                }
            } else {
                this.pushAll(d);
            }
            return true; //return true if we save
        } else {
            return false;
        }
    })

    this.dialog = document.createElement("div");
    polymorph_core.addToSaveDialog(this);
    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "saveTo",
            label: "Full server save address (include document name)"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "loadFrom",
            label: "Full server load address (include document name)"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "throttle",
            label: "Throttle (number of changes before sending)",
            placeholder:0
        })
    ]
    this.showDialog = function () {
        ops.forEach(i => i.load());
    }
},{
    prettyName:"Save to server",
    createable:true
});

polymorph_core.registerSaveSource("gitlite", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data); //future-safety measure. sets this.settings to save_source_data.
    //initialise here
    if (!this.settings.gitcount) this.settings.gitcount = 0;

    //for the actual display:
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    `;
    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "saveTo",
            label: "Websocket server address (include ws://)",
            afterInput: polymorph_core.saveUserData
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "id",
            label: "ID to save document as",
            afterInput: polymorph_core.saveUserData
        })
    ]
    if (!this.settings.data.id) this.settings.data.id = polymorph_core.currentDocID;
    ops.forEach(i => i.load());
    this.showDialog = function () {
        ops.forEach(i => i.load());
    }

    //ID will be a string if the object is loaded; otherwise a custom object that you have set in the past
    //Set custom objects by using polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['your_savesource_name'].

    this.pushAll = async (data) => {
        //map objects to last update time
        let timekeys = Object.entries(data).map((i) => ({ _lu_: i[1]._lu_, id: i[0] })).sort((a, b) => b._lu_ - a._lu_);
        let pow2 = 0;
        lus = timekeys.filter((i, ii) => {
            if (!(ii % (2 ** pow2)) || ii == timekeys.length - 1) {
                pow2++;
                return true;
            }
        });
        // send this full history to the websocket

        let ws = new WebSocket(this.settings.data.saveTo);
        ws.addEventListener("open", () => {
            ws.send(JSON.stringify({
                id: this.settings.data.id,
                op: "push",
                _lu_: lus
            }));
        });
        ws.addEventListener("message", (m) => {
            let response = JSON.parse(m.data);
            switch (response.op) {
                case "accept":
                    // send over the data
                    let dataToSend = timekeys.filter(i => i._lu_ >= response._lu_).map(i => ({ id: i.id, data: data[i.id] }));
                    ws.send(JSON.stringify({
                        op: "transfer",
                        data: dataToSend
                    }));
                    break;
                case "reject":
                    ws.close();
                    alert("Save to nominated sync source failed :(");
                    break;
                case "thanks":
                    //ack message
                    ws.close();
                    break;
            }
        })

        //also for now save to localforage
        localforage.setItem(`_polymorph_gitlite_${this.settings.data.id}`, data);
        /*
        open websocket
        cry if websocket is not openable
        send jumplist for push
        get common OR empty OR conflict (if no common)
        send from common
        */
    }
    this.pullAll = async () => {
        let localCopy = await localforage.getItem(`_polymorph_gitlite_${this.settings.data.id}`);
        if (!localCopy) localCopy = {};
        return new Promise((res) => {
            let ws = new WebSocket(this.settings.data.saveTo);
            ws.addEventListener("open", () => {
                ws.send(JSON.stringify({
                    id: this.settings.data.id,
                    op: "pull",
                }));
            });
            // we don't actually have a "local version"! quelle horreur!
            // save to localstorage.
            ws.addEventListener("message", (m) => {
                let response = JSON.parse(m.data);
                switch (response.op) {
                    case "push":
                        // send accept if can accept
                        //first, check ID
                        if (response.id != this.settings.data.id) {
                            ws.send(JSON.stringify({
                                op: "reject"
                            }));
                        } else {
                            let wasSent = false;
                            for (let i = 0; i < response._lu_.length; i++) {
                                if (localCopy[response._lu_[i].id] && localCopy[response._lu_[i].id]._lu_ == response._lu_[i]._lu_) {
                                    // accept this
                                    ws.send(JSON.stringify({
                                        op: "accept",
                                        _lu_: localCopy[response._lu_[i].id]._lu_
                                    }));
                                    wasSent = true;
                                    break;
                                }
                            }
                            if (!wasSent) {
                                // something is probably wrong because thats a lot of unsents
                                //oh well
                                ws.send(JSON.stringify({
                                    op: "accept",
                                    _lu_: response._lu_[response._lu_.length - 1]._lu_
                                }));
                            }
                        }
                        break;
                    case "transfer":
                        // recieve and merge the data
                        for (let i of response.data) {
                            if (!localCopy[i.id] || localCopy[i.id]._lu_ < i.data._lu_) localCopy[i.id] = i.data;
                        }
                        localforage.setItem(`_polymorph_gitlite_${this.settings.data.id}`, localCopy);
                        res(localCopy); //or nothing, if undefined
                        break;
                    case "reject":
                        alert("Remote did not have the requested document!");
                        break;
                }
            })
        })
    }

    this.hook = async function () {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }


    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function (id) {
        //unhook previous hooks.
        this.toSave = false;
    }

    polymorph_core.on("updateItem", () => {
        // add changes if genunine change has happened -- how do we tell if a genuine change has happened? we need to store a local copy of the archive. does core do that already?
    })

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            this.pushAll(d);
            return true; //return true if we save
        } else {
            return false;
        }
    })

    window.addEventListener("beforeunload", () => {

    })
    polymorph_core.addToSaveDialog(this);
}, {
    prettyName: "Websocket Synchroniser",
    createable: true
})