// ============================================
// WOW-FACTOR TRIVIA SEEDER — Seed 900 mind-blowing facts to Supabase
// Run: node seed-wow-facts.js
// ============================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ntmbqgvlqongaetzpeyv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bWJxZ3ZscW9uZ2FldHpwZXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzgxODMsImV4cCI6MjA4ODAxNDE4M30.CLo5qNZ8FBMG_D1uzCWg3S4eHqmrhTHHGUgb9zyT1NY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// --- Import all wow-factor fact files ---
import { SPORTS_FACTS } from './wow-facts-sports.js'
import { ANIMALS_FACTS } from './wow-facts-animals.js'
import { SPACE_FACTS } from './wow-facts-space.js'
import { TECHNOLOGY_FACTS } from './wow-facts-technology.js'
import { FILMS_FACTS } from './wow-facts-films.js'
import { HISTORY_FACTS, GEOGRAPHY_FACTS, SCIENCE_FACTS } from './wow-facts-hgs.js'
import { MUSIC_FACTS, FOOD_FACTS } from './wow-facts-mf.js'
import { BODY_FACTS, MATH_FACTS } from './wow-facts-bm.js'
import { PSYCHOLOGY_FACTS, ARCHITECTURE_FACTS, LANGUAGE_FACTS } from './wow-facts-pal.js'

// --- Map categories ---
const WOW_CATEGORIES = [
    { id: 'sports', facts: SPORTS_FACTS },
    { id: 'animals', facts: ANIMALS_FACTS },
    { id: 'space', facts: SPACE_FACTS },
    { id: 'technology', facts: TECHNOLOGY_FACTS },
    { id: 'films', facts: FILMS_FACTS },
    { id: 'history', facts: HISTORY_FACTS },
    { id: 'geography', facts: GEOGRAPHY_FACTS },
    { id: 'science', facts: SCIENCE_FACTS },
    { id: 'music', facts: MUSIC_FACTS },
    { id: 'food', facts: FOOD_FACTS },
    { id: 'body', facts: BODY_FACTS },
    { id: 'math', facts: MATH_FACTS },
    { id: 'psychology', facts: PSYCHOLOGY_FACTS },
    { id: 'architecture', facts: ARCHITECTURE_FACTS },
    { id: 'language', facts: LANGUAGE_FACTS },
]

// --- Seed to Supabase ---
async function seedWowFacts() {
    console.log('🚀 Starting WOW-FACTOR trivia seeding (900 mind-blowing facts)...\n')

    // First, clear existing facts to replace with wow-factor ones
    console.log('🗑️  Clearing existing facts...')
    const { error: deleteError } = await supabase
        .from('trivia_facts')
        .delete()
        .neq('category_id', '__never_match__') // delete all rows

    if (deleteError) {
        console.error(`  ❌ Error clearing: ${deleteError.message}`)
        console.log('  ⚠️  Continuing with upsert (will update existing)...\n')
    } else {
        console.log('  ✅ Cleared existing facts\n')
    }

    let totalInserted = 0
    let totalErrors = 0

    for (const cat of WOW_CATEGORIES) {
        console.log(`📁 ${cat.id}: ${cat.facts.length} wow-factor facts`)

        // Upsert in batches of 10
        for (let i = 0; i < cat.facts.length; i += 10) {
            const batch = cat.facts.slice(i, i + 10).map((fact, idx) => ({
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
                console.error(`  ❌ Error batch ${Math.floor(i / 10) + 1}: ${error.message}`)
                totalErrors += batch.length
            } else {
                totalInserted += batch.length
            }
        }
    }

    console.log(`\n✅ Done! ${totalInserted} facts seeded, ${totalErrors} errors.`)
    console.log(`📊 Categories: ${WOW_CATEGORIES.length}`)
    console.log(`📊 Expected total: ${WOW_CATEGORIES.length * 60} (${WOW_CATEGORIES.length} × 60)`)

    // Verify counts
    const { count } = await supabase
        .from('trivia_facts')
        .select('*', { count: 'exact', head: true })
    console.log(`📊 Actual in Supabase: ${count}`)

    // Show breakdown by category
    console.log('\n📋 Category breakdown:')
    for (const cat of WOW_CATEGORIES) {
        const { count: catCount } = await supabase
            .from('trivia_facts')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
        console.log(`   ${cat.id}: ${catCount} facts`)
    }
}

seedWowFacts().catch(console.error)
