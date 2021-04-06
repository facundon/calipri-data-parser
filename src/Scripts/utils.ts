export const normalize = (value: string) => {
  return parseFloat(value?.replace(",", "."))
}
