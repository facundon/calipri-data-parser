export type Fleet = {
  id: string,
  fleet: string,
  profiles: string[]
}

export const FLEETS_TEMPLATE: Fleet[] = [
  {
    id: "1",
    fleet: "CNR",
    profiles: ["ORE"]
  },
  {
    id: "2",
    fleet: "FIAT",
    profiles: ["ORE", "CDE"]
  }
]