let keyboardSound, drumSound, guitarSound;
let fft, amplitude;
let currentSound = null;
let volumeSlider, reverbSlider, delaySlider;
let reverb, delay;
let reverbOn = true;
let delayOn = true;
let mic, micInputActive = false; 

function preload() {
  keyboardSound = loadSound('keyboard.mp3');
  drumSound = loadSound('drum.mp3');
  guitarSound = loadSound('guitar.mp3');
}

function setup() {
  var canvas = createCanvas(400, 400);
  canvas.parent('sketch-holder'); 
  fft = new p5.FFT(0.8, 1024);
  amplitude = new p5.Amplitude();

  let button1 = createButton("Play Keyboard");
  button1.parent("button-holder");
  button1.mousePressed(() => playSound(keyboardSound));

  let button2 = createButton("Play drums");
  button2.parent("button-holder");
  button2.mousePressed(() => playSound(drumSound));

  let button3 = createButton("Play Guitar");
  button3.parent("button-holder");
  button3.mousePressed(() => playGuitarWithEffects());

  let button4 = createButton("Stop Sound");
  button4.parent("button-holder");
  button4.mousePressed(stopAllSounds);

  let button5 = createButton("Enable Mic");
  button5.parent("button-holder");
  button5.mousePressed(toggleMicInput);

  // Create sliders 
  volumeSlider = createSlider(0, 1, 0.5, 0.01).parent("control-panel");
  reverbSlider = createSlider(0, 10, 3, 0.1).parent("control-panel");
  delaySlider = createSlider(0, 1, 0.3, 0.01).parent("control-panel");

  // reverb and delay
  reverb = new p5.Reverb();
  delay = new p5.Delay();

  // mic input
  mic = new p5.AudioIn();
}

function playSound(sound) {
  if (currentSound) currentSound.stop();
  sound.setVolume(volumeSlider.value());
  sound.play();
  currentSound = sound;
}

function playGuitarWithEffects() {
  if (currentSound) currentSound.stop();

  guitarSound.disconnect();

  if (reverbOn) {
    reverb.process(guitarSound, reverbSlider.value(), 2);
  } else {
    reverb.disconnect();
  }

  if (delayOn) {
    delay.process(guitarSound, delaySlider.value(), 0.7, 2300);
  } else {
    delay.disconnect();
  }

  guitarSound.setVolume(volumeSlider.value());
  guitarSound.play();
  currentSound = guitarSound;
}

function toggleMicInput() {
  if (!micInputActive) {
    mic.start(); // Start capturing audio from the mic
    micInputActive = true;
  } else {
    mic.stop(); // Stop capturing audio
    micInputActive = false;
  }
}

function stopAllSounds() {
  if (currentSound) {
    currentSound.stop();
    currentSound = null;
  }
  if (micInputActive) {
    mic.stop();
    micInputActive = false;
  }
}

function draw() {
  background(20);

  // Set input sources for FFT analysis
  if (micInputActive && currentSound) {
    fft.setInput(mic); // Analyze mic input
    fft.setInput(currentSound); // Analyze the current sound simultaneously
  } else if (micInputActive) {
    fft.setInput(mic); // Use only the mic input if active
  } else if (currentSound && currentSound.isPlaying()) {
    fft.setInput(currentSound); // Use the current sound if mic is not active
  }

  let spectrum = fft.analyze();
  let level = amplitude.getLevel();
  let circleSize = map(level, 0, 1, 200, 400);

  // Draw circular waveform with color gradients
  push();
  translate(width / 2, height / 2);
  noFill();

  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI);
    let amplitude = spectrum[i];
    let radius = map(amplitude, 0, 255, circleSize / 2, circleSize);

    let x = radius * cos(angle);
    let y = radius * sin(angle);

    // Color gradient based on amplitude
    let r = map(amplitude, 0, 0, 0, 255);
    let g = map(i, 0, spectrum.length, 0, 255);
    let b = 255 - r;

    stroke(r, g, b);
    vertex(x, y);
  }
  endShape(CLOSE);
  pop();

  // Adjust volume based on slider
  if (currentSound) {
    currentSound.setVolume(volumeSlider.value());
  }
}
