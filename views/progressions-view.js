import BaseView from "./base-view.js";
import {newSampleNode} from "https://kairuz.github.io/acyoustic/sample-utils.js";

const vLineDivAdjust = 200;

const ProgressionWidget = (maxWidth, progressionName, progression, samples, audioContext, stopCallback = () => {}) => {

  const progressionDiv = document.createElement('div');

  progressionDiv.setAttribute('class', 'progressionsProgressionDiv');

  const nameLabelDiv = document.createElement('div');
  nameLabelDiv.setAttribute('class', 'progressionsProgressionNameLabelDiv');
  nameLabelDiv.appendChild(document.createTextNode(progressionName));
  progressionDiv.appendChild(nameLabelDiv);

  const progressionSampleTimeDivs = [];

  Object.entries(progression).forEach((sampleEntry, i) => {
    const sampleName = sampleEntry[0];
    const sampleTimes = sampleEntry[1];
    const samplingDiv = document.createElement('div');
    samplingDiv.setAttribute('class', 'progressionsSampleDiv');
    samplingDiv.style.height = ((sampleTimes.length * 8) + 30) + 'px';

    const sampleNameLabelDiv = document.createElement('div');
    sampleNameLabelDiv.appendChild(document.createTextNode(sampleName));
    sampleNameLabelDiv.setAttribute('class', 'progressionsSampleNameLabelDiv');
    samplingDiv.appendChild(sampleNameLabelDiv);

    const sampleTimingDiv = document.createElement('div');
    sampleTimingDiv.setAttribute('class', 'progressionsSampleTimingDiv');
    samplingDiv.appendChild(sampleTimingDiv);

    const sampleTimeDivs = sampleTimes.map((sampleTime, j) => {
      const sampleTimeDiv = document.createElement('div');
      sampleTimeDiv.setAttribute('class', 'progressionsSampleTimeDiv');
      sampleTimeDiv.style.left = (sampleTime * 100) + 'px';
      sampleTimeDiv.style.width = (samples[sampleName].buffer.duration * 100) + 'px';
      sampleTimeDiv.style.top = (j * 8) + 'px';

      sampleTimeDiv.appendChild(document.createTextNode(sampleTime + 's'));

      return sampleTimeDiv;
    });

    sampleTimeDivs.forEach((sampleTimeDiv) => {
      sampleTimingDiv.appendChild(sampleTimeDiv);
      progressionSampleTimeDivs.push(sampleTimeDiv);
    });

    progressionDiv.appendChild(samplingDiv);
  });

  const vLineDiv = document.createElement('div');
  vLineDiv.style.left = vLineDivAdjust + 'px';
  progressionDiv.appendChild(vLineDiv);

  // let startTimeMillis;
  // let startTime;
  let playing = false;

  const isPlaying = () => playing;
  const stop = () => playing = false;
  const start = (startTime) => {
    if (playing === true) {
      return;
    }
    playing = true;
    new Promise((resolve) => {
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => resolve());
      }
      else {
        resolve()
      }
    }).then(() => {
      const playingSampleTimes = progressionSampleTimeDivs.map((sampleTimeDiv) => [sampleTimeDiv, false, false]);
      const moveRight = () => {
        playingSampleTimes.forEach((playingSampleTime) => {
          if (playingSampleTime[1] === false &&
              (parseInt(vLineDiv.style.left) - vLineDivAdjust) >= parseInt(playingSampleTime[0].style.left)) {
            playingSampleTime[1] = true;
            playingSampleTime[0].style.background = 'lightgreen';
          }
          else if (playingSampleTime[2] === false &&
                   (parseInt(vLineDiv.style.left) - vLineDivAdjust) >= (parseInt(playingSampleTime[0].style.left) + parseInt(playingSampleTime[0].style.width))) {
            playingSampleTime[2] = true;
            playingSampleTime[0].style.background = 'lightblue';
          }
        });

        // vLineDiv.style.left = (vLineDivAdjust + ((new Date().getTime() - startTimeMillis.getTime()) / 10)) + 'px';
        vLineDiv.style.left = (vLineDivAdjust + ((audioContext.currentTime - startTime) * 100)) + 'px';
      };

      const moveRightLoop = () => {
        moveRight();
        if (playing === true && parseInt(vLineDiv.style.left) < (maxWidth + vLineDivAdjust)) {
          setTimeout(moveRightLoop, 10);
        }
        else {
          playing = false;
          vLineDiv.removeAttribute('class');
          vLineDiv.style.left =  vLineDivAdjust + 'px';
          playingSampleTimes.forEach((sampleTimeDiv) => {
            sampleTimeDiv[0].style.background = 'lightblue';
          });
          stopCallback();
        }
      };

      // startTimeMillis = new Date();
      // startTime = audioContext.currentTime;
      vLineDiv.setAttribute('class', 'vLine');
      setTimeout(() => moveRightLoop(0), 10);
    });
  };

  return {
    // start: start,
    start: (startTime = audioContext.currentTime) => start(startTime),
    stop: stop,
    isPlaying: isPlaying,
    getDiv: () => progressionDiv
  };
};

