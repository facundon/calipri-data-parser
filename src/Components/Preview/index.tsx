/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
// eslint-disable-next-line no-use-before-define
import * as React from "react"
import "./styles/index.scss"

export type PreviewData = {
  [x: string]: string,
}
export interface IPreviewProps {
  data: PreviewData[],
}

const Preview = React.forwardRef<HTMLTableElement, IPreviewProps>(({ data, ...props }, ref) => (
  <table ref={ref} {...props}>
    {data.map((d) => (
      <>
        <tr key={Object.keys(d)[0]}>
          <th>
            {Object.keys(d)[0]}
          </th>
          <td>
            {Object.values(d)[0]}
          </td>
        </tr>
      </>
    ))}
  </table>
))

export default Preview
