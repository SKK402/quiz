// ============================================
// TRIVIA QUIZ MODULE — Overhauled
// ============================================
import { supabase } from './supabase.js'
import { getCurrentUser } from './auth.js'

let quizState = {
    questions: [],
    currentIndex: 0,
    score: 0,            // points (5 per correct, 2 if hint used)
    totalAnswered: 0,
    timer: null,
    timeLeft: 20,
    isActive: false,
    streak: 0,
    hintUsed: false,     // per-question hint flag
    settings: {
        difficulty: 'all',
        category: 'all',
        count: 15,
    },
}

// Timer per difficulty (rebalanced)
const TIMER_BY_DIFFICULTY = {
    easy: 20,
    medium: 40,
    hard: 60,
    all: 40,
}

// Points
const POINTS_CORRECT = 5
const POINTS_WITH_HINT = 2

// Difficulty buckets based on wowScore
function getDifficulty(wowScore) {
    if (wowScore >= 94) return 'hard'
    if (wowScore >= 88) return 'medium'
    return 'easy'
}

// Fisher-Yates shuffle (unbiased)
function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Generate quiz questions from fact data
export function generateQuestions(categories, count = 15, difficulty = 'all', categoryFilter = 'all') {
    let allFacts = []
    categories.forEach(cat => {
        if (categoryFilter !== 'all' && cat.id !== categoryFilter) return
        cat.facts.forEach(fact => {
            if (difficulty !== 'all') {
                const d = getDifficulty(fact.wowScore || 90)
                if (d !== difficulty) return
            }
            allFacts.push({ ...fact, _categoryId: cat.id, _categoryTitle: cat.title })
        })
    })

    const shuffled = shuffle(allFacts)
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

    // Wrong answer pool from ALL facts
    const allFactsPool = []
    categories.forEach(cat => {
        cat.facts.forEach(fact => {
            allFactsPool.push({ ...fact, _categoryId: cat.id, _categoryTitle: cat.title })
        })
    })

    return selected.map(fact => createQuestionFromFact(fact, allFactsPool))
}

function createQuestionFromFact(fact, allFacts) {
    const correctAnswer = fact.title
    // Pick wrong answers from different categories to avoid hint leakage
    const otherFacts = shuffle(allFacts.filter(f => f.title !== fact.title)).slice(0, 3)

    const options = shuffle([
        { text: correctAnswer, correct: true },
        ...otherFacts.map(f => ({ text: f.title, correct: false }))
    ])

    return {
        question: `Which of these is a real fact?`,
        hint: `Category: ${fact._categoryTitle}`,
        options,
        explanation: fact.body,
        sources: fact.sources || [],
        tags: fact.tags || [],
        categoryId: fact._categoryId,
        wowScore: fact.wowScore,
        correctTitle: fact.title,
        difficulty: getDifficulty(fact.wowScore || 90),
    }
}

// ============================================
// LEADERBOARD (Supabase — Global)
// ============================================
async function getLeaderboard() {
    // Global leaderboard — all users
    const { data } = await supabase
        .from('leaderboard')
        .select('score, total, pct, difficulty, category, created_at, display_name')
        .order('score', { ascending: false })
        .limit(20)
    return (data || []).map(e => ({
        score: e.score,
        total: e.total,
        pct: e.pct,
        difficulty: e.difficulty,
        category: e.category,
        date: e.created_at,
        name: e.display_name || 'Anonymous',
    }))
}

async function saveToLeaderboard(score, total, difficulty, category) {
    const user = getCurrentUser()
    if (!user) return
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous'
    await supabase.from('leaderboard').insert({
        user_id: user.id,
        score,
        total,
        pct: Math.round((score / (total * POINTS_CORRECT)) * 100),
        difficulty,
        category,
        display_name: displayName,
    })
}

async function renderLeaderboard() {
    const list = document.getElementById('quiz-leaderboard-list')
    if (!list) return
    const lb = await getLeaderboard()
    list.innerHTML = ''

    if (lb.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:13px;">No scores yet. Be the first on the board!</p>'
        return
    }

    lb.slice(0, 10).forEach((entry, i) => {
        const dateStr = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

        const el = document.createElement('div')
        el.className = 'leaderboard-entry'
        el.innerHTML = `
            <span class="leaderboard-rank">${medal}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-pts">${entry.score} pts</span>
            <span class="leaderboard-detail">${entry.pct}% · ${dateStr}</span>
        `
        list.appendChild(el)
    })
}

