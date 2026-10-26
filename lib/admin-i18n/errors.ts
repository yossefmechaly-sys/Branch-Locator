import type { AdminLocale } from "./config";

const exactEnglishMessages: Record<string, string> = {
  "La traduction hébreu (he) est obligatoire":
    "The Hebrew translation (he) is required",
  "La latitude et la longitude doivent être renseignées ensemble":
    "Latitude and longitude must be provided together",
  "openingTime et closingTime sont requis quand le jour n'est pas fermé":
    "openingTime and closingTime are required when the day is not closed",
  "closingTime doit être postérieur à openingTime (créneaux traversant minuit non supportés)":
    "closingTime must be later than openingTime (time slots crossing midnight are not supported)",
  "closingTime2 doit être postérieur à openingTime2 (créneaux traversant minuit non supportés)":
    "closingTime2 must be later than openingTime2 (time slots crossing midnight are not supported)",
  "Le second créneau doit commencer après la fin du premier":
    "The second time slot must start after the first one ends",
  "closingTime doit être postérieur à openingTime":
    "closingTime must be later than openingTime",
  "closingTime2 doit être postérieur à openingTime2":
    "closingTime2 must be later than openingTime2",
  "Slug invalide (minuscules, chiffres, tirets uniquement)":
    "Invalid slug (lowercase letters, numbers and hyphens only)",
  "Prix invalide (ex. 29.90) — jamais de virgule ni de symbole":
    "Invalid price (e.g. 29.90) — do not use commas or currency symbols",
  "Numéro de téléphone invalide":
    "Invalid phone number",
  "endDate doit être postérieure ou égale à startDate":
    "endDate must be later than or equal to startDate",
  "Sélectionner au moins un magasin, ou activer « Tous les magasins »":
    "Select at least one branch, or enable “All branches”",
  "Une promotion globale ne peut pas cibler des magasins spécifiques":
    "A global promotion cannot target specific branches",
  "Un ancien prix (originalPrice) nécessite un prix (price)":
    "An original price (originalPrice) requires a price (price)",
  "Aucun fichier fourni":
    "No file provided",
  "Données invalides":
    "Invalid data",
  "Une erreur inattendue est survenue":
    "An unexpected error occurred",
  "Session invalide ou expirée":
    "Invalid or expired session",
  "Action refusée":
    "Action not allowed",
  "Enregistrement introuvable":
    "Record not found",

  "Fichier vide":
    "The file is empty",
  "Fichier trop volumineux (5 Mo maximum)":
    "File too large (5 MB maximum)",
  "Le contenu du fichier ne correspond pas au type déclaré (fichier corrompu ou renommé)":
    "The file content does not match the declared type (the file may be corrupted or renamed)",

  "Adresse vide":
    "The address is empty",
  "GOOGLE_GEOCODING_API_KEY n'est pas configurée sur le serveur — géocodage indisponible":
    "The address lookup service is currently unavailable",
  "Échec réseau lors de l'appel à Google Geocoding":
    "Network error while looking up the address",

  "Promotion introuvable":
    "Promotion not found",
  "Cette promotion a été modifiée entre-temps par un autre utilisateur":
    "This promotion was modified by another user in the meantime",

  "Service introuvable":
    "Service not found",
  "Ce service a été modifié entre-temps par un autre utilisateur":
    "This service was modified by another user in the meantime",

  "Magasin introuvable":
    "Branch not found",
  "Ce magasin a été modifié entre-temps par un autre utilisateur":
    "This branch was modified by another user in the meantime",

  "Ville introuvable":
    "City not found",
  "Cette ville a été modifiée entre-temps par un autre utilisateur":
    "This city was modified by another user in the meantime",

  "Fichier XLSX illisible ou corrompu":
    "The XLSX file cannot be read or is corrupted",
  "Le classeur XLSX ne contient aucune feuille":
    "The XLSX workbook does not contain any worksheets",
  "Extension non supportée — utilisez un fichier .csv ou .xlsx":
    "Unsupported extension — use a .csv or .xlsx file",
  "Session d'import expirée ou déjà utilisée — veuillez réimporter le fichier":
    "The import session has expired or has already been used — please import the file again",
  "Aucun téléphone ni numéro WhatsApp renseigné":
    "No phone or WhatsApp number provided",
  "Horaires renseignés mais fermé tous les jours — vérifier qu'il ne s'agit pas d'un oubli":
    "Opening hours were provided but the branch is marked closed every day — please check that this is not an oversight",
  "Aucune colonne d'horaires dans le fichier — les horaires existants ne seront pas modifiés":
    "The file contains no opening-hours columns — existing opening hours will not be modified",
};

