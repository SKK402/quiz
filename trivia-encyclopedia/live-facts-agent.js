// ============================================
// LIVE FACTS AGENT — Fetches real-time facts from external APIs
// Focus: Unique, lesser-known, "wow-factor" facts
// Sources: Wikipedia On This Day, Useless Facts, Open Trivia DB
// ============================================

// --- WOW-FACTOR SCORING ENGINE ---
// Prioritizes ancient events, discoveries, firsts, mysteries, and secrets.
// The higher the score, the more likely users say "Wow, I didn't know that!"

const WOW_BOOST_KEYWORDS = [
    // Ancient / Old — highest boosts
    { pattern: /\bBC\b|B\.C\./i, boost: 25 },
    { pattern: /\bBCE\b|B\.C\.E\./i, boost: 25 },
    { pattern: /\bancient\b/i, boost: 20 },
    { pattern: /\bprehistor/i, boost: 20 },
    { pattern: /\boldest\b/i, boost: 18 },
    { pattern: /\bearliest\b/i, boost: 18 },
    { pattern: /\bmedieval\b/i, boost: 12 },
    { pattern: /\bcentur(y|ies)\b/i, boost: 8 },

    // Discoveries & Firsts
    { pattern: /\bfirst\b/i, boost: 15 },
    { pattern: /\bdiscover(ed|y|s)\b/i, boost: 15 },
    { pattern: /\binvent(ed|ion|or)\b/i, boost: 14 },
    { pattern: /\bfound(ed)?\b/i, boost: 8 },
    { pattern: /\bpioneered?\b/i, boost: 12 },
    { pattern: /\bbreakthrough\b/i, boost: 14 },
    { pattern: /\brevolution(ary|ized)?\b/i, boost: 12 },

    // Mystery & Secrets
    { pattern: /\bsecret\b/i, boost: 16 },
    { pattern: /\bmyster(y|ious)\b/i, boost: 16 },
    { pattern: /\bunknown\b/i, boost: 12 },
    { pattern: /\bhidden\b/i, boost: 12 },
    { pattern: /\blost\b/i, boost: 10 },
    { pattern: /\bforgotten\b/i, boost: 14 },
    { pattern: /\benigma\b/i, boost: 15 },
    { pattern: /\bruins?\b/i, boost: 10 },

    // Remarkable / Unique
    { pattern: /\bonly\b/i, boost: 10 },
    { pattern: /\brarest?\b/i, boost: 14 },
    { pattern: /\bunique\b/i, boost: 12 },
    { pattern: /\bnever\b/i, boost: 8 },
    { pattern: /\blargest\b/i, boost: 10 },
    { pattern: /\bsmallest\b/i, boost: 10 },
    { pattern: /\brecord\b/i, boost: 8 },
    { pattern: /\bworld'?s?\b/i, boost: 6 },

    // Science & Space
    { pattern: /\bplanet\b/i, boost: 10 },
    { pattern: /\bastronom/i, boost: 12 },
    { pattern: /\bcomet\b/i, boost: 10 },
    { pattern: /\beclipse\b/i, boost: 12 },
    { pattern: /\bexpedition\b/i, boost: 10 },
    { pattern: /\bexplor(ed|ation|er)\b/i, boost: 10 },

    // Civilizations & Empires
    { pattern: /\bempire\b/i, boost: 12 },
    { pattern: /\bcivilization\b/i, boost: 14 },
    { pattern: /\bpharaoh\b/i, boost: 15 },
    { pattern: /\bdynasty\b/i, boost: 12 },
    { pattern: /\bkingdom\b/i, boost: 10 },
    { pattern: /\btemple\b/i, boost: 10 },
    { pattern: /\btomb\b/i, boost: 12 },
    { pattern: /\bpyramid\b/i, boost: 14 },
]

// Keywords that indicate uninteresting or upsetting content
const SKIP_KEYWORDS = [
    'shooting', 'shot dead', 'shot and killed', 'murdered', 'stabbed',
    'gunman', 'mass shooting', 'school shooting', 'police shooting',
    'fatally shot', 'killed by police', 'manslaughter', 'suicide bomb',
    'car bomb', 'terrorist attack', 'plane crash', 'bus crash',
]

function isQualityEvent(text) {
    const lower = (text || '').toLowerCase()
    return !SKIP_KEYWORDS.some(kw => lower.includes(kw))
}

function calculateWowScore(text, year) {
    let score = 80 // base score

    // Ancient year boost — the older, the higher
    if (year !== null && year !== undefined) {
        const numYear = parseInt(String(year).replace(/\D/g, ''))
        if (String(year).toLowerCase().includes('bc') || numYear < 0) {
            score += 30 // BC events are maximum wow
        } else if (numYear < 500) {
            score += 25 // Ancient (0-500 AD)
        } else if (numYear < 1000) {
            score += 18 // Early Medieval
        } else if (numYear < 1500) {
            score += 12 // Medieval
        } else if (numYear < 1800) {
            score += 8  // Early Modern
        } else if (numYear < 1900) {
            score += 5  // 19th century
        }
        // 1900+ = no year boost (too recent = too well-known)
    }

    // Keyword boosts
    const combined = (text || '').toLowerCase()
    for (const { pattern, boost } of WOW_BOOST_KEYWORDS) {
        if (pattern.test(combined)) {
            score += boost
        }
    }

    // Cap at 100
    return Math.min(score, 100)
}

// Helper: truncate text
function truncate(text, maxLen) {
    if (!text || text.length <= maxLen) return text
    return text.substring(0, maxLen).trim() + '…'
}

// Helper: decode HTML entities
function decodeHTML(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}

// ============================================
// API SOURCES
// ============================================

const LIVE_FACT_APIS = {
    // Wikipedia "On This Day" — historical events for today's date
    wikipedia: {
        name: 'Wikipedia On This Day',
        getUrl: () => {
            const now = new Date()
            const mm = String(now.getMonth() + 1).padStart(2, '0')
            const dd = String(now.getDate()).padStart(2, '0')
            return `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`
        },
        transform: (data) => {
            const facts = []

            // 1. Selected events (editorially curated — best quality)
            if (data.selected) {
                data.selected
                    .filter(e => isQualityEvent(e.text))
                    .forEach(event => {
                        const wow = calculateWowScore(event.text, event.year)
                        facts.push({
                            title: `On This Day in ${event.year}: ${truncate(event.text, 60)}`,
                            body: event.text,
                            year: String(event.year),
                            tags: ['History', 'On This Day', 'Wikipedia'],
                            wowScore: wow,
                            sources: event.pages ? [{ name: event.pages[0]?.titles?.normalized || 'Wikipedia', url: event.pages[0]?.content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
                            _source: 'wikipedia',
                            _live: true,
                        })
                    })
            }

            // 2. Notable historical events
            if (data.events) {
                data.events
                    .filter(e => isQualityEvent(e.text))
                    .forEach(event => {
                        if (facts.some(f => f.body === event.text)) return // no dupes
                        const wow = calculateWowScore(event.text, event.year)
                        facts.push({
                            title: `${event.year}: ${truncate(event.text, 70)}`,
                            body: event.text,
                            year: String(event.year),
                            tags: ['History', 'Events', 'Today'],
                            wowScore: wow,
                            sources: event.pages ? [{ name: event.pages[0]?.titles?.normalized || 'Wikipedia', url: event.pages[0]?.content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
                            _source: 'wikipedia',
                            _live: true,
                        })
                    })
            }

            // 3. Famous births (first few = most notable)
            if (data.births) {
                data.births
                    .filter(e => isQualityEvent(e.text))
                    .slice(0, 3)
                    .forEach(event => {
                        facts.push({
                            title: `Born Today (${event.year}): ${truncate(event.text, 60)}`,
                            body: event.text,
                            year: String(event.year),
                            tags: ['Birthdays', 'Famous People', 'Today'],
                            wowScore: calculateWowScore(event.text, event.year),
                            sources: event.pages ? [{ name: event.pages[0]?.titles?.normalized || 'Wikipedia', url: event.pages[0]?.content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
                            _source: 'wikipedia',
                            _live: true,
                        })
                    })
            }

            // 4. Holidays
            if (data.holidays) {
                data.holidays.slice(0, 3).forEach(event => {
                    facts.push({
                        title: `🎉 Today: ${truncate(event.text, 70)}`,
                        body: event.text,
                        year: null,
                        tags: ['Holiday', 'Celebration', 'Today'],
                        wowScore: 86,
                        sources: event.pages ? [{ name: event.pages[0]?.titles?.normalized || 'Wikipedia', url: event.pages[0]?.content_urls?.desktop?.page || 'https://wikipedia.org' }] : [],
                        _source: 'wikipedia',
                        _live: true,
                    })
                })
            }

            // --- SORT BY WOW SCORE (highest first) ---
            // Ancient/BC events, discoveries, and mysteries float to the top
            facts.sort((a, b) => b.wowScore - a.wowScore)

            // Return top 20 (the most interesting ones)
            return facts.slice(0, 20)
        },
    },

    // Useless Facts — daily fact
    uselessFacts: {
        name: 'Random Facts',
        getUrl: () => 'https://uselessfacts.jsph.pl/api/v2/facts/today?language=en',
        transform: (data) => {
            if (!data?.text) return []
            return [{
                title: 'Fact of the Day',
                body: data.text,
                year: null,
                tags: ['Random', 'Fun Fact', 'Daily'],
                wowScore: calculateWowScore(data.text, null),
                sources: [{ name: data.source || 'Useless Facts', url: data.source_url || 'https://uselessfacts.jsph.pl' }],
                _source: 'uselessfacts',
                _live: true,
            }]
        },
    },

    // Multiple random facts
    uselessFactsRandom: {
        name: 'Random Facts Pool',
        getUrl: () => 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en',
        fetchMultiple: 10,
        transform: (data) => {
            if (!data?.text) return []
            return [{
                title: truncate(data.text, 80),
                body: data.text,
                year: null,
                tags: ['Random', 'Fun Fact'],
                wowScore: calculateWowScore(data.text, null),
                sources: [{ name: data.source || 'Random Facts', url: data.source_url || 'https://uselessfacts.jsph.pl' }],
                _source: 'uselessfacts',
                _live: true,
            }]
        },
    },

    // Open Trivia DB
    openTrivia: {
        name: 'Trivia Database',
        getUrl: () => 'https://opentdb.com/api.php?amount=15&type=boolean',
        transform: (data) => {
            if (!data?.results) return []
            return data.results.map(q => {
                const question = decodeHTML(q.question)
                return {
                    title: question,
                    body: `${question} — The answer is: ${q.correct_answer}. Category: ${decodeHTML(q.category)}, Difficulty: ${q.difficulty}.`,
                    year: null,
                    tags: [decodeHTML(q.category), q.difficulty, 'Trivia'],
                    wowScore: calculateWowScore(question, null) + (q.difficulty === 'hard' ? 8 : q.difficulty === 'medium' ? 4 : 0),
                    sources: [{ name: 'Open Trivia DB', url: 'https://opentdb.com' }],
                    _source: 'opentdb',
                    _live: true,
                }
            })
        },
    },
}

// ============================================
// MAIN FETCH FUNCTION
// ============================================

/**
 * Fetch live facts from all external APIs.
 * Returns facts sorted by wowScore — most interesting first.
 */
export async function fetchLiveFacts() {
    const allFacts = []
    const fetchResults = { success: [], failed: [] }

    // 1. Wikipedia On This Day
    try {
        const wikiResp = await fetch(LIVE_FACT_APIS.wikipedia.getUrl(), {
            headers: { 'Api-User-Agent': 'TriviaEncyclopedia/1.0 (contact@example.com)' }
        })
        if (wikiResp.ok) {
            const wikiData = await wikiResp.json()
            const wikiFacts = LIVE_FACT_APIS.wikipedia.transform(wikiData)
            allFacts.push(...wikiFacts)
            fetchResults.success.push(`Wikipedia: ${wikiFacts.length} facts`)
        } else {
            fetchResults.failed.push(`Wikipedia: HTTP ${wikiResp.status}`)
        }
    } catch (err) {
        fetchResults.failed.push(`Wikipedia: ${err.message}`)
    }

    // 2. Fact of the Day
    try {
        const fotdResp = await fetch(LIVE_FACT_APIS.uselessFacts.getUrl())
        if (fotdResp.ok) {
            const fotdData = await fotdResp.json()
            allFacts.push(...LIVE_FACT_APIS.uselessFacts.transform(fotdData))
            fetchResults.success.push('Fact of Day: 1')
        }
    } catch (err) {
        fetchResults.failed.push(`Fact of Day: ${err.message}`)
    }

    // 3. Multiple random facts
    try {
        const randomPromises = Array.from({ length: LIVE_FACT_APIS.uselessFactsRandom.fetchMultiple }, () =>
            fetch(LIVE_FACT_APIS.uselessFactsRandom.getUrl())
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
        )
        const randomResults = await Promise.allSettled(randomPromises)
        let randomCount = 0
        randomResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const facts = LIVE_FACT_APIS.uselessFactsRandom.transform(result.value)
                facts.forEach(f => {
                    if (!allFacts.some(existing => existing.body === f.body)) {
                        allFacts.push(f)
                        randomCount++
                    }
                })
            }
        })
        fetchResults.success.push(`Random Facts: ${randomCount}`)
    } catch (err) {
        fetchResults.failed.push(`Random Facts: ${err.message}`)
    }

    // 4. Open Trivia DB
    try {
        const triviaResp = await fetch(LIVE_FACT_APIS.openTrivia.getUrl())
        if (triviaResp.ok) {
            const triviaData = await triviaResp.json()
            if (triviaData.response_code === 0) {
                const triviaFacts = LIVE_FACT_APIS.openTrivia.transform(triviaData)
                allFacts.push(...triviaFacts)
                fetchResults.success.push(`Trivia DB: ${triviaFacts.length}`)
            }
        }
    } catch (err) {
        fetchResults.failed.push(`Trivia DB: ${err.message}`)
    }

    // --- FINAL SORT: most interesting facts first ---
    allFacts.sort((a, b) => b.wowScore - a.wowScore)

    console.log(`🤖 Live Facts Agent Report:`)
    console.log(`   ✅ Success: ${fetchResults.success.join(', ')}`)
    if (fetchResults.failed.length) {
        console.log(`   ❌ Failed: ${fetchResults.failed.join(', ')}`)
    }
    console.log(`   📊 Total live facts: ${allFacts.length}`)
    console.log(`   🏆 Top 3 by wow-score:`)
    allFacts.slice(0, 3).forEach((f, i) => {
        console.log(`      ${i + 1}. [${f.wowScore}] ${f.title}`)
    })

    return {
        facts: allFacts,
        fetchedAt: new Date(),
        report: fetchResults,
        totalCount: allFacts.length,
    }
}

// ============================================
// CACHING — Supabase-based (shared across all users/devices)
// First user to sign in each day fetches from APIs and stores in Supabase.
// All subsequent users read from the shared cache.
// ============================================

import { supabase } from './supabase.js'

export function getTodayKey() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Cache live facts in Supabase (upsert by date_key).
 */
export async function cacheLiveFacts(result) {
    try {
        const { error } = await supabase
            .from('live_facts_cache')
            .upsert({
                date_key: getTodayKey(),
                facts: result.facts,
                fetched_at: result.fetchedAt.toISOString(),
                source_report: result.report || {},
            }, { onConflict: 'date_key' })

        if (error) {
            console.warn('Failed to cache live facts in Supabase:', error.message)
        } else {
            console.log(`💾 Live facts cached in Supabase for ${getTodayKey()}`)
            // Clean up old cache entries (older than 7 days)
            cleanupOldCache()
        }
    } catch (e) {
        console.warn('Failed to cache live facts:', e)
    }
}

/**
 * Get today's cached live facts from Supabase.
 */
export async function getCachedLiveFacts() {
    try {
        const { data, error } = await supabase
            .from('live_facts_cache')
            .select('*')
            .eq('date_key', getTodayKey())
            .single()

        if (error || !data) return null

        return {
            facts: data.facts,
            fetchedAt: new Date(data.fetched_at),
            totalCount: data.facts.length,
            fromCache: true,
        }
    } catch (e) {
        return null
    }
}

/**
 * Remove cache entries older than 7 days to keep the table small.
 */
async function cleanupOldCache() {
    try {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 7)
        const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

        await supabase
            .from('live_facts_cache')
            .delete()
            .lt('date_key', cutoffKey)
    } catch (e) {
        // silent cleanup
    }
}

