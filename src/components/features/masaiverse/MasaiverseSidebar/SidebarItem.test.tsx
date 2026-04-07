// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { House } from "@phosphor-icons/react"
import SidebarItem from "./SidebarItem"
import type { ReactNode } from "react"

const mockLink = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: (props: {
    children: ReactNode
    className: string
    search: (prev: Record<string, unknown>) => Record<string, unknown>
  }) => {
    const nextSearch = props.search({ page: 1 })
    mockLink({ className: props.className, nextSearch })
    return <a data-testid="sidebar-link">{props.children}</a>
  },
}))

describe("SidebarItem", () => {
  beforeEach(() => {
    mockLink.mockReset()
  })

  it("renders active item styles and sets the tab in link search", () => {
    render(<SidebarItem name="Home" icon={House} tab="home" isActive />)

    expect(screen.getByText("Home").className).toContain("text-white")
    expect(mockLink).toHaveBeenCalledWith({
      className: "block",
      nextSearch: { page: 1, tab: "home" },
    })
  })

  it("renders inactive item styles", () => {
    render(<SidebarItem name="Events" icon={House} tab="events" isActive={false} />)

    expect(screen.getByText("Events").className).toContain("text-black")
  })
})
