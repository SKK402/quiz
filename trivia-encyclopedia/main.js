// ============================================
// TRIVIA ENCYCLOPEDIA — Main Application Logic
// ============================================

import { initWebGL } from './webgl-bg.js'
import { NEW_CATEGORIES } from './categories-data.js'
import { PHASE4_CATEGORIES } from './categories-phase4.js'
import { initQuiz } from './quiz.js'
import { EXTRA_FACTS_1 } from './facts-expansion-1.js'
import { EXTRA_FACTS_2 } from './facts-expansion-2.js'
import { EXTRA_FACTS_3 } from './facts-expansion-3.js'
import { EXTRA_FACTS_4 } from './facts-expansion-4.js'
import { EXTRA_FACTS_5A } from './facts-expansion-5a.js'
import { EXTRA_FACTS_5B } from './facts-expansion-5b.js'
import { supabase } from './supabase.js'
import { initAuth, getCurrentUser, onAuthChange, signInWithGoogle, showAuthToast } from './auth.js'
import { fetchLiveFacts, getCachedLiveFacts, cacheLiveFacts } from './live-facts-agent.js'
import { runVerificationAgent } from './verification-agent.js'
import { runCuriosityAgent } from './curiosity-agent.js'

// --- TRIVIA DATA (with sources) ---
const CATEGORIES = [
  {
    id: 'sports',
    title: 'Sports Records',
    icon: '🏆',
    image: '/images/sports.png',
    subtitle: 'The greatest athletic achievements ever documented',
    description: 'From impossible speed records to legendary endurance feats — these are the moments that redefined what the human body can achieve.',
    facts: [
      {
        title: "Usain Bolt's Untouchable 100m Record",
        body: "At the 2009 World Championships in Berlin, Usain Bolt set the 100m world record at 9.58 seconds. His peak speed during the race was approximately 44.72 km/h (27.8 mph), making him the fastest human ever recorded. Remarkably, scientists estimate he could have run even faster — he visibly slowed down near the finish line in his 2008 Olympic run.",
        year: '2009',
        tags: ['World Record', 'Athletics', 'Speed'],
        wowScore: 97,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Usain_Bolt' },
          { name: 'World Athletics', url: 'https://worldathletics.org/records/all-time-toplists/sprints/100-metres/outdoor/men/senior' },
        ],
      },
      {
        title: 'Michael Phelps: 23 Olympic Golds',
        body: "Michael Phelps holds 23 Olympic gold medals — more than most entire countries have ever won. His career total of 28 Olympic medals (including silvers and bronzes) makes him the most decorated Olympian of all time. He won 8 golds in a single Olympics in Beijing 2008, breaking Mark Spitz's 36-year-old record.",
        year: '2004–2016',
        tags: ['Olympics', 'Swimming', 'Legend'],
        wowScore: 96,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Michael_Phelps' },
          { name: 'Olympics.com', url: 'https://olympics.com/en/athletes/michael-phelps' },
        ],
      },
      {
        title: "Wayne Gretzky's Unbreakable Points Record",
        body: "Wayne Gretzky retired from the NHL with 2,857 career points — so far ahead that even if you removed all 894 of his goals, his 1,963 assists alone would still make him the all-time points leader. No active player today is within 1,000 points of his record.",
        year: '1979–1999',
        tags: ['NHL', 'Ice Hockey', 'All-Time'],
        wowScore: 99,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wayne_Gretzky' },
          { name: 'NHL.com', url: 'https://www.nhl.com/player/wayne-gretzky-8447400' },
        ],
      },
      {
        title: 'The Longest Tennis Match: 11 Hours 5 Minutes',
        body: "At Wimbledon 2010, John Isner defeated Nicolas Mahut in a match that lasted 11 hours and 5 minutes across three days. The final set alone went to 70–68, taking over 8 hours. The scoreboard broke twice during the match and had to be manually reset. It remains the longest professional tennis match in history.",
        year: '2010',
        tags: ['Tennis', 'Wimbledon', 'Endurance'],
        wowScore: 93,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Isner%E2%80%93Mahut_match_at_the_2010_Wimbledon_Championships' },
          { name: 'BBC Sport', url: 'https://www.bbc.com/sport/tennis' },
        ],
      },
      {
        title: 'Wilt Chamberlain Scored 100 Points in a Single Game',
        body: "On March 2, 1962, Wilt Chamberlain scored 100 points for the Philadelphia Warriors against the New York Knicks. No official TV footage exists of the game — the feat was witnessed by only 4,124 spectators. His season average that year was 50.4 points per game, a record that will almost certainly never be broken.",
        year: '1962',
        tags: ['NBA', 'Basketball', 'Legendary'],
        wowScore: 98,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wilt_Chamberlain%27s_100-point_game' },
          { name: 'NBA.com', url: 'https://www.nba.com/history/top-moments/wilt-chamberlains-100-point-game' },
        ],
      },
      {
        title: "Eliud Kipchoge's Sub-2-Hour Marathon",
        body: "In October 2019, Eliud Kipchoge became the first human to run a marathon in under two hours, clocking 1:59:40 in Vienna. While not an official world record due to the controlled conditions (rotating pace-makers, laser-guided car), it shattered what scientists once considered a physiological impossibility.",
        year: '2019',
        tags: ['Marathon', 'Athletics', 'Milestone'],
        wowScore: 95,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ineos_1:59_Challenge' },
          { name: 'The Guardian', url: 'https://www.theguardian.com/sport/eliud-kipchoge' },
        ],
      },
      {
        title: 'Simone Biles: Most World Championship Medals',
        body: "Simone Biles has 37 World Championship and Olympic medals combined, making her the most decorated gymnast in history. She has 5 moves named after her — skills so difficult no other gymnast has replicated them in competition. She can jump so high her head reaches over 2 meters above the balance beam.",
        year: '2013–present',
        tags: ['Gymnastics', 'Olympics', 'GOAT'],
        wowScore: 96,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Simone_Biles' },
          { name: 'Olympics.com', url: 'https://olympics.com/en/athletes/simone-biles' },
        ],
      },
      {
        title: "Don Bradman's Batting Average of 99.94",
        body: "Sir Donald Bradman's Test cricket batting average of 99.94 is considered the greatest statistical achievement in any major sport. The next best average among batsmen with comparable careers is around 61. He needed just 4 runs in his final innings to retire with an average of 100 — and was bowled for a duck.",
        year: '1928–1948',
        tags: ['Cricket', 'Statistics', 'All-Time'],
        wowScore: 99,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Donald_Bradman' },
          { name: 'ESPNcricinfo', url: 'https://www.espncricinfo.com/player/don-bradman-4188' },
        ],
      },
      {
        title: "Nadia Comăneci's Perfect 10",
        body: "At the 1976 Montreal Olympics, 14-year-old Nadia Comăneci scored the first-ever perfect 10 in Olympic gymnastics history. The scoreboard wasn't even designed to display 10.00, so it showed 1.00 instead. She went on to earn seven perfect scores at those Games alone.",
        year: '1976',
        tags: ['Olympics', 'Gymnastics', 'Historic'],
        wowScore: 94,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Nadia_Com%C4%83neci' },
          { name: 'Olympics.com', url: 'https://olympics.com/en/athletes/nadia-comaneci' },
        ],
      },
      {
        title: 'Leicester City: 5000-to-1 Premier League Win',
        body: "In 2015–16, Leicester City won the English Premier League title despite being given 5000-to-1 odds by bookmakers at the start of the season. They had barely avoided relegation the previous year. It is widely regarded as the greatest underdog story in the history of professional sports.",
        year: '2016',
        tags: ['Football', 'Underdog', 'Premier League'],
        wowScore: 97,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Leicester_City_F.C._in_the_2015%E2%80%9316_season' },
          { name: 'BBC Sport', url: 'https://www.bbc.com/sport/football/35988673' },
        ],
      },
    ],
  },
  {
    id: 'animals',
    title: 'Animal Facts',
    icon: '🦎',
    image: '/images/animals.png',
    subtitle: 'The astonishing biology of the natural world',
    description: 'Nature is stranger than fiction. From immortal jellyfish to mantis shrimp that punch with the force of bullets — these creatures defy imagination.',
    facts: [
      {
        title: "An Octopus Has Three Hearts and Blue Blood",
        body: "Octopuses have three hearts: two pump blood to the gills, while the third pumps it to the rest of the body. Their blood is blue because it uses copper-based hemocyanin instead of iron-based hemoglobin for oxygen transport. One of the hearts stops beating when the octopus swims, which is why they prefer crawling.",
        year: null,
        tags: ['Marine Life', 'Biology', 'Weird'],
        wowScore: 92,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Octopus' },
          { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/invertebrates/facts/octopus' },
        ],
      },
      {
        title: "The Mantis Shrimp's Punch Can Boil Water",
        body: "The mantis shrimp can punch at speeds of 23 m/s (51 mph), accelerating faster than a .22 caliber bullet. The strike is so fast it creates cavitation bubbles — tiny vacuum pockets that collapse and produce temperatures near the surface of the sun (around 4,700°C). Even if the punch misses, the shockwave alone can stun or kill prey.",
        year: null,
        tags: ['Marine Life', 'Physics', 'Extreme'],
        wowScore: 98,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mantis_shrimp' },
          { name: 'Smithsonian', url: 'https://ocean.si.edu/ocean-life/invertebrates/mantis-shrimp-packs-punch' },
        ],
      },
      {
        title: "Turritopsis Dohrnii: The Immortal Jellyfish",
        body: "The Turritopsis dohrnii jellyfish can theoretically live forever. When stressed, sick, or aging, it can revert its cells back to their youngest form — essentially becoming a baby again. This process, called transdifferentiation, can be repeated indefinitely, making it the only known biologically immortal animal.",
        year: null,
        tags: ['Marine Life', 'Immortality', 'Biology'],
        wowScore: 99,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Turritopsis_dohrnii' },
          { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/invertebrates/facts/immortal-jellyfish' },
        ],
      },
      {
        title: "A Blue Whale's Heart Is the Size of a Golf Cart",
        body: "The blue whale is the largest animal to ever live on Earth — bigger than any dinosaur. Its heart weighs about 400 pounds (180 kg) and is roughly the size of a small golf cart. Its heartbeat can be detected from 2 miles away, and its aorta is large enough for a human toddler to crawl through.",
        year: null,
        tags: ['Marine Life', 'Size', 'Mammals'],
        wowScore: 95,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Blue_whale' },
          { name: 'NOAA', url: 'https://www.fisheries.noaa.gov/species/blue-whale' },
        ],
      },
      {
        title: "Crows Can Recognize Human Faces and Hold Grudges",
        body: "Studies show that crows can recognize individual human faces and remember them for years. If a person threatens them, crows will not only remember that face but will communicate the threat to other crows. Offspring who never encountered the threatening human will still mob that person based on information passed down through generations.",
        year: null,
        tags: ['Birds', 'Intelligence', 'Behavior'],
        wowScore: 94,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Corvidae#Intelligence' },
          { name: 'Science Daily', url: 'https://www.sciencedaily.com/releases/2012/09/120910105823.htm' },
        ],
      },
      {
        title: "Pistol Shrimp Create Sonic Booms Underwater",
        body: "The pistol shrimp snaps its claw so fast it creates a bubble jet that travels at 100 km/h, generating a sound of 218 decibels — louder than a gunshot. The collapsing bubble produces a flash of light and temperatures of 4,700°C for a fraction of a second. Colonies of snapping shrimp are so loud they can interfere with submarine sonar.",
        year: null,
        tags: ['Marine Life', 'Physics', 'Sound'],
        wowScore: 97,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Alpheidae' },
          { name: 'Smithsonian', url: 'https://ocean.si.edu/ocean-life/invertebrates/pistol-shrimp' },
        ],
      },
      {
        title: "Tardigrades Can Survive in Space",
        body: "Tardigrades (water bears) can survive the vacuum of outer space, radiation 1,000 times the lethal human dose, temperatures from -272°C to 150°C, and pressures 6 times greater than the deepest ocean trench. In 2007, they became the first animals to survive direct exposure to outer space on the FOTON-M3 mission.",
        year: '2007',
        tags: ['Extremophile', 'Space', 'Survival'],
        wowScore: 99,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Tardigrade' },
          { name: 'NASA', url: 'https://www.nasa.gov/solar-system/nasas-lunar-crasher-may-have-utilitarian-utilitarian/' },
        ],
      },
      {
        title: "Dolphins Sleep with One Eye Open",
        body: "Dolphins practice unihemispheric sleep — they shut down one half of their brain at a time while keeping the other half alert. This allows them to continue surfacing to breathe and watch for predators. They literally sleep with one eye open, as each eye is connected to the opposite brain hemisphere.",
        year: null,
        tags: ['Marine Life', 'Sleep', 'Neuroscience'],
        wowScore: 91,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Unihemispheric_slow-wave_sleep' },
          { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/mammals/facts/common-bottlenose-dolphin' },
        ],
      },
      {
        title: "A Flea Can Jump 150 Times Its Body Length",
        body: "Fleas can jump up to 150 times their own body length — the equivalent of a human jumping over a 75-story building. They achieve this using a spring-like protein called resilin that stores energy in their legs. They can accelerate 50 times faster than a space shuttle launch.",
        year: null,
        tags: ['Insects', 'Physics', 'Extreme'],
        wowScore: 90,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Flea' },
          { name: 'BBC Earth', url: 'https://www.bbcearth.com/news/how-do-fleas-jump-so-high' },
        ],
      },
      {
        title: "Elephants Are the Only Animals That Can't Jump",
        body: "Adult elephants are the only mammals that physically cannot jump, even a little. However, they compensate with remarkable intelligence — they can recognize themselves in mirrors, mourn their dead, display empathy, and have memories that span decades. They've even been observed performing apparent burial rituals for fallen members.",
        year: null,
        tags: ['Mammals', 'Intelligence', 'Anatomy'],
        wowScore: 88,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Elephant_cognition' },
          { name: 'Nat Geo', url: 'https://www.nationalgeographic.com/animals/mammals/facts/african-elephant' },
        ],
      },
    ],
  },
  {
    id: 'space',
    title: 'Space & Universe',
    icon: '🚀',
    image: '/images/space.png',
    subtitle: 'Mind-bending mysteries from beyond our atmosphere',
    description: 'The cosmos is full of phenomena so bizarre they sound like science fiction — neutron star densities, rogue planets, and time-warping black holes.',
    facts: [
      {
        title: "A Day on Venus Is Longer Than Its Year",
        body: "Venus rotates so slowly on its axis that one Venusian day (243 Earth days) is actually longer than one Venusian year (225 Earth days). To make things even stranger, Venus rotates backward compared to most planets — the Sun rises in the west and sets in the east.",
        year: null,
        tags: ['Planets', 'Solar System', 'Time'],
        wowScore: 93,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Venus' },
          { name: 'NASA', url: 'https://science.nasa.gov/venus/' },
        ],
      },
      {
        title: "A Teaspoon of Neutron Star Weighs 6 Billion Tons",
        body: "Neutron stars are so incredibly dense that a single teaspoon of their material would weigh about 6 billion tons — roughly the weight of Mount Everest. They form when massive stars collapse, compressing matter so tightly that protons and electrons merge into neutrons. Some neutron stars spin at 716 rotations per second.",
        year: null,
        tags: ['Stars', 'Density', 'Physics'],
        wowScore: 98,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Neutron_star' },
          { name: 'NASA', url: 'https://science.nasa.gov/universe/neutron-stars/' },
        ],
      },
      {
        title: "There Are More Stars Than Grains of Sand on Earth",
        body: "Astronomers estimate there are roughly 2 × 10²³ stars in the observable universe — that's 200 sextillion stars. Earth has approximately 7.5 × 10¹⁸ grains of sand on all its beaches combined. That means there are roughly 30,000 stars for every grain of sand on every beach on Earth.",
        year: null,
        tags: ['Scale', 'Stars', 'Mind-Bending'],
        wowScore: 97,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Observable_universe' },
          { name: 'ESA', url: 'https://www.esa.int/Science_Exploration/Space_Science/Herschel/How_many_stars_are_there_in_the_Universe' },
        ],
      },
      {
        title: "The Largest Known Structure Is 10 Billion Light-Years Across",
        body: "The Hercules–Corona Borealis Great Wall is the largest known structure in the observable universe, spanning approximately 10 billion light-years. It's a massive filament of galaxies discovered in 2013 through gamma-ray burst data. Light from one end would take 10 billion years to reach the other — nearly the age of the universe itself.",
        year: '2013',
        tags: ['Galaxies', 'Scale', 'Discovery'],
        wowScore: 96,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hercules%E2%80%93Corona_Borealis_Great_Wall' },
          { name: 'NASA', url: 'https://science.nasa.gov/' },
        ],
      },
      {
        title: "Space Is Completely Silent",
        body: "Sound needs a medium (like air or water) to travel through. Since space is a near-perfect vacuum, no sound can propagate through it. Astronauts communicate via radio waves, which are electromagnetic and don't need a medium. Even a massive explosion in space would be completely silent to a nearby observer.",
        year: null,
        tags: ['Physics', 'Sound', 'Vacuum'],
        wowScore: 85,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Outer_space#Environment' },
          { name: 'NASA', url: 'https://science.nasa.gov/' },
        ],
      },
      {
        title: "Olympus Mons on Mars Is 3x Taller Than Everest",
        body: "Olympus Mons, a shield volcano on Mars, is the tallest known mountain in the solar system. At 21.9 km (72,000 ft) high, it's nearly three times the height of Mount Everest. Its base is so wide (624 km across) that if you stood at its edge, the curvature of Mars would hide the summit from view.",
        year: null,
        tags: ['Mars', 'Volcano', 'Solar System'],
        wowScore: 94,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Olympus_Mons' },
          { name: 'NASA', url: 'https://mars.nasa.gov/' },
        ],
      },
      {
        title: "There Are Rogue Planets Drifting Through Space Alone",
        body: "Not all planets orbit stars. Scientists estimate there could be billions of 'rogue planets' wandering through the Milky Way alone, untethered to any star system. Ejected from their original orbits through gravitational interactions, they drift through the darkness of interstellar space at tens of thousands of miles per hour.",
        year: null,
        tags: ['Planets', 'Interstellar', 'Mystery'],
        wowScore: 93,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rogue_planet' },
          { name: 'NASA', url: 'https://exoplanets.nasa.gov/' },
        ],
      },
      {
        title: "Time Moves Slower Near a Black Hole",
        body: "According to Einstein's theory of general relativity, gravity warps both space and time. Near a black hole's event horizon, time slows down dramatically relative to a distant observer. If you could somehow survive near a black hole and return to Earth, you'd find that centuries or millennia had passed while you experienced only minutes.",
        year: null,
        tags: ['Black Holes', 'Relativity', 'Time'],
        wowScore: 99,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Gravitational_time_dilation' },
          { name: 'NASA', url: 'https://science.nasa.gov/astrophysics/focus-areas/black-holes/' },
        ],
      },
      {
        title: "The Voyager 1 Probe Is 15 Billion Miles From Earth",
        body: "Launched in 1977, Voyager 1 is the most distant human-made object ever. It entered interstellar space in 2012 and is now over 15 billion miles (24 billion km) from Earth. Despite traveling at 38,000 mph, signals from it take over 22 hours to reach Earth. It carries a Golden Record with sounds and images of Earth for any potential alien finders.",
        year: '1977–present',
        tags: ['Probe', 'Interstellar', 'NASA'],
        wowScore: 96,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Voyager_1' },
          { name: 'NASA JPL', url: 'https://voyager.jpl.nasa.gov/' },
        ],
      },
      {
        title: "The Observable Universe Is 93 Billion Light-Years Wide",
        body: "Even though the universe is approximately 13.8 billion years old, the observable universe is about 93 billion light-years in diameter. This seeming paradox is because space itself has been expanding since the Big Bang. The light we see from the most distant objects started its journey when those objects were much closer — they've since been carried away by cosmic expansion.",
        year: null,
        tags: ['Cosmology', 'Scale', 'Big Bang'],
        wowScore: 95,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Observable_universe' },
          { name: 'ESA', url: 'https://www.esa.int/' },
        ],
      },
    ],
  },
  {
    id: 'technology',
    title: 'Technology Facts',
    icon: '⚡',
    image: '/images/technology.png',
    subtitle: 'The inventions and innovations shaping our world',
    description: 'From the first computer bug to quantum computing — technology advances at an exponential pace, and these facts capture its most remarkable moments.',
    facts: [
      {
        title: 'The First Computer Bug Was an Actual Bug',
        body: "In 1947, engineers working on the Harvard Mark II computer found a moth stuck in a relay, causing a malfunction. Grace Hopper's team taped the moth into their logbook with the note 'First actual case of bug being found.' While the term 'bug' was already used informally for glitches, this incident popularized it in computing.",
        year: '1947',
        tags: ['History', 'Computing', 'Fun Fact'],
        wowScore: 88,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Software_bug#History' },
          { name: 'Smithsonian', url: 'https://americanhistory.si.edu/collections/search/object/nmah_334663' },
        ],
      },
      {
        title: 'The Entire Internet Weighs About as Much as a Strawberry',
        body: "All the electrons in motion that make up the internet's data weigh roughly 50 grams — about the weight of a single strawberry. This calculation is based on the estimated number of electrons needed to store and transmit all the data on the internet at any given moment, using Einstein's E=mc² equation.",
        year: null,
        tags: ['Internet', 'Physics', 'Mind-Bending'],
        wowScore: 95,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Internet' },
          { name: 'Discover Mag', url: 'https://www.discovermagazine.com/technology/the-weight-of-the-internet' },
        ],
      },
      {
        title: "QWERTY Keyboards Were Designed to Slow You Down",
        body: "The QWERTY keyboard layout, patented in 1878 by Christopher Sholes, was designed to prevent jamming in mechanical typewriters by separating commonly used letter pairs. Despite being intentionally suboptimal for typing speed, it became the global standard. The Dvorak layout is measurably more efficient, but QWERTY persists due to sheer momentum.",
        year: '1878',
        tags: ['History', 'Design', 'UX'],
        wowScore: 87,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/QWERTY' },
          { name: 'Smithsonian', url: 'https://www.smithsonianmag.com/science-nature/fact-of-fiction-the-legend-of-the-qwerty-keyboard-49863249/' },
        ],
      },
      {
        title: "GPS Satellites Must Account for Einstein's Relativity",
        body: "GPS satellites orbit at such speed and altitude that both special and general relativity noticeably affect their onboard clocks. Without relativistic corrections, GPS would accumulate an error of about 10 km per day, making it effectively useless. Each satellite's clock is deliberately set to tick 38 microseconds slower per day to compensate.",
        year: null,
        tags: ['GPS', 'Relativity', 'Physics'],
        wowScore: 96,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Error_analysis_for_the_Global_Positioning_System#Relativity' },
          { name: 'Physics Central', url: 'https://www.aps.org/publications/apsnews/201810/gps.cfm' },
        ],
      },
      {
        title: "More People Have Cell Phones Than Toilets",
        body: "As of 2023, roughly 6.9 billion people worldwide have access to mobile phones, while only about 4.5 billion have access to proper sanitation facilities. The UN has noted this disparity, highlighting that mobile infrastructure has expanded faster than basic sanitation in much of the developing world.",
        year: '2023',
        tags: ['Mobile', 'Society', 'Statistics'],
        wowScore: 89,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/List_of_countries_by_number_of_mobile_phones_in_use' },
          { name: 'UN Water', url: 'https://www.unwater.org/' },
        ],
      },
      {
        title: 'A Single Google Search Uses More Computing Power Than Apollo 11',
        body: "The Apollo 11 guidance computer had about 74 KB of memory and operated at 0.043 MHz. A single modern Google search query uses roughly 1,000 computers in 0.2 seconds, processing more data than all of NASA used to send humans to the Moon. Your smartphone has about 100,000 times more processing power than the Apollo computer.",
        year: null,
        tags: ['Computing', 'Comparison', 'NASA'],
        wowScore: 94,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Apollo_Guidance_Computer' },
          { name: 'Google Blog', url: 'https://blog.google/' },
        ],
      },
      {
        title: "The First 1GB Hard Drive Weighed 550 Pounds",
        body: "IBM's first gigabyte-capacity hard drive, the 3380 (1980), weighed approximately 550 pounds (250 kg), was the size of a refrigerator, and cost $40,000. Today, a 1TB microSD card weighing 0.25 grams costs under $100 — that's 4 million times the storage in roughly 1 millionth the weight, at a fraction of the cost.",
        year: '1980',
        tags: ['Storage', 'History', 'Progress'],
        wowScore: 92,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/History_of_hard_disk_drives' },
          { name: 'IBM', url: 'https://www.ibm.com/history' },
        ],
      },
      {
        title: "Bitcoin Consumes More Electricity Than Many Countries",
        body: "The Bitcoin network's annual energy consumption has exceeded 120 TWh at peak — comparable to the entire nation of Norway. A single Bitcoin transaction uses roughly 1,449 kWh of electricity, enough to power an average US household for nearly 50 days. This has sparked major debates about cryptocurrency's environmental sustainability.",
        year: null,
        tags: ['Crypto', 'Energy', 'Environment'],
        wowScore: 91,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bitcoin#Energy_consumption_and_sustainability' },
          { name: 'Cambridge', url: 'https://ccaf.io/cbnsi/cbeci' },
        ],
      },
      {
        title: "The First Website Is Still Online",
        body: "Tim Berners-Lee published the world's first website on August 6, 1991, at CERN. It explained the World Wide Web project and how to create web pages. The page is still accessible at its original URL (info.cern.ch). The first-ever web browser was also a web editor — Berners-Lee envisioned the web as a collaborative, editable medium from the start.",
        year: '1991',
        tags: ['Web', 'History', 'CERN'],
        wowScore: 93,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/History_of_the_World_Wide_Web' },
          { name: 'CERN', url: 'https://info.cern.ch/' },
        ],
      },
      {
        title: "Quantum Computers Can Exist in Multiple States Simultaneously",
        body: "While classical computers use bits (0 or 1), quantum computers use qubits that can exist in a superposition of both states simultaneously. Google's 67-qubit Sycamore processor completed a calculation in 200 seconds that would take the world's fastest classical supercomputer approximately 10,000 years. This milestone, called 'quantum supremacy,' was achieved in 2019.",
        year: '2019',
        tags: ['Quantum', 'Computing', 'Future'],
        wowScore: 97,
        sources: [
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Quantum_supremacy' },
          { name: 'Google AI', url: 'https://ai.google/discover/quantum/' },
        ],
      },
    ],
  },
  ...NEW_CATEGORIES,
  ...PHASE4_CATEGORIES,
]

  // --- MERGE EXPANSION FACTS (10 → 30 per category) ---
  ;[EXTRA_FACTS_1, EXTRA_FACTS_2, EXTRA_FACTS_3, EXTRA_FACTS_4, EXTRA_FACTS_5A, EXTRA_FACTS_5B].forEach(pack => {
    Object.entries(pack).forEach(([catId, facts]) => {
      const cat = CATEGORIES.find(c => c.id === catId)
      if (cat) cat.facts.push(...facts)
    })
  })

