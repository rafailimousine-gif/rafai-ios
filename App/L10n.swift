import Foundation

/// Textes natifs de l'appli (la page de réservation gère les siens) : français, anglais, arabe, chinois.
enum L10n {
    static func deviceLang() -> String {
        norm(Locale.preferredLanguages.first ?? "fr")
    }

    static func norm(_ l: String) -> String {
        let x = l.lowercased()
        if x.hasPrefix("fr") { return "fr" }
        if x.hasPrefix("ar") { return "ar" }
        if x.hasPrefix("zh") { return "zh" }
        return x.hasPrefix("en") ? "en" : "fr"
    }

    static func s(_ key: String, _ lang: String) -> String {
        if let v = table[lang]?[key] { return v }
        return table["fr"]?[key] ?? key
    }

    static let table: [String: [String: String]] = [
        "fr": [
            "book": "Réserver", "rides": "Mes courses", "acc": "Compte", "contact": "Contact",
            "tagline": "Chauffeur privé à Paris", "avail": "24h/24 · 7j/7",
            "call": "Appeler",
            "whatsapp": "WhatsApp", "email": "E-mail", "web": "Site internet", "insta": "Instagram",
            "office": "Adresse", "legal": "Informations", "cgv": "Conditions générales de vente",
            "privacy": "Politique de confidentialité",
            "offT": "Pas de connexion internet", "offS": "Vérifiez le Wi-Fi ou les données mobiles, puis réessayez. Vous pouvez toujours nous appeler.",
            "retry": "Réessayer", "cancel": "Annuler", "version": "Version"
        ],
        "en": [
            "book": "Book", "rides": "My rides", "acc": "Account", "contact": "Contact",
            "tagline": "Private chauffeur in Paris", "avail": "24/7",
            "call": "Call",
            "whatsapp": "WhatsApp", "email": "Email", "web": "Website", "insta": "Instagram",
            "office": "Address", "legal": "Information", "cgv": "Terms and conditions",
            "privacy": "Privacy policy",
            "offT": "No internet connection", "offS": "Check Wi-Fi or mobile data, then try again. You can still call us.",
            "retry": "Try again", "cancel": "Cancel", "version": "Version"
        ],
        "ar": [
            "book": "احجز", "rides": "رحلاتي", "acc": "الحساب", "contact": "اتصل بنا",
            "tagline": "سائق خاص في باريس", "avail": "على مدار الساعة",
            "call": "اتصال",
            "whatsapp": "واتساب", "email": "البريد الإلكتروني", "web": "الموقع", "insta": "إنستغرام",
            "office": "العنوان", "legal": "معلومات", "cgv": "الشروط العامة للبيع",
            "privacy": "سياسة الخصوصية",
            "offT": "لا يوجد اتصال بالإنترنت", "offS": "تحقق من شبكة Wi-Fi أو بيانات الجوال ثم أعد المحاولة. يمكنك دائمًا الاتصال بنا.",
            "retry": "إعادة المحاولة", "cancel": "إلغاء", "version": "الإصدار"
        ],
        "zh": [
            "book": "预订", "rides": "我的行程", "acc": "账户", "contact": "联系",
            "tagline": "巴黎私人专车", "avail": "全天候服务",
            "call": "致电",
            "whatsapp": "WhatsApp", "email": "电子邮件", "web": "网站", "insta": "Instagram",
            "office": "地址", "legal": "信息", "cgv": "销售条款",
            "privacy": "隐私政策",
            "offT": "没有网络连接", "offS": "请检查 Wi-Fi 或移动数据后重试。您也可以直接致电我们。",
            "retry": "重试", "cancel": "取消", "version": "版本"
        ]
    ]
}
