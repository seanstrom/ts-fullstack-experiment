import { initTRPC, TRPCError } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from "zod/v4";
import cors from 'cors'

import path from "path"
import fs from "fs/promises"

import { QuoteSchema } from "./data"

const trpc = initTRPC.create();

const appRouter = trpc.router({
    fetchRandomQuote: trpc.procedure
        .query(async () => {
            const response = await fetch("https://elm-lang.org/api/random-quotes")
            const payload = await response.json()
            const result = QuoteSchema.safeParse(payload)

            if (result.success) {
                return result.data
            } else {
                throw new TRPCError({
                    code: "PARSE_ERROR",
                    message: "Invalid quote payload",
                    cause: result.error,
                })
            }
        }),
    hello: trpc.procedure
        .input(z.object({
            name: z.string(),
        }))
        .query(async (params) => {
            return `Hello ${params.input.name}`
        }),
    fetchFileContent: trpc.procedure
        .input(z.object({ fileId: z.string() }))
        .query(async (params) => {
            const filesFolder = path.resolve("./__data/")
            const filePath = path.join(filesFolder, params.input.fileId)
            const fileBuffer = await fs.readFile(filePath)
            const fileContent = fileBuffer.toString("utf-8")
            return {
                fileContent,
                filedId: params.input.fileId
            }
        })
})

export type AppRouter = typeof appRouter

function main(): void {
    const server = createHTTPServer({
        middleware: cors(),
        router: appRouter,
    })

    server.listen(7778)
}

main()