// ============================================
// QUIZ SETTINGS UI
// ============================================
function initSettingsUI(categories) {
    const diffOptions = document.getElementById('quiz-difficulty-options')
    if (diffOptions) {
        diffOptions.querySelectorAll('.quiz-setting-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                diffOptions.querySelectorAll('.quiz-setting-btn').forEach(b => b.classList.remove('selected'))
                btn.classList.add('selected')
                quizState.settings.difficulty = btn.dataset.value
                updateTimerPreview()
            })
        })
    }

    const countOptions = document.getElementById('quiz-count-options')
    if (countOptions) {
        countOptions.querySelectorAll('.quiz-setting-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                countOptions.querySelectorAll('.quiz-setting-btn').forEach(b => b.classList.remove('selected'))
                btn.classList.add('selected')
                quizState.settings.count = parseInt(btn.dataset.value)
                document.getElementById('quiz-stat-count').textContent = btn.dataset.value
            })
        })
    }

    const catSelect = document.getElementById('quiz-category-select')
    if (catSelect) {
        categories.forEach(cat => {
            const opt = document.createElement('option')
            opt.value = cat.id
            opt.textContent = `${cat.icon} ${cat.title}`
            catSelect.appendChild(opt)
        })
        catSelect.addEventListener('change', () => {
            quizState.settings.category = catSelect.value
        })
    }

    updateTimerPreview()
}

function updateTimerPreview() {
    const timer = TIMER_BY_DIFFICULTY[quizState.settings.difficulty] || 40
    const el = document.getElementById('quiz-stat-timer')
    if (el) el.textContent = `${timer}s`
}

// ============================================
// QUIZ LIFECYCLE
// ============================================
export function initQuiz(categories) {
    const quizView = document.getElementById('quiz-view')
    if (!quizView) return

    initSettingsUI(categories)

    document.getElementById('quiz-start-btn')?.addEventListener('click', () => {
        startQuiz(categories)
    })

    document.getElementById('quiz-next-btn')?.addEventListener('click', () => {
        nextQuestion()
    })

    document.getElementById('quiz-restart-btn')?.addEventListener('click', () => {
        document.getElementById('quiz-results').classList.add('hidden')
        document.getElementById('quiz-intro').classList.remove('hidden')
        document.getElementById('quiz-progress').style.display = ''
        document.getElementById('quiz-timer-bar').style.display = ''
    })

    document.getElementById('quiz-back-btn')?.addEventListener('click', () => {
        stopQuiz()
        document.getElementById('quiz-view').classList.remove('active')
        document.getElementById('landing-view').classList.add('active')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    // Hint button
    document.getElementById('quiz-hint-btn')?.addEventListener('click', () => {
        if (quizState.hintUsed) return
        quizState.hintUsed = true
        const hintEl = document.getElementById('quiz-hint')
        hintEl.classList.remove('hidden')
        hintEl.classList.add('revealed')
        document.getElementById('quiz-hint-btn').classList.add('used')
    })
}

function startQuiz(categories) {
    const { difficulty, category, count } = quizState.settings
    quizState.questions = generateQuestions(categories, count, difficulty, category)

    if (quizState.questions.length === 0) {
        alert('Not enough facts for this combination! Try different settings.')
        return
    }

    quizState.currentIndex = 0
    quizState.score = 0
    quizState.totalAnswered = 0
    quizState.isActive = true
    quizState.streak = 0

    document.getElementById('quiz-intro').classList.add('hidden')
    document.getElementById('quiz-results').classList.add('hidden')
    document.getElementById('quiz-question-area').classList.remove('hidden')
    document.getElementById('quiz-explanation-area').classList.add('hidden')
    document.getElementById('quiz-correct-answer').classList.add('hidden')
    document.getElementById('quiz-progress').style.display = ''
    document.getElementById('quiz-timer-bar').style.display = ''

    showQuestion()
}

function stopQuiz() {
    quizState.isActive = false
    clearInterval(quizState.timer)
}

function showQuestion() {
    const q = quizState.questions[quizState.currentIndex]
    if (!q) { showResults(); return }

    // Reset hint state for this question
    quizState.hintUsed = false
    const hintEl = document.getElementById('quiz-hint')
    hintEl.textContent = q.hint
    hintEl.classList.add('hidden')
    hintEl.classList.remove('revealed')
    document.getElementById('quiz-hint-btn').classList.remove('used')
    document.getElementById('quiz-hint-btn').style.display = ''

    // Update progress
    document.getElementById('quiz-progress-text').textContent =
        `Question ${quizState.currentIndex + 1} of ${quizState.questions.length}`
    document.getElementById('quiz-score-display').textContent = `⭐ ${quizState.score} pts`

    // Progress bar
    const pct = ((quizState.currentIndex) / quizState.questions.length) * 100
    document.getElementById('quiz-progress-fill').style.width = `${pct}%`

    // Question text
    const diffEmoji = q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢'
    document.getElementById('quiz-question-text').textContent = q.question

    // Streak display
    const streakEl = document.getElementById('quiz-streak-display')
    const streakCount = document.getElementById('quiz-streak-count')
    if (quizState.streak >= 2) {
        streakEl.classList.remove('hidden')
        streakCount.textContent = quizState.streak
    } else {
        streakEl.classList.add('hidden')
    }

    // Options
    const optionsContainer = document.getElementById('quiz-options')
    optionsContainer.innerHTML = ''
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button')
        btn.className = 'quiz-option'
        btn.innerHTML = `<span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span><span class="quiz-option-text">${opt.text}</span>`
        btn.addEventListener('click', () => handleAnswer(btn, opt, q))
        optionsContainer.appendChild(btn)
    })

    // Reset UI states
    document.getElementById('quiz-emoji-reaction').classList.add('hidden')
    document.getElementById('quiz-explanation-area').classList.add('hidden')
    document.getElementById('quiz-next-btn').classList.add('hidden')
    document.getElementById('quiz-question-area').classList.remove('hidden')
    document.getElementById('quiz-correct-answer').classList.add('hidden')

    startTimer()
}

