/**
 * Données DEMO — Phase 3.
 *
 * ATTENTION : toutes les données de ce fichier sont fictives (coordonnées
 * approximatives, adresses, téléphones, promotions). Elles ne représentent PAS
 * les magasins réels de Maayan 2000 (cahier des charges §74) — chaque magasin créé
 * par `seed.ts` porte `isDemo: true`. Une procédure d'import CSV/Excel (Phase 10)
 * remplacera ces données par les vraies données de la chaîne.
 *
 * Séparé de `seed.ts` (orchestration Prisma) pour garder les données lisibles et
 * modifiables indépendamment de la logique d'insertion.
 */

import type { AppLocale } from "../types/i18n";
import type { HoursPattern } from "../lib/opening-hours/patterns";

type Translations<T> = Record<AppLocale, T>;

// Réexporté pour compatibilité (`seed.ts` importait jusqu'ici `HoursPattern`
// depuis ce fichier) — la définition canonique vit désormais dans
// `lib/opening-hours/patterns.ts` (Phase 4), partagée avec toute fixture de
// développement qui a besoin des mêmes gabarits d'horaires sans passer par
// Prisma.
export type { HoursPattern };

export interface CitySeed {
  slug: string;
  latitude: number;
  longitude: number;
  translations: Translations<{ name: string }>;
}

export const CITIES: CitySeed[] = [
  {
    slug: "jerusalem",
    latitude: 31.7683,
    longitude: 35.2137,
    translations: {
      he: { name: "ירושלים" },
      en: { name: "Jerusalem" },
      ru: { name: "Иерусалим" },
      fr: { name: "Jérusalem" },
      es: { name: "Jerusalén" },
    },
  },
  {
    slug: "beit-shemesh",
    latitude: 31.7514,
    longitude: 34.9886,
    translations: {
      he: { name: "בית שמש" },
      en: { name: "Beit Shemesh" },
      ru: { name: "Бейт-Шемеш" },
      fr: { name: "Beit Shemesh" },
      es: { name: "Beit Shemesh" },
    },
  },
  {
    slug: "bnei-brak",
    latitude: 32.0807,
    longitude: 34.8338,
    translations: {
      he: { name: "בני ברק" },
      en: { name: "Bnei Brak" },
      ru: { name: "Бней-Брак" },
      fr: { name: "Bnei Brak" },
      es: { name: "Bnei Brak" },
    },
  },
  {
    slug: "ashdod",
    latitude: 31.8044,
    longitude: 34.6553,
    translations: {
      he: { name: "אשדוד" },
      en: { name: "Ashdod" },
      ru: { name: "Ашдод" },
      fr: { name: "Ashdod" },
      es: { name: "Asdod" },
    },
  },
  {
    slug: "netanya",
    latitude: 32.3215,
    longitude: 34.8532,
    translations: {
      he: { name: "נתניה" },
      en: { name: "Netanya" },
      ru: { name: "Нетания" },
      fr: { name: "Netanya" },
      es: { name: "Netanya" },
    },
  },
  {
    slug: "petah-tikva",
    latitude: 32.087,
    longitude: 34.8882,
    translations: {
      he: { name: "פתח תקווה" },
      en: { name: "Petah Tikva" },
      ru: { name: "Петах-Тиква" },
      fr: { name: "Petah Tikva" },
      es: { name: "Petaj Tikva" },
    },
  },
  {
    slug: "modiin",
    latitude: 31.8969,
    longitude: 35.0095,
    translations: {
      he: { name: "מודיעין" },
      en: { name: "Modiin" },
      ru: { name: "Модиин" },
      fr: { name: "Modiin" },
      es: { name: "Modiín" },
    },
  },
];

export interface ServiceSeed {
  slug: string;
  icon: string;
  translations: Translations<{ name: string; description: string }>;
}

