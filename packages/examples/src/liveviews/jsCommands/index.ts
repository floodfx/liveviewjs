import { createLiveView, html, JS } from "liveviewjs";

type MyContext = { count: number };
type MyEvent = { type: "increment" } | { type: "decrement" };

/**
 * Example of a LiveView using JS Commands
 */
export const jsCmdsLiveView = createLiveView<MyContext, MyEvent>({
  mount: async (socket) => {
    socket.assign({ count: 0 });
  },
  handleEvent(event, socket) {
    if (event.type === "increment") {
      socket.assign({ count: socket.context.count + 1 });
    } else if (event.type === "decrement") {
      socket.assign({ count: socket.context.count - 1 });
    }
  },
  render: async (ctx: MyContext) => {
    return html`
      <div>
        <h2>Add / Remove Class</h2>
        <button phx-click="${new JS().add_class("red underline", { to: "#add_rm_class" })}">Add Class</button>
        <button phx-click="${new JS().remove_class("red underline", { to: "#add_rm_class" })}">Remove Class</button>
        <div id="add_rm_class">Add/Remove Class Target</div>

        <h2>Toggle</h2>
        <button phx-click="${new JS().toggle({ to: "#toggle" })}">Toggle</button>
        <div id="toggle">Toggler</div>

        <h2>Show / Hide</h2>
        <button phx-click="${new JS().show({ to: "#show_hide" })}">Show</button>
        <button phx-click="${new JS().hide({ to: "#show_hide" })}">Hide</button>
        <div id="show_hide" style="display:none;">Show/Hide</div>

        <h2>Set / Remove Attribute</h2>
        <button phx-click="${new JS().set_attribute(["disabled", ""], { to: "#set_rm_attr" })}">Set Disabled</button>
        <button phx-click="${new JS().remove_attribute("disabled", { to: "#set_rm_attr" })}">Remove Disabled</button>
        <button id="set_rm_attr">Button</button>

        <h2>Dispatch</h2>
        <button phx-click="${new JS().dispatch("click", { to: "#dispatch" })}">Dispatch Click</button>
        <button phx-click="${new JS().dispatch("custom", { to: "#dispatch", detail: { foo: "bar" } })}">
          Dispatch Custom
        </button>
        <div id="dispatch">Dispatch Target</div>
        <script type="text/javascript">
          window.addEventListener("custom", (e) => {
            console.log("Custom Event", e);
          });
          window.addEventListener("click", (e) => {
            console.log("Click Event", e);
          });
        </script>

        <h2>Transition</h2>
        <button
          phx-click="${new JS()
            .transition("fade-in-scale", {
              to: "#transition",
            })
            .show({ to: "#transition", transition: "fade-in-scale" })}">
          Transition In
        </button>
        <button
          phx-click="${new JS()
            .transition("fade-out-scale", {
              to: "#transition",
            })
            .hide({ to: "#transition", transition: "fade-out-scale" })}">
          Transition Out
        </button>
        <button phx-click="${new JS().transition("shake")}">Shake</button>
        <div id="transition">Transition Target</div>

        <h2>Push</h2>
        Count: ${ctx.count}
        <button phx-click="${new JS().push("increment")}">+</button>
        <button phx-click="${new JS().push("decrement")}">-</button>
        <button phx-click="${new JS().push("increment").hide()}">Add then hide</button>
        <button phx-click="${new JS().hide().push("increment")}">Hide then add</button>
        <button phx-click="${new JS().push("increment", { page_loading: true })}">Page Loading Push</button>

        <!-- Some custom styles for demo-->
        <style>
          .red {
            color: red;
          }
          .underline {
            text-decoration: underline;
          }

          .fade-in-scale {
            animation: 0.25s ease-in 0s normal forwards 1 fade-in-scale-keys;
          }

          .fade-out-scale {
            animation: 0.25s ease-out 0s normal forwards 1 fade-out-scale-keys;
          }

          .fade-in {
            animation: 0.25s ease-out 0s normal forwards 1 fade-in-keys;
          }
          .fade-out {
            animation: 0.25s ease-out 0s normal forwards 1 fade-out-keys;
          }

          .shake {
            animation: shake 0.2s infinite;
          }

          @keyframes shake {
            20% {
              transform: rotate(0deg);
            }
            40% {
              transform: rotate(5deg);
            }
            60% {
              transform: rotate(0deg);
            }
            80% {
              transform: rotate(-5deg);
            }
            100% {
              transform: rotate(0deg);
            }
          }

          @keyframes fade-in-scale-keys {
            0% {
              scale: 0.95;
              opacity: 0;
            }
            100% {
              scale: 1;
              opacity: 1;
            }
          }

          @keyframes fade-out-scale-keys {
            0% {
              scale: 1;
              opacity: 1;
            }
            100% {
              scale: 0.95;
              opacity: 0;
            }
          }

          @keyframes fade-in-keys {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          @keyframes fade-out-keys {
            0% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
        </style>
      </div>
    `;
  },
});
