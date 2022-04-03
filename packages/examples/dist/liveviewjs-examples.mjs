
/// <reference types="./liveviewjs-examples.d.ts" />
import crypto from 'crypto';
import EventEmitter from 'events';

class BaseLiveView {
    mount(params, session, socket) {
        // no-op
    }
    handleParams(params, url, socket) {
        // no-op
    }
}
/**
 * Abstract base class implementation of a `LiveComponent` which can be used by
 * either a stateful or stateless `LiveComponent`.  `BaseLiveComponent` implements
 * `preload`, `mount`, `update`, and `handleEvent` with no-op implementations. Therefore
 * one can extend this class and simply implement the `render` function.  If you have
 * a stateful `LiveComponent` you most likely want to implement at least `mount` and
 * perhaps `update` as well.  See `LiveComponent` for more details.
 */
class BaseLiveComponent {
    // preload(contextsList: Context[]): Partial<Context>[] {
    //   return contextsList;
    // }
    mount(socket) {
        // no-op
    }
    update(socket) {
        // no-op
    }
    handleEvent(event, params, socket) {
        // no-op
    }
}

// Initially copied from https://github.com/Janpot/escape-html-template-tag/blob/master/src/index.ts
// This is a modified version of escape-html-template-tag that builds a tree
// of statics and dynamics that can be used to render the template.
//
const ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
};
const ENT_REGEX = new RegExp(Object.keys(ENTITIES).join("|"), "g");
function join(array, separator = "") {
    if (array.length <= 0) {
        return new HtmlSafeString([""], []);
    }
    return new HtmlSafeString(["", ...Array(array.length - 1).fill(separator), ""], array);
}
function safe(value) {
    return new HtmlSafeString([String(value)], []);
}
function escapehtml(unsafe) {
    if (unsafe instanceof HtmlSafeString) {
        return unsafe.toString();
    }
    if (Array.isArray(unsafe)) {
        return join(unsafe, "").toString();
    }
    return String(unsafe).replace(ENT_REGEX, (char) => ENTITIES[char]);
}
class HtmlSafeString {
    // readonly children: readonly HtmlSafeString[]
    constructor(statics, dynamics, isLiveComponent = false) {
        this.isLiveComponent = false;
        this.statics = statics;
        this._dynamics = dynamics;
        this.isLiveComponent = isLiveComponent;
    }
    partsTree(includeStatics = true) {
        // statics.length should always equal dynamics.length + 1
        if (this._dynamics.length === 0) {
            if (this.statics.length !== 1) {
                throw new Error("Expected exactly one static string for HtmlSafeString" + this);
            }
            // TODO Optimization to just return the single static string?
            // if only statics, return just the statics
            // in fact, only statics / no dymaincs means we
            // can simplify this node and just return the only
            // static string since there can only be one static
            // return this.statics[0];
            return {
                s: this.statics,
            };
        }
        // otherwise walk the dynamics and build the parts tree
        const parts = this._dynamics.reduce((acc, cur, index) => {
            if (cur instanceof HtmlSafeString) {
                // handle isLiveComponent case
                if (cur.isLiveComponent) {
                    // for live components, we only send back a number which
                    // is the index of the component in the `c` key
                    // the `c` key is added to the parts tree by the
                    // ComponentManager when it renders the `LiveView`
                    return {
                        ...acc,
                        [`${index}`]: Number(cur.statics[0]),
                    };
                }
                else {
                    // this isn't a live component, so we need to contine walking
                    // the tree including to the children
                    return {
                        ...acc,
                        [`${index}`]: cur.partsTree(), // recurse to children
                    };
                }
            }
            else if (Array.isArray(cur)) {
                // if array is empty just return empty string
                if (cur.length === 0) {
                    return {
                        ...acc,
                        [`${index}`]: "",
                    };
                }
                // not an empty array but array of HtmlSafeString
                else {
                    const currentPart = cur;
                    // collect all the dynamic partsTrees
                    const d = currentPart.map((c) => Object.values(c.partsTree(false)));
                    // we know the statics are the same for all the children
                    // so we can just take the first one
                    const s = currentPart.map((c) => c.statics)[0];
                    return {
                        ...acc,
                        [`${index}`]: { d, s },
                    };
                }
            }
            else {
                // cur is a literal string or number
                return {
                    ...acc,
                    [`${index}`]: escapehtml(String(cur)),
                };
            }
        }, {});
        // appends the statics to the parts tree
        if (includeStatics) {
            parts["s"] = this.statics;
        }
        return parts;
    }
    toString() {
        return this.statics.reduce((result, s, i) => {
            const d = this._dynamics[i - 1];
            return result + escapehtml(d) + s;
        });
    }
}
function html(statics, ...dynamics) {
    return new HtmlSafeString(statics, dynamics);
}

// TODO insert hidden input for CSRF token?
const form_for = (action, options) => {
    var _a;
    const method = (_a = options === null || options === void 0 ? void 0 : options.method) !== null && _a !== void 0 ? _a : "post";
    const phx_submit = (options === null || options === void 0 ? void 0 : options.phx_submit) ? safe(` phx-submit="${options.phx_submit}"`) : "";
    const phx_change = (options === null || options === void 0 ? void 0 : options.phx_change) ? safe(` phx-change="${options.phx_change}"`) : "";
    const id = (options === null || options === void 0 ? void 0 : options.id) ? safe(` id="${options.id}"`) : "";
    // prettier-ignore
    return html `<form${id} action="${action}" method="${method}"${phx_submit}${phx_change}>`;
};

const text_input = (changeset, key, options) => {
    var _a, _b;
    const placeholder = (options === null || options === void 0 ? void 0 : options.placeholder) ? safe(` placeholder="${options.placeholder}"`) : "";
    const autocomplete = (options === null || options === void 0 ? void 0 : options.autocomplete) ? safe(` autocomplete="${options.autocomplete}"`) : "";
    const phx_debounce = (options === null || options === void 0 ? void 0 : options.phx_debounce) ? safe(` phx-debounce="${options.phx_debounce}"`) : "";
    const className = (options === null || options === void 0 ? void 0 : options.className) ? safe(` class="${options.className}"`) : "";
    const type = (_a = options === null || options === void 0 ? void 0 : options.type) !== null && _a !== void 0 ? _a : "text";
    const id = `input_${key}`;
    const value = (_b = changeset.data[key]) !== null && _b !== void 0 ? _b : "";
    // prettier-ignore
    return html `<input type="${type}" id="${id}" name="${String(key)}" value="${value}"${className}${autocomplete}${placeholder}${phx_debounce}/>`;
};
const telephone_input = (changeset, key, options) => {
    return text_input(changeset, key, { ...options, type: "tel" });
};
const error_tag = (changeset, key, options) => {
    var _a;
    const error = changeset.errors ? changeset.errors[key] : undefined;
    if (changeset.action && error) {
        const className = (_a = options === null || options === void 0 ? void 0 : options.className) !== null && _a !== void 0 ? _a : "invalid-feedback";
        return html `<span class="${className}" phx-feedback-for="${key}">${error}</span>`;
    }
    return html ``;
};

function buildHref(options) {
    const { path, params } = options.to;
    const urlParams = new URLSearchParams(params);
    if (urlParams.toString().length > 0) {
        return `${path}?${urlParams.toString()}`;
    }
    else {
        return path;
    }
}
const live_patch = (anchorBody, options) => {
    // prettier-ignore
    return html `<a data-phx-link="patch" data-phx-link-state="push" href="${safe(buildHref(options))}"${options.className ? safe(` class="${options.className}"`) : ""}>${anchorBody}</a>`;
};

const options_for_select = (options, selected) => {
    // string[] options
    if (typeof options === "object" && Array.isArray(options)) {
        const htmlOptions = mapArrayOptions(options, selected);
        return renderOptions(htmlOptions);
    }
    // Record<string, string> options
    else {
        const htmlOptions = mapRecordOptions(options, selected);
        return renderOptions(htmlOptions);
    }
};
function mapArrayOptions(options, selected) {
    return options.map((option) => {
        return {
            label: option,
            value: option,
            selected: selected ? isSelected(option, selected) : false,
        };
    });
}
function mapRecordOptions(options, selected) {
    return Object.entries(options).map(([label, value]) => {
        return {
            label,
            value,
            selected: selected ? isSelected(value, selected) : false,
        };
    });
}
function isSelected(value, selected) {
    if (Array.isArray(selected)) {
        return selected.includes(value);
    }
    return value === selected;
}
function renderOptions(options) {
    return join(options.map(renderOption));
}
function renderOption(option) {
    // prettier-ignore
    return html `<option value="${option.value}"${option.selected ? " selected" : ""}>${option.label}</option>`;
}

const submit = (label, options) => {
    const phx_disable_with = (options === null || options === void 0 ? void 0 : options.phx_disable_with) ? safe(` phx-disable-with="${options.phx_disable_with}"`) : "";
    // prettier-ignore
    return html `<button type="submit"${phx_disable_with}>${label}</button>`;
};

const isDate = d => d instanceof Date;
const isEmpty = o => Object.keys(o).length === 0;
const isObject = o => o != null && typeof o === 'object';
const hasOwnProperty = (o, ...args) => Object.prototype.hasOwnProperty.call(o, ...args);
const isEmptyObject = (o) => isObject(o) && isEmpty(o);

const updatedDiff = (lhs, rhs) => {
  if (lhs === rhs) return {};

  if (!isObject(lhs) || !isObject(rhs)) return rhs;

  const l = lhs;
  const r = rhs;

  if (isDate(l) || isDate(r)) {
    if (l.valueOf() == r.valueOf()) return {};
    return r;
  }

  return Object.keys(r).reduce((acc, key) => {
    if (hasOwnProperty(l, key)) {
      const difference = updatedDiff(l[key], r[key]);

      // If the difference is empty, and the lhs is an empty object or the rhs is not an empty object
      if (isEmptyObject(difference) && !isDate(difference) && (isEmptyObject(l[key]) || !isEmptyObject(r[key])))
        return acc; // return no diff

      acc[key] = difference;
      return acc;
    }

    return acc;
  }, {});
};

const newChangesetFactory = (schema) => {
    return (existing, newAttrs, action) => {
        const merged = { ...existing, ...newAttrs };
        const result = schema.safeParse(merged);
        let errors;
        if (result.success === false) {
            errors = result.error.issues.reduce((acc, issue) => {
                // @ts-ignore
                acc[issue.path[0]] = issue.message;
                return acc;
            }, {});
        }
        return {
            action,
            changes: updatedDiff(existing, merged),
            data: result.success ? result.data : merged,
            valid: result.success,
            errors,
        };
    };
};

/**
 * A PubSub implementation that uses the Node.js EventEmitter as a backend.
 *
 * Should only be used in single process environments like local development
 * or a single instance.  In a multi-process environment, use RedisPubSub.
 */
const eventEmitter = new EventEmitter(); // use this singleton for all pubSub events
class SingleProcessPubSub {
    constructor() {
        this.subscribers = {};
    }
    async subscribe(topic, subscriber) {
        await eventEmitter.on(topic, subscriber);
        // store connection id for unsubscribe and return for caller
        const subId = crypto.randomBytes(10).toString("hex");
        this.subscribers[subId] = subscriber;
        return subId;
    }
    async broadcast(topic, data) {
        await eventEmitter.emit(topic, data);
    }
    async unsubscribe(topic, subscriberId) {
        // get subscriber function from id
        const subscriber = this.subscribers[subscriberId];
        await eventEmitter.off(topic, subscriber);
        // remove subscriber from subscribers
        delete this.subscribers[subscriberId];
    }
}

