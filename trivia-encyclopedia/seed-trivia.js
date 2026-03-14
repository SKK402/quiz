// ============================================
// TRIVIA FACTS SEEDER — Migrate hardcoded facts to Supabase
// Run: node seed-trivia.js
// ============================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ntmbqgvlqongaetzpeyv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bWJxZ3ZscW9uZ2FldHpwZXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzgxODMsImV4cCI6MjA4ODAxNDE4M30.CLo5qNZ8FBMG_D1uzCWg3S4eHqmrhTHHGUgb9zyT1NY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// --- Import all fact sources ---
import { NEW_CATEGORIES } from './categories-data.js'
import { PHASE4_CATEGORIES } from './categories-phase4.js'
import { EXTRA_FACTS_1 } from './facts-expansion-1.js'
import { EXTRA_FACTS_2 } from './facts-expansion-2.js'
import { EXTRA_FACTS_3 } from './facts-expansion-3.js'
import { EXTRA_FACTS_4 } from './facts-expansion-4.js'
import { EXTRA_FACTS_5A } from './facts-expansion-5a.js'
import { EXTRA_FACTS_5B } from './facts-expansion-5b.js'

// --- Build the same CATEGORIES array as main.js ---
const CATEGORIES = [
    {
        id: 'sports',
        facts: [
            { title: "Usain Bolt's Untouchable 100m Record", body: "At the 2009 World Championships in Berlin, Usain Bolt set the 100m world record at 9.58 seconds. His peak speed during the race was approximately 44.72 km/h (27.8 mph), making him the fastest human ever recorded. Remarkably, scientists estimate he could have run even faster — he visibly slowed down near the finish line in his 2008 Olympic run.", year: '2009', tags: ['World Record', 'Athletics', 'Speed'], wowScore: 97, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Usain_Bolt' }, { name: 'World Athletics', url: 'https://worldathletics.org/records/all-time-toplists/sprints/100-metres/outdoor/men/senior' }] },
            { title: 'Michael Phelps: 23 Olympic Golds', body: "Michael Phelps holds 23 Olympic gold medals — more than most entire countries have ever won. His career total of 28 Olympic medals (including silvers and bronzes) makes him the most decorated Olympian of all time. He won 8 golds in a single Olympics in Beijing 2008, breaking Mark Spitz's 36-year-old record.", year: '2004–2016', tags: ['Olympics', 'Swimming', 'Legend'], wowScore: 96, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Michael_Phelps' }, { name: 'Olympics.com', url: 'https://olympics.com/en/athletes/michael-phelps' }] },
            { title: "Wayne Gretzky's Unbreakable Points Record", body: "Wayne Gretzky retired from the NHL with 2,857 career points — so far ahead that even if you removed all 894 of his goals, his 1,963 assists alone would still make him the all-time points leader. No active player today is within 1,000 points of his record.", year: '1979–1999', tags: ['NHL', 'Ice Hockey', 'All-Time'], wowScore: 99, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wayne_Gretzky' }, { name: 'NHL.com', url: 'https://www.nhl.com/player/wayne-gretzky-8447400' }] },
            { title: 'The Longest Tennis Match: 11 Hours 5 Minutes', body: "At Wimbledon 2010, John Isner defeated Nicolas Mahut in a match that lasted 11 hours and 5 minutes across three days. The final set alone went to 70–68, taking over 8 hours. The scoreboard broke twice during the match and had to be manually reset. It remains the longest professional tennis match in history.", year: '2010', tags: ['Tennis', 'Wimbledon', 'Endurance'], wowScore: 93, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Isner%E2%80%93Mahut_match_at_the_2010_Wimbledon_Championships' }, { name: 'BBC Sport', url: 'https://www.bbc.com/sport/tennis' }] },
            { title: 'Wilt Chamberlain Scored 100 Points in a Single Game', body: "On March 2, 1962, Wilt Chamberlain scored 100 points for the Philadelphia Warriors against the New York Knicks. No official TV footage exists of the game — the feat was witnessed by only 4,124 spectators. His season average that year was 50.4 points per game, a record that will almost certainly never be broken.", year: '1962', tags: ['NBA', 'Basketball', 'Legendary'], wowScore: 98, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wilt_Chamberlain%27s_100-point_game' }, { name: 'NBA.com', url: 'https://www.nba.com/history/top-moments/wilt-chamberlains-100-point-game' }] },
            { title: "Eliud Kipchoge's Sub-2-Hour Marathon", body: "In October 2019, Eliud Kipchoge became the first human to run a marathon in under two hours, clocking 1:59:40 in Vienna. While not an official world record due to the controlled conditions (rotating pace-makers, laser-guided car), it shattered what scientists once considered a physiological impossibility.", year: '2019', tags: ['Marathon', 'Athletics', 'Milestone'], wowScore: 95, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ineos_1:59_Challenge' }, { name: 'The Guardian', url: 'https://www.theguardian.com/sport/eliud-kipchoge' }] },
            { title: 'Simone Biles: Most World Championship Medals', body: "Simone Biles has 37 World Championship and Olympic medals combined, making her the most decorated gymnast in history. She has 5 moves named after her — skills so difficult no other gymnast has replicated them in competition. She can jump so high her head reaches over 2 meters above the balance beam.", year: '2013–present', tags: ['Gymnastics', 'Olympics', 'GOAT'], wowScore: 96, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Simone_Biles' }, { name: 'Olympics.com', url: 'https://olympics.com/en/athletes/simone-biles' }] },
            { title: "Don Bradman's Batting Average of 99.94", body: "Sir Donald Bradman's Test cricket batting average of 99.94 is considered the greatest statistical achievement in any major sport. The next best average among batsmen with comparable careers is around 61. He needed just 4 runs in his final innings to retire with an average of 100 — and was bowled for a duck.", year: '1928–1948', tags: ['Cricket', 'Statistics', 'All-Time'], wowScore: 99, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Donald_Bradman' }, { name: 'ESPNcricinfo', url: 'https://www.espncricinfo.com/player/don-bradman-4188' }] },
            { title: "Nadia Comăneci's Perfect 10", body: "At the 1976 Montreal Olympics, 14-year-old Nadia Comăneci scored the first-ever perfect 10 in Olympic gymnastics history. The scoreboard wasn't even designed to display 10.00, so it showed 1.00 instead. She went on to earn seven perfect scores at those Games alone.", year: '1976', tags: ['Olympics', 'Gymnastics', 'Historic'], wowScore: 94, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Nadia_Com%C4%83neci' }, { name: 'Olympics.com', url: 'https://olympics.com/en/athletes/nadia-comaneci' }] },
            { title: 'Leicester City: 5000-to-1 Premier League Win', body: "In 2015–16, Leicester City won the English Premier League title despite being given 5000-to-1 odds by bookmakers at the start of the season. They had barely avoided relegation the previous year. It is widely regarded as the greatest underdog story in the history of professional sports.", year: '2016', tags: ['Football', 'Underdog', 'Premier League'], wowScore: 97, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Leicester_City_F.C._in_the_2015%E2%80%9316_season' }, { name: 'BBC Sport', url: 'https://www.bbc.com/sport/football/35988673' }] },
        ],
    },
    {
        id: 'animals',
        facts: [
            { title: "An Octopus Has Three Hearts and Blue Blood", body: "Octopuses have three hearts: two pump blood to the gills, while the third pumps it to the rest of the body. Their blood is blue because it uses copper-based hemocyanin instead of iron-based hemoglobin for oxygen transport. One of the hearts stops beating when the octopus swims, which is why they prefer crawling.", year: null, tags: ['Marine Life', 'Biology', 'Weird'], wowScore: 92, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Octopus' }, { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/invertebrates/facts/octopus' }] },
            { title: "The Mantis Shrimp's Punch Can Boil Water", body: "The mantis shrimp can punch at speeds of 23 m/s (51 mph), accelerating faster than a .22 caliber bullet. The strike is so fast it creates cavitation bubbles — tiny vacuum pockets that collapse and produce temperatures near the surface of the sun (around 4,700°C). Even if the punch misses, the shockwave alone can stun or kill prey.", year: null, tags: ['Marine Life', 'Physics', 'Extreme'], wowScore: 98, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mantis_shrimp' }, { name: 'Smithsonian', url: 'https://ocean.si.edu/ocean-life/invertebrates/mantis-shrimp-packs-punch' }] },
            { title: "Turritopsis Dohrnii: The Immortal Jellyfish", body: "The Turritopsis dohrnii jellyfish can theoretically live forever. When stressed, sick, or aging, it can revert its cells back to their youngest form — essentially becoming a baby again. This process, called transdifferentiation, can be repeated indefinitely, making it the only known biologically immortal animal.", year: null, tags: ['Marine Life', 'Immortality', 'Biology'], wowScore: 99, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Turritopsis_dohrnii' }, { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/invertebrates/facts/immortal-jellyfish' }] },
            { title: "A Blue Whale's Heart Is the Size of a Golf Cart", body: "The blue whale is the largest animal to ever live on Earth — bigger than any dinosaur. Its heart weighs about 400 pounds (180 kg) and is roughly the size of a small golf cart. Its heartbeat can be detected from 2 miles away, and its aorta is large enough for a human toddler to crawl through.", year: null, tags: ['Marine Life', 'Size', 'Mammals'], wowScore: 95, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Blue_whale' }, { name: 'NOAA', url: 'https://www.fisheries.noaa.gov/species/blue-whale' }] },
            { title: "Crows Can Recognize Human Faces and Hold Grudges", body: "Studies show that crows can recognize individual human faces and remember them for years. If a person threatens them, crows will not only remember that face but will communicate the threat to other crows. Offspring who never encountered the threatening human will still mob that person based on information passed down through generations.", year: null, tags: ['Birds', 'Intelligence', 'Behavior'], wowScore: 94, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Corvidae#Intelligence' }, { name: 'Science Daily', url: 'https://www.sciencedaily.com/releases/2012/09/120910105823.htm' }] },
            { title: "Pistol Shrimp Create Sonic Booms Underwater", body: "The pistol shrimp snaps its claw so fast it creates a bubble jet that travels at 100 km/h, generating a sound of 218 decibels — louder than a gunshot. The collapsing bubble produces a flash of light and temperatures of 4,700°C for a fraction of a second. Colonies of snapping shrimp are so loud they can interfere with submarine sonar.", year: null, tags: ['Marine Life', 'Physics', 'Sound'], wowScore: 97, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Alpheidae' }, { name: 'Smithsonian', url: 'https://ocean.si.edu/ocean-life/invertebrates/pistol-shrimp' }] },
            { title: "Tardigrades Can Survive in Space", body: "Tardigrades (water bears) can survive the vacuum of outer space, radiation 1,000 times the lethal human dose, temperatures from -272°C to 150°C, and pressures 6 times greater than the deepest ocean trench. In 2007, they became the first animals to survive direct exposure to outer space on the FOTON-M3 mission.", year: '2007', tags: ['Extremophile', 'Space', 'Survival'], wowScore: 99, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Tardigrade' }, { name: 'NASA', url: 'https://www.nasa.gov/' }] },
            { title: "Dolphins Sleep with One Eye Open", body: "Dolphins practice unihemispheric sleep — they shut down one half of their brain at a time while keeping the other half alert. This allows them to continue surfacing to breathe and watch for predators. They literally sleep with one eye open, as each eye is connected to the opposite brain hemisphere.", year: null, tags: ['Marine Life', 'Sleep', 'Neuroscience'], wowScore: 91, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Unihemispheric_slow-wave_sleep' }, { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/mammals/facts/common-bottlenose-dolphin' }] },
            { title: "A Flea Can Jump 150 Times Its Body Length", body: "Fleas can jump up to 150 times their own body length — the equivalent of a human jumping over a 75-story building. They achieve this using a spring-like protein called resilin that stores energy in their legs. They can accelerate 50 times faster than a space shuttle launch.", year: null, tags: ['Insects', 'Physics', 'Extreme'], wowScore: 90, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Flea' }, { name: 'BBC Earth', url: 'https://www.bbcearth.com/news/how-do-fleas-jump-so-high' }] },
            { title: "Elephants Are the Only Animals That Can't Jump", body: "Adult elephants are the only mammals that physically cannot jump, even a little. However, they compensate with remarkable intelligence — they can recognize themselves in mirrors, mourn their dead, display empathy, and have memories that span decades. They've even been observed performing apparent burial rituals for fallen members.", year: null, tags: ['Mammals', 'Intelligence', 'Anatomy'], wowScore: 88, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Elephant_cognition' }, { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/mammals/facts/african-elephant' }] },
        ],
    },
    {
        id: 'space',
        facts: [
            { title: "A Day on Venus Is Longer Than Its Year", body: "Venus rotates so slowly on its axis that one Venusian day (243 Earth days) is actually longer than one Venusian year (225 Earth days). To make things even stranger, Venus rotates backward compared to most planets — the Sun rises in the west and sets in the east.", year: null, tags: ['Planets', 'Solar System', 'Time'], wowScore: 93, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Venus' }, { name: 'NASA', url: 'https://science.nasa.gov/venus/' }] },
            { title: "A Teaspoon of Neutron Star Weighs 6 Billion Tons", body: "Neutron stars are so incredibly dense that a single teaspoon of their material would weigh about 6 billion tons — roughly the weight of Mount Everest. They form when massive stars collapse, compressing matter so tightly that protons and electrons merge into neutrons. Some neutron stars spin at 716 rotations per second.", year: null, tags: ['Stars', 'Density', 'Physics'], wowScore: 98, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Neutron_star' }, { name: 'NASA', url: 'https://science.nasa.gov/universe/neutron-stars/' }] },
            { title: "There Are More Stars Than Grains of Sand on Earth", body: "Astronomers estimate there are roughly 2 × 10²³ stars in the observable universe — that's 200 sextillion stars. Earth has approximately 7.5 × 10¹⁸ grains of sand on all its beaches combined. That means there are roughly 30,000 stars for every grain of sand on every beach on Earth.", year: null, tags: ['Scale', 'Stars', 'Mind-Bending'], wowScore: 97, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Observable_universe' }, { name: 'ESA', url: 'https://www.esa.int/' }] },
            { title: "The Largest Known Structure Is 10 Billion Light-Years Across", body: "The Hercules–Corona Borealis Great Wall is the largest known structure in the observable universe, spanning approximately 10 billion light-years. It's a massive filament of galaxies discovered in 2013 through gamma-ray burst data.", year: '2013', tags: ['Galaxies', 'Scale', 'Discovery'], wowScore: 96, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hercules%E2%80%93Corona_Borealis_Great_Wall' }, { name: 'NASA', url: 'https://science.nasa.gov/' }] },
            { title: "Space Is Completely Silent", body: "Sound needs a medium (like air or water) to travel through. Since space is a near-perfect vacuum, no sound can propagate through it. Astronauts communicate via radio waves, which are electromagnetic and don't need a medium.", year: null, tags: ['Physics', 'Sound', 'Vacuum'], wowScore: 85, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Outer_space#Environment' }, { name: 'NASA', url: 'https://science.nasa.gov/' }] },
            { title: "Olympus Mons on Mars Is 3x Taller Than Everest", body: "Olympus Mons, a shield volcano on Mars, is the tallest known mountain in the solar system. At 21.9 km (72,000 ft) high, it's nearly three times the height of Mount Everest. Its base is so wide (624 km across) that if you stood at its edge, the curvature of Mars would hide the summit from view.", year: null, tags: ['Mars', 'Volcano', 'Solar System'], wowScore: 94, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Olympus_Mons' }, { name: 'NASA', url: 'https://mars.nasa.gov/' }] },
            { title: "There Are Rogue Planets Drifting Through Space Alone", body: "Not all planets orbit stars. Scientists estimate there could be billions of 'rogue planets' wandering through the Milky Way alone, untethered to any star system.", year: null, tags: ['Planets', 'Interstellar', 'Mystery'], wowScore: 93, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rogue_planet' }, { name: 'NASA', url: 'https://exoplanets.nasa.gov/' }] },
            { title: "Time Moves Slower Near a Black Hole", body: "According to Einstein's theory of general relativity, gravity warps both space and time. Near a black hole's event horizon, time slows down dramatically relative to a distant observer.", year: null, tags: ['Black Holes', 'Relativity', 'Time'], wowScore: 99, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Gravitational_time_dilation' }, { name: 'NASA', url: 'https://science.nasa.gov/astrophysics/focus-areas/black-holes/' }] },
            { title: "The Voyager 1 Probe Is 15 Billion Miles From Earth", body: "Launched in 1977, Voyager 1 is the most distant human-made object ever. It entered interstellar space in 2012 and is now over 15 billion miles (24 billion km) from Earth.", year: '1977–present', tags: ['Probe', 'Interstellar', 'NASA'], wowScore: 96, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Voyager_1' }, { name: 'NASA JPL', url: 'https://voyager.jpl.nasa.gov/' }] },
            { title: "The Observable Universe Is 93 Billion Light-Years Wide", body: "Even though the universe is approximately 13.8 billion years old, the observable universe is about 93 billion light-years in diameter. This seeming paradox is because space itself has been expanding since the Big Bang.", year: null, tags: ['Cosmology', 'Scale', 'Big Bang'], wowScore: 95, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Observable_universe' }, { name: 'ESA', url: 'https://www.esa.int/' }] },
        ],
    },
    {
        id: 'technology',
        facts: [
            { title: 'The First Computer Bug Was an Actual Bug', body: "In 1947, engineers working on the Harvard Mark II computer found a moth stuck in a relay, causing a malfunction. Grace Hopper's team taped the moth into their logbook with the note 'First actual case of bug being found.'", year: '1947', tags: ['History', 'Computing', 'Fun Fact'], wowScore: 88, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Software_bug#History' }, { name: 'Smithsonian', url: 'https://americanhistory.si.edu/collections/search/object/nmah_334663' }] },
            { title: 'The Entire Internet Weighs About as Much as a Strawberry', body: "All the electrons in motion that make up the internet's data weigh roughly 50 grams — about the weight of a single strawberry.", year: null, tags: ['Internet', 'Physics', 'Mind-Bending'], wowScore: 95, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Internet' }, { name: 'Discover Mag', url: 'https://www.discovermagazine.com/' }] },
            { title: "QWERTY Keyboards Were Designed to Slow You Down", body: "The QWERTY keyboard layout, patented in 1878 by Christopher Sholes, was designed to prevent jamming in mechanical typewriters by separating commonly used letter pairs.", year: '1878', tags: ['History', 'Design', 'UX'], wowScore: 87, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/QWERTY' }, { name: 'Smithsonian', url: 'https://www.smithsonianmag.com/' }] },
            { title: "GPS Satellites Must Account for Einstein's Relativity", body: "GPS satellites orbit at such speed and altitude that both special and general relativity noticeably affect their onboard clocks. Without relativistic corrections, GPS would accumulate an error of about 10 km per day.", year: null, tags: ['GPS', 'Relativity', 'Physics'], wowScore: 96, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Error_analysis_for_the_Global_Positioning_System#Relativity' }, { name: 'Physics Central', url: 'https://www.aps.org/' }] },
            { title: "More People Have Cell Phones Than Toilets", body: "As of 2023, roughly 6.9 billion people worldwide have access to mobile phones, while only about 4.5 billion have access to proper sanitation facilities.", year: '2023', tags: ['Mobile', 'Society', 'Statistics'], wowScore: 89, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/List_of_countries_by_number_of_mobile_phones_in_use' }, { name: 'UN Water', url: 'https://www.unwater.org/' }] },
            { title: 'A Single Google Search Uses More Computing Power Than Apollo 11', body: "The Apollo 11 guidance computer had about 74 KB of memory and operated at 0.043 MHz. A single modern Google search query uses roughly 1,000 computers in 0.2 seconds.", year: null, tags: ['Computing', 'Comparison', 'NASA'], wowScore: 94, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Apollo_Guidance_Computer' }, { name: 'Google Blog', url: 'https://blog.google/' }] },
            { title: "The First 1GB Hard Drive Weighed 550 Pounds", body: "IBM's first gigabyte-capacity hard drive, the 3380 (1980), weighed approximately 550 pounds (250 kg), was the size of a refrigerator, and cost $40,000.", year: '1980', tags: ['Storage', 'History', 'Progress'], wowScore: 92, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/History_of_hard_disk_drives' }, { name: 'IBM', url: 'https://www.ibm.com/history' }] },
            { title: "Bitcoin Consumes More Electricity Than Many Countries", body: "The Bitcoin network's annual energy consumption has exceeded 120 TWh at peak — comparable to the entire nation of Norway.", year: null, tags: ['Crypto', 'Energy', 'Environment'], wowScore: 91, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bitcoin#Energy_consumption_and_sustainability' }, { name: 'Cambridge', url: 'https://ccaf.io/cbnsi/cbeci' }] },
            { title: "The First Website Is Still Online", body: "Tim Berners-Lee published the world's first website on August 6, 1991, at CERN. It explained the World Wide Web project and how to create web pages. The page is still accessible at info.cern.ch.", year: '1991', tags: ['Web', 'History', 'CERN'], wowScore: 93, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/History_of_the_World_Wide_Web' }, { name: 'CERN', url: 'https://info.cern.ch/' }] },
            { title: "Quantum Computers Can Exist in Multiple States Simultaneously", body: "While classical computers use bits (0 or 1), quantum computers use qubits that can exist in a superposition of both states simultaneously. Google's 67-qubit Sycamore processor completed a calculation in 200 seconds that would take 10,000 years on a classical supercomputer.", year: '2019', tags: ['Quantum', 'Computing', 'Future'], wowScore: 97, sources: [{ name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Quantum_supremacy' }, { name: 'Google AI', url: 'https://ai.google/discover/quantum/' }] },
        ],
    },
    // Spread NEW_CATEGORIES and PHASE4_CATEGORIES
    ...NEW_CATEGORIES,
    ...PHASE4_CATEGORIES,
]

    // Merge expansion facts
    ;[EXTRA_FACTS_1, EXTRA_FACTS_2, EXTRA_FACTS_3, EXTRA_FACTS_4, EXTRA_FACTS_5A, EXTRA_FACTS_5B].forEach(pack => {
        Object.entries(pack).forEach(([catId, facts]) => {
            const cat = CATEGORIES.find(c => c.id === catId)
            if (cat) cat.facts.push(...facts)
        })
    })

// --- Seed to Supabase ---
async function seedTrivia() {
    console.log('🚀 Starting trivia seeding...\n')

    let totalInserted = 0
    let totalErrors = 0

    for (const cat of CATEGORIES) {
        // Take exactly 30 facts per category (or all if fewer)
        const factsToSeed = cat.facts.slice(0, 30)
        console.log(`📁 ${cat.id}: ${factsToSeed.length} facts`)

        // Upsert in batches of 10
        for (let i = 0; i < factsToSeed.length; i += 10) {
            const batch = factsToSeed.slice(i, i + 10).map(fact => ({
                category_id: cat.id,
                title: fact.title,
                body: fact.body,
                year: fact.year || null,
                tags: fact.tags || [],
                wow_score: fact.wowScore || 90,
                sources: JSON.stringify(fact.sources || []),
                updated_at: new Date().toISOString(),
            }))

            const { data, error } = await supabase
                .from('trivia_facts')
                .upsert(batch, { onConflict: 'category_id,title' })

            if (error) {
                console.error(`  ❌ Error batch ${i / 10 + 1}: ${error.message}`)
                totalErrors += batch.length
            } else {
                totalInserted += batch.length
            }
        }
    }

    console.log(`\n✅ Done! ${totalInserted} facts seeded, ${totalErrors} errors.`)
    console.log(`📊 Categories: ${CATEGORIES.length}`)
    console.log(`📊 Expected total: ${CATEGORIES.length * 30}`)

    // Verify counts
    const { count } = await supabase
        .from('trivia_facts')
        .select('*', { count: 'exact', head: true })
    console.log(`📊 Actual in Supabase: ${count}`)
}

seedTrivia().catch(console.error)
