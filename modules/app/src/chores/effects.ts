import { $ } from "bun"
import { Effect } from "effect"
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm'
import { bookmarksTable, makeDatabaseClient, BookmarkTicketSchema, type DBClient, BookmarkGroupListSchema, infoTable, transactionTable, type Bookmark } from "./shared"
import { v7 as uuidV7 } from "uuid"

//docs: extract all meaningful values from bookmarks database

function extractBookmarks(db: DBClient) {
    return db
        .select({
            id: bookmarksTable.id,
            type: bookmarksTable.type,
            url: bookmarksTable.url,
            title: bookmarksTable.title,
            parent: bookmarksTable.parent,
            orderIndex: bookmarksTable.orderIndex,
            davGeneration: bookmarksTable.davGeneration,
            numChildren: bookmarksTable.numChildren,
            editable: bookmarksTable.editable,
            deletable: bookmarksTable.deletable,
            syncable: bookmarksTable.syncable,
            hidden: bookmarksTable.hidden,
            hiddenAncestorCount: bookmarksTable.hiddenAncestorCount
        })
        .from(bookmarksTable)
        .where(
            and(
                //--- We only collect user-created tabs
                eq(bookmarksTable.deletable, 1),

                //--- We only
                eq(bookmarksTable.editable, 1),

                //--- We do not collect hidden tabs
                eq(bookmarksTable.hidden, 0),

                //--- We do not collect tabs inside hidden tab-groups
                eq(bookmarksTable.hiddenAncestorCount, 0),
            )
        )
}

//docs: merge bookmarks databases

export function mergeBookmarks(args: {
    inputDbFilePath: string,
    outputDbFilePath: string,
}) {
    return Effect.gen(function* () {
        const inputDb = makeDatabaseClient(args.inputDbFilePath)
        const outputDb = makeDatabaseClient(args.outputDbFilePath)

        yield* Effect.promise(async () => {
            const payload = await extractBookmarks(inputDb)

            await outputDb.insert(bookmarksTable).values(payload)
                .onConflictDoUpdate({
                    target: bookmarksTable.id,
                    set: {
                        type: sql`excluded.type`,
                        title: sql`excluded.title`,
                        url: sql`excluded.url`,
                        parent: sql`excluded.parent`,
                        orderIndex: sql`excluded.order_index`,
                        davGeneration: sql`excluded.dav_generation`,
                        numChildren: sql`excluded.num_children`,
                        editable: sql`excluded.editable`,
                        deletable: sql`excluded.deletable`,
                        syncable: sql`excluded.syncable`,
                        hidden: sql`excluded.hidden`,
                        hiddenAncestorCount: sql`excluded.hidden_ancestor_count`,
                    },
                    setWhere: sql`dav_generation < excluded.dav_generation`
                })

            const freshBookmarkIds = payload.map(item => item.id)

            const staleBookmarks = await outputDb
                .select({ id: bookmarksTable.id })
                .from(bookmarksTable)
                .where(notInArray(bookmarksTable.id, freshBookmarkIds))

            const staleBookmarkIds = staleBookmarks.map(item => item.id)

            await outputDb
                .delete(bookmarksTable)
                .where(inArray(bookmarksTable.id, staleBookmarkIds))
        })

        return {
            ":action": "merged-bookmarks",
        }
    })
}

//docs: backup bookmarks database to a new file

export function backupBookmarks(args: {
    inputDbFilePath: string,
    outputDbFilePath: string
}) {
    return Effect.gen(function* () {
        yield* Effect.promise(async () => {
            await $`sqlite3 ${args.inputDbFilePath} .dump | sqlite3 ${args.outputDbFilePath}`
        })

        return {
            ":action": "backup-bookmarks",
        }
    })
}

type EntityDbFact = { entity: number, attribute: string, value: any, tx: string, op: number }

export function exportBookmarks(args: {
    inputDbFilePath: string,
    outputDbFilePath: string
}) {
    return Effect.gen(function* () {
        const inputDb = makeDatabaseClient(args.inputDbFilePath)
        const outputDb = makeDatabaseClient(args.outputDbFilePath)

        yield* Effect.promise(async () => {
            const payload = await extractBookmarks(inputDb)

            const results = payload.map((item) => {
                return outputDb.transaction(async tx => {
                    const txId = uuidV7()
                    const attributePairs = Object.entries(item)
                    const entityFacts: EntityDbFact[] = []
                    attributePairs.forEach(([attrName, attrVal]) => {
                        if (attrVal !== null) {
                            entityFacts.push({
                                entity: item.id,
                                attribute: attrName,
                                value: attrVal,
                                tx: txId,
                                op: 1,
                            })
                        }
                    })
                    await tx.insert(transactionTable).values([{ txId }])
                    return outputDb.insert(infoTable).values(entityFacts)
                })
            })

            await Promise.all(results)
        })

        return {
            ":action": "export-bookmarks"
        }
    })
}

export function processBookmark(args: {
    inputDbFilePath: string
}) {
    return Effect.gen(function* () {
        const input = yield* Effect.promise(async () => {
            const payload = await Bun.stdin.text()
            const json = JSON.parse(payload)
            console.log(json)
            return BookmarkTicketSchema.parse(json)
        })

        yield* Effect.promise(async () => {
            const db = makeDatabaseClient(args.inputDbFilePath)

            await db.transaction(async tx => {
                const bookmarkGroup = input[":bookmark/group"]
                const bookmarkTab = input[":bookmark/tab"]

                const processGroups = await tx
                    .selectDistinct({
                        id: bookmarksTable.id,
                        title: bookmarksTable.title
                    })
                    .from(bookmarksTable)
                    .where(eq(bookmarksTable.title, "PROCESSED"))
                    .then(BookmarkGroupListSchema.parse)

                const processedGroup = processGroups[0]

                await tx
                    .update(bookmarksTable)
                    .set({
                        numChildren: sql`${bookmarksTable.numChildren} - 1`,
                    })
                    .where(eq(bookmarksTable.id, bookmarkGroup.id))

                await tx
                    .update(bookmarksTable)
                    .set({
                        parent: processedGroup.id,
                        hidden: 1,
                    })
                    .where(eq(bookmarksTable.id, bookmarkTab.id))

                await tx
                    .update(bookmarksTable)
                    .set({
                        numChildren: sql`${bookmarksTable.numChildren} + 1`,
                    })
                    .where(eq(bookmarksTable.id, processedGroup.id))
            })
        })
    })
}
