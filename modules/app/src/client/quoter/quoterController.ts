import { create as mutate } from "mutative"

import type { Quote } from "@app/data"
import type { AppEffect, RpcEffect } from "@app/client/effects"
import { type Change } from "@app/client/store"

//--- Actions

export type QuoterAction = GetRandomQuote | GotRandomQuote

export const QuoterActionTags = {
    GetRandomQuote: ":quoter/GetRandomQuote",
    GotRandomQuote: ":quoter/GotRandomQuote",
} as const

export interface GetRandomQuote {
    type: typeof QuoterActionTags.GetRandomQuote
}

export interface GotRandomQuote {
    type: typeof QuoterActionTags.GotRandomQuote
    quote: Quote
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
    }
}

//--- Update

export function updateQuoter(model: QuoterModel, action: QuoterAction): Change<QuoterModel, AppEffect> {
    switch (action.type) {
        case QuoterActionTags.GotRandomQuote:
            return { model: mutate(model, (draft) => { draft.quote = action.quote }) }
        case QuoterActionTags.GetRandomQuote:
            return { model: model, effect: randomQuoteEffect }
    }
}
