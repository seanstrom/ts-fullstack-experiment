import { z } from "zod/v4"
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { sqliteTable, integer, text, customType } from 'drizzle-orm/sqlite-core'

const anyType = (name: string) =>
    customType<{ data: unknown }>({
        dataType() {
            return "ANY"
        },
    })(name)

const varchar = (len: number) =>
  customType<{ data: string; driverData: string }>({
    dataType() {
      return `VARCHAR(${len})`;
    },
  })

export const infoTable = sqliteTable("info", {
    id: integer("id").primaryKey().notNull(),
    entity: integer("").notNull(),
    attribute: text("attribute").notNull(),
    value: anyType("value").notNull(),
    tx: varchar(36)("tx"),
    op: integer().default(1).notNull(),
})

export const bookmarksTable = sqliteTable('bookmarks', {
    id: integer('id').primaryKey(),
    type: integer("type"),
    url: text('url'),
    title: text('title'),
    parent: integer('parent'),
    orderIndex: integer("order_index"),
    davGeneration: integer("dav_generation"),
    numChildren: integer("num_children"),
    editable: integer("editable"),
    deletable: integer("deletable"),
    syncable: integer("syncable"),
    hidden: integer("hidden"),
    hiddenAncestorCount: integer("hidden_ancestor_count")
})

export function makeDatabaseClient(dbFilePath: string) {
    const sqlite = new Database(dbFilePath)
    const dbClient = drizzle({ client: sqlite })
    return dbClient
}

export type DBClient = ReturnType<typeof makeDatabaseClient>

export type Bookmark = z.output<typeof BookmarkSchema>
export const BookmarkSchema = z.object({
    id: z.number(),
    url: z.string(),
    title: z.string(),
    parentId: z.number(),
})


export type BookmarkList = z.output<typeof BookmarkListSchema>
export const BookmarkListSchema = z.array(BookmarkSchema)


export type BookmarkGroup = z.output<typeof BookmarkGroupSchema>
export const BookmarkGroupSchema = z.object({
    id: z.number(),
    title: z.string(),
})


export type BookmarkGroupList = z.output<typeof BookmarkGroupListSchema>
export const BookmarkGroupListSchema = z.array(BookmarkGroupSchema)


export type BookmarkTicket = z.output<typeof BookmarkTicketSchema>
export const BookmarkTicketSchema = z.object({
    ":bookmark/group": BookmarkGroupSchema,
    ":bookmark/tab": BookmarkSchema,
})