// --- DEEP-CLONE HARDCODED FACTS AS BACKUP ---
const HARDCODED_FACTS_BACKUP = CATEGORIES.map(cat => ({
  id: cat.id,
  facts: cat.facts.map(f => ({ ...f, sources: f.sources ? f.sources.map(s => ({ ...s })) : [] })),
}))

// ============================================
// REALTIME TRIVIA — Supabase Dynamic Loading
// ============================================
let realtimeChannel = null
let lastTriviaUpdate = null
let isUsingRealtimeFacts = false
let currentLiveFacts = null

// ============================================
// DEDUP UTILITY — Final safety net against duplicate facts
// ============================================

function dedupFacts(facts) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'was', 'are', 'were', 'in', 'on', 'at', 'to', 'of', 'by',
    'for', 'and', 'or', 'but', 'with', 'from', 'its', 'it', 'as', 'this', 'that', 'has', 'had', 'have',
    'be', 'been', 'not', 'no', 'after', 'before', 'during', 'into', 'about', 'also', 'than', 'then',
    'which', 'who', 'whom', 'when', 'where', 'their', 'they', 'them', 'there', 'these', 'those',
    'such', 'what', 'more', 'most', 'some', 'only', 'over', 'under', 'each', 'every',
    'first', 'last', 'just', 'very', 'much', 'many', 'both', 'being', 'between'])

  function getKeywords(text) {
    return (text || '')
      .replace(/'s\b/g, '')          // "Rossini's" → "Rossini"
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .map(w => w.replace(/s$/, '')) // basic stemming
      .filter(w => w.length > 3 && !stopWords.has(w))
  }

  const unique = []
  for (const fact of facts) {
    const keywords = getKeywords(fact.body)
    let isDup = false

    for (const existing of unique) {
      const existingKw = getKeywords(existing.body)
      if (existingKw.length === 0) continue

      const sameYear = fact.year && existing.year && String(fact.year) === String(existing.year)

      const setA = new Set(keywords)
      const setB = new Set(existingKw)
      const intersection = [...setA].filter(w => setB.has(w)).length
      const union = new Set([...setA, ...setB]).size
      const similarity = union > 0 ? intersection / union : 0

      if ((sameYear && (similarity > 0.25 || intersection >= 3)) || similarity > 0.4) {
        isDup = true
        break
      }
    }

    if (!isDup) unique.push(fact)
  }
  return unique
}

