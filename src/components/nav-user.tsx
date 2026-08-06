import {
  IconDotsVertical,
  IconLogout,
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentAccount, logoutSession, type Account } from "@/api/accounts"
import { queryKeys } from "@/api/query-keys"
import { clearAuthTokens } from "@/lib/auth"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

function getInitials(account?: Account) {
  const name = account?.name.trim()

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }

  if (account?.email) {
    return account.email.slice(0, 2).toUpperCase()
  }

  return "AD"
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: account, isLoading, isError } = useQuery({
    queryKey: queryKeys.account.me(),
    queryFn: getCurrentAccount,
  })

  const logoutMutation = useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      clearAuthTokens()
      queryClient.clear()
      navigate("/login", { replace: true })
    },
  })

  const name = account?.name || "Admin"
  const email = isLoading ? "Loading profile..." : isError ? "Unable to load profile" : account?.email || "-"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {account?.profilePicture && <AvatarImage src={account.profilePicture} alt={name} />}
                <AvatarFallback className="rounded-lg">{getInitials(account)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {account?.profilePicture && <AvatarImage src={account.profilePicture} alt={name} />}
                  <AvatarFallback className="rounded-lg">{getInitials(account)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={logoutMutation.isPending}
              onSelect={(event) => {
                event.preventDefault()
                logoutMutation.mutate()
              }}
            >
              <IconLogout />
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
