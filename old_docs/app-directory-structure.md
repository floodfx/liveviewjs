## LiveViewJS Application Directory Structure

LiveViewJS applications have a specific directory structure as follows:

 * `app/`
   * `assets/`
     * `images/`
     * `css/`
     * `js/`
   * `controllers/` - a directory that contains all of route handlers for traditional web routes
     * `<controller>.ts` - a file that contains a class that implements the `LiveViewController` interface
   * `liveviews/`
     * `<component_name>/`
       * `index.ts` - the `LiveViewComponent` implementation
   * `views/`
     * `layouts/`
       * `liveview.html.ejs` - the main layout template for your liveview components
       * `application.html.ejs` - the main layout template for your web controlers
       * `_<partial>.html.ejs` - partial templates for view layouts
     * `<controller_name>/`
       * `<action_name>.html.ejs` - view for the action (e.g. `index.html.ejs`)
       * `_<partial>.html.ejs` - partial view for the action
     * `helpers/`
       * `<controller_name>_helper.ts` - helper functions for the controller
   * `models/`
     * `<model_name>.ts` - data models for your application
   * `middleware/`
     * `<middleware_name>.ts` - middleware for your application
   * `services/`
     * `<service_name>.ts` - services for your application
 * `config/` - configuration files for your application based on target environment: `development`, `production`, `test`.
   * `environments/`
     * `development.ts`
     * `production.ts`
     * `test.ts`
   * `routes.ts` - a file that defines both the webroutes and liveroutes for your LiveViewJS application
   * `app.ts` - the main entry point for your application which configures and starts the `LiveViewServer`
