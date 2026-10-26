import type { AdminLocale } from "./config";

export interface AdminDictionary {
  language: {
    french: string;
    hebrew: string;
  };
  navigation: {
    dashboard: string;
    branches: string;
    promotions: string;
    services: string;
    cities: string;
    analytics: string;
    importExport: string;
    reviews: string;
  };
  header: {
    logout: string;
    roles: {
      superAdmin: string;
      admin: string;
      editor: string;
    };
  };
  errorPage: {
    title: string;
    description: string;
    retry: string;
    backToDashboard: string;
  };
  translationStatus: {
    complete: string;
    incomplete: string;
  };
  common: {
    edit: string;
    activate: string;
    deactivate: string;
    delete: string;
    deletePermanently: string;
    cancel: string;
    active: string;
    inactive: string;
    actions: string;
    status: string;
    translations: string;
    modified: string;
    filter: string;
    archive: string;
    confirm: string;
  };
  branches: {
    title: string;
    newBranch: string;
    editBranch: string;
    viewAnalytics: string;
    identity: string;
    slugChangeWarning: string;
    slugChangeConfirm: string;
    branchCode: string;
    selectCity: string;
    district: string;
    sortOrder: string;
    sortOrderHint: string;
    active: string;
    addressAndLocation: string;
    address: string;
    postalCode: string;
    searching: string;
    searchAddress: string;
    addressRequiredForGeocode: string;
    latitude: string;
    longitude: string;
    geocodeHint: string;
    contact: string;
    phone: string;
    email: string;
    whatsapp: string;
    whatsappGroupUrl: string;
    wazeUrl: string;
    translations: string;
    displayName: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    weeklyHours: string;
    specialHours: string;
    servicesTitle: string;
    photos: string;
    uploading: string;
    uploadImage: string;
    imageFormatsHint: string;
    branchPhotoAlt: string;
    altText: string;
    mainImage: string;
    setMainImage: string;
    imageOrder: string;
    saving: string;
    createBranch: string;
    save: string;
    cancel: string;
    mapLoadError: string;
    mapNoCoordinates: string;
    inactiveService: string;
    closed: string;
    secondSlot: string;
    specialReasonPlaceholder: string;
    fullDayClosed: string;
    optionalSecondSlot: string;
    addSpecialDate: string;
    days: readonly [string, string, string, string, string, string, string];
    searchPlaceholder: string;
    allCities: string;
    allStatuses: string;
    activePlural: string;
    inactivePlural: string;
    name: string;
    code: string;
    city: string;
    noResults: string;
  };
  cities: {
    title: string;
    newCity: string;
    editCity: string;
    identityAndCoordinates: string;
    name: string;
    slug: string;
    latitude: string;
    longitude: string;
    sortOrder: string;
    active: string;
    translations: string;
    branches: string;
    saving: string;
    createCity: string;
    save: string;
    cancel: string;
  };
  services: {
    title: string;
    newService: string;
    editService: string;
    identity: string;
    name: string;
    slug: string;
    icon: string;
    sortOrder: string;
    active: string;
    translations: string;
    description: string;
    branches: string;
    saving: string;
    createService: string;
    save: string;
    cancel: string;
  };
  promotions: {
    title: string;
    newPromotion: string;
    editPromotion: string;
    identity: string;
    imageUrl: string;
    uploadImage: string;
    uploadingImage: string;
    removeImage: string;
    imageFormatsHint: string;
    priceSection: string;
    priceHint: string;
    originalPrice: string;
    optional: string;
    currency: string;
    currencyHint: string;
    unit: string;
    unitUnit: string;
    unitKg: string;
    unitGram: string;
    unitLiter: string;
    unitMl: string;
    unitPack: string;
    unitBox: string;
    translations: string;
    productName: string;
    translationTitle: string;
    description: string;
    ctaLabel: string;
    selectedBranches: string;
    datesStatusFeatured: string;
    startDate: string;
    endDate: string;
    statusLabel: string;
    priorityLabel: string;
    priorityHint: string;
    ctaUrl: string;
    featuredLabel: string;
    publicOrderingHint: string;
    saving: string;
    createPromotion: string;
    save: string;
    cancel: string;
    preview: string;
    previewFallbackTitle: string;
    productTitle: string;
    price: string;
    scope: string;
    featured: string;
    priority: string;
    allBranches: string;
    branchCount: string;
    noResults: string;
    statuses: {
      draft: string;
      scheduled: string;
      active: string;
      expired: string;
      archived: string;
    };
  };
  importExport: {
    title: string;
    description: string;

    importBranches: string;
    importDescription: string;
    downloadTemplate: string;
    selectFileFirst: string;
    analyzing: string;
    analyzePreview: string;
    restart: string;

    importCompleted: string;
    createdBranches: string;
    updatedBranches: string;

    preview: string;
    dryRun: string;
    rows: string;
    newRows: string;
    modifications: string;
    errors: string;
    ignored: string;
    warningsSummary: string;
    importing: string;
    confirmImport: string;
    readOnlyRole: string;
    noValidRows: string;

    rowDetails: string;
    row: string;
    status: string;
    branchCode: string;
    slug: string;
    name: string;
    details: string;

    actionCreate: string;
    actionUpdate: string;
    actionError: string;
    actionIgnored: string;

    exportTitle: string;
    exportDescription: string;
    branches: string;
    promotions: string;
  };

  analytics: {
    title: string;
    description: string;
    period: string;
    today: string;
    last7Days: string;
    last30Days: string;
    customPeriod: string;
    from: string;
    to: string;
    branch: string;
    allBranches: string;
    city: string;
    allCities: string;
    language: string;
    allLanguages: string;
    filter: string;
    reset: string;
    exportCsv: string;
    exportXlsx: string;

    evolution: string;
    noActivity: string;
    visitsEvolution: string;
    visitsEvolutionDescription: string;
    day: string;
    locatorViews: string;
    branchViews: string;

    visitIntentByDay: string;
    visitIntentByDayDescription: string;
    visitIntent: string;

    navigationPhoneWhatsapp: string;
    navigationPhoneWhatsappDescription: string;
    navigation: string;
    phone: string;
    whatsapp: string;
    whatsappClicks: string;

    promotionEngagement: string;
    promotionEngagementDescription: string;
    promotionViews: string;
    promotionClicks: string;

    branchResults: string;
    branchActionsDescription: string;

    interactionVisitIntent: string;
    branchViewToNavigation: string;
    branchViewToNavigationDescription: string;
    branchViewToPhone: string;
    branchViewToPhoneDescription: string;
    branchViewToWhatsapp: string;
    branchViewToWhatsappDescription: string;
    promotionViewToClick: string;
    promotionViewToClickDescription: string;

    previousPeriodVariation: string;

    searches: string;
    zeroResultSearches: string;
    geolocationUses: string;
    navigationClicksTotal: string;
    wazeClicks: string;
    googleMapsClicks: string;
    appleMapsClicks: string;
    calls: string;

    promotions: string;
    promotionsDescription: string;
    promotion: string;
    scope: string;
    branches: string;
    impressions: string;
    clicks: string;
    ctr: string;
    global: string;
    local: string;
    noPromotionImpressions: string;

    searchAnalysis: string;
    zeroResultRateDescription: string;
    searchLanguages: string;
    noSearches: string;
    ofSearches: string;
    topCities: string;
    noCityMatches: string;
    topBranches: string;
    noBranchMatches: string;

    bestBranches: string;
    bestBranchesDescription: string;
    noBranchActivity: string;
    views: string;
    promoViews: string;
    promoClicks: string;
  };

