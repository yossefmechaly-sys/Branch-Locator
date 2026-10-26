import type { AdminLocale } from "./config";

const fr = {
  title: "Avis et satisfaction client", description: "Modérez les avis de chaque magasin avant leur publication.",
  allBranches: "Tous les magasins", branch: "Magasin", allStatuses: "Tous les statuts", status: "Statut", filter: "Filtrer",
  statuses: { PENDING: "En attente", APPROVED: "Publié", REJECTED: "Refusé" },
  approve: "Publier", reject: "Refuser", pending: "Remettre en attente", saving: "Enregistrement…",
  empty: "Aucun avis ne correspond à ces filtres.", count: "avis", waiting: "avis en attente", average: "Note moyenne publiée",
  satisfaction: "Satisfaction", method: "Avis publiés à 4 ou 5 étoiles.", noReviews: "Aucun avis publié",
  previous: "Précédent", next: "Suivant", page: "Page", viewBranch: "Voir le magasin",
};
const en: typeof fr = {
  title: "Reviews and customer satisfaction", description: "Moderate each branch's reviews before publication.",
  allBranches: "All branches", branch: "Branch", allStatuses: "All statuses", status: "Status", filter: "Filter",
  statuses: { PENDING: "Pending", APPROVED: "Published", REJECTED: "Rejected" },
  approve: "Publish", reject: "Reject", pending: "Return to pending", saving: "Saving…",
  empty: "No reviews match these filters.", count: "reviews", waiting: "pending reviews", average: "Published average rating",
  satisfaction: "Satisfaction", method: "Published reviews rated 4 or 5 stars.", noReviews: "No published reviews",
  previous: "Previous", next: "Next", page: "Page", viewBranch: "View branch",
};
const he: typeof fr = {
  title: "ביקורות ושביעות רצון לקוחות", description: "בדיקת ביקורות לכל סניף לפני פרסומן.",
  allBranches: "כל הסניפים", branch: "סניף", allStatuses: "כל הסטטוסים", status: "סטטוס", filter: "סינון",
  statuses: { PENDING: "ממתינה לאישור", APPROVED: "פורסמה", REJECTED: "נדחתה" },
  approve: "פרסום", reject: "דחייה", pending: "החזרה להמתנה", saving: "שומר…",
  empty: "לא נמצאו ביקורות התואמות לסינון.", count: "ביקורות", waiting: "ביקורות ממתינות", average: "דירוג ממוצע שפורסם",
  satisfaction: "שביעות רצון", method: "ביקורות שפורסמו עם 4 או 5 כוכבים.", noReviews: "אין ביקורות שפורסמו",
  previous: "הקודם", next: "הבא", page: "עמוד", viewBranch: "צפייה בסניף",
};
export const adminReviewMessages: Record<AdminLocale, typeof fr> = { fr, en, he };
