import { Console, Effect } from "effect"
import { Args, Command as CliCommand } from "@effect/cli"
import { FileSystem } from "@effect/platform"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { backupBookmarks, mergeBookmarks } from "./effects"

const copyBookmarksArgs = {
    inputDbFilePath: Args.text({
        name: "input database file path"
    }),
    outputDbFilePath: Args.text({
        name: "output database file path"
    }),
}

function copyBookmarks(args: {
    inputDbFilePath: string,
    outputDbFilePath: string,
}) {
    return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const outputExists = yield* fs.exists(args.outputDbFilePath)
        if (outputExists) {
            const result = yield* mergeBookmarks(args)
            return result
        }
        else {
            const result = yield* backupBookmarks(args)
            return result
        }
    })
}

const copyCommand = CliCommand.make("copy-bookmarks", copyBookmarksArgs, args => {
    return copyBookmarks(args).pipe(Effect.tap(Console.log))
})

const copyCli = CliCommand.run(copyCommand, {
    name: "copy-bookmarks",
    version: "v0.0.1"
})

export function main() {
    copyCli(process.argv).pipe(
        Effect.provide(BunContext.layer),
        BunRuntime.runMain
    )
}

main()