  dashboard: {
    title: string;
    totalBranches: string;
    activeBranches: string;
    inactiveBranches: string;
    openNowBranches: string;
    totalCities: string;
    activePromotions: string;
    scheduledPromotions: string;
    recentChanges: string;
    recentChangesDescription: string;
    noChanges: string;
    branch: string;
    promotion: string;
  };
  login: {
    title: string;
    description: string;
    email: string;
    password: string;
    submit: string;
    pending: string;
    requiredError: string;
    invalidError: string;
    rateLimitError: string;
  };
}

const fr = {
  language: {
    french: "Français",
    hebrew: "עברית",
  },
  navigation: {
    dashboard: "Tableau de bord",
    branches: "Magasins",
    promotions: "Promotions",
    services: "Services",
    cities: "Villes",
    analytics: "Analytics",
    importExport: "Import / Export",
    reviews: "Avis clients",
  },
  header: {
    logout: "Déconnexion",
    roles: {
      superAdmin: "Super administrateur",
      admin: "Administrateur",
      editor: "Éditeur",
    },
  },

  errorPage: {
    title: "Une erreur est survenue",
    description:
      "Cette page de l’administration n’a pas pu s’afficher correctement. Réessayez, et contactez le support technique si le problème persiste.",
    retry: "Réessayer",
    backToDashboard: "Retour au tableau de bord",
  },

  translationStatus: {
    complete: "traduction complète",
    incomplete: "traduction manquante ou incomplète",
  },
  common: {
    edit: "Modifier",
    activate: "Activer",
    deactivate: "Désactiver",
    delete: "Supprimer",
    deletePermanently: "Supprimer définitivement",
    cancel: "Annuler",
    active: "Actif",
    inactive: "Inactif",
    actions: "Actions",
    status: "Statut",
    translations: "Traductions",
    modified: "Modifié",
    filter: "Filtrer",
    archive: "Archiver",
    confirm: "Confirmer",
  },
  branches: {
    title: "Magasins",
    newBranch: "Nouveau magasin",
    editBranch: "Modifier",
    viewAnalytics: "Voir les statistiques",
    identity: "Identité",
    slugChangeWarning: "Le slug change : l’ancienne URL publique cessera de fonctionner après enregistrement.",
    slugChangeConfirm: "Je confirme vouloir changer ce slug déjà publié.",
    branchCode: "Code magasin",
    selectCity: "Sélectionner une ville",
    district: "District",
    sortOrder: "Ordre",
    sortOrderHint: "Ordre d’affichage éventuel",
    active: "Actif",
    addressAndLocation: "Adresse et géolocalisation",
    address: "Adresse",
    postalCode: "Code postal",
    searching: "Recherche…",
    searchAddress: "Rechercher l’adresse",
    addressRequiredForGeocode: "Saisissez une adresse avant de rechercher ses coordonnées.",
    latitude: "Latitude",
    longitude: "Longitude",
    geocodeHint: "La recherche géocode l’adresse via une clé serveur dédiée ; latitude et longitude restent ensuite modifiables manuellement.",
    contact: "Contact",
    phone: "Téléphone",
    email: "Email",
    whatsapp: "WhatsApp",
    whatsappGroupUrl: "Groupe WhatsApp (URL)",
    wazeUrl: "URL Waze personnalisée",
    translations: "Traductions",
    displayName: "Nom affiché",
    description: "Description",
    seoTitle: "Titre SEO",
    seoDescription: "Description SEO",
    weeklyHours: "Horaires hebdomadaires",
    specialHours: "Horaires exceptionnels",
    servicesTitle: "Services",
    photos: "Photos",
    uploading: "Envoi…",
    uploadImage: "Téléverser une image",
    imageFormatsHint: "JPEG, PNG ou WebP, 5 Mo maximum.",
    branchPhotoAlt: "Photo magasin",
    altText: "Texte alternatif",
    mainImage: "Image principale",
    setMainImage: "Définir principale",
    imageOrder: "Ordre",
    saving: "Enregistrement…",
    createBranch: "Créer le magasin",
    save: "Enregistrer",
    cancel: "Annuler",
    mapLoadError: "Impossible de charger Google Maps.",
    mapNoCoordinates: "Recherchez une adresse pour afficher sa position sur la carte.",
    inactiveService: "inactif",
    closed: "Fermé",
    secondSlot: "2ᵉ créneau",
    specialReasonPlaceholder: "Motif (ex. Veille de Rosh Hashana)",
    fullDayClosed: "Fermeture complète ce jour-là",
    optionalSecondSlot: "2ᵉ créneau (optionnel) :",
    addSpecialDate: "Ajouter une date exceptionnelle",
    days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    searchPlaceholder: "Rechercher (nom, slug, code)",
    allCities: "Toutes les villes",
    allStatuses: "Tous les statuts",
    activePlural: "Actifs",
    inactivePlural: "Inactifs",
    name: "Nom",
    code: "Code",
    city: "Ville",
    noResults: "Aucun magasin ne correspond à ces critères.",
  },
  cities: {
    title: "Villes",
    newCity: "Nouvelle ville",
    editCity: "Modifier",
    identityAndCoordinates: "Identité et coordonnées",
    name: "Nom",
    slug: "Slug",
    latitude: "Latitude",
    longitude: "Longitude",
    sortOrder: "Ordre",
    active: "Actif",
    translations: "Traductions",
    branches: "Magasins",
    saving: "Enregistrement…",
    createCity: "Créer la ville",
    save: "Enregistrer",
    cancel: "Annuler",
  },
  services: {
    title: "Services",
    newService: "Nouveau service",
    editService: "Modifier",
    identity: "Identité",
    name: "Nom",
    slug: "Slug",
    icon: "Icône (nom Lucide)",
    sortOrder: "Ordre",
    active: "Actif",
    translations: "Traductions",
    description: "Description",
    branches: "Magasins",
    saving: "Enregistrement…",
    createService: "Créer le service",
    save: "Enregistrer",
    cancel: "Annuler",
  },
  promotions: {
    title: "Promotions",
    newPromotion: "Nouvelle promotion",
    editPromotion: "Modifier la promotion",
    identity: "Identité",
    imageUrl: "Image",
    uploadImage: "Choisir une image",
    uploadingImage: "Téléversement…",
    removeImage: "Supprimer l'image",
    imageFormatsHint: "JPEG, PNG ou WebP — 5 Mo maximum",
    priceSection: "Prix",
    priceHint: "ex. 29.90 — vide = promotion sans produit",
    originalPrice: "Ancien prix",
    optional: "optionnel",
    currency: "Devise",
    currencyHint: "Seule devise actuellement supportée.",
    unit: "Unité",
    unitUnit: "À l'unité",
    unitKg: "Au kilogramme (kg)",
    unitGram: "Au gramme (g)",
    unitLiter: "Au litre (L)",
    unitMl: "Au millilitre (mL)",
    unitPack: "Au paquet",
    unitBox: "À la boîte",
    translations: "Traductions",
    productName: "Nom du produit",
    translationTitle: "Titre",
    description: "Description",
    ctaLabel: "Libellé du bouton (CTA)",
    selectedBranches: "Magasins sélectionnés",
    datesStatusFeatured: "Dates, statut, mise en avant",
    startDate: "Début",
    endDate: "Fin",
    statusLabel: "Statut",
    priorityLabel: "Priorité",
    priorityHint: "Plus grand = plus prioritaire, à égalité locale/globale",
    ctaUrl: "URL du bouton (CTA)",
    featuredLabel: "Promotion du jour",
    publicOrderingHint: "L'affichage public applique : promotion locale avant globale, puis priorité décroissante.",
    saving: "Enregistrement…",
    createPromotion: "Créer la promotion",
    save: "Enregistrer",
    cancel: "Annuler",
    preview: "Aperçu",
    previewFallbackTitle: "(titre)",
    productTitle: "Produit / titre",
    price: "Prix",
    scope: "Portée",
    featured: "Mise en avant",
    priority: "Priorité",
    allBranches: "Tous les magasins",
    branchCount: "magasin(s)",
    noResults: "Aucune promotion pour le moment.",
    statuses: {
      draft: "Brouillon",
      scheduled: "Programmée",
      active: "Active",
      expired: "Expirée",
      archived: "Archivée",
    },
  },
  importExport: {
    title: "Import / Export",
    description:
      "Importez ou mettez à jour des dizaines de magasins à la fois depuis un fichier CSV ou XLSX.",

    importBranches: "Importer des magasins",
    importDescription:
      "Formats acceptés : CSV ou XLSX, template officiel recommandé. Correspondance par code magasin en priorité, puis par slug — jamais par nom affiché.",
    downloadTemplate: "Télécharger le template CSV",
    selectFileFirst: "Sélectionnez d’abord un fichier .csv ou .xlsx",
    analyzing: "Analyse en cours…",
    analyzePreview: "Analyser (aperçu, aucune écriture)",
    restart: "Recommencer",

    importCompleted: "Import terminé",
    createdBranches: "magasin(s) créé(s)",
    updatedBranches: "magasin(s) mis à jour",

    preview: "Aperçu",
    dryRun: "Aucune écriture n’a encore eu lieu (mode dry-run).",
    rows: "Lignes",
    newRows: "Nouveaux",
    modifications: "Modifications",
    errors: "Erreurs",
    ignored: "Ignorées",
    warningsSummary:
      "ligne(s) avec avertissement(s) non bloquant(s) — voir le détail ci-dessous.",
    importing: "Import en cours…",
    confirmImport: "Confirmer l’import",
    readOnlyRole:
      "Votre rôle ne permet pas d’exécuter un import (lecture seule).",
    noValidRows: "Aucune ligne valide à importer.",

    rowDetails: "Détail des lignes",
    row: "Ligne",
    status: "Statut",
    branchCode: "Code magasin",
    slug: "Slug",
    name: "Nom",
    details: "Détails",

    actionCreate: "Nouveau",
    actionUpdate: "Modification",
    actionError: "Erreur",
    actionIgnored: "Ignorée",

    exportTitle: "Exporter",
    exportDescription:
      "L’export magasins utilise les mêmes identifiants que l’import — un fichier exporté puis réimporté sans modification met à jour les mêmes magasins.",
    branches: "Magasins",
    promotions: "Promotions",
  },

  analytics: {
    title: "Statistiques",
    description:
      "Statistiques d’usage du Store Locator — jamais des ventes ni une fréquentation physique réelle, uniquement l’interaction et l’intention de visite mesurables en ligne.",
    period: "Période",
    today: "Aujourd’hui",
    last7Days: "7 derniers jours",
    last30Days: "30 derniers jours",
    customPeriod: "Période personnalisée",
    from: "Du",
    to: "Au",
    branch: "Magasin",
    allBranches: "Tous les magasins",
    city: "Ville",
    allCities: "Toutes les villes",
    language: "Langue",
    allLanguages: "Toutes les langues",
    filter: "Filtrer",
    reset: "Réinitialiser",
    exportCsv: "Exporter CSV",
    exportXlsx: "Exporter XLSX (rapport complet)",

    evolution: "Évolution",
    noActivity: "Aucune activité enregistrée sur cette période.",
    visitsEvolution: "Évolution des visites",
    visitsEvolutionDescription:
      "Vues Store Locator et vues de fiches magasins, par jour.",
    day: "Jour",
    locatorViews: "Vues Store Locator",
    branchViews: "Vues fiches magasins",

    visitIntentByDay: "Intentions de visite par jour",
    visitIntentByDayDescription:
      "Navigation + appel + WhatsApp, agrégées par jour.",
    visitIntent: "Intentions de visite",

    navigationPhoneWhatsapp: "Navigation / téléphone / WhatsApp",
    navigationPhoneWhatsappDescription:
      "Détail des trois canaux qui composent les intentions de visite.",
    navigation: "Navigation",
    phone: "Téléphone",
    whatsapp: "WhatsApp",
    whatsappClicks: "Clics WhatsApp",

    promotionEngagement: "Engagement promotions",
    promotionEngagementDescription:
      "Vues et clics sur les promotions, par jour.",
    promotionViews: "Vues promotions",
    promotionClicks: "Clics promotions",

    branchResults: "Résultats pour",
    branchActionsDescription:
      "Actions générées vers ce magasin sur la période sélectionnée (navigation + appel + WhatsApp). Cette statistique mesure l’intérêt et l’intention de visite générés par le Store Locator — ce n’est pas un chiffre de ventes ni de fréquentation réelle en magasin.",

    interactionVisitIntent: "Interaction et intention de visite",
    branchViewToNavigation: "Vue fiche → navigation",
    branchViewToNavigationDescription:
      "Part des vues de fiche magasin suivies d’un clic Waze/Google Maps/Apple Maps.",
    branchViewToPhone: "Vue fiche → appel",
    branchViewToPhoneDescription:
      "Part des vues de fiche magasin suivies d’un clic « appeler ».",
    branchViewToWhatsapp: "Vue fiche → WhatsApp",
    branchViewToWhatsappDescription:
      "Part des vues de fiche magasin suivies d’un clic WhatsApp.",
    promotionViewToClick: "Vue promotion → clic (CTR)",
    promotionViewToClickDescription:
      "Taux de clic sur les promotions affichées.",

    previousPeriodVariation:
      "Variation vs période précédente de même durée",

    searches: "Recherches",
    zeroResultSearches: "Recherches sans résultat",
    geolocationUses: "Utilisations géolocalisation",
    navigationClicksTotal: "Clics navigation (total)",
    wazeClicks: "Clics Waze",
    googleMapsClicks: "Clics Google Maps",
    appleMapsClicks: "Clics Apple Maps",
    calls: "Appels",

    promotions: "Promotions",
    promotionsDescription:
      "Impressions et clics par promotion sur la période sélectionnée.",
    promotion: "Promotion",
    scope: "Portée",
    branches: "Magasins",
    impressions: "Impressions",
    clicks: "Clics",
    ctr: "CTR",
    global: "Globale",
    local: "Locale",
    noPromotionImpressions:
      "Aucune impression de promotion sur cette période.",

    searchAnalysis: "Analyse des recherches",
    zeroResultRateDescription:
      "Une zone recherchée sans magasin correspondant à proximité — signal d’expansion réseau potentiel.",
    searchLanguages: "Langues utilisées pour les recherches",
    noSearches: "Aucune recherche enregistrée sur cette période.",
    ofSearches: "des recherches",
    topCities: "Villes les plus recherchées",
    noCityMatches: "Aucune correspondance ville sur cette période.",
    topBranches: "Magasins les plus recherchés",
    noBranchMatches: "Aucune correspondance magasin sur cette période.",

    bestBranches: "Magasins les plus performants",
    bestBranchesDescription:
      "Cliquez sur une colonne pour trier. Aucune donnée = magasin sans activité sur la période.",
    noBranchActivity: "Aucune activité enregistrée sur cette période.",
    views: "Vues",
    promoViews: "Vues promo",
    promoClicks: "Clics promo",
  },

  dashboard: {
    title: "Tableau de bord",
    totalBranches: "Magasins (total)",
    activeBranches: "Magasins actifs",
    inactiveBranches: "Magasins inactifs",
    openNowBranches: "Ouverts maintenant",
    totalCities: "Villes",
    activePromotions: "Promotions actives",
    scheduledPromotions: "Promotions programmées",
    recentChanges: "Dernières modifications",
    recentChangesDescription:
      "Les 8 derniers magasins/promotions modifiés, tous types confondus.",
    noChanges: "Aucune modification enregistrée.",
    branch: "Magasin",
    promotion: "Promotion",
  },
  login: {
    title: "Administration Maayan 2000",
    description: "Connectez-vous avec votre compte administrateur.",
    email: "Email",
    password: "Mot de passe",
    submit: "Se connecter",
    pending: "Connexion…",
    requiredError: "Email et mot de passe requis.",
    invalidError: "Email ou mot de passe incorrect.",
    rateLimitError:
      "Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.",
  },
} satisfies AdminDictionary;


