import { JS } from "./jsCommands";

describe("test jsCommands", () => {
  it("matches add_class snapshot", () => {
    expect(new JS().add_class("red underline").toString()).toMatchInlineSnapshot(
      `"[[\\"add_class\\",{\\"to\\":null,\\"time\\":200,\\"names\\":[\\"red\\",\\"underline\\"],\\"transition\\":[[],[],[]]}]]"`
    );

    expect(new JS().add_class("red underline", { to: "#add_rm_class" }).toString()).toMatchInlineSnapshot(
      `"[[\\"add_class\\",{\\"to\\":\\"#add_rm_class\\",\\"time\\":200,\\"names\\":[\\"red\\",\\"underline\\"],\\"transition\\":[[],[],[]]}]]"`
    );

    expect(
      new JS().add_class("red underline", { to: "#add_rm_class", time: 300, transition: "fade-in-scale" }).toString()
    ).toMatchInlineSnapshot(
      `"[[\\"add_class\\",{\\"to\\":\\"#add_rm_class\\",\\"time\\":300,\\"names\\":[\\"red\\",\\"underline\\"],\\"transition\\":[[\\"fade-in-scale\\"],[],[]]}]]"`
    );
  });

  it("matches remove_class snapshot", () => {
    expect(new JS().remove_class("red underline").toString()).toMatchInlineSnapshot(
      `"[[\\"remove_class\\",{\\"to\\":null,\\"time\\":200,\\"names\\":[\\"red\\",\\"underline\\"],\\"transition\\":[[],[],[]]}]]"`
    );

    expect(new JS().remove_class("red underline", { to: "#add_rm_class" }).toString()).toMatchInlineSnapshot(
      `"[[\\"remove_class\\",{\\"to\\":\\"#add_rm_class\\",\\"time\\":200,\\"names\\":[\\"red\\",\\"underline\\"],\\"transition\\":[[],[],[]]}]]"`
    );

    expect(
      new JS().remove_class("red underline", { to: "#add_rm_class", time: 300, transition: "fade-in-scale" }).toString()
    ).toMatchInlineSnapshot(
      `"[[\\"remove_class\\",{\\"to\\":\\"#add_rm_class\\",\\"time\\":300,\\"names\\":[\\"red\\",\\"underline\\"],\\"transition\\":[[\\"fade-in-scale\\"],[],[]]}]]"`
    );
  });

  it("matches show snapshot", () => {
    expect(new JS().show().toString()).toMatchInlineSnapshot(
      `"[[\\"show\\",{\\"to\\":null,\\"time\\":200,\\"transition\\":[[],[],[]],\\"display\\":null}]]"`
    );
    expect(new JS().show({ to: "#show_me" }).toString()).toMatchInlineSnapshot(
      `"[[\\"show\\",{\\"to\\":\\"#show_me\\",\\"time\\":200,\\"transition\\":[[],[],[]],\\"display\\":null}]]"`
    );
    expect(new JS().show({ to: "#show_me", time: 300, transition: "shake" }).toString()).toMatchInlineSnapshot(
      `"[[\\"show\\",{\\"to\\":\\"#show_me\\",\\"time\\":300,\\"transition\\":[[\\"shake\\"],[],[]],\\"display\\":null}]]"`
    );
    expect(new JS().show({ to: "#show_me", display: "inline" }).toString()).toMatchInlineSnapshot(
      `"[[\\"show\\",{\\"to\\":\\"#show_me\\",\\"time\\":200,\\"transition\\":[[],[],[]],\\"display\\":\\"inline\\"}]]"`
    );
  });

  it("matches hide snapshot", () => {
    expect(new JS().hide().toString()).toMatchInlineSnapshot(
      `"[[\\"hide\\",{\\"to\\":null,\\"time\\":200,\\"transition\\":[[],[],[]]}]]"`
    );
    expect(new JS().hide({ to: "#hide_me" }).toString()).toMatchInlineSnapshot(
      `"[[\\"hide\\",{\\"to\\":\\"#hide_me\\",\\"time\\":200,\\"transition\\":[[],[],[]]}]]"`
    );
    expect(new JS().hide({ to: "#hide_me", time: 300, transition: "shake" }).toString()).toMatchInlineSnapshot(
      `"[[\\"hide\\",{\\"to\\":\\"#hide_me\\",\\"time\\":300,\\"transition\\":[[\\"shake\\"],[],[]]}]]"`
    );
  });

  it("matches set_attribute snapshot", () => {
    expect(new JS().set_attribute(["disabled", ""]).toString()).toMatchInlineSnapshot(
      `"[[\\"set_attr\\",{\\"to\\":null,\\"attr\\":[\\"disabled\\",\\"\\"]}]]"`
    );
    expect(new JS().set_attribute(["aria-expanded", "true"], { to: "#target" }).toString()).toMatchInlineSnapshot(
      `"[[\\"set_attr\\",{\\"to\\":\\"#target\\",\\"attr\\":[\\"aria-expanded\\",\\"true\\"]}]]"`
    );
  });

  it("matches remove_attribute snapshot", () => {
    expect(new JS().remove_attribute("disabled").toString()).toMatchInlineSnapshot(
      `"[[\\"remove_attr\\",{\\"to\\":null,\\"attr\\":\\"disabled\\"}]]"`
    );
    expect(new JS().remove_attribute("aria-expanded", { to: "#target" }).toString()).toMatchInlineSnapshot(
      `"[[\\"remove_attr\\",{\\"to\\":\\"#target\\",\\"attr\\":\\"aria-expanded\\"}]]"`
    );
  });

  it("matches toggle snapshot", () => {
    expect(new JS().toggle().toString()).toMatchInlineSnapshot(
      `"[[\\"toggle\\",{\\"to\\":null,\\"time\\":200,\\"ins\\":[[],[],[]],\\"outs\\":[[],[],[]],\\"display\\":null}]]"`
    );
    expect(new JS().toggle({ to: "#toggle_me" }).toString()).toMatchInlineSnapshot(
      `"[[\\"toggle\\",{\\"to\\":\\"#toggle_me\\",\\"time\\":200,\\"ins\\":[[],[],[]],\\"outs\\":[[],[],[]],\\"display\\":null}]]"`
    );
    expect(
      new JS()
        .toggle({ to: "#toggle_me", in: "fade-in-scale", out: "fade-out-scale", time: 300, display: "inline" })
        .toString()
    ).toMatchInlineSnapshot(
      `"[[\\"toggle\\",{\\"to\\":\\"#toggle_me\\",\\"time\\":300,\\"ins\\":[[\\"fade-in-scale\\"],[],[]],\\"outs\\":[[\\"fade-out-scale\\"],[],[]],\\"display\\":\\"inline\\"}]]"`
    );
    expect(
      new JS()
        .toggle({
          to: "#toggle_me",
          in: ["fade-in-scale", "opacity-0", "opacity-100"],
          out: ["fade-out-scale", "opacity-100", "opacity-0"],
          time: 300,
          display: "inline",
        })
        .toString()
    ).toMatchInlineSnapshot(
      `"[[\\"toggle\\",{\\"to\\":\\"#toggle_me\\",\\"time\\":300,\\"ins\\":[[\\"fade-in-scale\\"],[\\"opacity-0\\"],[\\"opacity-100\\"]],\\"outs\\":[[\\"fade-out-scale\\"],[\\"opacity-100\\"],[\\"opacity-0\\"]],\\"display\\":\\"inline\\"}]]"`
    );
  });

  it("matches dispatch snapshot", () => {
    expect(new JS().dispatch("click").toString()).toMatchInlineSnapshot(
      `"[[\\"dispatch\\",{\\"to\\":null,\\"event\\":\\"click\\"}]]"`
    );

    expect(
      new JS().dispatch("click", { to: "#click_target", detail: { foo: "bar" } }).toString()
    ).toMatchInlineSnapshot(
      `"[[\\"dispatch\\",{\\"to\\":\\"#click_target\\",\\"event\\":\\"click\\",\\"detail\\":{\\"foo\\":\\"bar\\"}}]]"`
    );

    expect(
      new JS().dispatch("click", { to: "#click_target", detail: { foo: "bar" }, bubbles: false }).toString()
    ).toMatchInlineSnapshot(
      `"[[\\"dispatch\\",{\\"to\\":\\"#click_target\\",\\"event\\":\\"click\\",\\"detail\\":{\\"foo\\":\\"bar\\"},\\"bubbles\\":false}]]"`
    );
  });

  it("matches transition snapshot", () => {
    expect(new JS().transition("fade-in-scale").toString()).toMatchInlineSnapshot(
      `"[[\\"transition\\",{\\"to\\":null,\\"time\\":200,\\"transition\\":[[\\"fade-in-scale\\"],[],[]]}]]"`
    );
    expect(new JS().transition(["fade-in-scale", "opacity-0", "opacity-100"]).toString()).toMatchInlineSnapshot(
      `"[[\\"transition\\",{\\"to\\":null,\\"time\\":200,\\"transition\\":[[\\"fade-in-scale\\"],[\\"opacity-0\\"],[\\"opacity-100\\"]]}]]"`
    );
    expect(
      new JS()
        .transition(["fade-in-scale another", "opacity-0 another2", "opacity-100 another 3"], {
          time: 300,
          to: "#transition_target",
        })
        .toString()
    ).toMatchInlineSnapshot(
      `"[[\\"transition\\",{\\"to\\":\\"#transition_target\\",\\"time\\":300,\\"transition\\":[[\\"fade-in-scale\\",\\"another\\"],[\\"opacity-0\\",\\"another2\\"],[\\"opacity-100\\",\\"another\\",\\"3\\"]]}]]"`
    );
  });

  it("matches push snapshot", () => {
    expect(new JS().push("my_event").toString()).toMatchInlineSnapshot(`"[[\\"push\\",{\\"event\\":\\"my_event\\"}]]"`);
    expect(new JS().push("another_event", { page_loading: true }).toString()).toMatchInlineSnapshot(
      `"[[\\"push\\",{\\"event\\":\\"another_event\\",\\"page_loading\\":true}]]"`
    );
    expect(
      new JS()
        .push("yet_another_event", { loading: "#loader", target: "#push-target", value: { additional: "data" } })
        .toString()
    ).toMatchInlineSnapshot(
      `"[[\\"push\\",{\\"event\\":\\"yet_another_event\\",\\"loading\\":\\"#loader\\",\\"target\\":\\"#push-target\\",\\"value\\":{\\"additional\\":\\"data\\"}}]]"`
    );
  });
});
