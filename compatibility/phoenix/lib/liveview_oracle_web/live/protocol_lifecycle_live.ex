defmodule LiveViewOracleWeb.ProtocolLifecycleLive do
  use LiveViewOracleWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0, connection: connection_state(socket))}
  end

  @impl true
  def handle_event("increment", %{}, socket) do
    {:noreply, update(socket, :count, &(&1 + 1))}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <main id="oracle-root" data-capability-id="protocol.lifecycle.basic">
      <h1>Protocol lifecycle</h1>
      <p id="connection-state">{@connection}</p>
      <output id="count">{@count}</output>
      <button id="increment" type="button" phx-click="increment">Increment</button>
    </main>
    """
  end

  defp connection_state(socket) do
    if connected?(socket), do: "connected", else: "disconnected"
  end
end
