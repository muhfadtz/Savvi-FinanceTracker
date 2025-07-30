"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type Language = "en" | "id"
export type Currency = "USD" | "IDR" | "EUR" | "SGD" | "GBP" | "JPY" | "AUD" | "CAD"

interface SettingsContextType {
  language: Language
  currency: Currency
  darkMode: boolean
  setLanguage: (lang: Language) => void
  setCurrency: (curr: Currency) => void
  setDarkMode: (dark: boolean) => void
  t: (key: string) => string
  formatCurrency: (amount: number, showSymbol?: boolean) => string
}

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    transactions: "Transactions",
    goals: "Goals",
    owed: "Owed",
    profile: "Profile",

    // Dashboard
    welcome_back: "Welcome back!",
    total_balance: "Total Balance",
    goals_progress: "Goals Progress",
    net_debt: "Net Debt",
    you_owe: "You owe",
    others_owe_you: "Others owe you",
    monthly_summary: "Monthly Summary",
    money_buckets: "Money Buckets",
    recent_transactions: "Recent Transactions",
    no_buckets_yet: "No buckets created yet",
    no_transactions_yet: "No transactions yet",
    income: "Income",
    expense: "Expense",

    // Transactions
    track_income_expenses: "Track your income and expenses",
    add_transaction: "Add Transaction",
    edit_transaction: "Edit Transaction",
    type: "Type",
    amount: "Amount",
    category: "Category",
    money_bucket: "Money Bucket",
    description_optional: "Description (Optional)",
    date: "Date",
    goal_allocation_optional: "Goal Allocation (Optional)",
    goal: "Goal",
    select_category: "Select category",
    select_bucket: "Select bucket",
    select_goal: "Select goal",
    add_note: "Add a note...",
    cancel: "Cancel",
    update: "Update",
    saving: "Saving...",
    update_transaction: "Update Transaction",

    // Goals
    financial_goals: "Financial Goals",
    track_savings_targets: "Track your savings targets",
    add_goal: "Add Goal",
    create_new_goal: "Create New Goal",
    edit_goal: "Edit Goal",
    goal_title: "Goal Title",
    target_amount: "Target Amount",
    create_goal: "Create Goal",
    update_goal: "Update Goal",
    active_goals: "Active Goals",
    completed_goals: "Completed Goals",
    no_active_goals: "No active goals yet",
    create_first_goal: "Create your first financial goal to start saving",
    progress: "Progress",
    remaining: "remaining",
    target: "Target",
    goal_completed: "Goal Completed!",

    // Owed
    debt_management: "Debt Management",
    track_debts: "Track what you owe and what others owe you",
    add_debt: "Add Debt",
    add_new_debt: "Add New Debt",
    edit_debt: "Edit Debt",
    i_owe_someone: "I owe someone",
    someone_owes_me: "Someone owes me",
    person_name: "Person's Name",
    due_date_optional: "Due Date (Optional)",
    enter_name: "Enter name",
    i_owe: "I Owe",
    owed_to_me: "Owed to Me",
    no_debts_recorded: "No debts recorded",
    add_debts_you_owe: "Add debts you owe to others",
    no_receivables_recorded: "No receivables recorded",
    add_money_others_owe: "Add money others owe you",
    due: "Due",
    overdue: "Overdue",
    paid: "Paid",

    // Profile
    manage_account: "Manage your account and settings",
    edit_profile: "Edit Profile",
    change_avatar: "Change Avatar",
    name: "Name",
    email: "Email",
    email_cannot_change: "Email cannot be changed",
    save_changes: "Save Changes",
    financial_overview: "Financial Overview",
    total_debt: "Total Debt",
    receivables: "Receivables",
    add_bucket: "Add Bucket",
    add_new_bucket: "Add New Bucket",
    edit_bucket: "Edit Bucket",
    bucket_name: "Bucket Name",
    initial_balance: "Initial Balance",
    settings: "Settings",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",
    toggle_theme: "Toggle dark/light theme",
    language: "Language",
    currency: "Currency",
    sign_out: "Sign Out",

    // Auth
    welcome_back_signin: "Welcome back! Sign in to continue",
    create_account_start: "Create your account to get started",
    reset_password: "Reset your password",
    full_name: "Full Name",
    password: "Password",
    sign_in: "Sign In",
    create_account: "Create Account",
    forgot_password: "Forgot password?",
    dont_have_account: "Don't have an account?",
    sign_up: "Sign up",
    already_have_account: "Already have an account?",
    back_to_signin: "Back to sign in",
    loading: "Loading...",
    check_email_verification: "Check your email for verification link!",
    password_reset_sent: "Password reset email sent!",

    // Categories
    salary: "Salary",
    freelance: "Freelance",
    investment: "Investment",
    gift: "Gift",
    other: "Other",
    food: "Food",
    transport: "Transport",
    shopping: "Shopping",
    bills: "Bills",
    entertainment: "Entertainment",
    health: "Health",

    // Common
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    confirm_delete: "Are you sure you want to delete this?",
    confirm_signout: "Are you sure you want to sign out?",
  },
  id: {
    // Navigation
    dashboard: "Beranda",
    transactions: "Transaksi",
    goals: "Target",
    owed: "Hutang",
    profile: "Profil",

    // Dashboard
    welcome_back: "Selamat datang kembali!",
    total_balance: "Total Saldo",
    goals_progress: "Progress Target",
    net_debt: "Hutang Bersih",
    you_owe: "Anda berhutang",
    others_owe_you: "Orang lain berhutang",
    monthly_summary: "Ringkasan Bulanan",
    money_buckets: "Dompet Digital",
    recent_transactions: "Transaksi Terbaru",
    no_buckets_yet: "Belum ada dompet yang dibuat",
    no_transactions_yet: "Belum ada transaksi",
    income: "Pemasukan",
    expense: "Pengeluaran",

    // Transactions
    track_income_expenses: "Lacak pemasukan dan pengeluaran Anda",
    add_transaction: "Tambah Transaksi",
    edit_transaction: "Edit Transaksi",
    type: "Jenis",
    amount: "Jumlah",
    category: "Kategori",
    money_bucket: "Dompet Digital",
    description_optional: "Deskripsi (Opsional)",
    date: "Tanggal",
    goal_allocation_optional: "Alokasi Target (Opsional)",
    goal: "Target",
    select_category: "Pilih kategori",
    select_bucket: "Pilih dompet",
    select_goal: "Pilih target",
    add_note: "Tambah catatan...",
    cancel: "Batal",
    update: "Perbarui",
    saving: "Menyimpan...",
    update_transaction: "Perbarui Transaksi",

    // Goals
    financial_goals: "Target Keuangan",
    track_savings_targets: "Lacak target tabungan Anda",
    add_goal: "Tambah Target",
    create_new_goal: "Buat Target Baru",
    edit_goal: "Edit Goal",
    goal_title: "Judul Target",
    target_amount: "Jumlah Target",
    create_goal: "Buat Target",
    update_goal: "Perbarui Target",
    active_goals: "Target Aktif",
    completed_goals: "Target Selesai",
    no_active_goals: "Belum ada target aktif",
    create_first_goal: "Buat target keuangan pertama Anda untuk mulai menabung",
    progress: "Progress",
    remaining: "tersisa",
    target: "Target",
    goal_completed: "Target Tercapai!",

    // Owed
    debt_management: "Manajemen Hutang",
    track_debts: "Lacak hutang Anda dan piutang dari orang lain",
    add_debt: "Tambah Hutang",
    add_new_debt: "Tambah Hutang Baru",
    edit_debt: "Edit Hutang",
    i_owe_someone: "Saya berhutang",
    someone_owes_me: "Orang lain berhutang",
    person_name: "Nama Orang",
    due_date_optional: "Tanggal Jatuh Tempo (Opsional)",
    enter_name: "Masukkan nama",
    i_owe: "Saya Berhutang",
    owed_to_me: "Piutang Saya",
    no_debts_recorded: "Belum ada hutang tercatat",
    add_debts_you_owe: "Tambah hutang yang Anda miliki",
    no_receivables_recorded: "Belum ada piutang tercatat",
    add_money_others_owe: "Tambah uang yang orang lain hutang",
    due: "Jatuh tempo",
    overdue: "Terlambat",
    paid: "Lunas",

    // Profile
    manage_account: "Kelola akun dan pengaturan Anda",
    edit_profile: "Edit Profil",
    change_avatar: "Ganti Avatar",
    name: "Nama",
    email: "Email",
    email_cannot_change: "Email tidak dapat diubah",
    save_changes: "Simpan Perubahan",
    financial_overview: "Ringkasan Keuangan",
    total_debt: "Total Hutang",
    receivables: "Piutang",
    add_bucket: "Tambah Dompet",
    add_new_bucket: "Tambah Dompet Baru",
    edit_bucket: "Edit Dompet",
    bucket_name: "Nama Dompet",
    initial_balance: "Saldo Awal",
    settings: "Pengaturan",
    dark_mode: "Mode Gelap",
    light_mode: "Mode Terang",
    toggle_theme: "Ubah tema gelap/terang",
    language: "Bahasa",
    currency: "Mata Uang",
    sign_out: "Keluar",

    // Auth
    welcome_back_signin: "Selamat datang kembali! Masuk untuk melanjutkan",
    create_account_start: "Buat akun Anda untuk memulai",
    reset_password: "Reset kata sandi Anda",
    full_name: "Nama Lengkap",
    password: "Kata Sandi",
    sign_in: "Masuk",
    create_account: "Buat Akun",
    forgot_password: "Lupa kata sandi?",
    dont_have_account: "Belum punya akun?",
    sign_up: "Daftar",
    already_have_account: "Sudah punya akun?",
    back_to_signin: "Kembali ke masuk",
    loading: "Memuat...",
    check_email_verification: "Periksa email Anda untuk link verifikasi!",
    password_reset_sent: "Email reset kata sandi telah dikirim!",

    // Categories
    salary: "Gaji",
    freelance: "Freelance",
    investment: "Investasi",
    gift: "Hadiah",
    other: "Lainnya",
    food: "Makanan",
    transport: "Transportasi",
    shopping: "Belanja",
    bills: "Tagihan",
    entertainment: "Hiburan",
    health: "Kesehatan",

    // Common
    add: "Tambah",
    edit: "Edit",
    delete: "Hapus",
    confirm_delete: "Apakah Anda yakin ingin menghapus ini?",
    confirm_signout: "Apakah Anda yakin ingin keluar?",
  },
}