// ============================================
// AGENTIC FACT SYSTEM — Curiosity + Verification Pipeline
// ============================================

async function loadAndRenderLiveFacts() {
  const container = document.getElementById('live-facts-section')
  if (!container) return

  container.classList.remove('hidden')

  // Check Supabase cache first
  const cached = await getCachedLiveFacts()
  if (cached && cached.facts.length > 0) {
    console.log(`📦 Using Supabase-cached live facts from today (${cached.totalCount} facts)`)
    // Dedup cached facts (in case old cache had duplicates)
    const deduped = dedupFacts(cached.facts)
    renderAgentResults(container, deduped, true)
    return
  }

  // Show the agentic pipeline UI
  container.innerHTML = `
    <div class="agent-console">
      <div class="agent-header">
        <div class="agent-title-row">
          <span class="live-pulse-dot"></span>
          <h2 class="live-facts-heading">🤖 AI Agents Active</h2>
          <span class="live-facts-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
      <div class="agent-pipeline">
        <div class="agent-stage" id="agent-curiosity">
          <div class="agent-stage-header">
            <span class="agent-stage-icon">🔭</span>
            <span class="agent-stage-title">Curiosity Agent</span>
            <span class="agent-stage-status" id="curiosity-status">Starting...</span>
          </div>
          <div class="agent-steps" id="curiosity-steps">
            <div class="agent-step active">
              <span class="step-dot"></span>
              <span class="step-text">Initializing agent...</span>
            </div>
          </div>
        </div>
        <div class="agent-stage dimmed" id="agent-verification">
          <div class="agent-stage-header">
            <span class="agent-stage-icon">🔍</span>
            <span class="agent-stage-title">Verification Agent</span>
            <span class="agent-stage-status" id="verification-status">Waiting...</span>
          </div>
          <div class="agent-steps" id="verification-steps"></div>
        </div>
      </div>
      <div class="agent-results-area" id="agent-results">
        <div class="live-facts-grid">
          ${Array(6).fill('<div class="live-fact-card skeleton"><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></div>').join('')}
        </div>
      </div>
    </div>
  `

  // --- PHASE 1: Curiosity Agent ---
  const curiositySteps = document.getElementById('curiosity-steps')
  const curiosityStatus = document.getElementById('curiosity-status')

  const curiosityResult = await runCuriosityAgent((step) => {
    if (curiositySteps) {
      const stepEl = document.createElement('div')
      stepEl.className = `agent-step ${step.done ? 'done' : 'active'}`
      stepEl.innerHTML = `<span class="step-dot"></span><span class="step-text">${step.label}</span>`
      curiositySteps.appendChild(stepEl)
      // Auto-scroll to latest step
      curiositySteps.scrollTop = curiositySteps.scrollHeight
    }
    if (curiosityStatus) {
      curiosityStatus.textContent = step.done ? `✅ ${step.label}` : step.label
    }
  })

  // Mark curiosity complete, activate verification
  document.getElementById('agent-curiosity')?.classList.add('completed')
  document.getElementById('agent-verification')?.classList.remove('dimmed')

  // --- PHASE 2: Verification Agent (verify top 15 facts) ---
  const verificationSteps = document.getElementById('verification-steps')
  const verificationStatus = document.getElementById('verification-status')

  const topFacts = curiosityResult.facts.slice(0, 15)

  const verificationResult = await runVerificationAgent(topFacts, (step) => {
    if (verificationSteps) {
      // Update or add step
      const existing = verificationSteps.querySelector('.agent-step.active')
      if (existing) existing.className = 'agent-step done'

      const stepEl = document.createElement('div')
      stepEl.className = `agent-step ${step.done ? 'done' : 'active'}`
      stepEl.innerHTML = `<span class="step-dot"></span><span class="step-text">${step.label}${step.detail ? ` <span class="step-detail">${truncateText(step.detail, 50)}</span>` : ''}</span>`
      verificationSteps.appendChild(stepEl)
      verificationSteps.scrollTop = verificationSteps.scrollHeight
    }
    if (verificationStatus) {
      verificationStatus.textContent = step.done ? `✅ Done` : step.label
    }
  })

  document.getElementById('agent-verification')?.classList.add('completed')

  // Combine: verified facts first, then unverified curiosity facts
  let allFacts = [
    ...verificationResult.verified,
    ...curiosityResult.facts.filter(f =>
      !verificationResult.verified.some(v => v.body === f.body) &&
      !verificationResult.rejected.some(r => r.body === f.body)
    ),
  ]

  // FINAL DEDUP — catch any remaining duplicates before rendering/caching
  allFacts = dedupFacts(allFacts)

  // Cache in Supabase
  if (allFacts.length > 0) {
    await cacheLiveFacts({
      facts: allFacts,
      fetchedAt: new Date(),
      report: curiosityResult.report,
    })
  }

  // Render the final results
  renderAgentResults(container, allFacts, false)
}

