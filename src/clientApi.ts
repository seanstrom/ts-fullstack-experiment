import type { AppRouter } from "./server"

import { createTRPCClient, httpBatchLink, type Resolver } from '@trpc/client';

type ResolverDef = {
    input: any;
    output: any;
    transformer: boolean;
    errorShape: any;
};

export function createClientApi() {
    return createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url: 'http://localhost:7778',
            }),
        ],
    })
}

export type ClientApi = ReturnType<typeof createClientApi>

type ClientProcInput<Details> =
    Details extends Resolver<infer R extends ResolverDef> ? R["input"] : any

type ClientProcOutput<Details> =
    Details extends Resolver<infer R extends ResolverDef> ? R["output"] : any

type ClientProcedureType<Proc> = {
    [K in keyof Proc]: {
        type: K,
        details: Proc[K]
    }
}[keyof Proc]["type"]

type ClientProcedureDetails<Proc> = {
    [K in keyof Proc]: {
        type: K,
        details: Proc[K]
    }
}[keyof Proc]["details"]

export type ClientApiProcedure = {
    [K in keyof ClientApi]: {
        type: K
        procedure: ClientProcedureType<ClientApi[K]>
        details: ClientProcedureDetails<ClientApi[K]>
    }
}

export type Proc = {
    [K in keyof ClientApiProcedure]: {
        type: ClientApiProcedure[K]["type"]
        procedure: ClientApiProcedure[K]["procedure"]
        input: ClientProcInput<ClientApiProcedure[K]["details"]>
    }
}[keyof ClientApiProcedure]
