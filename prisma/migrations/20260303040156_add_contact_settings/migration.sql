-- CreateTable
CREATE TABLE "contact_settings" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT 'support@devforge.com',
    "phone" TEXT NOT NULL DEFAULT '+1 (234) 567-890',
    "addressLine1" TEXT NOT NULL DEFAULT '123 Learning Street',
    "addressLine2" TEXT NOT NULL DEFAULT 'Tech City, TC 12345',
    "addressLine3" TEXT NOT NULL DEFAULT 'United States',
    "businessHoursLine1" TEXT NOT NULL DEFAULT 'Monday - Friday',
    "businessHoursLine2" TEXT NOT NULL DEFAULT '9:00 AM - 6:00 PM EST',
    "responseTime" TEXT NOT NULL DEFAULT 'We typically respond within 24 hours during business days. For urgent matters, please call us directly.',
    "heroTitle" TEXT NOT NULL DEFAULT 'Contact Us',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Have questions? We''d love to hear from you. Send us a message and we''ll respond as soon as possible.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_faq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_faq_order_idx" ON "contact_faq"("order");

-- CreateIndex
CREATE INDEX "contact_faq_isActive_idx" ON "contact_faq"("isActive");