function renderAgentResults(container, facts, fromCache) {
  const timeLabel = fromCache ? 'cached today' : 'just now'
  const verifiedCount = facts.filter(f => f._verified).length

  const resultsHTML = `
    <div class="live-facts-header">
      <div class="live-facts-title-row">
        <span class="live-pulse-dot"></span>
        <h2 class="live-facts-heading">Today's Live Facts</h2>
        <span class="live-facts-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <p class="live-facts-subtitle">
        🤖 <strong>${facts.length}</strong> facts curated by AI agents
        ${verifiedCount > 0 ? `· <span class="verified-count">✅ ${verifiedCount} verified</span>` : ''}
        · <span class="live-time">${timeLabel}</span>
      </p>
    </div>
    <div class="live-facts-grid">
      ${facts.slice(0, 30).map((fact, i) => renderLiveFactCard(fact, i)).join('')}
    </div>
  `

  // If coming from cache, replace entire container
  if (fromCache) {
    container.innerHTML = resultsHTML
  } else {
    // Fade out pipeline, show results
    const resultsArea = document.getElementById('agent-results')
    if (resultsArea) {
      resultsArea.innerHTML = resultsHTML
    } else {
      container.innerHTML = resultsHTML
    }
  }

  // Add click handlers
  container.querySelectorAll('.live-fact-card').forEach((card, idx) => {
    card.addEventListener('click', () => {
      const fact = facts[idx]
      if (fact) openFactPanel(fact, 'live-facts')
    })
  })
}

