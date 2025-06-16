import { Text } from "grommet"

import type { Quote } from "../data"
import { QuoterActionTags, type ViewAction, type QuoterAction } from "./actions"
import { useResponders, type Dispatcher } from "./framework"
import { type Change, type AppEffect, type RpcEffect } from "./store"
import { ComponentLayout, ComponentButtonMemo, type ViewEvent } from "./views"

export type QuoterModel = {
    quote?: Quote
}

function onGetRandomQuote(
    dispatch: Dispatcher<ViewAction>,
    _model: QuoterModel,
    _event: ViewEvent
) {
    dispatch({ type: QuoterActionTags.GetRandomQuote })
}

export function RandomQuote({ model, dispatch }: { model: QuoterModel, dispatch: Dispatcher<ViewAction> }) {
    const message = model.quote ? model.quote.quote : "Want to see a quote?"
    const responders = useResponders(dispatch, model, { onGetRandomQuote })
    return <>
        <ComponentLayout>
            <Text size="30px">
                {message}
            </Text>
            <ComponentButtonMemo
                label="Get Quote"
                onClick={responders.onGetRandomQuote}
            />
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
