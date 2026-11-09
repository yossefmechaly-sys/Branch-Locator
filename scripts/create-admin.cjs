const fs = require("node:fs");
const readline = require("node:readline");
const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

process.loadEnvFile("/home/franck/leader-branch-locator/.env");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquant");

const db = new URL(connectionString);

if (
  db.pathname !== "/leader_branch_locator" ||
  db.hostname !== "127.0.0.1"
) {
  throw new Error("Sécurité : connexion PostgreSQL inattendue");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askPassword() {
  const tty = fs.openSync("/dev/tty", "r+");
  let hidden = false;

  try {
    process.stdout.write("Mot de passe (masqué) : ");

    const result = spawnSync("stty", ["-echo"], {
      stdio: [tty, "ignore", "ignore"],
    });

    if (result.status !== 0) {
      throw new Error("Impossible de masquer le mot de passe");
    }

    hidden = true;

    const bytes = [];
    const buffer = Buffer.alloc(1);

    while (true) {
      const count = fs.readSync(tty, buffer, 0, 1, null);
      if (count === 0 || buffer[0] === 10) break;
      if (buffer[0] !== 13) bytes.push(buffer[0]);
    }

    return Buffer.from(bytes).toString("utf8");
  } finally {
    if (hidden) {
      spawnSync("stty", ["echo"], {
        stdio: [tty, "ignore", "ignore"],
      });
    }

    fs.closeSync(tty);
    process.stdout.write("\n");
  }
}

async function main() {
  const email = (await ask("Email administrateur : ")).toLowerCase();
  const name = await ask("Nom administrateur : ");

  if (!email.includes("@") || !name) {
    throw new Error("Email ou nom invalide");
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Cet email possède déjà un compte");
  }

  const password = askPassword();

  if (password.length < 12) {
    throw new Error("Mot de passe trop court : 12 caractères minimum");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("Compte SUPER_ADMIN Leader créé avec succès.");
}

main()
  .catch((error) => {
    console.error("Erreur :", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