function startTimer() {
    const timerDuration = TIMER_BY_DIFFICULTY[quizState.settings.difficulty] || 40
    quizState.timeLeft = timerDuration
    clearInterval(quizState.timer)
    updateTimerDisplay(timerDuration)

    quizState.timer = setInterval(() => {
        quizState.timeLeft--
        updateTimerDisplay(timerDuration)
        if (quizState.timeLeft <= 0) {
            clearInterval(quizState.timer)
            handleTimeout()
        }
    }, 1000)
}

function updateTimerDisplay(maxTime = 40) {
    const seconds = quizState.timeLeft
    const timerEl = document.getElementById('quiz-timer')
    const timerFill = document.getElementById('quiz-timer-fill')

    timerEl.textContent = `${seconds}s`
    const pct = (seconds / maxTime) * 100
    timerFill.style.width = `${pct}%`

    if (seconds <= 5) {
        timerEl.classList.add('danger')
        timerFill.classList.add('danger')
        timerEl.classList.remove('warning')
        timerFill.classList.remove('warning')
    } else if (seconds <= 10) {
        timerEl.classList.add('warning')
        timerEl.classList.remove('danger')
        timerFill.classList.add('warning')
        timerFill.classList.remove('danger')
    } else {
        timerEl.classList.remove('warning', 'danger')
        timerFill.classList.remove('warning', 'danger')
    }
}

function handleAnswer(btnEl, option, question) {
    clearInterval(quizState.timer)
    quizState.totalAnswered++

    // Disable all options
    const allBtns = document.querySelectorAll('.quiz-option')
    allBtns.forEach(b => {
        b.disabled = true
        b.classList.add('disabled')
    })

    // Highlight correct / wrong
    allBtns.forEach(b => {
        const optText = b.querySelector('.quiz-option-text').textContent
        const isCorrect = question.options.find(o => o.text === optText)?.correct
        if (isCorrect) b.classList.add('correct')
    })

    // Hide hint button after answering
    document.getElementById('quiz-hint-btn').style.display = 'none'

    const emojiReaction = document.getElementById('quiz-emoji-reaction')
    const correctAnswerEl = document.getElementById('quiz-correct-answer')

    if (option.correct) {
        const pointsEarned = quizState.hintUsed ? POINTS_WITH_HINT : POINTS_CORRECT
        quizState.score += pointsEarned
        quizState.streak++
        btnEl.classList.add('correct')

        // Streak messages
        let streakText = ''
        if (quizState.streak >= 5) streakText = ' · 💎 Unstoppable!'
        else if (quizState.streak >= 3) streakText = ' · 🔥 On Fire!'

        const ptsClass = quizState.hintUsed ? 'reduced' : 'full'
        emojiReaction.innerHTML = `<span class="emoji-pop">🎉</span><span class="emoji-text">Correct!${streakText}</span><span class="quiz-points-earned ${ptsClass}">+${pointsEarned} pts${quizState.hintUsed ? ' (hint)' : ''}</span>`
        emojiReaction.className = 'quiz-emoji-reaction correct'
        correctAnswerEl.classList.add('hidden')
    } else {
        quizState.streak = 0
        btnEl.classList.add('wrong')
        emojiReaction.innerHTML = '<span class="emoji-pop">❌</span><span class="emoji-text">Wrong!</span><span class="quiz-points-earned zero">+0 pts</span>'
        emojiReaction.className = 'quiz-emoji-reaction wrong'
        correctAnswerEl.textContent = `✅ The correct answer was: "${question.correctTitle}"`
        correctAnswerEl.classList.remove('hidden')
    }
    emojiReaction.classList.remove('hidden')

    // Update score
    document.getElementById('quiz-score-display').textContent = `⭐ ${quizState.score} pts`

    // Update streak display
    const streakEl = document.getElementById('quiz-streak-display')
    const streakCount = document.getElementById('quiz-streak-count')
    if (quizState.streak >= 2) {
        streakEl.classList.remove('hidden')
        streakCount.textContent = quizState.streak
    } else {
        streakEl.classList.add('hidden')
    }

    showExplanation(question)
}

