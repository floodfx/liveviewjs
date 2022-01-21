import { LiveViewRouter } from "../liveview/types";
import { LicenseLiveViewComponent } from "./license_liveview";
import { LightLiveViewComponent } from "./light_liveview";

export const router: LiveViewRouter = {
  "/license": new LicenseLiveViewComponent(),
  "/light": new LightLiveViewComponent()
}