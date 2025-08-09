import { Console, Effect } from "effect"
import { Args, Command as CliCommand } from "@effect/cli"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { backupBookmarks } from "./effects"

const backupBookmarksArgs = {
    inputDbFilePath: Args.text({
        name: "input database file path"
    }),
    outputDbFilePath: Args.text({
        name: "output database file path"
    }),
}

const backupCommand = CliCommand.make("backup-bookmarks", backupBookmarksArgs, args => {
    return backupBookmarks(args).pipe(Effect.tap(Console.log))
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