function handleTimeout() {
    quizState.totalAnswered++
    quizState.streak = 0

    const allBtns = document.querySelectorAll('.quiz-option')
    allBtns.forEach(b => {
        b.disabled = true
        b.classList.add('disabled')
        const optText = b.querySelector('.quiz-option-text').textContent
        const q = quizState.questions[quizState.currentIndex]
        const isCorrect = q.options.find(o => o.text === optText)?.correct
        if (isCorrect) b.classList.add('correct')
    })

    document.getElementById('quiz-hint-btn').style.display = 'none'

    const emojiReaction = document.getElementById('quiz-emoji-reaction')
    emojiReaction.innerHTML = '<span class="emoji-pop">⏰</span><span class="emoji-text">Time\'s Up!</span><span class="quiz-points-earned zero">+0 pts</span>'
    emojiReaction.className = 'quiz-emoji-reaction wrong'
    emojiReaction.classList.remove('hidden')

    const q = quizState.questions[quizState.currentIndex]
    const correctAnswerEl = document.getElementById('quiz-correct-answer')
    correctAnswerEl.textContent = `✅ The correct answer was: "${q.correctTitle}"`
    correctAnswerEl.classList.remove('hidden')

    // Update streak display
    document.getElementById('quiz-streak-display').classList.add('hidden')

    showExplanation(q)
}

function showExplanation(question) {
    const area = document.getElementById('quiz-explanation-area')

    document.getElementById('quiz-explanation-title').textContent = question.correctTitle
    document.getElementById('quiz-explanation-body').textContent = question.explanation

    const tagsEl = document.getElementById('quiz-explanation-tags')
    tagsEl.innerHTML = ''
    question.tags.forEach(tag => {
        const t = document.createElement('span')
        t.className = 'quiz-explanation-tag'
        t.textContent = tag
        tagsEl.appendChild(t)
    })

    const sourcesEl = document.getElementById('quiz-explanation-sources')
    sourcesEl.innerHTML = ''
    question.sources.forEach(src => {
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

    area.classList.remove('hidden')
    document.getElementById('quiz-next-btn').classList.remove('hidden')

    const isLast = quizState.currentIndex >= quizState.questions.length - 1
    document.getElementById('quiz-next-btn').textContent = isLast ? 'See Results' : 'Next Question →'
}

function nextQuestion() {
    quizState.currentIndex++
    if (quizState.currentIndex >= quizState.questions.length) {
        showResults()
    } else {
        showQuestion()
    }
}

async function showResults() {
    stopQuiz()
    document.getElementById('quiz-question-area').classList.add('hidden')
    document.getElementById('quiz-explanation-area').classList.add('hidden')
    document.getElementById('quiz-next-btn').classList.add('hidden')
    document.getElementById('quiz-emoji-reaction').classList.add('hidden')
    document.getElementById('quiz-correct-answer').classList.add('hidden')
    document.getElementById('quiz-streak-display').classList.add('hidden')
    document.getElementById('quiz-results').classList.remove('hidden')

    const pct = Math.round((quizState.score / (quizState.questions.length * POINTS_CORRECT)) * 100)
    document.getElementById('quiz-final-score').textContent = `${quizState.score} pts`
    document.getElementById('quiz-final-pct').textContent = `${pct}%`
    document.getElementById('quiz-progress-fill').style.width = '100%'

    // Emoji grade (based on percentage of max points)
    let grade, gradeEmoji
    if (pct >= 90) { grade = 'Trivia Master!'; gradeEmoji = '🏆' }
    else if (pct >= 70) { grade = 'Expert!'; gradeEmoji = '🌟' }
    else if (pct >= 50) { grade = 'Good Job!'; gradeEmoji = '👍' }
    else if (pct >= 30) { grade = 'Keep Learning!'; gradeEmoji = '📚' }
    else { grade = 'Rookie!'; gradeEmoji = '🌱' }

    document.getElementById('quiz-grade').textContent = `${gradeEmoji} ${grade}`

    // Save to leaderboard (score is now total points)
    await saveToLeaderboard(quizState.score, quizState.questions.length, quizState.settings.difficulty, quizState.settings.category)

    // Render global leaderboard
    await renderLeaderboard()
}