const currencyConfig = {
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  IDR: { symbol: "Rp", code: "IDR", name: "Indonesian Rupiah" },
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
  SGD: { symbol: "S$", code: "SGD", name: "Singapore Dollar" },
  GBP: { symbol: "£", code: "GBP", name: "British Pound" },
  JPY: { symbol: "¥", code: "JPY", name: "Japanese Yen" },
  AUD: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  CAD: { symbol: "C$", code: "CAD", name: "Canadian Dollar" },
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    // Load settings from localStorage
    const savedLanguage = localStorage.getItem("savvi-language") as Language
    const savedCurrency = localStorage.getItem("savvi-currency") as Currency
    const savedDarkMode = localStorage.getItem("savvi-darkmode")

    if (savedLanguage) setLanguage(savedLanguage)
    if (savedCurrency) setCurrency(savedCurrency)

    // ✅ APPLY INITIAL THEME with correct colors
    const isDark = savedDarkMode !== null ? savedDarkMode === "true" : true
    setDarkMode(isDark)

    // Apply theme immediately
    const html = document.documentElement
    const body = document.body

    if (isDark) {
      html.classList.add("dark")
      body.classList.add("dark")
      body.style.backgroundColor = "#000000" // ✅ Hitam murni
      body.style.color = "#ffffff"
    } else {
      html.classList.add("light")
      body.classList.add("light")
      body.style.backgroundColor = "#f8fafc" // ✅ Abu-abu terang
      body.style.color = "#0f172a"
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("savvi-language", lang)
  }

  const handleSetCurrency = (curr: Currency) => {
    setCurrency(curr)
    localStorage.setItem("savvi-currency", curr)
  }

  // Fix theme functionality - add immediate DOM updates
  const handleSetDarkMode = (dark: boolean) => {
    console.log("🎨 Theme change:", dark ? "dark" : "light")
    setDarkMode(dark)
    localStorage.setItem("savvi-darkmode", dark.toString())

    // ✅ IMMEDIATE DOM UPDATES with correct colors
    const html = document.documentElement
    const body = document.body

    if (dark) {
      html.classList.add("dark")
      html.classList.remove("light")
      body.classList.add("dark")
      body.classList.remove("light")
      body.style.backgroundColor = "#000000" // ✅ Hitam murni
      body.style.color = "#ffffff"
    } else {
      html.classList.remove("dark")
      html.classList.add("light")
      body.classList.remove("dark")
      body.classList.add("light")
      body.style.backgroundColor = "#f8fafc" // ✅ Abu-abu terang
      body.style.color = "#0f172a"
    }

    // Force re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { darkMode: dark } }))
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  const formatCurrency = (amount: number, showSymbol = true): string => {
    const config = currencyConfig[currency]

    // For IDR and JPY, use no decimal places
    const minimumFractionDigits = currency === "IDR" || currency === "JPY" ? 0 : 2
    const maximumFractionDigits = currency === "IDR" || currency === "JPY" ? 0 : 2

    const formattedAmount = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(Math.round(amount)) // Round IDR amounts to whole numbers

    return showSymbol ? `${config.symbol}${formattedAmount}` : formattedAmount
  }

  return (
    <SettingsContext.Provider
      value={{
        language,
        currency,
        darkMode,
        setLanguage: handleSetLanguage,
        setCurrency: handleSetCurrency,
        setDarkMode: handleSetDarkMode,
        t,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

export { currencyConfig }