const en = {
  language: {
    french: "Français",
    hebrew: "עברית",
  },

  navigation: {
    dashboard: "Dashboard",
    branches: "Branches",
    promotions: "Promotions",
    services: "Services",
    cities: "Cities",
    analytics: "Analytics",
    importExport: "Import / Export",
    reviews: "Customer reviews",
  },

  header: {
    logout: "Log out",
    roles: {
      superAdmin: "Super administrator",
      admin: "Administrator",
      editor: "Editor",
    },
  },

  errorPage: {
    title: "An error occurred",
    description:
      "This administration page could not be displayed correctly. Please try again, and contact technical support if the problem persists.",
    retry: "Try again",
    backToDashboard: "Back to dashboard",
  },

  translationStatus: {
    complete: "translation complete",
    incomplete: "translation missing or incomplete",
  },

  common: {
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    deletePermanently: "Delete permanently",
    cancel: "Cancel",
    active: "Active",
    inactive: "Inactive",
    actions: "Actions",
    status: "Status",
    translations: "Translations",
    modified: "Modified",
    filter: "Filter",
    archive: "Archive",
    confirm: "Confirm",
  },

  branches: {
    title: "Branches",
    newBranch: "New branch",
    editBranch: "Edit branch",
    viewAnalytics: "View analytics",
    identity: "General information",
    slugChangeWarning:
      "The slug is changing: the old public URL will stop working after saving.",
    slugChangeConfirm: "I confirm that I want to change this published slug.",
    branchCode: "Branch code",
    selectCity: "Select a city",
    district: "District",
    sortOrder: "Display order",
    sortOrderHint: "Optional display order",
    active: "Active",
    addressAndLocation: "Address and location",
    address: "Address",
    postalCode: "Postal code",
    searching: "Searching…",
    searchAddress: "Search address",
    addressRequiredForGeocode:
      "Enter an address before searching for its coordinates.",
    latitude: "Latitude",
    longitude: "Longitude",
    geocodeHint:
      "The address is geocoded using a dedicated server key; latitude and longitude can then be edited manually.",
    contact: "Contact",
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    whatsappGroupUrl: "WhatsApp group (URL)",
    wazeUrl: "Custom Waze URL",
    translations: "Translations",
    displayName: "Display name",
    description: "Description",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    weeklyHours: "Weekly opening hours",
    specialHours: "Special opening hours",
    servicesTitle: "Services",
    photos: "Photos",
    uploading: "Uploading…",
    uploadImage: "Upload an image",
    imageFormatsHint: "JPEG, PNG or WebP, maximum 5 MB.",
    branchPhotoAlt: "Branch photo",
    altText: "Alternative text",
    mainImage: "Main image",
    setMainImage: "Set as main image",
    imageOrder: "Order",
    saving: "Saving…",
    createBranch: "Create branch",
    save: "Save",
    cancel: "Cancel",
    mapLoadError: "Unable to load Google Maps.",
    mapNoCoordinates:
      "Search for an address to display its location on the map.",
    inactiveService: "inactive",
    closed: "Closed",
    secondSlot: "Second time slot",
    specialReasonPlaceholder: "Reason (e.g. Rosh Hashanah Eve)",
    fullDayClosed: "Closed all day",
    optionalSecondSlot: "Second time slot (optional):",
    addSpecialDate: "Add a special date",
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    searchPlaceholder: "Search by name, slug or code",
    allCities: "All cities",
    allStatuses: "All statuses",
    activePlural: "Active",
    inactivePlural: "Inactive",
    name: "Name",
    code: "Code",
    city: "City",
    noResults: "No branches match these criteria.",
  },

  cities: {
    title: "Cities",
    newCity: "New city",
    editCity: "Edit city",
    identityAndCoordinates: "City details and coordinates",
    name: "Name",
    slug: "Slug",
    latitude: "Latitude",
    longitude: "Longitude",
    sortOrder: "Display order",
    active: "Active",
    translations: "Translations",
    branches: "Branches",
    saving: "Saving…",
    createCity: "Create city",
    save: "Save",
    cancel: "Cancel",
  },

  services: {
    title: "Services",
    newService: "New service",
    editService: "Edit service",
    identity: "General information",
    name: "Name",
    slug: "Slug",
    icon: "Icon (Lucide name)",
    sortOrder: "Display order",
    active: "Active",
    translations: "Translations",
    description: "Description",
    branches: "Branches",
    saving: "Saving…",
    createService: "Create service",
    save: "Save",
    cancel: "Cancel",
  },

  promotions: {
    title: "Promotions",
    newPromotion: "New promotion",
    editPromotion: "Edit promotion",
    identity: "General information",
    imageUrl: "Image",
    uploadImage: "Choose an image",
    uploadingImage: "Uploading…",
    removeImage: "Remove image",
    imageFormatsHint: "JPEG, PNG or WebP — 5 MB maximum",
    priceSection: "Price",
    priceHint: "e.g. 29.90 — leave blank for a promotion without a product",
    originalPrice: "Original price",
    optional: "optional",
    currency: "Currency",
    currencyHint: "Currently the only supported currency.",
    unit: "Unit",
    unitUnit: "Per unit",
    unitKg: "Per kilogram (kg)",
    unitGram: "Per gram (g)",
    unitLiter: "Per liter (L)",
    unitMl: "Per milliliter (mL)",
    unitPack: "Per pack",
    unitBox: "Per box",
    translations: "Translations",
    productName: "Product name",
    translationTitle: "Title",
    description: "Description",
    ctaLabel: "Button label (CTA)",
    selectedBranches: "Selected branches",
    datesStatusFeatured: "Dates, status and featured",
    startDate: "Start date",
    endDate: "End date",
    statusLabel: "Status",
    priorityLabel: "Priority",
    priorityHint:
      "Higher number = higher priority; local/global order is preserved when equal",
    ctaUrl: "Button URL (CTA)",
    featuredLabel: "Promotion of the day",
    publicOrderingHint:
      "Public display order: local promotions before global promotions, then descending priority.",
    saving: "Saving…",
    createPromotion: "Create promotion",
    save: "Save",
    cancel: "Cancel",
    preview: "Preview",
    previewFallbackTitle: "(title)",
    productTitle: "Product / title",
    price: "Price",
    scope: "Scope",
    featured: "Featured",
    priority: "Priority",
    allBranches: "All branches",
    branchCount: "branch(es)",
    noResults: "No promotions at the moment.",
    statuses: {
      draft: "Draft",
      scheduled: "Scheduled",
      active: "Active",
      expired: "Expired",
      archived: "Archived",
    },
  },

  importExport: {
    title: "Import / Export",
    description:
      "Import or update dozens of branches at once from a CSV or XLSX file.",

    importBranches: "Import branches",
    importDescription:
      "Accepted formats: CSV or XLSX. The official template is recommended. Matching is performed by branch code first, then by slug — never by display name.",
    downloadTemplate: "Download CSV template",
    selectFileFirst: "Select a .csv or .xlsx file first",
    analyzing: "Analyzing…",
    analyzePreview: "Analyze (preview, no changes)",
    restart: "Start over",

    importCompleted: "Import completed",
    createdBranches: "branch(es) created",
    updatedBranches: "branch(es) updated",

    preview: "Preview",
    dryRun: "No changes have been written yet (dry-run mode).",
    rows: "Rows",
    newRows: "New",
    modifications: "Updates",
    errors: "Errors",
    ignored: "Ignored",
    warningsSummary:
      "row(s) with non-blocking warning(s) — see details below.",
    importing: "Importing…",
    confirmImport: "Confirm import",
    readOnlyRole:
      "Your role does not allow you to run an import (read-only).",
    noValidRows: "No valid rows to import.",

    rowDetails: "Row details",
    row: "Row",
    status: "Status",
    branchCode: "Branch code",
    slug: "Slug",
    name: "Name",
    details: "Details",

    actionCreate: "New",
    actionUpdate: "Update",
    actionError: "Error",
    actionIgnored: "Ignored",

    exportTitle: "Export",
    exportDescription:
      "Branch exports use the same identifiers as imports — exporting and re-importing an unchanged file updates the same branches.",
    branches: "Branches",
    promotions: "Promotions",
  },

  analytics: {
    title: "Analytics",
    description:
      "Store Locator usage analytics — not sales or actual physical foot traffic, only measurable online interactions and visit intent.",
    period: "Period",
    today: "Today",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    customPeriod: "Custom period",
    from: "From",
    to: "To",
    branch: "Branch",
    allBranches: "All branches",
    city: "City",
    allCities: "All cities",
    language: "Language",
    allLanguages: "All languages",
    filter: "Filter",
    reset: "Reset",
    exportCsv: "Export CSV",
    exportXlsx: "Export XLSX (full report)",

    evolution: "Trend",
    noActivity: "No activity recorded during this period.",
    visitsEvolution: "Visit trends",
    visitsEvolutionDescription:
      "Store Locator views and branch page views by day.",
    day: "Day",
    locatorViews: "Store Locator views",
    branchViews: "Branch page views",

    visitIntentByDay: "Visit intent by day",
    visitIntentByDayDescription:
      "Navigation, phone calls and WhatsApp interactions aggregated by day.",
    visitIntent: "Visit intent",

    navigationPhoneWhatsapp: "Navigation / phone / WhatsApp",
    navigationPhoneWhatsappDescription:
      "Breakdown of the three channels that make up visit intent.",
    navigation: "Navigation",
    phone: "Phone",
    whatsapp: "WhatsApp",
    whatsappClicks: "WhatsApp clicks",

    promotionEngagement: "Promotion engagement",
    promotionEngagementDescription:
      "Promotion views and clicks by day.",
    promotionViews: "Promotion views",
    promotionClicks: "Promotion clicks",

    branchResults: "Results for",
    branchActionsDescription:
      "Actions generated for this branch during the selected period (navigation + phone + WhatsApp). This measures interest and visit intent generated by the Store Locator — not sales or actual in-store foot traffic.",

    interactionVisitIntent: "Interaction and visit intent",
    branchViewToNavigation: "Branch view → navigation",
    branchViewToNavigationDescription:
      "Share of branch page views followed by a Waze, Google Maps or Apple Maps click.",
    branchViewToPhone: "Branch view → phone call",
    branchViewToPhoneDescription:
      "Share of branch page views followed by a call click.",
    branchViewToWhatsapp: "Branch view → WhatsApp",
    branchViewToWhatsappDescription:
      "Share of branch page views followed by a WhatsApp click.",
    promotionViewToClick: "Promotion view → click (CTR)",
    promotionViewToClickDescription:
      "Click-through rate for displayed promotions.",

    previousPeriodVariation:
      "Change vs previous period of the same duration",

    searches: "Searches",
    zeroResultSearches: "Zero-result searches",
    geolocationUses: "Geolocation uses",
    navigationClicksTotal: "Navigation clicks (total)",
    wazeClicks: "Waze clicks",
    googleMapsClicks: "Google Maps clicks",
    appleMapsClicks: "Apple Maps clicks",
    calls: "Calls",

    promotions: "Promotions",
    promotionsDescription:
      "Impressions and clicks by promotion during the selected period.",
    promotion: "Promotion",
    scope: "Scope",
    branches: "Branches",
    impressions: "Impressions",
    clicks: "Clicks",
    ctr: "CTR",
    global: "Global",
    local: "Local",
    noPromotionImpressions:
      "No promotion impressions during this period.",

    searchAnalysis: "Search analysis",
    zeroResultRateDescription:
      "A searched area with no matching branch nearby — a potential network expansion signal.",
    searchLanguages: "Languages used for searches",
    noSearches: "No searches recorded during this period.",
    ofSearches: "of searches",
    topCities: "Most searched cities",
    noCityMatches: "No city matches during this period.",
    topBranches: "Most searched branches",
    noBranchMatches: "No branch matches during this period.",

    bestBranches: "Top-performing branches",
    bestBranchesDescription:
      "Click a column to sort. No data means the branch had no activity during the selected period.",
    noBranchActivity: "No activity recorded during this period.",
    views: "Views",
    promoViews: "Promo views",
    promoClicks: "Promo clicks",
  },

  dashboard: {
    title: "Dashboard",
    totalBranches: "Branches (total)",
    activeBranches: "Active branches",
    inactiveBranches: "Inactive branches",
    openNowBranches: "Open now",
    totalCities: "Cities",
    activePromotions: "Active promotions",
    scheduledPromotions: "Scheduled promotions",
    recentChanges: "Recent changes",
    recentChangesDescription:
      "The 8 most recently updated branches/promotions, across all types.",
    noChanges: "No changes recorded.",
    branch: "Branch",
    promotion: "Promotion",
  },

  login: {
    title: "Maayan 2000 Administration",
    description: "Sign in with your administrator account.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    pending: "Signing in…",
    requiredError: "Email and password are required.",
    invalidError: "Incorrect email or password.",
    rateLimitError:
      "Too many sign-in attempts. Please try again in a few minutes.",
  },
} satisfies AdminDictionary;

