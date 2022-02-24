import { html } from "../../server/templates";
import { LiveViewChangeset, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewMountParams, LiveViewSocket, StringPropertyValues } from "../../server/component/types";
import { SessionData } from "express-session";
import { Volunteer, changeset, createVolunteer, listVolunteers, getVolunteer, updateVolunteer, VolunteerData, subscribe } from "./data";
import { submit } from "../../server/templates/helpers/submit";
import { form_for } from "../../server/templates/helpers/form_for";
import { error_tag, telephone_input, text_input } from "../../server/templates/helpers/inputs";
import { BaseLiveViewComponent } from "../../server/component/base_component";

export interface VolunteerContext {
  volunteers: Volunteer[]
  changeset: LiveViewChangeset<Volunteer>
}

type VolunteerEvents = "save" | "validate" | "toggle-status";

export class VolunteerComponent extends BaseLiveViewComponent<VolunteerContext, unknown> implements
  LiveViewExternalEventListener<VolunteerContext, VolunteerEvents, Volunteer>,
  LiveViewInternalEventListener<VolunteerContext, VolunteerData> {


  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<VolunteerContext>) {
    if (socket.connected) {
      console.log("subscribing", socket.id);
      subscribe(socket);
    }
    return {
      volunteers: listVolunteers(),
      changeset: changeset({}, {})
    }
  };

  render(context: VolunteerContext) {
    const { changeset, volunteers } = context;
    return html`
    <h1>Volunteer Check-In</h1>
    <div id="checkin">
    
      ${form_for<Volunteer>("#", {
        phx_submit: "save",
        phx_change: "validate"
        })}
    
        <div class="field">
          ${text_input<Volunteer>(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
        </div>
    
        <div class="field">
          ${telephone_input<Volunteer>(changeset, "phone", {
            placeholder: "Phone", autocomplete: "off", phx_debounce: "blur"
            })}
            ${error_tag(changeset, "phone")}
        </div>
        ${submit("Check In", { phx_disable_with: "Saving..." })}
        </form>
    
        <div id="volunteers" phx-update="prepend">
          ${volunteers.map(this.renderVolunteer)}
        </div>
    </div>
    `
  };

  renderVolunteer(volunteer: Volunteer) {
    return html`
    <div id="${volunteer.id}" class="volunteer ${volunteer.checked_out ? " out" : "" }">
      <div class="name">
        ${volunteer.name}
      </div>
      <div class="phone">
        📞 ${volunteer.phone}
      </div>
      <div class="status">
        <button phx-click="toggle-status" phx-value-id="${volunteer.id}" phx-disable-with="Saving...">
          ${volunteer.checked_out ? "Check In" : "Check Out"}
        </button>
      </div>
    </div>
    `
  }

  handleEvent(event: VolunteerEvents, params: StringPropertyValues<Pick<Volunteer, "name" | "phone" | "id">>, socket: LiveViewSocket<VolunteerContext>): VolunteerContext {
    if (event === "toggle-status") {
      // lookup volunteer by id
      const volunteer = getVolunteer(params.id);
      // toggle checked_out status (ignoring changeset for now)
      updateVolunteer(volunteer!, { checked_out: !volunteer!.checked_out });
      return {
        volunteers: listVolunteers(),
        changeset: changeset({}, {})
      }
    } else if (event === "validate") {
      const validateChangeset = changeset({}, params);
      // set an action or else the changeset will be ignored
      // and form errors will not be shown
      validateChangeset.action = "validate";
      return {
        volunteers: [],
        changeset: validateChangeset
      }
    } else {
      const volunteer: Partial<Volunteer> = {
        name: params.name,
        phone: params.phone,
      }
      // attempt to create the volunteer from the form data
      const createChangeset = createVolunteer(volunteer);

      // valid form data
      if (createChangeset.valid) {
        const newVolunteer = createChangeset.data as Volunteer;
        // only add new volunteer since we're using phx-update="prepend"
        // which means the new volunteer will be added to the top of the list
        const newVolunteers = [newVolunteer];
        const emptyChangeset = changeset({}, {}); // reset form
        return {
          volunteers: newVolunteers,
          changeset: emptyChangeset
        }
      }
      // form data was invalid
      else {
        return {
          volunteers: [], // no volunteers to prepend
          changeset: createChangeset // errors for form
        }
      }
    }
  }

  handleInfo(event: VolunteerData, socket: LiveViewSocket<VolunteerContext>): VolunteerContext | Promise<VolunteerContext> {
    console.log("received info", event);
    return {
      volunteers: listVolunteers(),
      changeset: changeset({}, {})
    }
  }

}
