import { memo as memoRender } from "react"

import type { InteractionHandler } from "./framework"
import { Flex, Button, Text } from "@radix-ui/themes"

export type ViewEvent<El = Element, Ev = Event> = React.UIEvent<El, Ev>

export function ComponentLayout(props: React.PropsWithChildren & { className?: string }) {
    return <>
        <Flex direction="column" align="center" {...props} />
    </>
}

export function ComponentButton<
    ButtonInteraction extends React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>,
    ClickHandler extends InteractionHandler<ButtonInteraction>>
    (props: { onClick: ClickHandler } & React.PropsWithChildren) {
    return <>
        <Button className="btn" onClick={props.onClick}>
            {props.children}
        </Button>
    </>
}

export const ComponentButtonMemo = memoRender(ComponentButton)
