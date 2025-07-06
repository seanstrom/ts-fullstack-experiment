import type { AppRouter } from "@app/server"

import { createTRPCClient, httpBatchLink, type Resolver } from '@trpc/client';

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

type ResolverDef = {
    input: any;
    output: any;
    transformer: boolean;
    errorShape: any;
};

type InferDetail<Details, Field extends keyof ResolverDef> =
    Details extends Resolver<infer R extends ResolverDef>
    ? R[Field]
    : any

type Procedure<ProcType, Details> = {
    type: ProcType
    details: Details
}

type Procedures<Api> = {
    [K in keyof Api]: Procedure<K, Api[K]>
}[keyof Api]

export type ClientApiEffects = {
    [K in keyof ClientApi]: {
        type: K
        procedure: Procedures<ClientApi[K]>["type"]
        details: Procedures<ClientApi[K]>["details"]
    }
}

export type ClientApiEffect<Action> = {
    [K in keyof ClientApiEffects]: {
        type: ClientApiEffects[K]["type"]
        procedure: ClientApiEffects[K]["procedure"]
        input: InferDetail<ClientApiEffects[K]["details"], "input">
        toSuccessAction: (output: InferDetail<ClientApiEffects[K]["details"], "output">) => Action
        toFailureAction: (error: InferDetail<ClientApiEffects[K]["details"], "errorShape">) => Action
    }
}[keyof ClientApiEffects]
