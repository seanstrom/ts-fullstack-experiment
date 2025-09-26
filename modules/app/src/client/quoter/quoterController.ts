import { create as mutate } from "mutative"

import type { Quote } from "@app/data"
import type { AppEffect, RpcEffect } from "@app/client/app/appEffects"
import { type Change } from "@app/client/store"

//--- Actions

export type QuoterAction = GetRandomQuote | GotRandomQuote | MissingRandomQuote

export const QuoterActionTags = {
    GetRandomQuote: ":quoter/GetRandomQuote",
    GotRandomQuote: ":quoter/GotRandomQuote",
    MissingRandomQuote: ":quoter/MissingRandomQuote"
} as const

export interface GetRandomQuote {
    type: typeof QuoterActionTags.GetRandomQuote
}

export interface GotRandomQuote {
    type: typeof QuoterActionTags.GotRandomQuote
    quote: Quote
}

export interface MissingRandomQuote {
    type: typeof QuoterActionTags.MissingRandomQuote
    message: string
}

//--- Model

export type QuoterModel = {
    quote?: Quote
}

//--- Effects

const randomQuoteEffect: RpcEffect = {
    type: ":effects/rpc",
    command: {
        type: "fetchRandomQuote",
        procedure: "query",
        input: (void 0),
        adapters: {
            toSuccessAction(data): QuoterAction {
                return {
                    type: ":quoter/GotRandomQuote",
                    quote: data
                }
            },
            toFailureAction(_error): QuoterAction {
                return {
                    type: ":quoter/MissingRandomQuote",
                    message: "Oops"
                }
            },
        },
    }
}

//--- Update

export function updateQuoter(model: QuoterModel, action: QuoterAction): Change<QuoterModel, AppEffect> {
    switch (action.type) {
        case QuoterActionTags.GotRandomQuote:
            return { model: mutate(model, (draft) => { draft.quote = action.quote }) }
        case QuoterActionTags.GetRandomQuote:
            return { model: model, effect: randomQuoteEffect }
        case QuoterActionTags.MissingRandomQuote:
            return { model: mutate(model, draft => { draft.quote = undefined })}
    }
}
