CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "branch_reviews" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "clientHash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "branch_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "branch_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
    CONSTRAINT "branch_reviews_author_check" CHECK (char_length("authorName") BETWEEN 2 AND 80),
    CONSTRAINT "branch_reviews_comment_check" CHECK (char_length("comment") BETWEEN 10 AND 2000)
);

CREATE INDEX "branch_reviews_branchId_status_createdAt_idx" ON "branch_reviews"("branchId", "status", "createdAt");
CREATE INDEX "branch_reviews_status_createdAt_idx" ON "branch_reviews"("status", "createdAt");
CREATE INDEX "branch_reviews_clientHash_createdAt_idx" ON "branch_reviews"("clientHash", "createdAt");
ALTER TABLE "branch_reviews" ADD CONSTRAINT "branch_reviews_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
