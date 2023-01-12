
/// <reference types="./liveviewjs-examples.d.ts" />
import { createLiveView, html, newChangesetFactory, SingleProcessPubSub, form_for, text_input, error_tag, submit, createLiveComponent, live_patch, safe, JS, options_for_select, join, live_file_input, live_img_preview, mime, telephone_input } from 'liveviewjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';

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

/**
 * Example of a search box with autocomplete.  Start typing a city in the search box
 * and a list of matching cities wiill appear.
 */
const autocompleteLiveView = createLiveView({
    // initialize the context
    mount: (socket) => {
        const city = "";
        const stores = [];
        const matches = [];
        const loading = false;
        socket.assign({ city, stores, matches, loading });
    },
    // handle events from the user
    handleEvent: (event, socket) => {
        let city;
        switch (event.type) {
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
    },
    // handle internal events
    handleInfo: (info, socket) => {
        const { type } = info;
        let stores = [];
        switch (type) {
            case "run_city_search":
                const { city } = info;
                stores = searchByCity(city);
                socket.assign({
                    city,
                    stores,
                    loading: false,
                });
        }
    },
    // update the LiveView based on the context
    render: (context) => {
        const { loading, city, matches, stores } = context;
        return html `
      <h1>Find a Store</h1>
      <div id="search">
        <form phx-submit="city-search" phx-change="suggest-city">
          <input
            type="text"
            name="city"
            value="${city}"
            placeholder="City"
            autocomplete="off"
            list="matches"
            phx-debounce="200"
            ${context.loading ? "readonly" : ""} />

          <button type="submit">🏙🔎</button>
          <div style="font-size: 10px">(Only Denver has results)</div>
        </form>

        <datalist id="matches">${matches.map((match) => html `<option value="${match}">${match}</option>`)}</datalist>

        ${loading ? renderLoading$1() : ""}

        <div class="stores">
          <ul>
            ${stores.map((store) => renderStore$1(store))}
          </ul>
        </div>
      </div>
    `;
    },
});
// helper function that shows the store status
function renderStoreStatus$1(store) {
    if (store.open) {
        return html `<span class="open">🔓 Open</span>`;
    }
    else {
        return html `<span class="closed">🔐 Closed</span>`;
    }
}
// helper function that renders a store details
function renderStore$1(store) {
    return html ` <li>
    <div class="first-line">
      <div class="name">${store.name}</div>
      <div class="status">${renderStoreStatus$1(store)}</div>
      <div class="second-line">
        <div class="street">📍 ${store.street}</div>
        <div class="phone_number">📞 ${store.phone_number}</div>
      </div>
    </div>
  </li>`;
}
// helper function that renders a loading message
function renderLoading$1() {
    return html `<div class="loader">Loading...</div>`;
}

// Create the zod BookSchema
const BookSchema = z.object({
    id: z.string().default(nanoid),
    name: z.string().min(2).max(100),
    author: z.string().min(4).max(100),
    checked_out: z.boolean().default(false),
});
// Book LiveViewChangesetFactory
const bookCSF = newChangesetFactory(BookSchema);
// in memory data store for Books
const booksDB = {};
// Pub/Sub for publishing changes
const pubSub$2 = new SingleProcessPubSub();
const booksLiveView = createLiveView({
    mount: (socket) => {
        if (socket.connected) {
            socket.subscribe("books");
        }
        socket.assign({
            books: Object.values(booksDB),
            changeset: bookCSF({}, {}), // empty changeset
        });
    },
    handleEvent: (event, socket) => {
        switch (event.type) {
            case "validate":
                // validate the form data
                socket.assign({
                    changeset: bookCSF({}, event, "validate"),
                });
                break;
            case "save":
                // attempt to create the book from the form data
                const saveChangeset = bookCSF({}, event, "save");
                let changeset = saveChangeset;
                if (saveChangeset.valid) {
                    // save the book to the in memory data store
                    const newBook = saveChangeset.data;
                    booksDB[newBook.id] = newBook;
                    // since book was saved, reset the changeset to empty
                    changeset = bookCSF({}, {});
                }
                // update context
                socket.assign({
                    books: Object.values(booksDB),
                    changeset,
                });
                pubSub$2.broadcast("books", { type: "updated" });
                break;
            case "toggle-checkout":
                // lookup book by id
                const book = booksDB[event.id];
                if (book) {
                    // update book
                    book.checked_out = !book.checked_out;
                    booksDB[book.id] = book;
                    // update context
                    socket.assign({
                        books: Object.values(booksDB),
                    });
                    pubSub$2.broadcast("books", { type: "updated" });
                }
                break;
        }
    },
    handleInfo: (info, socket) => {
        if (info.type === "updated") {
            socket.assign({
                books: Object.values(booksDB),
            });
        }
    },
    render: (context, meta) => {
        const { changeset, books } = context;
        const { csrfToken } = meta;
        return html `
      <h1>My Library</h1>
      
      <div id="bookForm">
        ${form_for("#", csrfToken, {
            phx_submit: "save",
            phx_change: "validate",
        })}
          
          <div class="field">
            ${text_input(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
          </div>

          <div class="field">
            ${text_input(changeset, "author", { placeholder: "Author", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "author")}
          </div>

          ${submit("Add Book", { phx_disable_with: "Saving..." })}
        </form>
      </div>

      <div id="books">
        ${books.map(renderBook)}
      </div>
    `;
    },
});
function renderBook(b) {
    const color = b.checked_out ? `color: #ccc;` : ``;
    const emoji = b.checked_out ? `📖[checked out]` : `📚[available]`;
    return html `
    <div id="${b.id}" style="margin-top: 1rem; ${color}">
      ${emoji} <span>${b.name}</span> by <span>${b.author}</span>
      <div>
        <button phx-click="toggle-checkout" phx-value-id="${b.id}" phx-disable-with="Updating...">
          ${b.checked_out ? "Return" : "Check Out"}
        </button>
      </div>
    </div>
  `;
}

/**
 * A basic counter that increments and decrements a number.
 */
const counterLiveView = createLiveView({
    mount: (socket) => {
        // init state, set count to 0
        socket.assign({ count: 0 });
    },
    handleEvent: (event, socket) => {
        // handle increment and decrement events
        const { count } = socket.context;
        switch (event.type) {
            case "increment":
                socket.assign({ count: count + 1 });
                break;
            case "decrement":
                socket.assign({ count: count - 1 });
                break;
        }
    },
    render: async (context) => {
        // render the view based on the state
        const { count } = context;
        return html `
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
    },
});

// An in-memory count simulating state outside of the LiveView
let count = 0;
// Use a single process pub/sub implementation (for simplicity)
const pubSub$1 = new SingleProcessPubSub();
/**
 * A basic counter that increments and decrements a number.
 */
const rtCounterLiveView = createLiveView({
    mount: (socket) => {
        // init state, set count to current count
        socket.assign({ count });
        // subscribe to counter events
        socket.subscribe("counter");
    },
    handleEvent: (event, socket) => {
        // handle increment and decrement events
        const { count } = socket.context;
        switch (event.type) {
            case "increment":
                // broadcast the new count
                pubSub$1.broadcast("counter", { count: count + 1 });
                break;
            case "decrement":
                // broadcast the new count
                pubSub$1.broadcast("counter", { count: count - 1 });
                break;
        }
    },
    handleInfo: (info, socket) => {
        // receive updates from pubsub and update the context
        count = info.count;
        socket.assign({ count });
    },
    render: async (context) => {
        // render the view based on the state
        const { count } = context;
        return html `
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
    },
});

function numberToCurrency(amount) {
    var formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });
    return formatter.format(amount);
}