function renderLiveFactCard(fact, index) {
  const sourceTag = fact._source === 'wikipedia-otd' ? '🌐 Wikipedia'
    : fact._source === 'wikipedia-random' ? '🌐 Wiki Discovery'
      : fact._source === 'trivia-db' ? '🧠 Trivia DB'
        : fact._source === 'random-facts' ? '✨ Random'
          : fact._source === 'wikipedia' ? '🌐 Wikipedia'
            : fact._source === 'opentdb' ? '🧠 Trivia'
              : '✨ Fact'

  const yearBadge = fact.year ? `<span class="live-fact-year">${fact.year}</span>` : ''

  const verifiedBadge = fact._verified
    ? `<span class="verified-badge" title="Verified via Wikipedia (${fact._confidence}% confidence)">✅ Verified ${fact._confidence}%</span>`
    : ''

  const wikiLink = fact._wikiUrl
    ? `<a href="${fact._wikiUrl}" target="_blank" class="wiki-evidence-link" title="View on Wikipedia">📖 ${fact._evidence || 'Wikipedia'}</a>`
    : ''

  return `
    <div class="live-fact-card ${fact._verified ? 'verified' : ''}" style="animation-delay: ${index * 60}ms">
      <div class="live-fact-top-row">
        <div class="live-fact-source">${sourceTag}</div>
        ${verifiedBadge}
      </div>
      <h3 class="live-fact-title">${fact.title}</h3>
      <p class="live-fact-body">${truncateText(fact.body, 150)}</p>
      <div class="live-fact-meta">
        ${yearBadge}
        ${fact.tags ? fact.tags.slice(0, 2).map(t => `<span class="live-fact-tag">${t}</span>`).join('') : ''}
        ${wikiLink}
      </div>
    </div>
  `
}

function truncateText(text, max) {
  if (!text || text.length <= max) return text
  return text.substring(0, max).trim() + '…'
}

function hideLiveFacts() {
  const container = document.getElementById('live-facts-section')
  if (container) {
    container.classList.add('hidden')
    container.innerHTML = ''
  }
}

async function loadTriviaFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('trivia_facts')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!data || data.length === 0) {
      console.warn('No trivia facts in Supabase — using hardcoded fallback')
      return false
    }

    // Group facts by category_id
    const grouped = {}
    data.forEach(row => {
      if (!grouped[row.category_id]) grouped[row.category_id] = []
      grouped[row.category_id].push({
        title: row.title,
        body: row.body,
        year: row.year || null,
        tags: row.tags || [],
        wowScore: row.wow_score || 90,
        sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
        _updatedAt: row.updated_at,
      })
    })

    // ===== DAILY ROTATION LOGIC =====
    // Use the current date to deterministically select 30 facts from each category's pool of 60
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))

    // Replace facts in CATEGORIES with daily-rotated selection
    let totalLoaded = 0
    CATEGORIES.forEach(cat => {
      if (grouped[cat.id]) {
        const allFacts = grouped[cat.id]
        // If we have more than 30 facts, select 30 using daily rotation
        if (allFacts.length > 30) {
          cat.facts = selectDailyFacts(allFacts, dayOfYear, 30)
        } else {
          cat.facts = allFacts
        }
        totalLoaded += cat.facts.length
      }
    })

    // Track last update
    const latest = data.reduce((max, row) => {
      const t = new Date(row.updated_at).getTime()
      return t > max ? t : max
    }, 0)
    lastTriviaUpdate = new Date(latest)
    isUsingRealtimeFacts = true

    console.log(`✅ Loaded ${totalLoaded} daily-rotated facts from Supabase (${Object.keys(grouped).length} categories)`)
    console.log(`📅 Day of year: ${dayOfYear} — facts rotate daily!`)
    updateLiveIndicator(true)
    return true
  } catch (err) {
    console.error('Failed to load trivia from Supabase:', err)
    return false
  }
}

/**
 * Deterministically select N facts from a pool based on the day of year.
 * Uses a seeded shuffle so the same day always produces the same selection,
 * but different days produce different selections.
 */
function selectDailyFacts(facts, dayOfYear, count) {
  // Create a seeded random number generator based on the day
  const seed = dayOfYear * 2654435761 // large prime for good distribution
  const indices = Array.from({ length: facts.length }, (_, i) => i)

  // Fisher-Yates shuffle with seeded random
  let currentSeed = seed
  for (let i = indices.length - 1; i > 0; i--) {
    // Simple seeded pseudo-random: mulberry32-like
    currentSeed = (currentSeed + 0x6D2B79F5) | 0
    let t = Math.imul(currentSeed ^ (currentSeed >>> 15), 1 | currentSeed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    const rand = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    const j = Math.floor(rand * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  // Take the first 'count' indices after shuffle
  return indices.slice(0, count).map(i => facts[i])
}

function resetToHardcodedFacts() {
  HARDCODED_FACTS_BACKUP.forEach(backup => {
    const cat = CATEGORIES.find(c => c.id === backup.id)
    if (cat) {
      cat.facts = backup.facts.map(f => ({ ...f, sources: f.sources ? f.sources.map(s => ({ ...s })) : [] }))
    }
  })
  isUsingRealtimeFacts = false
  lastTriviaUpdate = null
  updateLiveIndicator(false)
  console.log('🔄 Reverted to hardcoded facts')
}

function setupRealtimeSubscription() {
  // Clean up existing channel
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  realtimeChannel = supabase
    .channel('trivia-facts-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'trivia_facts' },
      async (payload) => {
        console.log('📡 Realtime update received:', payload.eventType)
        // Reload all facts
        await loadTriviaFromSupabase()
        renderCategoryGrid()
        showRealtimeToast('Facts just updated! 🔄')
      }
    )
    .subscribe((status) => {
      console.log('📡 Realtime subscription status:', status)
    })
}

function teardownRealtimeSubscription() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
    console.log('📡 Realtime subscription removed')
  }
}

async function refreshTrivia() {
  const btn = document.getElementById('refresh-trivia-btn')
  if (btn) {
    btn.classList.add('spinning')
    btn.disabled = true
  }

  const success = await loadTriviaFromSupabase()
  if (success) {
    renderCategoryGrid()
    showRealtimeToast('Facts refreshed! ✨')
  } else {
    showRealtimeToast('Failed to refresh — using cached facts')
  }

  if (btn) {
    setTimeout(() => {
      btn.classList.remove('spinning')
      btn.disabled = false
    }, 600)
  }
}

function updateLiveIndicator(isLive) {
  const indicator = document.getElementById('live-indicator')
  const refreshBtn = document.getElementById('refresh-trivia-btn')
  if (indicator) {
    indicator.classList.toggle('active', isLive)
    if (isLive && lastTriviaUpdate) {
      const timeStr = lastTriviaUpdate.toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
      indicator.querySelector('.live-text').textContent = `LIVE · Updated ${timeStr}`
    }
  }
  if (refreshBtn) {
    refreshBtn.classList.toggle('hidden', !isLive)
  }
}

function showRealtimeToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.realtime-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'realtime-toast'
  toast.innerHTML = `
    <span class="realtime-toast-dot"></span>
    <span>${message}</span>
  `
  document.body.appendChild(toast)

  requestAnimationFrame(() => {
    toast.classList.add('show')
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 400)
    }, 3000)
  })
}

// --- WEBGL BACKGROUND ---
function initBackground() {
  const canvas = document.getElementById('particles-canvas')
  const webgl = initWebGL(canvas)
  if (!webgl) {
    console.warn('WebGL unavailable — using CSS gradient fallback')
  }
}

// ============================================
// IN-MEMORY DATA CACHE (synced with Supabase)
// ============================================
let _favoritesCache = []
let _progressCache = {}

async function loadUserData() {
  const user = getCurrentUser()
  if (!user) {
    _favoritesCache = []
    _progressCache = {}
    updateFavoritesCount()
    return
  }

  // Load favorites
  const { data: favs } = await supabase
    .from('favorites')
    .select('fact_title, category_id, created_at')
    .eq('user_id', user.id)
  _favoritesCache = (favs || []).map(f => ({ title: f.fact_title, categoryId: f.category_id, date: f.created_at }))

  // Load progress
  const { data: prog } = await supabase
    .from('progress')
    .select('category_id, fact_title')
    .eq('user_id', user.id)
  _progressCache = {}
    ; (prog || []).forEach(p => {
      if (!_progressCache[p.category_id]) _progressCache[p.category_id] = []
      _progressCache[p.category_id].push(p.fact_title)
    })

  updateFavoritesCount()
}

// ============================================
// FAVORITES SYSTEM (Supabase)
// ============================================
function getFavorites() { return _favoritesCache }
function isFavorited(title) { return _favoritesCache.some(f => f.title === title) }

async function toggleFavorite(title, categoryId) {
  const user = getCurrentUser()
  if (!user) {
    showAuthToast('Sign in to save favorites!')
    return false
  }

  if (isFavorited(title)) {
    // Remove
    _favoritesCache = _favoritesCache.filter(f => f.title !== title)
    updateFavoritesCount()
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('fact_title', title)
  } else {
    // Add
    _favoritesCache.push({ title, categoryId, date: new Date().toISOString() })
    updateFavoritesCount()
    await supabase.from('favorites').upsert({ user_id: user.id, fact_title: title, category_id: categoryId })
  }
  return isFavorited(title)
}

