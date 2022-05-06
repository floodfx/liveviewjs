'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var liveviewjs = require('liveviewjs');
var crypto = require('crypto');
var zod = require('zod');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

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

class AutocompleteLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        const zip = "";
        const city = "";
        const stores = [];
        const matches = [];
        const loading = false;
        socket.assign({ zip, city, stores, matches, loading });
    }
    handleEvent(event, socket) {
        // console.log("event:", event, params, socket);
        let city;
        switch (event.type) {
            case "zip-search":
                const { zip } = event;
                socket.sendInfo({ type: "run_zip_search", zip });
                socket.assign({ zip, loading: true, stores: [], matches: [] });
                break;
            case "city-search":
                city = event.city;
                socket.sendInfo({ type: "run_city_search", city });
                socket.assign({ city, loading: true, matches: [], stores: [] });
                break;
            case "suggest-city":
                city = event.city;
                const matches = suggest(city);
                socket.assign({ city, loading: false, matches });
                break;
        }
    }
    handleInfo(info, socket) {
        const { type } = info;
        let stores = [];
        switch (type) {
            case "run_zip_search":
                const { zip } = info;
                stores = searchByZip(zip);
                socket.assign({
                    zip,
                    stores,
                    loading: false,
                });
                break;
            case "run_city_search":
                const { city } = info;
                stores = searchByCity(city);
                socket.assign({
                    city,
                    stores,
                    loading: false,
                });
        }
    }
    render(context) {
        return liveviewjs.html `
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
          ${context.matches.map((match) => liveviewjs.html `<option value="${match}">${match}</option>`)}
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
    renderStoreStatus(store) {
        if (store.open) {
            return liveviewjs.html `<span class="open">🔓 Open</span>`;
        }
        else {
            return liveviewjs.html `<span class="closed">🔐 Closed</span>`;
        }
    }
    renderStore(store) {
        return liveviewjs.html ` <li>
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
        return liveviewjs.html ` <div class="loader">Loading...</div> `;
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

class CalculatorLiveComponent extends liveviewjs.BaseLiveComponent {
    render(context, meta) {
        const { vehicle1, vehicle2, spaceHeating, gridElectricity, carbonFootprintTons } = context;
        const { myself } = meta;
        return liveviewjs.html `
      <div id="calc_${myself}">
        <form phx-change="calculate" phx-target="${myself}">
          <div>
            <label>Vehicle 1</label>
            <select name="vehicle1" autocomplete="off">
              <option>Select</option>
              ${Object.keys(vehicleTypes).map((vehicle) => liveviewjs.html `<option value="${vehicle}" ${vehicle1 === vehicle ? "selected" : ""}>
                    ${vehicleTypes[vehicle]}
                  </option>`)}
            </select>
          </div>

          <div>
            <label>Vehicle 2</label>
            <select name="vehicle2" autocomplete="off">
              <option>Select</option>
              ${Object.keys(vehicleTypes).map((vehicle) => liveviewjs.html `<option value="${vehicle}" ${vehicle2 === vehicle ? "selected" : ""}>
                    ${vehicleTypes[vehicle]}
                  </option>`)}
            </select>
          </div>

          <div>
            <label>Space Heating</label>
            <select name="spaceHeating" autocomplete="off">
              <option>Select</option>
              ${Object.keys(spaceHeatingTypes).map((sh) => liveviewjs.html `<option value="${sh}" ${spaceHeating === sh ? "selected" : ""}>
                    ${spaceHeatingTypes[sh]}
                  </option>`)}
            </select>
          </div>

          <div>
            <label>Grid Electricity Source</label>
            <select name="gridElectricity" autocomplete="off" value="${gridElectricity}">
              <option>Select</option>
              ${Object.keys(gridElectricityTypes).map((grid) => liveviewjs.html `<option value="${grid}" ${gridElectricity === grid ? "selected" : ""}>
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
        return liveviewjs.html `
      <div id="footprint_${myself}">
        <h3>Carbon Footprint 👣</h3>
        <p>${carbonFootprintTons} tons of CO2</p>
        ${this.renderChart("footprint_chart", context)}
      </div>
    `;
    }
    renderChart(id, context) {
        const data = this.getChartData(id, context).data;
        return liveviewjs.html `
      <span id="${id}-init-data" style="display: none;">${liveviewjs.safe(JSON.stringify(data))}</span>
      <canvas id="${id}" phx-hook="Chart"></canvas>
    `;
    }
    handleEvent(event, socket) {
        // calculate footprint
        const { vehicle1, vehicle2, spaceHeating, gridElectricity } = event;
        const v1Tons = vehicleCarbonFootprint[vehicle1];
        const v2Tons = vehicleCarbonFootprint[vehicle2];
        const shTons = spaceHeatingCarbonFootprint[spaceHeating];
        const geTons = gridElectricityCarbonFootprint[gridElectricity];
        const carbonFootprintData = [v1Tons, v2Tons, shTons, geTons];
        socket.pushEvent({ type: "updateChart", carbonFootprintData });
        socket.assign({
            vehicle1,
            vehicle2,
            spaceHeating,
            gridElectricity,
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

class DecarbonizeLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        socket.pageTitle("Decarbonize Calculator");
    }
    async render(context, meta) {
        // use the live_component helper to render a `LiveComponent`
        const { live_component } = meta;
        return liveviewjs.html `
      <h1>Decarbonize Calculator</h1>
      <div>
        ${await live_component(new CalculatorLiveComponent(), {
            vehicle1: "gas",
            spaceHeating: "gas",
            gridElectricity: "grid",
            id: 1,
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

const photoSizes = ["4x6", "5x7", "8x10", "10x13", "11x14"];
class PrintsLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        const photoSizeIndex = 1;
        const photoSize = photoSizeByIndex(photoSizeIndex);
        const cost = calculateCost(photoSize);
        socket.assign({ photoSize, photoSizeIndex, cost });
    }
    render(context, meta) {
        const { photoSize, photoSizeIndex, cost } = context;
        // pull apart dimensions
        const [width, _] = photoSize.split("x");
        return liveviewjs.html `
      <h1>Photo Print Pricing</h1>
      <div id="size_cost_control">
        <h4>Size: ${photoSize}</h4>
        <h4>Cost: ${numberToCurrency(cost)}</h4>
        <p>Move the slider to see the cost of each print size</p>
        <form phx-change="update">
          <input type="hidden" name="_csrf_token" value="${meta.csrfToken}" />
          <input type="range" min="0" max="4" name="photoSizeIndex" value="${photoSizeIndex}" />
        </form>

        <img
          width="${Number(width) * 15 * 3}"
          height="${Number(width) * 15 * 2}"
          src="https://placekitten.com/2400/1200" />
      </div>
    `;
    }
    handleEvent(event, socket) {
        const { photoSizeIndex } = event;
        const photoSize = photoSizeByIndex(Number(photoSizeIndex));
        const cost = calculateCost(photoSize);
        socket.assign({ photoSize, cost });
    }
}
function photoSizeByIndex(index) {
    if (index >= 0 && index < photoSizes.length) {
        return photoSizes[index];
    }
    return photoSizes[0];
}
function calculateCost(photSize) {
    switch (photSize) {
        case "4x6":
            return 10;
        case "5x7":
            return 12;
        case "8x10":
            return 15;
        case "10x13":
            return 24;
        case "11x14":
            return 36;
    }
}

class VolumeLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        socket.pageTitle("🎧 Volume Control");
        socket.assign({ volume: 10 });
    }
    render(context, meta) {
        const { volume } = context;
        return liveviewjs.html `
      <div id="light">
        <h1>🎧 Volume Control</h1>
        <div>
          <div>${volume}%</div>
          <progress
            id="volume_control"
            style="width: 300px; height: 2em; opacity: ${volume / 100}"
            value="${volume}"
            max="100"></progress>
        </div>

        <button phx-click="off" phx-window-keydown="key_update" phx-key="ArrowLeft">⬅️ Silence</button>

        <button phx-click="down" phx-window-keydown="key_update" phx-key="ArrowDown">⬇️ Turn Down</button>

        <button phx-click="up" phx-window-keydown="key_update" phx-key="ArrowUp">⬆️ Turn Up</button>

        <button phx-click="on" phx-window-keydown="key_update" phx-key="ArrowRight">➡️ Cranked</button>

        <div>
          <h5>Try using the keys too!</h5>
        </div>
      </div>
    `;
    }
    async handleEvent(event, socket) {
        const { volume } = socket.context;
        let key = event.type;
        // if event was a key event, use the key name as the event
        if (event.type === "key_update") {
            key = event.key;
        }
        let newVolume = volume;
        switch (key) {
            case "off":
            case "ArrowLeft":
                newVolume = 0;
                break;
            case "on":
            case "ArrowRight":
                newVolume = 100;
                break;
            case "up":
            case "ArrowUp":
                newVolume = Math.min(volume + 10, 100);
                break;
            case "down":
            case "ArrowDown":
                newVolume = Math.max(volume - 10, 0);
                break;
        }
        if (newVolume === 100) {
            await socket.putFlash("info", "Cranked full volume! 🤘");
        }
        else if (newVolume === 0) {
            await socket.putFlash("error", "Silence! 🤫");
        }
        socket.assign({ volume: newVolume });
    }
}

class SearchLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        const zip = "";
        const stores = [];
        const loading = false;
        socket.assign({ zip, stores, loading });
    }
    renderStoreStatus(store) {
        if (store.open) {
            return liveviewjs.html `<span class="open">🔓 Open</span>`;
        }
        else {
            return liveviewjs.html `<span class="closed">🔐 Closed</span>`;
        }
    }
    renderStore(store) {
        return liveviewjs.html ` <li>
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
        return liveviewjs.html ` <div class="loader">Loading...</div> `;
    }
    render(context, meta) {
        const { zip, stores, loading } = context;
        return liveviewjs.html `
      <h1>Find a Store</h1>
      <div id="search">
        <form phx-submit="zip-search">
          <input type="hidden" name="_csrf_token" value="${meta.csrfToken}" />
          <input
            type="text"
            name="zip"
            value="${zip}"
            placeholder="Zip Code"
            autofocus
            autocomplete="off"
            ${loading ? "readonly" : ""} />

          <button type="submit">🔎</button>
        </form>

        ${loading ? this.renderLoading() : ""}

        <div class="stores">
          <ul>
            ${stores.map((store) => this.renderStore(store))}
          </ul>
        </div>
      </div>
    `;
    }
    handleEvent(event, socket) {
        const { zip } = event;
        socket.sendInfo({ type: "run_zip_search", zip });
        socket.assign({ zip, stores: [], loading: true });
    }
    handleInfo(info, socket) {
        const { zip } = info;
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

class PaginateLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        const options = { page: 1, perPage: 10 };
        const { page, perPage } = options;
        const donations = listItems$1(page, perPage);
        socket.assign({
            options,
            donations,
        });
    }
    handleParams(url, socket) {
        const page = Number(url.searchParams.get("page") || 1);
        const perPage = Number(url.searchParams.get("perPage") || 10);
        const donations = listItems$1(page, perPage);
        socket.assign({
            options: { page, perPage },
            donations,
        });
    }
    render(context) {
        const { options: { perPage, page }, donations, } = context;
        return liveviewjs.html `
      <h1>Food Bank Donations</h1>
      <div id="donations">
        <form phx-change="select-per-page">
          Show
          <select name="perPage">
            ${liveviewjs.options_for_select([5, 10, 15, 20].map((n) => String(n)), String(perPage))}
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
    handleEvent(event, socket) {
        const page = socket.context.options.page;
        const perPage = Number(event.perPage || 10);
        socket.pushPatch("/paginate", new URLSearchParams({ page: String(page), perPage: String(perPage) }));
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
        return liveviewjs.join(links, "");
    }
    paginationLink(text, pageNum, perPageNum, className) {
        const page = String(pageNum);
        const perPage = String(perPageNum);
        return liveviewjs.live_patch(liveviewjs.html `<button>${text}</button>`, {
            to: {
                path: "/paginate",
                params: { page, perPage },
            },
            className,
        });
    }
    renderDonations(donations) {
        return donations.map((donation) => liveviewjs.html `
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
            return liveviewjs.html `<mark>${donation.days_until_expires}</mark>`;
        }
        else {
            return donation.days_until_expires;
        }
    }
}

class DashboardLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        if (socket.connected) {
            // socket will be connected after websocket connetion established
            socket.repeat(() => {
                socket.sendInfo({ type: "tick" });
            }, 1000);
        }
        socket.assign(nextRandomData());
    }
    render(context) {
        const { newOrders, salesAmount, rating } = context;
        return liveviewjs.html `
      <h1>Sales Dashboard</h1>
      <hr />
      <span>🥡 New Orders</span>
      <h2>${newOrders}</h2>
      <hr />
      <span>💰 Sales Amount</span>
      <h2>${numberToCurrency(salesAmount)}</h2>
      <hr />
      <span>🌟 Rating</spa>
      <h2>${ratingToStars(rating)}</h2>

      <br />
      <br />
      <button phx-click="refresh">↻ Refresh</button>
    `;
    }
    handleEvent(event, socket) {
        socket.assign(nextRandomData());
    }
    handleInfo(info, socket) {
        socket.assign(nextRandomData());
    }
}
function ratingToStars(rating) {
    const stars = [];
    let i = 0;
    for (; i < rating; i++) {
        stars.push("⭐");
    }
    for (; i < 5; i++) {
        stars.push("✩");
    }
    return stars.join("");
}
function nextRandomData() {
    return {
        newOrders: randomNewOrders(),
        salesAmount: randomSalesAmount(),
        rating: randomRating(),
    };
}
// generate a random number between min and max
const random = (min, max) => {
    return () => Math.floor(Math.random() * (max - min + 1)) + min;
};
const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomRating = random(1, 5);

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

class ServersLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        const servers = listServers();
        const selectedServer = servers[0];
        socket.assign({
            servers,
            selectedServer,
        });
    }
    handleParams(url, socket) {
        const servers = listServers();
        const serverId = url.searchParams.get("id");
        const selectedServer = servers.find((server) => server.id === serverId) || servers[0];
        socket.pageTitle(selectedServer.name);
        socket.assign({
            servers,
            selectedServer,
        });
    }
    render(context) {
        const { servers, selectedServer } = context;
        return liveviewjs.html `
      <h1>Servers</h1>
      <div id="servers">
        <div class="sidebar">
          <nav>
            ${servers.map((server) => {
            return liveviewjs.live_patch(this.link_body(server), {
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
        return liveviewjs.html ` <button>🤖 ${server.name}</button> `;
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
    const { sortby, sortOrder } = sortOptions;
    const sorted = donations.sort((a, b) => {
        if (a[sortby] < b[sortby]) {
            return sortOrder === "asc" ? -1 : 1;
        }
        if (a[sortby] > b[sortby]) {
            return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
    });
    return sorted.slice((page - 1) * perPage, page * perPage);
};
const almostExpired = (donation) => donation.days_until_expires <= 10;

class SortLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        const paginateOptions = {
            page: 1,
            perPage: 10,
        };
        const sortOptions = {
            sortby: "item",
            sortOrder: "asc",
        };
        socket.assign({
            options: { ...paginateOptions, ...sortOptions },
            donations: listItems(paginateOptions, sortOptions),
        });
    }
    handleParams(url, socket) {
        const page = Number(url.searchParams.get("page") || 1);
        const perPage = Number(url.searchParams.get("perPage") || 10);
        let sortby = (url.searchParams.get("sortby") || "item");
        const validSortby = Object.keys(donations[0]).includes(sortby);
        sortby = validSortby ? sortby : "item";
        const sortOrder = url.searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
        socket.assign({
            options: { page, perPage, sortby, sortOrder },
            donations: listItems({ page, perPage }, { sortby, sortOrder }),
        });
    }
    render(context, meta) {
        const { options: { perPage, page, sortOrder, sortby }, donations, } = context;
        return liveviewjs.html `
      <h1>Food Bank Donations</h1>
      <div id="donations">
        <form phx-change="select-per-page">
          Show
          <select name="perPage">
            ${liveviewjs.options_for_select([5, 10, 15, 20].map((n) => String(n)), String(perPage))}
          </select>
          <label for="perPage">per page</label>
        </form>
        <div class="wrapper">
          <table>
            <thead>
              <tr>
                <th class="item" phx-click="change-sort" phx-value-sortby="id">
                  ${this.sort_emoji(sortby, "id", sortOrder)}Item
                </th>
                <th phx-click="change-sort" phx-value-sortby="quantity">
                  ${this.sort_emoji(sortby, "quantity", sortOrder)}Quantity
                </th>
                <th phx-click="change-sort" phx-value-sortby="days_until_expires">
                  ${this.sort_emoji(sortby, "days_until_expires", sortOrder)}Days Until Expires
                </th>
              </tr>
            </thead>
            <tbody>
              ${this.renderDonations(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? this.paginationLink("Previous", page - 1, perPage, sortby, sortOrder, "previous") : ""}
              ${this.pageLinks(page, perPage, sortby, sortOrder)}
              ${this.paginationLink("Next", page + 1, perPage, sortby, sortOrder, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
    }
    handleEvent(event, socket) {
        const { options } = socket.context;
        let { page, perPage, sortby, sortOrder } = options;
        switch (event.type) {
            case "select-per-page":
                perPage = Number(event.perPage || perPage);
                break;
            case "change-sort":
                if (event.sortby === sortby) {
                    sortOrder = sortOrder === "asc" ? "desc" : "asc";
                }
                else {
                    sortby = event.sortby;
                    sortOrder = "asc";
                }
                break;
        }
        socket.pushPatch("/sort", new URLSearchParams({ page: String(page), perPage: String(perPage), sortOrder, sortby }));
        socket.assign({
            options: { page, perPage, sortby, sortOrder },
            donations: listItems({ page, perPage }, { sortby, sortOrder }),
        });
    }
    sort_emoji(sortby, sortby_value, sortOrder) {
        return sortby === sortby_value ? (sortOrder === "asc" ? "👇" : "☝️") : "";
    }
    pageLinks(page, perPage, sortby, sortOrder) {
        let links = [];
        for (var p = page - 2; p <= page + 2; p++) {
            if (p > 0) {
                links.push(this.paginationLink(String(p), p, perPage, sortby, sortOrder, p === page ? "active" : ""));
            }
        }
        return liveviewjs.join(links, "");
    }
    paginationLink(text, pageNum, perPageNum, sortby, sortOrder, className) {
        const page = String(pageNum);
        const perPage = String(perPageNum);
        return liveviewjs.live_patch(liveviewjs.html `<button>${text}</button>`, {
            to: {
                path: "/sort",
                params: { page, perPage, sortby, sortOrder },
            },
            className,
        });
    }
    renderDonations(donations) {
        return donations.map((donation) => liveviewjs.html `
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
            return liveviewjs.html `<mark>${donation.days_until_expires}</mark>`;
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
    crypto__default["default"].randomFillSync(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto__default["default"].randomFillSync(pool);
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

const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/;
// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
const VolunteerSchema = zod.z.object({
    id: zod.z.string().default(nanoid),
    name: zod.z.string().min(2).max(100),
    phone: zod.z.string().regex(phoneRegex, "Should be a valid phone number"),
    checked_out: zod.z.boolean().default(false),
});
// in memory data store
const volunteers = {};
const listVolunteers = () => {
    return Object.values(volunteers);
};
const getVolunteer = (id) => {
    return volunteers[id];
};
const changeset = liveviewjs.newChangesetFactory(VolunteerSchema);
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
const pubSub = new liveviewjs.SingleProcessPubSub();
function broadcast(event) {
    pubSub.broadcast("volunteer", event);
}

class VolunteersLiveView extends liveviewjs.BaseLiveView {
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
    render(context, meta) {
        const { changeset, volunteers } = context;
        return liveviewjs.html `
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${liveviewjs.form_for("#", meta.csrfToken, {
            phx_submit: "save",
            phx_change: "validate",
        })}

        <div class="field">
          ${liveviewjs.text_input(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${liveviewjs.error_tag(changeset, "name")}
        </div>

        <div class="field">
          ${liveviewjs.telephone_input(changeset, "phone", {
            placeholder: "Phone",
            autocomplete: "off",
            phx_debounce: "blur",
        })}
            ${liveviewjs.error_tag(changeset, "phone")}
        </div>
        ${liveviewjs.submit("Check In", { phx_disable_with: "Saving..." })}
        </form>

        <div id="volunteers" phx-update="prepend">
          ${volunteers.map(this.renderVolunteer)}
        </div>
    </div>
    `;
    }
    renderVolunteer(volunteer) {
        return liveviewjs.html `
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
    handleEvent(event, socket) {
        switch (event.type) {
            case "validate":
                socket.assign({
                    changeset: changeset({}, event, "validate"),
                });
                break;
            case "save":
                const { name, phone } = event;
                // attempt to create the volunteer from the form data
                const createChangeset = createVolunteer({ name, phone });
                socket.assign({
                    volunteers: createChangeset.valid ? [createChangeset.data] : [],
                    changeset: createChangeset.valid ? changeset({}, {}) : createChangeset, // errors for form
                });
                break;
            case "toggle-status":
                // lookup volunteer by id
                const volunteer = getVolunteer(event.id);
                // toggle checked_out status (ignoring changeset for now)
                updateVolunteer(volunteer, { checked_out: !volunteer.checked_out });
                socket.assign({
                    volunteers: listVolunteers(),
                    changeset: changeset({}, {}),
                });
                break;
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

class CounterLiveView extends liveviewjs.BaseLiveView {
    mount(params, session, socket) {
        socket.assign({ count: 0 });
    }
    handleEvent(event, socket) {
        const { count } = socket.context;
        switch (event.type) {
            case "increment":
                socket.assign({ count: count + 1 });
                break;
            case "decrement":
                socket.assign({ count: count - 1 });
                break;
        }
    }
    render(context, meta) {
        const { count } = context;
        return liveviewjs.html `
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
    }
}

const routeDetails = [
    {
        label: "Volume",
        path: "/volume",
        summary: "Control the volume using buttons or keys.",
        tags: ["phx-click", "phx-window-keydown", "phx-key", "flash"],
    },
    {
        label: "Prints",
        path: "/prints",
        summary: "Use a range input to calculate price of printing a photo of a cat.",
        tags: ["phx-change"],
    },
    {
        label: "Dashboard",
        path: "/dashboard",
        summary: "Real-time dashboard showing live order metrics updating every second.",
        tags: ["server-push"],
    },
    {
        label: "Search",
        path: "/search",
        summary: "Search for businesses by zip code with live search results.",
        tags: ["phx-submit", "sendSelf"],
    },
    {
        label: "Autocomplete",
        path: "/autocomplete",
        summary: "Autocomplete by city prefix with live search results and debouncing.",
        tags: ["phx-change", "phx-submit", "phx-debounce"],
    },
    {
        label: "Pagination",
        path: "/paginate",
        summary: "Paginate a list of items with live navigation updating the list content and url params.",
        tags: ["phx-change", "push-patch"],
    },
    {
        label: "Sorting",
        path: "/sort",
        summary: "Expand on the pagination example to sort the list of items using live navigation.",
        tags: ["phx-change", "phx-click", "push-patch"],
    },
    {
        label: "Servers",
        path: "/servers",
        summary: "Navigate between servers using live navigation updating the url params along with the content.",
        tags: ["live-patch"],
    },
    {
        label: "Volunteers",
        path: "/volunteers",
        summary: "Simulate signing up for a volunteer event.",
        tags: ["phx-submit", "phx-change", "phx-update", "phx-feedback-for", "phx-debounce"],
    },
    // {
    //   label: "AsyncFetch",
    //   path: "/asyncfetch",
    //   summary: "Example of using async fetch to fetch data from a server.  In this case, Xkcd comic data.",
    //   tags: ["live-patch", "async/await"],
    // },
    {
        label: "Decarbonize Calculator",
        path: "/decarbonize",
        summary: "Example of LiveComponents within a LiveView",
        tags: ["live_component"],
    },
    {
        label: "Counter",
        path: "/counter",
        summary: 'Standard "hello world" example.',
        tags: ["phx-click"],
    },
];

exports.AutocompleteLiveView = AutocompleteLiveView;
exports.CalculatorLiveComponent = CalculatorLiveComponent;
exports.CounterLiveView = CounterLiveView;
exports.DashboardLiveView = DashboardLiveView;
exports.DecarbonizeLiveView = DecarbonizeLiveView;
exports.PaginateLiveView = PaginateLiveView;
exports.PrintsLiveView = PrintsLiveView;
exports.SearchLiveView = SearchLiveView;
exports.ServersLiveView = ServersLiveView;
exports.SortLiveView = SortLiveView;
exports.VolumeLiveView = VolumeLiveView;
exports.VolunteersLiveView = VolunteersLiveView;
exports.routeDetails = routeDetails;
