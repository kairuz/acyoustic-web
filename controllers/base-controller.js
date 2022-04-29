import Config from "../config.js";
import Router from "../router.js";


const initProjectSamples = (sourceSamples) => Object.entries(sourceSamples).reduce((acc, cur) => {
  const currSampleName = cur[0];
  const currSample = cur[1];
  acc[currSampleName] = {
    path: currSample.path
  };
  if ('gain' in currSample) {
    acc[currSampleName].gain = currSample.gain;
  }
  return acc;
}, {});

const initProject = (projectName) => {
  if (projectName in Config.PROJECTS_DATA) {
    const sourceProject = Config.PROJECTS_DATA[projectName];
    return {
      name    : projectName,
      samples : initProjectSamples(sourceProject.samples)
    };
  }
  else {
    console.log(`unknown project ${projectName}`);
    throw `unknown project ${projectName}`;
  }
};

const loadStateAndParams = (state, params) => {
  console.log('loadStateAndParams');
  if (!('audioContext' in state)) {
    Object.defineProperty(state, 'audioContext', (() => {
      let audioContext = null;
      return {
        get: () => {
          if (audioContext === null) {
            audioContext = new AudioContext();
          }
          return audioContext;
        }
      }
    })());
  }

  if (!('project' in state &&
        'name' in state.project &&
        state.project.name in Config.PROJECTS_DATA)) {
    state.project = initProject(Config.DEFAULT_PROJECT_NAME);
  }


  return Promise.resolve();
};

const buildModel = (state, params) => {
  return {
    getPage: () => params.page,
    getPageFrags: () => params.pageFrags,
    getLogicalPage: () => params.logicalPage,
    getLogicalPageFrags: () => params.logicalPageFrags,
    getActiveProjectName: () => state.project.name
  }
};

const BaseController = (state, params) => {
  return {
    handle: () => {
      return new Promise((resolve, reject) => {
        loadStateAndParams(state, params)
          .then(() => {
            if (params.projectName &&
                params.projectName !== state.project.name) {
              if (!(params.projectName in Config.PROJECTS_DATA)) {
                console.log('base controller rejecting - unknown project');
                const model = buildModel(state, params);
                reject({
                  info: 'loadStateAndParams unknown project ' + params.projectName,
                  getModel: () => model,
                  getView: () => Router.VIEWS.NOT_FOUND
                });
                return;
              }
              else {
                state.project = initProject(params.projectName);
              }
            }

            const model = buildModel(state, params);
            resolve({
              getModel: () => model,
              getView: () => Router.VIEWS.NOT_FOUND
            });
          })
          .catch((error) => {
            console.log('BaseController rejected ' + JSON.stringify(error), error);
            const model = buildModel(state, params);
            reject({
              info: 'BaseController loadStateAndParams error ' + error,
              getModel: () => model,
              getView: () => Router.VIEWS.ERROR
            });
          });
      });
    }
  }
};

export default BaseController;
