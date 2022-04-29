import BaseView from "./base-view.js";

const createProjectDiv = (projectName, isActiveProject) => {
  const projectDiv = document.createElement('div');
  projectDiv.setAttribute('class', isActiveProject ? 'activeProjectDiv' : 'projectDiv');

  const projectA = document.createElement('a');
  projectA.setAttribute('href', BaseView.toAppPath(`/projects/${projectName}`));
  projectA.setAttribute('data-link', 'true');
  projectA.setAttribute('class', 'projectsProjectLink');
  projectA.appendChild(document.createTextNode(projectName));
  projectDiv.appendChild(projectA);
  projectDiv.appendChild(document.createElement('br'));
  projectDiv.appendChild(document.createElement('br'));

  const samplesA = document.createElement('a');
  samplesA.setAttribute('href', BaseView.toAppPath(`/projects/${projectName}/samples`));
  samplesA.setAttribute('data-link', 'true');
  samplesA.setAttribute('class', 'projectsProjectSublink');
  samplesA.appendChild(document.createTextNode('samples'));
  projectDiv.appendChild(samplesA);

  const progressionsA = document.createElement('a');
  progressionsA.setAttribute('href', BaseView.toAppPath(`/projects/${projectName}/progressions`));
  progressionsA.setAttribute('data-link', 'true');
  progressionsA.setAttribute('class', 'projectsProjectSublink');
  progressionsA.appendChild(document.createTextNode('progressions'));
  projectDiv.appendChild(progressionsA);

  const compositionsA = document.createElement('a');
  compositionsA.setAttribute('href', BaseView.toAppPath(`/projects/${projectName}/compositions`));
  compositionsA.setAttribute('data-link', 'true');
  compositionsA.setAttribute('class', 'projectsProjectSublink');
  compositionsA.appendChild(document.createTextNode('compositions'));
  projectDiv.appendChild(compositionsA);

  return projectDiv;
};

const ProjectsView = (model) => {
  return {
    render: () =>
      BaseView(model)
        .render()
        .then((baseView) => {
          baseView.updateTitle('Projects');
          model.getProjectNames().forEach((projectName) => {
            const isActiveProject = projectName === model.getActiveProjectName();
            const projectDiv = createProjectDiv(projectName, isActiveProject);
            baseView.getAppDiv().appendChild(projectDiv);
          });

          return Promise.resolve();
        })
  };
};

export default ProjectsView;
