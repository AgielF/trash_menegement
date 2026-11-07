-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "gang" TEXT NOT NULL,
    "address_note" TEXT,
    "collector_id" TEXT NOT NULL,
    "default_fee" INTEGER NOT NULL DEFAULT 5000,
    "next_due_date" DATE,
    "interval_days" INTEGER NOT NULL DEFAULT 7,
    "import_batch_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_sessions" (
    "id" TEXT NOT NULL,
    "collector_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_records" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "collector_id" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "pickup_status" TEXT NOT NULL DEFAULT 'belum_diambil',
    "picked_at" TIMESTAMP(3),
    "bags_count" INTEGER,
    "fee_amount" INTEGER NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'belum_bayar',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_skips" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "skip_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_skips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "received_by" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "voided_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_fee_history" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "old_fee" INTEGER NOT NULL,
    "new_fee" INTEGER NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_fee_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "import_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "success_rows" INTEGER NOT NULL,
    "failed_rows" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "houses_collector_id_is_active_idx" ON "houses"("collector_id", "is_active");

-- CreateIndex
CREATE INDEX "houses_collector_id_next_due_date_idx" ON "houses"("collector_id", "next_due_date");

-- CreateIndex
CREATE UNIQUE INDEX "collection_sessions_collector_id_session_date_key" ON "collection_sessions"("collector_id", "session_date");

-- CreateIndex
CREATE INDEX "pickup_records_collector_id_pickup_status_due_date_idx" ON "pickup_records"("collector_id", "pickup_status", "due_date");

-- CreateIndex
CREATE INDEX "pickup_records_collector_id_picked_at_idx" ON "pickup_records"("collector_id", "picked_at");

-- CreateIndex
CREATE INDEX "pickup_records_house_id_pickup_status_idx" ON "pickup_records"("house_id", "pickup_status");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_records_house_id_due_date_key" ON "pickup_records"("house_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_skips_record_id_skip_date_key" ON "pickup_skips"("record_id", "skip_date");

-- CreateIndex
CREATE INDEX "payments_record_id_idx" ON "payments"("record_id");

-- CreateIndex
CREATE INDEX "payments_received_by_paid_at_idx" ON "payments"("received_by", "paid_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_sessions" ADD CONSTRAINT "collection_sessions_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_records" ADD CONSTRAINT "pickup_records_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_records" ADD CONSTRAINT "pickup_records_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_skips" ADD CONSTRAINT "pickup_skips_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "pickup_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "pickup_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_fee_history" ADD CONSTRAINT "house_fee_history_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_fee_history" ADD CONSTRAINT "house_fee_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
