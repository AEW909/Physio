# PhysioFlow AI Assistant

A lightweight browser-based prototype for a physiotherapy practice that supports:

- AI-powered patient pre-assessment screening
- AI-assisted SOAP note creation from rough text or voice
- AI medical note writing for assessments, reviews, discharge notes, and referral letters

## What It Includes

- A patient intake workflow that captures symptoms, history, goals, and risk context
- AI-generated triage summary with red flags, follow-up questions, and a subjective-note draft
- Live browser dictation where supported
- Audio recording with OpenAI transcription support
- Editable SOAP notes and patient-friendly summaries
- Draft clinical documentation with a built-in review checklist

## Files

- `index.html` - main single-page application
- `styles.css` - UI styling
- `app.js` - browser logic, voice features, and OpenAI API calls

## How To Use

1. Open `index.html` in a modern browser.
2. Add your OpenAI API key in the session setup card.
3. Complete the patient pre-assessment fields.
4. Generate the AI screening summary.
5. Dictate notes live, or record and transcribe audio.
6. Generate an editable SOAP note or a longer clinical document.

## Important Prototype Notes

- The API key is stored in `sessionStorage`, so it is not persisted after the browser session ends.
- This prototype calls the OpenAI API directly from the browser for simplicity.
- For production use, move the API calls to a secure backend you control.
- All AI output must be reviewed by a qualified clinician before use in records or clinical decisions.

## Voice Features

- Live dictation uses the browser Speech Recognition API, which is supported unevenly across browsers.
- Audio recording uses `MediaRecorder`.
- OpenAI transcription uses the `/v1/audio/transcriptions` endpoint with `gpt-4o-mini-transcribe`.

## OpenAI References

These official docs informed the API choices used in this prototype:

- [Responses API](https://platform.openai.com/docs/api-reference/responses/create?api-mode=responses)
- [Text generation guide](https://platform.openai.com/docs/guides/text)
- [Speech to text guide](https://platform.openai.com/docs/guides/speech-to-text)

## Suggested Next Step

If you want this to become clinic-ready, the next phase should be:

1. Add a secure backend to keep the API key off the client.
2. Save patient records into your practice management workflow.
3. Add structured templates for initial assessment, follow-up, discharge, and exercise prescription.
4. Add authentication, audit logs, and consent/privacy controls.