var PhxSocketProtocolNames;
(function (PhxSocketProtocolNames) {
    PhxSocketProtocolNames[PhxSocketProtocolNames["joinRef"] = 0] = "joinRef";
    PhxSocketProtocolNames[PhxSocketProtocolNames["messageRef"] = 1] = "messageRef";
    PhxSocketProtocolNames[PhxSocketProtocolNames["topic"] = 2] = "topic";
    PhxSocketProtocolNames[PhxSocketProtocolNames["event"] = 3] = "event";
    PhxSocketProtocolNames[PhxSocketProtocolNames["payload"] = 4] = "payload";
})(PhxSocketProtocolNames || (PhxSocketProtocolNames = {}));

function searchByZip(zip) {
    return stores.filter((store) => store.zip === zip);
}
function searchByCity(city) {
    return stores.filter((store) => store.city === city);
}
const stores = [
    {
        name: "Downtown Helena",
        street: "312 Montana Avenue",
        phone_number: "406-555-0100",
        city: "Helena, MT",
        zip: "59602",
        open: true,
        hours: "8am - 10pm M-F",
    },
    {
        name: "East Helena",
        street: "227 Miner's Lane",
        phone_number: "406-555-0120",
        city: "Helena, MT",
        zip: "59602",
        open: false,
        hours: "8am - 10pm M-F",
    },
    {
        name: "Westside Helena",
        street: "734 Lake Loop",
        phone_number: "406-555-0130",
        city: "Helena, MT",
        zip: "59602",
        open: true,
        hours: "8am - 10pm M-F",
    },
    {
        name: "Downtown Denver",
        street: "426 Aspen Loop",
        phone_number: "303-555-0140",
        city: "Denver, CO",
        zip: "80204",
        open: true,
        hours: "8am - 10pm M-F",
    },
    {
        name: "Midtown Denver",
        street: "7 Broncos Parkway",
        phone_number: "720-555-0150",
        city: "Denver, CO",
        zip: "80204",
        open: false,
        hours: "8am - 10pm M-F",
    },
    {
        name: "Denver Stapleton",
        street: "965 Summit Peak",
        phone_number: "303-555-0160",
        city: "Denver, CO",
        zip: "80204",
        open: true,
        hours: "8am - 10pm M-F",
    },
    {
        name: "Denver West",
        street: "501 Mountain Lane",
        phone_number: "720-555-0170",
        city: "Denver, CO",
        zip: "80204",
        open: true,
        hours: "8am - 10pm M-F",
    },
];