function updateFavoritesCount() {
  const el = document.getElementById('favorites-count')
  if (el) el.textContent = _favoritesCache.length
}

// ============================================
// CATEGORY PROGRESS TRACKING (Supabase)
// ============================================
function getCategoryProgress(categoryId) {
  return _progressCache[categoryId] ? _progressCache[categoryId].length : 0
}

async function markFactRead(categoryId, factTitle) {
  const user = getCurrentUser()
  if (!user) return

  if (!_progressCache[categoryId]) _progressCache[categoryId] = []
  if (_progressCache[categoryId].includes(factTitle)) return

  _progressCache[categoryId].push(factTitle)
  await supabase.from('progress').upsert({ user_id: user.id, category_id: categoryId, fact_title: factTitle })
}

// ============================================
// SKELETON CARDS
// ============================================
function renderSkeletonCards(container, count = 6) {
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div')
    sk.className = 'skeleton-card'
    sk.innerHTML = `
      <div class="skeleton-line title"></div>
      <div class="skeleton-line body-1"></div>
      <div class="skeleton-line body-2"></div>
      <div class="skeleton-line body-3"></div>
      <div class="skeleton-line tag"></div>
    `
    container.appendChild(sk)
  }
}

// ============================================
// SCROLL ANIMATION OBSERVER
// ============================================
let scrollObserver = null
function initScrollObserver() {
  if (scrollObserver) scrollObserver.disconnect()
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('animate-in'), i * 60)
        scrollObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
}
function observeCards(container) {
  if (!scrollObserver) initScrollObserver()
  const cards = container.querySelectorAll('.fact-card, .category-card')
  cards.forEach(card => scrollObserver.observe(card))
}

// ============================================
// VIEW NAVIGATION + URL ROUTING
// ============================================
let currentView = 'landing'
let suppressPushState = false

function showView(viewId, skipAnimation = false) {
  const views = document.querySelectorAll('.view')
  const target = document.getElementById(`${viewId}-view`)

  views.forEach((v) => {
    if (v.classList.contains('active')) {
      v.classList.remove('active', 'fade-in')
      if (!skipAnimation) v.classList.add('fade-out')
      setTimeout(() => v.classList.remove('fade-out'), 300)
    }
  })

  setTimeout(
    () => {
      target.classList.add('active')
      if (!skipAnimation) target.classList.add('fade-in')
      window.scrollTo({ top: 0, behavior: skipAnimation ? 'auto' : 'smooth' })

      // Observe cards for scroll animation
      if (viewId === 'category' || viewId === 'search') {
        requestAnimationFrame(() => observeCards(target))
      }

      // Refresh category grid when returning to landing (updates progress bars)
      if (viewId === 'landing') {
        renderCategoryGrid()
      }
    },
    skipAnimation ? 0 : 150,
  )

  currentView = viewId
}

function navigateTo(viewId, params = {}, skipAnimation = false) {
  if (!suppressPushState) {
    let hash = '#/'
    if (viewId === 'category' && params.id) hash = `#/category/${params.id}`
    else if (viewId === 'quiz') hash = '#/quiz'
    else if (viewId === 'search' && params.query) hash = `#/search/${encodeURIComponent(params.query)}`
    else hash = '#/'
    history.pushState({ view: viewId, ...params }, '', hash)
  }
  showView(viewId, skipAnimation)
}

function initRouter() {
  window.addEventListener('popstate', (e) => {
    suppressPushState = true
    const state = e.state
    if (state) {
      if (state.view === 'category' && state.id) openCategory(state.id)
      else if (state.view === 'quiz') showView('quiz', true)
      else if (state.view === 'search' && state.query) {
        document.getElementById('search-input').value = state.query
        handleSearch(state.query)
      }
      else showView('landing', true)
    } else {
      handleHashRoute()
    }
    suppressPushState = false
  })

  // Handle initial hash
  handleHashRoute()
}

function handleHashRoute() {
  const hash = window.location.hash
  suppressPushState = true
  if (hash.startsWith('#/category/')) {
    const id = hash.replace('#/category/', '')
    openCategory(id)
  } else if (hash === '#/quiz') {
    showView('quiz', true)
  } else if (hash.startsWith('#/search/')) {
    const query = decodeURIComponent(hash.replace('#/search/', ''))
    document.getElementById('search-input').value = query
    handleSearch(query)
  }
  // else stay on landing (default)
  suppressPushState = false
}

// ============================================
// DAILY FACT
// ============================================
function renderDailyFact() {
  const banner = document.getElementById('daily-fact-banner')
  if (!banner) return

  // Deterministic "random" based on today's date
  const allFacts = []
  CATEGORIES.forEach(cat => {
    cat.facts.forEach(fact => allFacts.push({ ...fact, _categoryId: cat.id }))
  })
  const today = new Date()
  const daysSinceEpoch = Math.floor(today.getTime() / 86400000)
  const index = daysSinceEpoch % allFacts.length
  const fact = allFacts[index]

  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  banner.innerHTML = `
    <div class="daily-fact-card" id="daily-fact-card">
      <div class="daily-fact-header">
        <span class="daily-fact-badge">⭐ Fact of the Day</span>
        <span class="daily-fact-date">${dateStr}</span>
      </div>
      <h3 class="daily-fact-title">${fact.title}</h3>
      <p class="daily-fact-body">${fact.body}</p>
      <span class="daily-fact-category">${getCategoryLabel(fact._categoryId)}</span>
    </div>
  `

  document.getElementById('daily-fact-card').addEventListener('click', () => {
    openFactPanel(fact, fact._categoryId)
  })
}

// ============================================
// RENDER CATEGORY CARDS (with progress)
// ============================================
function renderCategoryGrid() {
  const grid = document.getElementById('categories-grid')
  grid.innerHTML = ''

  // Show skeleton first
  renderSkeletonCards(grid, 6)

  // Simulate brief load then render real cards
  setTimeout(() => {
    grid.innerHTML = ''
    CATEGORIES.forEach((cat) => {
      const card = document.createElement('div')
      card.className = 'category-card'
      card.dataset.category = cat.id
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.setAttribute('aria-label', `Explore ${cat.title}`)

      const read = getCategoryProgress(cat.id)
      const total = cat.facts.length
      const pct = total > 0 ? Math.round((read / total) * 100) : 0

      card.innerHTML = `
        <img class="category-card-img" src="${cat.image}" alt="${cat.title}" loading="lazy" />
        <div class="category-card-gradient"></div>
        <div class="category-card-content">
          <span class="category-card-icon">${cat.icon}</span>
          <h2 class="category-card-title">${cat.title}</h2>
          <p class="category-card-subtitle">${cat.subtitle}</p>
          <span class="category-card-count">${total} facts</span>
          <div class="category-card-progress">
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
            <span class="progress-text">${read}/${total} read</span>
          </div>
        </div>
      `
      card.addEventListener('click', () => {
        navigateTo('category', { id: cat.id })
        openCategory(cat.id)
      })
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateTo('category', { id: cat.id }); openCategory(cat.id) }
      })
      grid.appendChild(card)
    })

    requestAnimationFrame(() => observeCards(grid))
  }, 300)
}

// ============================================
// OPEN CATEGORY
// ============================================
function openCategory(categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId)
  if (!cat) return

  document.getElementById('category-hero-img').src = cat.image
  document.getElementById('category-hero-img').alt = cat.title
  document.getElementById('category-icon').textContent = cat.icon
  document.getElementById('category-title').textContent = cat.title
  document.getElementById('category-desc').textContent = cat.description
  document.getElementById('category-count').textContent = `${cat.facts.length} Fascinating Facts`

  // Show skeleton first, then render
  const container = document.getElementById('facts-container')
  container.innerHTML = ''
  renderSkeletonCards(container, 6)

  showView('category')

  setTimeout(() => {
    renderFactCards(cat.facts, cat.id, 'facts-container')
    requestAnimationFrame(() => observeCards(container))
  }, 250)
}

// ============================================
// RENDER FACT CARDS (with highlight support)
// ============================================
function renderFactCards(facts, categoryId, containerId, highlightQuery = '') {
  const container = document.getElementById(containerId)
  container.innerHTML = ''

  if (facts.length === 0) {
    container.innerHTML = '<p class="no-results">No facts found matching your search.</p>'
    return
  }

  facts.forEach((fact, i) => {
    const catId = categoryId || fact._categoryId || 'space'
    const card = document.createElement('article')
    card.className = 'fact-card'
    card.dataset.accent = catId
    card.setAttribute('role', 'button')
    card.setAttribute('tabindex', '0')

    let titleHtml = fact.title
    let bodyHtml = fact.body
    if (highlightQuery) {
      titleHtml = highlightText(fact.title, highlightQuery)
      bodyHtml = highlightText(fact.body, highlightQuery)
    }

    card.innerHTML = `
      <span class="fact-card-number">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="fact-card-title">${titleHtml}</h3>
      <p class="fact-card-body">${bodyHtml}</p>
      <div class="fact-card-footer">
        <span class="fact-card-tag" data-tag="${catId}">${getCategoryLabel(catId)}</span>
        ${fact.year ? `<span class="fact-card-year">${fact.year}</span>` : ''}
      </div>
      <div class="fact-card-readmore">Read more →</div>
    `
    card.addEventListener('click', () => openFactPanel(fact, catId))
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFactPanel(fact, catId) }
    })
    container.appendChild(card)
  })
}

