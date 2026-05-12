-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('RECEIVED', 'INSPECTING', 'QUOTED', 'IN_PROGRESS', 'SHIPPING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "imageAlignment" TEXT NOT NULL DEFAULT 'left';

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "coverImageUrl" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingCarrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "dealEndsAt" TIMESTAMP(3),
ADD COLUMN     "dealStartsAt" TIMESTAMP(3),
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOutlet" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "brand_follows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_campaigns" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" TEXT[],
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "refundAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snap_likes" (
    "id" TEXT NOT NULL,
    "snapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snap_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snap_comments" (
    "id" TEXT NOT NULL,
    "snapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snap_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_subscriptions" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "coverImage" TEXT NOT NULL,
    "bannerImage" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_products" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookbooks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "season" TEXT,
    "gender" TEXT,
    "coverImage" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookbook_images" (
    "id" TEXT NOT NULL,
    "lookbookId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lookbook_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookbook_products" (
    "id" TEXT NOT NULL,
    "lookbookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lookbook_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "productName" TEXT NOT NULL,
    "brandName" TEXT,
    "issue" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "status" "RepairStatus" NOT NULL DEFAULT 'RECEIVED',
    "estimatedCost" INTEGER,
    "finalCost" INTEGER,
    "pickupAddress" TEXT,
    "deliveryCarrier" TEXT,
    "deliveryNumber" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_follows_brandId_idx" ON "brand_follows"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_follows_userId_brandId_key" ON "brand_follows"("userId", "brandId");

-- CreateIndex
CREATE INDEX "brand_campaigns_brandId_idx" ON "brand_campaigns"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "snap_likes_snapId_userId_key" ON "snap_likes"("snapId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "release_subscriptions_releaseId_userId_key" ON "release_subscriptions"("releaseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_isPublished_idx" ON "events"("isPublished");

-- CreateIndex
CREATE INDEX "events_endsAt_idx" ON "events"("endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_products_eventId_productId_key" ON "event_products"("eventId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "lookbooks_slug_key" ON "lookbooks"("slug");

-- CreateIndex
CREATE INDEX "lookbooks_isPublished_idx" ON "lookbooks"("isPublished");

-- CreateIndex
CREATE INDEX "lookbooks_gender_idx" ON "lookbooks"("gender");

-- CreateIndex
CREATE INDEX "lookbooks_brandId_idx" ON "lookbooks"("brandId");

-- CreateIndex
CREATE INDEX "lookbook_images_lookbookId_idx" ON "lookbook_images"("lookbookId");

-- CreateIndex
CREATE UNIQUE INDEX "lookbook_products_lookbookId_productId_key" ON "lookbook_products"("lookbookId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "repair_requests_requestNumber_key" ON "repair_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "repair_requests_userId_idx" ON "repair_requests"("userId");

-- CreateIndex
CREATE INDEX "repair_requests_status_idx" ON "repair_requests"("status");

-- CreateIndex
CREATE INDEX "products_isGift_idx" ON "products"("isGift");

-- CreateIndex
CREATE INDEX "products_isOutlet_idx" ON "products"("isOutlet");

-- CreateIndex
CREATE INDEX "products_dealEndsAt_idx" ON "products"("dealEndsAt");

-- AddForeignKey
ALTER TABLE "brand_follows" ADD CONSTRAINT "brand_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_follows" ADD CONSTRAINT "brand_follows_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_campaigns" ADD CONSTRAINT "brand_campaigns_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snap_likes" ADD CONSTRAINT "snap_likes_snapId_fkey" FOREIGN KEY ("snapId") REFERENCES "snaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snap_likes" ADD CONSTRAINT "snap_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snap_comments" ADD CONSTRAINT "snap_comments_snapId_fkey" FOREIGN KEY ("snapId") REFERENCES "snaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snap_comments" ADD CONSTRAINT "snap_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_subscriptions" ADD CONSTRAINT "release_subscriptions_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_subscriptions" ADD CONSTRAINT "release_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_products" ADD CONSTRAINT "event_products_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_products" ADD CONSTRAINT "event_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookbooks" ADD CONSTRAINT "lookbooks_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookbook_images" ADD CONSTRAINT "lookbook_images_lookbookId_fkey" FOREIGN KEY ("lookbookId") REFERENCES "lookbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookbook_products" ADD CONSTRAINT "lookbook_products_lookbookId_fkey" FOREIGN KEY ("lookbookId") REFERENCES "lookbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookbook_products" ADD CONSTRAINT "lookbook_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

