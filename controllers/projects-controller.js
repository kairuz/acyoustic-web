import BaseController from "./base-controller.js";
import Router from "../router.js";
import Config from "../config.js";


const ProjectsController = (state, params) => {
  return {
    handle: () => {
      return BaseController(state, params)
        .handle()
        .then((modelAndView) => {
          return new Promise((resolve) => {
            console.log('in ProjectsController return BaseController().handle() then ' + JSON.stringify(modelAndView));
            const projectNames = Object.keys(Config.PROJECTS_DATA);

            const model = {
              ...modelAndView.getModel(),
              getProjectNames: () => projectNames
            };
            resolve({
              info: 'projectsController handle resolved; ' + modelAndView.info,
              getModel: () => model,
              getView: () => Router.VIEWS.PROJECTS
            });
          });
        });
        // .catch((baseControllerRejected) => {
        //   console.log('in ProjectsController  return BaseController().handle().catch ' + JSON.stringify(baseControllerRejected));
        // })
    }
  }
};

export default ProjectsController;