export const SERVICES: ServiceSeed[] = [
  {
    slug: "delivery",
    icon: "truck",
    translations: {
      he: { name: "משלוחים", description: "משלוח עד הבית באזור הסניף" },
      en: { name: "Delivery", description: "Home delivery in the branch area" },
      ru: { name: "Доставка", description: "Доставка на дом в районе филиала" },
      fr: { name: "Livraison", description: "Livraison à domicile dans la zone du magasin" },
      es: { name: "Entrega a domicilio", description: "Entrega a domicilio en la zona de la tienda" },
    },
  },
  {
    slug: "butcher",
    icon: "beef",
    translations: {
      he: { name: "קצביה", description: "קצביה עם שירות אישי" },
      en: { name: "Butcher", description: "Full-service butcher counter" },
      ru: { name: "Мясная лавка", description: "Мясной прилавок с персональным обслуживанием" },
      fr: { name: "Boucherie", description: "Boucherie avec service personnalisé" },
      es: { name: "Carnicería", description: "Carnicería con atención personalizada" },
    },
  },
  {
    slug: "bakery",
    icon: "croissant",
    translations: {
      he: { name: "מאפייה", description: "מאפים טריים במהלך כל היום" },
      en: { name: "Bakery", description: "Fresh baked goods throughout the day" },
      ru: { name: "Пекарня", description: "Свежая выпечка в течение всего дня" },
      fr: { name: "Boulangerie", description: "Produits frais tout au long de la journée" },
      es: { name: "Panadería", description: "Productos horneados frescos todo el día" },
    },
  },
  {
    slug: "produce",
    icon: "carrot",
    translations: {
      he: { name: "פירות וירקות", description: "מחלקת פירות וירקות טריים" },
      en: { name: "Fruits & Vegetables", description: "Fresh produce department" },
      ru: { name: "Овощи и фрукты", description: "Отдел свежих овощей и фруктов" },
      fr: { name: "Fruits et légumes", description: "Rayon de produits frais" },
      es: { name: "Frutas y verduras", description: "Sección de productos frescos" },
    },
  },
  {
    slug: "deli",
    icon: "ham",
    translations: {
      he: { name: "מעדנייה", description: "מבחר גבינות, נקניקים ומטעמים" },
      en: { name: "Deli", description: "Selection of cheeses, cured meats and delicacies" },
      ru: { name: "Гастрономия", description: "Выбор сыров, колбас и деликатесов" },
      fr: { name: "Épicerie fine", description: "Sélection de fromages, charcuterie et mets fins" },
      es: { name: "Charcutería", description: "Selección de quesos, embutidos y delicatessen" },
    },
  },
  {
    slug: "parking",
    icon: "parking-circle",
    translations: {
      he: { name: "חניה", description: "חניון צמוד לסניף" },
      en: { name: "Parking", description: "Parking lot adjacent to the branch" },
      ru: { name: "Парковка", description: "Парковка рядом с филиалом" },
      fr: { name: "Parking", description: "Parking attenant au magasin" },
      es: { name: "Aparcamiento", description: "Aparcamiento junto a la tienda" },
    },
  },
  {
    slug: "accessibility",
    icon: "accessibility",
    translations: {
      he: { name: "נגישות", description: "סניף נגיש לבעלי מוגבלויות" },
      en: { name: "Accessibility", description: "Wheelchair-accessible branch" },
      ru: { name: "Доступность", description: "Филиал, доступный для людей с ограниченными возможностями" },
      fr: { name: "Accessibilité", description: "Magasin accessible aux personnes à mobilité réduite" },
      es: { name: "Accesibilidad", description: "Tienda accesible para personas con movilidad reducida" },
    },
  },
  {
    slug: "self-checkout",
    icon: "scan-barcode",
    translations: {
      he: { name: "קופות עצמאיות", description: "עמדות תשלום עצמי מהיר" },
      en: { name: "Self-Checkout", description: "Fast self-service checkout stations" },
      ru: { name: "Кассы самообслуживания", description: "Быстрые кассы самообслуживания" },
      fr: { name: "Caisses libre-service", description: "Bornes de paiement rapide en libre-service" },
      es: { name: "Cajas de autoservicio", description: "Cajas de autopago rápidas" },
    },
  },
  {
    slug: "customer-service",
    icon: "headset",
    translations: {
      he: { name: "שירות לקוחות", description: "דלפק שירות לקוחות בסניף" },
      en: { name: "Customer Service", description: "In-branch customer service desk" },
      ru: { name: "Обслуживание клиентов", description: "Стойка обслуживания клиентов в филиале" },
      fr: { name: "Service client", description: "Comptoir de service client sur place" },
      es: { name: "Atención al cliente", description: "Mostrador de atención al cliente en tienda" },
    },
  },
  {
    slug: "whatsapp",
    icon: "message-circle",
    translations: {
      he: { name: "WhatsApp", description: "צרו קשר עם הסניף ב-WhatsApp" },
      en: { name: "WhatsApp", description: "Contact the branch via WhatsApp" },
      ru: { name: "WhatsApp", description: "Свяжитесь с филиалом через WhatsApp" },
      fr: { name: "WhatsApp", description: "Contactez le magasin via WhatsApp" },
      es: { name: "WhatsApp", description: "Contacta con la tienda por WhatsApp" },
    },
  },
];

export interface SpecialHoursSeed {
  /** "YYYY-MM-DD" */
  date: string;
  title: Translations<string>;
  isClosed: boolean;
  openingTime?: string;
  closingTime?: string;
}

export interface BranchSeed {
  slug: string;
  branchCode: string;
  citySlug: string;
  district: string;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  whatsappNumber: string;
  mainImage: string;
  sortOrder: number;
  hoursPattern: HoursPattern;
  specialHours: SpecialHoursSeed[];
  serviceSlugs: string[];
  translations: Translations<{
    displayName: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
  }>;
  /** Variantes de recherche additionnelles (translittérations, quartiers). */
  searchAliases: { locale: AppLocale; alias: string }[];
  images: { url: string; alt: Translations<string> }[];
}

const ALL_SERVICES = SERVICES.map((s) => s.slug);
const CORE_SERVICES = ["parking", "accessibility", "self-checkout", "customer-service", "whatsapp"];

