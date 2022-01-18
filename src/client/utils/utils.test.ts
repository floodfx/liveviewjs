
import { renderedToHtml, updateRenderedWithDiff } from '.';
import { Dynamics, RenderedNode } from '../../server/socket/types';

describe("test render html", () => {
  it("combines statics and dynamics properly", () => {
    const light =
    {
      0: '', 1: '', 2: {
        0: '10', 1: '10', s: [
          "<h1>Front Porch Light</h1>\n<div id=\"light\">\n  <div class=\"meter\">\n    <span style=\"width: ",
          "%\">\n      ",
          "%\n    </span>\n  </div>\n\n  <button phx-click=\"off\">\n    <img src=\"images/light-off.svg\">\n  </button>\n\n  <button phx-click=\"down\">\n    <img src=\"images/down.svg\">\n  </button>\n\n  <button phx-click=\"up\">\n    <img src=\"images/up.svg\">\n  </button>\n\n  <button phx-click=\"on\">\n    <img src=\"images/light-on.svg\">\n  </button>\n</div>\n",
        ]
      }, s: [
        "<main role=\"main\" class=\"container\">\n  <p class=\"alert alert-info\" role=\"alert\"\n    phx-click=\"lv:clear-flash\"\n    phx-value-key=\"info\">",
        "</p>\n\n  <p class=\"alert alert-danger\" role=\"alert\"\n    phx-click=\"lv:clear-flash\"\n    phx-value-key=\"error\">",
        "</p>\n",
        "\n</main>\n"
      ]
    }
    const html = renderedToHtml(light);
    console.log(html);
    expect(html).toEqual(`<main role="main" class="container">
  <p class="alert alert-info" role="alert"
    phx-click="lv:clear-flash"
    phx-value-key="info"></p>

  <p class="alert alert-danger" role="alert"
    phx-click="lv:clear-flash"
    phx-value-key="error"></p>
<h1>Front Porch Light</h1>
<div id="light">
  <div class="meter">
    <span style="width: 10%">
      10%
    </span>
  </div>

  <button phx-click="off">
    <img src="images/light-off.svg">
  </button>

  <button phx-click="down">
    <img src="images/down.svg">
  </button>

  <button phx-click="up">
    <img src="images/up.svg">
  </button>

  <button phx-click="on">
    <img src="images/light-on.svg">
  </button>
</div>

</main>
`
    )
  });


  it("can update rendered with diff", () => {
    const diff: Dynamics = { 2: { 0: "100", 1: "100" } }
    const orginalRendered: RenderedNode =
    {
      0: '', 1: '', 2: {
        0: '10', 1: '10', s: [
          "<h1>Front Porch Light</h1>\n<div id=\"light\">\n  <div class=\"meter\">\n    <span style=\"width: ",
          "%\">\n      ",
          "%\n    </span>\n  </div>\n\n  <button phx-click=\"off\">\n    <img src=\"images/light-off.svg\">\n  </button>\n\n  <button phx-click=\"down\">\n    <img src=\"images/down.svg\">\n  </button>\n\n  <button phx-click=\"up\">\n    <img src=\"images/up.svg\">\n  </button>\n\n  <button phx-click=\"on\">\n    <img src=\"images/light-on.svg\">\n  </button>\n</div>\n",
        ]
      }, s: [
        "<main role=\"main\" class=\"container\">\n  <p class=\"alert alert-info\" role=\"alert\"\n    phx-click=\"lv:clear-flash\"\n    phx-value-key=\"info\">",
        "</p>\n\n  <p class=\"alert alert-danger\" role=\"alert\"\n    phx-click=\"lv:clear-flash\"\n    phx-value-key=\"error\">",
        "</p>\n",
        "\n</main>\n"
      ]
    }
    const newRendered = updateRenderedWithDiff(orginalRendered, diff);
    const html = renderedToHtml(newRendered);
    console.log(html);
    expect(html).toBe(`<main role="main" class="container">
  <p class="alert alert-info" role="alert"
    phx-click="lv:clear-flash"
    phx-value-key="info"></p>

  <p class="alert alert-danger" role="alert"
    phx-click="lv:clear-flash"
    phx-value-key="error"></p>
<h1>Front Porch Light</h1>
<div id="light">
  <div class="meter">
    <span style="width: 100%">
      100%
    </span>
  </div>

  <button phx-click="off">
    <img src="images/light-off.svg">
  </button>

  <button phx-click="down">
    <img src="images/down.svg">
  </button>

  <button phx-click="up">
    <img src="images/up.svg">
  </button>

  <button phx-click="on">
    <img src="images/light-on.svg">
  </button>
</div>

</main>
`
    )
  });

});