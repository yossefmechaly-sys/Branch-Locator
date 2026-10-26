import NextAuth from "next-auth";

import { authConfig } from "./config";

/**
 * Instance Auth.js unique — importée par `app/api/auth/[...nextauth]/route.ts`
 * (route handler), `proxy.ts` (garde de route légère) et
 * `lib/auth/require.ts` (garde fine par page/Server Action). Jamais
 * instanciée une seconde fois ailleurs (même principe que le singleton
 * `lib/prisma.ts`).
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