let activeProgressionWidget = null;

const handleProgression = (maxWidth, progressionName, progression, samples, audioContext, appDiv) => {
  const progressionPlayDiv = document.createElement('div');
  progressionPlayDiv.setAttribute('class', 'progressionsProgressionPlayDiv');
  progressionPlayDiv.appendChild(document.createTextNode('\u{25B6}'));

  const playingSamples = [];

  const progressionWidget = ProgressionWidget(
    maxWidth, progressionName, progression, samples, audioContext,
    () => {
      playingSamples.forEach((playingSample) => playingSample.stop());
      playingSamples.length = 0;
      progressionPlayDiv.removeAttribute('style');
    }
  );

  activeProgressionWidget = progressionWidget;

  progressionPlayDiv.addEventListener('click', () => {
    if (progressionWidget.isPlaying()) {
      progressionWidget.stop();
    }
    else {

      if (progressionWidget !== activeProgressionWidget && activeProgressionWidget.isPlaying()) {
        activeProgressionWidget.stop();
      }

      const currentTime = audioContext.currentTime;
      progressionPlayDiv.style.background = 'maroon';
      Object.entries(progression).forEach((progressionEntry) => {
        const sampleName = progressionEntry[0];
        const sample = samples[sampleName];
        const sampleTimes = progressionEntry[1];

        sampleTimes.forEach((sampleTime) => {
          const playingSample = newSampleNode(sample.buffer, audioContext, sample.gain);
          playingSample.start(currentTime + sampleTime);
          playingSamples.push(playingSample);
        });
      });
      progressionWidget.start(currentTime);
      activeProgressionWidget = progressionWidget;
    }
  });

  progressionWidget.getDiv().appendChild(progressionPlayDiv);
  appDiv.appendChild(progressionWidget.getDiv());
};

const findMaxWidth = (progressions, samples) => {
  return 100 * Math.ceil(Object.values(progressions).reduce((accProgs, progression) => {
    const maxWidthProg = Object.entries(progression).reduce((accProg, sampleEntry) => {
      const sampleName = sampleEntry[0];
      const sampleTiming = sampleEntry[1];
      const sample = samples[sampleName];
      const maxWidthSamp = sampleTiming.reduce((accSamp, sampleTime) => {
        const sampleTimePlusDuration = sampleTime + sample.buffer.duration;
        if (accSamp < sampleTimePlusDuration) {
          accSamp = sampleTimePlusDuration;
        }
        return accSamp;
      }, 0);
      if (maxWidthSamp > accProg) {
        accProg = maxWidthSamp;
      }
      return accProg;
    }, 0);
    if (maxWidthProg > accProgs) {
      accProgs = maxWidthProg;
    }
    return accProgs;
  }, 0));
};

const ProgressionsView = (model) => {
  return {
    render: () => {
      return BaseView(model)
        .render()
        .then((baseView) => {
          return new Promise((resolve) => {
            baseView.updateTitle(`${model.getActiveProjectName()} progressions`);

            const maxWidth = findMaxWidth(model.getProgressions(), model.getSamples());

            Object.entries(model.getProgressions()).forEach((progressionEntry) => {
              const progressionName = progressionEntry[0];
              const progression = progressionEntry[1];

              handleProgression(maxWidth, progressionName, progression, model.getSamples(), model.getAudioContext(), baseView.getAppDiv());
            });
            resolve('progressions view done');
          });
        });
    },
    dispose: () => {
      activeProgressionWidget.stop();
    }
  };
};
ProgressionsView.ProgressionWidget = ProgressionWidget;

export default ProgressionsView;
