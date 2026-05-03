const state = {
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  recognition: null,
  dictating: false,
};

const els = {
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  practiceName: document.getElementById("practiceName"),
  saveSettings: document.getElementById("saveSettings"),
  generateScreening: document.getElementById("generateScreening"),
  generateSoap: document.getElementById("generateSoap"),
  generateMedicalNote: document.getElementById("generateMedicalNote"),
  transcribeRecording: document.getElementById("transcribeRecording"),
  toggleDictation: document.getElementById("toggleDictation"),
  recordAudio: document.getElementById("recordAudio"),
  stopAudio: document.getElementById("stopAudio"),
  audioPlayback: document.getElementById("audioPlayback"),
  dictationStatus: document.getElementById("dictationStatus"),
  triageBadge: document.getElementById("triageBadge"),
};

const inputIds = [
  "patientName",
  "patientDob",
  "patientActivity",
  "problemArea",
  "mainConcern",
  "symptoms",
  "history",
  "goals",
  "rawTranscript",
  "medicalPrompt",
  "soapNote",
  "patientSummary",
  "screeningSummary",
  "screeningFlags",
  "medicalNote",
  "medicalChecklist",
];

const screeningSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    triageLevel: { type: "string" },
    redFlags: { type: "array", items: { type: "string" } },
    clinicalSummary: { type: "string" },
    likelyDrivers: { type: "array", items: { type: "string" } },
    questionsToClarify: { type: "array", items: { type: "string" } },
    soapSubjective: { type: "string" },
    adminChecklist: { type: "array", items: { type: "string" } },
  },
  required: ["triageLevel", "redFlags", "clinicalSummary", "likelyDrivers", "questionsToClarify", "soapSubjective", "adminChecklist"],
};

const soapSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    soap: {
      type: "object",
      additionalProperties: false,
      properties: {
        subjective: { type: "string" },
        objective: { type: "string" },
        assessment: { type: "string" },
        plan: { type: "string" },
      },
      required: ["subjective", "objective", "assessment", "plan"],
    },
    patientSummary: { type: "string" },
    risks: { type: "array", items: { type: "string" } },
  },
  required: ["title", "soap", "patientSummary", "risks"],
};

const medicalSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    document: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    followUpQuestions: { type: "array", items: { type: "string" } },
    complianceChecks: { type: "array", items: { type: "string" } },
  },
  required: ["document", "assumptions", "followUpQuestions", "complianceChecks"],
};

initialise();

function initialise() {
  loadSettings();
  bindEvents();
  setupSpeechRecognition();
}

function bindEvents() {
  els.saveSettings.addEventListener("click", saveSettings);
  els.generateScreening.addEventListener("click", handleGenerateScreening);
  els.generateSoap.addEventListener("click", handleGenerateSoap);
  els.generateMedicalNote.addEventListener("click", handleGenerateMedicalNote);
  els.transcribeRecording.addEventListener("click", handleTranscription);
  els.toggleDictation.addEventListener("click", toggleDictation);
  els.recordAudio.addEventListener("click", startRecording);
  els.stopAudio.addEventListener("click", stopRecording);

  inputIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener("input", () => saveDraft(id, element.value));
    const saved = localStorage.getItem(`physioflow:${id}`);
    if (saved) element.value = saved;
  });
}

function loadSettings() {
  els.practiceName.value = localStorage.getItem("physioflow:practiceName") || "";
  els.model.value = localStorage.getItem("physioflow:model") || "gpt-5";
  els.apiKey.value = sessionStorage.getItem("physioflow:apiKey") || "";
}

function saveSettings() {
  sessionStorage.setItem("physioflow:apiKey", els.apiKey.value.trim());
  localStorage.setItem("physioflow:practiceName", els.practiceName.value.trim());
  localStorage.setItem("physioflow:model", els.model.value.trim() || "gpt-5");
  showStatus("Session settings saved in this browser.");
}

function saveDraft(id, value) {
  localStorage.setItem(`physioflow:${id}`, value);
}

function getApiKey() {
  return (els.apiKey.value || sessionStorage.getItem("physioflow:apiKey") || "").trim();
}

function getModel() {
  return (els.model.value || localStorage.getItem("physioflow:model") || "gpt-5").trim();
}

function getPracticeName() {
  return (els.practiceName.value || localStorage.getItem("physioflow:practiceName") || "Your Physiotherapy Practice").trim();
}

function requireApiKey() {
  const apiKey = getApiKey();
  if (!apiKey) {
    alert("Add your OpenAI API key in Session Setup before running AI actions.");
    return null;
  }
  return apiKey;
}

async function callResponsesAPI({ instructions, prompt, schemaName, schema }) {
  const apiKey = requireApiKey();
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      instructions,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return JSON.parse(data.output_text);
  }

  const content = data.output?.[0]?.content || [];
  const jsonChunk = content.find((item) => item.type === "output_text");

  if (!jsonChunk?.text) {
    throw new Error("No structured output was returned.");
  }

  return JSON.parse(jsonChunk.text);
}