const exactHebrewMessages: Record<string, string> = {
  "La traduction hébreu (he) est obligatoire":
    "התרגום לעברית (he) הוא שדה חובה",
  "La latitude et la longitude doivent être renseignées ensemble":
    "יש להזין את קו הרוחב וקו האורך יחד",
  "openingTime et closingTime sont requis quand le jour n'est pas fermé":
    "כאשר היום אינו מסומן כסגור, יש להזין שעת פתיחה ושעת סגירה",
  "closingTime doit être postérieur à openingTime (créneaux traversant minuit non supportés)":
    "שעת הסגירה חייבת להיות מאוחרת משעת הפתיחה (טווח שחוצה חצות אינו נתמך)",
  "closingTime2 doit être postérieur à openingTime2 (créneaux traversant minuit non supportés)":
    "שעת הסגירה השנייה חייבת להיות מאוחרת משעת הפתיחה השנייה (טווח שחוצה חצות אינו נתמך)",
  "Le second créneau doit commencer après la fin du premier":
    "טווח השעות השני חייב להתחיל לאחר סיום הטווח הראשון",
  "closingTime doit être postérieur à openingTime":
    "שעת הסגירה חייבת להיות מאוחרת משעת הפתיחה",
  "closingTime2 doit être postérieur à openingTime2":
    "שעת הסגירה השנייה חייבת להיות מאוחרת משעת הפתיחה השנייה",
  "Slug invalide (minuscules, chiffres, tirets uniquement)":
    "Slug לא תקין (אותיות לטיניות קטנות, ספרות ומקפים בלבד)",
  "Prix invalide (ex. 29.90) — jamais de virgule ni de symbole":
    "מחיר לא תקין (לדוגמה 29.90) — ללא פסיק או סימן מטבע",
  "Numéro de téléphone invalide":
    "מספר הטלפון אינו תקין",
  "endDate doit être postérieure ou égale à startDate":
    "תאריך הסיום חייב להיות זהה לתאריך ההתחלה או מאוחר ממנו",
  "Sélectionner au moins un magasin, ou activer « Tous les magasins »":
    "יש לבחור לפחות סניף אחד או להפעיל את האפשרות „כל הסניפים”",
  "Une promotion globale ne peut pas cibler des magasins spécifiques":
    "מבצע שחל על כל הסניפים אינו יכול להיות משויך לסניפים מסוימים בלבד",
  "Un ancien prix (originalPrice) nécessite un prix (price)":
    "כדי להזין מחיר קודם (originalPrice), יש להזין גם מחיר (price)",
  "Aucun fichier fourni":
    "לא סופק קובץ",
  "Données invalides": "הנתונים שהוזנו אינם תקינים",
  "Une erreur inattendue est survenue": "אירעה שגיאה בלתי צפויה",
  "Session invalide ou expirée": "ההתחברות אינה תקפה או שפג תוקפה",
  "Action refusée": "אין לך הרשאה לבצע פעולה זו",
  "Enregistrement introuvable": "הרשומה לא נמצאה",

  "Fichier vide": "הקובץ ריק",
  "Fichier trop volumineux (5 Mo maximum)": "הקובץ גדול מדי (מקסימום 5 MB)",
  "Le contenu du fichier ne correspond pas au type déclaré (fichier corrompu ou renommé)":
    "תוכן הקובץ אינו תואם לסוג הקובץ שצוין (ייתכן שהקובץ פגום או ששמו שונה)",

  "Adresse vide": "הכתובת ריקה",
  "GOOGLE_GEOCODING_API_KEY n'est pas configurée sur le serveur — géocodage indisponible":
    "שירות איתור הכתובת אינו זמין כרגע",
  "Échec réseau lors de l'appel à Google Geocoding":
    "שגיאת תקשורת בעת חיפוש הכתובת",

  "Promotion introuvable": "המבצע לא נמצא",
  "Cette promotion a été modifiée entre-temps par un autre utilisateur":
    "המבצע שונה בינתיים על ידי משתמש אחר",

  "Service introuvable": "השירות לא נמצא",
  "Ce service a été modifié entre-temps par un autre utilisateur":
    "השירות שונה בינתיים על ידי משתמש אחר",

  "Magasin introuvable": "הסניף לא נמצא",
  "Ce magasin a été modifié entre-temps par un autre utilisateur":
    "הסניף שונה בינתיים על ידי משתמש אחר",

  "Ville introuvable": "העיר לא נמצאה",
  "Cette ville a été modifiée entre-temps par un autre utilisateur":
    "העיר שונתה בינתיים על ידי משתמש אחר",
};

