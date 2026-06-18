import { useEffect, useState } from 'react'

/** True on phones/tablets and narrow viewports where drag-and-drop is unreliable. */
export function useTouchInteraction() {
  const [touchMode, setTouchMode] = useState(() => readTouchMode())

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)')
    const noHover = window.matchMedia('(hover: none)')
    const narrow = window.matchMedia('(max-width: 767px)')

    function update() {
      setTouchMode(readTouchMode())
    }

    coarse.addEventListener('change', update)
    noHover.addEventListener('change', update)
    narrow.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      coarse.removeEventListener('change', update)
      noHover.removeEventListener('change', update)
      narrow.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return touchMode
}

function readTouchMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    window.innerWidth < 768
  )
}
