const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');

// Checking whether the webcam access is supported or not.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam is supported, add event listener to the button for when the user
// wants to activate it, and call the enableCam function.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start the classification.
async function enableCam() {
  // Only continue if the COCO-SSD model has finished loading.
  if (!model) {
    return;
  }

  // Hide the button once clicked.
  enableWebcamButton.classList.add('removed');

  // getUserMedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  try {
    // Activate the webcam stream.
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

// Store the resulting model in the global scope of our app.
let model;

// Before we can use the COCO-SSD model, we need to wait for it to finish loading.
// Machine learning models can be large and take a moment to load everything needed.
// Note: cocoSsd is an external object loaded from our index.html script tag import, so ignore any warnings.
cocoSsd.load().then(function(loadedModel) {
  model = loadedModel;
  // Show the demo section now that the model is ready to use.
  demosSection.classList.remove('invisible');
});

const children = [];

function predictWebcam() {
  // Start classifying a frame from the webcam stream.
  model.detect(video).then(function(predictions) {
    // Remove any highlighting from the previous frame.
    children.forEach(child => {
      liveView.removeChild(child);
    });
    children.length = 0;

    // Loop through predictions and draw them on the live view if they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are more than 66% confident, draw it.
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class + ' - with ' + Math.round(parseFloat(predictions[n].score) * 100) + '% confidence.';
        p.style.cssText = `margin-left: ${predictions[n].bbox[0]}px; margin-top: ${predictions[n].bbox[1] - 10}px; width: ${predictions[n].bbox[2] - 10}px; top: 0; left: 0;`;

        const highlighter = document.createElement('div');
        highlighter.classList.add('highlighter');
        highlighter.style.cssText = `left: ${predictions[n].bbox[0]}px; top: ${predictions[n].bbox[1]}px; width: ${predictions[n].bbox[2]}px; height: ${predictions[n].bbox[3]}px;`;

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}
