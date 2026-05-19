"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconChevronUp } from "@tabler/icons-react"
import { SettingsIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type SettingsItem = {
  title: string
  url: string
  icon?: React.ElementType
}

export function NavSettings({
  items,
}: {
  items: SettingsItem[]
}) {
  const pathname = usePathname()
  const { isMobile } = useSidebar()

  if (!items.length) {
    return null
  }

  const activeItem = items.find((item) => pathname === item.url)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Settings"
              className="h-auto rounded-2xl bg-white/6 px-3 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-sky-200">
                <SettingsIcon className="size-5" />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">Settings</span>
                <span className="truncate text-xs text-slate-400">
                  {activeItem?.title || `${items.length} options available`}
                </span>
              </div>
              <IconChevronUp className="ml-auto size-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60 rounded-xl border-sky-100 bg-white/95 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.28)] backdrop-blur"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={10}
          >
            <DropdownMenuLabel className="px-3 py-3 font-normal">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Settings</p>
                <p className="text-xs text-slate-500">
                  Manage master data and access options
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.title}
                  asChild
                  className={
                    pathname === item.url
                      ? "bg-sky-50 text-sky-700 focus:bg-sky-50 focus:text-sky-700"
                      : ""
                  }
                >
                  <Link href={item.url} className="cursor-pointer">
                    {item.icon && <item.icon className="size-4" />}
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
