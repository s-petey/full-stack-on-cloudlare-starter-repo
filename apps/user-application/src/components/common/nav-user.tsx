import { UserTab } from '../auth/user-icon';
import { SidebarMenu, SidebarMenuItem } from '../ui/sidebar';
import { ModeToggle } from './mode-toggle';

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-between px-2 py-1">
          <ModeToggle />
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <UserTab />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
