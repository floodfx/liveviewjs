defmodule LiveViewOracle.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      LiveViewOracleWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:liveview_oracle, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: LiveViewOracle.PubSub},
      # Start a worker by calling: LiveViewOracle.Worker.start_link(arg)
      # {LiveViewOracle.Worker, arg},
      # Start to serve requests, typically the last entry
      LiveViewOracleWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: LiveViewOracle.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    LiveViewOracleWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
