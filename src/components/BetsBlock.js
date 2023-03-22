export default function BetsBlock({ bet }) {
    return (
      <table>
        <tbody>
          <tr>
            <td>{bet.outcomes[0].name}</td>
          </tr>
          <tr>
            <td>{bet.outcomes[1].name}</td>
          </tr>
        </tbody>
      </table>
    )
  }