function suggest(prefix) {
    if (prefix === "") {
        return [];
    }
    return listCities.filter((city) => city.toLowerCase().startsWith(prefix.toLowerCase()));
}
const listCities = [
    "Abilene, TX",
    "Addison, IL",
    "Akron, OH",
    "Alameda, CA",
    "Albany, OR",
    "Albany, NY",
    "Albany, GA",
    "Albuquerque, NM",
    "Alexandria, LA",
    "Alexandria, VA",
    "Alhambra, CA",
    "Aliso Viejo, CA",
    "Allen, TX",
    "Allentown, PA",
    "Alpharetta, GA",
    "Altamonte Springs, FL",
    "Altoona, PA",
    "Amarillo, TX",
    "Ames, IA",
    "Anaheim, CA",
    "Anchorage, AK",
    "Anderson, IN",
    "Ankeny, IA",
    "Ann Arbor, MI",
    "Annapolis, MD",
    "Antioch, CA",
    "Apache Junction, AZ",
    "Apex, NC",
    "Apopka, FL",
    "Apple Valley, MN",
    "Apple Valley, CA",
    "Appleton, WI",
    "Arcadia, CA",
    "Arlington, TX",
    "Arlington Heights, IL",
    "Arvada, CO",
    "Asheville, NC",
    "Athens-Clarke County, GA",
    "Atlanta, GA",
    "Atlantic City, NJ",
    "Attleboro, MA",
    "Auburn, AL",
    "Auburn, WA",
    "Augusta-Richmond County, GA",
    "Aurora, CO",
    "Aurora, IL",
    "Austin, TX",
    "Aventura, FL",
    "Avondale, AZ",
    "Azusa, CA",
    "Bakersfield, CA",
    "Baldwin Park, CA",
    "Baltimore, MD",
    "Barnstable Town, MA",
    "Bartlett, IL",
    "Bartlett, TN",
    "Baton Rouge, LA",
    "Battle Creek, MI",
    "Bayonne, NJ",
    "Baytown, TX",
    "Beaumont, CA",
    "Beaumont, TX",
    "Beavercreek, OH",
    "Beaverton, OR",
    "Bedford, TX",
    "Bell Gardens, CA",
    "Belleville, IL",
    "Bellevue, WA",
    "Bellevue, NE",
    "Bellflower, CA",
    "Bellingham, WA",
    "Beloit, WI",
    "Bend, OR",
    "Bentonville, AR",
    "Berkeley, CA",
    "Berwyn, IL",
    "Bethlehem, PA",
    "Beverly, MA",
    "Billings, MT",
    "Biloxi, MS",
    "Binghamton, NY",
    "Birmingham, AL",
    "Bismarck, ND",
    "Blacksburg, VA",
    "Blaine, MN",
    "Bloomington, IN",
    "Bloomington, MN",
    "Bloomington, IL",
    "Blue Springs, MO",
    "Boca Raton, FL",
    "Boise City, ID",
    "Bolingbrook, IL",
    "Bonita Springs, FL",
    "Bossier City, LA",
    "Boston, MA",
    "Boulder, CO",
    "Bountiful, UT",
    "Bowie, MD",
    "Bowling Green, KY",
    "Boynton Beach, FL",
    "Bozeman, MT",
    "Bradenton, FL",
    "Brea, CA",
    "Bremerton, WA",
    "Brentwood, CA",
    "Brentwood, TN",
    "Bridgeport, CT",
    "Bristol, CT",
    "Brockton, MA",
    "Broken Arrow, OK",
    "Brookfield, WI",
    "Brookhaven, GA",
    "Brooklyn Park, MN",
    "Broomfield, CO",
    "Brownsville, TX",
    "Bryan, TX",
    "Buckeye, AZ",
    "Buena Park, CA",
    "Buffalo, NY",
    "Buffalo Grove, IL",
    "Bullhead City, AZ",
    "Burbank, CA",
    "Burien, WA",
    "Burleson, TX",
    "Burlington, NC",
    "Burlington, VT",
    "Burnsville, MN",
    "Caldwell, ID",
    "Calexico, CA",
    "Calumet City, IL",
    "Camarillo, CA",
    "Cambridge, MA",
    "Camden, NJ",
    "Campbell, CA",
    "Canton, OH",
    "Cape Coral, FL",
    "Cape Girardeau, MO",
    "Carlsbad, CA",
    "Carmel, IN",
    "Carol Stream, IL",
    "Carpentersville, IL",
    "Carrollton, TX",
    "Carson, CA",
    "Carson City, NV",
    "Cary, NC",
    "Casa Grande, AZ",
    "Casper, WY",
    "Castle Rock, CO",
    "Cathedral City, CA",
    "Cedar Falls, IA",
    "Cedar Hill, TX",
    "Cedar Park, TX",
    "Cedar Rapids, IA",
    "Centennial, CO",
    "Ceres, CA",
    "Cerritos, CA",
    "Champaign, IL",
    "Chandler, AZ",
    "Chapel Hill, NC",
    "Charleston, SC",
    "Charleston, WV",
    "Charlotte, NC",
    "Charlottesville, VA",
    "Chattanooga, TN",
    "Chelsea, MA",
    "Chesapeake, VA",
    "Chesterfield, MO",
    "Cheyenne, WY",
    "Chicago, IL",
    "Chico, CA",
    "Chicopee, MA",
    "Chino, CA",
    "Chino Hills, CA",
    "Chula Vista, CA",
    "Cicero, IL",
    "Cincinnati, OH",
    "Citrus Heights, CA",
    "Clarksville, TN",
    "Clearwater, FL",
    "Cleveland, TN",
    "Cleveland, OH",
    "Cleveland Heights, OH",
    "Clifton, NJ",
    "Clovis, CA",
    "Clovis, NM",
    "Coachella, CA",
    "Coconut Creek, FL",
    "Coeur d'Alene, ID",
    "College Station, TX",
    "Collierville, TN",
    "Colorado Springs, CO",
    "Colton, CA",
    "Columbia, MO",
    "Columbia, SC",
    "Columbus, IN",
    "Columbus, OH",
    "Columbus, GA",
    "Commerce City, CO",
    "Compton, CA",
    "Concord, NH",
    "Concord, NC",
    "Concord, CA",
    "Conroe, TX",
    "Conway, AR",
    "Coon Rapids, MN",
    "Coppell, TX",
    "Coral Gables, FL",
    "Coral Springs, FL",
    "Corona, CA",
    "Corpus Christi, TX",
    "Corvallis, OR",
    "Costa Mesa, CA",
    "Council Bluffs, IA",
    "Covina, CA",
    "Covington, KY",
    "Cranston, RI",
    "Crystal Lake, IL",
    "Culver City, CA",
    "Cupertino, CA",
    "Cutler Bay, FL",
    "Cuyahoga Falls, OH",
    "Cypress, CA",
    "Dallas, TX",
    "Daly City, CA",
    "Danbury, CT",
    "Danville, VA",
    "Danville, CA",
    "Davenport, IA",
    "Davie, FL",
    "Davis, CA",
    "Dayton, OH",
    "Daytona Beach, FL",
    "DeKalb, IL",
    "DeSoto, TX",
    "Dearborn, MI",
    "Dearborn Heights, MI",
    "Decatur, AL",
    "Decatur, IL",
    "Deerfield Beach, FL",
    "Delano, CA",
    "Delray Beach, FL",
    "Deltona, FL",
    "Denton, TX",
    "Denver, CO",
    "Des Moines, IA",
    "Des Plaines, IL",
    "Detroit, MI",
    "Diamond Bar, CA",
    "Doral, FL",
    "Dothan, AL",
    "Dover, DE",
    "Downers Grove, IL",
    "Downey, CA",
    "Draper, UT",
    "Dublin, CA",
    "Dublin, OH",
    "Dubuque, IA",
    "Duluth, MN",
    "Duncanville, TX",
    "Dunwoody, GA",
    "Durham, NC",
    "Eagan, MN",
    "East Lansing, MI",
    "East Orange, NJ",
    "East Providence, RI",
    "Eastvale, CA",
    "Eau Claire, WI",
    "Eden Prairie, MN",
    "Edina, MN",
    "Edinburg, TX",
    "Edmond, OK",
    "Edmonds, WA",
    "El Cajon, CA",
    "El Centro, CA",
    "El Monte, CA",
    "El Paso, TX",
    "Elgin, IL",
    "Elizabeth, NJ",
    "Elk Grove, CA",
    "Elkhart, IN",
    "Elmhurst, IL",
    "Elyria, OH",
    "Encinitas, CA",
    "Enid, OK",
    "Erie, PA",
    "Escondido, CA",
    "Euclid, OH",
    "Eugene, OR",
    "Euless, TX",
    "Evanston, IL",
    "Evansville, IN",
    "Everett, MA",
    "Everett, WA",
    "Fairfield, CA",
    "Fairfield, OH",
    "Fall River, MA",
    "Fargo, ND",
    "Farmington, NM",
    "Farmington Hills, MI",
    "Fayetteville, NC",
    "Fayetteville, AR",
    "Federal Way, WA",
    "Findlay, OH",
    "Fishers, IN",
    "Fitchburg, MA",
    "Flagstaff, AZ",
    "Flint, MI",
    "Florence, AL",
    "Florence, SC",
    "Florissant, MO",
    "Flower Mound, TX",
    "Folsom, CA",
    "Fond du Lac, WI",
    "Fontana, CA",
    "Fort Collins, CO",
    "Fort Lauderdale, FL",
    "Fort Myers, FL",
    "Fort Pierce, FL",
    "Fort Smith, AR",
    "Fort Wayne, IN",
    "Fort Worth, TX",
    "Fountain Valley, CA",
    "Franklin, TN",
    "Frederick, MD",
    "Freeport, NY",
    "Fremont, CA",
    "Fresno, CA",
    "Friendswood, TX",
    "Frisco, TX",
    "Fullerton, CA",
    "Gainesville, FL",
    "Gaithersburg, MD",
    "Galveston, TX",
    "Garden Grove, CA",
    "Gardena, CA",
    "Garland, TX",
    "Gary, IN",
    "Gastonia, NC",
    "Georgetown, TX",
    "Germantown, TN",
    "Gilbert, AZ",
    "Gilroy, CA",
    "Glendale, CA",
    "Glendale, AZ",
    "Glendora, CA",
    "Glenview, IL",
    "Goodyear, AZ",
    "Goose Creek, SC",
    "Grand Forks, ND",
    "Grand Island, NE",
    "Grand Junction, CO",
    "Grand Prairie, TX",
    "Grand Rapids, MI",
    "Grapevine, TX",
    "Great Falls, MT",
    "Greeley, CO",
    "Green Bay, WI",
    "Greenacres, FL",
    "Greenfield, WI",
    "Greensboro, NC",
    "Greenville, SC",
    "Greenville, NC",
    "Greenwood, IN",
    "Gresham, OR",
    "Grove City, OH",
    "Gulfport, MS",
    "Hackensack, NJ",
    "Hagerstown, MD",
    "Hallandale Beach, FL",
    "Haltom City, TX",
    "Hamilton, OH",
    "Hammond, IN",
    "Hampton, VA",
    "Hanford, CA",
    "Hanover Park, IL",
    "Harlingen, TX",
    "Harrisburg, PA",
    "Harrisonburg, VA",
    "Hartford, CT",
    "Hattiesburg, MS",
    "Haverhill, MA",
    "Hawthorne, CA",
    "Hayward, CA",
    "Helena, MT",
    "Hemet, CA",
    "Hempstead, NY",
    "Henderson, NV",
    "Hendersonville, TN",
    "Hesperia, CA",
    "Hialeah, FL",
    "Hickory, NC",
    "High Point, NC",
    "Highland, CA",
    "Hillsboro, OR",
    "Hilton Head Island, SC",
    "Hoboken, NJ",
    "Hoffman Estates, IL",
    "Hollywood, FL",
    "Holyoke, MA",
    "Homestead, FL",
    "Honolulu, HI",
    "Hoover, AL",
    "Houston, TX",
    "Huber Heights, OH",
    "Huntersville, NC",
    "Huntington, WV",
    "Huntington Beach, CA",
    "Huntington Park, CA",
    "Huntsville, TX",
    "Huntsville, AL",
    "Hurst, TX",
    "Hutchinson, KS",
    "Idaho Falls, ID",
    "Independence, MO",
    "Indianapolis, IN",
    "Indio, CA",
    "Inglewood, CA",
    "Iowa City, IA",
    "Irvine, CA",
    "Irving, TX",
    "Jackson, TN",
    "Jackson, MS",
    "Jacksonville, FL",
    "Jacksonville, NC",
    "Janesville, WI",
    "Jefferson City, MO",
    "Jeffersonville, IN",
    "Jersey City, NJ",
    "Johns Creek, GA",
    "Johnson City, TN",
    "Joliet, IL",
    "Jonesboro, AR",
    "Joplin, MO",
    "Jupiter, FL",
    "Jurupa Valley, CA",
    "Kalamazoo, MI",
    "Kannapolis, NC",
    "Kansas City, MO",
    "Kansas City, KS",
    "Kearny, NJ",
    "Keizer, OR",
    "Keller, TX",
    "Kenner, LA",
    "Kennewick, WA",
    "Kenosha, WI",
    "Kent, WA",
    "Kentwood, MI",
    "Kettering, OH",
    "Killeen, TX",
    "Kingsport, TN",
    "Kirkland, WA",
    "Kissimmee, FL",
    "Knoxville, TN",
    "Kokomo, IN",
    "La Crosse, WI",
    "La Habra, CA",
    "La Mesa, CA",
    "La Mirada, CA",
    "La Puente, CA",
    "La Quinta, CA",
    "Lacey, WA",
    "Lafayette, LA",
    "Lafayette, IN",
    "Laguna Niguel, CA",
    "Lake Charles, LA",
    "Lake Elsinore, CA",
    "Lake Forest, CA",
    "Lake Havasu City, AZ",
    "Lake Oswego, OR",
    "Lakeland, FL",
    "Lakeville, MN",
    "Lakewood, OH",
    "Lakewood, CO",
    "Lakewood, WA",
    "Lakewood, CA",
    "Lancaster, CA",
    "Lancaster, PA",
    "Lancaster, TX",
    "Lancaster, OH",
    "Lansing, MI",
    "Laredo, TX",
    "Largo, FL",
    "Las Cruces, NM",
    "Las Vegas, NV",
    "Lauderhill, FL",
    "Lawrence, KS",
    "Lawrence, IN",
    "Lawrence, MA",
    "Lawton, OK",
    "Layton, UT",
    "League City, TX",
    "Lee's Summit, MO",
    "Leesburg, VA",
    "Lehi, UT",
    "Lenexa, KS",
    "Leominster, MA",
    "Lewisville, TX",
    "Lexington-Fayette, KY",
    "Lima, OH",
    "Lincoln, CA",
    "Lincoln, NE",
    "Lincoln Park, MI",
    "Linden, NJ",
    "Little Rock, AR",
    "Littleton, CO",
    "Livermore, CA",
    "Livonia, MI",
    "Lodi, CA",
    "Logan, UT",
    "Lombard, IL",
    "Lompoc, CA",
    "Long Beach, CA",
    "Longmont, CO",
    "Longview, TX",
    "Lorain, OH",
    "Los Angeles, CA",
    "Louisville/Jefferson County, KY",
    "Loveland, CO",
    "Lowell, MA",
    "Lubbock, TX",
    "Lynchburg, VA",
    "Lynn, MA",
    "Lynwood, CA",
    "Macon, GA",
    "Madera, CA",
    "Madison, AL",
    "Madison, WI",
    "Malden, MA",
    "Manassas, VA",
    "Manchester, NH",
    "Manhattan, KS",
    "Mankato, MN",
    "Mansfield, TX",
    "Mansfield, OH",
    "Manteca, CA",
    "Maple Grove, MN",
    "Maplewood, MN",
    "Marana, AZ",
    "Margate, FL",
    "Maricopa, AZ",
    "Marietta, GA",
    "Marlborough, MA",
    "Martinez, CA",
    "Marysville, WA",
    "McAllen, TX",
    "McKinney, TX",
    "Medford, OR",
    "Medford, MA",
    "Melbourne, FL",
    "Memphis, TN",
    "Menifee, CA",
    "Mentor, OH",
    "Merced, CA",
    "Meriden, CT",
    "Meridian, MS",
    "Meridian, ID",
    "Mesa, AZ",
    "Mesquite, TX",
    "Methuen, MA",
    "Miami, FL",
    "Miami Beach, FL",
    "Miami Gardens, FL",
    "Middletown, OH",
    "Middletown, CT",
    "Midland, MI",
    "Midland, TX",
    "Midwest City, OK",
    "Milford, CT",
    "Milpitas, CA",
    "Milwaukee, WI",
    "Minneapolis, MN",
    "Minnetonka, MN",
    "Minot, ND",
    "Miramar, FL",
    "Mishawaka, IN",
    "Mission, TX",
    "Mission Viejo, CA",
    "Missoula, MT",
    "Missouri City, TX",
    "Mobile, AL",
    "Modesto, CA",
    "Moline, IL",
    "Monroe, LA",
    "Monrovia, CA",
    "Montclair, CA",
    "Montebello, CA",
    "Monterey Park, CA",
    "Montgomery, AL",
    "Moore, OK",
    "Moorhead, MN",
    "Moreno Valley, CA",
    "Morgan Hill, CA",
    "Mount Pleasant, SC",
    "Mount Prospect, IL",
    "Mount Vernon, NY",
    "Mountain View, CA",
    "Muncie, IN",
    "Murfreesboro, TN",
    "Murray, UT",
    "Murrieta, CA",
    "Muskegon, MI",
    "Muskogee, OK",
    "Nampa, ID",
    "Napa, CA",
    "Naperville, IL",
    "Nashua, NH",
    "Nashville-Davidson, TN",
    "National City, CA",
    "New Bedford, MA",
    "New Berlin, WI",
    "New Braunfels, TX",
    "New Britain, CT",
    "New Brunswick, NJ",
    "New Haven, CT",
    "New Orleans, LA",
    "New Rochelle, NY",
    "New York, NY",
    "Newark, CA",
    "Newark, NJ",
    "Newark, OH",
    "Newport Beach, CA",
    "Newport News, VA",
    "Newton, MA",
    "Niagara Falls, NY",
    "Noblesville, IN",
    "Norfolk, VA",
    "Normal, IL",
    "Norman, OK",
    "North Charleston, SC",
    "North Las Vegas, NV",
    "North Lauderdale, FL",
    "North Little Rock, AR",
    "North Miami, FL",
    "North Miami Beach, FL",
    "North Port, FL",
    "North Richland Hills, TX",
    "Northglenn, CO",
    "Norwalk, CA",
    "Norwalk, CT",
    "Norwich, CT",
    "Novato, CA",
    "Novi, MI",
    "O'Fallon, MO",
    "Oak Lawn, IL",
    "Oak Park, IL",
    "Oakland, CA",
    "Oakland Park, FL",
    "Oakley, CA",
    "Ocala, FL",
    "Oceanside, CA",
    "Ocoee, FL",
    "Odessa, TX",
    "Ogden, UT",
    "Oklahoma City, OK",
    "Olathe, KS",
    "Olympia, WA",
    "Omaha, NE",
    "Ontario, CA",
    "Orange, CA",
    "Orem, UT",
    "Orland Park, IL",
    "Orlando, FL",
    "Ormond Beach, FL",
    "Oro Valley, AZ",
    "Oshkosh, WI",
    "Overland Park, KS",
    "Owensboro, KY",
    "Oxnard, CA",
    "Pacifica, CA",
    "Palatine, IL",
    "Palm Bay, FL",
    "Palm Beach Gardens, FL",
    "Palm Coast, FL",
    "Palm Desert, CA",
    "Palm Springs, CA",
    "Palmdale, CA",
    "Palo Alto, CA",
    "Panama City, FL",
    "Paramount, CA",
    "Park Ridge, IL",
    "Parker, CO",
    "Parma, OH",
    "Pasadena, CA",
    "Pasadena, TX",
    "Pasco, WA",
    "Passaic, NJ",
    "Paterson, NJ",
    "Pawtucket, RI",
    "Peabody, MA",
    "Peachtree Corners, GA",
    "Pearland, TX",
    "Pembroke Pines, FL",
    "Pensacola, FL",
    "Peoria, AZ",
    "Peoria, IL",
    "Perris, CA",
    "Perth Amboy, NJ",
    "Petaluma, CA",
    "Pflugerville, TX",
    "Pharr, TX",
    "Phenix City, AL",
    "Philadelphia, PA",
    "Phoenix, AZ",
    "Pico Rivera, CA",
    "Pine Bluff, AR",
    "Pinellas Park, FL",
    "Pittsburg, CA",
    "Pittsburgh, PA",
    "Pittsfield, MA",
    "Placentia, CA",
    "Plainfield, IL",
    "Plainfield, NJ",
    "Plano, TX",
    "Plantation, FL",
    "Pleasanton, CA",
    "Plymouth, MN",
    "Pocatello, ID",
    "Pomona, CA",
    "Pompano Beach, FL",
    "Pontiac, MI",
    "Port Arthur, TX",
    "Port Orange, FL",
    "Port St. Lucie, FL",
    "Portage, MI",
    "Porterville, CA",
    "Portland, OR",
    "Portland, ME",
    "Portsmouth, VA",
    "Poway, CA",
    "Prescott, AZ",
    "Prescott Valley, AZ",
    "Providence, RI",
    "Provo, UT",
    "Pueblo, CO",
    "Puyallup, WA",
    "Quincy, IL",
    "Quincy, MA",
    "Racine, WI",
    "Raleigh, NC",
    "Rancho Cordova, CA",
    "Rancho Cucamonga, CA",
    "Rancho Palos Verdes, CA",
    "Rancho Santa Margarita, CA",
    "Rapid City, SD",
    "Reading, PA",
    "Redding, CA",
    "Redlands, CA",
    "Redmond, WA",
    "Redondo Beach, CA",
    "Redwood City, CA",
    "Reno, NV",
    "Renton, WA",
    "Revere, MA",
    "Rialto, CA",
    "Richardson, TX",
    "Richland, WA",
    "Richmond, CA",
    "Richmond, VA",
    "Rio Rancho, NM",
    "Riverside, CA",
    "Riverton, UT",
    "Roanoke, VA",
    "Rochester, MN",
    "Rochester, NY",
    "Rochester Hills, MI",
    "Rock Hill, SC",
    "Rock Island, IL",
    "Rockford, IL",
    "Rocklin, CA",
    "Rockville, MD",
    "Rockwall, TX",
    "Rocky Mount, NC",
    "Rogers, AR",
    "Rohnert Park, CA",
    "Romeoville, IL",
    "Rosemead, CA",
    "Roseville, CA",
    "Roseville, MI",
    "Roswell, NM",
    "Roswell, GA",
    "Round Rock, TX",
    "Rowlett, TX",
    "Roy, UT",
    "Royal Oak, MI",
    "Sacramento, CA",
    "Saginaw, MI",
    "Salem, OR",
    "Salem, MA",
    "Salina, KS",
    "Salinas, CA",
    "Salt Lake City, UT",
    "Sammamish, WA",
    "San Angelo, TX",
    "San Antonio, TX",
    "San Bernardino, CA",
    "San Bruno, CA",
    "San Buenaventura (Ventura), CA",
    "San Clemente, CA",
    "San Diego, CA",
    "San Francisco, CA",
    "San Gabriel, CA",
    "San Jacinto, CA",
    "San Jose, CA",
    "San Leandro, CA",
    "San Luis Obispo, CA",
    "San Marcos, CA",
    "San Marcos, TX",
    "San Mateo, CA",
    "San Rafael, CA",
    "San Ramon, CA",
    "Sandy, UT",
    "Sandy Springs, GA",
    "Sanford, FL",
    "Santa Ana, CA",
    "Santa Barbara, CA",
    "Santa Clara, CA",
    "Santa Clarita, CA",
    "Santa Cruz, CA",
    "Santa Fe, NM",
    "Santa Maria, CA",
    "Santa Monica, CA",
    "Santa Rosa, CA",
    "Santee, CA",
    "Sarasota, FL",
    "Savannah, GA",
    "Sayreville, NJ",
    "Schaumburg, IL",
    "Schenectady, NY",
    "Scottsdale, AZ",
    "Scranton, PA",
    "Seattle, WA",
    "Shakopee, MN",
    "Shawnee, KS",
    "Sheboygan, WI",
    "Shelton, CT",
    "Sherman, TX",
    "Shoreline, WA",
    "Shreveport, LA",
    "Sierra Vista, AZ",
    "Simi Valley, CA",
    "Sioux City, IA",
    "Sioux Falls, SD",
    "Skokie, IL",
    "Smyrna, TN",
    "Smyrna, GA",
    "Somerville, MA",
    "South Bend, IN",
    "South Gate, CA",
    "South Jordan, UT",
    "South San Francisco, CA",
    "Southaven, MS",
    "Southfield, MI",
    "Spanish Fork, UT",
    "Sparks, NV",
    "Spartanburg, SC",
    "Spokane, WA",
    "Spokane Valley, WA",
    "Springdale, AR",
    "Springfield, OH",
    "Springfield, OR",
    "Springfield, IL",
    "Springfield, MA",
    "Springfield, MO",
    "St. Charles, MO",
    "St. Clair Shores, MI",
    "St. Cloud, FL",
    "St. Cloud, MN",
    "St. George, UT",
    "St. Joseph, MO",
    "St. Louis, MO",
    "St. Louis Park, MN",
    "St. Paul, MN",
    "St. Peters, MO",
    "St. Petersburg, FL",
    "Stamford, CT",
    "Stanton, CA",
    "State College, PA",
    "Sterling Heights, MI",
    "Stillwater, OK",
    "Stockton, CA",
    "Streamwood, IL",
    "Strongsville, OH",
    "Suffolk, VA",
    "Sugar Land, TX",
    "Summerville, SC",
    "Sumter, SC",
    "Sunnyvale, CA",
    "Sunrise, FL",
    "Surprise, AZ",
    "Syracuse, NY",
    "Tacoma, WA",
    "Tallahassee, FL",
    "Tamarac, FL",
    "Tampa, FL",
    "Taunton, MA",
    "Taylor, MI",
    "Taylorsville, UT",
    "Temecula, CA",
    "Tempe, AZ",
    "Temple, TX",
    "Terre Haute, IN",
    "Texarkana, TX",
    "Texas City, TX",
    "The Colony, TX",
    "Thornton, CO",
    "Thousand Oaks, CA",
    "Tigard, OR",
    "Tinley Park, IL",
    "Titusville, FL",
    "Toledo, OH",
    "Topeka, KS",
    "Torrance, CA",
    "Tracy, CA",
    "Trenton, NJ",
    "Troy, NY",
    "Troy, MI",
    "Tucson, AZ",
    "Tulare, CA",
    "Tulsa, OK",
    "Turlock, CA",
    "Tuscaloosa, AL",
    "Tustin, CA",
    "Twin Falls, ID",
    "Tyler, TX",
    "Union City, CA",
    "Union City, NJ",
    "Upland, CA",
    "Urbana, IL",
    "Urbandale, IA",
    "Utica, NY",
    "Vacaville, CA",
    "Valdosta, GA",
    "Vallejo, CA",
    "Valley Stream, NY",
    "Vancouver, WA",
    "Victoria, TX",
    "Victorville, CA",
    "Vineland, NJ",
    "Virginia Beach, VA",
    "Visalia, CA",
    "Vista, CA",
    "Waco, TX",
    "Walnut Creek, CA",
    "Waltham, MA",
    "Warner Robins, GA",
    "Warren, OH",
    "Warren, MI",
    "Warwick, RI",
    "Washington, DC",
    "Waterbury, CT",
    "Waterloo, IA",
    "Watsonville, CA",
    "Waukegan, IL",
    "Waukesha, WI",
    "Wausau, WI",
    "Wauwatosa, WI",
    "Wellington, FL",
    "Weslaco, TX",
    "West Allis, WI",
    "West Covina, CA",
    "West Des Moines, IA",
    "West Haven, CT",
    "West Jordan, UT",
    "West New York, NJ",
    "West Palm Beach, FL",
    "West Sacramento, CA",
    "West Valley City, UT",
    "Westerville, OH",
    "Westfield, MA",
    "Westland, MI",
    "Westminster, CO",
    "Westminster, CA",
    "Weston, FL",
    "Weymouth Town, MA",
    "Wheaton, IL",
    "Wheeling, IL",
    "White Plains, NY",
    "Whittier, CA",
    "Wichita, KS",
    "Wichita Falls, TX",
    "Wilkes-Barre, PA",
    "Wilmington, DE",
    "Wilmington, NC",
    "Wilson, NC",
    "Winston-Salem, NC",
    "Winter Garden, FL",
    "Woburn, MA",
    "Woodbury, MN",
    "Woodland, CA",
    "Woonsocket, RI",
    "Worcester, MA",
    "Wylie, TX",
    "Wyoming, MI",
    "Yakima, WA",
    "Yonkers, NY",
    "Yorba Linda, CA",
    "York, PA",
    "Youngstown, OH",
    "Yuba City, CA",
    "Yucaipa, CA",
    "Yuma, AZ",
];

class AutocompleteLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        const zip = "";
        const city = "";
        const stores = [];
        const matches = [];
        const loading = false;
        socket.assign({ zip, city, stores, matches, loading });
    }
    renderStoreStatus(store) {
        if (store.open) {
            return html `<span class="open">🔓 Open</span>`;
        }
        else {
            return html `<span class="closed">🔐 Closed</span>`;
        }
    }
    renderStore(store) {
        return html ` <li>
      <div class="first-line">
        <div class="name">${store.name}</div>
        <div class="status">${this.renderStoreStatus(store)}</div>
        <div class="second-line">
          <div class="street">📍 ${store.street}</div>
          <div class="phone_number">📞 ${store.phone_number}</div>
        </div>
      </div>
    </li>`;
    }
    renderLoading() {
        return html ` <div class="loader">Loading...</div> `;
    }
    render(context) {
        return html `
      <h1>Find a Store</h1>
      <div id="search">
        <form phx-submit="zip-search">
          <input
            type="text"
            name="zip"
            value="${context.zip}"
            placeholder="Zip Code"
            autofocus
            autocomplete="off"
            ${context.loading ? "readonly" : ""} />

          <button type="submit">📫🔎</button>
        </form>

        <form phx-submit="city-search" phx-change="suggest-city">
          <input
            type="text"
            name="city"
            value="${context.city}"
            placeholder="City"
            autocomplete="off"
            list="matches"
            phx-debounce="1000"
            ${context.loading ? "readonly" : ""} />

          <button type="submit">🏙🔎</button>
        </form>

        <datalist id="matches">
          ${context.matches.map((match) => html `<option value="${match}">${match}</option>`)}
        </datalist>

        ${context.loading ? this.renderLoading() : ""}

        <div class="stores">
          <ul>
            ${context.stores.map((store) => this.renderStore(store))}
          </ul>
        </div>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        // console.log("event:", event, params, socket);
        if (event === "zip-search") {
            // @ts-ignore TODO better params types for different events
            const { zip } = params;
            // wait a second to send the message
            setTimeout(() => {
                socket.send({ type: "run_zip_search", zip });
            }, 1000);
            socket.assign({ zip, loading: true, stores: [], matches: [] });
        }
        else if (event === "suggest-city") {
            // @ts-ignore TODO better params types for different events
            const { city } = params;
            const matches = suggest(city);
            socket.assign({ city, loading: false, matches });
        }
        else if (event === "city-search") {
            // @ts-ignore TODO better params types for different events
            const { city } = params;
            // wait a second to send the message
            setTimeout(() => {
                socket.send({ type: "run_city_search", city });
            }, 1000);
            socket.assign({ city, loading: true, matches: [], stores: [] });
        }
        // else {
        //   return { zip: "", city: "", stores: [], matches: [], loading: false };
        // }
    }
    handleInfo(event, socket) {
        let stores = [];
        switch (event.type) {
            case "run_zip_search":
                const { zip } = event;
                stores = searchByZip(zip);
                socket.assign({
                    zip,
                    stores,
                    loading: false,
                });
                break;
            case "run_city_search":
                const { city } = event;
                stores = searchByCity(city);
                socket.assign({
                    city,
                    stores,
                    loading: false,
                });
            // return {
            //   zip: "",
            //   city,
            //   stores,
            //   matches: [],
            //   loading: false
            // }
        }
    }
}

const vehicleTypes = {
    gas: "🦕 Gas",
    electric: "🔌 Electric",
    hybrid: "🔋 Hybrid",
    dontHave: "🚎 Don't have",
};
const vehicleCarbonFootprint = {
    gas: 8,
    hybrid: 4,
    electric: 1,
    dontHave: 0,
};
const spaceHeatingTypes = {
    gas: "🔥 Furnace that burns gas",
    oil: "🦕 Furnace that burns fuel oil",
    electric: "🔌 Electric resistance heaters (wall or baseboard heaters)",
    radiant: "💧 Radiators or radiant floors",
    heatpump: "♨️ Heat pump",
    other: "🪵 Other",
    notSure: "🤷 Not sure",
};
const spaceHeatingCarbonFootprint = {
    gas: 6,
    oil: 5,
    electric: 3,
    radiant: 3,
    heatpump: 1,
    other: 5,
    notSure: 5, // assume 5 is average
};
const gridElectricityTypes = {
    grid: "🔌 Grid electricity",
    renewable: "☀️ Renewable plan from my utility",
    commSolar: "🤝 Community solar",
    notSure: "🤷 Not sure",
};
const gridElectricityCarbonFootprint = {
    grid: 6,
    renewable: 2,
    commSolar: 2,
    notSure: 6, // assume 6 is average
};
class DecarboinizeCalculator extends BaseLiveComponent {
    render(context, meta) {
        const { vehicle1, vehicle2, spaceHeating, gridElectricity, carbonFootprintTons } = context;
        const { myself } = meta;
        return html `
      <div id="calc_${myself}">
        <form phx-change="calculate" phx-target="${myself}">
          <div>
            <label>Vehicle 1</label>
            <select name="vehicle1" autocomplete="off">
              <option>Select</option>
              ${Object.keys(vehicleTypes).map((vehicle) => html `<option value="${vehicle}" ${vehicle1 === vehicle ? "selected" : ""}>
                    ${vehicleTypes[vehicle]}
                  </option>`)}
            </select>
          </div>

          <div>
            <label>Vehicle 2</label>
            <select name="vehicle2" autocomplete="off">
              <option>Select</option>
              ${Object.keys(vehicleTypes).map((vehicle) => html `<option value="${vehicle}" ${vehicle2 === vehicle ? "selected" : ""}>
                    ${vehicleTypes[vehicle]}
                  </option>`)}
            </select>
          </div>

          <div>
            <label>Space Heating</label>
            <select name="spaceHeating" autocomplete="off">
              <option>Select</option>
              ${Object.keys(spaceHeatingTypes).map((sh) => html `<option value="${sh}" ${spaceHeating === sh ? "selected" : ""}>
                    ${spaceHeatingTypes[sh]}
                  </option>`)}
            </select>
          </div>

          <div>
            <label>Grid Electricity Source</label>
            <select name="gridElectricity" autocomplete="off" value="${gridElectricity}">
              <option>Select</option>
              ${Object.keys(gridElectricityTypes).map((grid) => html `<option value="${grid}" ${gridElectricity === grid ? "selected" : ""}>
                    ${gridElectricityTypes[grid]}
                  </option>`)}
            </select>
          </div>
        </form>

        ${carbonFootprintTons > 0 ? this.renderFootprint(carbonFootprintTons, myself || 0, context) : ""}
      </div>
    `;
    }
    renderFootprint(carbonFootprintTons, myself, context) {
        return html `
      <div id="footprint_${myself}">
        <h3>Carbon Footprint 👣</h3>
        <p>${carbonFootprintTons} tons of CO2</p>
        ${this.renderChart("footprint_chart", context)}
      </div>
    `;
    }
    renderChart(id, context) {
        const data = this.getChartData(id, context).data;
        return html `
      <span id="${id}-init-data" style="display: none;">${safe(JSON.stringify(data))}</span>
      <canvas id="${id}" phx-hook="Chart"></canvas>
    `;
    }
    handleEvent(event, params, socket) {
        // calculate footprint
        const { vehicle1, vehicle2, spaceHeating, gridElectricity } = params;
        const v1Tons = vehicleCarbonFootprint[vehicle1];
        const v2Tons = vehicleCarbonFootprint[vehicle2];
        const shTons = spaceHeatingCarbonFootprint[spaceHeating];
        const geTons = gridElectricityCarbonFootprint[gridElectricity];
        const carbonFootprintData = [v1Tons, v2Tons, shTons, geTons];
        socket.pushEvent("updateChart", carbonFootprintData);
        socket.assign({
            ...params,
            carbonFootprintTons: carbonFootprintData.reduce((a, b) => a + b, 0),
        });
    }
    getChartData(id, context) {
        return {
            chartId: id,
            data: {
                labels: ["Vehicle 1", "Vehicle 2", "Space heating", "Electricity (non-heat)"],
                datasets: [
                    {
                        data: [
                            vehicleCarbonFootprint[context.vehicle1],
                            vehicleCarbonFootprint[context.vehicle2],
                            spaceHeatingCarbonFootprint[context.spaceHeating],
                            gridElectricityCarbonFootprint[context.gridElectricity],
                        ],
                        backgroundColor: ["#4E0606", "#4E2706", "#06284E", "#DBD111"],
                    },
                ],
            },
        };
    }
}

class DecarbonizeLiveView extends BaseLiveView {
    mount(params, session, socket) {
        socket.pageTitle("Decarbonize Calculator");
    }
    async render(context, meta) {
        const { live_component } = meta;
        return html `
      <h1>Decarbonize Calculator</h1>
      <div>
        ${await live_component(new DecarboinizeCalculator(), {
            vehicle1: "gas",
            spaceHeating: "gas",
            gridElectricity: "grid",
            id: "some string or number",
        })}
      </div>
    `;
    }
}

function numberToCurrency(amount) {
    var formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });
    return formatter.format(amount);
}

class LicenseLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        const seats = 2;
        const amount = calculateLicenseAmount(seats);
        socket.assign({ seats, amount });
    }
    render(context) {
        return html `
      <h1>Team License</h1>
      <div id="license">
        <div class="card">
          <div class="content">
            <div class="seats">
              🪑
              <span>
                Your license is currently for
                <strong>${context.seats}</strong> seats.
              </span>
            </div>

            <form phx-change="update">
              <input type="range" min="1" max="10" name="seats" value="${context.seats}" />
            </form>

            <div class="amount">${numberToCurrency(context.amount)}</div>
          </div>
        </div>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        const seats = Number(params.seats || 2);
        const amount = calculateLicenseAmount(seats);
        socket.assign({ seats, amount });
    }
}
function calculateLicenseAmount(seats) {
    if (seats <= 5) {
        return seats * 20;
    }
    else {
        return 100 + (seats - 5) * 15;
    }
}

class LightLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        socket.pageTitle("Front Porch Light");
        socket.assign({ brightness: 10 });
    }
    render(context) {
        const { brightness } = context;
        return html `
      <div id="light">
        <h1>Front Porch Light</h1>
        <div>
          <div>${brightness}%</div>
          <progress
            id="light_meter"
            style="width: 300px; height: 2em; opacity: ${brightness / 100}"
            value="${brightness}"
            max="100"></progress>
        </div>

        <button phx-click="off" phx-window-keydown="key_update" phx-key="ArrowLeft">⬅️ Off</button>

        <button phx-click="down" phx-window-keydown="key_update" phx-key="ArrowDown">⬇️ Down</button>

        <button phx-click="up" phx-window-keydown="key_update" phx-key="ArrowUp">⬆️ Up</button>

        <button phx-click="on" phx-window-keydown="key_update" phx-key="ArrowRight">➡️ On</button>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        const { brightness } = socket.context;
        // map key_update to arrow keys
        const lightEvent = event === "key_update" ? params.key : event;
        switch (lightEvent) {
            case "off":
            case "ArrowLeft":
                socket.assign({ brightness: 0 });
                break;
            case "on":
            case "ArrowRight":
                socket.assign({ brightness: 100 });
                break;
            case "up":
            case "ArrowUp":
                socket.assign({ brightness: Math.min(brightness + 10, 100) });
                break;
            case "down":
            case "ArrowDown":
                socket.assign({ brightness: Math.max(brightness - 10, 0) });
                break;
        }
    }
}

class SearchLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        const zip = "";
        const stores = [];
        const loading = false;
        socket.assign({ zip, stores, loading });
    }
    renderStoreStatus(store) {
        if (store.open) {
            return html `<span class="open">🔓 Open</span>`;
        }
        else {
            return html `<span class="closed">🔐 Closed</span>`;
        }
    }
    renderStore(store) {
        return html ` <li>
      <div class="first-line">
        <div class="name">${store.name}</div>
        <div class="status">${this.renderStoreStatus(store)}</div>
        <div class="second-line">
          <div class="street">📍 ${store.street}</div>
          <div class="phone_number">📞 ${store.phone_number}</div>
        </div>
      </div>
    </li>`;
    }
    renderLoading() {
        return html ` <div class="loader">Loading...</div> `;
    }
    render(context) {
        return html `
      <h1>Find a Store</h1>
      <div id="search">
        <form phx-submit="zip-search">
          <input
            type="text"
            name="zip"
            value="${context.zip}"
            placeholder="Zip Code"
            autofocus
            autocomplete="off"
            ${context.loading ? "readonly" : ""} />

          <button type="submit">🔎</button>
        </form>

        ${context.loading ? this.renderLoading() : ""}

        <div class="stores">
          <ul>
            ${context.stores.map((store) => this.renderStore(store))}
          </ul>
        </div>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        const { zip } = params;
        // wait 300ms to send the message
        setTimeout(async () => {
            socket.send({ type: "run_zip_search", zip });
        }, 300);
        socket.assign({ zip, stores: [], loading: true });
    }
    handleInfo(event, socket) {
        const { zip } = event;
        const stores = searchByZip(zip);
        socket.assign({
            zip,
            stores,
            loading: false,
        });
    }
}

