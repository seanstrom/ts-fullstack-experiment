import { Console, Effect } from "effect"
import { Args, Command as CliCommand } from "@effect/cli"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { mergeBookmarks } from "./effects"

const mergeBookmarksArgs = {
    inputDbFilePath: Args.text({
        name: "input database file path"
    }),
    outputDbFilePath: Args.text({
        name: "input database file path"
    }),
}

const command = CliCommand.make("merge-bookmarks", mergeBookmarksArgs, args => {
    return mergeBookmarks(args).pipe(Effect.tap(Console.log))
})

const cli = CliCommand.run(command, {
    name: "merge-bookmarks",
    version: "v0.0.1"
})

export function main() {
    cli(process.argv).pipe(
        Effect.provide(BunContext.layer),
        BunRuntime.runMain
    )
}

main()
