import { $ } from "bun"

//deps: Effect runtime
import { Array, Console, Effect, Option, Random } from "effect"
import { Args, Command as CliCommand } from "@effect/cli"
import { BunContext, BunRuntime } from "@effect/platform-bun"

import { and, eq, gt, isNotNull, lt } from 'drizzle-orm'
import { bookmarksTable, makeDatabaseClient, type DBClient } from "./shared"

//
//--- Open the Safari bookmarks database and extract Safari cloud bookmarks.
//

function readBookmarks(db: DBClient) {
    return db
        .select({
            id: bookmarksTable.id,
            url: bookmarksTable.url,
            title: bookmarksTable.title,
            parentId: bookmarksTable.parent,
            version: bookmarksTable.davGeneration,
        })
        .from(bookmarksTable)
        .where(
            and(
                //--- We only collect tabs and not tab-groups
                eq(bookmarksTable.type, 0),

                //--- We only collect tabs within a tab-group
                isNotNull(bookmarksTable.parent),

                //--- We only collect user-created tabs
                eq(bookmarksTable.deletable, 1),

                //--- We do not collect hidden tabs
                eq(bookmarksTable.hidden, 0),

                //--- We do not collect tabs inside hidden tab-groups
                lt(bookmarksTable.hiddenAncestorCount, 1),
            )
        )
}

function readBookmarkGroups(db: DBClient) {
    return db
        .select({
            id: bookmarksTable.id,
            title: bookmarksTable.title,
            version: bookmarksTable.davGeneration,
        })
        .from(bookmarksTable)
        .where(
            and(
                //--- We only collect tab-groups and not tabs
                eq(bookmarksTable.type, 1),

                //--- We do not collect hidden tab-groups
                eq(bookmarksTable.hidden, 0),

                //--- We only collect user-created tab-groups
                eq(bookmarksTable.deletable, 1),

                //--- We only collect tab-groups with tabs
                gt(bookmarksTable.numChildren, 0),
            )
        )
}

import {
    type BookmarkGroup,
    BookmarkGroupListSchema,
    type BookmarkList,
    BookmarkListSchema,
} from "./shared"

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

        const randomSeed = yield* Effect.promise(async () => {
            return await $`jot -r 1 0 100`.text().then(Number)
        })

        const maxIndex = bookmarks.length - 1
        const random = Random.make(randomSeed)
        const randomIndex = yield* random.nextIntBetween(0, maxIndex)
        const randomTab = bookmarks[randomIndex]

        return {
            ":bookmark/group": groupsById.get(randomTab.parentId),
            ":bookmark/tab": randomTab,
        }
    })
}

const randomBookmarkArgs = {
    dbFilePath: Args.text({
        name: "database file path"
    }),
    groupTitle: Args.text({
        name: "target group title"
    }).pipe(Args.optional),
}

const command = CliCommand.make("random-bookmark", randomBookmarkArgs, args => {
    return BookmarkEffects_chooseRandom(args).pipe(Effect.tap((x => {
        return Console.log(JSON.stringify(x))
    })))
})

const cli = CliCommand.run(command, {
    name: "random-bookmark",
    version: "v0.0.1"
})

export function main() {
    cli(process.argv).pipe(
        Effect.provide(BunContext.layer),
        BunRuntime.runMain
    )
}

main()
