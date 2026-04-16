// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MasaiverseTab } from "./SidebarItem"
import SidebarList from "./SidebarList"

const mockUseRouterState = vi.fn()
const mockSidebarItem = vi.fn()
type SidebarItemRenderProps = { tab: MasaiverseTab; isActive: boolean }

vi.mock("@tanstack/react-router", () => ({
  useRouterState: (args: { select: (state: { location: { search: { tab?: string } } }) => MasaiverseTab }) =>
    mockUseRouterState(args),
}))

vi.mock("./SidebarItem", () => ({
  default: (props: { name: string; tab: MasaiverseTab; isActive: boolean }) => {
    mockSidebarItem(props)
    return <div data-testid={`item-${props.tab}`}>{props.name}</div>
  },
}))

describe("SidebarList", () => {
  beforeEach(() => {
    mockUseRouterState.mockReset()
    mockSidebarItem.mockReset()
  })

  it("renders all menu items with home active by default", () => {
    mockUseRouterState.mockImplementation(({ select }) =>
      select({ location: { search: { tab: "invalid-tab" } } }),
    )

    render(<SidebarList />)

    expect(screen.getByTestId("item-home")).toBeTruthy()
    expect(screen.getByTestId("item-events")).toBeTruthy()

    const homeCall = mockSidebarItem.mock.calls.find((call) => {
      const props = call[0] as SidebarItemRenderProps
      return props.tab === "home"
    })
    expect((homeCall?.[0] as SidebarItemRenderProps | undefined)?.isActive).toBe(true)
  })

  it("activates the tab from router state when it is valid", () => {
    mockUseRouterState.mockImplementation(({ select }) =>
      select({ location: { search: { tab: "events" } } }),
    )

    render(<SidebarList />)

    const eventsCall = mockSidebarItem.mock.calls.find((call) => {
      const props = call[0] as SidebarItemRenderProps
      return props.tab === "events"
    })
    const homeCall = mockSidebarItem.mock.calls.find((call) => {
      const props = call[0] as SidebarItemRenderProps
      return props.tab === "home"
    })

    expect((eventsCall?.[0] as SidebarItemRenderProps | undefined)?.isActive).toBe(
      true,
    )
    expect((homeCall?.[0] as SidebarItemRenderProps | undefined)?.isActive).toBe(
      false,
    )
  })
})
