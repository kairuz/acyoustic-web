import BaseView from "./base-view.js";


const ErrorView = (model) => {
  return {
    render: () =>
      BaseView(model)
        .render()
        .then((baseView) => {
          baseView.updateTitle('Error');
          const heading = document.createElement('h1');
          heading.appendChild(document.createTextNode('Error'));
          baseView.getAppDiv().appendChild(heading);
          return Promise.resolve();
        })
  }
};


export default ErrorView;
