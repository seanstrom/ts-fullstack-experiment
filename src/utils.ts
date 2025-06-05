import {
    useEffect,
    useLayoutEffect,
} from "react"

export const usePortableLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect
