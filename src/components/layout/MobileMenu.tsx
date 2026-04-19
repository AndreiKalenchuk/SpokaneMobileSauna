import { Link, useLocation } from 'react-router-dom'
import { X, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  links: { label: string; href: string }[]
}

export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  const location = useLocation()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[280px] bg-background shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 text-primary font-heading text-lg font-bold">
                <Flame className="h-5 w-5 text-accent" />
                <span>Mobile Sauna</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex flex-col p-4 gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 mt-auto space-y-2">
              <Button asChild className="w-full">
                <Link to="/book" onClick={onClose}>
                  Private Sauna
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/community" onClick={onClose}>
                  Community Sauna
                </Link>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
