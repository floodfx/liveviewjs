defmodule LiveViewOracleWeb.Router do
  use LiveViewOracleWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {LiveViewOracleWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", LiveViewOracleWeb do
    pipe_through :browser

    live "/scenarios/protocol.lifecycle.basic", ProtocolLifecycleLive
  end

  # Other scopes may use custom stacks.
  # scope "/api", LiveViewOracleWeb do
  #   pipe_through :api
  # end
end
