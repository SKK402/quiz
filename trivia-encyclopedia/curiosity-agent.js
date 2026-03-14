// ============================================
// CURIOSITY AGENT
// Pipeline: Fetch from multiple sources → Extract interesting facts →
//           Rank by interestingness → Return best facts
// Focus: Ancient, mysterious, "first/oldest/secret" facts
// ============================================

import { supabase } from './supabase.js'

// ============================================
// WOW-FACTOR SCORING ENGINE (shared with live-facts-agent)
// ============================================

const WOW_BOOST_KEYWORDS = [
    // Ancient / Old — highest boosts
    { pattern: /\bBC\b|B\.C\./i, boost: 30 },
    { pattern: /\bBCE\b|B\.C\.E\./i, boost: 30 },
    { pattern: /\bancient\b/i, boost: 22 },
    { pattern: /\bprehistor/i, boost: 22 },
    { pattern: /\boldest\b/i, boost: 20 },
    { pattern: /\bearliest\b/i, boost: 20 },

    // Discoveries & Firsts
    { pattern: /\bfirst\b/i, boost: 16 },
    { pattern: /\bdiscover(ed|y|s)\b/i, boost: 16 },
    { pattern: /\binvent(ed|ion|or)\b/i, boost: 15 },
    { pattern: /\bpioneered?\b/i, boost: 14 },
    { pattern: /\bbreakthrough\b/i, boost: 15 },

    // Mystery & Secrets
    { pattern: /\bsecret\b/i, boost: 18 },
    { pattern: /\bmyster(y|ious)\b/i, boost: 18 },
    { pattern: /\bhidden\b/i, boost: 14 },
    { pattern: /\blost\b/i, boost: 12 },
    { pattern: /\bforgotten\b/i, boost: 16 },
    { pattern: /\benigma\b/i, boost: 16 },
    { pattern: /\bunknown\b/i, boost: 13 },

    // Remarkable
    { pattern: /\bonly\b/i, boost: 10 },
    { pattern: /\brarest?\b/i, boost: 15 },
    { pattern: /\bunique\b/i, boost: 13 },
    { pattern: /\blargest\b/i, boost: 11 },
    { pattern: /\bsmallest\b/i, boost: 11 },
    { pattern: /\brecord\b/i, boost: 9 },

    // Civilizations
    { pattern: /\bempire\b/i, boost: 13 },
    { pattern: /\bcivilization\b/i, boost: 15 },
    { pattern: /\bpharaoh\b/i, boost: 16 },
    { pattern: /\bdynasty\b/i, boost: 13 },
    { pattern: /\btemple\b/i, boost: 11 },
    { pattern: /\btomb\b/i, boost: 13 },
    { pattern: /\bpyramid\b/i, boost: 15 },
    { pattern: /\bruins?\b/i, boost: 12 },

    // Science & Space
    { pattern: /\bplanet\b/i, boost: 11 },
    { pattern: /\bastronom/i, boost: 13 },
    { pattern: /\beclipse\b/i, boost: 13 },
    { pattern: /\bexplor(ed|ation|er)\b/i, boost: 11 },
]

// Content to skip
const SKIP_PATTERNS = [
    /shooting|shot dead|murdered|stabbed|gunman|manslaughter/i,
    /suicide bomb|car bomb|terrorist attack/i,
    /plane crash|bus crash|train wreck/i,
    /sexual assault|rape|abuse/i,
]

function isInteresting(text) {
    return !SKIP_PATTERNS.some(p => p.test(text))
}

function calculateInterestingness(text) {
    let score = 50 // base
    const lower = (text || '').toLowerCase()

    for (const { pattern, boost } of WOW_BOOST_KEYWORDS) {
        if (pattern.test(lower)) score += boost
    }

    // Length bonus (more detailed = more interesting, up to a point)
    if (text.length > 100) score += 5
    if (text.length > 200) score += 5

    return Math.min(100, score)
}

