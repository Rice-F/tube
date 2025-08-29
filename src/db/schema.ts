import { 
  uuid, 
  pgTable, 
  text, 
  timestamp, 
  uniqueIndex,
  integer,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // UUID类型，主键，默认值为随机生成
  clerkId: text("clerk_id").unique().notNull(), // 唯一且不能为空
  name: text("name").notNull(), 
  imageUrl: text("image_url").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("update_at").defaultNow().notNull(),
}, t => [uniqueIndex("clerk_id_idx").on(t.clerkId)]); // 唯一索引，搜索优化

export const usersRelations = relations(users, ({ many }) => (
  { videos: many(videos) } // 一对多关系，用户可以有多个视频，或者为空
))

// categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("update_at").defaultNow().notNull(),
}, t => [uniqueIndex("name_idx").on(t.name)]);

export const categoriesRelations = relations(categories, ({ many }) => (
  { videos: many(videos) } // 一对多关系，分类可以有多个视频或为空
))

// videos
export const videoVisibility = pgEnum('video_visibility', [ // pgEnum() 定义枚举类型
  'private',
  'public'
])

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  muxStatus: text("mux_status"),
  muxAssetId: text("mux_asset_id").unique(), // 已上传
  muxUploadId: text("mux_upload_id").unique(), // 上传过程
  muxPlaybackId: text("mux_playback_id").unique(), // 回放视频并生成缩略图或预览
  muxTrackId: text("mux_track_id").unique(), // 视频字幕
  muxTrackStatus: text("mux_track_status"), // 视频字幕
  thumbnailUrl: text('thumbnail_url'), // 缩略图
  thumbnailKey: text('thumbnail_key'), // 缩略图存储的key
  previewUrl: text('preview_url'),  // 预览
  previewKey: text('preview_key'), // 预览存储的key
  duration: integer("duration").default(0).notNull(), // 视频时长，单位毫秒，整数
  visibility: videoVisibility('visibility').default('private').notNull(),
  userId: uuid("user_id").references(() => users.id, { // 外键 - 关联到users表的id字段
    onDelete: "cascade", // 级联删除，如果用户被删除，则删除该用户的所有视频
  }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null", // 级联删除，如果分类被删除，则将视频的分类设置为null，但不删除视频
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("update_at").defaultNow().notNull(),
});

export const videoRelations = relations(videos, ({ one }) => (
  {
    user: one(users, {
      fields: [videos.userId],
      references: [users.id],
    }),
    category: one(categories, {
      fields: [videos.categoryId],
      references: [categories.id],
    }),
  }
))