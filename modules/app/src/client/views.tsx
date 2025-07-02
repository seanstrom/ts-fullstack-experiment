import { memo as memoRender } from "react"
import { Flex, Button } from "@radix-ui/themes"

import type { InteractionHandler } from "./framework"

export type ViewEvent<El = Element, Ev = Event> = React.UIEvent<El, Ev>

export function ComponentLayout(props: React.PropsWithChildren & { className?: string }) {
    return <>
        <Flex direction="column" align="center" {...props} />
    </>
}

export function ComponentButton<
    ViewElement extends HTMLButtonElement,
    ButtonInteraction extends React.MouseEvent<ViewElement>,
    ClickHandler extends InteractionHandler<ButtonInteraction>
>(
    props: { onClick: ClickHandler } & React.PropsWithChildren
) {
    return <>
        <Button className="btn" onClick={props.onClick}>
            {props.children}
        </Button>
    </>
}

export const ComponentButtonMemo = memoRender(ComponentButton)
