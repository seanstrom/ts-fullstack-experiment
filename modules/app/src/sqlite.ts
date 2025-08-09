import { $ } from "bun"

//deps: Schema library
import { z } from "zod/v4"

//deps: Effect runtime
import { Array, Console, Effect, Option, Random } from "effect"
import { Args, Command as CliCommand } from "@effect/cli"
import { Command as PlatformCommand } from "@effect/platform"
import { BunContext, BunRuntime } from "@effect/platform-bun"

//deps: Database libraries
import { Database } from 'bun:sqlite'
import { and, eq, gt, isNotNull, lt } from 'drizzle-orm'
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { drizzle } from 'drizzle-orm/bun-sqlite'

//
// SQLite tables
//

const bookmarks = sqliteTable('bookmarks', {
    id: integer('id').primaryKey(),
    title: text('title'),
    url: text('url'),
    parent: integer('parent'),
    type: integer("type"),
    numChildren: integer("num_children"),
    editable: integer("editable"),
    deletable: integer("deletable"),
    hidden: integer("hidden"),
    hiddenAncestorCount: integer("hidden_ancestor_count")
})

//
// Schemas and Types
//

export type Bookmark = z.output<typeof BookmarkSchema>
export const BookmarkSchema = z.object({
    id: z.number(),
    url: z.string(),
    title: z.string(),
    parentId: z.number(),
})


export type BookmarkList = z.output<typeof BookmarkListSchema>
const BookmarkListSchema = z.array(BookmarkSchema)


export type BookmarkGroup = z.output<typeof BookmarkGroupSchema>
export const BookmarkGroupSchema = z.object({
    id: z.number(),
    title: z.string(),
})


export type BookmarkGroupList = z.output<typeof BookmarkGroupListSchema>
const BookmarkGroupListSchema = z.array(BookmarkGroupSchema)


//
//--- Open the Safari bookmarks database and extract Safari cloud bookmarks.
//

function makeDatabaseClient(dbFilePath: string) {
    const sqlite = new Database(dbFilePath)
    const dbClient = drizzle({ client: sqlite })
    return dbClient
}

export type DBClient = ReturnType<typeof makeDatabaseClient>

function readBookmarks(db: DBClient) {
    return db
        .select({
            id: bookmarks.id,
            url: bookmarks.url,
            title: bookmarks.title,
            parentId: bookmarks.parent
        })
        .from(bookmarks)
        .where(
            and(
                //--- We only collect tabs and not tab-groups
                eq(bookmarks.type, 0),

                //--- We only collect tabs within a tab-group
                isNotNull(bookmarks.parent),

                //--- We only collect user-created tabs
                eq(bookmarks.deletable, 1),

                //--- We do not collect hidden tabs
                eq(bookmarks.hidden, 0),

                //--- We do not collect tabs inside hidden tab-groups
                lt(bookmarks.hiddenAncestorCount, 1),
            )
        )
}

function readBookmarkGroups(db: DBClient) {
    return db
        .select({
            id: bookmarks.id,
            title: bookmarks.title,
        })
        .from(bookmarks)
        .where(
            and(
                //--- We only collect tab-groups and not tabs
                eq(bookmarks.type, 1),

                //--- We do not collect hidden tab-groups
                eq(bookmarks.hidden, 0),

                //--- We only collect user-created tab-groups
                eq(bookmarks.deletable, 1),

                //--- We only collect tab-groups with tabs
                gt(bookmarks.numChildren, 0),
            )
        )
}

function filterByGroupTitle(
    tabs: BookmarkList,
    groupsByTitle: Map<string, BookmarkGroup>,
    groupTitle: string
) {
    return Array.filterMap(tabs, tab => {
        const targetGroup = groupsByTitle.get(groupTitle)
        if (targetGroup?.id === tab.parentId) {
            return Option.some(tab)
        }
        else {
            return Option.none()
        }
    })
}

function BookmarkEffects_chooseRandom(args: {
    dbFilePath: string,
    randomSeed: number,
    groupTitle: Option.Option<string>
}) {
    return Effect.gen(function* () {
        const db = makeDatabaseClient(args.dbFilePath)

        const allBookmarks = yield* Effect.promise(async () => {
            const payload = await readBookmarks(db)
            return BookmarkListSchema.parse(payload)
        })

        const groups = yield* Effect.promise(async () => {
            const payload = await readBookmarkGroups(db)
            return BookmarkGroupListSchema.parse(payload)
        })

        const groupsByTitle = groups.reduce((acc, group) => {
            acc.set(group.title, group)
            return acc
        }, new Map<string, BookmarkGroup>())

        const groupsById = groups.reduce((acc, group) => {
            acc.set(group.id, group)
            return acc
        }, new Map<number, BookmarkGroup>())

        const bookmarks = Option.match(args.groupTitle, {
            onNone: () => allBookmarks,
            onSome: (groupTitle) => {
                return filterByGroupTitle(allBookmarks, groupsByTitle, groupTitle)
            },
        })

        const maxIndex = bookmarks.length - 1
        const random = Random.make(args.randomSeed)
        const randomIndex = yield* random.nextIntBetween(0, maxIndex)
        const randomTab = bookmarks[randomIndex]

        return {
            ":bookmark/group": groupsById.get(randomTab.parentId)?.title,
            ":bookmark/tab": randomTab,
        }
    })
}

const randomBookmarkArgs = {
    dbFilePath: Args.text({
        name: "database file path"
    }),
    randomSeed: Args.integer({
        name: "random seed number"
    }),
    groupTitle: Args.text({
        name: "target group title"
    }).pipe(Args.optional),
}

const command = CliCommand.make("random-bookmark", randomBookmarkArgs, args => {
    return BookmarkEffects_chooseRandom(args).pipe(Effect.tap(Console.log))
})

const cli = CliCommand.run(command, {
    name: "random-bookmark",
    version: "v0.0.1"
})

function BookmarkEffects_backupBookmarks(args: {
    sourceDbFilePath: string,
    destinationDbFilePath: string
}) {
    return Effect.gen(function* () {
        yield* Effect.promise(async () => {
            await $`sqlite3 ${args.sourceDbFilePath} .dump | sqlite3 ${args.destinationDbFilePath}`
        })
    })
}

const backupBookmarksArgs = {
    sourceDbFilePath: Args.text({
        name: "source database file path"
    }),
    destinationDbFilePath: Args.text({
        name: "destination database file path"
    }),
}

const backupCommand = CliCommand.make("backup-bookmarks", backupBookmarksArgs, args => {
    return BookmarkEffects_backupBookmarks(args).pipe(Effect.tap(Console.log))
})

const backupCli = CliCommand.run(backupCommand, {
    name: "backup-bookmarks",
    version: "v0.0.1"
})

export function main() {
    backupCli(process.argv).pipe(
        Effect.provide(BunContext.layer),
        BunRuntime.runMain
    )
}

main()
