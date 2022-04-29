import {newSampleNode} from "https://kairuz.github.io/acyoustic/sample-utils.js";
import BaseView from "./base-view.js";

const createPlaySampleDiv = (sampleDiv, maxWidth, sample, audioContext) => {
  const playSampleDiv = document.createElement('div');
  playSampleDiv.setAttribute('class', 'samplePlay');
  playSampleDiv.appendChild(document.createTextNode('\u{25B6}'));

  const vLineDiv = document.createElement('div');
  sampleDiv.appendChild(vLineDiv);

  let startTime;
  let playingSample = null;

  playSampleDiv.addEventListener('click', () => {
    new Promise((resolve) => {
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => resolve());
      }
      else {
        resolve()
      }
    }).then(() => {
      const moveRight = () => {
        vLineDiv.style.left = ((audioContext.currentTime - startTime) * 100) + 'px';
      };

      const moveRightLoop = () => {
        moveRight();
        if (playingSample !== null && parseInt(vLineDiv.style.left) < maxWidth) {
          setTimeout(moveRightLoop, 10);
        }
        else {
          vLineDiv.removeAttribute('class');
          vLineDiv.style.left = '0';
        }
      };

      if (playingSample !== null) {
        playingSample.stop();
      }
      else {
        const playingSampleId = activeSampleIdGen++;
        playingSample = newSampleNode(sample.buffer, audioContext);
        activeSamples.set(playingSampleId, playingSample);

        startTime = audioContext.currentTime;
        vLineDiv.setAttribute('class', 'vLine');
        setTimeout(() => moveRightLoop(0), 10);
        playSampleDiv.style.background = 'maroon';
        playingSample.start();
        playingSample.addEventListener('ended', () => {
          playingSample = null;
          playSampleDiv.style.background = 'lightblue';
          activeSamples.delete(playingSampleId);
        });
      }
    });
  });

  return playSampleDiv;
};

const createSampleCanvas = (sampleName, audioContext, audioBuffer) => {

  const canvas = document.createElement('canvas');
  const canvasCtx = canvas.getContext('2d');

  canvas.setAttribute('class', 'sampleCanvas');

  const durationMillis = audioBuffer.duration * 1000;
  const durationMarkerInterval = 10;

  canvas.setAttribute('width', Math.ceil(durationMillis / durationMarkerInterval) + 'px');
  canvas.setAttribute('height', '100');

  const channelData = audioBuffer.getChannelData(0);

  canvasCtx.lineWidth = 0.3;
  canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

  canvasCtx.beginPath();

  for (let i = 0; i < durationMillis; i += durationMarkerInterval) {
    if (i > 0 && i % (1000 / durationMarkerInterval) === 0) {
      const second = i / (1000 / durationMarkerInterval);
      canvasCtx.fillText('' + second, i - 2.5, 8);
      canvasCtx.fillText('' + second, i - 2.5, canvas.height - 1);
    }

    if (i === 0) {
      canvasCtx.moveTo(i, 0);
      canvasCtx.lineTo(i, 20);
      canvasCtx.moveTo(i, canvas.height - 20);
      canvasCtx.lineTo(i, canvas.height);
    }
    else if (i % (1000 / durationMarkerInterval) === 0) {
      canvasCtx.moveTo(i, 10);
      canvasCtx.lineTo(i, 20);
      canvasCtx.moveTo(i, canvas.height - 20);
      canvasCtx.lineTo(i, canvas.height - 10);
    }
    else {
      canvasCtx.moveTo(i, 0);
      canvasCtx.lineTo(i, 15);
      canvasCtx.moveTo(i, canvas.height - 15);
      canvasCtx.lineTo(i, canvas.height);
    }
  }
  canvasCtx.stroke();
  canvasCtx.closePath();

  canvasCtx.beginPath();
  canvasCtx.lineWidth = 0.3;
  canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

  const sliceWidth = canvas.width / channelData.length;
  let x = sliceWidth;

  canvasCtx.moveTo(0, (canvas.height / 2) + -(channelData[0] * canvas.height / 2));

  for (let i = 1; i < channelData.length; i++) {
    const v = -(channelData[i] * canvas.height / 2);
    const y = (canvas.height / 2) + v;
    canvasCtx.lineTo(x, y);
    x += sliceWidth;
  }

  canvasCtx.moveTo(0, canvas.height / 2);
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
  canvasCtx.closePath();

  return canvas;
};

const createSampleDiv = (sampleName, maxWidth, sample, audioContext) => {
  const sampleDiv = document.createElement('div');
  sampleDiv.setAttribute('class', 'sampleDiv');

  sampleDiv.appendChild(document.createElement('br'));
  const nameLabelDiv = document.createElement('div');
  nameLabelDiv.setAttribute('style', 'position: absolute; top: 0; left: 0');
  nameLabelDiv.innerText = sampleName;
  sampleDiv.appendChild(nameLabelDiv);

  if (sample.buffer) {
    const durationLabelDiv = document.createElement('div');
    durationLabelDiv.setAttribute('style', 'position: absolute; top: 0; right: 0');

    durationLabelDiv.innerText = sample.buffer.duration.toFixed(3) + 's';
    sampleDiv.appendChild(durationLabelDiv);

    const playSampleDiv = createPlaySampleDiv(sampleDiv, maxWidth, sample, audioContext);
    sampleDiv.appendChild(playSampleDiv);
    return sampleDiv;
  }
  else {
    return sampleDiv;
  }
};

let activeSampleIdGen = 0;
let activeSamples = new Map();

const handleSample = (sampleName, sample, appDiv, audioContext) => {
  const sampleCanvas = sample.canvas ? sample.canvas : createSampleCanvas(sampleName, audioContext, sample.buffer);
  const sampleDiv = createSampleDiv(sampleName, sampleCanvas.width, sample, audioContext);
  sampleDiv.appendChild(sampleCanvas);
  appDiv.appendChild(sampleDiv);
  // const sampleStartTime = new Date();
  // console.log(sampleName + ' starting dataUrl @ ' + sampleStartTime);
  if (sampleCanvas && (!sample.canvas || !sample.canvasDataUrl)) {
      sample.canvas = sampleCanvas;
      sample.canvasDataUrl = sampleCanvas.toDataURL();
  }
  // const sampleEndTime = new Date();
  // console.log(sampleName + ' ending dataUrl @ ' + sampleEndTime + ' - took ' + (sampleEndTime.getTime() - sampleStartTime.getTime()));
};

const SamplesView = (model) => {
  return {
    render: () => {
      return BaseView(model)
        .render()
        .then((baseView) => {
          return new Promise((resolve) => {
            baseView.updateTitle(`${model.getActiveProjectName()} samples`);
            // const startTime = new Date();
            Object.entries(model.getSamples()).forEach((sampleEntry) => {
              const sampleName = sampleEntry[0];
              const sample = sampleEntry[1];
              handleSample(sampleName, sample, baseView.getAppDiv(), model.getAudioContext());
            });
            // const endTime = new Date();
            // console.log('!!!!samples view done - took ' + (endTime.getTime() - startTime.getTime()));
            resolve('samples view done');
          }
        )
      });
      // .catch((err) => console.log('ERROR ', err));
    },
    dispose: () => {
      activeSamples.forEach((activeSample) => activeSample.stop());
    }
  }
};
SamplesView.createSampleCanvas = createSampleCanvas;

export default SamplesView;
