import Config from "../config.js";
import BaseController from "./base-controller.js";
import {loadSampleBuffers} from "https://kairuz.github.io/acyoustic/sample-utils.js";
import Router from "../router.js";

const loadSamples = (state, stateSamples, projectSamples) => {
  Object.entries(stateSamples).forEach((stateSampleEntry) => {
    const stateSampleName = stateSampleEntry[0];
    const stateSample = stateSampleEntry[1];

    if (!(stateSampleName in projectSamples &&
          stateSample.path === projectSamples[stateSampleName].path)) {
      stateSamples[stateSampleName] = projectSamples[stateSampleName];
    }
  });

  Object.entries(projectSamples).forEach((projectSampleEntry) => {
    const projectSampleName = projectSampleEntry[0];
    const projectSample = projectSampleEntry[1];

    if (!(projectSampleName in stateSamples && stateSamples[projectSampleName].path === projectSample.path)) {
      stateSamples[projectSampleName] = projectSample;
    }
  });

  return loadSampleBuffers(state.audioContext, stateSamples,
                           (samplePath) => samplePath.startsWith('http://') || samplePath.startsWith('https://') ? samplePath : `${Config.APP_PREFIX}/${samplePath}`);
};

const loadProject = (state) => {
  const stateSamples = state.project.samples;
  const projectSamples = Config.PROJECTS_DATA[state.project.name].samples;

  return loadSamples(state, stateSamples, projectSamples);
};

const DataController = (state, params) => {

  return {
    handle: () => {
      return BaseController(state, params)
        .handle()
        // .catch((error) => {
        //   console.log('DataController BaseController.handle() rejected promise ' + JSON.stringify(error), error);
        //   return Promise.reject(error);
        // })
        .then((modelAndView) => {
          return new Promise((resolve, reject) => {
            loadProject(state)
              .then(() => {
                console.log('DataController load project then modelAndView');
                const activeProjectName = state.project.name;
                const model = {
                  ...modelAndView.getModel(),
                  getAudioContext: () => state.audioContext,
                  getActiveProjectName: () => activeProjectName,
                  getSamples: () => state.project.samples
                };

                resolve({
                  info: 'dataController handle resolved; ' + modelAndView.info,
                  getModel: () => model
                })
              })
              .catch((error) => {
                console.log('DataController error ' + JSON.stringify(error), error);
                reject({
                  info: 'dataController handle rejected ' + error,
                  getView: () => Router.VIEWS.ERROR
                });
              })
          })
        })
        // .catch((error) => {
        //   console.log('DataController BaseController.then().handle() rejected promise ' + JSON.stringify(error), error);
        //   return Promise.reject('DataController BaseController.then().handle() rejected promise ' + JSON.stringify(error));
        // })
    }
  }
};

export default DataController;
