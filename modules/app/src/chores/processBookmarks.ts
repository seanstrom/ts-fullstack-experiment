import { Console, Effect } from "effect"
import { Args, Command as CliCommand } from "@effect/cli"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { processBookmark } from "./effects"

const processBookmarkArgs = {
    inputDbFilePath: Args.text({
        name: "input database file path"
    }),
}

const command = CliCommand.make("process-bookmark", processBookmarkArgs, args => {
    return processBookmark(args).pipe(Effect.tap(Console.log))
})

const cli = CliCommand.run(command, {
    name: "process-bookmark",
    version: "v0.0.1"
})

export function main() {
    cli(process.argv).pipe(
        Effect.provide(BunContext.layer),
        BunRuntime.runMain
    )
}

main()