export function translateAdminErrorMessage(
  message: string,
  locale: AdminLocale,
): string {
  if (locale === "fr") return message;

  if (locale === "en") {
    const exact = exactEnglishMessages[message];
    if (exact) return exact;

    let match = message.match(
      /^Type de fichier non autorisé \((.+)\) — JPEG, PNG ou WebP uniquement$/,
    );
    if (match) {
      return `File type not allowed (${match[1]}) — JPEG, PNG or WebP only`;
    }

    match = message.match(/^Erreur Google Geocoding \(HTTP (.+)\)$/);
    if (match) {
      return `Address lookup service error (HTTP ${match[1]})`;
    }

    match = message.match(
      /^Adresse introuvable \(statut Google : (.+)\)$/,
    );
    if (match) {
      return `Address not found (Google status: ${match[1]})`;
    }

    match = message.match(
      /^Impossible de supprimer : (\d+) magasin\(s\) utilisent encore ce service\. Désactivez-le plutôt\.$/,
    );
    if (match) {
      return `Cannot delete: ${match[1]} branch(es) still use this service. Disable it instead.`;
    }

    match = message.match(
      /^Impossible de supprimer : (\d+) magasin\(s\) référencent encore cette ville\. Désactivez-la plutôt\.$/,
    );
    if (match) {
      return `Cannot delete: ${match[1]} branch(es) still reference this city. Disable it instead.`;
    }

    match = message.match(
      /^Impossible de supprimer : (\d+) promotion\(s\) ciblent encore ce magasin\. Retirez-le de ces promotions ou désactivez-le plutôt\.$/,
    );
    if (match) {
      return `Cannot delete: ${match[1]} promotion(s) still target this branch. Remove it from those promotions or disable it instead.`;
    }

    match = message.match(
      /^Format invalide \("(.+)"\) — au maximum deux créneaux séparés par une virgule$/,
    );
    if (match) {
      return `Invalid format ("${match[1]}") — a maximum of two time slots separated by a comma is allowed`;
    }

    match = message.match(
      /^Format invalide \("(.+)"\) — attendu "HH:mm-HH:mm" \(ex\. "09:00-18:00" ou "09:00-13:00,16:00-19:00"\)$/,
    );
    if (match) {
      return `Invalid format ("${match[1]}") — expected "HH:mm-HH:mm" (e.g. "09:00-18:00" or "09:00-13:00,16:00-19:00")`;
    }

    match = message.match(
      /^Fichier CSV illisible : (.+) \(ligne (.+)\)$/,
    );
    if (match) {
      return `Unable to read CSV file: ${match[1]} (row ${match[2]})`;
    }

    match = message.match(
      /^Fichier trop volumineux : (\d+) lignes \(maximum (\d+)\)$/,
    );
    if (match) {
      return `File too large: ${match[1]} rows (maximum ${match[2]})`;
    }

    match = message.match(
      /^Extension non autorisée — utilisez un fichier (.+)$/,
    );
    if (match) {
      return `File extension not allowed — use a ${match[1]} file`;
    }

    match = message.match(
      /^Type de fichier non reconnu \("(.+)"\) — utilisez un fichier CSV ou XLSX$/,
    );
    if (match) {
      return `Unrecognized file type ("${match[1]}") — use a CSV or XLSX file`;
    }

    match = message.match(
      /^Fichier trop volumineux \((.+) Mo, maximum (.+) Mo\)$/,
    );
    if (match) {
      return `File too large (${match[1]} MB, maximum ${match[2]} MB)`;
    }

    match = message.match(/^Colonne obligatoire manquante : "(.+)"$/);
    if (match) {
      return `Required column missing: "${match[1]}"`;
    }

    match = message.match(/^Ville inconnue : "(.+)" \(slug non reconnu\)$/);
    if (match) {
      return `Unknown city: "${match[1]}" (unrecognized slug)`;
    }

    match = message.match(/^Service inconnu : "(.+)" \(slug non reconnu\)$/);
    if (match) {
      return `Unknown service: "${match[1]}" (unrecognized slug)`;
    }

    match = message.match(/^Latitude invalide : "(.+)"$/);
    if (match) {
      return `Invalid latitude: "${match[1]}"`;
    }

    match = message.match(/^Longitude invalide : "(.+)"$/);
    if (match) {
      return `Invalid longitude: "${match[1]}"`;
    }

    match = message.match(/^Ordre invalide : "(.+)"$/);
    if (match) {
      return `Invalid order: "${match[1]}"`;
    }

    match = message.match(/^Traduction manquante pour : (.+)$/);
    if (match) {
      return `Missing translation for: ${match[1]}`;
    }

    match = message.match(
      /^Conflit d'identifiants : le code magasin "(.+)" correspond à un magasin différent du slug "(.+)"$/,
    );
    if (match) {
      return `Identifier conflict: branch code "${match[1]}" belongs to a different branch than slug "${match[2]}"`;
    }

    match = message.match(
      /^Code magasin en doublon dans le fichier \(déjà utilisé ligne (\d+)\)$/,
    );
    if (match) {
      return `Duplicate branch code in file (already used on row ${match[1]})`;
    }

    match = message.match(
      /^Slug en doublon dans le fichier \(déjà utilisé ligne (\d+)\)$/,
    );
    if (match) {
      return `Duplicate slug in file (already used on row ${match[1]})`;
    }

    /*
     * Import Zod errors may be prefixed by the field path,
     * for example "phone : Numéro de téléphone invalide".
     * Keep the technical path and translate only the message.
     */
    const separatorIndex = message.indexOf(" : ");
    if (separatorIndex > 0) {
      const prefix = message.slice(0, separatorIndex);
      const detail = message.slice(separatorIndex + 3);
      const translatedDetail = translateAdminErrorMessage(detail, locale);

      if (translatedDetail !== detail) {
        return `${prefix} : ${translatedDetail}`;
      }
    }

    return message;
  }

  const exact = exactHebrewMessages[message];
  if (exact) return exact;

  let match = message.match(
    /^Type de fichier non autorisé \((.+)\) — JPEG, PNG ou WebP uniquement$/,
  );
  if (match) {
    return `סוג הקובץ אינו מורשה (${match[1]}) — ניתן להעלות JPEG, PNG או WebP בלבד`;
  }

  match = message.match(/^Erreur Google Geocoding \(HTTP (.+)\)$/);
  if (match) {
    return `שגיאה בשירות חיפוש הכתובת (HTTP ${match[1]})`;
  }

  match = message.match(
    /^Adresse introuvable \(statut Google : (.+)\)$/,
  );
  if (match) {
    return `הכתובת לא נמצאה (סטטוס Google: ${match[1]})`;
  }

  match = message.match(
    /^Impossible de supprimer : (\d+) magasin\(s\) utilisent encore ce service\. Désactivez-le plutôt\.$/,
  );
  if (match) {
    return `לא ניתן למחוק: ${match[1]} סניפים עדיין משתמשים בשירות זה. ניתן להשבית אותו במקום למחוק.`;
  }

  match = message.match(
    /^Impossible de supprimer : (\d+) magasin\(s\) référencent encore cette ville\. Désactivez-la plutôt\.$/,
  );
  if (match) {
    return `לא ניתן למחוק: ${match[1]} סניפים עדיין משויכים לעיר זו. ניתן להשבית אותה במקום למחוק.`;
  }

  match = message.match(
    /^Impossible de supprimer : (\d+) promotion\(s\) ciblent encore ce magasin\. Retirez-le de ces promotions ou désactivez-le plutôt\.$/,
  );
  if (match) {
    return `לא ניתן למחוק: ${match[1]} מבצעים עדיין משויכים לסניף זה. יש להסיר אותו מהמבצעים או להשבית אותו.`;
  }

  match = message.match(
    /^Format invalide \("(.+)"\) — au maximum deux créneaux séparés par une virgule$/,
  );
  if (match) {
    return `פורמט לא תקין ("${match[1]}") — ניתן להזין לכל היותר שני טווחי שעות המופרדים בפסיק`;
  }

  match = message.match(
    /^Format invalide \("(.+)"\) — attendu "HH:mm-HH:mm" \(ex\. "09:00-18:00" ou "09:00-13:00,16:00-19:00"\)$/,
  );
  if (match) {
    return `פורמט לא תקין ("${match[1]}") — הפורמט הנדרש הוא "HH:mm-HH:mm" (לדוגמה "09:00-18:00" או "09:00-13:00,16:00-19:00")`;
  }

  match = message.match(
    /^Fichier CSV illisible : (.+) \(ligne (.+)\)$/,
  );
  if (match) {
    return `לא ניתן לקרוא את קובץ ה-CSV: ${match[1]} (שורה ${match[2]})`;
  }

  match = message.match(
    /^Fichier trop volumineux : (\d+) lignes \(maximum (\d+)\)$/,
  );
  if (match) {
    return `הקובץ גדול מדי: ${match[1]} שורות (מקסימום ${match[2]})`;
  }

  if (message === "Fichier XLSX illisible ou corrompu") {
    return "לא ניתן לקרוא את קובץ ה-XLSX או שהקובץ פגום";
  }

  if (message === "Le classeur XLSX ne contient aucune feuille") {
    return "קובץ ה-XLSX אינו מכיל גיליון";
  }

  if (
    message ===
    "Extension non supportée — utilisez un fichier .csv ou .xlsx"
  ) {
    return "סיומת הקובץ אינה נתמכת — יש להשתמש בקובץ .csv או .xlsx";
  }

  match = message.match(
    /^Extension non autorisée — utilisez un fichier (.+)$/,
  );
  if (match) {
    return `סיומת הקובץ אינה מורשית — יש להשתמש בקובץ ${match[1]}`;
  }

  match = message.match(
    /^Type de fichier non reconnu \("(.+)"\) — utilisez un fichier CSV ou XLSX$/,
  );
  if (match) {
    return `סוג הקובץ אינו מזוהה ("${match[1]}") — יש להשתמש בקובץ CSV או XLSX`;
  }

  match = message.match(
    /^Fichier trop volumineux \((.+) Mo, maximum (.+) Mo\)$/,
  );
  if (match) {
    return `הקובץ גדול מדי (${match[1]} MB, מקסימום ${match[2]} MB)`;
  }

  if (
    message ===
    "Session d'import expirée ou déjà utilisée — veuillez réimporter le fichier"
  ) {
    return "תוקף פעולת הייבוא פג או שהיא כבר בוצעה — יש לייבא את הקובץ מחדש";
  }

  match = message.match(/^Colonne obligatoire manquante : "(.+)"$/);
  if (match) {
    return `עמודת חובה חסרה: "${match[1]}"`;
  }

  match = message.match(/^Ville inconnue : "(.+)" \(slug non reconnu\)$/);
  if (match) {
    return `עיר לא מוכרת: "${match[1]}" (slug לא מוכר)`;
  }

  match = message.match(/^Service inconnu : "(.+)" \(slug non reconnu\)$/);
  if (match) {
    return `שירות לא מוכר: "${match[1]}" (slug לא מוכר)`;
  }

  match = message.match(/^Latitude invalide : "(.+)"$/);
  if (match) {
    return `קו רוחב לא תקין: "${match[1]}"`;
  }

  match = message.match(/^Longitude invalide : "(.+)"$/);
  if (match) {
    return `קו אורך לא תקין: "${match[1]}"`;
  }

  match = message.match(/^Ordre invalide : "(.+)"$/);
  if (match) {
    return `סדר לא תקין: "${match[1]}"`;
  }

  match = message.match(/^Traduction manquante pour : (.+)$/);
  if (match) {
    return `תרגום חסר עבור: ${match[1]}`;
  }

  match = message.match(
    /^Conflit d'identifiants : le code magasin "(.+)" correspond à un magasin différent du slug "(.+)"$/,
  );
  if (match) {
    return `התנגשות מזהים: קוד הסניף "${match[1]}" שייך לסניף שונה מה-slug "${match[2]}"`;
  }

  if (message === "Aucun téléphone ni numéro WhatsApp renseigné") {
    return "לא הוזן מספר טלפון או מספר WhatsApp";
  }

  if (
    message ===
    "Horaires renseignés mais fermé tous les jours — vérifier qu'il ne s'agit pas d'un oubli"
  ) {
    return "הוזנו שעות פעילות אך הסניף מסומן כסגור בכל הימים — יש לוודא שלא מדובר בטעות";
  }

  if (
    message ===
    "Aucune colonne d'horaires dans le fichier — les horaires existants ne seront pas modifiés"
  ) {
    return "אין בקובץ עמודות של שעות פעילות — שעות הפעילות הקיימות לא ישתנו";
  }

  match = message.match(
    /^Code magasin en doublon dans le fichier \(déjà utilisé ligne (\d+)\)$/,
  );
  if (match) {
    return `קוד סניף כפול בקובץ (כבר מופיע בשורה ${match[1]})`;
  }

  match = message.match(
    /^Slug en doublon dans le fichier \(déjà utilisé ligne (\d+)\)$/,
  );
  if (match) {
    return `Slug כפול בקובץ (כבר מופיע בשורה ${match[1]})`;
  }

  /*
   * Les erreurs Zod de l'import sont préfixées par le chemin du champ,
   * par exemple "phone : Numéro de téléphone invalide".
   * On conserve le chemin technique et on traduit uniquement le message.
   */
  const separatorIndex = message.indexOf(" : ");
  if (separatorIndex > 0) {
    const prefix = message.slice(0, separatorIndex);
    const detail = message.slice(separatorIndex + 3);
    const translatedDetail = translateAdminErrorMessage(detail, locale);

    if (translatedDetail !== detail) {
      return `${prefix} : ${translatedDetail}`;
    }
  }

  return message;
}

export function translateAdminFieldErrors(
  fieldErrors: Record<string, string[]>,
  locale: AdminLocale,
): Record<string, string[]> {
  if (locale === "fr") return fieldErrors;

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages.map((message) => translateAdminErrorMessage(message, locale)),
    ]),
  );
}
