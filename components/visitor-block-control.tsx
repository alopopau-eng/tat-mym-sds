"use client"

import { useEffect, useState } from "react"

const Button = ({ children, onClick, disabled, variant, className, ...props }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === "outline"
        ? "border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700"
        : variant === "destructive"
        ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
        : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
    } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className || ""}`}
    {...props}
  >
    {children}
  </button>
)

import type { InsuranceApplication } from "@/lib/firestore-types"
import { updateApplication } from "@/lib/firebase-services"

interface VisitorBlockControlProps {
  visitor: InsuranceApplication
}

export function VisitorBlockControl({ visitor }: VisitorBlockControlProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [customPageTitle, setCustomPageTitle] = useState("")
  const [customPageText, setCustomPageText] = useState("")

  const [draftCustomPageTitle, setDraftCustomPageTitle] = useState("")
  const [draftCustomPageText, setDraftCustomPageText] = useState("")

  useEffect(() => {
    setCustomPageTitle(visitor.customPageTitle || "")
    setCustomPageText(visitor.customPageText || "")
  }, [visitor.id, visitor.customPageTitle, visitor.customPageText])

  const handleOpenDialog = () => {
    setDraftCustomPageTitle(customPageTitle)
    setDraftCustomPageText(customPageText)
    setIsDialogOpen(true)
  }

  const handleSaveCustomContent = async () => {
    if (!visitor.id) return

    setIsSavingContent(true)

    try {
      const now = new Date().toISOString()
      const nextTitle = draftCustomPageTitle.trim()
      const nextText = draftCustomPageText.trim()

      await updateApplication(visitor.id, {
        customPageTitle: nextTitle,
        customPageText: nextText,
        customPageUpdatedAt: now,
      })

      setCustomPageTitle(nextTitle)
      setCustomPageText(nextText)
      setIsDialogOpen(false)

      alert("تم حفظ المحتوى المخصص بنجاح")
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء حفظ المحتوى")
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleRedirectToCustomPage = async () => {
    if (!visitor.id) return

    setIsRedirecting(true)

    try {
      const now = new Date().toISOString()

      await updateApplication(visitor.id, {
        redirectPage: "blocked",
        redirectRequestedAt: now,
        customPageTitle: customPageTitle.trim(),
        customPageText: customPageText.trim(),
        customPageUpdatedAt: now,
      })

      alert("تم توجيه الزائر للصفحة المخصصة")
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء التوجيه")
    } finally {
      setIsRedirecting(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!visitor.id) return

    const confirmMessage = visitor.isBlocked
      ? "هل أنت متأكد من إلغاء الحظر؟"
      : "هل أنت متأكد من حظر هذا الزائر؟"

    if (!confirm(confirmMessage)) return

    setIsProcessing(true)

    try {
      const nextBlockedState = !visitor.isBlocked
      const now = new Date().toISOString()

      const updates: Partial<InsuranceApplication> = {
        isBlocked: nextBlockedState,
        blockedUpdatedAt: now,
      }

      if (nextBlockedState) {
        updates.redirectPage = "blocked"
        updates.redirectRequestedAt = now
        updates.customPageTitle = customPageTitle.trim()
        updates.customPageText = customPageText.trim()
        updates.customPageUpdatedAt = now
      }

      await updateApplication(visitor.id, updates)

      alert(visitor.isBlocked ? "تم إلغاء الحظر" : "تم حظر الزائر")
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء التحديث")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm sm:p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 sm:text-base">حظر الزائر والمحتوى المخصص</h3>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          onClick={handleOpenDialog}
          disabled={isSavingContent}
          variant="outline"
          className="w-full text-sm sm:text-base"
        >
          تخصيص محتوى الصفحة
        </Button>

        <Button
          onClick={handleRedirectToCustomPage}
          disabled={isRedirecting}
          variant="outline"
          className="w-full border-blue-300 text-sm text-blue-700 hover:border-blue-400 sm:text-base"
        >
          {isRedirecting ? "جاري التوجيه..." : "توجيه للصفحة المخصصة"}
        </Button>
      </div>

      <Button
        onClick={handleToggleBlock}
        disabled={isProcessing}
        variant={visitor.isBlocked ? "default" : "destructive"}
        className="w-full text-sm sm:text-base"
      >
        {isProcessing
          ? "جاري التحديث..."
          : visitor.isBlocked
          ? "إلغاء الحظر"
          : "حظر الزائر"}
      </Button>

      {visitor.isBlocked && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 sm:p-3">
          <p className="text-center text-xs text-red-700 sm:text-sm">
            هذا الزائر محظور حالياً ولا يمكنه الوصول إلى الخدمة
          </p>
          {(visitor.customPageTitle || visitor.customPageText) && (
            <div className="mt-2 text-xs text-red-700 sm:text-sm">
              {visitor.customPageTitle && (
                <p className="break-words">
                  <span className="font-semibold">العنوان:</span> {visitor.customPageTitle}
                </p>
              )}
              {visitor.customPageText && (
                <p className="mt-1 whitespace-pre-wrap break-words">
                  <span className="font-semibold">النص:</span> {visitor.customPageText}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-xl">
            <div className="border-b px-4 py-3">
              <h4 className="text-sm font-semibold text-gray-900 sm:text-base">تعديل المحتوى المخصص للزائر</h4>
            </div>

            <div className="space-y-3 overflow-y-auto p-4">
              <div>
                <label className="mb-1 block text-xs text-gray-600">عنوان الصفحة المخصصة</label>
                <input
                  type="text"
                  value={draftCustomPageTitle}
                  onChange={(e) => setDraftCustomPageTitle(e.target.value)}
                  placeholder="مثال: تم إيقاف الخدمة مؤقتاً"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">نص الصفحة المخصصة</label>
                <textarea
                  value={draftCustomPageText}
                  onChange={(e) => setDraftCustomPageText(e.target.value)}
                  placeholder="أدخل النص الذي سيظهر للزائر..."
                  rows={6}
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t px-4 py-3 sm:grid-cols-2">
              <Button
                onClick={handleSaveCustomContent}
                disabled={isSavingContent}
                className="flex-1"
              >
                {isSavingContent ? "جاري الحفظ..." : "حفظ"}
              </Button>

              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}