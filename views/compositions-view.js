import Scheduler from "https://kairuz.github.io/acyoustic/scheduler.js";
import {newSampleNode} from "https://kairuz.github.io/acyoustic/sample-utils.js";
import BaseView from "./base-view.js";
import ProgressionsView from "./progressions-view.js";


// thanks https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/
// Convert an AudioBuffer to a Blob using WAVE representation
const bufferToWave = (inBuffer) => {
  const setUint16 = (data) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  const numOfChan = inBuffer.numberOfChannels;
  const length = inBuffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(inBuffer.sampleRate);
  setUint32(inBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for (i = 0; i < inBuffer.numberOfChannels; i++) {
    channels.push(inBuffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++;                                    // next source sample
  }

  // create Blob
  return new Blob([outBuffer], {type: "audio/wav"});
};

let activeScheduler = null;
let activeProgressionWidgets = null;

const handleComposition = (appDiv, compositionName, composition, progressions, samples, projectName, audioContext) => {
  const compositionDiv = document.createElement('div');
  compositionDiv.setAttribute('class', 'compositionsCompositionDiv');
  appDiv.appendChild(compositionDiv);

  const progressionWidgets = composition.map((progressionNameAndDuration) => {
    const progressionName = progressionNameAndDuration[0];
    const progressionDuration = progressionNameAndDuration[1];
    const progression = progressions[progressionName];
    const maxWidth = progressionDuration * 100;

    return ProgressionsView.ProgressionWidget(maxWidth, progressionName, progression, samples, audioContext);
  });

  const compositionLabelDiv = document.createElement('div');
  compositionLabelDiv.appendChild(document.createTextNode(compositionName));
  compositionDiv.appendChild(compositionLabelDiv);

  const compositionPlayDiv = document.createElement('div');
  compositionPlayDiv.setAttribute('class', 'progressionsProgressionPlayDiv');
  compositionPlayDiv.appendChild(document.createTextNode('\u{25B6}'));
  compositionDiv.appendChild(compositionPlayDiv);

  const downloadDiv = document.createElement('div');
  downloadDiv.setAttribute('class', 'compositionsDownloadLinkDiv');
  const downloadDivTextNode = document.createTextNode('\u{21EA}');
  downloadDiv.appendChild(downloadDivTextNode);
  compositionDiv.appendChild(downloadDiv);

  let isRendering = false;
  let isRendered = false;
  let isDownloadReady = false;

  downloadDiv.addEventListener('click', (e) => {
    if (isRendered === false && isRendering === false) {
      isRendering = true;
      downloadDiv.removeChild(downloadDivTextNode);
      downloadDiv.classList.remove('compositionsDownloadLinkDiv');
      downloadDiv.classList.add('compositionsDownloadLoaderDiv');

      const compositionLength = composition.reduce((acc, cur) => {
        acc +=  cur[1];
        return acc;
      }, 0);

      const offlineAudioContext = new OfflineAudioContext({
        numberOfChannels: 1,
        length: 44100 * compositionLength,
        sampleRate: 44100,
      });

      let offsetTime = 0;
      composition.forEach((progressionNameAndDuration, i) => {
        const progressionName = progressionNameAndDuration[0];
        const progressionDuration = progressionNameAndDuration[1];
        const progression = progressions[progressionName];
        Object.entries(progression).forEach((progressionEntry) => {
          const sampleName = progressionEntry[0];
          const sample = samples[sampleName];
          const sampleTimes = progressionEntry[1];

          sampleTimes.forEach((sampleTime) => {
            const playingSample = newSampleNode(sample.buffer, offlineAudioContext, sample.gain);
            playingSample.start(offsetTime + sampleTime);
          });
        });
        offsetTime += progressionDuration;
      });

      offlineAudioContext.startRendering()
        .then((renderedBuffer) => {
          isRendering = false;
          isRendered = true;
          console.log('Rendering completed successfully');
          const wave = bufferToWave(renderedBuffer);
          const file = URL.createObjectURL(wave);
          const downloadLink = document.createElement('a');
          downloadLink.appendChild(document.createTextNode('\u{21EA}'));
          downloadDiv.appendChild(downloadLink);

          downloadLink.href = file;
          downloadLink.download = `acyoustic-${projectName}-${compositionName}-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z.wav`;
          downloadDiv.classList.remove('compositionsDownloadLoaderDiv');
          downloadDiv.classList.add('compositionsDownloadLinkDiv');
          isDownloadReady = true;
          downloadLink.click();
        }).catch((err) => {
          console.log('Rendering failed: ' + err);
          // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
        });
    }
  });

  const followDiv = document.createElement('div');
  followDiv.setAttribute('class', 'compositionsFollowDiv');
  compositionDiv.appendChild(followDiv);

  let progressionDurationAcc = 0;
  const followerPoints = [];
  composition.forEach((progressionNameAndDuration, i) => {
    const progressionName = progressionNameAndDuration[0];
    const progressionDuration = progressionNameAndDuration[1];
    const progressionFollowedDiv = document.createElement('div');
    progressionFollowedDiv.setAttribute('class', 'compositionsFollowedDiv');
    progressionFollowedDiv.style.left = Math.trunc(i * 100) + 'px';
    followerPoints.push(i * 100);
    progressionFollowedDiv.appendChild(document.createTextNode(`[${progressionName}\n${Math.trunc((progressionDurationAcc * 1000) / 1000)}s]`));
    progressionDurationAcc += progressionDuration;
    followDiv.appendChild(progressionFollowedDiv)
  });

  const followerDiv = document.createElement('div');
  followerDiv.setAttribute('class', 'compositionsFollowerDiv');
  followDiv.appendChild(followerDiv);

  const progressionsDiv = document.createElement('div');
  progressionsDiv.setAttribute('class', 'compositionsProgressionDiv');
  compositionDiv.appendChild(progressionsDiv);

  progressionWidgets.forEach((progressionWidget, i) => {
    if (i > 0) {
      progressionWidget.getDiv().style.display = 'none';
    }
    progressionsDiv.appendChild(progressionWidget.getDiv())
  });

  const cancelableTimeoutIds = new Set();

  const progressionScheduledCallback = (progressionIndex, progression, scheduleTime, progressionDuration, timeToProgressionStart, timeToProgressionEnd) => {
    const progressionWidget = progressionWidgets[progressionIndex];
    const pulseOutOnTimeoutId = setTimeout(() => {
      cancelableTimeoutIds.delete(pulseOutOnTimeoutId);
      progressionWidget.getDiv().classList.add('compositionsProgressionDivPulseOut');
      const pulseOutOffTimeoutId = setTimeout(() => {
        cancelableTimeoutIds.delete(pulseOutOffTimeoutId);
        progressionWidget.getDiv().classList.remove('compositionsProgressionDivPulseOut');
      }, (timeToProgressionEnd) * 1000);
      cancelableTimeoutIds.add(pulseOutOffTimeoutId);
    }, (timeToProgressionEnd - 0.5) * 1000);
    cancelableTimeoutIds.add(pulseOutOnTimeoutId);
  };

  const progressionStartCallback = (progressionIndex, progression, scheduleTime, progressionDuration) => {
    const progressionWidget = progressionWidgets[progressionIndex];
    progressionWidget.getDiv().classList.add('compositionsProgressionDivPulseIn');
    const pulseInOffTimeoutId = setTimeout(() => {
      cancelableTimeoutIds.delete(pulseInOffTimeoutId);
      progressionWidget.getDiv().classList.remove('compositionsProgressionDivPulseIn');
    }, 1000);
    cancelableTimeoutIds.add(pulseInOffTimeoutId);

    progressionWidget.start(scheduleTime);
    progressionWidget.getDiv().style.display = 'block';

    followerDiv.style.left = followerPoints[progressionIndex] + 'px';
  };

  const progressionEndCallback = (progressionIndex, progression, scheduleTime, progressionDuration) => {
    const progressionWidget = progressionWidgets[progressionIndex];
    progressionWidget.getDiv().style.display = 'none';
    progressionWidget.stop();
  };

  const schedulerStopCallback = () => {
    compositionPlayDiv.removeAttribute('style');
    followerDiv.style.display = 'none';
    followerDiv.style.left = '0px';
    progressionWidgets[0].getDiv().style.display = 'block';
    cancelableTimeoutIds.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    cancelableTimeoutIds.clear();
  };

  const scheduler = Scheduler(composition, progressions, samples, audioContext,
                              progressionScheduledCallback, progressionStartCallback, progressionEndCallback, schedulerStopCallback);
  activeScheduler = scheduler;
  activeProgressionWidgets = progressionWidgets;

  compositionPlayDiv.addEventListener('click', () => {
    console.log('scheduler.isRunning() ' + scheduler.isRunning() + ' activeScheduler.isRunning() ' + activeScheduler.isRunning());
    if (scheduler.isRunning()) {
      progressionWidgets.forEach((progressionWidget) => {
        progressionWidget.stop();
        progressionWidget.getDiv().style.display = 'none'
      });
      scheduler.stop();
    }
    else {
      if (scheduler !== activeScheduler && activeScheduler.isRunning()) {
        console.log('diff scheduler so stop the active scheduler');
        activeProgressionWidgets.forEach((progressionWidget) => {
          progressionWidget.stop();
          progressionWidget.getDiv().style.display = 'none'
        });
        activeScheduler.stop();
      }

      compositionPlayDiv.style.background = 'maroon';
      scheduler.start();
      followerDiv.style.display = 'block';
      activeScheduler = scheduler;
      activeProgressionWidgets = progressionWidgets;
    }
  });
};

const CompositionsView = (model) => {
  return {
    render: () => {
      return BaseView(model)
        .render()
        .then((baseView) => {
          return new Promise((resolve, reject) => {
            try {
              baseView.updateTitle(`${model.getActiveProjectName()} compositions`);

              Object.entries(model.getCompositions()).forEach((compositionsEntry) => {
                const compositionName = compositionsEntry[0];
                const composition = compositionsEntry[1];

                handleComposition(
                  baseView.getAppDiv(), compositionName, composition,
                  model.getProgressions(), model.getSamples(), model.getActiveProjectName(), model.getAudioContext()
                );
              });

              resolve('compositions view done');
            }
            catch (err) {
              console.log('err ' + JSON.stringify(err), err);
              reject(err);
            }
          }
        );
      });
    },
    dispose: () => {
      if (activeScheduler.isRunning()) {
        activeProgressionWidgets.forEach((progressionWidget) => {
          progressionWidget.stop();
          progressionWidget.getDiv().style.display = 'none'
        });
        activeScheduler.stop();
      }
    }
  };
};


export default CompositionsView;