const items$1 = [
    { emoji: "☕️", item: "Coffee" },
    { emoji: "🥛", item: "Milk" },
    { emoji: "🥩", item: "Beef" },
    { emoji: "🍗", item: "Chicken" },
    { emoji: "🍖", item: "Pork" },
    { emoji: "🍗", item: "Turkey" },
    { emoji: "🥔", item: "Potatoes" },
    { emoji: "🥣", item: "Cereal" },
    { emoji: "🥣", item: "Oatmeal" },
    { emoji: "🥚", item: "Eggs" },
    { emoji: "🥓", item: "Bacon" },
    { emoji: "🧀", item: "Cheese" },
    { emoji: "🥬", item: "Lettuce" },
    { emoji: "🥒", item: "Cucumber" },
    { emoji: "🐠", item: "Smoked Salmon" },
    { emoji: "🐟", item: "Tuna" },
    { emoji: "🐡", item: "Halibut" },
    { emoji: "🥦", item: "Broccoli" },
    { emoji: "🧅", item: "Onions" },
    { emoji: "🍊", item: "Oranges" },
    { emoji: "🍯", item: "Honey" },
    { emoji: "🍞", item: "Sourdough Bread" },
    { emoji: "🥖", item: "French Bread" },
    { emoji: "🍐", item: "Pear" },
    { emoji: "🥜", item: "Nuts" },
    { emoji: "🍎", item: "Apples" },
    { emoji: "🥥", item: "Coconut" },
    { emoji: "🧈", item: "Butter" },
    { emoji: "🧀", item: "Mozzarella" },
    { emoji: "🍅", item: "Tomatoes" },
    { emoji: "🍄", item: "Mushrooms" },
    { emoji: "🍚", item: "Rice" },
    { emoji: "🍜", item: "Pasta" },
    { emoji: "🍌", item: "Banana" },
    { emoji: "🥕", item: "Carrots" },
    { emoji: "🍋", item: "Lemons" },
    { emoji: "🍉", item: "Watermelons" },
    { emoji: "🍇", item: "Grapes" },
    { emoji: "🍓", item: "Strawberries" },
    { emoji: "🍈", item: "Melons" },
    { emoji: "🍒", item: "Cherries" },
    { emoji: "🍑", item: "Peaches" },
    { emoji: "🍍", item: "Pineapples" },
    { emoji: "🥝", item: "Kiwis" },
    { emoji: "🍆", item: "Eggplants" },
    { emoji: "🥑", item: "Avocados" },
    { emoji: "🌶", item: "Peppers" },
    { emoji: "🌽", item: "Corn" },
    { emoji: "🍠", item: "Sweet Potatoes" },
    { emoji: "🥯", item: "Bagels" },
    { emoji: "🥫", item: "Soup" },
    { emoji: "🍪", item: "Cookies" },
];
const donations$1 = items$1.map((item, id) => {
    const quantity = Math.floor(Math.random() * 20) + 1;
    const days_until_expires = Math.floor(Math.random() * 30) + 1;
    return { ...item, quantity, days_until_expires, id: (id + 1).toString() };
});
const listItems$1 = (page, perPage) => {
    return donations$1.slice((page - 1) * perPage, page * perPage);
};
const almostExpired$1 = (donation) => donation.days_until_expires <= 10;

class PaginateLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        const options = { page: 1, perPage: 10 };
        const { page, perPage } = options;
        const donations = listItems$1(page, perPage);
        socket.assign({
            options,
            donations,
        });
    }
    handleParams(params, url, socket) {
        const page = Number(params.page || 1);
        const perPage = Number(params.perPage || 10);
        const donations = listItems$1(page, perPage);
        socket.assign({
            options: { page, perPage },
            donations,
        });
    }
    render(context) {
        const { options: { perPage, page }, donations, } = context;
        return html `
      <h1>Food Bank Donations</h1>
      <div id="donations">
        <form phx-change="select-per-page">
          Show
          <select name="perPage">
            ${options_for_select([5, 10, 15, 20].map((n) => String(n)), String(perPage))}
          </select>
          <label for="perPage">per page</label>
        </form>
        <div class="wrapper">
          <table>
            <thead>
              <tr>
                <th class="item">Item</th>
                <th>Quantity</th>
                <th>Days Until Expires</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderDonations(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? this.paginationLink("Previous", page - 1, perPage, "previous") : ""}
              ${this.pageLinks(page, perPage)} ${this.paginationLink("Next", page + 1, perPage, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        const page = socket.context.options.page;
        const perPage = Number(params.perPage || 10);
        socket.pushPatch("/paginate", { page: String(page), perPage: String(perPage) });
        socket.assign({
            options: { page, perPage },
            donations: listItems$1(page, perPage),
        });
    }
    pageLinks(page, perPage) {
        let links = [];
        for (var p = page - 2; p <= page + 2; p++) {
            if (p > 0) {
                links.push(this.paginationLink(String(p), p, perPage, p === page ? "active" : ""));
            }
        }
        return join(links, "");
    }
    paginationLink(text, pageNum, perPageNum, className) {
        const page = String(pageNum);
        const perPage = String(perPageNum);
        return live_patch(html `<button>${text}</button>`, {
            to: {
                path: "/paginate",
                params: { page, perPage },
            },
            className,
        });
    }
    renderDonations(donations) {
        return donations.map((donation) => html `
        <tr>
          <td class="item">
            <span class="id">${donation.id}</span>
            ${donation.emoji} ${donation.item}
          </td>
          <td>${donation.quantity} lbs</td>
          <td>
            <span> ${this.expiresDecoration(donation)} </span>
          </td>
        </tr>
      `);
    }
    expiresDecoration(donation) {
        if (almostExpired$1(donation)) {
            return html `<mark>${donation.days_until_expires}</mark>`;
        }
        else {
            return donation.days_until_expires;
        }
    }
}

// generate a random number between min and max
const random = (min, max) => {
    return () => Math.floor(Math.random() * (max - min + 1)) + min;
};
const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomSatisfaction = random(95, 100);
class SalesDashboardLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        if (socket.connected) {
            socket.repeat(() => {
                socket.send("tick");
            }, 1000);
        }
        socket.assign(generateSalesDashboardContext());
    }
    render(context) {
        return html `
      <h1>Sales Dashboard</h1>
      <div id="dashboard">
        <div class="stats">
          <div class="stat">
            <span class="value"> ${context.newOrders} </span>
            <span class="name"> New Orders </span>
          </div>
          <div class="stat">
            <span class="value"> ${numberToCurrency(context.salesAmount)} </span>
            <span class="name"> Sales Amount </span>
          </div>
          <div class="stat">
            <span class="value"> ${context.satisfaction} </span>
            <span class="name"> Satisfaction </span>
          </div>
        </div>
        <button phx-click="refresh">↻ Refresh</button>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        socket.assign(generateSalesDashboardContext());
    }
    handleInfo(event, socket) {
        socket.assign(generateSalesDashboardContext());
    }
}
function generateSalesDashboardContext() {
    return {
        newOrders: randomNewOrders(),
        salesAmount: randomSalesAmount(),
        satisfaction: randomSatisfaction(),
    };
}

function listServers() {
    return servers;
}
const servers = [
    {
        id: "1",
        name: "dancing-lizard",
        status: "up",
        deploy_count: 14,
        size: 19.5,
        framework: "Elixir/Phoenix",
        git_repo: "https://git.example.com/dancing-lizard.git",
        last_commit_id: "f3d41f7",
        last_commit_message: "If this works, I'm going disco    🕺",
    },
    {
        id: "2",
        name: "lively-frog",
        status: "up",
        deploy_count: 12,
        size: 24.0,
        framework: "Elixir/Phoenix",
        git_repo: "https://git.example.com/lively-frog.git",
        last_commit_id: "d2eba26",
        last_commit_message: "Does it scale? 🤔",
    },
    {
        id: "3",
        name: "curious-raven",
        status: "up",
        deploy_count: 21,
        size: 17.25,
        framework: "Ruby/Rails",
        git_repo: "https://git.example.com/curious-raven.git",
        last_commit_id: "a3708f1",
        last_commit_message: "Fixed a bug! 🐞",
    },
    {
        id: "4",
        name: "cryptic-owl",
        status: "down",
        deploy_count: 2,
        size: 5.0,
        framework: "Elixir/Phoenix",
        git_repo: "https://git.example.com/cryptic-owl.git",
        last_commit_id: "c497e91",
        last_commit_message: "First big launch! 🤞",
    },
];

class ServersLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        const servers = listServers();
        const selectedServer = servers[0];
        socket.assign({
            servers,
            selectedServer,
        });
    }
    handleParams(params, url, socket) {
        const servers = listServers();
        const selectedServer = servers.find((server) => server.id === params.id) || servers[0];
        socket.pageTitle(selectedServer.name);
        socket.assign({
            servers,
            selectedServer,
        });
    }
    render(context) {
        const { servers, selectedServer } = context;
        return html `
      <h1>Servers</h1>
      <div id="servers">
        <div class="sidebar">
          <nav>
            ${servers.map((server) => {
            return live_patch(this.link_body(server), {
                to: { path: "/servers", params: { id: server.id } },
                className: server.id === selectedServer.id ? "selected" : "",
            });
        })}
          </nav>
        </div>
        <div class="main">
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <h2>${selectedServer.name}</h2>
                <span class="${selectedServer.status}"> ${selectedServer.status} </span>
              </div>
              <div class="body">
                <div class="row">
                  <div class="deploys">
                    🚀
                    <span> ${selectedServer.deploy_count} deploys </span>
                  </div>
                  <span> ${selectedServer.size} MB </span>
                  <span> ${selectedServer.framework} </span>
                </div>
                <h3>Git Repo</h3>
                <div class="repo">${selectedServer.git_repo}</div>
                <h3>Last Commit</h3>
                <div class="commit">${selectedServer.last_commit_id}</div>
                <blockquote>${selectedServer.last_commit_message}</blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }
    link_body(server) {
        return html ` <button>🤖 ${server.name}</button> `;
    }
}

const items = [
    { emoji: "☕️", item: "Coffee" },
    { emoji: "🥛", item: "Milk" },
    { emoji: "🥩", item: "Beef" },
    { emoji: "🍗", item: "Chicken" },
    { emoji: "🍖", item: "Pork" },
    { emoji: "🍗", item: "Turkey" },
    { emoji: "🥔", item: "Potatoes" },
    { emoji: "🥣", item: "Cereal" },
    { emoji: "🥣", item: "Oatmeal" },
    { emoji: "🥚", item: "Eggs" },
    { emoji: "🥓", item: "Bacon" },
    { emoji: "🧀", item: "Cheese" },
    { emoji: "🥬", item: "Lettuce" },
    { emoji: "🥒", item: "Cucumber" },
    { emoji: "🐠", item: "Smoked Salmon" },
    { emoji: "🐟", item: "Tuna" },
    { emoji: "🐡", item: "Halibut" },
    { emoji: "🥦", item: "Broccoli" },
    { emoji: "🧅", item: "Onions" },
    { emoji: "🍊", item: "Oranges" },
    { emoji: "🍯", item: "Honey" },
    { emoji: "🍞", item: "Sourdough Bread" },
    { emoji: "🥖", item: "French Bread" },
    { emoji: "🍐", item: "Pear" },
    { emoji: "🥜", item: "Nuts" },
    { emoji: "🍎", item: "Apples" },
    { emoji: "🥥", item: "Coconut" },
    { emoji: "🧈", item: "Butter" },
    { emoji: "🧀", item: "Mozzarella" },
    { emoji: "🍅", item: "Tomatoes" },
    { emoji: "🍄", item: "Mushrooms" },
    { emoji: "🍚", item: "Rice" },
    { emoji: "🍜", item: "Pasta" },
    { emoji: "🍌", item: "Banana" },
    { emoji: "🥕", item: "Carrots" },
    { emoji: "🍋", item: "Lemons" },
    { emoji: "🍉", item: "Watermelons" },
    { emoji: "🍇", item: "Grapes" },
    { emoji: "🍓", item: "Strawberries" },
    { emoji: "🍈", item: "Melons" },
    { emoji: "🍒", item: "Cherries" },
    { emoji: "🍑", item: "Peaches" },
    { emoji: "🍍", item: "Pineapples" },
    { emoji: "🥝", item: "Kiwis" },
    { emoji: "🍆", item: "Eggplants" },
    { emoji: "🥑", item: "Avocados" },
    { emoji: "🌶", item: "Peppers" },
    { emoji: "🌽", item: "Corn" },
    { emoji: "🍠", item: "Sweet Potatoes" },
    { emoji: "🥯", item: "Bagels" },
    { emoji: "🥫", item: "Soup" },
    { emoji: "🍪", item: "Cookies" },
];
const donations = items.map((item, id) => {
    const quantity = Math.floor(Math.random() * 20) + 1;
    const days_until_expires = Math.floor(Math.random() * 30) + 1;
    return { ...item, quantity, days_until_expires, id: id + 1 };
});
const listItems = (paginateOptions, sortOptions) => {
    const { page, perPage } = paginateOptions;
    const { sort_by, sortOrder } = sortOptions;
    const sorted = donations.sort((a, b) => {
        if (a[sort_by] < b[sort_by]) {
            return sortOrder === "asc" ? -1 : 1;
        }
        if (a[sort_by] > b[sort_by]) {
            return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
    });
    return sorted.slice((page - 1) * perPage, page * perPage);
};
const almostExpired = (donation) => donation.days_until_expires <= 10;

class SortLiveViewComponent extends BaseLiveView {
    mount(params, session, socket) {
        const paginateOptions = {
            page: 1,
            perPage: 10,
        };
        const sortOptions = {
            sort_by: "item",
            sortOrder: "asc",
        };
        socket.assign({
            options: { ...paginateOptions, ...sortOptions },
            donations: listItems(paginateOptions, sortOptions),
        });
    }
    handleParams(params, url, socket) {
        const page = Number(params.page || 1);
        const perPage = Number(params.perPage || 10);
        const validSortBy = Object.keys(donations[0]).includes(params.sort_by);
        const sort_by = validSortBy ? params.sort_by : "item";
        const sortOrder = params.sortOrder === "desc" ? "desc" : "asc";
        socket.assign({
            options: { page, perPage, sort_by, sortOrder },
            donations: listItems({ page, perPage }, { sort_by, sortOrder }),
        });
    }
    render(context) {
        const { options: { perPage, page, sortOrder, sort_by }, donations, } = context;
        return html `
      <h1>Food Bank Donations</h1>
      <div id="donations">
        <form phx-change="select-per-page">
          Show
          <select name="perPage">
            ${options_for_select([5, 10, 15, 20].map((n) => String(n)), String(perPage))}
          </select>
          <label for="perPage">per page</label>
        </form>
        <div class="wrapper">
          <table>
            <thead>
              <tr>
                <th class="item" phx-click="change-sort" phx-value-sort_by="id">
                  ${this.sort_emoji(sort_by, "id", sortOrder)}Item
                </th>
                <th phx-click="change-sort" phx-value-sort_by="quantity">
                  ${this.sort_emoji(sort_by, "quantity", sortOrder)}Quantity
                </th>
                <th phx-click="change-sort" phx-value-sort_by="days_until_expires">
                  ${this.sort_emoji(sort_by, "days_until_expires", sortOrder)}Days Until Expires
                </th>
              </tr>
            </thead>
            <tbody>
              ${this.renderDonations(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? this.paginationLink("Previous", page - 1, perPage, sort_by, sortOrder, "previous") : ""}
              ${this.pageLinks(page, perPage, sort_by, sortOrder)}
              ${this.paginationLink("Next", page + 1, perPage, sort_by, sortOrder, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        const page = socket.context.options.page;
        let perPage = socket.context.options.perPage;
        let sort_by = socket.context.options.sort_by;
        let sortOrder = socket.context.options.sortOrder;
        if (event === "select-per-page") {
            perPage = Number(params.perPage || socket.context.options.perPage);
        }
        if (event === "change-sort") {
            const incoming_sort_by = params.sort_by;
            // if already sorted by this column, reverse the order
            if (sort_by === incoming_sort_by) {
                sortOrder = sortOrder === "asc" ? "desc" : "asc";
            }
            else {
                sort_by = incoming_sort_by;
            }
        }
        socket.pushPatch("/sort", { page: String(page), perPage: String(perPage), sortOrder, sort_by });
        socket.assign({
            options: { page, perPage, sort_by, sortOrder },
            donations: listItems({ page, perPage }, { sort_by, sortOrder }),
        });
    }
    sort_emoji(sort_by, sort_by_value, sortOrder) {
        return sort_by === sort_by_value ? (sortOrder === "asc" ? "👇" : "☝️") : "";
    }
    pageLinks(page, perPage, sort_by, sortOrder) {
        let links = [];
        for (var p = page - 2; p <= page + 2; p++) {
            if (p > 0) {
                links.push(this.paginationLink(String(p), p, perPage, sort_by, sortOrder, p === page ? "active" : ""));
            }
        }
        return join(links, "");
    }
    paginationLink(text, pageNum, perPageNum, sort_by, sortOrder, className) {
        const page = String(pageNum);
        const perPage = String(perPageNum);
        return live_patch(html `<button>${text}</button>`, {
            to: {
                path: "/sort",
                params: { page, perPage, sort_by, sortOrder },
            },
            className,
        });
    }
    renderDonations(donations) {
        return donations.map((donation) => html `
        <tr>
          <td class="item">
            <span class="id">${donation.id}</span>
            ${donation.emoji} ${donation.item}
          </td>
          <td>${donation.quantity} lbs</td>
          <td>
            <span> ${this.expiresDecoration(donation)} </span>
          </td>
        </tr>
      `);
    }
    expiresDecoration(donation) {
        if (almostExpired(donation)) {
            return html `<mark>${donation.days_until_expires}</mark>`;
        }
        else {
            return donation.days_until_expires;
        }
    }
}

let urlAlphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
let fillPool = bytes => {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    crypto.randomFillSync(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto.randomFillSync(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
};
let nanoid = (size = 21) => {
  fillPool((size -= 0));
  let id = '';
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id
};

var util;
(function (util) {
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
})(util || (util = {}));

const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
class ZodError extends Error {
    constructor(issues) {
        super();
        this.issues = [];
        this.format = () => {
            const fieldErrors = { _errors: [] };
            const processError = (error) => {
                for (const issue of error.issues) {
                    if (issue.code === "invalid_union") {
                        issue.unionErrors.map(processError);
                    }
                    else if (issue.code === "invalid_return_type") {
                        processError(issue.returnTypeError);
                    }
                    else if (issue.code === "invalid_arguments") {
                        processError(issue.argumentsError);
                    }
                    else if (issue.path.length === 0) {
                        fieldErrors._errors.push(issue.message);
                    }
                    else {
                        let curr = fieldErrors;
                        let i = 0;
                        while (i < issue.path.length) {
                            const el = issue.path[i];
                            const terminal = i === issue.path.length - 1;
                            if (!terminal) {
                                if (typeof el === "string") {
                                    curr[el] = curr[el] || { _errors: [] };
                                }
                                else if (typeof el === "number") {
                                    const errorArray = [];
                                    errorArray._errors = [];
                                    curr[el] = curr[el] || errorArray;
                                }
                            }
                            else {
                                curr[el] = curr[el] || { _errors: [] };
                                curr[el]._errors.push(issue.message);
                            }
                            curr = curr[el];
                            i++;
                        }
                    }
                }
            };
            processError(this);
            return fieldErrors;
        };
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    get errors() {
        return this.issues;
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, null, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                fieldErrors[sub.path[0]].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};
const defaultErrorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === "undefined") {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${issue.keys
                .map((k) => `'${k}'`)
                .join(", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${issue.options
                .map((val) => (typeof val === "string" ? `'${val}'` : val))
                .join(" | ")}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${issue.options
                .map((val) => (typeof val === "string" ? `'${val}'` : val))
                .join(" | ")}`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (issue.validation !== "regex")
                message = `Invalid ${issue.validation}`;
            else
                message = "Invalid";
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be greater than ${issue.inclusive ? `or equal to ` : ``}${issue.minimum}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be less than ${issue.inclusive ? `or equal to ` : ``}${issue.maximum}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return { message };
};
let overrideErrorMap = defaultErrorMap;
const setErrorMap = (map) => {
    overrideErrorMap = map;
};

const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then &&
                typeof data.then === "function" &&
                data.catch &&
                typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};
const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: issueData.message || errorMessage,
    };
};
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap,
            ctx.schemaErrorMap,
            overrideErrorMap,
            defaultErrorMap, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            syncPairs.push({
                key: await pair.key,
                value: await pair.value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return INVALID;
            if (value.status === "aborted")
                return INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (typeof value.value !== "undefined" || pair.alwaysSet) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
const INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== undefined && x instanceof Promise;

var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));

class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        return this._path.concat(this._key);
    }
}
const handleResult = (ctx, result) => {
    if (isValid(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        const error = new ZodError(ctx.common.issues);
        return { success: false, error };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid" or "required" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        if (typeof ctx.data === "undefined" && required_error)
            return { message: required_error };
        if (params.invalid_type_error)
            return { message: params.invalid_type_error };
        return { message: ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this.superRefine = this._refinement;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.default = this.default.bind(this);
        this.describe = this.describe.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
    }
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        var _a;
        const ctx = {
            common: {
                issues: [],
                async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
                typeCache: typeof Map !== "undefined" ? new Map() : undefined,
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
                async: true,
                typeCache: typeof Map !== "undefined" ? new Map() : undefined,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const maybeAsyncResult = this._parse({ data, path: [], parent: ctx });
        const result = await (isAsync(maybeAsyncResult)
            ? maybeAsyncResult
            : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function"
                    ? refinementData(val, ctx)
                    : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    optional() {
        return ZodOptional.create(this);
    }
    nullable() {
        return ZodNullable.create(this);
    }
    nullish() {
        return this.optional().nullable();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this);
    }
    or(option) {
        return ZodUnion.create([this, option]);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming);
    }
    transform(transform) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const uuidRegex = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
class ZodString extends ZodType {
    constructor() {
        super(...arguments);
        this._regex = (regex, validation, message) => this.refinement((data) => regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message),
        });
        /**
         * Deprecated.
         * Use z.string().min(1) instead.
         */
        this.nonempty = (message) => this.min(1, errorUtil.errToObj(message));
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType,
            }
            //
            );
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch (_a) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
        }
        return { status: status.value, value: input.data };
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this.min(len, message).max(len, message);
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get minLength() {
        let min = -Infinity;
        this._def.checks.map((ch) => {
            if (ch.kind === "min") {
                if (min === null || ch.value > min) {
                    min = ch.value;
                }
            }
        });
        return min;
    }
    get maxLength() {
        let max = null;
        this._def.checks.map((ch) => {
            if (ch.kind === "max") {
                if (max === null || ch.value < max) {
                    max = ch.value;
                }
            }
        });
        return max;
    }
}
ZodString.create = (params) => {
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int");
    }
}
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.bigint,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodBigInt.create = (params) => {
    return new ZodBigInt({
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date,
            });
            return INVALID;
        }
        return {
            status: "valid",
            value: new Date(input.data.getTime()),
        };
    }
}
ZodDate.create = (params) => {
    return new ZodDate({
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType,
        });
        return INVALID;
    }
}
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all(ctx.data.map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = ctx.data.map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return this.min(len, message).max(len, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      ZodObject      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (objectUtil = {}));
const AugmentFactory = (def) => (augmentation) => {
    return new ZodObject({
        ...def,
        shape: () => ({
            ...def.shape(),
            ...augmentation,
        }),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return ZodArray.create(deepPartialify(schema.element));
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        this.augment = AugmentFactory(this._def);
        this.extend = AugmentFactory(this._def);
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return (this._cached = { shape, keys });
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const dataKeys = util.objectKeys(ctx.data);
        const extraKeys = dataKeys.filter((k) => !shapeKeys.includes(k));
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") ;
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    syncPairs.push({
                        key,
                        value: await pair.value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        var _a, _b, _c, _d;
                        const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        // const mergedShape = objectUtil.mergeShapes(
        //   this._def.shape(),
        //   merging._def.shape()
        // );
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        util.objectKeys(mask).map((key) => {
            shape[key] = this.shape[key];
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).map((key) => {
            if (util.objectKeys(mask).indexOf(key) === -1) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        if (mask) {
            util.objectKeys(this.shape).map((key) => {
                if (util.objectKeys(mask).indexOf(key) === -1) {
                    newShape[key] = this.shape[key];
                }
                else {
                    newShape[key] = this.shape[key].optional();
                }
            });
            return new ZodObject({
                ...this._def,
                shape: () => newShape,
            });
        }
        else {
            for (const key in this.shape) {
                const fieldSchema = this.shape[key];
                newShape[key] = fieldSchema.optional();
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required() {
        const newShape = {};
        for (const key in this.shape) {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
                newField = newField._def.innerType;
            }
            newShape[key] = newField;
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
}
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.options.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: this.validDiscriminatorValues,
                path: [discriminator],
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get validDiscriminatorValues() {
        return Array.from(this.options.keys());
    }
    get options() {
        return this._def.options;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, types, params) {
        // Get all the valid discriminator values
        const options = new Map();
        try {
            types.forEach((type) => {
                const discriminatorValue = type.shape[discriminator].value;
                options.set(discriminatorValue, type);
            });
        }
        catch (e) {
            throw new Error("The discriminator value could not be extracted from all the provided schemas");
        }
        // Assert that all the discriminator values are unique
        if (options.size !== types.length) {
            throw new Error("Some of the discriminator values are not unique");
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            ...processCreateParams(params),
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util
            .objectKeys(a)
            .filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === ZodParsedType.date &&
        bType === ZodParsedType.date &&
        +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                type: "array",
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                type: "array",
            });
            status.dirty();
        }
        const items = ctx.data
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
ZodTuple.create = (schemas, params) => {
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
class ZodMap extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodFunction extends ZodType {
    constructor() {
        super(...arguments);
        this.validate = this.implement;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    overrideErrorMap,
                    defaultErrorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                },
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    overrideErrorMap,
                    defaultErrorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                },
            });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            return OK(async (...args) => {
                const error = new ZodError([]);
                const parsedArgs = await this._def.args
                    .parseAsync(args, params)
                    .catch((e) => {
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await fn(...parsedArgs);
                const parsedReturns = await this._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        }
        else {
            return OK((...args) => {
                const parsedArgs = this._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                }
                const result = fn(...parsedArgs.data);
                const parsedReturns = this._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create()),
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType,
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
}
ZodFunction.create = (args, returns, params) => {
    return new ZodFunction({
        args: (args
            ? args.rest(ZodUnknown.create())
            : ZodTuple.create([]).rest(ZodUnknown.create())),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params),
    });
};
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: getParsedType(this._def.value),
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values) {
    return new ZodEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
    });
}
class ZodEnum extends ZodType {
    _parse(input) {
        if (this._def.values.indexOf(input.data) === -1) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_enum_value,
                options: this._def.values,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        if (nativeEnumValues.indexOf(input.data) === -1) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_enum_value,
                options: util.objectValues(nativeEnumValues),
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise &&
            ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise
            ? ctx.data
            : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data);
            if (ctx.common.async) {
                return Promise.resolve(processed).then((processed) => {
                    return this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                });
            }
            else {
                return this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
        if (effect.type === "refinement") {
            const checkCtx = {
                addIssue: (arg) => {
                    addIssueToContext(ctx, arg);
                    if (arg.fatal) {
                        status.abort();
                    }
                    else {
                        status.dirty();
                    }
                },
                get path() {
                    return ctx.path;
                },
            };
            checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
            const executeRefinement = (acc
            // effect: RefinementEffect<any>
            ) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((inner) => {
                    if (inner.status === "aborted")
                        return INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                // if (base.status === "aborted") return INVALID;
                // if (base.status === "dirty") {
                //   return { status: "dirty", value: base.value };
                // }
                if (!isValid(base))
                    return base;
                const result = effect.transform(base.value);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return OK(result);
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((base) => {
                    if (!isValid(base))
                        return base;
                    // if (base.status === "aborted") return INVALID;
                    // if (base.status === "dirty") {
                    //   return { status: "dirty", value: base.value };
                    // }
                    return Promise.resolve(effect.transform(base.value)).then(OK);
                });
            }
        }
        util.assertNever(effect);
    }
}
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
ZodDefault.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
const custom = (check, params) => {
    if (check)
        return ZodAny.create().refine(check, params);
    return ZodAny.create();
};
const late = {
    object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`,
}) => custom((data) => data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();

var mod = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ZodParsedType: ZodParsedType,
    getParsedType: getParsedType,
    makeIssue: makeIssue,
    EMPTY_PATH: EMPTY_PATH,
    addIssueToContext: addIssueToContext,
    ParseStatus: ParseStatus,
    INVALID: INVALID,
    DIRTY: DIRTY,
    OK: OK,
    isAborted: isAborted,
    isDirty: isDirty,
    isValid: isValid,
    isAsync: isAsync,
    ZodType: ZodType,
    ZodString: ZodString,
    ZodNumber: ZodNumber,
    ZodBigInt: ZodBigInt,
    ZodBoolean: ZodBoolean,
    ZodDate: ZodDate,
    ZodUndefined: ZodUndefined,
    ZodNull: ZodNull,
    ZodAny: ZodAny,
    ZodUnknown: ZodUnknown,
    ZodNever: ZodNever,
    ZodVoid: ZodVoid,
    ZodArray: ZodArray,
    get objectUtil () { return objectUtil; },
    ZodObject: ZodObject,
    ZodUnion: ZodUnion,
    ZodDiscriminatedUnion: ZodDiscriminatedUnion,
    ZodIntersection: ZodIntersection,
    ZodTuple: ZodTuple,
    ZodRecord: ZodRecord,
    ZodMap: ZodMap,
    ZodSet: ZodSet,
    ZodFunction: ZodFunction,
    ZodLazy: ZodLazy,
    ZodLiteral: ZodLiteral,
    ZodEnum: ZodEnum,
    ZodNativeEnum: ZodNativeEnum,
    ZodPromise: ZodPromise,
    ZodEffects: ZodEffects,
    ZodTransformer: ZodEffects,
    ZodOptional: ZodOptional,
    ZodNullable: ZodNullable,
    ZodDefault: ZodDefault,
    ZodNaN: ZodNaN,
    custom: custom,
    Schema: ZodType,
    ZodSchema: ZodType,
    late: late,
    get ZodFirstPartyTypeKind () { return ZodFirstPartyTypeKind; },
    any: anyType,
    array: arrayType,
    bigint: bigIntType,
    boolean: booleanType,
    date: dateType,
    discriminatedUnion: discriminatedUnionType,
    effect: effectsType,
    'enum': enumType,
    'function': functionType,
    'instanceof': instanceOfType,
    intersection: intersectionType,
    lazy: lazyType,
    literal: literalType,
    map: mapType,
    nan: nanType,
    nativeEnum: nativeEnumType,
    never: neverType,
    'null': nullType,
    nullable: nullableType,
    number: numberType,
    object: objectType,
    oboolean: oboolean,
    onumber: onumber,
    optional: optionalType,
    ostring: ostring,
    preprocess: preprocessType,
    promise: promiseType,
    record: recordType,
    set: setType,
    strictObject: strictObjectType,
    string: stringType,
    transformer: effectsType,
    tuple: tupleType,
    'undefined': undefinedType,
    union: unionType,
    unknown: unknownType,
    'void': voidType,
    ZodIssueCode: ZodIssueCode,
    quotelessJson: quotelessJson,
    ZodError: ZodError,
    defaultErrorMap: defaultErrorMap,
    get overrideErrorMap () { return overrideErrorMap; },
    setErrorMap: setErrorMap
});

const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/;
// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
const VolunteerSchema = mod.object({
    id: mod.string().default(nanoid),
    name: mod.string().min(2).max(100),
    phone: mod.string().regex(phoneRegex, "Should be a valid phone number"),
    checked_out: mod.boolean().default(false),
});
// in memory data store
const volunteers = {};
const listVolunteers = () => {
    return Object.values(volunteers);
};
const getVolunteer = (id) => {
    return volunteers[id];
};
const changeset = newChangesetFactory(VolunteerSchema);
const createVolunteer = (newVolunteer) => {
    const result = changeset({}, newVolunteer, "create");
    if (result.valid) {
        const volunteer = result.data;
        volunteers[volunteer.id] = volunteer;
        broadcast({ type: "created", volunteer });
    }
    return result;
};
const updateVolunteer = (currentVolunteer, updated) => {
    const result = changeset(currentVolunteer, updated, "update");
    if (result.valid) {
        const volunteer = result.data;
        volunteers[volunteer.id] = volunteer;
        broadcast({ type: "updated", volunteer });
    }
    return result;
};
const pubSub = new SingleProcessPubSub();
function broadcast(event) {
    pubSub.broadcast("volunteer", event);
}

class VolunteerComponent extends BaseLiveView {
    mount(params, session, socket) {
        if (socket.connected) {
            // listen for changes to volunteer data
            socket.subscribe("volunteer");
        }
        socket.assign({
            volunteers: listVolunteers(),
            changeset: changeset({}, {}),
        });
        // reset volunteers to empty array after each render
        // in other words don't store this in memory
        socket.tempAssign({ volunteers: [] });
    }
    render(context) {
        const { changeset, volunteers } = context;
        return html `
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${form_for("#", {
            phx_submit: "save",
            phx_change: "validate",
        })}

        <div class="field">
          ${text_input(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
        </div>

        <div class="field">
          ${telephone_input(changeset, "phone", {
            placeholder: "Phone",
            autocomplete: "off",
            phx_debounce: "blur",
        })}
            ${error_tag(changeset, "phone")}
        </div>
        ${submit("Check In", { phx_disable_with: "Saving..." })}
        </form>

        <div id="volunteers" phx-update="prepend">
          ${volunteers.map(this.renderVolunteer)}
        </div>
    </div>
    `;
    }
    renderVolunteer(volunteer) {
        return html `
      <div id="${volunteer.id}" class="volunteer ${volunteer.checked_out ? " out" : ""}">
        <div class="name">${volunteer.name}</div>
        <div class="phone">📞 ${volunteer.phone}</div>
        <div class="status">
          <button phx-click="toggle-status" phx-value-id="${volunteer.id}" phx-disable-with="Saving...">
            ${volunteer.checked_out ? "Check In" : "Check Out"}
          </button>
        </div>
      </div>
    `;
    }
    handleEvent(event, params, socket) {
        if (event === "toggle-status") {
            // lookup volunteer by id
            const volunteer = getVolunteer(params.id);
            // toggle checked_out status (ignoring changeset for now)
            updateVolunteer(volunteer, { checked_out: !volunteer.checked_out });
            socket.assign({
                volunteers: listVolunteers(),
                changeset: changeset({}, {}),
            });
        }
        else if (event === "validate") {
            const validateChangeset = changeset({}, params);
            // set an action or else the changeset will be ignored
            // and form errors will not be shown
            validateChangeset.action = "validate";
            socket.assign({
                changeset: validateChangeset,
            });
        }
        else {
            const volunteer = {
                name: params.name,
                phone: params.phone,
            };
            // attempt to create the volunteer from the form data
            const createChangeset = createVolunteer(volunteer);
            socket.assign({
                volunteers: createChangeset.valid ? [createChangeset.data] : [],
                changeset: createChangeset.valid ? changeset({}, {}) : createChangeset, // errors for form
            });
        }
    }
    handleInfo(event, socket) {
        // console.log("received", event, socket.id);
        const { volunteer } = event;
        socket.assign({
            volunteers: [volunteer],
            changeset: changeset({}, {}),
        });
    }
}

export { AutocompleteLiveViewComponent, DecarboinizeCalculator, DecarbonizeLiveView, LicenseLiveViewComponent, LightLiveViewComponent, PaginateLiveViewComponent, SalesDashboardLiveViewComponent, SearchLiveViewComponent, ServersLiveViewComponent, SortLiveViewComponent, VolunteerComponent };
