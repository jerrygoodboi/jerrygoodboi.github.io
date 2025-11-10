const noteDisplay = document.querySelector(".note");
const recentNotesDisplay = document.querySelector("#recent-notes");
const scaleDisplay = document.querySelector("#scale");

let recentNotes = [];

const noteStrings = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

const majorScales = {
  "C Major": ["C", "D", "E", "F", "G", "A", "B"],
  "G Major": ["G", "A", "B", "C", "D", "E", "F#"],
  "D Major": ["D", "E", "F#", "G", "A", "B", "C#"],
  "A Major": ["A", "B", "C#", "D", "E", "F#", "G#"],
  "E Major": ["E", "F#", "G#", "A", "B", "C#", "D#"],
  "B Major": ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  "F# Major": ["F#", "G#", "A#", "B", "C#", "D#", "F"],
  "C# Major": ["C#", "D#", "F", "F#", "G#", "A#", "C"],
  "F Major": ["F", "G", "A", "A#", "C", "D", "E"],
  "Bb Major": ["A#", "C", "D", "D#", "F", "G", "A"],
  "Eb Major": ["D#", "F", "G", "G#", "A#", "C", "D"],
  "Ab Major": ["G#", "A#", "C", "C#", "D#", "F", "G"]
};

function getNote(freq) {
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const midi = Math.round(semitones) + 69;
  const note = noteStrings[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return note + octave;
}

function getScale(notes) {
    const noteCounts = notes.reduce((acc, item) => {
        const note = item.note.slice(0, -1);
        acc[note] = (acc[note] || 0) + 1;
        return acc;
    }, {});

    const uniqueNotes = Object.keys(noteCounts);
    if (uniqueNotes.length < 3) return [];

    let scales = [];
    let totalWeight = uniqueNotes.reduce((sum, note) => sum + noteCounts[note], 0);

    for (const scale in majorScales) {
        const scaleNotes = majorScales[scale];
        const score = uniqueNotes.reduce((acc, note) => {
            if (scaleNotes.includes(note)) {
                return acc + noteCounts[note];
            }
            return acc;
        }, 0);

        const confidence = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
        if (confidence > 20) {
            scales.push({ scale, confidence });
        }
    }

    return scales.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

async function start() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 8192;
  source.connect(analyser);
  const buffer = new Float32Array(analyser.fftSize);

  function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // silence

    let r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 == 0) return -1;
    return sampleRate / T0;
  }

  function update() {
    analyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtx.sampleRate);
    if (freq > 20 && freq < 1100) {
      const note = getNote(freq);
      noteDisplay.textContent = `Note: ${note}`;
      recentNotes.push({ note, timestamp: Date.now() });
    } else {
      noteDisplay.textContent = `Note: --`;
    }
    requestAnimationFrame(update);
  }

  function updateRecentNotesDisplay() {
    const now = Date.now();
    recentNotes = recentNotes.filter(item => now - item.timestamp < 30000);
    const uniqueRecentNotes = [...new Set(recentNotes.map(item => item.note))].slice(-10);
    recentNotesDisplay.innerHTML = uniqueRecentNotes.map(note => `<li>${note}</li>`).join('');
    
    const results = getScale(recentNotes);
    const confidenceDisplay = document.querySelector("#scale-confidence");
    const candidateScalesDisplay = document.querySelector("#candidate-scales");

    if (results.length > 0 && results[0].confidence > 70) {
        scaleDisplay.textContent = results[0].scale;
        confidenceDisplay.textContent = `Confidence: ${results[0].confidence.toFixed(0)}%`;
        candidateScalesDisplay.innerHTML = '';
    } else if (results.length > 0) {
        scaleDisplay.textContent = '--';
        confidenceDisplay.textContent = 'Low Confidence';
        candidateScalesDisplay.innerHTML = results.map(r => `<div>${r.scale} (${r.confidence.toFixed(0)}%)</div>`).join('');
    } else {
        scaleDisplay.textContent = '--';
        confidenceDisplay.textContent = 'Confidence: 0%';
        candidateScalesDisplay.innerHTML = '';
    }
  }

  setInterval(updateRecentNotesDisplay, 1000);
  update();
}





start();

document.getElementById('theme-switch').addEventListener('click', function() {
    document.body.classList.toggle('light-theme');
    var isLight = document.body.classList.contains('light-theme');
    document.querySelector('.sun-icon').style.display = isLight ? 'none' : 'inline';
    document.querySelector('.moon-icon').style.display = isLight ? 'inline' : 'none';
});