async function callTranscriptionAPI(audioBlob) {
  const apiKey = requireApiKey();
  if (!apiKey) return null;

  const formData = new FormData();
  formData.append("file", audioBlob, "session-recording.webm");
  formData.append("model", "gpt-4o-mini-transcribe");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function handleGenerateScreening() {
  try {
    setBusy(els.generateScreening, "Generating...");
    const result = await callResponsesAPI({
      instructions: screeningInstructions(),
      prompt: JSON.stringify(collectScreeningData(), null, 2),
      schemaName: "physio_screening_summary",
      schema: screeningSchema,
    });
    if (!result) return;

    document.getElementById("screeningSummary").value = [
      `Clinical summary\n${result.clinicalSummary}`,
      `Likely drivers\n${formatList(result.likelyDrivers)}`,
      `SOAP subjective draft\n${result.soapSubjective}`,
    ].join("\n\n");

    document.getElementById("screeningFlags").value = [
      `Red flags / urgent considerations\n${formatList(result.redFlags)}`,
      `Clarifying questions\n${formatList(result.questionsToClarify)}`,
      `Admin checklist\n${formatList(result.adminChecklist)}`,
    ].join("\n\n");
    saveDraft("screeningSummary", document.getElementById("screeningSummary").value);
    saveDraft("screeningFlags", document.getElementById("screeningFlags").value);

    updateTriageBadge(result.triageLevel);
  } catch (error) {
    handleError(error);
  } finally {
    clearBusy(els.generateScreening);
  }
}

async function handleGenerateSoap() {
  try {
    setBusy(els.generateSoap, "Drafting...");
    const transcript = document.getElementById("rawTranscript").value.trim();
    if (!transcript) {
      alert("Add or dictate some raw notes before creating a SOAP note.");
      return;
    }

    const result = await callResponsesAPI({
      instructions: soapInstructions(),
      prompt: JSON.stringify({
        practice: getPracticeName(),
        screeningContext: collectScreeningData(),
        transcript,
      }, null, 2),
      schemaName: "physio_soap_note",
      schema: soapSchema,
    });
    if (!result) return;

    document.getElementById("soapNote").value = [
      `Title: ${result.title}`,
      "",
      "Subjective",
      result.soap.subjective,
      "",
      "Objective",
      result.soap.objective,
      "",
      "Assessment",
      result.soap.assessment,
      "",
      "Plan",
      result.soap.plan,
    ].join("\n");

    document.getElementById("patientSummary").value = [
      result.patientSummary,
      "",
      "Risks / review points",
      formatList(result.risks),
    ].join("\n");
    saveDraft("soapNote", document.getElementById("soapNote").value);
    saveDraft("patientSummary", document.getElementById("patientSummary").value);
  } catch (error) {
    handleError(error);
  } finally {
    clearBusy(els.generateSoap);
  }
}

async function handleGenerateMedicalNote() {
  try {
    setBusy(els.generateMedicalNote, "Drafting...");
    const result = await callResponsesAPI({
      instructions: medicalInstructions(),
      prompt: JSON.stringify({
        practice: getPracticeName(),
        documentType: document.getElementById("documentType").value,
        screeningContext: collectScreeningData(),
        transcript: document.getElementById("rawTranscript").value.trim(),
        soapDraft: document.getElementById("soapNote").value.trim(),
        clinicianPrompt: document.getElementById("medicalPrompt").value.trim(),
      }, null, 2),
      schemaName: "physio_medical_note",
      schema: medicalSchema,
    });
    if (!result) return;

    document.getElementById("medicalNote").value = result.document;
    document.getElementById("medicalChecklist").value = [
      `Assumptions to verify\n${formatList(result.assumptions)}`,
      `Follow-up questions\n${formatList(result.followUpQuestions)}`,
      `Safety / compliance reminders\n${formatList(result.complianceChecks)}`,
    ].join("\n\n");
    saveDraft("medicalNote", document.getElementById("medicalNote").value);
    saveDraft("medicalChecklist", document.getElementById("medicalChecklist").value);
  } catch (error) {
    handleError(error);
  } finally {
    clearBusy(els.generateMedicalNote);
  }
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Audio recording is not supported in this browser.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audioChunks = [];
    state.mediaRecorder = new MediaRecorder(stream);

    state.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) state.audioChunks.push(event.data);
    });

    state.mediaRecorder.addEventListener("stop", () => {
      state.audioBlob = new Blob(state.audioChunks, { type: "audio/webm" });
      els.audioPlayback.src = URL.createObjectURL(state.audioBlob);
      stream.getTracks().forEach((track) => track.stop());
      els.dictationStatus.textContent = "Recording saved locally. You can now transcribe it with OpenAI.";
    });

    state.mediaRecorder.start();
    els.dictationStatus.textContent = "Recording in progress...";
  } catch (error) {
    handleError(error);
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  }
}