function highlightText(text, query) {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function getCategoryLabel(id) {
  const labels = {
    sports: '🏆 Sports', animals: '🦎 Animals', space: '🚀 Space', technology: '⚡ Tech',
    films: '🎬 Films', history: '📜 History', geography: '🌍 Geography',
    science: '🔬 Science', music: '🎵 Music', food: '🍳 Food',
    body: '🧬 Body', math: '🔢 Math', psychology: '🧠 Psychology',
    architecture: '🏛️ Architecture', language: '📚 Language',
  }
  return labels[id] || id
}

function getCategoryIcon(id) {
  const icons = {
    sports: '🏆', animals: '🦎', space: '🚀', technology: '⚡',
    films: '🎬', history: '📜', geography: '🌍', science: '🔬',
    music: '🎵', food: '🍳', body: '🧬', math: '🔢',
    psychology: '🧠', architecture: '🏛️', language: '📚',
  }
  return icons[id] || '📋'
}

// ============================================
// FACT DETAIL PANEL (with favorites + progress)
// ============================================
const CATEGORY_COLORS = {
  sports: '#f59e0b', animals: '#10b981', space: '#8b5cf6', technology: '#06b6d4',
  films: '#ef4444', history: '#d97706', geography: '#14b8a6', science: '#3b82f6',
  music: '#ec4899', food: '#f97316', body: '#06b6d4', math: '#eab308',
  psychology: '#a855f7', architecture: '#f43f5e', language: '#8b5cf6',
}

let currentPanelFact = null
let currentPanelCategory = null

function openFactPanel(fact, categoryId) {
  currentPanelFact = fact
  currentPanelCategory = categoryId

  const panel = document.getElementById('fact-panel')
  const backdrop = document.getElementById('fact-panel-backdrop')

  document.getElementById('fact-panel-title').textContent = fact.title

  // Subtitle: for live facts show source, for category facts show category title
  const isLiveFact = categoryId === 'live-facts'
  const subtitleText = isLiveFact
    ? `Live Fact${fact._source ? ' · ' + (fact._source === 'wikipedia-otd' ? 'Wikipedia' : fact._source === 'wikipedia-random' ? 'Wikipedia Discovery' : fact._source === 'trivia-db' ? 'Trivia DB' : fact._source === 'random-facts' ? 'Random Fact' : 'Live') : ''}`
    : CATEGORIES.find(c => c.id === categoryId)?.title || ''
  document.getElementById('fact-panel-subtitle').textContent = subtitleText

  // Tags
  const tagsEl = document.getElementById('fact-panel-tags')
  tagsEl.innerHTML = ''
  if (fact.tags) {
    fact.tags.forEach(tag => {
      const t = document.createElement('span')
      t.className = 'fact-panel-tag'
      t.textContent = tag
      tagsEl.appendChild(t)
    })
  }

  document.getElementById('fact-panel-body').textContent = fact.body

  // Year
  const yearRow = document.getElementById('fact-panel-year-row')
  if (fact.year) {
    yearRow.classList.remove('hidden')
    document.getElementById('fact-panel-year').textContent = fact.year
  } else {
    yearRow.classList.add('hidden')
  }

  // Score ring — hide for live facts (wowScore is internal ranking, not user-facing)
  const scoreRing = document.querySelector('.fact-panel-score')
  if (isLiveFact) {
    if (scoreRing) scoreRing.style.display = 'none'
  } else {
    if (scoreRing) scoreRing.style.display = ''
    const score = fact.wowScore || 90
    const color = CATEGORY_COLORS[categoryId] || '#8b5cf6'
    const circumference = 2 * Math.PI * 35
    const offset = circumference - (score / 100) * circumference

    document.getElementById('score-value').textContent = score
    const ringFill = document.getElementById('score-ring-fill')
    ringFill.style.stroke = color
    ringFill.style.strokeDashoffset = circumference
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { ringFill.style.strokeDashoffset = offset })
    })
  }

  // Sources
  const sourcesEl = document.getElementById('fact-panel-sources')
  sourcesEl.innerHTML = ''
  if (fact.sources && fact.sources.length > 0) {
    fact.sources.forEach(src => {
      const a = document.createElement('a')
      a.className = 'source-link'
      a.href = src.url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${src.name}
      `
      sourcesEl.appendChild(a)
    })
  }

  // Favorite button state
  updateFavoriteButton(fact.title)

  // Mark as read
  markFactRead(categoryId, fact.title)

  // Show
  panel.classList.add('active')
  panel.setAttribute('aria-hidden', 'false')
  backdrop.classList.add('active')
  document.body.style.overflow = 'hidden'
}

function updateFavoriteButton(title) {
  const btn = document.getElementById('fact-panel-favorite')
  if (!btn) return
  const fav = isFavorited(title)
  btn.classList.toggle('favorited', fav)
  btn.querySelector('.heart-icon').textContent = fav ? '❤️' : '🤍'
  btn.querySelector('.fav-text').textContent = fav ? 'Favorited' : 'Favorite'
}

function closeFactPanel() {
  const panel = document.getElementById('fact-panel')
  const backdrop = document.getElementById('fact-panel-backdrop')
  panel.classList.remove('active')
  panel.setAttribute('aria-hidden', 'true')
  backdrop.classList.remove('active')
  document.body.style.overflow = ''
}

// ============================================
// SMART SEARCH (fuzzy + highlighting + grouping)
// ============================================
function levenshtein(a, b) {
  const la = a.length, lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la
  const matrix = []
  for (let i = 0; i <= lb; i++) matrix[i] = [i]
  for (let j = 0; j <= la; j++) matrix[0][j] = j
  for (let i = 1; i <= lb; i++) {
    for (let j = 1; j <= la; j++) {
      if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1]
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[lb][la]
}

function fuzzyMatch(text, query) {
  const tLower = text.toLowerCase()
  const qLower = query.toLowerCase()

  // Exact substring match (always works)
  if (tLower.includes(qLower)) return true

  // Fuzzy: check if any word in text is close to a query word
  const queryWords = qLower.split(/\s+/)
  const textWords = tLower.split(/\s+/)
  for (const qw of queryWords) {
    if (qw.length < 3) continue
    // Scale tolerance: 1 for short words, 2 only for 7+ chars
    const maxDist = qw.length >= 7 ? 2 : 1
    for (const tw of textWords) {
      if (tw.length < 3) continue
      if (levenshtein(qw, tw) <= maxDist) return true
    }
  }
  return false
}

function handleSearch(query) {
  if (!query || query.trim().length < 2) return

  const q = query.trim()
  const qLower = q.toLowerCase()
  const grouped = {}

  CATEGORIES.forEach((cat) => {
    cat.facts.forEach((fact) => {
      const matchTitle = fuzzyMatch(fact.title, q)
      const matchBody = fuzzyMatch(fact.body, q)
      const matchTags = fact.tags && fact.tags.some(t => fuzzyMatch(t, q))

      if (matchTitle || matchBody || matchTags) {
        if (!grouped[cat.id]) grouped[cat.id] = { cat, facts: [] }
        grouped[cat.id].facts.push({ ...fact, _categoryId: cat.id })
      }
    })
  })

  // Count total results
  const totalResults = Object.values(grouped).reduce((s, g) => s + g.facts.length, 0)

  // Update UI
  document.getElementById('search-query-display').textContent = q
  document.getElementById('search-results-count').textContent = `Found ${totalResults} result${totalResults !== 1 ? 's' : ''}`

  // Render grouped results
  const container = document.getElementById('search-results-container')
  container.innerHTML = ''

  if (totalResults === 0) {
    container.innerHTML = '<p class="no-results">No facts found matching your search. Try a different term!</p>'
  } else {
    Object.values(grouped).forEach(group => {
      const section = document.createElement('div')
      section.className = 'search-group'
      section.innerHTML = `
        <div class="search-group-header">
          <span class="search-group-icon">${group.cat.icon}</span>
          <span class="search-group-title">${group.cat.title}</span>
          <span class="search-group-count">${group.facts.length} result${group.facts.length !== 1 ? 's' : ''}</span>
        </div>
      `
      const factsGrid = document.createElement('div')
      factsGrid.className = 'search-group-facts'
      section.appendChild(factsGrid)
      container.appendChild(section)

      // Render fact cards into group
      group.facts.forEach((fact, i) => {
        const card = document.createElement('article')
        card.className = 'fact-card'
        card.dataset.accent = fact._categoryId
        card.setAttribute('role', 'button')
        card.setAttribute('tabindex', '0')

        card.innerHTML = `
          <span class="fact-card-number">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="fact-card-title">${highlightText(fact.title, q)}</h3>
          <p class="fact-card-body">${highlightText(fact.body, q)}</p>
          <div class="fact-card-footer">
            <span class="fact-card-tag" data-tag="${fact._categoryId}">${getCategoryLabel(fact._categoryId)}</span>
            ${fact.year ? `<span class="fact-card-year">${fact.year}</span>` : ''}
          </div>
          <div class="fact-card-readmore">Read more →</div>
        `
        card.addEventListener('click', () => openFactPanel(fact, fact._categoryId))
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFactPanel(fact, fact._categoryId) }
        })
        factsGrid.appendChild(card)
      })
    })
  }

  navigateTo('search', { query: q })
  requestAnimationFrame(() => observeCards(container))
}

// ============================================
// RANDOM FACT MODAL
// ============================================
let currentRandomFact = null

function showRandomFact() {
  const allFacts = []
  CATEGORIES.forEach((cat) => {
    cat.facts.forEach((fact) => allFacts.push({ ...fact, _categoryId: cat.id }))
  })
  const fact = allFacts[Math.floor(Math.random() * allFacts.length)]
  currentRandomFact = fact
  document.getElementById('modal-fact-title').textContent = fact.title
  document.getElementById('modal-fact-body').textContent = fact.body
  document.getElementById('modal-fact-category').textContent = getCategoryLabel(fact._categoryId)
  document.getElementById('random-fact-modal').classList.add('active')
  document.body.style.overflow = 'hidden'
}

function openRandomFactDetail() {
  if (!currentRandomFact) return
  closeModal()
  setTimeout(() => openFactPanel(currentRandomFact, currentRandomFact._categoryId), 300)
}

function closeModal() {
  document.getElementById('random-fact-modal').classList.remove('active')
  document.body.style.overflow = ''
}

// ============================================
// FAVORITES VIEW
// ============================================
let showingFavorites = false

function toggleFavoritesView() {
  showingFavorites = !showingFavorites
  const btn = document.getElementById('favorites-filter-btn')
  btn.classList.toggle('active', showingFavorites)

  if (showingFavorites) {
    const favs = getFavorites()
    const favFacts = []
    CATEGORIES.forEach(cat => {
      cat.facts.forEach(fact => {
        if (favs.some(f => f.title === fact.title)) {
          favFacts.push({ ...fact, _categoryId: cat.id })
        }
      })
    })

    if (favFacts.length === 0) {
      const container = document.getElementById('search-results-container')
      container.innerHTML = '<p class="no-results">No favorites yet! Click ❤️ on any fact to save it here.</p>'
      document.getElementById('search-query-display').textContent = 'Favorites'
      document.getElementById('search-results-count').textContent = '0 saved'
      showView('search')
    } else {
      document.getElementById('search-query-display').textContent = 'Favorites'
      document.getElementById('search-results-count').textContent = `${favFacts.length} saved`
      renderFactCards(favFacts, null, 'search-results-container')
      showView('search')
      requestAnimationFrame(() => observeCards(document.getElementById('search-results-container')))
    }
  } else {
    showView('landing')
  }
}

// ============================================
// NAVBAR SCROLL
// ============================================
function initNavScrollEffect() {
  const navbar = document.getElementById('navbar')
  let ticking = false
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 20)
        ticking = false
      })
      ticking = true
    }
  })
}

// ============================================
// COUNT ANIMATION
// ============================================
function animateCount(el, target, duration = 1500) {
  const start = performance.now()
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = Math.round(target * eased)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// ============================================
// SHARE
// ============================================
function shareFact() {
  const title = document.getElementById('fact-panel-title').textContent
  const body = document.getElementById('fact-panel-body').textContent
  if (navigator.share) {
    navigator.share({ title: `Trivia: ${title}`, text: body }).catch(() => { })
  } else {
    navigator.clipboard.writeText(`${title}\n\n${body}`).then(() => {
      const btn = document.getElementById('fact-panel-share')
      btn.style.borderColor = 'var(--animals-primary)'
      setTimeout(() => { btn.style.borderColor = '' }, 1500)
    }).catch(() => { })
  }
}

// ============================================
// 3D TILT EFFECT
// ============================================
function init3DTilt() {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.category-card:hover, .fact-card:hover')
    cards.forEach(card => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -6
      const rotateY = ((x - centerX) / centerX) * 6
      card.style.transform = `translateY(-6px) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    })
  })

  document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.category-card, .fact-card').forEach(card => {
      card.style.transform = ''
    })
  }, true)

  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.category-card, .fact-card')
    if (card && !card.contains(e.relatedTarget)) {
      card.style.transform = ''
    }
  })
}

