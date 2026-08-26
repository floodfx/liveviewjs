defmodule LiveViewOracleWeb.ProtocolLifecycleLiveTest do
  use LiveViewOracleWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  test "renders a deterministic disconnected and connected lifecycle", %{conn: conn} do
    disconnected = get(conn, "/scenarios/protocol.lifecycle.basic")

    assert html_response(disconnected, 200) =~ "disconnected"

    {:ok, view, connected_html} = live(conn, "/scenarios/protocol.lifecycle.basic")

    assert connected_html =~ "connected"
    assert has_element?(view, "#count", "0")

    view |> element("#increment") |> render_click()

    assert has_element?(view, "#count", "1")
  end
end
