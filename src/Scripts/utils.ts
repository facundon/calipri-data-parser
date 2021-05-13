export const normalize = (value: string) => parseFloat(value?.replace(",", "."))

export const toTitleCase = (str: string) => (
  str.replace(/\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
)

export function isNotNullOrUndefined<T>(input: null | undefined | T): input is T {
  return input !== null && input !== undefined
}

export type UnionRecord<K extends PropertyKey, T> = {
  [P in K]: { [U in P]: T }
}[K]

export const pipe = (...functions: ((input: any) => Promise<any>)[]) => (
  (input: any) => (
    functions.reduce((chain, func) => chain.then(func), Promise.resolve(input))
  )
)