export const BRANCHES: BranchSeed[] = [
  {
    slug: "jerusalem-ramot",
    branchCode: "JLM-01",
    citySlug: "jerusalem",
    district: "רמות",
    address: "רחוב שמעון בר-כוכבא 12",
    postalCode: "9700212",
    latitude: 31.8172,
    longitude: 35.1937,
    phone: "+972-2-500-1001",
    email: "ramot@maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-1001",
    mainImage: "/demo/branches/jerusalem-ramot.jpg",
    sortOrder: 1,
    hoursPattern: "standard",
    specialHours: [
      {
        date: "2026-09-11",
        title: { he: "ערב ראש השנה", en: "Rosh Hashanah Eve", ru: "Канун Рош ха-Шана", fr: "Veille de Roch Hachana", es: "Víspera de Rosh Hashaná" },
        isClosed: false,
        openingTime: "07:00",
        closingTime: "14:00",
      },
      {
        date: "2026-09-12",
        title: { he: "ראש השנה", en: "Rosh Hashanah", ru: "Рош ха-Шана", fr: "Roch Hachana", es: "Rosh Hashaná" },
        isClosed: true,
      },
    ],
    serviceSlugs: [...CORE_SERVICES, "delivery", "bakery", "produce"],
    translations: {
      he: {
        displayName: "מעיין 2000 – רמות",
        description: "סניף מעיין 2000 בשכונת רמות בירושלים, עם מאפייה טרייה ומחלקת פירות וירקות.",
        seoTitle: "מעיין 2000 רמות ירושלים – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 ברמות, ירושלים: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Ramot",
        description: "Maayan 2000 branch in the Ramot neighborhood of Jerusalem, with a fresh bakery and produce department.",
        seoTitle: "Maayan 2000 Ramot Jerusalem – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Ramot branch in Jerusalem: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Рамот",
        description: "Филиал Maayan 2000 в районе Рамот в Иерусалиме, со свежей пекарней и отделом фруктов и овощей.",
        seoTitle: "Maayan 2000 Рамот Иерусалим – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Рамот, Иерусалим: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Ramot",
        description: "Magasin Maayan 2000 dans le quartier de Ramot à Jérusalem, avec boulangerie fraîche et rayon fruits et légumes.",
        seoTitle: "Maayan 2000 Ramot Jérusalem – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 de Ramot, Jérusalem : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Ramot",
        description: "Tienda Maayan 2000 en el barrio de Ramot, Jerusalén, con panadería fresca y sección de frutas y verduras.",
        seoTitle: "Maayan 2000 Ramot Jerusalén – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Ramot, Jerusalén: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [
      { locale: "en", alias: "Jerusalem Ramot" },
      { locale: "en", alias: "Ramot Allon" },
      { locale: "ru", alias: "Рамот Иерусалим" },
    ],
    images: [
      { url: "/demo/branches/jerusalem-ramot-1.jpg", alt: { he: "חזית הסניף ברמות", en: "Ramot branch storefront", ru: "Фасад филиала Рамот", fr: "Façade du magasin Ramot", es: "Fachada de la tienda Ramot" } },
    ],
  },
  {
    slug: "jerusalem-geula",
    branchCode: "JLM-02",
    citySlug: "jerusalem",
    district: "גאולה",
    address: "רחוב מלכי ישראל 45",
    postalCode: "9457845",
    latitude: 31.7857,
    longitude: 35.2154,
    phone: "+972-2-500-1002",
    email: "geula@maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-1002",
    mainImage: "/demo/branches/jerusalem-geula.jpg",
    sortOrder: 2,
    // Coupure méridienne (Phase 7, §26) — couvre en données DEMO le cas des
    // deux créneaux dans une journée (07:00–13:30, 16:00–22:00).
    hoursPattern: "split",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "butcher", "deli"],
    translations: {
      he: {
        displayName: "מעיין 2000 – גאולה",
        description: "סניף מעיין 2000 בלב שכונת גאולה, עם קצביה ומעדנייה.",
        seoTitle: "מעיין 2000 גאולה ירושלים – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 בגאולה, ירושלים: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Geula",
        description: "Maayan 2000 branch in the heart of the Geula neighborhood, with a butcher counter and deli.",
        seoTitle: "Maayan 2000 Geula Jerusalem – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Geula branch in Jerusalem: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Геула",
        description: "Филиал Maayan 2000 в самом сердце района Геула, с мясным прилавком и гастрономией.",
        seoTitle: "Maayan 2000 Геула Иерусалим – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Геула, Иерусалим: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Geula",
        description: "Magasin Maayan 2000 au cœur du quartier de Geula, avec boucherie et épicerie fine.",
        seoTitle: "Maayan 2000 Geula Jérusalem – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 de Geula, Jérusalem : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Geula",
        description: "Tienda Maayan 2000 en el corazón del barrio de Geula, con carnicería y charcutería.",
        seoTitle: "Maayan 2000 Geula Jerusalén – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Geula, Jerusalén: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [
      { locale: "en", alias: "Jerusalem Geula" },
      { locale: "ru", alias: "Геула Иерусалим" },
    ],
    images: [],
  },
  {
    slug: "jerusalem-talpiot",
    branchCode: "JLM-03",
    citySlug: "jerusalem",
    district: "תלפיות",
    address: "דרך חברון 88",
    postalCode: "9339208",
    latitude: 31.75,
    longitude: 35.225,
    phone: "+972-2-500-1003",
    email: "talpiot@maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-1003",
    mainImage: "/demo/branches/jerusalem-talpiot.jpg",
    sortOrder: 3,
    hoursPattern: "extended",
    specialHours: [],
    serviceSlugs: ALL_SERVICES,
    translations: {
      he: {
        displayName: "מעיין 2000 – תלפיות",
        description: "הסניף הגדול של מעיין 2000 באזור התעשייה תלפיות, עם כל השירותים ושעות פעילות מורחבות.",
        seoTitle: "מעיין 2000 תלפיות ירושלים – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 בתלפיות, ירושלים: כתובת, שעות פתיחה מורחבות, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Talpiot",
        description: "Maayan 2000's flagship branch in the Talpiot industrial area, with every service and extended hours.",
        seoTitle: "Maayan 2000 Talpiot Jerusalem – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Talpiot branch in Jerusalem: address, extended opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Тальпиот",
        description: "Флагманский филиал Maayan 2000 в промышленной зоне Тальпиот, со всеми услугами и увеличенными часами работы.",
        seoTitle: "Maayan 2000 Тальпиот Иерусалим – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Тальпиот, Иерусалим: адрес, расширенные часы работы, услуги и маршрут.",
      },
      fr: {
        displayName: "Maayan 2000 – Talpiot",
        description: "Le magasin phare de Maayan 2000 dans la zone industrielle de Talpiot, avec tous les services et des horaires étendus.",
        seoTitle: "Maayan 2000 Talpiot Jérusalem – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 de Talpiot, Jérusalem : adresse, horaires étendus, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Talpiot",
        description: "La tienda insignia de Maayan 2000 en la zona industrial de Talpiot, con todos los servicios y horario ampliado.",
        seoTitle: "Maayan 2000 Talpiot Jerusalén – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Talpiot, Jerusalén: dirección, horario ampliado, servicios y cómo llegar.",
      },
    },
    searchAliases: [
      { locale: "en", alias: "Jerusalem Talpiot" },
      { locale: "en", alias: "Talpiyot" },
    ],
    images: [],
  },
  {
    slug: "beit-shemesh-ramat",
    branchCode: "BSH-01",
    citySlug: "beit-shemesh",
    district: "רמת בית שמש",
    address: "שדרות נחל שורק 5",
    postalCode: "9909305",
    latitude: 31.7089,
    longitude: 34.9822,
    phone: "+972-2-500-2001",
    email: "ramat-bs@maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-2001",
    mainImage: "/demo/branches/beit-shemesh-ramat.jpg",
    sortOrder: 4,
    hoursPattern: "standard",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "bakery", "produce"],
    translations: {
      he: {
        displayName: "מעיין 2000 – רמת בית שמש",
        description: "סניף שכונתי בשדרות נחל שורק, רמת בית שמש.",
        seoTitle: "מעיין 2000 רמת בית שמש – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 ברמת בית שמש: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Ramat Beit Shemesh",
        description: "Neighborhood branch on Nachal Sorek Boulevard, Ramat Beit Shemesh.",
        seoTitle: "Maayan 2000 Ramat Beit Shemesh – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Ramat Beit Shemesh branch: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Рамат-Бейт-Шемеш",
        description: "Районный филиал на бульваре Нахаль-Сорек, Рамат-Бейт-Шемеш.",
        seoTitle: "Maayan 2000 Рамат-Бейт-Шемеш – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Рамат-Бейт-Шемеш: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Ramat Beit Shemesh",
        description: "Magasin de quartier boulevard Nahal Sorek, Ramat Beit Shemesh.",
        seoTitle: "Maayan 2000 Ramat Beit Shemesh – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 de Ramat Beit Shemesh : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Ramat Beit Shemesh",
        description: "Tienda de barrio en el bulevar Najal Sorek, Ramat Beit Shemesh.",
        seoTitle: "Maayan 2000 Ramat Beit Shemesh – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Ramat Beit Shemesh: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [{ locale: "en", alias: "RBS" }],
    images: [],
  },
  {
    slug: "bnei-brak-center",
    branchCode: "BB-01",
    citySlug: "bnei-brak",
    district: "מרכז העיר",
    address: "רחוב רבי עקיבא 60",
    postalCode: "5120360",
    latitude: 32.0807,
    longitude: 34.8338,
    phone: "+972-3-500-3001",
    email: "center@maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-3001",
    mainImage: "/demo/branches/bnei-brak-center.jpg",
    sortOrder: 5,
    hoursPattern: "extended",
    specialHours: [],
    serviceSlugs: ALL_SERVICES,
    translations: {
      he: {
        displayName: "מעיין 2000 – בני ברק מרכז",
        description: "סניף מרכזי ברחוב רבי עקיבא, בני ברק, עם מגוון שירותים מלא.",
        seoTitle: "מעיין 2000 בני ברק מרכז – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 במרכז בני ברק: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Bnei Brak Center",
        description: "Central branch on Rabbi Akiva Street, Bnei Brak, with the full range of services.",
        seoTitle: "Maayan 2000 Bnei Brak Center – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Bnei Brak Center branch: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Бней-Брак Центр",
        description: "Центральный филиал на улице Раби Акива, Бней-Брак, с полным набором услуг.",
        seoTitle: "Maayan 2000 Бней-Брак Центр – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в центре Бней-Брака: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Bnei Brak Centre",
        description: "Magasin central rue Rabbi Akiva, Bnei Brak, avec la gamme complète de services.",
        seoTitle: "Maayan 2000 Bnei Brak Centre – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 du centre de Bnei Brak : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Bnei Brak Centro",
        description: "Tienda central en la calle Rabbi Akiva, Bnei Brak, con la gama completa de servicios.",
        seoTitle: "Maayan 2000 Bnei Brak Centro – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 del centro de Bnei Brak: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [
      { locale: "en", alias: "B'nei Brak" },
      { locale: "en", alias: "Bne Brak" },
    ],
    images: [],
  },
  {
    slug: "bnei-brak-pardes-katz",
    branchCode: "BB-02",
    citySlug: "bnei-brak",
    district: "פרדס כץ",
    address: "רחוב כהנמן 20",
    postalCode: "5124420",
    latitude: 32.0917,
    longitude: 34.8547,
    phone: "+972-3-500-3002",
    email: "pardes-katz@maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-3002",
    mainImage: "/demo/branches/bnei-brak-pardes-katz.jpg",
    sortOrder: 6,
    hoursPattern: "standard",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "delivery", "butcher"],
    translations: {
      he: {
        displayName: "מעיין 2000 – פרדס כץ",
        description: "סניף שכונתי בפרדס כץ, בני ברק.",
        seoTitle: "מעיין 2000 פרדס כץ בני ברק – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 בפרדס כץ, בני ברק: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Pardes Katz",
        description: "Neighborhood branch in Pardes Katz, Bnei Brak.",
        seoTitle: "Maayan 2000 Pardes Katz Bnei Brak – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Pardes Katz branch in Bnei Brak: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Пардес-Кац",
        description: "Районный филиал в Пардес-Кац, Бней-Брак.",
        seoTitle: "Maayan 2000 Пардес-Кац Бней-Брак – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Пардес-Кац, Бней-Брак: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Pardes Katz",
        description: "Magasin de quartier à Pardes Katz, Bnei Brak.",
        seoTitle: "Maayan 2000 Pardes Katz Bnei Brak – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 de Pardes Katz, Bnei Brak : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Pardes Katz",
        description: "Tienda de barrio en Pardes Katz, Bnei Brak.",
        seoTitle: "Maayan 2000 Pardes Katz Bnei Brak – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Pardes Katz, Bnei Brak: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [],
    images: [],
  },
  {
    slug: "ashdod-center",
    branchCode: "ASH-01",
    citySlug: "ashdod",
    district: "מרכז העיר",
    address: "רחוב הנשיא 30",
    postalCode: "7752230",
    latitude: 31.8044,
    longitude: 34.6553,
    phone: "+972-8-500-4001",
    email: "center@ashdod.maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-4001",
    mainImage: "/demo/branches/ashdod-center.jpg",
    sortOrder: 7,
    hoursPattern: "extended",
    specialHours: [
      {
        date: "2026-09-11",
        title: { he: "ערב ראש השנה", en: "Rosh Hashanah Eve", ru: "Канун Рош ха-Шана", fr: "Veille de Roch Hachana", es: "Víspera de Rosh Hashaná" },
        isClosed: false,
        openingTime: "07:00",
        closingTime: "14:30",
      },
    ],
    serviceSlugs: ALL_SERVICES,
    translations: {
      he: {
        displayName: "מעיין 2000 – אשדוד מרכז",
        description: "סניף מרכזי ברחוב הנשיא, אשדוד.",
        seoTitle: "מעיין 2000 אשדוד מרכז – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 במרכז אשדוד: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Ashdod Center",
        description: "Central branch on HaNassi Street, Ashdod.",
        seoTitle: "Maayan 2000 Ashdod Center – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Ashdod Center branch: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Ашдод Центр",
        description: "Центральный филиал на улице ха-Наси, Ашдод.",
        seoTitle: "Maayan 2000 Ашдод Центр – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в центре Ашдода: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Ashdod Centre",
        description: "Magasin central rue HaNassi, Ashdod.",
        seoTitle: "Maayan 2000 Ashdod Centre – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 du centre d'Ashdod : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Asdod Centro",
        description: "Tienda central en la calle HaNassi, Asdod.",
        seoTitle: "Maayan 2000 Asdod Centro – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 del centro de Asdod: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [{ locale: "es", alias: "Ashdod" }],
    images: [],
  },
  {
    slug: "ashdod-rova-daled",
    branchCode: "ASH-02",
    citySlug: "ashdod",
    district: "רובע ד'",
    address: "רחוב הרב אבו חצירא 8",
    postalCode: "7756108",
    latitude: 31.794,
    longitude: 34.6446,
    phone: "+972-8-500-4002",
    email: "rova-daled@ashdod.maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-4002",
    mainImage: "/demo/branches/ashdod-rova-daled.jpg",
    sortOrder: 8,
    hoursPattern: "standard",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "produce", "deli"],
    translations: {
      he: {
        displayName: "מעיין 2000 – רובע ד'",
        description: "סניף שכונתי ברובע ד', אשדוד.",
        seoTitle: "מעיין 2000 רובע ד' אשדוד – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 ברובע ד', אשדוד: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Rova Daled",
        description: "Neighborhood branch in Rova Daled, Ashdod.",
        seoTitle: "Maayan 2000 Rova Daled Ashdod – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Rova Daled branch in Ashdod: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Рова Далет",
        description: "Районный филиал в квартале Рова Далет, Ашдод.",
        seoTitle: "Maayan 2000 Рова Далет Ашдод – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Рова Далет, Ашдод: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Rova Daled",
        description: "Magasin de quartier à Rova Daled, Ashdod.",
        seoTitle: "Maayan 2000 Rova Daled Ashdod – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 de Rova Daled, Ashdod : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Rova Daled",
        description: "Tienda de barrio en Rova Daled, Asdod.",
        seoTitle: "Maayan 2000 Rova Daled Asdod – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Rova Daled, Asdod: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [],
    images: [],
  },
  {
    slug: "netanya-center",
    branchCode: "NTY-01",
    citySlug: "netanya",
    district: "מרכז העיר",
    address: "שדרות בן גוריון 40",
    postalCode: "4250540",
    latitude: 32.3215,
    longitude: 34.8532,
    phone: "+972-9-500-5001",
    email: "center@netanya.maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-5001",
    mainImage: "/demo/branches/netanya-center.jpg",
    sortOrder: 9,
    hoursPattern: "standard",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "delivery", "bakery", "deli"],
    translations: {
      he: {
        displayName: "מעיין 2000 – נתניה מרכז",
        description: "סניף מרכזי בשדרות בן גוריון, נתניה.",
        seoTitle: "מעיין 2000 נתניה מרכז – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 במרכז נתניה: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Netanya Center",
        description: "Central branch on Ben Gurion Boulevard, Netanya.",
        seoTitle: "Maayan 2000 Netanya Center – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Netanya Center branch: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Нетания Центр",
        description: "Центральный филиал на бульваре Бен-Гуриона, Нетания.",
        seoTitle: "Maayan 2000 Нетания Центр – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в центре Нетании: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Netanya Centre",
        description: "Magasin central boulevard Ben Gourion, Netanya.",
        seoTitle: "Maayan 2000 Netanya Centre – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 du centre de Netanya : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Netanya Centro",
        description: "Tienda central en el bulevar Ben Gurion, Netanya.",
        seoTitle: "Maayan 2000 Netanya Centro – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 del centro de Netanya: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [],
    images: [],
  },
  {
    slug: "petah-tikva-center",
    branchCode: "PTK-01",
    citySlug: "petah-tikva",
    district: "מרכז העיר",
    address: "רחוב חובבי ציון 15",
    postalCode: "4951815",
    latitude: 32.087,
    longitude: 34.8882,
    phone: "+972-3-500-6001",
    email: "center@petah-tikva.maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-6001",
    mainImage: "/demo/branches/petah-tikva-center.jpg",
    sortOrder: 10,
    hoursPattern: "standard",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "produce", "butcher"],
    translations: {
      he: {
        displayName: "מעיין 2000 – פתח תקווה מרכז",
        description: "סניף מרכזי ברחוב חובבי ציון, פתח תקווה.",
        seoTitle: "מעיין 2000 פתח תקווה מרכז – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 במרכז פתח תקווה: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Petah Tikva Center",
        description: "Central branch on Hovevei Zion Street, Petah Tikva.",
        seoTitle: "Maayan 2000 Petah Tikva Center – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Petah Tikva Center branch: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Петах-Тиква Центр",
        description: "Центральный филиал на улице Ховевей-Цион, Петах-Тиква.",
        seoTitle: "Maayan 2000 Петах-Тиква Центр – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в центре Петах-Тиквы: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Petah Tikva Centre",
        description: "Magasin central rue Hovevei Zion, Petah Tikva.",
        seoTitle: "Maayan 2000 Petah Tikva Centre – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 du centre de Petah Tikva : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Petaj Tikva Centro",
        description: "Tienda central en la calle Hovevei Zion, Petaj Tikva.",
        seoTitle: "Maayan 2000 Petaj Tikva Centro – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 del centro de Petaj Tikva: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [{ locale: "en", alias: "Petach Tikva" }],
    images: [],
  },
  {
    slug: "petah-tikva-em-hamoshavot",
    branchCode: "PTK-02",
    citySlug: "petah-tikva",
    district: "אם המושבות",
    address: "רחוב אם המושבות 102",
    postalCode: "4930102",
    latitude: 32.0956,
    longitude: 34.8811,
    phone: "+972-3-500-6002",
    email: "em-hamoshavot@petah-tikva.maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-6002",
    mainImage: "/demo/branches/petah-tikva-em-hamoshavot.jpg",
    sortOrder: 11,
    hoursPattern: "standard",
    specialHours: [],
    serviceSlugs: [...CORE_SERVICES, "delivery"],
    translations: {
      he: {
        displayName: "מעיין 2000 – אם המושבות",
        description: "סניף שכונתי ברחוב אם המושבות, פתח תקווה.",
        seoTitle: "מעיין 2000 אם המושבות פתח תקווה – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 באם המושבות, פתח תקווה: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Em HaMoshavot",
        description: "Neighborhood branch on Em HaMoshavot Street, Petah Tikva.",
        seoTitle: "Maayan 2000 Em HaMoshavot Petah Tikva – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Em HaMoshavot branch in Petah Tikva: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Эм ха-Мошавот",
        description: "Районный филиал на улице Эм ха-Мошавот, Петах-Тиква.",
        seoTitle: "Maayan 2000 Эм ха-Мошавот Петах-Тиква – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в Эм ха-Мошавот, Петах-Тиква: адрес, часы работы, услуги и маршрут.",
      },
      fr: {
        displayName: "Maayan 2000 – Em HaMoshavot",
        description: "Magasin de quartier rue Em HaMoshavot, Petah Tikva.",
        seoTitle: "Maayan 2000 Em HaMoshavot Petah Tikva – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 d'Em HaMoshavot, Petah Tikva : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Em HaMoshavot",
        description: "Tienda de barrio en la calle Em HaMoshavot, Petaj Tikva.",
        seoTitle: "Maayan 2000 Em HaMoshavot Petaj Tikva – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 de Em HaMoshavot, Petaj Tikva: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [],
    images: [],
  },
  {
    slug: "modiin-center",
    branchCode: "MOD-01",
    citySlug: "modiin",
    district: "מרכז העיר",
    address: "שדרות ההסתדרות 7",
    postalCode: "7177457",
    latitude: 31.8969,
    longitude: 35.0095,
    phone: "+972-8-500-7001",
    email: "center@modiin.maayan2000-demo.co.il",
    whatsappNumber: "+972-50-500-7001",
    mainImage: "/demo/branches/modiin-center.jpg",
    sortOrder: 12,
    hoursPattern: "extended",
    specialHours: [],
    serviceSlugs: ALL_SERVICES,
    translations: {
      he: {
        displayName: "מעיין 2000 – מודיעין מרכז",
        description: "סניף מרכזי בשדרות ההסתדרות, מודיעין, עם מגוון שירותים מלא.",
        seoTitle: "מעיין 2000 מודיעין מרכז – שעות פתיחה, כתובת וניווט",
        seoDescription: "כל המידע על סניף מעיין 2000 במרכז מודיעין: כתובת, שעות פתיחה, שירותים וניווט מהיר.",
      },
      en: {
        displayName: "Maayan 2000 – Modiin Center",
        description: "Central branch on HaHistadrut Boulevard, Modiin, with the full range of services.",
        seoTitle: "Maayan 2000 Modiin Center – Hours, Address & Directions",
        seoDescription: "Everything about the Maayan 2000 Modiin Center branch: address, opening hours, services and directions.",
      },
      ru: {
        displayName: "Maayan 2000 – Модиин Центр",
        description: "Центральный филиал на бульваре ха-Гистадрут, Модиин, с полным набором услуг.",
        seoTitle: "Maayan 2000 Модиин Центр – часы работы, адрес и маршрут",
        seoDescription: "Вся информация о филиале Maayan 2000 в центре Модиина: адрес, часы работы, услуги и маршрут проезда.",
      },
      fr: {
        displayName: "Maayan 2000 – Modiin Centre",
        description: "Magasin central boulevard HaHistadrut, Modiin, avec la gamme complète de services.",
        seoTitle: "Maayan 2000 Modiin Centre – Horaires, adresse et navigation",
        seoDescription: "Toutes les informations sur le magasin Maayan 2000 du centre de Modiin : adresse, horaires, services et itinéraire.",
      },
      es: {
        displayName: "Maayan 2000 – Modiín Centro",
        description: "Tienda central en el bulevar HaHistadrut, Modiín, con la gama completa de servicios.",
        seoTitle: "Maayan 2000 Modiín Centro – Horarios, dirección y cómo llegar",
        seoDescription: "Toda la información sobre la tienda Maayan 2000 del centro de Modiín: dirección, horarios, servicios y cómo llegar.",
      },
    },
    searchAliases: [{ locale: "en", alias: "Modi'in" }],
    images: [],
  },
];

/** Devise/unité redéclarées ici en union de chaînes littérales — même
 * principe que `PromotionStatus` ci-dessous : `@prisma/client` n'exporte ses
 * enums générés qu'après `prisma generate`, indisponible dans ce bac à sable
 * (voir le résumé de Phase 3). Synchronisées à la main avec
 * `prisma/schema.prisma#Currency`/`#PromotionUnit`. */
export type PromotionSeedCurrency = "ILS";
export type PromotionSeedUnit = "UNIT" | "KG" | "GRAM" | "LITER" | "ML" | "PACK" | "BOX";

export interface PromotionSeed {
  /** Identifiant stable (Phase 9, §1/§21) — devient la valeur de la colonne
   * `Promotion.slug` ET remplace `image` comme clé d'identification pour le
   * ré-seed idempotent (`seed.ts#seedPromotions()`) : la migration
   * `20260830010000_promotion_pricing` backfille exactement ces mêmes
   * valeurs pour les 3 promotions déjà en base au moment de son écriture. */
  slug: string;
  image: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DRAFT" | "ARCHIVED";
  appliesToAll: boolean;
  branchSlugs: string[];
  /**
   * Tarification structurée (Phase 9, §1/§2/§4/§5) — TOUS optionnels et
   * omis ensemble pour une promotion purement éditoriale sans produit précis
   * (c'est le cas des 3 promotions historiques ci-dessous : bannières sans
   * prix). Une promotion AVEC produit renseigne au minimum `price` ; `unit`
   * et `currency` ont un défaut (`UNIT`/`ILS`) appliqué par `seed.ts` si
   * omis, mais restent explicites ici par lisibilité.
   *
   * `price`/`originalPrice` sont des CHAÎNES décimales ("29.90"), jamais un
   * nombre flottant JS (§2 : aucune approximation binaire sur un montant
   * financier, ni ici ni dans le reste de la chaîne de données).
   */
  price?: string;
  originalPrice?: string;
  currency?: PromotionSeedCurrency;
  unit?: PromotionSeedUnit;
  /** "Promotion du jour" (§10) — jamais déduit, toujours explicite ici aussi. */
  isFeatured?: boolean;
  /** Ordre d'affichage manuel (§8), défaut 0 si omis. */
  priority?: number;
  translations: Translations<{
    title: string;
    description: string;
    ctaLabel: string;
    /** Nom du produit affiché (§1/§11) — `undefined`/absent pour une
     * promotion éditoriale sans produit structuré, comme `price` ci-dessus. */
    productName?: string;
  }>;
}

export const PROMOTIONS: PromotionSeed[] = [
  {
    slug: "back-to-school-2026",
    image: "/demo/promotions/back-to-school.jpg",
    startDate: "2026-08-20",
    endDate: "2026-09-05",
    status: "ACTIVE",
    appliesToAll: true,
    branchSlugs: [],
    translations: {
      he: { title: "מבצע חזרה לבית הספר", description: "הנחות על מגוון מוצרי מזון וציוד לארוחות עשר בכל הסניפים.", ctaLabel: "לפרטים" },
      en: { title: "Back to School Sale", description: "Discounts on a range of food products and lunchbox essentials in every branch.", ctaLabel: "Learn more" },
      ru: { title: "Распродажа к началу учебного года", description: "Скидки на широкий ассортимент продуктов и товаров для школьных завтраков во всех филиалах.", ctaLabel: "Подробнее" },
      fr: { title: "Promotion rentrée scolaire", description: "Remises sur une large gamme de produits alimentaires et d'articles pour le goûter, dans tous les magasins.", ctaLabel: "En savoir plus" },
      es: { title: "Oferta de vuelta al cole", description: "Descuentos en una amplia gama de productos alimenticios y artículos para la merienda en todas las tiendas.", ctaLabel: "Más información" },
    },
  },
  {
    slug: "jerusalem-grand-opening",
    image: "/demo/promotions/grand-opening-jerusalem.jpg",
    startDate: "2026-08-15",
    endDate: "2026-09-15",
    status: "ACTIVE",
    appliesToAll: false,
    branchSlugs: ["jerusalem-ramot", "jerusalem-geula", "jerusalem-talpiot"],
    translations: {
      he: { title: "מבצעי פתיחה בסניפי ירושלים", description: "הטבות מיוחדות בסניפי רמות, גאולה ותלפיות.", ctaLabel: "לפרטים" },
      en: { title: "Grand Opening Deals in Jerusalem", description: "Special offers at the Ramot, Geula and Talpiot branches.", ctaLabel: "Learn more" },
      ru: { title: "Акции открытия в филиалах Иерусалима", description: "Специальные предложения в филиалах Рамот, Геула и Тальпиот.", ctaLabel: "Подробнее" },
      fr: { title: "Offres d'ouverture à Jérusalem", description: "Offres spéciales dans les magasins de Ramot, Geula et Talpiot.", ctaLabel: "En savoir plus" },
      es: { title: "Ofertas de apertura en Jerusalén", description: "Ofertas especiales en las tiendas de Ramot, Geula y Talpiot.", ctaLabel: "Más información" },
    },
  },
  {
    slug: "rosh-hashanah-2026",
    image: "/demo/promotions/rosh-hashanah.jpg",
    startDate: "2026-09-06",
    endDate: "2026-09-12",
    status: "SCHEDULED",
    appliesToAll: true,
    branchSlugs: [],
    translations: {
      he: { title: "מבצעי ראש השנה", description: "מוצרי חג במחירים מיוחדים לקראת ראש השנה תשפ״ז.", ctaLabel: "לפרטים" },
      en: { title: "Rosh Hashanah Deals", description: "Holiday products at special prices ahead of Rosh Hashanah.", ctaLabel: "Learn more" },
      ru: { title: "Акции к Рош ха-Шана", description: "Праздничные товары по специальным ценам к Рош ха-Шана.", ctaLabel: "Подробнее" },
      fr: { title: "Offres de Roch Hachana", description: "Produits de fête à prix spéciaux avant Roch Hachana.", ctaLabel: "En savoir plus" },
      es: { title: "Ofertas de Rosh Hashaná", description: "Productos festivos a precios especiales antes de Rosh Hashaná.", ctaLabel: "Más información" },
    },
  },

  // ============================================================
  // Phase 9 — promotions structurées avec produit + prix (§22 : toutes
  // clairement DEMO, `isDemo: true` appliqué par `seed.ts`). Couvrent
  // ensemble tous les scénarios demandés : produit au kg, produit à l'unité,
  // ancien+nouveau prix (réduction), promotion globale, promotion locale
  // (un seul magasin ET plusieurs magasins), promotion "du jour" (featured),
  // promotion expirée, promotion future.
  // ============================================================
  {
    // Exemple donné littéralement par le cahier des charges Phase 9 : "עוף
    // טרי, 29.90 ₪ / ק"ג, בתוקף בסניף מעיין 2000 רמות, עד 03/09" — produit au
    // KG, ancien+nouveau prix, LOCALE (un seul magasin), FEATURED (§10 :
    // "promotion du jour"), priorité haute.
    slug: "fresh-chicken-ramot",
    image: "/demo/promotions/fresh-chicken.jpg",
    startDate: "2026-08-25",
    endDate: "2026-09-03",
    status: "ACTIVE",
    appliesToAll: false,
    branchSlugs: ["jerusalem-ramot"],
    price: "29.90",
    originalPrice: "39.90",
    currency: "ILS",
    unit: "KG",
    isFeatured: true,
    priority: 10,
    translations: {
      he: { title: "מבצע היום", description: "עוף טרי במחיר מיוחד, ליום בלבד.", ctaLabel: "לפרטים", productName: "עוף טרי" },
      en: { title: "Today's Deal", description: "Fresh chicken at a special price, today only.", ctaLabel: "Learn more", productName: "Fresh chicken" },
      ru: { title: "Акция дня", description: "Свежая курица по специальной цене, только сегодня.", ctaLabel: "Подробнее", productName: "Свежая курица" },
      fr: { title: "Promotion aujourd'hui", description: "Poulet frais à prix spécial, aujourd'hui seulement.", ctaLabel: "En savoir plus", productName: "Poulet frais" },
      es: { title: "Oferta de hoy", description: "Pollo fresco a precio especial, solo hoy.", ctaLabel: "Más información", productName: "Pollo fresco" },
    },
  },
  {
    // Produit au LITRE, GLOBALE (tous les magasins), sans ancien prix — teste
    // le cas "prix simple, pas de réduction affichée" (§5 : ne pas inventer
    // de réduction en l'absence d'`originalPrice`).
    slug: "olive-oil-liter-global",
    image: "/demo/promotions/olive-oil.jpg",
    startDate: "2026-08-24",
    endDate: "2026-09-10",
    status: "ACTIVE",
    appliesToAll: true,
    branchSlugs: [],
    price: "24.90",
    currency: "ILS",
    unit: "LITER",
    isFeatured: false,
    priority: 5,
    translations: {
      he: { title: "מבצע שמן זית", description: "שמן זית כתית מעולה, מבצע בכל הסניפים.", ctaLabel: "לפרטים", productName: "שמן זית כתית מעולה" },
      en: { title: "Olive Oil Deal", description: "Extra virgin olive oil, on sale in every branch.", ctaLabel: "Learn more", productName: "Extra virgin olive oil" },
      ru: { title: "Акция на оливковое масло", description: "Оливковое масло extra virgin, акция во всех филиалах.", ctaLabel: "Подробнее", productName: "Оливковое масло extra virgin" },
      fr: { title: "Promotion huile d'olive", description: "Huile d'olive extra vierge, en promotion dans tous les magasins.", ctaLabel: "En savoir plus", productName: "Huile d'olive extra vierge" },
      es: { title: "Oferta de aceite de oliva", description: "Aceite de oliva virgen extra, en oferta en todas las tiendas.", ctaLabel: "Más información", productName: "Aceite de oliva virgen extra" },
    },
  },
  {
    // Produit vendu au PACK (à l'unité), LOCALE mais PLUSIEURS magasins (pas
    // un seul) — teste `appliesToAll: false` avec `branchSlugs.length > 1`,
    // avec ancien+nouveau prix également.
    slug: "pita-pack-bnei-brak",
    image: "/demo/promotions/pita-pack.jpg",
    startDate: "2026-08-26",
    endDate: "2026-09-08",
    status: "ACTIVE",
    appliesToAll: false,
    branchSlugs: ["bnei-brak-center", "bnei-brak-pardes-katz"],
    price: "9.90",
    originalPrice: "12.90",
    currency: "ILS",
    unit: "PACK",
    isFeatured: false,
    priority: 3,
    translations: {
      he: { title: "מבצע פיתות", description: "חבילת פיתות טריות, מבצע בסניפי בני ברק.", ctaLabel: "לפרטים", productName: "חבילת פיתות (8 יח')" },
      en: { title: "Pita Pack Deal", description: "Fresh pita pack, on sale at the Bnei Brak branches.", ctaLabel: "Learn more", productName: "Pita pack (8 pcs)" },
      ru: { title: "Акция на питу", description: "Упаковка свежей питы, акция в филиалах Бней-Брак.", ctaLabel: "Подробнее", productName: "Упаковка питы (8 шт.)" },
      fr: { title: "Promotion pitas", description: "Paquet de pitas fraîches, en promotion dans les magasins de Bnei Brak.", ctaLabel: "En savoir plus", productName: "Paquet de pitas (8 pièces)" },
      es: { title: "Oferta de pitas", description: "Paquete de pitas frescas, en oferta en las tiendas de Bnei Brak.", ctaLabel: "Más información", productName: "Paquete de pitas (8 uds.)" },
    },
  },
  {
    // Promotion EXPIRÉE avec produit/prix (§22) — statut explicite `EXPIRED`
    // ET dates dans le passé : `isPromotionActive()` doit l'exclure sur les
    // DEUX critères, jamais affichée nulle part.
    slug: "summer-cheese-sale-expired",
    image: "/demo/promotions/summer-cheese.jpg",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    status: "EXPIRED",
    appliesToAll: true,
    branchSlugs: [],
    price: "14.90",
    originalPrice: "18.90",
    currency: "ILS",
    unit: "UNIT",
    isFeatured: false,
    priority: 0,
    translations: {
      he: { title: "מבצע גבינות קיץ", description: "מבצע שהסתיים — לדוגמה בלבד.", ctaLabel: "לפרטים", productName: "גבינה צהובה פרוסה" },
      en: { title: "Summer Cheese Sale", description: "An ended promotion — for demo purposes only.", ctaLabel: "Learn more", productName: "Sliced yellow cheese" },
      ru: { title: "Летняя распродажа сыра", description: "Завершённая акция — только для демонстрации.", ctaLabel: "Подробнее", productName: "Нарезанный сыр" },
      fr: { title: "Promotion fromage d'été", description: "Promotion terminée — à titre de démonstration uniquement.", ctaLabel: "En savoir plus", productName: "Fromage jaune tranché" },
      es: { title: "Oferta de queso de verano", description: "Promoción finalizada — solo con fines de demostración.", ctaLabel: "Más información", productName: "Queso amarillo en lonchas" },
    },
  },
  {
    // Promotion FUTURE (`SCHEDULED`) avec produit/prix ET `isFeatured: true`
    // (§10, §22) — démontre explicitement qu'un statut `SCHEDULED` exclut la
    // promotion de l'affichage MÊME si `isFeatured` est vrai : "featured"
    // n'implique jamais "actif dès maintenant".
    slug: "rosh-hashanah-honey",
    image: "/demo/promotions/honey.jpg",
    startDate: "2026-09-06",
    endDate: "2026-09-12",
    status: "SCHEDULED",
    appliesToAll: true,
    branchSlugs: [],
    price: "18.90",
    currency: "ILS",
    unit: "UNIT",
    isFeatured: true,
    priority: 8,
    translations: {
      he: { title: "מבצע היום", description: "צנצנת דבש לראש השנה, בקרוב.", ctaLabel: "לפרטים", productName: "דבש טבעי" },
      en: { title: "Today's Deal", description: "A jar of honey for Rosh Hashanah, coming soon.", ctaLabel: "Learn more", productName: "Natural honey" },
      ru: { title: "Акция дня", description: "Баночка мёда к Рош ха-Шана, скоро.", ctaLabel: "Подробнее", productName: "Натуральный мёд" },
      fr: { title: "Promotion aujourd'hui", description: "Pot de miel pour Roch Hachana, bientôt disponible.", ctaLabel: "En savoir plus", productName: "Miel naturel" },
      es: { title: "Oferta de hoy", description: "Tarro de miel para Rosh Hashaná, próximamente.", ctaLabel: "Más información", productName: "Miel natural" },
    },
  },
];
