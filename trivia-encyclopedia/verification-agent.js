// ============================================
// FACT VERIFICATION AGENT
// Pipeline: Fetch → Verify via Wikipedia → Accept/Reject → Show Verified
// ============================================

import { supabase } from './supabase.js'

/**
 * Verification statuses for the UI step display
 */
const STEP = {
    FETCHING: { id: 'fetch', label: 'Fetching fact', icon: '📡', status: 'active' },
    VERIFYING: { id: 'verify', label: 'Verifying via Wikipedia', icon: '🔍', status: 'active' },
    DECIDING: { id: 'decide', label: 'Analyzing accuracy', icon: '🧠', status: 'active' },
    DONE: { id: 'done', label: 'Verification complete', icon: '✅', status: 'done' },
}

/**
 * Verify a single fact by searching Wikipedia for corroborating information.
 * Returns { verified: bool, confidence: 0-100, evidence: string, wikiUrl: string }
 */
async function verifyFactViaWikipedia(fact) {
    try {
        // Extract key terms from the fact title for Wikipedia search
        const searchQuery = extractSearchTerms(fact.title, fact.body)

        // Search Wikipedia
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=3&srprop=snippet|titlesnippet`

        const resp = await fetch(searchUrl)
        if (!resp.ok) return { verified: false, confidence: 0, evidence: 'Wikipedia API unavailable', wikiUrl: null }

        const data = await resp.json()
        const results = data?.query?.search || []

        if (results.length === 0) {
            return { verified: false, confidence: 15, evidence: 'No matching Wikipedia articles found', wikiUrl: null }
        }

        // Check how well the Wikipedia results match the fact
        const topResult = results[0]
        const snippet = stripHTML(topResult.snippet).toLowerCase()
        const factText = (fact.title + ' ' + fact.body).toLowerCase()

        // Calculate match confidence based on keyword overlap
        const factWords = extractKeywords(factText)
        const snippetWords = extractKeywords(snippet)
        const matchCount = factWords.filter(w => snippetWords.includes(w) || snippet.includes(w)).length
        const matchRatio = factWords.length > 0 ? matchCount / factWords.length : 0

        // Confidence scoring
        let confidence = Math.round(matchRatio * 100)

        // Boost if title matches closely
        const titleMatch = topResult.title.toLowerCase()
        if (factText.includes(titleMatch) || titleMatch.includes(extractSearchTerms(fact.title, '').toLowerCase())) {
            confidence = Math.min(100, confidence + 20)
        }

        // Boost if multiple results back it up
        if (results.length >= 2) {
            const snippet2 = stripHTML(results[1].snippet).toLowerCase()
            const secondMatch = factWords.filter(w => snippet2.includes(w)).length
            if (secondMatch >= 2) confidence = Math.min(100, confidence + 10)
        }

        const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(topResult.title.replace(/ /g, '_'))}`

        return {
            verified: confidence >= 40,
            confidence: Math.min(100, Math.max(10, confidence)),
            evidence: topResult.title,
            snippet: stripHTML(topResult.snippet),
            wikiUrl,
        }
    } catch (err) {
        console.warn('Verification failed:', err)
        return { verified: false, confidence: 0, evidence: 'Verification error', wikiUrl: null }
    }
}

/**
 * Extract meaningful search terms from a fact
 */
function extractSearchTerms(title, body) {
    // Remove common prefixes/patterns
    let clean = (title || '')
        .replace(/^(On This Day in \d+:|Born Today \(\d+\):|🎉 Today:|Fact of the Day|\d+:)\s*/i, '')
        .replace(/…$/, '')
        .trim()

    // If title is too short, add body keywords
    if (clean.length < 15 && body) {
        const bodyWords = body.split(/\s+/).slice(0, 8).join(' ')
        clean = clean + ' ' + bodyWords
    }

    return clean.substring(0, 100)
}

/**
 * Extract significant keywords from text
 */
function extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
        'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
        'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
        'any', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 'just',
        'its', 'it', 'this', 'that', 'these', 'those', 'he', 'she', 'they', 'them', 'his', 'her',
        'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how'])

    return text.split(/[\s,;:.()\[\]{}!?'"]+/)
        .map(w => w.toLowerCase().trim())
        .filter(w => w.length > 3 && !stopWords.has(w))
}

/**
 * Strip HTML tags from a string
 */
function stripHTML(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'")
}

// ============================================
// MAIN VERIFICATION PIPELINE
// ============================================

/**
 * Run the verification pipeline on an array of facts.
 * Emits step-by-step progress via the onStep callback.
 *
 * @param {Array} facts - facts to verify
 * @param {Function} onStep - callback(stepData) for live UI updates
 * @returns {Array} verified facts with verification metadata
 */
export async function runVerificationAgent(facts, onStep = () => { }) {
    const verified = []
    const rejected = []

    for (let i = 0; i < facts.length; i++) {
        const fact = facts[i]

        // Step 1: Fetching
        onStep({
            step: 1, total: 4, factIndex: i, factCount: facts.length,
            label: `📡 Fetching fact ${i + 1}/${facts.length}...`,
            detail: fact.title,
        })

        // Small delay between API calls to be polite
        if (i > 0) await sleep(300)

        // Step 2: Verifying
        onStep({
            step: 2, total: 4, factIndex: i, factCount: facts.length,
            label: `🔍 Verifying via Wikipedia...`,
            detail: `Searching for: "${extractSearchTerms(fact.title, fact.body)}"`,
        })

        const result = await verifyFactViaWikipedia(fact)

        // Step 3: Deciding
        onStep({
            step: 3, total: 4, factIndex: i, factCount: facts.length,
            label: result.verified
                ? `✅ Verified (${result.confidence}% confidence)`
                : `❌ Could not verify (${result.confidence}%)`,
            detail: result.evidence,
        })

        if (result.verified) {
            verified.push({
                ...fact,
                _verified: true,
                _confidence: result.confidence,
                _evidence: result.evidence,
                _snippet: result.snippet,
                _wikiUrl: result.wikiUrl,
            })
        } else {
            rejected.push({ ...fact, _reason: result.evidence, _confidence: result.confidence })
        }
    }

    // Step 4: Done
    onStep({
        step: 4, total: 4, factIndex: facts.length, factCount: facts.length,
        label: `✅ Verification complete: ${verified.length} verified, ${rejected.length} rejected`,
        detail: '',
        done: true,
    })

    return { verified, rejected }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
