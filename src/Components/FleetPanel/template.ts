export type Fleet = {
  id: string,
  fleet: string,
  profiles: string[]
  reference: string,
}

export const FLEETS_TEMPLATE: Fleet[] = [
  {
    id: "1",
    fleet: "CNR",
    profiles: ["ORE"],
    reference: "R",
  },
  {
    id: "2",
    fleet: "FIAT",
    profiles: ["ORE", "CDE"],
    reference: "C",
  }
]