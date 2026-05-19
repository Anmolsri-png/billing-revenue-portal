"use client"

import Link from "next/link"
import type * as React from "react"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url?: string
  icon?: React.ElementType
  items?: {
    title: string
    url: string
    icon?: React.ElementType
  }[]
}

const primaryButtonClass =
  "h-11 rounded-xl text-slate-200/95 hover:bg-white/7 hover:text-white active:bg-white/12 active:text-white group-data-[collapsible=icon]:rounded-full"

const primaryActiveButtonClass =
  "h-11 rounded-xl bg-gradient-to-r from-sky-500 via-sky-500 to-cyan-500 text-white shadow-[0_14px_36px_-20px_rgba(14,165,233,0.8)] hover:from-sky-500 hover:via-sky-500 hover:to-cyan-500 hover:text-white active:scale-[0.98] group-data-[collapsible=icon]:rounded-full"

const subMenuButtonClass =
  "h-10 rounded-xl text-slate-300/95 hover:bg-white/7 hover:text-white active:bg-white/12 active:text-white"

const subMenuActiveButtonClass =
  "h-10 rounded-xl bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(125,211,252,0.18)] hover:bg-white/10 hover:text-white"

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col">
        <SidebarMenu>
          {items.map((item) => {
            if (item.items) {
              const isActive = item.items.some(
                (subItem) => pathname === subItem.url
              )

              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={isActive}
                  className="w-full"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={
                          isActive
                            ? primaryActiveButtonClass
                            : `${primaryButtonClass} data-[state=open]:bg-white/7 data-[state=open]:text-white`
                        }
                      >
                        <div className="flex w-full items-center justify-between px-1 group-data-[collapsible=icon]:justify-center">
                          <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                            {item.icon && <item.icon />}
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </div>

                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-1 space-y-1 group-data-[collapsible=icon]:hidden">
                      {item.items.map((subItem) => (
                        <SidebarMenuButton
                          key={subItem.title}
                          asChild
                          className={
                            pathname === subItem.url
                              ? subMenuActiveButtonClass
                              : subMenuButtonClass
                          }
                        >
                          <Link
                            href={subItem.url}
                            className="flex w-full items-center gap-2 pl-10 pr-3"
                          >
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            // NORMAL MENU ITEMS
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={
                    pathname === item.url
                      ? primaryActiveButtonClass
                      : primaryButtonClass
                  }
                >
                  <Link
                    href={item.url!}
                    className="flex w-full items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
