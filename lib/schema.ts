import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  json,
  varchar,
  uuid,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";


export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  isAdmin: boolean("is_admin").default(false),
  basketIdent: text("basket_ident"),
  userId: text("user_id"),
  roles: text("roles").array().$type<string[]>(),
  nickname: text("nickname"),
  discordId: text("discord_id"),
  isInit: boolean("is_init").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
);

export const notices = pgTable("notice", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const events = pgTable("event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  thumbnailImage: text("thumbnail_image"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const purchases = pgTable("purchases", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  basketIdent: text("basket_ident").notNull(),
  items: json("items").default([]).notNull(),
  packageId: integer("package_id"),
  tebexTransactionId: integer("tebex_transaction_id"),
  packageName: text("package_name"),
  quantity: integer("quantity").default(1),
  basePrice: integer("base_price"),
  salesTax: integer("sales_tax"),
  totalAmount: integer("total_amount"),
  currency: text("currency"),
  couponCode: text("coupon_code"),
  creatorCode: text("creator_code"),
  status: text("status").notNull().default("pending"),
  purchasedAt: timestamp("purchased_at"),
  code: text("code"),
  customData: json("custom_data"),
  paymentMethod: text("payment_method"),
  checkoutUrl: text("checkout_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "processing",
]);

// 킬피드 제출 스키마
export const killfeedSubmission = pgTable(
  "killfeed_submission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    name: text("name").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewerId: text("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    adminNotes: text("admin_notes"),
    code: text("code").notNull().unique(),
    gameDbName: text("game_db_name").notNull(),
    gameDbFileName: text("game_db_file_name").notNull(),
    gameDbMetadata: jsonb("game_db_metadata").default({}).notNull(),
  },
  (table) => ({
    userIdx: index("killfeed_user_idx").on(table.userId),
    statusIdx: index("killfeed_status_idx").on(table.status),
    codeIdx: index("killfeed_code_idx").on(table.code),
  })
);

// 채팅 칭호 제출 스키마
export const chatTitleSubmission = pgTable(
  "chat_title_submission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    filePath: text("file_path").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewerId: text("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    adminNotes: text("admin_notes"),
    marginX: integer("margin_x").default(0),
    scale: integer("scale").default(70),
    code: text("code").notNull().unique(),
    gameDbName: text("game_db_name").notNull(),
    gameDbFileName: text("game_db_file_name").notNull(),
    gameDbMetadata: jsonb("game_db_metadata")
      .$type<{
        width?: string;
        scale?: number;
        marginTop?: number;
        marginRight?: number;
        marginBottom?: number;
        marginLeft?: number;
      }>()
      .default({
        width: "100px",
        scale: 0.7,
        marginTop: -3,
        marginRight: -10,
        marginBottom: 0,
        marginLeft: -10,
      })
      .notNull(),
  },
  (table) => ({
    userIdx: index("chat_title_user_idx").on(table.userId),
    statusIdx: index("chat_title_status_idx").on(table.status),
    codeIdx: index("chat_title_code_idx").on(table.code),
  })
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }),
    amount: integer("amount"),
    discountAmount: integer("discount_amount").default(0),
    totalAmount: integer("total_amount"),
    provider: varchar("provider", { length: 50 }),
    providerPaymentId: text("provider_payment_id").unique(),
    basketSnapshot: jsonb("basket_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    paymentUserIdx: index("payment_user_idx").on(table.userId),
    paymentProviderIdIdx: index("payment_provider_id_idx").on(
      table.providerPaymentId
    ),
  })
);

// 갤러리: URL 기반 이미지 컬렉션 (업로드는 어드민만 가능)
export const gallery = pgTable(
  "gallery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    title: text("title"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    width: integer("width"),
    height: integer("height"),
    downloadCount: integer("download_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    galleryCreatedByIdx: index("gallery_created_by_idx").on(table.createdBy),
    galleryCreatedAtIdx: index("gallery_created_at_idx").on(table.createdAt),
  })
);

// 인증 시도 추적을 위한 테이블
export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    discordId: text("discord_id").notNull(),
    attemptType: text("attempt_type").notNull(), // 'init', 'reauth', etc.
    success: boolean("success").default(false).notNull(),
    errorMessage: text("error_message"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    authAttemptsUserIdx: index("auth_attempts_user_idx").on(table.userId),
    authAttemptsDiscordIdx: index("auth_attempts_discord_idx").on(table.discordId),
    authAttemptsCreatedAtIdx: index("auth_attempts_created_at_idx").on(table.createdAt),
  })
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    apiKeyUserIdx: index("api_key_user_idx").on(table.userId),
    apiKeyIdx: index("api_key_idx").on(table.key),
  })
);

export const userLogs = pgTable("user_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  notices: many(notices),
  events: many(events),
  purchases: many(purchases),
  killfeedSubmissions: many(killfeedSubmission),
  chatTitleSubmissions: many(chatTitleSubmission),
  galleryItems: many(gallery),
  reviewedKillfeedSubmissions: many(killfeedSubmission, {
    relationName: "KillfeedReviewer",
  }),
  reviewedChatTitleSubmissions: many(chatTitleSubmission, {
    relationName: "ChatTitleReviewer",
  }),
  payments: many(payments),
  authAttempts: many(authAttempts),
  apiKeys: many(apiKeys),
  userLogs: many(userLogs),
}));

export const killfeedSubmissionRelations = relations(
  killfeedSubmission,
  ({ one }) => ({
    user: one(users, {
      fields: [killfeedSubmission.userId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [killfeedSubmission.reviewerId],
      references: [users.id],
      relationName: "KillfeedReviewer",
    }),
  })
);

export const chatTitleSubmissionRelations = relations(
  chatTitleSubmission,
  ({ one }) => ({
    user: one(users, {
      fields: [chatTitleSubmission.userId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [chatTitleSubmission.reviewerId],
      references: [users.id],
      relationName: "ChatTitleReviewer",
    }),
  })
);

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const authAttemptsRelations = relations(authAttempts, ({ one }) => ({
  user: one(users, {
    fields: [authAttempts.userId],
    references: [users.id],
  }),
}));

export const galleryRelations = relations(gallery, ({ one }) => ({
  author: one(users, {
    fields: [gallery.createdBy],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const userLogsRelations = relations(userLogs, ({ one }) => ({
  user: one(users, {
    fields: [userLogs.userId],
    references: [users.id],
  }),
}));