async function handleTranscription() {
  if (!state.audioBlob) {
    alert("Record some audio first, then transcribe it.");
    return;
  }

  try {
    setBusy(els.transcribeRecording, "Transcribing...");
    const result = await callTranscriptionAPI(state.audioBlob);
    const transcriptBox = document.getElementById("rawTranscript");
    const transcriptText = result.text || result.transcript || "";
    transcriptBox.value = [transcriptBox.value.trim(), transcriptText].filter(Boolean).join("\n\n");
    saveDraft("rawTranscript", transcriptBox.value);
    els.dictationStatus.textContent = "Recording transcribed and added to the notes field.";
  } catch (error) {
    handleError(error);
  } finally {
    clearBusy(els.transcribeRecording);
  }
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.dictationStatus.textContent = "Live dictation is unavailable in this browser. Audio recording still works.";
    els.toggleDictation.disabled = true;
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.lang = "en-GB";
  state.recognition.continuous = true;
  state.recognition.interimResults = true;

  state.recognition.onstart = () => {
    state.dictating = true;
    els.toggleDictation.textContent = "Stop Live Dictation";
    els.dictationStatus.textContent = "Listening...";
  };

  state.recognition.onend = () => {
    state.dictating = false;
    els.toggleDictation.textContent = "Start Live Dictation";
    els.dictationStatus.textContent = "Idle. Use live dictation in supported browsers, or record audio below.";
  };

  state.recognition.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      if (event.results[i].isFinal) {
        finalText += `${event.results[i][0].transcript} `;
      }
    }
    if (finalText) {
      const transcriptBox = document.getElementById("rawTranscript");
      transcriptBox.value = `${transcriptBox.value}${transcriptBox.value ? "\n" : ""}${finalText.trim()}`;
      saveDraft("rawTranscript", transcriptBox.value);
    }
  };
}

function toggleDictation() {
  if (!state.recognition) return;
  if (state.dictating) state.recognition.stop();
  else state.recognition.start();
}

function collectScreeningData() {
  return {
    practice: getPracticeName(),
    patientName: document.getElementById("patientName").value.trim(),
    patientDob: document.getElementById("patientDob").value,
    patientActivity: document.getElementById("patientActivity").value.trim(),
    problemArea: document.getElementById("problemArea").value.trim(),
    mainConcern: document.getElementById("mainConcern").value.trim(),
    symptoms: document.getElementById("symptoms").value.trim(),
    history: document.getElementById("history").value.trim(),
    goals: document.getElementById("goals").value.trim(),
  };
}

function screeningInstructions() {
  return [
    `You are an assistant for ${getPracticeName()}, a physiotherapy clinic.`,
    "Create a pre-assessment screening summary based only on the supplied data.",
    "Be clinically cautious. Do not invent examination findings.",
    "Highlight possible red flags, missing information, and whether the patient appears appropriate for routine physio assessment, urgent GP review, or emergency escalation.",
    "Use concise clinical language suitable for a physiotherapist.",
  ].join(" ");
}

function soapInstructions() {
  return [
    `You are a documentation assistant for ${getPracticeName()}, a physiotherapy clinic.`,
    "Transform rough transcript notes into an editable SOAP note.",
    "Clearly distinguish reported symptoms from inferred clinical impressions.",
    "If data is missing, note assumptions or use placeholders rather than fabricating detail.",
    "Also create a short patient-friendly explanation and list any points needing clinician review.",
  ].join(" ");
}

function medicalInstructions() {
  return [
    `You are a senior medical documentation assistant for ${getPracticeName()}, a physiotherapy clinic.`,
    "Draft polished clinical documentation using the provided notes and instructions.",
    "The tone should be professional and appropriate for healthcare records or referral letters.",
    "Do not overstate certainty. If information is incomplete, flag it in the review checklist.",
  ].join(" ");
}

function formatList(items) {
  if (!items || !items.length) return "- None highlighted.";
  return items.map((item) => `- ${item}`).join("\n");
}

function updateTriageBadge(level) {
  els.triageBadge.textContent = level;
  els.triageBadge.className = "badge";
  const normalised = level.toLowerCase();
  if (normalised.includes("urgent") || normalised.includes("emergency")) els.triageBadge.classList.add("badge-high");
  else if (normalised.includes("priority") || normalised.includes("soon")) els.triageBadge.classList.add("badge-medium");
  else els.triageBadge.classList.add("badge-low");
}

function setBusy(button, text) {
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.textContent = text;
}

function clearBusy(button) {
  button.disabled = false;
  button.textContent = button.dataset.originalText || button.textContent;
}

function showStatus(message) {
  els.dictationStatus.textContent = message;
}

function handleError(error) {
  console.error(error);
  alert(error.message || "Something went wrong. Check the console for more detail.");
}
