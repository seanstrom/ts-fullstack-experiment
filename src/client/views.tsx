import { memo as memoRender } from "react"
import { Box, Button } from "grommet"

import type { InteractionHandler } from "./framework"

export type ViewEvent<El = Element, Ev = Event> = React.UIEvent<El, Ev>

export function ComponentLayout(props: React.PropsWithChildren) {
    return <>
        <Box
            align="center"
            pad="large"
            gap="xsmall"
            cssGap={true}
            round={true}
            background={{ color: 'light-2', opacity: 'strong' }}
            style={{ minWidth: "auto" }}
            children={props.children}
        />
    </>
}

export function ComponentButton<
    ButtonInteraction extends React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>,
    ClickHandler extends InteractionHandler<ButtonInteraction>>
    (props: { label: string, onClick: ClickHandler }) {
    return <>
        <Button
            primary
            label={props.label}
            onClick={props.onClick}
        />
    </>
}

export const ComponentButtonMemo = memoRender(ComponentButton)
