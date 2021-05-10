export const normalize = (value: string) => parseFloat(value?.replace(",", "."))

export const toTitleCase = (str: string) => (
  str.replace(/\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
)

export function isNotNullOrUndefined<T>(input: null | undefined | T): input is T {
  return input !== null && input !== undefined
}