const intervalRefs = {};
/**
 * Dashboard that automatically refreshes every second or when a user hits refresh.
 */
const dashboardLiveView = createLiveView({
    mount: (socket) => {
        if (socket.connected) {
            // only start repeating if the socket is connected (i.e. websocket is connected)
            const infoInterval = setInterval(() => {
                // send the tick event internally
                socket.sendInfo({ type: "tick" });
            }, 1000);
            intervalRefs[socket.id] = [infoInterval];
        }
        socket.assign({ ...nextRandomData(), refreshes: 0 });
    },
    // on tick, update random data
    handleInfo: (info, socket) => {
        const { refreshes } = socket.context;
        if (refreshes % 5 === 0) {
            socket.pushEvent({ type: "refresh", refreshes });
        }
        socket.assign({ ...nextRandomData(), refreshes: socket.context.refreshes + 1 });
    },
    // on refresh, update random data
    handleEvent: (_, socket) => socket.assign(nextRandomData()),
    render: (context) => {
        const { newOrders, salesAmount, rating } = context;
        return html `
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
    },
    shutdown: (id, context) => {
        // clear the interval when the LiveView is shut down
        intervalRefs[id].forEach((interval) => clearInterval(interval));
    },
});
// generate a random set of data
function nextRandomData() {
    return {
        newOrders: randomNewOrders(),
        salesAmount: randomSalesAmount(),
        rating: randomRating(),
    };
}
// display star emojis given a rating
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
// generate a random number between min and max
const random$1 = (min, max) => {
    return () => Math.floor(Math.random() * (max - min + 1)) + min;
};
const randomSalesAmount = random$1(100, 1000);
const randomNewOrders = random$1(5, 20);
const randomRating = random$1(1, 5);

// These numbers are completely made up!
const vehicleTypeValues = ["gas", "electric", "hybrid", "dontHave"];
const vehicleTypeLabels = {
    gas: "🦕 Gas",
    electric: "🔌 Electric",
    hybrid: "🔋 Hybrid",
    dontHave: "🚎 Don't have",
};
const vehicleCO2Tons = {
    gas: 8,
    hybrid: 4,
    electric: 1,
    dontHave: 0,
};
const spaceHeatingTypeValues = ["gas", "oil", "electric", "heatpump", "notsure"];
const spaceHeatingTypeLabels = {
    gas: "🔥 Furnace that burns gas",
    oil: "🦕 Furnace that burns fuel oil",
    electric: "🔌 Electric resistance heaters (wall or baseboard heaters)",
    heatpump: "♨️ Heat pump",
    notsure: "🤷 Not sure",
};
const spaceHeatingCO2Tons = {
    gas: 6,
    oil: 5,
    electric: 3,
    heatpump: 1,
    notsure: 5, // assume 5 is average
};
const gridElectricityTypeValues = ["grid", "renewable", "solar", "notsure"];
const gridElectricityTypeLabels = {
    grid: "🔌 Grid electricity",
    renewable: "☀️ Renewable plan from my utility",
    solar: "🤝 Community solar",
    notsure: "🤷 Not sure",
};
const gridElectricityCO2Tons = {
    grid: 6,
    renewable: 2,
    solar: 2,
    notsure: 6, // assume 6 is average
};

/**
 * "Stateful" `LiveComponet` that calculates the tons of CO2 based on the type of
 * vehicle, space heating and grid electricity.
 *
 * "Stateful" means that it has an "id" attribute which allows it to keep track of it's local state
 * and receive events from user input and handle them in "handleEvent" function.
 *
 */
const calcLiveComponent = createLiveComponent({
    handleEvent(event, socket) {
        const { vehicle, spaceHeating, gridElectricity } = event;
        // calculate footprint
        const vTons = vehicleCO2Tons[vehicle];
        const shTons = spaceHeatingCO2Tons[spaceHeating];
        const geTons = gridElectricityCO2Tons[gridElectricity];
        const footprintData = {
            vehicleCO2Tons: vTons,
            spaceHeatingCO2Tons: shTons,
            gridElectricityCO2Tons: geTons,
        };
        // send parent the new state
        socket.sendParentInfo({ type: "update", footprintData });
        // update context
        socket.assign({
            vehicle,
            spaceHeating,
            gridElectricity,
        });
    },
    render: (context, meta) => {
        const { vehicle, spaceHeating, gridElectricity } = context;
        const { myself } = meta;
        return html `
      <div id="calc_${myself}">
        <form phx-change="calculate" phx-target="${myself}">
          <div>
            <label>Vehicle</label>
            <select name="vehicle" autocomplete="off">
              <option disabled>Select</option>
              ${vehicleTypeValues.map((type) => {
            const selected = type === vehicle ? "selected" : "";
            return html `<option value="${type}" ${selected}>${vehicleTypeLabels[type]}</option>`;
        })}
            </select>
          </div>

          <div>
            <label>Space Heating</label>
            <select name="spaceHeating" autocomplete="off">
              <option disabled>Select</option>
              ${spaceHeatingTypeValues.map((type) => {
            const selected = type === spaceHeating ? "selected" : "";
            return html `<option value="${type}" ${selected}>${spaceHeatingTypeLabels[type]}</option>`;
        })}
            </select>
          </div>

          <div>
            <label>Grid Electricity Source</label>
            <select name="gridElectricity" autocomplete="off">
              <option disabled>Select</option>
              ${gridElectricityTypeValues.map((type) => {
            const selected = type === gridElectricity ? "selected" : "";
            return html `<option value="${type}" ${selected}>${gridElectricityTypeLabels[type]}</option>`;
        })}
            </select>
          </div>
        </form>
      </div>
    `;
    },
});
/**
 * "Stateless" `LiveComponent` which shows the carbon footprint based on the
 * provided data.
 */
const footprintLiveComponent = createLiveComponent({
    render: (context) => {
        const { data } = context;
        if (!data) {
            return html ``;
        }
        const { vehicleCO2Tons, spaceHeatingCO2Tons, gridElectricityCO2Tons } = data;
        const totalCO2Tons = vehicleCO2Tons + spaceHeatingCO2Tons + gridElectricityCO2Tons;
        return html `
      <div>
        <h3>Carbon Footprint 👣</h3>
        <p>${totalCO2Tons} tons of CO2</p>
      </div>
    `;
    },
});

const decarbLiveView = createLiveView({
    mount: (socket) => {
        socket.pageTitle("Decarbonize Calculator");
    },
    // receive the info from the stateful child LiveComponent
    handleInfo: (info, socket) => {
        const { footprintData } = info;
        socket.assign({ footprintData });
    },
    render: async (context, meta) => {
        // use the live_component helper to render a `LiveComponent`
        const { footprintData } = context;
        const { live_component } = meta;
        return html `
      <h1>Decarbonize Calculator</h1>
      <div>
        ${await live_component(calcLiveComponent, {
            vehicle: "gas",
            spaceHeating: "gas",
            gridElectricity: "grid",
            id: 1,
        })}
      </div>
      <div>
        ${await live_component(footprintLiveComponent, {
            data: footprintData,
        })}
      </div>
    `;
    },
});

function randomXkcdNum(max) {
    return Math.floor(Math.random() * max) + 1;
}
function isValidXkcd(num, max) {
    return num >= 1 && num <= max;
}
async function fetchXkcd(num, max) {
    let url = "https://xkcd.com/info.0.json";
    if (num && max && isValidXkcd(num, max)) {
        url = `https://xkcd.com/${num}/info.0.json`;
    }
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

/**
 * Example that loads a today's comic from xkcd.com and allows paginating and loading
 * random comics from the same site.
 */
const xkcdLiveView = createLiveView({
    // initialize the context
    mount: async (socket) => {
        // get today's comic from xkcd
        const comic = await fetchXkcd();
        // pull out today's number and use it as the max
        const max = comic.num;
        socket.pageTitle(`Xkcd: ${comic.title}`);
        socket.assign({
            comic,
            max,
        });
    },
    // handle url data and update the context accordingly
    handleParams: async (url, socket) => {
        // num should be between 1 and max
        const { max } = socket.context;
        const num = Number(url.searchParams.get("num"));
        const which = isNaN(num) ? undefined : num;
        const comic = await fetchXkcd(which, max);
        socket.assign({
            comic,
            num,
        });
    },
    // update the LiveView based on the context
    render: (context, meta) => {
        const { comic, num, max } = context;
        const { pathname } = meta.url;
        return html `
      <h1>Xkcd</h1>
      <div>
        <!-- navigation buttons -->
        <nav>${prev(pathname, max, num)} ${next(pathname, max, num)} ${random(pathname, max)} ${today(pathname)}</nav>
      </div>
      <div>
        <!-- summary & title -->
        <h2>${num ? `#${num}` : `Today's (#${comic.num})`}</h2>
        <h3>${comic.title}</h3>
      </div>
      <div>
        <!-- the comic -->
        <img src="${safe(comic.img)}" alt="${comic.alt}" />
        <pre style="white-space:pre-line;">${comic.transcript}</pre>
      </div>
    `;
    },
});
// helper to create a button to go to the previous comic using `live_patch`
function prev(path, max, num) {
    if (num && isValidXkcd(num - 1, max)) {
        return live_patch(html `<button>Previous</button>`, {
            to: { path, params: { num: String(num - 1) } },
        });
    }
    return html ``;
}
// helper to create a button to go to the next comic using `live_patch`
function next(path, max, num) {
    if (num && isValidXkcd(num + 1, max)) {
        return live_patch(html `<button>Next</button>`, {
            to: { path, params: { num: String(num + 1) } },
        });
    }
    return html ``;
}
// helper to create a button to go to a randoms comic using `live_patch`
function random(path, max) {
    const num = randomXkcdNum(max);
    return live_patch(html `<button>Random</button>`, {
        to: { path, params: { num: String(num) } },
    });
}
// helper to create a button to go to today's comic using `live_patch`
function today(path) {
    return live_patch(html `<button>Today</button>`, {
        to: { path },
    });
}

const helloNameLiveView = createLiveView({
    mount: (socket, _, params) => {
        var _a;
        socket.assign({ name: (_a = params.name) !== null && _a !== void 0 ? _a : "World" });
    },
    render: (context) => {
        const { name } = context;
        return html `👋 ${name}! `;
    },
});

const helloToggleEmojiLiveView = createLiveView({
    mount: (socket) => {
        socket.assign({ useEmoji: false });
    },
    handleEvent(event, socket) {
        socket.assign({ useEmoji: !socket.context.useEmoji });
    },
    render: (context) => {
        const msg = context.useEmoji ? "👋 🌎" : "Hello World";
        return html `
      ${msg}
      <br />
      <button phx-click="toggle">Toggle Message</button>
    `;
    },
});

/**
 * Example of a LiveView using JS Commands
 */
const jsCmdsLiveView = createLiveView({
    mount: async (socket) => {
        socket.assign({ count: 0 });
    },
    handleEvent(event, socket) {
        if (event.type === "increment") {
            socket.assign({ count: socket.context.count + 1 });
        }
        else if (event.type === "decrement") {
            socket.assign({ count: socket.context.count - 1 });
        }
    },
    render: async (ctx) => {
        return html `
      <div>
        <h2>Add / Remove Class</h2>
        <button phx-click="${new JS().add_class("red underline", { to: "#add_rm_class" })}">Add Class</button>
        <button phx-click="${new JS().remove_class("red underline", { to: "#add_rm_class" })}">Remove Class</button>
        <div id="add_rm_class">Add/Remove Class Target</div>

        <h2>Toggle</h2>
        <button phx-click="${new JS().toggle({ to: "#toggle" })}">Toggle</button>
        <div id="toggle">Toggler</div>

        <h2>Show / Hide</h2>
        <button phx-click="${new JS().show({ to: "#show_hide" })}">Show</button>
        <button phx-click="${new JS().hide({ to: "#show_hide" })}">Hide</button>
        <div id="show_hide" style="display:none;">Show/Hide</div>

        <h2>Set / Remove Attribute</h2>
        <button phx-click="${new JS().set_attribute(["disabled", ""], { to: "#set_rm_attr" })}">Set Disabled</button>
        <button phx-click="${new JS().remove_attribute("disabled", { to: "#set_rm_attr" })}">Remove Disabled</button>
        <button id="set_rm_attr">Button</button>

        <h2>Dispatch</h2>
        <button phx-click="${new JS().dispatch("click", { to: "#dispatch" })}">Dispatch Click</button>
        <button phx-click="${new JS().dispatch("custom", { to: "#dispatch", detail: { foo: "bar" } })}">
          Dispatch Custom
        </button>
        <div id="dispatch">Dispatch Target</div>
        <script type="text/javascript">
          window.addEventListener("custom", (e) => {
            console.log("Custom Event", e);
          });
          window.addEventListener("click", (e) => {
            console.log("Click Event", e);
          });
        </script>

        <h2>Transition</h2>
        <button
          phx-click="${new JS()
            .transition("fade-in-scale", {
            to: "#transition",
        })
            .show({ to: "#transition", transition: "fade-in-scale" })}">
          Transition In
        </button>
        <button
          phx-click="${new JS()
            .transition("fade-out-scale", {
            to: "#transition",
        })
            .hide({ to: "#transition", transition: "fade-out-scale" })}">
          Transition Out
        </button>
        <button phx-click="${new JS().transition("shake")}">Shake</button>
        <div id="transition">Transition Target</div>

        <h2>Push</h2>
        Count: ${ctx.count}
        <button phx-click="${new JS().push("increment")}">+</button>
        <button phx-click="${new JS().push("decrement")}">-</button>
        <button phx-click="${new JS().push("increment").hide()}">Add then hide</button>
        <button phx-click="${new JS().hide().push("increment")}">Hide then add</button>
        <button phx-click="${new JS().push("increment", { page_loading: true })}">Page Loading Push</button>

        <!-- Some custom styles for demo-->
        <style>
          .red {
            color: red;
          }
          .underline {
            text-decoration: underline;
          }

          .fade-in-scale {
            animation: 0.25s ease-in 0s normal forwards 1 fade-in-scale-keys;
          }

          .fade-out-scale {
            animation: 0.25s ease-out 0s normal forwards 1 fade-out-scale-keys;
          }

          .fade-in {
            animation: 0.25s ease-out 0s normal forwards 1 fade-in-keys;
          }
          .fade-out {
            animation: 0.25s ease-out 0s normal forwards 1 fade-out-keys;
          }

          .shake {
            animation: shake 0.2s infinite;
          }

          @keyframes shake {
            20% {
              transform: rotate(0deg);
            }
            40% {
              transform: rotate(5deg);
            }
            60% {
              transform: rotate(0deg);
            }
            80% {
              transform: rotate(-5deg);
            }
            100% {
              transform: rotate(0deg);
            }
          }

          @keyframes fade-in-scale-keys {
            0% {
              scale: 0.95;
              opacity: 0;
            }
            100% {
              scale: 1;
              opacity: 1;
            }
          }

          @keyframes fade-out-scale-keys {
            0% {
              scale: 1;
              opacity: 1;
            }
            100% {
              scale: 0.95;
              opacity: 0;
            }
          }

          @keyframes fade-in-keys {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          @keyframes fade-out-keys {
            0% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
        </style>
      </div>
    `;
    },
});

/**
 * Example showing how to use server-side live navigation.
 */
const liveNavLV = createLiveView({
    handleParams: (url, socket) => {
        console.log("handleParams", url);
        if (url.searchParams.has("id")) {
            socket.assign({ id: url.searchParams.get("id") });
        }
    },
    handleEvent: (event, socket) => {
        switch (event.type) {
            case "patch":
                socket.assign({ id: event.id });
                socket.pushPatch(socket.url.pathname, new URLSearchParams({ id: event.id }));
                break;
            case "redirect":
                // extract first part of path (e.g. /liveNav)
                const path = socket.url.pathname.split("/")[1];
                socket.pushRedirect("/" + path + event.path);
                break;
        }
    },
    render: async (context) => {
        // render the view based on the state
        const { id } = context;
        return html `
      <div>
        <h1>Query String ID: ${id}</h1>
        <button phx-click="patch" phx-value-id="foo">Live Patch Search Param (to ?id=foo)</button>
        <button phx-click="redirect" phx-value-path="/bar">Live Redirect (to /bar)</button>
      </div>
    `;
    },
});

const searchLiveView = createLiveView({
    // initialState
    mount: (socket) => {
        const zip = "";
        const stores = [];
        const loading = false;
        socket.assign({ zip, stores, loading });
    },
    // user events
    handleEvent: (event, socket) => {
        const { zip } = event;
        socket.sendInfo({ type: "run_zip_search", zip });
        socket.assign({ zip, stores: [], loading: true });
    },
    // internal events
    handleInfo: (info, socket) => {
        const { zip } = info;
        const stores = searchByZip(zip);
        socket.assign({
            zip,
            stores,
            loading: false,
        });
    },
    // render the LiveView
    render: (context, meta) => {
        const { zip, stores, loading } = context;
        return html `
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
          <div style="font-size: 10px">(Try "80204" for results)</div>
        </form>

        ${loading ? renderLoading() : ""}

        <div class="stores">
          <ul>
            ${stores.map((store) => renderStore(store))}
          </ul>
        </div>
      </div>
    `;
    },
});
function renderStoreStatus(store) {
    if (store.open) {
        return html `<span class="open">🔓 Open</span>`;
    }
    else {
        return html `<span class="closed">🔐 Closed</span>`;
    }
}
function renderStore(store) {
    return html ` <li>
    <div class="first-line">
      <div class="name">${store.name}</div>
      <div class="status">${renderStoreStatus(store)}</div>
      <div class="second-line">
        <div class="street">📍 ${store.street}</div>
        <div class="phone_number">📞 ${store.phone_number}</div>
      </div>
    </div>
  </li>`;
}
function renderLoading() {
    return html ` <div class="loader">Loading...</div> `;
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

const paginateLiveView = createLiveView({
    mount: (socket) => {
        const options = { page: 1, perPage: 10 };
        const { page, perPage } = options;
        const donations = listItems$1(page, perPage);
        socket.assign({
            options,
            donations,
        });
    },
    handleParams: (url, socket) => {
        const page = Number(url.searchParams.get("page") || 1);
        const perPage = Number(url.searchParams.get("perPage") || 10);
        const donations = listItems$1(page, perPage);
        socket.assign({
            options: { page, perPage },
            donations,
        });
    },
    handleEvent: (event, socket) => {
        const page = socket.context.options.page;
        const perPage = Number(event.perPage || 10);
        socket.pushPatch("/paginate", new URLSearchParams({ page: String(page), perPage: String(perPage) }));
        socket.assign({
            options: { page, perPage },
            donations: listItems$1(page, perPage),
        });
    },
    render: (context) => {
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
              ${renderDonations$1(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? paginationLink$1("Previous", page - 1, perPage, "previous") : ""} ${pageLinks$1(page, perPage)}
              ${paginationLink$1("Next", page + 1, perPage, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
    },
});
function pageLinks$1(page, perPage) {
    let links = [];
    for (var p = page - 2; p <= page + 2; p++) {
        if (p > 0) {
            links.push(paginationLink$1(String(p), p, perPage, p === page ? "active" : ""));
        }
    }
    return join(links, "");
}
function paginationLink$1(text, pageNum, perPageNum, className) {
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
function renderDonations$1(donations) {
    return donations.map((donation) => html `
      <tr>
        <td class="item">
          <span class="id">${donation.id}</span>
          ${donation.emoji} ${donation.item}
        </td>
        <td>${donation.quantity} lbs</td>
        <td>
          <span> ${expiresDecoration$1(donation)} </span>
        </td>
      </tr>
    `);
}
function expiresDecoration$1(donation) {
    if (almostExpired$1(donation)) {
        return html `<mark>${donation.days_until_expires}</mark>`;
    }
    else {
        return donation.days_until_expires;
    }
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

var _InMemoryChangesetDB_store, _InMemoryChangesetDB_changeset, _InMemoryChangesetDB_pubSub, _InMemoryChangesetDB_pubSubTopic;
/**
 * An in-memory implementation of a database that works with changesets and pub/sub.
 */
class InMemoryChangesetDB {
    constructor(schema, options) {
        _InMemoryChangesetDB_store.set(this, {});
        _InMemoryChangesetDB_changeset.set(this, void 0);
        _InMemoryChangesetDB_pubSub.set(this, void 0);
        _InMemoryChangesetDB_pubSubTopic.set(this, void 0);
        __classPrivateFieldSet(this, _InMemoryChangesetDB_changeset, newChangesetFactory(schema), "f");
        __classPrivateFieldSet(this, _InMemoryChangesetDB_pubSub, options === null || options === void 0 ? void 0 : options.pubSub, "f");
        __classPrivateFieldSet(this, _InMemoryChangesetDB_pubSubTopic, options === null || options === void 0 ? void 0 : options.pubSubTopic, "f");
    }
    changeset(existing, newAttrs, action) {
        return __classPrivateFieldGet(this, _InMemoryChangesetDB_changeset, "f").call(this, existing !== null && existing !== void 0 ? existing : {}, newAttrs !== null && newAttrs !== void 0 ? newAttrs : {}, action);
    }
    list() {
        return Object.values(__classPrivateFieldGet(this, _InMemoryChangesetDB_store, "f"));
    }
    get(id) {
        return __classPrivateFieldGet(this, _InMemoryChangesetDB_store, "f")[id];
    }
    validate(data) {
        return this.changeset({}, data, "validate");
    }
    create(data) {
        const result = __classPrivateFieldGet(this, _InMemoryChangesetDB_changeset, "f").call(this, {}, data, "create");
        if (result.valid) {
            const newObj = result.data;
            // assume there will be an id field
            __classPrivateFieldGet(this, _InMemoryChangesetDB_store, "f")[newObj.id] = newObj;
            this.broadcast("created", newObj);
        }
        return result;
    }
    update(current, data) {
        const result = __classPrivateFieldGet(this, _InMemoryChangesetDB_changeset, "f").call(this, current, data, "update");
        if (result.valid) {
            const newObj = result.data;
            __classPrivateFieldGet(this, _InMemoryChangesetDB_store, "f")[newObj.id] = newObj;
            this.broadcast("updated", newObj);
        }
        return result;
    }
    delete(id) {
        const data = __classPrivateFieldGet(this, _InMemoryChangesetDB_store, "f")[id];
        const deleted = data !== undefined;
        if (deleted) {
            delete __classPrivateFieldGet(this, _InMemoryChangesetDB_store, "f")[id];
            this.broadcast("deleted", data);
        }
        return deleted;
    }
    async broadcast(type, data) {
        if (__classPrivateFieldGet(this, _InMemoryChangesetDB_pubSub, "f") && __classPrivateFieldGet(this, _InMemoryChangesetDB_pubSubTopic, "f")) {
            await __classPrivateFieldGet(this, _InMemoryChangesetDB_pubSub, "f").broadcast(__classPrivateFieldGet(this, _InMemoryChangesetDB_pubSubTopic, "f"), { type, data });
        }
    }
}
_InMemoryChangesetDB_store = new WeakMap(), _InMemoryChangesetDB_changeset = new WeakMap(), _InMemoryChangesetDB_pubSub = new WeakMap(), _InMemoryChangesetDB_pubSubTopic = new WeakMap();

const photosLiveView = createLiveView({
    mount: async (socket) => {
        if (socket.connected) {
            // listen to photos topic
            await socket.subscribe(photoGroupTopic);
        }
        // setup the default context
        socket.assign({
            photoGroups: photoGroupStore.list(),
            changeset: photoGroupStore.changeset(),
        });
        // configure the upload constraints
        socket.allowUpload("photos", {
            accept: [".png", ".jpg", ".jpeg", ".gif"],
            max_entries: 3,
            max_file_size: 5 * 1024 * 1024, // 5MB
        });
    },
    handleEvent: async (event, socket) => {
        switch (event.type) {
            case "validate": {
                // just validate the changeset
                socket.assign({ changeset: photoGroupStore.validate(event) });
                break;
            }
            case "save": {
                // first get the completed file uploads and map them to urls
                // Note: the files are guaranteed to be completed here because
                // save is the event called after all the uploads are complete
                const { completed } = await socket.uploadedEntries("photos");
                // set the urls on the event (which was not set via the form)
                event.urls = completed.map(filename);
                // attempt to save the photo
                const photoCreate = photoGroupStore.create(event);
                if (!photoCreate.valid) {
                    // if the photo is not valid, assign the changeset and return
                    // so that the form is re-rendered with the errors
                    socket.assign({
                        changeset: photoCreate,
                    });
                    return;
                }
                // Yay! We've successfully saved the photo, so we can consume (i.e. "remove")
                // the uploaded entries from the "photos" upload config
                await socket.consumeUploadedEntries("photos", async (meta, entry) => {
                    // we could create thumbnails, scan for viruses, etc.
                    // but for now move the data from the temp file (meta.path) to a public directory
                    meta.fileSystem.createOrAppendFile(`./public/${filename(entry)}`, meta.path);
                });
                // update the context with new photos and clear the form
                socket.assign({
                    photoGroups: photoGroupStore.list(),
                    changeset: photoGroupStore.changeset(),
                });
                break;
            }
            case "cancel": {
                const { ref } = event;
                // remove the uploaded entry from the upload config
                socket.cancelUpload("photos", ref);
                break;
            }
        }
    },
    // Handle broadcast events from the pub/sub subscription for the "photoGroup" topic
    handleInfo: (info, socket) => {
        const { data } = info;
        socket.assign({
            photoGroups: [data],
            changeset: photoGroupStore.changeset(),
        });
    },
    // Render the view
    render: (ctx, meta) => {
        var _a;
        const { photoGroups, changeset } = ctx;
        const { uploads } = meta;
        return html `
      <h2>My Photo Groups</h2>

      <!-- Render the form -->
      ${form_for("#", meta.csrfToken, {
            id: "photo-form",
            phx_change: "validate",
            phx_submit: "save",
        })}
        <!-- photo group name input -->
        <div>
          Photo Group Name: 
          ${text_input(changeset, "name")}
          ${error_tag(changeset, "name")}
        </div>

        <div>
          <!-- file input / drag and drop -->
          <div phx-drop-target="${uploads.photos.ref}" style="border: 2px dashed #ccc; padding: 10px; margin: 10px 0;">
            ${live_file_input(uploads.photos)}
            or drag and drop files here 
          </div>        
          <!-- help text -->
          <div style="font-size: 10px; padding-bottom: 3rem">
            Add up to ${uploads.photos.max_entries} photos
            (max ${uploads.photos.max_file_size / (1024 * 1024)} MB each)
          </div>
        </div>
        
        <!-- any errors from the upload -->
        ${(_a = uploads.photos.errors) === null || _a === void 0 ? void 0 : _a.map((error) => html `<p class="invalid-feedback">${error}</p>`)}

        <!-- render the preview, progress, and cancel button of the selected files -->
        ${uploads.photos.entries.map(renderEntry)}

        <!-- submit button -->
        ${submit("Upload", { phx_disable_with: "Saving...", disabled: uploads.photos.errors.length > 0 })}
      </form>
      
      <!-- render the photo groups -->
      <ul id="photo_groups_list" phx-update="prepend">
        ${photoGroups.map(renderPhotoGroup)}          
      </ul>
    `;
    },
});
// Render a preview of the uploaded file with progress bar and cancel button
function renderEntry(entry) {
    var _a;
    return html `
    <div style="display: flex; align-items: center;">
      <div style="width: 250px; margin: 2rem 0;">${live_img_preview(entry)}</div>
      <div style="display: flex; align-items: center; margin-left: 2rem;">
        <progress
          style="position: relative; top: 8px; width: 150px; height: 1em;"
          value="${entry.progress}"
          max="100"></progress>
        <span style="margin-left: 1rem;">${entry.progress}%</span>
      </div>
      <div style="display: flex; align-items: center;">
        <a style="padding-left: 2rem;" phx-click="cancel" phx-value-ref="${entry.ref}">🗑</a>
        ${(_a = entry.errors) === null || _a === void 0 ? void 0 : _a.map((error) => html `<p style="padding-left: 1rem;" class="invalid-feedback">${error}</p>`)}
      </div>
    </div>
  `;
}
// Render a photo group with a list of photos
function renderPhotoGroup(photoGroup) {
    return html `<li id="${photoGroup.id}">
    ${photoGroup.urls.map((url, i) => html `
        <h3>${photoGroup.name}(${i + 1})</h3>
        <img src="${url}" />
      `)}
  </li>`;
}
// Define the shape of the Photo type
const PhotoGroupSchema = z.object({
    id: z.string().default(nanoid),
    name: z.string().min(1).max(100),
    urls: z.array(z.string()).min(1).default([]),
});
// Pubsub topic for photos
const photoGroupTopic = "photoGroup";
// InMemory DB for photoGroup that publishes changes to the "photos" topic
const photoGroupStore = new InMemoryChangesetDB(PhotoGroupSchema, {
    pubSub: new SingleProcessPubSub(),
    pubSubTopic: photoGroupTopic,
});
/**
 * `filename` maps the upload entry to a filename based on the mime type of the entry
 * concatenated with the entry's uuid
 */
function filename(entry) {
    const exts = mime.lookupExtensions(entry.type);
    const ext = exts.length > 0 ? exts[0] : "bin";
    return `${entry.uuid}.${ext}`;
}

const photoSizes = ["4x6", "5x7", "8x10", "10x13", "11x14"];
const printLiveView = createLiveView({
    mount: (socket) => {
        const photoSizeIndex = 1;
        const photoSize = photoSizeByIndex(photoSizeIndex);
        const cost = calculateCost(photoSize);
        socket.assign({ photoSize, photoSizeIndex, cost });
    },
    handleEvent: (event, socket) => {
        const { photoSizeIndex } = event;
        const photoSize = photoSizeByIndex(Number(photoSizeIndex));
        const cost = calculateCost(photoSize);
        socket.assign({ photoSize, cost });
    },
    render: (context, meta) => {
        const { photoSize, photoSizeIndex, cost } = context;
        // pull apart dimensions
        const [width, _] = photoSize.split("x");
        return html `
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
    },
});
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

const serversLiveView = createLiveView({
    mount: (socket) => {
        const servers = listServers();
        const selectedServer = servers[0];
        socket.assign({
            servers,
            selectedServer,
        });
    },
    handleParams: (url, socket) => {
        const servers = listServers();
        const serverId = url.searchParams.get("id");
        const selectedServer = servers.find((server) => server.id === serverId) || servers[0];
        socket.pageTitle(selectedServer.name);
        socket.assign({
            servers,
            selectedServer,
        });
    },
    render: (context) => {
        const { servers, selectedServer } = context;
        return html `
      <h1>Servers</h1>
      <div id="servers">
        <div class="sidebar">
          <nav>
            ${servers.map((server) => {
            return live_patch(link_body(server, server.id === selectedServer.id), {
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
    },
});
function link_body(server, selected) {
    return html `<button style="margin-left: 12px; background-color: ${selected ? "blue" : "gray"}">
    🤖 ${server.name}
  </button>`;
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

const sortLiveView = createLiveView({
    mount: (socket) => {
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
    },
    handleParams: (url, socket) => {
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
    },
    handleEvent: (event, socket) => {
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
    },
    render: (context) => {
        const { options: { perPage, page, sortOrder, sortby }, donations, } = context;
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
                <th class="item" phx-click="change-sort" phx-value-sortby="id">
                  ${sort_emoji(sortby, "id", sortOrder)}Item
                </th>
                <th phx-click="change-sort" phx-value-sortby="quantity">
                  ${sort_emoji(sortby, "quantity", sortOrder)}Quantity
                </th>
                <th phx-click="change-sort" phx-value-sortby="days_until_expires">
                  ${sort_emoji(sortby, "days_until_expires", sortOrder)}Days Until Expires
                </th>
              </tr>
            </thead>
            <tbody>
              ${renderDonations(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? paginationLink("Previous", page - 1, perPage, sortby, sortOrder, "previous") : ""}
              ${pageLinks(page, perPage, sortby, sortOrder)}
              ${paginationLink("Next", page + 1, perPage, sortby, sortOrder, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
    },
});
function sort_emoji(sortby, sortby_value, sortOrder) {
    return sortby === sortby_value ? (sortOrder === "asc" ? "👇" : "☝️") : "";
}
function pageLinks(page, perPage, sortby, sortOrder) {
    let links = [];
    for (var p = page - 2; p <= page + 2; p++) {
        if (p > 0) {
            links.push(paginationLink(String(p), p, perPage, sortby, sortOrder, p === page ? "active" : ""));
        }
    }
    return join(links, "");
}
function paginationLink(text, pageNum, perPageNum, sortby, sortOrder, className) {
    const page = String(pageNum);
    const perPage = String(perPageNum);
    return live_patch(html `<button>${text}</button>`, {
        to: {
            path: "/sort",
            params: { page, perPage, sortby, sortOrder },
        },
        className,
    });
}
function renderDonations(donations) {
    return donations.map((donation) => html `
      <tr>
        <td class="item">
          <span class="id">${donation.id}</span>
          ${donation.emoji} ${donation.item}
        </td>
        <td>${donation.quantity} lbs</td>
        <td>
          <span> ${expiresDecoration(donation)} </span>
        </td>
      </tr>
    `);
}
function expiresDecoration(donation) {
    if (almostExpired(donation)) {
        return html `<mark>${donation.days_until_expires}</mark>`;
    }
    else {
        return donation.days_until_expires;
    }
}

/**
 * Simulates a UI to control the volume using buttons and keyboard input.
 */
const volumeLiveView = createLiveView({
    mount: (socket) => {
        socket.pageTitle("🎧 Volume Control");
        socket.assign({ volume: 10 });
    },
    handleEvent: async (event, socket) => {
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
    },
    render: (context) => {
        const { volume } = context;
        return html `
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
    },
});

const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/;
// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
const VolunteerSchema = z.object({
    id: z.string().default(nanoid),
    name: z.string().min(2).max(100),
    phone: z.string().regex(phoneRegex, "Should be a valid phone number"),
    checked_out: z.boolean().default(false),
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

const volunteerLiveView = createLiveView({
    mount: async (socket) => {
        if (socket.connected) {
            // listen for changes to volunteer data
            await socket.subscribe("volunteer");
        }
        socket.assign({
            volunteers: listVolunteers(),
            changeset: changeset({}, {}),
        });
        // reset volunteers to empty array after each render
        // in other words don't store this in memory
        socket.tempAssign({ volunteers: [] });
    },
    handleEvent: (event, socket) => {
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
    },
    // Handle Volunteer mutation
    handleInfo: (info, socket) => {
        const { volunteer } = info;
        socket.assign({
            volunteers: [volunteer],
            changeset: changeset({}, {}),
        });
    },
    render: (context, meta) => {
        const { changeset, volunteers } = context;
        const { csrfToken } = meta;
        return html `
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${form_for("#", csrfToken, {
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
          ${volunteers.map(renderVolunteer)}
        </div>
    </div>
    `;
    },
});
function renderVolunteer(volunteer) {
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

const routeDetails = [
    {
        label: "Counter",
        path: "/counter",
        summary: 'Standard "hello world" example.',
        tags: ["phx-click"],
    },
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
        gitPath: "/liveSearch",
        summary: "Search for businesses by zip code with live search results.",
        tags: ["phx-submit", "sendSelf"],
    },
    {
        label: "Autocomplete",
        path: "/autocomplete",
        gitPath: "/autoComplete",
        summary: "Autocomplete by city prefix with live search results and debouncing.",
        tags: ["phx-change", "phx-submit", "phx-debounce"],
    },
    {
        label: "Pagination",
        path: "/paginate",
        gitPath: "/pagination",
        summary: "Paginate a list of items with live navigation updating the list content and url params.",
        tags: ["phx-change", "push-patch"],
    },
    {
        label: "Sorting",
        path: "/sort",
        gitPath: "/sorting",
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
        label: "JS Commands",
        path: "/jscmds",
        summary: "Example of using JS commands to update the DOM",
        tags: ["js-cmds"],
    },
];

export { autocompleteLiveView, booksLiveView, counterLiveView, dashboardLiveView, decarbLiveView, helloNameLiveView, helloToggleEmojiLiveView, jsCmdsLiveView, liveNavLV, paginateLiveView, photosLiveView, printLiveView, routeDetails, rtCounterLiveView, searchLiveView, serversLiveView, sortLiveView, volumeLiveView, volunteerLiveView, xkcdLiveView };
