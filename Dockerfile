# Maayan 2000 — Store Locator — image de production
#
# Build multi-étapes standard pour une sortie Next.js `output: "standalone"`
# (voir next.config.ts). Voir docs/production-deployment.md §3 pour le
# contexte complet, notamment la limite connue : l'étape `prisma generate`
# ci-dessous a besoin d'un accès réseau sortant vers `binaries.prisma.sh`
# (téléchargement du moteur Prisma) — bloqué par la politique d'égress du
# bac à sable de développement (403 Forbidden, documenté et jamais contourné,
# voir PHASE_9_RAPPORT.md §26 et PHASE_11_RAPPORT.md). Un environnement de
# build CI/CD avec un accès réseau normal n'a pas cette limite.
#
# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-slim

# ---------------------------------------------------------------------------
# Étape 1 — dépendances + génération du client Prisma
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# openssl requis par le moteur Prisma sur Debian slim.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# `npm ci` sans exécuter les scripts d'abord : `prisma generate` est lancé
# explicitement ensuite, une fois le schéma déjà en place (évite un ordre de
# copie fragile si `postinstall` dépendait un jour de fichiers absents à ce
# stade).
RUN npm ci
RUN npx prisma generate

# ---------------------------------------------------------------------------
# Étape 2 — build applicatif
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Variables nécessaires UNIQUEMENT à la compilation (jamais de secret ici —
# les vraies valeurs de production sont injectées au runtime, étape 3).
# `NEXT_PUBLIC_*` doivent être présentes au build car Next.js les inline
# statiquement dans les bundles client à ce moment-là.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# Étape 3 — image finale minimale, utilisateur non-root
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# `.next/standalone` embarque déjà son propre `node_modules` minimal (trace
# de dépendances automatique de Next.js) — jamais besoin de copier le
# `node_modules` complet des étapes précédentes ici.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

# `server.js` généré par `output: "standalone"` — sert directement le build,
# aucun `next start` séparé nécessaire dans l'image finale.
CMD ["node", "server.js"]
