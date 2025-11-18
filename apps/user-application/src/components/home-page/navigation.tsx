import { authClient } from '../auth/client';
import { LoginPopup } from '../auth/login-popup';
import { UserCircle } from '../auth/user-icon';
import { Button } from '../ui/button';

export function Navigation() {
  const { data: user, isPending } = authClient.useSession();

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl mx-auto px-4">
      <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Company Logo/Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                SL
              </span>
            </div>
            <span className="font-semibold text-foreground">SmrtLnks</span>
          </div>
          {isPending ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <UserCircle />
          ) : (
            <LoginPopup>
              {/* Login Button */}
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/80"
              >
                Login
              </Button>
            </LoginPopup>
          )}
        </div>
      </div>
    </nav>
  );
}
