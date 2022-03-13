import { Request, Response } from "express";

/**
 * Placeholder / example "traditional" http controller for the root route as
 * opposed to a "LiveView" controller.
 */
class RootController {
  index(req: Request, res: Response) {
    res.render(`root/index`);
  }
}

const rootController = new RootController();

export { rootController };
