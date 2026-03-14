// ============================================
// AUTH MODULE — Google OAuth via Supabase
// ============================================
import { supabase } from './supabase.js'

let currentUser = null
let authChangeCallbacks = []

// ============================================
// AUTH STATE
// ============================================
export function getCurrentUser() {
    return currentUser
}

export function onAuthChange(callback) {
    authChangeCallbacks.push(callback)
}

function notifyAuthChange(user) {
    currentUser = user
    authChangeCallbacks.forEach(cb => cb(user))
}

// ============================================
// AUTH ACTIONS
// ============================================
export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname,
        },
    })
    if (error) {
        console.error('Google sign-in error:', error.message)
        showAuthError('Failed to sign in with Google. Please try again.')
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign-out error:', error.message)
}

// ============================================
// AUTH UI
// ============================================
export function renderAuthUI() {
    updateAuthDisplay(currentUser)
}

function updateAuthDisplay(user) {
    const authBtn = document.getElementById('auth-btn')
    const userProfile = document.getElementById('user-profile')
    const userName = document.getElementById('user-name')
    const userAvatar = document.getElementById('user-avatar')

    if (!authBtn || !userProfile) return

    if (user) {
        authBtn.classList.add('hidden')
        userProfile.classList.remove('hidden')

        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        const avatar = user.user_metadata?.avatar_url
        userName.textContent = name

        if (avatar) {
            userAvatar.src = avatar
            userAvatar.classList.remove('hidden')
        } else {
            userAvatar.classList.add('hidden')
        }
    } else {
        authBtn.classList.remove('hidden')
        userProfile.classList.add('hidden')
    }
}

function showAuthError(message) {
    // Brief toast notification
    const toast = document.createElement('div')
    toast.className = 'auth-toast auth-toast-error'
    toast.textContent = message
    document.body.appendChild(toast)
    requestAnimationFrame(() => toast.classList.add('visible'))
    setTimeout(() => {
        toast.classList.remove('visible')
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

export function showAuthToast(message) {
    const toast = document.createElement('div')
    toast.className = 'auth-toast auth-toast-success'
    toast.textContent = message
    document.body.appendChild(toast)
    requestAnimationFrame(() => toast.classList.add('visible'))
    setTimeout(() => {
        toast.classList.remove('visible')
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

// ============================================
// INIT AUTH
// ============================================
export async function initAuth() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null
        notifyAuthChange(user)
        updateAuthDisplay(user)

        if (event === 'SIGNED_IN') {
            showAuthToast(`Welcome, ${user.user_metadata?.full_name || user.email}!`)
        } else if (event === 'SIGNED_OUT') {
            showAuthToast('Signed out successfully')
        }
    })

    // Check existing session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
        currentUser = session.user
        notifyAuthChange(session.user)
        updateAuthDisplay(session.user)
    }

    // Auth button click
    document.getElementById('auth-btn')?.addEventListener('click', signInWithGoogle)
    document.getElementById('auth-logout-btn')?.addEventListener('click', signOut)
}