/**
 * Fuzzy dedup: extract significant keywords from text and check similarity.
 * Handles possessives ("Rossini's" → "rossini"), basic stemming, etc.
 */
function getFuzzyKey(text) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'was', 'are', 'were', 'in', 'on', 'at', 'to', 'of', 'by',
        'for', 'and', 'or', 'but', 'with', 'from', 'its', 'it', 'as', 'this', 'that', 'has', 'had', 'have',
        'be', 'been', 'not', 'no', 'after', 'before', 'during', 'into', 'about', 'also', 'than', 'then',
        'which', 'who', 'whom', 'when', 'where', 'their', 'they', 'them', 'there', 'these', 'those',
        'such', 'what', 'than', 'more', 'most', 'some', 'only', 'over', 'under', 'each', 'every',
        'first', 'last', 'just', 'also', 'very', 'much', 'many', 'both', 'being', 'between'])

    return (text || '')
        .replace(/'s\b/g, '')       // strip possessives: "Rossini's" → "Rossini"
        .replace(/n't\b/g, '')      // strip contractions
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .map(w => w.replace(/s$/, ''))  // basic stemming: remove trailing 's'
        .filter(w => w.length > 3 && !stopWords.has(w))
}

function isFuzzyDuplicate(factA, existingFacts) {
    const keywordsA = getFuzzyKey(factA.body)
    if (keywordsA.length === 0) return false

    for (const factB of existingFacts) {
        const sameYear = factA.year && factB.year && String(factA.year) === String(factB.year)

        const keywordsB = getFuzzyKey(factB.body)
        if (keywordsB.length === 0) continue

        // Jaccard similarity
        const setA = new Set(keywordsA)
        const setB = new Set(keywordsB)
        const intersection = [...setA].filter(w => setB.has(w)).length
        const union = new Set([...setA, ...setB]).size
        const similarity = union > 0 ? intersection / union : 0

        // Thresholds:
        // - Same year + 25% keyword overlap → almost certainly the same event
        // - Any year + 40% keyword overlap → likely duplicate
        if ((sameYear && similarity > 0.25) || similarity > 0.4) {
            return true
        }

        // Fast-path: if 3+ significant words match AND same year → duplicate
        if (sameYear && intersection >= 3) {
            return true
        }
    }
    return false
}

// ============================================
// SOURCE FETCHERS
// ============================================

/**
 * Source 1: Wikipedia Random Articles
 * Fetches random article summaries and extracts interesting facts
 */
async function fetchWikipediaRandomFacts(count = 5, onStep) {
    const facts = []

    for (let i = 0; i < count; i++) {
        onStep?.({ label: `🌐 Wikipedia: Exploring random article ${i + 1}/${count}...` })

        try {
            const resp = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary', {
                headers: { 'Api-User-Agent': 'TriviaEncyclopedia/1.0' }
            })
            if (!resp.ok) continue

            const article = await resp.json()

            // Skip non-interesting articles
            if (!article.extract || article.extract.length < 60) continue
            if (!isInteresting(article.extract)) continue
            if (article.type === 'disambiguation') continue

            const interestingness = calculateInterestingness(article.extract + ' ' + article.title)

            // Only keep facts that score above 60 (meaningfully interesting)
            if (interestingness >= 55) {
                facts.push({
                    title: article.title,
                    body: article.extract,
                    year: extractYear(article.extract),
                    tags: ['Wikipedia', 'Discovery'],
                    wowScore: interestingness,
                    sources: [{ name: 'Wikipedia', url: article.content_urls?.desktop?.page || 'https://wikipedia.org' }],
                    _source: 'wikipedia-random',
                    _live: true,
                    _thumbnail: article.thumbnail?.source || null,
                })
            }

            // Small delay between requests
            await sleep(200)
        } catch (err) {
            // continue to next
        }
    }

    return facts
}

/**
 * Source 2: Wikipedia "On This Day" events
 */