const he = {
  language: {
    french: "Français",
    hebrew: "עברית",
  },
  navigation: {
    dashboard: "לוח בקרה",
    branches: "סניפים",
    promotions: "מבצעים",
    services: "שירותים",
    cities: "ערים",
    analytics: "נתונים וסטטיסטיקות",
    importExport: "ייבוא / ייצוא",
    reviews: "ביקורות לקוחות",
  },
  header: {
    logout: "התנתקות",
    roles: {
      superAdmin: "מנהל-על",
      admin: "מנהל מערכת",
      editor: "עורך",
    },
  },

  errorPage: {
    title: "אירעה שגיאה",
    description:
      "לא ניתן היה להציג את עמוד הניהול כראוי. נסו שוב, ואם הבעיה נמשכת פנו לתמיכה הטכנית.",
    retry: "נסו שוב",
    backToDashboard: "חזרה ללוח הבקרה",
  },

  translationStatus: {
    complete: "תרגום מלא",
    incomplete: "תרגום חסר או לא מלא",
  },
  common: {
    edit: "עריכה",
    activate: "הפעלה",
    deactivate: "השבתה",
    delete: "מחיקה",
    deletePermanently: "מחיקה לצמיתות",
    cancel: "ביטול",
    active: "פעיל",
    inactive: "לא פעיל",
    actions: "פעולות",
    status: "סטטוס",
    translations: "תרגומים",
    modified: "עודכן",
    filter: "סינון",
    archive: "העברה לארכיון",
    confirm: "אישור",
  },
  branches: {
    title: "סניפים",
    newBranch: "סניף חדש",
    editBranch: "עריכת סניף",
    viewAnalytics: "צפייה בסטטיסטיקות",
    identity: "פרטים כלליים",
    slugChangeWarning: "ה־slug השתנה: כתובת הסניף הציבורית הישנה תפסיק לפעול לאחר השמירה.",
    slugChangeConfirm: "אני מאשר לשנות את ה־slug שכבר פורסם.",
    branchCode: "קוד סניף",
    selectCity: "בחירת עיר",
    district: "אזור",
    sortOrder: "סדר תצוגה",
    sortOrderHint: "סדר ההצגה של הסניף",
    active: "פעיל",
    addressAndLocation: "כתובת ומיקום",
    address: "כתובת",
    postalCode: "מיקוד",
    searching: "מחפש…",
    searchAddress: "חיפוש הכתובת",
    addressRequiredForGeocode: "יש להזין כתובת לפני חיפוש הקואורדינטות.",
    latitude: "קו רוחב",
    longitude: "קו אורך",
    geocodeHint: "חיפוש הכתובת מאתר את הקואורדינטות באמצעות מפתח שרת ייעודי; לאחר מכן ניתן לשנות ידנית את קו הרוחב וקו האורך.",
    contact: "פרטי קשר",
    phone: "טלפון",
    email: "אימייל",
    whatsapp: "WhatsApp",
    whatsappGroupUrl: "קבוצת WhatsApp (URL)",
    wazeUrl: "כתובת Waze מותאמת אישית",
    translations: "תרגומים",
    displayName: "שם לתצוגה",
    description: "תיאור",
    seoTitle: "כותרת SEO",
    seoDescription: "תיאור SEO",
    weeklyHours: "שעות פתיחה שבועיות",
    specialHours: "שעות פתיחה מיוחדות",
    servicesTitle: "שירותים",
    photos: "תמונות",
    uploading: "מעלה…",
    uploadImage: "העלאת תמונה",
    imageFormatsHint: "JPEG, PNG או WebP, עד 5MB.",
    branchPhotoAlt: "תמונת הסניף",
    altText: "טקסט חלופי",
    mainImage: "תמונה ראשית",
    setMainImage: "הגדרה כתמונה ראשית",
    imageOrder: "סדר",
    saving: "שומר…",
    createBranch: "יצירת הסניף",
    save: "שמירה",
    cancel: "ביטול",
    mapLoadError: "לא ניתן לטעון את Google Maps.",
    mapNoCoordinates: "חפשו כתובת כדי להציג את מיקומה במפה.",
    inactiveService: "לא פעיל",
    closed: "סגור",
    secondSlot: "טווח שעות נוסף",
    specialReasonPlaceholder: "סיבה (לדוגמה: ערב ראש השנה)",
    fullDayClosed: "סגור במשך כל היום",
    optionalSecondSlot: "טווח שעות נוסף (אופציונלי):",
    addSpecialDate: "הוספת תאריך מיוחד",
    days: ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"],
    searchPlaceholder: "חיפוש לפי שם, slug או קוד",
    allCities: "כל הערים",
    allStatuses: "כל הסטטוסים",
    activePlural: "פעילים",
    inactivePlural: "לא פעילים",
    name: "שם",
    code: "קוד",
    city: "עיר",
    noResults: "לא נמצאו סניפים התואמים לקריטריונים.",
  },
  cities: {
    title: "ערים",
    newCity: "עיר חדשה",
    editCity: "עריכת עיר",
    identityAndCoordinates: "פרטי העיר ומיקום",
    name: "שם",
    slug: "Slug",
    latitude: "קו רוחב",
    longitude: "קו אורך",
    sortOrder: "סדר תצוגה",
    active: "פעיל",
    translations: "תרגומים",
    branches: "סניפים",
    saving: "שומר…",
    createCity: "יצירת העיר",
    save: "שמירה",
    cancel: "ביטול",
  },
  services: {
    title: "שירותים",
    newService: "שירות חדש",
    editService: "עריכת שירות",
    identity: "פרטים כלליים",
    name: "שם",
    slug: "Slug",
    icon: "אייקון (שם Lucide)",
    sortOrder: "סדר תצוגה",
    active: "פעיל",
    translations: "תרגומים",
    description: "תיאור",
    branches: "סניפים",
    saving: "שומר…",
    createService: "יצירת השירות",
    save: "שמירה",
    cancel: "ביטול",
  },
  promotions: {
    title: "מבצעים",
    newPromotion: "מבצע חדש",
    editPromotion: "עריכת המבצע",
    identity: "פרטים כלליים",
    imageUrl: "תמונה",
    uploadImage: "בחירת תמונה",
    uploadingImage: "מעלה תמונה…",
    removeImage: "הסרת התמונה",
    imageFormatsHint: "JPEG, PNG או WebP — עד 5 MB",
    priceSection: "מחיר",
    priceHint: "לדוגמה 29.90 — שדה ריק = מבצע ללא מוצר",
    originalPrice: "מחיר קודם",
    optional: "אופציונלי",
    currency: "מטבע",
    currencyHint: "כרגע נתמך מטבע אחד בלבד.",
    unit: "יחידה",
    unitUnit: "ליחידה",
    unitKg: "לקילוגרם (kg)",
    unitGram: "לגרם (g)",
    unitLiter: "לליטר (L)",
    unitMl: "למיליליטר (mL)",
    unitPack: "לאריזה",
    unitBox: "לקופסה",
    translations: "תרגומים",
    productName: "שם המוצר",
    translationTitle: "כותרת",
    description: "תיאור",
    ctaLabel: "טקסט הכפתור (CTA)",
    selectedBranches: "סניפים נבחרים",
    datesStatusFeatured: "תאריכים, סטטוס והבלטה",
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    statusLabel: "סטטוס",
    priorityLabel: "עדיפות",
    priorityHint: "מספר גבוה יותר = עדיפות גבוהה יותר; בשוויון נשמר סדר מקומי/כללי",
    ctaUrl: "כתובת הכפתור (CTA)",
    featuredLabel: "מבצע היום",
    publicOrderingHint: "בתצוגה הציבורית מבצע מקומי קודם למבצע כללי, ולאחר מכן לפי עדיפות בסדר יורד.",
    saving: "שומר…",
    createPromotion: "יצירת המבצע",
    save: "שמירה",
    cancel: "ביטול",
    preview: "תצוגה מקדימה",
    previewFallbackTitle: "(כותרת)",
    productTitle: "מוצר / כותרת",
    price: "מחיר",
    scope: "תחולה",
    featured: "מומלץ",
    priority: "עדיפות",
    allBranches: "כל הסניפים",
    branchCount: "סניפים",
    noResults: "אין מבצעים כרגע.",
    statuses: {
      draft: "טיוטה",
      scheduled: "מתוכנן",
      active: "פעיל",
      expired: "הסתיים",
      archived: "בארכיון",
    },
  },
  importExport: {
    title: "ייבוא / ייצוא",
    description:
      "ייבוא או עדכון של עשרות סניפים בבת אחת מקובץ CSV או XLSX.",

    importBranches: "ייבוא סניפים",
    importDescription:
      "פורמטים נתמכים: CSV או XLSX. מומלץ להשתמש בתבנית הרשמית. ההתאמה מתבצעת קודם לפי קוד סניף ולאחר מכן לפי Slug — לעולם לא לפי השם המוצג.",
    downloadTemplate: "הורדת תבנית CSV",
    selectFileFirst: "יש לבחור תחילה קובץ .csv או .xlsx",
    analyzing: "מתבצע ניתוח…",
    analyzePreview: "ניתוח ותצוגה מקדימה (ללא כתיבה)",
    restart: "התחלה מחדש",

    importCompleted: "הייבוא הושלם",
    createdBranches: "סניפים נוצרו",
    updatedBranches: "סניפים עודכנו",

    preview: "תצוגה מקדימה",
    dryRun: "טרם בוצעה כתיבה למסד הנתונים (מצב dry-run).",
    rows: "שורות",
    newRows: "חדשים",
    modifications: "עדכונים",
    errors: "שגיאות",
    ignored: "התעלמו",
    warningsSummary:
      "שורות עם אזהרות שאינן חוסמות — ניתן לראות את הפרטים למטה.",
    importing: "הייבוא מתבצע…",
    confirmImport: "אישור הייבוא",
    readOnlyRole:
      "ההרשאה שלך אינה מאפשרת לבצע ייבוא (קריאה בלבד).",
    noValidRows: "אין שורות תקינות לייבוא.",

    rowDetails: "פרטי השורות",
    row: "שורה",
    status: "סטטוס",
    branchCode: "קוד סניף",
    slug: "Slug",
    name: "שם",
    details: "פרטים",

    actionCreate: "חדש",
    actionUpdate: "עדכון",
    actionError: "שגיאה",
    actionIgnored: "התעלמות",

    exportTitle: "ייצוא",
    exportDescription:
      "ייצוא הסניפים משתמש באותם מזהים כמו הייבוא — קובץ שיוצא ולאחר מכן ייובא מחדש ללא שינוי יעדכן את אותם הסניפים.",
    branches: "סניפים",
    promotions: "מבצעים",
  },

  analytics: {
    title: "נתונים וסטטיסטיקות",
    description:
      "נתוני השימוש במאתר הסניפים — אינם מייצגים מכירות או ביקורים פיזיים בפועל, אלא אינטראקציות וכוונת ביקור הניתנות למדידה באינטרנט.",
    period: "תקופה",
    today: "היום",
    last7Days: "7 הימים האחרונים",
    last30Days: "30 הימים האחרונים",
    customPeriod: "תקופה מותאמת אישית",
    from: "מתאריך",
    to: "עד תאריך",
    branch: "סניף",
    allBranches: "כל הסניפים",
    city: "עיר",
    allCities: "כל הערים",
    language: "שפה",
    allLanguages: "כל השפות",
    filter: "סינון",
    reset: "איפוס",
    exportCsv: "ייצוא CSV",
    exportXlsx: "ייצוא XLSX (דוח מלא)",

    evolution: "מגמות",
    noActivity: "לא נרשמה פעילות בתקופה זו.",
    visitsEvolution: "מגמת צפיות",
    visitsEvolutionDescription:
      "צפיות במאתר הסניפים ובדפי הסניפים לפי יום.",
    day: "יום",
    locatorViews: "צפיות במאתר הסניפים",
    branchViews: "צפיות בדפי סניפים",

    visitIntentByDay: "כוונות ביקור לפי יום",
    visitIntentByDayDescription:
      "ניווט, שיחות ו-WhatsApp, מסוכמים לפי יום.",
    visitIntent: "כוונות ביקור",

    navigationPhoneWhatsapp: "ניווט / טלפון / WhatsApp",
    navigationPhoneWhatsappDescription:
      "פירוט שלושת הערוצים המרכיבים את כוונות הביקור.",
    navigation: "ניווט",
    phone: "טלפון",
    whatsapp: "WhatsApp",
    whatsappClicks: "לחיצות WhatsApp",

    promotionEngagement: "מעורבות במבצעים",
    promotionEngagementDescription:
      "צפיות ולחיצות על מבצעים לפי יום.",
    promotionViews: "צפיות במבצעים",
    promotionClicks: "לחיצות על מבצעים",

    branchResults: "תוצאות עבור",
    branchActionsDescription:
      "פעולות שנוצרו עבור סניף זה בתקופה שנבחרה (ניווט + שיחה + WhatsApp). נתון זה מודד עניין וכוונת ביקור שנוצרו באמצעות מאתר הסניפים — הוא אינו מייצג מכירות או ביקורים בפועל בסניף.",

    interactionVisitIntent: "אינטראקציה וכוונת ביקור",
    branchViewToNavigation: "צפייה בסניף ← ניווט",
    branchViewToNavigationDescription:
      "שיעור הצפיות בדף הסניף שלאחריהן בוצעה לחיצה על Waze, Google Maps או Apple Maps.",
    branchViewToPhone: "צפייה בסניף ← שיחה",
    branchViewToPhoneDescription:
      "שיעור הצפיות בדף הסניף שלאחריהן בוצעה לחיצה להתקשרות.",
    branchViewToWhatsapp: "צפייה בסניף ← WhatsApp",
    branchViewToWhatsappDescription:
      "שיעור הצפיות בדף הסניף שלאחריהן בוצעה לחיצה על WhatsApp.",
    promotionViewToClick: "צפייה במבצע ← לחיצה (CTR)",
    promotionViewToClickDescription:
      "שיעור הלחיצות על המבצעים שהוצגו.",

    previousPeriodVariation:
      "שינוי לעומת התקופה הקודמת באותו אורך",

    searches: "חיפושים",
    zeroResultSearches: "חיפושים ללא תוצאות",
    geolocationUses: "שימושים במיקום",
    navigationClicksTotal: "לחיצות ניווט (סה״כ)",
    wazeClicks: "לחיצות Waze",
    googleMapsClicks: "לחיצות Google Maps",
    appleMapsClicks: "לחיצות Apple Maps",
    calls: "שיחות",

    promotions: "מבצעים",
    promotionsDescription:
      "חשיפות ולחיצות לפי מבצע בתקופה שנבחרה.",
    promotion: "מבצע",
    scope: "תחולה",
    branches: "סניפים",
    impressions: "חשיפות",
    clicks: "לחיצות",
    ctr: "CTR",
    global: "כללי",
    local: "מקומי",
    noPromotionImpressions:
      "לא נרשמו חשיפות למבצעים בתקופה זו.",

    searchAnalysis: "ניתוח חיפושים",
    zeroResultRateDescription:
      "אזור שחיפשו בו ולא נמצא סניף מתאים בקרבת מקום — נתון שעשוי להצביע על פוטנציאל להרחבת הרשת.",
    searchLanguages: "שפות שבהן בוצעו החיפושים",
    noSearches: "לא נרשמו חיפושים בתקופה זו.",
    ofSearches: "מהחיפושים",
    topCities: "הערים המבוקשות ביותר",
    noCityMatches: "לא נמצאו התאמות לערים בתקופה זו.",
    topBranches: "הסניפים המבוקשים ביותר",
    noBranchMatches: "לא נמצאו התאמות לסניפים בתקופה זו.",

    bestBranches: "הסניפים עם הפעילות הגבוהה ביותר",
    bestBranchesDescription:
      "לחצו על עמודה כדי למיין. סניף ללא נתונים הוא סניף ללא פעילות בתקופה שנבחרה.",
    noBranchActivity: "לא נרשמה פעילות בתקופה זו.",
    views: "צפיות",
    promoViews: "צפיות במבצעים",
    promoClicks: "לחיצות על מבצעים",
  },

  dashboard: {
    title: "לוח בקרה",
    totalBranches: "סה״כ סניפים",
    activeBranches: "סניפים פעילים",
    inactiveBranches: "סניפים לא פעילים",
    openNowBranches: "פתוחים עכשיו",
    totalCities: "ערים",
    activePromotions: "מבצעים פעילים",
    scheduledPromotions: "מבצעים מתוכננים",
    recentChanges: "שינויים אחרונים",
    recentChangesDescription:
      "8 הסניפים או המבצעים האחרונים שעודכנו.",
    noChanges: "לא נרשמו שינויים.",
    branch: "סניף",
    promotion: "מבצע",
  },
  login: {
    title: "ניהול Maayan 2000",
    description: "התחברו באמצעות חשבון מנהל המערכת.",
    email: "אימייל",
    password: "סיסמה",
    submit: "התחברות",
    pending: "מתחבר…",
    requiredError: "יש להזין אימייל וסיסמה.",
    invalidError: "האימייל או הסיסמה שגויים.",
    rateLimitError:
      "בוצעו יותר מדי ניסיונות התחברות. יש לנסות שוב בעוד מספר דקות.",
  },
} satisfies AdminDictionary;

const dictionaries: Record<AdminLocale, AdminDictionary> = {
  fr,
  en,
  he,
};

export function getAdminDictionary(locale: AdminLocale): AdminDictionary {
  return dictionaries[locale];
}
