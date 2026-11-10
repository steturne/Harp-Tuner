# HARP TUNER 2000 on a phone

Mixtape 2's harp tuner as a web page for an Android phone (Chrome). The tuner itself is Mixtape 2's own: `tools\harp-phone.ps1`
copies `tuner.js`, `harp-sound.js`, `harp-tuner.js` and the two pictures in here, and `index.html` stands in for the parts of Mixtape
it leans on (the sound engine, the files, the microphone). Run that script whenever the tuner changes in Mixtape 2, then upload again.

What is different from the program:
- the phone's own microphone (no Windows helper); it listens only once POWER is flipped, and POWER goes off when the phone shows
  another app or the screen goes off
- the screen stays awake while POWER is on; ⛶ (top right) hides Chrome's bars
- a tapped string plays a made-up pluck (the concert harp's recordings, 74 MB, stay on the laptop)
- the saved harps, the settings and the tuning log are kept in the phone's browser (they do not reach the Mixtape folder)

## Putting it on the phone (GitHub Pages, all in Edge, nothing to install)
Phones only let a page use the microphone from a secure (https) address, which GitHub Pages gives.
1. In PowerShell in `C:\Mixtape`: `powershell -ExecutionPolicy Bypass -File tools\harp-phone.ps1` (brings the copies up to date).
2. github.com → **+** (top right) → **New repository** → name `harp-tuner`, **Public** → **Create repository**.
3. On the new repository's page: **uploading an existing file** → drag in everything inside `C:\Mixtape\harp-tuner-phone`
   (the files, not the folder) → **Commit changes**.
4. **Settings** → **Pages** → Source: **Deploy from a branch**, branch **main**, folder **/ (root)** → **Save**.
   A minute or two later it is at **https://steturne.github.io/harp-tuner/**.
5. On the phone, open that address in Chrome, turn the phone sideways, flip POWER, and allow the microphone when Chrome asks.

To update it later: step 1, then on the repository page **Add file** → **Upload files**, drag the files in again, **Commit changes**.