async function fetchOnThisDayFacts(onStep) {
    onStep?.({ label: '📅 Fetching "On This Day" historical events...' })

    try {
        const now = new Date()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')

        const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`, {
            headers: { 'Api-User-Agent': 'TriviaEncyclopedia/1.0' }
        })
        if (!resp.ok) return []

        const data = await resp.json()
        const facts = []

        // Selected events (curated, best quality)
        const selected = (data.selected || [])
            .filter(e => isInteresting(e.text))
            .map(e => ({
                title: `On This Day in ${e.year}: ${truncate(e.text, 60)}`,
                body: e.text,
                year: String(e.year),
                tags: ['History', 'On This Day'],
                wowScore: calculateInterestingness(e.text + ' ' + String(e.year)),
                sources: e.pages?.[0] ? [{ name: e.pages[0].titles?.normalized || 'Wikipedia', url: e.pages[0].content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
                _source: 'wikipedia-otd',
                _live: true,
            }))

        facts.push(...selected)

        // General events (more volume)
        const events = (data.events || [])
            .filter(e => isInteresting(e.text))
            .map(e => ({
                title: `${e.year}: ${truncate(e.text, 70)}`,
                body: e.text,
                year: String(e.year),
                tags: ['History', 'Events'],
                wowScore: calculateInterestingness(e.text + ' ' + String(e.year)),
                sources: e.pages?.[0] ? [{ name: e.pages[0].titles?.normalized || 'Wikipedia', url: e.pages[0].content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
                _source: 'wikipedia-otd',
                _live: true,
            }))
            .filter(e => !isFuzzyDuplicate(e, facts)) // fuzzy dedup vs selected events

        facts.push(...events)

        // Holidays
        const holidays = (data.holidays || []).slice(0, 3).map(e => ({
            title: `🎉 Today: ${truncate(e.text, 70)}`,
            body: e.text,
            year: null,
            tags: ['Holiday', 'Celebration'],
            wowScore: calculateInterestingness(e.text),
            sources: e.pages?.[0] ? [{ name: e.pages[0].titles?.normalized || 'Wikipedia', url: e.pages[0].content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
            _source: 'wikipedia-otd',
            _live: true,
        }))

        facts.push(...holidays)

        return facts
    } catch (err) {
        return []
    }
}

/**
 * Source 3: Useless Facts API
 */
async function fetchRandomFacts(count = 10, onStep) {
    onStep?.({ label: `✨ Fetching ${count} random interesting facts...` })

    const facts = []
    const promises = Array.from({ length: count }, () =>
        fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
    )

    const results = await Promise.allSettled(promises)
    results.forEach(r => {
        if (r.status === 'fulfilled' && r.value?.text) {
            const text = r.value.text
            if (isInteresting(text) && text.length > 20) {
                facts.push({
                    title: truncate(text, 80),
                    body: text,
                    year: extractYear(text),
                    tags: ['Random', 'Fun Fact'],
                    wowScore: calculateInterestingness(text),
                    sources: [{ name: r.value.source || 'Random Facts', url: r.value.source_url || 'https://uselessfacts.jsph.pl' }],
                    _source: 'random-facts',
                    _live: true,
                })
            }
        }
    })

    return facts
}

/**
 * Source 4: Open Trivia DB
 */
async function fetchTriviaFacts(onStep) {
    onStep?.({ label: '🧠 Querying trivia database...' })

    try {
        const resp = await fetch('https://opentdb.com/api.php?amount=15&type=boolean')
        if (!resp.ok) return []

        const data = await resp.json()
        if (data.response_code !== 0) return []

        return data.results
            .map(q => {
                const question = decodeHTML(q.question)
                return {
                    title: question,
                    body: `${question} — Answer: ${q.correct_answer}. (${decodeHTML(q.category)}, ${q.difficulty})`,
                    year: null,
                    tags: [decodeHTML(q.category), q.difficulty],
                    wowScore: calculateInterestingness(question) + (q.difficulty === 'hard' ? 10 : q.difficulty === 'medium' ? 5 : 0),
                    sources: [{ name: 'Open Trivia DB', url: 'https://opentdb.com' }],
                    _source: 'trivia-db',
                    _live: true,
                }
            })
            .filter(f => isInteresting(f.title))
    } catch (err) {
        return []
    }
}

// ============================================
// MAIN CURIOSITY PIPELINE
// ============================================

/**
 * Run the full curiosity agent pipeline.
 * Fetches from all sources, ranks, and returns the best facts.
 *
 * @param {Function} onStep - callback for live UI step updates
 * @returns {Object} { facts: sorted array, report: stats }
 */
export async function runCuriosityAgent(onStep = () => { }) {
    const allFacts = []
    const report = { sources: [], totalFetched: 0, totalKept: 0 }

    onStep({ phase: 'start', label: '🤖 Curiosity Agent activated — scanning the web for fascinating facts...' })

    // Step 1: Fetch from all sources in parallel where possible
    onStep({ phase: 'fetch', step: 1, label: '📡 Step 1: Fetching facts from multiple sources...' })

    const [otdFacts, randomFacts, triviaFacts] = await Promise.all([
        fetchOnThisDayFacts(onStep),
        fetchRandomFacts(10, onStep),
        fetchTriviaFacts(onStep),
    ])

    allFacts.push(...otdFacts)
    report.sources.push({ name: 'On This Day', count: otdFacts.length })

    allFacts.push(...randomFacts)
    report.sources.push({ name: 'Random Facts', count: randomFacts.length })

    allFacts.push(...triviaFacts)
    report.sources.push({ name: 'Trivia DB', count: triviaFacts.length })

    // Step 2: Fetch Wikipedia random articles (sequential due to API limits)
    onStep({ phase: 'fetch', step: 2, label: '🌐 Step 2: Exploring Wikipedia for hidden gems...' })
    const wikiRandomFacts = await fetchWikipediaRandomFacts(8, onStep)
    allFacts.push(...wikiRandomFacts)
    report.sources.push({ name: 'Wikipedia Random', count: wikiRandomFacts.length })

    report.totalFetched = allFacts.length

    // Step 3: Extract & filter interesting facts
    onStep({ phase: 'extract', step: 3, label: `🧹 Step 3: Extracting interesting facts (${allFacts.length} raw facts)...` })

    // De-duplicate using fuzzy keyword similarity
    const unique = []
    allFacts.forEach(f => {
        if (!isFuzzyDuplicate(f, unique)) {
            unique.push(f)
        }
    })

    // Step 4: Rank by interestingness
    onStep({ phase: 'rank', step: 4, label: `📊 Step 4: Ranking ${unique.length} facts by interestingness...` })

    unique.sort((a, b) => b.wowScore - a.wowScore)

    // Keep top 30
    const best = unique.slice(0, 30)
    report.totalKept = best.length

    // Step 5: Done
    onStep({
        phase: 'done', step: 5,
        label: `✅ Step 5: Selected ${best.length} most fascinating facts from ${report.totalFetched} candidates!`,
        done: true,
    })

    console.log(`🤖 Curiosity Agent Report:`)
    console.log(`   Sources:`, report.sources)
    console.log(`   Fetched: ${report.totalFetched} → Kept: ${report.totalKept}`)
    console.log(`   Top 3:`)
    best.slice(0, 3).forEach((f, i) => {
        console.log(`     ${i + 1}. [${f.wowScore}] ${truncate(f.title, 60)}`)
    })

    return { facts: best, report }
}

// ============================================
// HELPERS
// ============================================

function truncate(text, max) {
    if (!text || text.length <= max) return text
    return text.substring(0, max).trim() + '…'
}

function extractYear(text) {
    const match = (text || '').match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
    return match ? match[1] : null
}

function decodeHTML(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
