import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls to top on route change. Mount inside BrowserRouter. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
