import { Text } from "@radix-ui/themes"

import type { Quote } from "../data"
import { QuoterActionTags, type AppAction, type QuoterAction } from "./actions"
import { useResponders, type Dispatcher } from "./framework"
import { type Change, type AppEffect, type RpcEffect } from "./store"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent } from "./views"

export type QuoterModel = {
    quote?: Quote
}

function onGetRandomQuote(
    dispatch: Dispatcher<AppAction>,
    _model: QuoterModel,
    _event: ViewEvent
) {
    dispatch({ type: QuoterActionTags.GetRandomQuote })
}

export function RandomQuote({ model, dispatch }: { model: QuoterModel, dispatch: Dispatcher<AppAction> }) {
    const message = model.quote ? model.quote.quote : "Want to see a quote?"
    const responders = useResponders(dispatch, model, { onGetRandomQuote })
    return <>
        <ComponentLayout className="bg-slate-300 p-8">
            <Text className="text-4xl">
                {message}
            </Text>
            <ComponentButtonMemo onClick={responders.onGetRandomQuote}>
                <Text className="text-xl">
                    Get Quote
                </Text>
            </ComponentButtonMemo>
        </ComponentLayout>
    </>
}

const randomQuoteEffect: RpcEffect = {
    type: ":effects/rpc",
    command: {
        type: "fetchRandomQuote",
        procedure: "query",
        input: (void 0),
    }
}

export function updateQuoter(model: QuoterModel, action: QuoterAction): Change<QuoterModel, AppEffect> {
    switch (action.type) {
        case QuoterActionTags.GotRandomQuote:
            return { model: Object.assign({}, model, { quote: action.quote }) }
        case QuoterActionTags.GetRandomQuote:
            return { model: model, effect: randomQuoteEffect }
    }
}
