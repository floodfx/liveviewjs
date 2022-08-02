/**
 * The string of classes to apply, or
 * a 3-tuple containing the transition class, the class to apply to start
 * the transition, and the class to apply to end the transition.
 * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
 */
type Transition = string | [string, string, string];

/**
 * Internal type for commands that have transitions
 */
type TransitionBodyCmd = [string[], string[], string[]];

/* ---- Add / Remove Class ---- */
/**
 * Options for the "add_class" and "remove_class" commands
 */
type ClassOptions = {
  /**
   * The optional DOM selector element to add or remove the class from (defaults to current element).
   */
  to?: string;
  /**
   * The time over which to apply the transition options.
   */
  time?: number;
  /**
   * The string of classes to apply before adding or removing the classes, or
   * a 3-tuple containing the transition class, the class to apply to start
   * the transition, and the class to apply to end the transition.
   * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
   */
  transition?: Transition;
};

interface ClassCmdBody {
  names: string[];
  time: number;
  to: string | null;
  transition: TransitionBodyCmd;
}

type AddClassCmd = ["add_class", ClassCmdBody];
type RemoveClassCmd = ["remove_class", ClassCmdBody];

/* ---- Show / Hide ---- */
/**
 * Options for the "show" command
 */
type ShowOptions = {
  /**
   * The optional DOM selector element to show (defaults to current element).
   */
  to?: string;
  /**
   * The time over which to apply the transition options.
   */
  time?: number;
  /**
   * The string of classes to apply before showing, or
   * a 3-tuple containing the transition class, the class to apply to start
   * the transition, and the class to apply to end the transition.
   * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
   */
  transition?: Transition;
  /**
   * The optional display value to set when showing the element. Defaults to "block".
   */
  display?: string;
};

interface ShowCmdBody {
  time: number;
  to: string | null;
  transition: TransitionBodyCmd;
  display: string | null;
}

type HideOptions = {
  /**
   * The optional DOM selector element to hide (defaults to current element).
   */
  to?: string;
  /**
   * The time over which to apply the transition options.
   */
  time?: number;
  /**
   * The string of classes to apply before hiding, or
   * a 3-tuple containing the transition class, the class to apply to start
   * the transition, and the class to apply to end the transition.
   * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
   */
  transition?: Transition;
};

interface HideCmdBody {
  time: number;
  to: string | null;
  transition: TransitionBodyCmd;
}

type ShowCmd = ["show", ShowCmdBody];
type HideCmd = ["hide", HideCmdBody];

/* ---- Toggle ---- */

/**
 * Options for the "toggle" command
 */
type ToggleOptions = {
  /**
   * The optional DOM selector element to toggle (defaults to current element).
   */
  to?: string;
  /**
   * The time over which to apply the transition options.
   */
  time?: number;
  /**
   * The string of classes to apply when toggling in, or
   * a 3-tuple containing the transition class, the class to apply to start
   * the transition, and the class to apply to end the transition.
   * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
   */
  in?: Transition;
  /**
   * The string of classes to apply when toggling out, or
   * a 3-tuple containing the transition class, the class to apply to start
   * the transition, and the class to apply to end the transition.
   * e.g. ["ease-out duration-300", "opacity-100", "opacity-0"]
   */
  out?: Transition;
  /**
   * The optional display value to set when toggling in the element. Defaults to "block".
   */
  display?: string;
};

interface ToggleCmdBody {
  display: string | null;
  ins: TransitionBodyCmd;
  outs: TransitionBodyCmd;
  time: number;
  to: string | null;
}

type ToggleCmd = ["toggle", ToggleCmdBody];

/* ---- Set / Remove Attribute ---- */

/**
 * Options for the "set_attribute" and "remove_attribute" commands
 */
type AttributeOptions = {
  /**
   * The optional DOM selector element to set or remove the attribute from (defaults to current element).
   */
  to?: string;
};

interface SetAttributeCmdBody {
  attr: [string, string];
  to: string | null;
}

interface RemoveAttributeCmdBody {
  attr: string;
  to: string | null;
}

type SetAttributeCmd = ["set_attr", SetAttributeCmdBody];

type RemoveAttributeCmd = ["remove_attr", RemoveAttributeCmdBody];

/* ---- Transition ---- */

/**
 * Options for the "transition" command
 */
type TransitionOptions = {
  /**
   * The optional DOM selector element to apply the transition to (defaults to current element).
   */
  to?: string;
  /**
   * The time over which to apply the transition.
   */
  time?: number;
};
interface TransitionCmdBody {
  time: number;
  to: string | null;
  transition: TransitionBodyCmd;
}
type TransitionCmd = ["transition", TransitionCmdBody];

/* ---- Dispatch ---- */

/**
 * Options for the "dispatch" command
 */
type DispatchOptions = {
  /**
   * The optional DOM selector element to apply the dispatch to (defaults to current element).
   */
  to?: string;
  /**
   * The optional map to use as the dispatched event's detail.
   */
  detail?: { [key: string]: string | number | boolean };
  /**
   * The optional boolean that determines if the event bubbles (defaults to true).
   */
  bubbles?: boolean;
};

interface DispatchCmdBody {
  event: string;
  to: string | null;
  detail?: { [key: string]: string | number | boolean };
  bubbles?: boolean;
}

type DispatchCmd = ["dispatch", DispatchCmdBody];

/* ---- Push ---- */

/**
 * Options for the "push" command
 */
type PushOptions = {
  /**
   * The selector or component ID to push to
   */
  target?: string;
  /**
   * The selector to apply the phx loading classes to
   */
  loading?: string;
  /**
   * An optional boolean indicating whether to trigger the "phx:page-loading-start"
   * and "phx:page-loading-stop" events. Defaults to `false`
   */
  page_loading?: boolean;
  /**
   * An optional map of key/value pairs to include in the event's `value` property
   */
  value?: { [key: string]: string | number | boolean };
};

interface PushCmdBody {
  event: string;
  target?: string;
  loading?: string;
  page_loading?: boolean;
  value?: { [key: string]: string | number | boolean };
}

type PushCmd = ["push", PushCmdBody];

/* ---- Cmd Union ---- */
type Cmd =
  | AddClassCmd
  | RemoveClassCmd
  | ShowCmd
  | HideCmd
  | ToggleCmd
  | SetAttributeCmd
  | RemoveAttributeCmd
  | TransitionCmd
  | DispatchCmd
  | PushCmd;

/**
 * The JS Commands API allows you to perform a small set of powerful
 *  DOM operations that only execute on the client.  This allows you
 * apply css classes, show/hide elements, and dispatch events all without
 * making a roundtrip to the server.  These commands are chainable - e.g.
 * JS.add_class(...).show(...).dispatch(...).
 *
 * This is a port of the Phoenix LiveView JS Commands API.
 * https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.JS.html
 */
export class JS {
  private cmds: Cmd[] = [];

  /**
   * Adds the css class(es) to the target element
   * @param names the css class(es) to add (space delimited)
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  add_class(names: string, options?: ClassOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "add_class",
        {
          to: options?.to ?? null,
          time: options?.time ?? 200,
          names: names.split(/\s+/),
          transition: transitionOptionsToCmd(options?.transition),
        },
      ] as AddClassCmd,
    ];
    return this;
  }

  /**
   * Removes the css class(es) from the target element
   * @param names the css class(es) to remove (space delimited)
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  remove_class(names: string, options?: ClassOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "remove_class",
        {
          to: options?.to ?? null,
          time: options?.time ?? 200,
          names: names.split(/\s+/),
          transition: transitionOptionsToCmd(options?.transition),
        },
      ] as RemoveClassCmd,
    ];
    return this;
  }

  /**
   * Shows the target element
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  show(options?: ShowOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "show",
        {
          to: options?.to ?? null,
          time: options?.time ?? 200,
          transition: transitionOptionsToCmd(options?.transition),
          display: options?.display ?? null,
        },
      ] as ShowCmd,
    ];
    return this;
  }

  /**
   * Hides the target element
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  hide(options?: HideOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "hide",
        {
          to: options?.to ?? null,
          time: options?.time ?? 200,
          transition: transitionOptionsToCmd(options?.transition),
        },
      ] as HideCmd,
    ];
    return this;
  }

  /**
   * Toggles the visibility of the target element
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  toggle(options?: ToggleOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "toggle",
        {
          to: options?.to ?? null,
          time: options?.time ?? 200,
          ins: transitionOptionsToCmd(options?.in),
          outs: transitionOptionsToCmd(options?.out),
          display: options?.display ?? null,
        },
      ] as ToggleCmd,
    ];
    return this;
  }

  /**
   * Sets the given attribute on the target element
   * @param attr the 2-tuple of the attribute name and value to set
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  set_attribute(attr: [string, string], options?: AttributeOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "set_attr",
        {
          to: options?.to ?? null,
          attr,
        },
      ] as SetAttributeCmd,
    ];
    return this;
  }

  /**
   * Removes the given attribute from the target element
   * @param attr the attribute name to remove
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  remove_attribute(attr: string, options?: AttributeOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "remove_attr",
        {
          to: options?.to ?? null,
          attr,
        },
      ] as RemoveAttributeCmd,
    ];
    return this;
  }

  /**
   * Applies the given transition to the target element
   * @param transition the transition to apply
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  transition(transition: Transition, options?: TransitionOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "transition",
        {
          to: options?.to ?? null,
          time: options?.time ?? 200,
          transition: transitionOptionsToCmd(transition),
        },
      ] as TransitionCmd,
    ];
    return this;
  }

  /**
   * Dispatches an event from the target element to the DOM.
   *
   * Note: All events dispatched are of a type CustomEvent, with the exception of "click".
   * For a "click", a MouseEvent is dispatched to properly simulate a UI click.
   *
   * For emitted CustomEvent's, the event detail will contain a dispatcher, which references
   * the DOM node that dispatched the JS event to the target element.
   *
   * @param event the event to dispatch
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  dispatch(event: string, options?: DispatchOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "dispatch",
        {
          to: options?.to ?? null,
          event,
          detail: options?.detail,
          bubbles: options?.bubbles,
        },
      ] as DispatchCmd,
    ];
    return this;
  }

  /**
   * Pushes the given event to the server
   * @param event the event to push
   * @param options the options for the command
   * @returns this instance for further chaining
   */
  push(event: string, options?: PushOptions) {
    this.cmds = [
      ...this.cmds,
      [
        "push",
        {
          event,
          ...options,
        },
      ] as PushCmd,
    ];
    return this;
  }

  /**
   * @returns JSON stringified commands for embedding in HTML
   */
  toString() {
    return JSON.stringify(this.cmds);
  }
}

/**
 * Convert a transition option to a transition body command
 */
function transitionOptionsToCmd(opts?: Transition): TransitionBodyCmd {
  if (opts === undefined) {
    return [[], [], []];
  } else if (typeof opts === "string") {
    return [opts.split(/\s+/), [], []];
  }
  // split each transition option into an array of classes
  return [opts[0].split(/\s+/), opts[1].split(/\s+/), opts[2].split(/\s+/)];
}