// ============================================
// INIT
// ============================================
async function init() {
  initBackground()
  initScrollObserver()

  // Init auth first, then load data
  await initAuth()

  // Auth state change handler — reload data + trivia when user logs in/out
  onAuthChange(async (user) => {
    await loadUserData()

    if (user) {
      // Signed in → load LIVE facts from external APIs
      loadAndRenderLiveFacts()
      const loaded = await loadTriviaFromSupabase()
      if (loaded) {
        setupRealtimeSubscription()
        showRealtimeToast('Welcome! Live facts loaded 🚀')
      }
    } else {
      // Signed out → revert to hardcoded facts, hide live section
      teardownRealtimeSubscription()
      resetToHardcodedFacts()
      hideLiveFacts()
    }

    renderCategoryGrid()
    renderDailyFact()
    updateFavoritesCount()
    // Refresh total count
    const totalFacts = CATEGORIES.reduce((sum, c) => sum + c.facts.length, 0)
    animateCount(document.getElementById('total-facts-count'), totalFacts)
    // Re-init quiz with updated data
    initQuiz(CATEGORIES)
  })

  // Initial data load
  await loadUserData()

  // If user is already signed in on load, fetch live + Supabase facts
  const currentUser = getCurrentUser()
  if (currentUser) {
    loadAndRenderLiveFacts()
    const loaded = await loadTriviaFromSupabase()
    if (loaded) {
      setupRealtimeSubscription()
    }
  }

  renderDailyFact()
  renderCategoryGrid()
  initNavScrollEffect()
  init3DTilt()
  initQuiz(CATEGORIES)
  updateFavoritesCount()

  // Quiz nav button
  document.getElementById('quiz-nav-btn').addEventListener('click', () => navigateTo('quiz'))

  // Total facts count
  const totalFacts = CATEGORIES.reduce((sum, c) => sum + c.facts.length, 0)
  setTimeout(() => animateCount(document.getElementById('total-facts-count'), totalFacts), 1200)

  // Navigation
  document.getElementById('back-btn').addEventListener('click', () => navigateTo('landing'))
  document.getElementById('search-back-btn').addEventListener('click', () => {
    document.getElementById('search-input').value = ''
    showingFavorites = false
    document.getElementById('favorites-filter-btn').classList.remove('active')
    navigateTo('landing')
  })
  document.getElementById('nav-brand').addEventListener('click', () => {
    document.getElementById('search-input').value = ''
    showingFavorites = false
    document.getElementById('favorites-filter-btn').classList.remove('active')
    navigateTo('landing')
  })

  // Favorites
  document.getElementById('favorites-filter-btn').addEventListener('click', toggleFavoritesView)
  document.getElementById('fact-panel-favorite').addEventListener('click', async () => {
    if (!currentPanelFact) return
    await toggleFavorite(currentPanelFact.title, currentPanelCategory)
    updateFavoriteButton(currentPanelFact.title)
  })

  // Random fact
  document.getElementById('random-fact-btn').addEventListener('click', showRandomFact)
  document.getElementById('modal-close-btn').addEventListener('click', closeModal)
  document.getElementById('modal-next-btn').addEventListener('click', showRandomFact)
  document.getElementById('random-fact-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal()
  })

  // Make modal fact content clickable -> opens detail panel
  document.getElementById('modal-fact-title').addEventListener('click', openRandomFactDetail)
  document.getElementById('modal-fact-body').addEventListener('click', openRandomFactDetail)
  document.getElementById('modal-fact-title').style.cursor = 'pointer'
  document.getElementById('modal-fact-body').style.cursor = 'pointer'

  // Fact panel
  document.getElementById('fact-panel-close').addEventListener('click', closeFactPanel)
  document.getElementById('fact-panel-close-bottom').addEventListener('click', closeFactPanel)
  document.getElementById('fact-panel-backdrop').addEventListener('click', closeFactPanel)
  document.getElementById('fact-panel-share').addEventListener('click', shareFact)

  // Refresh trivia button
  const refreshBtn = document.getElementById('refresh-trivia-btn')
  if (refreshBtn) refreshBtn.addEventListener('click', refreshTrivia)

  // Search
  let searchTimeout
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout)
    const val = e.target.value
    if (val.trim().length < 2) { if (currentView === 'search') navigateTo('landing'); return }
    searchTimeout = setTimeout(() => handleSearch(val), 300)
  })
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { clearTimeout(searchTimeout); handleSearch(e.target.value) }
  })

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('fact-panel').classList.contains('active')) {
        closeFactPanel()
      } else if (document.getElementById('random-fact-modal').classList.contains('active')) {
        closeModal()
      } else if (currentView !== 'landing') {
        document.getElementById('search-input').value = ''
        showingFavorites = false
        document.getElementById('favorites-filter-btn').classList.remove('active')
        navigateTo('landing')
      }
    }
  })

  // Init router last (may trigger navigation)
  initRouter()
}

document.addEventListener('DOMContentLoaded', init)

